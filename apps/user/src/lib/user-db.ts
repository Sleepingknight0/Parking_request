import { createServiceClient } from "@nacc/db/service";

/** User app runs without per-user Supabase Auth; mode cookie gates access. */
export function getUserAppDb() {
  return createServiceClient();
}
