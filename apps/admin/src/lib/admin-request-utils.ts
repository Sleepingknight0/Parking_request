import type { ParkingRequestListItem } from "@nacc/types";

export type AdminQueue =
  | "all"
  | "needs_action"
  | "under_review"
  | "unassigned"
  | "in_progress"
  | "completed";

export function getAdminQueue(row: ParkingRequestListItem): AdminQueue | null {
  if (row.status === "submitted" || row.status === "under_review") return "under_review";
  if (row.status === "approved" && !row.assigned_to) return "unassigned";
  if (row.status === "assigned" || row.status === "in_progress") return "in_progress";
  if (row.status === "completed") return "completed";
  return null;
}

export function matchesAdminQueue(row: ParkingRequestListItem, queue: AdminQueue): boolean {
  if (queue === "all") return true;
  if (queue === "needs_action") {
    const q = getAdminQueue(row);
    return q === "under_review" || q === "unassigned";
  }
  return getAdminQueue(row) === queue;
}

export function countAdminQueue(rows: ParkingRequestListItem[], queue: AdminQueue): number {
  return rows.filter((row) => matchesAdminQueue(row, queue)).length;
}

/** Single pass over rows — used for tab badges (avoids 5× filter on every render). */
export function computeAdminQueueCounts(rows: ParkingRequestListItem[]): Record<
  Exclude<AdminQueue, "all">,
  number
> {
  const counts = {
    needs_action: 0,
    under_review: 0,
    unassigned: 0,
    in_progress: 0,
    completed: 0,
  };

  for (const row of rows) {
    const q = getAdminQueue(row);
    if (q === "under_review") {
      counts.under_review += 1;
      counts.needs_action += 1;
    } else if (q === "unassigned") {
      counts.unassigned += 1;
      counts.needs_action += 1;
    } else if (q === "in_progress") {
      counts.in_progress += 1;
    } else if (q === "completed") {
      counts.completed += 1;
    }
  }

  return counts;
}

export function isAdminActionable(row: ParkingRequestListItem): boolean {
  const q = getAdminQueue(row);
  return q === "under_review" || q === "unassigned";
}

export function sortByAdminActionPriority(rows: ParkingRequestListItem[]): ParkingRequestListItem[] {
  return [...rows].sort((a, b) => {
    const qa = getAdminQueue(a);
    const qb = getAdminQueue(b);
    if (qa === "under_review" && qb !== "under_review") return -1;
    if (qb === "under_review" && qa !== "under_review") return 1;
    if (qa === "unassigned" && qb !== "unassigned") return -1;
    if (qb === "unassigned" && qa !== "unassigned") return 1;
    return 0;
  });
}
