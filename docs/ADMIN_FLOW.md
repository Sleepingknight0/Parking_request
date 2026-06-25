# Admin Flow

## Login

The Admin app is for:

- `super_admin`
- `admin`
- `viewer`

`viewer` can read data only. `super_admin` and `admin` can manage requests, reference data, users, assignments, and status changes.

## Request Workflow

1. Officer submits a request, or admin creates one.
2. Admin opens `/requests` or `/dashboard`.
3. Admin moves `submitted` to `under_review`.
4. Admin approves or rejects:
   - `under_review -> approved`
   - `under_review -> rejected`
5. Admin assigns an approved request to security staff:
   - `approved -> assigned`
6. Admin or assigned security staff can mark in progress:
   - `assigned -> in_progress`
7. Completion requires at least one `completion_photo` attachment:
   - `in_progress -> completed`
8. Cancellation requires a reason and is allowed from:
   - `submitted`
   - `under_review`
   - `approved`
   - `assigned`
   - `in_progress`

## Main Screens

- `/dashboard`: status counters, cars today, letters today, unassigned work, charts, and recent requests.
- `/requests`: searchable/filterable request table with export.
- `/requests/new`: create a request as draft or submitted.
- `/requests/[id]`: request detail, status timeline, attachments, assignment, cancellation, and completion actions.
- `/requests/[id]/edit`: edit request fields, dates, and license plates.
- `/calendar`: parking dates by request, department, cars count, status color, and location.
- `/assignments`: approved unassigned work and active assigned work.
- `/departments`: manage bureau/department reference data.
- `/locations`: manage parking locations.
- `/users`: manage profiles and roles.
- `/reports`: reporting and CSV export.
- `/settings`: operational notes and system configuration summary.

## Admin Responsibilities

- Keep official letter data clean and searchable.
- Assign approved work to security staff.
- Verify completion evidence before closing work when admin closes it manually.
- Use cancellation only with a clear reason.
- Keep demo credentials out of production.
