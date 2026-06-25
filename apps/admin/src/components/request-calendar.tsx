"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminMobileCalendar } from "./admin-mobile-calendar";
import type { CalendarEvent } from "./calendar-event";

export type { CalendarEvent } from "./calendar-event";

type CalendarRuntime = {
  FullCalendar: React.ComponentType<Record<string, unknown>>;
  plugins: unknown[];
  locale: unknown;
};

class CalendarErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RequestCalendar({
  events,
  todayIso,
}: {
  events: CalendarEvent[];
  todayIso?: string;
}) {
  const router = useRouter();
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  const [runtime, setRuntime] = React.useState<CalendarRuntime | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("@fullcalendar/react"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
      import("@fullcalendar/core/locales/th"),
    ])
      .then(([calendar, dayGrid, timeGrid, interaction, th]) => {
        if (cancelled) return;
        setRuntime({
          FullCalendar: calendar.default as CalendarRuntime["FullCalendar"],
          plugins: [dayGrid.default, timeGrid.default, interaction.default],
          locale: th.default,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const listFallback = (
    <AdminMobileCalendar
      events={events}
      todayIso={today}
      maxDays={90}
      emptyMessage="ยังไม่มีงานจอดรถในปฏิทิน"
    />
  );

  return (
    <>
      <div className="md:hidden">
        <AdminMobileCalendar
          events={events}
          todayIso={today}
          className="space-y-4"
          hideOnDesktop
        />
      </div>

      <div className="hidden min-h-[32rem] rounded-xl border border-border bg-card p-4 md:block">
        {failed ? (
          <div className="p-2">{listFallback}</div>
        ) : !runtime ? (
          <p className="flex min-h-[28rem] items-center justify-center text-sm text-muted-foreground">
            กำลังโหลดปฏิทิน...
          </p>
        ) : (
          <CalendarErrorBoundary fallback={listFallback}>
            <runtime.FullCalendar
              plugins={runtime.plugins}
              initialView="dayGridMonth"
              locale={runtime.locale}
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
              eventClick={(info: {
                event: { extendedProps: { requestId?: unknown } };
              }) => {
                const rid = info.event.extendedProps.requestId;
                if (typeof rid === "string") router.push(`/requests/${rid}`);
              }}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.35}
              dayMaxEvents={3}
            />
          </CalendarErrorBoundary>
        )}
      </div>
    </>
  );
}
