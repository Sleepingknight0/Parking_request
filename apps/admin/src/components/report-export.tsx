"use client";

import { Download } from "lucide-react";
import { Button } from "@nacc/ui";
import { STATUS_LABELS_TH, type ParkingRequestListItem } from "@nacc/types";
import { toCsv, downloadFile, formatThaiDate } from "@nacc/utils";

export function ReportExport({ rows }: { rows: ParkingRequestListItem[] }) {
  function handleExport() {
    const csv = toCsv(rows, [
      { header: "เลขที่คำขอ", value: (r) => r.request_no },
      { header: "เลขหนังสือ", value: (r) => r.official_letter_no },
      { header: "สำนัก", value: (r) => r.department?.name_th ?? "" },
      { header: "วันที่จอด", value: (r) => (r.request_dates?.[0] ? formatThaiDate(r.request_dates[0].request_date) : "") },
      { header: "จำนวนรถ", value: (r) => r.cars_count },
      { header: "สถานะ", value: (r) => STATUS_LABELS_TH[r.status] },
      { header: "ผู้รับผิดชอบ", value: (r) => r.assigned_to_profile?.display_name ?? "" },
    ]);
    downloadFile(csv, `report-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <Button onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" /> ส่งออก CSV ทั้งหมด
    </Button>
  );
}
