import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServiceClient } from "@nacc/db/service";
import { requireAppMode } from "@/lib/user-guards";
import { OfficerRequestForm } from "@/components/officer-request-form";

export const dynamic = "force-dynamic";

export default async function NewCommsRequestPage() {
  await requireAppMode("comms");
  const svc = createServiceClient();
  const [{ data: departments }, { data: locations }, { data: securityOfficers }] = await Promise.all([
    svc.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
    svc.from("locations").select("id,name_th").eq("is_active", true).order("name_th"),
    svc
      .from("security_officers")
      .select("id,name_th")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name_th", { ascending: true }),
  ]);

  return (
    <>
      <PageHeader
        title={TH.comms.recordLetter}
        description={TH.comms.recordHint}
      />
      <OfficerRequestForm
        mode="create"
        variant="comms"
        departments={(departments ?? []) as { id: string; name_th: string }[]}
        locations={(locations ?? []) as { id: string; name_th: string }[]}
        securityOfficers={(securityOfficers ?? []) as { id: string; name_th: string }[]}
      />
    </>
  );
}
