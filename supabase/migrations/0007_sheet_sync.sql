-- Migration 0007: Google Sheets bidirectional sync columns
-- Adds sheet_row (the 1-based row number in the live Google Sheet) and
-- sheet_synced_at (last time this record was pushed to the sheet).
-- A NULL sheet_row means the record has never been pushed.

alter table public.parking_requests
  add column if not exists sheet_row       integer,
  add column if not exists sheet_synced_at timestamptz;

create unique index if not exists uq_requests_sheet_row
  on public.parking_requests(sheet_row)
  where sheet_row is not null;

comment on column public.parking_requests.sheet_row is
  'Row number (1-based) in the live Google Sheet. NULL = not yet synced.';
comment on column public.parking_requests.sheet_synced_at is
  'Timestamp of the last successful push to Google Sheets.';
