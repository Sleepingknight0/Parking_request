import Link from "next/link";
import { FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard, StatusBadge, StatusLegend } from "@nacc/ui";
import { COMMS_STATUS_LEGEND, OPEN_STATUSES, TH, type RequestStatus } from "@nacc/types";
import { listCommsRequests } from "@/lib/comms-data";
import { formatThaiDate } from "@nacc/utils";

export const dynamic = "force-dynamic";

export default async function CommsDashboardPage() {
  const rows = await listCommsRequests();
  const count = (status: RequestStatus) => rows.filter((r) => r.status === status).length;
  const openCount = rows.filter((r) => OPEN_STATUSES.includes(r.status as RequestStatus)).length;
  const recent = rows.slice(0, 8);

  return (
    <>
      <PageHeader
        title="หน้าหลักพนักงานสื่อสาร"
        description="ดูสถานะงาน หนังสือราชการ และประสานงาน — ไม่มีสิทธิ์อนุมัติเหมือนผู้ดูแล"
        actions={
          <Button asChild>
            <Link href="/comms/requests">ดูหนังสือและคำขอทั้งหมด</Link>
          </Button>
        }
      />

      <div className="mb-6">
        <StatusLegend
          statuses={COMMS_STATUS_LEGEND}
          description="สีบนป้ายสถานะและปฏิทินใช้ชุดเดียวกันทั้งระบบ"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="คำขอทั้งหมด" value={rows.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="งานที่เปิดอยู่" value={openCount} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="รอดำเนินการ" value={count("submitted") + count("under_review")} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="กำลังดำเนินการ" value={count("assigned") + count("in_progress")} icon={<FileText className="h-5 w-5" />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">คำขอล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.map((row) => (
            <Link
              key={row.id}
              href={`/comms/requests/${row.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.official_letter_no}</p>
                <p className="text-sm text-muted-foreground">
                  {row.department?.name_th ?? "-"} · {formatThaiDate(row.request_dates[0]?.request_date)}
                </p>
              </div>
              <StatusBadge status={row.status as RequestStatus} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
