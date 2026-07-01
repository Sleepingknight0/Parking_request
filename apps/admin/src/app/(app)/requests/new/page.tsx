import Link from "next/link";
import { PageHeader, Button } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { listActiveSecurityOfficers } from "@nacc/db/queries";
import { requireProfile } from "@nacc/auth/guards";
import { RequestForm } from "@/components/request-form";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const supabase = await createServerSupabase();
  const [{ data: departments }, { data: locations }, securityOfficers] = await Promise.all([
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
    supabase.from("locations").select("id,name_th").eq("is_active", true).order("name_th"),
    listActiveSecurityOfficers(supabase),
  ]);

  return (
    <>
      <PageHeader
        title={TH.action.create}
        description="บันทึกหนังสือขอที่จอดรถใหม่"
        actions={
          <Button asChild variant="outline">
            <Link href="/requests">{TH.action.back}</Link>
          </Button>
        }
      />
      <RequestForm
        mode="create"
        departments={(departments ?? []) as { id: string; name_th: string }[]}
        locations={(locations ?? []) as { id: string; name_th: string }[]}
        securityOfficers={securityOfficers}
      />
    </>
  );
}
