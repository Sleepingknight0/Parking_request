import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, PageHeader, StatusLegend } from "@nacc/ui";
import { OFFICER_STATUS_LEGEND, TH, type ParkingRequestListItem } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { listRequests } from "@nacc/db/queries";
import {
  OfficerDashboardContent,
  type OfficerDashboardRow,
} from "@/components/officer-dashboard-content";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const supabase = getUserAppDb();
  const { rows } = await listRequests(supabase, { limit: 300 });
  const requests = rows as ParkingRequestListItem[];
  const requestIds = requests.map((request) => request.id);

  const { data: attachmentRows } = requestIds.length
    ? await supabase
        .from("request_attachments")
        .select("request_id")
        .eq("file_type", "official_letter")
        .in("request_id", requestIds)
    : { data: [] };

  const attachmentCount = new Map<string, number>();
  for (const row of attachmentRows ?? []) {
    const requestId = row.request_id as string;
    attachmentCount.set(requestId, (attachmentCount.get(requestId) ?? 0) + 1);
  }

  const dashboardRows: OfficerDashboardRow[] = requests.map((request) => ({
    ...request,
    officialLetterCount: attachmentCount.get(request.id) ?? 0,
  }));

  return (
    <>
      <PageHeader
        title={TH.nav.officerDashboard}
        description="บันทึกหนังสือราชการร่วมกัน แนบหลักฐาน และติดตามสถานะคำขอทั้งหมดในระบบ"
        actions={
          <Button asChild className="gap-2">
            <Link href="/officer/requests/new">
              <Plus className="h-4 w-4" />
              {TH.action.recordLetter}
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <StatusLegend statuses={OFFICER_STATUS_LEGEND} compact />
      </div>

      <OfficerDashboardContent rows={dashboardRows} />
    </>
  );
}
