import { PageHeader } from "@nacc/ui";
import { TH, type Role } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { AuditLogView, type AuditRow } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

const ROW_LIMIT = 500;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  await requireProfile({
    roles: ["super_admin", "admin"],
    loginPath: "/login",
    noAccessPath: "/no-access",
  });

  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

  const action = one(sp.action);
  const actorId = one(sp.actor);
  const dateFrom = one(sp.from);
  const dateTo = one(sp.to);

  const supabase = await createServerSupabase();

  let query = supabase
    .from("activity_logs")
    .select(
      "id,action,entity_type,entity_id,created_at,actor:profiles!actor_id(display_name,role)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);

  if (action) query = query.eq("action", action);
  if (actorId) query = query.eq("actor_id", actorId);
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  const [{ data, count }, { data: actors }] = await Promise.all([
    query,
    supabase
      .from("profiles")
      .select("id,display_name")
      .order("display_name"),
  ]);

  const rows: AuditRow[] = ((data ?? []) as unknown as Array<{
    id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    created_at: string;
    actor: { display_name: string | null; role: Role | null } | null;
  }>).map((r) => ({
    id: r.id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    created_at: r.created_at,
    actor_name: r.actor?.display_name ?? null,
    actor_role: r.actor?.role ?? null,
  }));

  const truncated = (count ?? rows.length) > rows.length;

  return (
    <>
      <PageHeader
        title={TH.nav.activityLogs}
        description="บันทึกการใช้งานและการเปลี่ยนแปลงทั้งหมดในระบบ เพื่อการตรวจสอบย้อนหลัง"
      />
      <AuditLogView
        rows={rows}
        actors={(actors ?? []) as { id: string; display_name: string }[]}
        initial={{ action, actorId, dateFrom, dateTo }}
        truncated={truncated}
      />
    </>
  );
}
