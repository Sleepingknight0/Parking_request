"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@nacc/db/service";
import {
  FILE_TYPE_FOLDER,
  FEATURE_FLAGS,
  TH,
  isAllowedMimeType,
  MAX_FILE_SIZE,
  STORAGE_BUCKET,
  requestFormSchema,
  validateForSubmit,
  type FileType,
  type RequestFormInput,
} from "@nacc/types";
import { sanitizeStorageFilename } from "@nacc/utils";
import { requireAppMode } from "./user-guards";
import { assertSupabaseStorageReady } from "./storage-guards";
import type { ActionResult } from "./request-actions";
import {
  getCommsOperationalSettings,
  runCommsAutoApprovals,
  runCommsAutoVerifications,
  tryCommsAutoApproveRequest,
  updateCommsOperationalSettings,
  type CommsOperationalSettings,
} from "./comms-operational-settings";

const COMMS_FILE_TYPES: FileType[] = ["official_letter", "general_attachment"];

function revalidateCommsPaths(id?: string) {
  revalidatePath("/comms/dashboard");
  revalidatePath("/comms/requests");
  revalidatePath("/comms/requests/new");
  revalidatePath("/security/dashboard");
  revalidatePath("/security/jobs");
  revalidatePath("/security/history");
  if (id) {
    revalidatePath(`/comms/requests/${id}`);
    revalidatePath(`/security/jobs/${id}`);
  }
}

async function logCommsActivity(
  action: string,
  entityId: string,
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  const svc = createServiceClient();
  await svc.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "parking_request",
    entity_id: entityId,
    metadata: { app: "user", mode: "comms", ...metadata },
  });
}

async function hasOfficialLetter(requestId: string): Promise<boolean> {
  const svc = createServiceClient();
  const { count, error } = await svc
    .from("request_attachments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("file_type", "official_letter");
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function commsMarkUnderReview(id: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  const svc = createServiceClient();
  const { data: current, error: readError } = await svc
    .from("parking_requests")
    .select("status")
    .eq("id", id)
    .single();
  if (readError || !current) return { ok: false, error: readError?.message ?? "ไม่พบคำขอ" };
  if (current.status !== "submitted") {
    return { ok: false, error: "รับเข้าตรวจสอบได้เฉพาะคำขอที่ส่งแล้ว" };
  }

  const { error } = await svc.from("parking_requests").update({ status: "under_review" }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCommsActivity("request.status_change", id, profile.id, { to: "under_review" });
  revalidateCommsPaths(id);
  return { ok: true, id };
}

export async function commsApproveRequest(id: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  const svc = createServiceClient();
  const { data: current, error: readError } = await svc
    .from("parking_requests")
    .select("status")
    .eq("id", id)
    .single();
  if (readError || !current) return { ok: false, error: readError?.message ?? "ไม่พบคำขอ" };
  if (current.status !== "under_review" && current.status !== "submitted") {
    return { ok: false, error: "อนุมัติได้เฉพาะคำขอที่รอพิจารณา" };
  }

  const hasLetter = FEATURE_FLAGS.officialLetterRequired ? await hasOfficialLetter(id) : true;
  if (!hasLetter) return { ok: false, error: TH.comms.needOfficialLetter };

  const { error } = await svc
    .from("parking_requests")
    .update({ status: "approved", approved_by: profile.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCommsActivity("request.status_change", id, profile.id, { to: "approved" });
  revalidateCommsPaths(id);
  return { ok: true, id };
}

export async function commsRejectRequest(id: string, reason?: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  const svc = createServiceClient();
  const { data: current, error: readError } = await svc
    .from("parking_requests")
    .select("status")
    .eq("id", id)
    .single();
  if (readError || !current) return { ok: false, error: readError?.message ?? "ไม่พบคำขอ" };
  if (current.status !== "under_review" && current.status !== "submitted") {
    return { ok: false, error: "ไม่อนุมัติได้เฉพาะคำขอที่รอพิจารณา" };
  }

  const { error } = await svc
    .from("parking_requests")
    .update({
      status: "rejected",
      rejected_by: profile.id,
      admin_note: reason?.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCommsActivity("request.status_change", id, profile.id, { to: "rejected", reason });
  revalidateCommsPaths(id);
  return { ok: true, id };
}

export async function commsVerifyCompletion(id: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  const svc = createServiceClient();
  const { data: current, error: readError } = await svc
    .from("parking_requests")
    .select("status, comms_verified_at")
    .eq("id", id)
    .single();
  if (readError || !current) return { ok: false, error: readError?.message ?? "ไม่พบคำขอ" };
  if (current.status !== "completed") {
    return { ok: false, error: "ยืนยันได้เฉพาะงานที่ รปภ. ส่งงานแล้ว" };
  }
  if (current.comms_verified_at) {
    return { ok: false, error: "งานนี้ยืนยันแล้ว" };
  }

  const { error } = await svc
    .from("parking_requests")
    .update({
      comms_verified_by: profile.id,
      comms_verified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCommsActivity("request.comms_verify", id, profile.id);
  revalidateCommsPaths(id);
  return { ok: true, id };
}

/** Comms records a letter directly — submit skips approval and goes to รปภ. */
export async function createCommsRequest(
  input: RequestFormInput,
  submit: boolean,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  const parsed = requestFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const v = parsed.data;
  if (submit) {
    const errors = validateForSubmit(v);
    if (errors.length) return { ok: false, error: errors[0] };
  }

  const now = new Date().toISOString();
  const svc = createServiceClient();
  const { data: req, error } = await svc
    .from("parking_requests")
    .insert({
      department_id: v.department_id ?? profile.department_id ?? null,
      created_by: profile.id,
      official_letter_no: v.official_letter_no,
      official_letter_date: v.official_letter_date ?? null,
      received_date: v.received_date ?? null,
      subject: v.subject ?? null,
      contact_name: v.contact_name ?? null,
      contact_phone: v.contact_phone ?? null,
      requested_location_id: v.requested_location_id ?? null,
      requested_location_text: v.requested_location_text ?? null,
      date_pattern: v.date_pattern,
      cars_count: v.cars_count,
      purpose: v.purpose ?? null,
      priority: v.priority,
      status: submit ? "approved" : "draft",
      ...(submit
        ? {
            approved_by: profile.id,
            approved_at: now,
          }
        : {}),
      metadata: { created_via: "comms" },
    })
    .select("id")
    .single();

  if (error || !req) return { ok: false, error: error?.message ?? "บันทึกไม่สำเร็จ" };

  if (v.dates.length) {
    const { error: dateError } = await svc.from("request_dates").insert(
      v.dates.map((d) => ({
        request_id: req.id,
        request_date: d.request_date,
        start_time: d.start_time ?? null,
        end_time: d.end_time ?? null,
      })),
    );
    if (dateError) return { ok: false, error: dateError.message };
  }

  if (v.plates.length) {
    const { error: plateError } = await svc.from("request_license_plates").insert(
      v.plates.map((p) => ({
        request_id: req.id,
        plate_no: p.plate_no,
        vehicle_note: p.vehicle_note ?? null,
      })),
    );
    if (plateError) return { ok: false, error: plateError.message };
  }

  await logCommsActivity(submit ? "request.comms_create_approved" : "request.comms_create_draft", req.id, profile.id, {
    submit,
  });
  revalidateCommsPaths(req.id);
  return { ok: true, id: req.id };
}

export async function uploadCommsAttachment(
  requestId: string,
  fileType: FileType,
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  if (!COMMS_FILE_TYPES.includes(fileType)) {
    return { ok: false, error: "พนักงานสื่อสารแนบได้เฉพาะหนังสือราชการและไฟล์ทั่วไป" };
  }

  const storageGate = assertSupabaseStorageReady();
  if (storageGate) return storageGate;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "กรุณาเลือกไฟล์" };
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "ไฟล์มีขนาดเกิน 10 MB" };
  if (!isAllowedMimeType(file.type)) {
    return { ok: false, error: "ชนิดไฟล์ไม่รองรับ (PDF, JPG, PNG, WebP, DOC, DOCX)" };
  }

  const safeName = sanitizeStorageFilename(file.name);
  const path = `${FILE_TYPE_FOLDER[fileType]}/${requestId}/${Date.now()}-${safeName}`;

  const svc = createServiceClient();
  const { error: uploadError } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };

  const { error: dbError } = await svc.from("request_attachments").insert({
    request_id: requestId,
    uploaded_by: profile.id,
    file_type: fileType,
    file_name: file.name,
    file_path: path,
    mime_type: file.type,
    file_size: file.size,
    storage_provider: "supabase",
  });
  if (dbError) return { ok: false, error: dbError.message };

  revalidateCommsPaths(requestId);
  if (fileType === "official_letter") {
    await tryCommsAutoApproveRequest(requestId);
    revalidateCommsPaths(requestId);
  }
  return { ok: true, id: requestId };
}

export async function toggleCommsAutoApprove(enabled: boolean): Promise<
  ActionResult & { settings?: CommsOperationalSettings }
> {
  const { profile } = await requireAppMode("comms");
  try {
    const settings = await updateCommsOperationalSettings(
      { auto_approve_incoming: enabled },
      profile.id,
    );
    if (enabled) await runCommsAutoApprovals(profile.id);
    revalidateCommsPaths();
    return { ok: true, settings };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function toggleCommsAutoVerify(enabled: boolean): Promise<
  ActionResult & { settings?: CommsOperationalSettings }
> {
  const { profile } = await requireAppMode("comms");
  try {
    const settings = await updateCommsOperationalSettings(
      { auto_verify_security_work: enabled },
      profile.id,
    );
    if (enabled) await runCommsAutoVerifications(profile.id);
    revalidateCommsPaths();
    return { ok: true, settings };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function fetchCommsOperationalSettings(): Promise<CommsOperationalSettings> {
  await requireAppMode("comms");
  return getCommsOperationalSettings();
}
