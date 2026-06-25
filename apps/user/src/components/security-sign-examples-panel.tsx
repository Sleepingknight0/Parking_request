"use client";

import * as React from "react";
import { FileImage, PenLine, Printer } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@nacc/ui";
import { getSignOutputMethod } from "@nacc/types";
import { buildSecuritySignPayloads } from "@/lib/security-sign-data";
import {
  downloadSecuritySignImages,
  openSecuritySignPrintPage,
} from "@/lib/security-sign-export";
import { SecuritySignPreviewGallery } from "@/components/security-sign-preview-gallery";
import type { SecurityJobRow } from "@/lib/security-job-utils";

export function SecuritySignExamplesPanel({
  job,
  todayIso,
}: {
  job: SecurityJobRow;
  todayIso: string;
}) {
  const method = getSignOutputMethod(job.metadata);
  const payloads = React.useMemo(() => buildSecuritySignPayloads(job, todayIso), [job, todayIso]);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  if (!method) return null;

  const isHandwrite = method === "handwrite";

  async function handlePngExport() {
    setExporting(true);
    try {
      await downloadSecuritySignImages(payloads, "print");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isHandwrite ? "ตัวอย่างป้ายเขียนมือ" : "ป้ายกรวยสำหรับพิมพ์"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHandwrite ? (
          <>
            <p className="text-sm text-muted-foreground">
              ดูแบบป้ายบนหน้าจอแล้วเขียนตามด้วยปากกาเมจิก — ไม่ดาวน์โหลดอัตโนมัติ
            </p>
            <SecuritySignPreviewGallery payloads={payloads} method="handwrite" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              ส่งออกป้ายอีกครั้งได้ตลอดจากหน้านี้
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openSecuritySignPrintPage(job.id, false)}
              >
                <Printer className="h-4 w-4" />
                พิมพ์ / บันทึก PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={exporting}
                onClick={handlePngExport}
              >
                <FileImage className="h-4 w-4" />
                ดาวน์โหลดรูปภาพ
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setPreviewOpen(true)}
              >
                <PenLine className="h-4 w-4" />
                ดูตัวอย่างบนหน้าจอ
              </Button>
            </div>
          </>
        )}

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>ตัวอย่างป้ายกรวย</DialogTitle>
              <DialogDescription>เลื่อนดูป้ายแต่ละแผ่น</DialogDescription>
            </DialogHeader>
            <SecuritySignPreviewGallery payloads={payloads} method="print" />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
