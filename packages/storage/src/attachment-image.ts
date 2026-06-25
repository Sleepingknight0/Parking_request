import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment } from "@nacc/types";
import { STORAGE_BUCKET } from "@nacc/types";
import { streamGoogleDriveFile } from "./google-drive";

export async function loadAttachmentForImage(
  supabase: SupabaseClient,
  attachmentId: string,
): Promise<Attachment | null> {
  const { data, error } = await supabase
    .from("request_attachments")
    .select("*")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Attachment;
}

export async function streamAttachmentImage(
  attachment: Attachment,
  getSupabaseStorageStream: (path: string) => Promise<{ stream: NodeJS.ReadableStream; mimeType: string }>,
): Promise<{ stream: NodeJS.ReadableStream; mimeType: string }> {
  if (attachment.storage_provider === "google_drive" && attachment.external_file_id) {
    return streamGoogleDriveFile(attachment.external_file_id);
  }
  return getSupabaseStorageStream(attachment.file_path);
}

export async function downloadFromSupabaseBucket(
  serviceClient: SupabaseClient,
  path: string,
): Promise<{ stream: NodeJS.ReadableStream; mimeType: string }> {
  const { data, error } = await serviceClient.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "ไม่พบไฟล์ในระบบจัดเก็บ");
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  const { Readable } = await import("node:stream");
  return {
    stream: Readable.from(buffer),
    mimeType: data.type || "application/octet-stream",
  };
}
