import type { ReactNode } from "react";
import { createServerSupabase } from "@nacc/db/server";
import { STATUS_LABELS_TH } from "@nacc/types";
import {
  formatThaiDate,
  formatThaiDateLong,
  formatThaiDateTime,
  formatTimeRange,
} from "@nacc/utils";
import {
  parseReportFilters,
  fetchReportRows,
  buildReportSummary,
  type Breakdown,
} from "@/lib/report-summary";
import { ReportDocumentActions } from "@/components/report-document-actions";

export const dynamic = "force-dynamic";

export default async function ReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseReportFilters(sp);
  const auto = (Array.isArray(sp.auto) ? sp.auto[0] : sp.auto) === "1";

  const supabase = await createServerSupabase();
  const rows = await fetchReportRows(supabase, filters);
  const summary = buildReportSummary(rows);

  // Resolve the filtered department name (for the document header).
  let deptName: string | null = null;
  if (filters.departmentId) {
    const { data } = await supabase
      .from("departments")
      .select("name_th")
      .eq("id", filters.departmentId)
      .maybeSingle();
    deptName = (data as { name_th: string } | null)?.name_th ?? null;
  }

  const filterParts: string[] = [];
  if (filters.dateFrom || filters.dateTo) {
    const a = filters.dateFrom ? formatThaiDateLong(filters.dateFrom) : "เริ่มต้น";
    const b = filters.dateTo ? formatThaiDateLong(filters.dateTo) : "ปัจจุบัน";
    filterParts.push(`ช่วงวันที่รับหนังสือ ${a} ถึง ${b}`);
  } else if (summary.receivedFrom && summary.receivedTo) {
    filterParts.push(
      `ช่วงวันที่รับหนังสือ ${formatThaiDateLong(summary.receivedFrom)} ถึง ${formatThaiDateLong(summary.receivedTo)}`,
    );
  }
  if (deptName) filterParts.push(`เฉพาะสำนัก/หน่วยงาน: ${deptName}`);
  if (filters.status) filterParts.push(`เฉพาะสถานะ: ${STATUS_LABELS_TH[filters.status]}`);

  const detail = [...rows].sort((a, b) => {
    const ra = a.received_date ?? "9999";
    const rb = b.received_date ?? "9999";
    if (ra !== rb) return ra.localeCompare(rb);
    return (a.request_no ?? "").localeCompare(b.request_no ?? "");
  });

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
                รายงานสรุปคำขอใช้พื้นที่จอดรถ (Parking Request Summary Report)
              </p>
            </div>
          </header>

          {/* Meta */}
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
            <div>
              <span className="text-slate-500">จัดทำ ณ วันที่:</span>{" "}
              <span className="font-medium">{formatThaiDateTime(new Date())} น.</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">จำนวนคำขอในรายงาน:</span>{" "}
              <span className="font-medium">{summary.total.toLocaleString("th-TH")} คำขอ</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">ขอบเขตข้อมูล:</span>{" "}
              <span className="font-medium">
                {filterParts.length ? filterParts.join(" · ") : "คำขอทั้งหมดในระบบ"}
              </span>
            </div>
          </div>

          {/* Narrative */}
          <p className="mb-6 indent-10 text-justify">
            ตามที่สำนักงานได้รับคำขอใช้พื้นที่จอดรถผ่านระบบบริหารจัดการคำขอที่จอดรถ
            ในขอบเขตข้อมูลข้างต้น ปรากฏว่ามีคำขอรวมทั้งสิ้น{" "}
            <strong>{summary.total.toLocaleString("th-TH")}</strong> คำขอ
            คิดเป็นจำนวนรถที่ขอใช้พื้นที่รวม{" "}
            <strong>{summary.totalCars.toLocaleString("th-TH")}</strong> คัน
            โดยดำเนินการแล้วเสร็จ <strong>{summary.completed.toLocaleString("th-TH")}</strong> คำขอ
            อยู่ระหว่างดำเนินการ <strong>{summary.inProgress.toLocaleString("th-TH")}</strong> คำขอ
            รอดำเนินการ <strong>{summary.pending.toLocaleString("th-TH")}</strong> คำขอ
            และยกเลิก <strong>{summary.cancelled.toLocaleString("th-TH")}</strong> คำขอ
            รายละเอียดจำแนกตามหมวดหมู่ปรากฏตามตารางดังต่อไปนี้
          </p>

          <DocTable title="ตารางที่ ๑ สรุปตามสถานะคำขอ" firstCol="สถานะ" rows={summary.byStatus} />
          <DocTable title="ตารางที่ ๒ สรุปตามสำนัก/หน่วยงาน" firstCol="สำนัก/หน่วยงาน" rows={summary.byDept} />
          <DocTable title="ตารางที่ ๓ สรุปรายวัน (วันที่รับหนังสือ)" firstCol="วันที่" rows={summary.byDay} />
          <DocTable title="ตารางที่ ๔ สรุปรายสัปดาห์" firstCol="ช่วงสัปดาห์" rows={summary.byWeek} />
          <DocTable title="ตารางที่ ๕ สรุปรายเดือน" firstCol="เดือน" rows={summary.byMonth} />
          <DocTable title="ตารางที่ ๖ สรุปตามสถานที่จอด" firstCol="สถานที่" rows={summary.byLocation} />

          {/* Detail listing */}
          <section className="mt-6">
            <h2 className="mb-2 text-sm font-bold">ตารางที่ ๗ รายละเอียดคำขอทั้งหมด</h2>
            {detail.length ? (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <Th className="w-8 text-center">ลำดับ</Th>
                    <Th>เลขที่คำขอ / เลขหนังสือ</Th>
                    <Th>สำนัก/หน่วยงาน</Th>
                    <Th className="w-24">วันที่รับ</Th>
                    <Th>วันที่/เวลาจอด</Th>
                    <Th className="w-10 text-center">รถ</Th>
                    <Th className="w-24">สถานะ</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.map((r, i) => {
                    const first = r.request_dates?.[0];
                    return (
                      <tr key={r.id} className="border-b border-slate-200 align-top">
                        <Td className="text-center">{i + 1}</Td>
                        <Td>
                          <div className="font-medium">{r.request_no}</div>
                          <div className="text-slate-500">{r.official_letter_no || "-"}</div>
                        </Td>
                        <Td>{r.department?.name_th ?? "-"}</Td>
                        <Td>{r.received_date ? formatThaiDate(r.received_date) : "-"}</Td>
                        <Td>
                          {first ? (
                            <>
                              <div>{formatThaiDate(first.request_date)}</div>
                              <div className="text-slate-500">
                                {formatTimeRange(first.start_time, first.end_time)}
                              </div>
                            </>
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td className="text-center tabular-nums">{r.cars_count}</Td>
                        <Td>{STATUS_LABELS_TH[r.status]}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="py-4 text-center text-slate-500">ไม่มีข้อมูลคำขอในขอบเขตที่เลือก</p>
            )}
          </section>

          {/* Signature */}
          <footer className="mt-12 flex justify-end">
            <div className="w-64 text-center text-[12.5px]">
              <div className="mb-10">ลงชื่อ ...........................................................</div>
              <div>( ........................................................... )</div>
              <div className="mt-1 text-slate-600">ผู้จัดทำรายงาน</div>
              <div className="mt-1 text-slate-600">
                วันที่ ............ / ............ / ............
              </div>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}

function DocTable({
  title,
  firstCol,
  rows,
}: {
  title: string;
  firstCol: string;
  rows: Breakdown[];
}) {
  const totalCount = rows.reduce((a, r) => a + r.count, 0);
  const totalCars = rows.reduce((a, r) => a + r.cars, 0);
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      {rows.length ? (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <Th>{firstCol}</Th>
              <Th className="w-32 text-right">จำนวนคำขอ</Th>
              <Th className="w-32 text-right">จำนวนรถ (คัน)</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-200">
                <Td>{r.label}</Td>
                <Td className="text-right tabular-nums">{r.count.toLocaleString("th-TH")}</Td>
                <Td className="text-right tabular-nums">{r.cars.toLocaleString("th-TH")}</Td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-400 bg-slate-50 font-semibold">
              <Td>รวมทั้งสิ้น</Td>
              <Td className="text-right tabular-nums">{totalCount.toLocaleString("th-TH")}</Td>
              <Td className="text-right tabular-nums">{totalCars.toLocaleString("th-TH")}</Td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="text-slate-500">ไม่มีข้อมูล</p>
      )}
    </section>
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
