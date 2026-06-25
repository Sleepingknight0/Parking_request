import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@nacc/db/middleware";

const PUBLIC_PATHS = ["/login", "/no-access"];

/**
 * Refreshes the Supabase session on every page request (writing rotated auth
 * cookies back to the browser) and guards non-public routes.
 *
 * Required by @supabase/ssr — without it, refresh-token rotation desyncs and the
 * session is dropped after the first navigation. API routes are excluded from
 * the matcher: they authenticate themselves (demo-enter sets the session, the
 * /api/sync/* routes use a shared secret), so they must not be redirected here.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes EXCEPT API handlers and static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
