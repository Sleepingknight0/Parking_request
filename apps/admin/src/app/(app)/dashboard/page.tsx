import Link from "next/link";
import { Plus } from "lucide-react";
import {
  PageHeader,
  StatusLegend,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  EmptyState,
} from "@nacc/ui";
import {
  TH,
  ADMIN_STATUS_LEGEND,
  REQUEST_STATUSES,
  type RequestStatus,
  type ParkingRequestListItem,
} from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { listRequests } from "@nacc/db/queries";
import { formatThaiDate } from "@nacc/utils";
import {
  StatusBarChart,
  DeptBarChart,
  CarsByDateChart,
  PeriodTrendChart,
  type StatusDatum,
  type NamedDatum,
} from "@/components/charts";
import { AdminDashboardContent } from "@/components/admin-dashboard-content";
import { buildReportTrend } from "@/lib/report-summary";
import {
  DashboardTrendMobile,
  DashboardStatusMobile,
  DashboardNamedMobile,
} from "@/components/dashboard-chart-mobile";

export const dynamic = "force-dynamic";

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const canWrite = profile.role === "super_admin" || profile.role === "admin";
  const supabase = await createServerSupabase();
  const today = isoOffset(0);

  const [{ data: allRaw }, { data: dateRaw }, { rows: workRows }] = await Promise.all([
    supabase
      .from("parking_requests")
      .select("id,status,cars_count,received_date,assigned_to,department:departments(name_th,short_name)"),
    supabase
      .from("request_dates")
      .select("request_date,parking_requests(cars_count,status)")
      .gte("request_date", today)
      .lte("request_date", isoOffset(13)),
    listRequests(supabase, { limit: 200 }),
  ]);

  const all = (allRaw ?? []) as unknown as Array<{
    status: RequestStatus;
    cars_count: number;
    received_date: string | null;
    assigned_to: string | null;
    department: { name_th: string; short_name: string | null } | null;
  }>;

  const byStatus = new Map<RequestStatus, number>();
  const byDept = new Map<string, number>();
  for (const r of all) {
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    const dn = r.department?.short_name || r.department?.name_th;
    if (dn) byDept.set(dn, (byDept.get(dn) ?? 0) + 1);
  }
  const count = (s: RequestStatus) => byStatus.get(s) ?? 0;

  const lettersToday = all.filter((r) => r.received_date === today).length;
  const unassigned = all.filter(
    (r) => r.status === "approved" && !r.assigned_to,
  ).length;

  const dateRows = (dateRaw ?? []) as unknown as Array<{
    request_date: string;
    parking_requests: { cars_count: number; status: RequestStatus } | null;
  }>;
  const carsByDateMap = new Map<string, number>();
  let carsToday = 0;
  for (const d of dateRows) {
    const p = d.parking_requests;
    if (!p || p.status === "cancelled") continue;
    carsByDateMap.set(d.request_date, (carsByDateMap.get(d.request_date) ?? 0) + p.cars_count);
    if (d.request_date === today) carsToday += p.cars_count;
  }

  const statusData: StatusDatum[] = REQUEST_STATUSES.filter(
    (s) => count(s) > 0,
  ).map((status) => ({ status, count: count(status) }));

  const deptData: NamedDatum[] = [...byDept.entries()]
    .map(([name, c]) => ({ name, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const carsByDate: NamedDatum[] = [...carsByDateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, c]) => ({ name: formatThaiDate(date).slice(0, 5), count: c }));

  const trend = buildReportTrend(all);

  const workPanelRows = workRows as ParkingRequestListItem[];

  return (
    <>
      <PageHeader
        title={TH.nav.dashboard}
        description="ติดตามคำขอที่ต้องจัดการ ปฏิทินด่วน และสรุปภาพรวม"
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/requests/new">{TH.action.create}</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <StatusLegend statuses={ADMIN_STATUS_LEGEND} compact />
      </div>

      <AdminDashboardContent
        rows={workPanelRows}
        todayIso={today}
        stats={{
          total: all.length,
          pending: count("under_review"),
          inProgress: count("in_progress"),
          completed: count("completed"),
          carsToday,
          unassigned,
          lettersToday,
          cancelled: count("cancelled"),
        }}
      />

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">วิเคราะห์และสรุป</h2>

        <Card className="lg:hidden">
          <CardHeader>
            <CardTitle className="text-base">แนวโน้มคำขอและจำนวนรถ</CardTitle>
            <p className="text-sm text-muted-foreground">สรุป 7 วันล่าสุด</p>
          </CardHeader>
          <CardContent>
            <DashboardTrendMobile data={trend} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:hidden">
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.dashboard.byStatus}</CardTitle></CardHeader>
            <CardContent>
              <DashboardStatusMobile data={statusData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.dashboard.carsByDate}</CardTitle></CardHeader>
            <CardContent>
              <DashboardNamedMobile data={carsByDate} emptyLabel="ไม่มีคำขอในช่วง 14 วันข้างหน้า" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.dashboard.byDepartment}</CardTitle></CardHeader>
            <CardContent>
              <DashboardNamedMobile data={deptData} />
            </CardContent>
          </Card>
        </div>

        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="text-base">แนวโน้มคำขอและจำนวนรถ</CardTitle>
            <p className="text-sm text-muted-foreground">
              ดูจำนวนคำขอและจำนวนรถตามช่วงเวลา — เลือกดูแบบรายวัน รายสัปดาห์ หรือรายเดือน
            </p>
          </CardHeader>
          <CardContent>
            <PeriodTrendChart data={trend} />
          </CardContent>
        </Card>

        <div className="hidden gap-4 lg:grid lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.dashboard.byStatus}</CardTitle></CardHeader>
            <CardContent>
              {statusData.length ? <StatusBarChart data={statusData} /> : <EmptyState title={TH.state.empty} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.dashboard.carsByDate}</CardTitle></CardHeader>
            <CardContent>
              {carsByDate.length ? <CarsByDateChart data={carsByDate} /> : <EmptyState title="ไม่มีคำขอในช่วง 14 วันข้างหน้า" />}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">{TH.dashboard.byDepartment}</CardTitle></CardHeader>
            <CardContent>
              {deptData.length ? <DeptBarChart data={deptData} /> : <EmptyState title={TH.state.empty} />}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
