import {
  contrastOn,
  ensureSaturated,
  hexToRgba,
  shadeHex
} from "@/utils/color";
import { GRADIENT_THEMES, type GradientId } from "@/sticker/data";

/**
 * Pushes the active gradient theme into CSS variables so chrome elements
 * (the primary "Save PNG" button, slider thumb, etc.) recolor along with the
 * sticker's holo stripe.
 *
 * - stops 1-4 → `--theme-stop-{1..4}`
 * - stop 1 is the brand color, ensured saturated, used as `--theme-solid`
 * - `--theme-solid-hover` is the brand color shaded 12% darker
 * - `--theme-fg` flips black/white based on luminance for AA contrast
 * - `--theme-shadow` is a tinted dual-layer shadow used by `.btn-highlight`
 */
export function applyThemeToChrome(themeId: GradientId): void {
  const theme = GRADIENT_THEMES.find((t) => t.id === themeId) ?? GRADIENT_THEMES[0];
  const root = document.documentElement;

  const [c1, c2, c3, c4] = theme.stops;
  root.style.setProperty("--theme-stop-1", c1);
  root.style.setProperty("--theme-stop-2", c2);
  root.style.setProperty("--theme-stop-3", c3);
  root.style.setProperty("--theme-stop-4", c4);

  const solid = ensureSaturated(c1);
  const solidHover = shadeHex(solid, -0.12);
  root.style.setProperty("--theme-solid", solid);
  root.style.setProperty("--theme-solid-hover", solidHover);

  const fg = contrastOn(solid);
  root.style.setProperty("--theme-fg", fg);
  root.style.setProperty(
    "--theme-shadow",
    `0 6px 16px ${hexToRgba(solid, 0.28)}, 0 2px 6px ${hexToRgba(solid, 0.22)}`
  );
}
