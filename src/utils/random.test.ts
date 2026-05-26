import { afterEach, describe, expect, it, vi } from "vitest";
import { randomHex } from "./random";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("randomHex", () => {
  it("returns an uppercase hex string of the requested length", () => {
    expect(randomHex(32)).toMatch(/^[0-9A-F]{32}$/);
  });

  it("uses browser crypto values when available", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.set([0, 15, 16, 255]);
        return bytes;
      }
    });

    expect(randomHex(4)).toBe("0F0F");
  });

  it("falls back to Math.random when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.999);

    expect(randomHex(3)).toBe("08F");
  });
});
