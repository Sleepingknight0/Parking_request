import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  USER_MODE_COOKIE,
  USER_MODE_HOME,
  isUserAppMode,
  type UserAppMode,
} from "@/lib/user-mode";

export async function POST(req: Request) {
  const form = await req.formData();
  const rawMode = form.get("mode")?.toString();

  if (rawMode === "super_admin") {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.replace(/\/$/, "");
    if (!adminUrl) redirect("/?error=admin");
    redirect(`${adminUrl}/login`);
  }

  if (!rawMode || !isUserAppMode(rawMode)) {
    redirect("/");
  }

  const mode = rawMode as UserAppMode;
  const jar = await cookies();
  jar.set(USER_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect(USER_MODE_HOME[mode]);
}
