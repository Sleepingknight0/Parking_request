# AGENTS.md

## Project

This is a Thai government-style parking request management system for NACC parking letters.

There are two separated web apps:

- `apps/admin`
- `apps/user`

Both apps share the same Supabase project, PostgreSQL database, Supabase Auth, Supabase Storage bucket, realtime setup, and shared TypeScript packages.

## Hard Rules

1. Do not change database schema without updating:
   - `docs/DATABASE_CONTRACT.md`
   - Supabase migration
   - shared TypeScript types
   - affected app code

2. Do not invent status names. Use only:
   - `draft`
   - `submitted`
   - `under_review`
   - `approved`
   - `assigned`
   - `in_progress`
   - `completed`
   - `cancelled`
   - `rejected`

3. Do not invent role names. Use only:
   - `super_admin`
   - `admin`
   - `officer`
   - `security_staff`
   - `viewer`

4. All user-facing UI must be Thai.

5. Admin app code lives in `apps/admin`.

6. User app code lives in `apps/user`.

7. Shared code belongs in:
   - `packages/ui`
   - `packages/types`
   - `packages/db`
   - `packages/auth`
   - `packages/utils`
   - `packages/config`

8. Before stopping after code changes, run:
   - `pnpm lint`
   - `pnpm typecheck`

9. Update `docs/CLAUDE_PROGRESS.md` after every development loop.

10. If blocked, write the blocker clearly in the relevant progress document.

## Current Contract Freeze

Loop A freezes the current v1 contract as documented in `docs/DATABASE_CONTRACT.md`, `docs/API_CONTRACT.md`, and `docs/STATUS_WORKFLOW.md`.

The database enum includes the full requested statuses. The active v1 workflow currently uses:

`draft -> submitted -> assigned -> in_progress -> completed`

Cancellation is allowed from `submitted`, `assigned`, and `in_progress`.

The requested approval gate statuses `under_review`, `approved`, and `rejected` are reserved in the schema but not active in the v1 transition trigger. Activate them only through a documented Contract Change Request.

## Ownership

### Claude

Primary owner of architecture, database, migrations, RLS policies, admin app, dashboard, calendar, reports, and request management.

### Codex

Primary owner of user app, officer flow, security staff flow, request form, job workflow, mobile UX, and user-side tests.

### Cursor

Primary owner of integration, merge conflict resolution, UI polish, refactor, consistency checks, TypeScript fixes, lint fixes, and final QA.

Cursor must not redesign the database without explicit instruction.

## Development Protocol

Before coding:

1. Read this file.
2. Read `docs/DATABASE_CONTRACT.md`.
3. Read `docs/API_CONTRACT.md`.
4. Read `docs/STATUS_WORKFLOW.md`.
5. Check current branch.
6. Check git status.

After coding:

1. Run checks.
2. Fix errors.
3. Update progress document.
4. Summarize what changed and what remains.
