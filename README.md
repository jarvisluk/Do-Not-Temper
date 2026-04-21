# Do Not Tamper — Custom Sticker Tool

An interactive web tool that turns the "Do Not Tamper" game-sticker template into a
customizable design. Tweak the title, serial number, tracking codes, accent color,
and gradient theme, then export as PNG or SVG.

Based on the original [CodePen pen by Richard Rose](https://codepen.io/maneatingfish/pen/KKpZagG) (MIT).

## Features

- Live SVG preview at the native 1268 × 1878 resolution
- Edit the title, serial number, and two tracking code lines
- Adjustable accent color for the large "E" logo
- Six gradient themes for the animated holographic stripe (Gold, Silver, Holographic, Emerald, Rose, Ice)
- Auto-shrinking title when text is too long to fit the label area
- Randomize button for fresh hex codes on demand
- Export as standalone `.svg` (preserves animations + embedded fonts)
- Export as high-res `.png` (2× supersampled by default)

## Tech Stack

- Vite 5 + TypeScript (strict mode)
- Vanilla DOM + CSS (no framework)
- SVG manipulation via `DOMParser` / `XMLSerializer`
- PNG rasterization via `<canvas>` and `Image`

## Project Structure

```
Do-Not-Temper/
├── src/
│   ├── index.html        # App entry (control panel + preview)
│   ├── main.ts           # UI wiring + event handlers
│   ├── template.ts       # SVG template engine + themes
│   ├── export.ts         # SVG / PNG export utilities
│   ├── style.css         # App styles
│   └── assets/
│       └── sticker.svg   # Editable sticker template (with id hooks)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

```bash
npm install
npm run dev      # starts the Vite dev server at http://localhost:5173
npm run build    # type-checks and builds to dist/
npm run preview  # serves the production build locally
```

## How the Template Works

The sticker is a single self-contained SVG (`src/assets/sticker.svg`) with six layers
from the original artwork, plus a `Layer_Edit_text` group containing the editable
text. Key injection points exposed via `id` attributes:

| Element | ID | Purpose |
| --- | --- | --- |
| `<text>` | `edit-title` | Main title (OCR font, 120px) |
| `<text>` | `edit-serial` | Serial number (DOTTY font, 64px) |
| `<tspan>` | `edit-track-1` | Tracking line 1 (DOTTY font) |
| `<tspan>` | `edit-track-2` | Tracking line 2 (DOTTY font) |
| `<path>` | `edit-accent` | Red "E" logo fill |
| `<linearGradient>` | `SVGID_1_` | Animated gold stripe |

`StickerTemplate` in [src/template.ts](src/template.ts) owns the parsed SVG and
exposes typed setters for each field. Adding a new editable field is a matter of
tagging a node in the SVG with an `id` and adding a `setX()` method.

## License

MIT — template artwork credit to Richard Rose.
