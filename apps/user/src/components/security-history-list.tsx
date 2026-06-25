"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatCard,
} from "@nacc/ui";
import {
  SECURITY_STATUS_LABELS_TH,
  TH,
} from "@nacc/types";
import {
  EMPTY_REQUEST_FILTERS,
  extractDepartmentsFromRows,
  type RequestListFilters,
} from "@/lib/request-list-filters";
import { applySecurityJobListFilters, type SecurityJobRow } from "@/lib/security-job-utils";
import { RequestSearchToolbar } from "./request-search-toolbar";
import { SecurityJobListCard } from "./security-job-list-card";

const HISTORY_STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "completed", label: SECURITY_STATUS_LABELS_TH.completed },
  { value: "cancelled", label: SECURITY_STATUS_LABELS_TH.cancelled },
];

export function SecurityHistoryList({ jobs }: { jobs: SecurityJobRow[] }) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);

  const departments = React.useMemo(() => extractDepartmentsFromRows(jobs), [jobs]);
  const filtered = React.useMemo(
    () => applySecurityJobListFilters(jobs, query, filters),
    [jobs, query, filters],
  );

  const completed = jobs.filter((j) => j.status === "completed").length;
  const cancelled = jobs.filter((j) => j.status === "cancelled").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          compact
          label="เสร็จแล้ว"
          value={completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentClassName="text-emerald-600"
        />
        <StatCard
          compact
          label="ยกเลิก"
          value={cancelled}
          icon={<XCircle className="h-5 w-5" />}
          accentClassName={cancelled ? "text-amber-600" : undefined}
        />
        <StatCard compact label="ทั้งหมด" value={jobs.length} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="space-y-3 pb-0 pt-4">
          <CardTitle className="text-base">{TH.nav.history}</CardTitle>
          <RequestSearchToolbar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            statusOptions={HISTORY_STATUS_OPTIONS}
            resultCount={filtered.length}
          />
        </CardHeader>

        <CardContent className="space-y-2 pb-4 pt-3">
          {filtered.length === 0 ? (
            <EmptyState
              title={jobs.length ? TH.state.noResults : "ยังไม่มีประวัติ"}
              description={
                jobs.length
                  ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                  : "งานที่เสร็จแล้วหรือยกเลิกจะแสดงในหน้านี้"
              }
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((job) => (
                <li key={job.id}>
                  <SecurityJobListCard
                    job={job}
                    href={`/security/jobs/${job.id}`}
                    showPrep={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
