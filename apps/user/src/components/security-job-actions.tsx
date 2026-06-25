"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PlayCircle, ShieldCheck, XCircle } from "lucide-react";
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
import {
  acceptJob,
  cancelJob,
  completeJob,
  startJob,
  type ActionResult,
} from "@/lib/request-actions";

export function SecurityJobActions({
  id,
  status,
  assignedToMe,
}: {
  id: string;
  status: RequestStatus;
  assignedToMe: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [dialog, setDialog] = React.useState<null | "complete" | "cancel">(null);
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState("");

  async function run(fn: () => Promise<ActionResult>, message: string) {
    setPending(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      toast.success(message);
      setDialog(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "approved" ? (
        <Button
          className="gap-2"
          disabled={pending}
          onClick={() => run(() => acceptJob(id), TH.security.acknowledged)}
        >
          <ShieldCheck className="h-4 w-4" />
          {TH.security.acknowledge}
        </Button>
      ) : null}

      {status === "assigned" && assignedToMe ? (
        <Button
          className="gap-2"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => startJob(id), "เริ่มจัดที่จอดแล้ว")}
        >
          <PlayCircle className="h-4 w-4" />
          {TH.security.startArranging}
        </Button>
      ) : null}

      {status === "in_progress" && assignedToMe ? (
        <Button className="gap-2" disabled={pending} onClick={() => setDialog("complete")}>
          <CheckCircle2 className="h-4 w-4" />
          {TH.security.submitWork}
        </Button>
      ) : null}

      {["assigned", "in_progress"].includes(status) && assignedToMe ? (
        <Button className="gap-2" variant="destructive" disabled={pending} onClick={() => setDialog("cancel")}>
          <XCircle className="h-4 w-4" />
          {TH.action.cancelJob}
        </Button>
      ) : null}

      <Dialog open={dialog === "complete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.security.submitWork}</DialogTitle>
            <DialogDescription>ต้องแนบรูปถ่ายส่งงานอย่างน้อย 1 รูปก่อนยืนยัน</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.note}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {TH.action.close}
            </Button>
            <Button disabled={pending} onClick={() => run(() => completeJob(id, note), TH.security.workDone)}>
              {TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cancel"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.action.cancelJob}</DialogTitle>
            <DialogDescription>กรุณาระบุเหตุผลการยกเลิกงาน</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.cancellationReason}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {TH.action.close}
            </Button>
            <Button
              variant="destructive"
              disabled={pending || !reason.trim()}
              onClick={() => run(() => cancelJob(id, reason), "ยกเลิกงานแล้ว")}
            >
              {TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
