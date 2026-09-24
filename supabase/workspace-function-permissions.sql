revoke all on function public.kova_role(uuid), public.kova_create_space(text,text), public.kova_accept_invites(), public.kova_change_member(uuid,uuid,text), public.kova_reserve_ai() from anon;
create policy ai_usage_no_direct_access on public.kova_ai_usage for all to authenticated using(false) with check(false);
drop policy records_delete on public.kova_records;
create policy records_delete on public.kova_records for delete to authenticated using (public.kova_role(space_id) in ('Owner','Admin') and kind<>'credit');
