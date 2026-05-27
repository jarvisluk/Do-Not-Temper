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
import { prefersReducedMotion } from "./motion";
import {
  clearStoredAppState,
  loadStoredAppState,
  saveStoredAppState
} from "./storage";
import {
  buildShareUrl,
  loadSharedAppState
} from "./share";
import { applyThemeToChrome } from "./themeChrome";

/**
 * Wires the page together once `index.html` is parsed:
 *  - mounts the sticker SVG into `#sticker-mount`
 *  - hydrates controls from a shared URL or the last saved local state
 *  - binds all input events, swatch clicks, and toolbar buttons
 *
 * Bootstrap is intentionally synchronous; no async work runs at import time.
 */
export function bootstrap(): void {
  const dom = queryAppDom();
  const sharedState = loadSharedAppState();
  const initialState = sharedState ?? loadStoredAppState();
  const state: StickerData = { ...initialState.sticker };
  let accentColorEnabled = initialState.accentColorEnabled;
  let highlightPosition = initialState.highlightPosition;
  const reduceMotion = prefersReducedMotion();
  const template = StickerTemplate.create();
  template.applyAll(getEffectiveStickerData(state, accentColorEnabled));
  template.mountInto(dom.stickerMount);

  const persistState = (): void => {
    saveStoredAppState({
      sticker: state,
      accentColorEnabled,
      highlightPosition
    });
  };

  if (sharedState) persistState();

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
  } else if (reduceMotion) {
    template.setHighlightPosition(0.5);
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
    onChange: () => {
      if (!accentColorEnabled) return;
      persistState();
    }
  });
  syncAccentControls(dom, state, template, accentColorEnabled);

  applyThemeToChrome(state.gradientId);

  dom.highlightSlider.addEventListener("input", () => {
    const t = Number(dom.highlightSlider.value) / 100;
    highlightControl.setManualPosition(t);
  });

  dom.trackBtn.addEventListener("click", () => {
    highlightControl.startTracking();
  });

  dom.accentEnabledInput.addEventListener("change", () => {
    accentColorEnabled = dom.accentEnabledInput.checked;
    syncAccentControls(dom, state, template, accentColorEnabled);
    persistState();
    announce(dom, accentColorEnabled ? "Accent color controls enabled." : "Accent color controls hidden.");
  });

  dom.resetBtn.addEventListener("click", () => {
    Object.assign(state, DEFAULT_DATA);
    accentColorEnabled = false;
    highlightPosition = null;
    applyStateToControls(dom, state);
    highlightControl.reset();
    // `reset()` notifies persistence hooks, so clear after it to leave no saved draft.
    clearStoredAppState();
    swatchList.syncSelection();
    accentColorList.syncSelection();
    syncAccentControls(dom, state, template, accentColorEnabled);
    applyThemeToChrome(state.gradientId);
    template.applyAll(getEffectiveStickerData(state, accentColorEnabled));
    template.setHighlightPosition(reduceMotion ? 0.5 : null);
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

  dom.shareLinkBtn.addEventListener("click", async () => {
    const shareUrl = buildShareUrl({
      sticker: state,
      accentColorEnabled,
      highlightPosition
    });

    try {
      await copyText(shareUrl);
      announce(dom, "Share link copied.");
    } catch {
      window.prompt("Copy this link:", shareUrl);
      announce(dom, "Share link ready.");
    }
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
  const restoreControls = disableControlsDuringExport(dom);
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
    restoreControls();
    btn.removeAttribute("aria-busy");
    btn.textContent = originalLabel;
  }
}

function announce(dom: AppDom, message: string): void {
  dom.appStatus.textContent = message;
}

async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard unavailable");
  }

  await navigator.clipboard.writeText(text);
}

function disableControlsDuringExport(dom: AppDom): () => void {
  const controls = [
    dom.titleInput,
    dom.serialInput,
    dom.track1Input,
    dom.track2Input,
    dom.highlightSlider,
    dom.accentEnabledInput,
    dom.accentColorInput,
    dom.trackBtn,
    dom.resetBtn,
    dom.randomizeBtn,
    dom.shareLinkBtn,
    dom.downloadSvgBtn,
    dom.downloadPngBtn,
    dom.downloadPdfBtn,
    ...Array.from(dom.accentPanel.querySelectorAll<HTMLInputElement | HTMLButtonElement>("button,input"))
  ] as const;
  const previousDisabledState = new Map<HTMLElement, boolean>();

  for (const control of controls) {
    previousDisabledState.set(control, control.hasAttribute("disabled"));
    control.setAttribute("disabled", "");
  }

  return () => {
    for (const [control, wasDisabled] of previousDisabledState) {
      if (!wasDisabled) control.removeAttribute("disabled");
    }
  };
}

function syncAccentControls(
  dom: AppDom,
  state: StickerData,
  template: StickerTemplate,
  enabled: boolean
): void {
  dom.accentEnabledInput.checked = enabled;
  dom.accentEnabledInput.setAttribute("aria-expanded", enabled ? "true" : "false");
  dom.accentPanel.hidden = !enabled;

  for (const control of dom.accentPanel.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
    "button,input"
  )) {
    control.disabled = !enabled;
  }

  template.setAccentColor(getEffectiveAccentColor(state, enabled));
}

function getEffectiveStickerData(state: StickerData, accentColorEnabled: boolean): StickerData {
  return {
    ...state,
    accentColor: getEffectiveAccentColor(state, accentColorEnabled)
  };
}

function getEffectiveAccentColor(state: StickerData, accentColorEnabled: boolean): string {
  return accentColorEnabled ? state.accentColor : DEFAULT_DATA.accentColor;
}
