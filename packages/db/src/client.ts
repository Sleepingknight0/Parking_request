"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser Supabase client (RLS-enforced, anon key). Use in client components. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

export type BrowserClient = ReturnType<typeof createClient>;
