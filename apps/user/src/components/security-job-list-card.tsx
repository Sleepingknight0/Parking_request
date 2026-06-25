"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@nacc/ui";
import type { RequestStatus } from "@nacc/types";
import {
  formatNextSlotLine,
  formatPlateSummary,
  getJobLocationTitle,
  getJobPlateNos,
  getPrepUrgency,
  type SecurityJobRow,
} from "@/lib/security-job-utils";
import { SecurityPrepBadge } from "./security-prep-badge";
import { SecurityStatusBadge } from "./security-status-badge";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SecurityJobListCard({
  job,
  profileId,
  href,
  today = todayIso(),
  showPrep = true,
}: {
  job: SecurityJobRow;
  profileId?: string;
  href: string;
  today?: string;
  showPrep?: boolean;
}) {
  const prep = showPrep ? getPrepUrgency(job, today) : null;
  const assignedToMe = profileId ? job.assigned_to === profileId : false;
  const plateSummary = formatPlateSummary(getJobPlateNos(job));
  const scheduleLine = formatNextSlotLine(job, today);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors active:bg-accent",
        prep?.level === "overdue"
          ? "border-red-400"
          : prep?.level === "critical"
            ? "border-red-300"
            : prep?.level === "soon"
              ? "border-orange-300"
              : "border-border",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {prep ? <SecurityPrepBadge urgency={prep} showDate={false} /> : null}
          <SecurityStatusBadge status={job.status as RequestStatus} className="text-[10px]" />
          {assignedToMe ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              งานของฉัน
            </span>
          ) : null}
        </div>

        <p className="text-base font-semibold leading-snug text-slate-900">
          {getJobLocationTitle(job)}
        </p>

        {scheduleLine ? (
          <p className="text-sm font-medium text-slate-700">{scheduleLine}</p>
        ) : (
          <p className="text-sm text-muted-foreground">ยังไม่ระบุวันและเวลา</p>
        )}

        {plateSummary ? (
          <p className="text-xs text-muted-foreground">ทะเบียน {plateSummary}</p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {job.official_letter_no}
          {job.department?.name_th ? ` · ${job.department.name_th}` : ""}
        </p>
      </div>

      <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
