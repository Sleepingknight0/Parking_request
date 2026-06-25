/**
 * Thai date/time helpers. Storage is always ISO (yyyy-mm-dd) / HH:MM.
 * Display defaults to the Buddhist Era (พ.ศ.) per the documented decision;
 * pass { era: "ce" } to show the Gregorian year instead.
 */
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.locale("th");

export type Era = "be" | "ce";

type DateInput = string | number | Date | dayjs.Dayjs | null | undefined;

/** "25/06/2569" (BE) or "25/06/2026" (CE). */
export function formatThaiDate(value: DateInput, era: Era = "be"): string {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format(era === "be" ? "DD/MM/BBBB" : "DD/MM/YYYY");
}

/** "25 มิถุนายน 2569". */
export function formatThaiDateLong(value: DateInput, era: Era = "be"): string {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format(era === "be" ? "D MMMM BBBB" : "D MMMM YYYY");
}

/** "25/06/2569 14:30". */
export function formatThaiDateTime(value: DateInput, era: Era = "be"): string {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format(era === "be" ? "DD/MM/BBBB HH:mm" : "DD/MM/YYYY HH:mm");
}

/** "08:30 - 12:00", "08:30 น." or "-" depending on which times exist. */
export function formatTimeRange(
  start?: string | null,
  end?: string | null,
): string {
  const s = normalizeTime(start);
  const e = normalizeTime(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return `${s} น.`;
  if (e) return `ถึง ${e} น.`;
  return "-";
}

function normalizeTime(t?: string | null): string | null {
  if (!t) return null;
  // accept "08:30:00" → "08:30"
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return null;
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

/** Convert any parseable date to ISO yyyy-mm-dd (for DB). */
export function toISODate(value: DateInput): string | null {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

/** Today as ISO yyyy-mm-dd. */
export function todayISO(): string {
  return dayjs().format("YYYY-MM-DD");
}

/** Days in [start, end] inclusive as ISO strings (for date-range patterns). */
export function expandDateRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = dayjs(startISO);
  const end = dayjs(endISO);
  if (!cur.isValid() || !end.isValid() || cur.isAfter(end)) return out;
  while (!cur.isAfter(end)) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return out;
}

/**
 * Parse a legacy date string from the Google Sheet ("%d/%m/%Y", Gregorian, but
 * tolerate Buddhist-era years) into ISO yyyy-mm-dd, or null if unparseable.
 */
export function parseLegacyDate(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // dd/mm/yyyy or dd-mm-yyyy
  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(s);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    if (year > 2400) year -= 543; // BE → CE
    const d = dayjs(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      "YYYY-MM-DD",
      true,
    );
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // fallback: let dayjs try, then BE-correct
  const d = dayjs(s);
  if (!d.isValid()) return null;
  const y = d.year();
  return y > 2400 ? d.subtract(543, "year").format("YYYY-MM-DD") : d.format("YYYY-MM-DD");
}

/**
 * Parse a legacy time string ("08.30 น.", "08:30", "08.30-12.00") into
 * { start, end } in HH:MM. Either field may be null.
 */
export function parseLegacyTime(raw?: string | null): {
  start: string | null;
  end: string | null;
} {
  if (!raw) return { start: null, end: null };
  const cleaned = raw.replace(/น\./g, " ").replace(/\./g, ":");
  const times = [...cleaned.matchAll(/(\d{1,2}):(\d{2})/g)].map(
    (mm) => `${mm[1]!.padStart(2, "0")}:${mm[2]}`,
  );
  return { start: times[0] ?? null, end: times[1] ?? null };
}
