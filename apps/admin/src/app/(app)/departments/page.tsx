import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { ReferenceManager, type ReferenceItem } from "@/components/reference-manager";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("departments")
    .select("id,name_th,short_name,is_active")
    .order("name_th");

  const items: ReferenceItem[] = (data ?? []).map((d) => ({
    id: d.id,
    name_th: d.name_th,
    secondary: d.short_name,
    is_active: d.is_active,
  }));

  return (
    <>
      <PageHeader title={TH.nav.departments} description="จัดการรายชื่อสำนัก/หน่วยงาน" />
      <ReferenceManager kind="department" items={items} secondaryLabel="ชื่อย่อ" />
    </>
  );
}
