"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_MODE_COOKIE } from "./user-mode";

export async function switchRole(): Promise<void> {
  const jar = await cookies();
  jar.delete(USER_MODE_COOKIE);
  redirect("/");
}
