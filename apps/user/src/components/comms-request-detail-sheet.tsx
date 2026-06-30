"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ChevronRight } from "lucide-react";
import {
  AttachmentPreviewGallery,
  AttachmentPreviewSection,
  Button,
  CompletionPhotoGallery,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  StatusBadge,
} from "@nacc/ui";
import {
  FILE_TYPE_LABELS_TH,
  FEATURE_FLAGS,
  TH,
  type Attachment,
  type FileType,
  type ParkingRequestWithRelations,
  type RequestStatus,
} from "@nacc/types";
import { formatPhone, formatThaiDate, formatTimeRange } from "@nacc/utils";
import { CommsAttachmentUploader } from "./comms-attachment-uploader";
import { CommsRequestActions } from "./comms-request-actions";
import { CommsVerificationBadge } from "./comms-verification-badge";

type DetailPayload = {
  request: ParkingRequestWithRelations;
  signed: Record<string, string>;
};

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

export function CommsRequestDetailSheet({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DetailPayload | null>(null);

  const reload = React.useCallback(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/comms/requests/${requestId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "โหลดรายละเอียดไม่สำเร็จ");
        }
        return res.json() as Promise<DetailPayload>;
      })
      .then((payload) => setData(payload))
      .catch((err: unknown) => {
        setData(null);
        setError(err instanceof Error ? err.message : "โหลดรายละเอียดไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  React.useEffect(() => {
    if (!open || !requestId) return;
    reload();
  }, [open, requestId, reload]);

  const request = data?.request;
  const signed = data?.signed ?? {};
  const attachments = (request?.request_attachments ?? []) as Attachment[];
  const grouped = (type: FileType) => attachments.filter((a) => a.file_type === type);
  const officialLetterCount = grouped("official_letter").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {request?.official_letter_no ?? "รายละเอียดคำขอ"}
          </DialogTitle>
          {request ? (
            <p className="text-sm font-normal text-muted-foreground">
              {request.subject ?? request.request_no}
            </p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังโหลด...
            </div>
          ) : error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : request ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={request.status as RequestStatus} />
                <CommsVerificationBadge request={request} />
              </div>

              <CommsRequestActions
                request={request}
                officialLetterCount={officialLetterCount}
                onActionComplete={reload}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label={TH.entity.requestingDepartment} value={request.department?.name_th} />
                <Info
                  label={TH.entity.requestedLocation}
                  value={request.requested_location?.name_th ?? request.requested_location_text}
                />
                <Info label={TH.entity.letterDate} value={formatThaiDate(request.official_letter_date)} />
                <Info label={TH.entity.receivedDate} value={formatThaiDate(request.received_date)} />
                {FEATURE_FLAGS.contactFields ? (
                  <>
                    <Info label={TH.entity.contactName} value={request.contact_name} />
                    <Info label={TH.entity.contactPhone} value={formatPhone(request.contact_phone)} />
                  </>
                ) : null}
                <Info label={TH.entity.carsCount} value={`${request.cars_count} คัน`} />
                <Info label={TH.entity.assignedTo} value={request.assigned_to_profile?.display_name} />
              </div>

              {request.subject ? <Info label={TH.entity.subject} value={request.subject} /> : null}

              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">{TH.entity.requestedDate}</p>
                <div className="flex flex-wrap gap-2">
                  {request.request_dates.length ? (
                    request.request_dates.map((date) => (
                      <span
                        key={date.id}
                        className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm"
                      >
                        {formatThaiDate(date.request_date)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {formatTimeRange(date.start_time, date.end_time)}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {request.request_license_plates.length ? (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">{TH.entity.licensePlate}</p>
                  <div className="flex flex-wrap gap-2">
                    {request.request_license_plates.map((plate) => (
                      <span
                        key={plate.id}
                        className="rounded-md border border-border px-2.5 py-1 text-sm font-medium"
                      >
                        {plate.plate_no}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <Separator />

              {FEATURE_FLAGS.officialLetterAttachments ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{FILE_TYPE_LABELS_TH.official_letter}</p>
                    <CommsAttachmentUploader
                      requestId={request.id}
                      fileType="official_letter"
                      label="แนบหนังสือ"
                      onUploaded={reload}
                    />
                  </div>
                  <AttachmentPreviewSection
                    label=""
                    items={grouped("official_letter")}
                    signedSupabaseUrls={signed}
                    emptyMessage="ยังไม่แนบหนังสือราชการ"
                  />
                </div>
              ) : null}

              {grouped("general_attachment").length ? (
                <AttachmentPreviewSection
                  label={FILE_TYPE_LABELS_TH.general_attachment}
                  items={grouped("general_attachment")}
                  signedSupabaseUrls={signed}
                />
              ) : null}

              {grouped("completion_photo").length ? (
                <div>
                  <p className="mb-2 text-sm font-medium">{FILE_TYPE_LABELS_TH.completion_photo}</p>
                  <CompletionPhotoGallery
                    items={grouped("completion_photo")}
                    signedSupabaseUrls={signed}
                  />
                </div>
              ) : null}

              {grouped("cancellation_evidence").length ? (
                <AttachmentPreviewGallery
                  items={grouped("cancellation_evidence")}
                  signedSupabaseUrls={signed}
                  dialogTitle={FILE_TYPE_LABELS_TH.cancellation_evidence}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {request ? (
          <div className="flex shrink-0 gap-2 border-t border-border px-4 py-3 sm:px-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/comms/requests/${request.id}`} onClick={() => onOpenChange(false)}>
                เปิดหน้าเต็ม
              </Link>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
