/**
 * sheet-sync.ts — server-side helper called from server actions.
 *
 * Fire-and-forget: failures are logged but never bubble up to the user.
 * Call syncRequestToSheet(id) after any mutation that should be mirrored.
 */
import "server-only";
import { createServiceClient } from "@nacc/db/service";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  appendSheetRow,
  updateSheetRow,
  ensureSheetHeader,
  isSheetsConfigured,
  googleSheetsId,
  googleSheetsTabName,
} from "@nacc/storage";
import { buildLiveSheetRow, formatTimeThDot, LIVE_SHEET_HEADERS, type LiveSheetRequest } from "@nacc/utils";

export async function syncRequestToSheet(requestId: string): Promise<void> {
  if (!isSheetsConfigured()) return;

  try {
    const supabase = createServiceClient();
    const spreadsheetId = googleSheetsId()!;
    const sheetName = googleSheetsTabName();

    const { data: r } = await supabase
      .from("parking_requests")
      .select(
        `*, department:departments(name_th), requested_location:locations(name_th),
         created_by_profile:profiles!created_by(display_name),
         request_dates(request_date,start_time,end_time)`,
      )
      .eq("id", requestId)
      .maybeSingle();

    if (!r) return;

    const firstDate = (r.request_dates as any[])[0] ?? null;
    const firstDateStr: string | null = firstDate?.request_date ?? r.received_date ?? null;
    const startStr = firstDate ? formatTimeThDot(firstDate.start_time) : "";
    const endStr = firstDate ? formatTimeThDot(firstDate.end_time) : "";
    const timeRange = startStr && endStr ? `${startStr}-${endStr}` : startStr || endStr || "";

    const mirror: LiveSheetRequest = {
      id: r.id,
      request_no: r.request_no,
      received_date: (r as any).received_date ?? null,
      department_name: (r as any).department?.name_th ?? null,
      official_letter_no: r.official_letter_no,
      first_date: firstDateStr,
      time_range: timeRange || null,
      cars_count: r.cars_count,
      location_name: (r as any).requested_location?.name_th ?? (r as any).requested_location_text ?? null,
      legacy_officer_name: (r as any).legacy_officer_name ?? null,
      officer_display_name: (r as any).created_by_profile?.display_name ?? null,
      status_label_th: STATUS_LABELS_TH[r.status as keyof typeof STATUS_LABELS_TH] ?? r.status,
    };

    const rowValues = buildLiveSheetRow(mirror);
    await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);

    const currentRow: number | null = (r as any).sheet_row ?? null;

    let sheetRow: number | null;
    if (currentRow) {
      await updateSheetRow(spreadsheetId, sheetName, currentRow, rowValues);
      sheetRow = currentRow;
    } else {
      sheetRow = await appendSheetRow(spreadsheetId, sheetName, rowValues);
    }

    if (sheetRow && !currentRow) {
      await supabase
        .from("parking_requests")
        .update({ sheet_row: sheetRow, sheet_synced_at: new Date().toISOString() })
        .eq("id", requestId);
    } else if (sheetRow) {
      await supabase
        .from("parking_requests")
        .update({ sheet_synced_at: new Date().toISOString() })
        .eq("id", requestId);
    }
  } catch (e) {
    console.error("[sheet-sync] push failed for", requestId, e);
  }
}
