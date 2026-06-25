import { hasSupabaseServiceKey, SUPABASE_SERVICE_KEY_ERROR_TH } from "@nacc/db";
import type { ActionResult } from "./request-actions";

/** Guard for legacy Supabase-storage uploads (officer letters, etc.). */
export function assertSupabaseStorageReady(): ActionResult | null {
  if (!hasSupabaseServiceKey()) {
    return { ok: false, error: SUPABASE_SERVICE_KEY_ERROR_TH };
  }
  return null;
}
