# Development plan

Detailed, phased build plan for the client-side image editing toolkit. Written to be followed directly, phase by phase, alongside a coding agent (this project is being built with DeepSeek V4 Flash via OpenCode). Each phase lists goals, concrete tasks, acceptance criteria, and known risks/pitfalls.

Work phases in order. Do not start a phase until the previous phase's acceptance criteria are met — each phase is a stable checkpoint you should be able to demo.

---

## Phase 0 — Project setup & scaffolding

**Goal:** a running, empty Next.js app with the right tooling in place, so every later phase starts from a clean baseline.

**Tasks:**
1. Scaffold with `npx create-next-app@latest` — TypeScript, App Router, Tailwind CSS, ESLint all enabled.
2. Set up Prettier + ESLint config consistent with each other (avoid conflicting rules).
3. Add `SKILLS.md`, `AGENT.md`, `DEV_PLAN.md`, `README.md` at repo root (this file being one of them).
4. Set up basic CI: GitHub Actions workflow running `npm run lint` and `npm run build` on every push/PR.
5. Set up a minimal test runner (Vitest recommended for speed + native ESM support) with one placeholder test to confirm the pipeline works.
6. Create the base folder structure described in `README.md` (`lib/tools/`, `lib/workers/`, `components/ui/`, `components/tools/`).
7. Build a bare-bones landing page (`app/page.tsx`) that just lists the planned tools as cards/links, even if the linked pages are empty stubs.

**Acceptance criteria:**
- `npm run dev` runs cleanly with no console errors.
- `npm run build` succeeds.
- CI passes on a fresh push.
- Landing page renders and links to (empty) tool pages.

**Time estimate:** 0.5 day.

---

## Phase 1 — Resize / Crop / Convert / Compress (client-only, no AI)

**Goal:** the "boring but essential" tools working end-to-end. This phase has zero AI dependency, so it's the best place to establish your Canvas-handling patterns and UI conventions before the harder AI phases.

**Tasks:**

1. **Shared upload UI** (`components/ui/Dropzone.tsx`)
   - Drag-and-drop + click-to-browse + paste-from-clipboard (Ctrl/Cmd+V)
   - Accept multiple files where the tool supports batch
   - Client-side validation: file type allowlist, max file size, corrupt-file detection (attempt `createImageBitmap`, catch failure gracefully)

2. **Canvas utilities** (`lib/canvas-utils.ts`)
   - `loadImage(file: File): Promise<ImageBitmap>`
   - `canvasToBlob(canvas, mimeType, quality): Promise<Blob>`
   - `downloadBlob(blob, filename)`
   - Helper to preserve/strip EXIF orientation correctly (a classic real-world bug: photos from phones appearing rotated after processing)

3. **Resize tool** (`lib/tools/resize.ts` + `app/resize/page.tsx`)
   - Exact pixel dimensions input
   - Percentage-based resize
   - Aspect ratio lock toggle
   - Live preview before download
   - Upscaling via simple interpolation should be explicitly separated/labeled from the AI upscaler in Phase 3, to avoid user confusion between "resize bigger" (blurry) and "AI upscale" (detail-preserving)

4. **Crop tool** (`lib/tools/crop.ts` + `app/crop/page.tsx`)
   - Freeform drag-to-crop
   - Fixed-ratio presets (1:1, 4:3, 16:9, 3:2, etc.)
   - Numeric fine-tuning of crop bounds

5. **Format conversion tool** (`lib/tools/convert.ts` + `app/convert/page.tsx`)
   - JPEG, PNG, WebP output at minimum; AVIF if `canvas.toBlob` support is present in target browsers (feature-detect, don't assume)
   - Handle transparency correctly when converting to formats that don't support alpha (JPEG) — composite onto a user-chosen background color rather than silently corrupting the image

6. **Compression tool** (`lib/tools/compress.ts` + `app/compress/page.tsx`)
   - Quality slider (0–100) mapped to `toBlob` quality param
   - Live file-size estimate as the user adjusts the slider
   - Before/after visual comparison

7. **Batch processing groundwork**
   - Allow any of the above tools to accept multiple files
   - Process sequentially or with a small worker pool (don't spin up unbounded workers per file)
   - Package results as a ZIP for download (a lightweight client-side zip library, evaluate size before adding)

**Acceptance criteria:**
- All four tools work correctly on: normal JPEGs/PNGs, very large images (20MP+), very small images (under 50px), transparent PNGs, images with EXIF rotation data, and at least one deliberately corrupted file (should show a clear error, not crash).
- Batch mode works for at least 10 files without freezing the tab.
- No memory leaks across repeated operations (check via browser dev tools memory profiler after processing ~20 images in a row).

**Time estimate:** 2–3 days.

**Known pitfalls:**
- EXIF orientation bugs are extremely common and easy to miss until tested with real phone photos.
- `canvas.toBlob` is async and quality behavior differs slightly across browsers — test in more than one browser before considering this phase done.

---

## Phase 2 — Background removal

**Goal:** one-click background removal producing a clean transparent PNG, using `@imgly/background-removal`.

**Tasks:**

1. **Install dependencies**
   ```bash
   npm install @imgly/background-removal onnxruntime-web
   ```

2. **Worker wrapper** (`lib/workers/bg-removal.worker.ts`)
   - Wrap `imglyRemoveBackground()` so it runs off the main thread
   - Surface the library's `progress` callback to the UI for the first-run model download (this download is not instant — a real progress bar matters here, not a generic spinner)
   - Cache awareness: after first run, subsequent calls should be fast (browser + library cache) — verify this is actually happening

3. **UI** (`app/remove-background/page.tsx`)
   - Upload → processing state (with progress) → before/after comparison slider → download
   - Checkerboard background rendering behind the transparent result so users can actually see what got removed
   - Optional: "replace background" secondary feature — composite the cutout onto a solid color or a second uploaded image

4. **Licensing check**
   - Confirm whether AGPL terms require any changes to how the app is distributed/hosted, or whether a commercial license from IMG.LY makes more sense for this project's situation. Document the decision in `README.md`.

5. **QA pass** — test against:
   - Clean studio-style portraits (should be near-perfect)
   - Busy/cluttered backgrounds
   - Product photos on white backgrounds
   - Images with fine detail at edges (hair, fur, semi-transparent objects like glass)
   - Logos with internal negative space (known weak point for most segmentation models — verify behavior and consider a note in the UI if results look poor)
   - Non-person subjects (this matters if the underlying model is tuned mainly for people — verify against product shots, animals, objects)

**Acceptance criteria:**
- Works offline after first model download (verify with browser dev tools network throttling / offline mode).
- Processing time on a mid-range laptop is reasonable (target: a few seconds for a typical photo).
- Clear, honest UI messaging when results are likely to be imperfect (e.g., complex edge cases) rather than presenting a flawed cutout as if it were perfect.
- Licensing decision documented.

**Time estimate:** 1–2 days.

**Known pitfalls:**
- Large model download on first visit — make sure this doesn't block the rest of the app from being usable, and that it's cached correctly across sessions.
- `SharedArrayBuffer` availability affects performance and requires specific COOP/COEP headers if self-hosting assets — verify header configuration on your actual deployment target, not just localhost.

---

## Phase 3 — Upscaling

**Goal:** 2x/4x AI upscaling using UpscalerJS, without needing to hand-roll model conversion or tiling.

**Tasks:**

1. **Install dependencies**
   ```bash
   npm install upscaler @tensorflow/tfjs
   ```
   (choose the TF.js backend appropriate for target environment — plain `@tensorflow/tfjs` for browser WebGL/WebGPU backends)

2. **Worker wrapper** (`lib/workers/upscale.worker.ts`)
   - Instantiate `Upscaler` with a chosen default model
   - Evaluate at least 2–3 of the bundled pretrained models for speed/quality tradeoff before locking in a default
   - Confirm the library's built-in patch-based processing handles large inputs without manual tiling code — test explicitly with a genuinely large image rather than assuming

3. **UI** (`app/upscale/page.tsx`)
   - Upload → scale factor choice (2x / 4x) → processing state → before/after comparison → download
   - Optional: quality/speed toggle if the model options differ meaningfully
   - Max input size warning, since there's no server-side safety net in v1

4. **QA pass** — test against:
   - Old/compressed low-quality photos
   - Screenshots (different artifact profile than photos)
   - Pixel art / game screenshots (may need a different model than photographic content — note this if quality is poor)
   - Anime/illustration-style images if a relevant model is bundled

**Acceptance criteria:**
- 2x and 4x both produce visibly sharper output than naive canvas resize on the same input, side by side.
- No tab freezing/crashing on large inputs — worst case is a clear "image too large, try a smaller one" message.
- Chosen default model documented along with why it was chosen over the alternatives tested.

**Time estimate:** 2–3 days.

**Known pitfalls:**
- Some bundled models are explicitly noted as better suited to Node/GPU environments with significant latency in-browser — verify actual in-browser performance before defaulting to the "best quality" model if it makes the tool feel sluggish.

---

## Phase 4 — Polish, accessibility, performance

**Goal:** production-quality feel across the whole app, not just working tools.

**Tasks:**

1. **Accessibility**
   - Full keyboard navigation for every tool (upload, adjust sliders/crop bounds, trigger processing, download — all without a mouse)
   - Screen reader labels on all interactive controls, especially icon-only buttons
   - Sufficient color contrast (run an automated contrast checker, then verify manually)
   - Focus states visible and logical tab order

2. **Performance**
   - Lighthouse audit on every page — target 90+ on Performance and Accessibility
   - Lazy-load model libraries only when their respective tool page is visited (don't ship the upscaling model bundle to someone using the resize tool)
   - Verify Web Worker usage is actually preventing UI jank during processing (test on a throttled CPU in dev tools)

3. **Micro-interactions**
   - Framer Motion for drag-and-drop feedback, processing-state transitions, before/after slider — used sparingly, not decoratively

4. **Cross-browser QA**
   - Manually verify all tools in Chrome, Firefox, Safari, and at least one mobile browser
   - Confirm graceful degradation messaging on unsupported browsers/devices rather than a silent failure

**Acceptance criteria:**
- Lighthouse scores meet target on all tool pages.
- Full keyboard-only walkthrough of every tool succeeds.
- No unhandled errors across the manual cross-browser pass.

**Time estimate:** ongoing, but budget an initial 2–3 day pass before calling v1 "done."

---

## Phase 5 — Deploy

**Goal:** live, public, static deployment with no backend.

**Tasks:**
1. Connect repo to Vercel or Netlify.
2. Configure build command / output directory (standard Next.js static/SSG output where possible — confirm which routes need to be static vs. server-rendered, though this app should need almost none of the latter).
3. Verify custom headers if self-hosting model assets (COOP/COEP for `SharedArrayBuffer`, correct CORS/cache headers for model weight files).
4. Set up a basic uptime/error-monitoring free tier (e.g. a status page or simple client-side error logging that explicitly never logs image content).
5. Final smoke test on the live deployed URL — not just `localhost` — for every tool.

**Acceptance criteria:**
- Public URL live and working for all tools.
- First-load model download experience verified on the actual production CDN, not just local dev.
- No secrets, API keys, or backend services required — deployment truly has zero ongoing cost drivers tied to usage.

**Time estimate:** 0.5–1 day.

---

## Post-v1: decide, don't assume

Once v1 is live and has real usage:
- Look at real device/browser telemetry (aggregate only, no image data) to see if client-side performance is actually a problem for a meaningful share of users.
- Only then evaluate whether a server-side fallback (Phase "3.5"/v2, previously scoped with Replicate or self-hosted GPU inference) is worth the added complexity, cost, and rate-limiting work.
- Resist adding a backend pre-emptively — the entire value proposition of v1 is that it doesn't need one.

## Working notes for the coding agent

- Build one `ImageTool` at a time. Do not let the agent refactor shared utilities while also implementing a new tool in the same session — split those into separate turns.
- Always ask the agent to write the worker wrapper and the UI as separate files/commits, so a broken UI doesn't obscure a broken worker (or vice versa) during debugging.
- After each tool is implemented, do a manual pass with real, deliberately weird test images before moving to the next task — see `SKILLS.md` for the standing QA checklist to reuse across every tool.
