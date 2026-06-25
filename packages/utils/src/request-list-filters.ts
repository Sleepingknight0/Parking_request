import type { ParkingRequestListItem } from "@nacc/types";

export type RequestListFilters = {
  date: string | null;
  departmentId: string | null;
  status: string;
};

export const EMPTY_REQUEST_FILTERS: RequestListFilters = {
  date: null,
  departmentId: null,
  status: "all",
};

export function countActiveRequestFilters(filters: RequestListFilters): number {
  let n = 0;
  if (filters.date) n += 1;
  if (filters.departmentId) n += 1;
  if (filters.status !== "all") n += 1;
  return n;
}

export function matchesRequestSearch(row: ParkingRequestListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    row.official_letter_no,
    row.request_no,
    row.subject,
    row.contact_name,
    row.department?.name_th,
    row.department?.short_name,
    row.requested_location?.name_th,
    row.requested_location_text,
    row.assigned_to_profile?.display_name,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function applyRequestListFilters(
  rows: ParkingRequestListItem[],
  query: string,
  filters: RequestListFilters,
): ParkingRequestListItem[] {
  return rows.filter((row) => {
    if (!matchesRequestSearch(row, query)) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.departmentId && row.department_id !== filters.departmentId) return false;
    if (
      filters.date &&
      !(row.request_dates ?? []).some((d) => d.request_date === filters.date)
    ) {
      return false;
    }
    return true;
  });
}

export function extractDepartmentsFromRows(
  rows: ParkingRequestListItem[],
): { id: string; name_th: string }[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.department?.id && row.department.name_th) {
      map.set(row.department.id, row.department.name_th);
    }
  }
  return [...map.entries()]
    .map(([id, name_th]) => ({ id, name_th }))
    .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"));
}

export function pickRequestDateSlot(row: ParkingRequestListItem, filterDate: string | null) {
  if (filterDate) {
    return row.request_dates.find((d) => d.request_date === filterDate) ?? null;
  }
  return row.request_dates[0] ?? null;
}
