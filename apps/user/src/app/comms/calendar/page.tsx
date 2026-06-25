import { PageHeader, StatusLegend } from "@nacc/ui";
import { COMMS_STATUS_LEGEND, TH } from "@nacc/types";
import { requireAppMode } from "@/lib/user-guards";
import { listCommsRequests } from "@/lib/comms-data";
import { buildParkingCalendarEvents } from "@/lib/parking-calendar-events";
import { todayIsoLocal } from "@/lib/date-iso";
import { ParkingCalendarView } from "@/components/parking-calendar-view";

export const dynamic = "force-dynamic";

export default async function CommsCalendarPage() {
  await requireAppMode("comms");
  const today = todayIsoLocal();
  const rows = await listCommsRequests();
  const events = buildParkingCalendarEvents(rows);

  return (
    <>
      <PageHeader
        title={TH.nav.parkingCalendar}
        description="ปฏิทินคำขอที่จอดรถทั้งหมด — แตะรายการเพื่อเปิดรายละเอียด"
      />

      <div className="mb-4">
        <StatusLegend statuses={COMMS_STATUS_LEGEND} compact />
      </div>

      <ParkingCalendarView
        events={events}
        todayIso={today}
        detailPathPrefix="/comms/requests"
      />
    </>
  );
}
