# Deployment

## Prerequisites

- Node.js 20 or newer.
- pnpm 11 or newer.
- Supabase project.
- Supabase CLI authenticated for database migrations.

## Environment Variables

Use `.env.example`, `apps/admin/.env.example`, and `apps/user/.env.example` as templates.

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=ระบบขอที่จอดรถ
NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=nacc.local
```

Recommended:

```env
NEXT_PUBLIC_ADMIN_APP_URL=https://your-admin-domain.example
NEXT_PUBLIC_USER_APP_URL=https://your-user-domain.example
```

Google Drive (security staff completion photos — user app + admin image proxy):

```env
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_SHARED_DRIVE_ID=
```

See `docs/ATTACHMENTS.md` for Drive folder and service account setup.

Never commit real secrets. `SUPABASE_SERVICE_ROLE_KEY` and Google private keys must be server-side only.

### Local development

Copy `apps/admin/.env.example` → `apps/admin/.env.local` and `apps/user/.env.example` → `apps/user/.env.local`.

- `SUPABASE_SERVICE_ROLE_KEY` is required for Supabase Storage uploads (official letters).
- Google Drive env vars are required for security staff **completion photo** uploads.
- Restart `pnpm dev` after changing env files.

### Vercel

Add the same variables under each project's **Settings → Environment Variables** (Production + Preview). Do not prefix service role or Google keys with `NEXT_PUBLIC_`.

## Database Setup

1. Link Supabase:

```bash
pnpm db:link
```

2. Apply migrations:

```bash
pnpm db:push
```

3. Seed demo/reference data:

```bash
pnpm seed
```

The seed creates the development account `admin/admin`. Change this password before production use.

## Storage

Migration `0004_storage.sql` creates the private bucket:

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

Server actions upload with the service-role key after checking application permissions.

## Realtime

Migration `0005_realtime.sql` adds `parking_requests` to the Supabase Realtime publication.

Realtime is used for request lists, dashboard counters, security job lists, and detail refreshes.

## Build

Run checks before deploy:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

## App Deployment

Deploy the two Next.js apps separately on Vercel:

| App | Vercel project | Root directory | Production URL |
|-----|----------------|----------------|----------------|
| Admin | `nacc-parking-admin` | `apps/admin` | https://nacc-parking-admin.vercel.app |
| User | `nacc-parking-user` | `apps/user` | https://nacc-parking-user.vercel.app |

Each project uses:

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@nacc/admin"
}
```

(Replace filter with `@nacc/user` for the user app.)

CLI (from repo root, after `pnpm dlx vercel login`):

```bash
pnpm dlx vercel deploy --prod --project nacc-parking-admin
pnpm dlx vercel deploy --prod --project nacc-parking-user
```

Set env vars on **both** Vercel projects (Production + Preview). Include `NEXT_PUBLIC_ADMIN_APP_URL` and `NEXT_PUBLIC_USER_APP_URL` pointing at the URLs above.

### GitHub auto-deploy

Both Vercel projects are linked to `https://github.com/Sleepingknight0/Parking_request`:

| Project | Root directory | Production branch |
|---------|----------------|-------------------|
| `nacc-parking-admin` | `apps/admin` | `main` |
| `nacc-parking-user` | `apps/user` | `main` |

**Workflow:**

- **Push or merge to `main`** → Vercel builds and deploys **Production** for both apps automatically.
- **Push to any other branch** (e.g. `supabase-env`) → **Preview** deployments (unique URLs per branch).
- Pull requests opened against `main` also get Preview deployments.

No manual `vercel deploy` is required after Git is connected. Use CLI deploy only for one-off or emergency releases.

**Reconnect Git (if dashboard shows "Connect Git Repository"):**

```bash
pnpm dlx vercel link --project nacc-parking-admin --yes
pnpm dlx vercel git connect https://github.com/Sleepingknight0/Parking_request.git

pnpm dlx vercel link --project nacc-parking-user --yes
pnpm dlx vercel git connect https://github.com/Sleepingknight0/Parking_request.git
```

**Note:** `vercel link` updates `.vercel/project.json` for one project at a time. Use `--project` to switch between admin and user for CLI deploys.

**Supabase Auth:** add redirect URLs in [Supabase Dashboard → Auth](https://supabase.com/dashboard/project/pgwpmmmsdobwvxcwlleu/auth/url-configuration):

- `https://nacc-parking-admin.vercel.app/**`
- `https://nacc-parking-user.vercel.app/**`

**Cron (admin):** Google Sheets poll runs daily (`0 2 * * *`) on Hobby plan. Upgrade to Pro for more frequent schedules.

Both apps must point to the same Supabase project and use the same Auth settings.

## Production Checklist

- Change or remove demo passwords.
- Confirm RLS is enabled on all app tables.
- Confirm the storage bucket is private.
- Confirm service-role key is only available to server runtime.
- Confirm both app domains are configured in Supabase Auth redirect URLs.
- Run a manual flow test for admin, officer, and security staff.
