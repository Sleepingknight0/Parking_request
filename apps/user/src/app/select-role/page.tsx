import Link from "next/link";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nacc/ui";
import { TH, USER_APP_ROLES } from "@nacc/types";
import { requireProfile } from "@nacc/auth/guards";

const modes = [
  {
    title: "เจ้าหน้าที่",
    description: "บันทึกหนังสือราชการ ขอที่จอดรถ และติดตามสถานะคำขอของตนเอง",
    href: "/officer/dashboard",
    icon: ClipboardList,
  },
  {
    title: "พนักงานสื่อสารและ รปภ.",
    description: "รับงาน ดำเนินการ อัปโหลดรูปถ่ายส่งงาน และดูประวัติการทำงาน",
    href: "/security/dashboard",
    icon: ShieldCheck,
  },
];

export default async function SelectRolePage() {
  await requireProfile({
    roles: USER_APP_ROLES,
    loginPath: "/login",
    noAccessPath: "/login",
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-blue-700">{TH.app.userName}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            เลือกบทบาทการใช้งาน
          </h1>
          <p className="max-w-2xl text-slate-600">
            เลือกหน้าการทำงานให้ตรงกับบทบาทของคุณ ระบบใช้ฐานข้อมูลและสถานะเดียวกันกับฝั่งผู้ดูแล
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.href} className="border-slate-200">
                <CardHeader className="gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle>{mode.title}</CardTitle>
                    <CardDescription className="mt-2">{mode.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={mode.href}>เข้าสู่หน้าทำงาน</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
