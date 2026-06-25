"use server";

import { redirect } from "next/navigation";
import { signOutAction } from "@nacc/auth/actions";

export async function logout(): Promise<void> {
  await signOutAction();
  redirect("/login");
}
