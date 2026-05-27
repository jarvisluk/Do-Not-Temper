/**
 * Application-level DOM selectors (the IDs declared in `index.html`) and a
 * tiny strongly-typed `$` helper. Kept separate from `sticker/selectors.ts`
 * which contains the SVG-internal selectors baked into `sticker.svg`.
 */

export function $<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing required element: ${sel}`);
  return el;
}

export const APP_SELECTORS = {
  appStatus: "#app-status",
  stickerMount: "#sticker-mount",
  inputTitle: "#input-title",
  inputSerial: "#input-serial",
  inputTrack1: "#input-track1",
  inputTrack2: "#input-track2",
  inputHighlight: "#input-highlight",
  inputGradient: "#input-gradient",
  inputAccentEnabled: "#input-accent-enabled",
  inputAccent: "#input-accent",
  accentPanel: "#accent-color-panel",
  inputAccentCustom: "#input-accent-custom",
  btnTrack: "#btn-track",
  btnReset: "#btn-reset",
  btnRandomize: "#btn-randomize",
  btnShareLink: "#btn-share-link",
  btnDownloadSvg: "#btn-download-svg",
  btnDownloadPng: "#btn-download-png",
  btnDownloadPdf: "#btn-download-pdf"
} as const;

/** Bundle of DOM references the bootstrap wires up once and passes around. */
export interface AppDom {
  appStatus: HTMLElement;
  stickerMount: HTMLElement;
  titleInput: HTMLInputElement;
  serialInput: HTMLInputElement;
  track1Input: HTMLInputElement;
  track2Input: HTMLInputElement;
  highlightSlider: HTMLInputElement;
  gradientList: HTMLDivElement;
  accentEnabledInput: HTMLInputElement;
  accentList: HTMLDivElement;
  accentPanel: HTMLDivElement;
  accentColorInput: HTMLInputElement;
  trackBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  randomizeBtn: HTMLButtonElement;
  shareLinkBtn: HTMLButtonElement;
  downloadSvgBtn: HTMLButtonElement;
  downloadPngBtn: HTMLButtonElement;
  downloadPdfBtn: HTMLButtonElement;
}

export function queryAppDom(): AppDom {
  return {
    appStatus: $(APP_SELECTORS.appStatus),
    stickerMount: $(APP_SELECTORS.stickerMount),
    titleInput: $<HTMLInputElement>(APP_SELECTORS.inputTitle),
    serialInput: $<HTMLInputElement>(APP_SELECTORS.inputSerial),
    track1Input: $<HTMLInputElement>(APP_SELECTORS.inputTrack1),
    track2Input: $<HTMLInputElement>(APP_SELECTORS.inputTrack2),
    highlightSlider: $<HTMLInputElement>(APP_SELECTORS.inputHighlight),
    gradientList: $<HTMLDivElement>(APP_SELECTORS.inputGradient),
    accentEnabledInput: $<HTMLInputElement>(APP_SELECTORS.inputAccentEnabled),
    accentList: $<HTMLDivElement>(APP_SELECTORS.inputAccent),
    accentPanel: $<HTMLDivElement>(APP_SELECTORS.accentPanel),
    accentColorInput: $<HTMLInputElement>(APP_SELECTORS.inputAccentCustom),
    trackBtn: $<HTMLButtonElement>(APP_SELECTORS.btnTrack),
    resetBtn: $<HTMLButtonElement>(APP_SELECTORS.btnReset),
    randomizeBtn: $<HTMLButtonElement>(APP_SELECTORS.btnRandomize),
    shareLinkBtn: $<HTMLButtonElement>(APP_SELECTORS.btnShareLink),
    downloadSvgBtn: $<HTMLButtonElement>(APP_SELECTORS.btnDownloadSvg),
    downloadPngBtn: $<HTMLButtonElement>(APP_SELECTORS.btnDownloadPng),
    downloadPdfBtn: $<HTMLButtonElement>(APP_SELECTORS.btnDownloadPdf)
  };
}
