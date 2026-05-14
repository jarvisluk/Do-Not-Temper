import { jsPDF } from "jspdf";
import "svg2pdf.js";
import type { StickerTemplate } from "@/sticker/template";
import { STICKER_VIEWBOX } from "@/sticker/svg";
import { DOTTY_TTF_BASE64, OCR_TTF_BASE64 } from "@/fonts";
import { prepareForExport } from "./prepare";
import { buildAccentOnlySvg, registerBlendGState } from "./pdfBlendMode";

/** PDF page height in points; width is derived from the sticker aspect ratio. */
const PDF_PAGE_HEIGHT_PT = 6 * 72;

/** Resource name used to reference our custom multiply ExtGState. */
const MULTIPLY_GS_NAME = "GsMul";

/**
 * Converts the SVG sticker into a vector PDF using svg2pdf.js, which translates
 * SVG paths, text, and fills into native PDF drawing commands.
 *
 * The mix-blend-mode multiply on the red "E" needs special handling because
 * neither svg2pdf.js nor jsPDF surfaces PDF blend modes. We work around this
 * with a two-pass render:
 *
 *   Pass 1: hide the multiply-blend element(s); svg2pdf draws the gold
 *           background, white E hole, text, etc. into the page.
 *   Pass 2: write a raw `q /GsMul gs ... Q` block into the content stream
 *           and have svg2pdf draw a tiny SVG containing only the accent path.
 *           Because the surrounding ExtGState has /BM /Multiply, the PDF
 *           renderer multiplies the accent's pixels with whatever was painted
 *           in pass 1 — exactly like CSS mix-blend-mode would on screen.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename = "do-not-tamper.pdf"
): Promise<void> {
  const pageWidthPt =
    (STICKER_VIEWBOX.width / STICKER_VIEWBOX.height) * PDF_PAGE_HEIGHT_PT;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [pageWidthPt, PDF_PAGE_HEIGHT_PT],
    compress: true
  });

  pdf.addFileToVFS("DOTTY.ttf", DOTTY_TTF_BASE64);
  pdf.addFont("DOTTY.ttf", "DOTTY", "normal");
  pdf.addFileToVFS("OCR.ttf", OCR_TTF_BASE64);
  pdf.addFont("OCR.ttf", "OCR", "normal");

  // Register the multiply ExtGState before any content is written.
  registerBlendGState(pdf, MULTIPLY_GS_NAME, "Multiply");

  const svgElement = template.element;
  const restore = prepareForExport(svgElement, "pdf");
  const accentOnlySvg = buildAccentOnlySvg(svgElement);

  try {
    // Pass 1: main render with the multiply-blend element hidden.
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: PDF_PAGE_HEIGHT_PT
    });

    if (accentOnlySvg) {
      const internalApi = (pdf as unknown as { internal: { out: (s: string) => void } }).internal;
      // Pass 2: open a graphics-state scope, switch on multiply blend, draw
      // just the accent, then restore. The accent SVG must temporarily live
      // in the document so svg2pdf can run getBoundingClientRect on it.
      accentOnlySvg.style.position = "absolute";
      accentOnlySvg.style.left = "-99999px";
      accentOnlySvg.setAttribute("width", String(STICKER_VIEWBOX.width));
      accentOnlySvg.setAttribute("height", String(STICKER_VIEWBOX.height));
      document.body.appendChild(accentOnlySvg);
      try {
        internalApi.out(`q /${MULTIPLY_GS_NAME} gs`);
        await pdf.svg(accentOnlySvg, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: PDF_PAGE_HEIGHT_PT
        });
        internalApi.out("Q");
      } finally {
        accentOnlySvg.remove();
      }
    }

    pdf.save(filename);
  } finally {
    restore();
  }
}
