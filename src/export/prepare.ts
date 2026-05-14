import { SVG_EXPORT_IDS, SVG_SELECTORS } from "@/sticker/selectors";

export type ExportTarget = "svg" | "pdf";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Applies export-specific fixups to the live SVG DOM and returns a teardown
 * function that restores the original state. Always call `restore()` in a
 * `finally` block — the SVG element is the same one mounted in the preview.
 *
 *  1. Remove the black stroke on the background rect.
 *  2. Handle CSS `mix-blend-mode: multiply` on the accent layer:
 *     - SVG target: replace the inline CSS blend with an SVG `<filter>`
 *       reference so standalone renderers (Inkscape, browser <img>, etc.)
 *       reproduce the multiply effect.
 *     - PDF target: hide the multiply layer entirely. The PDF exporter then
 *       redraws it in a second pass wrapped in an ExtGState that sets
 *       `/BM /Multiply`, so the PDF viewer does the real per-pixel multiply.
 *  3. PDF target only: mirror `dominant-baseline` → `alignment-baseline`,
 *     because svg2pdf.js reads the latter but the sticker SVG sets the former.
 */
export function prepareForExport(
  svg: SVGSVGElement,
  target: ExportTarget = "svg"
): () => void {
  const restorers: (() => void)[] = [];

  const bgRect = svg.querySelector<SVGElement>(SVG_SELECTORS.bgRect);
  if (bgRect) {
    const prev = bgRect.style.stroke;
    bgRect.style.stroke = "none";
    restorers.push(() => {
      bgRect.style.stroke = prev;
    });
  }

  if (target === "pdf") {
    // Hide every multiply-blend element so svg2pdf.js doesn't draw it as a
    // flat opaque fill in the first pass. We'll redraw it in pass 2 with a
    // real PDF /BM /Multiply ExtGState active.
    const blendEls = svg.querySelectorAll<SVGElement>(SVG_SELECTORS.blend);
    for (const el of blendEls) {
      const prevDisplay = el.style.display;
      const prevDisplayPriority = el.style.getPropertyPriority("display");
      el.style.setProperty("display", "none", "important");
      restorers.push(() => {
        if (prevDisplay) el.style.setProperty("display", prevDisplay, prevDisplayPriority);
        else el.style.removeProperty("display");
      });
    }

    // svg2pdf.js reads alignment-baseline but not dominant-baseline.
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

    return () => {
      for (const fn of restorers) fn();
    };
  }

  // SVG target: replace CSS mix-blend-mode with an SVG filter so the exported
  // file renders correctly outside the browser.
  const filterId = SVG_EXPORT_IDS.multiplyFilter;
  let filterEl: SVGFilterElement | null = svg.querySelector(`#${filterId}`);
  let filterWasCreated = false;
  if (!filterEl) {
    filterEl = document.createElementNS(SVG_NS, "filter");
    filterEl.setAttribute("id", filterId);
    filterEl.setAttribute("filterUnits", "objectBoundingBox");
    filterEl.setAttribute("x", "0%");
    filterEl.setAttribute("y", "0%");
    filterEl.setAttribute("width", "100%");
    filterEl.setAttribute("height", "100%");
    const feBlend = document.createElementNS(SVG_NS, "feBlend");
    feBlend.setAttribute("in", "SourceGraphic");
    feBlend.setAttribute("in2", "BackgroundImage");
    feBlend.setAttribute("mode", "multiply");
    filterEl.appendChild(feBlend);

    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVG_NS, "defs");
      svg.prepend(defs);
    }
    defs.appendChild(filterEl);
    filterWasCreated = true;
  }

  const blendEls = svg.querySelectorAll<SVGElement>(SVG_SELECTORS.blend);
  for (const el of blendEls) {
    const prevBlend = el.style.mixBlendMode;
    const prevFilter = el.getAttribute("filter");
    el.style.mixBlendMode = "";
    el.setAttribute("filter", `url(#${filterId})`);
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
