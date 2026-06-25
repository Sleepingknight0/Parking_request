import { PageHeader } from "@nacc/ui";
import { TH, type Role } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { UsersManager, type UserRow } from "@/components/users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const supabase = await createServerSupabase();
  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,username,display_name,role,phone,is_active,department:departments(name_th)")
      .order("display_name"),
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);

  return (
    <>
      <PageHeader title={TH.nav.users} description="จัดการบัญชีผู้ใช้งานและบทบาท" />
      <UsersManager
        users={(users ?? []) as UserRow[]}
        departments={(departments ?? []) as { id: string; name_th: string }[]}
      />
    </>
  );
}
