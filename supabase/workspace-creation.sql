-- Serialize personal-space creation across tabs and React initialization retries.
create or replace function public.kova_create_space(space_name text, space_kind text) returns uuid
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verified account required'; end if;
 if space_kind is null or space_kind not in ('personal','company') or length(trim(coalesce(space_name,''))) not between 1 and 80 then raise exception 'Invalid workspace'; end if;
 if space_kind='personal' then
  perform pg_advisory_xact_lock(hashtextextended('personal:'||auth.uid()::text,0));
  select id into sid from public.kova_spaces where owner_id=auth.uid() and kind='personal';
  if sid is not null then return sid; end if;
 end if;
 insert into public.kova_spaces(name,kind,owner_id) values(trim(space_name),space_kind,auth.uid()) returning id into sid;
 insert into public.kova_members values(sid,auth.uid(),'Owner');
 return sid;
end $$;
revoke all on function public.kova_create_space(text,text) from public,anon;
grant execute on function public.kova_create_space(text,text) to authenticated;
