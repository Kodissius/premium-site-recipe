# Step 6 — Verification: screenshot rigs, not vibes

You cannot art-direct a scroll-scrubbed film by scrolling. You scroll past the dead beat
every time, because you're moving, and motion hides everything a still frame reveals.

Build the two debug hooks on day one. They cost about 25 lines and they change how the
whole project runs.

---

## The two hooks

### `?p=0.42` — freeze the signature at a progress value

```js
const params = new URLSearchParams(location.search);
const pParam = params.get("p");
const ssParam = params.get("ss");
const debug = pParam !== null || ssParam !== null;
```

In debug mode:

1. **Skip Lenis and skip the pinned ScrollTrigger entirely.** Ours originally left the
   trigger alive and it fought the snapshot — resetting progress mid-capture and producing
   frames from the wrong moment. Turn them off, don't try to coexist.
2. Force every reveal to its `.in` state, and every entrance tween to its end state, so
   lower sections are shootable.
3. Call the scene's snapshot entry point, which applies `p` **and stops the rAF loop** so
   nothing eases away from the frame you asked for.

```js
window.__snapshot = (p) => { target = current = p; apply(p, 0); render(); running = false; };
```

Re-run the settle function on `DOMContentLoaded`, on `load`, and after
`document.fonts.ready` — otherwise late font swaps and late images produce a frame that
isn't the one you'll ship.

### `?ss=2000` — translate the page instead of scrolling

```js
document.body.style.transform = `translateY(-${+ssParam}px)`;
```

Real scrolling before first paint produces blank captures in most headless setups.
Translating the body doesn't, so this is how you shoot section four.

**The catch, and it bites:** `IntersectionObserver` uses *layout* position, which a
transform does not change. Anything gated on IO — lazy images, deferred demos, the render
loop's own visibility gate — won't fire. For those, drive real scrolling through the
automation API instead. Use `?ss=` for static layout review, real scrolling for behavior.

---

## The rig

`puppeteer-core` driving your installed Chrome. Setup in [SETUP.md](../SETUP.md).

```bash
node tools/shots.mjs http://localhost:8734 --p 0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1
```

One PNG per progress value in `tools/shots/`. Open the folder as a grid.

### Review it as a contact sheet

This is the actual technique, and it's worth more than the tooling around it. In a grid of
eleven frames you immediately see what dozens of scroll-throughs hide:

- **Two beats that look identical** — merge them or cut one.
- **A stretch where nothing changes** — we found a dead 8% window this way that nobody had
  noticed while scrolling.
- **A moment where the subject is half out of frame** — camera rig blending needs work.
- **A beat with no legible state** — no label, no readout, nothing telling the viewer what
  they're looking at.
- **Pacing** — beats should be roughly proportional to how much there is to understand in
  each. The substantive beat wants the longest window.

Shoot the contact sheet after every meaningful scene change. It takes seconds and it's the
only reliable way to see your own film.

---

## Headless truths that cost us time

All of these are in LESSONS.md #18; repeated here because this is the page you'll be on
when they bite:

- Real scrolling before paint → blank captures. Use `?ss=`.
- `?ss=` breaks IO-gated content. Use real scrolling for that.
- A hidden or backgrounded tab **stops compositing**, so rAF never fires and the scene
  never advances. Keep the automated window foregrounded, or render explicitly instead of
  waiting for a frame.
- `--virtual-time-budget` freezes at an arbitrary moment for scroll-driven content. Not a
  substitute for `?p=`.
- Some headless configurations clamp windows narrower than ~500 px and crop the
  screenshot, which fakes horizontal overflow. Verify true mobile in a real browser at
  390 px before chasing an overflow bug that doesn't exist.
- Embedded preview browsers cache subresources aggressively. Swap origin
  (`localhost` ↔ `127.0.0.1`) to force a fresh fetch — fastest way to answer "is my change
  live, or am I looking at a stale file?"

---

## What to check by hand, in a real browser

The rig doesn't cover these, and they're where quality actually lives:

1. **Scrub backwards.** Slowly, through the whole pinned section. It should be identical
   to forward. If it isn't, `apply(p)` isn't pure.
2. **Scroll fast.** Flick to the bottom and back. Nothing should be missing or stuck.
3. **Deep link.** Load with `#a-late-section` directly. Deferred builds are the usual
   casualty.
4. **Reduced motion.** DevTools → Rendering → Emulate CSS media →
   `prefers-reduced-motion: reduce`. You should get a complete, still, readable page — not
   a page with holes in it.
5. **Tab through it.** Focus order must survive the pin, and every interactive thing needs
   a visible `:focus-visible` state.
6. **Resize while pinned.** ScrollTrigger recalculates; your canvas must too.
7. **Trackpad and mouse wheel both.** They produce very different event streams, and a
   scrub tuned only on a trackpad often stutters on a wheel.
8. **Idle in the pinned section with a Performance recording running.** Frames should
   stop. If they don't, your loop isn't sleeping.

---

## A cheap trick: design bake-offs

For the signature — the one genuinely hard, genuinely subjective piece — build it *twice*,
independently, to the same brief, writing to two different files. Then shoot both contact
sheets at identical progress values and compare frame for frame.

It works because the choice becomes visual and side-by-side instead of argumentative, and
because the loser usually contributes two or three ideas that get grafted into the winner.
We did this with two AI agents on the same brief; it works equally well with two afternoons
or two people. Archive the loser — ours got raided for parts later.
