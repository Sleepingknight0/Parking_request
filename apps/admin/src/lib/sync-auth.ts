import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@nacc/db/server";
import { getMyProfile } from "@nacc/db/queries";
import { syncWebhookSecret } from "@nacc/storage";
import type { Role } from "@nacc/types";

const SYNC_BROWSER_ROLES: Role[] = ["super_admin", "admin"];

/** Shared secret, Vercel Cron bearer, or logged-in admin session. */
export async function authorizeSyncRequest(
  req: NextRequest,
): Promise<NextResponse | null> {
  const secret = syncWebhookSecret();
  if (secret) {
    const syncHeader = req.headers.get("x-sync-secret");
    const cronToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (syncHeader === secret || cronToken === secret) {
      return null;
    }
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getMyProfile(supabase, user.id);
  if (
    !profile?.is_active ||
    !SYNC_BROWSER_ROLES.includes(profile.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
