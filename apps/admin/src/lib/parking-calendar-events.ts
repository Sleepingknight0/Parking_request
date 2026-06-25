import { STATUS_HEX, type ParkingRequestListItem, type RequestStatus } from "@nacc/types";
import { addDaysIso, formatTimeRange } from "@nacc/utils";
import type { CalendarEvent } from "@/components/calendar-event";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "./parking-calendar-constants";

export function buildParkingCalendarEvents(rows: ParkingRequestListItem[]): CalendarEvent[] {
  return rows.flatMap((row) =>
    row.request_dates.map((date) => {
      const timeLabel = formatTimeRange(date.start_time, date.end_time) || undefined;
      const start = date.start_time ? `${date.request_date}T${date.start_time}` : date.request_date;
      return {
        id: `${row.id}-${date.request_date}`,
        requestId: row.id,
        title: `${row.official_letter_no} · ${row.department?.short_name || row.department?.name_th || ""}`,
        subtitle: timeLabel,
        timeLabel,
        start,
        end: date.end_time ? `${date.request_date}T${date.end_time}` : undefined,
        color: STATUS_HEX[row.status as RequestStatus],
      };
    }),
  );
}

export function filterUrgentCalendarEvents(
  events: CalendarEvent[],
  todayIso: string,
  maxDays = DASHBOARD_URGENT_CALENDAR_DAYS,
): CalendarEvent[] {
  const endIso = addDaysIso(todayIso, maxDays);
  return events.filter((event) => {
    const d = event.start.slice(0, 10);
    return d >= todayIso && d <= endIso;
  });
}
