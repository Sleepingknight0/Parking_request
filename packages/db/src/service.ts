import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./env";

/**
 * SERVICE-ROLE client — BYPASSES RLS. Server-only. Never import into a client
 * component. Use ONLY for privileged admin operations that the anon role can't
 * do safely: creating auth users, resetting passwords, the legacy import.
 */
export function createServiceClient() {
  return createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ServiceClient = ReturnType<typeof createServiceClient>;
