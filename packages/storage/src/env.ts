/** Google Drive service-account env (server-only). */

export function googleDriveClientEmail(): string | undefined {
  return process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim() || undefined;
}

export function googleDrivePrivateKey(): string | undefined {
  const raw = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n").trim();
}

export function googleDriveFolderId(): string | undefined {
  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || undefined;
}

export function googleDriveSharedDriveId(): string | undefined {
  return process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || undefined;
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    googleDriveClientEmail() && googleDrivePrivateKey() && googleDriveFolderId(),
  );
}

export const GOOGLE_DRIVE_CONFIG_ERROR_TH =
  "ยังไม่ได้ตั้งค่า Google Drive (GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, GOOGLE_DRIVE_FOLDER_ID)";

export const GOOGLE_DRIVE_MY_DRIVE_FOLDER_ERROR_TH =
  "โฟลเดอร์ Google Drive อยู่ใน My Drive — service account อัปโหลดไม่ได้ กรุณาย้ายโฟลเดอร์ไป Google Shared Drive แล้วตั้ง GOOGLE_DRIVE_FOLDER_ID และ GOOGLE_DRIVE_SHARED_DRIVE_ID";

export function googleSheetsId(): string | undefined {
  return process.env.GOOGLE_SHEETS_ID?.trim() || undefined;
}

export function googleSheetsTabName(): string {
  return process.env.GOOGLE_SHEETS_TAB_NAME?.trim() || "ชีต1";
}

/** Sheet gid from the spreadsheet URL (#gid=0). Preferred over tab name on Vercel. */
export function googleSheetsGid(): string {
  return process.env.GOOGLE_SHEETS_GID?.trim() || "0";
}

export function syncWebhookSecret(): string | undefined {
  return process.env.SYNC_WEBHOOK_SECRET?.trim() || undefined;
}

export function isSheetsConfigured(): boolean {
  return Boolean(googleDriveClientEmail() && googleDrivePrivateKey() && googleSheetsId());
}
