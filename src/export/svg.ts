import type { StickerTemplate } from "@/sticker/template";
import { triggerDownload } from "./download";
import { prepareForExport } from "./prepare";

/**
 * Serializes the template's SVG with export-time fixups applied (background
 * stroke removed, mix-blend-mode converted to an SVG `<filter>`), wrapped in
 * an XML declaration so the file is a valid `.svg` accepted by design tools.
 * The live SVG is restored after serialization.
 */
export function buildStandaloneSvg(template: StickerTemplate): string {
  const svg = template.element;
  const restore = prepareForExport(svg);
  try {
    const serialized = new XMLSerializer().serializeToString(svg);
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${serialized}`;
  } finally {
    restore();
  }
}

export function downloadSvg(template: StickerTemplate, filename = "do-not-tamper.svg"): void {
  const data = buildStandaloneSvg(template);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, filename);
}
