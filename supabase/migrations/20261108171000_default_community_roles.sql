-- Assign the default member role whenever a community membership is created.
create or replace function private.assign_default_community_role()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare default_role_id uuid;
begin
  select r.id into default_role_id from public.roles r where r.community_id=new.community_id and r.is_default order by r.position limit 1;
  if default_role_id is not null then
    insert into public.member_roles(community_id,user_id,role_id,assigned_by)
    values(new.community_id,new.user_id,default_role_id,coalesce((select auth.uid()),new.user_id))
    on conflict(community_id,user_id,role_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.assign_default_community_role() from public, anon, authenticated;
drop trigger if exists assign_default_community_role_after_join on public.community_members;
create trigger assign_default_community_role_after_join after insert on public.community_members for each row execute function private.assign_default_community_role();

create or replace function public.create_community(requested_name text, requested_description text default null, requested_visibility text default 'public')
returns uuid language plpgsql security definer set search_path = ''
as $$
declare actor uuid:=auth.uid(); new_community uuid; default_role uuid; default_category uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if requested_name is null or char_length(btrim(requested_name))<2 or char_length(btrim(requested_name))>80 then raise exception 'Community name must be 2 to 80 characters'; end if;
  if requested_description is not null and char_length(requested_description)>1000 then raise exception 'Description must be 1000 characters or fewer'; end if;
  if requested_visibility not in ('public','private','approval','invite_only','hidden') then raise exception 'Invalid community visibility'; end if;
  insert into public.communities(owner_id,name,description,visibility) values(actor,btrim(requested_name),nullif(btrim(coalesce(requested_description,'')),''),requested_visibility) returning id into new_community;
  insert into public.community_settings(community_id) values(new_community);
  insert into public.roles(community_id,name,position,is_default,is_managed) values(new_community,'Member',0,true,false) returning id into default_role;
  insert into public.role_permissions(role_id,permission_key,is_allowed) values(default_role,'view_community',true),(default_role,'send_messages',true);
  insert into public.community_members(community_id,user_id,member_state) values(new_community,actor,'active');
  insert into public.channel_categories(community_id,name,position) values(new_community,'GENERAL',0) returning id into default_category;
  insert into public.channels(community_id,category_id,name,description,channel_type,position) values(new_community,default_category,'general','Start the conversation here.','text',0);
  return new_community;
end;
$$;
revoke all on function public.create_community(text,text,text) from public, anon;
grant execute on function public.create_community(text,text,text) to authenticated;

insert into public.role_permissions(role_id,permission_key,is_allowed)
select r.id,p.permission_key,true from public.roles r cross join (values ('view_community'),('send_messages')) p(permission_key)
where r.is_default on conflict(role_id,permission_key) do nothing;
insert into public.member_roles(community_id,user_id,role_id,assigned_by)
select cm.community_id,cm.user_id,r.id,cm.user_id from public.community_members cm join public.roles r on r.community_id=cm.community_id and r.is_default
on conflict(community_id,user_id,role_id) do nothing;
