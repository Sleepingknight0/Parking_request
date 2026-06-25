/** Normalize a raw legacy sheet row into typed fields the importer can use. */
import { parseLegacyDate, parseLegacyTime } from "./date";
import { LEGACY_SHEET_COLUMNS, type LegacySheetRow } from "./google-sheet-mapping";

export interface NormalizedLegacyRequest {
  received_date: string | null;
  department_name: string | null;
  official_letter_no: string | null;
  parking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  cars_count: number;
  parking_spot: string | null;
  officer_name: string | null;
  warnings: string[];
}

export function normalizeLegacyRow(
  row: LegacySheetRow,
  rowNumber: number,
): NormalizedLegacyRequest {
  const C = LEGACY_SHEET_COLUMNS;
  const warnings: string[] = [];

  const letterNo = (row[C.letterNo] ?? "").trim() || null;
  if (!letterNo) warnings.push(`แถว ${rowNumber}: ไม่มีเลขหนังสือ`);

  const receivedRaw = (row[C.receivedDate] ?? "").trim();
  const received = parseLegacyDate(receivedRaw);
  if (receivedRaw && !received)
    warnings.push(`แถว ${rowNumber}: วันที่รับเรื่องไม่ถูกต้อง "${receivedRaw}"`);

  const parkingRaw = (row[C.parkingDate] ?? "").trim();
  const parking = parseLegacyDate(parkingRaw);
  if (parkingRaw && !parking)
    warnings.push(`แถว ${rowNumber}: วันที่จอดไม่ถูกต้อง "${parkingRaw}"`);

  const { start, end } = parseLegacyTime(row[C.parkingTime]);

  const carsRaw = (row[C.carsCount] ?? "").trim();
  const carsParsed = Number(carsRaw.replace(/[^\d]/g, ""));
  const cars_count = Number.isFinite(carsParsed) && carsParsed > 0 ? carsParsed : 1;
  if (carsRaw && !(carsParsed > 0))
    warnings.push(`แถว ${rowNumber}: จำนวนรถไม่ถูกต้อง "${carsRaw}" (ใช้ค่า 1)`);

  return {
    received_date: received,
    department_name: (row[C.department] ?? "").trim() || null,
    official_letter_no: letterNo,
    parking_date: parking,
    start_time: start,
    end_time: end,
    cars_count,
    parking_spot: (row[C.parkingSpot] ?? "").trim() || null,
    officer_name: (row[C.receivingOfficer] ?? "").trim() || null,
    warnings,
  };
}

/** Stable de-duplication key (letter no + received + department + parking date). */
export function legacyDedupeKey(n: NormalizedLegacyRequest): string {
  return [
    n.official_letter_no ?? "",
    n.received_date ?? "",
    n.department_name ?? "",
    n.parking_date ?? "",
  ]
    .join("|")
    .toLowerCase();
}
