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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <LoginCard
        action={signInAction}
        appKind="admin"
        appName={TH.app.adminName}
        subtitle="สำหรับผู้ดูแลระบบและเจ้าหน้าที่"
        otherAppUrl={process.env.NEXT_PUBLIC_USER_APP_URL}
        initialError={initialError}
        footer={
          <span>
            บัญชีเดโม: <strong>admin / admin</strong>
            <br />
            (กรุณาเปลี่ยนรหัสผ่านก่อนใช้งานจริง)
          </span>
        }
      />
    </main>
  );
}
