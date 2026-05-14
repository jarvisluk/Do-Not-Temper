import type { StickerTemplate } from "@/sticker/template";

export interface HighlightControl {
  /** Sets the highlight band position immediately (no tracking, no animation). */
  setManualPosition(t: number): void;
  /** Enters "follow cursor" mode; pointer events drive the band until locked. */
  startTracking(): void;
  /** Exits tracking mode without locking; restores the idle button label. */
  stopTracking(): void;
}

export interface HighlightControlDeps {
  template: StickerTemplate;
  mount: HTMLElement;
  trackBtn: HTMLButtonElement;
  slider: HTMLInputElement;
}

/**
 * Wires pointer events so the highlight band follows the cursor while
 * tracking is active. Clicking anywhere on the page locks the angle.
 *
 * The controller is fully closed over `deps`; no module-level state.
 */
export function createHighlightControl(deps: HighlightControlDeps): HighlightControl {
  const { template, mount, trackBtn, slider } = deps;

  let targetT: number | null = null;
  let currentT = 0.5;
  let rafHandle = 0;
  let pointerActive = false;
  let tracking = false;

  const LERP = 0.2;
  const EPSILON = 0.0015;

  const setButtonActive = (active: boolean): void => {
    trackBtn.classList.toggle("is-tracking", active);
    trackBtn.textContent = active ? "Click to lock" : "Follow cursor";
  };

  const tick = (): void => {
    rafHandle = 0;
    if (targetT === null) {
      template.setHighlightPosition(null);
      pointerActive = false;
      return;
    }
    currentT += (targetT - currentT) * LERP;
    if (Math.abs(targetT - currentT) < EPSILON) {
      currentT = targetT;
    }
    template.setHighlightPosition(currentT);
    if (currentT !== targetT) {
      rafHandle = requestAnimationFrame(tick);
    }
  };

  const schedule = (): void => {
    if (!rafHandle) rafHandle = requestAnimationFrame(tick);
  };

  const lockPosition = (): void => {
    if (!tracking) return;
    tracking = false;
    setButtonActive(false);
    if (targetT !== null) {
      currentT = targetT;
      template.setHighlightPosition(currentT);
      slider.value = String(Math.round(currentT * 100));
    }
  };

  document.addEventListener("pointermove", (event) => {
    if (!tracking) return;
    const rect = mount.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    const diag = (nx + (1 - ny)) / 2;
    targetT = Math.max(0, Math.min(1, diag));
    if (!pointerActive) {
      currentT = targetT;
      pointerActive = true;
    }
    slider.value = String(Math.round(targetT * 100));
    schedule();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!tracking) return;
    if ((event.target as HTMLElement).closest("#btn-track")) return;
    lockPosition();
  });

  return {
    setManualPosition(t) {
      targetT = Math.max(0, Math.min(1, t));
      currentT = targetT;
      pointerActive = false;
      template.setHighlightPosition(targetT);
    },
    startTracking() {
      tracking = true;
      pointerActive = false;
      setButtonActive(true);
    },
    stopTracking() {
      tracking = false;
      setButtonActive(false);
    }
  };
}
