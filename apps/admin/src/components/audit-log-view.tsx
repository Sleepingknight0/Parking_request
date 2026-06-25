"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nacc/ui";
import { ROLE_LABELS_TH, type Role } from "@nacc/types";
import { formatThaiDateTime, toCsv, downloadFile } from "@nacc/utils";
import {
  activityActionLabel,
  activityEntityLabel,
} from "@/lib/activity-labels";
import { AuditFilters, type AuditFilterValues } from "./audit-filters";

export interface AuditRow {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  actor_name: string | null;
  actor_role: Role | null;
}

export function AuditLogView({
  rows,
  actors,
  initial,
  truncated,
}: {
  rows: AuditRow[];
  actors: { id: string; display_name: string }[];
  initial: AuditFilterValues;
  truncated: boolean;
}) {
  function handleExport() {
    const csv = toCsv(rows, [
      { header: "วันเวลา", value: (r) => formatThaiDateTime(r.created_at) },
      { header: "ผู้ดำเนินการ", value: (r) => r.actor_name ?? "ระบบ" },
      { header: "บทบาท", value: (r) => (r.actor_role ? ROLE_LABELS_TH[r.actor_role] : "") },
      { header: "การกระทำ", value: (r) => activityActionLabel(r.action) },
      { header: "ประเภท", value: (r) => activityEntityLabel(r.entity_type) },
      { header: "รหัสอ้างอิง", value: (r) => r.entity_id ?? "" },
    ]);
    downloadFile(csv, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <AuditFilters actors={actors} initial={initial} onExport={handleExport} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {rows.length ? (
            <>
              <ul className="space-y-2 px-4 lg:hidden">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-border bg-card p-3.5"
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatThaiDateTime(r.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {activityActionLabel(r.action)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.actor_name ?? "ระบบ"}
                      {r.actor_role ? ` · ${ROLE_LABELS_TH[r.actor_role]}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activityEntityLabel(r.entity_type)}
                    </p>
                    {r.entity_type === "parking_requests" && r.entity_id ? (
                      <Link
                        href={`/requests/${r.entity_id}`}
                        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                      >
                        เปิดคำขอ
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">วันเวลา</TableHead>
                      <TableHead className="whitespace-nowrap">ผู้ดำเนินการ</TableHead>
                      <TableHead className="whitespace-nowrap">การกระทำ</TableHead>
                      <TableHead className="whitespace-nowrap">ประเภท</TableHead>
                      <TableHead className="whitespace-nowrap">อ้างอิง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatThaiDateTime(r.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="font-medium">{r.actor_name ?? "ระบบ"}</div>
                          {r.actor_role ? (
                            <div className="text-xs text-muted-foreground">
                              {ROLE_LABELS_TH[r.actor_role]}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm font-medium">
                          {activityActionLabel(r.action)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {activityEntityLabel(r.entity_type)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {r.entity_type === "parking_requests" && r.entity_id ? (
                            <Link
                              href={`/requests/${r.entity_id}`}
                              className="text-primary hover:underline"
                            >
                              เปิดคำขอ
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {r.entity_id ? `${r.entity_id.slice(0, 8)}…` : "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="px-6 py-2">
              <EmptyState
                title="ไม่พบบันทึกกิจกรรม"
                description="ลองปรับตัวกรองหรือช่วงวันที่"
                className="border-0 bg-transparent py-8"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {truncated ? (
        <p className="text-center text-xs text-muted-foreground">
          แสดง {rows.length.toLocaleString("th-TH")} รายการล่าสุด — กรองช่วงวันที่ให้แคบลงเพื่อดูรายการที่เก่ากว่านี้
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          ทั้งหมด {rows.length.toLocaleString("th-TH")} รายการ
        </p>
      )}
    </div>
  );
}
