-- Conversation membership is private to signed-in members.
-- Membership creation is handled by trusted RPCs; clients may only read,
-- leave (DELETE own row under RLS), and update their own read marker.
revoke all privileges on table public.conversation_members from anon;
revoke update (last_read_at) on table public.conversation_members from anon, public;

grant select, delete on table public.conversation_members to authenticated;
grant update (last_read_at) on table public.conversation_members to authenticated;