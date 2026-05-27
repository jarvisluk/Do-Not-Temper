import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_DATA } from "@/sticker/data";
import {
  clearStoredAppState,
  loadStoredAppState,
  saveStoredAppState,
  type StoredAppState
} from "./storage";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error("blocked");
  }

  override setItem(): void {
    throw new Error("blocked");
  }

  override removeItem(): void {
    throw new Error("blocked");
  }
}

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
});

describe("app storage", () => {
  it("falls back to defaults without browser storage", () => {
    expect(loadStoredAppState()).toEqual({
      sticker: DEFAULT_DATA,
      accentColorEnabled: false,
      highlightPosition: null
    });
  });

  it("round-trips a valid stored sticker state", () => {
    const storage = useStorage(new MemoryStorage());
    const state: StoredAppState = {
      sticker: {
        title: "Fragile Cargo",
        serial: "A1B2",
        track1: "FACEB00C",
        track2: "C0FFEE",
        accentColor: "#2563EB",
        gradientId: "holographic"
      },
      accentColorEnabled: true,
      highlightPosition: 0.82
    };

    saveStoredAppState(state);

    expect(storage.length).toBe(1);
    expect(loadStoredAppState()).toEqual(state);
  });

  it("sanitizes corrupt, stale, and out-of-range persisted values", () => {
    useStorage(new MemoryStorage()).setItem(
      "do-not-tamper:app-state:v1",
      JSON.stringify({
        version: 1,
        sticker: {
          title: "X".repeat(40),
          serial: "Y".repeat(40),
          track1: "Z".repeat(40),
          track2: "Q".repeat(40),
          accentColor: "not-a-color",
          gradientId: "neon"
        },
        accentColorEnabled: "sometimes",
        highlightPosition: 4
      })
    );

    expect(loadStoredAppState()).toEqual({
      sticker: {
        title: "X".repeat(24),
        serial: "Y".repeat(24),
        track1: "Z".repeat(28),
        track2: "Q".repeat(28),
        accentColor: DEFAULT_DATA.accentColor,
        gradientId: DEFAULT_DATA.gradientId
      },
      accentColorEnabled: false,
      highlightPosition: 1
    });
  });

  it("clears saved state and tolerates blocked storage APIs", () => {
    const storage = useStorage(new MemoryStorage());
    saveStoredAppState({
      sticker: { ...DEFAULT_DATA, title: "Saved" },
      accentColorEnabled: false,
      highlightPosition: 0.25
    });

    clearStoredAppState();

    expect(storage.length).toBe(0);
    useStorage(new ThrowingStorage());
    expect(loadStoredAppState()).toEqual({
      sticker: DEFAULT_DATA,
      accentColorEnabled: false,
      highlightPosition: null
    });
    expect(() =>
      saveStoredAppState({
        sticker: { ...DEFAULT_DATA, title: "Ignored" },
        accentColorEnabled: false,
        highlightPosition: 0.5
      })
    ).not.toThrow();
    expect(() => clearStoredAppState()).not.toThrow();
  });
});

function useStorage(storage: Storage): Storage {
  (globalThis as { window?: Window }).window = { localStorage: storage } as Window;
  return storage;
}
