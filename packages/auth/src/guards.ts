import { redirect } from "next/navigation";
import { createServerSupabase } from "@nacc/db/server";
import { getMyProfile } from "@nacc/db/queries";
import type { Profile, Role } from "@nacc/types";

export interface AuthSession {
  userId: string;
  email: string | undefined;
  profile: Profile;
}

/** Returns the current session+profile, or null if not signed in / no profile. */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await getMyProfile(supabase, user.id);
  if (!profile) return null;
  return { userId: user.id, email: user.email, profile };
}

export interface RequireOptions {
  /** Roles allowed past this guard. Omit to allow any signed-in active user. */
  roles?: Role[];
  loginPath?: string;
  noAccessPath?: string;
}

/**
 * Server guard for layouts/pages. Redirects to login when unauthenticated,
 * to the login page with ?error=inactive when deactivated, and to the
 * no-access page when the role is not permitted. Returns the session otherwise.
 */
export async function requireProfile(
  opts: RequireOptions = {},
): Promise<AuthSession> {
  const loginPath = opts.loginPath ?? "/login";
  const session = await getSession();
  if (!session) redirect(loginPath);
  if (!session.profile.is_active) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    redirect(`${loginPath}?error=inactive`);
  }
  if (opts.roles && !opts.roles.includes(session.profile.role)) {
    redirect(opts.noAccessPath ?? "/no-access");
  }
  return session;
}
