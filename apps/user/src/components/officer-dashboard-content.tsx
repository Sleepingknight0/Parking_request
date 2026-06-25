"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Car, FileWarning, Inbox, Send } from "lucide-react";
import {
  Button,
  StatCard,
} from "@nacc/ui";
import { type ParkingRequestListItem } from "@nacc/types";
import { todayISO } from "@nacc/utils";
import { DashboardRequestPanel } from "./dashboard-request-panel";
import { OfficerRequestDetailSheet } from "./officer-request-detail-sheet";
import { ParkingCalendarView } from "./parking-calendar-view";
import {
  buildParkingCalendarEvents,
  filterUrgentCalendarEvents,
} from "@/lib/parking-calendar-events";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";

export type OfficerDashboardRow = ParkingRequestListItem & {
  officialLetterCount: number;
};

function matchesDate(row: ParkingRequestListItem, date: string) {
  return row.request_dates.some((requestDate) => requestDate.request_date === date);
}

export function OfficerDashboardContent({ rows }: { rows: OfficerDashboardRow[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const today = todayISO();

  const drafts = rows.filter((r) => r.status === "draft").length;
  const pending = rows.filter((r) =>
    ["submitted", "under_review", "approved"].includes(r.status),
  ).length;
  const active = rows.filter((r) => ["assigned", "in_progress"].includes(r.status)).length;
  const todayRows = rows.filter((row) => matchesDate(row, today));
  const todayCars = todayRows.reduce((sum, row) => sum + row.cars_count, 0);
  const missingLetters = rows.filter((row) => row.officialLetterCount === 0).length;

  const calendarEvents = React.useMemo(() => buildParkingCalendarEvents(rows), [rows]);
  const urgentCalendarEvents = React.useMemo(
    () => filterUrgentCalendarEvents(calendarEvents, today),
    [calendarEvents, today],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard compact label="แบบร่าง" value={drafts} icon={<Inbox className="h-5 w-5" />} />
        <StatCard compact label="รอตรวจ/อนุมัติ" value={pending} icon={<Send className="h-5 w-5" />} />
        <StatCard compact label="ดำเนินการ" value={active} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard compact label="รถ (วันนี้)" value={todayCars} icon={<Car className="h-5 w-5" />} />
        <StatCard
          compact
          label="หนังสือ (วันนี้)"
          value={todayRows.length}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          compact
          label="ยังไม่แนบไฟล์"
          value={missingLetters}
          icon={<FileWarning className="h-5 w-5" />}
          accentClassName={missingLetters ? "text-amber-600" : "text-emerald-600"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr] lg:gap-6">
        <div className="order-1 lg:order-2">
          <DashboardRequestPanel
            allRows={rows}
            onRowClick={setSelectedId}
            footer={
              rows.length > 12 ? (
                <Button asChild variant="outline" size="sm" className="mt-1 w-full">
                  <Link href="/officer/requests">ดูรายการทั้งหมด</Link>
                </Button>
              ) : null
            }
          />
        </div>

        <section className="order-2 space-y-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              ปฏิทินด่วน ({DASHBOARD_URGENT_CALENDAR_DAYS} วัน)
            </h2>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link href="/officer/calendar">
                <CalendarDays className="h-4 w-4" />
                ปฏิทินเต็ม
              </Link>
            </Button>
          </div>
          <ParkingCalendarView
            events={urgentCalendarEvents}
            todayIso={today}
            detailPathPrefix="/officer/requests"
            maxMobileDays={DASHBOARD_URGENT_CALENDAR_DAYS}
            showDesktop={false}
            emptyMessage={`ไม่มีคำขอในช่วง ${DASHBOARD_URGENT_CALENDAR_DAYS} วันข้างหน้า`}
          />
        </section>
      </div>

      <OfficerRequestDetailSheet
        requestId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
