"use client";

import { useRouter } from "next/navigation";
import { RequestCalendar, type CalendarEvent } from "./request-calendar";
import { SecurityMobileCalendar } from "./security-mobile-calendar";

export function SecurityParkingCalendar({
  events,
  todayIso,
}: {
  events: CalendarEvent[];
  todayIso: string;
}) {
  const router = useRouter();

  return (
    <>
      <SecurityMobileCalendar
        events={events}
        todayIso={todayIso}
        onSelectRequest={(id) => router.push(`/security/jobs/${id}`)}
      />
      <div className="hidden md:block">
        <RequestCalendar
          events={events}
          onEventClickPath={(id) => `/security/jobs/${id}`}
        />
      </div>
    </>
  );
}
