import type { jsPDF } from "jspdf";
import { SVG_CLASS, SVG_SELECTORS } from "@/sticker/selectors";
import { STICKER_VIEWBOX } from "@/sticker/svg";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Registers a custom PDF ExtGState resource that sets blend mode to Multiply,
 * to be referenced as `/<name> gs` in a content stream.
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
export function registerBlendGState(
  pdf: jsPDF,
  name: string,
  mode: "Multiply" | "Normal"
): void {
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

  // Make sure putGStatesDict() is actually called: it's gated behind gStates
  // having at least one entry. A harmless opacity:1 GState is enough.
  type GStateLike = Parameters<typeof pdf.addGState>[1];
  const GStateCtor = (pdf as unknown as { GState: new (params: object) => GStateLike }).GState;
  pdf.addGState(`__force_extgstate_${name}`, new GStateCtor({ opacity: 1 }));
}

/**
 * Returns a fresh standalone `<svg>` root containing only a clone of the
 * accent path (plus the original `<style>` block it depends on for `.st2`).
 * Used for the second-pass render under multiply blend mode in the PDF.
 *
 * Returns `null` if the source SVG has no accent node (defensive — should
 * never happen on a well-formed sticker).
 */
export function buildAccentOnlySvg(original: SVGSVGElement): SVGSVGElement | null {
  const accent = original.querySelector<SVGElement>(SVG_SELECTORS.accent);
  if (!accent) return null;

  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  const viewBox =
    original.getAttribute("viewBox") ??
    `0 0 ${STICKER_VIEWBOX.width} ${STICKER_VIEWBOX.height}`;
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const accentClone = accent.cloneNode(true) as SVGElement;
  // CRITICAL: clear the `display:none` that prepareForExport sets. cloneNode
  // brings the inline style with it, which would suppress drawing in svg2pdf.
  accentClone.style.removeProperty("display");
  accentClone.style.removeProperty("visibility");
  // Drop the mix-blend-mode marker class — blending is handled by the PDF
  // ExtGState wrapper, not here. Keep .st2 so the red fill still applies.
  const cls = accentClone.getAttribute("class");
  if (cls) {
    const stripped = cls
      .split(/\s+/)
      .filter((c) => c !== SVG_CLASS.blend)
      .join(" ");
    if (stripped) accentClone.setAttribute("class", stripped);
    else accentClone.removeAttribute("class");
  }
  // Belt and suspenders: set inline fill so the path still paints if the
  // class-based <style> rules don't carry over to svg2pdf's pass.
  accentClone.style.setProperty("fill", "#FF0000", "important");
  accentClone.setAttribute("fill", "#FF0000");

  // Re-attach the original SVG's <style> block so `.st2 { fill: #FF0000 }`
  // resolves inside this isolated SVG tree.
  const originalStyle = original.querySelector("style");
  if (originalStyle) {
    svg.appendChild(originalStyle.cloneNode(true));
  }

  svg.appendChild(accentClone);
  return svg;
}
