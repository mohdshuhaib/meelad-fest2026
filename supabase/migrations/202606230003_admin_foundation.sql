create index if not exists participants_registered_at_idx on public.participants(registered_at desc);
create index if not exists participants_name_search_idx on public.participants using gin(to_tsvector('simple',name));
create index if not exists programs_name_search_idx on public.programs using gin(to_tsvector('simple',name||' '||code));
create index if not exists participant_programs_verification_idx on public.participant_programs(verification_status,claimed_submitted_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create policy profiles_admin_insert on public.profiles for insert to authenticated with check(public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy groups_admin_manage on public.groups for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy participants_admin_delete on public.participants for delete to authenticated using(public.is_admin());
create policy selections_staff_verify on public.participant_programs for update to authenticated
using(exists(select 1 from public.participants p where p.id=participant_id and (public.is_admin() or public.is_assigned_coordinator(p))))
with check(exists(select 1 from public.participants p where p.id=participant_id and (public.is_admin() or public.is_assigned_coordinator(p))));
create policy audit_staff_insert on public.audit_logs for insert to authenticated with check(actor_user_id=auth.uid());
create policy export_admin_read on public.export_logs for select to authenticated using(public.is_admin());
