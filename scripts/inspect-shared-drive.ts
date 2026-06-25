import { config } from "dotenv";
import { resolve } from "node:path";
import { google } from "googleapis";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "apps/user/.env.local"), override: true });

async function main() {
  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL!.trim();
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, "\n").trim();
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID!.trim();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!.trim();

  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive"] });
  const drive = google.drive({ version: "v3", auth });

  const { data: drives } = await drive.drives.list({ pageSize: 10 });
  console.log(
    "Shared drives visible to SA:",
    drives.drives?.map((d) => ({ id: d.id, name: d.name })) ?? [],
  );

  for (const id of [sharedDriveId, folderId]) {
    const { data } = await drive.files.get({
      fileId: id,
      fields: "id,name,driveId,parents,capabilities(canAddChildren)",
      supportsAllDrives: true,
    });
    console.log("File metadata:", JSON.stringify(data));
  }

  const { data: perms } = await drive.permissions.list({
    fileId: sharedDriveId,
    fields: "permissions(emailAddress,role,type)",
    supportsAllDrives: true,
    useDomainAdminAccess: false,
  });
  const sa = perms.permissions?.find((p) => p.emailAddress?.includes("nacc-parking-streamlit"));
  console.log("Service account on Shared Drive:", sa ?? "NOT FOUND — add as Content manager");
}

main().catch(console.error);
