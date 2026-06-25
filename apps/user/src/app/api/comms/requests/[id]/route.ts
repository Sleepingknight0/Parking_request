import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Attachment } from "@nacc/types";
import { getCommsRequestById } from "@/lib/comms-data";
import { getSignedUrls } from "@/lib/storage";
import { USER_MODE_COOKIE } from "@/lib/user-mode";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const mode = (await cookies()).get(USER_MODE_COOKIE)?.value;
  if (mode !== "comms") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const request = await getCommsRequestById(id);

  if (!request || request.status === "draft") {
    return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
  }

  const attachments = request.request_attachments as Attachment[];
  const signed = await getSignedUrls(attachments);

  return NextResponse.json({ request, signed });
}
