import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@nacc/auth/guards";
import type { Role } from "@nacc/types";
import { USER_MODE_COOKIE, isUserAppMode, type UserAppMode } from "./user-mode";

function rolesForMode(mode: UserAppMode): Role[] {
  return mode === "officer" ? ["officer"] : ["security_staff"];
}

export async function getAppMode(): Promise<UserAppMode | null> {
  const value = (await cookies()).get(USER_MODE_COOKIE)?.value;
  return value && isUserAppMode(value) ? value : null;
}

export async function requireAppMode(mode: UserAppMode) {
  const cookieMode = await getAppMode();
  if (cookieMode !== mode) redirect("/");

  return requireProfile({
    roles: rolesForMode(mode),
    loginPath: "/",
    noAccessPath: "/",
  });
}
