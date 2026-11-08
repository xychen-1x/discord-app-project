-- Enforce direct-message block checks even when the other user's block row
-- is hidden by the caller's row-level security policy.
create or replace function private.is_blocked_between(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blocked_users b
    where (b.blocker_id = first_user and b.blocked_id = second_user)
       or (b.blocker_id = second_user and b.blocked_id = first_user)
  );
$$;
revoke all on function private.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;

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
      where c.id = messages.conversation_id
        and c.conversation_type = 'direct'
        and cm.user_id <> (select auth.uid())
        and private.is_blocked_between((select auth.uid()), cm.user_id)
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
      where c.id = messages.conversation_id
        and c.conversation_type = 'direct'
        and cm.user_id <> (select auth.uid())
        and private.is_blocked_between((select auth.uid()), cm.user_id)
    )
  )
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
  );
