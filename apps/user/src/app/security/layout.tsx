import { requireAppMode } from "@/lib/user-guards";
import { UserShell } from "@/components/user-shell";
import { switchRole } from "@/lib/auth-actions";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName } = await requireAppMode("security");

  return (
    <UserShell
      profile={{ display_name: displayName }}
      mode="security"
      switchRole={switchRole}
    >
      {children}
    </UserShell>
  );
}
