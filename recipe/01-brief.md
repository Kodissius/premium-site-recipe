# Step 1–2 — Vernacular and the brief

Template to fill in: [brief-template.md](brief-template.md).

---

## Why the brief comes first

Not for process reasons. For three concrete ones:

1. **It's the thing you diff against.** Six weeks in, when the page has drifted and you
   can't say why it feels worse, the brief tells you which rule got broken. Without it,
   every argument becomes taste versus taste.
2. **It converts taste into decisions someone else can execute** — a collaborator, a
   contractor, or an AI agent. "Make it feel premium" is not executable. "One dark
   material, ≤3 px radius, accent used only for markup moments, every decorative device
   encodes something true" is.
3. **It ends the section-by-section relitigating.** Decide the palette once. Decide the
   motion tiers once. Then spend your attention on the signature, which is the only part
   that's actually hard.

Keep it to one page. A brief nobody rereads is a document, not a constraint.

---

## Picking a vernacular

Style adjectives ("clean," "modern," "bold") give you nothing to build with — they're
compatible with any decision, so they resolve no arguments. A vernacular resolves hundreds
of micro-decisions for free, all in the same direction, and none of them look like a
template.

**The move:** find the visual language your subject already lives inside — the documents,
instruments, and artifacts the field actually produces — and render the whole page in it.

Ask three questions of your subject:

1. **What paperwork does this field produce?** Drawings, scores, manifests, lab notebooks,
   scripts, contact sheets, tasting notes, patterns, charts, proofs.
2. **What instrument does a practitioner stare at all day?** Terminal, oscilloscope, edit
   timeline, mixing desk, viewfinder, microscope, cockpit panel.
3. **What are the field's rituals of precision?** Revision numbers, takes, batch codes,
   sample IDs, chain of custody, versioning, sign-offs, datums.

Answers become concrete design decisions:

| Question | Becomes |
|---|---|
| paperwork | page background, borders, caption style, section framing |
| instrument | the signature object, and how the hero reads |
| rituals | section numbering, footer, nav labels, revision stamps, empty states |

### Worked examples across topics

**A recording studio.** Vernacular: the edit timeline and the console. Ground is desk
black; panels are channel strips; dividers are fader tracks; section numbers are `TK 03`;
the footer is a session sheet with date, room, engineer. Signature: a waveform that
scrubs on scroll from raw take → comped → mixed → mastered, four beats, each one visibly
tighter than the last. Accent: the record-arm red, used only on the current take.

**A climate research group.** Vernacular: the lab notebook and the journal figure.
Panels are figure plates with real captions (`Fig. 3 — measured, 2019–2025`); rules are
axis lines; the accent is an error-bar color used nowhere else. Signature: one dataset
drawn on scroll from raw scatter → binned → fitted → projected, with the uncertainty band
widening honestly in the final beat. Every number on the page has a citation, because in
that vernacular an uncited number is the tell.

**A restaurant.** Vernacular: the market ticket and the menu. Panels are card stock; the
mono face is the ticket printer; sections are courses; the footer is a service sheet with
hours as a shift schedule. Signature: one dish assembling on scroll — component, plated,
finished, served — shot as real photography rather than 3D, cross-dissolved by the same
`apply(p)` machinery. Accent: one ingredient color pulled from the actual photographs.

**A security consultancy.** Vernacular: the incident report. Sections are numbered
findings with severity chips; the grid is a log table; timestamps are everywhere and real.
Signature: an attack path drawn on scroll, node by node, then the same path with the
mitigation overlaid — one true story, told twice. Accent: the severity red, used only on
findings.

Note what's constant: the *architecture* is identical to a hardware-engineering site or
anything else. Only the vernacular changes. That's why the recipe transfers.

### The rule that keeps it honest

**Every decorative device must encode something true.**

A revision stamp shows the real revision. A figure caption describes the real figure. A
timecode is the real duration. `SHT 2 OF 4` appears on the second of four sheets.

This is not pedantry. Fake precision is instantly legible to anyone in the field you're
borrowing from — it's the difference between a page that a practitioner respects and one
they recognize as costume. And the constraint is generative: forcing every ornament to
carry information is what produces the details you'd never have invented from "make it
look designed."

### Two failure modes

**Costume.** Vernacular applied to a subject it has nothing to do with — engineering
drawings around a poetry site. It reads as arbitrary because it is.

**Pastiche.** Vernacular so literal it becomes a skeuomorphic reproduction: paper texture,
coffee stains, drop shadows, a simulated binder ring. You want the *grammar* — the
linework, the numbering, the caption discipline — not a photograph of the artifact.

The test for both: could a practitioner from that field read your page and find nothing
false in it? If yes, you're in the right place.

---

## Copy rules belong in the brief

The most common failure in a "premium" page isn't visual — it's that the writing is
generic while the design is specific, and the mismatch reads as a template with someone
else's content poured in.

Three rules that carried the most weight for us:

1. **Every specific figure has a source, or it's cut.** Confident unquantified prose reads
   as more credible than invented precision, and it eliminates an entire class of risk.
   Where an illustrative number is genuinely necessary, label it on screen as illustrative.
2. **Name a single source of truth** — a file, not a memory — for factual claims, and make
   the page mirror it. Then there's one place to fix things.
3. **Write the voice rule down** ("plain, specific, first person, zero marketing filler")
   and enforce it in review the same way you enforce the banned list. Voice drifts faster
   than visuals do.
