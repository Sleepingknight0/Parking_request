"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Filter, RotateCcw, Download } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nacc/ui";
import { ACTIVITY_ACTION_OPTIONS } from "@/lib/activity-labels";

const ALL = "__all__";

export interface AuditFilterValues {
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function AuditFilters({
  actors,
  initial,
  onExport,
}: {
  actors: { id: string; display_name: string }[];
  initial: AuditFilterValues;
  onExport: () => void;
}) {
  const router = useRouter();
  const [action, setAction] = React.useState(initial.action ?? ALL);
  const [actor, setActor] = React.useState(initial.actorId ?? ALL);
  const [from, setFrom] = React.useState(initial.dateFrom ?? "");
  const [to, setTo] = React.useState(initial.dateTo ?? "");

  React.useEffect(() => {
    setAction(initial.action ?? ALL);
    setActor(initial.actorId ?? ALL);
    setFrom(initial.dateFrom ?? "");
    setTo(initial.dateTo ?? "");
  }, [initial.action, initial.actorId, initial.dateFrom, initial.dateTo]);

  function apply() {
    const p = new URLSearchParams();
    if (action !== ALL) p.set("action", action);
    if (actor !== ALL) p.set("actor", actor);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    router.push(qs ? `/activity?${qs}` : "/activity");
  }

  function reset() {
    setAction(ALL);
    setActor(ALL);
    setFrom("");
    setTo("");
    router.push("/activity");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <div className="space-y-1.5">
        <Label className="text-xs">ตั้งแต่วันที่</Label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">ถึงวันที่</Label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">การกระทำ</Label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue placeholder="ทุกการกระทำ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกการกระทำ</SelectItem>
            {ACTIVITY_ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">ผู้ดำเนินการ</Label>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger><SelectValue placeholder="ทุกคน" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกคน</SelectItem>
            {actors.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button onClick={apply} className="flex-1 gap-2">
          <Filter className="h-4 w-4" /> กรอง
        </Button>
        <Button onClick={reset} variant="outline" size="icon" title="ล้างตัวกรอง">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <Button onClick={onExport} variant="outline" className="gap-2">
        <Download className="h-4 w-4" /> ส่งออก CSV
      </Button>
    </div>
  );
}
