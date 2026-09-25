-- Standalone disposable PostgreSQL database only. psql -v ON_ERROR_STOP=1 -f this-file
begin;
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated;
create table public.kova_spaces(id uuid primary key);
create table public.kova_members(space_id uuid, user_id uuid, role text);
create table public.kova_records(id uuid primary key,space_id uuid,kind text);
create function public.kova_role(sid uuid) returns text language sql stable security definer set search_path='' as $$ select role from public.kova_members where space_id=sid and user_id=auth.uid() $$;
grant select on public.kova_records to authenticated;
insert into auth.users values ('00000000-0000-4000-8000-000000000001');
insert into public.kova_spaces values ('00000000-0000-4000-8000-000000000010'),('00000000-0000-4000-8000-000000000020');
insert into public.kova_members values ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','Developer');
insert into public.kova_records values ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000020','project');
\ir memory.sql
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.kova_memory(id,space_id,title,content,source) values ('00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000010','Lesson','Visible labels','Review');
do $$ begin
 begin
  update public.kova_memory set status='approved',version=2;
  raise exception 'TEST FAILED: Developer approval allowed';
 exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
 begin
  insert into public.kova_memory(space_id,project_id,title,content,source) values ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000030','Wrong scope','a','b');
  raise exception 'TEST FAILED: Cross-workspace project allowed';
 exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
 begin
  insert into public.kova_memory(space_id,title,content,source) values ('00000000-0000-4000-8000-000000000020','Wrong workspace','a','b');
  raise exception 'TEST FAILED: Cross-workspace insert allowed';
 exception when others then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
end $$;
reset role;
update public.kova_members set role='PM';
set role authenticated;
update public.kova_memory set status='approved',version=2;
do $$ begin
 if not exists(select 1 from public.kova_memory where status='approved' and approved_by=auth.uid() and jsonb_array_length(history)=1) then raise exception 'TEST FAILED: Approval audit missing'; end if;
 begin
  update public.kova_memory set version=2,content='stale write';
  raise exception 'TEST FAILED: Stale version accepted';
 exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
end $$;
reset role;
update public.kova_members set role='Developer';
set role authenticated;
update public.kova_memory set content='Updated lesson',version=3,history='[]';
do $$ begin
 if not exists(select 1 from public.kova_memory where status='proposed' and approved_by is null and jsonb_array_length(history)=2) then raise exception 'TEST FAILED: Edit retained approval or lost history'; end if;
end $$;
reset role;
update public.kova_members set role='Viewer';
set role authenticated;
do $$ declare affected int; begin
 update public.kova_memory set content='Viewer write',version=4;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'TEST FAILED: Viewer update allowed'; end if;
 begin
  insert into public.kova_memory(space_id,title,content,source) values ('00000000-0000-4000-8000-000000000010','Viewer','a','b');
  raise exception 'TEST FAILED: Viewer insert allowed';
 exception when others then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
end $$;
reset role;
update public.kova_members set role='PM';
set role authenticated;
update public.kova_memory set stale=true,version=4;
do $$ begin
 begin
  update public.kova_memory set status='approved',version=5;
  raise exception 'TEST FAILED: Stale approval allowed';
 exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
end $$;
update public.kova_memory set deleted_at=now(),version=5;
do $$ begin
 if not exists(select 1 from public.kova_memory where deleted_at is not null and status='revoked' and jsonb_array_length(history)=4) then raise exception 'TEST FAILED: Soft deletion audit missing'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',false);
do $$ begin
 if exists(select 1 from public.kova_memory) then raise exception 'TEST FAILED: Non-member read allowed'; end if;
end $$;
reset role;
rollback;
