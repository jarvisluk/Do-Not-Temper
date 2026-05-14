import { jsPDF } from "jspdf";
import type { StickerTemplate } from "@/sticker/template";
import { STICKER_VIEWBOX } from "@/sticker/svg";
import { rasterizeStickerToCanvas } from "./rasterize";

/** PDF page height in points; width is derived from the sticker aspect ratio. */
const PDF_PAGE_HEIGHT_PT = 6 * 72;

/** Oversampling factor for the embedded raster. 4× ≈ 300+ DPI at typical sticker sizes. */
const PDF_RASTER_SCALE = 4;

/**
 * Rasterizes the SVG at high resolution via the browser's rendering engine
 * (which correctly handles mix-blend-mode, dominant-baseline, etc.) and embeds
 * the resulting image into a PDF.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename = "do-not-tamper.pdf",
  scale = PDF_RASTER_SCALE
): Promise<void> {
  const { canvas, dispose } = await rasterizeStickerToCanvas(template, scale);
  try {
    const imgData = canvas.toDataURL("image/png");

    const pageWidthPt =
      (STICKER_VIEWBOX.width / STICKER_VIEWBOX.height) * PDF_PAGE_HEIGHT_PT;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pageWidthPt, PDF_PAGE_HEIGHT_PT],
      compress: true
    });

    pdf.addImage(imgData, "PNG", 0, 0, pageWidthPt, PDF_PAGE_HEIGHT_PT);
    pdf.save(filename);
  } finally {
    dispose();
  }
}
