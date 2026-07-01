/**
 * POST /api/sync/backfill
 *
 * One-time (or repeated) operation that:
 *   1. Reads all existing rows from the Google Sheet
 *   2. Matches each row to a Supabase record via official_letter_no
 *   3. Writes sheet_row back to Supabase
 *   4. Writes the full A-AN Supabase mirror row back to the Sheet
 *
 * Run this once after initial setup to link the historical rows to Supabase.
 * Safe to run multiple times — existing links are preserved.
 *
 * Authorization: header  x-sync-secret: <SYNC_WEBHOOK_SECRET>
 *   OR: valid Supabase admin session cookie (for browser-triggered runs)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@nacc/db/service";
import {
  getAllSheetRows,
  updateSheetRow,
  ensureSheetHeader,
  resolveSheetTabName,
  isSheetsConfigured,
  googleSheetsId,
} from "@nacc/storage";
import { buildLiveSheetRow, LIVE_SHEET_HEADERS, thaiNumeralsToArabic } from "@nacc/utils";
import { authorizeSyncRequest } from "@/lib/sync-auth";
import { fetchLiveSheetRequest } from "@/lib/sheet-row";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
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
    const sheetName = await resolveSheetTabName(spreadsheetId);

    // Header only — skip heavy formatting (initSheetFormat) to avoid Vercel timeout.
    await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);

    const sheetRows = await getAllSheetRows(spreadsheetId, sheetName);

    const results = {
      total: sheetRows.length,
      matched: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const { rowNumber, values } of sheetRows) {
      const rawLetterNo = values[2]?.trim();
      const letterNo = rawLetterNo ? thaiNumeralsToArabic(rawLetterNo) : "";
      if (!letterNo || letterNo === "-") {
        results.skipped++;
        continue;
      }

      const { data: match } = await supabase
        .from("parking_requests")
        .select("id, sheet_row")
        .or(`official_letter_no.eq.${letterNo},official_letter_no.ilike.${letterNo}`)
        .maybeSingle();

      if (!match) {
        results.skipped++;
        continue;
      }

      if (!match.sheet_row || match.sheet_row !== rowNumber) {
        await supabase
          .from("parking_requests")
          .update({ sheet_row: rowNumber, sheet_synced_at: new Date().toISOString() })
          .eq("id", match.id);
      }

      const mirror = await fetchLiveSheetRequest(supabase, match.id);
      if (!mirror) {
        results.skipped++;
        continue;
      }
      const fullRow = buildLiveSheetRow(mirror);

      try {
        await updateSheetRow(spreadsheetId, sheetName, rowNumber, fullRow);
        results.matched++;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.errors.push(`row ${rowNumber}: ${message}`);
      }
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[sync/backfill]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
