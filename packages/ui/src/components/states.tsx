import * as React from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { Skeleton } from "./skeleton";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  accentClassName,
  compact = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  accentClassName?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        compact ? "p-2.5" : "p-5",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "leading-tight text-muted-foreground",
            compact ? "text-[10px] sm:text-[11px] line-clamp-2 min-h-[2lh]" : "text-sm",
          )}
        >
          {label}
        </span>
        {icon ? (
          <span
            className={cn(
              "shrink-0 text-muted-foreground",
              compact ? "[&_svg]:size-4" : "",
              accentClassName,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "font-bold tracking-tight",
          compact ? "mt-1 text-xl sm:text-2xl" : "mt-2 text-3xl",
        )}
      >
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertCircle className="mb-3 h-9 w-9 text-destructive" />
      <h3 className="text-base font-semibold text-destructive">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
