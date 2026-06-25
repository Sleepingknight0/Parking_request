"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink, FileText } from "lucide-react";
import {
  canInlinePreviewAttachment,
  formatBytes,
  formatThaiDateTime,
  isImageAttachment,
  isPdfAttachment,
  resolveAttachmentViewUrl,
} from "@nacc/utils";
import type { Attachment } from "@nacc/types";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export function AttachmentPreviewGallery({
  items,
  signedSupabaseUrls,
  dialogTitle = "ดูไฟล์แนบ",
  emptyMessage = "ยังไม่มีไฟล์",
  uploaderById,
}: {
  items: Attachment[];
  signedSupabaseUrls: Record<string, string>;
  dialogTitle?: string;
  emptyMessage?: string;
  uploaderById?: Record<string, string>;
}) {
  const [preview, setPreview] = React.useState<Attachment | null>(null);
  const previewUrl = preview ? resolveAttachmentViewUrl(preview, signedSupabaseUrls) : null;

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => {
          const src = resolveAttachmentViewUrl(item, signedSupabaseUrls);
          if (!src) return null;
          const uploadedBy = item.uploaded_by ? uploaderById?.[item.uploaded_by] : null;
          const isImage = isImageAttachment(item.mime_type);
          const isPdf = isPdfAttachment(item.mime_type);
          const canPreview = canInlinePreviewAttachment(item.mime_type);

          return (
            <button
              key={item.id}
              type="button"
              className="group overflow-hidden rounded-lg border border-border text-left transition hover:ring-2 hover:ring-primary/30"
              onClick={() => {
                if (canPreview) {
                  setPreview(item);
                  return;
                }
                window.open(src, "_blank", "noopener,noreferrer");
              }}
            >
              <div className="relative aspect-square bg-muted">
                {isImage ? (
                  <Image
                    src={src}
                    alt={item.file_name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <span className="line-clamp-2 text-xs font-medium text-foreground">
                      {isPdf ? "PDF" : item.file_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-0.5 p-2">
                <p className="truncate text-xs font-medium">{item.file_name}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(item.file_size)}</p>
                {uploadedBy ? (
                  <p className="text-[11px] text-muted-foreground">โดย {uploadedBy}</p>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  {formatThaiDateTime(item.created_at)}
                </p>
                {!canPreview ? (
                  <p className="text-[11px] text-primary">แตะเพื่อเปิดไฟล์</p>
                ) : (
                  <p className="text-[11px] text-primary">แตะเพื่อดูตัวอย่าง</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {preview && previewUrl ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              {isImageAttachment(preview.mime_type) ? (
                <div className="relative mx-auto aspect-[4/3] w-full max-h-[65vh] overflow-hidden rounded-md bg-muted">
                  <Image
                    src={previewUrl}
                    alt={preview.file_name}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : isPdfAttachment(preview.mime_type) ? (
                <iframe
                  title={preview.file_name}
                  src={previewUrl}
                  className="h-[65vh] w-full rounded-md border border-border bg-muted"
                />
              ) : null}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{preview.file_name}</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
                    ปิด
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                      <ExternalLink className="h-4 w-4" />
                      เปิดแท็บใหม่
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AttachmentPreviewSection({
  label,
  items,
  signedSupabaseUrls,
  upload,
  emptyMessage,
}: {
  label: string;
  items: Attachment[];
  signedSupabaseUrls: Record<string, string>;
  upload?: React.ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {upload}
      </div>
      <AttachmentPreviewGallery
        items={items}
        signedSupabaseUrls={signedSupabaseUrls}
        dialogTitle={label}
        emptyMessage={emptyMessage ?? `ยังไม่มี${label}`}
      />
    </div>
  );
}
