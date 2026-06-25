import { TH } from "@nacc/types";
import { RolePicker } from "@/components/role-picker";

const ERROR_MESSAGES: Record<string, string> = {
  admin: "ยังไม่ได้ตั้งค่าแอปผู้ดูแล (NEXT_PUBLIC_ADMIN_APP_URL)",
  setup: "ยังไม่ได้ตั้งค่าบัญชีเดโมในระบบ กรุณารัน seed",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const error = errorCode ? ERROR_MESSAGES[errorCode] : undefined;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5 sm:max-w-lg">
        <header className="space-y-1.5 text-center">
          <p className="text-xs font-medium text-blue-700 sm:text-sm">{TH.app.userName}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            เลือกบทบาทการใช้งาน
          </h1>
          <p className="text-sm text-slate-600">
            เลือกหน้าที่ตรงกับงานของคุณ — ส่วนใหญ่ไม่ต้องล็อกอิน ยกเว้นผู้ดูแลระบบ
          </p>
        </header>

        <RolePicker error={error} />
      </div>
    </main>
  );
}
