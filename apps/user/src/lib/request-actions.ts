"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@nacc/db/service";
import { receivingOfficerDbFields } from "@nacc/db/queries";
import {
  mergeSignOutputMetadata,
  requestFormSchema,
  validateForSubmit,
  STORAGE_BUCKET,
  FILE_TYPE_FOLDER,
  MAX_FILE_SIZE,
  isAllowedMimeType,
  type RequestFormInput,
  type FileType,
  type SignOutputMethod,
} from "@nacc/types";
import { sanitizeStorageFilename } from "@nacc/utils";
import { completeJobWithPhotos } from "./completion-photo-actions";
import { tryCommsAutoApproveRequest } from "./comms-operational-settings";
import { assertSupabaseStorageReady } from "./storage-guards";
import { getAppMode, requireAppMode } from "./user-guards";
import { getUserAppDb } from "./user-db";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function revalidateUserRequest(id?: string) {
  revalidatePath("/officer/dashboard");
  revalidatePath("/officer/requests");
  revalidatePath("/comms/dashboard");
  revalidatePath("/comms/requests");
  revalidatePath("/security/dashboard");
  revalidatePath("/security/jobs");
  revalidatePath("/security/history");
  if (id) {
    revalidatePath(`/officer/requests/${id}`);
    revalidatePath(`/security/jobs/${id}`);
  }
}

async function logActivity(
  action: string,
  entityId: string,
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  await getUserAppDb().from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "parking_request",
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}

export async function createOfficerRequest(
  input: RequestFormInput,
  submit: boolean,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("officer");
  const parsed = requestFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const v = parsed.data;
  if (submit) {
    const errors = validateForSubmit(v);
    if (errors.length) return { ok: false, error: errors[0] };
  }

  const db = getUserAppDb();
  const receivingOfficerFields = await receivingOfficerDbFields(db, v.receiving_officer_id);
  const { data: req, error } = await db
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
      ...receivingOfficerFields,
      requested_location_id: v.requested_location_id ?? null,
      requested_location_text: v.requested_location_text ?? null,
      date_pattern: v.date_pattern,
      cars_count: v.cars_count,
      purpose: v.purpose ?? null,
      priority: v.priority,
      status: submit ? "submitted" : "draft",
    })
    .select("id")
    .single();

  if (error || !req) return { ok: false, error: error?.message ?? "บันทึกไม่สำเร็จ" };

  if (v.dates.length) {
    const { error: dateError } = await db.from("request_dates").insert(
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
    const { error: plateError } = await db.from("request_license_plates").insert(
      v.plates.map((p) => ({
        request_id: req.id,
        plate_no: p.plate_no,
        vehicle_note: p.vehicle_note ?? null,
      })),
    );
    if (plateError) return { ok: false, error: plateError.message };
  }

  await logActivity(submit ? "request.submit" : "request.create", req.id, profile.id, {
    app: "user",
    submit,
  });
  if (submit) {
    await tryCommsAutoApproveRequest(req.id);
  }
  revalidateUserRequest(req.id);
  return { ok: true, id: req.id };
}

export async function updateOfficerRequest(
  id: string,
  input: RequestFormInput,
  submit: boolean,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("officer");
  const parsed = requestFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const v = parsed.data;
  if (submit) {
    const errors = validateForSubmit(v);
    if (errors.length) return { ok: false, error: errors[0] };
  }

  const db = getUserAppDb();
  const receivingOfficerFields = await receivingOfficerDbFields(db, v.receiving_officer_id);
  const patch: Record<string, unknown> = {
    department_id: v.department_id ?? profile.department_id ?? null,
    official_letter_no: v.official_letter_no,
    official_letter_date: v.official_letter_date ?? null,
    received_date: v.received_date ?? null,
    subject: v.subject ?? null,
    contact_name: v.contact_name ?? null,
    contact_phone: v.contact_phone ?? null,
    ...receivingOfficerFields,
    requested_location_id: v.requested_location_id ?? null,
    requested_location_text: v.requested_location_text ?? null,
    date_pattern: v.date_pattern,
    cars_count: v.cars_count,
    purpose: v.purpose ?? null,
    priority: v.priority,
  };
  if (submit) patch.status = "submitted";

  const { error } = await db
    .from("parking_requests")
    .update(patch)
    .eq("id", id)
    .is("assigned_to", null);

  if (error) return { ok: false, error: error.message };

  await db.from("request_dates").delete().eq("request_id", id);
  if (v.dates.length) {
    const { error: dateError } = await db.from("request_dates").insert(
      v.dates.map((d) => ({
        request_id: id,
        request_date: d.request_date,
        start_time: d.start_time ?? null,
        end_time: d.end_time ?? null,
      })),
    );
    if (dateError) return { ok: false, error: dateError.message };
  }

  await db.from("request_license_plates").delete().eq("request_id", id);
  if (v.plates.length) {
    const { error: plateError } = await db.from("request_license_plates").insert(
      v.plates.map((p) => ({
        request_id: id,
        plate_no: p.plate_no,
        vehicle_note: p.vehicle_note ?? null,
      })),
    );
    if (plateError) return { ok: false, error: plateError.message };
  }

  await logActivity(submit ? "request.submit" : "request.update", id, profile.id, {
    app: "user",
    submit,
  });
  revalidateUserRequest(id);
  return { ok: true, id };
}

export async function cancelOfficerRequest(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("officer");
  if (!reason.trim()) return { ok: false, error: "กรุณาระบุเหตุผลการยกเลิก" };

  const db = getUserAppDb();
  const { error } = await db
    .from("parking_requests")
    .update({
      status: "cancelled",
      cancellation_reason: reason.trim(),
      cancelled_by: profile.id,
    })
    .eq("id", id)
    .is("assigned_to", null);

  if (error) return { ok: false, error: error.message };
  await logActivity("request.cancel", id, profile.id, { app: "user", reason });
  revalidateUserRequest(id);
  return { ok: true, id };
}

export async function acceptJob(id: string, signMethod?: SignOutputMethod): Promise<ActionResult> {
  const { profile } = await requireAppMode("security");
  const db = getUserAppDb();

  let metadataPatch: Record<string, unknown> | undefined;
  if (signMethod) {
    const { data: existing, error: readError } = await db
      .from("parking_requests")
      .select("metadata")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (readError) return { ok: false, error: readError.message };
    metadataPatch = mergeSignOutputMetadata(existing?.metadata, signMethod);
  }

  const { data, error } = await db
    .from("parking_requests")
    .update({
      status: "assigned",
      assigned_to: profile.id,
      assigned_by: profile.id,
      assigned_at: new Date().toISOString(),
      ...(metadataPatch ? { metadata: metadataPatch } : {}),
    })
    .eq("id", id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "งานนี้มีผู้รับแล้วหรือสถานะเปลี่ยนไปแล้ว" };
  await logActivity("request.assign", id, profile.id, {
    app: "user",
    accepted_by_security: true,
    ...(signMethod ? { sign_output_method: signMethod } : {}),
  });
  revalidateUserRequest(id);
  return { ok: true, id };
}

/** Accept approved job, record sign output method, optionally start immediately. */
export async function acceptJobWithSignMethod(
  id: string,
  method: SignOutputMethod,
  andStart = true,
): Promise<ActionResult> {
  const accepted = await acceptJob(id, method);
  if (!accepted.ok) return accepted;
  if (!andStart) return accepted;
  return startJob(id);
}

/** Accept approved job and move straight to in_progress (one tap for security staff). */
export async function acceptJobAndStart(id: string): Promise<ActionResult> {
  const accepted = await acceptJob(id);
  if (!accepted.ok) return accepted;
  return startJob(id);
}

export async function startJob(id: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("security");
  const db = getUserAppDb();
  const { data, error } = await db
    .from("parking_requests")
    .update({ status: "in_progress" })
    .eq("id", id)
    .eq("assigned_to", profile.id)
    .eq("status", "assigned")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "เริ่มงานได้เฉพาะงานที่รับแล้วเท่านั้น" };
  await logActivity("request.status_change", id, profile.id, { app: "user", to: "in_progress" });
  revalidateUserRequest(id);
  return { ok: true, id };
}

export async function completeJob(id: string, note?: string): Promise<ActionResult> {
  return completeJobWithPhotos(id, note);
}

export async function cancelJob(id: string, reason: string): Promise<ActionResult> {
  const { profile } = await requireAppMode("security");
  if (!reason.trim()) return { ok: false, error: "กรุณาระบุเหตุผลการยกเลิก" };

  const db = getUserAppDb();
  const { data, error } = await db
    .from("parking_requests")
    .update({
      status: "cancelled",
      cancellation_reason: reason.trim(),
      cancelled_by: profile.id,
    })
    .eq("id", id)
    .eq("assigned_to", profile.id)
    .in("status", ["assigned", "in_progress"])
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "ยกเลิกได้เฉพาะงานที่คุณรับผิดชอบอยู่เท่านั้น" };
  await logActivity("request.cancel", id, profile.id, { app: "user", reason });
  revalidateUserRequest(id);
  return { ok: true, id };
}

export async function uploadUserAttachment(
  requestId: string,
  fileType: FileType,
  formData: FormData,
): Promise<ActionResult> {
  if (fileType === "completion_photo") {
    return {
      ok: false,
      error: "กรุณาใช้ปุ่มแนบรูปส่งงานสำหรับรูปถ่ายส่งงาน",
    };
  }

  const storageGate = assertSupabaseStorageReady();
  if (storageGate) return storageGate;

  const mode = await getAppMode();
  if (mode !== "officer" && mode !== "security") {
    return { ok: false, error: "ไม่มีสิทธิ์แนบไฟล์" };
  }

  const { profile } = await requireAppMode(mode);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "กรุณาเลือกไฟล์" };
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "ไฟล์มีขนาดเกิน 10 MB" };
  if (!isAllowedMimeType(file.type)) {
    return { ok: false, error: "ชนิดไฟล์ไม่รองรับ (PDF, JPG, PNG, WebP, DOC, DOCX)" };
  }

  const allowedForMode =
    mode === "officer"
      ? fileType === "official_letter" || fileType === "general_attachment"
      : fileType === "cancellation_evidence";

  if (!allowedForMode) return { ok: false, error: "บทบาทนี้ไม่มีสิทธิ์แนบไฟล์ประเภทนี้" };

  const safeName = sanitizeStorageFilename(file.name);
  const path = `${FILE_TYPE_FOLDER[fileType]}/${requestId}/${Date.now()}-${safeName}`;

  const svc = createServiceClient();
  const { error: uploadError } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };

  const { error: dbError } = await getUserAppDb().from("request_attachments").insert({
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

  await logActivity("attachment.upload", requestId, profile.id, { app: "user", fileType });
  if (fileType === "official_letter") {
    await tryCommsAutoApproveRequest(requestId);
  }
  revalidateUserRequest(requestId);
  return { ok: true, id: requestId };
}
