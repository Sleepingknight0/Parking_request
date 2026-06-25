-- ============================================================================
-- Shared comms operational toggles (auto-approve / auto-verify).
-- Single row — applies to the whole user app comms workflow.
-- ============================================================================

create table if not exists public.comms_operational_settings (
  id boolean primary key default true check (id = true),
  auto_approve_incoming boolean not null default false,
  auto_verify_security_work boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.comms_operational_settings (id)
values (true)
on conflict (id) do nothing;

comment on table public.comms_operational_settings is
  'Singleton toggles for comms special modes in the user app.';
