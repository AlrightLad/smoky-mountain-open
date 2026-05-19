// Zoom-into-section capture for P10 visible-action audit at 2x DPR + wide viewport.
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const REPORTS = resolve(REPO_ROOT, "docs", "reports");
const OUT_DIR = resolve(__dirname, "dashboard");

const CAPTURES = [
  { file: "dashboard.html", selector: "#founder-review-queue", out: "dashboard-founder-queue.png" },
  { file: "dashboard.html", selector: ".pb-kpi-grid.is-this-week", out: "dashboard-this-week.png" },
  { file: "token-usage.html", selector: "#tu-quota-meter", out: "token-meter.png" },
  { file: "token-usage.html", selector: "#tu-pie-section", out: "token-pie.png" },
];

(async () => {
  const browser = await chromium.launch();
  // Higher DPR + wider viewport so action badges are legible
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, colorScheme: "dark" });
  for (const c of CAPTURES) {
    const page = await ctx.newPage();
    const fileUrl = pathToFileURL(resolve(REPORTS, c.file)).toString();
    try {
      await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
      await page.waitForTimeout(700);
      const el = await page.$(c.selector);
      if (!el) { console.error("missing " + c.selector + " in " + c.file); await page.close(); continue; }
      const outPath = resolve(OUT_DIR, c.out);
      await el.screenshot({ path: outPath });
      console.log("  " + c.out);
    } catch (err) {
      console.error("FAIL " + c.out + ": " + err.message);
    }
    await page.close();
  }
  await browser.close();
})();
