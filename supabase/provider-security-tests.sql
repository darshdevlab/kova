-- Read-only assertions; run after provider-connections.sql as migration owner.
begin;
do $$
declare role_name text;
begin
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname='kova_provider_connections' and c.relrowsecurity and c.relforcerowsecurity)
 then raise exception 'Provider credential table must enforce RLS'; end if;
 foreach role_name in array array['anon','authenticated'] loop
   if has_table_privilege(role_name, 'public.kova_provider_connections', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   then raise exception 'Browser role % has provider table privileges', role_name; end if;
 end loop;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='kova_provider_connections')
 then raise exception 'Provider credential table must have no client policies'; end if;
 if not has_table_privilege('service_role','public.kova_provider_connections','SELECT')
 or not has_table_privilege('service_role','public.kova_provider_connections','INSERT')
 or not has_table_privilege('service_role','public.kova_provider_connections','UPDATE')
 or not has_table_privilege('service_role','public.kova_provider_connections','DELETE')
 then raise exception 'Server role lacks required provider privileges'; end if;
end $$;
rollback;
