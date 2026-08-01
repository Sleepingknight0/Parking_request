# NACC Parking Request Platform

A role-based parking request and field-operations platform for the Office of the National Anti-Corruption Commission.

The monorepo contains separate administration and operational applications that share one Supabase project, PostgreSQL database, authentication system, storage layer, and TypeScript package set.

## Live applications

- [Administration application](https://nacc-parking-admin.vercel.app)
- [Operational user application](https://nacc-parking-user.vercel.app)

The production interface is localized for Thai staff. This documentation is maintained in English.

## Applications

| Application  | Package       | Local port | Primary users                                                                                     |
| ------------ | ------------- | ---------: | ------------------------------------------------------------------------------------------------- |
| `apps/admin` | `@nacc/admin` |     `3000` | Administrators and viewers managing requests, approvals, assignments, reports, and reference data |
| `apps/user`  | `@nacc/user`  |     `3001` | Officers, communications staff, and security staff completing operational workflows               |

## Core capabilities

- Register parking requests linked to official correspondence.
- Review, approve, reject, cancel, assign, and complete requests.
- Manage multiple dates, licence plates, locations, attachments, and completion photos.
- Provide role-specific dashboards, calendars, queues, and detail views.
- Generate and print security signage.
- Synchronize operational data with Google Sheets.
- Store official files in Supabase Storage and completion media through supported storage providers.
- Maintain realtime request lists and audit history.

## Technology stack

| Area                 | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Web applications     | Next.js 15, React 19, TypeScript                               |
| Interface            | Tailwind CSS, Radix UI, FullCalendar, Recharts, TanStack Table |
| Forms and validation | React Hook Form, Zod                                           |
| Platform services    | Supabase PostgreSQL, Auth, Storage, and Realtime               |
| Integrations         | Google Sheets and Google Drive APIs                            |
| Monorepo tooling     | pnpm workspaces and Turborepo                                  |
| Deployment           | Vercel with separate admin and user projects                   |

## Requirements

- Node.js 20 or newer.
- pnpm `11.0.8`, as pinned in `package.json`.
- A Supabase project.
- The Supabase CLI for linked migrations and generated types.
- Google service credentials when Sheets or Drive integrations are enabled.

## Installation

Install all workspace dependencies from the repository root:

```bash
pnpm install --frozen-lockfile
```

Create application-specific environment files:

```powershell
Copy-Item apps\admin\.env.example apps\admin\.env.local
Copy-Item apps\user\.env.example apps\user\.env.local
```

Use `.env.example` as the reference for repository scripts. Never commit any generated `.env` or `.env.local` file.

## Environment configuration

| Variable                        | Scope             | Purpose                                              |
| ------------------------------- | ----------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Both apps         | Supabase project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both apps         | Browser-safe Supabase anonymous key                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only       | Privileged storage and server operations             |
| `GOOGLE_DRIVE_CLIENT_EMAIL`     | Server only       | Google service account identity                      |
| `GOOGLE_DRIVE_PRIVATE_KEY`      | Server only       | Google service account private key                   |
| `GOOGLE_DRIVE_FOLDER_ID`        | Server only       | Target folder for Drive uploads                      |
| `GOOGLE_DRIVE_SHARED_DRIVE_ID`  | Server only       | Optional Shared Drive identifier                     |
| `GOOGLE_SHEETS_ID`              | Admin and scripts | Spreadsheet used as the operational mirror           |
| `GOOGLE_SHEETS_GID`             | Admin and scripts | Target worksheet identifier                          |
| `GOOGLE_SHEETS_TAB_NAME`        | Admin and scripts | Target worksheet name                                |
| `SYNC_WEBHOOK_SECRET`           | Both apps         | Shared secret for synchronization callbacks          |
| `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN` | Both apps         | Domain used for username-to-email mapping            |
| `NEXT_PUBLIC_ADMIN_APP_URL`     | Both apps         | Administration application URL                       |
| `NEXT_PUBLIC_USER_APP_URL`      | Both apps         | Operational application URL                          |
| `USER_APP_DEMO_PASSWORD`        | User app          | Password for the optional demonstration sign-in flow |

Never expose the service-role key or Google private key through a variable prefixed with `NEXT_PUBLIC_`.

## Database setup

Link the Supabase project, apply migrations, regenerate database types, and optionally seed reference data:

```bash
pnpm db:link
pnpm db:push
pnpm db:types
pnpm seed
```

Supabase PostgreSQL is the source of truth. Google Sheets is a controlled operational mirror, not the authoritative database.

The complete schema contract is documented in [`docs/DATABASE_CONTRACT.md`](docs/DATABASE_CONTRACT.md).

## Local development

Run both applications:

```bash
pnpm dev
```

Run one application when focused development is preferable:

```bash
pnpm dev:admin
pnpm dev:user
```

The admin application runs at `http://localhost:3000`; the user application runs at `http://localhost:3001`.

Use `pnpm dev:reset` to clear both `.next` directories before restarting the development servers.

## Request lifecycle

```text
draft -> submitted -> under_review -> approved -> assigned -> in_progress -> completed
                                  `-> rejected
```

Cancellation is allowed from `submitted`, `under_review`, `approved`, `assigned`, and `in_progress`.

The allowed roles are `super_admin`, `admin`, `officer`, `security_staff`, and `viewer`.

Do not add or rename a role or status in isolation. Update the database migration, shared types, affected application code, and contract documentation together.

## Validation

Run the required repository checks before committing:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Run the focused user-workflow test with:

```bash
pnpm --filter @nacc/user test
```

## Repository structure

```text
.
|-- apps/
|   |-- admin/                  # Administration application
|   `-- user/                   # Officer and security workflows
|-- packages/
|   |-- auth/                   # Authentication, routing, and role guards
|   |-- config/                 # Shared TypeScript and Tailwind configuration
|   |-- db/                     # Typed Supabase clients and queries
|   |-- storage/                # Supabase, Drive, and Sheets adapters
|   |-- types/                  # Domain schemas, labels, and generated DB types
|   |-- ui/                     # Shared interface components
|   `-- utils/                  # Date, format, filter, and mapping helpers
|-- supabase/
|   |-- migrations/             # Versioned schema and policy migrations
|   |-- policies.sql            # Row-level security reference
|   `-- seed.sql                # SQL seed data
|-- scripts/                    # Seed, import, synchronization, and inspection tools
|-- docs/                       # Architecture and workflow contracts
|-- package.json                # Workspace scripts and tool versions
`-- turbo.json                  # Turborepo task configuration
```

## Operational scripts

| Command              | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `pnpm seed`          | Load reference data                           |
| `pnpm seed:test`     | Load development test fixtures                |
| `pnpm import:legacy` | Import legacy request records                 |
| `pnpm push:sheet`    | Push current request data to Google Sheets    |
| `pnpm watch:sheet`   | Monitor and synchronize Google Sheets changes |
| `pnpm db:types`      | Regenerate Supabase TypeScript types          |
| `pnpm format`        | Format TypeScript, Markdown, and JSON files   |

## Documentation map

- [`docs/DATABASE_CONTRACT.md`](docs/DATABASE_CONTRACT.md) defines tables, columns, and row-level security expectations.
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) defines shared packages, actions, routes, and validation rules.
- [`docs/STATUS_WORKFLOW.md`](docs/STATUS_WORKFLOW.md) defines statuses and transitions.
- [`docs/ADMIN_FLOW.md`](docs/ADMIN_FLOW.md) and [`docs/USER_FLOW.md`](docs/USER_FLOW.md) describe role-specific journeys.
- [`docs/ATTACHMENTS.md`](docs/ATTACHMENTS.md) explains file providers and upload rules.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) documents Vercel and environment setup.
- [`docs/LEGACY_IMPORT.md`](docs/LEGACY_IMPORT.md) documents migration from legacy records.
- [`docs/GOOGLE_SHEETS_SYNC_PLAN.md`](docs/GOOGLE_SHEETS_SYNC_PLAN.md) defines synchronization behavior.
- [`AGENTS.md`](AGENTS.md) contains repository rules for automated contributors.

## Deployment

Deploy `apps/admin` and `apps/user` as separate Vercel projects. Both projects must use the same Supabase project and compatible environment variables.

Pushes to `main` trigger production deployments when the Vercel Git integration is connected. Other branches and pull requests create preview deployments.

Review [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for root directories, environment variables, authentication redirects, and the production checklist.

## Security

- Keep the Supabase service-role key and all Google credentials server-side.
- Change or remove demonstration passwords before production use.
- Confirm row-level security on every application table.
- Keep storage buckets private and serve files through authorized application routes.
- Use the same synchronization secret in both applications.
- Validate admin, officer, and security workflows before each production release.

## License

Released under the [MIT License](LICENSE).
