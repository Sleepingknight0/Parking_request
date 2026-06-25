"use client";

import type { SignOutputMethod } from "@nacc/types";
import type { SecuritySignPayload } from "@/lib/security-sign-data";
import { SecuritySignPrintCard } from "@/components/security-sign-print-card";
import { cn } from "@nacc/ui";
import "@/styles/security-sign-font.css";

/** On-screen landscape sign previews — scroll vertically, no download. */
export function SecuritySignPreviewGallery({
  payloads,
  method = "handwrite",
  className,
}: {
  payloads: SecuritySignPayload[];
  method?: SignOutputMethod;
  className?: string;
}) {
  return (
    <div className={cn("security-sign-font space-y-4", className)}>
      {payloads.length > 1 ? (
        <p className="text-center text-sm text-muted-foreground">
          ป้าย {payloads.length} แผ่น — เลื่อนดูทีละแผ่น
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        {payloads.map((payload) => (
          <div
            key={`${payload.plateNo}-${payload.signIndex}`}
            className="mx-auto w-full max-w-3xl scroll-mt-4"
          >
            {payloads.length > 1 ? (
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                ป้ายที่ {payload.signIndex}/{payload.signTotal}
              </p>
            ) : null}
            <SecuritySignPrintCard payload={payload} method={method} />
          </div>
        ))}
      </div>
    </div>
  );
}
