# Legacy Google Sheet Import

Imports historical rows from the old NACC parking Google Sheet (`ชีต1`) into the
Supabase `parking_requests` table. Supabase remains the source of truth; the
sheet is a one-time data source, not an ongoing sync (see
`docs/GOOGLE_SHEETS_SYNC_PLAN.md` for the mirror plan).

## 1. Prepare the export

1. Open the Google Sheet → `File → Download → Comma-separated values (.csv)`.
2. Save it as `private-data/legacy.csv` in the repo root.
   - `private-data/` is **gitignored** — raw operational data (incl. real staff
     names) is never committed.

Expected columns (Thai headers, exactly as in the old sheet):

```
วันที่รับเรื่อง | สำนัก | เลขหนังสือ | วันที่จอด | เวลาที่จอด | จำนวนรถ | อาคารที่จอด | เจ้าหน้าที่ผู้รับเรื่อง
```

## 2. Column → schema mapping

| Sheet column            | Target                                                   |
| ----------------------- | -------------------------------------------------------- |
| วันที่รับเรื่อง          | `parking_requests.received_date`                         |
| สำนัก                   | `parking_requests.department_id` (matched by name)       |
| เลขหนังสือ              | `parking_requests.official_letter_no`                    |
| วันที่จอด               | `request_dates.request_date`                             |
| เวลาที่จอด              | `request_dates.start_time` / `end_time` (if parseable)   |
| จำนวนรถ                 | `parking_requests.cars_count`                            |
| อาคารที่จอด             | `requested_location_id` if matched, else `requested_location_text` |
| เจ้าหน้าที่ผู้รับเรื่อง   | `parking_requests.legacy_officer_name` (NOT an auth user) |

Every imported row also gets: `legacy_source = 'google-sheet'`,
`legacy_row_number`, `legacy_imported_at`, and `metadata.original` (the raw row).

**Status:** rows whose parking date is in the past import as `completed`;
otherwise `submitted`.

**Dates:** `DD/MM/YYYY` is accepted; Buddhist-era years (e.g. 2569) are converted
to CE automatically.

## 3. Dry run (no writes)

```bash
pnpm import:legacy --dry-run
```

Prints, per row, the resolved letter no / department / date / cars / target
status, and flags unmatched departments or free-text locations. Ends with a
summary (total, would-insert, duplicates, invalid, unmatched). **Nothing is
written.** Always run this first.

## 4. Apply (writes)

```bash
pnpm import:legacy --apply
# or a custom path:
pnpm import:legacy --apply --file=private-data/legacy-2025.csv
```

Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`
(the importer uses the service role to bypass RLS). Migrations must be applied
first (`pnpm db:push`).

## 5. Idempotency & re-runs

- De-duplication is by `official_letter_no` (the old sheet enforced uniqueness)
  plus an in-file key of letter-no + received + department + parking date.
- Re-running skips letters that already exist, so it is safe to re-run after
  adding new rows to the CSV.

## 6. Rollback

All imported rows are tagged. To remove every legacy import:

```sql
delete from public.parking_requests where legacy_source = 'google-sheet';
```

(`request_dates` rows cascade-delete with their parent.)

## 7. Notes

- Bad rows never abort the whole run — they are counted and reported.
- Unmatched departments leave `department_id` null but keep the name in
  `metadata.original`; fix them later in the Admin app or by editing the CSV.
