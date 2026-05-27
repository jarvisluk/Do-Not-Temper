/**
 * Pure data for the sticker: gradient palette + the user-editable fields.
 *
 * Importing this module pulls in no DOM / no SVG — it's safe to use from
 * tests or from worker contexts.
 */

export const GRADIENT_IDS = [
  "gold",
  "silver",
  "holographic",
  "emerald",
  "rose",
  "ice"
] as const;

export type GradientId = (typeof GRADIENT_IDS)[number];

export interface GradientTheme {
  id: GradientId;
  label: string;
  stops: [string, string, string, string];
}

export const GRADIENT_THEMES: readonly GradientTheme[] = [
  { id: "gold", label: "Gold", stops: ["#cfb468", "#eddb9a", "#a67b34", "#eddb9a"] },
  { id: "silver", label: "Silver", stops: ["#8a8a8a", "#e8e8e8", "#4a4a4a", "#e8e8e8"] },
  { id: "holographic", label: "Holographic", stops: ["#ff6ec7", "#7afcff", "#feff9c", "#a06bff"] },
  { id: "emerald", label: "Emerald", stops: ["#1f6f4a", "#a8e6c1", "#0a3f2a", "#a8e6c1"] },
  { id: "rose", label: "Rose", stops: ["#b3566b", "#f6c6d0", "#6e2233", "#f6c6d0"] },
  { id: "ice", label: "Ice", stops: ["#3d7dbf", "#c8e6ff", "#1b3d66", "#c8e6ff"] }
];

export interface AccentPreset {
  label: string;
  color: string;
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { label: "Warning red", color: "#FF0000" },
  { label: "Signal orange", color: "#F97316" },
  { label: "Hazard yellow", color: "#FACC15" },
  { label: "Ops black", color: "#111111" },
  { label: "Porter blue", color: "#2563EB" },
  { label: "Chiral violet", color: "#7C3AED" }
];

export interface StickerData {
  title: string;
  serial: string;
  track1: string;
  track2: string;
  accentColor: string;
  gradientId: GradientId;
}

export const DEFAULT_DATA: StickerData = {
  title: "Cryptobiote",
  serial: "332408A403C20477",
  track1: "0B09D564205613289082",
  track2: "52526BA9C806",
  accentColor: "#FF0000",
  gradientId: "gold"
};
