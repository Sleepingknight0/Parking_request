import {
  getSignOutputMethod,
  SIGN_OUTPUT_METHOD_LABELS_TH,
} from "@nacc/types";
import { Badge, cn } from "@nacc/ui";
import type { SecurityJobRow } from "@/lib/security-job-utils";

export function SecuritySignMethodBadge({
  job,
  className,
}: {
  job: Pick<SecurityJobRow, "metadata">;
  className?: string;
}) {
  const method = getSignOutputMethod(job.metadata);
  if (!method) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        method === "print"
          ? "border-blue-300 bg-blue-50 text-blue-800"
          : "border-amber-300 bg-amber-50 text-amber-900",
        className,
      )}
    >
      {SIGN_OUTPUT_METHOD_LABELS_TH[method]}
    </Badge>
  );
}
