import { downloadPdf, downloadPng, downloadSvg } from "@/export";
import {
  DEFAULT_DATA,
  type StickerData
} from "@/sticker/data";
import { StickerTemplate } from "@/sticker/template";
import { buildFilename } from "@/utils/filename";
import { randomHex } from "@/utils/random";
import {
  applyStateToControls,
  bindTextFields,
  createSwatchList
} from "./bindControls";
import { queryAppDom, type AppDom } from "./dom";
import { createHighlightControl } from "./highlightControl";
import { applyThemeToChrome } from "./themeChrome";

/**
 * Wires the page together once `index.html` is parsed:
 *  - mounts the sticker SVG into `#sticker-mount`
 *  - hydrates form controls from `DEFAULT_DATA`
 *  - binds all input events, swatch clicks, and toolbar buttons
 *
 * Bootstrap is intentionally synchronous; no async work runs at import time.
 */
export function bootstrap(): void {
  const dom = queryAppDom();
  const state: StickerData = { ...DEFAULT_DATA };
  const template = StickerTemplate.create();
  template.applyAll(state);
  template.mountInto(dom.stickerMount);

  const highlightControl = createHighlightControl({
    template,
    mount: dom.stickerMount,
    trackBtn: dom.trackBtn,
    slider: dom.highlightSlider
  });

  applyStateToControls(dom, state);
  bindTextFields(dom, state, template);

  const swatchList = createSwatchList({
    container: dom.gradientList,
    state,
    template,
    onChange: (themeId) => applyThemeToChrome(themeId)
  });

  applyThemeToChrome(state.gradientId);

  dom.highlightSlider.addEventListener("input", () => {
    const t = Number(dom.highlightSlider.value) / 100;
    highlightControl.setManualPosition(t);
  });

  dom.trackBtn.addEventListener("click", () => {
    highlightControl.startTracking();
  });

  dom.resetBtn.addEventListener("click", () => {
    Object.assign(state, DEFAULT_DATA);
    applyStateToControls(dom, state);
    dom.highlightSlider.value = "50";
    highlightControl.stopTracking();
    highlightControl.setManualPosition(0.5);
    swatchList.syncSelection();
    applyThemeToChrome(state.gradientId);
    template.applyAll(state);
  });

  dom.randomizeBtn.addEventListener("click", () => {
    state.serial = randomHex(16);
    state.track1 = randomHex(20);
    state.track2 = randomHex(12);
    applyStateToControls(dom, state);
    template.setSerial(state.serial);
    template.setTrack1(state.track1);
    template.setTrack2(state.track2);
  });

  bindExport(dom, state, template);
}

function bindExport(
  dom: AppDom,
  state: StickerData,
  template: StickerTemplate
): void {
  dom.downloadSvgBtn.addEventListener("click", () => {
    downloadSvg(template, buildFilename(state.title, "svg"));
  });

  dom.downloadPngBtn.addEventListener("click", async (event) => {
    await runExport(event.currentTarget as HTMLButtonElement, "PNG", () =>
      downloadPng(template, buildFilename(state.title, "png"))
    );
  });

  dom.downloadPdfBtn.addEventListener("click", async (event) => {
    await runExport(event.currentTarget as HTMLButtonElement, "PDF", () =>
      downloadPdf(template, buildFilename(state.title, "pdf"))
    );
  });
}

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
