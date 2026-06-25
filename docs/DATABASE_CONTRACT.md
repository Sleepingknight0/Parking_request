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

## Current V1 Status Contract

The database check constraint includes all required statuses:

- `draft`
- `submitted`
- `under_review`
- `approved`
- `assigned`
- `in_progress`
- `completed`
- `cancelled`
- `rejected`

The active transition trigger currently allows only the v1 no-approval workflow:

- `draft -> submitted`
- `submitted -> assigned`
- `submitted -> cancelled`
- `assigned -> in_progress`
- `assigned -> cancelled`
- `in_progress -> completed`
- `in_progress -> cancelled`

Reserved statuses:

- `under_review`
- `approved`
- `rejected`

These are present in schema/types for compatibility with the full brief, but are not reachable until the approval workflow is explicitly activated.

## RLS Summary

- `super_admin` and `admin`: full read/write.
- `viewer`: read-only.
- `officer`: read/write own requests; update only draft/submitted unassigned requests.
- `security_staff`: read submitted/assigned/in_progress/completed/cancelled requests; update submitted or assigned-to-self jobs.
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
