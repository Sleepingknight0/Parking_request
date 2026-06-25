"use client";

import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  requestId: string;
}

export function RequestCalendar({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={thLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: e.color,
          borderColor: e.color,
          extendedProps: { requestId: e.requestId },
        }))}
        eventClick={(info) => {
          const rid = info.event.extendedProps.requestId as string | undefined;
          if (rid) router.push(`/requests/${rid}`);
        }}
        height="auto"
        dayMaxEvents={3}
      />
    </div>
  );
}
