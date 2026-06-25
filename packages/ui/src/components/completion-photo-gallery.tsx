"use client";

import * as React from "react";
import { AttachmentPreviewGallery } from "./attachment-preview-gallery";
import { TH } from "@nacc/types";
import type { Attachment } from "@nacc/types";

export function CompletionPhotoGallery({
  items,
  signedSupabaseUrls,
  uploaderById,
}: {
  items: Attachment[];
  signedSupabaseUrls: Record<string, string>;
  uploaderById?: Record<string, string>;
}) {
  return (
    <AttachmentPreviewGallery
      items={items}
      signedSupabaseUrls={signedSupabaseUrls}
      dialogTitle={TH.entity.completionPhoto}
      emptyMessage="ยังไม่มีรูปถ่ายส่งงาน"
      uploaderById={uploaderById}
    />
  );
}
