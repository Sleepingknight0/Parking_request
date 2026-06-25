import { requireProfile } from "@nacc/auth/guards";
import { ADMIN_APP_ROLES } from "@nacc/types";

/**
 * Minimal layout for printable / official-document routes.
 * Auth-guarded like the main app, but with no sidebar/header chrome so the
 * page prints cleanly to PDF or paper.
 */
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile({
    roles: ADMIN_APP_ROLES,
    loginPath: "/login",
    noAccessPath: "/no-access",
  });

  return <div className="min-h-screen bg-muted/40 print:bg-white">{children}</div>;
}
