"use client";

import Link from "next/link";
import { Download, FileText, Table2 } from "lucide-react";
import { Button } from "@nacc/ui";
import { STATUS_LABELS_TH, type ParkingRequestListItem } from "@nacc/types";
import { toCsv, downloadFile, formatThaiDate } from "@nacc/utils";
import type { ReportSummary } from "@/lib/report-summary";

export function ReportExport({
  rows,
  printHref,
  summary,
}: {
  rows: ParkingRequestListItem[];
  printHref: string;
  summary: ReportSummary;
}) {
  function handleDetailExport() {
    const csv = toCsv(rows, [
      { header: "เลขที่คำขอ", value: (r) => r.request_no },
      { header: "เลขหนังสือ", value: (r) => r.official_letter_no },
      { header: "สำนัก/หน่วยงาน", value: (r) => r.department?.name_th ?? "" },
      { header: "วันที่รับหนังสือ", value: (r) => (r.received_date ? formatThaiDate(r.received_date) : "") },
      { header: "วันที่จอด", value: (r) => (r.request_dates?.[0] ? formatThaiDate(r.request_dates[0].request_date) : "") },
      { header: "สถานที่", value: (r) => r.requested_location?.name_th ?? r.requested_location_text ?? "" },
      { header: "จำนวนรถ", value: (r) => r.cars_count },
      { header: "สถานะ", value: (r) => STATUS_LABELS_TH[r.status] },
      { header: "ผู้รับผิดชอบ", value: (r) => r.assigned_to_profile?.display_name ?? "" },
    ]);
    downloadFile(csv, `report-detail-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleSummaryExport() {
    const sections: string[] = [];

    const section = (title: string, items: { label: string; count: number; cars: number }[]) => {
      sections.push(title);
      sections.push("หมวด,จำนวนคำขอ,จำนวนรถ");
      for (const item of items) {
        sections.push(`"${item.label.replace(/"/g, '""')}",${item.count},${item.cars}`);
      }
      sections.push("");
    };

    section("สรุปตามสถานะ", summary.byStatus.map((r) => ({ label: r.label, count: r.count, cars: r.cars })));
    section("สรุปตามสำนัก/หน่วยงาน", summary.byDept);
    section("สรุปรายวัน", summary.byDay);
    section("สรุปรายสัปดาห์", summary.byWeek);
    section("สรุปรายเดือน", summary.byMonth);
    section("สรุปตามสถานที่", summary.byLocation);

    downloadFile(
      `\uFEFF${sections.join("\n")}`,
      `report-summary-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
      <Button asChild className="w-full gap-2 sm:w-auto">
        <Link href={printHref} target="_blank">
          <FileText className="h-4 w-4" /> หนังสือราชการ / PDF
        </Link>
      </Button>
      <Button onClick={handleDetailExport} variant="outline" className="w-full gap-2 sm:w-auto">
        <Download className="h-4 w-4" /> ส่งออกรายละเอียด CSV
      </Button>
      <Button onClick={handleSummaryExport} variant="outline" className="w-full gap-2 sm:w-auto">
        <Table2 className="h-4 w-4" /> ส่งออกสรุป CSV
      </Button>
    </div>
  );
}
