import Link from "next/link";
import { FileText, Inbox, Plus, Send } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard, StatusBadge, StatusLegend } from "@nacc/ui";
import { OFFICER_STATUS_LEGEND, TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listRequests } from "@nacc/db/queries";
import { formatThaiDate } from "@nacc/utils";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const supabase = await createServerSupabase();
  const { rows } = await listRequests(supabase, { limit: 8 });
  const requests = rows as ParkingRequestListItem[];
  const drafts = requests.filter((r) => r.status === "draft").length;
  const submitted = requests.filter((r) => ["submitted", "under_review", "approved"].includes(r.status)).length;
  const active = requests.filter((r) => ["assigned", "in_progress"].includes(r.status)).length;

  return (
    <>
      <PageHeader
        title={TH.nav.officerDashboard}
        description="บันทึกหนังสือราชการและติดตามสถานะคำขอที่จอดรถของคุณ"
        actions={
          <Button asChild className="gap-2">
            <Link href="/officer/requests/new">
              <Plus className="h-4 w-4" />
              {TH.action.recordLetter}
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <StatusLegend
          statuses={OFFICER_STATUS_LEGEND}
          description="สีช่วยให้จำได้ว่าคำขอของคุณอยู่ขั้นตอนไหน"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="แบบร่าง" value={drafts} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="ส่งคำขอแล้ว" value={submitted} icon={<Send className="h-5 w-5" />} />
        <StatCard label="กำลังดำเนินการ" value={active} icon={<Inbox className="h-5 w-5" />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">สถานะล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length ? (
            requests.map((request) => (
              <Link
                key={request.id}
                href={`/officer/requests/${request.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{request.official_letter_no}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.department?.name_th ?? "-"} - {formatThaiDate(request.received_date)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีคำขอ</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
