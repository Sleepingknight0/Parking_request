import "server-only";
import { createServiceClient } from "@nacc/db/service";
import { STORAGE_BUCKET } from "@nacc/types";

export async function getSignedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const svc = createServiceClient();
  const { data } = await svc.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(paths, expiresIn);
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
