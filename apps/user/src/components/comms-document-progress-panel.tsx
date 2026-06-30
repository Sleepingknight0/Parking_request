"use client";

import { DocumentProgressPanel } from "@nacc/ui";
import type { RequestStatus } from "@nacc/types";
import { setCommsDocumentProgress } from "@/lib/document-progress-actions";

export function CommsDocumentProgressPanel({
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
      onSave={setCommsDocumentProgress}
    />
  );
}
