"use client";

import * as React from "react";
import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  EMPTY_REQUEST_FILTERS,
  countActiveRequestFilters,
  formatThaiDate,
  todayISO,
  type RequestListFilters,
} from "@nacc/utils";
import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";

const DEFAULT_STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  ...Object.entries(STATUS_LABELS_TH).map(([value, label]) => ({ value, label })),
];

function labelForStatus(
  status: string,
  options: { value: string; label: string }[],
): string {
  return options.find((opt) => opt.value === status)?.label ?? status;
}

export function RequestSearchToolbar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  departments,
  showStatusFilter = true,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  resultCount,
  className,
  searchPlaceholder = "ค้นหาเลขหนังสือ สำนัก สถานที่ ทะเบียน หรือเรื่อง",
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filters: RequestListFilters;
  onFiltersChange: (value: RequestListFilters) => void;
  departments: { id: string; name_th: string }[];
  showStatusFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
  resultCount?: number;
  className?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;
  const hasQuery = query.trim().length > 0;
  const activeCount = countActiveRequestFilters(filters);

  React.useEffect(() => {
    if (open) setDraft(filtersRef.current);
  }, [open]);

  function applyDraft() {
    onFiltersChange(draft);
    setOpen(false);
  }

  function clearAll() {
    onQueryChange("");
    onFiltersChange(EMPTY_REQUEST_FILTERS);
    setDraft(EMPTY_REQUEST_FILTERS);
    setOpen(false);
  }

  const activeDept = departments.find((d) => d.id === filters.departmentId);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9 pr-9"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="ค้นหาคำขอ"
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

        <Button
          type="button"
          variant={activeCount > 0 ? "default" : "outline"}
          className="h-10 shrink-0 gap-1.5 px-3"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">ตัวกรอง</span>
          {activeCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </div>

      {activeCount > 0 || hasQuery ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {hasQuery ? (
            <FilterChip label={`ค้นหา: ${query.trim()}`} onRemove={() => onQueryChange("")} />
          ) : null}
          {filters.date ? (
            <FilterChip
              label={`วันที่ ${formatThaiDate(filters.date)}`}
              onRemove={() => onFiltersChange({ ...filters, date: null })}
            />
          ) : null}
          {activeDept ? (
            <FilterChip
              label={activeDept.name_th}
              onRemove={() => onFiltersChange({ ...filters, departmentId: null })}
            />
          ) : null}
          {filters.status !== "all" ? (
            <FilterChip
              label={labelForStatus(filters.status, statusOptions)}
              onRemove={() => onFiltersChange({ ...filters, status: "all" })}
            />
          ) : null}
          {resultCount !== undefined ? (
            <span className="text-xs text-muted-foreground">{resultCount} รายการ</span>
          ) : null}
        </div>
      ) : resultCount !== undefined ? (
        <p className="text-xs text-muted-foreground">{resultCount} รายการล่าสุด</p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="text-base">ตัวกรอง</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">วันที่จอดรถ</label>
              <Input
                type="date"
                className="h-10"
                value={draft.date ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, date: e.target.value || null }))
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setDraft((prev) => ({ ...prev, date: todayISO() }))}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  วันนี้
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setDraft((prev) => ({ ...prev, date: null }))}
                >
                  ทุกวัน
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-department">
                สำนัก/หน่วยงาน
              </label>
              <select
                id="filter-department"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.departmentId ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    departmentId: e.target.value || null,
                  }))
                }
              >
                <option value="">ทุกสำนัก</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name_th}
                  </option>
                ))}
              </select>
            </div>

            {showStatusFilter ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-status">
                  สถานะ
                </label>
                <select
                  id="filter-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex-row gap-2 border-t border-border px-4 py-3 sm:justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              ล้างทั้งหมด
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="button" size="sm" onClick={applyDraft}>
                ใช้ตัวกรอง
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-foreground"
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0 opacity-60" />
    </button>
  );
}
