/**
 * Shared report data layer — used by both the on-screen Reports page and the
 * printable official-document route so the numbers can never disagree.
 *
 * Server-only (imports the SSR Supabase client indirectly via the caller).
 */
import type { AnyClient } from "@nacc/db/queries";
import { REQUEST_LIST_SELECT } from "@nacc/db/queries";
import {
  REQUEST_STATUSES,
  STATUS_LABELS_TH,
  type RequestStatus,
  type ParkingRequestListItem,
} from "@nacc/types";
import { addDaysIso, formatThaiDate, weekStartIso } from "@nacc/utils";

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export interface TrendPoint {
  label: string;
  requests: number;
  cars: number;
}

export interface ReportTrendData {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
}

function dayMonthLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function monthLabelShort(key: string): string {
  const [y, m] = key.split("-");
  return `${THAI_MONTHS_SHORT[Number(m) - 1]} ${(Number(y) + 543) % 100}`;
}

function weekRangeLabel(weekStart: string): string {
  const end = addDaysIso(weekStart, 6);
  return `${formatThaiDate(weekStart)} – ${formatThaiDate(end)}`;
}

/** Buckets requests (count + cars) by day / week / month from received_date. */
export function buildReportTrend(
  rows: Array<{ received_date: string | null; cars_count: number }>,
): ReportTrendData {
  const day = new Map<string, TrendPoint>();
  const week = new Map<string, TrendPoint>();
  const month = new Map<string, TrendPoint>();

  const bump = (map: Map<string, TrendPoint>, key: string, cars: number) => {
    const cur = map.get(key) ?? { label: key, requests: 0, cars: 0 };
    cur.requests += 1;
    cur.cars += cars;
    map.set(key, cur);
  };

  for (const r of rows) {
    if (!r.received_date) continue;
    const cars = r.cars_count ?? 0;
    bump(day, r.received_date, cars);
    bump(week, weekStartIso(r.received_date), cars);
    bump(month, r.received_date.slice(0, 7), cars);
  }

  const take = (
    map: Map<string, TrendPoint>,
    n: number,
    fmt: (key: string) => string,
  ): TrendPoint[] =>
    [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-n)
      .map(([key, v]) => ({ ...v, label: fmt(key) }));

  return {
    daily: take(day, 31, dayMonthLabel),
    weekly: take(week, 12, weekRangeLabel),
    monthly: take(month, 12, monthLabelShort),
  };
}

export interface ReportFilters {
  status?: RequestStatus;
  departmentId?: string;
  dateFrom?: string; // ISO yyyy-mm-dd (received_date >=)
  dateTo?: string; // ISO yyyy-mm-dd (received_date <=)
}

/** Reads report filters out of a Next.js searchParams object. */
export function parseReportFilters(
  sp: Record<string, string | string[] | undefined>,
): ReportFilters {
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

  const status = one(sp.status);
  return {
    status: (REQUEST_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as RequestStatus)
      : undefined,
    departmentId: one(sp.dept),
    dateFrom: one(sp.from),
    dateTo: one(sp.to),
  };
}

/** Serialises filters back into a query string (for links between pages). */
export function reportFiltersToQuery(f: ReportFilters): string {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.departmentId) p.set("dept", f.departmentId);
  if (f.dateFrom) p.set("from", f.dateFrom);
  if (f.dateTo) p.set("to", f.dateTo);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(f: ReportFilters): boolean {
  return Boolean(f.status || f.departmentId || f.dateFrom || f.dateTo);
}

/** Fetches every request matching the filters (no pagination — reports need all). */
export async function fetchReportRows(
  supabase: AnyClient,
  f: ReportFilters,
): Promise<ParkingRequestListItem[]> {
  let query = supabase
    .from("parking_requests")
    .select(REQUEST_LIST_SELECT)
    .order("received_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (f.status) query = query.eq("status", f.status);
  if (f.departmentId) query = query.eq("department_id", f.departmentId);
  if (f.dateFrom) query = query.gte("received_date", f.dateFrom);
  if (f.dateTo) query = query.lte("received_date", f.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as ParkingRequestListItem[]) ?? [];
}

export interface Breakdown {
  key: string;
  label: string;
  count: number;
  cars: number;
}

export interface StatusBreakdown extends Breakdown {
  status: RequestStatus;
}

export interface ReportSummary {
  total: number;
  totalCars: number;
  byStatus: StatusBreakdown[];
  byDept: Breakdown[];
  byLocation: Breakdown[];
  byDay: Breakdown[];
  byWeek: Breakdown[];
  byMonth: Breakdown[];
  trend: ReportTrendData;
  /** Counts for the headline KPI strip. */
  completed: number;
  cancelled: number;
  inProgress: number;
  pending: number; // submitted + under_review + approved + assigned
  /** Earliest / latest received_date actually present in the data. */
  receivedFrom: string | null;
  receivedTo: string | null;
}

function deptName(r: ParkingRequestListItem): string {
  return r.department?.name_th?.trim() || "ไม่ระบุสำนัก";
}

function locationName(r: ParkingRequestListItem): string {
  return (
    r.requested_location?.name_th?.trim() ||
    r.requested_location_text?.trim() ||
    "ไม่ระบุสถานที่"
  );
}

function monthLabel(key: string): string {
  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const [y, m] = key.split("-");
  return `${THAI_MONTHS[Number(m) - 1]} ${Number(y) + 543}`;
}

/** Aggregates a flat row list into the full report summary object. */
export function buildReportSummary(rows: ParkingRequestListItem[]): ReportSummary {
  const carsOf = (r: ParkingRequestListItem) => r.cars_count ?? 0;

  const statusMap = new Map<RequestStatus, { count: number; cars: number }>();
  const deptMap = new Map<string, { count: number; cars: number }>();
  const locMap = new Map<string, { count: number; cars: number }>();
  const dayMap = new Map<string, { count: number; cars: number }>();
  const weekMap = new Map<string, { count: number; cars: number }>();
  const monthMap = new Map<string, { count: number; cars: number }>();

  let totalCars = 0;
  let receivedFrom: string | null = null;
  let receivedTo: string | null = null;

  const bump = (
    map: Map<string, { count: number; cars: number }>,
    key: string,
    cars: number,
  ) => {
    const cur = map.get(key) ?? { count: 0, cars: 0 };
    cur.count += 1;
    cur.cars += cars;
    map.set(key, cur);
  };

  for (const r of rows) {
    const cars = carsOf(r);
    totalCars += cars;

    const s = statusMap.get(r.status) ?? { count: 0, cars: 0 };
    s.count += 1;
    s.cars += cars;
    statusMap.set(r.status, s);

    bump(deptMap, deptName(r), cars);
    bump(locMap, locationName(r), cars);

    if (r.received_date) {
      bump(dayMap, r.received_date, cars);
      bump(weekMap, weekStartIso(r.received_date), cars);
      bump(monthMap, r.received_date.slice(0, 7), cars);
      if (!receivedFrom || r.received_date < receivedFrom) receivedFrom = r.received_date;
      if (!receivedTo || r.received_date > receivedTo) receivedTo = r.received_date;
    }
  }

  const byStatus: StatusBreakdown[] = REQUEST_STATUSES.filter(
    (s) => (statusMap.get(s)?.count ?? 0) > 0,
  ).map((status) => ({
    key: status,
    status,
    label: STATUS_LABELS_TH[status],
    count: statusMap.get(status)!.count,
    cars: statusMap.get(status)!.cars,
  }));

  const sortedBreakdown = (map: Map<string, { count: number; cars: number }>): Breakdown[] =>
    [...map.entries()]
      .map(([key, v]) => ({ key, label: key, count: v.count, cars: v.cars }))
      .sort((a, b) => b.count - a.count);

  const byMonth: Breakdown[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: monthLabel(key), count: v.count, cars: v.cars }));

  const byDay: Breakdown[] = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: formatThaiDate(key), count: v.count, cars: v.cars }));

  const byWeek: Breakdown[] = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      label: weekRangeLabel(key),
      count: v.count,
      cars: v.cars,
    }));

  const statusCount = (s: RequestStatus) => statusMap.get(s)?.count ?? 0;

  return {
    total: rows.length,
    totalCars,
    byStatus,
    byDept: sortedBreakdown(deptMap),
    byLocation: sortedBreakdown(locMap),
    byDay,
    byWeek,
    byMonth,
    trend: buildReportTrend(rows),
    completed: statusCount("completed"),
    cancelled: statusCount("cancelled"),
    inProgress: statusCount("in_progress"),
    pending:
      statusCount("submitted") +
      statusCount("under_review") +
      statusCount("approved") +
      statusCount("assigned"),
    receivedFrom,
    receivedTo,
  };
}
