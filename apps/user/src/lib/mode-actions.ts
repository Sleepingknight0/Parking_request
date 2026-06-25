"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@nacc/db/server";
import { usernameToEmail } from "@nacc/db";
import { getMyProfile } from "@nacc/db/queries";
import { signOutAction } from "@nacc/auth/actions";
import {
  USER_MODE_COOKIE,
  USER_MODE_DEMO_ACCOUNT,
  USER_MODE_HOME,
  type UserAppMode,
} from "./user-mode";

function demoPassword(): string {
  return process.env.USER_APP_DEMO_PASSWORD ?? "password";
}

async function signInDemoUser(mode: UserAppMode): Promise<void> {
  await signOutAction();

  const supabase = await createServerSupabase();
  const username = USER_MODE_DEMO_ACCOUNT[mode];
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password: demoPassword(),
  });

  if (error || !data.user) redirect("/?error=login");

  const profile = await getMyProfile(supabase, data.user.id);
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    redirect("/?error=inactive");
  }

  if (mode === "officer" && profile.role !== "officer") redirect("/?error=role");
  if (mode !== "officer" && profile.role !== "security_staff") redirect("/?error=role");

  const jar = await cookies();
  jar.set(USER_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function enterAppMode(mode: UserAppMode): Promise<void> {
  await signInDemoUser(mode);
  redirect(USER_MODE_HOME[mode]);
}

export async function enterOfficerMode(): Promise<void> {
  return enterAppMode("officer");
}

export async function enterCommsMode(): Promise<void> {
  return enterAppMode("comms");
}

export async function enterSecurityMode(): Promise<void> {
  return enterAppMode("security");
}
