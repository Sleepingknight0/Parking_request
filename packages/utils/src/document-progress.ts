import type { DocumentProgressStatus, RequestStatus } from "@nacc/types";
import {
  documentProgressToRequestStatus,
  nextStatusTowardDocumentProgress,
  requestStatusToDocumentProgress,
} from "@nacc/types";

export type WalkDocumentProgressResult =
  | { ok: true; finalStatus: RequestStatus }
  | { ok: false; error: string };

/**
 * Advance a request one valid transition at a time until it reaches the target
 * document-progress stage (uses existing DB status names only).
 */
export async function walkToDocumentProgress(
  updateStatus: (next: RequestStatus) => Promise<{ error: string | null }>,
  from: RequestStatus,
  target: DocumentProgressStatus,
): Promise<WalkDocumentProgressResult> {
  const targetStatus = documentProgressToRequestStatus(target);
  let current = from;

  if (current === "draft") {
    return { ok: false, error: "คำขอยังเป็นแบบร่าง ไม่สามารถตั้งขั้นตอนเอกสารได้" };
  }
  if (current === "rejected" || current === "cancelled") {
    return { ok: false, error: "คำขอถูกปฏิเสธหรือยกเลิกแล้ว ไม่สามารถตั้งขั้นตอนได้" };
  }

  const currentProgress = requestStatusToDocumentProgress(current);
  if (currentProgress === target) {
    return { ok: true, finalStatus: current };
  }
  if (current === targetStatus) {
    return { ok: true, finalStatus: current };
  }

  const maxSteps = 6;
  for (let step = 0; step < maxSteps; step += 1) {
    const progress = requestStatusToDocumentProgress(current);
    if (progress === target || current === targetStatus) {
      return { ok: true, finalStatus: current };
    }

    const next = nextStatusTowardDocumentProgress(current, target);
    if (!next) {
      return {
        ok: false,
        error: `ไม่สามารถเปลี่ยนจากสถานะปัจจุบันไปยัง "${target}" ได้`,
      };
    }

    const { error } = await updateStatus(next);
    if (error) {
      return { ok: false, error };
    }
    current = next;
  }

  return { ok: false, error: "เปลี่ยนขั้นตอนเอกสารไม่สำเร็จ กรุณาลองใหม่" };
}
