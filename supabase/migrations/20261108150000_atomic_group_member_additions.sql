create or replace function public.add_group_conversation_members(
  target_conversation uuid,
  requested_member_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  actor uuid := auth.uid();
  added_member_ids uuid[] := array[]::uuid[];
  requested_count integer := coalesce(cardinality(requested_member_ids), 0);
  current_count integer;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  if requested_count < 1 or requested_count > 19 then
    raise exception 'Choose at least one friend';
  end if;

  -- Serialize membership additions for this group so concurrent requests
  -- cannot both pass the 20-member capacity check.
  perform 1
  from public.conversations c
  where c.id = target_conversation
    and c.conversation_type = 'group'
    and c.created_by = actor
  for update;

  if not found then
    raise exception 'Only the group creator can add members';
  end if;

  if exists (
    select 1
    from unnest(requested_member_ids) as x(user_id)
    where x.user_id is null or x.user_id = actor
  ) or (
    select count(distinct x.user_id)
    from unnest(requested_member_ids) as x(user_id)
  ) <> requested_count then
    raise exception 'Group members must be unique';
  end if;

  if exists (
    select 1
    from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1
      from public.friendships f
      where f.user_low_id = least(actor, x.user_id)
        and f.user_high_id = greatest(actor, x.user_id)
    )
    or exists (
      select 1
      from public.blocked_users b
      where (b.blocker_id = actor and b.blocked_id = x.user_id)
         or (b.blocker_id = x.user_id and b.blocked_id = actor)
    )
  ) then
    raise exception 'Only friends who are not blocked can be added';
  end if;

  select count(*)
  into current_count
  from public.conversation_members cm
  where cm.conversation_id = target_conversation;

  if current_count + (
    select count(*)
    from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = target_conversation
        and cm.user_id = x.user_id
    )
  ) > 20 then
    raise exception 'A group can have up to 20 members';
  end if;

  with inserted_members as (
    insert into public.conversation_members (conversation_id, user_id)
    select target_conversation, x.user_id
    from unnest(requested_member_ids) as x(user_id)
    where not exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = target_conversation
        and cm.user_id = x.user_id
    )
    returning user_id
  )
  select coalesce(array_agg(user_id), array[]::uuid[])
  into added_member_ids
  from inserted_members;

  if cardinality(added_member_ids) > 0 then
    insert into public.notifications (user_id, category, title, body, data)
    select
      cm.user_id,
      'dm',
      'Added to a group',
      'You were added to ' || c.title || '.',
      jsonb_build_object('type', 'group_added', 'conversation_id', target_conversation)
    from public.conversation_members cm
    join public.conversations c on c.id = cm.conversation_id
    left join public.notification_settings ns on ns.user_id = cm.user_id
    where cm.conversation_id = target_conversation
      and cm.user_id = any(added_member_ids)
      and coalesce(ns.dm_enabled, true);
  end if;

  return cardinality(added_member_ids);
end;
$function$;

revoke all on function public.add_group_conversation_members(uuid, uuid[]) from public, anon;
grant execute on function public.add_group_conversation_members(uuid, uuid[]) to authenticated;