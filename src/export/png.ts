import type { StickerTemplate } from "@/sticker/template";
import { triggerDownload } from "./download";
import { rasterizeStickerToCanvas } from "./rasterize";

/** Default oversampling factor; 4× yields ≈ 5072 × 7512 px output. */
const PNG_DEFAULT_SCALE = 4;

/**
 * Rasterizes the current SVG into a PNG at the native viewBox resolution
 * (multiplied by `scale`) and triggers a download.
 */
export async function downloadPng(
  template: StickerTemplate,
  filename = "do-not-tamper.png",
  scale = PNG_DEFAULT_SCALE
): Promise<void> {
  const { canvas, dispose } = await rasterizeStickerToCanvas(template, scale);
  try {
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) throw new Error("Failed to encode PNG");
    triggerDownload(pngBlob, filename);
  } finally {
    dispose();
  }
}
