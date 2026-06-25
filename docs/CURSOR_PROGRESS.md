# Cursor Progress

## 2026-06-25 — Completion photos → Supabase Storage

### Done

- Switched `uploadCompletionPhoto` from Google Drive to **Supabase Storage** (`completion_photos/{requestId}/...`).
- Client compression unchanged (`browser-image-compression`, max ~1.5 MB JPEG).
- `storage_provider = supabase` for new completion photos; Google Drive code kept for legacy rows only.
- Updated `docs/ATTACHMENTS.md`, `docs/DATABASE_CONTRACT.md`.

### Required env

- `SUPABASE_SERVICE_ROLE_KEY` only (Google Drive env no longer required for new uploads).

### Manual QA

- [ ] `pnpm dev:reset` then login `security01` / `password`
- [ ] Upload completion photo on in-progress job
- [ ] Complete job; verify gallery on security + admin + officer detail pages

## 2026-06-25 — Completion photo upload (Google Drive)

### Done

- Added migration `0006_attachment_providers.sql` (`storage_provider`, `external_file_id`, `external_url`, `thumbnail_url`, `metadata` on `request_attachments`).
- New package `@nacc/storage` with Google Drive upload/stream helpers and shared `serveAttachmentImage` for API routes.
- Security staff completion photos: client compression (`browser-image-compression`) → Google Drive upload → Supabase metadata.
- `uploadUserAttachment` no longer uses service role for `completion_photo` (redirected to dedicated uploader).
- Friendly Thai errors when `SUPABASE_SERVICE_ROLE_KEY` or Google Drive env is missing (no raw runtime crash).
- API routes: `GET /api/attachments/[id]/image` in user + admin apps.
- UI: `CompletionPhotoUploader`, `CompletionPhotoGallery` on security job detail + admin request detail.
- Updated `.env.example`, `docs/DEPLOYMENT.md`, `docs/ATTACHMENTS.md`, `docs/DATABASE_CONTRACT.md`.

### Required env (local + Vercel)

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Storage (letters, etc.)
- `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` — completion photos
- Optional: `GOOGLE_DRIVE_SHARED_DRIVE_ID`

### Manual QA

- [x] Google Drive env set; folder `13YAEy6QHoGX0i__CJtDs6aZlVocaPEjX` (NACC Completion Photos)
- [ ] **Blocker:** folder is under My Drive folder named "Shared Drive" — SA sees `drives.list() = []`. Must use real Google Workspace **Shared drive**, add SA as Content manager, then re-test `pnpm tsx scripts/test-google-drive.ts`
- [ ] Run migration on hosted project (`pnpm db:push` or apply `0006`)
- [ ] Login as `security01` / `password`
- [ ] Attach compressed completion photo on in-progress job
- [ ] Complete job; verify status + gallery on job detail and admin request detail

## 2026-06-25 — Bug fixes (completion photos)

### Fixed

- **Web 500 / blank pages:** stale `.next` cache after `pnpm build` while dev is running, or deleting `.next` with dev still up (ENOENT on `routes-manifest.json`). Recovery: stop dev, run `pnpm dev:reset` (or `pnpm clean:next` then `pnpm dev`). Do not run `pnpm build` and `pnpm dev` at the same time.
- **Attachment links:** `AttachGroup` on detail pages now uses `resolveAttachmentViewUrl` (Google Drive → `/api/attachments/[id]/image`). Officer request detail uses `CompletionPhotoGallery` for completion photos.
- **Monorepo bundling:** added `@nacc/storage` to `transpilePackages` in both Next apps.
