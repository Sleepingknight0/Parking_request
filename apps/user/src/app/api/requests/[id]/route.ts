import { NextResponse } from "next/server";
import { getRequestById } from "@nacc/db/queries";
import type { Attachment } from "@nacc/types";
import { getSignedUrls } from "@/lib/storage";
import { getAppMode } from "@/lib/user-guards";
import { getUserAppDb } from "@/lib/user-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const mode = await getAppMode();
  if (!mode) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const request = await getRequestById(getUserAppDb(), id);

  if (!request) {
    return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
  }

  const attachments = request.request_attachments as Attachment[];
  const signed = await getSignedUrls(attachments);

  return NextResponse.json({ request, signed });
}
