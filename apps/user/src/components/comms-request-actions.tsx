"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  toast,
} from "@nacc/ui";
import { FEATURE_FLAGS, TH, type ParkingRequestWithRelations } from "@nacc/types";
import {
  commsApproveRequest,
  commsMarkUnderReview,
  commsRejectRequest,
  commsVerifyCompletion,
} from "@/lib/comms-actions";
import type { ActionResult } from "@/lib/request-actions";

export function CommsRequestActions({
  request,
  officialLetterCount,
  onActionComplete,
}: {
  request: Pick<
    ParkingRequestWithRelations,
    "id" | "status" | "comms_verified_at"
  >;
  officialLetterCount: number;
  onActionComplete?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  async function run(fn: () => Promise<ActionResult>, successMsg: string) {
    setPending(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      toast.success(successMsg);
      setRejectOpen(false);
      onActionComplete?.();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const canReview = request.status === "submitted";
  const canDecide = request.status === "under_review" || request.status === "submitted";
  const canVerify =
    request.status === "completed" && !request.comms_verified_at;
  const hasLetter = FEATURE_FLAGS.officialLetterRequired ? officialLetterCount > 0 : true;

  if (!canReview && !canDecide && !canVerify) return null;

  return (
    <div className="space-y-3">
      {FEATURE_FLAGS.officialLetterIndicators && canDecide && !hasLetter ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {TH.comms.needOfficialLetter}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {canReview ? (
          <Button
            className="h-11 flex-1 gap-2"
            disabled={pending}
            onClick={() => run(() => commsMarkUnderReview(request.id), "รับเข้าตรวจสอบแล้ว")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {TH.comms.markUnderReview}
          </Button>
        ) : null}

        {canDecide ? (
          <>
            <Button
              className="h-11 flex-1 gap-2"
              disabled={pending || !hasLetter}
              onClick={() => run(() => commsApproveRequest(request.id), TH.comms.approvedSuccess)}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {TH.comms.approve}
            </Button>
            <Button
              className="h-11 flex-1 gap-2"
              variant="destructive"
              disabled={pending}
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              {TH.comms.reject}
            </Button>
          </>
        ) : null}

        {canVerify ? (
          <Button
            className="h-11 w-full gap-2 sm:flex-1"
            disabled={pending}
            onClick={() => run(() => commsVerifyCompletion(request.id), TH.comms.verifiedSuccess)}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {TH.comms.verifyCompletion}
          </Button>
        ) : null}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{TH.comms.reject}</DialogTitle>
            <DialogDescription>ระบุเหตุผล (ถ้ามี) ก่อนไม่อนุมัติคำขอ</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เหตุผลการไม่อนุมัติ"
            rows={3}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {TH.action.close}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => commsRejectRequest(request.id, reason), "บันทึกการไม่อนุมัติแล้ว")}
            >
              {TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
