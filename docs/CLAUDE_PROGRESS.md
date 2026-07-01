# Claude Progress

## 2026-06-25 — 🔴 FIX: กู้ admin middleware (session หลุดทุกการนำทาง)

**อาการ:** ล็อกอินเข้า /dashboard ได้ แต่คลิกไปหน้าอื่นแล้วเด้งออก login ทุกครั้ง ("พังเละทุกอย่าง").

**ต้นเหตุ:** commit `45fdab0` ("Removed middleware files") ลบ `apps/admin/src/middleware.ts` + `apps/user/src/middleware.ts` ทิ้ง → ไม่มีตัว refresh/persist Supabase session ต่อ request → session ไม่ถูกเขียนกลับ → หลุดหลังหน้าแรก.

**แก้:** สร้าง `apps/admin/src/middleware.ts` กลับมา (เรียก `updateSession` จาก `@nacc/db/middleware`).
- ⚠️ **อย่าลบไฟล์นี้อีก** — Supabase SSR จำเป็นต้องมี middleware.
- ปรับจากเดิม: เพิ่ม `/no-access` เป็น public + ตัด `/api/*` ออกจาก matcher (กัน demo-enter/sync ถูก redirect).
- **ไม่** กู้ user middleware (user app เปลี่ยนเป็น no-login cookie mode แล้ว).

**ยืนยัน:** click-nav / curl reload (ส่ง cookie) / idle — session เสถียรครบทุกหน้า. (อาการ reload หลุดที่เห็นตอนเทสต์เป็น artifact ของ playwright `open` = เปิด context ใหม่ไม่พก cookie ไม่ใช่บั๊กจริง.) typecheck + lint ผ่าน.

## 2026-06-25 — Admin: รายงาน + เอกสารราชการ + Audit + นำเข้าข้อมูล (Claude)

### Done

- **เอกสารราชการ/PDF** — route group `(print)` (auth, no shell) + print CSS ใน `globals.css`
  - `/reports/print` — รายงานสรุปทั้งระบบ (ต่อยอดร่วมกับ Cursor)
  - `/requests/[id]/print` — ใบคำขอรายฉบับ (ไฟล์ใหม่ของ Claude)
  - `report-document-actions.tsx` — ปุ่มพิมพ์/บันทึก PDF
- **Audit log** — `/activity` + `audit-log-view.tsx`, `audit-filters.tsx`, `lib/activity-labels.ts` (กรองตามผู้ทำ/การกระทำ/วันที่ + ส่งออก CSV)
- **นำเข้าข้อมูลเก่า (UI)** — `/import` + `legacy-importer.tsx` + `lib/import-actions.ts` (server action, dry-run/apply, reuse `normalizeLegacyRow`)
- เพิ่ม nav `/activity` + `/import` (admin only) ใน `app-shell.tsx`

### เส้นแบ่งโซนกับ Cursor (กันแก้ทับ)

- **Claude ถือ:** `(print)/**`, `report-*`, `lib/report-summary.ts`, `audit-*`, `lib/activity-labels.ts`, `legacy-importer.tsx`, `lib/import-actions.ts`, `/activity`, `/import`
- **Cursor ถือ:** `app-shell` (Claude แตะแค่เพิ่ม nav), dashboard, requests list (`admin-requests-panel`), calendar, settings
- ⚠️ `/reports` + `charts.tsx` + `report-summary.ts` เป็นพื้นที่ร่วม — แก้แล้วบอกกันก่อน

### Verification

- `pnpm typecheck` (admin) passed
- `pnpm lint` (admin) passed
- `pnpm build` (admin) passed — route ใหม่ `/activity`, `/import`, `/requests/[id]/print` ไม่มี collision

## Loop A: Monorepo + Core Contract

Status: frozen

Completed:

- Root pnpm workspace scaffold exists.
- Admin Next.js app scaffold exists in `apps/admin`.
- Shared packages exist for UI, DB, auth, types, utils, and config.
- Supabase migrations exist for schema, auth helpers, RLS, storage, and realtime.
- Seed SQL and seed script exist.
- Admin app has initial pages and shared components.
- Core docs added:
  - `AGENTS.md`
  - `docs/DATABASE_CONTRACT.md`
  - `docs/API_CONTRACT.md`
  - `docs/STATUS_WORKFLOW.md`
  - `docs/GOOGLE_SHEETS_SYNC_PLAN.md`
- Minimal User Next.js app scaffold exists in `apps/user`.
- Root `README.md` exists with setup, env, Supabase, seed, and demo-login notes.
- `pnpm install` completed.
- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.

Decisions:

- Active workflow is the full approval workflow: `draft -> submitted -> under_review -> approved/rejected -> assigned -> in_progress -> completed`.
- Cancellation is allowed from `submitted`, `under_review`, `approved`, `assigned`, and `in_progress`.
- Legacy Google Sheet data is treated as import/reference data, not the new source of truth.

Open:

- Admin app already has a broad scaffold, but needs Loop B/C hardening and browser QA.
- User app is scaffold only and needs Loop User Flow implementation.
- Supabase runtime clients are currently untyped to keep checks passing with the hand-authored stand-in database types. Regenerate official types with `pnpm db:types` after linking the hosted Supabase project, then restore typed client generics.

## Contract Change Requests

### CCR-001: Activate Full Approval Workflow

Status: accepted and implemented

Request:

Activate the full requested workflow:

`submitted -> under_review -> approved/rejected -> assigned`

Reason:

The product brief requests admin approval states and dashboard labels for pending approval.

Affected files:

- `supabase/migrations/0001_init.sql`
- `supabase/policies.sql`
- `packages/types/src/enums.ts`
- Admin status actions
- User app security/officer visibility rules
- `docs/DATABASE_CONTRACT.md`
- `docs/STATUS_WORKFLOW.md`

Decision:

Implemented across schema trigger, RLS, shared status transitions, Admin actions, User visibility/actions, and contract docs.

## Loop User Flow: Officer + Security Vertical Slice

Status: implemented, pending runtime QA

Completed:

- Added role-guarded user layouts:
  - `apps/user/src/app/officer/layout.tsx`
  - `apps/user/src/app/security/layout.tsx`
- Added user shell with desktop sidebar and mobile bottom navigation.
- Added officer flow:
  - dashboard with counters and latest requests
  - request list
  - new request form using shared `requestFormSchema`
  - draft/submitted edit route before assignment
  - draft save and submit actions
  - request detail
  - official letter/general attachment upload
  - cancellation with required reason while submitted/under_review/approved and unassigned
- Added security staff flow:
  - dashboard counters
  - job list
  - job detail
  - accept job
  - mark in progress
  - upload completion photos
  - complete job with required completion photo
  - cancel job with required reason
  - work history
- Removed app middleware imports from both apps; protected route groups now use server-side layout guards.
- Added `outputFileTracingRoot` in both Next configs to avoid workspace-root warnings.
- Activated full approval workflow in Admin and User flows:
  - submitted -> under_review
  - under_review -> approved/rejected
  - approved -> assigned
  - assigned -> in_progress
  - in_progress -> completed
- Added realtime refresh to the User App shell for officer/security pages when `parking_requests` changes.
- Repaired page-level mojibake in Thai UI strings from prior editing.
- Added app/root `.env.example` templates.
- Added `docs/USER_FLOW.md`, `docs/ADMIN_FLOW.md`, and `docs/DEPLOYMENT.md`.

Verification:

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes for both apps.

Runtime QA blocker:

- Hosted Supabase project `Parking_request` (`pgwpmmmsdobwvxcwlleu`) linked in env files. Migrations 0001–0005 applied; reference seed (45 departments, 10 locations) loaded. `SUPABASE_SERVICE_ROLE_KEY` still needs pasting from dashboard before `pnpm seed` and file-upload server actions work.

Known follow-up:

- Regenerate official Supabase types after linking the project and restore typed runtime clients.
- Run browser QA after app env files are provided.

## Session: Legacy importer + QA (Claude)

- Built `scripts/import-legacy.ts` (`pnpm import:legacy --dry-run | --apply [--file=]`):
  maps the 8 old sheet columns -> schema, matches departments/locations by name,
  de-dupes by `official_letter_no`, tolerates bad rows, prints a summary, tags
  rows with `legacy_source='google-sheet'` + `legacy_*` columns. Past-dated rows
  import as `completed`, else `submitted`. Validated it loads/runs (graceful
  "file not found" exit when no CSV present).
- Added `docs/LEGACY_IMPORT.md` (mapping, dry-run/apply, dedupe, rollback).
- Fixed the supabase-js `never` write-types root cause: rewrote
  `packages/types/src/database.types.ts` to use standalone Row/Insert aliases
  (no self-reference through `Database[...]`), so table payloads stay concrete.

Workflow note (IMPORTANT - supersedes an earlier decision):

- An earlier grilling chose a SIMPLIFIED workflow (draft->submitted->assigned...,
  no approval gate). The codebase was later converted by Codex/Cursor to the FULL
  brief workflow (submitted->under_review->approved->assigned->in_progress->
  completed, plus rejected). All layers are now CONSISTENT on the full workflow:
  `enums.ts` STATUS_TRANSITIONS, the SQL `is_valid_status_transition` trigger,
  RLS policies, and both apps' action buttons. No internal mismatch remains. If
  the simpler real-world flow is preferred later, change all four places together.

Full-suite verification (this session):

- `pnpm install`, `pnpm lint`, `pnpm typecheck` (8 packages), and
  `pnpm build` (both apps: 16 admin + 13 user routes) all PASS.

Remaining to be usable end-to-end:

- Paste `SUPABASE_SERVICE_ROLE_KEY` into `.env` / Vercel, then `pnpm seed`
  (creates admin/admin + demo accounts + sample requests).
- Optional: drop a Sheet CSV at `private-data/legacy.csv` and run
  `pnpm import:legacy --dry-run` then `--apply`.

## 2026-06-25 — Cursor: สื่อสารหน้าหลักรวมรายการแบบแท็บ

- `/comms/dashboard` ใช้ `CommsRequestsList` พร้อมแท็บ **ต้องจัดการ** เป็นค่าเริ่มต้น
- แท็บกรองสถานะ + ค้นหา + การ์ดมือถือเหมือนหน้า `/comms/requests`

## 2026-07-01 — Codex: ขยาย Google Sheets mirror ให้ละเอียดขึ้น

- ตรวจงาน Cursor ก่อนแก้:
  - `FEATURE_FLAGS` ปิดฟีเจอร์แนบหนังสือราชการ, บังคับแนบไฟล์, badge เตือนไฟล์, และฟิลด์ผู้ประสานงาน/เบอร์โทรไว้แล้ว
  - dropdown ขั้นตอนเอกสารมีใน admin / officer / comms และไม่มีในฝั่ง รปภ.
- ขยาย Google Sheets live mirror จาก A-K เป็น A-AN โดยคง A-K เดิมไว้เพื่อไม่ทำลาย Sheet/Apps Script เก่า
- เพิ่มคอลัมน์รายละเอียดจาก Supabase: วันที่หนังสือ, เรื่อง, รูปแบบวันที่, วันที่จอดทั้งหมด, เวลาเริ่ม/สิ้นสุด, ทะเบียน, สถานที่, เหตุผล, priority, ผู้สร้าง, ผู้รับผิดชอบ, ผู้อนุมัติ, ยกเลิก, ส่งงาน, comms verification, จำนวนไฟล์แนบ, จำนวนรูปส่งงาน, created/updated timestamps
- เพิ่ม `apps/admin/src/lib/sheet-row.ts` เป็น helper กลางสำหรับสร้าง `LiveSheetRequest` จาก Supabase joins เพื่อให้ `sheet-sync.ts`, `/api/sync/push`, และ `/api/sync/backfill` ใช้ row shape เดียวกัน
- ปรับ `packages/storage/src/google-sheets.ts` และ `scripts/push-to-sheet.ts` ให้เขียน/อ่าน/format ช่วง A-AN แทน A-K
- อัปเดต `docs/GOOGLE_SHEETS_SYNC_PLAN.md` และ `docs/DATABASE_CONTRACT.md` ให้ระบุว่า Supabase เป็น source of truth; Sheet แก้กลับได้เฉพาะ B-H ส่วน L-AN เป็น mirror รายละเอียดจาก Supabase

Verification:

- `pnpm typecheck` passed
- `pnpm lint` passed

Follow-up debug:

- Ran `pnpm push:sheet`; first run failed because the live Google Sheet only had 26 columns while the new mirror writes through column AN.
- Added column-count expansion before formatting/writing in `scripts/push-to-sheet.ts` and `packages/storage/src/google-sheets.ts`.
- Re-ran `pnpm push:sheet`; it succeeded and updated the live Sheet header to A-AN.
- Confirmed linked Supabase project `pgwpmmmsdobwvxcwlleu` currently has `parking_requests_count = 0`, so there are no request rows to push yet.
- Re-verified `pnpm typecheck` and `pnpm lint` pass.
