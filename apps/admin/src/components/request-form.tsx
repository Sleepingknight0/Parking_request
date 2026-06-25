"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Plus, Trash2, Save, Send, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  ThaiDateInput,
  ThaiTimeInput,
  Textarea,
  Label,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@nacc/ui";
import {
  TH,
  DATE_PATTERNS,
  DATE_PATTERN_LABELS_TH,
  PRIORITIES,
  PRIORITY_LABELS_TH,
  requestFormSchema,
  validateForSubmit,
  type DatePattern,
  type RequestFormInput,
} from "@nacc/types";
import { expandDateRange, todayISO } from "@nacc/utils";
import { createRequest, updateRequest } from "@/lib/request-actions";

type Scalars = {
  department_id: string;
  official_letter_no: string;
  official_letter_date: string;
  received_date: string;
  subject: string;
  contact_name: string;
  contact_phone: string;
  requested_location_id: string;
  requested_location_text: string;
  cars_count: number;
  purpose: string;
  admin_note: string;
  priority: string;
};

interface DateEntry {
  request_date: string;
}
interface PlateEntry {
  plate_no: string;
  vehicle_note: string;
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const SELECT_NONE = "__none__";

export interface RequestFormInitial extends Partial<Scalars> {
  date_pattern?: DatePattern;
  dates?: { request_date: string; start_time?: string | null; end_time?: string | null }[];
  plates?: { plate_no: string; vehicle_note?: string | null }[];
}

export function RequestForm({
  mode,
  requestId,
  departments,
  locations,
  initial,
}: {
  mode: "create" | "edit";
  requestId?: string;
  departments: { id: string; name_th: string }[];
  locations: { id: string; name_th: string }[];
  initial?: RequestFormInitial;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [pattern, setPattern] = React.useState<DatePattern>(initial?.date_pattern ?? "single");

  const initDate = initial?.dates?.[0];
  const [singleDate, setSingleDate] = React.useState(initDate?.request_date ?? todayISO());
  const [multiDates, setMultiDates] = React.useState<DateEntry[]>(
    initial?.dates?.length
      ? initial.dates.map((d) => ({ request_date: d.request_date }))
      : [{ request_date: todayISO() }],
  );
  const [rangeStart, setRangeStart] = React.useState(initDate?.request_date ?? todayISO());
  const [rangeEnd, setRangeEnd] = React.useState(todayISO());
  const [weekdays, setWeekdays] = React.useState<number[]>([1]);
  const [startTime, setStartTime] = React.useState(initDate?.start_time ?? "");
  const [endTime, setEndTime] = React.useState(initDate?.end_time ?? "");
  const [plates, setPlates] = React.useState<PlateEntry[]>(
    initial?.plates?.length
      ? initial.plates.map((p) => ({ plate_no: p.plate_no, vehicle_note: p.vehicle_note ?? "" }))
      : [{ plate_no: "", vehicle_note: "" }],
  );

  const { register, control, handleSubmit } = useForm<Scalars>({
    defaultValues: {
      department_id: initial?.department_id ? initial.department_id : SELECT_NONE,
      official_letter_no: initial?.official_letter_no ?? "",
      official_letter_date: initial?.official_letter_date ?? "",
      received_date: initial?.received_date ?? todayISO(),
      subject: initial?.subject ?? "",
      contact_name: initial?.contact_name ?? "",
      contact_phone: initial?.contact_phone ?? "",
      requested_location_id: initial?.requested_location_id
        ? initial.requested_location_id
        : SELECT_NONE,
      requested_location_text: initial?.requested_location_text ?? "",
      cars_count: initial?.cars_count ?? 1,
      purpose: initial?.purpose ?? "",
      admin_note: initial?.admin_note ?? "",
      priority: initial?.priority ?? "normal",
    },
  });

  function buildDates(): { request_date: string; start_time?: string; end_time?: string }[] {
    let dateStrings: string[] = [];
    if (pattern === "single") dateStrings = [singleDate];
    else if (pattern === "multi") dateStrings = multiDates.map((d) => d.request_date).filter(Boolean);
    else if (pattern === "range") dateStrings = expandDateRange(rangeStart, rangeEnd);
    else if (pattern === "weekly")
      dateStrings = expandDateRange(rangeStart, rangeEnd).filter((d) =>
        weekdays.includes(new Date(d).getDay()),
      );
    const uniq = [...new Set(dateStrings)];
    return uniq.map((request_date) => ({
      request_date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
    }));
  }

  function assemble(values: Scalars): RequestFormInput {
    return {
      ...values,
      department_id: values.department_id === SELECT_NONE ? "" : values.department_id,
      requested_location_id:
        values.requested_location_id === SELECT_NONE ? "" : values.requested_location_id,
      cars_count: Number(values.cars_count),
      date_pattern: pattern,
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
      const errs = validateForSubmit(parsed.data);
      if (errs.length) {
        toast.error(errs[0]);
        return;
      }
    }
    setPending(true);
    try {
      const res =
        mode === "create"
          ? await createRequest(input, submit)
          : await updateRequest(requestId!, input);
      if (!res.ok) {
        toast.error(res.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      toast.success(TH.state.saved);
      router.push(`/requests/${res.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">{TH.entity.officialLetter}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={`${TH.entity.requestingDepartment} *`}>
            <Controller
              control={control}
              name="department_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger><SelectValue placeholder="เลือกสำนัก/หน่วยงาน" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name_th}</SelectItem>
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
            <Input {...register("subject")} placeholder="เรื่องที่ขอใช้ที่จอดรถ" />
          </Field>
          <Field label={TH.entity.contactName}>
            <Input {...register("contact_name")} />
          </Field>
          <Field label={TH.entity.contactPhone}>
            <Input {...register("contact_phone")} inputMode="tel" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">รายละเอียดการขอที่จอด</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={TH.entity.requestedLocation}>
            <Controller
              control={control}
              name="requested_location_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger><SelectValue placeholder="เลือกสถานที่" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>ไม่ระบุ</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name_th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="หรือระบุสถานที่อื่น (อื่นๆ)">
            <Input {...register("requested_location_text")} placeholder="ระบุสถานที่กรณีไม่มีในรายการ" />
          </Field>
          <Field label={TH.entity.carsCount}>
            <Input type="number" min={1} {...register("cars_count", { valueAsNumber: true })} />
          </Field>
          <Field label={TH.entity.priority}>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABELS_TH[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{TH.entity.requestedDate}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label={TH.entity.datePattern}>
            <Select value={pattern} onValueChange={(v) => setPattern(v as DatePattern)}>
              <SelectTrigger className="sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_PATTERNS.map((p) => (
                  <SelectItem key={p} value={p}>{DATE_PATTERN_LABELS_TH[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {pattern === "single" && (
            <Field label="วันที่">
              <ThaiDateInput value={singleDate} onChange={setSingleDate} className="sm:w-60" />
            </Field>
          )}

          {pattern === "multi" && (
            <div className="space-y-2">
              {multiDates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ThaiDateInput
                    value={d.request_date}
                    onChange={(value) =>
                      setMultiDates((prev) => prev.map((x, j) => (j === i ? { request_date: value } : x)))
                    }
                    className="sm:w-60"
                  />
                  <Button type="button" variant="ghost" size="icon"
                    onClick={() => setMultiDates((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1"
                onClick={() => setMultiDates((prev) => [...prev, { request_date: todayISO() }])}>
                <Plus className="h-4 w-4" /> เพิ่มวัน
              </Button>
            </div>
          )}

          {(pattern === "range" || pattern === "weekly") && (
            <div className="flex flex-wrap gap-4">
              <Field label="ตั้งแต่วันที่"><ThaiDateInput value={rangeStart} onChange={setRangeStart} className="sm:w-48" /></Field>
              <Field label="ถึงวันที่"><ThaiDateInput value={rangeEnd} onChange={setRangeEnd} className="sm:w-48" /></Field>
            </div>
          )}

          {pattern === "weekly" && (
            <Field label="เลือกวันในสัปดาห์">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((w, i) => (
                  <button key={i} type="button"
                    onClick={() => setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                    className={`h-9 w-12 rounded-md border text-sm ${weekdays.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {w}
                  </button>
                ))}
              </div>
            </Field>
          )}

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
        <CardHeader><CardTitle className="text-base">{TH.entity.licensePlate}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {plates.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="ทะเบียนรถ" value={p.plate_no}
                onChange={(e) => setPlates((prev) => prev.map((x, j) => (j === i ? { ...x, plate_no: e.target.value } : x)))}
                className="sm:w-48" />
              <Input placeholder="หมายเหตุ (ไม่บังคับ)" value={p.vehicle_note}
                onChange={(e) => setPlates((prev) => prev.map((x, j) => (j === i ? { ...x, vehicle_note: e.target.value } : x)))}
                className="flex-1" />
              <Button type="button" variant="ghost" size="icon"
                onClick={() => setPlates((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-1"
            onClick={() => setPlates((prev) => [...prev, { plate_no: "", vehicle_note: "" }])}>
            <Plus className="h-4 w-4" /> เพิ่มทะเบียน
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">รายละเอียดเพิ่มเติม</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label={TH.entity.purpose}><Textarea {...register("purpose")} rows={3} /></Field>
          <Field label={TH.entity.adminNote}><Textarea {...register("admin_note")} rows={2} /></Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {mode === "create" ? (
          <>
            <Button type="button" variant="outline" disabled={pending} onClick={handleSubmit((v) => onSave(v, false))} className="gap-2">
              <Save className="h-4 w-4" /> {TH.action.saveDraft}
            </Button>
            <Button type="button" disabled={pending} onClick={handleSubmit((v) => onSave(v, true))} className="gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {TH.action.submit}
            </Button>
          </>
        ) : (
          <Button type="button" disabled={pending} onClick={handleSubmit((v) => onSave(v, false))} className="gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {TH.action.save}
          </Button>
        )}
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
