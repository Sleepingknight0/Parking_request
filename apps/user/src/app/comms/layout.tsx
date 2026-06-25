import { requireAppMode } from "@/lib/user-guards";
import { UserShell } from "@/components/user-shell";
import { switchRole } from "@/lib/auth-actions";

export default async function CommsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAppMode("comms");

  return (
    <UserShell
      profile={{ display_name: profile.display_name }}
      mode="comms"
      switchRole={switchRole}
    >
      {children}
    </UserShell>
  );
}
