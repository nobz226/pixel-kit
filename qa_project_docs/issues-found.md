# PixelKit — Found Issues (32)

Found during full codebase + QA doc review. Severity follows the Week 4
deck's scheme: Low (workaround), Medium (affects workflow, workaround),
High (no workaround / blocks deploy).

---

## Issue 1 — 16 lint errors break the lint-and-build CI job
- Type: Bug
- Severity: High
- Priority: High
- Location: components/background/BackgroundEffects.tsx, components/ui/Input.tsx, components/tools/BrushRetouch.tsx
- Problem: `npm run lint` reports 182 problems (16 errors, 166 warnings). The errors:
  - BackgroundEffects.tsx: ~12 react-hooks/purity errors ("Cannot call impure function during render") — Math.random() called during render in FloatingOrbs.
  - Input.tsx: 3 react-hooks/rules-of-hooks errors ("React.useId is called conditionally") at lines 25, 188, 252.
  - BrushRetouch.tsx: 1 react-hooks error ("Calling setState synchronously within an effect") at line 88.
- Expected: lint passes with no errors so CI can merge.
- Actual: lint fails; any merge to dev/main breaks the CI job.

## Issue 2 — Footer GitHub link goes to github.com, not the repo
- Type: Bug
- Severity: Medium
- Priority: Medium
- Location: app/page.tsx line 322
- Problem: The footer "GitHub" link points to `https://github.com` instead of the actual project repo `https://github.com/nobz226/pixel-kit`.
- Expected: Link resolves to the correct, current repo page.
- Actual: Clicking sends users to a generic homepage, not the project.

## Issue 3 — Footer "License" link is a dead anchor
- Type: Bug
- Severity: Medium
- Priority: Medium
- Location: app/page.tsx line 325
- Problem: The "License" link is `href="#license"` but no element with `id="license"` exists anywhere on the page.
- Expected: License link resolves to a real license section, page, or file.
- Actual: Clicking does nothing; the page does not scroll and no license is shown.

## Issue 4 — Phase tags on the tools grid are misleading
- Type: Content
- Severity: Medium
- Priority: Low
- Location: app/page.tsx (tools array)
- Problem: All six tools are shipped and functional (git log: Phase 1-3 complete), but the grid still labels Remove Background as "Phase 2" and Upscale as "Phase 3", implying they are in progress. The QA checklist (item 6) explicitly asks that these tags reflect what is live vs. in progress.
- Expected: Tags indicate shipped/functional status for every tool, or are removed.
- Actual: Users are told two shipped tools are still coming.

## Issue 5 — No per-page title or meta description on tool pages
- Type: Bug (SEO)
- Severity: Medium
- Priority: Medium
- Location: app/layout.tsx (metadata only), app/resize, crop, convert, compress, remove-background, upscale pages
- Problem: All SEO metadata lives in the single root layout. No tool page exports its own `metadata`. Every page serves the same title and description. The QA checklist (item 5) requires an accurate, unique title tag and matching meta description per page, checked in page source.
- Expected: Each tool page has its own unique, accurate title and description.
- Actual: Six pages share one generic title/description.

## Issue 6 — No Open Graph tags or canonical URLs; no robots.txt or sitemap
- Type: Enhancement (SEO)
- Severity: Low
- Priority: Low
- Location: app/layout.tsx, app/
- Problem: Metadata contains no openGraph block, no alternates.canonical, and there is no robots.txt or sitemap.xml in the app. The QA checklist (item 5) asks for OG title/description/image/URL in the raw HTML for every page and a correct canonical per tool page.
- Expected: OG tags and per-page canonical URLs present in raw HTML; robots/sitemap not blocking tool pages.
- Actual: None of these exist; link previews and canonical signals are missing.

## Issue 7 — OffscreenCanvas used without a fallback in EXIF handling
- Type: Bug (compatibility)
- Severity: Medium
- Priority: Medium
- Location: lib/canvas-utils.ts (applyExifOrientation, lines 168-201)
- Problem: `applyExifOrientation` unconditionally creates an `OffscreenCanvas` and calls `transferToImageBitmap`. The QA checklist (item 2) flags Safari/OffscreenCanvas/WebGL/WASM as historically lagging. `canvasToBlob` already falls back to `toBlob` when `convertToBlob` is missing, but the EXIF path has no such fallback.
- Expected: Photo uploads correct orientation on all supported browsers.
- Actual: On browsers without OffscreenCanvas, uploading an EXIF-oriented JPEG throws and fails to load.

## Issue 8 — Effectively no automated tests for core tool logic
- Type: Enhancement (testing)
- Severity: Medium
- Priority: Medium
- Location: lib/canvas-utils/canvas-utils.test.ts, lib/tools/*
- Problem: The suite has a single placeholder test. The pure image logic in lib/tools/* (resize math, crop geometry, convert/compress quality and file-size estimation, output filenames) is untested, despite being ideal white-box test candidates per the Week 4 deck and the project's QA focus.
- Expected: Unit tests cover the pure functions in lib/tools and lib/canvas-utils (EXIF orientation, estimateFileSize, getOutputFilename, resize/crop calculations).
- Actual: `npm test` runs 1 trivial test; a regression in any tool's math would go unnoticed.

---

# PixelKit — Found Issues (20 additional)

Functional bugs and design issues found during a follow-up code audit (Aug 13).
None have been fixed.

## Functional Bugs

### Issue 9 — Upscale output is corrupted (near-black image)
- Type: Bug
- Severity: High
- Location: app/upscale/page.tsx:92-112, lib/workers/upscale.worker.ts:62-68, lib/tools/upscale.ts:56-69
- Problem: The worker posts back tensor data as a `Float32Array` of normalized 0–1 floats, but the main thread wraps the buffer as a `Uint8Array` and feeds it to `rgbToImageBitmap`, which treats the bytes as 0–255 ints. Every channel clamps to 0 or 1.
- Expected: A proper upscaled photo.
- Actual: The "Upscaled" result is black/noise — the flagship tool produces a corrupt image.

### Issue 10 — Resize crashes on an empty dimension field
- Type: Bug
- Severity: High
- Location: app/resize/page.tsx (handleDimensionChange:123, updatePreviews:83, handleProcess:183), lib/tools/resize.ts:75
- Problem: With "Lock aspect ratio" on, clearing one dimension (empty string) leaves the other dimension stale. `calculateResizeDimensions` then computes `NaN` (e.g. `width=200, height=''`), and `new OffscreenCanvas(NaN, NaN)` throws.
- Expected: Either a validation message or a disabled process button.
- Actual: The whole batch errors out; the button's `disabled` check (`!width && !percentage`) also wrongly treats a cleared field as enabled.

### Issue 11 — Crop on multiple images uses a single crop box from the first image
- Type: Bug
- Severity: High
- Location: app/crop/page.tsx (handleFiles:78-84, handleProcess:301, handleMouseMove:178-186)
- Problem: One `cropArea` (clamped to the *first* image's dimensions) is applied to every file. `originalDimensions` is never updated when switching images, and the crop is never recomputed per image.
- Expected: The crop box and its clamps track the currently selected image.
- Actual: For differently sized images the overlay misaligns, numeric clamps are wrong, and processing smaller images throws "Crop region exceeds image bounds", failing the batch.

### Issue 12 — Remove background "Background color" picker is dead
- Type: Bug
- Severity: Medium
- Location: app/remove-background/page.tsx:41, 403-413
- Problem: `backgroundColor` state exists and is shown as a color picker, but it is never applied to the output image. Output is always a transparent PNG.
- Expected: Picking a background color affects the exported image.
- Actual: The control does nothing; the home page advertises "background replacement" that isn't implemented.

### Issue 13 — Remove background checkerboard toggle doesn't clear the canvas
- Type: Bug
- Severity: Low
- Location: app/remove-background/page.tsx:234-247, 369-383
- Problem: The checkerboard is drawn once onto a persistent `<canvas>` when `showCheckerboard` is true. Unchecking only skips future draws; the canvas (and its pixels) stays in the DOM, so the preview still shows a checkerboard.
- Expected: Toggling off shows a plain background; toggling on shows the checkerboard.
- Actual: The toggle appears to do nothing.

### Issue 14 — "Apply & Download" in retouch auto-downloads without confirmation
- Type: Bug (UX)
- Severity: Medium
- Location: app/remove-background/page.tsx:200-207, components/tools/BrushRetouch.tsx:338-356
- Problem: The retouch modal's button says "Apply & Download" but the page triggers a browser download purely from a state effect (`retouchResultBlob`). The user never explicitly clicks download; the download happens immediately on apply.
- Expected: Apply updates the preview; download is a separate, explicit action.
- Actual: A file downloads the moment the brush is applied (and re-downloads on any re-render that re-runs the effect).

### Issue 15 — Upscale "Results" grid never renders
- Type: Bug
- Severity: Medium
- Location: app/upscale/page.tsx:54-56, 575-611
- Problem: The `results` state is rendered in a "Results (n)" panel but is never populated — `handleProcess` only sets `workerState`.
- Expected: Successful upscales appear in the results grid.
- Actual: Dead UI block that always shows zero results.

### Issue 16 — Object URLs leaked on result/thumbnail renders
- Type: Bug (memory)
- Severity: Medium
- Location: app/convert/page.tsx:372-373, app/upscale/page.tsx:585, app/crop/page.tsx:643, app/resize/page.tsx:521, app/compress/page.tsx:353
- Problem: Result grids call `URL.createObjectURL(result.blob)` inline during render and never revoke the URLs.
- Expected: URLs are created once per result and revoked when replaced.
- Actual: New object URLs are minted on every re-render and never released — a steady memory leak during interaction.

### Issue 17 — Resize/convert output is always PNG regardless of original format
- Type: Bug (behavior)
- Severity: Low
- Location: app/resize/page.tsx:224, lib/tools/resize.ts:71
- Problem: Resize (and the resize live-preview) hard-code `image/png` output. Uploading a JPEG and resizing silently converts it to PNG, usually producing a much larger file.
- Expected: Output format matches the input (or is user-selectable).
- Actual: The tool is branded "resize" but also performs an unadvertised format conversion.

## Claims vs. Reality (marketing/UI copy)

### Issue 18 — Compress advertises a before/after visual comparison that doesn't exist
- Type: Content / Feature
- Severity: Medium
- Location: app/page.tsx:45, app/compress/page.tsx
- Problem: The home page card says "before/after visual comparison", and a `ComparisonCanvas` component exists, but the compress page has no comparison slider — only numeric size estimates.
- Expected: Either ship the comparison UI or drop the claim.
- Actual: Advertised feature is missing.

### Issue 19 — Remove Background advertises "background replacement" that isn't implemented
- Type: Content / Feature
- Severity: Medium
- Location: app/page.tsx:56, app/remove-background/page.tsx
- Problem: Card says "background replacement". Only a non-functional color picker exists (see Issue 12).
- Expected: Implement replacement or change the copy.
- Actual: Claim is misleading.

### Issue 20 — Upscale advertises model selection that doesn't exist
- Type: Content / Feature
- Severity: Medium
- Location: app/page.tsx:67, app/upscale/page.tsx:349-374
- Problem: Card says "model selection for photos/art/screenshots". The page only offers a 2x/4x scale toggle — no model picker.
- Expected: Ship a model picker or fix the copy.
- Actual: Advertised feature is missing.

### Issue 21 — Tech stack lists ONNX Runtime, but no ONNX is used
- Type: Content
- Severity: Low
- Location: app/page.tsx:84, package.json:30
- Problem: "ONNX Runtime" is listed in the tech stack and `onnxruntime-web` is a dependency, but the codebase only uses TensorFlow.js (upscale) and imgly (background removal).
- Expected: Either use ONNX or remove it from the list/deps.
- Actual: Misleading stack claim + dead ~1MB dependency.

### Issue 22 — "Phase 1/2/3" tags on shipped tools are misleading
- Type: Content
- Severity: Low
- Location: app/page.tsx:13, 26, 44, 56, 67
- Problem: All six tools are shipped, but Remove Background is tagged "Phase 2" and Upscale "Phase 3", implying they are not live.
- Expected: Reflect shipped status or drop the badges.
- Actual: Users are told live tools are still in progress.

## Design / Consistency

### Issue 23 — AppLayout/ToolLayout and the whole shell design system are unused
- Type: Design (dead code)
- Severity: Medium
- Location: components/layout/AppLayout.tsx, components/ui/{Toolbar,Sidebar,Canvas}.tsx, lib/design-system/*
- Problem: A full tool shell (Toolbar, Sidebar, AppLayout, ToolLayout) and a design-token system were built, but every tool page is a standalone `PageBackground + <main>` with its own hand-rolled header. `AppLayout`, `Toolbar`, `Sidebar`, `Canvas`, `ComparisonCanvas`, and `NumberInput` are never imported anywhere; the design-system tokens file is only referenced via `cn`/`formatBytes`.
- Expected: Pages share one shell and the design tokens are actually applied.
- Actual: Two parallel UI systems; one is dead weight. This is also the root cause of the cross-page inconsistencies below.

### Issue 24 — Tool pages are visually inconsistent with each other
- Type: Design
- Severity: Medium
- Location: app/{resize,crop,convert,compress,remove-background,upscale}/page.tsx
- Problem: Branding text color/size differ per page (e.g. resize/crop `text-2xl text-white`, upscale `text-2xl text-zinc-300`, compress `text-xl text-white`), some headers dim on hover and others don't, and page copy uses inconsistent variants ("white" vs "zinc-300/400"). Upscale/remove-background use different layout/empty states from resize/crop/convert/compress.
- Expected: Consistent header, empty state, and panel treatment across tools.
- Actual: The app reads as several different apps.

### Issue 25 — Error handling is inconsistent (alert() vs inline)
- Type: Design
- Severity: Low
- Location: app/remove-background/page.tsx:126, app/resize/page.tsx:49, app/crop/page.tsx:61
- Problem: Remove Background uses a browser `alert()` for oversize files while other pages show inline errors.
- Expected: One consistent error pattern.
- Actual: A jarring native dialog in an otherwise polished UI.

### Issue 26 — Upscale before/after slider compares at the wrong aspect ratio
- Type: Design (visual)
- Severity: Medium
- Location: app/upscale/page.tsx:440-447, 500-503
- Problem: The comparison container is locked to the *original* aspect ratio, and the upscaled image is drawn with `object-fit: contain`. Because the upscaled output has 2x/4x the pixel dimensions, the two images are scaled by different amounts and never align pixel-for-pixel under the slider.
- Expected: Original and upscaled overlay at the same display scale for a true comparison.
- Actual: The comparison is visually misleading even before the corruption bug (Issue 9).

### Issue 27 — Canvas checkerboard tokens and hardcoded values disagree
- Type: Design
- Severity: Low
- Location: lib/design-system/tokens.ts:40-42/270-274 vs components/ui/Canvas.tsx:149-157
- Problem: The design system defines checkerboard colors (#2a2a2c/#1e1e20) and a 24px size; the Canvas component re-declares hardcoded hex colors and a hardcoded 24px size instead of consuming the tokens.
- Expected: Single source of truth for checkerboard styling.
- Actual: Two copies that can drift.

### Issue 28 — `applyExifOrientation` leaks the pre-transform ImageBitmap
- Type: Bug (memory, minor)
- Severity: Low
- Location: lib/canvas-utils.ts:203-209
- Problem: `loadImageWithExif` creates one bitmap via `loadImage` then returns a *different* bitmap from `applyExifOrientation`; the intermediate bitmap is never closed.
- Expected: Intermediate bitmap closed after transform.
- Actual: Extra GPU bitmap held until GC for every EXIF-oriented upload.

### Issue 29 — Remove-bg preview container is locked to a square aspect ratio
- Type: Design
- Severity: Medium
- Location: app/remove-background/page.tsx:360
- Problem: The preview wrapper is hardcoded `aspect-square` (`max-w-md`). Non-square images are letterboxed inside the square (the `<img>` uses `object-contain`), so there is dead space around the image and the preview does not match the exported canvas dimensions.
- Expected: Preview container adopts the image's aspect ratio (as the upscale/crop pages do).
- Actual: Every image previews in a square box regardless of its shape.

### Issue 30 — Header/branding treatment differs per page
- Type: Design
- Severity: Low
- Location: app/{convert,crop,resize,remove-background}/page.tsx:155/378/287/262 vs app/compress/page.tsx:155 vs app/upscale/page.tsx:274
- Problem: The PixelKit header link uses `text-2xl font-bold text-white` on convert/crop/resize/remove-background, `text-xl font-bold text-white hover:text-primary` on compress, and `text-2xl font-bold text-zinc-300` on upscale. The "← All Tools" link also varies (`text-sm text-zinc-400 hover:text-zinc-200` vs `text-sm text-zinc-500 hover:text-zinc-300` vs `text-sm text-zinc-400 hover:text-white`).
- Expected: Identical header across all tool pages.
- Actual: Branding looks slightly different on every page.

### Issue 31 — Result-grid filename color is inconsistent
- Type: Design
- Severity: Low
- Location: app/crop/page.tsx:648, app/resize/page.tsx:526 (text-white) vs app/convert/page.tsx:378, app/compress/page.tsx:358 (text-zinc-300)
- Problem: The result card filename uses `text-white` on the crop and resize pages but `text-zinc-300` on convert and compress.
- Expected: One shared result-card style.
- Actual: Minor visual drift between pages.

### Issue 32 — ComparisonCanvas forces every comparison into a square box
- Type: Design
- Severity: Low
- Location: components/ui/Canvas.tsx:404
- Problem: The shared `ComparisonCanvas` hardcodes `aspectRatio: '1'` and renders both images with `object-contain`. Any non-square image gets letterboxed, so the before/after overlay area no longer lines up with the image edges.
- Expected: Container aspect ratio tracks the source image.
- Actual: Comparisons are distorted for the common (non-square) case.
