"use client";

import { useRouter } from "next/navigation";
import { RequestCalendar, type CalendarEvent } from "./request-calendar";
import { ParkingMobileCalendar } from "./parking-mobile-calendar";

export function ParkingCalendarView({
  events,
  todayIso,
  detailPathPrefix,
  maxMobileDays = 14,
  showDesktop = true,
  emptyMessage,
  groupByRequest = true,
  includePastEvents = false,
  maxPastDays = 90,
}: {
  events: CalendarEvent[];
  todayIso: string;
  detailPathPrefix: string;
  maxMobileDays?: number;
  showDesktop?: boolean;
  emptyMessage?: string;
  groupByRequest?: boolean;
  includePastEvents?: boolean;
  maxPastDays?: number;
}) {
  const router = useRouter();
  const toDetail = (requestId: string) => `${detailPathPrefix}/${requestId}`;

  return (
    <>
      <ParkingMobileCalendar
        events={events}
        todayIso={todayIso}
        maxDays={maxMobileDays}
        emptyMessage={emptyMessage}
        hideOnDesktop={showDesktop}
        groupByRequest={groupByRequest}
        includePastEvents={includePastEvents}
        maxPastDays={maxPastDays}
        onSelectRequest={(id) => router.push(toDetail(id))}
      />
      {showDesktop ? (
        <div className="hidden md:block">
          <RequestCalendar events={events} onEventClickPath={toDetail} />
        </div>
      ) : null}
    </>
  );
}
