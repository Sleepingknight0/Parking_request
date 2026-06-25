-- ============================================================================
-- Officer shared request pool (communal access, not per-user ownership).
-- Officers may read all parking_requests and update unassigned requests in
-- draft/submitted/under_review/approved regardless of created_by.
-- ============================================================================

create or replace function public.can_read_request(req uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parking_requests r
    where r.id = req and (
      public.is_admin()
      or public.current_role_name() = 'viewer'
      or public.is_officer()
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
      or (
        public.is_officer()
        and r.assigned_to is null
        and r.status in ('draft','submitted','under_review','approved')
      )
      or (public.is_security() and (r.assigned_to = auth.uid() or r.status = 'approved'))
    )
  );
$$;

drop policy if exists requests_select on public.parking_requests;
create policy requests_select on public.parking_requests
  for select to authenticated using (
    public.is_admin()
    or public.current_role_name() = 'viewer'
    or public.is_officer()
    or (public.is_security()
        and status in ('approved','assigned','in_progress','completed','cancelled'))
  );

drop policy if exists requests_update_officer on public.parking_requests;
create policy requests_update_officer on public.parking_requests
  for update to authenticated
  using (
    public.is_officer()
    and status in ('draft','submitted','under_review','approved')
    and assigned_to is null
  )
  with check (public.is_officer());

drop policy if exists requests_delete on public.parking_requests;
create policy requests_delete on public.parking_requests
  for delete to authenticated using (
    public.is_admin()
    or (public.is_officer() and status = 'draft')
  );
