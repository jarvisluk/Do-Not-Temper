import { SVG_EXPORT_IDS, SVG_SELECTORS } from "@/sticker/selectors";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Applies SVG-export fixups to the live SVG DOM and returns a teardown function
 * that restores the original state. Always call `restore()` in a `finally`
 * block — the SVG element is the same one mounted in the preview.
 *
 *  1. Remove the black stroke on the background rect.
 *  2. Replace inline CSS `mix-blend-mode: multiply` on the accent layer with
 *     an SVG `<filter>` reference, so standalone renderers (Inkscape, browser
 *     `<img>`, etc.) reproduce the multiply effect from the exported `.svg`
 *     file.
 *
 * PDF export uses its own pipeline (see `pdf.ts` + `jspdf-blend-modes`) which
 * handles blend modes natively via PDF 1.4 ExtGState — no DOM rewriting needed.
 */
export function prepareForExport(svg: SVGSVGElement): () => void {
  const restorers: (() => void)[] = [];

  const bgRect = svg.querySelector<SVGElement>(SVG_SELECTORS.bgRect);
  if (bgRect) {
    const prev = bgRect.style.stroke;
    bgRect.style.stroke = "none";
    restorers.push(() => {
      bgRect.style.stroke = prev;
    });
  }

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
