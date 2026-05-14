---
name: Do Not Tamper
description: >
  A utilitarian security-label aesthetic inspired by Death Stranding
  tamper-evident stickers. The UI pairs a crisp, light-neutral control
  panel with a rich, animated holographic sticker preview.
colors:
  primary: "#cfb468"
  on-primary: "#111111"

  surface: "#ececec"
  surface-container: "#ffffff"
  surface-container-border: "#f0f0f0"
  on-surface: "#111111"
  on-surface-dim: "#8a8a8a"
  on-surface-section: "#6b6b6b"

  field: "#f5f5f5"
  field-border: "#e5e5e5"
  field-border-hover: "#d4d4d4"
  field-border-focus: "#111111"

  divider: "#ececec"
  accent: "#ff0000"
  accent-soft: "#fff1f1"
  highlight: "#ffd60a"

  sticker-paper: "#ffffff"
  sticker-ink: "#000000"
  sticker-gold: "#cfb468"
  sticker-gold-light: "#eddb9a"
  sticker-gold-dark: "#a67b34"

  theme-solid: "#cfb468"
  theme-solid-hover: "#b69e5c"
  theme-fg: "#111111"

  ghost-hover: "#ebebeb"
  focus-ring: "#e0e0e0"
  selected-ring: "#111111"

typography:
  panel-title:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 18px
    fontWeight: "700"
    lineHeight: 27px
    letterSpacing: -0.2px
  section-heading:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 11px
    fontWeight: "800"
    lineHeight: 16.5px
    letterSpacing: 1.5px
  field-label:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 16.5px
    letterSpacing: 1px
  field-hint:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 10px
    fontWeight: "400"
    lineHeight: 15px
    letterSpacing: 0.6px
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 19.5px
  button:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 18px
    letterSpacing: 0.6px
  button-export:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 12px
    fontWeight: "800"
    lineHeight: 18px
  mono:
    fontFamily: SFMono-Regular, JetBrains Mono, Menlo, Consolas, monospace
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 19.5px
  swatch-label:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 16.5px
    letterSpacing: 0.4px
  footer:
    fontFamily: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Arial, sans-serif
    fontSize: 10px
    fontWeight: "400"
    lineHeight: 15px
    letterSpacing: 0.6px

rounded:
  sm: 8px
  DEFAULT: 12px
  md: 14px
  lg: 20px
  track: 3px

spacing:
  unit: 8px
  field-gap: 6px
  field-margin: 14px
  section-gap: 18px
  section-padding: 20px
  panel-padding: 24px
  layout-gap: 32px
  layout-padding: 32px

components:
  panel-card:
    backgroundColor: "{colors.surface-container}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel-padding}"

  panel-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.panel-title}"

  section-heading:
    textColor: "{colors.on-surface-section}"
    typography: "{typography.section-heading}"

  section-divider:
    backgroundColor: "{colors.divider}"
    height: 1px

  field-label:
    textColor: "{colors.on-surface-dim}"
    typography: "{typography.field-label}"

  field-input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-surface}"
    typography: "{typography.mono}"
    rounded: "{rounded.DEFAULT}"
    padding: 10px 12px

  field-input-hover:
    backgroundColor: "{colors.field}"

  field-input-focus:
    backgroundColor: "{colors.sticker-paper}"

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-export}"
    rounded: "{rounded.DEFAULT}"
    padding: 12px 10px

  button-primary-hover:
    backgroundColor: "{colors.theme-solid-hover}"

  button-ghost:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: 10px 14px

  button-ghost-hover:
    backgroundColor: "{colors.ghost-hover}"

  swatch-chip:
    backgroundColor: "{colors.sticker-gold}"
    rounded: "{rounded.sm}"
    size: 26px

  swatch-button:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-surface}"
    typography: "{typography.swatch-label}"
    rounded: "{rounded.md}"
    padding: 8px 10px

  swatch-button-selected:
    backgroundColor: "{colors.sticker-paper}"

  swatch-selected-ring:
    backgroundColor: "{colors.selected-ring}"

  preview-stage:
    backgroundColor: transparent
    rounded: "{rounded.lg}"

  sticker-accent:
    backgroundColor: "{colors.accent}"

  sticker-body:
    backgroundColor: "{colors.sticker-paper}"
    textColor: "{colors.sticker-ink}"

  sticker-gradient:
    backgroundColor: "{colors.sticker-gold-light}"

  sticker-gradient-dark:
    backgroundColor: "{colors.sticker-gold-dark}"

  focus-ring:
    backgroundColor: "{colors.focus-ring}"

  footer-text:
    textColor: "{colors.on-surface-dim}"
    typography: "{typography.footer}"

  footer-link:
    textColor: "{colors.on-surface-dim}"
    typography: "{typography.footer}"

  field-hint:
    textColor: "{colors.on-surface-dim}"
    typography: "{typography.field-hint}"

  surface-border:
    backgroundColor: "{colors.surface-container-border}"

  field-border:
    backgroundColor: "{colors.field-border}"

  field-border-hover:
    backgroundColor: "{colors.field-border-hover}"

  field-border-focus:
    backgroundColor: "{colors.field-border-focus}"

  preview-controls:
    backgroundColor: "{colors.surface-container}"
    rounded: "{rounded.lg}"
    padding: 16px 18px

  preview-field-label:
    textColor: "{colors.on-surface-dim}"
    typography: "{typography.field-label}"

  range-track:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.track}"
    height: 6px

  range-thumb:
    backgroundColor: "{colors.theme-solid}"
    size: 18px

  btn-track:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: 6px 12px

  btn-track-tracking:
    backgroundColor: "{colors.theme-solid}"
    textColor: "{colors.theme-fg}"
---

## Brand & Style

The design system channels a utilitarian, logistics-grade visual language
drawn from real-world tamper-evident security labels—specifically the
aesthetic of *Death Stranding*'s cargo stickers. Two visual worlds coexist
in a single interface:

1. **The Sticker** — a bold, dense, high-contrast artifact dominated by
   black ink, bright red accents, and an animated holographic gradient
   stripe that shifts through gold, silver, rose, emerald, ice-blue, and
   holographic rainbow stops.
2. **The Chrome** — a quiet, neutral control panel that sits beside the
   sticker and intentionally stays out of the way. Soft grays, generous
   white space, and pill-shaped controls evoke a premium prototyping tool
   more than a shipping warehouse.

The emotional tone is "government-grade precision meets boutique craft
tool." The interface should feel like a customs office designed by a
Scandinavian studio.

## Colors

### Sticker Palette

The sticker itself is strictly **black on white** with a single **red
accent** (#FF0000) fill used for the "Do Not Tamper" warning diamond.
A four-stop holographic gradient provides the signature shimmer. Six
theme presets are available, each defining four ordered stops:

| Theme        | Stop 1    | Stop 2    | Stop 3    | Stop 4    |
|:-------------|:----------|:----------|:----------|:----------|
| Gold         | `#cfb468` | `#eddb9a` | `#a67b34` | `#eddb9a` |
| Silver       | `#8a8a8a` | `#e8e8e8` | `#4a4a4a` | `#e8e8e8` |
| Holographic  | `#ff6ec7` | `#7afcff` | `#feff9c` | `#a06bff` |
| Emerald      | `#1f6f4a` | `#a8e6c1` | `#0a3f2a` | `#a8e6c1` |
| Rose         | `#b3566b` | `#f6c6d0` | `#6e2233` | `#f6c6d0` |
| Ice          | `#3d7dbf` | `#c8e6ff` | `#1b3d66` | `#c8e6ff` |

Stop 1 is the theme's "brand" color and is promoted into the surrounding
chrome as the primary button fill and tinted shadow source. The hover
state is derived programmatically by darkening that brand color by 12 %
(it is *not* taken from stop 3), so every theme yields a consistent
hover delta regardless of how its stops are arranged. A luminance check
ensures that very pale stops (relative luminance above 0.7, such as
Silver's `#e8e8e8`) are darkened by 30 % before becoming the button
color, so the button always reads as a solid action target.

### Chrome Palette

The app background is a cool-neutral light gray (`#ececec`) and the
control panel is pure white. Text is near-black (`#111111`) with dimmed
metadata in `#8a8a8a`. Section headings use a mid-gray (`#6b6b6b`).
Dividers are barely-there lines matching the background gray. This
restrained palette ensures the sticker preview is always the brightest,
most saturated element on the page.

## Typography

Two font stacks serve different purposes:

- **UI font** — The system sans-serif stack (`-apple-system`,
  `BlinkMacSystemFont`, `Segoe UI`, Inter, Roboto) is used for all
  chrome: panel title, section headings, field labels, buttons, and
  footer text. It keeps the tool feeling native and fast-loading.
- **Mono font** — `SFMono-Regular`, `JetBrains Mono`, Menlo, Consolas
  are used exclusively for text-input fields where users type hex serial
  numbers and tracking codes. The monospace face reinforces the
  "machine-printed label" metaphor.

All labels and section headings are **uppercase** with expanded letter
spacing (1–1.5 px) to mimic the bureaucratic typographic convention of
shipping manifests. The base font size is 13 px with a 1.5 line height.
Antialiasing is forced to subpixel rendering (`-webkit-font-smoothing:
antialiased`) for crisp, thin letterforms on macOS.

## Layout & Spacing

The layout is a simple **two-column flexbox** that centers the sticker
preview alongside the control panel. On screens narrower than 860 px
the layout collapses into a single centered column with `gap` and
outer `padding` both reduced from 32 px to 20 px; the preview and
control card stretch to the available width up to a 520 px cap.

- **Rhythm:** All spacing derives from an 8 px base unit. Common
  intervals are 6, 8, 10, 14, 18, 20, 24, and 32 px.
- **Panel width:** The control card is fixed at 360 px. The sticker
  preview occupies up to 420 px and maintains its native 1268 × 1878
  aspect ratio.
- **Interior spacing:** Fields stack with 14 px bottom margin. Section
  groups are separated by 18 px of margin plus a 1 px divider.
  The panel body has 24 px padding.
- **Layout gap:** 32 px separates the preview from the control panel
  (20 px in the collapsed single-column layout).
- **Preview column:** Inside the preview column the sticker stage and
  its preview-controls card are stacked with a 14 px gap.

## Elevation & Depth

Elevation is used sparingly. Two shadow levels communicate the visual
hierarchy:

- **Panel card:** A subtle dual-layer shadow (`0 10px 30px rgba(0,0,0,
  0.06), 0 2px 6px rgba(0,0,0, 0.04)`) lifts the white control card
  off the gray background. Combined with a 1 px border at 6 % opacity,
  the card appears to float just above the surface.
- **Preview stage:** A slightly stronger shadow (`0 12px 32px
  rgba(0,0,0, 0.12), 0 2px 6px rgba(0,0,0, 0.08)`) gives the sticker
  image physical weight, as if it were a printed label lying on a desk.
- **Theme shadow:** The primary "Save PNG" button carries a colored
  shadow tinted to the active gradient theme (e.g., gold-tinted at 22–
  28 % opacity) to visually connect it to the sticker.

Focus rings use a 3 px spread black outline at 6–12 % opacity rather
than browser defaults.

## Shapes

The shape language is **uniformly rounded** to feel approachable and
modern, contrasting with the rigid orthographic geometry of the sticker
itself.

| Element       | Radius   | Token             |
|:--------------|:---------|:------------------|
| Panel card    | 20 px    | `rounded.lg`      |
| Preview stage | 20 px    | `rounded.lg`      |
| Swatch chips  | 14 px    | `rounded.md`      |
| Buttons       | 12 px    | `rounded.DEFAULT` |
| Input fields  | 12 px    | `rounded.DEFAULT` |
| Swatch dot    | 8 px     | `rounded.sm`      |
| Range track   | 3 px     | `rounded.track`   |
| Range thumb   | 50 %     | (circular)        |

All interactive *control* elements use the same 12 px radius to create
a family of consistently pill-shaped controls; the range slider's
thinner 3 px track and circular thumb are the only deliberate
exceptions.

## Components

### Panel Card

The sole container in the interface. White background, 20 px radius,
24 px interior padding, and a soft dual-shadow. Holds all control
groups stacked vertically, separated by 1 px dividers in `#ececec`.

### Text Inputs

Inputs sit on a `#f5f5f5` background with a 1 px `#e5e5e5` border.
On hover the border subtly darkens to `#d4d4d4`; on focus the field
turns pure white, the border snaps to `#111111`, and a 3 px focus
ring appears. Text is rendered in the monospace stack to maintain the
serial-number look.

### Buttons

Three button variants:

- **Highlight** — Filled with the active theme color (e.g., gold),
  dark text, and a theme-tinted shadow. Used for the primary export
  action ("Save PNG"). Hover darkens the brand color by 12 % (see
  the Sticker Palette note above).
- **Ghost** — `#f5f5f5` fill with a `#e5e5e5` border. Used for
  secondary actions ("Save SVG", "Save PDF", "Reset"). Hover fills
  darken to `#ebebeb`.
- **Block** — A full-width ghost button with extra vertical padding,
  used for "Randomize codes" and "Reset".

All buttons depress 1 px on `:active` for tactile feedback. Transition
timing is 60 ms ease for transforms and 150 ms ease for color shifts.

### Gradient Swatches

A two-column grid of chip-style radio buttons. Each chip shows a 26 px
rounded gradient dot and a label. The selected chip receives a 2 px
dark ring (`#111111`) and a white inset halo, creating a clear but
non-distracting selection state.

### Preview Stage

The sticker preview is housed in a borderless, fully transparent
container that preserves the SVG's native 1268 × 1878 aspect ratio. No
fill is painted behind the sticker—the stage relies entirely on
`shadow-preview` to anchor it visually as the primary artifact, as if
the label were lying flat on the page. The holographic gradient stripe
animates via SMIL by default and can be steered manually (see
**Preview Controls** below) or set to follow the pointer for an
interactive parallax effect.

### Preview Controls

A second white card sits directly beneath the sticker stage and hosts
the controls that affect the preview itself (not the sticker content).
It mirrors the panel card's visual treatment—same `surface-container`
background, `rounded.lg` corners, `panel-border` hairline, and
`shadow-card` elevation—but uses tighter `16 × 18 px` padding and a
12 px vertical gap between rows. Each row is a horizontal flex with
the field label pinned to the left and the interactive control filling
the remaining space.

### Range Slider

Used for the "Highlight position" control. The slider has a custom
appearance across browsers:

- **Track:** 6 px tall, `field` background with a 1 px `field-border`,
  rounded with `rounded.track` (3 px). Hover darkens the border to
  `field-border-hover`.
- **Thumb:** An 18 px circle filled with the active `theme-solid`
  color, ringed by a 2 px `surface-container` border so the thumb
  reads as a token resting on the track. A subtle 1 px / 4 px
  black-at-18 % drop shadow gives it weight.
- **Interaction:** Cursor is `grab` at rest and `grabbing` while
  pressed. On `:active` the thumb scales to 1.15 to confirm the drag.

Because the thumb inherits `theme-solid`, the slider visually belongs
to the same color family as the primary "Save PNG" button and the
sticker's holo stripe.

### Track Button ("Follow Cursor")

A compact ghost button (`6 × 12 px` padding) that toggles pointer
tracking for the highlight band. It has three visual states:

1. **Default** — Standard ghost styling, label reads "Follow cursor".
2. **Tracking** — While active the button recolors to the theme
   (`theme-solid` fill, `theme-fg` text, `theme-shadow` shadow) and
   pulses opacity between 100 % and 80 % on a 1.5 s `ease-in-out`
   loop. Label switches to "Click to lock".
3. **Locked** — After the user clicks anywhere to commit a position,
   the button returns to its default ghost state and label.

The pulse animation is the only non-static motion in the chrome and is
intentionally reserved for this single "live" state.

### Footer Links

Two underlined inline links sit at the bottom of the control panel,
above the legal/attribution paragraph: one points to a related project
("Damage Sensor Tape"), the other to the GitHub source. Both use the
`footer` typography token in `on-surface-dim`, a 16 px leading
SVG glyph (external-link icon and GitHub mark respectively), a 6 px
gap between icon and label, and `text-underline-offset: 3px`. Hover
and `:focus-visible` raise the color to `on-surface`; the default
focus outline is suppressed in favor of the underline + color shift.

## Do's and Don'ts

- **Do** keep the chrome muted. The sticker is the hero—everything else
  should recede.
- **Do** use uppercase + letter-spacing for all labels and headings to
  maintain the shipping-manifest tone.
- **Do** tint the primary button shadow to the active gradient theme so
  the button visually belongs to the sticker.
- **Don't** introduce additional accent colors in the chrome. The only
  color in the UI should come from the sticker's gradient theme.
- **Don't** use rounded corners on the sticker SVG itself. The sticker
  has hard rectangular edges—only the preview stage container is rounded.
- **Don't** break the monospace treatment on input fields. Hex codes and
  serial numbers must always render in the mono stack.
