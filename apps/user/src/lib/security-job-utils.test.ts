import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SecurityJobRow } from "./security-job-utils";
import {
  comparePrepPriority,
  formatNextSlotLine,
  formatPlateSummary,
  formatSlotLine,
  getJobLocationTitle,
  getJobPlateNos,
  getNextParkingDate,
  getPrepUrgency,
  getSecurityEventColor,
  needsParkingPrep,
} from "./security-job-utils";

const TODAY = "2026-06-25";

function job(partial: Partial<SecurityJobRow> & Pick<SecurityJobRow, "id">): SecurityJobRow {
  return {
    id: partial.id,
    request_no: partial.request_no ?? "REQ-001",
    official_letter_no: partial.official_letter_no ?? "ปช 0001/2569",
    status: partial.status ?? "approved",
    priority: partial.priority ?? "normal",
    date_pattern: partial.date_pattern ?? "single",
    cars_count: partial.cars_count ?? 2,
    department_id: null,
    created_by: "u1",
    assigned_to: null,
    requested_location_id: null,
    requested_location_text: partial.requested_location_text ?? null,
    official_letter_date: null,
    received_date: null,
    subject: partial.subject ?? null,
    contact_name: null,
    contact_phone: null,
    purpose: null,
    completion_note: null,
    cancellation_reason: null,
    admin_note: null,
    completed_by: null,
    completed_at: null,
    cancelled_by: null,
    cancelled_at: null,
    assigned_by: null,
    assigned_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    department: partial.department ?? { id: "d1", name_th: "สำนักทดสอบ", short_name: "ทดสอบ" },
    requested_location:
      partial.requested_location !== undefined
        ? partial.requested_location
        : { id: "l1", name_th: "ลาน A" },
    assigned_to_profile: null,
    request_dates: partial.request_dates ?? [
      { request_date: "2026-06-26", start_time: "09:00", end_time: "12:00" },
    ],
    request_license_plates: partial.request_license_plates,
  } as SecurityJobRow;
}

describe("security-job-utils", () => {
  it("uses location and car count as primary title", () => {
    const title = getJobLocationTitle(job({ id: "1" }));
    assert.equal(title, "ลาน A · 2 คัน");
  });

  it("handles missing location", () => {
    const title = getJobLocationTitle(
      job({ id: "1", requested_location: null, requested_location_text: "ข้างอาคาร 2" }),
    );
    assert.equal(title, "ข้างอาคาร 2 · 2 คัน");
  });

  it("formats plates when present", () => {
    const plates = getJobPlateNos(
      job({
        id: "1",
        request_license_plates: [
          { plate_no: "1กก 1234", vehicle_note: null },
          { plate_no: "2ขข 5678", vehicle_note: null },
        ],
      }),
    );
    assert.deepEqual(plates, ["1กก 1234", "2ขข 5678"]);
    assert.equal(formatPlateSummary(plates), "1กก 1234 · 2ขข 5678");
  });

  it("handles no plates", () => {
    assert.equal(formatPlateSummary(getJobPlateNos(job({ id: "1" }))), null);
  });

  it("formats next slot date and time for prep card", () => {
    const line = formatNextSlotLine(job({ id: "1" }), TODAY);
    assert.match(line ?? "", /09\.00/);
    assert.match(line ?? "", /26/);
  });

  it("formats slot without time", () => {
    const line = formatSlotLine({
      request_date: "2026-06-26",
      start_time: null,
      end_time: null,
    });
    assert.doesNotMatch(line, /09\.00/);
  });

  it("prep urgency: tomorrow is critical", () => {
    const j = job({
      id: "1",
      request_dates: [{ request_date: "2026-06-26", start_time: null, end_time: null }],
    });
    assert.equal(getNextParkingDate(j, TODAY), "2026-06-26");
    assert.equal(needsParkingPrep("2026-06-26", TODAY), true);
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "critical");
    assert.equal(prep?.tag, "ด่วนมากๆ");
    assert.match(prep?.dateLabel ?? "", /พรุ่งนี้/);
  });

  it("prep urgency: 3 days out is soon (orange)", () => {
    const j = job({
      id: "1",
      request_dates: [{ request_date: "2026-06-28", start_time: null, end_time: null }],
    });
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "soon");
    assert.equal(prep?.tag, "ด่วน");
  });

  it("prep urgency: far date is normal (teal)", () => {
    const j = job({
      id: "1",
      request_dates: [{ request_date: "2026-07-10", start_time: null, end_time: null }],
    });
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "normal");
    assert.equal(prep?.tag, "ปกติ");
  });

  it("prep urgency: today not arranged shows warning", () => {
    const j = job({
      id: "1",
      status: "approved",
      request_dates: [{ request_date: TODAY, start_time: "09:00", end_time: "12:00" }],
    });
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "overdue");
    assert.equal(prep?.tag, "ยังไม่ได้จัดที่จอดรถ");
    assert.equal(prep?.emoji, "⚠️");
  });

  it("prep urgency: today in progress is critical not overdue", () => {
    const j = job({
      id: "1",
      status: "in_progress",
      request_dates: [{ request_date: TODAY, start_time: "09:00", end_time: "12:00" }],
    });
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "critical");
    assert.equal(prep?.tag, "ด่วนมากๆ");
  });

  it("multi-day long term: next date after today", () => {
    const j = job({
      id: "1",
      date_pattern: "range",
      request_dates: [
        { request_date: "2026-06-20", start_time: null, end_time: null },
        { request_date: "2026-06-28", start_time: null, end_time: null },
        { request_date: "2026-06-29", start_time: null, end_time: null },
      ],
    });
    assert.equal(getNextParkingDate(j, TODAY), "2026-06-28");
    const prep = getPrepUrgency(j, TODAY);
    assert.equal(prep?.level, "soon");
  });

  it("weekly pattern job", () => {
    const j = job({
      id: "1",
      date_pattern: "weekly",
      request_dates: [
        { request_date: "2026-06-26", start_time: "08:00", end_time: "17:00" },
        { request_date: "2026-07-03", start_time: "08:00", end_time: "17:00" },
      ],
    });
    assert.equal(getNextParkingDate(j, TODAY), "2026-06-26");
    assert.equal(needsParkingPrep(getNextParkingDate(j, TODAY), TODAY), true);
  });

  it("completed job has no prep urgency", () => {
    const prep = getPrepUrgency(
      job({ id: "1", status: "completed", request_dates: [{ request_date: TODAY, start_time: null, end_time: null }] }),
      TODAY,
    );
    assert.equal(prep, null);
  });

  it("calendar color: overdue today approved is dark red", () => {
    assert.equal(getSecurityEventColor("approved", TODAY, TODAY), "#b91c1c");
  });

  it("calendar color: completed is green", () => {
    assert.equal(getSecurityEventColor("completed", TODAY, TODAY), "#16a34a");
  });

  it("sorts overdue before critical before soon", () => {
    const overdue = job({
      id: "o",
      status: "approved",
      request_dates: [{ request_date: TODAY, start_time: null, end_time: null }],
    });
    const tomorrow = job({
      id: "t",
      request_dates: [{ request_date: "2026-06-26", start_time: null, end_time: null }],
    });
    const later = job({
      id: "l",
      request_dates: [{ request_date: "2026-06-28", start_time: null, end_time: null }],
    });
    const sorted = [later, tomorrow, overdue].sort((a, b) => comparePrepPriority(a, b, TODAY));
    assert.equal(sorted[0]?.id, "o");
    assert.equal(sorted[1]?.id, "t");
  });
});
