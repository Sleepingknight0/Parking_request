# Google Sheets ↔ Supabase Bidirectional Sync

**Supabase is always the source of truth.** The Google Sheet is a live mirror that staff can also edit directly.

---

## Column layout (A – AN)

Columns A-K stay compatible with the old Streamlit/Google Sheet workflow. Column K remains the Supabase UUID used by Apps Script. Columns L-AN are a detailed Supabase mirror so the Sheet has the same operational context as the app.

| Col | Thai header | Direction | Notes |
|-----|-------------|-----------|-------|
| A | วันที่รับเรื่อง | Supabase → Sheet | Auto-managed; read-only in Sheet |
| B | สำนัก | ↔ Bidirectional | Edit triggers department lookup by name |
| C | เลขหนังสือ | ↔ Bidirectional | |
| D | วันที่จอด | ↔ Bidirectional | Updates first `request_dates` row |
| E | เวลาที่จอด | ↔ Bidirectional | Format: `HH.MM-HH.MM` or `HH.MM` |
| F | จำนวนรถ | ↔ Bidirectional | |
| G | อาคารที่จอด | ↔ Bidirectional | Stored as `requested_location_text` |
| H | เจ้าหน้าที่ผู้รับเรื่อง | ↔ Bidirectional | Stored as `legacy_officer_name` |
| I | สถานะ | Supabase → Sheet | Auto-updated; do not edit |
| J | เลขที่คำขอ | Supabase → Sheet | PRK-... auto number |
| K | _id | System | Supabase UUID; can hide column but do NOT delete |
| L | วันที่หนังสือ | Supabase → Sheet | Read-only mirror |
| M | เรื่อง | Supabase → Sheet | Read-only mirror |
| N | รูปแบบวันที่ | Supabase → Sheet | Read-only mirror |
| O | วันที่จอดทั้งหมด | Supabase → Sheet | Multiple dates separated by line breaks |
| P | เวลาเริ่ม | Supabase → Sheet | Multiple rows separated by line breaks |
| Q | เวลาสิ้นสุด | Supabase → Sheet | Multiple rows separated by line breaks |
| R | ทะเบียนรถทั้งหมด | Supabase → Sheet | Multiple plates separated by line breaks |
| S | หมายเหตุรถ | Supabase → Sheet | Multiple notes separated by line breaks |
| T | สถานที่จากรายการ | Supabase → Sheet | Location reference name |
| U | สถานที่ระบุเอง | Supabase → Sheet | Free-text location |
| V | เหตุผล/รายละเอียด | Supabase → Sheet | Read-only mirror |
| W | ความสำคัญ | Supabase → Sheet | Read-only mirror |
| X | ผู้สร้างรายการ | Supabase → Sheet | Profile display name |
| Y | ผู้รับผิดชอบ รปภ. | Supabase → Sheet | Assigned staff profile |
| Z | วันที่มอบหมาย | Supabase → Sheet | Read-only mirror |
| AA | ผู้อนุมัติ | Supabase → Sheet | Read-only mirror |
| AB | วันที่อนุมัติ | Supabase → Sheet | Read-only mirror |
| AC | ผู้ยกเลิก | Supabase → Sheet | Read-only mirror |
| AD | วันที่ยกเลิก | Supabase → Sheet | Read-only mirror |
| AE | เหตุผลยกเลิก | Supabase → Sheet | Read-only mirror |
| AF | ผู้ส่งงาน | Supabase → Sheet | Read-only mirror |
| AG | วันที่เสร็จ | Supabase → Sheet | Read-only mirror |
| AH | หมายเหตุส่งงาน | Supabase → Sheet | Read-only mirror |
| AI | สื่อสารยืนยันงาน | Supabase → Sheet | Read-only mirror |
| AJ | วันที่สื่อสารยืนยัน | Supabase → Sheet | Read-only mirror |
| AK | จำนวนไฟล์แนบ | Supabase → Sheet | Count from `request_attachments` |
| AL | จำนวนรูปส่งงาน | Supabase → Sheet | Count of `completion_photo` attachments |
| AM | วันที่สร้าง | Supabase → Sheet | Read-only mirror |
| AN | วันที่แก้ไขล่าสุด | Supabase → Sheet | Read-only mirror |

Row 1 = header. Data starts at row 2. The system writes the header automatically on first sync.

---

## Setup checklist

### 1. Share the Google Sheet with the service account

The service account email is in your `.env.local`:
```
GOOGLE_DRIVE_CLIENT_EMAIL=nacc-parking-streamlit@nacc-parking-streamlit.iam.gserviceaccount.com
```

In your Google Sheet → Share → paste the service account email → give it **Editor** access.

### 2. Enable Google Sheets API in Google Cloud

In the Google Cloud Console for project `nacc-parking-streamlit`:
1. APIs & Services → Library → search "Google Sheets API" → Enable

(Google Drive API should already be enabled; Sheets needs to be enabled separately.)

### 3. Verify env vars in apps/admin/.env.local

```env
GOOGLE_SHEETS_ID=1OxrxKBKNTRb3vMBPA-91i-E1KIGB52RTZ31si2OaKz0
GOOGLE_SHEETS_TAB_NAME=ชีต1
SYNC_WEBHOOK_SECRET=change-me-before-deploy   # ← CHANGE THIS
GOOGLE_DRIVE_CLIENT_EMAIL=nacc-parking-streamlit@...
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 4. Apply the database migration

Paste in Supabase → SQL Editor and run:

```sql
alter table public.parking_requests
  add column if not exists sheet_row       integer,
  add column if not exists sheet_synced_at timestamptz;

create unique index if not exists uq_requests_sheet_row
  on public.parking_requests(sheet_row)
  where sheet_row is not null;
```

### 5. Run the backfill (links existing rows to Supabase records)

```bash
curl -X POST http://localhost:3000/api/sync/backfill \
  -H "x-sync-secret: change-me-before-deploy"
```

This reads all Sheet rows, matches each by `เลขหนังสือ` column C, fills the full A-AN mirror row from Supabase, and writes `sheet_row` back to the DB.

### 6. Install Google Apps Script (Sheet → Supabase direction)

In your Google Sheet:
1. Extensions → Apps Script
2. Delete any existing code, paste the script below
3. Set `WEBHOOK_SECRET` + `WEBHOOK_URL` to match your deploy
4. Save → Run → `installTrigger` (grants permissions)

```javascript
// ── NACC Parking → Supabase sync ──────────────────────────────────────────
const WEBHOOK_URL = "https://YOUR-ADMIN-APP.vercel.app/api/sync/webhook";
const WEBHOOK_SECRET = "change-me-before-deploy";  // Must match SYNC_WEBHOOK_SECRET
const SHEET_NAME = "ชีต1";
const ID_COLUMN = 11;   // Column K (1-indexed)
const HEADER_ROW = 1;

// Only B-H are editable from Sheet → Supabase.
// A, I-K, and all detailed mirror columns L-AN are Supabase-managed.
const EDITABLE_COLS = new Set([2, 3, 4, 5, 6, 7, 8]); // B-H

function onEditHandler(e) {
  try {
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();
    if (row <= HEADER_ROW) return;
    if (!EDITABLE_COLS.has(col)) return;

    // Get the Supabase UUID from column K
    const id = sheet.getRange(row, ID_COLUMN).getValue();
    if (!id) return;  // Row not yet linked to Supabase

    const colLetter = columnToLetter(col);
    const value = String(e.value ?? e.range.getValue() ?? "");

    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-sync-secret": WEBHOOK_SECRET },
      payload: JSON.stringify({ id, row, column: colLetter, value }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    console.error("onEdit sync error:", err);
  }
}

function columnToLetter(col) {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/** Run once to install the edit trigger. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onEditHandler")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  SpreadsheetApp.getUi().alert("Trigger installed.");
}

/** Manual backfill button — pulls latest data from Supabase to Sheet. */
function runBackfill() {
  const backfillUrl = WEBHOOK_URL.replace("/webhook", "/backfill");
  const res = UrlFetchApp.fetch(backfillUrl, {
    method: "post",
    headers: { "x-sync-secret": WEBHOOK_SECRET },
    muteHttpExceptions: true,
  });
  const r = JSON.parse(res.getContentText());
  SpreadsheetApp.getUi().alert(
    "Backfill: matched=" + r.matched + " skipped=" + r.skipped
  );
}
```

---

## How it works

### Supabase → Sheet (automatic on every mutation)

```
Admin action (create/update/status change)
  └─ syncRequestToSheet(id)          [apps/admin/src/lib/sheet-sync.ts]
       └─ fetch request from Supabase (with joins, dates, plates, attachments)
       └─ buildLiveSheetRow()        [packages/utils/google-sheet-mapping.ts]
       └─ appendSheetRow() if new    [packages/storage/google-sheets.ts]
          OR updateSheetRow() if sheet_row already set
       └─ write sheet_row + sheet_synced_at back to DB
```

### Sheet → Supabase (via Apps Script onEdit)

```
Staff edits cell B-H
  └─ Apps Script onEditHandler
       └─ POST /api/sync/webhook     [apps/admin/src/app/api/sync/webhook/route.ts]
            └─ parseSheetChange()    [packages/utils/google-sheet-mapping.ts]
            └─ update parking_requests or request_dates in Supabase
            └─ log to sheet_sync_logs
```

### Optional: Supabase Database Webhook (for user-app mutations)

Set up in Supabase Dashboard → Database → Webhooks:
- Table: `parking_requests`, Events: Insert + Update
- URL: `https://YOUR-ADMIN-APP.vercel.app/api/sync/push`
- Headers: `x-sync-secret: YOUR_SYNC_WEBHOOK_SECRET`

This triggers `/api/sync/push` which does the same push as `sheet-sync.ts` but is called by Supabase directly (useful when Codex's user app changes status).

---

## Conflict resolution

Supabase wins on conflict. Sheet edits flow immediately to Supabase; if Supabase already changed since the last Sheet refresh, the DB value is authoritative.

`sheet_sync_logs` table stores all push/pull events for debugging. Supabase remains the source of truth for detailed columns L-AN; edit those fields in the app, then run backfill or wait for webhook push.

---

## Vercel deploy env vars (admin app)

```
GOOGLE_SHEETS_ID=1OxrxKBKNTRb3vMBPA-91i-E1KIGB52RTZ31si2OaKz0
GOOGLE_SHEETS_TAB_NAME=ชีต1
SYNC_WEBHOOK_SECRET=<random-strong-secret>
GOOGLE_DRIVE_CLIENT_EMAIL=nacc-parking-streamlit@nacc-parking-streamlit.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY=<full private key including -----BEGIN/END PRIVATE KEY----->
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Sheet not updating | Sheets API enabled? Sheet shared with service account? `GOOGLE_SHEETS_ID` correct? |
| Apps Script not sending | `installTrigger()` run? Secret matches? App URL correct? Check Apps Script execution log. |
| Backfill skips rows | Row must have a matching `เลขหนังสือ` value in Supabase's `official_letter_no` |
| `Cannot insert into read-only column` | Apps Script trying to write a managed column — verify `EDITABLE_COLS` only includes B-H |
| Duplicate `sheet_row` error | Two records matched same row — run backfill again; or manually clear `sheet_row` in SQL |
