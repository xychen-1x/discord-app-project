-- Orbit messaging core schema and security controls.
create index if not exists messages_content_search_idx
  on public.messages using gin (to_tsvector('simple', coalesce(content, '')));
create index if not exists conversation_members_conversation_user_idx
  on public.conversation_members (conversation_id, user_id);

create table if not exists public.conversation_pins (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null,
  pinned_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversation_pins_message_conversation_fk
    foreign key (message_id, conversation_id)
    references public.messages(id, conversation_id) on delete cascade,
  constraint conversation_pins_unique unique (conversation_id, message_id)
);
alter table public.conversation_pins enable row level security;
grant select, insert, delete on public.conversation_pins to authenticated;

drop policy if exists "Members can view conversation pins" on public.conversation_pins;
create policy "Members can view conversation pins"
  on public.conversation_pins for select to authenticated
  using (private.is_conversation_member(conversation_id));
drop policy if exists "Members can pin messages as themselves" on public.conversation_pins;
create policy "Members can pin messages as themselves"
  on public.conversation_pins for insert to authenticated
  with check (pinned_by = (select auth.uid()) and private.is_conversation_member(conversation_id));
drop policy if exists "Pinners and group creators can remove pins" on public.conversation_pins;
create policy "Pinners and group creators can remove pins"
  on public.conversation_pins for delete to authenticated
  using (
    pinned_by = (select auth.uid())
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_pins.conversation_id
        and c.created_by = (select auth.uid())
        and c.conversation_type = 'group'
    )
  );
create index if not exists conversation_pins_conversation_created_idx
  on public.conversation_pins (conversation_id, created_at desc);

drop policy if exists "Users can update their own conversation read state" on public.conversation_members;
create policy "Users can update their own conversation read state"
  on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke update on public.conversation_members from authenticated;
grant update (last_read_at, is_muted) on public.conversation_members to authenticated;

revoke insert on public.conversations from authenticated;
revoke insert on public.conversation_members from authenticated;
revoke update on public.conversations from authenticated;
grant update (title) on public.conversations to authenticated;

revoke update on public.messages from authenticated;
grant update (content, edited_at, deleted_at) on public.messages to authenticated;

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
    and not exists (
      select 1
      from public.conversations c
      join public.conversation_members cm on cm.conversation_id = c.id
      join public.blocked_users b on (
        (b.blocker_id = (select auth.uid()) and b.blocked_id = cm.user_id)
        or (b.blocker_id = cm.user_id and b.blocked_id = (select auth.uid()))
      )
      where c.id = messages.conversation_id
        and c.conversation_type = 'direct'
        and cm.user_id <> (select auth.uid())
    )
  );

drop policy if exists "Senders can edit their messages" on public.messages;
create policy "Senders can edit their messages"
  on public.messages for update to authenticated
  using (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
    and not exists (
      select 1
      from public.conversations c
      join public.conversation_members cm on cm.conversation_id = c.id
      join public.blocked_users b on (
        (b.blocker_id = (select auth.uid()) and b.blocked_id = cm.user_id)
        or (b.blocker_id = cm.user_id and b.blocked_id = (select auth.uid()))
      )
      where c.id = messages.conversation_id
        and c.conversation_type = 'direct'
        and cm.user_id <> (select auth.uid())
    )
  )
  with check (sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id));

create or replace function public.create_or_get_direct_conversation(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if target_user is null or target_user = actor then raise exception 'Choose another Orbit user'; end if;
  if not exists (select 1 from public.profiles p where p.id = target_user) then raise exception 'User not found'; end if;
  if not exists (
    select 1 from public.friendships f
    where f.user_low_id = least(actor, target_user) and f.user_high_id = greatest(actor, target_user)
  ) then raise exception 'You can only start a direct message with a friend'; end if;
  if exists (
    select 1 from public.blocked_users b
    where (b.blocker_id = actor and b.blocked_id = target_user)
       or (b.blocker_id = target_user and b.blocked_id = actor)
  ) then raise exception 'This conversation is unavailable'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(least(actor::text, target_user::text) || ':' || greatest(actor::text, target_user::text), 0)
  );

  select c.id into existing_id
  from public.conversations c
  where c.conversation_type = 'direct'
    and exists (select 1 from public.conversation_members cm where cm.conversation_id = c.id and cm.user_id = actor)
    and exists (select 1 from public.conversation_members cm where cm.conversation_id = c.id and cm.user_id = target_user)
    and (select count(*) from public.conversation_members cm where cm.conversation_id = c.id) = 2
  order by c.created_at
  limit 1;
  if existing_id is not null then return existing_id; end if;

  insert into public.conversations (conversation_type, created_by)
  values ('direct', actor) returning id into new_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (new_id, actor), (new_id, target_user);
  return new_id;
end;
$$;
revoke all on function public.create_or_get_direct_conversation(uuid) from public, anon;
grant execute on function public.create_or_get_direct_conversation(uuid) to authenticated;

create or replace function public.create_group_conversation(requested_title text, requested_member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_id uuid;
  member_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if requested_title is null or char_length(btrim(requested_title)) < 1 or char_length(btrim(requested_title)) > 80 then
    raise exception 'Group name must be 1 to 80 characters';
  end if;
  member_count := coalesce(cardinality(requested_member_ids), 0);
  if member_count < 1 or member_count > 19 then raise exception 'Choose between 1 and 19 friends for the group'; end if;
  if exists (select 1 from unnest(requested_member_ids) as x(user_id) where x.user_id is null or x.user_id = actor)
     or (select count(distinct x.user_id) from unnest(requested_member_ids) as x(user_id)) <> member_count then
    raise exception 'Group members must be unique friends';
  end if;
  if (select count(*) from public.profiles p where p.id = any(requested_member_ids)) <> member_count then
    raise exception 'One or more selected users could not be found';
  end if;
  if exists (
    select 1 from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1 from public.friendships f
      where f.user_low_id = least(actor, x.user_id) and f.user_high_id = greatest(actor, x.user_id)
    )
    or exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = actor and b.blocked_id = x.user_id)
         or (b.blocker_id = x.user_id and b.blocked_id = actor)
    )
  ) then raise exception 'Groups can include only friends who are not blocked'; end if;

  insert into public.conversations (conversation_type, title, created_by)
  values ('group', btrim(requested_title), actor) returning id into new_id;
  insert into public.conversation_members (conversation_id, user_id) values (new_id, actor);
  insert into public.conversation_members (conversation_id, user_id)
  select new_id, x.user_id from unnest(requested_member_ids) as x(user_id);

  insert into public.notifications (user_id, category, title, body, data)
  select cm.user_id, 'dm', 'Added to a group', 'You were added to ' || btrim(requested_title) || '.',
         jsonb_build_object('type', 'group_added', 'conversation_id', new_id)
  from public.conversation_members cm
  left join public.notification_settings ns on ns.user_id = cm.user_id
  where cm.conversation_id = new_id and cm.user_id <> actor and coalesce(ns.dm_enabled, true);
  return new_id;
end;
$$;
revoke all on function public.create_group_conversation(text, uuid[]) from public, anon;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;

create or replace function public.add_group_conversation_members(target_conversation uuid, requested_member_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  added_count integer;
  requested_count integer := coalesce(cardinality(requested_member_ids), 0);
  current_count integer;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if requested_count < 1 or requested_count > 19 then raise exception 'Choose at least one friend'; end if;
  if not exists (
    select 1 from public.conversations c
    where c.id = target_conversation and c.conversation_type = 'group' and c.created_by = actor
  ) then raise exception 'Only the group creator can add members'; end if;
  if exists (select 1 from unnest(requested_member_ids) as x(user_id) where x.user_id is null or x.user_id = actor)
     or (select count(distinct x.user_id) from unnest(requested_member_ids) as x(user_id)) <> requested_count then
    raise exception 'Group members must be unique';
  end if;
  if exists (
    select 1 from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1 from public.friendships f
      where f.user_low_id = least(actor, x.user_id) and f.user_high_id = greatest(actor, x.user_id)
    )
    or exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = actor and b.blocked_id = x.user_id)
         or (b.blocker_id = x.user_id and b.blocked_id = actor)
    )
  ) then raise exception 'Only friends who are not blocked can be added'; end if;

  select count(*) into current_count from public.conversation_members cm where cm.conversation_id = target_conversation;
  if current_count + (
    select count(*) from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = target_conversation and cm.user_id = x.user_id
    )
  ) > 20 then raise exception 'A group can have up to 20 members'; end if;

  insert into public.conversation_members (conversation_id, user_id)
  select target_conversation, x.user_id
  from unnest(requested_member_ids) as x(user_id)
  where not exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = target_conversation and cm.user_id = x.user_id
  );
  get diagnostics added_count = row_count;

  insert into public.notifications (user_id, category, title, body, data)
  select cm.user_id, 'dm', 'Added to a group', 'You were added to ' || c.title || '.',
         jsonb_build_object('type', 'group_added', 'conversation_id', target_conversation)
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join public.notification_settings ns on ns.user_id = cm.user_id
  where cm.conversation_id = target_conversation
    and cm.user_id = any(requested_member_ids) and coalesce(ns.dm_enabled, true);
  return added_count;
end;
$$;
revoke all on function public.add_group_conversation_members(uuid, uuid[]) from public, anon;
grant execute on function public.add_group_conversation_members(uuid, uuid[]) to authenticated;

drop policy if exists "Orbit conversation members can receive private chat state" on realtime.messages;
create policy "Orbit conversation members can receive private chat state"
  on realtime.messages for select to authenticated
  using (
    extension in ('broadcast', 'presence')
    and split_part((select realtime.topic()), ':', 1) = 'orbit-chat'
    and exists (
      select 1 from public.conversation_members cm
      where cm.user_id = (select auth.uid())
        and cm.conversation_id = case
          when split_part((select realtime.topic()), ':', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then split_part((select realtime.topic()), ':', 2)::uuid else null end
    )
  );
drop policy if exists "Orbit conversation members can send private chat state" on realtime.messages;
create policy "Orbit conversation members can send private chat state"
  on realtime.messages for insert to authenticated
  with check (
    extension in ('broadcast', 'presence')
    and split_part((select realtime.topic()), ':', 1) = 'orbit-chat'
    and exists (
      select 1 from public.conversation_members cm
      where cm.user_id = (select auth.uid())
        and cm.conversation_id = case
          when split_part((select realtime.topic()), ':', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then split_part((select realtime.topic()), ':', 2)::uuid else null end
    )
  );

create or replace function public.handle_new_conversation_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_label text;
  preview_text text;
begin
  update public.conversations
  set last_message_at = new.created_at, updated_at = new.created_at
  where id = new.conversation_id;
  select coalesce(p.display_name, p.username, 'Someone') into sender_label
  from public.profiles p where p.id = new.sender_id;
  preview_text := case
    when new.message_type = 'image' then 'Sent an image'
    when new.message_type = 'file' then 'Sent an attachment'
    else left(coalesce(new.content, ''), 140)
  end;
  insert into public.notifications (user_id, category, title, body, data)
  select cm.user_id,
    'dm',
    case when c.conversation_type = 'group' then sender_label || ' · ' || coalesce(c.title, 'Group')
         else sender_label || ' sent you a message' end,
    preview_text,
    jsonb_build_object('type', 'new_message', 'conversation_id', new.conversation_id,
      'message_id', new.id, 'sender_id', new.sender_id)
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join public.notification_settings ns on ns.user_id = cm.user_id
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id
    and not cm.is_muted
    and coalesce(ns.dm_enabled, true)
    and (c.conversation_type = 'group' or not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = cm.user_id and b.blocked_id = new.sender_id)
         or (b.blocker_id = new.sender_id and b.blocked_id = cm.user_id)
    ));
  return new;
end;
$$;
drop trigger if exists on_conversation_message_created on public.messages;
create trigger on_conversation_message_created
  after insert on public.messages for each row
  execute function public.handle_new_conversation_message();

do $$
declare target_table text;
begin
  foreach target_table in array array['conversation_members','message_attachments','message_bookmarks','conversation_pins']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    end if;
  end loop;
end;
$$;
