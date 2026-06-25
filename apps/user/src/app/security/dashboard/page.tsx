import Link from "next/link";
import { Button, PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { requireAppMode } from "@/lib/user-guards";
import { fetchUrgentDashboardCalendarEvents } from "@/lib/security-calendar-data";
import { SecurityParkingCalendar } from "@/components/security-parking-calendar";
import { SecurityQuickJobCard } from "@/components/security-quick-job-card";
import { SecurityLegend } from "@/components/security-legend";
import {
  comparePrepPriority,
  getNextParkingDate,
  isActionableSecurityJob,
  needsParkingPrep,
  type SecurityJobRow,
} from "@/lib/security-job-utils";
import { DASHBOARD_URGENT_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";
import { todayIsoLocal } from "@/lib/date-iso";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const JOB_LIST_SELECT = `${REQUEST_LIST_SELECT}, request_license_plates(plate_no,vehicle_note)`;

function todayIso(): string {
  return todayIsoLocal();
}

export default async function SecurityDashboardPage() {
  const { profile } = await requireAppMode("security");
  const supabase = getUserAppDb();
  const today = todayIso();

  const [{ data: jobsData }, urgentCalendarEvents, { data: photoRows }] = await Promise.all([
    supabase
      .from("parking_requests")
      .select(JOB_LIST_SELECT)
      .in("status", ["approved", "assigned", "in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(100),
    fetchUrgentDashboardCalendarEvents(supabase, today),
    supabase
      .from("request_attachments")
      .select("request_id")
      .eq("file_type", "completion_photo"),
  ]);

  const jobs = (jobsData ?? []) as unknown as SecurityJobRow[];
  const newJobs = jobs.filter((j) => j.status === "approved");
  const activeJobs = jobs.filter(
    (j) =>
      (j.status === "assigned" || j.status === "in_progress") && j.assigned_to === profile.id,
  );
  const completedJobs = jobs
    .filter((j) => j.status === "completed" && j.assigned_to === profile.id)
    .slice(0, 8);

  const photoCountByRequest = new Map<string, number>();
  for (const row of photoRows ?? []) {
    const id = row.request_id as string;
    photoCountByRequest.set(id, (photoCountByRequest.get(id) ?? 0) + 1);
  }

  const actionable = [...newJobs, ...activeJobs].filter((j) => isActionableSecurityJob(j.status));

  const prepJobs = actionable
    .filter((job) => {
      const next = getNextParkingDate(job, today);
      return next && needsParkingPrep(next, today);
    })
    .sort((a, b) => comparePrepPriority(a, b, today));

  const prepIds = new Set(prepJobs.map((j) => j.id));

  return (
    <>
      <PageHeader
        title={TH.nav.securityDashboard}
        description="จุดจอด · วันเวลา · ทะเบียน — พร้อมจดลงกระดาษก่อนถ่ายรูปส่งงาน"
      />

      <div className="mb-4">
        <SecurityLegend compact />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              ปฏิทินด่วน (วันนี้–{DASHBOARD_URGENT_CALENDAR_DAYS} วันข้างหน้า)
            </h2>
            <p className="text-sm text-muted-foreground">เฉพาะวันที่ใกล้ถึงเวลาจัดที่จอด</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
            <Link href="/security/calendar">
              <CalendarDays className="h-4 w-4" />
              ปฏิทินเต็ม
            </Link>
          </Button>
        </div>
        <SecurityParkingCalendar
          events={urgentCalendarEvents}
          todayIso={today}
          maxMobileDays={DASHBOARD_URGENT_CALENDAR_DAYS}
          showDesktop={false}
          emptyMessage={`ไม่มีงานจอดในช่วง ${DASHBOARD_URGENT_CALENDAR_DAYS} วันข้างหน้า`}
        />
      </section>

      <section className="mt-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            งานด่วน — ต้องจัดวันนี้/พรุ่งนี้ ({prepJobs.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            งานที่เริ่มจอดวันนี้หรือพรุ่งนี้ ต้องเตรียมที่จอดล่วงหน้า
          </p>
        </div>
        {prepJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            ไม่มีงานด่วนสำหรับวันนี้/พรุ่งนี้
          </p>
        ) : (
          <div className="grid gap-4">
            {prepJobs.map((job) => (
              <SecurityQuickJobCard
                key={`prep-${job.id}`}
                job={job}
                profileId={profile.id}
                photoCount={photoCountByRequest.get(job.id) ?? 0}
                today={today}
              />
            ))}
          </div>
        )}
      </section>

      <section id="new-jobs" className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">งานใหม่ ({newJobs.length})</h2>
        {newJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            ไม่มีงานใหม่ในขณะนี้
          </p>
        ) : (
          <div className="grid gap-4">
            {newJobs
              .filter((job) => !prepIds.has(job.id))
              .map((job) => (
                <SecurityQuickJobCard
                  key={job.id}
                  job={job}
                  profileId={profile.id}
                  photoCount={0}
                  today={today}
                />
              ))}
          </div>
        )}
      </section>

      <section id="active-jobs" className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">งานที่รับแล้ว ({activeJobs.length})</h2>
        {activeJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            ยังไม่มีงานที่รับไว้
          </p>
        ) : (
          <div className="grid gap-4">
            {activeJobs
              .filter((job) => !prepIds.has(job.id))
              .map((job) => (
                <SecurityQuickJobCard
                  key={job.id}
                  job={job}
                  profileId={profile.id}
                  photoCount={photoCountByRequest.get(job.id) ?? 0}
                  today={today}
                />
              ))}
          </div>
        )}
      </section>

      <section id="completed-jobs" className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">งานที่เสร็จแล้ว ({completedJobs.length})</h2>
        {completedJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
            ยังไม่มีงานที่เสร็จ
          </p>
        ) : (
          <div className="grid gap-4">
            {completedJobs.map((job) => (
              <SecurityQuickJobCard
                key={job.id}
                job={job}
                profileId={profile.id}
                photoCount={photoCountByRequest.get(job.id) ?? 0}
                today={today}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
