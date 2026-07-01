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
import {
  appendSheetRow,
  updateSheetRow,
  ensureSheetHeader,
  resolveSheetTabName,
  isSheetsConfigured,
  googleSheetsId,
  syncWebhookSecret,
} from "@nacc/storage";
import {
  buildLiveSheetRow,
  LIVE_SHEET_HEADERS,
} from "@nacc/utils";
import { removeRequestFromSheet } from "@/lib/sheet-sync";
import { fetchLiveSheetRequest } from "@/lib/sheet-row";

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

  // Supabase DELETE webhook → remove the row from the Sheet and re-index the
  // records below it.  The deleted row is gone from the DB, so `record` is null
  // and the id lives in `old_record`.
  if (body.type === "DELETE") {
    const oldId = (body.old_record as Record<string, string> | undefined)?.id;
    if (!oldId) {
      return NextResponse.json({ error: "Missing old record id" }, { status: 400 });
    }
    await removeRequestFromSheet(oldId);
    return NextResponse.json({ ok: true, deleted: oldId });
  }

  const requestId: string | undefined =
    (body.record as Record<string, string> | undefined)?.id ??
    (body.request_id as string | undefined);

  if (!requestId) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const spreadsheetId = googleSheetsId()!;
  const sheetName = await resolveSheetTabName(spreadsheetId);

  // ── Fetch full request mirror with joins ──────────────────────────────────
  const mirror = await fetchLiveSheetRequest(supabase, requestId);
  if (!mirror) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 },
    );
  }

  const rowValues = buildLiveSheetRow(mirror);

  // ── Ensure header row is correct ──────────────────────────────────────────
  await ensureSheetHeader(spreadsheetId, sheetName, [...LIVE_SHEET_HEADERS]);

  // ── Append or update ──────────────────────────────────────────────────────
  const { data: syncState } = await supabase
    .from("parking_requests")
    .select("sheet_row")
    .eq("id", requestId)
    .maybeSingle();
  let sheetRow: number | null = (syncState as { sheet_row?: number | null } | null)?.sheet_row ?? null;

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
