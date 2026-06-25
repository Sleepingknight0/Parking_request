import { getRequestById, listRequests } from "@nacc/db/queries";
import type { ParkingRequestListItem } from "@nacc/types";
import type { CommsRequestRow } from "./comms-request-utils";
import { getUserAppDb } from "./user-db";

export async function listCommsRequests(): Promise<ParkingRequestListItem[]> {
  const svc = getUserAppDb();
  const { rows } = await listRequests(svc, { limit: 500 });
  return rows.filter((row) => row.status !== "draft");
}

export async function enrichCommsRowsWithLetterCounts(
  rows: ParkingRequestListItem[],
): Promise<CommsRequestRow[]> {
  const requestIds = rows.map((row) => row.id);
  if (!requestIds.length) return rows;

  const svc = getUserAppDb();
  const { data: attachmentRows } = await svc
    .from("request_attachments")
    .select("request_id")
    .eq("file_type", "official_letter")
    .in("request_id", requestIds);

  const attachmentCount = new Map<string, number>();
  for (const row of attachmentRows ?? []) {
    const requestId = row.request_id as string;
    attachmentCount.set(requestId, (attachmentCount.get(requestId) ?? 0) + 1);
  }

  return rows.map((row) => ({
    ...row,
    officialLetterCount: attachmentCount.get(row.id) ?? 0,
  }));
}

export async function getCommsRequestById(id: string) {
  const svc = getUserAppDb();
  return getRequestById(svc, id);
}
