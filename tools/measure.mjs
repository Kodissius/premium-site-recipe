/* ============================================================================
   measure.mjs — performance evidence for one page.

   Usage:  node measure.mjs http://localhost:8734 [--out measure-out.json]

   Runs the URL twice — desktop, and emulated mobile with 4x CPU throttling —
   and reports FCP, LCP, CLS, DOMContentLoaded, long tasks over 50 ms, and
   per-asset transfer sizes. Writes JSON so you can diff before/after.

   Measure ONE change at a time, or you learn nothing about which one helped.
   ========================================================================== */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
import { findChrome } from "./chrome.mjs";

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http")) || "http://localhost:8734";
const outIdx = args.indexOf("--out");
const outFile = outIdx > -1 ? args[outIdx + 1] : "measure-out.json";

const PROFILES = [
  { name: "desktop", width: 1440, height: 900, dpr: 2, mobile: false, cpu: 1 },
  { name: "mobile-4x", width: 390, height: 844, dpr: 3, mobile: true, cpu: 4 },
];

/* Installed in the page before anything else runs. */
const COLLECTOR = () => {
  window.__m = { lcp: 0, cls: 0, longTasks: [] };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__m.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.duration >= 50)
          window.__m.longTasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
  } catch {}
};

const kb = (b) => (b / 1024).toFixed(1) + " KB";
const ms = (v) => (v ? Math.round(v) + " ms" : "—");

async function run(browser, profile) {
  const page = await browser.newPage();
  await page.setViewport({
    width: profile.width, height: profile.height,
    deviceScaleFactor: profile.dpr, isMobile: profile.mobile,
    hasTouch: profile.mobile,
  });
  await page.evaluateOnNewDocument(COLLECTOR);

  const client = await page.createCDPSession();
  await client.send("Network.enable");   // required, or setCacheDisabled is a no-op
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (profile.cpu > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });

  await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));   // let late LCP candidates land

  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const paint = Object.fromEntries(
      performance.getEntriesByType("paint").map((e) => [e.name, e.startTime])
    );
    const res = performance.getEntriesByType("resource").map((r) => ({
      name: r.name.split("/").slice(3).join("/") || r.name,
      type: r.initiatorType,
      transfer: r.transferSize || 0,
      encoded: r.encodedBodySize || 0,
    }));
    return {
      fcp: paint["first-contentful-paint"] || 0,
      lcp: window.__m.lcp,
      cls: window.__m.cls,
      dcl: nav.domContentLoadedEventEnd || 0,
      load: nav.loadEventEnd || 0,
      docTransfer: nav.transferSize || 0,
      longTasks: window.__m.longTasks,
      resources: res,
    };
  });

  await page.close();

  data.totalTransfer =
    data.docTransfer + data.resources.reduce((s, r) => s + r.transfer, 0);
  return data;
}

function report(name, d) {
  console.log(`\n=== ${name} ===`);
  console.log(`  FCP                 ${ms(d.fcp)}`);
  console.log(`  LCP                 ${ms(d.lcp)}`);
  console.log(`  CLS                 ${d.cls.toFixed(4)}`);
  console.log(`  DOMContentLoaded    ${ms(d.dcl)}`);
  console.log(`  load                ${ms(d.load)}`);
  console.log(`  first-load transfer ${kb(d.totalTransfer)}`);
  console.log(`  long tasks (>50ms)  ${d.longTasks.length ? d.longTasks.map((t) => t.dur + "ms").join(", ") : "none"}`);
  const top = [...d.resources].sort((a, b) => b.transfer - a.transfer).slice(0, 10);
  if (top.length) {
    console.log("  heaviest assets:");
    for (const r of top) console.log(`    ${kb(r.transfer).padStart(10)}  ${r.name}`);
  }
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const out = { url, when: new Date().toISOString(), profiles: {} };
try {
  for (const p of PROFILES) {
    const d = await run(browser, p);
    out.profiles[p.name] = d;
    report(p.name, d);
  }
} finally {
  await browser.close();
}

writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`\nwrote ${outFile}`);
console.log("Budget: <=500 KB first load · mobile LCP <=2.5 s · CLS <=0.01 · longest task <=500 ms");
