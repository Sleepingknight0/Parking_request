# Status Workflow

## Status Values

Allowed status values:

- `draft`
- `submitted`
- `under_review`
- `approved`
- `assigned`
- `in_progress`
- `completed`
- `cancelled`
- `rejected`

Thai labels live in `packages/types/src/enums.ts`.

## Active V1 Workflow

The active database trigger currently implements this simplified workflow:

```txt
draft -> submitted
submitted -> assigned
assigned -> in_progress
in_progress -> completed
```

Cancellation is allowed from:

```txt
submitted
assigned
in_progress
```

## Reserved Approval Workflow

The full requested approval workflow is reserved but not active:

```txt
submitted -> under_review
under_review -> approved
under_review -> rejected
approved -> assigned
```

Activating this requires updating:

- `supabase/migrations/*`
- `supabase/policies.sql`
- `packages/types/src/enums.ts`
- Admin status actions
- User app request visibility and cancellation rules
- `docs/DATABASE_CONTRACT.md`
- this document

## Cancellation Requirements

Cancellation requires:

- `cancellation_reason`
- `cancelled_by`
- `cancelled_at`

Cancellation evidence is optional and uses attachment type `cancellation_evidence`.

## Completion Requirements

Completion requires:

- at least one attachment with `file_type = completion_photo`
- `completed_by`
- `completed_at`

Completion note is optional.
