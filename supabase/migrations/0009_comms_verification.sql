-- ============================================================================
-- Comms staff completion verification (after security marks completed).
-- ============================================================================

alter table public.parking_requests
  add column if not exists comms_verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists comms_verified_at timestamptz;

comment on column public.parking_requests.comms_verified_by is
  'Comms staff who confirmed security work completion.';
comment on column public.parking_requests.comms_verified_at is
  'When comms staff confirmed security work completion.';

create index if not exists idx_requests_comms_verified_at
  on public.parking_requests(comms_verified_at)
  where comms_verified_at is not null;
