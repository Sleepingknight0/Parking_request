"use client";

import * as React from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, Download, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Input,
  Button,
  StatusBadge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from "@nacc/ui";
import {
  TH,
  ACTIVE_STATUSES,
  STATUS_LABELS_TH,
  type ParkingRequestListItem,
  type RequestStatus,
} from "@nacc/types";
import { formatThaiDate, toCsv, downloadFile, formatTimeRange } from "@nacc/utils";

const ALL = "__all__";

function firstDate(r: ParkingRequestListItem): string {
  const d = r.request_dates?.[0];
  return d ? formatThaiDate(d.request_date) : "-";
}

export function RequestsTable({
  rows,
  departments,
}: {
  rows: ParkingRequestListItem[];
  departments: { id: string; name_th: string }[];
}) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns = React.useMemo<ColumnDef<ParkingRequestListItem>[]>(
    () => [
      {
        accessorKey: "request_no",
        header: TH.entity.requestNo,
        cell: ({ row }) => (
          <div>
            <Link href={`/requests/${row.original.id}`} className="font-medium text-primary hover:underline">
              {row.original.request_no}
            </Link>
            <div className="text-xs text-muted-foreground">{row.original.official_letter_no}</div>
          </div>
        ),
      },
      {
        id: "department",
        accessorFn: (r) => r.department?.name_th ?? "",
        header: TH.entity.department,
        filterFn: (row, _id, value) =>
          !value || value === ALL || row.original.department?.id === value,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.department?.short_name || row.original.department?.name_th || "-"}
          </span>
        ),
      },
      {
        id: "date",
        header: TH.entity.requestedDate,
        accessorFn: (r) => r.request_dates?.[0]?.request_date ?? "",
        cell: ({ row }) => {
          const d = row.original.request_dates?.[0];
          return (
            <div className="text-sm">
              <div>{firstDate(row.original)}</div>
              {d ? (
                <div className="text-xs text-muted-foreground">
                  {formatTimeRange(d.start_time, d.end_time)}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "cars_count",
        header: TH.entity.carsCount,
        cell: ({ row }) => <span className="text-sm">{row.original.cars_count}</span>,
      },
      {
        accessorKey: "status",
        header: TH.entity.status,
        filterFn: (row, _id, value) =>
          !value || value === ALL || row.original.status === value,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "assigned",
        header: TH.entity.assignedTo,
        accessorFn: (r) => r.assigned_to_profile?.display_name ?? "",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.assigned_to_profile?.display_name ?? "-"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/requests/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _id, value) => {
      const q = String(value).toLowerCase();
      const r = row.original;
      return [r.request_no, r.official_letter_no, r.subject, r.contact_name]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  const setColFilter = (id: string, value: string) =>
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== id),
      ...(value === ALL ? [] : [{ id, value }]),
    ]);

  function handleExport() {
    const filtered = table.getFilteredRowModel().rows.map((r) => r.original);
    const csv = toCsv(filtered, [
      { header: "เลขที่คำขอ", value: (r) => r.request_no },
      { header: "เลขหนังสือ", value: (r) => r.official_letter_no },
      { header: "สำนัก", value: (r) => r.department?.name_th ?? "" },
      { header: "วันที่จอด", value: (r) => firstDate(r) },
      { header: "จำนวนรถ", value: (r) => r.cars_count },
      { header: "สถานะ", value: (r) => STATUS_LABELS_TH[r.status] },
      { header: "ผู้รับผิดชอบ", value: (r) => r.assigned_to_profile?.display_name ?? "" },
    ]);
    downloadFile(csv, `parking-requests-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขหนังสือ / เลขที่คำขอ / เรื่อง / ผู้ประสานงาน"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select onValueChange={(v) => setColFilter("status", v)} defaultValue={ALL}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
            {ACTIVE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS_TH[s as RequestStatus]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setColFilter("department", v)} defaultValue={ALL}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="สำนัก" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกสำนัก</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name_th}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> {TH.action.export}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={TH.state.noResults} className="border-0 bg-transparent py-10" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} รายการ
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
