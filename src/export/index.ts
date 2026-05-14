import type { StickerTemplate } from "@/sticker/template";

export { downloadSvg } from "./svg";
export { downloadPng } from "./png";

/**
 * PDF export is gated behind a dynamic `import()` so that jsPDF, svg2pdf.js
 * and the embedded base64 TTF fonts (~134 kB in fonts.ts) stay in their own
 * async chunk and don't bloat the first-paint bundle. The "Save PDF" button
 * is already wrapped in a `runExport(...)` loading state that swallows the
 * import latency.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename?: string
): Promise<void> {
  const mod = await import("./pdf");
  return mod.downloadPdf(template, filename);
}
