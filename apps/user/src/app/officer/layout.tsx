import { requireProfile } from "@nacc/auth/guards";
import { UserShell } from "@/components/user-shell";
import { logout } from "@/lib/auth-actions";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile({
    roles: ["officer"],
    loginPath: "/login",
    noAccessPath: "/select-role",
  });

  return (
    <UserShell
      profile={{ display_name: profile.display_name, role: profile.role }}
      mode="officer"
      logout={logout}
    >
      {children}
    </UserShell>
  );
}
