/**
 * Safe-everywhere barrel: routing helpers only (no server-only imports).
 * Server pieces have dedicated entry points:
 *   @nacc/auth/guards    server guards (requireProfile, getSession)
 *   @nacc/auth/actions   server actions (signInAction, signOutAction)
 */
export * from "./routing";
export type { Role } from "@nacc/types";
