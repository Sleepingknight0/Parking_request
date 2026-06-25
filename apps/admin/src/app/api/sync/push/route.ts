/**
 * POST /api/sync/push
 *
 * Called by a Supabase Database Webhook (or internally after mutations) whenever
 * a parking_request is inserted or updated.  Pushes one row to the live Google
 * Sheet and writes the row number back to parking_requests.sheet_row.
 *
 * Authorization: header  x-sync-secret: <SYNC_WEBHOOK_SECRET>
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@nacc/db/service";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  appendSheetRow,
  updateSheetRow,
  ensureSheetHeader,
  isSheetsConfigured,
  googleSheetsId,
  googleSheetsTabName,
  syncWebhookSecret,
} from "@nacc/storage";
import {
  buildLiveSheetRow,
  formatTimeTh,
  LIVE_SHEET_HEADERS,
  type LiveSheetRequest,
} from "@nacc/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = syncWebhookSecret();
  if (secret) {
    const provided =
      req.headers.get("x-sync-secret") ??
      req.headers.get("x-supabase-webhook-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets not configured (GOOGLE_SHEETS_ID missing)" },
      { status: 503 },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  // Supabase webhook sends { type, table, record, old_record, schema }
  // Direct internal calls send { request_id }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const requestId: string | undefined =
    (body.record as Record<string, string> | undefined)?.id ??
    (body.request_id as string | undefined);

  if (!requestId) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const spreadsheetId = googleSheetsId()!;
  const sheetName = googleSheetsTabName();

  // ── Fetch full request with joins ─────────────────────────────────────────
  const { data: req_, error: fetchErr } = await supabase
    .from("parking_requests")
    .select(
      `*, department:departments(name_th), requested_location:locations(name_th),
       created_by_profile:profiles!created_by(display_name),
       request_dates(request_date,start_time,end_time)`,
    )
    .eq("id", requestId)
    .maybeSingle();

  if (fetchErr || !req_) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Request not found" },
      { status: 404 },
    );
  }

  const r = req_ as any;

  // ── Build the first date + time_range ────────────────────────────────────
  const firstDate = (r.request_dates as any[])[0] ?? null;
  const firstDateStr: string | null = firstDate?.request_date ?? r.received_date ?? null;
  const startStr = firstDate ? formatTimeTh(firstDate.start_time) : "";
  const endStr = firstDate ? formatTimeTh(firstDate.end_time) : "";
  const timeRange = startStr && endStr ? `${startStr}-${endStr}` : startStr || endStr || "";

  const locationName: string | null =
    r.requested_location?.name_th ?? r.requested_location_text ?? null;

  const mirror: LiveSheetRequest = {
    id: r.id,
    request_no: r.request_no,
    received_date: r.received_date,
    department_name: r.department?.name_th ?? null,
    official_letter_no: r.official_letter_no,
    first_date: firstDateStr,
    time_range: timeRange || null,
    cars_count: r.cars_count,
    location_name: locationName,
    legacy_officer_name: r.legacy_officer_name ?? null,
    officer_display_name: r.created_by_profile?.display_name ?? null,
    status_label_th: STATUS_LABELS_TH[r.status as keyof typeof STATUS_LABELS_TH] ?? r.status,
  };

  const rowValues = buildLiveSheetRow(mirror);

  // ── Ensure header row is correct ──────────────────────────────────────────
  await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);

  // ── Append or update ──────────────────────────────────────────────────────
  let sheetRow: number | null = (r.sheet_row as number | null) ?? null;

  if (sheetRow) {
    await updateSheetRow(spreadsheetId, sheetName, sheetRow, rowValues);
  } else {
    sheetRow = await appendSheetRow(spreadsheetId, sheetName, rowValues);
  }

  // ── Write sheet_row back to Supabase ──────────────────────────────────────
  if (sheetRow) {
    const { error: updateErr } = await supabase
      .from("parking_requests")
      .update({ sheet_row: sheetRow, sheet_synced_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateErr) {
      console.error("[sync/push] failed to write sheet_row back:", updateErr.message);
    }

    // Log to sheet_sync_logs
    await supabase.from("sheet_sync_logs").insert({
      entity_type: "parking_requests",
      entity_id: requestId as any,
      sync_direction: "to_sheet",
      status: "success",
      message: `Pushed to row ${sheetRow}`,
      payload: { row: sheetRow },
    });
  }

  return NextResponse.json({ ok: true, sheet_row: sheetRow });
}
