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
