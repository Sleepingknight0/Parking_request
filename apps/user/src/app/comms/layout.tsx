import { requireAppMode } from "@/lib/user-guards";
import { UserShell } from "@/components/user-shell";

export default async function CommsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName } = await requireAppMode("comms");

  return (
    <UserShell
      profile={{ display_name: displayName }}
      mode="comms"
    >
      {children}
    </UserShell>
  );
}
