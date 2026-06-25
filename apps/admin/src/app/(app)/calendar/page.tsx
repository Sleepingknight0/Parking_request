import { PageHeader, StatusLegend } from "@nacc/ui";
import { TH, STATUS_HEX, ADMIN_STATUS_LEGEND, type RequestStatus } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { todayISO } from "@nacc/utils";
import { RequestCalendar, type CalendarEvent } from "@/components/request-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("request_dates")
    .select(
      "request_date,start_time,end_time,parking_requests!inner(id,request_no,official_letter_no,status,cars_count,department:departments(short_name,name_th))",
    );

  const rows = (data ?? []) as unknown as Array<{
    request_date: string;
    start_time: string | null;
    end_time: string | null;
    parking_requests: {
      id: string;
      request_no: string;
      official_letter_no: string;
      status: RequestStatus;
      cars_count: number;
      department: { short_name: string | null; name_th: string } | null;
    } | null;
  }>;

  const events: CalendarEvent[] = rows
    .filter((r) => r.parking_requests && r.parking_requests.status !== "draft")
    .map((r) => {
      const p = r.parking_requests!;
      const dept = p.department?.short_name || p.department?.name_th || "";
      const start = r.start_time ? `${r.request_date}T${r.start_time}` : r.request_date;
      const end = r.end_time ? `${r.request_date}T${r.end_time}` : undefined;
      return {
        id: `${p.id}-${r.request_date}`,
        requestId: p.id,
        title: `${p.official_letter_no} - ${dept} - ${p.cars_count} คัน`,
        start,
        end,
        color: STATUS_HEX[p.status],
      };
    });

  const today = todayISO();

  return (
    <>
      <PageHeader title={TH.nav.calendar} description="ปฏิทินวันที่ขอใช้ที่จอดรถ" />
      <div className="mb-4">
        <StatusLegend statuses={ADMIN_STATUS_LEGEND} compact />
      </div>
      <RequestCalendar events={events} todayIso={today} />
    </>
  );
}
