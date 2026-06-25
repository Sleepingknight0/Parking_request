/** Quick smoke test for Google Drive env + upload (run: pnpm tsx scripts/test-google-drive.ts) */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { resolve } from "node:path";
import { google } from "googleapis";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "apps/user/.env.local"), override: true });

function env() {
  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim();
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  return { email, key, folderId };
}

async function main() {
  console.log("=== Google Drive smoke test ===\n");
  const { email, key, folderId } = env();
  console.log("Client email:", email ?? "(missing)");
  console.log("Folder ID:", folderId ?? "(missing)");
  console.log("Private key:", key ? "set" : "(missing)");

  if (!email || !key || !folderId) {
    console.error("\nFAIL: Google Drive env not complete");
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });

  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim();
  const driveOpts = { supportsAllDrives: true, ...(sharedDriveId ? { driveId: sharedDriveId } : {}) };

  const folder = await drive.files.get({
    fileId: folderId,
    fields: "id,name,mimeType,driveId",
    ...driveOpts,
  });
  console.log("\nFolder OK:", folder.data.name, `(${folder.data.id})`);

  const jpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "base64",
  );
  const fileName = `completion-TEST-SMOKE-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`;
  console.log("\nUploading:", fileName);

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: "image/jpeg",
    },
    media: { mimeType: "image/jpeg", body: Readable.from(jpeg) },
    fields: "id,name,size,webViewLink",
    ...driveOpts,
  });

  const id = created.data.id;
  if (!id) {
    console.error("\nFAIL: upload returned no file id");
    process.exit(1);
  }

  console.log("\nOK — upload succeeded");
  console.log("  Drive file ID:", id);
  console.log("  Size (bytes):", created.data.size);
  console.log("  View:", `https://drive.google.com/file/d/${id}/view`);
}

main().catch((err) => {
  console.error("\nFAIL:", err instanceof Error ? err.message : err);
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    if (data) console.error("Details:", JSON.stringify(data, null, 2));
  }
  process.exit(1);
});
