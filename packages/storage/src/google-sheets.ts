/**
 * Google Sheets API client — reuses the same service-account credentials as
 * google-drive.ts.  The caller must share the target spreadsheet with the
 * service-account email before any write succeeds.
 */
import "server-only";
import { google } from "googleapis";
import { googleDriveClientEmail, googleDrivePrivateKey, googleSheetsGid, googleSheetsTabName } from "./env";

// ─── Sheet layout (must match LIVE_SHEET_* in @nacc/utils) ───────────────────
// A  วันที่รับเรื่อง  B สำนัก  C เลขหนังสือ  D วันที่จอด  E เวลาที่จอด
// F  จำนวนรถ          G อาคาร  H เจ้าหน้าที่ I สถานะ     J เลขที่คำขอ  K _id

export const SHEET_COLS = 11;       // A..K
export const SHEET_HEADER_ROW = 1;  // row 1 = headers; data starts at row 2

export type SheetRowValues = (string | number | null)[];

// ─── Color helpers ────────────────────────────────────────────────────────────
function rgb(r: number, g: number, b: number) {
  return { red: r / 255, green: g / 255, blue: b / 255 };
}

function sheetsClient() {
  const auth = new google.auth.JWT({
    email: googleDriveClientEmail(),
    key: googleDrivePrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/** A1 notation with quoted sheet title (required for Thai / special names). */
export function sheetA1Range(sheetName: string, cellRange: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  if (/^[A-Za-z0-9_]+$/.test(sheetName)) {
    return `${sheetName}!${cellRange}`;
  }
  return `'${escaped}'!${cellRange}`;
}

const tabNameCache = new Map<string, string>();

/**
 * Resolves the live tab title from the spreadsheet.
 * Uses GOOGLE_SHEETS_GID first (avoids UTF-8 env corruption on Vercel).
 */
export async function resolveSheetTabName(spreadsheetId: string): Promise<string> {
  const cached = tabNameCache.get(spreadsheetId);
  if (cached) return cached;

  const sheets = sheetsClient();
  const info = await sheets.spreadsheets.get({ spreadsheetId });
  const all = info.data.sheets ?? [];

  const gid = Number(googleSheetsGid());
  if (!Number.isNaN(gid)) {
    const byGid = all.find((s) => s.properties?.sheetId === gid);
    if (byGid?.properties?.title) {
      tabNameCache.set(spreadsheetId, byGid.properties.title);
      return byGid.properties.title;
    }
  }

  const configured = googleSheetsTabName();
  if (!configured.includes("?")) {
    const byName = all.find((s) => s.properties?.title === configured);
    if (byName?.properties?.title) {
      tabNameCache.set(spreadsheetId, byName.properties.title);
      return byName.properties.title;
    }
  }

  const first = all[0]?.properties?.title;
  if (first) {
    tabNameCache.set(spreadsheetId, first);
    return first;
  }

  throw new Error(
    `ไม่พบแท็บใน Google Sheet (GID=${googleSheetsGid()}, ชื่อที่ตั้งไว้=${configured})`,
  );
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Reads a specific row (1-based). Returns raw string array from the sheet. */
export async function getSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
): Promise<string[]> {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetA1Range(sheetName, `A${rowNumber}:K${rowNumber}`),
  });
  return (res.data.values?.[0] as string[] | undefined) ?? [];
}

/**
 * Reads all data rows from the sheet (skips row 1 header).
 * Returns array of { rowNumber, values }.
 */
export async function getAllSheetRows(
  spreadsheetId: string,
  sheetName: string,
): Promise<Array<{ rowNumber: number; values: string[] }>> {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetA1Range(sheetName, "A2:K"),
  });
  const raw = (res.data.values ?? []) as string[][];
  return raw.map((values, i) => ({ rowNumber: i + 2, values }));
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Returns the 1-based row number where the new data was appended. */
export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: string,
  values: SheetRowValues,
): Promise<number | null> {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetA1Range(sheetName, "A:K"),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
  const updatedRange = res.data.updates?.updatedRange;
  if (!updatedRange) return null;
  const m = updatedRange.match(/:?[A-Z]+(\d+)$/);
  return m && m[1] ? parseInt(m[1], 10) : null;
}

/** Overwrites a specific row (1-based) in columns A..K. */
export async function updateSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  values: SheetRowValues,
): Promise<void> {
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetA1Range(sheetName, `A${rowNumber}:K${rowNumber}`),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/** Writes the canonical header row to row 1 if it is empty or different. */
export async function ensureSheetHeader(
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
): Promise<void> {
  const sheets = sheetsClient();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetA1Range(sheetName, "A1:K1"),
  });
  const current = (existing.data.values?.[0] as string[] | undefined) ?? [];
  const upToDate = headers.every((h, i) => current[i] === h);
  if (upToDate) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetA1Range(sheetName, "A1:K1"),
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Applies the full sheet design:
 * - Frozen header row with NACC navy background + white bold text
 * - Column widths optimised for Thai content
 * - Status column (I) conditional color-coding per STATUS_LABELS_TH values
 * - System columns (J, K) in darker header
 * - Clean borders on all data rows
 *
 * Safe to call multiple times (idempotent formatting — old conditional rules
 * are cleared first).
 */
export async function initSheetFormat(
  spreadsheetId: string,
  sheetName: string,
): Promise<void> {
  const sheets = sheetsClient();

  // Get sheet ID (needed for batchUpdate range objects)
  const info = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetMeta = info.data.sheets?.find(
    (s) => s.properties?.title === sheetName,
  );
  const sheetId = sheetMeta?.properties?.sheetId ?? 0;

  // Clear existing conditional format rules to avoid duplicates on re-run
  const existingRules =
    sheetMeta?.conditionalFormats?.length ?? 0;
  const clearRules = Array.from({ length: existingRules }, (_, i) => ({
    deleteConditionalFormatRule: { sheetId, index: 0 },
  }));
  if (clearRules.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: clearRules },
    });
  }

  // Column widths (pixels) — A through K
  const colWidths = [110, 280, 130, 110, 130, 75, 195, 175, 135, 145, 50];

  // Status label → background color (matches STATUS_HEX in @nacc/types)
  const statusColors: Array<{ label: string; bg: ReturnType<typeof rgb> }> = [
    { label: "แบบร่าง",           bg: rgb(209, 213, 219) }, // gray
    { label: "บันทึกหนังสือแล้ว", bg: rgb(191, 219, 254) }, // blue-200
    { label: "กำลังตรวจสอบ",      bg: rgb(253, 230, 138) }, // amber-200
    { label: "อนุมัติแล้ว",       bg: rgb(187, 247, 208) }, // green-200
    { label: "มอบหมายงานแล้ว",    bg: rgb(221, 214, 254) }, // purple-200
    { label: "กำลังดำเนินการ",    bg: rgb(254, 215, 170) }, // orange-200
    { label: "เสร็จสมบูรณ์",      bg: rgb(167, 243, 208) }, // emerald-200
    { label: "ยกเลิก",            bg: rgb(203, 213, 225) }, // slate-300
    { label: "ไม่อนุมัติ",        bg: rgb(254, 202, 202) }, // red-200
  ];

  const NAVY   = rgb(30,  58,  95);   // header bg  #1e3a5f
  const SYSTEM = rgb(55,  65,  81);   // J/K header #374151
  const WHITE  = { red: 1, green: 1, blue: 1 };
  const BORDER_LIGHT = { style: "SOLID" as const, color: rgb(229, 231, 235) };
  const BORDER_MED   = { style: "SOLID_MEDIUM" as const, color: rgb(156, 163, 175) };

  const requests: object[] = [
    // ── Freeze header row ──────────────────────────────────────────────────
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },

    // ── Header row (A1:H1) — navy ──────────────────────────────────────────
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: {
          userEnteredFormat: {
            backgroundColor: NAVY,
            textFormat: { foregroundColor: WHITE, bold: true, fontSize: 10 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            borders: {
              right: { style: "SOLID" as const, color: rgb(71, 101, 140) },
              bottom: BORDER_MED,
            },
          },
        },
        fields: "userEnteredFormat",
      },
    },

    // ── Header — Status column (I1) — teal accent ─────────────────────────
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 8, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            backgroundColor: rgb(17, 94, 89),  // teal-800
            textFormat: { foregroundColor: WHITE, bold: true, fontSize: 10 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
          },
        },
        fields: "userEnteredFormat",
      },
    },

    // ── Header — System columns (J1:K1) — dark gray ───────────────────────
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 9, endColumnIndex: 11 },
        cell: {
          userEnteredFormat: {
            backgroundColor: SYSTEM,
            textFormat: { foregroundColor: WHITE, bold: true, fontSize: 9 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat",
      },
    },

    // ── Data rows A2:K — base style ───────────────────────────────────────
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2000, startColumnIndex: 0, endColumnIndex: 11 },
        cell: {
          userEnteredFormat: {
            textFormat: { fontSize: 10 },
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            borders: { bottom: BORDER_LIGHT, right: BORDER_LIGHT },
          },
        },
        fields: "userEnteredFormat(textFormat,verticalAlignment,wrapStrategy,borders)",
      },
    },

    // ── Data: center-align numeric/date columns ────────────────────────────
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2000, startColumnIndex: 0, endColumnIndex: 1 }, // A date
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2000, startColumnIndex: 3, endColumnIndex: 6 }, // D,E,F
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2000, startColumnIndex: 8, endColumnIndex: 11 }, // I,J,K
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    },

    // ── Header row height (40px) ───────────────────────────────────────────
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 42 },
        fields: "pixelSize",
      },
    },

    // ── Data row height (30px) ────────────────────────────────────────────
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2000 },
        properties: { pixelSize: 30 },
        fields: "pixelSize",
      },
    },

    // ── Column widths ─────────────────────────────────────────────────────
    ...colWidths.map((px, i) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: px },
        fields: "pixelSize",
      },
    })),

    // ── Conditional formatting: status column (I = index 8) ───────────────
    ...statusColors.map(({ label, bg }, idx) => ({
      addConditionalFormatRule: {
        rule: {
          ranges: [{
            sheetId,
            startRowIndex: 1, endRowIndex: 2000,
            startColumnIndex: 8, endColumnIndex: 9,
          }],
          booleanRule: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: label }] },
            format: {
              backgroundColor: bg,
              textFormat: { bold: true },
            },
          },
        },
        index: idx,
      },
    })),
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
}
