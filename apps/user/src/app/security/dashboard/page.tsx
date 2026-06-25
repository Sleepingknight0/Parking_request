import { PageHeader } from "@nacc/ui";
import { TH, type RequestStatus } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { formatTimeRange } from "@nacc/utils";
import { requireAppMode } from "@/lib/user-guards";
import { type CalendarEvent } from "@/components/request-calendar";
import { SecurityParkingCalendar } from "@/components/security-parking-calendar";
import { SecurityQuickJobCard } from "@/components/security-quick-job-card";
import { SecurityLegend } from "@/components/security-legend";
import {
  comparePrepPriority,
  getNextParkingDate,
  getSecurityEventColor,
  isActionableSecurityJob,
  needsParkingPrep,
  type SecurityJobRow,
} from "@/lib/security-job-utils";

export const dynamic = "force-dynamic";

const JOB_LIST_SELECT = `${REQUEST_LIST_SELECT}, request_license_plates(plate_no,vehicle_note)`;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SecurityDashboardPage() {
  const { profile } = await requireAppMode("security");
  const supabase = await createServerSupabase();
  const today = todayIso();

  const [{ data: jobsData }, { data: calendarRows }, { data: photoRows }] = await Promise.all([
    supabase
      .from("parking_requests")
      .select(JOB_LIST_SELECT)
      .in("status", ["approved", "assigned", "in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("request_dates")
      .select(
        `request_date,start_time,end_time,
        parking_requests!inner(
          id,request_no,official_letter_no,status,cars_count,requested_location_text,
          department:departments(short_name,name_th),
          requested_location:locations(name_th)
        )`,
      ),
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

  const calendarEvents: CalendarEvent[] = (
    (calendarRows ?? []) as unknown as Array<{
      request_date: string;
      start_time: string | null;
      end_time: string | null;
      parking_requests: {
        id: string;
        official_letter_no: string;
        status: RequestStatus;
        cars_count: number;
        requested_location_text: string | null;
        department: { short_name: string | null; name_th: string } | null;
        requested_location: { name_th: string } | null;
      } | null;
    }>
  )
    .filter((r) => r.parking_requests && r.parking_requests.status !== "draft")
    .map((r) => {
      const p = r.parking_requests!;
      const location =
        p.requested_location?.name_th ?? p.requested_location_text ?? "ยังไม่ระบุสถานที่";
      const start = r.start_time ? `${r.request_date}T${r.start_time}` : r.request_date;
      const end = r.end_time ? `${r.request_date}T${r.end_time}` : undefined;
      const timeLabel = formatTimeRange(r.start_time, r.end_time) || undefined;
      return {
        id: `${p.id}-${r.request_date}`,
        requestId: p.id,
        title: `${location} · ${p.cars_count} คัน`,
        subtitle: timeLabel,
        timeLabel,
        start,
        end,
        color: getSecurityEventColor(p.status, r.request_date, today),
      };
    });

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
        <h2 className="text-lg font-semibold text-slate-900">ปฏิทินวันขอใช้ที่จอดรถ</h2>
        <SecurityParkingCalendar events={calendarEvents} todayIso={today} />
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
