import { serveAttachmentImage } from "@nacc/storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return serveAttachmentImage(id);
}
