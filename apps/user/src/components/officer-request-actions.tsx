"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  toast,
} from "@nacc/ui";
import { TH, type RequestStatus } from "@nacc/types";
import { cancelOfficerRequest } from "@/lib/request-actions";

export function OfficerRequestActions({
  id,
  status,
  assigned,
}: {
  id: string;
  status: RequestStatus;
  assigned: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const canCancel = ["submitted", "under_review", "approved"].includes(status) && !assigned;

  if (!canCancel) return null;

  async function onCancel() {
    setPending(true);
    try {
      const res = await cancelOfficerRequest(id, reason);
      if (!res.ok) {
        toast.error(res.error ?? "ยกเลิกไม่สำเร็จ");
        return;
      }
      toast.success("ยกเลิกคำขอแล้ว");
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="destructive" className="gap-2" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        {TH.action.cancel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.action.cancel}</DialogTitle>
            <DialogDescription>กรุณาระบุเหตุผลการยกเลิกคำขอนี้</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.cancellationReason}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {TH.action.close}
            </Button>
            <Button variant="destructive" disabled={pending || !reason.trim()} onClick={onCancel}>
              {TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
