# Sources, evidence, and how to check us

Two kinds of claims live in this repo, and they deserve different treatment.

**Measured claims** — every number in [LESSONS.md](LESSONS.md) and
[recipe/06-performance.md](recipe/06-performance.md). These came from Chrome DevTools and
from the scripts in `tools/`, on *one* build, on *one* Windows laptop, against a localhost
server. They are directionally useful and numerically local. Re-measure on your machine
before treating any of them as a target — that's what `tools/measure.mjs` is for, and it
writes a JSON file precisely so you can diff before/after rather than trust our figures.

**Taste claims** — "one material," the banned list, "vernacular over style," one kinetic
moment. These are opinions formed while building one site to one standard. They're written
as rules because rules are more useful than hedges, not because they're laws. Disagree
productively: swap the list, keep the discipline of having one.

---

## Primary documentation

Everything the recipe leans on is documented publicly. Read the source rather than
trusting our summary of it.

| Topic | Where |
|---|---|
| ScrollTrigger — `pin`, `scrub`, `start`/`end`, callbacks | <https://gsap.com/docs/v3/Plugins/ScrollTrigger/> |
| GSAP core — tweens, easing, `gsap.ticker`, `utils` | <https://gsap.com/docs/v3/> |
| **GSAP licensing** — read before shipping commercially | <https://gsap.com/licensing/> |
| Lenis smooth scroll — options, `lerp`, framework integration | <https://github.com/darkroomengineering/lenis> |
| Three.js manual and API | <https://threejs.org/docs/> |
| Three.js `ExtrudeGeometry`, `Shape`, materials, `PMREMGenerator` | <https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry> |
| `prefers-reduced-motion` | <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion> |
| WCAG 2.1 — Animation from Interactions (2.3.3) | <https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions> |
| Largest Contentful Paint — definition and what counts | <https://web.dev/articles/lcp> |
| Cumulative Layout Shift | <https://web.dev/articles/cls> |
| Font loading best practices, `font-display` | <https://web.dev/articles/font-best-practices> |
| `IntersectionObserver` | <https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API> |
| `PerformanceObserver`, long tasks, paint timing | <https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver> |
| Chrome DevTools Coverage (unused JS/CSS) | <https://developer.chrome.com/docs/devtools/coverage> |
| Chrome DevTools Performance panel | <https://developer.chrome.com/docs/devtools/performance> |
| Puppeteer API (used by `tools/`) | <https://pptr.dev/> |
| `mix-blend-mode` | <https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode> |
| `aspect-ratio` and `object-fit` | <https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio> |
| Smoothstep (the `t*t*(3-2t)` easing used throughout) | <https://en.wikipedia.org/wiki/Smoothstep> |
| Browser support for anything above | <https://caniuse.com> |

Links rot. If one is dead, search the title rather than assuming the technique changed.

## Licences of the libraries this recipe uses

Check these yourself before shipping; they change, and we are not lawyers.

- **Lenis** — MIT.
- **Three.js** — MIT.
- **GSAP** — GreenSock's own licence, *not* MIT. The core and many plugins are free to use
  including in commercial work under the standard licence, with restrictions around
  products where the animation itself is the thing being sold. Read
  <https://gsap.com/licensing/> and decide for your project.
- **Fonts** — self-hosting requires a licence that permits it. Open-source families
  (SIL OFL, Apache) generally do; most commercial foundry licences require a separate
  webfont licence. Check before committing a `.woff2`.
- **Images** — if you didn't shoot it or licence it, don't ship it. Keep a `SOURCES.md`
  next to your image folder recording where every file came from; you will not remember in
  four months.

## How to produce your own evidence

```bash
cd tools && npm install

# 1. Baseline before you change anything
node measure.mjs http://localhost:8734 > baseline.txt

# 2. Make one change

# 3. Measure again and diff
node measure.mjs http://localhost:8734 > after.txt
diff baseline.txt after.txt
```

One change at a time, or you learn nothing about which change helped. The script emulates
mobile with 4× CPU throttling because that's where scroll-driven pages actually fail; a
desktop-only number will tell you everything is fine right up until it isn't.

For bytes and dead code, the Coverage panel is faster than any script: DevTools →
⌘/Ctrl-Shift-P → "Show Coverage" → reload. Sort by unused bytes. That's how we found that
the 3D library was 53% of first-load bytes with 44% of it executing.

## Prior art worth reading

The techniques here aren't novel individually — pinned scroll timelines, smooth scroll,
and scroll-driven WebGL are well-trodden. What's specific to this repo is the *assembly*:
purity of `apply(p)`, choreography as data, debug hooks as a first-class feature, and a
written banned list.

If you want to go deeper on the underlying craft, the GSAP ScrollTrigger demos, the
Three.js examples index, and the Awwwards/FWA archives are the standard references. Treat
award-site galleries as a source of *vernacular ideas*, not of components to copy — the
recognizable, reusable pieces are exactly what makes a page read as templated.

## Contributing evidence

If you measure something that contradicts a number here, that's the most valuable possible
contribution. See [CONTRIBUTING.md](CONTRIBUTING.md) — bring the JSON, the machine specs,
and the browser version, and we'll replace the claim.
