import stickerSvgRaw from "../assets/sticker.svg?raw";

/** Native dimensions of the sticker artwork (viewBox of sticker.svg). */
export const STICKER_VIEWBOX = {
  width: 1268,
  height: 1878
} as const;

/**
 * Parses the raw SVG source once and returns a cloneable root element.
 * Using DOMParser with "image/svg+xml" preserves namespaces, which is
 * required for the embedded animations and filter references to keep working.
 */
export function parseStickerSvg(): SVGSVGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(stickerSvgRaw, "image/svg+xml");
  const err = doc.querySelector("parsererror");
  if (err) {
    throw new Error("Failed to parse sticker SVG: " + err.textContent);
  }
  const root = doc.documentElement as unknown as SVGSVGElement;
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return root;
}
