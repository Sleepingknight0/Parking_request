import Link from "next/link";
import { PageHeader, Button } from "@nacc/ui";
import { TH } from "@nacc/types";
import { listCommsRequests, enrichCommsRowsWithLetterCounts } from "@/lib/comms-data";
import { CommsRequestsList } from "@/components/comms-requests-list";

export const dynamic = "force-dynamic";

export default async function CommsRequestsPage() {
  const rows = await enrichCommsRowsWithLetterCounts(await listCommsRequests());

  return (
    <>
      <PageHeader
        title="หนังสือและคำขอ"
        description="ค้นหา กรอง อนุมัติ หรือบันทึกหนังสือใหม่"
        actions={
          <Button asChild>
            <Link href="/comms/requests/new">{TH.comms.recordLetter}</Link>
          </Button>
        }
      />
      <CommsRequestsList rows={rows} />
    </>
  );
}
