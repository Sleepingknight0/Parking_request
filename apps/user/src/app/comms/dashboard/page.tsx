import Link from "next/link";
import { PageHeader, Button, StatusLegend } from "@nacc/ui";
import { COMMS_STATUS_LEGEND, TH } from "@nacc/types";
import { listCommsRequests, enrichCommsRowsWithLetterCounts } from "@/lib/comms-data";
import {
  getCommsOperationalSettings,
  runCommsAutoPipeline,
} from "@/lib/comms-operational-settings";
import { CommsDashboardContent } from "@/components/comms-dashboard-content";
import { CommsSpecialModesPanel } from "@/components/comms-special-modes-panel";

export const dynamic = "force-dynamic";

export default async function CommsDashboardPage() {
  await runCommsAutoPipeline("comms");
  const [rows, settings] = await Promise.all([
    enrichCommsRowsWithLetterCounts(await listCommsRequests()),
    getCommsOperationalSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="หน้าหลักพนักงานสื่อสาร"
        description="เลือกหมวดงานด้านบนเพื่อดูรายการที่ต้องอนุมัติ ตรวจงาน หรือติดตามสถานะ"
        actions={
          <Button asChild>
            <Link href="/comms/requests/new">{TH.comms.recordLetter}</Link>
          </Button>
        }
      />

      <div className="mb-4">
        <StatusLegend statuses={COMMS_STATUS_LEGEND} compact />
      </div>

      <div className="mb-4">
        <CommsSpecialModesPanel initialSettings={settings} />
      </div>

      <CommsDashboardContent rows={rows} />
    </>
  );
}
