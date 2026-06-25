# Claude Progress

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

- ~~No `.env.local` or app-level Supabase env files are present in the workspace.~~ Resolved: local Supabase env wired (`.env`, `apps/admin/.env.local`, `apps/user/.env.local`) pointing at `http://127.0.0.1:54321`. `pnpm supabase start` + `pnpm seed` run; demo login `admin` / `admin`.

Known follow-up:

- Regenerate official Supabase types after linking the project and restore typed runtime clients.
- Run browser QA after app env files are provided.
