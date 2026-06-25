"use client";

import * as React from "react";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import type { CalendarEvent } from "./request-calendar";

interface DayGroup {
  date: string;
  events: CalendarEvent[];
}

function groupByDate(events: CalendarEvent[]): DayGroup[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const date = event.start.slice(0, 10);
    const list = map.get(date) ?? [];
    list.push(event);
    map.set(date, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

export function SecurityMobileCalendar({
  events,
  todayIso,
  onSelectRequest,
}: {
  events: CalendarEvent[];
  todayIso: string;
  onSelectRequest?: (requestId: string) => void;
}) {
  const groups = React.useMemo(() => groupByDate(events), [events]);
  const upcoming = groups.filter((g) => g.date >= todayIso).slice(0, 14);

  if (!upcoming.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        ยังไม่มีงานจอดรถในช่วง 2 สัปดาห์ข้างหน้า
      </p>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {upcoming.map((group) => (
        <div key={group.date} className="rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">
              {group.date === todayIso ? "วันนี้ · " : ""}
              {formatThaiDate(group.date)}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {group.events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-3 py-3 text-left active:bg-accent"
                  onClick={() => onSelectRequest?.(event.requestId)}
                >
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: event.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold leading-snug text-slate-950">
                      {event.title}
                    </span>
                    {event.subtitle ? (
                      <span className="mt-0.5 block text-base font-semibold text-slate-800">
                        {event.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function formatCalendarTimeLabel(start: string, end?: string): string | undefined {
  const timeStart = start.length > 10 ? start.slice(11, 16) : null;
  const timeEnd = end && end.length > 10 ? end.slice(11, 16) : null;
  if (!timeStart) return undefined;
  return formatTimeRange(timeStart, timeEnd);
}
