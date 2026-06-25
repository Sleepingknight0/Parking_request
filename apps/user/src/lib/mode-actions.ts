"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  USER_MODE_COOKIE,
  USER_MODE_HOME,
  type UserAppMode,
} from "./user-mode";

export async function enterAppMode(mode: UserAppMode): Promise<void> {
  const jar = await cookies();
  jar.set(USER_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
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

export async function enterSuperAdminMode(): Promise<void> {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.replace(/\/$/, "");
  if (!adminUrl) redirect("/?error=admin");
  redirect(`${adminUrl}/api/auth/demo-enter`);
}
