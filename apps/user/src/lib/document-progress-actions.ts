"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@nacc/db/service";
import {
  type DocumentProgressStatus,
  type RequestStatus,
} from "@nacc/types";
import { walkToDocumentProgress } from "@nacc/utils";
import { requireAppMode } from "./user-guards";
import type { ActionResult } from "./request-actions";
import { requestSheetSync } from "./sheet-sync";

function revalidateDocumentProgressPaths(id: string, modes: ("officer" | "comms" | "security")[]) {
  if (modes.includes("officer")) {
    revalidatePath("/officer/requests");
    revalidatePath(`/officer/requests/${id}`);
    revalidatePath("/officer/dashboard");
  }
  if (modes.includes("comms")) {
    revalidatePath("/comms/requests");
    revalidatePath(`/comms/requests/${id}`);
    revalidatePath("/comms/dashboard");
  }
  if (modes.includes("security")) {
    revalidatePath("/security/jobs");
    revalidatePath(`/security/jobs/${id}`);
    revalidatePath("/security/dashboard");
    revalidatePath("/security/history");
  }
}

async function applyDocumentProgress(
  requestId: string,
  target: DocumentProgressStatus,
  actorId: string,
  modes: ("officer" | "comms" | "security")[],
  extra?: { completionNote?: string; assignedTo?: string | null },
): Promise<ActionResult> {
  const svc = createServiceClient();
  const { data: current, error: readError } = await svc
    .from("parking_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (readError || !current) {
    return { ok: false, error: readError?.message ?? "ไม่พบคำขอ" };
  }

  const from = current.status as RequestStatus;
  const result = await walkToDocumentProgress(
    async (next) => {
      const patch: Record<string, unknown> = { status: next };
      if (next === "under_review") {
        /* no extra fields */
      }
      if (next === "approved") {
        patch.approved_by = actorId;
      }
      if (next === "assigned") {
        if (extra?.assignedTo !== undefined) {
          patch.assigned_to = extra.assignedTo;
        }
      }
      if (next === "completed") {
        patch.completed_by = actorId;
        if (extra?.completionNote !== undefined) {
          patch.completion_note = extra.completionNote;
        }
      }

      const { error } = await svc.from("parking_requests").update(patch).eq("id", requestId);
      return { error: error?.message ?? null };
    },
    from,
    target,
  );

  if (!result.ok) return { ok: false, error: result.error };

  await svc.from("activity_logs").insert({
    actor_id: actorId,
    action: "request.status_change",
    entity_type: "parking_request",
    entity_id: requestId,
    metadata: { target, finalStatus: result.finalStatus, source: "document_progress" },
  });

  revalidateDocumentProgressPaths(requestId, modes);
  await requestSheetSync(requestId);
  return { ok: true, id: requestId };
}

export async function setOfficerDocumentProgress(
  requestId: string,
  target: DocumentProgressStatus,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("officer");
  return applyDocumentProgress(requestId, target, profile.id, ["officer", "comms", "security"]);
}

export async function setCommsDocumentProgress(
  requestId: string,
  target: DocumentProgressStatus,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("comms");
  return applyDocumentProgress(requestId, target, profile.id, ["officer", "comms", "security"]);
}

export async function setSecurityDocumentProgress(
  requestId: string,
  target: DocumentProgressStatus,
  note?: string,
): Promise<ActionResult> {
  const { profile } = await requireAppMode("security");
  return applyDocumentProgress(requestId, target, profile.id, ["officer", "comms", "security"], {
    completionNote: note?.trim() || undefined,
    assignedTo: target === "assigned" || target === "in_progress" || target === "completed"
      ? profile.id
      : undefined,
  });
}
