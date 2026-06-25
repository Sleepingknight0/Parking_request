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

export function isImageAttachment(mime: string | null | undefined): boolean {
  return mime?.startsWith("image/") ?? false;
}

export function isPdfAttachment(mime: string | null | undefined): boolean {
  return mime === "application/pdf";
}

export function canInlinePreviewAttachment(mime: string | null | undefined): boolean {
  return isImageAttachment(mime) || isPdfAttachment(mime);
}

/**
 * Supabase Storage object keys must be ASCII-safe (no Thai or spaces).
 * Original display name should still be stored in `file_name` on the DB row.
 */
export function sanitizeStorageFilename(originalName: string): string {
  const trimmed = originalName.trim() || "file";
  const dot = trimmed.lastIndexOf(".");
  const hasExt = dot > 0 && dot < trimmed.length - 1;
  const ext = hasExt ? trimmed.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  const base = hasExt ? trimmed.slice(0, dot) : trimmed;
  const safeBase =
    base
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "file";
  return `${safeBase.slice(0, 100)}${ext}`;
}
