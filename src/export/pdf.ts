import { jsPDF } from "jspdf";
// `svg2pdf.js` attaches itself to `jsPDF.prototype` as a side-effect on import.
// `jspdf-blend-modes` tries to lazy-import it internally, but under Vite's
// pre-bundled ESM that lazy import doesn't reliably patch our `jsPDF` instance,
// so we eagerly import it here to guarantee `pdf.svg(...)` exists.
import "svg2pdf.js";
import { renderSvgWithBlendModes } from "jspdf-blend-modes";
import type { StickerTemplate } from "@/sticker/template";
import { STICKER_VIEWBOX } from "@/sticker/svg";
import { SVG_SELECTORS } from "@/sticker/selectors";

/** PDF page height in points; width is derived from the sticker aspect ratio. */
const PDF_PAGE_HEIGHT_PT = 6 * 72;

/**
 * Suppress the black stroke on the sticker's background rect for the duration
 * of the export. Project-specific tweak that's outside the blend-mode library's
 * concern, so it lives inline here. Returns a `restore()` to put the original
 * stroke back.
 */
function suppressBgStroke(svg: SVGSVGElement): () => void {
  const bgRect = svg.querySelector<SVGElement>(SVG_SELECTORS.bgRect);
  if (!bgRect) return () => {};
  const prev = bgRect.style.stroke;
  bgRect.style.stroke = "none";
  return () => {
    bgRect.style.stroke = prev;
  };
}

/**
 * Converts the SVG sticker into a vector PDF using svg2pdf.js, with CSS
 * `mix-blend-mode: multiply` on the red "E" round-tripped to a real PDF 1.4
 * `/BM /Multiply` ExtGState via the `jspdf-blend-modes` library.
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

  const { DOTTY_TTF_BASE64, OCR_TTF_BASE64 } = await import("@/fonts");

  pdf.addFileToVFS("DOTTY.ttf", DOTTY_TTF_BASE64);
  pdf.addFont("DOTTY.ttf", "DOTTY", "normal");
  pdf.addFileToVFS("OCR.ttf", OCR_TTF_BASE64);
  pdf.addFont("OCR.ttf", "OCR", "normal");

  const svgElement = template.element;
  const restoreBgStroke = suppressBgStroke(svgElement);
  try {
    await renderSvgWithBlendModes(pdf, svgElement, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: PDF_PAGE_HEIGHT_PT,
      blendSelector: SVG_SELECTORS.blend
    });
    pdf.save(filename);
  } finally {
    restoreBgStroke();
  }
}
