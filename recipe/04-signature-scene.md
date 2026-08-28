# Step 5 — The signature scene

The one thing on the page that is genuinely hard, and the reason people remember it.
Working 2D-canvas implementation, ~150 lines: [`starter/js/scene.js`](../starter/js/scene.js).

---

## The contract

Your scene module exposes exactly one entry point:

```js
window.__setProgress = (p) => { target = p; wake(); };
```

and internally, exactly one function that decides what a frame looks like:

```js
function apply(p, t = 0) { /* pure function of p */ }
```

**Pure means:** same `p` in, same frame out, every time, in any order, forever. No
"current step" variable, no accumulators, no `if (justEntered)`, no easing state carried
between frames. The only permitted use of `t` is time-based idle motion whose amplitude is
itself a function of `p` and evaluates to exactly zero everywhere determinism matters.

Everything good downstream depends on this:

| Property | Why it falls out of purity |
|---|---|
| Backwards scrub works | There's no direction-dependent state to unwind |
| Deterministic screenshots | `apply(0.62)` + render = the same PNG, always |
| Deep links / fast scroll safe | Nothing to desync; you jump straight to the state |
| Retiming is free | Beats are data, not control flow |
| AI/agent iteration is possible | An agent can see any frame without driving a scroll |

The last row is not a small thing. Reviewing a scroll film means looking at frames, and
looking at frames means addressing them by progress value. A stateful scene can't do that,
so you're back to scrolling and squinting.

---

## Choreography as data

```js
const SEG = {
  //  beat        [start, end]    what happens
  wire:    [0.00, 0.08],   // subject appears as line art
  build:   [0.08, 0.20],   // it assembles / gains material
  zoom:    [0.20, 0.30],   // camera dives to one detail; rest ghosts away
  analyze: [0.30, 0.55],   // the detail is examined — the substantive beat
  refine:  [0.55, 0.75],   // it changes as a result
  test:    [0.75, 0.90],   // the change is checked
  scale:   [0.90, 1.00],   // pull back; many of them
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg01   = (p, [a, b]) => clamp01((p - a) / (b - a));  // raw 0→1 across a beat
const ease    = (t) => t * t * (3 - 2 * t);                 // smoothstep
const ss      = (p, a, b) => ease(seg01(p, [a, b]));        // eased 0→1 across a beat
const mix     = (a, b, t) => a + (b - a) * t;
```

Those five lines are the entire animation engine. `apply` becomes a wall of declarations:

```js
function apply(p, t = 0) {
  const build   = ss(p, ...SEG.build);
  const zoom    = ss(p, ...SEG.zoom);
  const analyze = seg01(p, SEG.analyze);   // raw: drives a linear readout
  const scale   = ss(p, ...SEG.scale);

  wireAlpha   = (1 - build) * 0.85;
  solidAlpha  = build * (1 - 0.9 * analyze) * (1 - scale * 0.2);
  camZ        = mix(mix(12, 4.2, zoom), 26, scale);
  overlayA    = analyze * (1 - scale);
  idleSway    = Math.sin(t * 0.7) * 0.02 * build * (1 - zoom);  // ← t used safely
}
```

Read it as a score. Each line says how one visual property behaves across the whole film.
Nothing is hidden in a branch.

### Composition idioms worth stealing

```js
const a = ss(p, ...SEG.x) * (1 - ss(p, ...SEG.y));   // present during X, gone by Y
const b = build * (1 - 0.8 * ghost);                 // ghost to 20%, don't vanish
const c = Math.min(1, Math.max(0, (p - 0.18) / 0.10)); // ad-hoc 10%-wide crossfade
```

Multiplying by `(1 - other)` is how you crossfade beats without a state machine. Nearly
every transition in a complex scene is one of those three shapes.

### Retiming

We retimed ours four times, including inserting three entirely new beats and extending the
pin from 400% to 500% of viewport height. Drawing code never changed — only the `SEG`
object and the pin length. That is the payoff, and you feel it the first time a beat turns
out to be too short.

---

## Camera as lerped rigs

Don't animate a camera directly. Define two or three named rigs and blend between them:

```js
const RIG = {
  orbit:  { pos: [ 7.5, 4.2,  9.0], look: [0, 0.9, 0] },   // establishing
  detail: { pos: [ 1.9, 1.1,  2.4], look: [1.5, 0.7, 1.5] },// the dive
  wide:   { pos: [ 0.0, 14.0, 24.0], look: [0, 0, 0] },     // the pull-back
};
// camera = lerp(orbit → detail, zoom) then lerp(that → wide, scale)
```

Blending positions is stable, readable, and trivially retimable. Hand-keyed camera paths
are none of those things, and they break the moment you insert a beat.

Reuse scratch vectors (`const V = { a: new Vector3(), b: new Vector3() }`) instead of
allocating per frame — at 60 fps, per-frame allocation is how you get GC stutter.

---

## The render loop must sleep

The most common performance bug in scroll-driven scenes. Measured on our build: an idle
frame cost exactly as much as a moving frame — ~50 ms each on throttled mobile, forever,
whether or not anything was happening.

```js
let raf = 0, running = false, current = 0, target = 0;

function tick() {
  raf = 0;
  current = target;                       // (or ease current → target here)
  apply(current, performance.now() / 1000);
  render();
  if (running && (current !== target || needsTimeBasedMotion(current)))
    raf = requestAnimationFrame(tick);
}

const wake = () => { if (running && !raf) raf = requestAnimationFrame(tick); };

window.__setProgress = (p) => { target = p; wake(); };
addEventListener("resize", () => { resize(); wake(); });

new IntersectionObserver(([e]) => {
  running = e.isIntersecting;
  if (running) wake();
}, { threshold: 0 }).observe(canvas);
```

Two gates, both required: **visibility** (IntersectionObserver — don't render an offscreen
canvas at all) and **dirtiness** (`current !== target` — don't render an unchanged frame).
`needsTimeBasedMotion(p)` returns true only during beats that actually have idle motion, so
the loop parks completely everywhere else.

---

## If your signature is WebGL

The settings that took our object from "obviously a demo" to "product render." All are
Three.js, all transfer conceptually.

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

scene.fog = new THREE.Fog(0x16181c, 14, 46);   // MATCH your --ground token
```

- **Cap the pixel ratio.** DPR 3 on a phone is 2.25× the fragments of DPR 2 for no visible
  gain on a moving object. `1.5` mobile / `1.75` desktop was indistinguishable from
  uncapped in side-by-side captures and enormously cheaper.
- **Filmic tone mapping** is most of the "cinematic" quality people can't name.
- **Fog matched to the page background** dissolves the object into the page instead of
  ending it at a hard silhouette edge.

### A procedural environment map (no HDRI download)

Metal shows its environment. On a dark page there is no environment, so high-metalness
surfaces render near-black. Paint one:

```js
function makeEnv() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#3a4048"); grad.addColorStop(.55, "#1b1e23"); grad.addColorStop(1, "#0b0c0e");
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#b9c6d2"; g.fillRect(0,   0, 512, 26);   // overhead strip light
  g.fillStyle = "#e8eef4"; g.fillRect(70, 30, 130, 46);   // key softbox
  g.fillStyle = "#9fb4c8"; g.fillRect(330, 52,  90, 30);  // rim softbox
  g.fillStyle = "#5c6a76"; g.fillRect(210,120, 160, 22);  // fill card
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
scene.environment = makeEnv();
```

Zero bytes downloaded, and it does what an HDRI does for a studio product shot: gives the
material something to reflect. Paired with `metalness: 0.62, roughness: 0.4` — **not**
`1.0/0.2`, which renders flat panels black.

Lights on top: a warm key, a cool rim, a dim hemisphere fill. Three lights, no shadows
needed if the env map is doing its job.

### Making a shape look designed rather than modeled

In descending order of impact:

1. **Rounded-rect `Shape` → `ExtrudeGeometry`** with `curveSegments ≥ 24` and a small
   bevel — then **weld duplicate vertices and recompute normals**, because Extrude output
   is unindexed and flat-shaded. This single step is the difference between a blocky CAD
   look and a molded product.
2. **Two-tone stacked extrusions** — a lower band, a shut line, an upper shell — instead of
   one solid mass.
3. **Recess details into the form** rather than bolting them on.
4. **Hide hardware in shadow gaps.**
5. **Cache geometry** in a `Map` keyed by shape signature so repeats and wireframe twins
   share buffers.

### Budget the build

Building the whole world during module evaluation is a several-hundred-millisecond task
that blocks your text LCP (LESSONS.md #13). Build the hero object eagerly; build everything
that appears late on `requestIdleCallback`, with a synchronous escape hatch:

```js
if (!scaleBuilt && p > 0.86) buildScaleGroup();   // threshold before it's visible
```

---

## If your signature is not WebGL

The architecture is unchanged. `apply(p)` drives:

- **2D canvas** — the starter does this. Everything above applies except materials.
- **SVG** — set `stroke-dashoffset`, `opacity`, `transform` from `apply(p)`. Excellent for
  diagrams, maps, schematics, charts that build themselves.
- **A sequence of real photographs** — crossfade a stack by `ss(p, ...)`. Genuinely the
  best choice for food, fashion, architecture, and people. `<img>` tags, one `apply(p)`
  setting opacities, cinematic result, ~30 lines.
- **DOM** — for a signature made of type and rules, `apply(p)` can drive
  `gsap.set()` on elements just as well.

Pick whichever is *honest* for the subject. A rendered 3D object on a page about a
restaurant is a decoration; a plated dish assembling from four real photographs is the
signature.
