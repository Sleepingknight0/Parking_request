"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  timeLabel?: string;
  start: string;
  end?: string;
  color: string;
  requestId: string;
}

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

function CalendarFallback({
  events,
  onEventClickPath,
}: {
  events: CalendarEvent[];
  onEventClickPath?: (requestId: string) => string;
}) {
  const router = useRouter();
  const visibleEvents = events.slice(0, 8);

  return (
    <div className="space-y-2">
      {visibleEvents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการในปฏิทิน
        </p>
      ) : (
        visibleEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
            onClick={() =>
              router.push(
                onEventClickPath
                  ? onEventClickPath(event.requestId)
                  : `/security/jobs/${event.requestId}`,
              )
            }
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{event.title}</span>
              <span className="block text-xs text-muted-foreground">{event.start}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export function RequestCalendar({
  events,
  onEventClickPath,
}: {
  events: CalendarEvent[];
  onEventClickPath?: (requestId: string) => string;
}) {
  const router = useRouter();
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

  const fallback = <CalendarFallback events={events} onEventClickPath={onEventClickPath} />;

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      {failed || !runtime ? (
        failed ? fallback : <p className="p-4 text-sm text-muted-foreground">กำลังโหลดปฏิทิน...</p>
      ) : (
        <CalendarErrorBoundary fallback={fallback}>
          <runtime.FullCalendar
            plugins={runtime.plugins}
            initialView="dayGridMonth"
            locale={runtime.locale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth",
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
              if (typeof rid === "string") {
                router.push(onEventClickPath ? onEventClickPath(rid) : `/security/jobs/${rid}`);
              }
            }}
            height="auto"
            dayMaxEvents={2}
          />
        </CalendarErrorBoundary>
      )}
    </div>
  );
}
