import { requireProfile } from "@nacc/auth/guards";
import { UserShell } from "@/components/user-shell";
import { logout } from "@/lib/auth-actions";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile({
    roles: ["security_staff"],
    loginPath: "/login",
    noAccessPath: "/select-role",
  });

  return (
    <UserShell
      profile={{ display_name: profile.display_name, role: profile.role }}
      mode="security"
      logout={logout}
    >
      {children}
    </UserShell>
  );
}
