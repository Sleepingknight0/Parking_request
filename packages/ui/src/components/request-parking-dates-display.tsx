import { formatRequestParkingSchedule, type RequestDateSlotInput } from "@nacc/utils";
import { cn } from "../lib/cn";

export function RequestParkingDatesDisplay({
  dates,
  emptyLabel = "-",
  className,
}: {
  dates: RequestDateSlotInput[];
  emptyLabel?: string;
  className?: string;
}) {
  if (!dates.length) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  const { dateLabel, timeLabel } = formatRequestParkingSchedule(dates);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm",
        className,
      )}
    >
      <span>{dateLabel}</span>
      {timeLabel ? <span className="ml-1.5 text-xs text-muted-foreground">· {timeLabel}</span> : null}
    </span>
  );
}
