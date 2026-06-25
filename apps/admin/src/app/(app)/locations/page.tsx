import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { ReferenceManager, type ReferenceItem } from "@/components/reference-manager";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("locations")
    .select("id,name_th,description,is_active")
    .order("name_th");

  const items: ReferenceItem[] = (data ?? []).map((l) => ({
    id: l.id,
    name_th: l.name_th,
    secondary: l.description,
    is_active: l.is_active,
  }));

  return (
    <>
      <PageHeader title={TH.nav.locations} description="จัดการสถานที่/จุดจอดรถ" />
      <ReferenceManager kind="location" items={items} secondaryLabel="รายละเอียด" />
    </>
  );
}
