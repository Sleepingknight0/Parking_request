/**
 * Reset + comprehensive TEST data seeder for the HOSTED Supabase project.
 *
 *   pnpm seed:test
 *
 * 1. DELETES all parking_requests (cascade clears dates/plates/attachments/history),
 *    plus activity_logs, sheet_sync_logs and request_counters (numbering resets).
 *    Reference data (departments/locations) and demo accounts are KEPT.
 * 2. Inserts test requests covering EVERY scenario: all 9 statuses, all 4 date
 *    patterns, every priority, multi/range/weekly dates, free-text locations,
 *    assignments, completion (+comms verify), cancellation, and rejection.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env(.local).
 */
import { getServiceClient, isoFromOffset } from "./_env";
import type { RequestStatus, Priority, DatePattern } from "@nacc/types";

const supabase = getServiceClient();
const nowIso = new Date().toISOString();

interface TestRequest {
  scenario: string;
  letterNo: string;
  subject: string;
  purpose?: string;
  deptIndex: number;
  status: RequestStatus;
  priority?: Priority;
  datePattern: DatePattern;
  /** request-date offsets in days from today (negative = past). */
  dateOffsets: number[];
  startTime?: string;
  endTime?: string;
  locationIndex?: number;
  locationText?: string;
  cars: number;
  plates: string[];
  createdBy: string; // username
  assignedTo?: string; // username
  commsVerified?: boolean;
  contactName?: string;
  contactPhone?: string;
}

const TEST_REQUESTS: TestRequest[] = [
  // ── draft ────────────────────────────────────────────────────────────────
  { scenario: "draft + single", letterNo: "ทดสอบ 0001/2569", subject: "ร่างคำขอ (ยังไม่ส่ง) วันเดียว", deptIndex: 0, status: "draft", datePattern: "single", dateOffsets: [9], startTime: "08:30", endTime: "16:30", locationIndex: 0, cars: 2, plates: ["1กก 1001"], createdBy: "officer01", priority: "normal" },
  { scenario: "draft + multi + ไม่มีทะเบียน + สถานที่อิสระ", letterNo: "ทดสอบ 0002/2569", subject: "ร่างคำขอหลายวัน ระบุสถานที่ภายหลัง", deptIndex: 12, status: "draft", datePattern: "multi", dateOffsets: [11, 13, 15], cars: 1, plates: [], locationText: "ระบุสถานที่ภายหลัง", createdBy: "officer02" },

  // ── submitted ──────────────────────────────────────────────────────────────
  { scenario: "submitted + single + priority high + ครบข้อมูล", letterNo: "ทดสอบ 0003/2569", subject: "ขอที่จอดรถประชุมคณะกรรมการ", purpose: "จัดประชุมคณะกรรมการประจำเดือน", deptIndex: 1, status: "submitted", priority: "high", datePattern: "single", dateOffsets: [3], startTime: "08:30", endTime: "16:30", locationIndex: 2, cars: 5, plates: ["2ขข 2002", "3คค 3003"], createdBy: "officer01", contactName: "นางสาวสมหญิง ใจดี", contactPhone: "0812345678" },
  { scenario: "submitted + range (3 วันต่อเนื่อง)", letterNo: "ทดสอบ 0004/2569", subject: "ขอที่จอดรถงานสัมมนา 3 วัน", deptIndex: 8, status: "submitted", priority: "normal", datePattern: "range", dateOffsets: [5, 6, 7], startTime: "07:30", endTime: "17:00", locationIndex: 5, cars: 8, plates: ["4งง 4004"], createdBy: "officer02", contactName: "นายวิชัย มั่นคง", contactPhone: "0898765432" },
  { scenario: "submitted + priority low", letterNo: "ทดสอบ 0005/2569", subject: "ขอที่จอดรถผู้มาติดต่อ (ไม่เร่งด่วน)", deptIndex: 29, status: "submitted", priority: "low", datePattern: "single", dateOffsets: [8], startTime: "09:00", endTime: "12:00", locationIndex: 3, cars: 2, plates: ["5จจ 5005"], createdBy: "officer01" },

  // ── under_review ─────────────────────────────────────────────────────────
  { scenario: "under_review + single + urgent", letterNo: "ทดสอบ 0006/2569", subject: "ขอที่จอดรถด่วน (อยู่ระหว่างตรวจสอบ)", deptIndex: 5, status: "under_review", priority: "urgent", datePattern: "single", dateOffsets: [2], startTime: "06:00", endTime: "20:00", locationIndex: 1, cars: 4, plates: ["6ฉฉ 6006"], createdBy: "officer02", contactName: "นายอนุชา", contactPhone: "0801112222" },
  { scenario: "under_review + weekly (4 สัปดาห์)", letterNo: "ทดสอบ 0007/2569", subject: "ขอที่จอดรถประชุมประจำสัปดาห์", deptIndex: 41, status: "under_review", priority: "normal", datePattern: "weekly", dateOffsets: [4, 11, 18, 25], startTime: "13:00", endTime: "16:00", locationIndex: 4, cars: 3, plates: ["7ชช 7007"], createdBy: "officer01" },

  // ── approved (ยังไม่มอบหมาย → โชว์ใน /assignments + dashboard) ──────────────
  { scenario: "approved + single + ยังไม่มอบหมาย", letterNo: "ทดสอบ 0008/2569", subject: "อนุมัติแล้ว รอมอบหมายงาน", deptIndex: 38, status: "approved", priority: "high", datePattern: "single", dateOffsets: [3], startTime: "08:00", endTime: "15:00", locationIndex: 0, cars: 6, plates: ["8ซซ 8008", "9ฌฌ 9009"], createdBy: "officer01", contactName: "นางพรทิพย์", contactPhone: "0834445555" },
  { scenario: "approved + multi", letterNo: "ทดสอบ 0009/2569", subject: "อนุมัติแล้ว ใช้หลายวัน", deptIndex: 43, status: "approved", priority: "normal", datePattern: "multi", dateOffsets: [4, 6, 9], startTime: "08:30", endTime: "16:30", locationIndex: 6, cars: 3, plates: ["1ญญ 1100"], createdBy: "officer02" },

  // ── assigned ─────────────────────────────────────────────────────────────
  { scenario: "assigned + single + security01", letterNo: "ทดสอบ 0010/2569", subject: "มอบหมายแล้ว ติดตั้งป้ายพรุ่งนี้", deptIndex: 2, status: "assigned", priority: "high", datePattern: "single", dateOffsets: [1], startTime: "09:00", endTime: "12:00", locationIndex: 0, cars: 3, plates: ["2ฎฎ 2200"], createdBy: "officer01", assignedTo: "security01", contactName: "นายสมศักดิ์", contactPhone: "0867778888" },
  { scenario: "assigned + range + security02 + สถานที่อิสระ", letterNo: "ทดสอบ 0011/2569", subject: "มอบหมายแล้ว ใช้พื้นที่พิเศษ 2 วัน", deptIndex: 39, status: "assigned", priority: "normal", datePattern: "range", dateOffsets: [2, 3], startTime: "07:00", endTime: "18:00", locationText: "ลานจอดด้านข้างอาคารกิจกรรม (พื้นที่พิเศษ)", cars: 5, plates: ["3ฏฏ 3300", "4ฐฐ 4400"], createdBy: "officer02", assignedTo: "security02" },

  // ── in_progress ──────────────────────────────────────────────────────────
  { scenario: "in_progress + single + urgent + วันนี้", letterNo: "ทดสอบ 0012/2569", subject: "กำลังจัดที่จอดวันนี้", deptIndex: 4, status: "in_progress", priority: "urgent", datePattern: "single", dateOffsets: [0], startTime: "06:30", endTime: "12:00", locationIndex: 2, cars: 10, plates: ["5ฑฑ 5500", "6ฒฒ 6600"], createdBy: "officer01", assignedTo: "security01" },
  { scenario: "in_progress + weekly + comms01", letterNo: "ทดสอบ 0013/2569", subject: "งานต่อเนื่องรายสัปดาห์ กำลังดำเนินการ", deptIndex: 44, status: "in_progress", priority: "normal", datePattern: "weekly", dateOffsets: [0, 7, 14], startTime: "08:00", endTime: "17:00", locationIndex: 8, cars: 4, plates: ["7ณณ 7700"], createdBy: "officer02", assignedTo: "comms01" },

  // ── completed ────────────────────────────────────────────────────────────
  { scenario: "completed + single (อดีต)", letterNo: "ทดสอบ 0014/2569", subject: "งานเสร็จแล้ว วันเดียว", deptIndex: 3, status: "completed", priority: "normal", datePattern: "single", dateOffsets: [-3], startTime: "08:00", endTime: "15:00", locationIndex: 3, cars: 2, plates: ["8ดด 8800"], createdBy: "officer01", assignedTo: "security01" },
  { scenario: "completed + multi + ยืนยันโดยสื่อสาร", letterNo: "ทดสอบ 0015/2569", subject: "งานเสร็จและสื่อสารยืนยันแล้ว", deptIndex: 8, status: "completed", priority: "high", datePattern: "multi", dateOffsets: [-7, -6], startTime: "08:30", endTime: "16:00", locationIndex: 8, cars: 6, plates: ["9ตต 9900", "1ถถ 1011"], createdBy: "officer02", assignedTo: "comms01", commsVerified: true },

  // ── cancelled ────────────────────────────────────────────────────────────
  { scenario: "cancelled (จาก submitted)", letterNo: "ทดสอบ 0016/2569", subject: "ยกเลิกก่อนมอบหมาย", deptIndex: 30, status: "cancelled", priority: "normal", datePattern: "single", dateOffsets: [5], startTime: "09:00", endTime: "12:00", locationIndex: 1, cars: 4, plates: ["2ทท 2012"], createdBy: "officer01" },
  { scenario: "cancelled (เคยมอบหมายแล้ว)", letterNo: "ทดสอบ 0017/2569", subject: "ยกเลิกหลังมอบหมายงาน", deptIndex: 12, status: "cancelled", priority: "high", datePattern: "range", dateOffsets: [3, 4], startTime: "08:00", endTime: "16:00", locationIndex: 9, cars: 3, plates: ["3นน 3013"], createdBy: "officer02", assignedTo: "security02" },

  // ── rejected ─────────────────────────────────────────────────────────────
  { scenario: "rejected + เหตุผล", letterNo: "ทดสอบ 0018/2569", subject: "ไม่อนุมัติ เอกสารไม่ครบ", deptIndex: 28, status: "rejected", priority: "normal", datePattern: "single", dateOffsets: [6], startTime: "10:00", endTime: "14:00", locationIndex: 7, cars: 2, plates: ["4บบ 4014"], createdBy: "officer01", contactName: "นางสาวรัตนา", contactPhone: "0823334444" },
];

async function deleteAll(table: string, keyColumn: string) {
  const { count } = await supabase.from(table as never).select("*", { count: "exact", head: true });
  const { error } = await supabase.from(table as never).delete().not(keyColumn, "is", null);
  if (error) throw new Error(`delete ${table}: ${error.message}`);
  console.log(`  ✓ ลบ ${table}: ${count ?? 0} แถว`);
}

async function fetchMaps() {
  const [{ data: depts }, { data: locs }, { data: profiles }] = await Promise.all([
    supabase.from("departments").select("id,name_th").order("name_th"),
    supabase.from("locations").select("id,name_th").order("name_th"),
    supabase.from("profiles").select("id,username,role"),
  ]);

  const deptIds = (depts ?? []).map((d) => d.id);
  const locIds = (locs ?? []).map((l) => l.id);
  const userByName = new Map((profiles ?? []).map((p) => [p.username ?? "", p.id]));

  // Fallbacks so the script still works if a specific demo username is missing.
  const firstByRole = (role: string) =>
    (profiles ?? []).find((p) => p.role === role)?.id ?? null;
  const userId = (username: string): string | null => {
    if (userByName.get(username)) return userByName.get(username)!;
    if (username === "admin") return firstByRole("super_admin") ?? firstByRole("admin");
    if (username.startsWith("officer")) return firstByRole("officer");
    return firstByRole("security_staff");
  };

  if (!deptIds.length || !locIds.length) {
    throw new Error("ไม่พบ departments/locations — รัน `pnpm seed` ก่อนเพื่อสร้างข้อมูลอ้างอิง");
  }
  return { deptIds, locIds, userId };
}

async function main() {
  console.log("🧹 ลบข้อมูลปลอมทั้งหมด...");
  await deleteAll("parking_requests", "id"); // cascade clears dates/plates/attachments/history
  await deleteAll("activity_logs", "id");
  await deleteAll("sheet_sync_logs", "id");
  await deleteAll("request_counters", "counter_date"); // reset request_no numbering

  console.log("\n📦 กำลังเพิ่มข้อมูล Test ครบทุก scenario...");
  const { deptIds, locIds, userId } = await fetchMaps();
  const adminId = userId("admin");

  let inserted = 0;
  const byStatus: Record<string, number> = {};

  for (const s of TEST_REQUESTS) {
    const firstOff = Math.min(...s.dateOffsets);
    const receivedOff = firstOff - 5;
    const assignedId = s.assignedTo ? userId(s.assignedTo) : null;

    const row: Record<string, unknown> = {
      department_id: deptIds[s.deptIndex % deptIds.length] ?? null,
      created_by: userId(s.createdBy),
      official_letter_no: s.letterNo,
      official_letter_date: isoFromOffset(receivedOff - 2),
      received_date: isoFromOffset(receivedOff),
      subject: s.subject,
      purpose: s.purpose ?? null,
      contact_name: s.contactName ?? null,
      contact_phone: s.contactPhone ?? null,
      requested_location_id:
        s.locationIndex != null ? locIds[s.locationIndex % locIds.length] ?? null : null,
      requested_location_text: s.locationText ?? null,
      cars_count: s.cars,
      status: s.status,
      priority: s.priority ?? "normal",
      date_pattern: s.datePattern,
      legacy_source: "test-data",
      metadata: { test: true, scenario: s.scenario },
    };

    if (assignedId && ["assigned", "in_progress", "completed", "cancelled"].includes(s.status)) {
      row.assigned_to = assignedId;
      row.assigned_by = adminId;
      row.assigned_at = nowIso;
    }
    if (s.status === "approved") {
      row.approved_by = adminId;
      row.approved_at = nowIso;
    }
    if (s.status === "completed") {
      row.completed_by = assignedId;
      row.completed_at = nowIso;
      row.completion_note = "ติดตั้งป้ายสงวนที่จอดและจัดพื้นที่เรียบร้อย";
      if (s.commsVerified) {
        row.comms_verified_by = userId("comms01");
        row.comms_verified_at = nowIso;
      }
    }
    if (s.status === "cancelled") {
      row.cancelled_by = adminId;
      row.cancelled_at = nowIso;
      row.cancellation_reason = "หน่วยงานแจ้งยกเลิกการใช้พื้นที่";
    }
    if (s.status === "rejected") {
      row.rejected_by = adminId;
      row.rejected_at = nowIso;
      row.admin_note = "เอกสารประกอบไม่ครบถ้วน จึงไม่อนุมัติคำขอ";
    }

    const { data: req, error } = await supabase
      .from("parking_requests")
      .insert(row as never)
      .select("id,request_no")
      .single();
    if (error || !req) throw new Error(`insert ${s.letterNo}: ${error?.message}`);

    const dateRows = s.dateOffsets.map((off) => ({
      request_id: req.id,
      request_date: isoFromOffset(off),
      start_time: s.startTime ?? null,
      end_time: s.endTime ?? null,
    }));
    const { error: dErr } = await supabase.from("request_dates").insert(dateRows as never);
    if (dErr) throw new Error(`insert dates ${s.letterNo}: ${dErr.message}`);

    if (s.plates.length) {
      await supabase
        .from("request_license_plates")
        .insert(s.plates.map((plate_no) => ({ request_id: req.id, plate_no })) as never);
    }

    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    inserted++;
    console.log(`  ✓ ${req.request_no} · ${s.status} · ${s.scenario}`);
  }

  console.log(`\n✅ เพิ่มข้อมูล Test สำเร็จ ${inserted} คำขอ`);
  console.log("สรุปตามสถานะ:");
  for (const [k, v] of Object.entries(byStatus)) console.log(`   ${k}: ${v}`);
  console.log("\nหมายเหตุ: ข้อมูลทั้งหมดติดแท็ก legacy_source = 'test-data'");
}

main().catch((err) => {
  console.error("❌ Seed test failed:", err);
  process.exit(1);
});
