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

## Active Workflow

The active database trigger implements the full approval workflow:

```txt
draft -> submitted
submitted -> under_review
under_review -> approved
under_review -> rejected
approved -> assigned
assigned -> in_progress
in_progress -> completed
```

Cancellation is allowed from:

```txt
submitted
under_review
approved
assigned
in_progress
```

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
