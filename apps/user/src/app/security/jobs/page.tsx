import Link from "next/link";
import {
  Button,
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import { requireAppMode } from "@/lib/user-guards";
import { SecurityStatusBadge } from "@/components/security-status-badge";

export const dynamic = "force-dynamic";

export default async function SecurityJobsPage() {
  await requireAppMode("security");
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("parking_requests")
    .select(REQUEST_LIST_SELECT)
    .in("status", ["approved", "assigned", "in_progress", "completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(300);
  const jobs = (data ?? []) as unknown as ParkingRequestListItem[];

  return (
    <>
      <PageHeader title={TH.nav.jobs} description="รายการงานคำขอที่จอดรถทั้งหมดที่เกี่ยวข้องกับ รปภ." />
      {jobs.length ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{TH.entity.officialLetterNo}</TableHead>
                <TableHead>{TH.entity.department}</TableHead>
                <TableHead>{TH.entity.requestedDate}</TableHead>
                <TableHead>{TH.entity.requestedLocation}</TableHead>
                <TableHead>{TH.entity.status}</TableHead>
                <TableHead className="text-right">{TH.action.viewDetail}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const firstDate = job.request_dates[0];
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.official_letter_no}</TableCell>
                    <TableCell>{job.department?.name_th ?? "-"}</TableCell>
                    <TableCell>
                      {firstDate
                        ? `${formatThaiDate(firstDate.request_date)} ${formatTimeRange(firstDate.start_time, firstDate.end_time)}`
                        : "-"}
                    </TableCell>
                    <TableCell>{job.requested_location?.name_th ?? job.requested_location_text ?? "-"}</TableCell>
                    <TableCell>
                      <SecurityStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/security/jobs/${job.id}`}>{TH.action.viewDetail}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="ยังไม่มีงาน" description="เมื่องานใหม่ถูกส่งเข้าระบบ รายการจะแสดงที่นี่" />
      )}
    </>
  );
}
