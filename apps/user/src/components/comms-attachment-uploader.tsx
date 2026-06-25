"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Button, toast } from "@nacc/ui";
import { TH, type FileType } from "@nacc/types";
import { uploadCommsAttachment } from "@/lib/comms-actions";

export function CommsAttachmentUploader({
  requestId,
  fileType,
  label,
  onUploaded,
}: {
  requestId: string;
  fileType: FileType;
  label: string;
  onUploaded?: () => void;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadCommsAttachment(requestId, fileType, fd);
      if (!res.ok) {
        toast.error(res.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      toast.success("อัปโหลดไฟล์แล้ว");
      onUploaded?.();
      router.refresh();
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={onChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {label || TH.action.uploadAttachment}
      </Button>
    </>
  );
}
