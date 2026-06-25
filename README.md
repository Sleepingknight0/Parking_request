# NACC Parking Request System

Thai-language parking request management system for official parking request letters.

## Structure

```txt
apps/admin   Admin web app
apps/user    Officer and security staff web app
packages/*   Shared UI, auth, database, types, utils, and config
supabase/*   Migrations, RLS policies, storage setup, realtime setup, seed data
docs/*       Project contracts and progress logs
```

Both apps use the same Supabase project, PostgreSQL database, Auth system, Storage bucket, Realtime setup, and shared TypeScript packages.

## Current Status

Loop A core contract is established and the user/security vertical slice is implemented.

The active workflow is:

```txt
draft -> submitted -> under_review -> approved/rejected -> assigned -> in_progress -> completed
```

Cancellation is allowed from:

```txt
submitted
under_review
approved
assigned
in_progress
```

See:

- `docs/DATABASE_CONTRACT.md`
- `docs/API_CONTRACT.md`
- `docs/STATUS_WORKFLOW.md`
- `docs/USER_FLOW.md`
- `docs/ADMIN_FLOW.md`
- `docs/DEPLOYMENT.md`
- `docs/CLAUDE_PROGRESS.md`

## Requirements

- Node.js 20+
- pnpm 11+
- Supabase project

## Environment

Copy `.env.example` into `.env` for CLI scripts, and copy each app's `.env.example` into `.env.local` or provide the same values through your deployment environment.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=ระบบขอที่จอดรถ
NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=nacc.local
```

Optional app URLs:

```env
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3000
NEXT_PUBLIC_USER_APP_URL=http://localhost:3001
```

Never commit real secrets.

## Development

Install dependencies:

```bash
pnpm install
```

Run both apps:

```bash
pnpm dev
```

Run Admin only:

```bash
pnpm dev:admin
```

Run User only:

```bash
pnpm dev:user
```

If Admin or User shows **Runtime TypeError** (`Cannot read properties of undefined (reading 'call')`) or a blank error page in dev, the local `.next` cache is usually stale (often after running `pnpm build` while `pnpm dev` is still running). Reset and restart:

```bash
pnpm dev:reset
```

Or stop dev, run `pnpm clean:next`, then `pnpm dev` again. **Do not run `pnpm build` while `pnpm dev` is active.**

Checks:

```bash
pnpm lint
pnpm typecheck
```

## Supabase Setup

Apply migrations to the shared Supabase project:

```bash
pnpm db:link
pnpm db:push
```

Seed data:

```bash
pnpm seed
```

Storage bucket:

```txt
parking-request-files
```

Folder convention:

```txt
official_letters/
completion_photos/
cancellation_evidence/
general/
```

## Development Login

Seed account:

```txt
Username: admin
Password: admin
Role: super_admin
```

This is for development/demo only. Change the password before real deployment.

## Notes For Agents

Read `AGENTS.md` before coding. Do not change statuses, roles, or schema without updating the contract docs and migrations.
