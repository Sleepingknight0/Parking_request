"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
} from "@nacc/ui";
import { FEATURE_FLAGS, type ParkingRequestListItem, type RequestStatus } from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import { CommsVerificationBadge } from "./comms-verification-badge";
import {
  EMPTY_REQUEST_FILTERS,
  applyRequestListFilters,
  extractDepartmentsFromRows,
  pickRequestDateSlot,
  type RequestListFilters,
} from "@/lib/request-list-filters";
import { RequestSearchToolbar } from "./request-search-toolbar";

export type DashboardRequestRow = ParkingRequestListItem & {
  officialLetterCount?: number;
};

export function DashboardRequestPanel({
  allRows,
  onRowClick,
  rowHref,
  maxRows = 12,
  footer,
  missingLetterLabel = "ยังไม่แนบหนังสือ",
  showStatusFilter = false,
  showCommsVerification = false,
}: {
  allRows: DashboardRequestRow[];
  onRowClick?: (id: string) => void;
  rowHref?: (id: string) => string;
  maxRows?: number;
  footer?: React.ReactNode;
  missingLetterLabel?: string;
  showStatusFilter?: boolean;
  showCommsVerification?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);

  const departments = React.useMemo(() => extractDepartmentsFromRows(allRows), [allRows]);
  const filteredRows = React.useMemo(
    () => applyRequestListFilters(allRows, query, filters),
    [allRows, query, filters],
  );
  const visibleRows = filteredRows.slice(0, maxRows);

  function renderRow(request: DashboardRequestRow) {
    const slot = pickRequestDateSlot(request, filters.date);
    const content = (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{request.official_letter_no}</p>
          <p className="text-sm text-muted-foreground">
            {request.department?.name_th ?? "-"} ·{" "}
            {request.requested_location?.name_th ?? request.requested_location_text ?? "-"}
          </p>
          <p className="text-xs text-muted-foreground">
            {slot ? (
              <>
                {formatThaiDate(slot.request_date)} · {formatTimeRange(slot.start_time, slot.end_time)}
              </>
            ) : (
              "ยังไม่ระบุวันที่จอด"
            )}{" "}
            · {request.cars_count} คัน
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <StatusBadge status={request.status as RequestStatus} />
            {showCommsVerification ? <CommsVerificationBadge request={request} /> : null}
          </div>
          {FEATURE_FLAGS.officialLetterIndicators && request.officialLetterCount === 0 ? (
            <span className="text-xs font-medium text-amber-700">{missingLetterLabel}</span>
          ) : null}
        </div>
      </div>
    );

    const className =
      "block w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent active:bg-accent";

    if (onRowClick) {
      return (
        <button key={request.id} type="button" className={className} onClick={() => onRowClick(request.id)}>
          {content}
        </button>
      );
    }

    const href = rowHref?.(request.id) ?? `#`;
    return (
      <Link key={request.id} href={href} className={className}>
        {content}
      </Link>
    );
  }

  const hasQuery = query.trim().length > 0;
  const hasFilters =
    filters.date !== null || filters.departmentId !== null || filters.status !== "all";

  return (
    <Card>
      <CardHeader className="space-y-3 pb-0 pt-4">
        <CardTitle className="text-base">ค้นหาและรายการ</CardTitle>
        <RequestSearchToolbar
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          departments={departments}
          showStatusFilter={showStatusFilter}
          resultCount={filteredRows.length}
        />
      </CardHeader>

      <CardContent className="space-y-2 pb-4 pt-3">
        {visibleRows.length ? (
          visibleRows.map((request) => renderRow(request))
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {hasQuery || hasFilters
              ? "ไม่พบคำขอที่ตรงกับคำค้นหาหรือตัวกรอง"
              : "ยังไม่มีคำขอในระบบ"}
          </p>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
