/**
 * Legacy Google Sheet → Supabase importer.
 *
 *   pnpm import:legacy --dry-run            # default: report only, no writes
 *   pnpm import:legacy --apply              # actually insert rows
 *   pnpm import:legacy --apply --file=private-data/legacy.csv
 *
 * Input: a CSV export of the old "ชีต1" worksheet with the 8 Thai columns
 * (วันที่รับเรื่อง, สำนัก, เลขหนังสือ, วันที่จอด, เวลาที่จอด, จำนวนรถ, อาคารที่จอด,
 * เจ้าหน้าที่ผู้รับเรื่อง). Put the export under private-data/ (gitignored).
 *
 * See docs/LEGACY_IMPORT.md for mapping rules, rollback, and re-run behaviour.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { getServiceClient } from "./_env";
import {
  normalizeLegacyRow,
  legacyDedupeKey,
  type LegacySheetRow,
} from "@nacc/utils";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];
const FILE = resolve(process.cwd(), fileArg ?? "private-data/legacy.csv");
const LEGACY_SOURCE = "google-sheet";

const supabase = getServiceClient();

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  console.log(`\nLegacy import — mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}`);
  console.log(`File: ${FILE}\n`);

  if (!existsSync(FILE)) {
    console.error(
      `❌ ไม่พบไฟล์ ${FILE}\n   วางไฟล์ CSV export ของ Google Sheet ไว้ที่ private-data/legacy.csv ก่อน`,
    );
    process.exit(1);
  }

  const raw = readFileSync(FILE, "utf8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as LegacySheetRow[];
  console.log(`อ่านได้ ${records.length} แถว\n`);

  // Reference maps
  const [{ data: depts }, { data: locs }, { data: existing }] = await Promise.all([
    supabase.from("departments").select("id,name_th"),
    supabase.from("locations").select("id,name_th"),
    supabase.from("parking_requests").select("official_letter_no"),
  ]);

  const deptByName = new Map((depts ?? []).map((d) => [d.name_th.trim(), d.id]));
  const locByName = new Map((locs ?? []).map((l) => [l.name_th.trim(), l.id]));
  const existingLetters = new Set((existing ?? []).map((r) => r.official_letter_no));
  const seenKeys = new Set<string>();

  const summary = {
    total: records.length,
    inserted: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    unmatchedDept: 0,
    unmatchedLocation: 0,
    warnings: [] as string[],
  };

  const today = todayISO();

  for (let i = 0; i < records.length; i++) {
    const rowNo = i + 2; // account for header row
    const n = normalizeLegacyRow(records[i]!, rowNo);
    summary.warnings.push(...n.warnings);

    if (!n.official_letter_no) {
      summary.skippedInvalid++;
      continue;
    }

    // de-dupe (within file + against DB)
    const key = legacyDedupeKey(n);
    if (seenKeys.has(key) || existingLetters.has(n.official_letter_no)) {
      summary.skippedDuplicate++;
      continue;
    }
    seenKeys.add(key);

    // resolve department
    let departmentId: string | null = null;
    if (n.department_name) {
      departmentId = deptByName.get(n.department_name.trim()) ?? null;
      if (!departmentId) {
        // loose contains match
        for (const [name, id] of deptByName) {
          if (name.includes(n.department_name) || n.department_name.includes(name)) {
            departmentId = id;
            break;
          }
        }
      }
      if (!departmentId) summary.unmatchedDept++;
    }

    // resolve location (else free text)
    let locationId: string | null = null;
    let locationText: string | null = null;
    if (n.parking_spot) {
      locationId = locByName.get(n.parking_spot.trim()) ?? null;
      if (!locationId) {
        locationText = n.parking_spot;
        summary.unmatchedLocation++;
      }
    }

    const status = n.parking_date && n.parking_date < today ? "completed" : "submitted";

    if (!APPLY) {
      console.log(
        `  [${rowNo}] ${n.official_letter_no} | ${n.department_name ?? "-"}` +
          ` | จอด ${n.parking_date ?? "-"} | ${n.cars_count} คัน | → ${status}` +
          `${departmentId ? "" : " (สำนักไม่ตรง)"}${locationText ? " (สถานที่อิสระ)" : ""}`,
      );
      summary.inserted++;
      continue;
    }

    // APPLY: insert request + its date
    const { data: req, error } = await supabase
      .from("parking_requests")
      .insert({
        department_id: departmentId,
        official_letter_no: n.official_letter_no,
        received_date: n.received_date,
        requested_location_id: locationId,
        requested_location_text: locationText,
        cars_count: n.cars_count,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        legacy_source: LEGACY_SOURCE,
        legacy_row_number: rowNo,
        legacy_imported_at: new Date().toISOString(),
        legacy_officer_name: n.officer_name,
        metadata: { imported: true, original: records[i] },
      })
      .select("id")
      .single();

    if (error || !req) {
      summary.skippedInvalid++;
      summary.warnings.push(`แถว ${rowNo}: insert ล้มเหลว — ${error?.message}`);
      continue;
    }

    if (n.parking_date) {
      await supabase.from("request_dates").insert({
        request_id: req.id,
        request_date: n.parking_date,
        start_time: n.start_time,
        end_time: n.end_time,
      });
    }
    summary.inserted++;
  }

  console.log("\n──────────── สรุปผลการนำเข้า ────────────");
  console.log(`ทั้งหมด:            ${summary.total}`);
  console.log(`${APPLY ? "นำเข้าแล้ว" : "จะนำเข้า"}:        ${summary.inserted}`);
  console.log(`ข้าม (ซ้ำ):          ${summary.skippedDuplicate}`);
  console.log(`ข้าม (ไม่ถูกต้อง):   ${summary.skippedInvalid}`);
  console.log(`สำนักไม่ตรง:         ${summary.unmatchedDept}`);
  console.log(`สถานที่ไม่ตรง:       ${summary.unmatchedLocation}`);
  if (summary.warnings.length) {
    console.log(`\n⚠️  คำเตือน (${summary.warnings.length}):`);
    summary.warnings.slice(0, 30).forEach((w) => console.log(`   - ${w}`));
    if (summary.warnings.length > 30) console.log(`   ... และอีก ${summary.warnings.length - 30} รายการ`);
  }
  if (!APPLY) console.log(`\nℹ️  นี่คือ DRY RUN — ยังไม่มีการบันทึก ใช้ --apply เพื่อนำเข้าจริง`);
  console.log("");
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
