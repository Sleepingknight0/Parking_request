/**
 * sheet-sync.ts — server-side helper called from server actions.
 *
 * Fire-and-forget: failures are logged but never bubble up to the user.
 * Call syncRequestToSheet(id) after any mutation that should be mirrored.
 */
import "server-only";
import { createServiceClient } from "@nacc/db/service";
import {
  appendSheetRow,
  updateSheetRow,
  ensureSheetHeader,
  deleteSheetRowByUuid,
  resolveSheetTabName,
  isSheetsConfigured,
  googleSheetsId,
} from "@nacc/storage";
import { buildLiveSheetRow, LIVE_SHEET_HEADERS } from "@nacc/utils";
import { fetchLiveSheetRequest } from "./sheet-row";

export async function syncRequestToSheet(requestId: string): Promise<void> {
  if (!isSheetsConfigured()) return;

  try {
    const supabase = createServiceClient();
    const spreadsheetId = googleSheetsId()!;
    const sheetName = await resolveSheetTabName(spreadsheetId);

    const mirror = await fetchLiveSheetRequest(supabase, requestId);
    if (!mirror) return;

    const rowValues = buildLiveSheetRow(mirror);
    await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);

    const { data: syncState } = await supabase
      .from("parking_requests")
      .select("sheet_row")
      .eq("id", requestId)
      .maybeSingle();
    const currentRow: number | null = (syncState as { sheet_row?: number | null } | null)?.sheet_row ?? null;

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

/**
 * Removes a request's row from the live Sheet and re-indexes the stored
 * `sheet_row` of every record that sat below it (those rows shift up by one
 * when the physical row is deleted).
 *
 * Fire-and-forget: failures are logged but never bubble up to the caller.
 * Safe to call with an id that was never synced (no-op if the row is absent).
 */
export async function removeRequestFromSheet(requestId: string): Promise<void> {
  if (!isSheetsConfigured()) return;

  try {
    const supabase = createServiceClient();
    const spreadsheetId = googleSheetsId()!;
    const sheetName = await resolveSheetTabName(spreadsheetId);

    const deletedRow = await deleteSheetRowByUuid(spreadsheetId, sheetName, requestId);
    if (!deletedRow) return; // nothing in the sheet to remove

    // Every record physically below the deleted row shifted up by one. Update
    // them in ASCENDING order so each new value lands in a now-vacant slot,
    // which never trips the uq_requests_sheet_row unique index.
    const { data: below } = await supabase
      .from("parking_requests")
      .select("id, sheet_row")
      .gt("sheet_row", deletedRow)
      .order("sheet_row", { ascending: true });

    for (const row of below ?? []) {
      await supabase
        .from("parking_requests")
        .update({ sheet_row: (row.sheet_row as number) - 1 })
        .eq("id", row.id);
    }

    await supabase.from("sheet_sync_logs").insert({
      entity_type: "parking_requests",
      entity_id: requestId as any,
      sync_direction: "to_sheet",
      status: "success",
      message: `Deleted sheet row ${deletedRow}; re-indexed ${below?.length ?? 0} row(s)`,
    });
  } catch (e) {
    console.error("[sheet-sync] delete failed for", requestId, e);
  }
}
