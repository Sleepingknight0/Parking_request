import { Info } from "lucide-react";
import { PageHeader, Card, CardContent, CardHeader, CardTitle } from "@nacc/ui";
import { requireProfile } from "@nacc/auth/guards";
import { LegacyImporter } from "@/components/legacy-importer";

export const dynamic = "force-dynamic";

const EXPECTED_COLUMNS = [
  "วันที่รับเรื่อง",
  "สำนัก",
  "เลขหนังสือ",
  "วันที่จอด",
  "เวลาที่จอด",
  "จำนวนรถ",
  "อาคารที่จอด",
  "เจ้าหน้าที่ผู้รับเรื่อง",
];

export default async function ImportPage() {
  await requireProfile({
    roles: ["super_admin", "admin"],
    loginPath: "/login",
    noAccessPath: "/no-access",
  });

  return (
    <>
      <PageHeader
        title="นำเข้าข้อมูลเก่า"
        description="นำเข้าคำขอที่จอดรถจากไฟล์ CSV (ส่งออกจาก Google Sheet เดิม) เข้าสู่ระบบ"
      />

      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-blue-900">
            <Info className="h-5 w-5" /> รูปแบบไฟล์ที่รองรับ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>ไฟล์ CSV ต้องมีแถวหัวตาราง (header) ที่มีชื่อคอลัมน์ภาษาไทยดังนี้:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXPECTED_COLUMNS.map((c) => (
              <span key={c} className="rounded-md border border-blue-300 bg-white px-2 py-0.5 text-xs font-medium">
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs">
            ระบบจะจับคู่ “สำนัก” และ “อาคารที่จอด” กับข้อมูลในระบบให้อัตโนมัติ · รายการที่เลขหนังสือซ้ำกับที่มีอยู่แล้วจะถูกข้าม · คำขอที่วันที่จอดผ่านมาแล้วจะตั้งเป็น “เสร็จสมบูรณ์”
          </p>
        </CardContent>
      </Card>

      <LegacyImporter />
    </>
  );
}
