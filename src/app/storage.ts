import {
  defaultAppState,
  sanitizeAppState,
  type AppState
} from "./state";

const STORAGE_KEY = "do-not-tamper:app-state:v1";
const STORAGE_VERSION = 1;

export type StoredAppState = AppState;

interface PersistedAppState {
  version: typeof STORAGE_VERSION;
  sticker: StoredAppState["sticker"];
  highlightPosition: StoredAppState["highlightPosition"];
}

export function loadStoredAppState(): StoredAppState {
  let raw: string | null;
  try {
    raw = safeStorage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return defaultAppState();
  }

  if (!raw) return defaultAppState();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
      return defaultAppState();
    }

    return sanitizeAppState(parsed);
  } catch {
    return defaultAppState();
  }
}

export function saveStoredAppState(state: StoredAppState): void {
  const storage = safeStorage();
  if (!storage) return;

  const clean = sanitizeAppState(state);
  const payload: PersistedAppState = {
    version: STORAGE_VERSION,
    sticker: clean.sticker,
    highlightPosition: clean.highlightPosition
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
