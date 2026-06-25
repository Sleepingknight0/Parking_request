import { TH } from "@nacc/types";
import { RolePicker } from "@/components/role-picker";

const ERROR_MESSAGES: Record<string, string> = {
  login: "ไม่สามารถเข้าใช้งานได้ กรุณาลองใหม่อีกครั้ง",
  inactive: "บัญชีนี้ถูกปิดการใช้งาน",
  role: "บทบาทไม่ตรงกับระบบ กรุณาเลือกใหม่",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const error = errorCode ? ERROR_MESSAGES[errorCode] : undefined;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-2 text-center md:text-left">
          <p className="text-sm font-medium text-blue-700">{TH.app.userName}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            เลือกบทบาทการใช้งาน
          </h1>
          <p className="mx-auto max-w-2xl text-slate-600 md:mx-0">
            เลือกหน้าการทำงานให้ตรงกับหน้าที่ของคุณ ระบบใช้ฐานข้อมูลเดียวกับฝั่งผู้ดูแล
          </p>
        </header>

        <RolePicker error={error} />
      </div>
    </main>
  );
}
