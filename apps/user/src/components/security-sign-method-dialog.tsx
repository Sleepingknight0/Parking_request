"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileImage, Loader2, PenLine, Printer } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@nacc/ui";
import {
  SIGN_OUTPUT_METHOD_DIALOG_TH,
  TH,
  type SignOutputMethod,
} from "@nacc/types";
import { acceptJobWithSignMethod } from "@/lib/request-actions";
import { buildSecuritySignPayloads } from "@/lib/security-sign-data";
import { exportPrintSignAssets, type PrintExportFormat } from "@/lib/security-sign-export";
import { SecuritySignPreviewGallery } from "@/components/security-sign-preview-gallery";
import type { SecurityJobRow } from "@/lib/security-job-utils";

type DialogStep = "method" | "print-format" | "print-done" | "handwrite-preview";

const LOCKED_STEPS: DialogStep[] = ["handwrite-preview", "print-done"];

export function SecuritySignMethodDialog({
  job,
  open,
  onOpenChange,
  andStart = true,
  todayIso,
}: {
  job: SecurityJobRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  andStart?: boolean;
  todayIso: string;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<DialogStep>("method");
  const [pending, setPending] = React.useState(false);
  const [jobAcknowledged, setJobAcknowledged] = React.useState(false);
  const [previewPayloads, setPreviewPayloads] = React.useState(() =>
    buildSecuritySignPayloads(job, todayIso),
  );

  React.useEffect(() => {
    if (!open) {
      setStep("method");
      setPending(false);
      setJobAcknowledged(false);
    }
  }, [open]);

  React.useEffect(() => {
    setPreviewPayloads(buildSecuritySignPayloads(job, todayIso));
  }, [job, todayIso]);

  function handleOpenChange(next: boolean) {
    if (!next && LOCKED_STEPS.includes(step)) return;
    onOpenChange(next);
  }

  function closeAndRefresh() {
    onOpenChange(false);
    setStep("method");
    setJobAcknowledged(false);
    router.refresh();
  }

  async function acknowledgeJob(method: SignOutputMethod): Promise<boolean> {
    if (jobAcknowledged) return true;

    const res = await acceptJobWithSignMethod(job.id, method, andStart);
    if (!res.ok) {
      toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
      return false;
    }
    setJobAcknowledged(true);
    return true;
  }

  function selectMethod(method: SignOutputMethod) {
    if (method === "print") {
      setStep("print-format");
      return;
    }
    setPreviewPayloads(buildSecuritySignPayloads(job, todayIso));
    setStep("handwrite-preview");
  }

  async function confirmHandwrite() {
    setPending(true);
    try {
      const ok = await acknowledgeJob("handwrite");
      if (!ok) return;
      toast.success(TH.security.acknowledged);
      closeAndRefresh();
    } finally {
      setPending(false);
    }
  }

  async function downloadPrint(format: PrintExportFormat) {
    setPending(true);
    try {
      const ok = await acknowledgeJob("print");
      if (!ok) return;

      const payloads = buildSecuritySignPayloads(job, todayIso);
      try {
        await exportPrintSignAssets(job.id, payloads, format);
      } catch (exportError) {
        console.error(exportError);
        toast.error("ส่งออกป้ายไม่สำเร็จ — ลองอีกครั้ง");
        return;
      }

      if (step !== "print-done") {
        toast.success(TH.security.acknowledged);
      }
      setStep("print-done");
    } finally {
      setPending(false);
    }
  }

  const dialogSize =
    step === "handwrite-preview" || step === "print-done"
      ? "flex max-h-[92vh] max-w-lg flex-col gap-4 overflow-hidden sm:max-w-2xl"
      : "max-w-md gap-5 sm:max-w-lg";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogSize}>
        {step === "method" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{SIGN_OUTPUT_METHOD_DIALOG_TH.title}</DialogTitle>
              <DialogDescription className="text-base">
                {SIGN_OUTPUT_METHOD_DIALOG_TH.description}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[5.5rem] flex-col items-start gap-1 whitespace-normal px-4 py-4 text-left"
                disabled={pending}
                onClick={() => selectMethod("print")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  <Printer className="h-5 w-5 shrink-0" />
                  {SIGN_OUTPUT_METHOD_DIALOG_TH.printTitle}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {SIGN_OUTPUT_METHOD_DIALOG_TH.printHint}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[5.5rem] flex-col items-start gap-1 whitespace-normal px-4 py-4 text-left"
                disabled={pending}
                onClick={() => selectMethod("handwrite")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  <PenLine className="h-5 w-5 shrink-0" />
                  {SIGN_OUTPUT_METHOD_DIALOG_TH.handwriteTitle}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {SIGN_OUTPUT_METHOD_DIALOG_TH.handwriteHint}
                </span>
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
                {TH.action.close}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "print-format" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">เลือกรูปแบบไฟล์ป้าย</DialogTitle>
              <DialogDescription className="text-base">
                ป้ายแนวนอนเต็มหน้า ตัวอักษรสีดำทั้งหมด — ดาวน์โหลดซ้ำได้ก่อนกดยืนยัน
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[5rem] flex-col items-start gap-1 whitespace-normal px-4 py-4 text-left"
                disabled={pending}
                onClick={() => downloadPrint("pdf")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  {pending ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <Printer className="h-5 w-5 shrink-0" />
                  )}
                  บันทึกเป็น PDF / พิมพ์
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  เปิดหน้าพิมพ์แล้วเลือก “บันทึกเป็น PDF”
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[5rem] flex-col items-start gap-1 whitespace-normal px-4 py-4 text-left"
                disabled={pending}
                onClick={() => downloadPrint("png")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  {pending ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <FileImage className="h-5 w-5 shrink-0" />
                  )}
                  ดาวน์โหลดรูปภาพ PNG
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  หนึ่งไฟล์ต่อป้าย (ต่อทะเบียน/คัน)
                </span>
              </Button>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" disabled={pending} onClick={() => setStep("method")}>
                ย้อนกลับ
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
                {TH.action.close}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "print-done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">ดาวน์โหลดป้ายแล้ว</DialogTitle>
              <DialogDescription className="text-base">
                ดาวน์โหลดซ้ำได้ตามต้องการ แล้วกดยืนยันเมื่อพร้อมปิด
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[4.5rem] flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
                disabled={pending}
                onClick={() => downloadPrint("pdf")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  {pending ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <Printer className="h-5 w-5 shrink-0" />
                  )}
                  ดาวน์โหลด PDF อีกครั้ง
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[4.5rem] flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
                disabled={pending}
                onClick={() => downloadPrint("png")}
              >
                <span className="flex w-full items-center gap-2 text-base font-semibold">
                  {pending ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <FileImage className="h-5 w-5 shrink-0" />
                  )}
                  ดาวน์โหลด PNG อีกครั้ง
                </span>
              </Button>
            </div>

            <DialogFooter>
              <Button className="w-full sm:w-auto" disabled={pending} onClick={closeAndRefresh}>
                {TH.action.confirm}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "handwrite-preview" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">ตัวอย่างป้ายเขียนมือ</DialogTitle>
              <DialogDescription className="text-base">
                เขียนตามบนป้ายกรวยด้วยปากกาเมจิก — กดยืนยันเมื่อดูครบแล้วจึงรับทราบงาน
              </DialogDescription>
            </DialogHeader>

            <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-2">
              <SecuritySignPreviewGallery payloads={previewPayloads} method="handwrite" />
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" disabled={pending} onClick={() => setStep("method")}>
                ย้อนกลับ
              </Button>
              <Button disabled={pending} onClick={confirmHandwrite}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {TH.action.confirm}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Prefer rendering {@link SecuritySignMethodDialog} at parent level so it survives job status updates. */
export function SecurityAcknowledgeButton({
  job,
  andStart = true,
  todayIso,
  className,
  disabled,
  children,
}: {
  job: SecurityJobRow;
  andStart?: boolean;
  todayIso: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button className={className} disabled={disabled} onClick={() => setOpen(true)}>
        {children ?? TH.security.acknowledgeJob}
      </Button>
      <SecuritySignMethodDialog
        job={job}
        open={open}
        onOpenChange={setOpen}
        andStart={andStart}
        todayIso={todayIso}
      />
    </>
  );
}
