-- Community text channel messaging and atomic community onboarding.
create table if not exists public.channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint channel_messages_content_length check (char_length(btrim(content)) between 1 and 4000)
);
create index if not exists channel_messages_channel_created_idx on public.channel_messages(channel_id, created_at desc);
create index if not exists channel_messages_sender_idx on public.channel_messages(sender_id, created_at desc);
alter table public.channel_messages enable row level security;
grant select, insert, update, delete on public.channel_messages to authenticated;

drop policy if exists "Members can read accessible channel messages" on public.channel_messages;
create policy "Members can read accessible channel messages" on public.channel_messages for select to authenticated using (private.can_view_channel(channel_id));
drop policy if exists "Members can send accessible channel messages" on public.channel_messages;
create policy "Members can send accessible channel messages" on public.channel_messages for insert to authenticated with check (sender_id = (select auth.uid()) and private.can_view_channel(channel_id));
drop policy if exists "Authors can edit their channel messages" on public.channel_messages;
create policy "Authors can edit their channel messages" on public.channel_messages for update to authenticated using (sender_id = (select auth.uid()) and private.can_view_channel(channel_id)) with check (sender_id = (select auth.uid()) and private.can_view_channel(channel_id));
drop policy if exists "Authors and community owners can delete channel messages" on public.channel_messages;
create policy "Authors and community owners can delete channel messages" on public.channel_messages for delete to authenticated using (
  sender_id = (select auth.uid()) or exists (select 1 from public.channels ch where ch.id = channel_messages.channel_id and private.is_community_owner(ch.community_id))
);

create or replace function public.create_community(requested_name text, requested_description text default null, requested_visibility text default 'public')
returns uuid language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); new_community uuid; default_category uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if requested_name is null or char_length(btrim(requested_name)) < 2 or char_length(btrim(requested_name)) > 80 then raise exception 'Community name must be 2 to 80 characters'; end if;
  if requested_description is not null and char_length(requested_description) > 1000 then raise exception 'Description must be 1000 characters or fewer'; end if;
  if requested_visibility not in ('public','private','approval','invite_only','hidden') then raise exception 'Invalid community visibility'; end if;
  insert into public.communities(owner_id,name,description,visibility) values(actor,btrim(requested_name),nullif(btrim(coalesce(requested_description,'')),''),requested_visibility) returning id into new_community;
  insert into public.community_members(community_id,user_id,member_state) values(new_community,actor,'active');
  insert into public.community_settings(community_id) values(new_community);
  insert into public.roles(community_id,name,position,is_default,is_managed) values(new_community,'Member',0,true,false);
  insert into public.channel_categories(community_id,name,position) values(new_community,'GENERAL',0) returning id into default_category;
  insert into public.channels(community_id,category_id,name,description,channel_type,position) values(new_community,default_category,'general','Start the conversation here.','text',0);
  return new_community;
end;
$$;
revoke all on function public.create_community(text,text,text) from public, anon;
grant execute on function public.create_community(text,text,text) to authenticated;

create or replace function public.join_community(target_community uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); visibility_value text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select c.visibility into visibility_value from public.communities c where c.id=target_community for update;
  if not found then raise exception 'Community not found'; end if;
  if visibility_value <> 'public' then raise exception 'This community requires an invite or approval'; end if;
  insert into public.community_members(community_id,user_id,member_state) values(target_community,actor,'active') on conflict (community_id,user_id) do nothing;
  return true;
end;
$$;
revoke all on function public.join_community(uuid) from public, anon;
grant execute on function public.join_community(uuid) to authenticated;

create or replace function public.redeem_community_invite(requested_token_hash text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare actor uuid := auth.uid(); invite_row public.community_invites%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if requested_token_hash is null or char_length(requested_token_hash) <> 64 then raise exception 'Invalid invite link'; end if;
  select * into invite_row from public.community_invites ci where ci.token_hash=requested_token_hash for update;
  if not found or invite_row.revoked_at is not null then raise exception 'This invite is invalid or has expired'; end if;
  if invite_row.expires_at is not null and invite_row.expires_at <= now() then raise exception 'This invite has expired'; end if;
  if invite_row.max_uses is not null and invite_row.use_count >= invite_row.max_uses then raise exception 'This invite has reached its use limit'; end if;
  insert into public.community_members(community_id,user_id,member_state) values(invite_row.community_id,actor,'active') on conflict (community_id,user_id) do nothing;
  update public.community_invites set use_count=use_count+1 where id=invite_row.id;
  return invite_row.community_id;
end;
$$;
revoke all on function public.redeem_community_invite(text) from public, anon;
grant execute on function public.redeem_community_invite(text) to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='channel_messages') then
    alter publication supabase_realtime add table public.channel_messages;
  end if;
end $$;
