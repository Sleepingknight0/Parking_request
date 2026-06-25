import "server-only";
import { hasSupabaseServiceKey } from "@nacc/db";
import { createServiceClient } from "@nacc/db/service";
import { createServerSupabase } from "@nacc/db/server";
import {
  downloadFromSupabaseBucket,
  loadAttachmentForImage,
  streamAttachmentImage,
} from "./attachment-image";

export async function serveAttachmentImage(attachmentId: string): Promise<Response> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const attachment = await loadAttachmentForImage(supabase, attachmentId);
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const { stream, mimeType } = await streamAttachmentImage(attachment, async (path) => {
      if (!hasSupabaseServiceKey()) {
        throw new Error("missing service key");
      }
      const svc = createServiceClient();
      return downloadFromSupabaseBucket(svc, path);
    });

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    return new Response(body, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("ไม่สามารถโหลดรูปภาพได้", { status: 502 });
  }
}
