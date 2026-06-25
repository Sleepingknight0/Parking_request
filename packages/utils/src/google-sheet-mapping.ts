/**
 * Google Sheets ↔ Supabase field mapping.
 *
 * Supabase is the SOURCE OF TRUTH.  The Google Sheet is a live mirror that
 * officers can also edit directly (bidirectional sync).
 *
 * Column layout (A-K):
 *   A วันที่รับเรื่อง  B สำนัก      C เลขหนังสือ   D วันที่จอด   E เวลาที่จอด
 *   F จำนวนรถ           G อาคารที่จอด H เจ้าหน้าที่  I สถานะ       J เลขที่คำขอ
 *   K _id  (Supabase UUID — used for reverse sync; can be hidden by user)
 */

// ─── Legacy import mapping (read-only, consumed by scripts/import-legacy.ts) ─

/** Column headers in the original NACC Google Sheet ("ชีต1"). */
export const LEGACY_SHEET_COLUMNS = {
  receivedDate: "วันที่รับเรื่อง",
  department: "สำนัก",
  letterNo: "เลขหนังสือ",
  parkingDate: "วันที่จอด",
  parkingTime: "เวลาที่จอด",
  carsCount: "จำนวนรถ",
  parkingSpot: "อาคารที่จอด",
  receivingOfficer: "เจ้าหน้าที่ผู้รับเรื่อง",
} as const;

export type LegacySheetColumn =
  (typeof LEGACY_SHEET_COLUMNS)[keyof typeof LEGACY_SHEET_COLUMNS];

/** A single raw legacy row keyed by the Thai column headers. */
export type LegacySheetRow = Partial<Record<LegacySheetColumn, string>>;

// ─── Live sheet mapping (bidirectional) ──────────────────────────────────────

/** Column headers written to the live Google Sheet (row 1). */
export const LIVE_SHEET_HEADERS = [
  "วันที่รับเรื่อง",   // A (0)
  "สำนัก",             // B (1)
  "เลขหนังสือ",        // C (2)
  "วันที่จอด",         // D (3)
  "เวลาที่จอด",        // E (4)
  "จำนวนรถ",           // F (5)
  "อาคารที่จอด",       // G (6)
  "เจ้าหน้าที่ผู้รับเรื่อง", // H (7)
  "สถานะ",             // I (8)  — read-only from Sheets side
  "เลขที่คำขอ",        // J (9)  — read-only from Sheets side
  "_id",               // K (10) — system UUID; can be hidden
] as const;

export type LiveSheetHeader = (typeof LIVE_SHEET_HEADERS)[number];

/** 0-based column indices that are allowed to update Supabase from the sheet. */
export const EDITABLE_SHEET_COLS = new Set([1, 2, 3, 4, 5, 6, 7]); // B-H

/** Maps a 0-based sheet column index to the DB field it controls. */
export const SHEET_COL_TO_DB_FIELD: Record<number, string> = {
  1: "สำนัก",           // department lookup
  2: "official_letter_no",
  3: "วันที่จอด",       // first request_date
  4: "เวลาที่จอด",      // start_time / end_time
  5: "cars_count",
  6: "requested_location_text",
  7: "legacy_officer_name",
};

// ─── Supabase → Sheets row builder ───────────────────────────────────────────

export interface LiveSheetRequest {
  id: string;
  request_no: string;
  received_date: string | null;
  department_name: string | null;
  official_letter_no: string;
  first_date: string | null;          // DD/MM/YYYY
  time_range: string | null;          // "HH.MM-HH.MM" or ""
  cars_count: number;
  location_name: string | null;       // name_th or requested_location_text
  legacy_officer_name: string | null;
  officer_display_name: string | null; // from created_by profile
  status_label_th: string;
}

/** Formats a time string (HH:MM:SS) → "HH.MM" Thai style. */
export function formatTimeTh(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  return `${h}.${m}`;
}

/** Converts Thai numerals (๐-๙) to Arabic digits. */
export function thaiNumeralsToArabic(s: string): string {
  return s.replace(/[๐-๙]/g, (c) => String(c.charCodeAt(0) - 0x0e50));
}

/** Parses a Thai-format time string back to HH:MM:SS for the DB. */
export function parseTimeTh(s: string | null | undefined): string | null {
  if (!s) return null;
  const clean = thaiNumeralsToArabic(s).replace(/น\./g, "").trim();
  const parts = clean.split(/[.:\-]/);
  if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  return null;
}

/** Parses "HH.MM-HH.MM" → { start, end }. */
export function parseTimeRange(s: string | null | undefined): {
  start: string | null;
  end: string | null;
} {
  if (!s) return { start: null, end: null };
  const dashIdx = s.indexOf("-");
  if (dashIdx === -1) return { start: parseTimeTh(s), end: null };
  return {
    start: parseTimeTh(s.slice(0, dashIdx).trim()),
    end: parseTimeTh(s.slice(dashIdx + 1).trim()),
  };
}

/** Builds the A..K cell array to push to the Google Sheet. */
export function buildLiveSheetRow(r: LiveSheetRequest): (string | number | null)[] {
  const officerName = r.legacy_officer_name ?? r.officer_display_name ?? "";
  return [
    r.received_date ?? "",           // A
    r.department_name ?? "",         // B
    r.official_letter_no,            // C
    r.first_date ?? "",              // D
    r.time_range ?? "",              // E
    r.cars_count,                    // F
    r.location_name ?? "",           // G
    officerName,                     // H
    r.status_label_th,               // I
    r.request_no,                    // J
    r.id,                            // K
  ];
}

// ─── Sheets → Supabase change parser ─────────────────────────────────────────

export interface SheetCellChange {
  /** 1-letter column (A-K) */
  column: string;
  value: string;
}

export interface ParsedSheetChange {
  field: string;
  value: string | number | null;
  /** Extra fields produced by this change (e.g. end_time alongside start_time). */
  extra?: Record<string, string | null>;
}

/**
 * Maps a single Google Sheet cell edit to a Supabase update payload.
 * Returns null for read-only columns (A, I, J, K).
 */
export function parseSheetChange(change: SheetCellChange): ParsedSheetChange | null {
  const colIdx = change.column.toUpperCase().charCodeAt(0) - 65; // A=0
  if (!EDITABLE_SHEET_COLS.has(colIdx)) return null;

  const val = change.value.trim();

  switch (colIdx) {
    case 1: // B สำนัก — caller must look up department_id by name
      return { field: "__department_name", value: val };

    case 2: // C เลขหนังสือ
      return { field: "official_letter_no", value: val };

    case 3: // D วันที่จอด — caller must update request_dates
      return { field: "__first_date", value: val };

    case 4: { // E เวลาที่จอด
      const { start, end } = parseTimeRange(val);
      return { field: "__time_range", value: val, extra: { start_time: start, end_time: end } };
    }

    case 5: // F จำนวนรถ
      return { field: "cars_count", value: Number(val) || 1 };

    case 6: // G อาคารที่จอด
      return { field: "requested_location_text", value: val };

    case 7: // H เจ้าหน้าที่
      return { field: "legacy_officer_name", value: val };

    default:
      return null;
  }
}

// ─── Legacy mirror (kept for backward compat with old export scripts) ─────────

export interface MirrorRequest {
  request_no: string;
  received_date: string | null;
  department_name: string | null;
  official_letter_no: string;
  first_date: string | null;
  time_range: string | null;
  cars_count: number;
  location_name: string | null;
  status: string;
  assigned_to_name: string | null;
}

export const MIRROR_SHEET_HEADERS = [
  "เลขที่คำขอ",
  "วันที่รับเรื่อง",
  "สำนัก",
  "เลขหนังสือ",
  "วันที่จอด",
  "เวลาที่จอด",
  "จำนวนรถ",
  "อาคารที่จอด",
  "สถานะ",
  "ผู้รับผิดชอบ",
] as const;

export function mirrorRowValues(r: MirrorRequest): (string | number)[] {
  return [
    r.request_no,
    r.received_date ?? "",
    r.department_name ?? "",
    r.official_letter_no,
    r.first_date ?? "",
    r.time_range ?? "",
    r.cars_count,
    r.location_name ?? "",
    r.status,
    r.assigned_to_name ?? "",
  ];
}
