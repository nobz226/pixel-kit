# AGENT.md

Operating instructions for any AI coding agent working in this repository (currently: DeepSeek V4 Flash via OpenCode). Read this before making changes. If anything here conflicts with a specific user instruction in a session, the direct instruction wins for that session — but default to these rules otherwise.

---

## Project summary

A free, no-account, no-payment, fully client-side image editing toolkit (resize, crop, convert, compress, background removal, upscaling). No backend in v1. See `README.md` for the full picture, `DEV_PLAN.md` for the phased build plan, and `SKILLS.md` for implementation conventions and QA checklists.

## Ground rules

1. **Work one phase, one tool, at a time.** Do not implement multiple `DEV_PLAN.md` phases in a single session. Do not refactor shared utilities and add a new feature in the same change — split those into separate turns so a regression is easy to isolate.
2. **No backend code unless explicitly asked.** v1 is client-side only. Do not add API routes, servers, databases, or auth "just in case" — if you think one is needed, stop and ask rather than adding it.
3. **No new dependencies without flagging them.** If a task seems to need a new npm package beyond what's already listed in `README.md` / `package.json`, name it and explain why before installing, rather than silently adding it.
4. **Respect the `ImageTool` contract** described in `SKILLS.md` for every tool implementation. Don't invent a different shape per tool.
5. **All model inference and heavy Canvas work goes in Web Workers.** Never call `imglyRemoveBackground()`, `Upscaler.upscale()`, or large Canvas operations directly from a React component on the main thread.
6. **Run the standing QA checklist** (in `SKILLS.md`) against any new or modified image-processing code before considering a task done. Don't just test the happy path.
7. **Don't touch licensing-sensitive code paths silently.** If a change involves `@imgly/background-removal` distribution/hosting details, flag the AGPL consideration rather than assuming it's fine.

## Session hygiene (specific to a free-tier / limited-context model)

- Keep each session scoped to a single, clearly-bounded task. Don't ask the agent to "build the whole app" in one go — reference the specific phase and task from `DEV_PLAN.md`.
- Paste in only the files relevant to the current task, not the whole repo, when context budget is a concern.
- Prefer small, reviewable diffs over large generated files. If a change would touch more than ~3-4 files, pause and confirm the plan before generating code.
- After each significant change, ask for (or run) `npm run lint` and `npm run build` before moving to the next task — catch breakage immediately rather than compounding it across sessions.

## Code style

- TypeScript strict mode — no `any` without a clear comment explaining why it's unavoidable.
- Functional React components with hooks; no class components.
- Tailwind for styling; avoid inline style objects except for truly dynamic values (e.g. a live crop-box position).
- Prefer explicit, narrow types over broad ones — e.g. a union of supported MIME type strings rather than `string`.
- Comment _why_, not _what_, especially around image-format/EXIF/browser-quirk workarounds — these are exactly the kind of thing that looks like a mistake to a future editor (human or agent) unless the reasoning is written down.

## Testing expectations

- New tool logic (`lib/tools/*.ts`) should have unit tests covering at least: valid input, invalid/corrupt input, and one edge-case dimension (very small or very large).
- UI components need not be exhaustively tested, but any component with non-trivial logic (crop math, batch queue handling) should have at least basic coverage.
- Do not mark a task complete if `npm run test` or `npm run lint` fails.

## What "done" means for a task

A task is not done until:

1. It matches the acceptance criteria listed for its phase in `DEV_PLAN.md`.
2. It passes lint, build, and tests.
3. It has been checked against the relevant items in the `SKILLS.md` QA checklist.
4. Any new pitfalls or model quirks discovered along the way are added back into `SKILLS.md` so they aren't rediscovered later.

## Things to never do without explicit confirmation

- Add a payment provider, account system, or any form of user tracking.
- Add a server-side component "to make things faster" — that tradeoff must be a deliberate, discussed decision (see `DEV_PLAN.md`'s "Post-v1: decide, don't assume" section), not a default.
- Remove or weaken the max-input-size warnings — these exist specifically because there's no server-side backstop in v1.
- Change the licensing of vendored/dependency code, or strip license headers.

## Escalation

If a task seems ambiguous, underspecified, or like it requires a decision the project owner should make (model choice, licensing tradeoff, whether to add a backend), stop and ask rather than picking a default silently. Silent, unflagged assumptions are the main way agent-driven codebases drift from intent over time.
