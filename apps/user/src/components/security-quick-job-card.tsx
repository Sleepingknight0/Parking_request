"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
  toast,
} from "@nacc/ui";
import { DATE_PATTERN_LABELS_TH, TH, type RequestStatus } from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import { acceptJobAndStart, completeJob, startJob, type ActionResult } from "@/lib/request-actions";
import {
  formatJobScheduleLine,
  formatNextSlotLine,
  formatPlateSummary,
  getJobLocationTitle,
  getJobPlateNos,
  getPrepUrgency,
  type SecurityJobRow,
} from "@/lib/security-job-utils";
import { CompletionPhotoUploader } from "./completion-photo-uploader";
import { SecurityPrepBadge } from "./security-prep-badge";
import { SecurityStatusBadge } from "./security-status-badge";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SecurityQuickJobCard({
  job,
  profileId,
  photoCount,
  today = todayIso(),
}: {
  job: SecurityJobRow;
  profileId: string;
  photoCount: number;
  today?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const assignedToMe = job.assigned_to === profileId;
  const canAccept = job.status === "approved";
  const canStart = assignedToMe && job.status === "assigned";
  const canComplete = assignedToMe && job.status === "in_progress";

  const prep = getPrepUrgency(job, today);
  const plates = getJobPlateNos(job);
  const plateSummary = formatPlateSummary(plates);
  const locationTitle = getJobLocationTitle(job);
  const scheduleLine = formatNextSlotLine(job, today);

  async function run(fn: () => Promise<ActionResult>, message: string) {
    setPending(true);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      toast.success(message);
      setCompleteOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden border-2 shadow-sm",
          prep?.level === "overdue"
            ? "border-red-500 bg-red-50/50"
            : prep?.level === "critical"
              ? "border-red-300 bg-red-50/30"
              : prep?.level === "soon"
                ? "border-orange-300 bg-orange-50/20"
                : prep?.level === "normal"
                  ? "border-teal-200 bg-teal-50/10"
                  : "border-border",
        )}
      >
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              {prep ? <SecurityPrepBadge urgency={prep} /> : null}

              <h3 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                {locationTitle}
              </h3>

              {scheduleLine ? (
                <p className="text-lg font-semibold leading-snug text-slate-900">{scheduleLine}</p>
              ) : (
                <p className="text-sm text-muted-foreground">ยังไม่ระบุวันและเวลา</p>
              )}

              {plateSummary ? (
                <p className="text-base font-medium text-slate-700">ทะเบียน {plateSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">ยังไม่ระบุป้ายทะเบียน</p>
              )}
            </div>
            <SecurityStatusBadge status={job.status as RequestStatus} className="shrink-0 text-[10px]" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-2 text-base"
              onClick={() => setDetailsOpen(true)}
            >
              <Info className="h-4 w-4" />
              รายละเอียด
            </Button>

            {canAccept ? (
              <Button
                className="h-14 flex-[2] gap-3 text-lg font-semibold"
                disabled={pending}
                onClick={() => run(() => acceptJobAndStart(job.id), TH.security.acknowledged)}
              >
                {pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                {TH.security.acknowledgeJob}
              </Button>
            ) : null}

            {canStart ? (
              <Button
                className="h-14 flex-[2] gap-3 text-lg font-semibold"
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => startJob(job.id), "เริ่มจัดที่จอดแล้ว")}
              >
                {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {TH.security.startArranging}
              </Button>
            ) : null}

            {canComplete ? (
              <Button
                className="h-14 flex-[2] gap-3 text-lg font-semibold"
                disabled={pending}
                onClick={() => setCompleteOpen(true)}
              >
                <CheckCircle2 className="h-5 w-5" />
                {TH.security.submitWork}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{locationTitle}</DialogTitle>
            <DialogDescription>รายละเอียดงานจัดที่จอดรถ</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <Detail label="สถานะ">
              <SecurityStatusBadge status={job.status as RequestStatus} />
            </Detail>
            {prep ? (
              <Detail label="ความเร่งด่วน">
                <SecurityPrepBadge urgency={prep} showDate={false} />
              </Detail>
            ) : null}
            <Detail label="รูปแบบวันที่">{DATE_PATTERN_LABELS_TH[job.date_pattern]}</Detail>
            <Detail label="กำหนดการ (รอบถัดไป)">
              {scheduleLine ?? formatJobScheduleLine(job)}
            </Detail>
            <Detail label="สำนัก">{job.department?.name_th ?? "-"}</Detail>
            <Detail label="เลขหนังสือ">{job.official_letter_no}</Detail>
            {job.subject ? <Detail label="เรื่อง">{job.subject}</Detail> : null}
            <Detail label="ป้ายทะเบียน">
              {plateSummary ?? "ยังไม่ระบุ"}
            </Detail>
            <Detail label="วันที่จอดทั้งหมด">
              <ul className="list-inside list-disc space-y-0.5">
                {job.request_dates
                  .slice()
                  .sort((a, b) => a.request_date.localeCompare(b.request_date))
                  .map((d) => (
                    <li key={d.request_date}>
                      {formatThaiDate(d.request_date)}
                      {formatTimeRange(d.start_time, d.end_time)
                        ? ` · ${formatTimeRange(d.start_time, d.end_time)}`
                        : ""}
                    </li>
                  ))}
              </ul>
            </Detail>
          </dl>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <Link href={`/security/jobs/${job.id}`}>เปิดหน้ารายละเอียดเต็ม</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setDetailsOpen(false)}>
              {TH.action.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-md gap-5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">{TH.security.submitWork} — {locationTitle}</DialogTitle>
            <DialogDescription className="text-base">
              ถ่ายรูปหรือเลือกรูปจากเครื่อง แล้วกดยืนยันส่งงาน
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <CompletionPhotoUploader requestId={job.id} large />
            {photoCount > 0 ? (
              <p className="mt-2 text-sm text-emerald-700">แนบรูปแล้ว {photoCount} รูป</p>
            ) : (
              <p className="mt-2 text-sm text-amber-700">ต้องแนบรูปอย่างน้อย 1 รูป</p>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="h-14 w-full text-lg"
              disabled={pending}
              onClick={() => run(() => completeJob(job.id), TH.security.workDone)}
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {TH.security.confirmSubmitWork}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => setCompleteOpen(false)}
            >
              {TH.action.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  );
}
