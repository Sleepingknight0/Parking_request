import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nacc/ui";
import { TH } from "@nacc/types";

export default function OfficerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">เจ้าหน้าที่</p>
            <h1 className="text-3xl font-semibold tracking-tight">{TH.nav.officerDashboard}</h1>
          </div>
          <Button asChild>
            <Link href="/officer/requests/new">{TH.action.recordLetter}</Link>
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {["แบบร่าง", "รอดำเนินการ", "สถานะล่าสุด"].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>จะเชื่อมข้อมูลจริงใน Loop User Flow</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">0</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
