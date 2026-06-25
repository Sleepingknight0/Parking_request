import type { Attachment } from "@nacc/types";

export function attachmentImageApiUrl(attachmentId: string): string {
  return `/api/attachments/${attachmentId}/image`;
}

/** Resolve a viewable URL for an attachment row (API proxy or signed Supabase path). */
export function resolveAttachmentViewUrl(
  attachment: Attachment,
  signedSupabaseUrls: Record<string, string>,
): string | null {
  if (
    attachment.storage_provider === "google_drive" &&
    (attachment.external_file_id || attachment.file_path)
  ) {
    return attachmentImageApiUrl(attachment.id);
  }
  return signedSupabaseUrls[attachment.file_path] ?? null;
}

export function isGoogleDriveAttachment(attachment: Attachment): boolean {
  return (
    attachment.storage_provider === "google_drive" &&
    Boolean(attachment.external_file_id || attachment.file_path)
  );
}
