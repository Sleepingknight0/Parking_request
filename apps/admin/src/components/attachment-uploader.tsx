"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button, toast } from "@nacc/ui";
import { FILE_TYPE_LABELS_TH, type FileType } from "@nacc/types";
import { uploadAttachment } from "@/lib/request-actions";

export function AttachmentUploader({
  requestId,
  fileType,
  label,
  multiple = false,
}: {
  requestId: string;
  fileType: FileType;
  label?: string;
  multiple?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPending(true);
    try {
      let uploaded = 0;
      for (const file of files) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await uploadAttachment(requestId, fileType, fd);
        if (!res.ok) {
          toast.error(res.error ?? "อัปโหลดไม่สำเร็จ");
          continue;
        }
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(uploaded === 1 ? "อัปโหลดไฟล์แล้ว" : `อัปโหลดไฟล์แล้ว ${uploaded} ไฟล์`);
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
        accept={fileType === "completion_photo" ? ".jpg,.jpeg,.png,.webp" : ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"}
        multiple={multiple}
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
