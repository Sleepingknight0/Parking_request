import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { requireAppMode } from "@/lib/user-guards";
import type { SecurityJobRow } from "@/lib/security-job-utils";
import { SecurityJobsList } from "@/components/security-jobs-list";

export const dynamic = "force-dynamic";

const JOB_LIST_SELECT = `${REQUEST_LIST_SELECT}, request_license_plates(plate_no,vehicle_note)`;

export default async function SecurityJobsPage() {
  const { profile } = await requireAppMode("security");
  const supabase = getUserAppDb();
  const { data } = await supabase
    .from("parking_requests")
    .select(JOB_LIST_SELECT)
    .in("status", ["approved", "assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(300);
  const jobs = (data ?? []) as unknown as SecurityJobRow[];

  return (
    <>
      <PageHeader
        title={TH.nav.jobs}
        description="ค้นหางาน กรองตามวันที่หรือสำนัก แล้วแตะเพื่อดูรายละเอียด"
      />
      <SecurityJobsList jobs={jobs} profileId={profile.id} />
    </>
  );
}
