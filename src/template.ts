import stickerSvgRaw from "./assets/sticker.svg?raw";

export type GradientTheme = {
  id: string;
  label: string;
  stops: [string, string, string, string];
};

export const GRADIENT_THEMES: GradientTheme[] = [
  { id: "gold", label: "Gold", stops: ["#cfb468", "#eddb9a", "#a67b34", "#eddb9a"] },
  { id: "silver", label: "Silver", stops: ["#8a8a8a", "#e8e8e8", "#4a4a4a", "#e8e8e8"] },
  { id: "holographic", label: "Holographic", stops: ["#ff6ec7", "#7afcff", "#feff9c", "#a06bff"] },
  { id: "emerald", label: "Emerald", stops: ["#1f6f4a", "#a8e6c1", "#0a3f2a", "#a8e6c1"] },
  { id: "rose", label: "Rose", stops: ["#b3566b", "#f6c6d0", "#6e2233", "#f6c6d0"] },
  { id: "ice", label: "Ice", stops: ["#3d7dbf", "#c8e6ff", "#1b3d66", "#c8e6ff"] }
];

export type StickerData = {
  title: string;
  serial: string;
  track1: string;
  track2: string;
  accentColor: string;
  gradientId: string;
};

export const DEFAULT_DATA: StickerData = {
  title: "Cryptobiote",
  serial: "332408A403C20477",
  track1: "0B09D564205613289082",
  track2: "52526BA9C806",
  accentColor: "#FF0000",
  gradientId: "gold"
};

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

/**
 * Relative `offset` layout of the 4 highlight stops, measured against a moving
 * base (the center of the shine band). Matches the shape of the original SMIL
 * animation: [narrow bright lead, wide dark gap, narrow bright trail].
 */
const HIGHLIGHT_STOP_LAYOUT: readonly number[] = [0, 0.1, 0.3, 0.5];

type OffsetAnimateEntry = {
  stop: Element;
  animate: Element;
};

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
   * If the highlight is currently under pointer control the SMIL `<animate>`
   * elements have been detached from the DOM. We temporarily re-attach them so
   * the exported artifact always ships with the full auto-animated highlight.
   */
  serialize(): string {
    const wasDetached = this.offsetAnimatesDetached;
    if (wasDetached) {
      this.attachOffsetAnimates();
    }
    const out = new XMLSerializer().serializeToString(this.root);
    if (wasDetached) {
      this.detachOffsetAnimates();
    }
    return out;
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
    const node = this.root.querySelector("#edit-title");
    if (node) {
      node.textContent = value;
    }
    this.autoScaleTitle();
  }

  setSerial(value: string): void {
    const node = this.root.querySelector<SVGTextElement>("#edit-serial");
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setTrack1(value: string): void {
    const node = this.root.querySelector<SVGTSpanElement>("#edit-track-1");
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setTrack2(value: string): void {
    const node = this.root.querySelector<SVGTSpanElement>("#edit-track-2");
    if (node) {
      node.textContent = value;
      applyHexScale(node, value.length);
    }
  }

  setAccentColor(color: string): void {
    const node = this.root.querySelector<SVGPathElement>("#edit-accent");
    if (node) {
      node.setAttribute("fill", color);
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
    const gradient = this.root.querySelector("#SVGID_1_");
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
    const gradient = this.root.querySelector("#SVGID_1_");
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

  setGradient(themeId: string): void {
    const theme = GRADIENT_THEMES.find((t) => t.id === themeId) ?? GRADIENT_THEMES[0];
    const gradient = this.root.querySelector("#SVGID_1_");
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
    const node = this.root.querySelector<SVGTextElement>("#edit-title");
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

/** Lightens a hex color by a ratio (0..1). */
function lightenColor(hex: string, ratio: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * ratio));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
