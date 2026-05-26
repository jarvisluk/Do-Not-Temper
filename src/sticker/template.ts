import { lightenColor } from "@/utils/color";
import {
  GRADIENT_THEMES,
  type GradientId,
  type StickerData
} from "./data";
import { SVG_SELECTORS } from "./selectors";
import { parseStickerSvg } from "./svg";

/**
 * Relative `offset` layout of the 4 highlight stops, measured against a moving
 * base (the center of the shine band). Matches the shape of the original SMIL
 * animation: [narrow bright lead, wide dark gap, narrow bright trail].
 */
const HIGHLIGHT_STOP_LAYOUT: readonly number[] = [0, 0.1, 0.3, 0.5];

interface OffsetAnimateEntry {
  stop: Element;
  animate: Element;
}

export class StickerTemplate {
  private root: SVGSVGElement;
  private offsetAnimates: OffsetAnimateEntry[] = [];
  private offsetAnimatesDetached = false;

  constructor(root: SVGSVGElement) {
    this.root = root;
  }

  static create(): StickerTemplate {
    return new StickerTemplate(parseStickerSvg());
  }

  get element(): SVGSVGElement {
    return this.root;
  }

  /** Mounts the template into a container, replacing any existing child. */
  mountInto(container: HTMLElement): void {
    container.replaceChildren(this.root);
  }

  /**
   * Serializes the current SVG state to a string (for download/export).
   *
   * If the highlight is currently under manual control the SMIL `<animate>`
   * elements have been detached from the DOM. We leave them detached so the
   * exported artifact preserves the user-chosen highlight position as a
   * static snapshot rather than reverting to the default animation.
   */
  serialize(): string {
    return new XMLSerializer().serializeToString(this.root);
  }

  /** Applies a full data snapshot to the SVG. */
  applyAll(data: StickerData): void {
    this.setTitle(data.title);
    this.setSerial(data.serial);
    this.setTrack1(data.track1);
    this.setTrack2(data.track2);
    this.setAccentColor(data.accentColor);
    this.setGradient(data.gradientId);
  }

  setTitle(value: string): void {
    const node = this.root.querySelector(SVG_SELECTORS.title);
    if (node) {
      node.textContent = value;
    }
    this.autoScaleTitle();
  }

  setSerial(value: string): void {
    const node = this.root.querySelector<SVGTextElement>(SVG_SELECTORS.serial);
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setTrack1(value: string): void {
    const node = this.root.querySelector<SVGTSpanElement>(SVG_SELECTORS.track1);
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setTrack2(value: string): void {
    const node = this.root.querySelector<SVGTSpanElement>(SVG_SELECTORS.track2);
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setAccentColor(color: string): void {
    const node = this.root.querySelector<SVGPathElement>(SVG_SELECTORS.accent);
    if (node) {
      node.setAttribute("fill", color);
      node.style.fill = color;
    }
  }

  /**
   * Drives the gold highlight band manually.
   *
   * Pass a number in [0, 1] to anchor the center of the shine band at that
   * position along the gradient axis (0 = bottom-left, 1 = top-right, matching
   * the gradient's diagonal). The built-in SMIL `<animate>` elements are
   * detached on first manual call so they do not fight the JS-driven values.
   *
   * Pass `null` to re-attach the SMIL elements and resume the default
   * auto-looping shine.
   */
  setHighlightPosition(t: number | null): void {
    this.captureOffsetAnimates();
    const gradient = this.root.querySelector(SVG_SELECTORS.gradient);
    if (!gradient) return;

    if (t === null) {
      if (this.offsetAnimatesDetached) {
        this.attachOffsetAnimates();
      }
      return;
    }

    if (!this.offsetAnimatesDetached) {
      this.detachOffsetAnimates();
    }

    const clamped = Math.max(0, Math.min(1, t));
    // Keep the shine band fully inside the gradient by mapping the user
    // position onto the SMIL animation's original travel window (~0.2 to ~0.4
    // for the leading stop), matching the feel of the built-in loop.
    const base = 0.2 + clamped * 0.2;
    const stops = gradient.querySelectorAll("stop");
    stops.forEach((stop, i) => {
      const delta = HIGHLIGHT_STOP_LAYOUT[i];
      if (delta === undefined) return;
      stop.setAttribute("offset", String(base + delta));
    });
  }

  private captureOffsetAnimates(): void {
    if (this.offsetAnimates.length > 0) return;
    const gradient = this.root.querySelector(SVG_SELECTORS.gradient);
    if (!gradient) return;
    const stops = gradient.querySelectorAll("stop");
    stops.forEach((stop) => {
      const anim = stop.querySelector('animate[attributeName="offset"]');
      if (anim) {
        this.offsetAnimates.push({ stop, animate: anim });
      }
    });
  }

  private detachOffsetAnimates(): void {
    for (const entry of this.offsetAnimates) {
      if (entry.animate.parentNode) {
        entry.animate.parentNode.removeChild(entry.animate);
      }
    }
    this.offsetAnimatesDetached = true;
  }

  private attachOffsetAnimates(): void {
    for (const entry of this.offsetAnimates) {
      if (!entry.animate.parentNode) {
        entry.stop.appendChild(entry.animate);
      }
    }
    this.offsetAnimatesDetached = false;
  }

  setGradient(themeId: GradientId): void {
    const theme = GRADIENT_THEMES.find((t) => t.id === themeId) ?? GRADIENT_THEMES[0];
    const gradient = this.root.querySelector(SVG_SELECTORS.gradient);
    if (!gradient) return;
    const stops = gradient.querySelectorAll("stop");
    theme.stops.forEach((color, index) => {
      const stop = stops[index];
      if (!stop) return;
      stop.setAttribute("style", `stop-color:${color}`);
      // Update any inline animate that drives stop-color so color pulses match theme.
      const anim = stop.querySelector('animate[attributeName="stop-color"]');
      if (anim) {
        const pulse = lightenColor(color, 0.2);
        anim.setAttribute("values", `${color};${pulse};${color}`);
      }
    });
  }

  /**
   * Scales the title down when the string gets long so it stays inside
   * the rounded-rect label area. Defaults to 120px at ~8 chars or fewer.
   */
  private autoScaleTitle(): void {
    const node = this.root.querySelector<SVGTextElement>(SVG_SELECTORS.title);
    if (!node) return;
    const text = node.textContent ?? "";
    const len = text.length;
    let size = 120;
    if (len > 8) size = 100;
    if (len > 11) size = 84;
    if (len > 14) size = 68;
    if (len > 18) size = 56;
    node.setAttribute("font-size", `${size}px`);
  }
}

/**
 * Adjusts the font-size of a hex-code text node so very long strings
 * still fit within the ~1140px horizontal space on the sticker.
 */
function applyHexScale(node: SVGElement, len: number): void {
  let size = 64;
  if (len > 20) size = 56;
  if (len > 24) size = 48;
  if (len > 30) size = 40;
  node.setAttribute("font-size", `${size}px`);
}
