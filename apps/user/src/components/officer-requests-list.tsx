"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, StatusBadge } from "@nacc/ui";
import { TH, type ParkingRequestListItem, type RequestStatus } from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import {
  EMPTY_REQUEST_FILTERS,
  applyRequestListFilters,
  extractDepartmentsFromRows,
  pickRequestDateSlot,
  type RequestListFilters,
} from "@/lib/request-list-filters";
import { OfficerRequestDetailSheet } from "./officer-request-detail-sheet";
import { RequestSearchToolbar } from "./request-search-toolbar";

export function OfficerRequestsList({ rows }: { rows: ParkingRequestListItem[] }) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const departments = React.useMemo(() => extractDepartmentsFromRows(rows), [rows]);
  const filtered = React.useMemo(
    () => applyRequestListFilters(rows, query, filters),
    [rows, query, filters],
  );

  return (
    <>
      <Card>
        <CardHeader className="space-y-3 pb-0 pt-4">
          <CardTitle className="text-base">รายการคำขอทั้งหมด</CardTitle>
          <RequestSearchToolbar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            showStatusFilter
            resultCount={filtered.length}
          />
        </CardHeader>

        <CardContent className="space-y-2 pb-4 pt-3">
          {filtered.length === 0 ? (
            <EmptyState title={TH.state.noResults} description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
          ) : (
            <ul className="space-y-2">
              {filtered.map((request) => {
                const slot = pickRequestDateSlot(request, filters.date);
                return (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors active:bg-accent"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-900">
                            {request.official_letter_no}
                          </p>
                          <StatusBadge status={request.status as RequestStatus} />
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
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <OfficerRequestDetailSheet
        requestId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
