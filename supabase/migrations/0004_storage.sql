-- ============================================================================
-- Storage: private bucket `parking-request-files`.
-- Layout:  <file_type_folder>/<request_id>/<filename>
--   official_letters/ completion_photos/ cancellation_evidence/ general/
--
-- Access model: uploads and signed-URL generation are performed in SERVER
-- ACTIONS using the SERVICE-ROLE client AFTER the action verifies the user's
-- permission (requireProfile + can_read/can_write_request). The bucket is
-- therefore private and direct authenticated access is limited to admins.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'parking-request-files',
  'parking-request-files',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'image/jpeg','image/png','image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins get direct access to the bucket objects; everyone else is served via
-- service-role server actions (which bypass RLS after app-level checks).
drop policy if exists "parking files admin all" on storage.objects;
create policy "parking files admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'parking-request-files' and public.is_admin())
  with check (bucket_id = 'parking-request-files' and public.is_admin());
