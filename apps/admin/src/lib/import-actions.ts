"use server";

/**
 * Admin UI legacy CSV importer — mirrors scripts/import-legacy.ts but runs from a
 * server action so non-technical staff can import without the command line.
 *
 * Dry-run by default (apply = false); writes only when apply = true.
 * Privileged (uses the service-role client) and guarded to admin roles.
 */
import { requireProfile } from "@nacc/auth/guards";
import { createServiceClient } from "@nacc/db/service";
import {
  normalizeLegacyRow,
  legacyDedupeKey,
  type LegacySheetRow,
} from "@nacc/utils";

const LEGACY_SOURCE = "google-sheet-ui";

export interface ImportPreviewRow {
  row: number;
  letterNo: string;
  dept: string;
  parkingDate: string;
  cars: number;
  status: string;
  deptMatched: boolean;
  freeLocation: boolean;
}

export interface ImportSummary {
  ok: boolean;
  error?: string;
  applied: boolean;
  total: number;
  inserted: number; // inserted (apply) or would-insert (dry-run)
  skippedDuplicate: number;
  skippedInvalid: number;
  unmatchedDept: number;
  unmatchedLocation: number;
  warnings: string[];
  preview: ImportPreviewRow[];
}

/** Minimal RFC4180-ish CSV parser (handles quotes, embedded commas/newlines, BOM). */
function parseCsv(text: string): Record<string, string>[] {
  const s = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n") {
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    rows.push(record);
  }
  if (!rows.length) return [];

  const headers = rows[0]!.map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function importLegacyCsv(
  csvText: string,
  apply: boolean,
): Promise<ImportSummary> {
  const empty: ImportSummary = {
    ok: false,
    applied: apply,
    total: 0,
    inserted: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    unmatchedDept: 0,
    unmatchedLocation: 0,
    warnings: [],
    preview: [],
  };

  // Guard: admin only.
  await requireProfile({
    roles: ["super_admin", "admin"],
    loginPath: "/login",
    noAccessPath: "/no-access",
  });

  let records: LegacySheetRow[];
  try {
    records = parseCsv(csvText) as LegacySheetRow[];
  } catch (e) {
    return { ...empty, error: `อ่านไฟล์ CSV ไม่สำเร็จ: ${(e as Error).message}` };
  }
  if (!records.length) {
    return { ...empty, error: "ไม่พบข้อมูลในไฟล์ (ต้องมีแถวหัวตารางและข้อมูลอย่างน้อย 1 แถว)" };
  }

  const supabase = createServiceClient();
  const [{ data: depts }, { data: locs }, { data: existing }] = await Promise.all([
    supabase.from("departments").select("id,name_th"),
    supabase.from("locations").select("id,name_th"),
    supabase.from("parking_requests").select("official_letter_no"),
  ]);

  const deptByName = new Map((depts ?? []).map((d) => [d.name_th.trim(), d.id]));
  const locByName = new Map((locs ?? []).map((l) => [l.name_th.trim(), l.id]));
  const existingLetters = new Set((existing ?? []).map((r) => r.official_letter_no));
  const seenKeys = new Set<string>();

  const summary: ImportSummary = { ...empty, ok: true, total: records.length };
  const today = todayISO();

  for (let i = 0; i < records.length; i++) {
    const rowNo = i + 2; // account for header row
    const n = normalizeLegacyRow(records[i]!, rowNo);
    summary.warnings.push(...n.warnings);

    if (!n.official_letter_no) {
      summary.skippedInvalid++;
      continue;
    }

    const key = legacyDedupeKey(n);
    if (seenKeys.has(key) || existingLetters.has(n.official_letter_no)) {
      summary.skippedDuplicate++;
      continue;
    }
    seenKeys.add(key);

    // resolve department (exact then loose contains)
    let departmentId: string | null = null;
    if (n.department_name) {
      departmentId = deptByName.get(n.department_name.trim()) ?? null;
      if (!departmentId) {
        for (const [name, id] of deptByName) {
          if (name.includes(n.department_name) || n.department_name.includes(name)) {
            departmentId = id;
            break;
          }
        }
      }
      if (!departmentId) summary.unmatchedDept++;
    }

    // resolve location (else free text)
    let locationId: string | null = null;
    let locationText: string | null = null;
    if (n.parking_spot) {
      locationId = locByName.get(n.parking_spot.trim()) ?? null;
      if (!locationId) {
        locationText = n.parking_spot;
        summary.unmatchedLocation++;
      }
    }

    const status = n.parking_date && n.parking_date < today ? "completed" : "submitted";

    if (summary.preview.length < 50) {
      summary.preview.push({
        row: rowNo,
        letterNo: n.official_letter_no,
        dept: n.department_name ?? "-",
        parkingDate: n.parking_date ?? "-",
        cars: n.cars_count,
        status,
        deptMatched: Boolean(departmentId) || !n.department_name,
        freeLocation: Boolean(locationText),
      });
    }

    if (!apply) {
      summary.inserted++;
      continue;
    }

    const { data: req, error } = await supabase
      .from("parking_requests")
      .insert({
        department_id: departmentId,
        official_letter_no: n.official_letter_no,
        received_date: n.received_date,
        requested_location_id: locationId,
        requested_location_text: locationText,
        cars_count: n.cars_count,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        legacy_source: LEGACY_SOURCE,
        legacy_row_number: rowNo,
        legacy_imported_at: new Date().toISOString(),
        legacy_officer_name: n.officer_name,
        metadata: { imported: true, original: records[i] },
      })
      .select("id")
      .single();

    if (error || !req) {
      summary.skippedInvalid++;
      summary.warnings.push(`แถว ${rowNo}: บันทึกไม่สำเร็จ — ${error?.message ?? "ไม่ทราบสาเหตุ"}`);
      continue;
    }

    if (n.parking_date) {
      await supabase.from("request_dates").insert({
        request_id: req.id,
        request_date: n.parking_date,
        start_time: n.start_time,
        end_time: n.end_time,
      });
    }
    summary.inserted++;
  }

  // Cap warnings to keep the payload small.
  if (summary.warnings.length > 50) {
    const extra = summary.warnings.length - 50;
    summary.warnings = summary.warnings.slice(0, 50);
    summary.warnings.push(`… และอีก ${extra} คำเตือน`);
  }

  return summary;
}
