# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**LiveFlow** — a single-page React prototype of an "anti-file-manager." Documents flow through a visible pipeline (Intake → Extract → Classify → Route) and are retrieved by asking, not hunting. Currently a UI/motion prototype: the pipeline is simulated with `setTimeout`, answers and the searchable archive are static fixtures. No backend, no real AI, no persistence.

Read [VISION.md](VISION.md) before making product/design decisions — it's the compass for what belongs in the app and what doesn't (Industrial Observational direction, semantic color, motion-reveals-state, the halt/route rituals). The README is the stock Vite template; ignore it.

## Commands

```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build  (build fails on TS errors)
npm run lint      # eslint .
npm run preview   # serve dist/ locally
```

No test runner is configured. Don't add one without asking.

## Stack

- React 19 + TypeScript ~6.0, Vite 8
- Tailwind v4 via `@tailwindcss/vite` (imported in `src/index.css` with `@import "tailwindcss"`) — but **see the styling note below**
- `framer-motion` for all transitions, `lucide-react` for icons
- `three` + `react-force-graph-3d` are listed as deps but currently unused

## Styling — the project's actual model (read this before editing CSS)

Tailwind is installed but the codebase does **not** use utility classes for styling. All styling is hand-rolled CSS classes in `src/styles/*.css` and `src/index.css`, keyed off CSS variables defined in `:root`.

- **Single source of design tokens:** `:root` in `src/index.css` (top ~150 lines). Surfaces, semantic color families (amber/cyan/green/gray), shadows, radii. No `tailwind.config.*` exists; no `@theme` block.
- **Per-surface stylesheets** are imported in order from `src/main.tsx`: `index.css`, `layout.css`, `pipeline.css`, `chat.css`, `review.css`, `retrieval.css`, `specimen.css`. Order matters — later files can override earlier ones.
- **Don't introduce a parallel utility-class layer.** If a token is missing, add a CSS variable in `:root` and reference it. If a pattern repeats, add a class to the appropriate `src/styles/*.css` file. Don't sprinkle `flex p-4 bg-zinc-900` into JSX — it will visibly fight the existing system.
- The user's global "Tailwind utility-first" preference is overridden here by the project's actual setup. If you think this should change, raise it as a question, don't quietly migrate.

## Architecture

### State lives in `App.tsx`

`App.tsx` is the single state owner. It holds:

- `riverDocs: DocumentItem[]` — the live pipeline. Status drives which station a doc appears at via `stationIdForStatus`.
- `messages: Message[]` + `isTyping` — chat state.
- Drawer / resolve / route-completion / palette / retrieved-specimen state.

The pipeline is faked with nested `setTimeout`s in `handleIntake` and `handleResolve` — they mutate `status` from `dropped` → `analyzing` → `routing` → `filed` (perfect path), or `dropped` → `analyzing` → `uncertain` (halt path). When real ingestion lands, this is the seam to replace.

### Layout

The shell is chat-first. `app-body` has two children: the `chat-canvas` (always present) and the `pipeline-panel` (only when `activeDocs.length > 0`). The review drawer is a fixed-position `motion.aside` that slides in from the right. The retrieval palette is a portal-like overlay opened via ⌘K or the header search.

### Document type model

Two distinct types in `src/types.ts`:

- **`DocumentItem`** — a doc currently in the pipeline. Has `status: ProcessPhase`, optional `evidence` and `explanation` for halts.
- **`ArchivedDocument`** — a doc the user can *retrieve*. Carries a typed `extraction` (discriminated union: `nda | invoice | projections | report | mou | compliance`). `SpecimenCard` switches on `extraction.kind` to render the right view.

These are deliberately separate. The pipeline doesn't yet produce `ArchivedDocument`s; the retrievable archive is a separate fixture in `src/data/archiveFixtures.ts`.

### Mock data seams

- **`src/data/mockAnswers.ts`** — `getMockAnswer(query, hasHalt)` keyword-routes to one of a handful of canned `MockAnswerResult`s. This is what `ChatView` shows.
- **`src/data/archiveFixtures.ts`** — `ARCHIVE` plus `matchArchive(query)` / `recentArchive(n)`. This is what `RetrievalPalette` searches.

When wiring real retrieval, replace these two modules; the components consuming them are already typed against the result shapes.

### Components

Imported by `App.tsx` (the live ones):

- `ChatView` — message list + input. Renders `MockAnswerResult.sources` and `actions` inline in assistant bubbles.
- `DocumentSlab` — the framed specimen card on the stage; styled by `status`.
- `PipelineTrack` — the four-station rail with state-colored dots and a "doc just routed" green flash.
- `RetrievalPalette` — ⌘K search overlay. Selecting a result returns a `DOMRect` for the FLIP-style transition into a `SpecimenCard`.
- `SpecimenCard` — renders an `ArchivedDocument` based on `extraction.kind`.

### Keyboard surface

- `⌘/Ctrl+K` — toggle retrieval palette (registered globally in App.tsx)
- `Esc` — close drawer or close retrieved specimen
- `⌘/Ctrl+Enter` — primary resolve action (Request signature) when the review drawer is open and not in a text input

## Conventions

- Animate only `transform` / `opacity`. Spring (`stiffness: 100–340, damping: 20–30`) is the default; don't introduce `linear` easing.
- Color is semantic, never decorative. Amber = halted, cyan/blue = in-flight, green = arrived, gray = idle. Don't introduce a new accent without a state meaning.
- `JetBrains Mono` is the system's voice (status, rule IDs, counts, timestamps). `Geist` is product chrome. Don't mix.
- Design references in the repo root (`*.png`, `rail_snapshot.md`) are historical screenshots from past design passes — useful as context, not a spec.

## Frontend verification

User's global rule applies: every visible change must be verified by starting the dev server and looking at it before reporting "done." Don't claim a UI change works without seeing it.
