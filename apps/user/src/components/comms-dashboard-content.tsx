"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@nacc/ui";
import { todayISO } from "@nacc/utils";
import { CommsRequestsList } from "./comms-requests-list";
import { ParkingCalendarView } from "./parking-calendar-view";
import {
  buildParkingCalendarEvents,
  filterUrgentCalendarEvents,
} from "@/lib/parking-calendar-events";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";
import type { CommsRequestRow } from "@/lib/comms-request-utils";

export type CommsDashboardRow = CommsRequestRow;

export function CommsDashboardContent({ rows }: { rows: CommsDashboardRow[] }) {
  const today = todayISO();
  const calendarEvents = React.useMemo(() => buildParkingCalendarEvents(rows), [rows]);
  const urgentCalendarEvents = React.useMemo(
    () => filterUrgentCalendarEvents(calendarEvents, today),
    [calendarEvents, today],
  );

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            ปฏิทินด่วน ({DASHBOARD_URGENT_CALENDAR_DAYS} วัน)
          </h2>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
            <Link href="/comms/calendar">
              <CalendarDays className="h-4 w-4" />
              ปฏิทินเต็ม
            </Link>
          </Button>
        </div>
        <ParkingCalendarView
          events={urgentCalendarEvents}
          todayIso={today}
          detailPathPrefix="/comms/requests"
          maxMobileDays={DASHBOARD_URGENT_CALENDAR_DAYS}
          showDesktop={false}
          emptyMessage={`ไม่มีคำขอในช่วง ${DASHBOARD_URGENT_CALENDAR_DAYS} วันข้างหน้า`}
        />
      </section>

      <CommsRequestsList rows={rows} defaultQueue="needs_action" showTitle={false} />
    </div>
  );
}
