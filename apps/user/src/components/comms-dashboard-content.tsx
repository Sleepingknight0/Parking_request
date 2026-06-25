"use client";

import { CommsRequestsList } from "./comms-requests-list";
import type { CommsRequestRow } from "@/lib/comms-request-utils";

export type CommsDashboardRow = CommsRequestRow;

export function CommsDashboardContent({ rows }: { rows: CommsDashboardRow[] }) {
  return (
    <CommsRequestsList
      rows={rows}
      defaultQueue="needs_action"
      showTitle={false}
      showCalendarLink
    />
  );
}
