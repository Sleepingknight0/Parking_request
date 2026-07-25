# ระบบขอที่จอดรถ — NACC Parking Request System

Parking request management for the Office of the National Anti-Corruption Commission (สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ — ป.ป.ช.). Requests are filed against official letters, reviewed and approved by admins, then assigned to security staff who complete the job on site.

Two separate Next.js apps share one Supabase project, database, auth, storage bucket, and set of TypeScript packages. All user-facing UI is Thai.

**[Live admin app →](https://parking-request-admin.vercel.app)**

| App | Package | Port | Audience |
|-----|---------|------|----------|
| `apps/admin` | `@nacc/admin` | 3000 | Admins and officers — review, approve, assign, dashboard, calendar, reports |
| `apps/user` | `@nacc/user` | 3001 | Requesters and security staff — submit requests, run assigned jobs on mobile |

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · Supabase (Postgres, Auth, Storage, Realtime) · Turborepo + pnpm workspaces · FullCalendar · TanStack Table · Recharts · react-hook-form + Zod · Google Sheets and Google Drive integrations.

## Requirements

- Node.js **20+**
- pnpm **11.0.8** (pinned via `packageManager`)
- A Supabase project, plus the Supabase CLI for migrations
- A Google service account if you need Sheets sync or Drive photo uploads

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env`, then copy the values into `apps/admin/.env.local` and `apps/user/.env.local`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; required for Storage uploads (official letters) |
| `GOOGLE_DRIVE_CLIENT_EMAIL` / `GOOGLE_DRIVE_PRIVATE_KEY` / `GOOGLE_DRIVE_FOLDER_ID` | Security staff completion photos |
| `GOOGLE_DRIVE_SHARED_DRIVE_ID` | Optional; set when the folder lives on a Shared Drive |
| `GOOGLE_SHEETS_ID` / `GOOGLE_SHEETS_GID` / `GOOGLE_SHEETS_TAB_NAME` | Sheets mirror of request data |
| `SYNC_WEBHOOK_SECRET` | Shared secret for the sync webhook |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN`, `NEXT_PUBLIC_ADMIN_APP_URL`, `NEXT_PUBLIC_USER_APP_URL` | App identity and cross-app links |

`SUPABASE_SERVICE_ROLE_KEY` and the Drive private key are server-only — never expose them behind a `NEXT_PUBLIC_` name.

Apply the database schema:

```bash
pnpm db:link      # link the Supabase CLI to your project
pnpm db:push      # apply supabase/migrations
pnpm db:types     # regenerate packages/types/src/database.types.ts
pnpm seed         # optional: reference + sample data
```

## Develop

```bash
pnpm dev          # both apps
pnpm dev:admin    # admin only  → localhost:3000
pnpm dev:user     # user only   → localhost:3001
```

Before committing, run the checks `AGENTS.md` requires:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm dev:reset` clears both `.next` directories first, for when the dev server gets into a bad state.

## Workflow

```text
draft → submitted → under_review → approved → assigned → in_progress → completed
                                 ↘ rejected
```

Cancellation is allowed from `submitted`, `under_review`, `approved`, `assigned`, and `in_progress`.

Roles: `super_admin` · `admin` · `officer` · `security_staff` · `viewer`

These sets are fixed. Adding a status or role means updating the migration, `packages/types`, and `docs/STATUS_WORKFLOW.md` together — see `AGENTS.md`.

## Layout

```text
apps/
  admin/          @nacc/admin — review, approval, dashboard, calendar, reports
  user/           @nacc/user  — request form, officer flow, security staff jobs
packages/
  auth/           Supabase Auth helpers, session and role guards
  db/             typed Supabase client and queries
  storage/        Supabase Storage + Google Drive upload adapters
  types/          shared types, including generated database.types.ts
  ui/             shared Thai-language components
  utils/          shared helpers
  config/         shared lint / TS / Tailwind config
supabase/
  migrations/     0001_init → 0011_security_officers
scripts/          seeding, legacy import, Sheets push/watch, Drive inspection
docs/             contracts and flow documentation
```

## Scripts

| Command | Does |
|---------|------|
| `pnpm seed` / `pnpm seed:test` | Reference data / test fixtures |
| `pnpm import:legacy` | Import the legacy CSV request records |
| `pnpm push:sheet` | One-off push of request data to Google Sheets |
| `pnpm watch:sheet` | Watch and continuously sync to Google Sheets |
| `pnpm format` | Prettier across `ts,tsx,md,json` |

## Docs

Read these before changing the schema or the request lifecycle:

- `docs/DATABASE_CONTRACT.md` — tables, columns, RLS expectations
- `docs/API_CONTRACT.md` — server actions and route contracts
- `docs/STATUS_WORKFLOW.md` — status transitions and who may perform them
- `docs/ADMIN_FLOW.md` · `docs/USER_FLOW.md` — end-to-end journeys
- `docs/ATTACHMENTS.md` — file upload and storage behaviour
- `docs/DEPLOYMENT.md` — Vercel setup and environment variables
- `docs/GOOGLE_SHEETS_SYNC_PLAN.md` · `docs/LEGACY_IMPORT.md` — integrations
- `AGENTS.md` — conventions for AI agents working in this repo

## Deploy

Both apps deploy to Vercel from this monorepo, each with its own project root (`apps/admin`, `apps/user`) and its own environment variables. See `docs/DEPLOYMENT.md`.

## License

MIT — see [LICENSE](LICENSE).
