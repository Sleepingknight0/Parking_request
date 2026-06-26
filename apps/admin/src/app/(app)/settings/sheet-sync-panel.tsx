"use client";

import { useState } from "react";
import { RefreshCw, Sheet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@nacc/ui";

interface SyncResult {
  ok?: boolean;
  error?: string;
  matched?: number;
  updated?: number;
  checked?: number;
  skipped?: number;
  errors?: string[];
  sheet_row?: number;
}

export function SheetSyncPanel() {
  const [pushLoading, setPushLoading]     = useState(false);
  const [pullLoading, setPullLoading]     = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [result, setResult] = useState<{ type: string; data: SyncResult } | null>(null);

  async function callSync(path: string, type: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "same-origin",
      });
      const data: SyncResult = await res.json();
      setResult({ type, data });
    } catch (e: any) {
      setResult({ type, data: { error: e.message } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sheet className="h-5 w-5 text-emerald-600" />
          ซิงก์ Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ซิงก์อัตโนมัติทุกวัน 09:00 น. (Vercel Cron) — หรือกดปุ่มด้านล่างเพื่อซิงก์ทันที
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Supabase → Sheet */}
          <Button
            variant="outline"
            size="sm"
            disabled={backfillLoading}
            onClick={() => callSync("/api/sync/backfill", "backfill", setBackfillLoading)}
            className="gap-2"
          >
            {backfillLoading
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <ArrowUpFromLine className="h-4 w-4" />}
            ดึงข้อมูลจาก Supabase → Sheet
          </Button>

          {/* Sheet → Supabase */}
          <Button
            variant="outline"
            size="sm"
            disabled={pullLoading}
            onClick={() => callSync("/api/sync/poll", "poll", setPullLoading)}
            className="gap-2"
          >
            {pullLoading
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <ArrowDownToLine className="h-4 w-4" />}
            ดึงข้อมูลจาก Sheet → Supabase
          </Button>
        </div>

        {result && (
          <div className={`rounded-md px-4 py-3 text-sm ${result.data.error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
            {result.data.error ? (
              <p>เกิดข้อผิดพลาด: {result.data.error}</p>
            ) : result.type === "backfill" ? (
              <p>
                ✓ จับคู่แล้ว {result.data.matched ?? 0} แถว
                {(result.data.skipped ?? 0) > 0 && ` · ข้าม ${result.data.skipped} แถว`}
                {(result.data.errors?.length ?? 0) > 0 && ` · ผิดพลาด ${result.data.errors!.length} แถว`}
              </p>
            ) : (
              <p>
                ✓ ตรวจ {result.data.checked ?? 0} แถว
                · อัปเดต {result.data.updated ?? 0} แถว
                {(result.data.skipped ?? 0) > 0 && ` · ข้าม ${result.data.skipped} แถว`}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          หมายเหตุ: ต้องเปิด Sheets API และแชร์ Sheet กับ service account ก่อนใช้งาน
        </p>
      </CardContent>
    </Card>
  );
}
