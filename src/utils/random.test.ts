import { afterEach, describe, expect, it, vi } from "vitest";
import { randomHex } from "./random";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("randomHex", () => {
  it("returns an uppercase hex string of the requested length", () => {
    expect(randomHex(32)).toMatch(/^[0-9A-F]{32}$/);
  });

  it("maps random values across the hex alphabet deterministically", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.999);

    expect(randomHex(3)).toBe("08F");
  });
});
