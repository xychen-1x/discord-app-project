-- Orbit Friends System security hardening + profile bio consistency
-- The client may read friend relations, but friend/block mutations must use validated RPCs.

drop policy if exists "Users can send friend requests as themselves" on public.friend_requests;
drop policy if exists "Request participants can update requests" on public.friend_requests;

revoke all privileges on table public.friend_requests from anon;
revoke insert, update, delete, truncate, references, trigger on table public.friend_requests from authenticated;
grant select on table public.friend_requests to authenticated;

revoke all privileges on table public.friendships from anon;
revoke insert, update, delete, truncate, references, trigger on table public.friendships from authenticated;
grant select on table public.friendships to authenticated;

revoke all privileges on table public.blocked_users from anon;
revoke insert, update, delete, truncate, references, trigger on table public.blocked_users from authenticated;
grant select on table public.blocked_users to authenticated;

-- Event trigger functions are invoked by PostgreSQL itself; they should not be callable through the public API.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Match the profile editor's 190-character bio limit.
alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length
  check (bio is null or char_length(bio) <= 190);

-- Enable database-change events for friend requests, friendships, user presence, and blocks.
alter publication supabase_realtime add table public.friend_requests, public.friendships, public.user_status, public.blocked_users;
