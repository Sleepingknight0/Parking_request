"use client";

import { DocumentProgressPanel } from "@nacc/ui";
import type { RequestStatus } from "@nacc/types";
import { setAdminDocumentProgress } from "@/lib/request-actions";

export function AdminDocumentProgressPanel({
  requestId,
  currentStatus,
  editable,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  editable: boolean;
}) {
  return (
    <DocumentProgressPanel
      requestId={requestId}
      currentStatus={currentStatus}
      editable={editable}
      onSave={setAdminDocumentProgress}
    />
  );
}
