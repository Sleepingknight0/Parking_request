"use client";

import * as React from "react";
import { ClipboardList, ShieldCheck } from "lucide-react";
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

const SECURITY_JOB_STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  ...(["approved", "assigned", "in_progress"] as const).map((value) => ({
    value,
    label: SECURITY_STATUS_LABELS_TH[value],
  })),
];

export function SecurityJobsList({
  jobs,
  profileId,
}: {
  jobs: SecurityJobRow[];
  profileId: string;
}) {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<RequestListFilters>(EMPTY_REQUEST_FILTERS);

  const departments = React.useMemo(() => extractDepartmentsFromRows(jobs), [jobs]);
  const filtered = React.useMemo(
    () => applySecurityJobListFilters(jobs, query, filters),
    [jobs, query, filters],
  );

  const awaiting = jobs.filter((j) => j.status === "approved").length;
  const mine = jobs.filter(
    (j) =>
      j.assigned_to === profileId &&
      (j.status === "assigned" || j.status === "in_progress"),
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          compact
          label="รอรับทราบ"
          value={awaiting}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          compact
          label="งานของฉัน"
          value={mine}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard compact label="ทั้งหมด" value={jobs.length} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="space-y-3 pb-0 pt-4">
          <CardTitle className="text-base">{TH.nav.jobs}</CardTitle>
          <RequestSearchToolbar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            statusOptions={SECURITY_JOB_STATUS_OPTIONS}
            resultCount={filtered.length}
          />
        </CardHeader>

        <CardContent className="space-y-2 pb-4 pt-3">
          {filtered.length === 0 ? (
            <EmptyState
              title={jobs.length ? TH.state.noResults : "ยังไม่มีงาน"}
              description={
                jobs.length
                  ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                  : "เมื่องานใหม่ถูกส่งเข้าระบบ รายการจะแสดงที่นี่"
              }
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((job) => (
                <li key={job.id}>
                  <SecurityJobListCard
                    job={job}
                    profileId={profileId}
                    href={`/security/jobs/${job.id}`}
                    showPrep
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
