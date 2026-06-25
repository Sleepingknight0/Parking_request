"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOutAction } from "@nacc/auth/actions";
import { USER_MODE_COOKIE } from "./user-mode";

export async function switchRole(): Promise<void> {
  await signOutAction();
  const jar = await cookies();
  jar.delete(USER_MODE_COOKIE);
  redirect("/");
}
