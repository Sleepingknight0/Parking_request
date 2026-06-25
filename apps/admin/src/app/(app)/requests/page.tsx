import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Button, StatusLegend } from "@nacc/ui";
import { TH, ADMIN_STATUS_LEGEND, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { listRequests } from "@nacc/db/queries";
import { AdminRequestsPanel } from "@/components/admin-requests-panel";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const { profile } = await requireProfile();
  const canWrite = profile.role === "super_admin" || profile.role === "admin";
  const supabase = await createServerSupabase();
  const [{ rows }, { data: departments }] = await Promise.all([
    listRequests(supabase, { limit: 500 }),
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);

  return (
    <>
      <PageHeader
        title={TH.nav.requests}
        description="ค้นหา กรอง และจัดการคำขอทั้งหมด"
        actions={
          canWrite ? (
            <Button asChild className="gap-2">
              <Link href="/requests/new">
                <Plus className="h-4 w-4" />
                {TH.action.create}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4">
        <StatusLegend statuses={ADMIN_STATUS_LEGEND} compact />
      </div>
      <AdminRequestsPanel
        rows={rows as ParkingRequestListItem[]}
        departments={(departments ?? []) as { id: string; name_th: string }[]}
        defaultQueue="all"
        showTitle={false}
        showCalendarLink
      />
    </>
  );
}
