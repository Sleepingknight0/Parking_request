"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  addDaysIso,
  formatThaiDate,
  groupCalendarEventsByRequest,
  isCalendarEventPast,
  resolveCalendarEventColor,
} from "@nacc/utils";
import { cn } from "@nacc/ui";
import type { CalendarEvent } from "./calendar-event";

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

export function AdminMobileCalendar({
  events,
  todayIso,
  maxDays = 21,
  emptyMessage,
  className,
  hideOnDesktop = false,
  groupByRequest = true,
  includePastEvents = false,
  maxPastDays = 90,
}: {
  events: CalendarEvent[];
  todayIso: string;
  maxDays?: number;
  emptyMessage?: string;
  className?: string;
  hideOnDesktop?: boolean;
  groupByRequest?: boolean;
  includePastEvents?: boolean;
  maxPastDays?: number;
}) {
  const router = useRouter();
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
  const visible = groups.length ? groups : groupByRequest ? [] : groupByDate(events).slice(0, 14);

  if (groupByRequest) {
    if (!groupedRequests.length) {
      return (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          {emptyMessage ?? "ยังไม่มีงานจอดรถในช่วงที่เลือก"}
        </p>
      );
    }

    return (
      <div className={className ?? "space-y-3"}>
        <ul className="space-y-2">
          {groupedRequests.map((item) => (
            <li key={item.requestId}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left active:bg-accent",
                  item.isPast && "opacity-70",
                )}
                onClick={() => router.push(`/requests/${item.requestId}`)}
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

  if (!visible.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "ยังไม่มีงานจอดรถในช่วงที่เลือก"}
      </p>
    );
  }

  return (
    <div className={hideOnDesktop ? `space-y-4 md:hidden ${className ?? ""}` : className ?? "space-y-4"}>
      {visible.map((group) => (
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
                    onClick={() => router.push(`/requests/${event.requestId}`)}
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
