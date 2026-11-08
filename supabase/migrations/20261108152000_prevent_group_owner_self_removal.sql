drop policy if exists "Users can leave conversations" on public.conversation_members;

create policy "Users can leave conversations"
on public.conversation_members
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_members.conversation_id
      and (
        c.conversation_type <> 'group'
        or c.created_by <> (select auth.uid())
      )
  )
);