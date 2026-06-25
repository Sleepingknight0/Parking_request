import { PageHeader, StatusLegend } from "@nacc/ui";
import { OFFICER_STATUS_LEGEND, TH, type ParkingRequestListItem } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { listRequests } from "@nacc/db/queries";
import { requireAppMode } from "@/lib/user-guards";
import { buildParkingCalendarEvents } from "@/lib/parking-calendar-events";
import { todayIsoLocal } from "@/lib/date-iso";
import { ParkingCalendarView } from "@/components/parking-calendar-view";

export const dynamic = "force-dynamic";

export default async function OfficerCalendarPage() {
  await requireAppMode("officer");
  const supabase = getUserAppDb();
  const today = todayIsoLocal();
  const { rows } = await listRequests(supabase, { limit: 300 });
  const events = buildParkingCalendarEvents(rows as ParkingRequestListItem[]);

  return (
    <>
      <PageHeader
        title={TH.nav.parkingCalendar}
        description="ปฏิทินคำขอที่จอดรถทั้งหมด — แตะรายการเพื่อเปิดรายละเอียด"
      />

      <div className="mb-4">
        <StatusLegend statuses={OFFICER_STATUS_LEGEND} compact />
      </div>

      <ParkingCalendarView
        events={events}
        todayIso={today}
        detailPathPrefix="/officer/requests"
      />
    </>
  );
}
