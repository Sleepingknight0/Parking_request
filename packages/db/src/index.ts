/**
 * Safe-everywhere barrel: env helpers + query selects + helpers.
 * Runtime clients have their own subpath entry points so server-only code is
 * never bundled into client components:
 *   @nacc/db/client      browser client (anon, RLS)
 *   @nacc/db/server      server client (cookies, RLS)
 *   @nacc/db/service     service-role client (bypasses RLS, server only)
 *   @nacc/db/middleware  Next middleware session refresh
 *   @nacc/db/queries     query selects + helpers
 */
export * from "./env";
export * from "./queries";
export type { Database } from "@nacc/types/database";
