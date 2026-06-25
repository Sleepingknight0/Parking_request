"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@nacc/types/database";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser Supabase client (RLS-enforced, anon key). Use in client components. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}

export type BrowserClient = ReturnType<typeof createClient>;
