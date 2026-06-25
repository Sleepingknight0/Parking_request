import Link from "next/link";
import {
  PageHeader,
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
  StatusBadge,
  EmptyState,
  Button,
} from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listRequests } from "@nacc/db/queries";
import { formatThaiDate } from "@nacc/utils";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const supabase = await createServerSupabase();
  const { rows } = await listRequests(supabase, { limit: 500 });
  const list = rows as ParkingRequestListItem[];

  const unassigned = list.filter((r) => r.status === "approved" && !r.assigned_to);
  const active = list.filter((r) => r.status === "assigned" || r.status === "in_progress");

  return (
    <>
      <RealtimeRefresh />
      <PageHeader title={TH.nav.assignments} description="ติดตามการมอบหมายงานให้พนักงานสื่อสาร/รปภ." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{TH.dashboard.unassigned} ({unassigned.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RequestMiniTable rows={unassigned} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานที่กำลังดำเนินการ ({active.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RequestMiniTable rows={active} showAssignee />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function RequestMiniTable({
  rows,
  showAssignee,
}: {
  rows: ParkingRequestListItem[];
  showAssignee?: boolean;
}) {
  if (!rows.length) {
    return <div className="px-6"><EmptyState title={TH.state.empty} className="border-0 bg-transparent py-8" /></div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">{TH.entity.requestNo}</TableHead>
          <TableHead className="text-right">{TH.entity.requestedDate}</TableHead>
          <TableHead className="text-right">{showAssignee ? TH.entity.assignedTo : TH.entity.status}</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <div className="font-medium">{r.request_no}</div>
              <div className="text-xs text-muted-foreground">{r.department?.short_name || r.department?.name_th}</div>
            </TableCell>
            <TableCell className="text-sm">
              {r.request_dates?.[0] ? formatThaiDate(r.request_dates[0].request_date) : "-"}
            </TableCell>
            <TableCell>
              {showAssignee ? (
                <span className="text-sm">{r.assigned_to_profile?.display_name ?? "-"}</span>
              ) : (
                <StatusBadge status={r.status} />
              )}
            </TableCell>
            <TableCell>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/requests/${r.id}`}>{TH.action.assign}</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
