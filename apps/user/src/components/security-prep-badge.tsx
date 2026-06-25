import { cn } from "@nacc/ui";
import type { PrepUrgencyDisplay } from "@/lib/security-job-utils";

const PREP_BADGE_CLASSES: Record<
  NonNullable<PrepUrgencyDisplay["level"]>,
  string
> = {
  normal: "bg-teal-600 text-white ring-1 ring-inset ring-teal-700/40",
  soon: "bg-orange-500 text-white ring-1 ring-inset ring-orange-600/40",
  critical: "bg-red-600 text-white ring-1 ring-inset ring-red-700/40",
  overdue: "bg-red-700 text-white ring-2 ring-red-300 animate-pulse",
};

export function SecurityPrepBadge({
  urgency,
  className,
  showDate = true,
}: {
  urgency: PrepUrgencyDisplay;
  className?: string;
  showDate?: boolean;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
          PREP_BADGE_CLASSES[urgency.level],
        )}
      >
        {urgency.emoji ? <span aria-hidden="true">{urgency.emoji}</span> : null}
        {urgency.tag}
      </span>
      {showDate && urgency.dateLabel ? (
        <p className="text-sm font-semibold text-slate-800">{urgency.dateLabel}</p>
      ) : null}
    </div>
  );
}
