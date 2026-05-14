import type { StickerTemplate } from "@/sticker/template";
import { STICKER_VIEWBOX } from "@/sticker/svg";
import { loadImage } from "./download";
import { buildStandaloneSvg } from "./svg";

/**
 * Loads the template's SVG into an `<img>`, draws it into a fresh canvas at
 * `STICKER_VIEWBOX × scale` and returns the canvas plus a teardown that
 * revokes the temporary object URL. Used by both PNG and PDF exports.
 */
export async function rasterizeStickerToCanvas(
  template: StickerTemplate,
  scale: number
): Promise<{ canvas: HTMLCanvasElement; dispose: () => void }> {
  const svgSource = buildStandaloneSvg(template);
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = STICKER_VIEWBOX.width * scale;
    canvas.height = STICKER_VIEWBOX.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error("Could not acquire 2D canvas context");
    }
    // Transparent background keeps the rounded corners crisp; consumers can
    // composite onto any surface.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      canvas,
      dispose: () => URL.revokeObjectURL(url)
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}
