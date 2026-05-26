import {
  DEFAULT_DATA,
  GRADIENT_IDS,
  type GradientId,
  type StickerData
} from "@/sticker/data";

const STORAGE_KEY = "do-not-tamper:app-state:v1";
const STORAGE_VERSION = 1;

const FIELD_LIMITS = {
  title: 24,
  serial: 24,
  track1: 28,
  track2: 28
} as const;

export interface StoredAppState {
  sticker: StickerData;
  /** `null` keeps the SVG's original animated highlight on first load. */
  highlightPosition: number | null;
}

interface PersistedAppState {
  version: typeof STORAGE_VERSION;
  sticker: StickerData;
  highlightPosition: number | null;
}

export function loadStoredAppState(): StoredAppState {
  let raw: string | null;
  try {
    raw = safeStorage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return defaultStoredState();
  }

  if (!raw) return defaultStoredState();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return defaultStoredState();
    }

    return {
      sticker: readStickerData(parsed.sticker),
      highlightPosition: readHighlightPosition(parsed.highlightPosition)
    };
  } catch {
    return defaultStoredState();
  }
}

export function saveStoredAppState(state: StoredAppState): void {
  const storage = safeStorage();
  if (!storage) return;

  const payload: PersistedAppState = {
    version: STORAGE_VERSION,
    sticker: readStickerData(state.sticker),
    highlightPosition: readHighlightPosition(state.highlightPosition)
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Browsers can reject localStorage writes in private mode or under quota.
  }
}

export function clearStoredAppState(): void {
  try {
    safeStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures; reset should still update the live UI.
  }
}

function defaultStoredState(): StoredAppState {
  return {
    sticker: { ...DEFAULT_DATA },
    highlightPosition: null
  };
}

function readStickerData(value: unknown): StickerData {
  const record = isRecord(value) ? value : {};

  return {
    title: readBoundedString(record.title, DEFAULT_DATA.title, FIELD_LIMITS.title),
    serial: readBoundedString(record.serial, DEFAULT_DATA.serial, FIELD_LIMITS.serial),
    track1: readBoundedString(record.track1, DEFAULT_DATA.track1, FIELD_LIMITS.track1),
    track2: readBoundedString(record.track2, DEFAULT_DATA.track2, FIELD_LIMITS.track2),
    accentColor: readHexColor(record.accentColor, DEFAULT_DATA.accentColor),
    gradientId: readGradientId(record.gradientId)
  };
}

function readHighlightPosition(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function readBoundedString(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, maxLength);
}

function readGradientId(value: unknown): GradientId {
  return typeof value === "string" && GRADIENT_IDS.includes(value as GradientId)
    ? (value as GradientId)
    : DEFAULT_DATA.gradientId;
}

function readHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
