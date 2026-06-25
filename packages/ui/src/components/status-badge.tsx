import * as React from "react";
import {
  STATUS_LABELS_TH,
  PRIORITY_LABELS_TH,
  type RequestStatus,
  type Priority,
} from "@nacc/types";
import { cn } from "../lib/cn";

/** Must live in this file so Tailwind scans and emits the utility classes. */
const STATUS_BADGE_CLASSES: Record<RequestStatus, string> = {
  draft: "bg-slate-200 text-slate-900 ring-1 ring-inset ring-slate-500/35",
  submitted: "bg-sky-200 text-sky-950 ring-1 ring-inset ring-sky-600/35",
  under_review: "bg-yellow-200 text-yellow-950 ring-1 ring-inset ring-yellow-600/35",
  approved: "bg-lime-200 text-lime-950 ring-1 ring-inset ring-lime-600/35",
  assigned: "bg-violet-200 text-violet-950 ring-1 ring-inset ring-violet-600/35",
  in_progress: "bg-orange-200 text-orange-950 ring-1 ring-inset ring-orange-600/35",
  completed: "bg-cyan-200 text-cyan-950 ring-1 ring-inset ring-cyan-600/35",
  cancelled: "bg-zinc-300 text-zinc-800 ring-1 ring-inset ring-zinc-500/35",
  rejected: "bg-rose-200 text-rose-950 ring-1 ring-inset ring-rose-600/35",
};

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS_TH[status]}
    </span>
  );
}

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-slate-100 text-slate-600",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  if (priority === "normal") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PRIORITY_CLASSES[priority],
        className,
      )}
    >
      {PRIORITY_LABELS_TH[priority]}
    </span>
  );
}
