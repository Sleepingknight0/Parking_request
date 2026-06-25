/** Centralized, validated access to Supabase env vars. */

export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return v;
}

export function supabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return v;
}

/** Server-only. Throws if called where the key is absent. */
export function supabaseServiceKey(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server only)");
  return v;
}

/** Internal synthetic-email domain for username login (default: nacc.local). */
export function authEmailDomain(): string {
  return process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "nacc.local";
}

/** "admin" → "admin@nacc.local". Accepts an existing email unchanged. */
export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase();
  if (u.includes("@")) return u;
  return `${u}@${authEmailDomain()}`;
}

/** "admin@nacc.local" → "admin" (best-effort inverse). */
export function emailToUsername(email: string): string {
  return email.split("@")[0] ?? email;
}
