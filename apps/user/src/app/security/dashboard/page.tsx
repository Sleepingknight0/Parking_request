import Link from "next/link";
import { CheckCircle2, Clock, Inbox, PlayCircle, XCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard, StatusBadge } from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { formatThaiDate } from "@nacc/utils";

export const dynamic = "force-dynamic";

export default async function SecurityDashboardPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("parking_requests")
    .select(REQUEST_LIST_SELECT)
    .in("status", ["approved", "assigned", "in_progress", "completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(12);
  const jobs = (data ?? []) as unknown as ParkingRequestListItem[];

  const count = (status: string) => jobs.filter((job) => job.status === status).length;

  return (
    <>
      <PageHeader
        title={TH.nav.securityDashboard}
        description="ดูงานใหม่ รับงาน และติดตามงานที่กำลังดำเนินการ"
        actions={
          <Button asChild>
            <Link href="/security/jobs">ดูรายการงาน</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="งานใหม่" value={count("approved")} icon={<Inbox className="h-5 w-5" />} />
        <StatCard label="งานที่รับแล้ว" value={count("assigned")} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="กำลังดำเนินการ" value={count("in_progress")} icon={<PlayCircle className="h-5 w-5" />} />
        <StatCard label="เสร็จแล้ว" value={count("completed")} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="ยกเลิก" value={count("cancelled")} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">งานล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/security/jobs/${job.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{job.official_letter_no}</p>
                <p className="text-sm text-muted-foreground">
                  {job.department?.name_th ?? "-"} - {formatThaiDate(job.request_dates[0]?.request_date)}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
