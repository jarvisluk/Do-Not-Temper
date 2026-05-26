/**
 * Color helpers used by both the sticker template (gradient pulse) and the
 * surrounding app chrome (theme-tinted buttons / shadows).
 *
 * All inputs are `#rrggbb` strings. Functions are pure and return either a
 * new hex string or `null` for malformed input.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb | null {
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const cleaned = match[1];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function toHexByte(c: number): string {
  return c.toString(16).padStart(2, "0");
}

/**
 * Shifts a hex color toward white (`amount > 0`) or black (`amount < 0`).
 * `amount` is in [-1, 1]; magnitudes outside [0, 1] are clamped via `Math.abs`.
 */
export function shadeHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.min(1, Math.abs(amount));
  const shade = (c: number): number => Math.round(c + (target - c) * ratio);
  return `#${toHexByte(shade(rgb.r))}${toHexByte(shade(rgb.g))}${toHexByte(shade(rgb.b))}`;
}

/**
 * Convenience wrapper for `shadeHex(hex, +ratio)` — used by the gradient
 * pulse animation in the sticker template.
 */
export function lightenColor(hex: string, ratio: number): string {
  return shadeHex(hex, Math.abs(ratio));
}

/** Returns relative luminance in [0, 1], or `null` for malformed input. */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Picks black or white text based on luminance of a single background color. */
export function contrastOn(hex: string): string {
  const lum = relativeLuminance(hex);
  return lum !== null && lum > 0.55 ? "#111111" : "#ffffff";
}

/**
 * Primary stops are generally brand-colored, but a few themes start on a pale
 * value (e.g. a near-white silver). If luminance is very high, the button
 * would look like a regular ghost button, so nudge the color darker to give
 * it visual weight.
 */
export function ensureSaturated(hex: string): string {
  const lum = relativeLuminance(hex);
  if (lum !== null && lum > 0.7) {
    return shadeHex(hex, -0.3);
  }
  return hex;
}
