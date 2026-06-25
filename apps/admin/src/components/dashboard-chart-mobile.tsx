"use client";

import { STATUS_HEX, STATUS_LABELS_TH, type RequestStatus } from "@nacc/types";
import type { NamedDatum, StatusDatum, TrendData } from "./charts";

function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? "hsl(var(--primary))",
          }}
        />
      </div>
    </div>
  );
}

export function DashboardTrendMobile({ data }: { data: TrendData }) {
  const rows = data.daily.slice(-7);
  if (!rows.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลแนวโน้ม</p>
    );
  }
  const maxReq = Math.max(...rows.map((r) => r.requests), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">คำขอ </span>
              <span className="font-semibold tabular-nums">{row.requests}</span>
            </div>
            <div>
              <span className="text-muted-foreground">รถ </span>
              <span className="font-semibold tabular-nums">{row.cars}</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#1e3a5f]"
              style={{ width: `${Math.round((row.requests / maxReq) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatusMobile({ data }: { data: StatusDatum[] }) {
  if (!data.length) {
    return <p className="text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <MiniBar
          key={d.status}
          label={STATUS_LABELS_TH[d.status]}
          value={d.count}
          max={max}
          color={STATUS_HEX[d.status]}
        />
      ))}
    </div>
  );
}

export function DashboardNamedMobile({
  data,
  emptyLabel = "ยังไม่มีข้อมูล",
}: {
  data: NamedDatum[];
  emptyLabel?: string;
}) {
  if (!data.length) {
    return <p className="text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <MiniBar key={d.name} label={d.name} value={d.count} max={max} />
      ))}
    </div>
  );
}
