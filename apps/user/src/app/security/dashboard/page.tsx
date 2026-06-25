import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nacc/ui";
import { TH } from "@nacc/types";

export default function SecurityDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">พนักงานสื่อสารและ รปภ.</p>
            <h1 className="text-3xl font-semibold tracking-tight">{TH.nav.securityDashboard}</h1>
          </div>
          <Button asChild>
            <Link href="/security/jobs">ดูรายการงาน</Link>
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-5">
          {["งานใหม่", "งานที่รับแล้ว", "กำลังดำเนินการ", "เสร็จแล้ว", "ยกเลิก"].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>ข้อมูลจริงใน Loop User Flow</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">0</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
