import { jsPDF } from "jspdf";
import "svg2pdf.js";
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

  const svgElement = template.element;
  await pdf.svg(svgElement, {
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt
  });

  pdf.save(filename);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG into <img> for rasterization"));
    img.src = src;
  });
}
