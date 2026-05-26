import {
  sanitizeAppState,
  type AppState
} from "./state";

const SHARE_KEYS = [
  "title",
  "serial",
  "track1",
  "track2",
  "accent",
  "gradient",
  "highlight"
] as const;

export function buildShareUrl(state: AppState, href = window.location.href): string {
  const clean = sanitizeAppState(state);
  const url = new URL(href);
  const params = new URLSearchParams();

  params.set("title", clean.sticker.title);
  params.set("serial", clean.sticker.serial);
  params.set("track1", clean.sticker.track1);
  params.set("track2", clean.sticker.track2);
  params.set("accent", clean.sticker.accentColor.slice(1));
  params.set("gradient", clean.sticker.gradientId);

  if (clean.highlightPosition !== null) {
    params.set("highlight", String(Math.round(clean.highlightPosition * 100)));
  }

  url.hash = params.toString();
  return url.toString();
}

export function loadSharedAppState(href = window.location.href): AppState | null {
  const url = new URL(href);
  const params = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  if (!SHARE_KEYS.some((key) => params.has(key))) return null;

  const highlight = params.get("highlight");
  const highlightValue = highlight === null ? null : Number(highlight) / 100;

  return sanitizeAppState({
    sticker: {
      title: params.get("title"),
      serial: params.get("serial"),
      track1: params.get("track1"),
      track2: params.get("track2"),
      accentColor: readAccentParam(params.get("accent")),
      gradientId: params.get("gradient")
    },
    highlightPosition: highlightValue
  });
}

function readAccentParam(value: string | null): string | null {
  if (value === null) return null;
  return value.startsWith("#") ? value : `#${value}`;
}
