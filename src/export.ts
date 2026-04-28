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
 * Rasterizes the SVG at high resolution via the browser's rendering engine
 * (which correctly handles mix-blend-mode, dominant-baseline, etc.) and embeds
 * the resulting image into a PDF. Scale 4 ≈ 5072×7512 px, well above 300 DPI
 * for any typical sticker print size.
 */
export async function downloadPdf(
  template: StickerTemplate,
  filename = "do-not-tamper.pdf",
  scale = 4
): Promise<void> {
  const baseWidth = 1268;
  const baseHeight = 1878;

  const svgSource = buildStandaloneSvg(template);
  const svgBlob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL("image/png");

    const pageHeightPt = 6 * 72;
    const pageWidthPt = (baseWidth / baseHeight) * pageHeightPt;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pageWidthPt, pageHeightPt],
      compress: true
    });

    pdf.addImage(imgData, "PNG", 0, 0, pageWidthPt, pageHeightPt);
    pdf.save(filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
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
