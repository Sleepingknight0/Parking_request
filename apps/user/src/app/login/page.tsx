import { LoginCard } from "@nacc/ui";
import { TH } from "@nacc/types";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <LoginCard
        appName={TH.app.userName}
        description="สำหรับเจ้าหน้าที่บันทึกหนังสือ และพนักงานสื่อสารและ รปภ. ติดตามงาน"
      />
    </main>
  );
}
