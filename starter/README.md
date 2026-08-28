# Starter

A minimal but complete implementation of the recipe. About 700 lines total, no build
step, no framework.

```bash
python -m http.server 8734     # from this directory
# or: npx --yes serve . -l 8734
```

Then <http://localhost:8734>.

## What it demonstrates

| File | What to look at |
|---|---|
| `css/tokens.css` | The whole material in ~30 custom properties. One accent, with its rule written down. A reserved second family used by exactly one thing. |
| `css/app.css` | Every colour comes from a token — `grep` for a hex and you find nothing. Two-line reveal class. Reduced-motion block. |
| `js/motion.js` | The three tiers. The proxy scrub. The `?p=` / `?ss=` debug hooks. |
| `js/scene.js` | `apply(p, t)` as a pure function, the `SEG` map, camera rigs blended by progress, and a render loop that sleeps. |
| `index.html` | Script order — text before world. Phase labels. An illustrative-data disclaimer. |

## Try these

- <http://localhost:8734/?p=0.42> — freeze the scene mid-film. Change the number.
- <http://localhost:8734/?ss=1400> — shift the page without scrolling.
- Scrub the hero **backwards**, slowly. Identical to forward, because `apply(p)` is pure.
- DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`, reload. Complete,
  still, readable page. No pin.
- DevTools → Performance, record while idling in the pinned section. Frames stop.
- Edit one range in `SEG` (`js/scene.js`) and reload. The film retimes; no drawing code
  changed.

## Measured baseline

Run `node ../tools/measure.mjs http://localhost:8734` and you should land near this. These
are real numbers from this starter, on one Windows laptop, against localhost — reproduce
on yours rather than trusting them.

| | Desktop 1440×900 | Mobile 390×844, 4× CPU |
|---|---|---|
| FCP | 456 ms | 780 ms |
| LCP | 1120 ms | 1580 ms |
| CLS | 0.0000 | 0.0000 |
| First-load transfer | 89.3 KB | 88.7 KB |
| Long tasks > 50 ms | none | 137, 75, 71 ms |

Most of that payload is the three CDN libraries (GSAP 28.9 KB + ScrollTrigger 18.2 KB +
Lenis 5.7 KB = 53 KB of 89 KB). The starter's own HTML, CSS, and JS come to about 28 KB.
That's the headroom a real project spends on fonts, images, and a signature scene.

## Making it yours

1. **Fill in the brief** — `../recipe/brief-template.md`. Don't skip it; it's what stops
   the page drifting into the banned list.
2. **Replace the palette** in `css/tokens.css`. Keep three surface depths and one accent.
3. **Self-host a real display face.** The starter uses system stacks so it ships with no
   font files; a real project wants one distinctive display face, self-hosted as `.woff2`,
   with `font-display: swap`. Check the licence first.
4. **Replace `SEG` and the drawing code** in `js/scene.js` with your subject's true story.
   Keep `apply(p, t)` pure — everything else depends on it.
5. **Vendor the libraries.** The starter loads GSAP, ScrollTrigger, and Lenis from a CDN
   for zero-setup convenience. See `../SETUP.md` §3 — and read GSAP's licence, which is
   not MIT.
6. **Shoot a contact sheet** after every scene change:
   `node ../tools/shots.mjs http://localhost:8734`
7. **Measure** before you call it done:
   `node ../tools/measure.mjs http://localhost:8734`

## Deliberate omissions

No forms, no analytics, no CMS, no router, no cookie banner. Those are project decisions,
not recipe decisions, and every one of them is a place to leak a key or a personal detail
into a public repo. Add them in your own project, not here.
