# Step 3 — The token layer: one material

Write these before a single component. Ten to fifteen custom properties, each with a
stated job. Every later decision references a token; nothing hard-codes a color.

---

## The block

Dark example, because a dark page makes a single rendered signature object read as
cinematic for free. The *structure* is what matters — a light palette maps one to one.

```css
:root {
  /* ---- surfaces: one family, three depths ---- */
  --ground:      #121417;   /* the page itself */
  --panel:       #1a1d22;   /* content sheets / cards — a few points lighter */
  --panel-deep:  #15181c;   /* caption bars, footers, strips — a few points darker */

  /* ---- linework: two weights, one hue ---- */
  --line:        rgba(159, 180, 200, .28);  /* primary borders, frames */
  --line-soft:   rgba(159, 180, 200, .14);  /* secondary rules, dividers */
  --grid-line:   rgba(198, 212, 226, .04);  /* graph-paper background grid */

  /* ---- text: three tints, never more ---- */
  --text:        #e6e8ec;   /* body */
  --dim:         #8b93a0;   /* secondary, mono, captions */
  --muted:       #566070;   /* fine print, disclaimers */
  --white:       #f4f6f8;   /* headlines only */

  /* ---- ONE accent, with a written rule ---- */
  --accent:      #c8371e;   /* only: primary CTA, active-state marks, selection */
  --accent-press:#a92d17;

  /* ---- type ---- */
  --font-display: "Display Face", Impact, sans-serif;
  --font-body:    "Body Face", system-ui, sans-serif;
  --font-mono:    "Mono Face", ui-monospace, monospace;

  /* ---- geometry ---- */
  --gutter:    clamp(20px, 5vw, 72px);
  --sheet-max: 1280px;
  --radius:    2px;          /* the cap, not a suggestion */
}
```

## The rules that make it "one material"

**Three surface depths, no more.** Ground, panel, deep. A fourth surface value is where
pages start looking assembled from parts. Need more separation? Add a `--line` border, not
a new fill.

**Linework is one hue at two alphas.** Borders, dividers, and frames all descend from the
same rgba. This is why a page reads as one drawing rather than as a stack of components:
every edge on it is literally the same color.

**One accent, and write down where it may appear.** Ours: primary CTA, the active-state
marker, and `::selection`. Nothing else. An accent used in five places is a color scheme;
an accent used in three is a signature.

**Reserve any second color family for exactly one job.** We reserved a full spectrum
gradient for a single data visualization, and it appeared nowhere else on the page. When
it showed up, it *meant* something — that's the entire value, and using one swatch of it
for a hover state would have destroyed it.

**Cap the radius.** `≤ 3px` reads as precise; `12px` reads as a SaaS template. Set the cap
in the brief and use the token everywhere. (If your vernacular is soft — food, fashion,
childcare — invert this deliberately and cap it *high*, consistently. The rule is
"one radius language," not "square.")

**Change density, never material, for section contrast.** More linework, tighter grid, a
caption strip, a mono label — not a different background family. See LESSONS.md #21.

## Type: three faces, three jobs

| Role | Job | Typical choice |
|---|---|---|
| Display | Headlines only. Uppercase, tight leading (~0.88), big — `clamp(64px, 11vw, 168px)` | A condensed grotesque with real weight |
| Body | Everything readable. 16–17 px, 1.6 line height, `max-width: 46ch` | A neutral, workhorse sans |
| Mono | Data, labels, captions, numbers, the vernacular's "instrument" voice | Any good mono |

The mono face is doing more work than people expect. Labels, callouts, revision strings,
figure numbers, and captions in mono is most of what makes a page read as instrumented
rather than decorated. Use letter-spacing (`.08em`–`.22em`) and small sizes (10–12 px) for
those, uppercase.

### Loading them

```html
<link rel="preload" href="assets/fonts/Display-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Body-400.woff2"    as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:'Display Face';font-weight:800;font-display:swap;
           src:url('assets/fonts/Display-800.woff2') format('woff2');}
/* …one @font-face per weight you actually render… */
</style>
```

- **Self-host.** Check the licence permits it (see SOURCES.md).
- **`font-display: swap`** — text paints immediately in the fallback and swaps. On a page
  whose LCP element is a headline, this matters more than the swap flash costs you.
- **Preload only above-the-fold weights.** Two or three. Preloading everything is the same
  as preloading nothing.
- **Declare only weights you render.** We declared nine and fetched six; the three unused
  ones were ~105 KB of pure deploy waste.
- **Pick fallbacks with similar metrics** so the swap doesn't reflow.

## A background that isn't flat

One gradient plus a graph-paper grid, both from tokens, costs nothing and stops a dark
page from looking like an empty div:

```css
body {
  background:
    linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 100% 32px,
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 32px 100%,
    var(--ground);
}
```

At 4% alpha it's felt rather than seen. If your vernacular is paper-based, that grid *is*
your paper; if it's a terminal, make it scanlines; if it's film, make it grain. One
texture, page-wide, from a token.

## Sanity check

Before moving on, grep your CSS for hex codes outside `:root`. Every hit is either a
mistake or a token you forgot to name.

```bash
grep -n "#[0-9a-fA-F]\{3,6\}" css/style.css | grep -v -- "--"
```
