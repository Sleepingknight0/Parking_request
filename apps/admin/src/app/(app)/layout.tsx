import { requireProfile } from "@nacc/auth/guards";
import { ADMIN_APP_ROLES } from "@nacc/types";
import { AppShell } from "@/components/app-shell";
import { logout } from "@/lib/auth-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile({
    roles: ADMIN_APP_ROLES,
    loginPath: "/login",
    noAccessPath: "/no-access",
  });

  return (
    <AppShell
      profile={{ display_name: profile.display_name, role: profile.role }}
      logout={logout}
    >
      {children}
    </AppShell>
  );
}
