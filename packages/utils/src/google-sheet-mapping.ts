/**
 * Google Sheets ↔ Supabase field mapping.
 *
 * Supabase is the SOURCE OF TRUTH. The sheet is only a mirror/report view.
 * This mapping is consumed by:
 *   - the legacy importer (scripts/import-legacy.ts), sheet → DB
 *   - a future Edge Function that mirrors DB → sheet
 * See docs/GOOGLE_SHEETS_SYNC_PLAN.md.
 */

/** Column headers used by the original NACC Google Sheet ("ชีต1"). */
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

/**
 * Forward mapping (DB → mirror sheet) for the future report export.
 * Each entry: sheet column header → how to read it from a joined request.
 */
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
