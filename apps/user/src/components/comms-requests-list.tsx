"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  EmptyState,
  Input,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nacc/ui";
import { TH, STATUS_LABELS_TH, type ParkingRequestListItem, type RequestStatus } from "@nacc/types";
import { formatThaiDate, formatTimeRange } from "@nacc/utils";

export function CommsRequestsList({ rows }: { rows: ParkingRequestListItem[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");

  const filtered = rows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      row.official_letter_no.toLowerCase().includes(q) ||
      row.request_no.toLowerCase().includes(q) ||
      (row.subject ?? "").toLowerCase().includes(q) ||
      (row.department?.name_th ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="ค้นหาเลขหนังสือ หัวเรื่อง หรือสำนัก"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS_LABELS_TH).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={TH.state.noResults} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{TH.entity.officialLetterNo}</TableHead>
                <TableHead>{TH.entity.department}</TableHead>
                <TableHead>วันที่จอด</TableHead>
                <TableHead>{TH.entity.status}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const date = row.request_dates[0];
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.official_letter_no}</div>
                      <div className="text-xs text-muted-foreground">{row.request_no}</div>
                    </TableCell>
                    <TableCell>{row.department?.name_th ?? "-"}</TableCell>
                    <TableCell>
                      {date ? formatThaiDate(date.request_date) : "-"}
                      {date ? (
                        <div className="text-xs text-muted-foreground">
                          {formatTimeRange(date.start_time, date.end_time)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status as RequestStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/comms/requests/${row.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        ดูรายละเอียด
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
