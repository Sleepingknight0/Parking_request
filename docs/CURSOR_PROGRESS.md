# Cursor Progress

## 2026-06-25 - Codex parity: admin evidence preview + sign tools

### Added

- Admin request detail now previews attachments inline like the User app:
  - images open in an in-page dialog
  - PDFs open in an in-page dialog
  - DOC/DOCX still open in a new tab because browser inline preview is not reliable
- Admin can upload completion photos from request detail.
- Admin completion-photo upload supports multiple images at once and server-side validation restricts completion evidence to JPG/PNG/WebP.
- Attachment preview cards can show uploader names when profile data is available.
- Admin request detail now has a cone-sign panel:
  - preview signs on screen without downloading files
  - switch between print and handwrite styles
  - open printable/PDF sign route at `/requests/[id]/signs/print`
- Admin can now assign approved work to active `security_staff` and reassign active assigned/in-progress work.
- Copied `THSarabunIT9.ttf` into the admin app so printed signs render like the User app.

### Verification

- `pnpm --filter @nacc/admin lint` passed.
- `pnpm typecheck` passed.
- `pnpm --filter @nacc/admin build` passed.
- `pnpm --filter @nacc/user build` passed.
- Restarted local dev servers on ports 3000 and 3001; both roots return 200 without `Application error`.

## 2026-06-25 — Admin production UI parity (ฝั่ง User)

- **Dashboard** (`admin-dashboard-content.tsx`): layout แบบ officer — stat 6 ช่อง (3 คอลัมน์), ปฏิทินด่วน 3 วัน + งานที่ต้องจัดการ (max 10 รายการ), ส่วนวิเคราะห์แยกด้านล่าง
- **รายการคำขอ**: การ์ดทุกขนาดหน้าจอ, ลิงก์ปฏิทินที่หน้า `/requests`, ปุ่มดูทั้งหมดบน dashboard
- **ปฏิทิน**: รายการมือถือมีเวลา/subtitle, breakpoint `md` แทน `lg`
- **รายงาน**: กราฟมือถือ + breakdown เป็นการ์ดบนมือถือ, ปุ่มส่งออกเต็มความกว้างบนมือถือ
- **บันทึกกิจกรรม**: การ์ดบนมือถือ, ตารางบน desktop
**ยืนยันหลัง reproduce (2026-06-25):** ไม่มี log ใหม่เพราะถอน instrumentation แล้ว (ป้องกัน regression) — `GET /dashboard 200` ปกติ, โค้ดไม่มี `useReactTable`/debug fetch — **ปิด debug loop**

---

## 2026-06-25 — แก้ Admin ค้างทั้งหน้า (รอบสุดท้าย)

**หลักฐานจาก log (`debug-5acb27.log`):**
- **H1 ยืนยัน:** render storm — `renderCount` พุ่ง 2→40+ ภายใน ~200ms ตอนโหลด dashboard
- **H2 ปฏิเสธ:** การกรองใช้เวลา 0.01–0.17ms ไม่ใช่สาเหตุ
- debug `fetch` ทุก render สร้าง log ~39,000 บรรทัด → ทำให้เบราว์เซอร์ค้าง

**แก้:**
- เขียน `AdminRequestsPanel` ใหม่แบบเดียวกับ `CommsRequestsList` — card list ทุกขนาดหน้าจอ, ไม่ใช้ `useReactTable`
- ถอน debug instrumentation ทั้งหมด
- ใช้ `setQueue`/`setQuery` ตรงๆ แทน `useTransition`
- หน้า `/assignments` เปลี่ยนปุ่ม "มอบหมายงาน" → "ดูรายละเอียด"

---

## 2026-06-25 — เอาเมนูการมอบหมายงานออกจากแอดมิน

- ลบลิงก์ `/assignments` ออกจาก sidebar ใน `app-shell.tsx`
- หน้า `/assignments` ยังเข้าได้ทาง URL โดยตรง (ติดตามสถานะ) แต่ไม่แสดงในเมนู

---

## 2026-06-25 — เอาผู้ใช้งานออกจากการมอบหมายงาน

- ลบปุ่ม/ dialog เลือกผู้รับผิดชอบใน `RequestActions`
- งาน `approved` แสดงข้อความรอ รปภ. รับทราบเองในแอปผู้ใช้
- `assignRequest` server action ปิดใช้งาน (คืน error)
- หน้า `/assignments` อัปเดตคำอธิบายเป็นติดตามสถานะ

---

## 2026-06-25 — Admin ค้างทั้งหน้า + ป้ายกรวย รปภ.

### Admin freeze (dashboard / ทุกปุ่มไม่ตอบ)

**สาเหตุ:** debug instrumentation (`fetch` ไป `127.0.0.1:7504`) ค้างรอ timeout บน server render ทุกครั้งที่ `router.refresh()` ทำงาน ร่วมกับ RealtimeRefresh ที่ refresh ถี่ (~2.5s)

**แก้ (รอบ 2 — คลิกแท็บค้าง):**
- ถอด `RealtimeRefresh` ออกจาก `AppShell` (refresh วนลูปจาก Supabase realtime ทำให้ UI ค้างทั้งหน้า)
- ปุ่มอัปเดตข้อมูลด้วยมือ (`AdminManualRefresh`) แทน
- `AdminRequestsPanel`: `useTransition` สำหรับแท็บ/ตัวกรอง, นับ queue แบบ single-pass, stabilize table row models
- `ChartFrame`: debounce ResizeObserver ด้วย rAF

### ป้ายกรวย — เขียนมือ / PDF (user app)

- เขียนมือ: แสดงตัวอย่างก่อน → กดยืนยันถึงรับทราบงาน
- PDF/PNG: ดาวน์โหลดซ้ำได้ → กดยืนยันถึงปิด
- ยก `SecuritySignMethodDialog` ออกจาก conditional render เพื่อไม่ให้ dialog หายเมื่อสถานะเปลี่ยน

---

## 2026-06-25 — Admin: แก้ปุ่มค้าง / ตัวกรอง / viewer / มือถือ

### Bugs found & fixed

1. **ตัวกรองคำขอค้าง (RequestSearchToolbar)** — `ThaiDateInput` เรียก `showPicker()` ใน Dialog ทำให้บางเบราว์เซอร์แข็ง → ใช้ `<Input type="date">` ใน dialog แทน
2. **Radix Select ค่าว่าง** — `value=""` ในฟอร์มคำขอและ dialog มอบหมายทำให้ Select crash/ไม่ตอบสนอง → ใช้ sentinel `__none__` และ map ก่อนส่ง server
3. **แถบนำทางมือถือบังปุ่ม** — fixed bottom nav ทับ pagination/ปุ่มล่าง → เพิ่ม `pb-[calc(4.25rem+safe-area)]` ที่ shell
4. **บทบาท viewer** — ปุ่มสร้าง/แก้ไข/มอบหมายยังแสดงแต่ action ล้มเหลว → ซ่อนปุ่มสร้าง, `RequestActions` read-only, ซ่อนอัปโหลดไฟล์
5. **ตัวกรองรายงาน/audit ไม่ sync URL** — กด back แล้ว state ค้าง → `useEffect` sync จาก `initial` props
6. **`/activity` ไม่มี role guard** — viewer เข้า URL ตรงได้ → `requireProfile({ roles: ["super_admin","admin"] })`

### Already fixed (prior session, verified still in place)

- กราฟ Recharts ว่าง (`ChartFrame` + mobile fallbacks)
- ปฏิทิน FullCalendar (`<style data-fullcalendar>` + dynamic import)
- Realtime refresh debounce 2.5s
- Nav ตามบทบาท viewer
- Users manager Select `__none__`

### Verification

- `pnpm --filter @nacc/admin typecheck` passed
- `pnpm --filter @nacc/admin lint` passed
- `pnpm --filter @nacc/admin build` passed

### Files touched

- `packages/ui/src/components/request-search-toolbar.tsx`
- `apps/admin/src/components/app-shell.tsx`
- `apps/admin/src/components/request-actions.tsx`
- `apps/admin/src/components/request-form.tsx`
- `apps/admin/src/components/report-filters.tsx`
- `apps/admin/src/components/audit-filters.tsx`
- `apps/admin/src/app/(app)/dashboard/page.tsx`
- `apps/admin/src/app/(app)/requests/page.tsx`
- `apps/admin/src/app/(app)/requests/[id]/page.tsx`
- `apps/admin/src/app/(app)/activity/page.tsx`

### How to verify (manual)

| หน้า | ทดสอบ |
|------|--------|
| `/dashboard` | กราฟ/สถิติโหลด, แผงงานคลิกได้, ปุ่มสร้าง (admin เท่านั้น) |
| `/requests` | ค้นหา, เปิดตัวกรอง → เลือกวันที่ → ใช้ตัวกรอง (ไม่ค้าง), pagination มือถือ |
| `/requests/[id]` | ปุ่ม workflow ทำงาน (admin), viewer เห็นรายละเอียดอย่างเดียว |
| `/calendar` | ปฏิทิน desktop + รายการมือถือ, คลิก event ไปรายละเอียด |
| `/assignments` | การ์ดมือถือ + ตาราง desktop ลิงก์ได้ |
| `/reports` | preset วันนี้/สัปดาห์, กราฟ trend, ส่งออก CSV |
| `/activity` | กรอง + export (admin เท่านั้น) |
| `/login` | admin/admin เข้าได้ |

### Remaining blockers

- หากยังเจอ **500 Internal Server Error** หลัง build: รัน `pnpm clean:next` แล้ว `pnpm dev:admin` ใหม่ (`.next` เสียหาย)
- Sheet sync ใน Settings ต้องตั้งค่า Google Sheets + secret จริงก่อนใช้งาน production

## 2026-06-25 — Admin: แก้กราฟ Dashboard + ปฏิทินว่าง

### Root causes

1. **กราฟ Recharts ว่าง** — `ResponsiveContainer` วัดขนาด parent ตอน mount; เมื่อ parent อยู่ใน `hidden lg:block` / `hidden lg:grid` ได้ width = 0 ทำให้ SVG ไม่วาดและไม่ recover
2. **ปฏิทิน FullCalendar ว่าง** — FC v6 inject CSS ผ่าน JS; ใน Next.js ต้องมี `<style data-fullcalendar>` เป็น anchor + โหลดแบบ dynamic import (client-only) + `aspectRatio`/`min-height` ชัดเจน
3. **มือถือไม่มีกราฟ** — dashboard ซ่อนกราฟทั้งหมดด้วย `hidden lg:*` โดยไม่มี fallback

### Fixes

- **`ChartFrame`** — ResizeObserver + ส่ง `width`/`height` ตรงไป `BarChart` แทน `ResponsiveContainer`
- **`charts.tsx`** — ใช้ `ChartFrame` ทุกกราฟ, ปิด animation
- **`dashboard-chart-mobile.tsx`** — สรุปแนวโน้ม/สถานะ/สำนัก/วันที่แบบ mini-bar บนมือถือ
- **`dashboard/page.tsx`** — แสดง mobile summaries (`lg:hidden`) + กราฟเต็มบน desktop (`hidden lg:block`)
- **`request-calendar.tsx`** — dynamic import FullCalendar, error boundary, fallback รายการ
- **`layout.tsx`** — `<style data-fullcalendar />` ใน body
- **`next.config.ts`** — transpile `@fullcalendar/*`
- **`admin-mobile-calendar.tsx`** — fallback แสดง 14 วันล่าสุดถ้าไม่มีงานข้างหน้า

### Verification

- `pnpm -C apps/admin typecheck` passed
- `pnpm -C apps/admin lint` passed
- `pnpm -C apps/admin build` passed

### Files touched

- `apps/admin/src/components/chart-frame.tsx` (new)
- `apps/admin/src/components/calendar-event.ts` (new)
- `apps/admin/src/components/dashboard-chart-mobile.tsx` (new)
- `apps/admin/src/components/charts.tsx`
- `apps/admin/src/components/request-calendar.tsx`
- `apps/admin/src/components/admin-mobile-calendar.tsx`
- `apps/admin/src/app/(app)/dashboard/page.tsx`
- `apps/admin/src/app/layout.tsx`
- `apps/admin/next.config.ts`

## 2026-06-25 — User app: ปรับปรุงป้ายกรวย รปภ. (landscape, black text, preview gallery)

### Changes

- **เลย์เอาต์** — ป้ายแนวนอนเต็มหน้า (A4 landscape) ตัวอักษรสีดำทั้งหมด ฟอนต์ TH Sarabun IT9
- **ลำดับความสำคัญ** — บน: สำนัก · กลาง (ใหญ่สุด): ทะเบียน · ถ้าไม่มีทะเบียน: กลาง=สำนัก บน=เลขหนังสือ+จำนวนคัน · กลางชั้น: อาคาร/วันที่ · ล่าง: รายละเอียด
- **เขียนมือ** — ไม่ดาวน์โหลดอัตโนมัติ แสดง `SecuritySignPreviewGallery` บนหน้าจอ (เลื่อนดูหลายป้าย) + กลับมาดูได้จากหน้ารายละเอียดงาน
- **พิมพ์** — หลังเลือก “พิมพ์แปะกรวย” ให้เลือก PDF หรือ PNG แยกกัน
- **metadata** — ยังบันทึก `sign_output_method` เหมือนเดิม ไม่มี migration

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

### Files touched

- `apps/user/src/lib/security-sign-layout.ts` (new)
- `apps/user/src/lib/security-sign-data.ts`
- `apps/user/src/lib/security-sign-export.ts`
- `apps/user/src/components/security-sign-print-card.tsx`
- `apps/user/src/components/security-sign-preview-gallery.tsx` (new)
- `apps/user/src/components/security-sign-examples-panel.tsx` (new)
- `apps/user/src/components/security-sign-method-dialog.tsx`
- `apps/user/src/components/security-sign-print-actions.tsx`
- `apps/user/src/app/security/jobs/[id]/page.tsx`
- `apps/user/src/app/(print)/security/signs/[id]/print/page.tsx`
- `apps/user/src/app/globals.css`
- `packages/types/src/security-sign.ts`

### How to test

1. `pnpm --filter @nacc/user dev` → โหมด รปภ. → งาน `approved` → **รับทราบงานนี้**
2. **เขียนมือ** — ไม่มีไฟล์ดาวน์โหลด มีแกลเลอรีในหน้าต่าง → ปิดแล้วเปิด `/security/jobs/[id]` เห็น “ตัวอย่างป้ายเขียนมือ”
3. **พิมพ์** — เลือก PDF (หน้าพิมพ์ landscape) หรือ PNG (ดาวน์โหลดรูป) จาก dialog หรือหน้ารายละเอียด

## 2026-06-25 — User app: รปภ. sign export + TH Sarabun IT9 font

### Feature

- **รับทราบงานนี้** — dialog ให้เลือก 2 ทาง: โหลด PDF/รูปภาพ (`พิมพ์แปะกรวย`) หรือแบบคัดลอกเขียนมือ (`เขียนมือ`)
- **ป้ายกรวย** — สร้างป้ายต่อทะเบียน (หรือต่อจำนวนคัน) ด้วยฟอนต์ **TH Sarabun IT9** จาก `apps/user/public/fonts/THSarabunIT9.ttf`
- **ส่งออก** — PNG ดาวน์โหลดอัตโนมัติ + หน้าพิมพ์ `/security/signs/[id]/print` สำหรับ PDF
- **แท็ก** — บันทึก `sign_output_method` ใน `parking_requests.metadata` แล้วแสดง badge บนการ์ด/หน้ารายละเอียด

### Font

- คัดลอกจาก `Downloads/THSarabunIT9/.../THSarabunIT๙.ttf` → `apps/user/public/fonts/THSarabunIT9.ttf`
- `@font-face` ใน `apps/user/src/styles/security-sign-font.css` ชี้ `/fonts/THSarabunIT9.ttf`
- Canvas export โหลดฟอนต์ผ่าน `FontFace` API
- ลบ `@fontsource/sarabun` (ไม่ใช้แล้ว)

### Schema

- ไม่มี migration ใหม่ — ใช้ `metadata` JSONB ที่มีอยู่
- อัปเดต `docs/DATABASE_CONTRACT.md` ระบุ keys `sign_output_method`, `sign_output_method_at`

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

### Files touched

- `apps/user/public/fonts/THSarabunIT9.ttf` (new)
- `apps/user/src/styles/security-sign-font.css` (new)
- `apps/user/src/lib/security-sign-font.ts` (new)
- `apps/user/src/lib/security-sign-data.ts` (new)
- `apps/user/src/lib/security-sign-export.ts` (new)
- `apps/user/src/lib/request-actions.ts`
- `apps/user/src/components/security-sign-method-dialog.tsx` (new)
- `apps/user/src/components/security-sign-method-badge.tsx` (new)
- `apps/user/src/components/security-sign-print-card.tsx` (new)
- `apps/user/src/components/security-sign-print-actions.tsx` (new)
- `apps/user/src/components/security-quick-job-card.tsx`
- `apps/user/src/components/security-job-actions.tsx`
- `apps/user/src/app/(print)/layout.tsx`
- `apps/user/src/app/(print)/security/signs/[id]/print/page.tsx` (new)
- `apps/user/src/app/security/jobs/[id]/page.tsx`
- `apps/user/src/app/globals.css`
- `packages/types/src/security-sign.ts` (new)
- `packages/types/src/index.ts`
- `docs/DATABASE_CONTRACT.md`

### How to test

1. `pnpm --filter @nacc/user dev` → เข้าโหมด รปภ. → `/security/dashboard`
2. งานสถานะ `approved` → กด **รับทราบงานนี้** → เลือกวิธีทำป้าย
3. ตรวจ PNG ดาวน์โหลด, หน้าพิมพ์ (print mode), badge `พิมพ์แปะกรวย` / `เขียนมือ`

## 2026-06-25 — Admin: แก้ nav + รายงานรายวัน/สัปดาห์/เดือน

### Bugs fixed

- **เมนูตามบทบาท** — ซ่อน สำนัก/สถานที่/ผู้ใช้ สำหรับ `viewer` (เดิมคลิกแล้วเด้งไป `/no-access` นอก shell)
- **แถบล่างมือถือ** — ปุ่ม "เพิ่มเติม" เน้นสีเมื่ออยู่หน้ามอบหมาย/ตั้งค่า/ฯลฯ; active state ใช้ nav ที่กรองตามบทบาท
- **ตัวกรองคำขอ** — กัน crash เมื่อ `request_dates` ว่าง (`applyRequestListFilters`)
- **ฟอร์มผู้ใช้** — Select สำนักใช้ค่า `__none__` แทน string ว่าง (Radix Select)
- **การมอบหมาย** — รายการแบบการ์ดบนมือถือ (เดิมมีแต่ตาราง desktop)

### Reports added / enhanced

- **ช่วงเวลา** — ปุ่มลัด วันนี้ / สัปดาห์นี้ / เดือนนี้ / ปีนี้ + กรองวันที่รับหนังสือ
- **กราฟ** — `PeriodTrendChart` รายวัน / รายสัปดาห์ / รายเดือน บนหน้า `/reports`
- **ตารางสรุป** — แยกรายวัน, รายสัปดาห์, รายเดือน, สำนัก, สถานที่, สถานะ
- **ส่งออก** — CSV รายละเอียด + CSV สรุปหลายหมวด; PDF/หนังสือราชการ ผ่าน `/reports/print`
- **Shared** — `buildReportTrend`, `weekStartIso` / `monthStartIso` / `yearStartIso` ใน `@nacc/utils`

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

### Files touched

- `apps/admin/src/components/app-shell.tsx`
- `apps/admin/src/components/report-filters.tsx`
- `apps/admin/src/components/report-export.tsx`
- `apps/admin/src/lib/report-summary.ts`
- `apps/admin/src/app/(app)/reports/page.tsx`
- `apps/admin/src/app/(print)/reports/print/page.tsx`
- `apps/admin/src/app/(app)/assignments/page.tsx`
- `apps/admin/src/components/users-manager.tsx`
- `apps/admin/src/app/(app)/dashboard/page.tsx`
- `packages/utils/src/date.ts`
- `packages/utils/src/request-list-filters.ts`
- `packages/types/src/labels.ts`

## 2026-06-25 — Admin UI: ปรับให้เข้ากับ User app

### Done

- **Shell** — h-14 header, longest-match nav active, RealtimeRefresh ใน shell, drawer มือถือกว้างขึ้น
- **รายการคำขอ** — แท็บหมวดงาน (ต้องจัดการ / รอตรวจ / รอมอบหมาย / …) + ค้นหา/ตัวกรองแบบ user + การ์ดมือถือ + ตาราง desktop
- **หน้าหลัก** — สถิติ compact + แผงงานที่ต้องจัดการเป็นหลัก, กราฟวิเคราะห์บน desktop
- **ปฏิทิน** — รายการรายวันบนมือถือ + FullCalendar บน desktop
- **Shared** — `request-list-filters` ใน `@nacc/utils`, `RequestSearchToolbar` ใน `@nacc/ui`

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

### ยังไม่ทำ (รอบถัดไป)

- Detail sheet บนมือถือ, assignments แบบการ์ด, ปรับหน้า reports/settings

## 2026-06-25 — สื่อสาร: รายการแบบแท็บบนหน้าหลัก

### Done

- หน้าหลักสื่อสาร (`/comms/dashboard`) แสดงรายการแบบเดียวกับหน้ารายการ — แท็บกรอง + ค้นหา + การ์ดมือถือ
- แท็บใหม่ **ต้องจัดการ** (รออนุมัติ + รอตรวจงานรปภ.) เป็นค่าเริ่มต้นบนหน้าหลัก
- แท็บอื่น: ทั้งหมด / รออนุมัติ / ดำเนินการรปภ. / รอตรวจงานรปภ. / ยืนยันแล้ว (มีตัวเลขนับ)
- การ์ดที่ต้องโต้ตอบเน้นสี (เหลือง = รออนุมัติ, ส้ม = รอตรวจงาน)
- ลิงก์ปฏิทินด้านล่างรายการบนหน้าหลัก
- โหมดพิเศษยังอยู่ด้านบนเหมือนเดิม
- ข้อความ UI ชัดว่าเป็น **ระดับระบบ** (เก็บใน DB ปิดหน้าก็ยังเปิดอยู่)

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

## 2026-06-25 — สื่อสาร: โหมดพิเศษ (อนุมัติ/ยืนยันอัตโนมัติ)

### Done

- การ์ด **โหมดพิเศษ** บนหน้าหลักสื่อสาร (เด่น สีม่วง/เหลือง)
- ปุ่ม **อนุมัติคำขออัตโนมัติ** — คำขอรออนุมัติ + ใหม่ (ต้องมีไฟล์หนังสือ) + เตือนสีแดงเมื่อเปิด
- ปุ่ม **ยืนยันงาน รปภ. อัตโนมัติ** — ปิดงานที่ รปภ. ส่งแล้วโดยไม่ต้องกดยืนยันเอง
- ตั้งค่าร่วมกันทั้งระบบ (`comms_operational_settings`) + migration `0010`
- ทำงานทันทีเมื่อเปิด (รวมคำขอค้าง) และเมื่อเจ้าหน้าที่ส่งคำขอ / รปภ. ปิดงาน

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed
- Migration applied on Supabase

## 2026-06-25 — User app: เลือกบทบาทอย่างเดียว (ไม่ล็อกอิน)

### Done

- เลือกบทบาทแล้วเข้าได้ทันที — เก็บแค่ cookie `nacc_user_mode` ไม่เรียก Supabase Auth
- ข้อมูลทั้งหมดใน user app ใช้ service client (`getUserAppDb`) ผ่านการตรวจโหมด
- เปลี่ยนบทบาท = ลบ cookie กลับหน้าแรก (ไม่ signOut)
- แสดงชื่อบทบาทใน shell แทนชื่อบัญชีส่วนตัว

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

## 2026-06-25 — สื่อสารบันทึกหนังสือเอง (ส่ง รปภ. ทันที)

### Done

- หน้า `/comms/requests/new` — ฟอร์มบันทึกเหมือนเจ้าหน้าที่ (`OfficerRequestForm` variant `comms`)
- `createCommsRequest` — กดบันทึกแล้วสถานะ `approved` ทันที (ข้ามรออนุมัติ)
- ปุ่ม nav **บันทึก** + ลิงก์จากหน้าหลักและรายการ

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

## 2026-06-25 — พนักงานสื่อสาร: อนุมัติ + ยืนยันงาน รปภ. + mobile UX

### Done

- Migration `0009_comms_verification.sql` — ฟิลด์ `comms_verified_by` / `comms_verified_at`
- Actions: รับเข้าตรวจสอบ, อนุมัติ (ต้องมีไฟล์หนังสือ), ไม่อนุมัติ, ยืนยันงานสำเร็จหลัง รปภ. เสร็จ
- แท็ก **รอสื่อสารตรวจสอบ** / **ยืนยันโดยสื่อสารแล้ว** ในรายการและหน้ารายละเอียด
- หน้ารายการ + หน้าหลัก: การ์ดมือถือ, ค้นหา, ตัวกรอง, หมวดงาน (รออนุมัติ / รปภ. / รอตรวจ / ยืนยันแล้ว)
- Sheet รายละเอียด + preview ไฟล์แนบ + ปุ่มดำเนินการ
- API `/api/comms/requests/[id]` สำหรับโหลดรายละเอียดในโหมดสื่อสาร

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

## 2026-06-25 — รปภ. หน้างาน + ประวัติ (production UX)

### Done

- หน้า `/security/jobs` และ `/security/history` เปลี่ยนจากตาราง prototype เป็นรายการการ์ดแบบมือถือ (แตะเปิดรายละเอียด)
- แถบค้นหา + ปุ่ม **ตัวกรอง** (วันที่จอด / สำนัก / สถานะ) ใช้ `RequestSearchToolbar` ร่วมกับเจ้าหน้าที่
- สถานะใน filter ใช้ป้ายภาษา รปภ. (`รอรับทราบ`, `รับทราบแล้ว`, …)
- ค้นหาทะเบียนรถได้ (`matchesSecurityJobSearch`)
- สรุปสถิติด้านบน: งาน — รอรับทราบ / งานของฉัน / ทั้งหมด · ประวัติ — เสร็จแล้ว / ยกเลิก / ทั้งหมด
- การ์ดแสดงความเร่งด่วน (`SecurityPrepBadge`), สถานะ, สถานที่·คัน, วันเวลา, ทะเบียน, เลขหนังสือ
- Component ใหม่: `SecurityJobsList`, `SecurityHistoryList`, `SecurityJobListCard`

### Verification

- `pnpm typecheck` passed
- `pnpm lint` passed

## 2026-06-25 - Codex UX pass: officer attachments and dashboards

### Done

- Kept the existing officer request form flow, but added an official-letter attachment card inside the form.
- Submit now requires at least one official-letter file for new requests unless an existing edit already has one.
- Selected official-letter files upload immediately after request save/submit using the existing Supabase Storage attachment action.
- Rebuilt officer dashboard around daily work: search, selected-date summary, calendar, request cards, and missing-letter warnings.
- Rebuilt comms dashboard for verification: search, selected-date view, calendar, missing-letter warnings, and quick detail links.
- Fixed `RequestCalendar` fallback routing so officer/comms fallback links open the right detail page.
- Removed duplicate `addDaysIso` re-export from `security-job-utils` and updated the remaining mobile calendar import.

### Verification

- `pnpm --filter @nacc/user lint` passed.
- `pnpm --filter @nacc/user typecheck` passed.
- `pnpm --filter @nacc/user build` passed after cleaning stale `.next`.
- Restarted `pnpm dev:user`; `http://localhost:3001/` returns 200 without `Application error`.

## 2026-06-25 — รปภ. mobile dashboard UX

### Done (รอบ 5 — ปฏิทินแยกหน้าทุกฝ่าย)

- **เจ้าหน้าที่:** `/officer/calendar` + nav + ปฏิทินด่วนบนหน้าหลัก
- **สื่อสาร:** `/comms/calendar` + nav + ปฏิทินด่วนบนหน้าหลัก
- Component ร่วม: `ParkingCalendarView`, `ParkingMobileCalendar`, `buildParkingCalendarEvents`

- หน้าใหม่ `/security/calendar` — ปฏิทินเต็ม (มือถือ + เดสก์ท็อป)
- Nav รปภ.: หน้าหลัก | **ปฏิทินจอดรถ** | งานที่ได้รับ | ประวัติ
- หน้าหลัก: เหลือ **ปฏิทินด่วน** เฉพาะวันนี้–3 วันข้างหน้า + ปุ่ม "ปฏิทินเต็ม"

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

- [x] Merge `supabase-env` into `main` และลบ branch แล้ว (2026-06-25)
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

## 2026-06-25 — Officer/Comms dashboard layout (3×2 grid + filter bar)

### Done

- `StatCard` — added `compact` prop for smaller mobile-friendly stat tiles (`packages/ui/src/components/states.tsx`).
- `DashboardFilterBar` — shared search + date filter with labels, clear-search button, Thai date hint, and optional action slot (`apps/user/src/components/dashboard-filter-bar.tsx`).
- Officer dashboard — stat cards in `grid-cols-3` (3×2), shorter labels, new filter bar with “บันทึกใหม่” action, list header shows search + count.
- Comms dashboard — same stat grid + filter bar pattern; list header aligned with officer.

### Checks

- `pnpm typecheck` — pass
- `pnpm lint` — pass

## 2026-06-25 — Attachment preview + request detail popup (officer)

### Done

- `AttachmentPreviewGallery` / `AttachmentPreviewSection` — grid thumbnails + dialog preview for images/PDF (like completion photos); shared in `@nacc/ui`.
- Officer request detail page — official letters & attachments use preview gallery instead of download-only links.
- `OfficerRequestDetailSheet` — tapping a request from list/dashboard opens detail in a popup (no page navigation).
- `GET /api/requests/[id]` — loads request + signed attachment URLs for the sheet.

### Checks

- `pnpm typecheck` — pass
- `pnpm lint` — pass

## 2026-06-25 — Officer shared pool + mobile requests list

### Done

- Wording: `คำขอของฉัน` → `รายการคำขอทั้งหมด`; dashboard/role picker use communal Thai copy (ไม่เน้น username/ของคุณ).
- Nav: short labels for mobile bottom bar (`หน้าหลัก`, `รายการคำขอ`, `บันทึกใหม่`).
- `OfficerRequestsList` — mobile-first card list with search + status chips (replaces desktop table on requests page).
- `DashboardFilterBar` — `hideDate` prop for search-only use.
- RLS migration `0008_officer_shared_requests.sql` — officers read/update all unassigned requests (shared pool).
- `request-actions` — removed `created_by` filter on officer update/cancel.
- Updated `DATABASE_CONTRACT.md` + `policies.sql` summary.

### Deploy note

- Apply migration `0008_officer_shared_requests.sql` on hosted Supabase (`pnpm db:push` or migrate deploy).

### Checks

- `pnpm typecheck` — pass
- `pnpm lint` — pass

## 2026-06-25 — ปิด bypass login ผู้ดูแลจาก user app

### Done

- การ์ด **ผู้ดูแลสูงสุด** บนหน้าแรก user app → redirect ไป `{ADMIN_APP_URL}/login` แทน silent sign-in
- ลบ `/api/auth/demo-enter` ออกจาก admin app
- ปรับข้อความหน้าเลือกบทบาท: ผู้ดูแลระบบต้องล็อกอิน
- ลบ `ADMIN_DEMO_*` จาก `.env.example` (ไม่ใช้แล้ว)

### Checks

- `pnpm lint` — pass
- `pnpm typecheck` — pass

## 2026-06-25 — ปิดฟีเจอร์แนบหนังสือ/ผู้ประสานงาน + dropdown ขั้นตอนเอกสาร

### Done

- `packages/types/src/feature-flags.ts` — ปิดชั่วคราว (โค้ดยังอยู่):
  - `officialLetterAttachments`
  - `officialLetterRequired`
  - `officialLetterIndicators`
  - `contactFields`
- ซ่อน UI แนบไฟล์หนังสือราชการ, badge/บังคับแนบไฟล์, ฟิลด์ผู้ประสานงาน/เบอร์โทร ทุกฝั่ง admin / officer / comms (รปภ. ยังแนบรูปส่งงานได้ตามเดิม)
- Dropdown **ขั้นตอนเอกสาร** 5 ขั้น (map สถานะ DB เดิม):
  1. รออนุมัติ → `under_review` / `submitted`
  2. อนุมัติแล้ว → `approved`
  3. รอดำเนินการ → `assigned`
  4. ยืนยันการจัดที่จอดรถ → `in_progress`
  5. เสร็จสิ้น → `completed`
- ฟอร์มสร้างคำขอ (admin / officer / comms): เลือกขั้นตอนก่อนส่ง
- หน้ารายละเอียด (admin / officer / comms): แก้ไขขั้นตอนใน panel ประวัติ
- `walkToDocumentProgress` — เดิน transition ทีละขั้นตาม DB trigger
- ฝั่ง รปภ. **ไม่มี** dropdown ขั้นตอน (ตามที่ขอ)

### Re-enable later

ตั้งค่าใน `packages/types/src/feature-flags.ts` เป็น `true` เมื่อพร้อมใช้งาน

### Checks

- `pnpm lint` — pass
- `pnpm typecheck` — pass

## 2026-06-25 — เจ้าหน้าที่ที่รับเรื่อง (ฝ่ายสื่อสาร)

### Done

- Migration `0011_security_officers.sql` — ตาราง `security_officers` + FK `receiving_officer_id` (seed 13 รายชื่อ)
- Admin: เมนู **เจ้าหน้าที่รับเรื่อง** (`/security-officers`)
- Comms form: dropdown ใต้ช่อง **เรื่อง** + ข้อความแนะนำให้ Admin เพิ่มชื่อ
- Sheet sync column H ใช้ชื่อจาก `receiving_officer` / `legacy_officer_name`

### Deploy note

- รัน migration บน Supabase: `pnpm db:push` (ต้อง `supabase link` ก่อน)

### Checks

- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm --filter @nacc/user test` — 17/17 pass

## 2026-06-25 — เจ้าหน้าที่ที่รับเรื่อง (ทุกฟอร์มบันทึกหนังสือ)

### Done

- Dropdown **เจ้าหน้าที่ที่รับเรื่อง** แสดงในทุกฟอร์มบันทึกหนังสือ: officer, comms, admin (create + edit)
- ลบเงื่อนไข `isComms` ใน `officer-request-form.tsx`
- บันทึก `receiving_officer_id` + `legacy_officer_name` ใน officer/admin request actions
- Helper ร่วม: `listActiveSecurityOfficers`, `receivingOfficerDbFields` ใน `packages/db/queries.ts`
- หน้ารายละเอียด officer แสดงชื่อเจ้าหน้าที่ที่รับเรื่อง
- Migration `0011` apply บน Supabase hosted แล้ว (ตาราง + seed 13 รายชื่อ)

### สาเหตุ Local dropdown ว่าง (ก่อนแก้)

1. Migration ยังไม่ถูก apply บน DB จริง → ตาราง `security_officers` ไม่มี
2. โค้ดเดิมแสดง dropdown เฉพาะโหมด comms เท่านั้น

### Checks

- `pnpm lint` — pass
- `pnpm typecheck` — pass
