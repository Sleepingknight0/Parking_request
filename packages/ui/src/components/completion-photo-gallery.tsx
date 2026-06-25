"use client";

import * as React from "react";
import Image from "next/image";
import { formatBytes, formatThaiDateTime, resolveAttachmentViewUrl } from "@nacc/utils";
import type { Attachment } from "@nacc/types";
import { TH } from "@nacc/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@nacc/ui";

export function CompletionPhotoGallery({
  items,
  signedSupabaseUrls,
  uploaderById,
}: {
  items: Attachment[];
  signedSupabaseUrls: Record<string, string>;
  uploaderById?: Record<string, string>;
}) {
  const [preview, setPreview] = React.useState<Attachment | null>(null);

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีรูปถ่ายส่งงาน</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => {
          const src = resolveAttachmentViewUrl(item, signedSupabaseUrls);
          if (!src) return null;
          const uploadedBy = item.uploaded_by ? uploaderById?.[item.uploaded_by] : null;
          return (
            <button
              key={item.id}
              type="button"
              className="group overflow-hidden rounded-lg border border-border text-left transition hover:ring-2 hover:ring-primary/30"
              onClick={() => setPreview(item)}
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={src}
                  alt={item.file_name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
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
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{TH.entity.completionPhoto}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <div className="relative mx-auto aspect-[4/3] w-full max-h-[70vh] overflow-hidden rounded-md bg-muted">
                <Image
                  src={resolveAttachmentViewUrl(preview, signedSupabaseUrls) ?? ""}
                  alt={preview.file_name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{preview.file_name}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
                  {TH.action.viewImage}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
