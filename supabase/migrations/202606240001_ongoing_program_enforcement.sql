create or replace function public.select_participant_program(p_participant_id uuid, p_program_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_participant public.participants; v_program public.programs; v_max integer; v_count integer; v_open timestamptz; v_close timestamptz;
begin
  select * into v_participant from public.participants where id=p_participant_id and is_active and deleted_at is null for update;
  if not found then raise exception 'PARTICIPANT_UNAVAILABLE'; end if;
  select * into v_program from public.programs where id=p_program_id;
  if not found then raise exception 'PROGRAM_NOT_FOUND'; end if;
  if v_program.global_status<>'ongoing' then raise exception 'PROGRAM_NOT_ONGOING'; end if;
  select maximum_programs_per_participant,program_selection_open_at,program_selection_close_at into v_max,v_open,v_close from public.app_settings where id=true;
  if v_open is not null and now()<v_open then raise exception 'SELECTION_NOT_OPEN'; end if;
  if v_close is not null and now()>v_close then raise exception 'SELECTION_CLOSED'; end if;
  if not (v_program.gender_eligibility='general' or v_program.gender_eligibility::text=v_participant.gender::text) or not (v_program.category_eligibility='general' or v_program.category_eligibility::text=v_participant.category::text) then raise exception 'PROGRAM_NOT_ELIGIBLE'; end if;
  select count(*) into v_count from public.participant_programs where participant_id=p_participant_id;
  if v_count>=v_max then raise exception 'PROGRAM_LIMIT_REACHED'; end if;
  insert into public.participant_programs(participant_id,program_id) values(p_participant_id,p_program_id) on conflict do nothing;
end$$;
revoke all on function public.select_participant_program(uuid,uuid) from public,anon,authenticated;
