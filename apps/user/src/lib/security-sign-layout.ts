import type { SecuritySignPayload } from "@/lib/security-sign-data";

export interface SignLayoutLines {
  top: string;
  center: string;
  middle: string[];
  bottom: string[];
}

/** Black-text hierarchy: department / plate (or alternate when no plate), then details. */
export function buildSignLayout(payload: SecuritySignPayload): SignLayoutLines {
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
