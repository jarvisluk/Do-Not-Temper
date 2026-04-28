import { jsPDF } from "jspdf";
import "svg2pdf.js";
import type { StickerTemplate } from "./template";
import { DOTTY_TTF_BASE64, OCR_TTF_BASE64 } from "./fonts";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ExportTarget = "svg" | "pdf";

/**
 * Applies export-specific fixups to the live SVG DOM and returns a teardown
 * function that restores the original state.
 *
 *  1. Remove the black stroke on the background rect (.st0).
 *  2. Handle mix-blend-mode (.st8):
 *     - SVG: replace with an SVG filter reference for standalone renderers.
 *     - PDF: svg2pdf.js does not support mix-blend-mode at all, so we
 *       approximate it with fill-opacity to let the underlying pattern show.
 *  3. PDF only: copy `dominant-baseline` → `alignment-baseline` because
 *     svg2pdf.js only reads the latter.
 */
function prepareForExport(svg: SVGSVGElement, target: ExportTarget = "svg"): () => void {
  const restorers: (() => void)[] = [];

  const bgRect = svg.querySelector<SVGElement>(".st0");
  if (bgRect) {
    const prev = bgRect.style.stroke;
    bgRect.style.stroke = "none";
    restorers.push(() => { bgRect.style.stroke = prev; });
  }

  if (target === "pdf") {
    // svg2pdf.js doesn't support mix-blend-mode; approximate with opacity
    const blendEls = svg.querySelectorAll<SVGElement>(".st8");
    for (const el of blendEls) {
      const prevOpacity = el.getAttribute("opacity");
      el.setAttribute("opacity", "0.85");
      el.style.mixBlendMode = "";
      restorers.push(() => {
        if (prevOpacity !== null) el.setAttribute("opacity", prevOpacity);
        else el.removeAttribute("opacity");
        el.style.mixBlendMode = "multiply";
      });
    }

    // svg2pdf.js reads alignment-baseline but not dominant-baseline
    const textEls = svg.querySelectorAll<SVGElement>("[dominant-baseline]");
    for (const el of textEls) {
      const db = el.getAttribute("dominant-baseline")!;
      const prevAb = el.getAttribute("alignment-baseline");
      el.setAttribute("alignment-baseline", db);
      restorers.push(() => {
        if (prevAb !== null) el.setAttribute("alignment-baseline", prevAb);
        else el.removeAttribute("alignment-baseline");
      });
    }
  } else {
    // SVG export: replace CSS mix-blend-mode with an SVG filter
    let filterEl: SVGFilterElement | null = svg.querySelector("#f_multiply");
    let filterWasCreated = false;
    if (!filterEl) {
      filterEl = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filterEl.setAttribute("id", "f_multiply");
      filterEl.setAttribute("filterUnits", "objectBoundingBox");
      filterEl.setAttribute("x", "0%");
      filterEl.setAttribute("y", "0%");
      filterEl.setAttribute("width", "100%");
      filterEl.setAttribute("height", "100%");
      const feBlend = document.createElementNS("http://www.w3.org/2000/svg", "feBlend");
      feBlend.setAttribute("in", "SourceGraphic");
      feBlend.setAttribute("in2", "BackgroundImage");
      feBlend.setAttribute("mode", "multiply");
      filterEl.appendChild(feBlend);

      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.prepend(defs);
      }
      defs.appendChild(filterEl);
      filterWasCreated = true;
    }

    const blendEls = svg.querySelectorAll<SVGElement>(".st8");
    for (const el of blendEls) {
      const prevBlend = el.style.mixBlendMode;
      const prevFilter = el.getAttribute("filter");
      el.style.mixBlendMode = "";
      el.setAttribute("filter", "url(#f_multiply)");
      restorers.push(() => {
        el.style.mixBlendMode = prevBlend;
        if (prevFilter) el.setAttribute("filter", prevFilter);
        else el.removeAttribute("filter");
      });
    }

    const capturedFilterEl = filterEl;
    return () => {
      for (const fn of restorers) fn();
      if (filterWasCreated && capturedFilterEl.parentNode) {
        capturedFilterEl.parentNode.removeChild(capturedFilterEl);
      }
    };
  }

  return () => {
    for (const fn of restorers) fn();
  };
}

function buildStandaloneSvg(template: StickerTemplate): string {
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

/**
 * Rasterizes the current SVG into a PNG at the native 1268 x 1878 resolution
 * (multiplied by a scale factor) and triggers a download.
 */
export async function downloadPng(
  template: StickerTemplate,
  filename = "do-not-tamper.png",
  scale = 2
): Promise<void> {
  const svgSource = buildStandaloneSvg(template);
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const baseWidth = 1268;
    const baseHeight = 1878;
    const canvas = document.createElement("canvas");
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) throw new Error("Failed to encode PNG");
    triggerDownload(pngBlob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Converts the SVG sticker into a vector PDF using svg2pdf.js, which translates
 * SVG paths, text, and fills into native PDF drawing commands. The result stays
 * crisp at any zoom level and prints at full resolution.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename = "do-not-tamper.pdf"
): Promise<void> {
  const baseWidth = 1268;
  const baseHeight = 1878;

  const pageHeightPt = 6 * 72;
  const pageWidthPt = (baseWidth / baseHeight) * pageHeightPt;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [pageWidthPt, pageHeightPt],
    compress: true
  });

  pdf.addFileToVFS("DOTTY.ttf", DOTTY_TTF_BASE64);
  pdf.addFont("DOTTY.ttf", "DOTTY", "normal");
  pdf.addFileToVFS("OCR.ttf", OCR_TTF_BASE64);
  pdf.addFont("OCR.ttf", "OCR", "normal");

  const svgElement = template.element;
  const restore = prepareForExport(svgElement, "pdf");

  try {
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt
    });
    pdf.save(filename);
  } finally {
    restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG into <img> for rasterization"));
    img.src = src;
  });
}
