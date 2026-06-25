import type { ParkingRequestWithRelations, SignOutputMethod } from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";

export interface AdminSecuritySignPayload {
  plateNo: string;
  dateLine: string;
  buildingLine: string;
  letterNo: string;
  carsCount: number;
  departmentName?: string;
  subject?: string;
  signIndex: number;
  signTotal: number;
  hasRealPlate: boolean;
}

export interface AdminSecuritySignLayout {
  top: string;
  center: string;
  middle: string[];
  bottom: string[];
}

function formatScheduleLine(request: ParkingRequestWithRelations): string {
  const dates = [...request.request_dates].sort((a, b) =>
    a.request_date.localeCompare(b.request_date),
  );
  if (!dates.length) return "ยังไม่ระบุวันที่";

  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const time = formatTimeRange(first.start_time, first.end_time);

  if (dates.length === 1) {
    return `${formatThaiDate(first.request_date)}${time ? ` ${time}` : ""}`;
  }
  return `${formatThaiDate(first.request_date)} - ${formatThaiDate(last.request_date)} (${dates.length} วัน)${time ? ` · ${time}` : ""}`;
}

export function buildAdminSecuritySignPayloads(
  request: ParkingRequestWithRelations,
): AdminSecuritySignPayload[] {
  const plates = request.request_license_plates.map((p) => p.plate_no).filter(Boolean);
  const targetCount = Math.max(plates.length, request.cars_count || 1, 1);
  const plateList = [...plates];

  while (plateList.length < targetCount) {
    plateList.push(`คันที่ ${plateList.length + 1}`);
  }

  const buildingLine =
    request.requested_location?.name_th ?? request.requested_location_text ?? "ไม่ระบุอาคาร";
  const dateLine = formatScheduleLine(request);

  return plateList.map((plateNo, index) => ({
    plateNo,
    dateLine,
    buildingLine,
    letterNo: request.official_letter_no,
    carsCount: request.cars_count,
    departmentName: request.department?.name_th ?? undefined,
    subject: request.subject ?? undefined,
    signIndex: index + 1,
    signTotal: plateList.length,
    hasRealPlate: index < plates.length,
  }));
}

export function buildAdminSecuritySignLayout(
  payload: AdminSecuritySignPayload,
): AdminSecuritySignLayout {
  const dept = payload.departmentName?.trim() || "ไม่ระบุสำนัก";

  if (payload.hasRealPlate) {
    return {
      top: dept,
      center: payload.plateNo,
      middle: [`อาคาร ${payload.buildingLine}`, payload.dateLine],
      bottom: [
        `เลขหนังสือ ${payload.letterNo}`,
        `จำนวน ${payload.carsCount} คัน`,
        payload.subject ? `เรื่อง ${payload.subject}` : null,
        `ป้ายที่ ${payload.signIndex}/${payload.signTotal}`,
      ].filter(Boolean) as string[],
    };
  }

  return {
    top: `เลขหนังสือ ${payload.letterNo} · จำนวน ${payload.carsCount} คัน`,
    center: dept,
    middle: [`อาคาร ${payload.buildingLine}`, payload.dateLine],
    bottom: [
      payload.subject ? `เรื่อง ${payload.subject}` : null,
      `ป้ายที่ ${payload.signIndex}/${payload.signTotal}`,
    ].filter(Boolean) as string[],
  };
}

export function signMethodLabel(method: SignOutputMethod): string {
  return method === "print" ? "พิมพ์แปะกรวย" : "แบบเขียนมือ";
}
