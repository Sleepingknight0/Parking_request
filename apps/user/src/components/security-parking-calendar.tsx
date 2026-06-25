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
}: {
  events: CalendarEvent[];
  todayIso: string;
  maxMobileDays?: number;
  showDesktop?: boolean;
  emptyMessage?: string;
}) {
  return (
    <ParkingCalendarView
      events={events}
      todayIso={todayIso}
      detailPathPrefix="/security/jobs"
      maxMobileDays={maxMobileDays}
      showDesktop={showDesktop}
      emptyMessage={emptyMessage}
    />
  );
}
