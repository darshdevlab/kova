-- Apply after workspace-platform.sql and workspace-guards.sql.
create table public.kova_memory (
 id uuid primary key default gen_random_uuid(),
 space_id uuid not null references public.kova_spaces(id) on delete cascade,
 project_id uuid references public.kova_records(id) on delete cascade,
 bot_id uuid references public.kova_records(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 160),
 content text not null check (length(trim(content)) between 1 and 3000),
 source text not null check (length(trim(source)) between 1 and 500),
 status text not null default 'proposed' check (status in ('proposed','approved','revoked')),
 version integer not null default 1,
 stale boolean not null default false,
 expires_at timestamptz,
 deleted_at timestamptz,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 history jsonb not null default '[]'::jsonb
);
create index kova_memory_scope on public.kova_memory(space_id,project_id,bot_id,status);
alter table public.kova_memory enable row level security;
revoke all on public.kova_memory from public,anon,authenticated;
grant select,insert,update on public.kova_memory to authenticated;
create policy memory_read on public.kova_memory for select to authenticated using (public.kova_role(space_id) is not null);
create policy memory_insert on public.kova_memory for insert to authenticated with check (public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA'));
create policy memory_update on public.kova_memory for update to authenticated
 using (public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA'))
 with check (public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA'));

create function public.kova_guard_memory() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actor text; changed boolean;
begin
 actor := public.kova_role(new.space_id);
 if auth.uid() is null or actor is null or actor not in ('Owner','Admin','PM','Developer','QA') then raise exception 'Memory editing denied'; end if;
 if new.project_id is not null and not exists(select 1 from public.kova_records where id=new.project_id and space_id=new.space_id and kind='project') then raise exception 'Invalid project scope'; end if;
 if new.bot_id is not null and not exists(select 1 from public.kova_records where id=new.bot_id and space_id=new.space_id and kind='bot') then raise exception 'Invalid Bot scope'; end if;
 if tg_op='INSERT' then
  if new.status<>'proposed' or new.deleted_at is not null then raise exception 'New memory must be proposed'; end if;
  new.version:=1; new.created_by:=auth.uid(); new.created_at:=now(); new.history:='[]'::jsonb;
  new.approved_by:=null; new.approved_at:=null;
 else
  if new.id<>old.id or new.space_id<>old.space_id or new.project_id is distinct from old.project_id or new.bot_id is distinct from old.bot_id then raise exception 'Memory scope is immutable'; end if;
  if old.deleted_at is not null then raise exception 'Memory was deleted'; end if;
  if new.version<>old.version+1 then raise exception 'Memory version conflict'; end if;
  changed := (new.title,new.content,new.source,new.expires_at,new.stale) is distinct from (old.title,old.content,old.source,old.expires_at,old.stale);
  if actor not in ('Owner','Admin','PM') and (new.status is distinct from old.status or new.deleted_at is distinct from old.deleted_at) then raise exception 'Memory approval denied'; end if;
  if changed then
   new.status:='proposed'; new.approved_by:=null; new.approved_at:=null;
  elsif new.status='approved' and old.status<>'approved' then
   if new.stale or new.expires_at<=now() then raise exception 'Stale or expired memory cannot be approved'; end if;
   new.approved_by:=auth.uid(); new.approved_at:=now();
  else
   new.approved_by:=old.approved_by; new.approved_at:=old.approved_at;
  end if;
  if new.deleted_at is not null then new.deleted_at:=now(); new.status:='revoked'; end if;
  new.created_by:=old.created_by; new.created_at:=old.created_at;
  new.history:=old.history || jsonb_build_array(to_jsonb(old)-'history');
 end if;
 new.updated_at:=now();
 return new;
end $$;
revoke all on function public.kova_guard_memory() from public,anon,authenticated;
create trigger memory_guard before insert or update on public.kova_memory for each row execute function public.kova_guard_memory();
