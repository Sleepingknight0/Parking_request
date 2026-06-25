import {
  DATE_PATTERN_LABELS_TH,
  SECURITY_STATUS_HEX,
  type DatePattern,
  type ParkingRequestListItem,
  type RequestStatus,
  type SecurityPrepUrgencyLevel,
} from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";
import type { RequestListFilters } from "./request-list-filters";

export type SecurityJobRow = ParkingRequestListItem & {
  request_license_plates?: { plate_no: string; vehicle_note: string | null }[];
};

/** @deprecated use DASHBOARD_URGENT_CALENDAR_DAYS from parking-calendar-constants */
export { DASHBOARD_URGENT_CALENDAR_DAYS as SECURITY_DASHBOARD_CALENDAR_DAYS } from "@/lib/parking-calendar-constants";

/** @deprecated use PrepUrgencyLevel */
export type ParkingUrgency = "critical" | "upcoming" | null;

export interface PrepUrgencyDisplay {
  level: SecurityPrepUrgencyLevel;
  tag: string;
  dateLabel: string;
  emoji?: string;
}

/** @deprecated use PrepUrgencyDisplay */
export interface UrgencyDisplay {
  level: ParkingUrgency;
  tag: string | null;
  dateLabel: string;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function getJobLocationTitle(job: SecurityJobRow): string {
  const location =
    job.requested_location?.name_th ?? job.requested_location_text ?? "ยังไม่ระบุสถานที่";
  return `${location} · ${job.cars_count} คัน`;
}

export type ParkingSlot = Pick<
  SecurityJobRow["request_dates"][number],
  "request_date" | "start_time" | "end_time"
>;

/** Next parking slot on or after `todayIso` — what รปภ. needs to prep. */
export function getNextParkingSlot(job: SecurityJobRow, todayIso: string): ParkingSlot | null {
  const dates = [...job.request_dates].sort((a, b) =>
    a.request_date.localeCompare(b.request_date),
  );
  if (!dates.length) return null;
  return dates.find((d) => d.request_date >= todayIso) ?? dates[dates.length - 1] ?? null;
}

/** Date + time line for printing / writing on paper. */
export function formatSlotLine(slot: ParkingSlot): string {
  const date = formatThaiDate(slot.request_date);
  const time = formatTimeRange(slot.start_time, slot.end_time);
  return time ? `${date} · ${time}` : date;
}

export function formatNextSlotLine(job: SecurityJobRow, todayIso: string): string | null {
  const slot = getNextParkingSlot(job, todayIso);
  if (!slot) return null;
  return formatSlotLine(slot);
}

export function getJobPlateNos(job: SecurityJobRow): string[] {
  return (job.request_license_plates ?? []).map((p) => p.plate_no).filter(Boolean);
}

export function formatPlateSummary(plates: string[]): string | null {
  if (!plates.length) return null;
  return plates.join(" · ");
}

export function matchesSecurityJobSearch(job: SecurityJobRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const plateHit = getJobPlateNos(job).some((p) => p.toLowerCase().includes(q));
  if (plateHit) return true;
  return [
    job.official_letter_no,
    job.request_no,
    job.subject,
    job.department?.name_th,
    job.department?.short_name,
    job.requested_location?.name_th,
    job.requested_location_text,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function applySecurityJobListFilters(
  rows: SecurityJobRow[],
  query: string,
  filters: RequestListFilters,
): SecurityJobRow[] {
  return rows.filter((row) => {
    if (!matchesSecurityJobSearch(row, query)) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.departmentId && row.department_id !== filters.departmentId) return false;
    if (filters.date && !row.request_dates.some((d) => d.request_date === filters.date)) {
      return false;
    }
    return true;
  });
}

export function getSortedRequestDates(job: SecurityJobRow): string[] {
  return [...job.request_dates]
    .map((d) => d.request_date)
    .sort((a, b) => a.localeCompare(b));
}

/** Next parking date on or after `todayIso` (YYYY-MM-DD). */
export function getNextParkingDate(job: SecurityJobRow, todayIso: string): string | null {
  const dates = getSortedRequestDates(job);
  if (!dates.length) return null;
  return dates.find((d) => d >= todayIso) ?? dates[dates.length - 1] ?? null;
}

/** Jobs starting today or tomorrow need prep (arrange parking 1 day ahead). */
export function needsParkingPrep(nextDate: string | null, todayIso: string): boolean {
  if (!nextDate) return false;
  const diff = daysBetween(todayIso, nextDate);
  return diff >= 0 && diff <= 1;
}

function isParkingNotArranged(status: RequestStatus): boolean {
  return status === "approved" || status === "assigned";
}

/** Escalating prep urgency: ปกติ → ด่วน → ด่วนมากๆ → ยังไม่ได้จัดที่จอดรถ */
export function getPrepUrgency(
  job: SecurityJobRow,
  todayIso: string,
): PrepUrgencyDisplay | null {
  if (job.status === "completed" || job.status === "cancelled") return null;

  const nextDate = getNextParkingDate(job, todayIso);
  if (!nextDate) return null;

  const diff = daysBetween(todayIso, nextDate);
  const dayNum = parseIsoDate(nextDate).getDate();

  if (diff === 0) {
    if (isParkingNotArranged(job.status)) {
      return {
        level: "overdue",
        tag: "ยังไม่ได้จัดที่จอดรถ",
        dateLabel: `วันนี้ · ${formatThaiDate(nextDate)}`,
        emoji: "⚠️",
      };
    }
    return {
      level: "critical",
      tag: "ด่วนมากๆ",
      dateLabel: `วันนี้ · ${formatThaiDate(nextDate)}`,
    };
  }

  if (diff === 1) {
    return {
      level: "critical",
      tag: "ด่วนมากๆ",
      dateLabel: `พรุ่งนี้ · ${formatThaiDate(nextDate)}`,
    };
  }

  if (diff <= 3) {
    return {
      level: "soon",
      tag: "ด่วน",
      dateLabel: `วันที่ ${dayNum} · ${formatThaiDate(nextDate)}`,
    };
  }

  return {
    level: "normal",
    tag: "ปกติ",
    dateLabel:
      diff <= 30
        ? `วันที่ ${dayNum} · ${formatThaiDate(nextDate)}`
        : formatThaiDate(nextDate),
  };
}

export function getPrepUrgencyHex(urgency: PrepUrgencyDisplay): string {
  switch (urgency.level) {
    case "normal":
      return "#0d9488";
    case "soon":
      return "#ea580c";
    case "critical":
      return "#dc2626";
    case "overdue":
      return "#b91c1c";
    default: {
      const _exhaustive: never = urgency.level;
      return _exhaustive;
    }
  }
}

export function getSecurityEventColor(
  status: RequestStatus,
  eventDate: string,
  todayIso: string,
): string {
  if (status === "completed") return SECURITY_STATUS_HEX.completed;
  if (status === "cancelled") return SECURITY_STATUS_HEX.cancelled;

  const diff = daysBetween(todayIso, eventDate);
  if (diff < 0) return "#b91c1c";
  if (diff === 0 && isParkingNotArranged(status)) return "#b91c1c";
  if (diff <= 1) return "#dc2626";
  if (diff <= 3) return "#ea580c";
  if (diff > 3) return "#0d9488";

  return SECURITY_STATUS_HEX[status as keyof typeof SECURITY_STATUS_HEX] ?? "#64748b";
}

function prepSortWeight(level: SecurityPrepUrgencyLevel): number {
  switch (level) {
    case "overdue":
      return 0;
    case "critical":
      return 1;
    case "soon":
      return 2;
    case "normal":
      return 3;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

/** @deprecated use getPrepUrgency */
export function getParkingUrgency(
  nextDate: string | null,
  todayIso: string,
): ParkingUrgency {
  if (!nextDate) return null;
  const diff = daysBetween(todayIso, nextDate);
  if (diff <= 1) return "critical";
  if (diff <= 14) return "upcoming";
  return null;
}

/** @deprecated use getPrepUrgency */
export function formatUrgencyDisplay(
  nextDate: string | null,
  todayIso: string,
): UrgencyDisplay | null {
  if (!nextDate) return null;
  const diff = daysBetween(todayIso, nextDate);

  if (diff === 0) {
    return {
      level: "critical",
      tag: "ด่วนมากๆ",
      dateLabel: `วันนี้ · ${formatThaiDate(nextDate)}`,
    };
  }
  if (diff === 1) {
    return {
      level: "critical",
      tag: "ด่วนมากๆ",
      dateLabel: `พรุ่งนี้ · ${formatThaiDate(nextDate)}`,
    };
  }
  if (diff > 1 && diff <= 30) {
    const dayNum = parseIsoDate(nextDate).getDate();
    return {
      level: "upcoming",
      tag: null,
      dateLabel: `วันที่ ${dayNum} · ${formatThaiDate(nextDate)}`,
    };
  }
  return {
    level: "upcoming",
    tag: null,
    dateLabel: formatThaiDate(nextDate),
  };
}

export function formatDatePattern(pattern: DatePattern): string {
  return DATE_PATTERN_LABELS_TH[pattern];
}

export function formatJobScheduleLine(job: SecurityJobRow): string {
  const dates = [...job.request_dates].sort((a, b) =>
    a.request_date.localeCompare(b.request_date),
  );
  if (!dates.length) return "ยังไม่ระบุวันที่";
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const time = formatTimeRange(first.start_time, first.end_time);
  if (dates.length === 1) {
    return `${formatThaiDate(first.request_date)}${time ? ` ${time}` : ""}`;
  }
  return `${formatThaiDate(first.request_date)} – ${formatThaiDate(last.request_date)} (${dates.length} วัน)${time ? ` · ${time}` : ""}`;
}

export function comparePrepPriority(
  a: SecurityJobRow,
  b: SecurityJobRow,
  todayIso: string,
): number {
  const ua = getPrepUrgency(a, todayIso);
  const ub = getPrepUrgency(b, todayIso);
  const wa = ua ? prepSortWeight(ua.level) : 99;
  const wb = ub ? prepSortWeight(ub.level) : 99;
  if (wa !== wb) return wa - wb;

  const da = getNextParkingDate(a, todayIso);
  const db = getNextParkingDate(b, todayIso);
  if (da && db) return da.localeCompare(db);
  if (da) return -1;
  if (db) return 1;
  return 0;
}

export function isActionableSecurityJob(status: string): boolean {
  return status === "approved" || status === "assigned" || status === "in_progress";
}
