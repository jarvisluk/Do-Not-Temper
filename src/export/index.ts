import type { StickerTemplate } from "@/sticker/template";

export { downloadSvg } from "./svg";
export { downloadPng } from "./png";

/**
 * PDF export is gated behind a dynamic `import()` so that jsPDF, svg2pdf.js
 * and the PDF pipeline stay off the first-paint bundle. The embedded base64
 * TTF fonts are imported one step deeper inside `pdf.ts`, keeping the PDF
 * logic chunk below Vite's default warning threshold.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename?: string
): Promise<void> {
  const mod = await import("./pdf");
  return mod.downloadPdf(template, filename);
}
