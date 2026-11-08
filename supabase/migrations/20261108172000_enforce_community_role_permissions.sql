-- Enforce community role permissions through RLS.
drop policy if exists "Owners can update their communities" on public.communities;
create policy "Owners and managers can update communities" on public.communities for update to authenticated
using (owner_id=(select auth.uid()) or private.has_community_permission(id,'manage_community'))
with check (owner_id=(select auth.uid()) or private.has_community_permission(id,'manage_community'));

drop policy if exists "Owners can create channel categories" on public.channel_categories;
create policy "Members with channel management permission can create categories" on public.channel_categories for insert to authenticated with check (private.has_community_permission(community_id,'manage_channels'));
drop policy if exists "Owners can update channel categories" on public.channel_categories;
create policy "Members with channel management permission can update categories" on public.channel_categories for update to authenticated using (private.has_community_permission(community_id,'manage_channels')) with check (private.has_community_permission(community_id,'manage_channels'));
drop policy if exists "Owners can delete channel categories" on public.channel_categories;
create policy "Members with channel management permission can delete categories" on public.channel_categories for delete to authenticated using (private.has_community_permission(community_id,'manage_channels'));

drop policy if exists "Owners can create channels" on public.channels;
create policy "Members with channel management permission can create channels" on public.channels for insert to authenticated with check (private.has_community_permission(community_id,'manage_channels'));
drop policy if exists "Owners can update channels" on public.channels;
create policy "Members with channel management permission can update channels" on public.channels for update to authenticated using (private.has_community_permission(community_id,'manage_channels')) with check (private.has_community_permission(community_id,'manage_channels'));
drop policy if exists "Owners can delete channels" on public.channels;
create policy "Members with channel management permission can delete channels" on public.channels for delete to authenticated using (private.has_community_permission(community_id,'manage_channels'));

drop policy if exists "Owners can manage invites" on public.community_invites;
create policy "Members with invite permission can manage invites" on public.community_invites for all to authenticated
using (private.has_community_permission(community_id,'create_invites'))
with check (private.has_community_permission(community_id,'create_invites') and created_by=(select auth.uid()));

drop policy if exists "Community owners can manage private channel access" on public.channel_members;
create policy "Members with channel management permission can manage private access" on public.channel_members for insert to authenticated
with check (exists(select 1 from public.channels ch where ch.id=channel_members.channel_id and private.has_community_permission(ch.community_id,'manage_channels')));
drop policy if exists "Community owners can remove private channel access" on public.channel_members;
create policy "Members with channel management permission can remove private access" on public.channel_members for delete to authenticated
using (exists(select 1 from public.channels ch where ch.id=channel_members.channel_id and private.has_community_permission(ch.community_id,'manage_channels')));

drop policy if exists "Community owners can create roles" on public.roles;
create policy "Members with role management permission can create roles" on public.roles for insert to authenticated with check (private.has_community_permission(community_id,'manage_roles'));
drop policy if exists "Community owners can update roles" on public.roles;
create policy "Members with role management permission can update roles" on public.roles for update to authenticated using (private.has_community_permission(community_id,'manage_roles')) with check (private.has_community_permission(community_id,'manage_roles'));
drop policy if exists "Community owners can delete non-managed roles" on public.roles;
create policy "Members with role management permission can delete non-managed roles" on public.roles for delete to authenticated using (private.has_community_permission(community_id,'manage_roles') and not is_managed and not is_default);

drop policy if exists "Community owners can add role permissions" on public.role_permissions;
create policy "Members with role management permission can add role permissions" on public.role_permissions for insert to authenticated with check (exists(select 1 from public.roles r where r.id=role_permissions.role_id and private.has_community_permission(r.community_id,'manage_roles')));
drop policy if exists "Community owners can update role permissions" on public.role_permissions;
create policy "Members with role management permission can update role permissions" on public.role_permissions for update to authenticated using (exists(select 1 from public.roles r where r.id=role_permissions.role_id and private.has_community_permission(r.community_id,'manage_roles'))) with check (exists(select 1 from public.roles r where r.id=role_permissions.role_id and private.has_community_permission(r.community_id,'manage_roles')));
drop policy if exists "Community owners can delete role permissions" on public.role_permissions;
create policy "Members with role management permission can delete role permissions" on public.role_permissions for delete to authenticated using (exists(select 1 from public.roles r where r.id=role_permissions.role_id and private.has_community_permission(r.community_id,'manage_roles')));

drop policy if exists "Community owners can assign roles" on public.member_roles;
create policy "Members with assignment permission can assign roles" on public.member_roles for insert to authenticated with check (assigned_by=(select auth.uid()) and private.has_community_permission(community_id,'assign_roles'));
drop policy if exists "Community owners can remove role assignments" on public.member_roles;
create policy "Members with assignment permission can remove role assignments" on public.member_roles for delete to authenticated using (private.has_community_permission(community_id,'assign_roles'));

drop policy if exists "Members can send accessible channel messages" on public.channel_messages;
create policy "Members with send permission can send channel messages" on public.channel_messages for insert to authenticated
with check (sender_id=(select auth.uid()) and private.can_view_channel(channel_id) and exists(select 1 from public.channels ch where ch.id=channel_messages.channel_id and private.has_community_permission(ch.community_id,'send_messages')));
drop policy if exists "Authors can edit their channel messages" on public.channel_messages;
create policy "Authors with send permission can edit channel messages" on public.channel_messages for update to authenticated
using (sender_id=(select auth.uid()) and private.can_view_channel(channel_id) and exists(select 1 from public.channels ch where ch.id=channel_messages.channel_id and private.has_community_permission(ch.community_id,'send_messages')))
with check (sender_id=(select auth.uid()) and private.can_view_channel(channel_id) and exists(select 1 from public.channels ch where ch.id=channel_messages.channel_id and private.has_community_permission(ch.community_id,'send_messages')));
drop policy if exists "Authors and community owners can delete channel messages" on public.channel_messages;
create policy "Authors and moderators can delete channel messages" on public.channel_messages for delete to authenticated
using (private.can_view_channel(channel_id) and (sender_id=(select auth.uid()) or exists(select 1 from public.channels ch where ch.id=channel_messages.channel_id and private.has_community_permission(ch.community_id,'manage_messages'))));

drop policy if exists "Owners can update community settings" on public.community_settings;
create policy "Members with settings permission can update community settings" on public.community_settings for update to authenticated
using (private.has_community_permission(community_id,'manage_settings')) with check (private.has_community_permission(community_id,'manage_settings'));
