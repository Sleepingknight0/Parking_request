import { requireAppMode } from "@/lib/user-guards";
import { UserShell } from "@/components/user-shell";

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
    >
      {children}
    </UserShell>
  );
}
