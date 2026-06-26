/**
 * POST /api/sync/backfill
 *
 * One-time (or repeated) operation that:
 *   1. Reads all existing rows from the Google Sheet
 *   2. Matches each row to a Supabase record via official_letter_no
 *   3. Writes sheet_row back to Supabase
 *   4. Writes columns I (สถานะ), J (เลขที่คำขอ), K (_id) to the Sheet
 *
 * Run this once after initial setup to link the historical rows to Supabase.
 * Safe to run multiple times — existing links are preserved.
 *
 * Authorization: header  x-sync-secret: <SYNC_WEBHOOK_SECRET>
 *   OR: valid Supabase admin session cookie (for browser-triggered runs)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@nacc/db/service";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  getAllSheetRows,
  updateSheetRow,
  ensureSheetHeader,
  initSheetFormat,
  isSheetsConfigured,
  googleSheetsId,
  googleSheetsTabName,
} from "@nacc/storage";
import { LIVE_SHEET_HEADERS, thaiNumeralsToArabic } from "@nacc/utils";
import { authorizeSyncRequest } from "@/lib/sync-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await authorizeSyncRequest(req);
  if (denied) return denied;

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets not configured" },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  const spreadsheetId = googleSheetsId()!;
  const sheetName = googleSheetsTabName();

  // ── Write header + apply full sheet design ────────────────────────────────
  await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);
  await initSheetFormat(spreadsheetId, sheetName);

  // ── Read all sheet rows ───────────────────────────────────────────────────
  const sheetRows = await getAllSheetRows(spreadsheetId, sheetName);

  const results = {
    total: sheetRows.length,
    matched: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const { rowNumber, values } of sheetRows) {
    const rawLetterNo = values[2]?.trim();
    // Normalize Thai numerals (e.g. ๐๓๐๒ → 0302) and skip empty/dash rows
    const letterNo = rawLetterNo ? thaiNumeralsToArabic(rawLetterNo) : "";
    if (!letterNo || letterNo === "-") {
      results.skipped++;
      continue;
    }

    // Look up by official_letter_no — try exact match first, then ilike
    const { data: match } = await supabase
      .from("parking_requests")
      .select("id, request_no, status, sheet_row")
      .or(`official_letter_no.eq.${letterNo},official_letter_no.ilike.${letterNo}`)
      .maybeSingle();

    if (!match) {
      results.skipped++;
      continue;
    }

    // Write sheet_row to Supabase (only if not already set or if different)
    if (!match.sheet_row || match.sheet_row !== rowNumber) {
      await supabase
        .from("parking_requests")
        .update({ sheet_row: rowNumber, sheet_synced_at: new Date().toISOString() })
        .eq("id", match.id);
    }

    // Write I, J, K columns to the sheet row (preserve A-H)
    const fullRow = [...values];
    while (fullRow.length < 11) fullRow.push("");
    fullRow[8] =
      STATUS_LABELS_TH[match.status as keyof typeof STATUS_LABELS_TH] ?? match.status;
    fullRow[9] = match.request_no;
    fullRow[10] = match.id;

    try {
      await updateSheetRow(spreadsheetId, sheetName, rowNumber, fullRow);
      results.matched++;
    } catch (e: any) {
      results.errors.push(`row ${rowNumber}: ${e?.message}`);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
