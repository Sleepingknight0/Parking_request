"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@nacc/db/server";
import { syncRequestToSheet } from "./sheet-sync";
import { createServiceClient } from "@nacc/db/service";
import { hasSupabaseServiceKey, SUPABASE_SERVICE_KEY_ERROR_TH } from "@nacc/db";
import { requireProfile } from "@nacc/auth/guards";
import {
  requestFormSchema,
  validateForSubmit,
  STORAGE_BUCKET,
  FILE_TYPE_FOLDER,
  MAX_FILE_SIZE,
  isAllowedMimeType,
  ADMIN_APP_ROLES,
  type RequestFormInput,
  type FileType,
  type ActivityAction,
} from "@nacc/types";
import { sanitizeStorageFilename } from "@nacc/utils";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const WRITE_ROLES = ["super_admin", "admin"] as const;

async function logActivity(
  action: ActivityAction,
  entityId: string,
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createServerSupabase();
  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "parking_request",
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}

/** Create a request as draft or submitted (admin). */
export async function createRequest(
  input: RequestFormInput,
  submit: boolean,
): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const parsed = requestFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const v = parsed.data;
  if (submit) {
    const errs = validateForSubmit(v);
    if (errs.length) return { ok: false, error: errs[0] };
  }

  const supabase = await createServerSupabase();
  const { data: req, error } = await supabase
    .from("parking_requests")
    .insert({
      department_id: v.department_id ?? null,
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
      admin_note: v.admin_note ?? null,
      status: submit ? "submitted" : "draft",
    })
    .select("id")
    .single();

  if (error || !req) return { ok: false, error: error?.message ?? "บันทึกไม่สำเร็จ" };

  if (v.dates.length) {
    await supabase.from("request_dates").insert(
      v.dates.map((d) => ({
        request_id: req.id,
        request_date: d.request_date,
        start_time: d.start_time ?? null,
        end_time: d.end_time ?? null,
      })),
    );
  }
  if (v.plates.length) {
    await supabase.from("request_license_plates").insert(
      v.plates.map((p) => ({
        request_id: req.id,
        plate_no: p.plate_no,
        vehicle_note: p.vehicle_note ?? null,
      })),
    );
  }

  await logActivity("request.create", req.id, profile.id, { submit });
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(req.id);
  return { ok: true, id: req.id };
}

/** Update core fields + replace dates/plates (admin). */
export async function updateRequest(
  id: string,
  input: RequestFormInput,
): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const parsed = requestFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({
      department_id: v.department_id ?? null,
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
      admin_note: v.admin_note ?? null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.from("request_dates").delete().eq("request_id", id);
  if (v.dates.length) {
    await supabase.from("request_dates").insert(
      v.dates.map((d) => ({
        request_id: id,
        request_date: d.request_date,
        start_time: d.start_time ?? null,
        end_time: d.end_time ?? null,
      })),
    );
  }
  await supabase.from("request_license_plates").delete().eq("request_id", id);
  if (v.plates.length) {
    await supabase.from("request_license_plates").insert(
      v.plates.map((p) => ({
        request_id: id,
        plate_no: p.plate_no,
        vehicle_note: p.vehicle_note ?? null,
      })),
    );
  }

  await logActivity("request.update", id, profile.id);
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

/** Submit a draft (draft -> submitted). */
export async function submitRequest(id: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({ status: "submitted" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.submit", id, profile.id);
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

/** Move a submitted request into review (submitted -> under_review). */
export async function markUnderReview(id: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({ status: "under_review" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.status_change", id, profile.id, { to: "under_review" });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

export async function approveRequest(id: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({ status: "approved", approved_by: profile.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.status_change", id, profile.id, { to: "approved" });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

export async function rejectRequest(id: string, reason?: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({
      status: "rejected",
      rejected_by: profile.id,
      admin_note: reason?.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.status_change", id, profile.id, { to: "rejected", reason });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

export async function assignRequest(
  _id: string,
  _assignedTo: string,
): Promise<ActionResult> {
  return {
    ok: false,
    error: "การมอบหมายงานทำโดยพนักงาน รปภ. รับทราบเองในแอปผู้ใช้",
  };
}

/** Generic status move for valid transitions (for example assigned -> in_progress). */
export async function changeStatus(
  id: string,
  toStatus: "in_progress",
): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({ status: toStatus })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.status_change", id, profile.id, { to: toStatus });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

/** Complete a request. Requires at least one completion_photo attachment. */
export async function completeRequest(
  id: string,
  note?: string,
): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("request_attachments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", id)
    .eq("file_type", "completion_photo");

  if (!count || count < 1) {
    return { ok: false, error: "ต้องแนบรูปถ่ายส่งงานอย่างน้อย 1 รูปก่อนปิดงาน" };
  }

  const { error } = await supabase
    .from("parking_requests")
    .update({
      status: "completed",
      completion_note: note ?? null,
      completed_by: profile.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("request.complete", id, profile.id);
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

/** Cancel a request. Reason is required. */
export async function cancelRequest(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  if (!reason.trim()) return { ok: false, error: "กรุณาระบุเหตุผลการยกเลิก" };
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("parking_requests")
    .update({
      status: "cancelled",
      cancellation_reason: reason.trim(),
      cancelled_by: profile.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.cancel", id, profile.id, { reason });
  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  void syncRequestToSheet(id);
  return { ok: true, id };
}

/** Upload an attachment (service role storage + RLS-checked DB row). */
export async function uploadAttachment(
  requestId: string,
  fileType: FileType,
  formData: FormData,
): Promise<ActionResult> {
  if (!hasSupabaseServiceKey()) {
    return { ok: false, error: SUPABASE_SERVICE_KEY_ERROR_TH };
  }
  const { profile } = await requireProfile({ roles: ADMIN_APP_ROLES });
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "กรุณาเลือกไฟล์" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "ไฟล์มีขนาดเกิน 10 MB" };
  }
  if (!isAllowedMimeType(file.type)) {
    return { ok: false, error: "ชนิดไฟล์ไม่รองรับ (PDF, JPG, PNG, WebP, DOC, DOCX)" };
  }

  const safeName = sanitizeStorageFilename(file.name);
  const path = `${FILE_TYPE_FOLDER[fileType]}/${requestId}/${Date.now()}-${safeName}`;

  const svc = createServiceClient();
  const { error: upErr } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { ok: false, error: `อัปโหลดไม่สำเร็จ: ${upErr.message}` };

  const supabase = await createServerSupabase();
  const { error: dbErr } = await supabase.from("request_attachments").insert({
    request_id: requestId,
    uploaded_by: profile.id,
    file_type: fileType,
    file_name: file.name,
    file_path: path,
    mime_type: file.type,
    file_size: file.size,
    storage_provider: "supabase",
  });
  if (dbErr) return { ok: false, error: dbErr.message };

  await logActivity("attachment.upload", requestId, profile.id, { fileType });
  revalidatePath(`/requests/${requestId}`);
  return { ok: true, id: requestId };
}

/** Delete a request (admin). */
export async function deleteRequest(id: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: [...WRITE_ROLES] });
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("parking_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity("request.delete", id, profile.id);
  revalidatePath("/requests");
  return { ok: true };
}
