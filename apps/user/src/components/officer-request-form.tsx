"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { FileText, Loader2, Paperclip, Plus, Save, Send, Trash2, Upload, X } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ThaiDateInput,
  ThaiTimeInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@nacc/ui";
import {
  DATE_PATTERNS,
  DATE_PATTERN_LABELS_TH,
  FEATURE_FLAGS,
  TH,
  requestFormSchema,
  validateForSubmit,
  type DatePattern,
  type DocumentProgressStatus,
  type RequestFormInput,
} from "@nacc/types";
import { expandDateRange, todayISO } from "@nacc/utils";
import {
  createOfficerRequest,
  updateOfficerRequest,
  uploadUserAttachment,
} from "@/lib/request-actions";
import { createCommsRequest, uploadCommsAttachment } from "@/lib/comms-actions";
import { setCommsDocumentProgress, setOfficerDocumentProgress } from "@/lib/document-progress-actions";
import { DocumentProgressSelect } from "@nacc/ui";

type Scalars = {
  department_id: string;
  official_letter_no: string;
  official_letter_date: string;
  received_date: string;
  subject: string;
  receiving_officer_id: string;
  contact_name: string;
  contact_phone: string;
  requested_location_id: string;
  requested_location_text: string;
  cars_count: number;
  purpose: string;
};

interface PlateEntry {
  plate_no: string;
  vehicle_note: string;
}

export interface OfficerRequestInitial extends Partial<Scalars> {
  date_pattern?: DatePattern;
  dates?: { request_date: string; start_time?: string | null; end_time?: string | null }[];
  plates?: { plate_no: string; vehicle_note?: string | null }[];
}

export function OfficerRequestForm({
  mode,
  variant = "officer",
  requestId,
  departments,
  locations,
  securityOfficers = [],
  initial,
  existingOfficialLetterCount = 0,
}: {
  mode: "create" | "edit";
  variant?: "officer" | "comms";
  requestId?: string;
  departments: { id: string; name_th: string }[];
  locations: { id: string; name_th: string }[];
  securityOfficers?: { id: string; name_th: string }[];
  initial?: OfficerRequestInitial;
  existingOfficialLetterCount?: number;
}) {
  const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const isComms = variant === "comms";
  const detailPath = isComms ? "/comms/requests" : "/officer/requests";
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [pattern, setPattern] = React.useState<DatePattern>(initial?.date_pattern ?? "single");
  const initDate = initial?.dates?.[0];
  const [singleDate, setSingleDate] = React.useState(initDate?.request_date ?? todayISO());
  const [multiDates, setMultiDates] = React.useState(
    initial?.dates?.length
      ? initial.dates.map((d) => ({ request_date: d.request_date }))
      : [{ request_date: todayISO() }],
  );
  const [rangeStart, setRangeStart] = React.useState(initDate?.request_date ?? todayISO());
  const [rangeEnd, setRangeEnd] = React.useState(initial?.dates?.at(-1)?.request_date ?? todayISO());
  const [weekdays, setWeekdays] = React.useState<number[]>([1]);
  const [startTime, setStartTime] = React.useState(initDate?.start_time ?? "");
  const [endTime, setEndTime] = React.useState(initDate?.end_time ?? "");
  const [plates, setPlates] = React.useState<PlateEntry[]>(
    initial?.plates?.length
      ? initial.plates.map((p) => ({ plate_no: p.plate_no, vehicle_note: p.vehicle_note ?? "" }))
      : [{ plate_no: "", vehicle_note: "" }],
  );
  const [officialFiles, setOfficialFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [documentProgress, setDocumentProgress] =
    React.useState<DocumentProgressStatus>("under_review");

  const { register, control, handleSubmit } = useForm<Scalars>({
    defaultValues: {
      department_id: initial?.department_id ?? "",
      official_letter_no: initial?.official_letter_no ?? "",
      official_letter_date: initial?.official_letter_date ?? "",
      received_date: initial?.received_date ?? todayISO(),
      subject: initial?.subject ?? "",
      receiving_officer_id: initial?.receiving_officer_id ?? "",
      contact_name: initial?.contact_name ?? "",
      contact_phone: initial?.contact_phone ?? "",
      requested_location_id: initial?.requested_location_id ?? "",
      requested_location_text: initial?.requested_location_text ?? "",
      cars_count: initial?.cars_count ?? 1,
      purpose: initial?.purpose ?? "",
    },
  });

  function buildDates() {
    let dates: string[] = [];
    if (pattern === "single") dates = [singleDate];
    if (pattern === "multi") dates = multiDates.map((d) => d.request_date).filter(Boolean);
    if (pattern === "range") dates = expandDateRange(rangeStart, rangeEnd);
    if (pattern === "weekly") {
      dates = expandDateRange(rangeStart, rangeEnd).filter((d) =>
        weekdays.includes(new Date(d).getDay()),
      );
    }
    return [...new Set(dates)].map((request_date) => ({
      request_date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
    }));
  }

  function assemble(values: Scalars): RequestFormInput {
    return {
      ...values,
      cars_count: Number(values.cars_count),
      date_pattern: pattern,
      priority: "normal",
      admin_note: "",
      dates: buildDates(),
      plates: plates
        .filter((p) => p.plate_no.trim())
        .map((p) => ({ plate_no: p.plate_no.trim(), vehicle_note: p.vehicle_note || undefined })),
    } as RequestFormInput;
  }

  async function onSave(values: Scalars, submit: boolean) {
    const input = assemble(values);
    const parsed = requestFormSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? TH.state.required);
      return;
    }
    if (submit) {
      if (
        FEATURE_FLAGS.officialLetterRequired &&
        existingOfficialLetterCount === 0 &&
        officialFiles.length === 0
      ) {
        toast.error("กรุณาแนบรูปหรือไฟล์ PDF ของหนังสือราชการก่อนส่งคำขอ");
        return;
      }
      const errors = validateForSubmit(parsed.data);
      if (errors.length) {
        toast.error(errors[0]);
        return;
      }
    }

    setPending(true);
    try {
      let res;
      if (isComms) {
        if (mode === "edit") {
          toast.error("ยังไม่รองรับแก้ไขคำขอในโหมดสื่อสาร");
          return;
        }
        res = await createCommsRequest(input, submit);
      } else {
        res =
          mode === "create"
            ? await createOfficerRequest(input, submit)
            : await updateOfficerRequest(requestId!, input, submit);
      }
      if (!res.ok) {
        toast.error(res.error ?? "บันทึกไม่สำเร็จ");
        return;
      }

      if (officialFiles.length > 0 && res.id) {
        const uploadFn = isComms ? uploadCommsAttachment : uploadUserAttachment;
        for (const file of officialFiles) {
          const fd = new FormData();
          fd.set("file", file);
          const upload = await uploadFn(res.id, "official_letter", fd);
          if (!upload.ok) {
            toast.error(upload.error ?? "บันทึกข้อมูลแล้ว แต่แนบไฟล์หนังสือไม่สำเร็จ");
            router.push(`${detailPath}/${res.id}`);
            router.refresh();
            return;
          }
        }
      }

      if (submit && res.id && documentProgress !== "under_review") {
        const progressResult = isComms
          ? await setCommsDocumentProgress(res.id, documentProgress)
          : await setOfficerDocumentProgress(res.id, documentProgress);
        if (!progressResult.ok) {
          toast.error(progressResult.error ?? "บันทึกขั้นตอนเอกสารไม่สำเร็จ");
        }
      }

      toast.success(
        submit
          ? isComms
            ? TH.comms.recordSuccess
            : "ส่งคำขอแล้ว"
          : TH.state.saved,
      );
      router.push(`${detailPath}/${res.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TH.entity.officialLetter}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={`${TH.entity.requestingDepartment} *`}>
            <Controller
              control={control}
              name="department_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสำนัก/หน่วยงาน" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label={`${TH.entity.officialLetterNo} *`}>
            <Input {...register("official_letter_no")} placeholder="เช่น ปช 0001/2569" />
          </Field>
          <Field label={TH.entity.letterDate}>
            <Controller
              control={control}
              name="official_letter_date"
              render={({ field }) => (
                <ThaiDateInput value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field label={TH.entity.receivedDate}>
            <Controller
              control={control}
              name="received_date"
              render={({ field }) => (
                <ThaiDateInput value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field label={TH.entity.subject} className="sm:col-span-2">
            <Input {...register("subject")} />
          </Field>
          {isComms ? (
            <Field label={TH.entity.receivingOfficer} className="sm:col-span-2">
              <Controller
                control={control}
                name="receiving_officer_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเจ้าหน้าที่ที่รับเรื่อง" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {securityOfficers.map((officer) => (
                        <SelectItem key={officer.id} value={officer.id}>
                          {officer.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{TH.comms.receivingOfficerHint}</p>
            </Field>
          ) : null}
          {FEATURE_FLAGS.contactFields ? (
            <>
              <Field label={TH.entity.contactName}>
                <Input {...register("contact_name")} />
              </Field>
              <Field label={TH.entity.contactPhone}>
                <Input {...register("contact_phone")} inputMode="tel" />
              </Field>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายละเอียดการขอที่จอด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={TH.entity.requestedLocation}>
            <Controller
              control={control}
              name="requested_location_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานที่" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name_th}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="หรือระบุสถานที่อื่น">
            <Input {...register("requested_location_text")} />
          </Field>
          <Field label={TH.entity.carsCount}>
            <Input type="number" min={1} {...register("cars_count", { valueAsNumber: true })} />
          </Field>
          <Field label={TH.entity.purpose} className="sm:col-span-2">
            <Textarea {...register("purpose")} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TH.entity.requestedDate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={TH.entity.datePattern}>
            <Select value={pattern} onValueChange={(value) => setPattern(value as DatePattern)}>
              <SelectTrigger className="sm:w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PATTERNS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {DATE_PATTERN_LABELS_TH[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {pattern === "single" ? (
            <Field label="วันที่">
              <ThaiDateInput
                value={singleDate}
                onChange={setSingleDate}
                className="sm:w-60"
              />
            </Field>
          ) : null}

          {pattern === "multi" ? (
            <div className="space-y-2">
              {multiDates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ThaiDateInput
                    value={date.request_date}
                    onChange={(value) =>
                      setMultiDates((prev) =>
                        prev.map((d, i) => (i === index ? { request_date: value } : d)),
                      )
                    }
                    className="sm:w-60"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMultiDates((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setMultiDates((prev) => [...prev, { request_date: todayISO() }])}
              >
                <Plus className="h-4 w-4" />
                เพิ่มวัน
              </Button>
            </div>
          ) : null}

          {pattern === "range" || pattern === "weekly" ? (
            <div className="flex flex-wrap gap-4">
              <Field label="ตั้งแต่วันที่">
                <ThaiDateInput
                  value={rangeStart}
                  onChange={setRangeStart}
                  className="sm:w-48"
                />
              </Field>
              <Field label="ถึงวันที่">
                <ThaiDateInput
                  value={rangeEnd}
                  onChange={setRangeEnd}
                  className="sm:w-48"
                />
              </Field>
            </div>
          ) : null}

          {pattern === "weekly" ? (
            <Field label="เลือกวันในสัปดาห์">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setWeekdays((prev) =>
                        prev.includes(index)
                          ? prev.filter((value) => value !== index)
                          : [...prev, index],
                      )
                    }
                    className={`h-9 w-12 rounded-md border text-sm ${
                      weekdays.includes(index)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <Field label={TH.entity.startTime}>
              <ThaiTimeInput value={startTime} onChange={setStartTime} />
            </Field>
            <Field label={TH.entity.endTime}>
              <ThaiTimeInput value={endTime} onChange={setEndTime} />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            เวลาแบบ 24 ชั่วโมง (เช่น 14.30 น.) ไม่ใช้ AM/PM
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TH.entity.licensePlate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {plates.map((plate, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="ทะเบียนรถ"
                value={plate.plate_no}
                onChange={(e) =>
                  setPlates((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, plate_no: e.target.value } : p)),
                  )
                }
                className="sm:w-48"
              />
              <Input
                placeholder="หมายเหตุ"
                value={plate.vehicle_note}
                onChange={(e) =>
                  setPlates((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, vehicle_note: e.target.value } : p)),
                  )
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPlates((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPlates((prev) => [...prev, { plate_no: "", vehicle_note: "" }])}
          >
            <Plus className="h-4 w-4" />
            เพิ่มทะเบียน
          </Button>
        </CardContent>
      </Card>

      {FEATURE_FLAGS.officialLetterAttachments ? (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Paperclip className="h-4 w-4 text-blue-700" />
              แนบรูปหรือไฟล์หนังสือราชการ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">
              {isComms
                ? TH.comms.recordHint
                : "แนบรูปถ่ายหนังสือหรือไฟล์ PDF/DOC เพื่อให้ฝ่ายสื่อสารตรวจสอบที่มาของคำขอได้"}
            </p>
            {existingOfficialLetterCount > 0 ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                มีไฟล์หนังสือราชการแนบอยู่แล้ว {existingOfficialLetterCount} ไฟล์
              </p>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setOfficialFiles((prev) => [...prev, ...files]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2 bg-white"
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                เลือกไฟล์หนังสือ
              </Button>
              <span className="text-xs text-muted-foreground">
                รองรับ PDF, JPG, PNG, WebP, DOC, DOCX
              </span>
            </div>

            {officialFiles.length ? (
              <ul className="space-y-2">
                {officialFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() =>
                        setOfficialFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isComms
                  ? "ต้องแนบไฟล์หนังสือราชการก่อนบันทึกและส่งให้ รปภ."
                  : "ถ้ากดส่งคำขอ ระบบจะบังคับให้แนบไฟล์หนังสือราชการอย่างน้อย 1 ไฟล์"}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {mode === "create" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ขั้นตอนเอกสารก่อนส่ง</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentProgressSelect
              value={documentProgress}
              onValueChange={setDocumentProgress}
              disabled={pending}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              เลือกว่าเอกสารนี้อยู่ในขั้นตอนใดก่อนส่งเข้าระบบ (ค่าเริ่มต้น: รออนุมัติ)
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!isComms ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleSubmit((values) => onSave(values, false))}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {TH.action.saveDraft}
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={pending}
          onClick={handleSubmit((values) => onSave(values, true))}
          className="gap-2"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isComms ? TH.comms.recordAndSend : TH.action.submit}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
