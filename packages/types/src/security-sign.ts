import type { Json } from "./database.types";

/** How รปภ. chose to produce cone parking signs after acknowledging a job. */
export const SIGN_OUTPUT_METHODS = ["print", "handwrite"] as const;
export type SignOutputMethod = (typeof SIGN_OUTPUT_METHODS)[number];

export const SIGN_OUTPUT_METHOD_LABELS_TH: Record<SignOutputMethod, string> = {
  print: "พิมพ์แปะกรวย",
  handwrite: "เขียนมือ",
};

export const SIGN_OUTPUT_METHOD_DIALOG_TH = {
  title: "เลือกวิธีทำป้ายกรวย",
  description: "เลือกวิธีที่ต้องการก่อนรับทราบงาน — ระบบจัดรูปแบบป้ายตามทะเบียนรถแต่ละคัน",
  printTitle: "พิมพ์แปะกรวย",
  printHint: "เลือกบันทึก PDF หรือดาวน์โหลดรูปภาพ",
  handwriteTitle: "เขียนด้วยปากกาเมจิกเอง",
  handwriteHint: "ดูตัวอย่างบนหน้าจอแล้วเขียนตาม — ไม่ดาวน์โหลดอัตโนมัติ",
} as const;

const METADATA_KEY = "sign_output_method";

export function isSignOutputMethod(value: unknown): value is SignOutputMethod {
  return value === "print" || value === "handwrite";
}

/** Read `sign_output_method` from `parking_requests.metadata`. */
export function getSignOutputMethod(metadata: Json | null | undefined): SignOutputMethod | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>)[METADATA_KEY];
  return isSignOutputMethod(raw) ? raw : null;
}

export function mergeSignOutputMetadata(
  metadata: Json | null | undefined,
  method: SignOutputMethod,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  return {
    ...base,
    [METADATA_KEY]: method,
    sign_output_method_at: new Date().toISOString(),
  };
}
