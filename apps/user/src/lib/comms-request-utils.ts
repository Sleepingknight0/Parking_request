import type { ParkingRequestListItem } from "@nacc/types";

export type CommsQueue =
  | "all"
  | "needs_action"
  | "pending_approval"
  | "in_security"
  | "awaiting_verification"
  | "verified";

export type CommsRequestRow = ParkingRequestListItem & {
  officialLetterCount?: number;
};

export function getCommsQueue(row: ParkingRequestListItem): CommsQueue | null {
  if (row.comms_verified_at) return "verified";
  if (row.status === "completed") return "awaiting_verification";
  if (row.status === "submitted" || row.status === "under_review") return "pending_approval";
  if (row.status === "approved" || row.status === "assigned" || row.status === "in_progress") {
    return "in_security";
  }
  return null;
}

export function matchesCommsQueue(row: ParkingRequestListItem, queue: CommsQueue): boolean {
  if (queue === "all") return true;
  if (queue === "needs_action") {
    const q = getCommsQueue(row);
    return q === "pending_approval" || q === "awaiting_verification";
  }
  return getCommsQueue(row) === queue;
}

export function countCommsQueue(rows: ParkingRequestListItem[], queue: CommsQueue): number {
  return rows.filter((row) => matchesCommsQueue(row, queue)).length;
}

export function isCommsActionable(row: ParkingRequestListItem): boolean {
  const q = getCommsQueue(row);
  return q === "pending_approval" || q === "awaiting_verification";
}
