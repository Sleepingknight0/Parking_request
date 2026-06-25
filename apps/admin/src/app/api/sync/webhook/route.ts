/**
 * POST /api/sync/webhook
 *
 * Receives Google Apps Script `onEdit` events and applies the change to Supabase.
 * Only editable columns (B-H) are acted on; read-only columns (A, I, J, K) are
 * silently ignored so the GAS script can safely send all changes.
 *
 * Body: { id: string, row: number, column: string, value: string }
 * Authorization: header  x-sync-secret: <SYNC_WEBHOOK_SECRET>
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@nacc/db/service";
import { syncWebhookSecret } from "@nacc/storage";
import { parseSheetChange } from "@nacc/utils";

export const dynamic = "force-dynamic";

interface WebhookBody {
  id: string;       // Supabase UUID from column K
  row: number;
  column: string;   // "A", "B", … "K"
  value: string;
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = syncWebhookSecret();
  if (secret) {
    if (req.headers.get("x-sync-secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json().catch(() => null)) as WebhookBody | null;
  if (!body?.id || !body.column) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = parseSheetChange({ column: body.column, value: body.value ?? "" });
  if (!parsed) {
    // Read-only column or unknown — ignore silently
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createServiceClient();

  // ── Handle special fields that need extra DB work ──────────────────────────
  if (parsed.field === "__department_name") {
    // Look up department by Thai name
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .ilike("name_th", body.value.trim())
      .maybeSingle();

    if (dept?.id) {
      await supabase
        .from("parking_requests")
        .update({ department_id: dept.id, updated_at: new Date().toISOString() })
        .eq("id", body.id);
    }

    await logSync(supabase, body.id, "from_sheet", `department → ${body.value}`);
    return NextResponse.json({ ok: true });
  }

  if (parsed.field === "__first_date") {
    // Update the first request_date row
    const { data: dates } = await supabase
      .from("request_dates")
      .select("id")
      .eq("request_id", body.id)
      .order("request_date", { ascending: true })
      .limit(1);

    if (dates?.[0]) {
      await supabase
        .from("request_dates")
        .update({ request_date: thDateToIso(body.value) })
        .eq("id", dates[0].id);
    } else {
      // No date row yet — insert one
      await supabase.from("request_dates").insert({
        request_id: body.id as any,
        request_date: thDateToIso(body.value),
      });
    }

    await logSync(supabase, body.id, "from_sheet", `request_date → ${body.value}`);
    return NextResponse.json({ ok: true });
  }

  if (parsed.field === "__time_range" && parsed.extra) {
    // Update start_time / end_time on the first date row
    const { data: dates } = await supabase
      .from("request_dates")
      .select("id")
      .eq("request_id", body.id)
      .order("request_date", { ascending: true })
      .limit(1);

    if (dates?.[0]) {
      const patch: Record<string, string | null> = {};
      if (parsed.extra.start_time !== undefined) patch.start_time = parsed.extra.start_time;
      if (parsed.extra.end_time !== undefined) patch.end_time = parsed.extra.end_time;
      await supabase.from("request_dates").update(patch).eq("id", dates[0].id);
    }

    await logSync(supabase, body.id, "from_sheet", `time_range → ${body.value}`);
    return NextResponse.json({ ok: true });
  }

  // ── Generic direct field update ────────────────────────────────────────────
  const patch: Record<string, string | number | null> = {
    [parsed.field]: parsed.value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("parking_requests")
    .update(patch)
    .eq("id", body.id);

  if (error) {
    await logSync(supabase, body.id, "from_sheet", `ERROR: ${error.message}`, "error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logSync(supabase, body.id, "from_sheet", `${parsed.field} → ${parsed.value}`);
  return NextResponse.json({ ok: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts DD/MM/YYYY (Thai style) or YYYY-MM-DD → ISO date string. */
function thDateToIso(s: string): string {
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed; // already ISO
  const parts = trimmed.split("/");
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return trimmed;
}

async function logSync(
  supabase: ReturnType<typeof createServiceClient>,
  entityId: string,
  direction: string,
  message: string,
  status: "success" | "error" = "success",
) {
  await supabase.from("sheet_sync_logs").insert({
    entity_type: "parking_requests",
    entity_id: entityId as any,
    sync_direction: direction,
    status,
    message,
  });
}
