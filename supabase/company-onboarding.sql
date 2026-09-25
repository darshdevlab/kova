create table if not exists public.kova_onboarding_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 space_id uuid not null references public.kova_spaces(id) on delete cascade,
 primary key (user_id,request_id)
);
alter table public.kova_onboarding_requests enable row level security;
revoke all on public.kova_onboarding_requests from public,anon,authenticated;
create or replace function public.kova_create_company_once(request_id uuid, company_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verified account required'; end if;
 if length(trim(company_name)) not between 1 and 80 then raise exception 'Invalid organisation name'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||request_id::text,0));
 select r.space_id into sid from public.kova_onboarding_requests r where r.user_id=auth.uid() and r.request_id=kova_create_company_once.request_id;
 if sid is not null then return sid; end if;
 sid := public.kova_create_space(company_name,'company');
 insert into public.kova_onboarding_requests values(auth.uid(),request_id,sid);
 return sid;
end $$;
revoke all on function public.kova_create_company_once(uuid,text) from public,anon;
grant execute on function public.kova_create_company_once(uuid,text) to authenticated;
