"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, CalendarDays } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  RequestSearchToolbar,
  StatusBadge,
  cn,
} from "@nacc/ui";
import {
  ACTIVE_STATUSES,
  STATUS_LABELS_TH,
  TH,
  type ParkingRequestListItem,
  type RequestStatus,
} from "@nacc/types";
import {
  EMPTY_REQUEST_FILTERS,
  applyRequestListFilters,
  extractDepartmentsFromRows,
  formatThaiDate,
  formatTimeRange,
  pickRequestDateSlot,
  toCsv,
  downloadFile,
  type RequestListFilters,
} from "@nacc/utils";
import {
  computeAdminQueueCounts,
  getAdminQueue,
  isAdminActionable,
  matchesAdminQueue,
  sortByAdminActionPriority,
  type AdminQueue,
} from "@/lib/admin-request-utils";
import { AdminQueueFilter } from "./admin-queue-filter";

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  ...ACTIVE_STATUSES.map((s) => ({
    value: s,
    label: STATUS_LABELS_TH[s as RequestStatus],
  })),
];

const PAGE_SIZE = 12;

function firstDate(r: ParkingRequestListItem): string {
  const d = r.request_dates?.[0];
  return d ? formatThaiDate(d.request_date) : "-";
}

export function AdminRequestsPanel({
  rows,
  departments: departmentsProp,
  defaultQueue = "needs_action",
  showTitle = false,
  title = TH.nav.requests,
  showQueueFilter = true,
  showExport = true,
  maxCardRows,
  showViewAllLink = false,
  showCalendarLink = false,
}: {
  rows: ParkingRequestListItem[];
  departments?: { id: string; name_th: string }[];
  defaultQueue?: AdminQueue;
  showTitle?: boolean;
  title?: string;
  showQueueFilter?: boolean;
  showExport?: boolean;
  maxCardRows?: number;
  showViewAllLink?: boolean;
  showCalendarLink?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);
  const [queue, setQueue] = React.useState<AdminQueue>(defaultQueue);
  const [page, setPage] = React.useState(0);

  const departments = React.useMemo(
    () => departmentsProp ?? extractDepartmentsFromRows(rows),
    [departmentsProp, rows],
  );

  const filtered = React.useMemo(() => {
    let base = applyRequestListFilters(rows, query, filters).filter((row) =>
      matchesAdminQueue(row, queue),
    );
    if (queue === "needs_action") base = sortByAdminActionPriority(base);
    if (maxCardRows !== undefined) return base.slice(0, maxCardRows);
    return base;
  }, [rows, query, filters, queue, maxCardRows]);

  React.useEffect(() => {
    setPage(0);
  }, [query, filters, queue]);

  const queueCounts = React.useMemo(() => computeAdminQueueCounts(rows), [rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRows =
    maxCardRows !== undefined ? filtered : filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleExport() {
    const csv = toCsv(filtered, [
      { header: "เลขที่คำขอ", value: (r) => r.request_no },
      { header: "เลขหนังสือ", value: (r) => r.official_letter_no },
      { header: "สำนัก", value: (r) => r.department?.name_th ?? "" },
      { header: "วันที่จอด", value: (r) => firstDate(r) },
      { header: "จำนวนรถ", value: (r) => r.cars_count },
      { header: "สถานะ", value: (r) => STATUS_LABELS_TH[r.status] },
      { header: "ผู้รับผิดชอบ", value: (r) => r.assigned_to_profile?.display_name ?? "" },
    ]);
    downloadFile(csv, `parking-requests-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <Card>
      <CardHeader className="space-y-3 pb-0 pt-4">
        {showTitle ? <CardTitle className="text-base">{title}</CardTitle> : null}
        {showQueueFilter ? (
          <AdminQueueFilter value={queue} onChange={setQueue} counts={queueCounts} />
        ) : null}
        <RequestSearchToolbar
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          departments={departments}
          statusOptions={STATUS_OPTIONS}
          resultCount={filtered.length}
          searchPlaceholder="ค้นหาเลขหนังสือ สำนัก สถานที่ หรือเลขที่คำขอ"
        />
        {showExport ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {TH.action.export}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pb-4 pt-3">
        {visibleRows.length === 0 ? (
          <EmptyState title={TH.state.noResults} description="ลองเปลี่ยนคำค้นหา ตัวกรอง หรือหมวดงาน" />
        ) : (
          <ul className="space-y-2">
            {visibleRows.map((request) => {
              const slot = pickRequestDateSlot(request, filters.date);
              const actionable = isAdminActionable(request);
              const adminQueue = getAdminQueue(request);
              return (
                <li key={request.id}>
                  <Link
                    href={`/requests/${request.id}`}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors active:bg-accent hover:bg-accent/50",
                      actionable
                        ? adminQueue === "under_review"
                          ? "border-amber-300 bg-amber-50/40"
                          : "border-violet-300 bg-violet-50/40"
                        : "border-border",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {request.official_letter_no || request.request_no}
                        </p>
                        <StatusBadge status={request.status} className="text-[10px]" />
                      </div>
                      <p className="text-xs text-muted-foreground">{request.request_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.department?.name_th ?? "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.requested_location?.name_th ??
                          request.requested_location_text ??
                          "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot
                          ? `${formatThaiDate(slot.request_date)} · ${formatTimeRange(slot.start_time, slot.end_time)}`
                          : "ยังไม่ระบุวันที่จอด"}{" "}
                        · {request.cars_count} คัน
                        {request.assigned_to_profile?.display_name
                          ? ` · ${request.assigned_to_profile.display_name}`
                          : ""}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {maxCardRows === undefined && filtered.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">{filtered.length} รายการ</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {page + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {showViewAllLink && maxCardRows !== undefined && filtered.length > maxCardRows ? (
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/requests">ดูรายการทั้งหมด ({filtered.length})</Link>
            </Button>
          </div>
        ) : null}

        {showCalendarLink ? (
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href="/calendar">
                <CalendarDays className="h-4 w-4" />
                ดูปฏิทินงานจอดรถ
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
