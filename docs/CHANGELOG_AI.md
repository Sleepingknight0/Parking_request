# AI Changelog

## 2026-06-25

- Added agent coordination instructions in `AGENTS.md`.
- Added core contract docs for database, API, status workflow, and Google Sheets sync.
- Added progress log with Loop A state and first Contract Change Request.
- Added minimal `apps/user` Next.js scaffold with login, role selection, officer pages, and security staff pages.
- Added root README with setup, env, Supabase, seed, and demo-login notes.
- Fixed workspace checks by adding user ESLint config and aligning runtime Supabase clients with the current hand-authored database type state.
- Verified `pnpm lint` and `pnpm typecheck` pass.
- Implemented user app officer vertical slice: guarded layout, dashboard, request list, new request form, request detail, file upload, and cancellation.
- Added officer request edit route for draft/submitted unassigned requests.
- Implemented user app security vertical slice: guarded layout, dashboard, job list, job detail, accept/start/complete/cancel actions, completion/cancellation upload, and history.
- Removed app middleware to avoid Supabase Edge runtime warnings; protected routes now rely on server layout guards.
- Added `outputFileTracingRoot` to both Next configs.
- Verified `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Activated full approval workflow across database transition trigger, RLS policies, shared status transitions, Admin actions, User security visibility, and contract docs.
- Repaired mojibake in page-level Thai UI strings introduced during prior editing.
- Added realtime refresh to the User App shell so officer and security pages refresh when requests change.
- Added root/admin/user environment examples and deployment/admin/user flow docs.
