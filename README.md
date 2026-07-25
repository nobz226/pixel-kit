# PixelKit

A free, no-account, no-payment, browser-based image editing toolkit. Resize, crop, convert, remove backgrounds, and upscale images — all processed locally on the user's device. Nothing is uploaded to a server. Nothing is stored. There is no sign-up wall, no watermark, and no credit system.

Inspired by the workflows of imgupscaler.com, remove.bg, and imageresizer.com, but stripped of accounts, payment gates, and (for v1) server dependency entirely.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Core principles](#core-principles)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture overview](#architecture-overview)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Browser support](#browser-support)
- [Privacy model](#privacy-model)
- [Performance considerations](#performance-considerations)
- [Licensing notes](#licensing-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Credits](#credits)

---

## Why this exists

Most "free" online image tools are free in name only: they gate full resolution, HD exports, or batch processing behind a paywall, force account creation, add watermarks, or quietly upload every image you process to a third-party server. This project exists to be the tool that just does the thing:

- No account
- No payment
- No watermark
- No file size games
- No image ever leaves your device (v1)

## Core principles

1. **Privacy by architecture, not by policy.** Because all processing runs in-browser, there is no server to send images to in the first place — privacy isn't a promise, it's a structural fact about how the app works.
2. **No dark patterns.** No forced sign-up, no "your download is ready, enter your email" gates, no artificial delays to upsell a "pro" tier.
3. **Progressive enhancement over perfection.** If a device can't run a heavier model well, degrade gracefully (smaller models, clear warnings, sensible size limits) rather than silently failing or crashing the tab.
4. **Defensive engineering.** Every image is untrusted input until proven otherwise: corrupt files, huge files, weird aspect ratios, unsupported formats, and low-memory devices are all first-class test cases, not edge cases.

## Features

### v1 (client-side only)

| Tool               | Description                                                              | Underlying tech                                  |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Resize             | Resize to exact dimensions or percentage, with/without aspect ratio lock | Canvas API                                       |
| Crop               | Freeform and fixed-ratio cropping (1:1, 4:3, 16:9, etc.)                 | Canvas API                                       |
| Format conversion  | JPEG ↔ PNG ↔ WebP ↔ AVIF (where supported)                               | Canvas API / `createImageBitmap`                 |
| Compression        | Adjustable quality/size tradeoff slider                                  | Canvas `toBlob` quality param                    |
| Background removal | One-click subject/background segmentation, transparent PNG output        | `@imgly/background-removal` (ONNX + WASM/WebGPU) |
| Upscaling          | 2x / 4x AI super-resolution                                              | `UpscalerJS` (TensorFlow.js)                     |
| Batch processing   | Apply one operation to multiple images, download as ZIP                  | Web Workers + client-side ZIP packing            |

### Possibly v2+ (not committed, evaluate based on real usage)

- Optional server-side fallback for background removal/upscaling on very large images or low-power devices
- More upscaling model choices (anime/illustration-specific models)
- Basic manual retouching (brightness/contrast/saturation, simple filters)
- PWA / offline install support (natural fit since models are already cached locally)

## Tech stack

- **Framework:** Next.js 16+ (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (used sparingly, for state transitions and drag-and-drop feedback)
- **Image manipulation:** native Canvas API / OffscreenCanvas
- **Background removal:** `@imgly/background-removal` (bundles ONNX Runtime Web)
- **Upscaling:** `UpscalerJS` (bundles TensorFlow.js)
- **Concurrency:** Web Workers for all model inference and heavy Canvas operations
- **Hosting:** Static deploy (Vercel or Netlify) — no application server required for v1
- **No database. No auth provider. No payment provider.**

See [DEV_PLAN.md](./DEV_PLAN.md) for the full phased build plan and [AGENT.md](./AGENT.md) / [SKILLS.md](./SKILLS.md) for conventions used by the coding agent working on this repo.

## Architecture overview

```
┌─────────────────────────────────────────────┐
│                Browser tab                   │
│                                               │
│  ┌───────────┐   ┌────────────────────────┐  │
│  │  Next.js  │   │      Web Worker(s)     │  │
│  │  UI thread│──▶│  - resize/crop/convert │  │
│  │           │◀──│  - bg removal (ONNX)   │  │
│  └───────────┘   │  - upscaling (TF.js)   │  │
│         │        └────────────────────────┘  │
│         ▼                                     │
│  Browser cache (model weights, ~tens of MB,   │
│  downloaded once, reused across sessions)     │
└─────────────────────────────────────────────┘

No network call for the actual image at any point.
Only the first model download touches the network.
```

Every tool is implemented as an independent module with the same basic contract:

```ts
interface ImageTool {
  name: string;
  accepts: string[]; // supported input MIME types
  run(input: ImageBitmap, opts: ToolOptions): Promise<Blob>;
}
```

This keeps tools composable (e.g. resize → then upscale → then convert) and easy for the agent to implement one at a time without touching unrelated code.

## Getting started

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn if you prefer — adjust lockfile accordingly)

### Installation

```bash
git clone <repo-url>
cd pixelkit
npm install
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### Build

```bash
npm run build
npm run start
```

### Environment variables

None required for v1 — there is no backend, no API keys, no secrets. If a server-side fallback is added in v2, its config will be documented here at that time.

## Project structure

```
pixelkit/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # landing / tool picker
│   ├── resize/
│   ├── crop/
│   ├── convert/
│   ├── compress/
│   ├── remove-background/
│   └── upscale/
├── components/
│   ├── ui/                   # shared buttons, sliders, dropzones
│   └── tools/                # tool-specific UI
├── lib/
│   ├── tools/                # ImageTool implementations (resize.ts, crop.ts, etc.)
│   ├── workers/              # Web Worker entrypoints
│   └── canvas-utils.ts       # shared Canvas helpers
├── public/
├── SKILLS.md
├── AGENT.md
├── DEV_PLAN.md
└── README.md
```

## Available scripts

| Command         | Purpose                |
| --------------- | ---------------------- |
| `npm run dev`   | Start local dev server |
| `npm run build` | Production build       |
| `npm run start` | Serve production build |
| `npm run lint`  | Run linter             |
| `npm run test`  | Run test suite         |

## Browser support

Target: latest 2 versions of Chrome, Edge, Firefox, Safari.

- **WebAssembly** required (all target browsers support this).
- **WebGPU** used where available for faster inference, with automatic fallback to WASM/WebGL.
- **SharedArrayBuffer** improves background-removal performance where available (requires correct COOP/COEP headers if self-hosting the model assets — see `@imgly/background-removal` custom asset serving docs).
- Older/low-memory mobile devices: expect slower inference and enforce sane max-input-size warnings rather than letting the tab hang or crash.

## Privacy model

- No images are ever transmitted to any server operated by this project.
- The only network requests made are the initial one-time downloads of model weight files (from the libraries' CDN, or self-hosted — see roadmap), which are then cached by the browser.
- No analytics on image content. If any usage analytics are added later (e.g. plain pageview counts), they will explicitly never include image data, dimensions, or filenames.
- No cookies required for core functionality.

## Performance considerations

- All model inference runs inside Web Workers, never on the main thread.
- Large images are handled by library-level chunking/patch-based processing (UpscalerJS) rather than hand-rolled tiling.
- A max recommended input size is enforced in the UI with a clear warning, since there is no server to catch oversized jobs in v1.
- First-run model download progress is always shown to the user — never a silent multi-second freeze.

## Licensing notes

- `@imgly/background-removal` is **AGPL-licensed**, with a commercial license available from IMG.LY. Confirm which applies to your deployment before shipping publicly at scale.
- `UpscalerJS` is MIT-licensed.
- Review and keep this section updated if models or libraries change.

## Roadmap

- [ ] v1: resize, crop, convert, compress, remove background, upscale — all client-side
- [ ] Batch processing + ZIP export
- [ ] PWA/offline support
- [ ] Evaluate need for optional server-side fallback based on real usage data
- [ ] Additional upscaling models (anime/illustration specific)

## Contributing

This is currently a solo project built with AI-agent assistance (see AGENT.md for the working conventions used). If opened up to outside contributions later, standard fork → branch → PR flow applies, with `npm run lint && npm run test` required to pass before merge.

## Credits

- Background removal powered by [@imgly/background-removal](https://github.com/imgly/background-removal-js)
- Upscaling powered by [UpscalerJS](https://upscalerjs.com/)
- Built with Next.js, TypeScript, Tailwind CSS
