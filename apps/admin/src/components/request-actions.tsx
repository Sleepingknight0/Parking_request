"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Send,
  UserPlus,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Button,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  toast,
} from "@nacc/ui";
import { TH, type RequestStatus, type ProfileRef } from "@nacc/types";
import {
  submitRequest,
  assignRequest,
  changeStatus,
  completeRequest,
  cancelRequest,
  deleteRequest,
  type ActionResult,
} from "@/lib/request-actions";

export function RequestActions({
  id,
  status,
  securityStaff,
}: {
  id: string;
  status: RequestStatus;
  securityStaff: ProfileRef[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [dialog, setDialog] = React.useState<null | "assign" | "cancel" | "complete">(null);
  const [assignee, setAssignee] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");

  async function run(fn: () => Promise<ActionResult>, successMsg: string) {
    setPending(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
        return false;
      }
      toast.success(successMsg);
      setDialog(null);
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  const canEdit = ["draft", "submitted", "assigned"].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/requests/${id}/edit`}>
            <Pencil className="h-4 w-4" /> {TH.action.edit}
          </Link>
        </Button>
      )}

      {status === "draft" && (
        <Button className="gap-2" disabled={pending}
          onClick={() => run(() => submitRequest(id), "ส่งคำขอแล้ว")}>
          <Send className="h-4 w-4" /> {TH.action.submit}
        </Button>
      )}

      {(status === "submitted" || status === "assigned") && (
        <Button className="gap-2" disabled={pending} onClick={() => setDialog("assign")}>
          <UserPlus className="h-4 w-4" />
          {status === "assigned" ? TH.action.reassign : TH.action.assign}
        </Button>
      )}

      {status === "assigned" && (
        <Button className="gap-2" variant="secondary" disabled={pending}
          onClick={() => run(() => changeStatus(id, "in_progress"), "เริ่มดำเนินการแล้ว")}>
          <PlayCircle className="h-4 w-4" /> {TH.action.startJob}
        </Button>
      )}

      {status === "in_progress" && (
        <Button className="gap-2" disabled={pending} onClick={() => setDialog("complete")}>
          <CheckCircle2 className="h-4 w-4" /> {TH.action.completeJob}
        </Button>
      )}

      {["submitted", "assigned", "in_progress"].includes(status) && (
        <Button className="gap-2" variant="destructive" disabled={pending} onClick={() => setDialog("cancel")}>
          <XCircle className="h-4 w-4" /> {TH.action.cancel}
        </Button>
      )}

      <DeleteButton id={id} pending={pending} onRun={run} />

      {/* Assign dialog */}
      <Dialog open={dialog === "assign"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.action.assign}</DialogTitle>
            <DialogDescription>เลือกพนักงานสื่อสาร/รปภ. ผู้รับผิดชอบงานนี้</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.assignedTo}</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="เลือกผู้รับผิดชอบ" /></SelectTrigger>
              <SelectContent>
                {securityStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{TH.action.close}</Button>
            <Button disabled={pending || !assignee}
              onClick={() => run(() => assignRequest(id, assignee), "มอบหมายงานแล้ว")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={dialog === "cancel"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.action.cancel}</DialogTitle>
            <DialogDescription>กรุณาระบุเหตุผลการยกเลิก (จำเป็น)</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.cancellationReason}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{TH.action.close}</Button>
            <Button variant="destructive" disabled={pending || !reason.trim()}
              onClick={() => run(() => cancelRequest(id, reason), "ยกเลิกคำขอแล้ว")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={dialog === "complete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TH.action.completeJob}</DialogTitle>
            <DialogDescription>
              ต้องมีรูปถ่ายส่งงานอย่างน้อย 1 รูปก่อนปิดงาน (อัปโหลดในส่วนไฟล์แนบด้านล่าง)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{TH.entity.note}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{TH.action.close}</Button>
            <Button disabled={pending}
              onClick={() => run(() => completeRequest(id, note), "ปิดงานเรียบร้อย")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteButton({
  id,
  pending,
  onRun,
}: {
  id: string;
  pending: boolean;
  onRun: (fn: () => Promise<ActionResult>, msg: string) => Promise<boolean>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="ghost" className="gap-2 text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> {TH.action.delete}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบคำขอ</DialogTitle>
            <DialogDescription>การลบไม่สามารถย้อนกลับได้</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{TH.action.close}</Button>
            <Button variant="destructive" disabled={pending}
              onClick={async () => {
                const ok = await onRun(() => deleteRequest(id), "ลบคำขอแล้ว");
                if (ok) router.push("/requests");
              }}>
              {TH.action.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
