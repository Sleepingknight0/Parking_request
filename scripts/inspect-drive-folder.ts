/** Inspect Google Drive folder (Shared Drive vs My Drive). */
import { config } from "dotenv";
import { resolve } from "node:path";
import { google } from "googleapis";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "apps/user/.env.local"), override: true });

async function main() {
  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL!.trim();
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, "\n").trim();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!.trim();

  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive"] });
  const drive = google.drive({ version: "v3", auth });

  const { data } = await drive.files.get({
    fileId: folderId,
    fields: "id,name,mimeType,driveId,capabilities(canAddChildren),parents",
    supportsAllDrives: true,
  });

  console.log(JSON.stringify(data, null, 2));
  console.log(
    "\nUpload ready:",
    Boolean(data.driveId) ? "YES (Shared Drive)" : "NO — folder is in My Drive; service account cannot upload",
  );
  if (data.driveId) console.log("GOOGLE_DRIVE_SHARED_DRIVE_ID=", data.driveId);
}

main().catch(console.error);
