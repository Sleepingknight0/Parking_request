# Database Contract

This document is the human-readable contract for the Supabase PostgreSQL schema.

Authoritative implementation files:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_auth.sql`
- `supabase/migrations/0003_rls.sql`
- `supabase/migrations/0004_storage.sql`
- `supabase/migrations/0005_realtime.sql`
- `supabase/policies.sql`
- `supabase/seed.sql`
- `packages/types/src/database.types.ts`
- `packages/types/src/enums.ts`

## Source Of Truth

Supabase PostgreSQL is the source of truth. Google Sheets is legacy input and a future reporting mirror only.

## Main Entity

The main business entity is an official letter-based parking request:

`parking_requests`

Each request can have many requested dates, license plates, attachments, and status history rows.

## Tables

### profiles

User profile linked to `auth.users`.

Important fields:

- `id`
- `username`
- `display_name`
- `role`
- `phone`
- `department_id`
- `is_active`

Allowed roles:

- `super_admin`
- `admin`
- `officer`
- `security_staff`
- `viewer`

### departments

Reference table for Thai bureaus/departments.

### locations

Reference table for parking locations.

### security_officers

Reference list of comms staff who receive official letters (dropdown on comms record form).

Important fields:

- `id`
- `name_th`
- `is_active`
- `sort_order`

Managed from admin menu **เจ้าหน้าที่รับเรื่อง** (`/security-officers`).

### parking_zones

Optional child reference table for location-specific parking zones.

### parking_requests

Core request/document table.

Important fields:

- `request_no`
- `department_id`
- `created_by`
- `official_letter_no`
- `official_letter_date`
- `received_date`
- `subject`
- `contact_name`
- `contact_phone`
- `receiving_officer_id` — FK to `security_officers` (comms receiving officer)
- `requested_location_id`
- `requested_location_text`
- `date_pattern`
- `cars_count`
- `purpose`
- `status`
- `priority`
- `assigned_to`
- `assigned_by`
- `assigned_at`
- `approved_by`
- `approved_at`
- `comms_verified_by`
- `comms_verified_at`
- `metadata` — optional JSON; known keys:
  - `sign_output_method` — `print` | `handwrite` (how รปภ. chose to make cone signs)
  - `sign_output_method_at` — ISO timestamp when method was recorded

### comms_operational_settings

Singleton row (`id = true`) for shared comms special modes in the user app:

- `auto_approve_incoming` — auto-approve submitted/under_review requests (requires official letter file)
- `auto_verify_security_work` — auto-verify completed security jobs
- `rejected_by`
- `rejected_at`
- `cancelled_by`
- `cancelled_at`
- `cancellation_reason`
- `completed_by`
- `completed_at`
- `completion_note`
- `admin_note`
- `legacy_source`
- `legacy_row_number`
- `legacy_imported_at`
- `legacy_officer_name`
- `metadata`

### request_dates

One or more requested parking dates per request.

### request_license_plates

One or more license plates per request.

### request_attachments

Files attached to a request.

Allowed `file_type` values:

- `official_letter`
- `general_attachment`
- `completion_photo`
- `cancellation_evidence`

Storage fields (migration `0006_attachment_providers.sql`):

- `storage_provider` — `supabase` (default) or `google_drive`
- `external_file_id` — provider file id (Google Drive file id for completion photos)
- `external_url` — optional view link
- `thumbnail_url` — optional thumbnail link
- `metadata` — JSON (compression stats, original name/size, etc.)

Completion photos from security staff use `storage_provider = supabase` (bucket path under `completion_photos/`). Legacy rows may use `google_drive` and are served via authenticated `/api/attachments/[id]/image`.

### request_status_history

Append-only status transition history written by trigger.

### activity_logs

General audit/event log.

### sheet_sync_logs

Future Google Sheets sync log.

### request_counters

Internal request number counter used by `next_request_no()`.

## Request Number

`request_no` is generated automatically by the database using:

`PRK-YYYYMMDD-0001`

Users must not edit `request_no`.

## Status Contract

The database check constraint and active workflow include all required statuses:

- `draft`
- `submitted`
- `under_review`
- `approved`
- `assigned`
- `in_progress`
- `completed`
- `cancelled`
- `rejected`

The active transition trigger allows:

- `draft -> submitted`
- `submitted -> under_review`
- `submitted -> cancelled`
- `under_review -> approved`
- `under_review -> rejected`
- `under_review -> cancelled`
- `approved -> assigned`
- `approved -> cancelled`
- `assigned -> in_progress`
- `assigned -> cancelled`
- `in_progress -> completed`
- `in_progress -> cancelled`

## RLS Summary

- `super_admin` and `admin`: full read/write.
- `viewer`: read-only.
- `officer`: read all requests; update/delete unassigned requests in draft/submitted/under_review/approved (shared pool, not per-user).
- `security_staff`: read approved/assigned/in_progress/completed/cancelled requests; accept approved jobs or update jobs assigned to self.
- Child tables inherit request access through helper functions.

## Storage

Bucket:

`parking-request-files`

Folders:

- `official_letters`
- `completion_photos`
- `cancellation_evidence`
- `general`

Allowed MIME types and size limit are defined in `packages/types/src/enums.ts`.
