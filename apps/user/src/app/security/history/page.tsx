import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import { requireAppMode } from "@/lib/user-guards";
import type { SecurityJobRow } from "@/lib/security-job-utils";
import { SecurityHistoryList } from "@/components/security-history-list";

export const dynamic = "force-dynamic";

const JOB_LIST_SELECT = `${REQUEST_LIST_SELECT}, request_license_plates(plate_no,vehicle_note)`;

export default async function SecurityHistoryPage() {
  const { profile } = await requireAppMode("security");
  const supabase = getUserAppDb();
  const { data } = await supabase
    .from("parking_requests")
    .select(JOB_LIST_SELECT)
    .eq("assigned_to", profile.id)
    .in("status", ["completed", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(200);
  const jobs = (data ?? []) as unknown as SecurityJobRow[];

  return (
    <>
      <PageHeader
        title={TH.nav.history}
        description="ประวัติงานที่คุณทำเสร็จหรือยกเลิกแล้ว"
      />
      <SecurityHistoryList jobs={jobs} />
    </>
  );
}
