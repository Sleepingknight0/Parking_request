import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Server Supabase client (RLS-enforced, anon key + the user's session cookies).
 * Use in Server Components, Route Handlers, and Server Actions.
 * Next 15: cookies() is async.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

export type ServerClient = Awaited<ReturnType<typeof createServerSupabase>>;
