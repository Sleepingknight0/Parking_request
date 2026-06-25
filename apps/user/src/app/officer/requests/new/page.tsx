import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { OfficerRequestForm } from "@/components/officer-request-form";

export const dynamic = "force-dynamic";

export default async function NewOfficerRequestPage() {
  const supabase = getUserAppDb();
  const [{ data: departments }, { data: locations }] = await Promise.all([
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
    supabase.from("locations").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);

  return (
    <>
      <PageHeader
        title={TH.action.recordLetter}
        description="กรอกข้อมูลหนังสือราชการและรายละเอียดวันที่ต้องการใช้ที่จอดรถ — บันทึกเข้าระบบร่วมกัน"
      />
      <OfficerRequestForm
        mode="create"
        departments={(departments ?? []) as { id: string; name_th: string }[]}
        locations={(locations ?? []) as { id: string; name_th: string }[]}
      />
    </>
  );
}
