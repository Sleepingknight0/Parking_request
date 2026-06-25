#!/usr/bin/env tsx
/**
 * Realtime watcher — Supabase → Google Sheet (auto mode)
 *
 * Subscribes to parking_requests via Supabase Realtime and pushes every
 * INSERT / UPDATE to the Sheet automatically — no manual pnpm push:sheet needed.
 *
 * Usage:  pnpm watch:sheet
 *         Ctrl+C to stop.
 *
 * In production, Vercel Cron at /api/sync/poll covers the Sheet → Supabase direction.
 * This script covers the Supabase → Sheet direction for local development.
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), "apps/admin/.env.local"), override: false });

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { STATUS_LABELS_TH } from "@nacc/types";
import { formatTimeThDot } from "@nacc/utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GS_ID        = process.env.GOOGLE_SHEETS_ID!;
const GS_TAB       = process.env.GOOGLE_SHEETS_TAB_NAME ?? "ชีต1";
const SA_EMAIL     = process.env.GOOGLE_DRIVE_CLIENT_EMAIL!;
const SA_KEY       = (process.env.GOOGLE_DRIVE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

function sheetsClient() {
  const auth = new google.auth.JWT({
    email: SA_EMAIL,
    key: SA_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function syncRequest(
  // This script syncs dynamic Sheet-only columns, so keep the Supabase client
  // intentionally untyped until generated DB types are refreshed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
) {
  const { data: r, error } = await supabase
    .from("parking_requests")
    .select(`
      id, request_no, official_letter_no, received_date,
      cars_count, requested_location_text, legacy_officer_name,
      status, sheet_row,
      department:departments(name_th),
      requested_location:locations(name_th),
      created_by_profile:profiles!created_by(display_name),
      request_dates(request_date,start_time,end_time)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !r) {
    console.error(`  ❌ ดึงข้อมูลไม่ได้ ${id}:`, error?.message ?? "not found");
    return;
  }

  const dates   = ((r as any).request_dates ?? []) as any[];
  const first   = dates[0] ?? null;
  const startTh = formatTimeThDot(first?.start_time);
  const endTh   = formatTimeThDot(first?.end_time);
  const time    = startTh && endTh ? `${startTh}-${endTh}` : startTh || endTh || "";
  const loc     = (r as any).requested_location?.name_th ?? (r as any).requested_location_text ?? "";
  const officer = (r as any).legacy_officer_name ?? (r as any).created_by_profile?.display_name ?? "";
  const status  = STATUS_LABELS_TH[(r as any).status as keyof typeof STATUS_LABELS_TH] ?? (r as any).status;

  const row = [
    (r as any).received_date ?? "",
    (r as any).department?.name_th ?? "",
    (r as any).official_letter_no ?? "",
    first?.request_date ?? "",
    time,
    (r as any).cars_count,
    loc,
    officer,
    status,
    (r as any).request_no,
    (r as any).id,
  ];

  const sheets   = sheetsClient();
  const now      = new Date().toISOString();
  const sheetRow = (r as any).sheet_row as number | null;

  if (sheetRow) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: GS_ID,
      range: `${GS_TAB}!A${sheetRow}:K${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    await supabase
      .from("parking_requests")
      .update({ sheet_synced_at: now })
      .eq("id", id);
    console.log(`  ✅ อัปเดตแถว ${sheetRow}: ${(r as any).request_no ?? id.slice(0, 8)}`);
  } else {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: GS_ID,
      range: `${GS_TAB}!A:K`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    const updatedRange = res.data.updates?.updatedRange ?? "";
    const m = updatedRange.match(/[A-Z!]+(\d+):/);
    const newRow = m && m[1] ? parseInt(m[1], 10) : null;
    await supabase
      .from("parking_requests")
      .update({ sheet_row: newRow, sheet_synced_at: now })
      .eq("id", id);
    console.log(`  ✅ เพิ่มแถวใหม่ ${newRow ?? "?"}: ${(r as any).request_no ?? id.slice(0, 8)}`);
  }
}

async function main() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SRK) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!GS_ID)        missing.push("GOOGLE_SHEETS_ID");
  if (!SA_EMAIL)     missing.push("GOOGLE_DRIVE_CLIENT_EMAIL");
  if (!SA_KEY)       missing.push("GOOGLE_DRIVE_PRIVATE_KEY");
  if (missing.length) {
    console.error("❌ Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRK, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });

  console.log("👀  Auto-sync เปิดแล้ว — กำลังเฝ้าดู parking_requests");
  console.log(`    Sheet: https://docs.google.com/spreadsheets/d/${GS_ID}/edit`);
  console.log("    กด Ctrl+C เพื่อหยุด\n");

  const channel = supabase
    .channel("sheet-auto-sync")
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "parking_requests" },
      async (payload: any) => {
        const eventType = payload.eventType as string;
        const id        = (payload.new as any)?.id ?? (payload.old as any)?.id;
        if (!id) return;
        console.log(`\n[${new Date().toLocaleTimeString("th")}] 📡 ${eventType} → ${id.slice(0, 8)}…`);
        try {
          await syncRequest(supabase, id);
        } catch (e: any) {
          console.error("  ❌ sync ล้มเหลว:", e?.message);
        }
      }
    )
    .subscribe((status: string) => {
      if (status === "SUBSCRIBED") {
        console.log("[realtime] 🔗 เชื่อมต่อสำเร็จ — รอการเปลี่ยนแปลง...\n");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("[realtime] ❌", status, "— ลองใหม่...");
      }
    });

  process.on("SIGINT", async () => {
    console.log("\n[watch] 👋 กำลังหยุดการทำงาน...");
    await supabase.removeChannel(channel);
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

main().catch(e => { console.error("❌", e); process.exit(1); });
