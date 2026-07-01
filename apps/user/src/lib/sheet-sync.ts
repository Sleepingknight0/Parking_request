"use server";

const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.replace(/\/+$/, "");
const SYNC_SECRET = process.env.SYNC_WEBHOOK_SECRET;

export async function requestSheetSync(requestId: string): Promise<void> {
  if (!requestId || !ADMIN_APP_URL || !SYNC_SECRET) return;

  try {
    const res = await fetch(`${ADMIN_APP_URL}/api/sync/push`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-secret": SYNC_SECRET,
      },
      body: JSON.stringify({ request_id: requestId }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[user sheet-sync] push failed", requestId, res.status, await res.text());
    }
  } catch (error) {
    console.error("[user sheet-sync] push failed", requestId, error);
  }
}
