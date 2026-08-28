# Step 4 — The motion system

Three tiers. A fourth is how a page starts feeling busy. Working implementation:
[`starter/js/motion.js`](../starter/js/motion.js).

---

## The whole thing, in order

```js
(function () {
  const reduced  = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params   = new URLSearchParams(location.search);
  const pParam   = params.get("p");    // ?p=0.42  → freeze the signature
  const ssParam  = params.get("ss");   // ?ss=2000 → translate instead of scroll
  const debug    = pParam !== null || ssParam !== null;

  gsap.registerPlugin(ScrollTrigger);

  /* ---- TIER 1: page glide ---- */
  if (!reduced && !debug && matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    window.__lenis = lenis;                        // expose for QA
    lenis.on("scroll", ScrollTrigger.update);      // triggers see Lenis's position
    gsap.ticker.add((t) => lenis.raf(t * 1000));   // one clock, not two rAF loops
    gsap.ticker.lagSmoothing(0);                   // no catch-up jump after a stall
  }

  /* ---- TIER 2: one pinned scrub ---- */
  if (!reduced && !debug) {
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1, ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=500%",        // MIRRORS the SEG map in the scene — keep in sync
        pin: ".hero-pin",
        scrub: 0.5,           // smoothing constant: wheel ticks become glide
      },
      onUpdate() {
        window.__setProgress && window.__setProgress(proxy.p);
        setPhaseLabel(phaseAt(proxy.p));
        gsap.set(".scroll-hint", { opacity: proxy.p > 0.03 ? 0 : 1 });
        gsap.set(".hero-copy", {                    // headline steps aside
          opacity: 1 - clamp01((proxy.p - 0.18) / 0.10),
        });
      },
    });

    /* the ONE kinetic-type moment */
    gsap.to(".hero-h1 .line > span", {
      y: 0, duration: 1.05, ease: "power4.out", stagger: 0.09, delay: 0.15,
    });
    gsap.to(".hero-sub", { opacity: 1, duration: 0.8, delay: 0.7 });
  }

  /* ---- TIER 3: reveal on enter ---- */
  document.querySelectorAll(".panel, .card, .section-head, .footer-grid")
    .forEach((el) => {
      el.classList.add("reveal");
      ScrollTrigger.create({
        trigger: el, start: "top 82%", once: true,
        onEnter: () => el.classList.add("in"),
      });
    });

  /* ---- optional: image-only parallax drift ---- */
  if (!reduced) {
    gsap.utils.toArray(".media").forEach((fig) => {
      gsap.fromTo(fig, { y: 34 }, {
        y: -22, ease: "none",
        scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }
})();
```

---

## Tier 1 — Page glide

```js
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
```

`lerp` is the fraction of remaining distance covered per frame. `0.08–0.1` is the band
that reads as weight without feeling laggy; below `0.05` the page feels like it's on ice,
above `0.15` you've barely changed anything.

Three wiring rules, in order, and all three matter — see LESSONS.md #2:

1. `lenis.on("scroll", ScrollTrigger.update)` — otherwise triggers fire against native
   scroll position while the page renders at Lenis's, and everything lands late.
2. `gsap.ticker.add((t) => lenis.raf(t * 1000))` — one clock. Lenis on its own rAF means
   two loops competing for the same frame.
3. `gsap.ticker.lagSmoothing(0)` — stops GSAP compensating after a stall, which reads as
   a jump-cut.

**Gate it.** Fine pointers only. Smooth scroll on touch fights the platform's own scroll
physics and feels broken to users who know what their phone does.

## Tier 2 — One pinned scrub

The event of the page. One section, pinned, converting scroll distance into time.

**Pin length.** `end: "+=500%"` means five viewport heights of scrolling drive the
timeline. Rules of thumb: ~100% per major beat, minimum ~60%, and past ~600% people start
wondering if the page is broken. Show a scroll hint, and fade it the instant progress
moves.

**Why a proxy.** Reading `self.progress` in `onUpdate` gives you raw scroll position,
which arrives in wheel-sized chunks. Tweening a proxy with `scrub: 0.5` makes the proxy
chase the true position with a half-second time constant, so the value you actually feed
the scene is continuous. It costs three lines and it is the single biggest perceived-quality
win in the whole system.

**Keep three things in sync.** The `SEG` map in the scene, the pin length here, and any
on-screen phase labels all encode the same timing. Put a comment in each pointing at the
other two — they *will* drift.

**Phase labels** are worth having: a small mono line, one visible at a time, telling the
viewer which beat they're in. It makes a long pin legible instead of disorienting.

```js
// mirrors SEG in the scene
const phaseAt = (p) => (p < 0.11 ? 0 : p < 0.23 ? 1 : p < 0.53 ? 2 : p < 0.85 ? 3 : 4);
```

## Tier 3 — Reveal on enter

Two lines of CSS. Not a per-section bespoke animation.

```css
.reveal    { opacity: 0; transform: translateY(28px); }
.reveal.in { opacity: 1; transform: none;
             transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
```

- `start: "top 82%"` — fires a bit before the element is centered, so content is settled
  by the time it's being read.
- `once: true` — re-animating on scroll-up is the most common way a nice page becomes an
  annoying one.
- Stagger only by index within a group (`delay: i * 0.08`), and only for a genuine row.
- One curve for the whole page. `cubic-bezier(.2,.7,.2,1)` — fast out, long settle.

**Do not** add a different reveal per section. Uniform reveals read as confident;
per-section bespoke ones read as fussy, and they're the reason a lot of animated pages
feel exhausting.

## Hover and focus states

Cheap, and skipping them is instantly noticeable. One pattern, everywhere:

```css
.nav-links a::after {
  content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 100%;
  background: currentColor; transform: scaleX(0); transform-origin: left;
  transition: transform .28s cubic-bezier(.6,0,.2,1);
}
.nav-links a:hover::after,
.nav-links a:focus-visible::after { transform: scaleX(1); }
```

Always pair `:hover` with `:focus-visible`. A page with beautiful hovers and no focus
states is not finished.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; }
  * { transition: none !important; animation: none !important; }
}
```

Plus, in JS: skip Lenis, skip the pin, and call `apply()` once at a representative
progress value so the signature shows a good static frame. About ten lines total for a
page that is complete and still, rather than a page with pieces missing.

## The one kinetic-type moment

```html
<h1 class="hero-h1">
  <span class="line"><span>FIRST LINE</span></span>
  <span class="line"><span>SECOND LINE</span></span>
</h1>
```
```css
.hero-h1 .line       { display: block; overflow: hidden; }
.hero-h1 .line > span{ display: inline-block; transform: translateY(110%); }
```
```js
gsap.to(".hero-h1 .line > span",
        { y: 0, duration: 1.05, ease: "power4.out", stagger: 0.09, delay: 0.15 });
```

Masked line rise, `power4.out`, ~1 s. Once per page. The second one cancels the first, and
per-letter splits make a page look like every other generated site.

## Nav over anything

```css
.nav { position: fixed; z-index: 40; mix-blend-mode: difference; }
.nav a { color: #fff; }
```

`mix-blend-mode: difference` keeps a white nav legible over a dark canvas *and* over a
bright photograph, with no scrim and no JS. Verify contrast against your actual extremes —
it fails on mid-greys — and it's a cheap alternative to the backdrop-blur bar that appears
on every templated site.
