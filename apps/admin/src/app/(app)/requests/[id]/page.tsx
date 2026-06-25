import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Paperclip, FileText, ImageIcon, Download } from "lucide-react";
import {
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
  type ProfileRef,
  type Attachment,
} from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { getRequestById } from "@nacc/db/queries";
import {
  formatThaiDate,
  formatThaiDateTime,
  formatTimeRange,
  formatBytes,
  formatPhone,
} from "@nacc/utils";
import { getSignedUrls } from "@/lib/storage";
import { RequestActions } from "@/components/request-actions";
import { AttachmentUploader } from "@/components/attachment-uploader";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const request = await getRequestById(supabase, id);
  if (!request) notFound();

  const [{ data: staff }, { data: history }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,display_name,username,role")
      .eq("role", "security_staff")
      .eq("is_active", true)
      .order("display_name"),
    supabase
      .from("request_status_history")
      .select("id,old_status,new_status,note,created_at,changed_by_profile:profiles!changed_by(display_name)")
      .eq("request_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const attachments = request.request_attachments as Attachment[];
  const signed = await getSignedUrls(attachments.map((a) => a.file_path));

  const grouped = (t: FileType) => attachments.filter((a) => a.file_type === t);

  return (
    <>
      <PageHeader
        title={request.request_no}
        description={request.subject ?? request.official_letter_no}
        actions={
          <Button asChild variant="outline">
            <Link href="/requests">{TH.action.back}</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={request.status} />
        <PriorityBadge priority={request.priority} />
      </div>

      <RequestActions
        id={id}
        status={request.status}
        securityStaff={(staff ?? []) as ProfileRef[]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{TH.entity.officialLetter}</CardTitle></CardHeader>
            <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Info label={TH.entity.officialLetterNo} value={request.official_letter_no} />
              <Info label={TH.entity.requestingDepartment} value={request.department?.name_th} />
              <Info label={TH.entity.letterDate} value={formatThaiDate(request.official_letter_date)} />
              <Info label={TH.entity.receivedDate} value={formatThaiDate(request.received_date)} />
              <Info label={TH.entity.contactName} value={request.contact_name} />
              <Info label={TH.entity.contactPhone} value={formatPhone(request.contact_phone)} />
              <Info label={TH.entity.subject} value={request.subject} className="sm:col-span-2" />
              <Info label={TH.entity.purpose} value={request.purpose} className="sm:col-span-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">รายละเอียดการจอด</CardTitle></CardHeader>
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
                    request.request_dates.map((d) => (
                      <span key={d.id} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm">
                        {formatThaiDate(d.request_date)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {formatTimeRange(d.start_time, d.end_time)}
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
                    request.request_license_plates.map((p) => (
                      <span key={p.id} className="rounded-md border border-border px-2.5 py-1 text-sm font-medium">
                        {p.plate_no}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <AttachmentsCard
            requestId={id}
            officialLetters={grouped("official_letter")}
            general={grouped("general_attachment")}
            completion={grouped("completion_photo")}
            cancellation={grouped("cancellation_evidence")}
            signed={signed}
          />
        </div>

        <div className="space-y-6">
          {(request.assigned_to_profile || request.completed_at || request.cancellation_reason) && (
            <Card>
              <CardHeader><CardTitle className="text-base">ข้อมูลการดำเนินงาน</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <Info label={TH.entity.assignedTo} value={request.assigned_to_profile?.display_name} />
                {request.completion_note ? <Info label="หมายเหตุการส่งงาน" value={request.completion_note} /> : null}
                {request.cancellation_reason ? <Info label={TH.entity.cancellationReason} value={request.cancellation_reason} /> : null}
                {request.admin_note ? <Info label={TH.entity.adminNote} value={request.admin_note} /> : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">ประวัติสถานะ</CardTitle></CardHeader>
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
                              <span className="text-muted-foreground">{STATUS_LABELS_TH[h.old_status as keyof typeof STATUS_LABELS_TH]}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          ) : null}
                          <span className="font-medium">{STATUS_LABELS_TH[h.new_status as keyof typeof STATUS_LABELS_TH]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatThaiDateTime(h.created_at)}
                          {changedBy ? ` • ${changedBy}` : ""}
                        </div>
                        {h.note ? <div className="mt-0.5 text-xs">{h.note}</div> : null}
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

function AttachmentsCard({
  requestId,
  officialLetters,
  general,
  completion,
  cancellation,
  signed,
}: {
  requestId: string;
  officialLetters: Attachment[];
  general: Attachment[];
  completion: Attachment[];
  cancellation: Attachment[];
  signed: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{TH.entity.attachment}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <AttachGroup type="official_letter" items={officialLetters} signed={signed} requestId={requestId} />
        <Separator />
        <AttachGroup type="completion_photo" items={completion} signed={signed} requestId={requestId} />
        <Separator />
        <AttachGroup type="cancellation_evidence" items={cancellation} signed={signed} requestId={requestId} />
        <Separator />
        <AttachGroup type="general_attachment" items={general} signed={signed} requestId={requestId} />
      </CardContent>
    </Card>
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
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{FILE_TYPE_LABELS_TH[type]}</p>
        <AttachmentUploader requestId={requestId} fileType={type} label="แนบไฟล์" />
      </div>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((a) => {
            const url = signed[a.file_path];
            const isImage = a.mime_type?.startsWith("image/");
            return (
              <li key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate">
                  {isImage ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="truncate">{a.file_name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(a.file_size)}</span>
                </span>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Download className="h-4 w-4" /> เปิด
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" /> ยังไม่มีไฟล์
        </p>
      )}
    </div>
  );
}
