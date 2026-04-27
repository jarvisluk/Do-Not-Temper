import "./style.css";
import {
  StickerTemplate,
  DEFAULT_DATA,
  GRADIENT_THEMES,
  type StickerData
} from "./template";
import { downloadPdf, downloadPng, downloadSvg } from "./export";

const $ = <T extends HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing required element: ${sel}`);
  return el;
};

const state: StickerData = { ...DEFAULT_DATA };
const template = StickerTemplate.create();
template.applyAll(state);
const stickerMount = $("#sticker-mount");
template.mountInto(stickerMount);

const highlightSlider = $<HTMLInputElement>("#input-highlight");
const trackBtn = $<HTMLButtonElement>("#btn-track");
const highlightControl = setupHighlightTracking(stickerMount);

highlightSlider.addEventListener("input", () => {
  const t = Number(highlightSlider.value) / 100;
  highlightControl.setManualPosition(t);
});

trackBtn.addEventListener("click", () => {
  highlightControl.startTracking();
});

const titleInput = $<HTMLInputElement>("#input-title");
const serialInput = $<HTMLInputElement>("#input-serial");
const track1Input = $<HTMLInputElement>("#input-track1");
const track2Input = $<HTMLInputElement>("#input-track2");
const gradientList = $<HTMLDivElement>("#input-gradient");

titleInput.value = state.title;
serialInput.value = state.serial;
track1Input.value = state.track1;
track2Input.value = state.track2;

const swatchButtons = new Map<string, HTMLButtonElement>();
for (const theme of GRADIENT_THEMES) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "swatch";
  btn.dataset.themeId = theme.id;
  btn.setAttribute("role", "radio");
  btn.setAttribute("aria-label", theme.label);
  btn.title = theme.label;
  const [c1, c2, c3, c4] = theme.stops;
  btn.style.setProperty("--swatch-gradient", `linear-gradient(135deg, ${c1} 0%, ${c2} 35%, ${c3} 65%, ${c4} 100%)`);
  btn.innerHTML = `
    <span class="swatch-chip" aria-hidden="true"></span>
    <span class="swatch-label">${theme.label}</span>
  `;
  btn.addEventListener("click", () => {
    state.gradientId = theme.id;
    template.setGradient(state.gradientId);
    updateSwatchSelection();
    applyThemeToChrome(state.gradientId);
  });
  gradientList.appendChild(btn);
  swatchButtons.set(theme.id, btn);
}

function updateSwatchSelection(): void {
  for (const [id, btn] of swatchButtons) {
    const selected = id === state.gradientId;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-checked", selected ? "true" : "false");
    btn.tabIndex = selected ? 0 : -1;
  }
}
updateSwatchSelection();
applyThemeToChrome(state.gradientId);

/**
 * Pushes the active Gradient theme into CSS variables so chrome
 * elements (e.g. the primary "Save PNG" button) recolor along with
 * the sticker's holo stripe.
 */
function applyThemeToChrome(themeId: string): void {
  const theme = GRADIENT_THEMES.find((t) => t.id === themeId) ?? GRADIENT_THEMES[0];
  // stops: [primary, light, dark, light-echo]. The primary stop is each
  // theme's brand color (e.g. gold, rose, ice-blue) and reads best as a
  // solid button. We slightly darken it for the hover state.
  const [primary] = theme.stops;
  const root = document.documentElement;
  const [c1, c2, c3, c4] = theme.stops;
  root.style.setProperty("--theme-stop-1", c1);
  root.style.setProperty("--theme-stop-2", c2);
  root.style.setProperty("--theme-stop-3", c3);
  root.style.setProperty("--theme-stop-4", c4);

  const solid = ensureSaturated(primary);
  const solidHover = shadeHex(solid, -0.12);
  root.style.setProperty("--theme-solid", solid);
  root.style.setProperty("--theme-solid-hover", solidHover);

  const fg = contrastOn(solid);
  root.style.setProperty("--theme-fg", fg);
  root.style.setProperty(
    "--theme-shadow",
    `0 6px 16px ${hexToRgba(solid, 0.28)}, 0 2px 6px ${hexToRgba(solid, 0.22)}`
  );
}

/**
 * Primary stops are generally brand-colored, but a few themes start on a
 * pale value (e.g. a near-white silver). If luminance is very high, the
 * button would look like a regular ghost button, so nudge the color
 * darker to give it visual weight.
 */
function ensureSaturated(hex: string): string {
  const lum = relativeLuminance(hex);
  if (lum !== null && lum > 0.7) {
    return shadeHex(hex, -0.3);
  }
  return hex;
}


/** Picks black or white text based on luminance of a single background color. */
function contrastOn(hex: string): string {
  const lum = relativeLuminance(hex);
  return lum !== null && lum > 0.55 ? "#111111" : "#ffffff";
}

/** Lightens (amount > 0) or darkens (amount < 0) a hex color. */
function shadeHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const shade = (c: number): number => {
    const target = amount >= 0 ? 255 : 0;
    return Math.round(c + (target - c) * Math.abs(amount));
  };
  const toHex = (c: number): string => c.toString(16).padStart(2, "0");
  return `#${toHex(shade(rgb.r))}${toHex(shade(rgb.g))}${toHex(shade(rgb.b))}`;
}

function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

titleInput.addEventListener("input", () => {
  state.title = titleInput.value;
  template.setTitle(state.title);
});

serialInput.addEventListener("input", () => {
  state.serial = serialInput.value;
  template.setSerial(state.serial);
});

track1Input.addEventListener("input", () => {
  state.track1 = track1Input.value;
  template.setTrack1(state.track1);
});

track2Input.addEventListener("input", () => {
  state.track2 = track2Input.value;
  template.setTrack2(state.track2);
});

$("#btn-reset").addEventListener("click", () => {
  Object.assign(state, DEFAULT_DATA);
  titleInput.value = state.title;
  serialInput.value = state.serial;
  track1Input.value = state.track1;
  track2Input.value = state.track2;
  highlightSlider.value = "50";
  highlightControl.stopTracking();
  highlightControl.setManualPosition(0.5);
  updateSwatchSelection();
  applyThemeToChrome(state.gradientId);
  template.applyAll(state);
});

$("#btn-randomize").addEventListener("click", () => {
  state.serial = randomHex(16);
  state.track1 = randomHex(20);
  state.track2 = randomHex(12);
  serialInput.value = state.serial;
  track1Input.value = state.track1;
  track2Input.value = state.track2;
  template.setSerial(state.serial);
  template.setTrack1(state.track1);
  template.setTrack2(state.track2);
});

$<HTMLButtonElement>("#btn-download-svg").addEventListener("click", () => {
  downloadSvg(template, buildFilename("svg"));
});

$<HTMLButtonElement>("#btn-download-png").addEventListener("click", async (event) => {
  await runExport(event.currentTarget as HTMLButtonElement, "PNG", () =>
    downloadPng(template, buildFilename("png"))
  );
});

$<HTMLButtonElement>("#btn-download-pdf").addEventListener("click", async (event) => {
  await runExport(event.currentTarget as HTMLButtonElement, "PDF", () =>
    downloadPdf(template, buildFilename("pdf"))
  );
});

async function runExport(
  btn: HTMLButtonElement,
  label: string,
  task: () => Promise<void>
): Promise<void> {
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Rendering…";
  try {
    await task();
  } catch (err) {
    console.error(err);
    alert(`Failed to export ${label}. Please try again.`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

function randomHex(len: number): string {
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

type HighlightControl = {
  setManualPosition: (t: number) => void;
  startTracking: () => void;
  stopTracking: () => void;
};

/**
 * Wires pointer events so the highlight band follows the cursor while
 * tracking is active. Clicking anywhere on the page locks the angle.
 */
function setupHighlightTracking(mount: HTMLElement): HighlightControl {
  let targetT: number | null = null;
  let currentT = 0.5;
  let rafHandle = 0;
  let pointerActive = false;
  let tracking = false;

  const LERP = 0.2;
  const EPSILON = 0.0015;

  const setButtonActive = (active: boolean): void => {
    trackBtn.classList.toggle("is-tracking", active);
    trackBtn.textContent = active ? "Click to lock" : "Follow cursor";
  };

  const tick = (): void => {
    rafHandle = 0;
    if (targetT === null) {
      template.setHighlightPosition(null);
      pointerActive = false;
      return;
    }
    currentT += (targetT - currentT) * LERP;
    if (Math.abs(targetT - currentT) < EPSILON) {
      currentT = targetT;
    }
    template.setHighlightPosition(currentT);
    if (currentT !== targetT) {
      rafHandle = requestAnimationFrame(tick);
    }
  };

  const schedule = (): void => {
    if (!rafHandle) rafHandle = requestAnimationFrame(tick);
  };

  const lockPosition = (): void => {
    if (!tracking) return;
    tracking = false;
    setButtonActive(false);
    if (targetT !== null) {
      currentT = targetT;
      template.setHighlightPosition(currentT);
      highlightSlider.value = String(Math.round(currentT * 100));
    }
  };

  document.addEventListener("pointermove", (event) => {
    if (!tracking) return;
    const rect = mount.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    const diag = (nx + (1 - ny)) / 2;
    targetT = Math.max(0, Math.min(1, diag));
    if (!pointerActive) {
      currentT = targetT;
      pointerActive = true;
    }
    highlightSlider.value = String(Math.round(targetT * 100));
    schedule();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!tracking) return;
    if ((event.target as HTMLElement).closest("#btn-track")) return;
    lockPosition();
  });

  return {
    setManualPosition(t: number) {
      targetT = Math.max(0, Math.min(1, t));
      currentT = targetT;
      pointerActive = false;
      template.setHighlightPosition(targetT);
    },
    startTracking() {
      tracking = true;
      pointerActive = false;
      setButtonActive(true);
    },
    stopTracking() {
      tracking = false;
      setButtonActive(false);
    }
  };
}

function buildFilename(ext: string): string {
  const slug = state.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sticker";
  return `do-not-tamper-${slug}.${ext}`;
}
