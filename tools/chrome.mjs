/* Locate an installed Chrome/Chromium. Set CHROME_PATH to override. */
import { existsSync } from "node:fs";

const CANDIDATES = [
  process.env.CHROME_PATH,
  // Windows
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
].filter(Boolean);

export function findChrome() {
  for (const p of CANDIDATES) if (existsSync(p)) return p;
  throw new Error(
    "No Chrome found. Set CHROME_PATH to your Chrome executable, e.g.\n" +
    '  Windows PowerShell: $env:CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"\n' +
    '  macOS:              export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"\n' +
    "  Linux:              export CHROME_PATH=/usr/bin/google-chrome\n" +
    "Or swap puppeteer-core for puppeteer, which downloads its own browser."
  );
}
