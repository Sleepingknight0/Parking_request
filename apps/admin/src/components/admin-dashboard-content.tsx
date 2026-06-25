"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  UserX,
} from "lucide-react";
import { Button, StatCard } from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { formatThaiDate, todayISO } from "@nacc/utils";
import { AdminRequestsPanel } from "./admin-requests-panel";
import { AdminMobileCalendar } from "./admin-mobile-calendar";
import {
  buildParkingCalendarEvents,
  filterUrgentCalendarEvents,
} from "@/lib/parking-calendar-events";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";

export type AdminDashboardStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  carsToday: number;
  unassigned: number;
  lettersToday: number;
  cancelled: number;
};

export function AdminDashboardContent({
  rows,
  stats,
  todayIso,
}: {
  rows: ParkingRequestListItem[];
  stats: AdminDashboardStats;
  todayIso?: string;
}) {
  const today = todayIso ?? todayISO();

  const calendarEvents = React.useMemo(() => buildParkingCalendarEvents(rows), [rows]);
  const urgentEvents = React.useMemo(
    () => filterUrgentCalendarEvents(calendarEvents, today),
    [calendarEvents, today],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          compact
          label={TH.dashboard.totalRequests}
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          compact
          label={TH.dashboard.pending}
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          accentClassName="text-amber-600"
        />
        <StatCard
          compact
          label={TH.dashboard.inProgress}
          value={stats.inProgress}
          icon={<Loader2 className="h-5 w-5" />}
          accentClassName="text-orange-600"
        />
        <StatCard
          compact
          label={TH.dashboard.completed}
          value={stats.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentClassName="text-emerald-600"
        />
        <StatCard
          compact
          label={TH.dashboard.carsToday}
          value={stats.carsToday}
          icon={<Car className="h-5 w-5" />}
          hint={`ณ ${formatThaiDate(today).slice(0, 5)}`}
        />
        <StatCard
          compact
          label={TH.dashboard.unassigned}
          value={stats.unassigned}
          icon={<UserX className="h-5 w-5" />}
          accentClassName={stats.unassigned > 0 ? "text-amber-600" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr] lg:gap-6">
        <section className="order-2 space-y-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              ปฏิทินด่วน ({DASHBOARD_URGENT_CALENDAR_DAYS} วัน)
            </h2>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link href="/calendar">
                <CalendarDays className="h-4 w-4" />
                ปฏิทินเต็ม
              </Link>
            </Button>
          </div>
          <AdminMobileCalendar
            events={urgentEvents}
            todayIso={today}
            maxDays={DASHBOARD_URGENT_CALENDAR_DAYS}
            emptyMessage={`ไม่มีคำขอในช่วง ${DASHBOARD_URGENT_CALENDAR_DAYS} วันข้างหน้า`}
          />
        </section>

        <div className="order-1 lg:order-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {TH.admin.workPanelTitle}
            </h2>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/requests">ดูรายการทั้งหมด</Link>
            </Button>
          </div>
          <AdminRequestsPanel
            rows={rows}
            defaultQueue="needs_action"
            showTitle={false}
            showExport={false}
            maxCardRows={10}
            showViewAllLink
          />
        </div>
      </div>
    </div>
  );
}
