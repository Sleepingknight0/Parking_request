import {
  STATUS_HEX,
  STATUS_HINTS_TH,
  STATUS_LABELS_TH,
  type RequestStatus,
} from "@nacc/types";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { StatusBadge } from "./status-badge";

export function StatusLegend({
  statuses,
  title = "ความหมายสีสถานะ",
  description = "ใช้สีช่วยจำสถานะของคำขอได้ง่ายขึ้น",
  compact = false,
}: {
  statuses: RequestStatus[];
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-slate-800"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_HEX[status] }}
                aria-hidden="true"
              />
              {STATUS_LABELS_TH[status]}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {statuses.map((status) => (
            <li
              key={status}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5"
            >
              <span
                className="mt-1 h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: STATUS_HEX[status] }}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-1">
                <StatusBadge status={status} className="shrink-0" />
                <p className="text-sm leading-snug text-muted-foreground">
                  {STATUS_HINTS_TH[status]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
