import "server-only";
import { createServiceClient } from "@nacc/db/service";
import { hasSupabaseServiceKey } from "@nacc/db";
import { STORAGE_BUCKET } from "@nacc/types";
import type { Attachment } from "@nacc/types";

export async function getSignedUrls(
  attachments: Attachment[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  const supabasePaths = attachments
    .filter((a) => a.storage_provider !== "google_drive")
    .map((a) => a.file_path)
    .filter(Boolean);

  if (supabasePaths.length === 0 || !hasSupabaseServiceKey()) return {};

  const svc = createServiceClient();
  const { data } = await svc.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(supabasePaths, expiresIn);
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
