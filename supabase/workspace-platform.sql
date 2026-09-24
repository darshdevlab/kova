-- Workspace data is protected by database membership, never UI role claims.
create table public.kova_spaces (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 1 and 80),
 kind text not null check (kind in ('personal','company')),
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create unique index one_personal_space on public.kova_spaces(owner_id) where kind='personal';
create table public.kova_members (
 space_id uuid references public.kova_spaces(id) on delete cascade,
 user_id uuid references auth.users(id),
 role text not null check (role in ('Owner','Admin','PM','Developer','QA','Viewer')),
 primary key(space_id,user_id)
);
create table public.kova_records (
 id uuid primary key default gen_random_uuid(),
 space_id uuid not null references public.kova_spaces(id) on delete cascade,
 kind text not null check (kind in ('project','bot','run','document','question','credit','setting','activity')),
 data jsonb not null default '{}',
 revision integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index kova_records_space on public.kova_records(space_id,kind);
create table public.kova_invites (
 id uuid primary key default gen_random_uuid(),
 space_id uuid not null references public.kova_spaces(id) on delete cascade,
 email text not null,
 role text not null check (role in ('Admin','PM','Developer','QA','Viewer')),
 created_at timestamptz not null default now(),
 unique(space_id,email)
);
create or replace function public.kova_role(sid uuid) returns text
language sql stable security definer set search_path='' as $$
 select role from public.kova_members where space_id=sid and user_id=(select auth.uid());
$$;
revoke all on function public.kova_role(uuid) from public;
grant execute on function public.kova_role(uuid) to authenticated;
alter table public.kova_spaces enable row level security;
alter table public.kova_members enable row level security;
alter table public.kova_records enable row level security;
alter table public.kova_invites enable row level security;
revoke all on public.kova_spaces,public.kova_members,public.kova_records,public.kova_invites from anon,authenticated;
grant select on public.kova_spaces,public.kova_members to authenticated;
grant select,insert,update,delete on public.kova_records,public.kova_invites to authenticated;
create policy spaces_read on public.kova_spaces for select to authenticated using (public.kova_role(id) is not null);
create policy members_read on public.kova_members for select to authenticated using (public.kova_role(space_id) is not null);
create policy records_read on public.kova_records for select to authenticated using (public.kova_role(space_id) is not null);
create policy records_insert on public.kova_records for insert to authenticated with check (
 public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA') and
 (kind not in ('credit','setting') or public.kova_role(space_id) in ('Owner','Admin')));
create policy records_update on public.kova_records for update to authenticated using (
 public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA') and
 (kind not in ('credit','setting') or public.kova_role(space_id) in ('Owner','Admin'))
) with check (public.kova_role(space_id) in ('Owner','Admin','PM','Developer','QA') and
 (kind not in ('credit','setting') or public.kova_role(space_id) in ('Owner','Admin')));
create policy records_delete on public.kova_records for delete to authenticated using (public.kova_role(space_id) in ('Owner','Admin'));
create policy invites_manage on public.kova_invites for all to authenticated using (public.kova_role(space_id) in ('Owner','Admin')) with check (public.kova_role(space_id) in ('Owner','Admin') and exists(select 1 from public.kova_spaces where id=space_id and kind='company'));
create or replace function public.kova_create_space(space_name text, space_kind text) returns uuid
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if space_kind='personal' then
  select id into sid from public.kova_spaces where owner_id=auth.uid() and kind='personal';
  if sid is not null then return sid; end if;
 end if;
 insert into public.kova_spaces(name,kind,owner_id) values(trim(space_name),space_kind,auth.uid()) returning id into sid;
 insert into public.kova_members values(sid,auth.uid(),'Owner');
 return sid;
end $$;
create or replace function public.kova_accept_invites() returns void
language plpgsql security definer set search_path='' as $$
declare verified_email text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select lower(email) into verified_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 insert into public.kova_members(space_id,user_id,role)
 select space_id,auth.uid(),role from public.kova_invites where lower(email)=verified_email on conflict do nothing;
 delete from public.kova_invites where lower(email)=verified_email;
end $$;
create or replace function public.kova_change_member(sid uuid, uid uuid, new_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if public.kova_role(sid) not in ('Owner','Admin') or public.kova_role(sid) is null then raise exception 'Forbidden'; end if;
 if exists(select 1 from public.kova_members where space_id=sid and user_id=uid and role='Owner') then raise exception 'Owner cannot be changed'; end if;
 if new_role='Remove' then delete from public.kova_members where space_id=sid and user_id=uid;
 elsif new_role in ('Admin','PM','Developer','QA','Viewer') then update public.kova_members set role=new_role where space_id=sid and user_id=uid;
 else raise exception 'Invalid role'; end if;
end $$;
revoke all on function public.kova_create_space(text,text),public.kova_accept_invites(),public.kova_change_member(uuid,uuid,text) from public;
grant execute on function public.kova_create_space(text,text),public.kova_accept_invites(),public.kova_change_member(uuid,uuid,text) to authenticated;
