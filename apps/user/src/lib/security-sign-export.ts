"use client";

import type { SignOutputMethod } from "@nacc/types";
import type { SecuritySignPayload } from "@/lib/security-sign-data";
import { buildSignLayout } from "@/lib/security-sign-layout";
import {
  SECURITY_SIGN_FONT_FAMILY,
  SECURITY_SIGN_FONT_URL,
} from "@/lib/security-sign-font";
import { sanitizeStorageFilename } from "@nacc/utils";
import "@/styles/security-sign-font.css";

/** A4 landscape at ~150 DPI */
const CANVAS_WIDTH = 1754;
const CANVAS_HEIGHT = 1240;

let fontLoadPromise: Promise<void> | null = null;

async function ensureSecuritySignFontLoaded(): Promise<void> {
  if (typeof document === "undefined") return;
  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      const hasFace = [...document.fonts].some((f) => f.family === SECURITY_SIGN_FONT_FAMILY);
      if (!hasFace) {
        const face = new FontFace(
          SECURITY_SIGN_FONT_FAMILY,
          `url(${SECURITY_SIGN_FONT_URL})`,
          { weight: "400", style: "normal" },
        );
        const loaded = await face.load();
        document.fonts.add(loaded);
      }
      await Promise.all([
        document.fonts.load(`700 120px "${SECURITY_SIGN_FONT_FAMILY}"`),
        document.fonts.load(`700 64px "${SECURITY_SIGN_FONT_FAMILY}"`),
        document.fonts.load(`400 48px "${SECURITY_SIGN_FONT_FAMILY}"`),
        document.fonts.load(`400 36px "${SECURITY_SIGN_FONT_FAMILY}"`),
      ]);
    })();
  }
  await fontLoadPromise;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]!;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i]!;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  bold = false,
): number {
  ctx.font = `${bold ? "700" : "400"} ${fontSize}px "${SECURITY_SIGN_FONT_FAMILY}", sans-serif`;
  ctx.fillStyle = "#000000";
  let y = startY;
  for (const line of lines) {
    y = wrapText(ctx, line, centerX, y, maxWidth, lineHeight);
  }
  return y;
}

export async function renderSecuritySignToPng(
  payload: SecuritySignPayload,
  method: SignOutputMethod,
): Promise<Blob> {
  await ensureSecuritySignFontLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ไม่สามารถสร้างรูปภาพได้");

  const isHandwrite = method === "handwrite";
  const layout = buildSignLayout(payload);
  const padX = 80;
  const maxWidth = CANVAS_WIDTH - padX * 2;
  const centerX = CANVAS_WIDTH / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = isHandwrite ? 3 : 5;
  ctx.setLineDash(isHandwrite ? [16, 10] : []);
  ctx.strokeRect(40, 40, CANVAS_WIDTH - 80, CANVAS_HEIGHT - 80);
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";

  if (isHandwrite) {
    ctx.font = `400 32px "${SECURITY_SIGN_FONT_FAMILY}", sans-serif`;
    ctx.fillStyle = "#000000";
    ctx.fillText("แบบคัดลอก — เขียนด้วยปากกาเมจิก", centerX, 88);
  }

  const topY = isHandwrite ? 150 : 120;
  drawCenteredLines(ctx, [layout.top], centerX, topY, maxWidth, 64, 72, true);

  const centerY = CANVAS_HEIGHT * 0.42;
  ctx.font = `700 120px "${SECURITY_SIGN_FONT_FAMILY}", sans-serif`;
  ctx.fillStyle = "#000000";
  wrapText(ctx, layout.center, centerX, centerY, maxWidth, 130);

  const middleY = CANVAS_HEIGHT * 0.62;
  drawCenteredLines(ctx, layout.middle, centerX, middleY, maxWidth, 48, 56);

  const bottomY = CANVAS_HEIGHT * 0.78;
  drawCenteredLines(ctx, layout.bottom, centerX, bottomY, maxWidth, 36, 44);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("สร้างไฟล์รูปไม่สำเร็จ"))),
      "image/png",
      1,
    );
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilenamePart(value: string): string {
  return sanitizeStorageFilename(value).replace(/\.[a-z0-9]+$/i, "").slice(0, 40);
}

export async function downloadSecuritySignImages(
  payloads: SecuritySignPayload[],
  method: SignOutputMethod = "print",
): Promise<void> {
  for (const payload of payloads) {
    const blob = await renderSecuritySignToPng(payload, method);
    const plate = safeFilenamePart(payload.hasRealPlate ? payload.plateNo : "sign");
    downloadBlob(blob, `cone-sign-${plate}-${payload.signIndex}.png`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

export function openSecuritySignPrintPage(requestId: string, auto = true): void {
  const params = new URLSearchParams({ method: "print", ...(auto ? { auto: "1" } : {}) });
  window.open(`/security/signs/${requestId}/print?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export type PrintExportFormat = "pdf" | "png";

export async function exportPrintSignAssets(
  requestId: string,
  payloads: SecuritySignPayload[],
  format: PrintExportFormat,
): Promise<void> {
  if (format === "png") {
    await downloadSecuritySignImages(payloads, "print");
    return;
  }
  openSecuritySignPrintPage(requestId, true);
}
