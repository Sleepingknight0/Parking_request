import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
} from "@nacc/ui";
import {
  TH,
  REQUEST_STATUSES,
  type RequestStatus,
  type ParkingRequestListItem,
} from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listRequests } from "@nacc/db/queries";
import { StatusBarChart, DeptBarChart, type StatusDatum, type NamedDatum } from "@/components/charts";
import { ReportExport } from "@/components/report-export";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createServerSupabase();
  const { rows } = await listRequests(supabase, { limit: 1000 });
  const list = rows as ParkingRequestListItem[];

  const byStatus = new Map<RequestStatus, number>();
  const byDept = new Map<string, number>();
  for (const r of list) {
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    const dn = r.department?.short_name || r.department?.name_th;
    if (dn) byDept.set(dn, (byDept.get(dn) ?? 0) + 1);
  }
  const statusData: StatusDatum[] = REQUEST_STATUSES.filter((s) => (byStatus.get(s) ?? 0) > 0).map(
    (status) => ({ status, count: byStatus.get(status) ?? 0 }),
  );
  const deptData: NamedDatum[] = [...byDept.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <>
      <PageHeader
        title={TH.nav.reports}
        description="สรุปข้อมูลและส่งออกรายงาน"
        actions={<ReportExport rows={list} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{TH.dashboard.byStatus}</CardTitle></CardHeader>
          <CardContent>{statusData.length ? <StatusBarChart data={statusData} /> : <EmptyState title={TH.state.empty} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{TH.dashboard.byDepartment}</CardTitle></CardHeader>
          <CardContent>{deptData.length ? <DeptBarChart data={deptData} /> : <EmptyState title={TH.state.empty} />}</CardContent>
        </Card>
      </div>
    </>
  );
}
