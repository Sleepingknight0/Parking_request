"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatusBadge,
  cn,
} from "@nacc/ui";
import {
  COMMS_STATUS_LEGEND,
  FEATURE_FLAGS,
  TH,
  STATUS_LABELS_TH,
  type RequestStatus,
} from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import {
  EMPTY_REQUEST_FILTERS,
  applyRequestListFilters,
  extractDepartmentsFromRows,
  pickRequestDateSlot,
  type RequestListFilters,
} from "@/lib/request-list-filters";
import {
  countCommsQueue,
  getCommsQueue,
  isCommsActionable,
  matchesCommsQueue,
  type CommsQueue,
  type CommsRequestRow,
} from "@/lib/comms-request-utils";
import { CommsQueueFilter } from "./comms-queue-filter";
import { CommsRequestDetailSheet } from "./comms-request-detail-sheet";
import { CommsVerificationBadge } from "./comms-verification-badge";
import { RequestSearchToolbar } from "./request-search-toolbar";

const COMMS_STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  ...COMMS_STATUS_LEGEND.map((value) => ({
    value,
    label: STATUS_LABELS_TH[value],
  })),
];

function sortByActionPriority(rows: CommsRequestRow[]): CommsRequestRow[] {
  return [...rows].sort((a, b) => {
    const qa = getCommsQueue(a);
    const qb = getCommsQueue(b);
    if (qa === "pending_approval" && qb !== "pending_approval") return -1;
    if (qb === "pending_approval" && qa !== "pending_approval") return 1;
    if (qa === "awaiting_verification" && qb !== "awaiting_verification") return -1;
    if (qb === "awaiting_verification" && qa !== "awaiting_verification") return 1;
    return 0;
  });
}

export function CommsRequestsList({
  rows,
  defaultQueue = "all",
  showTitle = true,
  showCalendarLink = false,
}: {
  rows: CommsRequestRow[];
  defaultQueue?: CommsQueue;
  showTitle?: boolean;
  showCalendarLink?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);
  const [queue, setQueue] = React.useState<CommsQueue>(defaultQueue);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const departments = React.useMemo(() => extractDepartmentsFromRows(rows), [rows]);
  const filtered = React.useMemo((): CommsRequestRow[] => {
    const base = applyRequestListFilters(rows, query, filters).filter((row) =>
      matchesCommsQueue(row, queue),
    );
    if (queue === "needs_action") return sortByActionPriority(base);
    return base;
  }, [rows, query, filters, queue]);

  const queueCounts = React.useMemo(
    () => ({
      needs_action: countCommsQueue(rows, "needs_action"),
      pending_approval: countCommsQueue(rows, "pending_approval"),
      in_security: countCommsQueue(rows, "in_security"),
      awaiting_verification: countCommsQueue(rows, "awaiting_verification"),
      verified: countCommsQueue(rows, "verified"),
    }),
    [rows],
  );

  return (
    <>
      <Card>
        <CardHeader className="space-y-3 pb-0 pt-4">
          {showTitle ? <CardTitle className="text-base">หนังสือและคำขอ</CardTitle> : null}
          <CommsQueueFilter value={queue} onChange={setQueue} counts={queueCounts} />
          <RequestSearchToolbar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            statusOptions={COMMS_STATUS_OPTIONS}
            resultCount={filtered.length}
          />
        </CardHeader>

        <CardContent className="space-y-2 pb-4 pt-3">
          {filtered.length === 0 ? (
            <EmptyState title={TH.state.noResults} description="ลองเปลี่ยนคำค้นหา ตัวกรอง หรือหมวดงาน" />
          ) : (
            <ul className="space-y-2">
              {filtered.map((request) => {
                const slot = pickRequestDateSlot(request, filters.date);
                const actionable = isCommsActionable(request);
                const commsQueue = getCommsQueue(request);
                return (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors active:bg-accent",
                        actionable
                          ? commsQueue === "pending_approval"
                            ? "border-amber-300 bg-amber-50/40"
                            : "border-orange-300 bg-orange-50/40"
                          : "border-border",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-900">
                            {request.official_letter_no}
                          </p>
                          <StatusBadge status={request.status as RequestStatus} className="text-[10px]" />
                          <CommsVerificationBadge request={request} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.department?.name_th ?? "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.requested_location?.name_th ?? request.requested_location_text ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot
                            ? `${formatThaiDate(slot.request_date)} · ${formatTimeRange(slot.start_time, slot.end_time)}`
                            : "ยังไม่ระบุวันที่จอด"}{" "}
                          · {request.cars_count} คัน
                        </p>
                        {FEATURE_FLAGS.officialLetterIndicators && request.officialLetterCount === 0 ? (
                          <p className="text-xs font-medium text-amber-700">{TH.comms.missingLetter}</p>
                        ) : null}
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {showCalendarLink ? (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="/comms/calendar">
                  <CalendarDays className="h-4 w-4" />
                  ดูปฏิทินงานจอดรถ
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CommsRequestDetailSheet
        requestId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
