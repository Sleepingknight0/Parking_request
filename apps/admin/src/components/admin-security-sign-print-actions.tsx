"use client";

import * as React from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@nacc/ui";

export function AdminSecuritySignPrintActions({ auto = false }: { auto?: boolean }) {
  React.useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, [auto]);

  return (
    <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Button>
      <div className="text-center text-xs text-muted-foreground">
        ป้ายแนวนอนเต็มหน้า - เลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์
      </div>
      <Button size="sm" className="gap-2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        พิมพ์ / บันทึก PDF
      </Button>
    </div>
  );
}
