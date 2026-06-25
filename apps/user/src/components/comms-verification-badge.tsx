import { cn } from "@nacc/ui";
import { TH, type ParkingRequestListItem } from "@nacc/types";

export function CommsVerificationBadge({
  request,
  className,
}: {
  request: Pick<ParkingRequestListItem, "status" | "comms_verified_at">;
  className?: string;
}) {
  if (request.comms_verified_at) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
          className,
        )}
      >
        {TH.comms.verifiedTag}
      </span>
    );
  }

  if (request.status === "completed") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-inset ring-amber-600/25",
          className,
        )}
      >
        {TH.comms.awaitingTag}
      </span>
    );
  }

  return null;
}
