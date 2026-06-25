import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Button } from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listRequests } from "@nacc/db/queries";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { RequestsTable } from "@/components/requests-table";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const supabase = await createServerSupabase();
  const [{ rows }, { data: departments }] = await Promise.all([
    listRequests(supabase, { limit: 500 }),
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);

  return (
    <>
      <RealtimeRefresh />
      <PageHeader
        title={TH.nav.requests}
        description="รายการคำขอที่จอดรถทั้งหมด"
        actions={
          <Button asChild className="gap-2">
            <Link href="/requests/new">
              <Plus className="h-4 w-4" />
              {TH.action.create}
            </Link>
          </Button>
        }
      />
      <RequestsTable
        rows={rows as ParkingRequestListItem[]}
        departments={(departments ?? []) as { id: string; name_th: string }[]}
      />
    </>
  );
}
