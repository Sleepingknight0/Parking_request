"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button, toast } from "@nacc/ui";
import { FILE_TYPE_LABELS_TH, type FileType } from "@nacc/types";
import { uploadUserAttachment } from "@/lib/request-actions";

export function UserAttachmentUploader({
  requestId,
  fileType,
  label,
}: {
  requestId: string;
  fileType: FileType;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setPending(true);
    try {
      const res = await uploadUserAttachment(requestId, fileType, fd);
      if (!res.ok) toast.error(res.error ?? "อัปโหลดไม่สำเร็จ");
      else {
        toast.success("อัปโหลดไฟล์แล้ว");
        router.refresh();
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
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
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label ?? `แนบ${FILE_TYPE_LABELS_TH[fileType]}`}
      </Button>
    </div>
  );
}
