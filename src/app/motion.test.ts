import { afterEach, describe, expect, it } from "vitest";
import { prefersReducedMotion } from "./motion";

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
});

describe("motion preferences", () => {
  it("defaults to normal motion outside a browser", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("reads the browser reduced-motion media query", () => {
    useMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);

    useMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("tolerates blocked matchMedia implementations", () => {
    (globalThis as { window?: Window }).window = {
      matchMedia: () => {
        throw new Error("blocked");
      }
    } as unknown as Window;

    expect(prefersReducedMotion()).toBe(false);
  });
});

function useMatchMedia(matches: boolean): void {
  (globalThis as { window?: Window }).window = {
    matchMedia: () => ({ matches }) as MediaQueryList
  } as unknown as Window;
}
