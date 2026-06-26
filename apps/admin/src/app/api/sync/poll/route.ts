/**
 * POST /api/sync/poll  (also GET for Vercel Cron)
 *
 * Reads every row in the Google Sheet that has a Supabase UUID in column K,
 * compares columns B-H against what Supabase currently holds, and writes back
 * anything that staff changed directly in the Sheet.
 *
 * Called automatically by Vercel Cron every 5 minutes (vercel.json).
 * Can also be triggered manually: POST with x-sync-secret header.
 *
 * No Apps Script needed — this is the pull-based alternative.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@nacc/db/service";
import {
  getAllSheetRows,
  resolveSheetTabName,
  isSheetsConfigured,
  googleSheetsId,
} from "@nacc/storage";
import { thaiNumeralsToArabic, parseTimeRange } from "@nacc/utils";
import { authorizeSyncRequest } from "@/lib/sync-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: allow up to 60 s for large sheets

// ─── Column indices (0-based) ──────────────────────────────────────────────
// A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 I=8 J=9 K=10
const COL_DEPT       = 1;   // B สำนัก
const COL_LETTER_NO  = 2;   // C เลขหนังสือ
const COL_DATE       = 3;   // D วันที่จอด
const COL_TIME       = 4;   // E เวลาที่จอด
const COL_CARS       = 5;   // F จำนวนรถ
const COL_LOCATION   = 6;   // G อาคารที่จอด
const COL_OFFICER    = 7;   // H เจ้าหน้าที่
const COL_ID         = 10;  // K _id (Supabase UUID)

export async function GET(req: NextRequest) {
  return handlePoll(req);
}
export async function POST(req: NextRequest) {
  return handlePoll(req);
}

async function handlePoll(req: NextRequest) {
  try {
    const denied = await authorizeSyncRequest(req);
    if (denied) return denied;

    if (!isSheetsConfigured()) {
      return NextResponse.json({ error: "Google Sheets not configured" }, { status: 503 });
    }

    const supabase      = createServiceClient();
    const spreadsheetId = googleSheetsId()!;
    const sheetName     = await resolveSheetTabName(spreadsheetId);

    const sheetRows = await getAllSheetRows(spreadsheetId, sheetName);

    const stats = { checked: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const { rowNumber, values } of sheetRows) {
    const id = values[COL_ID]?.trim();
    if (!id) { stats.skipped++; continue; }  // No UUID yet → skip

    stats.checked++;

    try {
      // ── Fetch current Supabase state ─────────────────────────────────────
      const { data: r } = await supabase
        .from("parking_requests")
        .select(`
          id, official_letter_no, cars_count,
          requested_location_text, legacy_officer_name,
          department:departments(name_th),
          request_dates(request_date,start_time,end_time)
        `)
        .eq("id", id)
        .maybeSingle();

      if (!r) { stats.skipped++; continue; }

      const firstDate   = (r.request_dates as any[])[0] ?? null;
      const dbDept      = (r as any).department?.name_th ?? "";
      const dbLetterNo  = r.official_letter_no ?? "";
      const dbDate      = firstDate?.request_date ?? "";
      const dbStartTime = firstDate?.start_time?.slice(0, 5) ?? "";   // "HH:MM"
      const dbEndTime   = firstDate?.end_time?.slice(0, 5) ?? "";
      const dbCars      = String(r.cars_count ?? "1");
      const dbLocation  = (r as any).requested_location_text ?? "";
      const dbOfficer   = (r as any).legacy_officer_name ?? "";

      // ── Read Sheet values (normalize Thai numerals) ──────────────────────
      const shDept     = thaiNumeralsToArabic(values[COL_DEPT]     ?? "").trim();
      const shLetterNo = thaiNumeralsToArabic(values[COL_LETTER_NO] ?? "").trim();
      const shDate     = isoFromTh(thaiNumeralsToArabic(values[COL_DATE] ?? "").trim());
      const shTimeRaw  = thaiNumeralsToArabic(values[COL_TIME] ?? "").trim();
      const { start: shStart, end: shEnd } = parseTimeRange(shTimeRaw);
      const shStartNorm = shStart?.slice(0, 5) ?? "";
      const shEndNorm   = shEnd?.slice(0, 5) ?? "";
      const shCars     = (values[COL_CARS] ?? "").trim();
      const shLocation = (values[COL_LOCATION] ?? "").trim();
      const shOfficer  = (values[COL_OFFICER] ?? "").trim();

      // ── Detect changes ───────────────────────────────────────────────────
      const changed: Record<string, unknown> = {};
      const dateChanged   = shDate && shDate !== dbDate;
      const timeChanged   = (shStartNorm !== dbStartTime) || (shEndNorm !== dbEndTime);

      if (shLetterNo && shLetterNo !== dbLetterNo)
        changed.official_letter_no = shLetterNo;
      if (shCars && shCars !== dbCars)
        changed.cars_count = parseInt(shCars, 10) || 1;
      if (shLocation && shLocation !== dbLocation)
        changed.requested_location_text = shLocation;
      if (shOfficer && shOfficer !== dbOfficer)
        changed.legacy_officer_name = shOfficer;

      // Department: look up by name
      if (shDept && shDept !== dbDept) {
        const { data: dept } = await supabase
          .from("departments")
          .select("id")
          .ilike("name_th", shDept)
          .maybeSingle();
        if (dept?.id) changed.department_id = dept.id;
      }

      const hasDirectChanges = Object.keys(changed).length > 0;
      if (hasDirectChanges) {
        changed.updated_at = new Date().toISOString();
        await supabase.from("parking_requests").update(changed).eq("id", id);
      }

      // Date/time: update request_dates separately
      if (dateChanged || timeChanged) {
        const { data: dates } = await supabase
          .from("request_dates")
          .select("id")
          .eq("request_id", id)
          .order("request_date", { ascending: true })
          .limit(1);

        const datePatch: Record<string, string | null> = {};
        if (dateChanged && shDate)  datePatch.request_date = shDate;
        if (timeChanged) {
          datePatch.start_time = shStart ?? null;
          datePatch.end_time   = shEnd   ?? null;
        }

        if (dates?.[0]) {
          await supabase.from("request_dates").update(datePatch).eq("id", dates[0].id);
        } else if (shDate) {
          await supabase.from("request_dates").insert({
            request_id: id as any, request_date: shDate, ...datePatch,
          });
        }
      }

      if (hasDirectChanges || dateChanged || timeChanged) {
        stats.updated++;
        await supabase.from("sheet_sync_logs").insert({
          entity_type: "parking_requests",
          entity_id: id as any,
          sync_direction: "from_sheet_poll",
          status: "success",
          message: `row ${rowNumber}: updated ${[...Object.keys(changed), dateChanged ? "date" : "", timeChanged ? "time" : ""].filter(Boolean).join(", ")}`,
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      stats.errors.push(`row ${rowNumber}: ${message}`);
    }
  }

    return NextResponse.json({ ok: true, ...stats });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[sync/poll]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Converts DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD. Returns "" if unparseable. */
function isoFromTh(s: string): string {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split("/");
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}
