import type { StickerTemplate } from "@/sticker/template";

export { downloadSvg } from "./svg";
export { downloadPng } from "./png";

/**
 * PDF export is gated behind a dynamic `import()` so that jsPDF and its
 * transitive deps (html2canvas, DOMPurify) stay in their own async chunk and
 * don't bloat the first-paint bundle. The "Save PDF" button is already wrapped
 * in a `runExport(...)` loading state that swallows the import latency.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename?: string,
  scale?: number
): Promise<void> {
  const mod = await import("./pdf");
  return mod.downloadPdf(template, filename, scale);
}
