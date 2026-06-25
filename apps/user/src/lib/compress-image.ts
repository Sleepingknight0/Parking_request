import imageCompression from "browser-image-compression";
import { COMPLETION_PHOTO_MIME_TYPES } from "@nacc/types";

const MAX_DIMENSION = 1600;
const TARGET_QUALITY = 0.75;

export function isAllowedCompletionPhoto(file: File): boolean {
  return (COMPLETION_PHOTO_MIME_TYPES as readonly string[]).includes(file.type);
}

export async function compressCompletionPhoto(file: File): Promise<{
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number | null;
  height: number | null;
}> {
  if (!isAllowedCompletionPhoto(file)) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP");
  }

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    initialQuality: TARGET_QUALITY,
    fileType: "image/jpeg",
    maxSizeMB: 1.5,
  });

  const objectUrl = URL.createObjectURL(compressed);
  const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ไม่สามารถอ่านรูปภาพได้"));
    };
    img.src = objectUrl;
  });

  const outName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  const outFile = new File([compressed], outName, { type: "image/jpeg" });

  return {
    file: outFile,
    originalSize: file.size,
    compressedSize: outFile.size,
    width: dims.width,
    height: dims.height,
  };
}
