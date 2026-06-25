import { requireAppMode } from "@/lib/user-guards";
import { UserShell } from "@/components/user-shell";
import { switchRole } from "@/lib/auth-actions";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName } = await requireAppMode("officer");

  return (
    <UserShell
      profile={{ display_name: displayName }}
      mode="officer"
      switchRole={switchRole}
    >
      {children}
    </UserShell>
  );
}
