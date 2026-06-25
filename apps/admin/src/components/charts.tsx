"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@nacc/ui";
import { STATUS_HEX, STATUS_LABELS_TH, type RequestStatus } from "@nacc/types";
import { ChartFrame } from "./chart-frame";

export interface StatusDatum {
  status: RequestStatus;
  count: number;
}

export function StatusBarChart({ data }: { data: StatusDatum[] }) {
  const rows = data.map((d) => ({
    name: STATUS_LABELS_TH[d.status],
    count: d.count,
    fill: STATUS_HEX[d.status],
  }));
  return (
    <ChartFrame height={260}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={rows}
          margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={56} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ChartFrame>
  );
}

export interface NamedDatum {
  name: string;
  count: number;
}

export function DeptBarChart({ data }: { data: NamedDatum[] }) {
  const chartHeight = Math.max(220, data.length * 36);
  return (
    <ChartFrame height={chartHeight}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" isAnimationActive={false} />
        </BarChart>
      )}
    </ChartFrame>
  );
}

export function CarsByDateChart({ data }: { data: NamedDatum[] }) {
  return (
    <ChartFrame height={260}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" isAnimationActive={false} />
        </BarChart>
      )}
    </ChartFrame>
  );
}

/* ─── Period trend (daily / weekly / monthly) ─────────────────────────────── */

export interface TrendPoint {
  label: string;
  requests: number;
  cars: number;
}

export type TrendData = {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
};

const PERIODS = [
  { key: "daily", label: "รายวัน" },
  { key: "weekly", label: "รายสัปดาห์" },
  { key: "monthly", label: "รายเดือน" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

const REQUESTS_FILL = "#1e3a5f";
const CARS_FILL = "#0d9488";

export function PeriodTrendChart({
  data,
  defaultPeriod = "daily",
}: {
  data: TrendData;
  defaultPeriod?: PeriodKey;
}) {
  const [period, setPeriod] = React.useState<PeriodKey>(defaultPeriod);
  const rows = data[period];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === p.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {rows.length ? (
        <ChartFrame height={280}>
          {({ width, height }) => (
            <BarChart
              width={width}
              height={height}
              data={rows}
              margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="จำนวนคำขอ" dataKey="requests" fill={REQUESTS_FILL} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar name="จำนวนรถ" dataKey="cars" fill={CARS_FILL} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          )}
        </ChartFrame>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลในช่วงนี้
        </div>
      )}
    </div>
  );
}
