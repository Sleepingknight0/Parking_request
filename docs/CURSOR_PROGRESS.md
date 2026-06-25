# Cursor Progress

## 2026-06-25 — รปภ. mobile dashboard UX

### Done (รอบ 3 — สถานะและความเร่งด่วนเฉพาะ รปภ.)

- สถานะงาน รปภ.: รอรับทราบ → รับทราบแล้ว → กำลังจัดที่จอด → **ทำงานเรียบร้อยแล้ว** (เขียว)
- ปุ่ม **รับทราบ** แทน รับงาน (สิทธิ์ DB เหมือนเดิม)
- แท็กความเร่งด่วนวันจอด: ปกติ (teal) → ด่วน (ส้ม) → ด่วนมากๆ (แดง) → ⚠️ ยังไม่ได้จัดที่จอดรถ
- Legend แยก สถานะงาน + ความเร่งด่วน
- Tests 17 cases

- การ์ดหน้าแรกเน้น **สถานที่ · จำนวนคัน → วันเวลา → ทะเบียน** เท่านั้น
- เลขหนังสือ / เรื่อง / หน่วยงาน ย้ายไป **รายละเอียด** เท่านั้น (สำหรับอ้างอิง ไม่ใช่ priority หลัก)
- ปฏิทินมือถือ: ไม่แสดงเลขหนังสือ — แสดงเวลาแทน

### Done (รอบ 1)

- ปรับลำดับข้อมูลการ์ดงาน: **สถานที่ · จำนวนคัน** เป็นหัวข้อหลัก, ทะเบียนรถเป็นรอง, เลขหนังสือ/เรื่องเล็กลง
- ส่วน **งานด่วน — ต้องจัดวันนี้/พรุ่งนี้** สำหรับงานที่ต้องเตรียมที่จอดล่วงหน้า 1 วัน
- แท็ก **ด่วนมากๆ** สำหรับวันนี้/พรุ่งนี้ พร้อมวันที่; วันถัดไปแสดงเลขวัน + วันที่
- ปฏิทินมือถือ: รายการ agenda 14 วัน แทนกริดที่บีบ (เดสก์ท็อปยังใช้ FullCalendar)
- ปุ่ม **รายละเอียด** + dialog บนการ์ดงาน
- `StatusLegend` โหมด `compact` สำหรับหน้า รปภ.
- Unit tests: `apps/user/src/lib/security-job-utils.test.ts` (ทะเบียน/ไม่มีทะเบียน, วันเดียว, หลายวัน, รายสัปดาห์, ด่วนพรุ่งนี้)

### Verification

- `pnpm --filter @nacc/user test` passed
- `pnpm lint` passed
- `pnpm typecheck` passed

### Manual QA

- [ ] มือถือ: หน้า `/security/dashboard` — legend เล็กลง, ปฏิทินอ่านง่าย
- [ ] งานพรุ่งนี้ขึ้นใน **งานด่วน** พร้อมแท็ก ด่วนมากๆ
- [ ] กดรายละเอียด → dialog และลิงก์ไปหน้างาน

## 2026-06-25 - Codex bugfix: localhost client-side exception

### Fixed

- Removed leftover debug instrumentation that posted to `127.0.0.1:7504` from:
  - `apps/user/src/app/page.tsx`
  - `apps/user/src/components/role-picker.tsx`
  - `apps/user/src/lib/mode-actions.ts`
- Made `RequestCalendar` load FullCalendar after client mount with a Thai fallback list, so a calendar runtime failure no longer crashes the whole security dashboard.
- Restarted the user dev server after cleaning `apps/user/.next` to avoid stale dev/build chunks.

### Verification

- `pnpm --filter @nacc/user lint` passed.
- `pnpm --filter @nacc/user typecheck` passed.
- `pnpm --filter @nacc/user build` passed.
- `http://localhost:3001/` returns 200 and the server HTML does not contain `Application error`.

## 2026-06-25 - Codex bugfix: security staff pages/actions

### Fixed

- Restored real security staff routes instead of redirect stubs:
  - `/security/jobs`
  - `/security/jobs/[id]`
  - `/security/history`
- Restored security navigation items in the user shell for dashboard, jobs, and history.
- Fixed security quick-job workflow so assigned jobs must be started before completion:
  - `approved -> assigned/in_progress` through accept/start actions
  - `assigned -> in_progress`
  - `in_progress -> completed`
- Locked server actions to avoid false success when a row was not updated because the job was already accepted, moved, or not assigned to the current security staff user.
- Restricted completion photo upload and completion submit to `in_progress` jobs only.

### Verification

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm build` passed for admin and user apps.

## 2026-06-25 — User app: ไม่ต้อง login + 3 บทบาท

### Done

- ลบหน้า login — หน้าแรก (`/`) เลือกบทบาท: **เจ้าหน้าที่** | **พนักงานสื่อสาร** | **รปภ.**
- Silent sign-in ด้วย demo account (`officer01`, `comms01`, `security01`) + cookie `nacc_user_mode`
- ปุ่ม **เปลี่ยนบทบาท** แทน logout
- **`/comms/*`** — ดูคำขอทั้งหมด หนังสือราชการ ประวัติสถานะ แนบไฟล์ (ไม่มีสิทธิ์อนุมัติแอดมิน)
- **`/security/dashboard`** — ปฏิทิน + งานใหม่/รับแล้ว/เสร็จ + ปุ่มใหญ่ รับงาน/ส่งงาน (popup แนบรูป)
- `acceptJobAndStart` — รับงานแล้วเริ่มทันที (กดครั้งเดียว)
- Env: `USER_APP_DEMO_PASSWORD` (default `password`)

### Manual QA

- [ ] เปิด http://localhost:3001 เลือกแต่ละบทบาท
- [ ] รปภ.: รับงาน → แนบรูป → ส่งงาน
- [ ] สื่อสาร: ดูรายการ เปิดรายละเอียด แนบหนังสือ
- [ ] เจ้าหน้าที่: บันทึกหนังสือยังใช้ได้
- [ ] ตั้ง `USER_APP_DEMO_PASSWORD` บน Vercel production

## 2026-06-25 — GitHub auto-deploy (Vercel)

### Done

- Connected `nacc-parking-admin` and `nacc-parking-user` to `Sleepingknight0/Parking_request` via `vercel git connect`.
- Push/merge to `main` → Production deploy for both apps; other branches → Preview.
- Documented workflow in `docs/DEPLOYMENT.md`.
- Added `pnpm watch:sheet` for local Supabase Realtime → Google Sheet sync.
- Added direct root `googleapis` dependency for sheet sync scripts.
- Typechecked `scripts/watch-and-sync.ts` and `scripts/push-to-sheet.ts` with TypeScript bundler resolution.

### Remaining

- [ ] Merge latest `supabase-env` into `main` if production should include commits after PR #2.
- [ ] Add Supabase Auth redirect URLs for both Vercel domains.
- [ ] Optional: delete unused Vercel projects (`user`, `parking-request-admin`).

## 2026-06-25 — Completion photos → Supabase Storage

### Done

- Switched `uploadCompletionPhoto` from Google Drive to **Supabase Storage** (`completion_photos/{requestId}/...`).
- Client compression unchanged (`browser-image-compression`, max ~1.5 MB JPEG).
- `storage_provider = supabase` for new completion photos; Google Drive code kept for legacy rows only.
- Updated `docs/ATTACHMENTS.md`, `docs/DATABASE_CONTRACT.md`.

### Required env

- `SUPABASE_SERVICE_ROLE_KEY` only (Google Drive env no longer required for new uploads).

### Manual QA

- [x] Vercel production: admin https://nacc-parking-admin.vercel.app , user https://nacc-parking-user.vercel.app
- [ ] Add Supabase Auth redirect URLs for both Vercel domains
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
