import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_MODE_COOKIE } from "@/lib/user-mode";

export async function POST() {
  const jar = await cookies();
  jar.delete(USER_MODE_COOKIE);
  redirect("/");
}
