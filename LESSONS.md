# Lessons learned

Every one of these cost real time. They're grouped by area, and each says what happened,
why, and what to do instead. Where a number appears, it came from `tools/measure.mjs` or
Chrome DevTools on one build on one machine — reproduce before trusting.

---

## Motion & scroll

### 1. Drive the scene from a scrubbed proxy, not from raw scroll progress

A mouse wheel emits discrete, chunky ticks. Feeding those straight into a scene makes it
stutter no matter how good the scene is. Tween a proxy object with `scrub: 0.5` and read
the proxy — the scrub value is a smoothing time constant, so the proxy glides toward the
true position and every wheel tick becomes continuous motion.

This one change did more for perceived quality than any amount of scene detail.

### 2. Wire Lenis and ScrollTrigger in this exact order

```js
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);   // triggers see Lenis's position
gsap.ticker.add((t) => lenis.raf(t * 1000)); // one clock, not two rAF loops
gsap.ticker.lagSmoothing(0);                 // no frame-time compensation jumps
```

Miss the first line and triggers fire against native scroll while the page renders at
Lenis's position — everything lands late. Run Lenis on its own `requestAnimationFrame` and
you get two loops fighting over the same frame. `lagSmoothing(0)` stops GSAP from
"catching up" after a stall, which looks like a jump-cut.

Gate the whole block on `matchMedia("(pointer: fine)")` and reduced-motion. Smooth scroll
on touch fights the platform's own physics and feels broken.

### 3. Reduced motion means static end states, not slower motion

`prefers-reduced-motion: reduce` should give a page that is *complete and still*: reveals
start visible, the pinned section is an ordinary section, the signature scene renders one
good representative frame. Roughly:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; }
  * { transition: none !important; animation: none !important; }
}
```

...plus an early return in JS that skips the pin entirely and calls `apply(0.17)` once.
Halving durations is not an accommodation; vestibular triggers are about the motion
existing, not its speed.

### 4. One kinetic-type moment, maximum

A masked line-by-line headline rise (`overflow: hidden` on the line, `translateY(110%)` on
the span) is worth it once, in the hero. The second one on the page cancels the first.
Per-letter splits never made anything look more expensive in our testing — they made it
look like every other generated site.

---

## Scene architecture

### 5. `apply(p)` must be pure, or nothing downstream works

Covered in the README, repeated here because it's the load-bearing decision. Once the
scene holds internal animation state, you lose backwards scrub, deterministic screenshots,
deep links, and the entire AI iteration loop, and you get desync bugs that only reproduce
when someone scrolls fast.

Allowed exception: `apply(p, t)` where `t` is time, used *only* for an idle wiggle whose
amplitude is itself a function of `p` and is exactly zero everywhere that matters.

### 6. Keep choreography in a data map, not in the code

One `SEG` object of `[start, end]` pairs, with a comment per beat. Retiming the film is
editing that object. We retimed ours four times, including adding three whole beats and
extending the pin from 400% to 500%; drawing code never changed.

Two things must mirror `SEG` and will silently drift if you let them: the pin length
(`end: "+=500%"`) and any UI that labels the current phase. Put a comment in all three
places pointing at the other two.

### 7. Guard every phase's draw path against not-yet-initialized state

A real bug we shipped and had to chase: a phase flag flipped and the draw function ran in
the *same frame*, before that phase's data was built. The null dereference threw inside
`requestAnimationFrame`, which silently killed the entire animation loop — the page just
froze with no console error visible until we looked. Every phase branch checks its own
data exists before drawing.

### 8. Deferred builds need a synchronous escape hatch

Building the expensive parts of the scene on `requestIdleCallback` is the right call for
boot time. But a deep link (`#section-4`) or a very fast scroll can reach a beat before
idle time ever arrives. Guard the beat:

```js
if (!fleetBuilt && p > 0.86) buildFleet();   // threshold sits before it's visible
```

Put the threshold safely earlier than the first frame where the object could be seen.

---

## 3D craft (if your signature is WebGL)

### 9. High metalness on flat panels renders black

Physically correct, visually useless. A metal surface shows its environment, and if the
environment is a dark page there is nothing to show. Two fixes, both needed:

- Materials around `metalness: 0.62`, `roughness: 0.4` — not `1.0/0.2`.
- A **procedural environment map**: paint a 512×256 canvas with a gradient plus a few
  bright rectangles (an overhead strip, a key softbox, a rim softbox, a fill card), set
  `mapping = EquirectangularReflectionMapping`, assign to `scene.environment`. Costs
  nothing to download and does what an HDRI does for a studio product shot.

Add `toneMapping = ACESFilmicToneMapping` with exposure ≈ 1.05 and a `Fog` matched to your
page background so the object dissolves into the page instead of ending at a hard edge.

### 10. Extruded shapes come out faceted — weld and recompute normals

`ExtrudeGeometry` from a rounded-rectangle `Shape` (use `curveSegments ≥ 24`, with a small
bevel) produces unindexed, flat-shaded geometry. It reads as blocky CAD, not as a designed
product. Merge duplicate vertices, then recompute normals, and the same geometry reads as a
molded shell.

The rest of the "designed object" look, in order of impact: two-tone stacked extrusions
(a band, a shut line, an upper shell); details **recessed into** the form rather than
bolted onto it; a continuous perimeter band; hardware hidden in shadow gaps.

### 11. Never cull an object whose depth writes you're using

We hid a fully transparent object to save draw calls, and a wireframe overlay lost its
hidden-line look — the invisible solid's *depth writes* were what occluded the back-facing
wire. Culling rule: `visible = contribution > 0.001`, evaluated against everything the
object contributes, including depth.

### 12. Reuse geometry aggressively

A `Map` keyed by a shape signature, with a `geo(key, make)` accessor, meant eight copies of
an object plus a wireframe twin shared one set of buffers. Instantly worth it the moment
anything appears more than once.

---

## Performance

### 13. Script order decides your text LCP

`defer` scripts and `type="module"` scripts execute in document order, from the same
queue. Our scene module built the entire 3D world during module evaluation — one 0.9 s
task on desktop, 2.1 s on throttled mobile — and it sat *before* the script that animates
the headline. The headline is the LCP element, so LCP waited behind the 3D build.

**Evidence:** mobile LCP 5.59 s → ~2 s by moving one `<script>` tag to last. Desktop 2.02 s
→ ~1.2 s. Zero visual change; the canvas fades in from nothing anyway.

Generalization: anything that paints text should execute before anything that builds a
world. Check with a Performance recording — if your longest boot task precedes your LCP
mark, reorder before optimizing anything else.

### 14. Make the render loop sleep

Ours re-rendered every frame whenever the canvas intersected the viewport, whether or not
anything had changed. **Measured: idle frames cost the same as moving frames** — ~50 ms
each on throttled mobile. That is a continuous long task, and on a laptop it's the fan.

```js
function tick() {
  raf = 0;
  apply(current);
  renderer.render(scene, camera);
  if (running && (current !== target || needsTimeBasedMotion(current)))
    raf = requestAnimationFrame(tick);
}
const wake = () => { if (running && !raf) raf = requestAnimationFrame(tick); };
new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(canvas);
```

`wake()` is called from the scroll setter, from resize, and from the intersection
callback. Nothing else schedules a frame.

### 15. Ship only the font weights you actually render

We declared nine `@font-face` weights and the page fetched six; three (~105 KB) were pure
waste in the deploy. Preload only the two or three that appear above the fold, with
`font-display: swap`. Audit with DevTools → Network, filtered to Font, on a hard reload.

### 16. Serve images at the size they're displayed

Several of ours were 3.2–3.6× larger than their rendered box including device pixel ratio.
Multiply CSS pixels by the DPR you actually target (2 is plenty), export WebP or AVIF at
that width, and stop. Everything below the fold gets `loading="lazy"`.

**Sizing gotcha:** for a cover-cropped box (`aspect-ratio: 4/3; object-fit: cover`) with a
*wide* source image, the binding dimension is the **height**, not the width. Resizing those
by width leaves you serving 3× the pixels you need. Check both.

### 17. Trim the library, not just the code

Chrome's Coverage tool on our build: Three.js 44% executed, GSAP 39%, ScrollTrigger 36%.
The libraries were 53% of first-load bytes. Slim-bundling Three.js against an entry file
that re-exports only the names the scene uses was the single largest byte win available.

Verify the swap with a pixel diff of a contact sheet — a missing export fails at runtime,
in a specific beat, possibly one you don't happen to scroll through.

---

## Verification

### 18. Headless browsers do not scroll the way you think

Hard-won, all of it:

- **Real scrolling before first paint yields blank captures.** Translate the page instead
  (`document.body.style.transform = "translateY(-2000px)"`) — that is what the `?ss=`
  hook is for.
- **But `?ss=` breaks anything gated on `IntersectionObserver`**, because IO uses layout
  position and a transform doesn't change it. For IO-gated content, drive real scrolling
  through the automation API instead.
- **A hidden or backgrounded tab stops compositing**, so `requestAnimationFrame` never
  fires and your scene never advances. Keep the automated window foregrounded, or render
  explicitly rather than waiting on rAF.
- **Chrome's `--virtual-time-budget` freezes at an arbitrary moment** for scroll-driven
  content. It is not a substitute for a deterministic `?p=` hook.
- **Windows narrower than ~500 px get clamped** by some headless configurations, and the
  screenshot crops — which fakes horizontal overflow that isn't real. Verify true mobile
  layout in a real browser at 390 px before believing an overflow bug.

The rig that actually worked: `puppeteer-core` driving installed Chrome, plus the `?p=` /
`?ss=` hooks. `tools/` has both scripts.

### 19. Embedded/preview browsers cache subresources aggressively

If a CSS or JS change isn't showing up, load the page from a different origin —
`127.0.0.1:8734` instead of `localhost:8734`. Different origin, empty cache, instant answer
to "is my change live or am I looking at a stale file?"

### 20. Review the film as a contact sheet, not by scrolling

A grid of 11 frames at fixed progress values exposes what scrolling hides: two beats that
look identical, a 15% stretch where nothing changes, a moment where the subject is
half-off-frame. We caught a dead 8% window this way that nobody had noticed in dozens of
manual scroll-throughs.

---

## Design decisions we reversed

### 21. A single tonal break destroys "one material"

An early version had light, paper-textured sections between dark ones. Individually each
section looked fine. Together the page read as a template with sections dropped into it.
Making every surface one family — one ground, panels a few points lighter, the same
linework everywhere — was the change that made it read as designed rather than assembled.

If you need contrast for a section, change *density* (more linework, tighter grid, a
caption strip) rather than changing the material.

### 22. Backdrop-blur is the wrong tool over a busy canvas

Glass over a moving 3D scene produces unreadable text and expensive compositing. A
near-solid ink fill at ~45–70% opacity in your existing ground color is legible, cheap, and
looks deliberate.

### 23. Real photography beats decorative 3D everywhere except the signature

One polished 3D object reads as craft. Two read as a template. Everything that can be a
real photograph should be one — and the contrast between the single rendered object and
the real imagery is what makes the rendered one land.

### 24. Cut every number you can't defend

Anything specific in the copy — figures, percentages, tolerances, counts — either has a
source you can point at, or it goes. Confident, specific, unquantified prose reads as more
credible than invented precision, and it removes an entire category of fact-checking risk.
Where an illustrative number is genuinely necessary, label it as illustrative on screen.

### 25. Interactive proof beats description

Where you'd normally write "we built X," a 40-line working micro-demo of X — a solver, a
recognizer, a diagram that actually computes — is disproportionately convincing. Keep them
small enough that they demonstrate rather than deliver, gate them on `IntersectionObserver`
so they cost nothing until scrolled into view, and make them jump straight to a final state
under reduced motion.
