#!/usr/bin/env tsx
/**
 * Full Supabase → Google Sheet sync.
 * Overwrites the Sheet with ALL parking_requests from Supabase.
 *
 * Usage:  pnpm push:sheet
 *
 * Steps:
 *  1. Format the Sheet (header row design, column widths, frozen row, status colors)
 *  2. Fetch all parking_requests with joins
 *  3. Write all rows to the Sheet in one batch
 *  4. Write back sheet_row to each Supabase record
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "path";

// Load admin .env.local (has GOOGLE_SHEETS_ID, GOOGLE_DRIVE_* etc.)
config({ path: path.resolve(process.cwd(), "apps/admin/.env.local"), override: false });

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { STATUS_LABELS_TH } from "@nacc/types";
import { LIVE_SHEET_HEADERS, formatTimeThDot } from "@nacc/utils";

// ─── Env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SRK      = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GS_ID             = process.env.GOOGLE_SHEETS_ID!;
const GS_TAB            = process.env.GOOGLE_SHEETS_TAB_NAME ?? "ชีต1";
const SA_EMAIL          = process.env.GOOGLE_DRIVE_CLIENT_EMAIL!;
const SA_KEY            = (process.env.GOOGLE_DRIVE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

function check() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SRK) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!GS_ID)        missing.push("GOOGLE_SHEETS_ID");
  if (!SA_EMAIL)     missing.push("GOOGLE_DRIVE_CLIENT_EMAIL");
  if (!SA_KEY)       missing.push("GOOGLE_DRIVE_PRIVATE_KEY");
  if (missing.length) {
    console.error("❌ Missing env vars:", missing.join(", "));
    process.exit(1);
  }
}

// ─── Sheets client ────────────────────────────────────────────────────────────
function sheetsClient() {
  const auth = new google.auth.JWT({ email: SA_EMAIL, key: SA_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

function rgb(r: number, g: number, b: number) {
  return { red: r / 255, green: g / 255, blue: b / 255 };
}

// ─── Format sheet ─────────────────────────────────────────────────────────────
async function formatSheet(sheetId: number) {
  const sheets = sheetsClient();
  const WHITE  = { red: 1, green: 1, blue: 1 };
  const NAVY   = rgb(30,  58,  95);
  const SYSTEM = rgb(55,  65,  81);
  const TEAL   = rgb(17,  94,  89);
  const LIGHT  = { style: "SOLID" as const, color: rgb(229, 231, 235) };
  const colWidths = [110, 280, 130, 110, 130, 75, 195, 175, 135, 145, 50];
  const statusColors = [
    { label: "แบบร่าง",           bg: rgb(209,213,219) },
    { label: "บันทึกหนังสือแล้ว", bg: rgb(191,219,254) },
    { label: "กำลังตรวจสอบ",      bg: rgb(253,230,138) },
    { label: "อนุมัติแล้ว",       bg: rgb(187,247,208) },
    { label: "มอบหมายงานแล้ว",    bg: rgb(221,214,254) },
    { label: "กำลังดำเนินการ",    bg: rgb(254,215,170) },
    { label: "เสร็จสมบูรณ์",      bg: rgb(167,243,208) },
    { label: "ยกเลิก",            bg: rgb(203,213,225) },
    { label: "ไม่อนุมัติ",        bg: rgb(254,202,202) },
  ];

  const requests: object[] = [
    { updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount" } },
    // Header A1:H1 — navy
    { repeatCell: {
        range: { sheetId, startRowIndex:0, endRowIndex:1, startColumnIndex:0, endColumnIndex:8 },
        cell: { userEnteredFormat: {
          backgroundColor: NAVY,
          textFormat: { foregroundColor: WHITE, bold: true, fontSize: 10 },
          horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE", wrapStrategy: "WRAP" } },
        fields: "userEnteredFormat" } },
    // Header I1 — teal (status)
    { repeatCell: {
        range: { sheetId, startRowIndex:0, endRowIndex:1, startColumnIndex:8, endColumnIndex:9 },
        cell: { userEnteredFormat: {
          backgroundColor: TEAL,
          textFormat: { foregroundColor: WHITE, bold: true, fontSize: 10 },
          horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } },
        fields: "userEnteredFormat" } },
    // Header J1:K1 — dark gray (system)
    { repeatCell: {
        range: { sheetId, startRowIndex:0, endRowIndex:1, startColumnIndex:9, endColumnIndex:11 },
        cell: { userEnteredFormat: {
          backgroundColor: SYSTEM,
          textFormat: { foregroundColor: WHITE, bold: true, fontSize: 9 },
          horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } },
        fields: "userEnteredFormat" } },
    // Data rows base style
    { repeatCell: {
        range: { sheetId, startRowIndex:1, endRowIndex:2000, startColumnIndex:0, endColumnIndex:11 },
        cell: { userEnteredFormat: {
          textFormat: { fontSize: 10 }, verticalAlignment: "MIDDLE", wrapStrategy: "WRAP",
          borders: { bottom: LIGHT, right: LIGHT } } },
        fields: "userEnteredFormat(textFormat,verticalAlignment,wrapStrategy,borders)" } },
    // Center: A, D, E, F, I, J, K
    ...([0, 3, 4, 5, 8, 9, 10].map(c => ({ repeatCell: {
        range: { sheetId, startRowIndex:1, endRowIndex:2000, startColumnIndex:c, endColumnIndex:c+1 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment" } }))),
    // Header row height 42px
    { updateDimensionProperties: {
        range: { sheetId, dimension:"ROWS", startIndex:0, endIndex:1 },
        properties: { pixelSize: 42 }, fields: "pixelSize" } },
    // Data row height 30px
    { updateDimensionProperties: {
        range: { sheetId, dimension:"ROWS", startIndex:1, endIndex:2000 },
        properties: { pixelSize: 30 }, fields: "pixelSize" } },
    // Column widths
    ...colWidths.map((px, i) => ({ updateDimensionProperties: {
        range: { sheetId, dimension:"COLUMNS", startIndex:i, endIndex:i+1 },
        properties: { pixelSize: px }, fields: "pixelSize" } })),
    // Status conditional formatting
    ...statusColors.map(({ label, bg }, idx) => ({ addConditionalFormatRule: { rule: {
        ranges: [{ sheetId, startRowIndex:1, endRowIndex:2000, startColumnIndex:8, endColumnIndex:9 }],
        booleanRule: {
          condition: { type:"TEXT_EQ", values:[{ userEnteredValue: label }] },
          format: { backgroundColor: bg, textFormat: { bold: true } } } },
        index: idx } })),
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId: GS_ID, requestBody: { requests } });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  check();
  console.log("🔄 Supabase → Google Sheet sync\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SRK, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sheets = sheetsClient();

  // 1. Get sheet metadata
  console.log("📋 กำลังตั้งค่า Sheet...");
  const info = await sheets.spreadsheets.get({ spreadsheetId: GS_ID });
  const sheetMeta = info.data.sheets?.find(s => s.properties?.title === GS_TAB);
  if (!sheetMeta) {
    console.error(`❌ ไม่พบ tab "${GS_TAB}" ใน spreadsheet`);
    process.exit(1);
  }
  const sheetId = sheetMeta.properties?.sheetId ?? 0;

  // 2. Clear existing conditional formats first
  const existingRules = sheetMeta.conditionalFormats?.length ?? 0;
  if (existingRules > 0) {
    const clearReqs = Array.from({ length: existingRules }, () => ({
      deleteConditionalFormatRule: { sheetId, index: 0 },
    }));
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: GS_ID, requestBody: { requests: clearReqs } });
  }

  // 3. Apply formatting
  await formatSheet(sheetId);
  console.log("✅ ออกแบบ Sheet เสร็จแล้ว");

  // 4. Write header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: GS_ID,
    range: `${GS_TAB}!A1:K1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...LIVE_SHEET_HEADERS]] },
  });

  // 5. Fetch ALL requests from Supabase
  console.log("📥 กำลังดึงข้อมูลจาก Supabase...");
  const { data: requests, error } = await supabase
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
    .order("received_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) { console.error("❌ Supabase error:", error.message); process.exit(1); }
  if (!requests?.length) { console.log("⚠️  ไม่มีข้อมูลใน Supabase"); return; }

  console.log(`   พบ ${requests.length} รายการ\n`);

  // 6. Clear old data rows
  await sheets.spreadsheets.values.clear({
    spreadsheetId: GS_ID,
    range: `${GS_TAB}!A2:K2000`,
  });

  // 7. Build all rows
  const rows: (string | number | null)[][] = requests.map((r: any) => {
    const dates   = (r.request_dates ?? []) as any[];
    const first   = dates[0] ?? null;
    const startTh = formatTimeThDot(first?.start_time);
    const endTh   = formatTimeThDot(first?.end_time);
    const time    = startTh && endTh ? `${startTh}-${endTh}` : startTh || endTh || "";
    const loc     = r.requested_location?.name_th ?? r.requested_location_text ?? "";
    const officer = r.legacy_officer_name ?? r.created_by_profile?.display_name ?? "";
    const status  = STATUS_LABELS_TH[r.status as keyof typeof STATUS_LABELS_TH] ?? r.status;

    return [
      r.received_date ?? "",          // A
      r.department?.name_th ?? "",    // B
      r.official_letter_no ?? "",     // C
      first?.request_date ?? "",      // D
      time,                           // E
      r.cars_count,                   // F
      loc,                            // G
      officer,                        // H
      status,                         // I
      r.request_no,                   // J
      r.id,                           // K
    ];
  });

  // 8. Write all rows at once
  if (rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: GS_ID,
      range: `${GS_TAB}!A2:K${rows.length + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  }

  // 9. Write sheet_row back to Supabase
  console.log("💾 กำลังบันทึก sheet_row กลับไปยัง Supabase...");
  const now = new Date().toISOString();
  for (let i = 0; i < requests.length; i++) {
    const rowNumber = i + 2; // data starts at row 2
    await supabase
      .from("parking_requests")
      .update({ sheet_row: rowNumber, sheet_synced_at: now })
      .eq("id", requests[i].id);
  }

  // 10. Summary
  console.log("\n✅ ซิงก์เสร็จสมบูรณ์!");
  console.log(`   📊 เขียน ${rows.length} แถวลงใน Sheet`);
  console.log(`   🔗 https://docs.google.com/spreadsheets/d/${GS_ID}/edit\n`);
  console.log("สถานะที่พบ:");
  const statusCount: Record<string, number> = {};
  for (const r of requests as any[]) {
    const lbl = STATUS_LABELS_TH[r.status as keyof typeof STATUS_LABELS_TH] ?? r.status;
    statusCount[lbl] = (statusCount[lbl] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(statusCount)) {
    console.log(`   ${k}: ${v}`);
  }
}

main().catch(e => { console.error("❌", e); process.exit(1); });
