import { jsPDF } from "jspdf";
import "svg2pdf.js";
import type { StickerTemplate } from "./template";
import { DOTTY_TTF_BASE64, OCR_TTF_BASE64 } from "./fonts";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ExportTarget = "svg" | "pdf";

const SVG_NS = "http://www.w3.org/2000/svg";
const ACCENT_SELECTOR = ".st8";

/**
 * Applies export-specific fixups to the live SVG DOM and returns a teardown
 * function that restores the original state.
 *
 *  1. Remove the black stroke on the background rect (.st0).
 *  2. Handle mix-blend-mode (.st8):
 *     - SVG: replace with an SVG filter reference for standalone renderers.
 *     - PDF: hide the multiply layer here entirely. The PDF export then draws
 *       it in a second pass wrapped in an ExtGState that sets `/BM /Multiply`,
 *       so the PDF renderer does the real per-pixel multiply against whatever
 *       has been drawn underneath. See `downloadPdf`.
 *  3. PDF only: copy `dominant-baseline` → `alignment-baseline` because
 *     svg2pdf.js only reads the latter.
 */
function prepareForExport(svg: SVGSVGElement, target: ExportTarget = "svg"): () => void {
  const restorers: (() => void)[] = [];

  const bgRect = svg.querySelector<SVGElement>(".st0");
  if (bgRect) {
    const prev = bgRect.style.stroke;
    bgRect.style.stroke = "none";
    restorers.push(() => { bgRect.style.stroke = prev; });
  }

  if (target === "pdf") {
    // Hide every multiply-blend element so svg2pdf.js doesn't draw it as a
    // flat opaque fill in the first pass. We'll redraw it in pass 2 with a
    // real PDF /BM /Multiply ExtGState active.
    const blendEls = svg.querySelectorAll<SVGElement>(ACCENT_SELECTOR);
    for (const el of blendEls) {
      const prevDisplay = el.style.display;
      const prevDisplayPriority = el.style.getPropertyPriority("display");
      el.style.setProperty("display", "none", "important");
      restorers.push(() => {
        if (prevDisplay) el.style.setProperty("display", prevDisplay, prevDisplayPriority);
        else el.style.removeProperty("display");
      });
    }

    // svg2pdf.js reads alignment-baseline but not dominant-baseline
    const textEls = svg.querySelectorAll<SVGElement>("[dominant-baseline]");
    for (const el of textEls) {
      const db = el.getAttribute("dominant-baseline")!;
      const prevAb = el.getAttribute("alignment-baseline");
      el.setAttribute("alignment-baseline", db);
      restorers.push(() => {
        if (prevAb !== null) el.setAttribute("alignment-baseline", prevAb);
        else el.removeAttribute("alignment-baseline");
      });
    }
  } else {
    // SVG export: replace CSS mix-blend-mode with an SVG filter
    let filterEl: SVGFilterElement | null = svg.querySelector("#f_multiply");
    let filterWasCreated = false;
    if (!filterEl) {
      filterEl = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filterEl.setAttribute("id", "f_multiply");
      filterEl.setAttribute("filterUnits", "objectBoundingBox");
      filterEl.setAttribute("x", "0%");
      filterEl.setAttribute("y", "0%");
      filterEl.setAttribute("width", "100%");
      filterEl.setAttribute("height", "100%");
      const feBlend = document.createElementNS("http://www.w3.org/2000/svg", "feBlend");
      feBlend.setAttribute("in", "SourceGraphic");
      feBlend.setAttribute("in2", "BackgroundImage");
      feBlend.setAttribute("mode", "multiply");
      filterEl.appendChild(feBlend);

      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.prepend(defs);
      }
      defs.appendChild(filterEl);
      filterWasCreated = true;
    }

    const blendEls = svg.querySelectorAll<SVGElement>(".st8");
    for (const el of blendEls) {
      const prevBlend = el.style.mixBlendMode;
      const prevFilter = el.getAttribute("filter");
      el.style.mixBlendMode = "";
      el.setAttribute("filter", "url(#f_multiply)");
      restorers.push(() => {
        el.style.mixBlendMode = prevBlend;
        if (prevFilter) el.setAttribute("filter", prevFilter);
        else el.removeAttribute("filter");
      });
    }

    const capturedFilterEl = filterEl;
    return () => {
      for (const fn of restorers) fn();
      if (filterWasCreated && capturedFilterEl.parentNode) {
        capturedFilterEl.parentNode.removeChild(capturedFilterEl);
      }
    };
  }

  return () => {
    for (const fn of restorers) fn();
  };
}

/**
 * Registers a custom PDF ExtGState resource that sets blend mode to Multiply,
 * and returns the resource name to use as `/<name> gs` in a content stream.
 *
 * Why this is needed: jsPDF's public `GState` only exposes `opacity` and
 * `stroke-opacity` (its `putGState()` switch hardcodes /ca and /CA). PDF's
 * native blend modes (/BM /Multiply, /Screen, etc., per PDF 1.4) are simply
 * not surfaced. We use jsPDF's documented `internal` API to inject our own
 * ExtGState object alongside the regular gStates dictionary.
 *
 * To make sure jsPDF actually emits an `/ExtGState` entry in the page
 * resources (which only happens when at least one GState exists), we also
 * register a no-op opacity:1 GState through the normal API.
 */
function registerBlendGState(pdf: jsPDF, name: string, mode: "Multiply" | "Normal"): void {
  const internal = (pdf as unknown as {
    internal: {
      newObject: () => number;
      write: (...parts: string[]) => void;
      out: (s: string) => void;
      events: { subscribe: (event: string, cb: () => void) => void };
    };
  }).internal;

  let oid: number | null = null;

  // Phase 1 — when jsPDF asks plugins to add extra resource objects (this
  // fires *before* the resource dictionary is written), emit our ExtGState
  // object and remember its PDF object id.
  internal.events.subscribe("putResources", () => {
    oid = internal.newObject();
    internal.write(`<< /Type /ExtGState /BM /${mode} /ca 1 /CA 1 >>`);
    internal.write("endobj");
  });

  // Phase 2 — when jsPDF emits the /ExtGState dictionary in the page's
  // Resources, append our entry: `/<name> <oid> 0 R`.
  internal.events.subscribe("putGStateDict", () => {
    if (oid !== null) internal.out(`/${name} ${oid} 0 R`);
  });

  // Make sure putGStatesDict() is actually called: it's gated behind
  // gStates having at least one entry. A harmless opacity:1 GState is enough.
  type GStateLike = Parameters<typeof pdf.addGState>[1];
  const GStateCtor = (pdf as unknown as { GState: new (params: object) => GStateLike }).GState;
  pdf.addGState(`__force_extgstate_${name}`, new GStateCtor({ opacity: 1 }));
}

/**
 * Returns a fresh standalone <svg> root containing only a clone of the
 * `#edit-accent` path (plus the original viewBox/CSS rules it depends on).
 * Used for the second-pass render under multiply blend mode.
 */
function buildAccentOnlySvg(original: SVGSVGElement): SVGSVGElement | null {
  const accent = original.querySelector<SVGElement>("#edit-accent");
  if (!accent) return null;

  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  const viewBox = original.getAttribute("viewBox") ?? "0 0 1268 1878";
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const accentClone = accent.cloneNode(true) as SVGElement;
  // CRITICAL: clear the `display:none` we set in prepareForExport. cloneNode
  // brings the inline style with it, which would suppress drawing in svg2pdf.
  accentClone.style.removeProperty("display");
  accentClone.style.removeProperty("visibility");
  // Drop the .st8 mix-blend-mode marker — blending is handled by the PDF
  // ExtGState wrapper, not here. Keep .st2 so the red fill still applies.
  const cls = accentClone.getAttribute("class");
  if (cls) {
    const stripped = cls.split(/\s+/).filter((c) => c !== "st8").join(" ");
    if (stripped) accentClone.setAttribute("class", stripped);
    else accentClone.removeAttribute("class");
  }
  // Belt and suspenders: set inline fill so the path still paints if the
  // class-based <style> rules don't carry over to svg2pdf's pass.
  accentClone.style.setProperty("fill", "#FF0000", "important");
  accentClone.setAttribute("fill", "#FF0000");

  // Re-attach the original SVG's <style> block so .st2 (fill:#FF0000) resolves.
  const originalStyle = original.querySelector("style");
  if (originalStyle) {
    svg.appendChild(originalStyle.cloneNode(true));
  }

  svg.appendChild(accentClone);
  return svg;
}

function buildStandaloneSvg(template: StickerTemplate): string {
  const svg = template.element;
  const restore = prepareForExport(svg);
  try {
    const serialized = new XMLSerializer().serializeToString(svg);
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${serialized}`;
  } finally {
    restore();
  }
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
  scale = 4
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
 * SVG paths, text, and fills into native PDF drawing commands.
 *
 * The mix-blend-mode multiply on the red "E" needs special handling because
 * neither svg2pdf.js nor jsPDF surfaces PDF blend modes. We work around this
 * with a two-pass render:
 *
 *   Pass 1: hide the multiply-blend element(s); svg2pdf draws the gold
 *           background, white E hole, text, etc. into the page.
 *   Pass 2: write a raw `q /GsMul gs ... Q` block into the content stream
 *           and have svg2pdf draw a tiny SVG that contains only the accent
 *           path. Because the surrounding ExtGState has /BM /Multiply, the
 *           PDF renderer multiplies the accent's pixels with whatever was
 *           painted in Pass 1 — exactly like CSS mix-blend-mode would do
 *           on screen.
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

  pdf.addFileToVFS("DOTTY.ttf", DOTTY_TTF_BASE64);
  pdf.addFont("DOTTY.ttf", "DOTTY", "normal");
  pdf.addFileToVFS("OCR.ttf", OCR_TTF_BASE64);
  pdf.addFont("OCR.ttf", "OCR", "normal");

  // Register the multiply ExtGState before any content is written.
  const MUL_GS_NAME = "GsMul";
  registerBlendGState(pdf, MUL_GS_NAME, "Multiply");

  const svgElement = template.element;
  const restore = prepareForExport(svgElement, "pdf");
  const accentOnlySvg = buildAccentOnlySvg(svgElement);

  try {
    // Pass 1: main render with the multiply-blend element hidden.
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt
    });

    if (accentOnlySvg) {
      const internalApi = (pdf as unknown as { internal: { out: (s: string) => void } }).internal;
      // Pass 2: open a graphics-state scope, switch on multiply blend, draw
      // just the accent, then restore. The accent SVG must temporarily live
      // in the document so svg2pdf can run getBoundingClientRect on it.
      accentOnlySvg.style.position = "absolute";
      accentOnlySvg.style.left = "-99999px";
      accentOnlySvg.setAttribute("width", String(baseWidth));
      accentOnlySvg.setAttribute("height", String(baseHeight));
      document.body.appendChild(accentOnlySvg);
      try {
        internalApi.out(`q /${MUL_GS_NAME} gs`);
        await pdf.svg(accentOnlySvg, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt
        });
        internalApi.out("Q");
      } finally {
        accentOnlySvg.remove();
      }
    }

    pdf.save(filename);
  } finally {
    restore();
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
