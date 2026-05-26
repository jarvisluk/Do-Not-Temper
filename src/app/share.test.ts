import { describe, expect, it } from "vitest";
import { DEFAULT_DATA } from "@/sticker/data";
import {
  buildShareUrl,
  loadSharedAppState
} from "./share";

describe("share links", () => {
  it("round-trips the sticker and highlight state through a URL hash", () => {
    const url = buildShareUrl(
      {
        sticker: {
          title: "Opened Seal",
          serial: "AA-42",
          track1: "FACE-B00C",
          track2: "C0FFEE",
          accentColor: "#2563EB",
          gradientId: "holographic"
        },
        highlightPosition: 0.73
      },
      "https://example.com/customizer"
    );

    expect(loadSharedAppState(url)).toEqual({
      sticker: {
        title: "Opened Seal",
        serial: "AA-42",
        track1: "FACE-B00C",
        track2: "C0FFEE",
        accentColor: "#2563EB",
        gradientId: "holographic"
      },
      highlightPosition: 0.73
    });
  });

  it("returns null when no share parameters are present", () => {
    expect(loadSharedAppState("https://example.com/customizer")).toBeNull();
    expect(loadSharedAppState("https://example.com/customizer#section")).toBeNull();
  });

  it("sanitizes hostile or out-of-range share parameters", () => {
    const state = loadSharedAppState(
      `https://example.com/#title=${"X".repeat(40)}&serial=${"Y".repeat(40)}&track1=${"Z".repeat(40)}&track2=${"Q".repeat(40)}&accent=not-color&gradient=neon&highlight=300`
    );

    expect(state).toEqual({
      sticker: {
        title: "X".repeat(24),
        serial: "Y".repeat(24),
        track1: "Z".repeat(28),
        track2: "Q".repeat(28),
        accentColor: DEFAULT_DATA.accentColor,
        gradientId: DEFAULT_DATA.gradientId
      },
      highlightPosition: 1
    });
  });
});
