-- ============================================================================
-- Row Level Security — single source of truth (mirrored in supabase/policies.sql).
--   super_admin/admin : full read+write
--   officer           : read+write OWN requests; edit draft/submitted & unassigned;
--                       cancel submitted/under_review/approved before assignment
--   security_staff    : read approved/assigned/in_progress/completed/cancelled;
--                       accept approved jobs + progress jobs assigned to self
--   viewer            : read-only everything
--   children (dates/plates/attachments/history) inherit request access
-- ============================================================================

-- request-scoped access helpers (security definer → no recursive RLS)
create or replace function public.can_read_request(req uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parking_requests r
    where r.id = req and (
      public.is_admin()
      or public.current_role_name() = 'viewer'
      or (public.is_officer() and r.created_by = auth.uid()
          and r.assigned_to is null
          and r.status in ('draft','submitted'))
      or (public.is_security()
          and r.status in ('approved','assigned','in_progress','completed','cancelled'))
    )
  );
$$;

create or replace function public.can_write_request(req uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parking_requests r
    where r.id = req and (
      public.is_admin()
      or (public.is_officer() and r.created_by = auth.uid())
      or (public.is_security() and (r.assigned_to = auth.uid() or r.status = 'approved'))
    )
  );
$$;

-- enable RLS
alter table public.profiles               enable row level security;
alter table public.departments            enable row level security;
alter table public.locations              enable row level security;
alter table public.parking_zones          enable row level security;
alter table public.parking_requests       enable row level security;
alter table public.request_dates          enable row level security;
alter table public.request_license_plates enable row level security;
alter table public.request_attachments    enable row level security;
alter table public.request_status_history enable row level security;
alter table public.activity_logs          enable row level security;
alter table public.sheet_sync_logs        enable row level security;
alter table public.request_counters       enable row level security;

-- ───────────────────────── profiles ─────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── reference tables ─────────────────────────
drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments
  for select to authenticated using (true);
drop policy if exists departments_admin_write on public.departments;
create policy departments_admin_write on public.departments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations
  for select to authenticated using (true);
drop policy if exists locations_admin_write on public.locations;
create policy locations_admin_write on public.locations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists zones_select on public.parking_zones;
create policy zones_select on public.parking_zones
  for select to authenticated using (true);
drop policy if exists zones_admin_write on public.parking_zones;
create policy zones_admin_write on public.parking_zones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── parking_requests ─────────────────────────
drop policy if exists requests_select on public.parking_requests;
create policy requests_select on public.parking_requests
  for select to authenticated using (
    public.is_admin()
    or public.current_role_name() = 'viewer'
    or (public.is_officer() and created_by = auth.uid())
    or (public.is_security()
        and status in ('approved','assigned','in_progress','completed','cancelled'))
  );

drop policy if exists requests_insert on public.parking_requests;
create policy requests_insert on public.parking_requests
  for insert to authenticated with check (
    public.is_admin()
    or (public.is_officer() and created_by = auth.uid())
  );

drop policy if exists requests_update_admin on public.parking_requests;
create policy requests_update_admin on public.parking_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists requests_update_officer on public.parking_requests;
create policy requests_update_officer on public.parking_requests
  for update to authenticated
  using (
    public.is_officer() and created_by = auth.uid()
    and status in ('draft','submitted','under_review','approved') and assigned_to is null
  )
  with check (public.is_officer() and created_by = auth.uid());

drop policy if exists requests_update_security on public.parking_requests;
create policy requests_update_security on public.parking_requests
  for update to authenticated
  using (public.is_security() and (assigned_to = auth.uid() or status = 'approved'))
  with check (public.is_security() and assigned_to = auth.uid());

drop policy if exists requests_delete on public.parking_requests;
create policy requests_delete on public.parking_requests
  for delete to authenticated using (
    public.is_admin()
    or (public.is_officer() and created_by = auth.uid() and status = 'draft')
  );

-- ───────────────────────── child tables (inherit request access) ─────────────────────────
drop policy if exists request_dates_select on public.request_dates;
create policy request_dates_select on public.request_dates
  for select to authenticated using (public.can_read_request(request_id));
drop policy if exists request_dates_write on public.request_dates;
create policy request_dates_write on public.request_dates
  for all to authenticated
  using (public.can_write_request(request_id))
  with check (public.can_write_request(request_id));

drop policy if exists plates_select on public.request_license_plates;
create policy plates_select on public.request_license_plates
  for select to authenticated using (public.can_read_request(request_id));
drop policy if exists plates_write on public.request_license_plates;
create policy plates_write on public.request_license_plates
  for all to authenticated
  using (public.can_write_request(request_id))
  with check (public.can_write_request(request_id));

drop policy if exists attachments_select on public.request_attachments;
create policy attachments_select on public.request_attachments
  for select to authenticated using (public.can_read_request(request_id));
drop policy if exists attachments_write on public.request_attachments;
create policy attachments_write on public.request_attachments
  for all to authenticated
  using (public.can_write_request(request_id))
  with check (public.can_write_request(request_id));

-- status history: read follows request; writes are via security-definer trigger only
drop policy if exists history_select on public.request_status_history;
create policy history_select on public.request_status_history
  for select to authenticated using (public.can_read_request(request_id));

-- ───────────────────────── activity logs ─────────────────────────
drop policy if exists activity_admin_select on public.activity_logs;
create policy activity_admin_select on public.activity_logs
  for select to authenticated using (public.is_admin());
drop policy if exists activity_insert on public.activity_logs;
create policy activity_insert on public.activity_logs
  for insert to authenticated with check (actor_id = auth.uid() or actor_id is null);

-- ───────────────────────── sheet sync logs ─────────────────────────
drop policy if exists sheet_admin on public.sheet_sync_logs;
create policy sheet_admin on public.sheet_sync_logs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- request_counters: managed exclusively via next_request_no() (security definer).
-- No policies → no direct authenticated access (RLS denies by default).
