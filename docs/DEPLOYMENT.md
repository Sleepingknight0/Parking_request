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

Deploy the two Next.js apps separately:

- Admin app root: `apps/admin`
- User app root: `apps/user`

Both apps must point to the same Supabase project and use the same Auth settings.

## Production Checklist

- Change or remove demo passwords.
- Confirm RLS is enabled on all app tables.
- Confirm the storage bucket is private.
- Confirm service-role key is only available to server runtime.
- Confirm both app domains are configured in Supabase Auth redirect URLs.
- Run a manual flow test for admin, officer, and security staff.
