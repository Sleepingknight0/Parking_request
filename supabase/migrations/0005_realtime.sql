-- ============================================================================
-- Enable Supabase Realtime on parking_requests so the admin list/dashboard and
-- the security job list refresh live. Realtime still respects RLS.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'parking_requests'
  ) then
    alter publication supabase_realtime add table public.parking_requests;
  end if;
end $$;
