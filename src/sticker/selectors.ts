/**
 * Single source of truth for the selectors / class names baked into
 * `src/assets/sticker.svg`. The sticker SVG was authored externally, so these
 * strings are the coupling surface between the asset and our code.
 *
 * If the SVG is ever re-exported and the IDs / class names change, fix them
 * here once and grep -nE "SVG_SELECTORS\\.|SVG_CLASS_" to find every consumer.
 */

export const SVG_SELECTORS = {
  /** Editable title text node (`<text id="edit-title">`). */
  title: "#edit-title",
  /** Editable serial number (`<text id="edit-serial">`). */
  serial: "#edit-serial",
  /** Editable tracking line 1 (`<tspan id="edit-track-1">`). */
  track1: "#edit-track-1",
  /** Editable tracking line 2 (`<tspan id="edit-track-2">`). */
  track2: "#edit-track-2",
  /** Red "Do Not Tamper" diamond path (`<path id="edit-accent">`). */
  accent: "#edit-accent",
  /** Holographic gradient definition (`<linearGradient id="SVGID_1_">`). */
  gradient: "#SVGID_1_",
  /** Background rect, used to suppress the black stroke during export. */
  bgRect: ".st0",
  /** Mix-blend-mode marker class on the accent layer (multiply on screen). */
  blend: ".st8"
} as const;

export const SVG_CLASS = {
  /** Bare class name (no leading dot) for the multiply-blend marker. */
  blend: "st8"
} as const;

/**
 * IDs we synthesize *inside* the exported SVG (not present on the original
 * sticker.svg). Keeping them here keeps the namespace centralized.
 */
export const SVG_EXPORT_IDS = {
  multiplyFilter: "f_multiply"
} as const;
