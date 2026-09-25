create or replace function public.kova_own_ai_usage() returns integer
language sql stable security definer set search_path='' as $$
 select coalesce((select requests from public.kova_ai_usage where user_id=auth.uid() and day=current_date),0);
$$;
revoke all on function public.kova_own_ai_usage() from public,anon;
grant execute on function public.kova_own_ai_usage() to authenticated;
