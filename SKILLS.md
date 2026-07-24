# SKILLS.md

Project-specific conventions, patterns, and standing checklists for whoever (human or agent) is implementing features in this repo. This is a companion to `AGENT.md` (which covers agent operating rules) and `DEV_PLAN.md` (which covers what to build and when). This file covers *how* to build it well, based on patterns that matter specifically for a client-side image-processing app.

---

## The `ImageTool` contract

Every tool in `lib/tools/` should implement the same shape, so tools compose and the UI layer can stay generic:

```ts
interface ImageTool {
  name: string;
  accepts: string[];              // MIME types this tool can take as input
  run(input: ImageBitmap, opts: Record<string, unknown>): Promise<Blob>;
}
```

Do not let a tool reach into another tool's internals. If two tools need the same logic (e.g. EXIF handling, blob-to-download), that logic belongs in `lib/canvas-utils.ts`, not duplicated or cross-imported.

## Web Worker discipline

- Any operation that touches a model (background removal, upscaling) or does non-trivial Canvas work on a large image MUST run in a Web Worker. Never block the main thread with these.
- One worker file per capability (`bg-removal.worker.ts`, `upscale.worker.ts`, `canvas-ops.worker.ts`), not one giant worker handling everything.
- Workers should be terminated/cleaned up when a tool page unmounts, to avoid leaking memory across navigation.
- Don't spin up an unbounded number of workers for batch processing — use a small fixed-size pool (e.g. 2–4 concurrent, tuned to `navigator.hardwareConcurrency`).

## Standing QA checklist (run this for every new tool)

Copy this list and actually check off each item when a tool is implemented — don't just eyeball it once and move on:

- [ ] Normal JPEG, normal PNG
- [ ] Transparent PNG (does transparency survive or get handled deliberately?)
- [ ] Very large image (20MP+) — does it hang, crash, or handle gracefully?
- [ ] Very small image (under 50px on a side)
- [ ] Deliberately corrupted/truncated file — should error clearly, not crash the tab
- [ ] Image with EXIF rotation data (real phone photo) — orientation preserved correctly?
- [ ] Non-standard aspect ratio (extremely wide or tall)
- [ ] Repeat the operation ~20 times in a row — check for memory growth in dev tools
- [ ] Test in at least 2 browser engines (e.g. Chromium-based + Firefox or Safari)
- [ ] Keyboard-only walkthrough of the tool's full flow

## Model-backed tools — specific notes

### Background removal (`@imgly/background-removal`)
- First run downloads model weights — always show real progress, never a bare spinner with no feedback for multi-second waits.
- Known weak points to test explicitly and communicate honestly in the UI if hit: logos with internal negative space, low-contrast subject/background pairs, non-person subjects if the model is people-tuned.
- Verify caching actually works across page reloads — don't assume it does without checking network tab on a second run.

### Upscaling (`UpscalerJS`)
- Different bundled models trade off speed vs. quality — don't default to the "best" model without testing actual in-browser latency; some are explicitly noted as better suited to server/GPU environments.
- Photographic images, screenshots, pixel art, and illustration/anime images can behave very differently under the same model — if quality is inconsistent across categories, surface that as a model choice rather than a bug to silently work around.
- Confirm large-image handling (patch-based processing) with a real large test image, not just small samples.

## Canvas/image handling gotchas worth remembering

- `canvas.toBlob()` is asynchronous — always await/promise-wrap it, never assume synchronous completion.
- Converting an alpha-channel image (PNG) to a non-alpha format (JPEG) silently drops transparency unless you explicitly composite onto a background color first — decide and implement this deliberately, don't let the browser default do something unexpected.
- EXIF orientation metadata is a classic, easy-to-miss bug source — test with real camera-originated photos, not just screenshots or downloaded stock images.
- `createImageBitmap()` failing is your signal for "this isn't a valid/decodable image" — wrap it and surface a clear user-facing error rather than letting an unhandled rejection propagate.

## UI/UX conventions

- Every processing operation needs three visible states: idle/upload, processing (with progress if the operation can take more than ~1 second), and result/download.
- Before/after comparison should be the default presentation for anything that transforms an image (background removal, upscaling, compression) — a plain "here's your new file" download link undersells the tool and makes quality regressions harder to notice.
- Every destructive or slow action should be interruptible or at least clearly show what's happening — no silent multi-second freezes anywhere in the app.
- Max input size should be enforced with an explanatory message, not a cryptic failure, since v1 has no server-side backstop.

## Licensing awareness

- `@imgly/background-removal` is AGPL-licensed. Don't casually assume "free npm package" means no obligations — read the actual license terms relative to how this app is deployed, and document the conclusion in `README.md`.
- `UpscalerJS` is MIT — no special obligations, but still keep license files intact per MIT's terms if vendoring anything.

## When in doubt

If a task doesn't clearly fit an existing pattern in this file, don't guess silently — flag it explicitly (in a commit message, PR description, or direct note to the project owner) rather than inventing a new convention that diverges from the rest of the codebase.
