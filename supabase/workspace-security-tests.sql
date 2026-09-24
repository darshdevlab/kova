begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('a1000000-0000-4000-8000-000000000001','kova-owner-test@example.invalid',now()),
 ('a1000000-0000-4000-8000-000000000002','kova-viewer-test@example.invalid',now()),
 ('a1000000-0000-4000-8000-000000000003','kova-outsider-test@example.invalid',now()),
 ('a1000000-0000-4000-8000-000000000004','kova-dev-test@example.invalid',now());
insert into public.kova_spaces(id,name,kind,owner_id) values
 ('b1000000-0000-4000-8000-000000000001','RLS fixture','company','a1000000-0000-4000-8000-000000000001');
insert into public.kova_members values
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','Owner'),
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','Viewer'),
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004','Developer');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
insert into public.kova_records(id,space_id,kind,data) values
 ('c1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','project','{"title":"Test project","stage":"Clarify"}'),
 ('c1000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000001','run','{"title":"Test run","completed":2,"status":"Awaiting approval"}'),
 ('c1000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-000000000001','credit','{"title":"Demo purchase","source":"idempotency-test","amount":1000,"status":"Simulated"}');
do $$ begin
 begin
  insert into public.kova_records(space_id,kind,data) values('b1000000-0000-4000-8000-000000000001','credit','{"title":"Duplicate","source":"idempotency-test","amount":1000,"status":"Simulated"}');
  raise exception 'FAIL duplicate purchase allowed';
 exception when unique_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
do $$ begin
 if (select count(*) from public.kova_records where space_id='b1000000-0000-4000-8000-000000000001')<>3 then raise exception 'FAIL viewer read';end if;
 begin
  insert into public.kova_records(space_id,kind,data) values('b1000000-0000-4000-8000-000000000001','bot','{"title":"Forbidden"}');
  raise exception 'FAIL viewer write allowed';
 exception when insufficient_privilege then null;end;
 update public.kova_records set data='{"title":"Forbidden"}',revision=2 where id='c1000000-0000-4000-8000-000000000001';
 if found then raise exception 'FAIL viewer update allowed';end if;
 delete from public.kova_records where id='c1000000-0000-4000-8000-000000000001';
 if found then raise exception 'FAIL viewer delete allowed';end if;
end $$;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.kova_records where space_id='b1000000-0000-4000-8000-000000000001') then raise exception 'FAIL outsider read';end if;
 if exists(select 1 from public.kova_spaces where id='b1000000-0000-4000-8000-000000000001') then raise exception 'FAIL outsider workspace';end if;
 begin
  insert into public.kova_invites(space_id,email,role) values('b1000000-0000-4000-8000-000000000001','attacker@example.invalid','Admin');
  raise exception 'FAIL outsider invite';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000004',true);
do $$ begin
 begin
  update public.kova_records set data=data||'{"completed":4}',revision=2 where id='c1000000-0000-4000-8000-000000000002';
  raise exception 'FAIL developer PM approval';
 exception when raise_exception then if sqlerrm<>'PM approval required' then raise;end if;end;
 begin
  perform public.kova_change_member('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004','Admin');
  raise exception 'FAIL self escalation';
 exception when raise_exception then if sqlerrm<>'Forbidden' then raise;end if;end;
end $$;
set local role anon;
do $$ begin
 begin
  perform count(*) from public.kova_records;
  raise exception 'FAIL anonymous access';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: owner writes; duplicate credits rejected; viewer read-only; outsider isolated; developer cannot approve PM gate or elevate role; anonymous denied' as result;
rollback;
