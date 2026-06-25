import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { listCommsRequests } from "@/lib/comms-data";
import { CommsRequestsList } from "@/components/comms-requests-list";

export const dynamic = "force-dynamic";

export default async function CommsRequestsPage() {
  const rows = await listCommsRequests();

  return (
    <>
      <PageHeader
        title="หนังสือและคำขอ"
        description="ดูและจัดการหนังสือราชการ ติดตามสถานะงานทั้งหมด"
      />
      <CommsRequestsList rows={rows} />
    </>
  );
}
