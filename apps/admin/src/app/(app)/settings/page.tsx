import { AlertTriangle } from "lucide-react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@nacc/ui";
import { TH, ROLE_LABELS_TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { formatThaiDateTime } from "@nacc/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  const supabase = await createServerSupabase();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id,action,entity_type,created_at,actor:profiles!actor_id(display_name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <PageHeader title={TH.nav.settings} description="ข้อมูลระบบและบันทึกกิจกรรม" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">บัญชีของฉัน</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="ชื่อ-นามสกุล" value={profile.display_name} />
            <Row label="ชื่อผู้ใช้" value={profile.username ?? "-"} />
            <Row label="บทบาท" value={ROLE_LABELS_TH[profile.role]} />
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-5 w-5" /> ความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            ระบบนี้ติดตั้งบัญชีเดโม <strong>admin / admin</strong> สำหรับการพัฒนาเท่านั้น
            กรุณาเปลี่ยนรหัสผ่านและปิดบัญชีเดโมก่อนนำไปใช้งานจริง
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">{TH.nav.activityLogs}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {logs && logs.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">เวลา</TableHead>
                  <TableHead className="text-right">ผู้ดำเนินการ</TableHead>
                  <TableHead className="text-right">การกระทำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm text-muted-foreground">{formatThaiDateTime(l.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      {(l.actor as { display_name?: string } | null)?.display_name ?? "ระบบ"}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-xs">{l.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6"><EmptyState title={TH.state.empty} className="border-0 bg-transparent py-8" /></div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
