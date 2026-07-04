"use client";

import * as React from "react";
import {
  formatThaiDate,
  groupCalendarEventsByRequest,
  isCalendarEventPast,
  resolveCalendarEventColor,
} from "@nacc/utils";
import { cn } from "@nacc/ui";
import { addDaysIso } from "@/lib/date-iso";
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

export function ParkingMobileCalendar({
  events,
  todayIso,
  onSelectRequest,
  maxDays = 14,
  emptyMessage,
  hideOnDesktop = true,
  groupByRequest = true,
  includePastEvents = false,
  maxPastDays = 90,
}: {
  events: CalendarEvent[];
  todayIso: string;
  onSelectRequest?: (requestId: string) => void;
  maxDays?: number;
  emptyMessage?: string;
  /** When false, list is shown on desktop too (e.g. dashboard urgent snippet). */
  hideOnDesktop?: boolean;
  /** One card per request with merged date ranges (for dashboard quick calendar). */
  groupByRequest?: boolean;
  /** Include past dates (shown gray) — for full calendar pages. */
  includePastEvents?: boolean;
  maxPastDays?: number;
}) {
  const startIso = React.useMemo(
    () => (includePastEvents ? addDaysIso(todayIso, -maxPastDays) : todayIso),
    [includePastEvents, todayIso, maxPastDays],
  );
  const endIso = React.useMemo(() => addDaysIso(todayIso, maxDays), [todayIso, maxDays]);
  const scopedEvents = React.useMemo(
    () =>
      events.filter((event) => {
        const date = event.start.slice(0, 10);
        return date >= startIso && date <= endIso;
      }),
    [events, startIso, endIso],
  );

  const groupedRequests = React.useMemo(
    () => (groupByRequest ? groupCalendarEventsByRequest(scopedEvents, todayIso) : []),
    [groupByRequest, scopedEvents, todayIso],
  );
  const groups = React.useMemo(
    () => (groupByRequest ? [] : groupByDate(scopedEvents)),
    [groupByRequest, scopedEvents],
  );

  if (groupByRequest) {
    if (!groupedRequests.length) {
      return (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          {emptyMessage ?? "ยังไม่มีงานจอดรถในช่วงที่เลือก"}
        </p>
      );
    }

    return (
      <div className={hideOnDesktop ? "space-y-3 md:hidden" : "space-y-3"}>
        <ul className="space-y-2">
          {groupedRequests.map((item) => (
            <li key={item.requestId}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left active:bg-accent",
                  item.isPast && "opacity-70",
                )}
                onClick={() => onSelectRequest?.(item.requestId)}
              >
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-semibold leading-snug",
                      item.isPast ? "text-muted-foreground" : "text-slate-950",
                    )}
                  >
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-sm font-medium",
                      item.isPast ? "text-muted-foreground" : "text-primary",
                    )}
                  >
                    {item.dateLabel}
                  </span>
                  {item.subtitle ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "ยังไม่มีงานจอดรถในช่วงที่เลือก"}
      </p>
    );
  }

  return (
    <div className={hideOnDesktop ? "space-y-4 md:hidden" : "space-y-4"}>
      {groups.map((group) => (
        <div key={group.date} className="rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">
              {group.date === todayIso ? "วันนี้ · " : ""}
              {formatThaiDate(group.date)}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {group.events.map((event) => {
              const displayColor = resolveCalendarEventColor(event.color, event.start, event.end);
              const isPast = isCalendarEventPast(event.start, event.end);
              return (
              <li key={event.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-3 text-left active:bg-accent",
                    isPast && "opacity-70",
                  )}
                  onClick={() => onSelectRequest?.(event.requestId)}
                >
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: displayColor }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-base font-bold leading-snug",
                        isPast ? "text-muted-foreground" : "text-slate-950",
                      )}
                    >
                      {event.title}
                    </span>
                    {event.subtitle ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-base font-semibold",
                          isPast ? "text-muted-foreground" : "text-slate-800",
                        )}
                      >
                        {event.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
