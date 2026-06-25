import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listRequests } from "@nacc/db/queries";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";

export const dynamic = "force-dynamic";

export default async function OfficerRequestsPage() {
  const supabase = await createServerSupabase();
  const { rows } = await listRequests(supabase, { limit: 200 });
  const requests = rows as ParkingRequestListItem[];

  return (
    <>
      <PageHeader
        title={TH.nav.myRequests}
        description="ดูคำขอที่บันทึกไว้ แบบร่าง และสถานะล่าสุด"
        actions={
          <Button asChild className="gap-2">
            <Link href="/officer/requests/new">
              <Plus className="h-4 w-4" />
              {TH.action.recordLetter}
            </Link>
          </Button>
        }
      />

      {requests.length ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{TH.entity.officialLetterNo}</TableHead>
                <TableHead>{TH.entity.requestedDate}</TableHead>
                <TableHead>{TH.entity.requestedLocation}</TableHead>
                <TableHead>{TH.entity.carsCount}</TableHead>
                <TableHead>{TH.entity.status}</TableHead>
                <TableHead className="text-right">{TH.action.viewDetail}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const firstDate = request.request_dates[0];
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.official_letter_no}</TableCell>
                    <TableCell>
                      {firstDate
                        ? `${formatThaiDate(firstDate.request_date)} ${formatTimeRange(firstDate.start_time, firstDate.end_time)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {request.requested_location?.name_th ?? request.requested_location_text ?? "-"}
                    </TableCell>
                    <TableCell>{request.cars_count}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/officer/requests/${request.id}`}>{TH.action.viewDetail}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="ยังไม่มีคำขอ"
          description="เริ่มจากบันทึกหนังสือราชการขอที่จอดรถรายการแรก"
          action={
            <Button asChild>
              <Link href="/officer/requests/new">{TH.action.recordLetter}</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
