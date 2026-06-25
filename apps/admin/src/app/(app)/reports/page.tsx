import type { ReactNode } from "react";
import {
  FileText,
  Car,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@nacc/ui";
import { TH, type RequestStatus } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import {
  StatusBarChart,
  DeptBarChart,
  PeriodTrendChart,
  type StatusDatum,
  type NamedDatum,
} from "@/components/charts";
import { ReportExport } from "@/components/report-export";
import { ReportFilters } from "@/components/report-filters";
import {
  parseReportFilters,
  fetchReportRows,
  buildReportSummary,
  reportFiltersToQuery,
  hasActiveFilters,
  type Breakdown,
} from "@/lib/report-summary";
import { formatThaiDateLong } from "@nacc/utils";
import {
  DashboardTrendMobile,
  DashboardStatusMobile,
  DashboardNamedMobile,
} from "@/components/dashboard-chart-mobile";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseReportFilters(sp);

  const supabase = await createServerSupabase();
  const [rows, { data: departments }] = await Promise.all([
    fetchReportRows(supabase, filters),
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);

  const summary = buildReportSummary(rows);

  const statusData: StatusDatum[] = summary.byStatus.map((s) => ({
    status: s.status,
    count: s.count,
  }));
  const deptData: NamedDatum[] = summary.byDept.slice(0, 12).map((d) => ({
    name: d.label,
    count: d.count,
  }));

  const printHref = `/reports/print${reportFiltersToQuery(filters)}`;
  const periodText =
    summary.receivedFrom && summary.receivedTo
      ? `${formatThaiDateLong(summary.receivedFrom)} – ${formatThaiDateLong(summary.receivedTo)}`
      : "ทุกช่วงเวลา";

  return (
    <>
      <PageHeader
        title={TH.nav.reports}
        description="สรุปข้อมูลคำขอที่จอดรถ แยกรายวัน/รายสัปดาห์/รายเดือน และส่งออกเป็นไฟล์"
        actions={
          <ReportExport
            rows={rows}
            printHref={printHref}
            summary={summary}
          />
        }
      />

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ตัวกรองรายงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters
            departments={departments ?? []}
            initial={{
              status: filters.status,
              departmentId: filters.departmentId,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
            }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            ช่วงข้อมูลที่แสดง: <span className="font-medium text-foreground">{periodText}</span>
            {hasActiveFilters(filters) ? " · กำลังใช้ตัวกรอง" : " · แสดงทั้งหมด"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-6">
        <StatCard compact label="คำขอทั้งหมด" value={summary.total} icon={<FileText className="h-5 w-5" />} />
        <StatCard compact label="จำนวนรถรวม" value={summary.totalCars} icon={<Car className="h-5 w-5" />} />
        <StatCard compact label={TH.dashboard.pending} value={summary.pending} icon={<Clock className="h-5 w-5" />} accentClassName="text-amber-600" />
        <StatCard compact label={TH.dashboard.inProgress} value={summary.inProgress} icon={<Loader2 className="h-5 w-5" />} accentClassName="text-orange-600" />
        <StatCard compact label={TH.dashboard.completed} value={summary.completed} icon={<CheckCircle2 className="h-5 w-5" />} accentClassName="text-emerald-600" />
        <StatCard compact label={TH.dashboard.cancelled} value={summary.cancelled} icon={<XCircle className="h-5 w-5" />} accentClassName="text-slate-500" />
      </div>

      <Card className="mt-6 lg:hidden">
        <CardHeader>
          <CardTitle className="text-base">{TH.reports.trendTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{TH.reports.trendHint}</p>
        </CardHeader>
        <CardContent>
          <DashboardTrendMobile data={summary.trend} />
        </CardContent>
      </Card>

      <Card className="mt-6 hidden lg:block">
        <CardHeader>
          <CardTitle className="text-base">{TH.reports.trendTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{TH.reports.trendHint}</p>
        </CardHeader>
        <CardContent>
          <PeriodTrendChart data={summary.trend} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{TH.dashboard.byStatus}</CardTitle></CardHeader>
          <CardContent>
            {statusData.length ? (
              <>
                <div className="lg:hidden"><DashboardStatusMobile data={statusData} /></div>
                <div className="hidden lg:block"><StatusBarChart data={statusData} /></div>
              </>
            ) : (
              <EmptyState title={TH.state.empty} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{TH.dashboard.byDepartment}</CardTitle></CardHeader>
          <CardContent>
            {deptData.length ? (
              <>
                <div className="lg:hidden"><DashboardNamedMobile data={deptData} /></div>
                <div className="hidden lg:block"><DeptBarChart data={deptData} /></div>
              </>
            ) : (
              <EmptyState title={TH.state.empty} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownCard title={TH.reports.byDay} rows={summary.byDay} firstColLabel="วันที่รับหนังสือ" />
        <BreakdownCard title={TH.reports.byWeek} rows={summary.byWeek} firstColLabel="ช่วงสัปดาห์" />
        <BreakdownCard title={TH.reports.byMonth} rows={summary.byMonth} firstColLabel="เดือน" />
        <BreakdownCard title="สรุปตามสถานะ" rows={summary.byStatus} firstColLabel="สถานะ" renderLabel={(r) => <StatusBadge status={r.key as RequestStatus} />} />
        <BreakdownCard title="สรุปตามสำนัก/หน่วยงาน" rows={summary.byDept} firstColLabel="สำนัก/หน่วยงาน" />
        <BreakdownCard title="สรุปตามสถานที่จอด" rows={summary.byLocation} firstColLabel="สถานที่" />
      </div>
    </>
  );
}

function BreakdownCard({
  title,
  rows,
  firstColLabel,
  renderLabel,
}: {
  title: string;
  rows: Breakdown[];
  firstColLabel: string;
  renderLabel?: (row: Breakdown) => ReactNode;
}) {
  const totalCount = rows.reduce((a, r) => a + r.count, 0);
  const totalCars = rows.reduce((a, r) => a + r.cars, 0);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="px-0 sm:px-6">
        {rows.length ? (
          <>
            <ul className="space-y-2 px-4 lg:hidden">
              {rows.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="min-w-0 text-sm font-medium">
                    {renderLabel ? renderLabel(r) : r.label}
                  </div>
                  <div className="shrink-0 text-right text-xs tabular-nums">
                    <div>{r.count} คำขอ</div>
                    <div className="text-muted-foreground">{r.cars} คัน</div>
                  </div>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 rounded-lg border-2 border-border bg-muted/30 p-3 font-semibold">
                <span>รวม</span>
                <div className="text-right text-xs tabular-nums">
                  <div>{totalCount} คำขอ</div>
                  <div>{totalCars} คัน</div>
                </div>
              </li>
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{firstColLabel}</TableHead>
                    <TableHead className="text-right">จำนวนคำขอ</TableHead>
                    <TableHead className="text-right">จำนวนรถ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-medium">
                        {renderLabel ? renderLabel(r) : r.label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.cars}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell>รวม</TableCell>
                    <TableCell className="text-right tabular-nums">{totalCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{totalCars}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="px-6"><EmptyState title={TH.state.empty} className="border-0 bg-transparent py-6" /></div>
        )}
      </CardContent>
    </Card>
  );
}
