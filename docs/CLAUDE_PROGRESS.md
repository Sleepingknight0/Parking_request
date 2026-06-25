# Claude Progress

## Loop A: Monorepo + Core Contract

Status: in progress

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

Decisions:

- Current v1 workflow is no-approval: `draft -> submitted -> assigned -> in_progress -> completed`.
- `under_review`, `approved`, and `rejected` remain reserved until a contract change activates the approval gate.
- Legacy Google Sheet data is treated as import/reference data, not the new source of truth.

Open:

- Add minimal `apps/user` scaffold to satisfy monorepo structure.
- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Fix any blocking errors.
- Mark Loop A frozen when checks pass.

## Contract Change Requests

### CCR-001: Activate Full Approval Workflow

Status: proposed

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

Pending. Do not change during Loop A without explicit approval.
