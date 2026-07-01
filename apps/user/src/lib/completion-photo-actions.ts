"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@nacc/db/service";
import {
  FILE_TYPE_FOLDER,
  isCompletionPhotoMimeType,
  STORAGE_BUCKET,
  TH,
} from "@nacc/types";
import { sanitizeStorageFilename } from "@nacc/utils";
import { assertSupabaseStorageReady } from "./storage-guards";
import type { ActionResult } from "./request-actions";
import { requireAppMode } from "./user-guards";
import { getUserAppDb } from "./user-db";
import { tryCommsAutoVerifyRequest } from "./comms-operational-settings";
import { requestSheetSync } from "./sheet-sync";

function revalidateUserRequest(id?: string) {
  revalidatePath("/security/dashboard");
  revalidatePath("/security/jobs");
  revalidatePath("/security/history");
  revalidatePath("/officer/requests");
  if (id) {
    revalidatePath(`/security/jobs/${id}`);
    revalidatePath(`/officer/requests/${id}`);
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

function buildCompletionPhotoPath(
  requestId: string,
  requestNo: string,
  fileName: string,
): string {
  const safeName = sanitizeStorageFilename(fileName);
  const safeNo = requestNo.replace(/[^\w-]+/g, "_");
  return `${FILE_TYPE_FOLDER.completion_photo}/${requestId}/${safeNo}-${Date.now()}-${safeName}`;
}

async function assertSecurityCanUploadCompletion(
  requestId: string,
  profileId: string,
): Promise<{ ok: true; requestNo: string } | { ok: false; error: string }> {
  const { data: request, error } = await getUserAppDb()
    .from("parking_requests")
    .select("id, request_no, status, assigned_to")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) {
    return { ok: false, error: "ไม่พบคำขอ" };
  }
  if (request.assigned_to !== profileId) {
    return { ok: false, error: "คุณไม่มีสิทธิ์แนบรูปส่งงานสำหรับงานนี้" };
  }
  if (request.status !== "in_progress") {
    return { ok: false, error: "แนบรูปส่งงานได้เฉพาะงานที่กำลังดำเนินการ" };
  }
  return { ok: true, requestNo: request.request_no };
}

/** Upload one compressed completion photo to Supabase Storage and save metadata. */
export async function uploadCompletionPhoto(
  requestId: string,
  formData: FormData,
): Promise<ActionResult> {
  const storageGate = assertSupabaseStorageReady();
  if (storageGate) return storageGate;

  const { profile } = await requireAppMode("security");

  const gate = await assertSecurityCanUploadCompletion(requestId, profile.id);
  if (!gate.ok) return { ok: false, error: gate.error };

  const file = formData.get("file");
  const originalName = String(formData.get("originalName") ?? "");
  const originalSize = Number(formData.get("originalSize") ?? 0);
  const compressedSize = Number(formData.get("compressedSize") ?? 0);
  const width = formData.get("width") ? Number(formData.get("width")) : null;
  const height = formData.get("height") ? Number(formData.get("height")) : null;

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "กรุณาเลือกรูปภาพ" };
  }
  if (!isCompletionPhotoMimeType(file.type)) {
    return { ok: false, error: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP" };
  }

  const displayName = file.name || `${gate.requestNo}.jpg`;
  const path = buildCompletionPhotoPath(requestId, gate.requestNo, displayName);
  const buffer = Buffer.from(await file.arrayBuffer());

  const svc = createServiceClient();
  const { error: uploadError } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    return { ok: false, error: TH.action.completionUploadFailed };
  }

  const { error: dbError } = await getUserAppDb().from("request_attachments").insert({
    request_id: requestId,
    uploaded_by: profile.id,
    file_type: "completion_photo",
    file_name: displayName,
    file_path: path,
    mime_type: "image/jpeg",
    file_size: file.size,
    storage_provider: "supabase",
    metadata: {
      originalName: originalName || file.name,
      originalSize: originalSize || null,
      compressedSize: compressedSize || file.size,
      width,
      height,
      uploadedFrom: "security_completion",
    },
  });

  if (dbError) {
    await svc.storage.from(STORAGE_BUCKET).remove([path]);
    return { ok: false, error: TH.action.completionUploadFailed };
  }

  await logActivity("attachment.upload", requestId, profile.id, {
    app: "user",
    fileType: "completion_photo",
    storageProvider: "supabase",
  });
  revalidateUserRequest(requestId);
  await requestSheetSync(requestId);
  return { ok: true, id: requestId };
}

/** Complete job after validating completion photos exist (does not upload). */
export async function completeJobWithPhotos(
  id: string,
  note?: string,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("security");
  const db = getUserAppDb();

  const { data: request, error: reqError } = await db
    .from("parking_requests")
    .select("id, status, assigned_to")
    .eq("id", id)
    .maybeSingle();

  if (reqError || !request) return { ok: false, error: "ไม่พบคำขอ" };
  if (request.assigned_to !== profile.id) {
    return { ok: false, error: "คุณไม่มีสิทธิ์ปิดงานนี้" };
  }
  if (request.status !== "in_progress") {
    return { ok: false, error: "ไม่สามารถปิดงานในสถานะนี้ได้" };
  }

  const { count } = await db
    .from("request_attachments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", id)
    .eq("file_type", "completion_photo");

  if (!count || count < 1) {
    return { ok: false, error: TH.action.requireCompletionPhoto };
  }

  const { data, error } = await db
    .from("parking_requests")
    .update({
      status: "completed",
      completion_note: note?.trim() || null,
      completed_by: profile.id,
    })
    .eq("id", id)
    .eq("assigned_to", profile.id)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "ปิดงานได้เฉพาะงานที่กำลังดำเนินการเท่านั้น" };

  await logActivity("request.complete", id, profile.id, { app: "user" });
  await tryCommsAutoVerifyRequest(id);
  revalidateUserRequest(id);
  await requestSheetSync(id);
  return { ok: true, id };
}
