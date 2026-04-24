# LiveFlow — Vision

> A compass, not a spec. If we're ever unsure whether something belongs in LiveFlow, this is the document that decides.

## What it is

LiveFlow is the **anti-file-manager**.

A local-AI + RAG system where documents aren't stored in folders for you to hunt through later. You ingest, the system sees them, understands them, and routes them. When you need information, the app already knows where it lives — and surfaces a visual view of the content directly, not a file you have to open.

The two jobs of the app:

1. **Ingestion that's visually transparent and creative** — the user watches the file travel through the pipeline and *sees* it land in the right compartment. No guessing, no "did it save?"
2. **Retrieval without hunting** — ask for what you need, get a visual view of the information. Not a folder listing. Not "open this PDF." The answer, shown in the app.

## Who it's for

A person who is tired of this loop:

> "I know I have a document about X somewhere. Is it in Downloads? Was it in that email thread? Let me open three finder windows and search by filename I half-remember."

Not a demographic. A feeling of fatigue. LiveFlow is for the person who wants that loop to end.

## The feeling

**"It's already handled."**

The user opens LiveFlow and gets the information they need without friction. The system has already done the organizing work. The UI exists to show that work, not to delegate it back to the user.

Secondary feelings: *quiet competence, transparency, craft.* The app should feel like a well-kept instrument, not a utility.

## Visual identity — Industrial Observational

Committed. We don't blend this with other directions.

- **Specimen under examination** — the active document is framed by L-shaped brackets, lit from below, treated as something being studied. The obs-frame is not decoration; it's the metaphor.
- **Dark field, selective light** — the stage is mostly unlit. Where the system is paying attention, there is glow. Attention = light.
- **Typography as telemetry** — Geist for product chrome (readable, editorial), JetBrains Mono for anything the system reports about itself (status, rules, timestamps, rule IDs, counts). Mono = machine voice.
- **Color is semantic, never decorative** —
  - **Amber (#f59e0b)** = halted, needs human. Used *only* when the system is asking for you.
  - **Cyan (#3b82f6)** = active, in flight. The system is working.
  - **Green (#34d399)** = done, routed, arrived. A small celebration, never a loud one.
  - **Gray** = idle, inert, background.
- **Grain + atmosphere** — subtle SVG noise overlay on surfaces, radial glows under focus. Never flat, never plastic.

## Motion principle

**Motion reveals state. Motion never decorates.**

If an animation doesn't communicate something about what the system is doing, it doesn't belong. Every pulse, every travel, every flash earns its place by making state legible.

Concretely:
- Pipeline chips **travel** between stations because we want the user to see the doc moving through work
- Halted elements **pulse amber** because we want the halt to be perceptible in peripheral vision
- The success bloom **appears** at Route because routing must feel like arrival, not disappearance
- The destination row **flashes green** because it's the landing — the user sees where their doc went

If we ever catch ourselves adding a hover glow "because it looks nice," cut it.

## The halt ritual

When the system can't route a doc, the user enters a specific experience:

1. **The doc is framed** — obs-frame brackets glow amber, pipeline Classify station pulses amber, tether line from Classify to the card
2. **Evidence is presented** — the drawer opens with the WHY (rule that failed, confidence score), the WHAT (sender, subject, preview, attachment chip), and the VERBS (Request Signature, Mark Exception, or force-route)
3. **The user resolves it with one action** — primary verb is Enter-keyable, secondary verbs are ghost-styled
4. **The system takes over again** — drawer closes, doc re-enters the pipeline, the theatre of routing plays out

The halt is a **pause in a song**, not a dead-end. It has a defined beginning, middle, and exit.

## The routing ritual

When a doc routes successfully:

1. **Chip travels** the pipeline station-to-station, so the user sees the doc actually moving
2. **Route station flips green** as the doc arrives
3. **Success bloom** appears below Route with the doc name, destination, and elapsed time
4. **Destination row flashes green** in the rail, counter ticks up with a bounce
5. **The bloom fades** after ~3s — the moment passes, the system returns to idle

Success is a **short star turn**, not silent. The happy path must be *felt*.

## What the user retrieves

When the user asks LiveFlow for information, they get a **visual view inside the app** — not a file dropped into their Downloads. The app owns the rendering of what the document says and means. The file is a substrate; the visual view is the product.

This is where the distinction lives: Finder gives you a file. LiveFlow gives you the **content**, visually arranged, with the source attached for verification.

## Anti-goals — what LiveFlow must never feel like

*Direct from the brief:*

- **Never a random macOS/Windows folder hierarchy.** If the user ever sees "open folder → scan list → click file → wait for app to launch," we've failed. We are not Finder.
- **Never visually bad, hard to grasp, or wrong.** If the user has to squint, re-read, or second-guess what they're looking at, we've failed the clarity bar.
- **Never a design nuisance.** The design must never be an obstacle to the work. If the user thinks "I wish this screen got out of my way," we've over-designed.
- **Never uncreative or boring.** If LiveFlow looks like a generic SaaS dashboard, we've failed the identity bar. Other apps are allowed to be boring. LiveFlow isn't.

*Extending the brief:*

- **Never alarm fatigue.** Amber is scarce. If amber is everywhere, it means nothing. A halt must still feel like a halt after the 100th one.
- **Never feature exhibitionism.** No rainbow of accent colors, no scatter of micro-interactions, no dashboard of every possible metric. Restraint.
- **Never "enterprise grays."** This app is dark-field industrial, not IBM-Notes beige.

## Rules for decisions

When unsure, decide in this order:

1. **Does it reveal state?** If not, cut it.
2. **Does it reduce hunting?** If yes, prioritize it.
3. **Does it match the Industrial Observational direction?** If not, redesign it.
4. **Would the user feel "it's already handled"?** If yes, ship it.

## Open questions (things not yet decided)

- **Queue tab** — where do halted docs live when there are many? How is the queue triaged? (j/k keyboard nav? bulk resolve?)
- **Rules tab** — the rule `LEGAL_SIG_REQUIRED` has to live somewhere editable. What does rule authoring feel like? Plain language? YAML? Graph?
- **History tab** — audit log. Does it show "resolved by Simon · 22:15" per doc, or is it a system-wide timeline?
- **Retrieval UX** — the second core job of the app is "give me the information." How does that query surface? ⌘K palette? Persistent search? A conversational pane? This is the single biggest open question.
- **Onboarding** — first-run, no docs, nothing filed. What does the user see? The empty stage can't feel empty; it must feel *ready*.
- **Mobile / narrow viewport** — untested. Probably desktop-first forever, but the question is open.

## Current state (snapshot, 2026-04-24)

Shipped:
- Industrial Observational direction committed across all surfaces
- Staging tab with pipeline (Intake → Extract → Classify → Route)
- Halted document drawer with evidence block and resolve verbs
- Success theatre: traveling chip + bloom + destination flash + counter bounce
- Typography system (Geist + JetBrains Mono)
- Design tokens and semantic color

Not yet shipped:
- Queue / Rules / History tabs (nav stubs visible but disabled)
- Retrieval UX
- Any real AI or RAG integration — the pipeline currently simulates with setTimeouts
- Destination detail views (click compartment → see inside)

---

*Last updated: 2026-04-24. Update this file when the answers to open questions get decided, or when anti-goals get challenged.*
