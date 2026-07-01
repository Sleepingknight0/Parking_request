import { createServiceClient } from "@nacc/db/service";
import {
  DATE_PATTERN_LABELS_TH,
  PRIORITY_LABELS_TH,
  STATUS_LABELS_TH,
  type DatePattern,
  type Priority,
  type RequestStatus,
} from "@nacc/types";
import { formatTimeThDot, type LiveSheetRequest } from "@nacc/utils";

type ServiceClient = ReturnType<typeof createServiceClient>;

const SHEET_REQUEST_SELECT = `
  *,
  department:departments(name_th),
  requested_location:locations(name_th),
  receiving_officer:security_officers(name_th),
  created_by_profile:profiles!created_by(display_name),
  assigned_to_profile:profiles!assigned_to(display_name),
  approved_by_profile:profiles!approved_by(display_name),
  cancelled_by_profile:profiles!cancelled_by(display_name),
  completed_by_profile:profiles!completed_by(display_name),
  comms_verified_by_profile:profiles!comms_verified_by(display_name),
  request_dates(request_date,start_time,end_time),
  request_license_plates(plate_no,vehicle_note),
  request_attachments(file_type)
`;

function displayName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const name = (value as { display_name?: unknown }).display_name;
  return typeof name === "string" && name.trim() ? name : null;
}

function relationName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const name = (value as { name_th?: unknown }).name_th;
  return typeof name === "string" && name.trim() ? name : null;
}

function sortDates(
  dates: Array<{ request_date?: string | null; start_time?: string | null; end_time?: string | null }>,
) {
  return [...dates].sort((a, b) => String(a.request_date ?? "").localeCompare(String(b.request_date ?? "")));
}

function compactJoin(values: Array<string | null | undefined>, separator = ", "): string | null {
  const cleaned = values.map((value) => value?.trim()).filter(Boolean) as string[];
  return cleaned.length ? cleaned.join(separator) : null;
}

export async function fetchLiveSheetRequest(
  supabase: ServiceClient,
  requestId: string,
): Promise<LiveSheetRequest | null> {
  const { data: row } = await supabase
    .from("parking_requests")
    .select(SHEET_REQUEST_SELECT)
    .eq("id", requestId)
    .maybeSingle();

  if (!row) return null;

  const r = row as Record<string, any>;
  const dates = sortDates((r.request_dates ?? []) as Array<{
    request_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  }>);
  const firstDate = dates[0] ?? null;
  const startStr = firstDate ? formatTimeThDot(firstDate.start_time) : "";
  const endStr = firstDate ? formatTimeThDot(firstDate.end_time) : "";
  const timeRange = startStr && endStr ? `${startStr}-${endStr}` : startStr || endStr || "";

  const plates = (r.request_license_plates ?? []) as Array<{
    plate_no?: string | null;
    vehicle_note?: string | null;
  }>;
  const attachments = (r.request_attachments ?? []) as Array<{ file_type?: string | null }>;
  const locationChoice = relationName(r.requested_location);

  return {
    id: r.id,
    request_no: r.request_no,
    received_date: r.received_date ?? null,
    department_name: relationName(r.department),
    official_letter_no: r.official_letter_no,
    first_date: firstDate?.request_date ?? r.received_date ?? null,
    time_range: timeRange || null,
    cars_count: r.cars_count,
    location_name: locationChoice ?? r.requested_location_text ?? null,
    legacy_officer_name: relationName(r.receiving_officer) ?? r.legacy_officer_name ?? null,
    officer_display_name: displayName(r.created_by_profile),
    status_label_th: STATUS_LABELS_TH[r.status as RequestStatus] ?? r.status,
    official_letter_date: r.official_letter_date ?? null,
    subject: r.subject ?? null,
    date_pattern_label_th: DATE_PATTERN_LABELS_TH[r.date_pattern as DatePattern] ?? r.date_pattern ?? null,
    all_dates: compactJoin(dates.map((date) => date.request_date), "\n"),
    start_time: compactJoin(dates.map((date) => formatTimeThDot(date.start_time)), "\n"),
    end_time: compactJoin(dates.map((date) => formatTimeThDot(date.end_time)), "\n"),
    license_plates: compactJoin(plates.map((plate) => plate.plate_no), "\n"),
    vehicle_notes: compactJoin(plates.map((plate) => plate.vehicle_note), "\n"),
    location_choice_name: locationChoice,
    requested_location_text: r.requested_location_text ?? null,
    purpose: r.purpose ?? null,
    priority_label_th: PRIORITY_LABELS_TH[r.priority as Priority] ?? r.priority ?? null,
    created_by_display_name: displayName(r.created_by_profile),
    assigned_to_display_name: displayName(r.assigned_to_profile),
    assigned_at: r.assigned_at ?? null,
    approved_by_display_name: displayName(r.approved_by_profile),
    approved_at: r.approved_at ?? null,
    cancelled_by_display_name: displayName(r.cancelled_by_profile),
    cancelled_at: r.cancelled_at ?? null,
    cancellation_reason: r.cancellation_reason ?? null,
    completed_by_display_name: displayName(r.completed_by_profile),
    completed_at: r.completed_at ?? null,
    completion_note: r.completion_note ?? null,
    comms_verified_by_display_name: displayName(r.comms_verified_by_profile),
    comms_verified_at: r.comms_verified_at ?? null,
    attachment_count: attachments.length,
    completion_photo_count: attachments.filter((attachment) => attachment.file_type === "completion_photo").length,
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}
