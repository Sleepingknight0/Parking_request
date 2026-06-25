import * as React from "react";
import {
  STATUS_LABELS_TH,
  STATUS_BADGE_CLASSES,
  PRIORITY_LABELS_TH,
  type RequestStatus,
  type Priority,
} from "@nacc/types";
import { cn } from "../lib/cn";

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
