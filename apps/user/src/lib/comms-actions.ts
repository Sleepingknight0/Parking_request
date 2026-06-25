"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@nacc/db/service";
import {
  FILE_TYPE_FOLDER,
  isAllowedMimeType,
  MAX_FILE_SIZE,
  STORAGE_BUCKET,
  type FileType,
} from "@nacc/types";
import { requireAppMode } from "./user-guards";
import { assertSupabaseStorageReady } from "./storage-guards";
import type { ActionResult } from "./request-actions";

const COMMS_FILE_TYPES: FileType[] = ["official_letter", "general_attachment"];

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

  const safeName = file.name.replace(/[^\w.\-\u0E00-\u0E7F]+/g, "_");
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

  revalidatePath("/comms/requests");
  revalidatePath(`/comms/requests/${requestId}`);
  revalidatePath("/comms/dashboard");
  return { ok: true, id: requestId };
}
