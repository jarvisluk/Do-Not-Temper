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
  createAccentColorList,
  createSwatchList
} from "./bindControls";
import { queryAppDom, type AppDom } from "./dom";
import { createHighlightControl } from "./highlightControl";
import {
  clearStoredAppState,
  loadStoredAppState,
  saveStoredAppState
} from "./storage";
import { applyThemeToChrome } from "./themeChrome";

/**
 * Wires the page together once `index.html` is parsed:
 *  - mounts the sticker SVG into `#sticker-mount`
 *  - hydrates form controls from the last saved local state, falling back to defaults
 *  - binds all input events, swatch clicks, and toolbar buttons
 *
 * Bootstrap is intentionally synchronous; no async work runs at import time.
 */
export function bootstrap(): void {
  const dom = queryAppDom();
  const storedState = loadStoredAppState();
  const state: StickerData = { ...storedState.sticker };
  let highlightPosition = storedState.highlightPosition;
  const template = StickerTemplate.create();
  template.applyAll(state);
  template.mountInto(dom.stickerMount);

  const persistState = (): void => {
    saveStoredAppState({
      sticker: state,
      highlightPosition
    });
  };

  const highlightControl = createHighlightControl({
    template,
    mount: dom.stickerMount,
    trackBtn: dom.trackBtn,
    slider: dom.highlightSlider,
    onPositionChange: (position) => {
      highlightPosition = position;
      persistState();
    }
  });

  applyStateToControls(dom, state);
  if (highlightPosition !== null) {
    dom.highlightSlider.value = String(Math.round(highlightPosition * 100));
    highlightControl.setManualPosition(highlightPosition);
  }
  bindTextFields(dom, state, template, persistState);

  const swatchList = createSwatchList({
    container: dom.gradientList,
    state,
    template,
    onChange: (themeId) => {
      applyThemeToChrome(themeId);
      persistState();
    }
  });
  const accentColorList = createAccentColorList({
    container: dom.accentList,
    customInput: dom.accentColorInput,
    state,
    template,
    onChange: persistState
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
    highlightPosition = null;
    applyStateToControls(dom, state);
    highlightControl.reset();
    // `reset()` notifies persistence hooks, so clear after it to leave no saved draft.
    clearStoredAppState();
    swatchList.syncSelection();
    accentColorList.syncSelection();
    applyThemeToChrome(state.gradientId);
    template.applyAll(state);
    template.setHighlightPosition(null);
    announce(dom, "Sticker reset to defaults.");
  });

  dom.randomizeBtn.addEventListener("click", () => {
    state.serial = randomHex(16);
    state.track1 = randomHex(20);
    state.track2 = randomHex(12);
    applyStateToControls(dom, state);
    template.setSerial(state.serial);
    template.setTrack1(state.track1);
    template.setTrack2(state.track2);
    persistState();
    announce(dom, "Tracking codes randomized.");
  });

  bindExport(dom, state, template);
}

function bindExport(
  dom: AppDom,
  state: StickerData,
  template: StickerTemplate
): void {
  dom.downloadSvgBtn.addEventListener("click", async (event) => {
    await runExport(
      dom,
      event.currentTarget as HTMLButtonElement,
      "SVG",
      async () => {
        downloadSvg(template, buildFilename(state.title, "svg"));
      }
    );
  });

  dom.downloadPngBtn.addEventListener("click", async (event) => {
    await runExport(
      dom,
      event.currentTarget as HTMLButtonElement,
      "PNG",
      () => downloadPng(template, buildFilename(state.title, "png"))
    );
  });

  dom.downloadPdfBtn.addEventListener("click", async (event) => {
    await runExport(
      dom,
      event.currentTarget as HTMLButtonElement,
      "PDF",
      () => downloadPdf(template, buildFilename(state.title, "pdf"))
    );
  });
}

async function runExport(
  dom: AppDom,
  btn: HTMLButtonElement,
  label: string,
  task: () => Promise<void>
): Promise<void> {
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  btn.textContent = "Rendering…";
  announce(dom, `Rendering ${label}.`);
  try {
    await task();
    announce(dom, `${label} export ready.`);
  } catch (err) {
    console.error(err);
    announce(dom, `${label} export failed.`);
    alert(`Failed to export ${label}. Please try again.`);
  } finally {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.textContent = originalLabel;
  }
}

function announce(dom: AppDom, message: string): void {
  dom.appStatus.textContent = message;
}
