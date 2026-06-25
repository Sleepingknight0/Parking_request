/**
 * Seed the HOSTED Supabase project with reference data, demo accounts, and
 * sample requests. Idempotent: safe to re-run.
 *
 *   pnpm seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env, and
 * migrations already applied (pnpm db:push).
 */
import { getServiceClient, usernameToEmail, isoFromOffset } from "./_env";
import {
  DEPARTMENTS,
  LOCATIONS,
  DEMO_USERS,
  SAMPLE_REQUESTS,
} from "./reference-data";

const supabase = getServiceClient();

async function ensureNamed(
  table: "departments" | "locations",
  names: string[],
): Promise<Map<string, string>> {
  const { data: existing, error } = await supabase.from(table).select("id,name_th");
  if (error) throw error;
  const map = new Map<string, string>(
    (existing ?? []).map((r) => [r.name_th, r.id]),
  );
  const missing = names.filter((n) => !map.has(n)).map((name_th) => ({ name_th }));
  if (missing.length) {
    const { data: inserted, error: insErr } = await supabase
      .from(table)
      .insert(missing)
      .select("id,name_th");
    if (insErr) throw insErr;
    for (const r of inserted ?? []) map.set(r.name_th, r.id);
  }
  console.log(`✓ ${table}: ${map.size} rows (added ${missing.length})`);
  return map;
}

async function ensureUsers(): Promise<Map<string, string>> {
  const byUsername = new Map<string, string>();
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingByEmail = new Map(
    (list?.users ?? []).map((u) => [u.email ?? "", u.id]),
  );

  for (const u of DEMO_USERS) {
    const email = usernameToEmail(u.username);
    let userId = existingByEmail.get(email);

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          username: u.username,
          display_name: u.display_name,
          role: u.role,
        },
      });
      if (error) throw new Error(`createUser ${u.username}: ${error.message}`);
      userId = data.user!.id;
    } else {
      // keep password + metadata in sync for re-runs
      await supabase.auth.admin.updateUserById(userId, {
        password: u.password,
        user_metadata: {
          username: u.username,
          display_name: u.display_name,
          role: u.role,
        },
      });
    }

    // upsert the profile (handle_new_user creates it; ensure role/name correct)
    await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: u.username,
          display_name: u.display_name,
          role: u.role,
          is_active: true,
        },
        { onConflict: "id" },
      );
    byUsername.set(u.username, userId);
  }
  console.log(`✓ users: ${byUsername.size} demo accounts`);
  return byUsername;
}

async function seedRequests(
  deptMap: Map<string, string>,
  locMap: Map<string, string>,
  userMap: Map<string, string>,
) {
  // clean previously-seeded samples (cascade removes children)
  await supabase.from("parking_requests").delete().eq("legacy_source", "seed-sample");

  const adminId = userMap.get("admin")!;
  const locList = LOCATIONS;
  const deptList = DEPARTMENTS;
  let inserted = 0;

  for (const s of SAMPLE_REQUESTS) {
    const nowIso = new Date().toISOString();
    const assignedId = s.assignedTo ? userMap.get(s.assignedTo) : null;

    const row: Record<string, unknown> = {
      department_id: deptMap.get(deptList[s.deptIndex]!) ?? null,
      created_by: userMap.get(s.createdBy) ?? null,
      official_letter_no: s.letterNo,
      official_letter_date: isoFromOffset(s.dayOffset - 7),
      received_date: isoFromOffset(s.dayOffset - 5),
      subject: s.subject,
      contact_name: s.contactName ?? null,
      contact_phone: s.contactPhone ?? null,
      requested_location_id:
        s.locationIndex != null ? locMap.get(locList[s.locationIndex]!) ?? null : null,
      requested_location_text: s.locationText ?? null,
      cars_count: s.cars,
      status: s.status,
      priority: s.priority ?? "normal",
      legacy_source: "seed-sample",
      metadata: { seed: true },
    };

    if (assignedId && ["assigned", "in_progress", "completed", "cancelled"].includes(s.status)) {
      row.assigned_to = assignedId;
      row.assigned_by = adminId;
      row.assigned_at = nowIso;
    }
    if (s.status === "completed") {
      row.completed_by = assignedId;
      row.completed_at = nowIso;
      row.completion_note = "ติดตั้งป้ายสงวนที่จอดเรียบร้อย";
    }
    if (s.status === "cancelled") {
      row.cancelled_by = adminId;
      row.cancelled_at = nowIso;
      row.cancellation_reason = "หน่วยงานแจ้งยกเลิกการใช้พื้นที่";
    }

    const { data: req, error } = await supabase
      .from("parking_requests")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(`insert request ${s.letterNo}: ${error.message}`);

    await supabase.from("request_dates").insert({
      request_id: req.id,
      request_date: isoFromOffset(s.dayOffset),
      start_time: s.startTime ?? null,
      end_time: s.endTime ?? null,
    });
    if (s.plates.length) {
      await supabase.from("request_license_plates").insert(
        s.plates.map((plate_no) => ({ request_id: req.id, plate_no })),
      );
    }
    inserted++;
  }
  console.log(`✓ sample requests: ${inserted}`);
}

async function main() {
  console.log("Seeding NACC parking database…");
  const deptMap = await ensureNamed("departments", DEPARTMENTS);
  const locMap = await ensureNamed("locations", LOCATIONS);
  const userMap = await ensureUsers();
  await seedRequests(deptMap, locMap, userMap);
  console.log("\n✅ Seed complete. Login: admin / admin (CHANGE BEFORE PRODUCTION)");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
