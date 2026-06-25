"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil } from "lucide-react";
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
  TH,
  type Attachment,
  type FileType,
  type ParkingRequestWithRelations,
  type RequestStatus,
} from "@nacc/types";
import { formatPhone, formatThaiDate, formatTimeRange } from "@nacc/utils";

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

export function OfficerRequestDetailSheet({
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

  React.useEffect(() => {
    if (!open || !requestId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/requests/${requestId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "โหลดรายละเอียดไม่สำเร็จ");
        }
        return res.json() as Promise<DetailPayload>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "โหลดรายละเอียดไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId]);

  const request = data?.request;
  const signed = data?.signed ?? {};
  const attachments = (request?.request_attachments ?? []) as Attachment[];
  const grouped = (type: FileType) => attachments.filter((a) => a.file_type === type);

  const canEdit =
    request &&
    ["draft", "submitted"].includes(request.status) &&
    !request.assigned_to;

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
                {request.assigned_to_profile?.display_name ? (
                  <span className="text-xs text-muted-foreground">
                    ผู้รับผิดชอบ: {request.assigned_to_profile.display_name}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label={TH.entity.requestingDepartment} value={request.department?.name_th} />
                <Info
                  label={TH.entity.requestedLocation}
                  value={request.requested_location?.name_th ?? request.requested_location_text}
                />
                <Info label={TH.entity.letterDate} value={formatThaiDate(request.official_letter_date)} />
                <Info label={TH.entity.receivedDate} value={formatThaiDate(request.received_date)} />
                <Info label={TH.entity.contactName} value={request.contact_name} />
                <Info label={TH.entity.contactPhone} value={formatPhone(request.contact_phone)} />
                <Info label={TH.entity.carsCount} value={`${request.cars_count} คัน`} />
              </div>

              {request.subject ? (
                <Info label={TH.entity.subject} value={request.subject} />
              ) : null}

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

              <AttachmentPreviewSection
                label={FILE_TYPE_LABELS_TH.official_letter}
                items={grouped("official_letter")}
                signedSupabaseUrls={signed}
                emptyMessage="ยังไม่แนบหนังสือราชการ"
              />

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
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-6">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            {canEdit ? (
              <Button asChild variant="outline" className="flex-1 gap-2 sm:flex-none">
                <Link href={`/officer/requests/${request.id}/edit`} onClick={() => onOpenChange(false)}>
                  <Pencil className="h-4 w-4" />
                  {TH.action.edit}
                </Link>
              </Button>
            ) : null}
            <Button asChild className="flex-1 gap-2 sm:flex-none">
              <Link href={`/officer/requests/${request.id}`} onClick={() => onOpenChange(false)}>
                <ExternalLink className="h-4 w-4" />
                เปิดหน้าเต็ม
              </Link>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
