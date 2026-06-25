# User Flow

## Login

The User app is for two roles:

- `officer`
- `security_staff`

After login, users are routed by profile role. If a user can access more than one mode later, `/select-role` is the role selection entry point.

## Officer Flow

Purpose: record official parking request letters and follow their status.

1. Open `/officer/dashboard`.
2. Create a request from `/officer/requests/new`.
3. Fill official letter data:
   - department
   - official letter number
   - letter date
   - received date
   - requested date pattern and dates
   - requested location
   - cars count
   - license plates
   - contact person and phone
   - purpose/details
4. Save as draft or submit.
5. Upload the official letter attachment from the request detail page.
6. Edit only while status is `draft` or `submitted` and the request is not assigned.
7. Cancel only while status is `submitted`, `under_review`, or `approved` and the request is not assigned. Cancellation requires a reason.
8. Track status from `/officer/requests` and request detail.

## Security Staff Flow

Purpose: accept approved jobs, do the work, and submit completion evidence.

1. Open `/security/dashboard`.
2. View jobs from `/security/jobs`.
3. Open an approved job detail.
4. Accept the job. Status becomes `assigned`.
5. Start the job. Status becomes `in_progress`.
6. Upload one or more completion photos.
7. Submit completion. Status becomes `completed`.
8. If the job cannot proceed, cancel it with a required reason and optional evidence.
9. View finished work from `/security/history`.

## Statuses Users See

- `draft`: officer draft.
- `submitted`: officer submitted; waiting for admin review.
- `under_review`: admin is checking.
- `approved`: ready for security staff to accept.
- `assigned`: accepted or assigned to security staff.
- `in_progress`: work is being performed.
- `completed`: completion photos submitted and job closed.
- `cancelled`: cancelled with reason.
- `rejected`: not approved by admin.
