import { LoginCard } from "@nacc/ui";
import { signInAction } from "@nacc/auth/actions";
import { TH } from "@nacc/types";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const initialError = sp?.error === "inactive" ? TH.auth.inactive : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <LoginCard
        action={signInAction}
        appKind="user"
        appName={TH.app.userName}
        subtitle="สำหรับเจ้าหน้าที่บันทึกหนังสือ และพนักงานสื่อสารและ รปภ. ติดตามงาน"
        otherAppUrl={process.env.NEXT_PUBLIC_ADMIN_APP_URL}
        initialError={initialError}
      />
    </main>
  );
}
