-- Allow authenticated users to update only their own conversation read marker.
-- The existing UPDATE RLS policy restricts the row to auth.uid().
grant update (last_read_at) on public.conversation_members to authenticated;

-- Realtime publication already includes conversation_members; keep this migration
-- safe for projects where it may not have been added yet.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
end
$$;