# Setup

Everything here runs on static files. There is no build step, no bundler, and nothing to
install for the site itself. Node is needed only for the optional measurement and
screenshot tooling.

---

## 1. Prerequisites

| Need | Why | Check |
|---|---|---|
| Any static file server | The site must be served over HTTP — `file://` breaks ES modules and `fetch` | `python -m http.server 8734` or `npx serve` |
| A modern Chromium/Firefox/Safari | GSAP, Lenis, and WebGL all target evergreen browsers | — |
| **Optional:** Node 18+ | Only for `tools/measure.mjs` and `tools/shots.mjs` | `node -v` |
| **Optional:** Desktop Chrome installed | The tools drive your real Chrome via `puppeteer-core` | see §4 |
| **Optional:** Python 3 | Simplest zero-install static server | `python -V` |

Nothing else. No account, no API key, no service.

## 2. Run the starter

```bash
cd starter
python -m http.server 8734
```

Then open <http://localhost:8734>.

Node alternative, if you'd rather not use Python:

```bash
npx --yes serve starter -l 8734
```

**Try the debug hooks** (they are the point of Step 6 in the recipe):

- <http://localhost:8734/?p=0.45> — freezes the signature scene at 45% progress
- <http://localhost:8734/?ss=1400> — shifts the page up 1400 px without scrolling

## 3. Vendoring the libraries

The starter loads GSAP, ScrollTrigger, and Lenis from a CDN so it runs with zero setup.
**For a real site, vendor them** — download the minified files into `vendor/` and commit
them. Reasons: no third-party origin in your critical path, no version drift, no CDN
outage, and a stricter Content-Security-Policy becomes possible.

```bash
mkdir -p vendor
curl -o vendor/gsap.min.js          https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js
curl -o vendor/ScrollTrigger.min.js https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js
curl -o vendor/lenis.min.js         https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js
```

Then swap the `<script src>` values in `index.html`. Check the licences before you ship:
Lenis is MIT; **GSAP's core and ScrollTrigger are free under GSAP's own licence, which is
not MIT** — read it and confirm it covers your use. See [SOURCES.md](SOURCES.md).

### Three.js, if you want a 3D signature

Three.js ships as an ES module. The full `three.module.js` was **53% of our first-load
bytes and only ~44% of it ever executed** (measured with Chrome's coverage tool). If your
scene uses a narrow slice of the library, build a slim bundle: write an entry file that
re-exports only the names your scene touches, and roll it up.

```bash
npm i -D three rollup @rollup/plugin-node-resolve terser
# entry.js:  export { WebGLRenderer, Scene, PerspectiveCamera, Mesh, ... } from "three";
npx rollup entry.js -f es -p node-resolve | npx terser -m -c > vendor/three.slim.min.js
```

Grep your scene for every `THREE.` name before regenerating, and pixel-compare a contact
sheet before and after the swap. A missing export fails at runtime, not at build time.
This is a one-time build artifact you commit; the site still has no build step.

## 4. The measurement and screenshot tools

```bash
cd tools
npm install          # installs puppeteer-core only
```

`puppeteer-core` does **not** download a browser — it drives the Chrome you already have.
Point the tools at it with an environment variable if they can't find it:

```bash
# macOS
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Linux
export CHROME_PATH="/usr/bin/google-chrome"
```

```powershell
# Windows PowerShell
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

If you'd rather have a browser downloaded for you, use `puppeteer` instead of
`puppeteer-core` and drop the `executablePath` line in both scripts.

### Performance evidence

```bash
node measure.mjs http://localhost:8734
```

Prints FCP, LCP, CLS, DOMContentLoaded, long tasks over 50 ms, and per-asset transfer
sizes — for desktop and for emulated mobile with 4× CPU throttling — and writes
`measure-out.json`. Run it before and after every optimization and keep the JSON; that is
your evidence, and it's what the numbers in [LESSONS.md](LESSONS.md) are made of.

### Contact sheets

```bash
node shots.mjs http://localhost:8734 --p 0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1
```

Writes one PNG per progress value into `tools/shots/`. Review them as a storyboard — dead
beats, repeated frames, and moments where nothing reads are obvious in a grid and
invisible while scrolling.

## 5. Deploying

Any static host works, because it *is* static: Netlify, Cloudflare Pages, GitHub Pages,
Vercel, S3 + CloudFront, or a plain nginx root.

Two things worth configuring on any of them:

**Cache headers.** Hashed or versioned assets (fonts, vendored libraries, images) want
`public, max-age=31536000, immutable`. HTML wants `max-age=0, must-revalidate`. Several
hosts default *everything* to must-revalidate, which means every repeat visitor
re-validates every asset — a full round trip each, for files that never change.

**Compression.** Confirm your host serves Brotli or gzip for `.js`/`.css`/`.html`. Most do
automatically. `.woff2` is already compressed; don't bother.

If your host also runs serverless functions, keep any private file *outside* the static
output directory and stream it from a function rather than linking it — a file in the
public directory is public whether or not anything links to it.

## 6. Sanity checklist before you call it done

- [ ] Contact sheet at 11 progress values shows 11 distinct, legible frames
- [ ] Scrubbing backwards through the pinned section looks identical to scrubbing forward
- [ ] `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media) gives a
      complete, static, readable page with no pin
- [ ] Tab through the whole page — focus order survives the pinned section
- [ ] Mobile emulation at 390 px wide: no horizontal scroll, no text under 14 px
- [ ] `measure.mjs` mobile run is inside budget
- [ ] Idle in the pinned section with DevTools Performance recording — frames should stop
- [ ] Every image has `aspect-ratio` (or width/height) and `loading="lazy"` below the fold
- [ ] No secrets, keys, analytics IDs, or private paths in committed source
