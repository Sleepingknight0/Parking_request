import type { createServiceClient } from "@nacc/db/service";
import type { RequestStatus } from "@nacc/types";
import { formatTimeRange } from "@nacc/utils";
import type { CalendarEvent } from "@/components/request-calendar";
import { addDaysIso } from "@/lib/date-iso";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";
import { getSecurityEventColor } from "@/lib/security-job-utils";

type ServerSupabase = ReturnType<typeof createServiceClient>;

const CALENDAR_SELECT = `request_date,start_time,end_time,
  parking_requests!inner(
    id,request_no,official_letter_no,status,cars_count,requested_location_text,
    department:departments(short_name,name_th),
    requested_location:locations(name_th)
  )`;

type CalendarRow = {
  request_date: string;
  start_time: string | null;
  end_time: string | null;
  parking_requests: {
    id: string;
    official_letter_no: string;
    status: RequestStatus;
    cars_count: number;
    requested_location_text: string | null;
    department: { short_name: string | null; name_th: string } | null;
    requested_location: { name_th: string } | null;
  } | null;
};

export function mapCalendarRowsToEvents(
  rows: CalendarRow[],
  todayIso: string,
): CalendarEvent[] {
  return rows
    .filter((r) => r.parking_requests && r.parking_requests.status !== "draft")
    .map((r) => {
      const p = r.parking_requests!;
      const location =
        p.requested_location?.name_th ?? p.requested_location_text ?? "ยังไม่ระบุสถานที่";
      const start = r.start_time ? `${r.request_date}T${r.start_time}` : r.request_date;
      const end = r.end_time ? `${r.request_date}T${r.end_time}` : undefined;
      const timeLabel = formatTimeRange(r.start_time, r.end_time) || undefined;
      return {
        id: `${p.id}-${r.request_date}`,
        requestId: p.id,
        title: `${location} · ${p.cars_count} คัน`,
        subtitle: timeLabel,
        timeLabel,
        start,
        end,
        color: getSecurityEventColor(p.status, r.request_date, todayIso),
      };
    });
}

export async function fetchSecurityCalendarEvents(
  supabase: ServerSupabase,
  todayIso: string,
  options?: { fromDate?: string; toDate?: string },
): Promise<CalendarEvent[]> {
  let query = supabase.from("request_dates").select(CALENDAR_SELECT);

  if (options?.fromDate) {
    query = query.gte("request_date", options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte("request_date", options.toDate);
  }

  const { data } = await query;
  return mapCalendarRowsToEvents((data ?? []) as unknown as CalendarRow[], todayIso);
}

export async function fetchUrgentDashboardCalendarEvents(
  supabase: ServerSupabase,
  todayIso: string,
): Promise<CalendarEvent[]> {
  return fetchSecurityCalendarEvents(supabase, todayIso, {
    fromDate: todayIso,
    toDate: addDaysIso(todayIso, DASHBOARD_URGENT_CALENDAR_DAYS),
  });
}
