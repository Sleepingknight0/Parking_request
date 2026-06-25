"use client";

import * as React from "react";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@nacc/ui";
import { importLegacyCsv, type ImportSummary } from "@/lib/import-actions";

export function LegacyImporter() {
  const [csvText, setCsvText] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [loading, setLoading] = React.useState<"dry" | "apply" | null>(null);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSummary(null);
    setCsvText(await file.text());
  }

  async function run(apply: boolean) {
    if (!csvText) {
      toast.error("กรุณาเลือกไฟล์ CSV ก่อน");
      return;
    }
    setLoading(apply ? "apply" : "dry");
    try {
      const res = await importLegacyCsv(csvText, apply);
      setSummary(res);
      if (!res.ok) toast.error(res.error ?? "นำเข้าไม่สำเร็จ");
      else if (apply) toast.success(`นำเข้าสำเร็จ ${res.inserted} รายการ`);
      else toast.success(`ตรวจสอบแล้ว — จะนำเข้า ${res.inserted} รายการ`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            เลือกไฟล์ CSV จาก Google Sheet เดิม
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <label className="cursor-pointer">
              <span className="font-medium text-primary hover:underline">เลือกไฟล์ .csv</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {fileName ? `เลือกแล้ว: ${fileName}` : "ส่งออกชีตเดิมเป็น CSV แล้วเลือกที่นี่"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!csvText || loading !== null}
              onClick={() => run(false)}
            >
              {loading === "dry" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              ตรวจสอบก่อน (ลองนำเข้า)
            </Button>
            <Button
              className="gap-2"
              disabled={!csvText || loading !== null || !summary?.ok}
              onClick={() => setConfirmOpen(true)}
            >
              {loading === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              นำเข้าจริง
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            แนะนำให้กด “ตรวจสอบก่อน” เพื่อดูผลลัพธ์ ก่อนกด “นำเข้าจริง” · ระบบข้ามรายการที่เลขหนังสือซ้ำกับที่มีอยู่แล้วโดยอัตโนมัติ
          </p>
        </CardContent>
      </Card>

      {summary?.ok ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {summary.applied ? "ผลการนำเข้า" : "ผลการตรวจสอบ (ยังไม่บันทึก)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="ทั้งหมด" value={summary.total} />
              <Stat label={summary.applied ? "นำเข้าแล้ว" : "จะนำเข้า"} value={summary.inserted} accent="text-emerald-600" />
              <Stat label="ข้าม (ซ้ำ)" value={summary.skippedDuplicate} accent="text-amber-600" />
              <Stat label="ข้าม (ไม่ถูกต้อง)" value={summary.skippedInvalid} accent="text-red-600" />
              <Stat label="สำนักไม่ตรง" value={summary.unmatchedDept} />
              <Stat label="สถานที่อิสระ" value={summary.unmatchedLocation} />
            </div>

            {summary.preview.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">แถว</TableHead>
                      <TableHead className="whitespace-nowrap">เลขหนังสือ</TableHead>
                      <TableHead className="whitespace-nowrap">สำนัก</TableHead>
                      <TableHead className="whitespace-nowrap">วันที่จอด</TableHead>
                      <TableHead className="whitespace-nowrap text-right">รถ</TableHead>
                      <TableHead className="whitespace-nowrap">สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.preview.map((p) => (
                      <TableRow key={p.row}>
                        <TableCell className="text-sm text-muted-foreground">{p.row}</TableCell>
                        <TableCell className="text-sm font-medium">{p.letterNo}</TableCell>
                        <TableCell className="text-sm">
                          {p.dept}
                          {!p.deptMatched ? (
                            <span className="ml-1 text-xs text-amber-600">(ไม่ตรง)</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">{p.parkingDate}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{p.cars}</TableCell>
                        <TableCell className="text-sm">{p.status === "completed" ? "เสร็จสมบูรณ์" : "บันทึกหนังสือแล้ว"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {summary.inserted > summary.preview.length ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    แสดงตัวอย่าง {summary.preview.length} แถวแรก จากทั้งหมด {summary.inserted} แถวที่จะนำเข้า
                  </p>
                ) : null}
              </div>
            ) : null}

            {summary.warnings.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> คำเตือน ({summary.warnings.length})
                </p>
                <ul className="max-h-48 list-inside list-disc space-y-0.5 overflow-y-auto text-xs text-amber-800">
                  {summary.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการนำเข้าข้อมูลจริง</DialogTitle>
            <DialogDescription>
              ระบบจะบันทึกข้อมูลที่ผ่านการตรวจสอบลงฐานข้อมูล (ข้ามรายการซ้ำให้อัตโนมัติ) การนำเข้าจะเพิ่มคำขอใหม่เข้าระบบจริง
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading !== null}>
              ยกเลิก
            </Button>
            <Button onClick={() => run(true)} disabled={loading !== null} className="gap-2">
              {loading === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              นำเข้าจริง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
      <div className={`text-xl font-bold tabular-nums ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
