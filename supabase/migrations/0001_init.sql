-- ============================================================================
-- NACC Parking Request System — schema, functions, triggers
-- Single source of truth for the database contract (see docs/DATABASE_CONTRACT.md)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ───────────────────────── helper: updated_at ─────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────── reference tables ─────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name_th     text not null,
  short_name  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name_th     text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.parking_zones (
  id          uuid primary key default gen_random_uuid(),
  name_th     text not null,
  location_id uuid references public.locations(id) on delete set null,
  capacity    integer not null default 0,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  display_name  text not null,
  role          text not null default 'viewer'
                  check (role in ('super_admin','admin','officer','security_staff','viewer')),
  phone         text,
  department_id uuid references public.departments(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ───────────────────────── request number counter ─────────────────────────
create table if not exists public.request_counters (
  counter_date date primary key,
  last_seq     integer not null default 0
);

create or replace function public.next_request_no()
returns text language plpgsql security definer set search_path = public as $$
declare
  d   date := (now() at time zone 'Asia/Bangkok')::date;
  seq integer;
begin
  insert into public.request_counters as rc (counter_date, last_seq)
  values (d, 1)
  on conflict (counter_date)
    do update set last_seq = rc.last_seq + 1
  returning last_seq into seq;
  return 'PRK-' || to_char(d, 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
end $$;

-- ───────────────────────── parking_requests ─────────────────────────
create table if not exists public.parking_requests (
  id                       uuid primary key default gen_random_uuid(),
  request_no               text unique not null default '',
  department_id            uuid references public.departments(id) on delete set null,
  created_by               uuid references public.profiles(id) on delete set null,
  official_letter_no       text not null,
  official_letter_date     date,
  received_date            date,
  subject                  text,
  contact_name             text,
  contact_phone            text,
  requested_location_id    uuid references public.locations(id) on delete set null,
  requested_location_text  text,
  date_pattern             text not null default 'single'
                             check (date_pattern in ('single','multi','range','weekly')),
  cars_count               integer not null default 1 check (cars_count >= 0),
  purpose                  text,
  status                   text not null default 'draft'
                             check (status in ('draft','submitted','under_review','approved',
                                               'assigned','in_progress','completed','cancelled','rejected')),
  priority                 text not null default 'normal'
                             check (priority in ('low','normal','high','urgent')),
  assigned_to              uuid references public.profiles(id) on delete set null,
  assigned_by              uuid references public.profiles(id) on delete set null,
  assigned_at              timestamptz,
  -- reserved for future governance mode (unused in v1)
  approved_by              uuid references public.profiles(id) on delete set null,
  approved_at              timestamptz,
  rejected_by              uuid references public.profiles(id) on delete set null,
  rejected_at              timestamptz,
  cancelled_by             uuid references public.profiles(id) on delete set null,
  cancelled_at             timestamptz,
  cancellation_reason      text,
  completed_by             uuid references public.profiles(id) on delete set null,
  completed_at             timestamptz,
  completion_note          text,
  admin_note               text,
  -- legacy import tracking
  legacy_source            text,
  legacy_row_number        integer,
  legacy_imported_at       timestamptz,
  legacy_officer_name      text,
  metadata                 jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists public.request_dates (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.parking_requests(id) on delete cascade,
  request_date date not null,
  start_time   time,
  end_time     time,
  created_at   timestamptz not null default now()
);

create table if not exists public.request_license_plates (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.parking_requests(id) on delete cascade,
  plate_no     text not null,
  vehicle_note text,
  created_at   timestamptz not null default now()
);

create table if not exists public.request_attachments (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.parking_requests(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_type   text not null
                check (file_type in ('official_letter','general_attachment','completion_photo','cancellation_evidence')),
  file_name   text not null,
  file_path   text not null,
  mime_type   text,
  file_size   integer,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.request_status_history (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.parking_requests(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.sheet_sync_logs (
  id             uuid primary key default gen_random_uuid(),
  entity_type    text not null,
  entity_id      uuid,
  sync_direction text not null check (sync_direction in ('to_sheet','from_sheet')),
  status         text not null,
  message        text,
  payload        jsonb,
  created_at     timestamptz not null default now()
);

-- ───────────────────────── indexes ─────────────────────────
create index if not exists idx_requests_status        on public.parking_requests(status);
create index if not exists idx_requests_department     on public.parking_requests(department_id);
create index if not exists idx_requests_assigned_to    on public.parking_requests(assigned_to);
create index if not exists idx_requests_created_by      on public.parking_requests(created_by);
create index if not exists idx_requests_created_at      on public.parking_requests(created_at desc);
create index if not exists idx_request_dates_request    on public.request_dates(request_id);
create index if not exists idx_request_dates_date       on public.request_dates(request_date);
create index if not exists idx_plates_request           on public.request_license_plates(request_id);
create index if not exists idx_attachments_request      on public.request_attachments(request_id);
create index if not exists idx_history_request          on public.request_status_history(request_id);
create index if not exists idx_activity_entity          on public.activity_logs(entity_id);
create index if not exists idx_activity_actor           on public.activity_logs(actor_id);

-- ───────────────────────── status transition validation ─────────────────────────
-- Active v1 machine (no approval gate). Reserved statuses are unreachable in v1.
create or replace function public.is_valid_status_transition(p_from text, p_to text)
returns boolean language sql immutable as $$
  select case p_from
    when 'draft'       then p_to in ('submitted')
    when 'submitted'   then p_to in ('assigned','cancelled')
    when 'assigned'    then p_to in ('in_progress','cancelled')
    when 'in_progress' then p_to in ('completed','cancelled')
    else false
  end;
$$;

-- BEFORE UPDATE: validate transition + auto-stamp lifecycle timestamps.
create or replace function public.parking_requests_before_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not public.is_valid_status_transition(old.status, new.status) then
      raise exception 'ไม่อนุญาตให้เปลี่ยนสถานะจาก % เป็น %', old.status, new.status
        using errcode = 'check_violation';
    end if;
    if new.status = 'assigned'    and new.assigned_at  is null then new.assigned_at  := now(); end if;
    if new.status = 'in_progress' then /* started; no dedicated column */ null; end if;
    if new.status = 'completed'   and new.completed_at is null then new.completed_at := now(); end if;
    if new.status = 'cancelled'   and new.cancelled_at is null then new.cancelled_at := now(); end if;
  end if;
  return new;
end $$;

-- AFTER INSERT/UPDATE: write status history (security definer to bypass RLS on
-- the history table during the triggering write).
create or replace function public.parking_requests_log_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_status_history(request_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, coalesce(auth.uid(), new.created_by));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.request_status_history(request_id, old_status, new_status, changed_by, note)
    values (new.id, old.status, new.status, coalesce(auth.uid(), new.assigned_by),
            case when new.status='cancelled' then new.cancellation_reason
                 when new.status='completed' then new.completion_note end);
  end if;
  return new;
end $$;

-- request_no auto-generation on insert.
create or replace function public.parking_requests_set_no()
returns trigger language plpgsql as $$
begin
  if new.request_no is null or new.request_no = '' then
    new.request_no := public.next_request_no();
  end if;
  return new;
end $$;

-- ───────────────────────── triggers ─────────────────────────
drop trigger if exists trg_requests_set_no on public.parking_requests;
create trigger trg_requests_set_no
  before insert on public.parking_requests
  for each row execute function public.parking_requests_set_no();

drop trigger if exists trg_requests_before_update on public.parking_requests;
create trigger trg_requests_before_update
  before update on public.parking_requests
  for each row execute function public.parking_requests_before_update();

drop trigger if exists trg_requests_log_status on public.parking_requests;
create trigger trg_requests_log_status
  after insert or update on public.parking_requests
  for each row execute function public.parking_requests_log_status();

-- updated_at triggers
drop trigger if exists trg_departments_updated on public.departments;
create trigger trg_departments_updated before update on public.departments
  for each row execute function public.set_updated_at();
drop trigger if exists trg_locations_updated on public.locations;
create trigger trg_locations_updated before update on public.locations
  for each row execute function public.set_updated_at();
drop trigger if exists trg_zones_updated on public.parking_zones;
create trigger trg_zones_updated before update on public.parking_zones
  for each row execute function public.set_updated_at();
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_requests_updated on public.parking_requests;
create trigger trg_requests_updated before update on public.parking_requests
  for each row execute function public.set_updated_at();
