import type { StickerTemplate } from "@/sticker/template";
import { triggerDownload } from "./download";

/**
 * Wraps the template's serialized SVG with an XML declaration so the file is
 * a valid `.svg` that design tools accept directly. Used by `downloadSvg`
 * and as the source for the canvas rasterization path (`rasterize.ts`).
 */
export function buildStandaloneSvg(template: StickerTemplate): string {
  const serialized = template.serialize();
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${serialized}`;
}

export function downloadSvg(template: StickerTemplate, filename = "do-not-tamper.svg"): void {
  const data = buildStandaloneSvg(template);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, filename);
}
