import { ShieldAlert } from "lucide-react";
import { Button, Card, CardContent } from "@nacc/ui";
import { TH } from "@nacc/types";
import { logout } from "@/lib/auth-actions";

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{TH.auth.noAccess}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบผู้ดูแล
            </p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline">
              {TH.action.logout}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
