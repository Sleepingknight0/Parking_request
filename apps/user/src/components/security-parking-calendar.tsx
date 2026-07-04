"use client";

import { ParkingCalendarView } from "./parking-calendar-view";
import type { CalendarEvent } from "./request-calendar";

/** @deprecated use ParkingCalendarView */
export function SecurityParkingCalendar({
  events,
  todayIso,
  maxMobileDays = 14,
  showDesktop = true,
  emptyMessage,
  groupByRequest = true,
  includePastEvents = false,
  maxPastDays = 90,
}: {
  events: CalendarEvent[];
  todayIso: string;
  maxMobileDays?: number;
  showDesktop?: boolean;
  emptyMessage?: string;
  groupByRequest?: boolean;
  includePastEvents?: boolean;
  maxPastDays?: number;
}) {
  return (
    <ParkingCalendarView
      events={events}
      todayIso={todayIso}
      detailPathPrefix="/security/jobs"
      maxMobileDays={maxMobileDays}
      showDesktop={showDesktop}
      groupByRequest={groupByRequest}
      emptyMessage={emptyMessage}
      includePastEvents={includePastEvents}
      maxPastDays={maxPastDays}
    />
  );
}
