"use server";

import { createServerSupabase } from "@nacc/db/server";
import { usernameToEmail } from "@nacc/db";
import { getMyProfile } from "@nacc/db/queries";
import { loginSchema, TH, type Role } from "@nacc/types";

export interface SignInState {
  ok: boolean;
  error?: string;
  role?: Role;
}

/**
 * Shared login action for BOTH apps (useActionState signature).
 * Maps username → synthetic email, signs in, validates the profile, and
 * returns the role. The PAGE decides where to route (each app hosts different
 * roles), so this action never redirects.
 */
export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? TH.state.required };
  }

  const supabase = await createServerSupabase();
  const email = usernameToEmail(parsed.data.username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return { ok: false, error: TH.auth.invalidCredentials };
  }

  const profile = await getMyProfile(supabase, data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, error: TH.auth.invalidCredentials };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: TH.auth.inactive };
  }

  return { ok: true, role: profile.role };
}

/** Sign the current user out (cookies cleared via the server client adapter). */
export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
