import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { requireAppMode } from "@/lib/user-guards";
import { fetchSecurityCalendarEvents } from "@/lib/security-calendar-data";
import { SecurityParkingCalendar } from "@/components/security-parking-calendar";
import { SecurityLegend } from "@/components/security-legend";

export const dynamic = "force-dynamic";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SecurityCalendarPage() {
  await requireAppMode("security");
  const supabase = getUserAppDb();
  const today = todayIso();
  const calendarEvents = await fetchSecurityCalendarEvents(supabase, today);

  return (
    <>
      <PageHeader
        title={TH.nav.securityParkingCalendar}
        description="ปฏิทินวันขอใช้ที่จอดรถทั้งหมด — แตะวันเพื่อดูรายละเอียดงาน"
      />

      <div className="mb-4">
        <SecurityLegend compact />
      </div>

      <SecurityParkingCalendar events={calendarEvents} todayIso={today} />
    </>
  );
}
