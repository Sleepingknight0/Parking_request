import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "@nacc/types";
import { getUserAppDb } from "./user-db";
import {
  USER_MODE_COOKIE,
  USER_MODE_DEMO_ACCOUNT,
  USER_MODE_LABELS_TH,
  isUserAppMode,
  type UserAppMode,
} from "./user-mode";

export async function getAppMode(): Promise<UserAppMode | null> {
  const value = (await cookies()).get(USER_MODE_COOKIE)?.value;
  return value && isUserAppMode(value) ? value : null;
}

/** Shared seed profile used as the actor for audit fields in open (no-login) mode. */
export async function getSharedActorProfile(mode: UserAppMode): Promise<Profile> {
  const username = USER_MODE_DEMO_ACCOUNT[mode];
  const { data, error } = await getUserAppDb()
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    redirect("/?error=setup");
  }

  return data as Profile;
}

export async function requireAppMode(mode: UserAppMode) {
  const cookieMode = await getAppMode();
  if (cookieMode !== mode) redirect("/");

  const profile = await getSharedActorProfile(mode);
  return {
    mode,
    profile,
    displayName: USER_MODE_LABELS_TH[mode],
  };
}

export async function requireAnyAppMode() {
  const mode = await getAppMode();
  if (!mode) redirect("/");
  const profile = await getSharedActorProfile(mode);
  return {
    mode,
    profile,
    displayName: USER_MODE_LABELS_TH[mode],
  };
}
