"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  DOCUMENT_PROGRESS_LABELS_TH,
  DOCUMENT_PROGRESS_STATUSES,
  requestStatusToDocumentProgress,
  type DocumentProgressStatus,
  type RequestStatus,
} from "@nacc/types";
import { Button } from "./button";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { toast } from "./sonner";

export function DocumentProgressSelect({
  value,
  onValueChange,
  disabled,
  id,
}: {
  value: DocumentProgressStatus;
  onValueChange: (value: DocumentProgressStatus) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as DocumentProgressStatus)} disabled={disabled}>
      <SelectTrigger id={id} className="w-full sm:w-72">
        <SelectValue placeholder="เลือกขั้นตอนเอกสาร" />
      </SelectTrigger>
      <SelectContent>
        {DOCUMENT_PROGRESS_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {DOCUMENT_PROGRESS_LABELS_TH[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DocumentProgressPanel({
  requestId,
  currentStatus,
  editable,
  onSave,
  className,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  editable: boolean;
  onSave: (
    requestId: string,
    target: DocumentProgressStatus,
  ) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
}) {
  const router = useRouter();
  const currentProgress = requestStatusToDocumentProgress(currentStatus);
  const [value, setValue] = React.useState<DocumentProgressStatus>(
    currentProgress ?? "under_review",
  );
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const next = requestStatusToDocumentProgress(currentStatus);
    if (next) setValue(next);
  }, [currentStatus]);

  const canEdit =
    editable &&
    currentProgress !== null &&
    !["draft", "rejected", "cancelled"].includes(currentStatus);

  async function handleSave() {
    if (!canEdit || value === currentProgress) return;
    setPending(true);
    try {
      const res = await onSave(requestId, value);
      if (!res.ok) {
        toast.error(res.error ?? "บันทึกขั้นตอนเอกสารไม่สำเร็จ");
        return;
      }
      toast.success("อัปเดตขั้นตอนเอกสารแล้ว");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (currentProgress === null) return null;

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor={`doc-progress-${requestId}`}>ขั้นตอนเอกสาร</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DocumentProgressSelect
            id={`doc-progress-${requestId}`}
            value={value}
            onValueChange={setValue}
            disabled={!canEdit || pending}
          />
          {canEdit && value !== currentProgress ? (
            <Button type="button" disabled={pending} onClick={handleSave} className="shrink-0 gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              บันทึกขั้นตอน
            </Button>
          ) : null}
        </div>
        {!canEdit ? (
          <p className="text-xs text-muted-foreground">ไม่สามารถแก้ไขขั้นตอนเอกสารในสถานะนี้</p>
        ) : null}
      </div>
    </div>
  );
}
