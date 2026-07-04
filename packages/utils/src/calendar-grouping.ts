import { addDaysIso, formatThaiDate, formatTimeRange } from "./date";

export type RequestDateSlotInput = {
  request_date: string;
  start_time?: string | null;
  end_time?: string | null;
};

export type CalendarEventGroupInput = {
  id: string;
  requestId: string;
  title: string;
  subtitle?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color: string;
};

export type CalendarDateRange = {
  start: string;
  end: string;
  dayCount: number;
};

export type GroupedCalendarRequest = {
  requestId: string;
  title: string;
  subtitle?: string;
  color: string;
  isPast: boolean;
  dateRanges: CalendarDateRange[];
  dateLabel: string;
};

/** Muted slate for events whose scheduled date/time has passed. */
export const PAST_CALENDAR_EVENT_COLOR = "#94a3b8";

function calendarEventEndIso(start: string, end?: string): string {
  if (end) {
    return end.length === 10 ? `${end}T23:59:59` : end;
  }
  return start.length === 10 ? `${start}T23:59:59` : start;
}

/** True when the scheduled end (or end-of-day) is before now. */
export function isCalendarEventPast(start: string, end?: string, now: Date = new Date()): boolean {
  const endIso = calendarEventEndIso(start, end);
  const endMs = new Date(endIso).getTime();
  if (Number.isNaN(endMs)) {
    return start.slice(0, 10) < now.toISOString().slice(0, 10);
  }
  return endMs < now.getTime();
}

export function resolveCalendarEventColor(
  baseColor: string,
  start: string,
  end?: string,
  now: Date = new Date(),
): string {
  return isCalendarEventPast(start, end, now) ? PAST_CALENDAR_EVENT_COLOR : baseColor;
}

function collectEventDates(event: CalendarEventGroupInput): string[] {
  const startDate = event.start.slice(0, 10);
  if (event.allDay && event.end) {
    const endExclusive = event.end.slice(0, 10);
    const dates: string[] = [];
    let cursor = startDate;
    while (cursor < endExclusive) {
      dates.push(cursor);
      cursor = addDaysIso(cursor, 1);
    }
    return dates.length ? dates : [startDate];
  }
  return [startDate];
}

function mergeConsecutiveDates(dates: string[]): CalendarDateRange[] {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return [];

  const ranges: CalendarDateRange[] = [];
  let rangeStart = sorted[0]!;
  let rangeEnd = sorted[0]!;

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    if (current === addDaysIso(rangeEnd, 1)) {
      rangeEnd = current;
      continue;
    }
    ranges.push({
      start: rangeStart,
      end: rangeEnd,
      dayCount: dayCountInclusive(rangeStart, rangeEnd),
    });
    rangeStart = current;
    rangeEnd = current;
  }

  ranges.push({
    start: rangeStart,
    end: rangeEnd,
    dayCount: dayCountInclusive(rangeStart, rangeEnd),
  });
  return ranges;
}

function dayCountInclusive(start: string, end: string): number {
  let count = 0;
  let cursor = start;
  while (cursor <= end) {
    count += 1;
    if (cursor === end) break;
    cursor = addDaysIso(cursor, 1);
  }
  return count;
}

function formatRangeLabel(range: CalendarDateRange, todayIso?: string): string {
  const startLabel = formatThaiDate(range.start);
  if (range.start === range.end) {
    if (todayIso && range.start === todayIso) return `วันนี้ · ${startLabel}`;
    return startLabel;
  }
  return `${startLabel} – ${formatThaiDate(range.end)} (${range.dayCount} วัน)`;
}

function buildDateLabel(ranges: CalendarDateRange[], todayIso?: string): string {
  return ranges.map((range) => formatRangeLabel(range, todayIso)).join(" · ");
}

function buildSubtitle(events: CalendarEventGroupInput[]): string | undefined {
  const labels = [
    ...new Set(
      events
        .map((event) => event.subtitle?.trim())
        .filter((value): value is string => Boolean(value && value !== "-")),
    ),
  ];
  if (labels.length === 0) return undefined;
  if (labels.length === 1) return labels[0];
  return labels.join(" · ");
}

/** Collapse per-day calendar rows into one card per request with date ranges. */
export function groupCalendarEventsByRequest(
  events: CalendarEventGroupInput[],
  todayIso?: string,
): GroupedCalendarRequest[] {
  const byRequest = new Map<string, CalendarEventGroupInput[]>();
  for (const event of events) {
    const list = byRequest.get(event.requestId) ?? [];
    list.push(event);
    byRequest.set(event.requestId, list);
  }

  const grouped = [...byRequest.entries()].map(([requestId, reqEvents]) => {
    const dates = reqEvents.map((event) => event.start.slice(0, 10)).sort();
    const dateRanges = mergeConsecutiveDates(dates);
    const isPast = reqEvents.every((event) => isCalendarEventPast(event.start, event.end));
    const baseColor = reqEvents[0]?.color ?? "#64748b";
    return {
      requestId,
      title: reqEvents[0]?.title ?? "",
      subtitle: buildSubtitle(reqEvents),
      color: isPast ? PAST_CALENDAR_EVENT_COLOR : baseColor,
      isPast,
      dateRanges,
      dateLabel: buildDateLabel(dateRanges, todayIso),
    };
  });

  grouped.sort((a, b) => {
    const aStart = a.dateRanges[0]?.start ?? "";
    const bStart = b.dateRanges[0]?.start ?? "";
    return aStart.localeCompare(bStart);
  });

  return grouped;
}

/** Format parking dates as merged ranges plus optional time summary for list cards. */
export function formatRequestParkingSchedule(
  dates: RequestDateSlotInput[],
  todayIso?: string,
): { dateLabel: string; timeLabel?: string } {
  if (!dates.length) {
    return { dateLabel: "ยังไม่ระบุวันที่จอด" };
  }

  const sorted = [...dates].sort((a, b) => a.request_date.localeCompare(b.request_date));
  const dateRanges = mergeConsecutiveDates(sorted.map((d) => d.request_date));
  const timeLabels = [
    ...new Set(
      sorted
        .map((d) => formatTimeRange(d.start_time, d.end_time))
        .filter((value) => value !== "-"),
    ),
  ];

  return {
    dateLabel: buildDateLabel(dateRanges, todayIso),
    timeLabel:
      timeLabels.length === 0
        ? undefined
        : timeLabels.length === 1
          ? timeLabels[0]
          : timeLabels.join(" · "),
  };
}

/** One-line schedule for request list cards (merged date ranges). */
export function formatRequestListScheduleLine(
  dates: RequestDateSlotInput[],
  options?: { filterDate?: string | null; todayIso?: string },
): string {
  const filterDate = options?.filterDate ?? undefined;
  const scoped = filterDate
    ? dates.filter((d) => d.request_date === filterDate)
    : dates;

  if (filterDate && scoped.length === 0) {
    return "ไม่มีวันจอดในวันที่เลือก";
  }

  const { dateLabel, timeLabel } = formatRequestParkingSchedule(scoped, options?.todayIso);
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
}

/** Merge per-day rows into multi-day FullCalendar events (one bar per consecutive range). */
export function mergeCalendarEventsForFullCalendar(
  events: CalendarEventGroupInput[],
  now: Date = new Date(),
): CalendarEventGroupInput[] {
  const byRequest = new Map<string, CalendarEventGroupInput[]>();
  for (const event of events) {
    const list = byRequest.get(event.requestId) ?? [];
    list.push(event);
    byRequest.set(event.requestId, list);
  }

  const merged: CalendarEventGroupInput[] = [];

  for (const [requestId, reqEvents] of byRequest) {
    const sorted = [...reqEvents].sort((a, b) =>
      a.start.slice(0, 10).localeCompare(b.start.slice(0, 10)),
    );
    const dates = sorted.flatMap(collectEventDates);
    const ranges = mergeConsecutiveDates(dates);

    for (const range of ranges) {
      const rangeEvents = sorted.filter((event) => {
        const date = event.start.slice(0, 10);
        return date >= range.start && date <= range.end;
      });
      const baseColor = rangeEvents[0]?.color ?? "#64748b";
      const start = range.start;
      /** FullCalendar all-day end is exclusive (day after last parking day). */
      const end = addDaysIso(range.end, 1);
      const pastEnd = `${range.end}T23:59:59`;

      merged.push({
        id: `${requestId}-${range.start}-${range.end}`,
        requestId,
        title: rangeEvents[0]?.title ?? "",
        subtitle: buildSubtitle(rangeEvents),
        start,
        end,
        allDay: true,
        color: resolveCalendarEventColor(baseColor, start, pastEnd, now),
      });
    }
  }

  merged.sort((a, b) => a.start.localeCompare(b.start));
  return merged;
}
