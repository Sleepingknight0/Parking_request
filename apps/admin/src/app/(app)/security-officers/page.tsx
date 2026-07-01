import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { ReferenceManager, type ReferenceItem } from "@/components/reference-manager";

export const dynamic = "force-dynamic";

export default async function SecurityOfficersPage() {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("security_officers")
    .select("id,name_th,is_active")
    .order("sort_order", { ascending: true })
    .order("name_th", { ascending: true });

  const items: ReferenceItem[] = (data ?? []).map((row) => ({
    id: row.id,
    name_th: row.name_th,
    secondary: null,
    is_active: row.is_active,
  }));

  return (
    <>
      <PageHeader
        title={TH.nav.securityOfficers}
        description="จัดการรายชื่อเจ้าหน้าที่ที่รับเรื่องสำหรับฝ่ายสื่อสาร — รายชื่อนี้จะแสดงใน dropdown ตอนบันทึกหนังสือ"
      />
      <ReferenceManager kind="security_officer" items={items} />
    </>
  );
}
