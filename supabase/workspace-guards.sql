create unique index demo_credit_idempotency on public.kova_records(space_id,(data->>'source')) where kind='credit';
create or replace function public.kova_guard_record() returns trigger
language plpgsql set search_path='' as $$
declare actor text;
begin
 actor:=public.kova_role(new.space_id);
 if tg_op='UPDATE' then
  if new.space_id<>old.space_id or new.kind<>old.kind or new.id<>old.id then raise exception 'Record identity is immutable'; end if;
  if new.revision<>old.revision+1 then raise exception 'Invalid revision'; end if;
  if new.kind='credit' then raise exception 'Demo transactions are immutable'; end if;
 end if;
 if length(trim(coalesce(new.data->>'title','')))=0 or length(new.data->>'title')>160 then raise exception 'A valid title is required'; end if;
 if new.kind='credit' then
  if (new.data->>'amount')::numeric<>trunc((new.data->>'amount')::numeric) or (new.data->>'amount')::numeric not between 100 and 100000 or new.data->>'amount' is null or nullif(new.data->>'source','') is null or new.data->>'status'<>'Simulated' then raise exception 'Invalid demo transaction'; end if;
 end if;
 if new.kind='project' then
  if tg_op='INSERT' and coalesce(new.data->>'stage','Clarify')<>'Clarify' then raise exception 'New projects begin with clarification'; end if;
  if tg_op='UPDATE' and new.data->>'stage' is distinct from old.data->>'stage' then
   if new.data->>'stage'='TRD' and actor not in ('Owner','Admin','PM') then raise exception 'PM approval required'; end if;
   if new.data->>'stage'='Build' and actor not in ('Owner','Admin','Developer') then raise exception 'Developer approval required'; end if;
  end if;
 end if;
 if new.kind='run' then
  if tg_op='INSERT' and (new.data->>'completed')::int<>2 then raise exception 'Runs start at the PM gate'; end if;
  if tg_op='UPDATE' and new.data->>'completed' is distinct from old.data->>'completed' then
   if old.data->>'status'<>'Awaiting approval' then raise exception 'Run is not awaiting approval'; end if;
   if (old.data->>'completed')::int=2 then
    if actor not in ('Owner','Admin','PM') or (new.data->>'completed')::int<>4 then raise exception 'PM approval required'; end if;
   elsif (old.data->>'completed')::int=4 then
    if actor not in ('Owner','Admin','Developer') or (new.data->>'completed')::int<>9 then raise exception 'Developer approval required'; end if;
   elsif (old.data->>'completed')::int=9 then
    if actor not in ('Owner','Admin') or (new.data->>'completed')::int<>10 then raise exception 'Release approval required'; end if;
   else raise exception 'Invalid transition'; end if;
  end if;
 end if;
 return new;
end $$;
create trigger kova_record_guard before insert or update on public.kova_records for each row execute function public.kova_guard_record();

create table public.kova_ai_usage (
 user_id uuid references auth.users(id), day date not null default current_date,
 requests integer not null default 0, primary key(user_id,day)
);
alter table public.kova_ai_usage enable row level security;
revoke all on public.kova_ai_usage from anon,authenticated;
create or replace function public.kova_reserve_ai() returns boolean
language plpgsql security definer set search_path='' as $$
declare count_now int;
begin
 if auth.uid() is null then return false; end if;
 insert into public.kova_ai_usage(user_id,requests) values(auth.uid(),1)
 on conflict(user_id,day) do update set requests=public.kova_ai_usage.requests+1
 where public.kova_ai_usage.requests<10 returning requests into count_now;
 return count_now is not null;
end $$;
revoke all on function public.kova_reserve_ai() from public;
grant execute on function public.kova_reserve_ai() to authenticated;
