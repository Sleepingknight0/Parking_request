"use client";

import { cn } from "@nacc/ui";
import { TH } from "@nacc/types";
import type { CommsQueue } from "@/lib/comms-request-utils";

const QUEUE_OPTIONS: { value: CommsQueue; label: string }[] = [
  { value: "needs_action", label: TH.comms.needsAction },
  { value: "all", label: "ทั้งหมด" },
  { value: "pending_approval", label: TH.comms.pendingApproval },
  { value: "in_security", label: TH.comms.inSecurity },
  { value: "awaiting_verification", label: TH.comms.awaitingVerification },
  { value: "verified", label: TH.comms.verified },
];

export function CommsQueueFilter({
  value,
  onChange,
  counts,
  className,
}: {
  value: CommsQueue;
  onChange: (value: CommsQueue) => void;
  counts?: Partial<Record<CommsQueue, number>>;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1", className)}>
      {QUEUE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        const count = counts?.[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
            {count !== undefined && opt.value !== "all" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
