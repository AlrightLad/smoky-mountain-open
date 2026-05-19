// AMD-026 P10 retrofit verification: top-of-viewport capture for narrow surfaces.
// Used to spot-check dashboards whose full-page capture exceeds the 2000x2000
// readable limit. Captures only the first ~1200px of each page so the KPI
// strips + badge affordances render at decent resolution.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const REPORTS = resolve(REPO_ROOT, "docs", "reports");
const OUT_DIR = resolve(__dirname, "dashboard");

const PAGES = ["dashboard", "activity", "amendments", "discussion-bubbles", "escalations", "index", "proposals", "token-usage"];

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 }, colorScheme: "dark" });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const fileUrl = pathToFileURL(resolve(REPORTS, p + ".html")).toString();
    try {
      await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(500);
      const outPath = resolve(OUT_DIR, p + "-viewport.png");
      await page.screenshot({ path: outPath, fullPage: false });
      console.log("  " + p + "-viewport.png");
    } catch (err) {
      console.error("FAIL " + p + ": " + err.message);
    }
    await page.close();
  }
  await browser.close();
})();
