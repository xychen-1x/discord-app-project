drop policy if exists "Conversation members can read private chat presence" on realtime.messages;
drop policy if exists "Conversation members can publish private chat presence" on realtime.messages;

create policy "Conversation members can read private chat presence"
on realtime.messages
for select
to authenticated
using (
  extension = 'presence'
  and exists (
    select 1
    from public.conversation_members cm
    where cm.user_id = (select auth.uid())
      and cm.conversation_id = case
        when (select realtime.topic()) ~* '^orbit-chat:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then split_part((select realtime.topic()), ':', 2)::uuid
        else null
      end
  )
);

create policy "Conversation members can publish private chat presence"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'presence'
  and exists (
    select 1
    from public.conversation_members cm
    where cm.user_id = (select auth.uid())
      and cm.conversation_id = case
        when (select realtime.topic()) ~* '^orbit-chat:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then split_part((select realtime.topic()), ':', 2)::uuid
        else null
      end
  )
);