import { NextResponse } from "next/server";
import { createServerSupabase } from "@nacc/db/server";
import { usernameToEmail } from "@nacc/db";
import { getMyProfile } from "@nacc/db/queries";
import { isAdminRole } from "@nacc/types";

function demoAdminCredentials() {
  return {
    username: process.env.ADMIN_DEMO_USERNAME ?? "admin",
    password: process.env.ADMIN_DEMO_PASSWORD ?? "admin",
  };
}

/** Silent demo sign-in for the admin app (linked from the user app role picker). */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { username, password } = demoAdminCredentials();

  const supabase = await createServerSupabase();
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=login", origin));
  }

  const profile = await getMyProfile(supabase, data.user.id);
  if (!profile?.is_active || !isAdminRole(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=role", origin));
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
