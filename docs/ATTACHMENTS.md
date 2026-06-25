# Attachments

## Overview

| File type | Storage | Upload path |
|-----------|---------|-------------|
| `official_letter`, `general_attachment`, `cancellation_evidence`, `completion_photo` | Supabase Storage (`parking-request-files`) | Server action + `SUPABASE_SERVICE_ROLE_KEY` |

Metadata for all files lives in `request_attachments`. Legacy rows may use `storage_provider = google_drive` (still viewable via API proxy).

## Completion photos (security staff)

### Flow

1. Security staff selects one or more images on the job detail page (`/security/jobs/[id]`).
2. Browser compresses each image (`browser-image-compression`: max 1600px, JPEG ~0.75 quality, max ~1.5 MB).
3. Server action `uploadCompletionPhoto` uploads the buffer to Supabase Storage (`completion_photos/{requestId}/...`).
4. Row inserted into `request_attachments` with `storage_provider = supabase`.
5. `completeJob` / `completeJobWithPhotos` requires at least one `completion_photo` before status → `completed`.
6. Gallery uses signed Supabase URLs; full image also available via `GET /api/attachments/[id]/image`.

## Environment variables

### Supabase (all apps)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only; all attachment uploads including completion photos
```

Local: copy to `apps/admin/.env.local` and `apps/user/.env.local`.  
Vercel: Project → Settings → Environment Variables (never expose service role to the client).

### Google Drive (optional — legacy attachments only)

Not required for new completion photo uploads. Only needed if you still serve old `storage_provider = google_drive` rows.

```env
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_SHARED_DRIVE_ID=
```

## Viewing images

- **Supabase files (including completion photos):** short-lived signed URLs (server-side) or `/api/attachments/[id]/image`.
- **Legacy Google Drive files:** `/api/attachments/[id]/image` only.

Admin request detail and security job detail use `CompletionPhotoGallery` for thumbnail grid + preview modal.

## Storage capacity

Completion photos are compressed client-side (max ~1.5 MB each). Monitor usage in Supabase Dashboard → Storage.

## Thai UI

Labels are in `packages/types/src/labels.ts` (`TH.action.attachCompletionPhoto`, `TH.entity.completionPhoto`, etc.).

## Errors

| Condition | Message |
|-----------|---------|
| Missing service role | ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ... |
| Upload failure | อัปโหลดรูปส่งงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง |
| Complete without photo | กรุณาแนบรูปอย่างน้อย 1 รูป |
