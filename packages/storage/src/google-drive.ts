import "server-only";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import {
  googleDriveClientEmail,
  googleDriveFolderId,
  googleDrivePrivateKey,
  googleDriveSharedDriveId,
  isGoogleDriveConfigured,
  GOOGLE_DRIVE_CONFIG_ERROR_TH,
  GOOGLE_DRIVE_MY_DRIVE_FOLDER_ERROR_TH,
} from "./env";

export interface GoogleDriveUploadResult {
  driveFileId: string;
  webViewLink: string | null;
  webContentLink: string | null;
  thumbnailLink: string | null;
  mimeType: string;
  size: number;
  name: string;
}

function driveClient(): drive_v3.Drive {
  const email = googleDriveClientEmail();
  const key = googleDrivePrivateKey();
  if (!email || !key) {
    throw new Error(GOOGLE_DRIVE_CONFIG_ERROR_TH);
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

function driveRequestOptions() {
  return { supportsAllDrives: true };
}

export function buildCompletionPhotoFileName(requestNo: string): string {
  const ts = Date.now();
  const rand = randomBytes(4).toString("hex");
  const safeNo = requestNo.replace(/[^\w-]+/g, "_");
  return `completion-${safeNo}-${ts}-${rand}.jpg`;
}

export function formatGoogleDriveUploadError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (
    msg.includes("storageQuotaExceeded") ||
    msg.includes("Service Accounts do not have storage quota")
  ) {
    return GOOGLE_DRIVE_MY_DRIVE_FOLDER_ERROR_TH;
  }
  return fallback;
}

export async function uploadBufferToGoogleDrive(params: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<GoogleDriveUploadResult> {
  if (!isGoogleDriveConfigured()) {
    throw new Error(GOOGLE_DRIVE_CONFIG_ERROR_TH);
  }
  const folderId = googleDriveFolderId()!;
  const drive = driveClient();
  const body = Readable.from(params.buffer);

  const created = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [folderId],
      mimeType: params.mimeType,
    },
    media: {
      mimeType: params.mimeType,
      body,
    },
    fields: "id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink",
    ...driveRequestOptions(),
  });

  const file = created.data;
  if (!file.id) {
    throw new Error("Google Drive upload failed: missing file id");
  }

  return {
    driveFileId: file.id,
    webViewLink: file.webViewLink ?? null,
    webContentLink: file.webContentLink ?? null,
    thumbnailLink: file.thumbnailLink ?? null,
    mimeType: file.mimeType ?? params.mimeType,
    size: Number(file.size ?? params.buffer.length),
    name: file.name ?? params.fileName,
  };
}

export function getGoogleDriveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function getGoogleDriveFileThumbnailUrl(fileId: string, width = 400): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export async function streamGoogleDriveFile(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
}> {
  const drive = driveClient();
  const res = await drive.files.get(
    { fileId, alt: "media", ...driveRequestOptions() },
    { responseType: "stream" },
  );
  const stream = res.data as NodeJS.ReadableStream;
  const mimeType =
    (res.headers?.["content-type"] as string | undefined) ?? "application/octet-stream";
  return { stream, mimeType };
}
