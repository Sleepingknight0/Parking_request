import Link from "next/link";
import {
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Car,
  Inbox,
  UserX,
} from "lucide-react";
import {
  StatCard,
  PageHeader,
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
  Button,
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
import { formatThaiDate } from "@nacc/utils";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import {
  StatusBarChart,
  DeptBarChart,
  CarsByDateChart,
  type StatusDatum,
  type NamedDatum,
} from "@/components/charts";

export const dynamic = "force-dynamic";

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const today = isoOffset(0);

  const [{ data: allRaw }, { data: dateRaw }, recent] = await Promise.all([
    supabase
      .from("parking_requests")
      .select("id,status,cars_count,received_date,assigned_to,department:departments(name_th,short_name)"),
    supabase
      .from("request_dates")
      .select("request_date,parking_requests(cars_count,status)")
      .gte("request_date", today)
      .lte("request_date", isoOffset(13)),
    listRequests(supabase, { limit: 8 }),
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

  const recentRows = recent.rows as ParkingRequestListItem[];

  return (
    <>
      <RealtimeRefresh />
      <PageHeader
        title={TH.nav.dashboard}
        description="ภาพรวมคำขอที่จอดรถทั้งหมดในระบบ"
        actions={
          <Button asChild>
            <Link href="/requests/new">{TH.action.create}</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={TH.dashboard.totalRequests} value={all.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard label={TH.dashboard.pending} value={count("under_review")} icon={<Clock className="h-5 w-5" />} accentClassName="text-amber-600" />
        <StatCard label={TH.dashboard.inProgress} value={count("in_progress")} icon={<Loader2 className="h-5 w-5" />} accentClassName="text-orange-600" />
        <StatCard label={TH.dashboard.completed} value={count("completed")} icon={<CheckCircle2 className="h-5 w-5" />} accentClassName="text-emerald-600" />
        <StatCard label={TH.dashboard.cancelled} value={count("cancelled")} icon={<XCircle className="h-5 w-5" />} accentClassName="text-slate-500" />
        <StatCard label={TH.dashboard.carsToday} value={carsToday} icon={<Car className="h-5 w-5" />} hint={`ณ วันที่ ${formatThaiDate(today)}`} />
        <StatCard label={TH.dashboard.lettersToday} value={lettersToday} icon={<Inbox className="h-5 w-5" />} />
        <StatCard label={TH.dashboard.unassigned} value={unassigned} icon={<UserX className="h-5 w-5" />} accentClassName="text-amber-600" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{TH.dashboard.byDepartment}</CardTitle></CardHeader>
          <CardContent>
            {deptData.length ? <DeptBarChart data={deptData} /> : <EmptyState title={TH.state.empty} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{TH.dashboard.recentRequests}</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/requests">ดูทั้งหมด</Link></Button>
          </CardHeader>
          <CardContent className="px-0">
            {recentRows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{TH.entity.requestNo}</TableHead>
                    <TableHead className="text-right">{TH.entity.department}</TableHead>
                    <TableHead className="text-right">{TH.entity.carsCount}</TableHead>
                    <TableHead className="text-right">{TH.entity.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/requests/${r.id}`} className="font-medium text-primary hover:underline">
                          {r.request_no}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.official_letter_no}</div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">
                        {r.department?.short_name || r.department?.name_th || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{r.cars_count}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="px-6"><EmptyState title="ยังไม่มีคำขอในระบบ" /></div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
