import { jsPDF } from "jspdf";
import type { StickerTemplate } from "./template";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the object URL after a short delay so the browser finishes the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildStandaloneSvg(template: StickerTemplate): string {
  // XMLSerializer emits a clean standalone SVG. We prepend the XML declaration
  // so the file is a valid .svg that design tools accept directly.
  const serialized = template.serialize();
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${serialized}`;
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
    // Transparent background keeps the rounded corners crisp; consumers can
    // composite onto any surface.
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
 * Rasterizes the sticker to PNG first, then embeds the bitmap into a single-page
 * PDF sized to the sticker's native aspect ratio (in points). Keeping the canvas
 * rasterization step lets the PDF carry the live gradient/animation frame the
 * user currently sees in the preview without depending on a PDF-side SVG parser.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename = "do-not-tamper.pdf",
  scale = 2
): Promise<void> {
  const baseWidth = 1268;
  const baseHeight = 1878;
  const svgSource = buildStandaloneSvg(template);
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngDataUrl = canvas.toDataURL("image/png");

    // 1 pt = 1/72in. The sticker is tall & narrow, so we size the page to
    // match the sticker's aspect ratio at ~6 inches tall for a print-friendly
    // output.
    const pageHeightPt = 6 * 72;
    const pageWidthPt = (baseWidth / baseHeight) * pageHeightPt;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pageWidthPt, pageHeightPt],
      compress: true
    });
    pdf.addImage(pngDataUrl, "PNG", 0, 0, pageWidthPt, pageHeightPt);
    pdf.save(filename);
  } finally {
    URL.revokeObjectURL(url);
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
