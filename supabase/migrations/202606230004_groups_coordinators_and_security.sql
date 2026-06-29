create function public.assign_participant_groups(p_assignments jsonb, p_actor uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare item jsonb; affected integer:=0; old_row public.participants; target_group public.groups;
begin
  for item in select * from jsonb_array_elements(p_assignments) loop
    select * into old_row from public.participants where id=(item->>'participant_id')::uuid and is_active and deleted_at is null for update;
    if not found then raise exception 'PARTICIPANT_NOT_FOUND'; end if;
    select * into target_group from public.groups where id=(item->>'group_id')::uuid and is_active;
    if not found then raise exception 'GROUP_NOT_FOUND'; end if;
    update public.participants set group_id=target_group.id,coordinator_id=target_group.primary_coordinator_id where id=old_row.id;
    insert into public.audit_logs(actor_user_id,actor_role,action,entity_type,entity_id,old_data,new_data)
    values(p_actor,'admin','participant.group_assigned','participant',old_row.id::text,jsonb_build_object('group_id',old_row.group_id,'coordinator_id',old_row.coordinator_id),jsonb_build_object('group_id',target_group.id,'coordinator_id',target_group.primary_coordinator_id));
    affected:=affected+1;
  end loop;
  return affected;
end$$;

create function public.set_group_coordinator(p_group_id uuid,p_profile_id uuid,p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
declare old_group public.groups;
begin
  select * into old_group from public.groups where id=p_group_id for update;
  if not found then raise exception 'GROUP_NOT_FOUND'; end if;
  if p_profile_id is not null and not exists(select 1 from public.profiles where id=p_profile_id and role='coordinator' and is_active) then raise exception 'COORDINATOR_NOT_FOUND'; end if;
  if p_profile_id is not null and exists(select 1 from public.groups where primary_coordinator_id=p_profile_id and id<>p_group_id and is_active) then raise exception 'COORDINATOR_ALREADY_ASSIGNED'; end if;
  update public.groups set primary_coordinator_id=p_profile_id where id=p_group_id;
  update public.participants set coordinator_id=p_profile_id where group_id=p_group_id and is_active;
  insert into public.audit_logs(actor_user_id,actor_role,action,entity_type,entity_id,old_data,new_data) values(p_actor,'admin','group.coordinator_changed','group',p_group_id::text,jsonb_build_object('primary_coordinator_id',old_group.primary_coordinator_id),jsonb_build_object('primary_coordinator_id',p_profile_id));
end$$;

create function public.reset_participant_access(p_participant_id uuid,p_hash text,p_reset_by uuid,p_reason text,p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if length(trim(p_reason))<5 then raise exception 'REASON_REQUIRED'; end if;
  update public.participants set access_code_hash=p_hash where id=p_participant_id and is_active and deleted_at is null;
  if not found then raise exception 'PARTICIPANT_NOT_FOUND'; end if;
  update public.participant_sessions set revoked_at=now() where participant_id=p_participant_id and revoked_at is null;
  insert into public.access_code_resets(participant_id,reset_by,reason) values(p_participant_id,p_reset_by,p_reason);
  insert into public.audit_logs(actor_user_id,actor_role,action,entity_type,entity_id,new_data) values(p_actor,'admin','participant.access_code_reset','participant',p_participant_id::text,jsonb_build_object('reason',p_reason));
end$$;

revoke all on function public.assign_participant_groups(jsonb,uuid) from public,anon,authenticated;
revoke all on function public.set_group_coordinator(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.reset_participant_access(uuid,text,uuid,text,uuid) from public,anon,authenticated;
