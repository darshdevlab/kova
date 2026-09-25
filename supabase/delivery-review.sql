-- Apply after workspace-platform.sql and workspace-guards.sql.
-- Approval authority lives here, never in editor-writable project JSON.
create table public.kova_delivery_approvals (
 project_id uuid not null references public.kova_records(id) on delete cascade,
 kind text not null check (kind in ('prd','trd')),
 approved_artifact jsonb not null,
 approved_by uuid not null references auth.users(id),
 approved_role text not null,
 approved_at timestamptz not null default now(),
 primary key(project_id,kind)
);
alter table public.kova_delivery_approvals enable row level security;
revoke all on public.kova_delivery_approvals from public,anon,authenticated;
grant select on public.kova_delivery_approvals to authenticated;
create policy delivery_approval_read on public.kova_delivery_approvals for select to authenticated
 using (exists(select 1 from public.kova_records r where r.id=project_id and public.kova_role(r.space_id) is not null));

create function public.kova_guard_delivery() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor text; old_delivery boolean; new_delivery boolean; prd jsonb; trd jsonb; old_prd jsonb; old_trd jsonb;
begin
 new_delivery := coalesce(new.data->>'deliveryMode','direct') in ('delivery','product');
 old_delivery := case when tg_op='UPDATE' then coalesce(old.data->>'deliveryMode','direct') in ('delivery','product') else false end;
 if not new_delivery and not old_delivery then return new; end if;
 if old_delivery and not new_delivery then raise exception 'Delivery mode cannot be removed from an existing delivery project'; end if;
 actor := public.kova_role(new.space_id);
 if auth.uid() is null or actor is null then raise exception 'Delivery membership required'; end if;
 prd := new.data#>'{builder,delivery,prd}'; trd := new.data#>'{builder,delivery,trd}';
 if tg_op='UPDATE' then old_prd:=old.data#>'{builder,delivery,prd}'; old_trd:=old.data#>'{builder,delivery,trd}'; end if;
 if (prd-'approval'-'history') is distinct from (old_prd-'approval'-'history') then
  if actor not in ('Owner','Admin','PM') then raise exception 'PM access required for PRD edits'; end if;
  delete from public.kova_delivery_approvals where project_id=new.id;
 elsif (trd-'approval'-'history') is distinct from (old_trd-'approval'-'history') then
  delete from public.kova_delivery_approvals where project_id=new.id and kind='trd';
 end if;
 if (trd-'approval'-'history') is distinct from (old_trd-'approval'-'history') then
  if actor not in ('Owner','Admin','Developer') then raise exception 'Developer access required for TRD edits'; end if;
  if not exists(select 1 from public.kova_delivery_approvals a where a.project_id=new.id and a.kind='prd' and a.approved_artifact=(prd-'approval'-'history')) then raise exception 'Current PRD approval required for TRD edits'; end if;
 end if;
 if (tg_op='INSERT' and coalesce(new.data#>>'{builder,html}','')<>'') or (tg_op='UPDATE' and coalesce(new.data#>>'{builder,html}','') is distinct from coalesce(old.data#>>'{builder,html}','')) then
  if actor not in ('Owner','Admin','Developer') then raise exception 'Developer access required for delivery code'; end if;
  if not exists(select 1 from public.kova_delivery_approvals a where a.project_id=new.id and a.kind='prd' and a.approved_artifact=(prd-'approval'-'history')) or not exists(select 1 from public.kova_delivery_approvals a where a.project_id=new.id and a.kind='trd' and a.approved_artifact=(trd-'approval'-'history')) or trd->>'basedOnPrdVersion' is distinct from prd->>'version' then raise exception 'Current PRD and TRD approvals required for delivery code'; end if;
 end if;
 new.data:=jsonb_set(new.data,'{status}',to_jsonb(case
  when not exists(select 1 from public.kova_delivery_approvals a where a.project_id=new.id and a.kind='prd' and a.approved_artifact=(prd-'approval'-'history')) then 'PRD review'
  when not exists(select 1 from public.kova_delivery_approvals a where a.project_id=new.id and a.kind='trd' and a.approved_artifact=(trd-'approval'-'history')) or trd->>'basedOnPrdVersion' is distinct from prd->>'version' then 'TRD review'
  else 'Approved' end));
 return new;
end $$;
revoke all on function public.kova_guard_delivery() from public,anon,authenticated;
create trigger kova_delivery_guard before insert or update on public.kova_records for each row execute function public.kova_guard_delivery();

create function public.kova_approve_delivery(project_id uuid, expected_revision integer, artifact_kind text, artifact_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rec public.kova_records; actor text; artifact jsonb; prd jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into rec from public.kova_records where id=project_id and kind='project' for update;
 if not found then raise exception 'Project unavailable'; end if;
 actor:=public.kova_role(rec.space_id);
 if actor is null or artifact_kind not in ('prd','trd') or actor not in ('Owner','Admin',case when artifact_kind='prd' then 'PM' else 'Developer' end) then raise exception 'Approval role denied'; end if;
 if coalesce(rec.data->>'deliveryMode','direct') not in ('delivery','product') then raise exception 'Not a delivery project'; end if;
 if rec.revision<>expected_revision then raise exception 'Project revision conflict'; end if;
 artifact:=rec.data#>array['builder','delivery',artifact_kind];
 if artifact is null or coalesce(artifact->>'version','')<>artifact_version::text or length(trim(coalesce(artifact->>'content',''))) not between 20 and 30000 then raise exception 'Invalid artifact revision'; end if;
 if artifact_kind='trd' then
  prd:=rec.data#>'{builder,delivery,prd}';
  if artifact->>'basedOnPrdVersion' is distinct from prd->>'version' or not exists(select 1 from public.kova_delivery_approvals a where a.project_id=rec.id and a.kind='prd' and a.approved_artifact=(prd-'approval'-'history')) then raise exception 'Current PRD approval required'; end if;
 end if;
 insert into public.kova_delivery_approvals(project_id,kind,approved_artifact,approved_by,approved_role)
 values(rec.id,artifact_kind,artifact-'approval'-'history',auth.uid(),actor)
 on conflict on constraint kova_delivery_approvals_pkey do update set approved_artifact=excluded.approved_artifact,approved_by=excluded.approved_by,approved_role=excluded.approved_role,approved_at=now();
 update public.kova_records set revision=revision+1,updated_at=now() where id=rec.id returning * into rec;
 return to_jsonb(rec);
end $$;
revoke all on function public.kova_approve_delivery(uuid,integer,text,integer) from public,anon;
grant execute on function public.kova_approve_delivery(uuid,integer,text,integer) to authenticated;
