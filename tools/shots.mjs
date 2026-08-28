/* ============================================================================
   shots.mjs — contact sheet of the signature scene.

   Usage:
     node shots.mjs http://localhost:8734
     node shots.mjs http://localhost:8734 --p 0,0.25,0.5,0.75,1
     node shots.mjs http://localhost:8734 --ss 0,1400,2800 --out shots-layout
     node shots.mjs http://localhost:8734 --mobile

   Requires the ?p= debug hook in the page (recipe/05-verify.md). Review the
   output as a GRID, not one at a time — dead beats and repeated frames are
   invisible while scrolling and obvious in a contact sheet.
   ========================================================================== */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { findChrome } from "./chrome.mjs";

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http")) || "http://localhost:8734";
const flag = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };

const ps = flag("--p", "0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1")
  .split(",").map((s) => s.trim()).filter(Boolean);
const sss = flag("--ss", "").split(",").map((s) => s.trim()).filter(Boolean);
const outDir = flag("--out", "shots");
const mobile = args.includes("--mobile");

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
});

const page = await browser.newPage();
await page.setViewport(
  mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1440, height: 900, deviceScaleFactor: 2 }
);

async function shoot(query, file) {
  await page.goto(`${url}${url.includes("?") ? "&" : "?"}${query}`, {
    waitUntil: "networkidle0", timeout: 60000,
  });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise((r) => setTimeout(r, 350));   // let the frozen frame paint
  await page.screenshot({ path: `${outDir}/${file}.png` });
  console.log(`  ${outDir}/${file}.png`);
}

console.log(`shooting ${url}`);
for (const p of ps) await shoot(`p=${p}`, `p-${String(p).replace(".", "_")}`);
for (const s of sss) await shoot(`ss=${s}`, `ss-${s}`);

await browser.close();
console.log("\nOpen the folder as a grid and look for: two identical beats, a stretch");
console.log("where nothing changes, a subject half out of frame, a beat with no legible state.");
