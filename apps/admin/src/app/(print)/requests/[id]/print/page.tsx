import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@nacc/db/server";
import { getRequestById } from "@nacc/db/queries";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  formatThaiDate,
  formatThaiDateLong,
  formatThaiDateTime,
  formatTimeRange,
  formatPhone,
} from "@nacc/utils";
import { ReportDocumentActions } from "@/components/report-document-actions";

export const dynamic = "force-dynamic";

export default async function RequestPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const auto = (Array.isArray(sp.auto) ? sp.auto[0] : sp.auto) === "1";

  const supabase = await createServerSupabase();
  const request = await getRequestById(supabase, id);
  if (!request) notFound();

  const { data: history } = await supabase
    .from("request_status_history")
    .select("id,old_status,new_status,note,created_at,changed_by_profile:profiles!changed_by(display_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const location =
    request.requested_location?.name_th ?? request.requested_location_text ?? "-";

  return (
    <>
      <ReportDocumentActions auto={auto} />

      <div className="mx-auto my-6 max-w-[820px] bg-white shadow-sm print:my-0 print:max-w-none print:shadow-none">
        <article className="official-doc px-10 py-9 text-[13px] leading-relaxed text-slate-900 print:px-0 print:py-0">
          {/* Letterhead */}
          <header className="mb-6 flex items-center gap-4 border-b-2 border-slate-800 pb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 text-xl font-bold">
              ป.
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-bold">
                สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ
              </h1>
              <p className="text-sm text-slate-600">
                ใบคำขอใช้พื้นที่จอดรถ (Parking Request Form)
              </p>
            </div>
          </header>

          {/* Meta line */}
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 text-[12.5px]">
            <div>
              <span className="text-slate-500">เลขที่คำขอ:</span>{" "}
              <span className="font-bold">{request.request_no}</span>
            </div>
            <div>
              <span className="text-slate-500">สถานะ:</span>{" "}
              <span className="font-medium">{STATUS_LABELS_TH[request.status]}</span>
            </div>
            <div>
              <span className="text-slate-500">พิมพ์เมื่อ:</span>{" "}
              <span className="font-medium">{formatThaiDateTime(new Date())} น.</span>
            </div>
          </div>

          {/* Section 1: หนังสือราชการ */}
          <DocSection title="๑. ข้อมูลหนังสือราชการ">
            <Field label="เลขหนังสือ" value={request.official_letter_no} />
            <Field label="สำนัก/หน่วยงานที่ขอ" value={request.department?.name_th} />
            <Field label="วันที่หนังสือ" value={formatThaiDate(request.official_letter_date)} />
            <Field label="วันที่รับหนังสือ" value={formatThaiDate(request.received_date)} />
            <Field label="ผู้ประสานงาน" value={request.contact_name} />
            <Field label="เบอร์ติดต่อ" value={formatPhone(request.contact_phone)} />
            <Field label="เรื่อง" value={request.subject} full />
            <Field label="เหตุผล/รายละเอียด" value={request.purpose} full />
          </DocSection>

          {/* Section 2: รายละเอียดการจอด */}
          <DocSection title="๒. รายละเอียดการขอใช้พื้นที่จอดรถ">
            <Field label="สถานที่ที่ขอจอด" value={location} />
            <Field label="จำนวนรถ" value={`${request.cars_count} คัน`} />
            <div className="col-span-2">
              <p className="text-slate-500">วันและเวลาที่ขอใช้</p>
              {request.request_dates.length ? (
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {request.request_dates.map((d) => (
                    <li key={d.id}>
                      {formatThaiDateLong(d.request_date)}
                      <span className="text-slate-500">
                        {" · "}
                        {formatTimeRange(d.start_time, d.end_time)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">ทะเบียนรถ</p>
              <p className="mt-0.5 font-medium">
                {request.request_license_plates.length
                  ? request.request_license_plates.map((p) => p.plate_no).join(", ")
                  : "-"}
              </p>
            </div>
          </DocSection>

          {/* Section 3: การดำเนินงาน */}
          {(request.assigned_to_profile ||
            request.completed_at ||
            request.cancellation_reason ||
            request.admin_note) && (
            <DocSection title="๓. การดำเนินงาน">
              <Field label="ผู้รับผิดชอบ (รปภ./สื่อสาร)" value={request.assigned_to_profile?.display_name} />
              <Field label="มอบหมายเมื่อ" value={request.assigned_at ? formatThaiDateTime(request.assigned_at) : null} />
              <Field label="ปิดงานเมื่อ" value={request.completed_at ? formatThaiDateTime(request.completed_at) : null} />
              <Field label="หมายเหตุการส่งงาน" value={request.completion_note} />
              <Field label="เหตุผลการยกเลิก" value={request.cancellation_reason} full />
              <Field label="หมายเหตุผู้ดูแล" value={request.admin_note} full />
            </DocSection>
          )}

          {/* Section 4: ประวัติสถานะ */}
          <section className="mb-6 break-inside-avoid">
            <h2 className="mb-2 text-sm font-bold">๔. ประวัติการเปลี่ยนสถานะ</h2>
            {history && history.length ? (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <Th className="w-40">วันเวลา</Th>
                    <Th>การเปลี่ยนสถานะ</Th>
                    <Th className="w-40">ผู้ดำเนินการ</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const by = (h.changed_by_profile as { display_name?: string } | null)?.display_name;
                    const from = h.old_status
                      ? STATUS_LABELS_TH[h.old_status as keyof typeof STATUS_LABELS_TH]
                      : null;
                    const to = STATUS_LABELS_TH[h.new_status as keyof typeof STATUS_LABELS_TH];
                    return (
                      <tr key={h.id} className="border-b border-slate-200 align-top">
                        <Td>{formatThaiDateTime(h.created_at)}</Td>
                        <Td>{from ? `${from} → ${to}` : to}{h.note ? ` (${h.note})` : ""}</Td>
                        <Td>{by ?? "-"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500">ไม่มีประวัติการเปลี่ยนสถานะ</p>
            )}
          </section>

          {/* Signatures */}
          <footer className="mt-12 grid grid-cols-2 gap-8 text-center text-[12.5px]">
            <div>
              <div className="mb-10">ลงชื่อ ...................................................</div>
              <div>( ................................................... )</div>
              <div className="mt-1 text-slate-600">ผู้บันทึก/เจ้าหน้าที่</div>
            </div>
            <div>
              <div className="mb-10">ลงชื่อ ...................................................</div>
              <div>( ................................................... )</div>
              <div className="mt-1 text-slate-600">ผู้อนุมัติ</div>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}

function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`border border-slate-300 px-2 py-1.5 text-left font-semibold ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border border-slate-200 px-2 py-1.5 ${className}`}>{children}</td>;
}
