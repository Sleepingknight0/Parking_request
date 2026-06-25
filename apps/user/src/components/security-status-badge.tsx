import {
  SECURITY_STATUS_LABELS_TH,
  isSecurityWorkflowStatus,
  type RequestStatus,
} from "@nacc/types";
import { cn } from "@nacc/ui";

/** Tailwind classes must live here so they are emitted. */
const SECURITY_STATUS_BADGE_CLASSES: Record<
  "approved" | "assigned" | "in_progress" | "completed" | "cancelled",
  string
> = {
  approved: "bg-amber-200 text-amber-950 ring-1 ring-inset ring-amber-600/35",
  assigned: "bg-violet-200 text-violet-950 ring-1 ring-inset ring-violet-600/35",
  in_progress: "bg-orange-200 text-orange-950 ring-1 ring-inset ring-orange-600/35",
  completed: "bg-green-200 text-green-950 ring-1 ring-inset ring-green-600/40",
  cancelled: "bg-zinc-300 text-zinc-800 ring-1 ring-inset ring-zinc-500/35",
};

export function SecurityStatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  if (!isSecurityWorkflowStatus(status)) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        SECURITY_STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {SECURITY_STATUS_LABELS_TH[status]}
    </span>
  );
}
