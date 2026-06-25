import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { listRequests } from "@nacc/db/queries";
import { OfficerRequestsList } from "@/components/officer-requests-list";

export const dynamic = "force-dynamic";

export default async function OfficerRequestsPage() {
  const supabase = getUserAppDb();
  const { rows } = await listRequests(supabase, { limit: 300 });
  const requests = rows as ParkingRequestListItem[];

  return (
    <>
      <PageHeader
        title={TH.nav.officerRequests}
        description="ดูและติดตามคำขอทั้งหมดในระบบ — ใครก็บันทึกและแก้ไขร่วมกันได้"
        actions={
          <Button asChild className="hidden gap-2 sm:inline-flex">
            <Link href="/officer/requests/new">
              <Plus className="h-4 w-4" />
              {TH.nav.recordLetterShort}
            </Link>
          </Button>
        }
      />

      {requests.length ? (
        <OfficerRequestsList rows={requests} />
      ) : (
        <EmptyState
          title="ยังไม่มีคำขอในระบบ"
          description="เริ่มบันทึกหนังสือราชการขอที่จอดรถรายการแรกได้เลย"
          action={
            <Button asChild>
              <Link href="/officer/requests/new">{TH.action.recordLetter}</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
