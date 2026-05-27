import { describe, expect, it } from "vitest";
import {
  contrastOn,
  ensureSaturated,
  hexToRgba,
  lightenColor,
  parseHex,
  relativeLuminance,
  shadeHex
} from "./color";

describe("color helpers", () => {
  it("parses valid six-digit hex colors only", () => {
    expect(parseHex("#0A1b2C")).toEqual({ r: 10, g: 27, b: 44 });
    expect(parseHex("0A1B2C")).toEqual({ r: 10, g: 27, b: 44 });
    expect(parseHex("#123")).toBeNull();
    expect(parseHex("12#3456")).toBeNull();
    expect(parseHex("#zzzzzz")).toBeNull();
  });

  it("shades, lightens, and formats colors predictably", () => {
    expect(shadeHex("#808080", 0.5)).toBe("#c0c0c0");
    expect(shadeHex("#808080", -0.5)).toBe("#404040");
    expect(shadeHex("#808080", 2)).toBe("#ffffff");
    expect(shadeHex("#808080", -2)).toBe("#000000");
    expect(lightenColor("#000000", 0.2)).toBe("#333333");
    expect(hexToRgba("#112233", 0.25)).toBe("rgba(17, 34, 51, 0.25)");
    expect(shadeHex("bad", 0.5)).toBe("bad");
  });

  it("chooses readable foreground colors for light and dark backgrounds", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
    expect(contrastOn("#ffffff")).toBe("#111111");
    expect(contrastOn("#111111")).toBe("#ffffff");
    expect(ensureSaturated("#f5f5f5")).toBe("#acacac");
    expect(ensureSaturated("#336699")).toBe("#336699");
  });
});
