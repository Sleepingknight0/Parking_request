# Officer And Comms UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing officer request form, add official-letter attachment during save/submit, and make officer/comms dashboards useful for status tracking, letter-number search, date review, and calendar scanning.

**Architecture:** Do not change the database schema or workflow. Reuse existing request creation actions and `uploadUserAttachment`; add client-side dashboard components fed by server-loaded request rows. Keep heavy calendar loading inside the existing lazy `RequestCalendar`.

**Tech Stack:** Next.js App Router, TypeScript, React Hook Form, Supabase Storage through existing server actions, shadcn/ui package components.

---

### Task 1: Attach Official Letter From Existing Officer Form

**Files:**
- Modify: `apps/user/src/components/officer-request-form.tsx`
- Modify: `apps/user/src/app/officer/requests/[id]/edit/page.tsx`

- [ ] Add an official-letter file picker card inside the existing form.
- [ ] Allow PDF, JPG, PNG, WebP, DOC, and DOCX.
- [ ] On submit, require at least one selected official-letter file unless the request already has an official-letter attachment.
- [ ] After `createOfficerRequest` or `updateOfficerRequest` succeeds, upload selected files with `uploadUserAttachment(requestId, "official_letter", formData)`.
- [ ] Keep the old form sections and save/submit buttons intact.

### Task 2: Officer Dashboard For Daily Work

**Files:**
- Create: `apps/user/src/components/officer-dashboard-content.tsx`
- Modify: `apps/user/src/app/officer/dashboard/page.tsx`

- [ ] Show cards for drafts, pending/review, active work, today cars, today letters, and missing official-letter files.
- [ ] Add search by official letter number, request number, subject, department, and requested location.
- [ ] Add selected date filter and show requests for that date.
- [ ] Add `RequestCalendar` using officer detail links.
- [ ] Keep the prominent "record letter" button.

### Task 3: Comms Dashboard For Verification

**Files:**
- Create: `apps/user/src/components/comms-dashboard-content.tsx`
- Modify: `apps/user/src/app/comms/dashboard/page.tsx`

- [ ] Show search by letter/request/department/location.
- [ ] Show selected date summary and calendar with comms detail links.
- [ ] Highlight requests with no official-letter attachment.
- [ ] Keep the link to the full comms request table.

### Task 4: Verify

**Commands:**
- `pnpm --filter @nacc/user lint`
- `pnpm --filter @nacc/user typecheck`
- `pnpm --filter @nacc/user build`

Expected result: all commands pass.
