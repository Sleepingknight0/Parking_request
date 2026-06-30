import { createServiceClient } from "@nacc/db/service";
import { FEATURE_FLAGS } from "@nacc/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSharedActorProfile } from "./user-guards";
import type { UserAppMode } from "./user-mode";

export type CommsOperationalSettings = {
  auto_approve_incoming: boolean;
  auto_verify_security_work: boolean;
  updated_at?: string | null;
};

const DEFAULT_SETTINGS: CommsOperationalSettings = {
  auto_approve_incoming: false,
  auto_verify_security_work: false,
  updated_at: null,
};

type Svc = SupabaseClient;

function db() {
  return createServiceClient();
}

export async function getCommsOperationalSettings(): Promise<CommsOperationalSettings> {
  const { data, error } = await db()
    .from("comms_operational_settings")
    .select("auto_approve_incoming, auto_verify_security_work, updated_at")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    auto_approve_incoming: Boolean(data.auto_approve_incoming),
    auto_verify_security_work: Boolean(data.auto_verify_security_work),
    updated_at: data.updated_at ?? null,
  };
}

export async function updateCommsOperationalSettings(
  patch: Partial<CommsOperationalSettings>,
  updatedBy: string,
): Promise<CommsOperationalSettings> {
  const svc = db();
  const { data, error } = await svc
    .from("comms_operational_settings")
    .upsert({
      id: true,
      ...patch,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .select("auto_approve_incoming, auto_verify_security_work, updated_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "บันทึกการตั้งค่าไม่สำเร็จ");

  return {
    auto_approve_incoming: Boolean(data.auto_approve_incoming),
    auto_verify_security_work: Boolean(data.auto_verify_security_work),
    updated_at: data.updated_at ?? null,
  };
}

async function hasOfficialLetter(svc: Svc, requestId: string): Promise<boolean> {
  const { count } = await svc
    .from("request_attachments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("file_type", "official_letter");
  return (count ?? 0) > 0;
}

async function autoApproveRequest(svc: Svc, requestId: string, actorId: string): Promise<boolean> {
  const { data: current } = await svc
    .from("parking_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  if (!current || !["submitted", "under_review"].includes(current.status)) return false;
  if (FEATURE_FLAGS.officialLetterRequired && !(await hasOfficialLetter(svc, requestId))) return false;

  const { error } = await svc
    .from("parking_requests")
    .update({ status: "approved", approved_by: actorId })
    .eq("id", requestId)
    .in("status", ["submitted", "under_review"]);

  if (error) return false;

  await svc.from("activity_logs").insert({
    actor_id: actorId,
    action: "request.status_change",
    entity_type: "parking_request",
    entity_id: requestId,
    metadata: { app: "user", mode: "comms", to: "approved", auto: true },
  });
  return true;
}

async function autoVerifyRequest(svc: Svc, requestId: string, actorId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data } = await svc
    .from("parking_requests")
    .update({
      comms_verified_by: actorId,
      comms_verified_at: now,
    })
    .eq("id", requestId)
    .eq("status", "completed")
    .is("comms_verified_at", null)
    .select("id")
    .maybeSingle();

  if (!data) return false;

  await svc.from("activity_logs").insert({
    actor_id: actorId,
    action: "request.comms_verify",
    entity_type: "parking_request",
    entity_id: requestId,
    metadata: { app: "user", mode: "comms", auto: true },
  });
  return true;
}

/** Approve all pending requests when auto-approve is on. */
export async function runCommsAutoApprovals(actorId: string): Promise<number> {
  const settings = await getCommsOperationalSettings();
  if (!settings.auto_approve_incoming) return 0;

  const svc = db();
  const { data: pending } = await svc
    .from("parking_requests")
    .select("id")
    .in("status", ["submitted", "under_review"]);

  let count = 0;
  for (const row of pending ?? []) {
    if (await autoApproveRequest(svc, row.id, actorId)) count += 1;
  }
  return count;
}

/** Verify all completed-unverified requests when auto-verify is on. */
export async function runCommsAutoVerifications(actorId: string): Promise<number> {
  const settings = await getCommsOperationalSettings();
  if (!settings.auto_verify_security_work) return 0;

  const svc = db();
  const { data: rows } = await svc
    .from("parking_requests")
    .select("id")
    .eq("status", "completed")
    .is("comms_verified_at", null);

  let count = 0;
  for (const row of rows ?? []) {
    if (await autoVerifyRequest(svc, row.id, actorId)) count += 1;
  }
  return count;
}

export async function runCommsAutoPipeline(mode: UserAppMode = "comms"): Promise<void> {
  const profile = await getSharedActorProfile(mode);
  await runCommsAutoApprovals(profile.id);
  await runCommsAutoVerifications(profile.id);
}

export async function tryCommsAutoApproveRequest(requestId: string): Promise<void> {
  const settings = await getCommsOperationalSettings();
  if (!settings.auto_approve_incoming) return;
  const profile = await getSharedActorProfile("comms");
  await autoApproveRequest(db(), requestId, profile.id);
}

export async function tryCommsAutoVerifyRequest(requestId: string): Promise<void> {
  const settings = await getCommsOperationalSettings();
  if (!settings.auto_verify_security_work) return;
  const profile = await getSharedActorProfile("comms");
  await autoVerifyRequest(db(), requestId, profile.id);
}
