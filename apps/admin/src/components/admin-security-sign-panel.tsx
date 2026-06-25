"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, PenLine, Printer } from "lucide-react";
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
import type { SignOutputMethod } from "@nacc/types";
import { getSignOutputMethod } from "@nacc/types";
import { AdminSecuritySignCard } from "@/components/admin-security-sign-card";
import type { AdminSecuritySignPayload } from "@/lib/security-signs";
import { signMethodLabel } from "@/lib/security-signs";
import type { Json } from "@nacc/types/database";

export function AdminSecuritySignPanel({
  requestId,
  payloads,
  metadata,
}: {
  requestId: string;
  payloads: AdminSecuritySignPayload[];
  metadata: Json | null;
}) {
  const selectedMethod = getSignOutputMethod(metadata);
  const [method, setMethod] = React.useState<SignOutputMethod>(selectedMethod ?? "print");
  const [open, setOpen] = React.useState(false);

  if (!payloads.length) return null;

  const printHref = `/requests/${requestId}/signs/print?method=${method}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">ป้ายกรวยสำหรับ รปภ.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Admin ดูตัวอย่างและพิมพ์ป้ายได้ทุกเมื่อ
          {selectedMethod ? ` · วิธีที่ รปภ. เลือก: ${signMethodLabel(selectedMethod)}` : ""}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={method === "print" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setMethod("print")}
          >
            <Printer className="h-4 w-4" />
            พิมพ์
          </Button>
          <Button
            type="button"
            variant={method === "handwrite" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setMethod("handwrite")}
          >
            <PenLine className="h-4 w-4" />
            เขียนมือ
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Eye className="h-4 w-4" />
            ดูตัวอย่าง
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href={printHref} target="_blank">
              <Printer className="h-4 w-4" />
              พิมพ์ / บันทึก PDF
            </Link>
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>ตัวอย่างป้ายกรวย</DialogTitle>
              <DialogDescription>
                แสดงบนหน้าจอโดยไม่ต้องดาวน์โหลดไฟล์ ป้ายทั้งหมด {payloads.length} แผ่น
              </DialogDescription>
            </DialogHeader>
            <div className="security-sign-font space-y-6">
              {payloads.map((payload) => (
                <div key={`${payload.plateNo}-${payload.signIndex}`} className="mx-auto w-full max-w-3xl">
                  {payloads.length > 1 ? (
                    <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                      ป้ายที่ {payload.signIndex}/{payload.signTotal}
                    </p>
                  ) : null}
                  <AdminSecuritySignCard payload={payload} method={method} />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
