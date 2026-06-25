import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, FileText, ImageIcon } from "lucide-react";
import {
  CompletionPhotoGallery,
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  PriorityBadge,
  Separator,
} from "@nacc/ui";
import {
  TH,
  STATUS_LABELS_TH,
  FILE_TYPE_LABELS_TH,
  type FileType,
  type Attachment,
} from "@nacc/types";
import { createServiceClient } from "@nacc/db/service";
import { getCommsRequestById } from "@/lib/comms-data";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatTimeRange,
  formatBytes,
  formatPhone,
  resolveAttachmentViewUrl,
} from "@nacc/utils";
import { getSignedUrls } from "@/lib/storage";
import { CommsAttachmentUploader } from "@/components/comms-attachment-uploader";

export const dynamic = "force-dynamic";

export default async function CommsRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getCommsRequestById(id);
  if (!request || request.status === "draft") notFound();

  const svc = createServiceClient();
  const { data: history } = await svc
    .from("request_status_history")
    .select("id,old_status,new_status,note,created_at,changed_by_profile:profiles!changed_by(display_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const attachments = request.request_attachments as Attachment[];
  const signed = await getSignedUrls(attachments);
  const grouped = (t: FileType) => attachments.filter((a) => a.file_type === t);

  return (
    <>
      <PageHeader
        title={request.request_no}
        description={request.subject ?? request.official_letter_no}
        actions={
          <Button asChild variant="outline">
            <Link href="/comms/requests">{TH.action.back}</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={request.status} />
        <PriorityBadge priority={request.priority} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TH.entity.officialLetter}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Info label={TH.entity.officialLetterNo} value={request.official_letter_no} />
              <Info label={TH.entity.requestingDepartment} value={request.department?.name_th} />
              <Info label={TH.entity.letterDate} value={formatThaiDate(request.official_letter_date)} />
              <Info label={TH.entity.receivedDate} value={formatThaiDate(request.received_date)} />
              <Info label={TH.entity.contactName} value={request.contact_name} />
              <Info label={TH.entity.contactPhone} value={formatPhone(request.contact_phone)} />
              <Info label={TH.entity.subject} value={request.subject} className="sm:col-span-2" />
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
                  {request.request_dates.map((d) => (
                    <span key={d.id} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm">
                      {formatThaiDate(d.request_date)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {formatTimeRange(d.start_time, d.end_time)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TH.entity.attachment}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <AttachGroup type="official_letter" items={grouped("official_letter")} signed={signed} requestId={id} />
              <Separator />
              <AttachGroup type="general_attachment" items={grouped("general_attachment")} signed={signed} requestId={id} />
              <Separator />
              <div>
                <p className="mb-3 text-sm font-medium">{FILE_TYPE_LABELS_TH.completion_photo}</p>
                <CompletionPhotoGallery items={grouped("completion_photo")} signedSupabaseUrls={signed} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลการดำเนินงาน</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Info label={TH.entity.assignedTo} value={request.assigned_to_profile?.display_name} />
              <Info label={TH.entity.status} value={STATUS_LABELS_TH[request.status]} />
              {request.admin_note ? <Info label={TH.entity.adminNote} value={request.admin_note} /> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ประวัติสถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {(history ?? []).map((h) => {
                  const changedBy = (h.changed_by_profile as { display_name?: string } | null)?.display_name;
                  return (
                    <li key={h.id} className="flex gap-3">
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      <div className="text-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {h.old_status ? (
                            <>
                              <span className="text-muted-foreground">
                                {STATUS_LABELS_TH[h.old_status as keyof typeof STATUS_LABELS_TH]}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          ) : null}
                          <span className="font-medium">
                            {STATUS_LABELS_TH[h.new_status as keyof typeof STATUS_LABELS_TH]}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatThaiDateTime(h.created_at)}
                          {changedBy ? ` · ${changedBy}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
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
  requestId,
}: {
  type: FileType;
  items: Attachment[];
  signed: Record<string, string>;
  requestId: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{FILE_TYPE_LABELS_TH[type]}</p>
        <CommsAttachmentUploader requestId={requestId} fileType={type} label="แนบไฟล์" />
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((a) => {
            const url = resolveAttachmentViewUrl(a, signed);
            const isImage = a.mime_type?.startsWith("image/");
            return (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  {isImage ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{a.file_name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(a.file_size)}</span>
                </span>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> เปิด
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">ยังไม่มีไฟล์</p>
      )}
    </div>
  );
}
