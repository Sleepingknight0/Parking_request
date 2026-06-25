import type { ParkingRequestListItem } from "@nacc/types";
import {
  formatJobScheduleLine,
  formatSlotLine,
  getJobPlateNos,
  getNextParkingSlot,
  type SecurityJobRow,
} from "./security-job-utils";

export interface SecuritySignPayload {
  plateNo: string;
  dateLine: string;
  buildingLine: string;
  letterNo: string;
  carsCount: number;
  departmentName?: string;
  subject?: string;
  signIndex: number;
  signTotal: number;
  /** True when this sign uses an actual license plate (not a per-car placeholder). */
  hasRealPlate: boolean;
}

type SignJobSource = Pick<
  ParkingRequestListItem,
  | "official_letter_no"
  | "cars_count"
  | "subject"
  | "requested_location_text"
  | "request_dates"
> & {
  department?: { name_th?: string | null } | null;
  requested_location?: { name_th?: string | null } | null;
  request_license_plates?: { plate_no: string }[];
};

/** One sign per plate (or per car when plates are missing). */
export function buildSecuritySignPayloads(
  job: SignJobSource,
  todayIso: string,
): SecuritySignPayload[] {
  const row = job as SecurityJobRow;
  const plates = getJobPlateNos(row);
  const slot = getNextParkingSlot(row, todayIso);
  const dateLine = slot ? formatSlotLine(slot) : formatJobScheduleLine(row);
  const buildingLine =
    job.requested_location?.name_th ?? job.requested_location_text ?? "ไม่ระบุอาคาร";

  const targetCount = Math.max(plates.length || 0, job.cars_count || 1, 1);
  const plateList = [...plates];
  while (plateList.length < targetCount) {
    plateList.push(plates.length ? `คันที่ ${plateList.length + 1}` : `คันที่ ${plateList.length + 1}`);
  }

  return plateList.map((plateNo, index) => ({
    plateNo,
    dateLine,
    buildingLine,
    letterNo: job.official_letter_no,
    carsCount: job.cars_count,
    departmentName: job.department?.name_th ?? undefined,
    subject: job.subject ?? undefined,
    signIndex: index + 1,
    signTotal: plateList.length,
    hasRealPlate: index < plates.length,
  }));
}
