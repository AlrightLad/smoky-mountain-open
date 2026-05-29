import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlUrl = pathToFileURL(resolve(__dirname, "scratch.html")).href;
const out = resolve(__dirname, "scratch.png");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 820, height: 620 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(htmlUrl, { waitUntil: "load" });
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("wrote " + out);
