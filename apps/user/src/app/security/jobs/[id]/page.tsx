import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, ImageIcon, Paperclip } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CompletionPhotoGallery,
  PageHeader,
  Separator,
} from "@nacc/ui";
import {
  FILE_TYPE_LABELS_TH,
  FEATURE_FLAGS,
  TH,
  type Attachment,
  type FileType,
} from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { getRequestById } from "@nacc/db/queries";
import {
  formatBytes,
  formatPhone,
  formatThaiDate,
  formatTimeRange,
  resolveAttachmentViewUrl,
} from "@nacc/utils";
import { SecurityJobActions } from "@/components/security-job-actions";
import { SecurityStatusBadge } from "@/components/security-status-badge";
import { SecuritySignMethodBadge } from "@/components/security-sign-method-badge";
import { SecuritySignExamplesPanel } from "@/components/security-sign-examples-panel";
import { CompletionPhotoUploader } from "@/components/completion-photo-uploader";
import { UserAttachmentUploader } from "@/components/user-attachment-uploader";
import { requireAppMode } from "@/lib/user-guards";
import { getSignedUrls } from "@/lib/storage";
import { todayIsoLocal } from "@/lib/date-iso";
import type { SecurityJobRow } from "@/lib/security-job-utils";

export const dynamic = "force-dynamic";

export default async function SecurityJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAppMode("security");
  const { id } = await params;
  const supabase = getUserAppDb();
  const request = await getRequestById(supabase, id);
  if (!request) notFound();

  const attachments = request.request_attachments as Attachment[];
  const signed = await getSignedUrls(attachments);
  const completionPhotos = attachments.filter((a) => a.file_type === "completion_photo");
  const grouped = (type: FileType) => attachments.filter((a) => a.file_type === type);
  const assignedToMe = request.assigned_to === profile.id;
  const today = todayIsoLocal();
  const jobRow = request as unknown as SecurityJobRow;
  const uploaderById: Record<string, string> = {};
  if (request.assigned_to_profile?.id) {
    uploaderById[request.assigned_to_profile.id] = request.assigned_to_profile.display_name;
  }

  return (
    <>
      <PageHeader
        title={request.request_no}
        description={request.subject ?? request.official_letter_no}
        actions={
          <Button asChild variant="outline">
            <Link href="/security/jobs">{TH.action.back}</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SecurityStatusBadge status={request.status} />
        <SecuritySignMethodBadge job={jobRow} />
        <SecurityJobActions job={jobRow} todayIso={today} assignedToMe={assignedToMe} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TH.entity.officialLetter}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Info label={TH.entity.officialLetterNo} value={request.official_letter_no} />
              <Info label={TH.entity.department} value={request.department?.name_th} />
              <Info label={TH.entity.letterDate} value={formatThaiDate(request.official_letter_date)} />
              <Info label={TH.entity.receivedDate} value={formatThaiDate(request.received_date)} />
              {FEATURE_FLAGS.contactFields ? (
                <>
                  <Info label={TH.entity.contactName} value={request.contact_name} />
                  <Info label={TH.entity.contactPhone} value={formatPhone(request.contact_phone)} />
                </>
              ) : null}
              <Info label={TH.entity.subject} value={request.subject} className="sm:col-span-2" />
              <Info
                label={TH.entity.receivingOfficer}
                value={request.receiving_officer?.name_th ?? request.legacy_officer_name}
                className="sm:col-span-2"
              />
              <Info label={TH.entity.purpose} value={request.purpose} className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">รายละเอียดการจอด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Info
                  label={TH.entity.requestedLocation}
                  value={request.requested_location?.name_th ?? request.requested_location_text}
                />
                <Info label={TH.entity.carsCount} value={`${request.cars_count} คัน`} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted-foreground">{TH.entity.requestedDate}</p>
                <div className="flex flex-wrap gap-2">
                  {request.request_dates.length ? (
                    request.request_dates.map((date) => (
                      <span key={date.id} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm">
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
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted-foreground">{TH.entity.licensePlate}</p>
                <div className="flex flex-wrap gap-2">
                  {request.request_license_plates.length ? (
                    request.request_license_plates.map((plate) => (
                      <span key={plate.id} className="rounded-md border border-border px-2.5 py-1 text-sm font-medium">
                        {plate.plate_no}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TH.entity.attachment}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <AttachGroup type="official_letter" items={grouped("official_letter")} signed={signed} />
              <Separator />
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{TH.entity.completionPhoto}</p>
                  {assignedToMe && request.status === "in_progress" ? (
                    <CompletionPhotoUploader requestId={id} />
                  ) : null}
                </div>
                <CompletionPhotoGallery
                  items={completionPhotos}
                  signedSupabaseUrls={signed}
                  uploaderById={uploaderById}
                />
              </div>
              <Separator />
              <AttachGroup
                type="cancellation_evidence"
                items={grouped("cancellation_evidence")}
                signed={signed}
                upload={
                  assignedToMe && ["assigned", "in_progress"].includes(request.status) ? (
                    <UserAttachmentUploader requestId={id} fileType="cancellation_evidence" label="แนบหลักฐานยกเลิก" />
                  ) : undefined
                }
              />
              <Separator />
              <AttachGroup type="general_attachment" items={grouped("general_attachment")} signed={signed} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SecuritySignExamplesPanel job={jobRow} todayIso={today} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลงาน</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Info label={TH.entity.assignedTo} value={request.assigned_to_profile?.display_name} />
              <Info label="หมายเหตุการส่งงาน" value={request.completion_note} />
              <Info label={TH.entity.cancellationReason} value={request.cancellation_reason} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

function AttachGroup({
  type,
  items,
  signed,
  upload,
}: {
  type: FileType;
  items: Attachment[];
  signed: Record<string, string>;
  upload?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{FILE_TYPE_LABELS_TH[type]}</p>
        {upload}
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((attachment) => {
            const url = resolveAttachmentViewUrl(attachment, signed);
            const isImage = attachment.mime_type?.startsWith("image/");
            return (
              <li key={attachment.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {isImage ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="truncate">{attachment.file_name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(attachment.file_size)}</span>
                </span>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Download className="h-4 w-4" />
                    เปิด
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          ยังไม่มีไฟล์
        </p>
      )}
    </div>
  );
}
