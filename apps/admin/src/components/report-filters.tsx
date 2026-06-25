"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@nacc/ui";
import {
  REQUEST_STATUSES,
  STATUS_LABELS_TH,
  type RequestStatus,
} from "@nacc/types";
import {
  monthStartIso,
  todayISO,
  weekStartIso,
  yearStartIso,
} from "@nacc/utils";

const ALL = "__all__";

const PERIOD_PRESETS = [
  { key: "today", label: "วันนี้" },
  { key: "week", label: "สัปดาห์นี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
] as const;

type PeriodPreset = (typeof PERIOD_PRESETS)[number]["key"];

export interface ReportFilterValues {
  status?: RequestStatus;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function presetRange(preset: PeriodPreset): { from: string; to: string } {
  const today = todayISO();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week":
      return { from: weekStartIso(today), to: today };
    case "month":
      return { from: monthStartIso(today), to: today };
    case "year":
      return { from: yearStartIso(today), to: today };
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function ReportFilters({
  departments,
  initial,
}: {
  departments: { id: string; name_th: string }[];
  initial: ReportFilterValues;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string>(initial.status ?? ALL);
  const [dept, setDept] = React.useState<string>(initial.departmentId ?? ALL);
  const [from, setFrom] = React.useState<string>(initial.dateFrom ?? "");
  const [to, setTo] = React.useState<string>(initial.dateTo ?? "");

  React.useEffect(() => {
    setStatus(initial.status ?? ALL);
    setDept(initial.departmentId ?? ALL);
    setFrom(initial.dateFrom ?? "");
    setTo(initial.dateTo ?? "");
  }, [initial.status, initial.departmentId, initial.dateFrom, initial.dateTo]);

  function pushFilters(next: { status: string; dept: string; from: string; to: string }) {
    const p = new URLSearchParams();
    if (next.status !== ALL) p.set("status", next.status);
    if (next.dept !== ALL) p.set("dept", next.dept);
    if (next.from) p.set("from", next.from);
    if (next.to) p.set("to", next.to);
    const qs = p.toString();
    router.push(qs ? `/reports?${qs}` : "/reports");
  }

  function apply() {
    pushFilters({ status, dept, from, to });
  }

  function applyPreset(preset: PeriodPreset) {
    const range = presetRange(preset);
    setFrom(range.from);
    setTo(range.to);
    pushFilters({ status, dept, from: range.from, to: range.to });
  }

  function reset() {
    setStatus(ALL);
    setDept(ALL);
    setFrom("");
    setTo("");
    router.push("/reports");
  }

  const activePreset = React.useMemo((): PeriodPreset | null => {
    if (!from && !to) return null;
    for (const preset of PERIOD_PRESETS) {
      const range = presetRange(preset.key);
      if (from === range.from && to === range.to) return preset.key;
    }
    return null;
  }, [from, to]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activePreset === preset.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">ตั้งแต่วันที่ (รับหนังสือ)</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ถึงวันที่</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">สถานะ</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS_TH[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">สำนัก/หน่วยงาน</Label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger><SelectValue placeholder="ทุกสำนัก" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสำนัก</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name_th}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={apply} className="flex-1 gap-2">
            <Filter className="h-4 w-4" /> ดูรายงาน
          </Button>
          <Button onClick={reset} variant="outline" size="icon" title="ล้างตัวกรอง">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
