import { createServiceClient } from "@nacc/db/service";
import { getRequestById, listRequests } from "@nacc/db/queries";
import type { ParkingRequestListItem } from "@nacc/types";

export async function listCommsRequests(): Promise<ParkingRequestListItem[]> {
  const svc = createServiceClient();
  const { rows } = await listRequests(svc, { limit: 500 });
  return rows.filter((row) => row.status !== "draft");
}

export async function getCommsRequestById(id: string) {
  const svc = createServiceClient();
  return getRequestById(svc, id);
}
