-- Security officers (comms receiving officer) reference list + FK on requests

create table if not exists public.security_officers (
  id          uuid primary key default gen_random_uuid(),
  name_th     text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint security_officers_name_th_unique unique (name_th)
);

create index if not exists idx_security_officers_active_sort
  on public.security_officers (is_active, sort_order, name_th);

drop trigger if exists security_officers_set_updated_at on public.security_officers;
create trigger security_officers_set_updated_at
  before update on public.security_officers
  for each row execute function public.set_updated_at();

alter table public.parking_requests
  add column if not exists receiving_officer_id uuid
    references public.security_officers(id) on delete set null;

create index if not exists idx_requests_receiving_officer
  on public.parking_requests(receiving_officer_id);

-- RLS (same pattern as departments/locations)
alter table public.security_officers enable row level security;

drop policy if exists security_officers_select on public.security_officers;
create policy security_officers_select on public.security_officers
  for select to authenticated using (true);

drop policy if exists security_officers_admin_write on public.security_officers;
create policy security_officers_admin_write on public.security_officers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed default receiving officers (comms)
insert into public.security_officers (name_th, sort_order) values
  ('นายธวัชชัย สุขศิริผล', 1),
  ('นายถิรายุ สมานสินธุ์', 2),
  ('นายวันพิทักษ์ วงค์มูล', 3),
  ('นายทรงพล เล็กพูนศักดิ์', 4),
  ('ร.ต.อ. วรดร ใสสุชล', 5),
  ('นายปริวรรตน์ จารุเศวตรัศมี', 6),
  ('นายไกรฤทธิ์ ศรีสูงเนิน', 7),
  ('นายวีรพจน์ สรรพากิจวัฒนา', 8),
  ('นางสาวปาณิชา ใจมุข', 9),
  ('นางสาวพลชา กองจันทร์', 10),
  ('นายณัฐนันท์ อำม์พรพันธ์', 11),
  ('นายกมลนัทธ์ ศักดิ์สุวรรณ', 12),
  ('นายกฤตภาส เอี่ยมศรี', 13)
on conflict (name_th) do nothing;
