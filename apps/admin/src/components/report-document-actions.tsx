"use client";

import * as React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@nacc/ui";

/**
 * Floating toolbar for the official-document page. Hidden when printing.
 * Pass `auto` to trigger the print dialog automatically on load (?auto=1).
 */
export function ReportDocumentActions({ auto = false }: { auto?: boolean }) {
  React.useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" /> กลับ
      </Button>
      <div className="text-xs text-muted-foreground">
        กด “พิมพ์ / บันทึก PDF” แล้วเลือกปลายทางเป็น “บันทึกเป็น PDF” เพื่อได้ไฟล์เอกสาร
      </div>
      <Button size="sm" className="gap-2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> พิมพ์ / บันทึก PDF
      </Button>
    </div>
  );
}
