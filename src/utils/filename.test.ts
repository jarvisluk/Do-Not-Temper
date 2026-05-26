import { describe, expect, it } from "vitest";
import { buildFilename } from "./filename";

describe("buildFilename", () => {
  it("builds stable lowercase slugs for sticker exports", () => {
    expect(buildFilename("Fragile Cargo", "svg")).toBe("do-not-tamper-fragile-cargo.svg");
    expect(buildFilename("  BT-7274 / Tape!  ", "png")).toBe("do-not-tamper-bt-7274-tape.png");
  });

  it("falls back when a title has no ASCII slug content", () => {
    expect(buildFilename("贴纸", "pdf")).toBe("do-not-tamper-sticker.pdf");
  });
});
