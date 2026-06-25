"use client";

import * as React from "react";
import { CalendarDays, Search, X } from "lucide-react";
import { Button, Input, ThaiDateInput, cn } from "@nacc/ui";

export function DashboardFilterBar({
  query,
  onQueryChange,
  selectedDate,
  onDateChange,
  onResetToday,
  action,
  className,
  hideDate = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selectedDate: string;
  onDateChange: (value: string) => void;
  onResetToday?: () => void;
  action?: React.ReactNode;
  className?: string;
  hideDate?: boolean;
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-2 sm:items-end",
          hideDate ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "sm:grid-cols-[minmax(0,1fr)_11rem_auto]",
        )}
      >
        <div className="min-w-0 space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="dashboard-search">
            ค้นหา
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dashboard-search"
              className="h-10 pl-9 pr-9"
              placeholder="เลขหนังสือ · สำนัก · สถานที่"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            {hasQuery ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="ล้างคำค้น"
                onClick={() => onQueryChange("")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {hideDate ? null : (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="dashboard-date">
            วันที่ดูรายการ
          </label>
          <div className="flex gap-1.5">
            <ThaiDateInput
              id="dashboard-date"
              className="min-w-0 flex-1"
              value={selectedDate}
              onChange={onDateChange}
            />
            {onResetToday ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                title="วันนี้"
                onClick={onResetToday}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
        )}

        {action ? <div className="flex items-end sm:justify-end">{action}</div> : null}
      </div>
    </div>
  );
}
