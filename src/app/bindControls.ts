import { GRADIENT_THEMES, type GradientId, type StickerData } from "@/sticker/data";
import type { StickerTemplate } from "@/sticker/template";
import type { AppDom } from "./dom";

/**
 * One row per editable text field — the same shape drives both event binding
 * and `state → input` sync, so adding a new field is a single-line change.
 */
interface TextFieldBinding {
  input: (dom: AppDom) => HTMLInputElement;
  key: "title" | "serial" | "track1" | "track2";
  apply: (template: StickerTemplate, value: string) => void;
}

const TEXT_FIELDS: readonly TextFieldBinding[] = [
  { input: (d) => d.titleInput,  key: "title",  apply: (t, v) => t.setTitle(v)  },
  { input: (d) => d.serialInput, key: "serial", apply: (t, v) => t.setSerial(v) },
  { input: (d) => d.track1Input, key: "track1", apply: (t, v) => t.setTrack1(v) },
  { input: (d) => d.track2Input, key: "track2", apply: (t, v) => t.setTrack2(v) }
] as const;

/** Pushes the four editable text fields from `state` back into their inputs. */
export function applyStateToControls(dom: AppDom, state: StickerData): void {
  for (const field of TEXT_FIELDS) {
    field.input(dom).value = state[field.key];
  }
}

/**
 * Wires `input` events for the four text fields, mutating `state` and the
 * sticker template in lockstep. Returns nothing — bindings live for the
 * lifetime of the page.
 */
export function bindTextFields(
  dom: AppDom,
  state: StickerData,
  template: StickerTemplate
): void {
  for (const field of TEXT_FIELDS) {
    const el = field.input(dom);
    el.addEventListener("input", () => {
      const value = el.value;
      state[field.key] = value;
      field.apply(template, value);
    });
  }
}

export interface SwatchList {
  /** Updates aria-checked + visual selection to match `state.gradientId`. */
  syncSelection(): void;
}

export interface SwatchListDeps {
  container: HTMLDivElement;
  state: StickerData;
  template: StickerTemplate;
  /** Side-effect run after the user picks a new theme (e.g. recolor CSS vars). */
  onChange: (themeId: GradientId) => void;
}

/**
 * Renders one chip per gradient theme and wires click → state.gradientId
 * mutation + template recolor. The returned object only exposes `syncSelection`
 * so reset / programmatic theme switches can refresh the visual state.
 */
export function createSwatchList(deps: SwatchListDeps): SwatchList {
  const { container, state, template, onChange } = deps;
  const buttons = new Map<GradientId, HTMLButtonElement>();

  for (const theme of GRADIENT_THEMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.dataset.themeId = theme.id;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-label", theme.label);
    btn.title = theme.label;
    const [c1, c2, c3, c4] = theme.stops;
    btn.style.setProperty(
      "--swatch-gradient",
      `linear-gradient(135deg, ${c1} 0%, ${c2} 35%, ${c3} 65%, ${c4} 100%)`
    );
    btn.innerHTML = `
      <span class="swatch-chip" aria-hidden="true"></span>
      <span class="swatch-label">${theme.label}</span>
    `;
    btn.addEventListener("click", () => {
      state.gradientId = theme.id;
      template.setGradient(state.gradientId);
      syncSelection();
      onChange(state.gradientId);
    });
    container.appendChild(btn);
    buttons.set(theme.id, btn);
  }

  function syncSelection(): void {
    for (const [id, btn] of buttons) {
      const selected = id === state.gradientId;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.tabIndex = selected ? 0 : -1;
    }
  }

  syncSelection();
  return { syncSelection };
}
