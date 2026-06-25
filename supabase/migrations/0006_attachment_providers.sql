-- External storage metadata for attachments (e.g. Google Drive completion photos).
alter table public.request_attachments
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists external_file_id text,
  add column if not exists external_url text,
  add column if not exists thumbnail_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_attachments_storage_provider
  on public.request_attachments (storage_provider);

create index if not exists idx_attachments_external_file_id
  on public.request_attachments (external_file_id)
  where external_file_id is not null;
