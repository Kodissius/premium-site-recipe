# Step 7 — Performance

A cinematic page that takes six seconds to become readable on a phone is not a premium
page. The budget is part of the design, not a cleanup pass.

Measure with [`tools/measure.mjs`](../tools/measure.mjs). Every number below is from one
build on one machine — reproduce yours before treating them as targets.

---

## The budget

| Metric | Budget | Why that number |
|---|---|---|
| First-load transfer | ≤ 500 KB | A WebGL signature costs ~200 KB of it; the rest is fonts, CSS, and your JS |
| LCP — mobile emulation, 4× CPU throttle | ≤ 2.5 s | The public "good" threshold, measured where scroll pages actually fail |
| CLS | ≤ 0.01 | Trivially achievable with `aspect-ratio`; anything higher is a bug |
| Longest boot task | ≤ 500 ms | Longer and the page is unresponsive to the first interaction |
| Idle frame cost, pinned section | ≈ 0 ms | The loop must stop scheduling frames |
| Images | ≤ DPR 2 × displayed size | Beyond that you're shipping pixels nobody sees |

Test on **throttled mobile**, always. A desktop number tells you everything is fine right
up until it isn't.

---

## The three that actually mattered

### 1. Script order decides your text LCP

`defer` scripts and `type="module"` scripts execute in document order from the same queue.
If a script that builds a heavy world executes before the script that animates your
headline, and your headline is the LCP element, then LCP waits for the world.

Ours: scene module built the entire 3D world during module evaluation — 0.9 s desktop,
2.1 s on throttled mobile — sitting ahead of the motion script.

**Fix:** move the heavy module's `<script>` tag last.

**Measured:** mobile LCP 5.59 s → ~2 s. Desktop 2.02 s → ~1.2 s. No visual change; the
canvas fades in from nothing anyway.

**How to find it in your own build:** record a Performance profile of a cold load. If your
longest boot task starts before the LCP mark, reorder before optimizing anything else. It's
usually the cheapest large win available.

### 2. Make the render loop sleep

Rendering every frame while nothing changes costs the same as rendering during motion. We
measured ~50 ms per frame on throttled mobile, continuously, whether or not the user was
scrolling — a permanent long task and a permanent battery drain.

Two gates, both required: `IntersectionObserver` for visibility, and a dirty check for
change. Code in [04-signature-scene.md](04-signature-scene.md#the-render-loop-must-sleep).

Verify by idling in the pinned section with a Performance recording running. Frames should
stop entirely.

### 3. Ship less library

Chrome DevTools Coverage on our build:

| Asset | Share of first load | Executed |
|---|---|---|
| 3D library (full module build) | 53% | 44% |
| Animation library | — | 39% |
| ScrollTrigger plugin | — | 36% |

Libraries were over half our bytes and most of it never ran. Slim-bundling the 3D library
against an entry file that re-exports only the names the scene uses was the largest single
byte win available. Recipe in [SETUP.md](../SETUP.md#threejs-if-you-want-a-3d-signature).

Verify the swap with a pixel diff of a contact sheet — a missing export fails at runtime,
inside one specific beat, possibly one you don't happen to scroll through.

---

## The rest of the list, in order of return

**Fonts.** Declare only weights you render. Preload only above-the-fold weights.
`font-display: swap`. We shipped ~105 KB of declared-but-never-fetched weights before
auditing; DevTools → Network → Font, hard reload, is the whole audit.

**Images.** Export at displayed size × DPR 2, in WebP or AVIF. `loading="lazy"` below the
fold. Several of ours were 3.2–3.6× oversized.

*Sizing gotcha:* for a cover-cropped box (`aspect-ratio: 4/3; object-fit: cover`) with a
wide source, the **height** is the binding dimension. Resizing by width leaves you serving
3× the pixels. Check both dimensions against the rendered box.

**Layout stability.** `aspect-ratio` + `object-fit: cover` on every image container. That
alone gets CLS to ~0.000x with lazy loading on. Explicit `width`/`height` attributes are
belt-and-braces.

**Cache headers.** Many static hosts default *everything* to
`max-age=0, must-revalidate`, so every repeat visitor makes one conditional request per
asset for files that never change. Set immutable long-max-age on fonts, vendored
libraries, and images; keep HTML must-revalidate.

**Dead files.** Unreferenced images and fonts sit in the deploy costing nothing at runtime
but bloating every clone and every deploy. Grep your source for each filename in your
assets directory periodically.

**Below-fold work at load.** Anything that boots, solves, or animates below the fold should
be gated on `IntersectionObserver`, not run at load. One of our interactive demos was
solving a numerical model at page load, off-screen, on the critical path.

**Pixel ratio cap.** `Math.min(devicePixelRatio, 1.75)` desktop, `1.5` mobile. DPR 3 is
2.25× the fragment work of DPR 2 for no visible gain on a moving object; captures were
indistinguishable.

---

## Measuring properly

```bash
cd tools && npm install
node measure.mjs http://localhost:8734 > baseline.txt
# ...one change...
node measure.mjs http://localhost:8734 > after.txt
diff baseline.txt after.txt
```

**One change at a time.** Two changes and you've learned nothing about which one helped.

The script reports FCP, LCP, CLS, DOMContentLoaded, long tasks over 50 ms, and per-asset
transfer sizes, for desktop and for emulated mobile at 4× CPU throttle, and writes
`measure-out.json` so you can diff structurally.

For bytes and dead code, DevTools Coverage beats any script: ⌘/Ctrl-Shift-P → "Show
Coverage" → reload → sort by unused bytes.

---

## What not to optimize

- **Don't reduce the pin length to save scroll time.** The film is the product.
- **Don't drop the smooth scroll.** It's ~4 KB gzipped and it's most of the feel.
- **Don't degrade the signature on mobile beyond capping DPR.** A phone can render a
  well-budgeted scene fine; the problems are almost always boot cost and a non-sleeping
  loop, not the object itself.
- **Don't chase a perfect Lighthouse score.** Hit the budget, verify on a real mid-range
  phone, and spend the rest of your time on the film.
