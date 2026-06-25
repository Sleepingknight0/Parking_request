"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button, toast } from "@nacc/ui";
import { TH } from "@nacc/types";
import { formatBytes } from "@nacc/utils";
import { uploadCompletionPhoto } from "@/lib/completion-photo-actions";
import { compressCompletionPhoto, isAllowedCompletionPhoto } from "@/lib/compress-image";

type PendingItem = {
  name: string;
  originalSize: number;
  compressedSize: number;
};

export function CompletionPhotoUploader({
  requestId,
  large = false,
}: {
  requestId: string;
  large?: boolean;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [last, setLast] = React.useState<PendingItem | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setPending(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const raw = files[i]!;
        if (!isAllowedCompletionPhoto(raw)) {
          toast.error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP");
          continue;
        }

        setProgress(`${TH.action.uploading} (${i + 1}/${files.length}) — ${TH.action.compressImage}`);
        const compressed = await compressCompletionPhoto(raw);
        setLast({
          name: compressed.file.name,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });

        const fd = new FormData();
        fd.set("file", compressed.file);
        fd.set("originalName", raw.name);
        fd.set("originalSize", String(compressed.originalSize));
        fd.set("compressedSize", String(compressed.compressedSize));
        if (compressed.width) fd.set("width", String(compressed.width));
        if (compressed.height) fd.set("height", String(compressed.height));

        setProgress(`${TH.action.uploading} (${i + 1}/${files.length})`);
        const res = await uploadCompletionPhoto(requestId, fd);
        if (!res.ok) {
          toast.error(res.error ?? TH.action.completionUploadFailed);
          return;
        }
      }

      toast.success("อัปโหลดรูปส่งงานแล้ว");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : TH.action.completionUploadFailed);
    } finally {
      setPending(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onChange}
      />
      <Button
        type="button"
        variant={large ? "default" : "outline"}
        size={large ? "lg" : "sm"}
        className={large ? "h-14 w-full gap-3 text-lg" : "gap-2"}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {TH.action.attachCompletionPhoto}
      </Button>
      {progress ? <p className="text-xs text-muted-foreground">{progress}</p> : null}
      {last ? (
        <p className="text-xs text-muted-foreground">
          {last.name}: {formatBytes(last.originalSize)} → {formatBytes(last.compressedSize)} ({TH.action.compressImage})
        </p>
      ) : null}
    </div>
  );
}
