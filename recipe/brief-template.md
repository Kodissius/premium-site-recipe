# Design brief — `<project>`

> Copy this file into your project as `DESIGN.md`. Fill it in **before** writing code.
> One page. If it runs to two, you have two projects. Once it's agreed, it is binding:
> changes go through the brief first, code second.

---

## 1. Subject & job

Who or what this is for, in two sentences. Then:

- **Audience:** who is actually going to look at this, and what they already know.
- **Single job:** the page's job is to make **\_\_\_\_** undeniable within one scroll.
- **Success looks like:** the one thing a visitor should do or believe afterwards.

## 2. Thesis & signature

- **Thesis (say it out loud):** "\_\_\_\_ & \_\_\_\_" or one short sentence.
- **Vernacular:** the visual language being borrowed (engineering drawings, lab notebook,
  edit timeline, flight strip, galley proof, …) and one line on why it's honest for this
  subject.
- **Signature element:** the one thing that animates on scroll. What it is, what it
  *does*, and what true story its transformation tells.
- **Disclosure:** anything on screen that is illustrative rather than real must say so.
  Write the exact label here.

## 3. Tokens

- **Palette** — one ground, one panel, one deep panel, two line weights, three text
  tints, one accent. Hex values, with the job of each:
  - `--ground`
  - `--panel`
  - `--panel-deep`
  - `--line` / `--line-soft`
  - `--text` / `--dim` / `--muted`
  - `--accent` — **used only for:** \_\_\_\_
  - Reserved second family (if any) — **used only for:** \_\_\_\_
- **Type** — three faces, each with a job:
  - display: \_\_\_\_
  - body: \_\_\_\_
  - mono / data: \_\_\_\_
  - Self-hosted `.woff2`, weights actually used: \_\_\_\_
- **Geometry** — border radius max, gutter scale, max content width, grid.

## 4. Structure (scroll order)

Numbered sections, one line each, with the motion tier each uses.

1. **HERO** — pinned ~\_\_\_ viewports. Signature scrubs through beats: \_\_\_\_ →
   \_\_\_\_ → \_\_\_\_ → \_\_\_\_. Primary CTA visible on load.
2. …
3. …
4. **FOOTER** — rendered in the vernacular (title block / colophon / manifest / credits).

## 5. Copy rules (binding)

- Voice: \_\_\_\_ (e.g. plain, specific, first person, zero marketing filler).
- Claims: every specific figure has a source, or it is cut. List the allowed exceptions.
- Forbidden: \_\_\_\_ (confidential names, unverifiable numbers, superlatives, …).
- Source of truth for factual claims: \_\_\_\_ (a file, not a memory).

## 6. Banned list (anti-slop, enforced)

Adapt, don't copy. Everything here is banned because it's the default vocabulary of
templated sites, not because it's inherently bad.

- No particle fields
- No purple/violet gradients
- No tilted or rotated cards
- No custom cursors
- No preloader percentage counters
- No per-letter text splits
- No glassmorphism / backdrop-blur
- Border-radius ≤ 3 px
- One kinetic-type moment maximum
- Real photography over decorative 3D everywhere except the single signature
- **Every decorative device must encode something true**

## 7. Motion & accessibility contract

- Smooth scroll: lerp \_\_\_\_, fine pointers only.
- Reveal: one class, `top 82%`, once, \_\_\_ ms, one easing curve.
- Reduced motion: static end states, no pin, signature renders one frame at `p = ____`.
- Focus order survives the pin. Contrast checked against the darkest and brightest
  backgrounds the nav crosses.

## 8. Tech & budget

- Static / framework: \_\_\_\_
- Libraries, vendored: \_\_\_\_
- Debug hooks: `?p=` signature progress, `?ss=` page translate.
- Budget: first load ≤ \_\_\_ KB · mobile LCP ≤ \_\_\_ s · CLS ≤ \_\_\_ · longest boot
  task ≤ \_\_\_ ms · idle frame cost ≈ 0.
