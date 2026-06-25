# API Contract

The apps use shared Supabase clients and typed helper functions from `packages/db`, `packages/auth`, `packages/types`, and `packages/utils`.

## Shared Packages

- `@nacc/types`: enums, Thai labels, Zod schemas, and generated database types.
- `@nacc/db`: Supabase browser/server/service clients and query helpers.
- `@nacc/auth`: login, role routing, and route guard helpers.
- `@nacc/ui`: shadcn-style shared UI components.
- `@nacc/utils`: formatting, date helpers, legacy mapping, and Google Sheet mapping.

## Authentication

Both apps use Supabase Auth.

Login accepts a username and password. Username login is mapped to an email format in the auth layer.

Development seed account:

- username: `admin`
- password: `admin`
- role: `super_admin`

This account is for local/demo use only and must be changed before production.

## Role Routing

Admin app allowed roles:

- `super_admin`
- `admin`
- `viewer`

User app allowed roles:

- `officer`
- `security_staff`

Role home paths are defined in `packages/types/src/enums.ts`.

## Requests

Shared request query embeds are defined in `packages/db/src/queries.ts`:

- `REQUEST_LIST_SELECT`
- `REQUEST_DETAIL_SELECT`

Use these selections for request list and detail screens so both apps use the same relation shape.

## Mutations

Server actions should validate input with schemas from `packages/types/src/schemas.ts`.

Request form validation:

- drafts can be incomplete.
- submitted requests must pass `validateForSubmit`.

Cancellation:

- requires `cancellation_reason`.
- must set `cancelled_by` and `cancelled_at`.

Completion:

- requires at least one `completion_photo` attachment.
- must set `completed_by` and `completed_at`.

## Realtime

Realtime publication is configured in `supabase/migrations/0005_realtime.sql`.

Use Supabase Realtime for:

- Admin request list refresh.
- Admin dashboard counters.
- Security job list.
- Request detail status updates.

## Legacy Import

Legacy Google Sheet fields map through `packages/utils/src/legacy.ts` and `packages/utils/src/google-sheet-mapping.ts`.

Legacy sheet columns:

- `วันรับเรื่อง`
- `สำนัก`
- `เลขหนังสือ`
- `วันที่จอด`
- `เวลาที่จอด`
- `จำนวนรถ`
- `อาคารที่จอด`
- `เจ้าหน้าที่ผู้รับเรื่อง`

Supabase remains the source of truth after import.
