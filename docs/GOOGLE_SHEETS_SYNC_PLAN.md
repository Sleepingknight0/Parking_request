# Google Sheets Sync Plan

Supabase remains the source of truth.

Google Sheets must not be used as the main database in the new system. Sheets can be used as:

- a one-time legacy import source
- a reporting mirror
- a lightweight export destination

## Legacy Mapping

Legacy columns:

- `วันรับเรื่อง`
- `สำนัก`
- `เลขหนังสือ`
- `วันที่จอด`
- `เวลาที่จอด`
- `จำนวนรถ`
- `อาคารที่จอด`
- `เจ้าหน้าที่ผู้รับเรื่อง`

Mapping code lives in:

- `packages/utils/src/legacy.ts`
- `packages/utils/src/google-sheet-mapping.ts`

## Future Push Sync

Later, a Supabase Edge Function can listen to inserts/updates and push a mirrored row to Google Sheets.

Recommended flow:

1. Request is inserted or updated in Supabase.
2. Edge Function maps the request to a sheet row.
3. Google Sheets API writes the row.
4. `sheet_sync_logs` records success or failure.

## Future Pull/Edit Sync

If editing from Google Sheets is required later:

1. Use Google Apps Script.
2. Apps Script sends a signed webhook to Supabase.
3. Supabase validates the payload.
4. Supabase updates the canonical row.
5. `sheet_sync_logs` records the inbound sync.

Avoid direct two-way sync without conflict rules.
