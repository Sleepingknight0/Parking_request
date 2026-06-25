import {
  SECURITY_PREP_URGENCY_LEGEND,
  SECURITY_STATUS_HEX,
  SECURITY_STATUS_LABELS_TH,
  SECURITY_STATUS_LEGEND,
} from "@nacc/types";

export function SecurityLegend({ compact = true }: { compact?: boolean }) {
  if (!compact) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">สถานะงาน รปภ.</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {SECURITY_STATUS_LEGEND.map((status) => (
              <li key={status} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: SECURITY_STATUS_HEX[status] }}
                />
                {SECURITY_STATUS_LABELS_TH[status]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">ระดับความเร่งด่วน (วันจอด)</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {SECURITY_PREP_URGENCY_LEGEND.map((item) => (
              <li key={item.level} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: item.hex }}
                />
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground"> — {item.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 space-y-2">
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">สถานะงาน รปภ.</p>
        <div className="flex flex-wrap gap-1.5">
          {SECURITY_STATUS_LEGEND.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-slate-800"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: SECURITY_STATUS_HEX[status] }}
                aria-hidden="true"
              />
              {SECURITY_STATUS_LABELS_TH[status]}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">ความเร่งด่วนวันจอด</p>
        <div className="flex flex-wrap gap-1.5">
          {SECURITY_PREP_URGENCY_LEGEND.map((item) => (
            <span
              key={item.level}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] font-medium text-slate-800"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.hex }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
