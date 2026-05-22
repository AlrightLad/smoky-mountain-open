#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-harness-flow.mjs
 *
 * Captures the new docs/reports/harness-flow.html dashboard at desktop
 * + mobile viewports for design-pass review.
 */

import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const PAGE = resolve(REPO, "docs/reports/harness-flow.html");
const OUT = resolve(REPO, ".claude/state/design-pass-2026-05-22/harness-flow");

const PROFILES = [
    { key: "hq", width: 1440, height: 900 },
    { key: "iphone14", width: 390, height: 844 },
    { key: "pixel7", width: 412, height: 915 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const p of PROFILES) {
    const ctx = await browser.newContext({ viewport: { width: p.width, height: p.height } });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE).href, { waitUntil: "load" });
    await page.waitForTimeout(900);
    const pathFull = resolve(OUT, `iter0-${p.key}-full.png`);
    const pathVp   = resolve(OUT, `iter0-${p.key}-viewport.png`);
    await page.screenshot({ path: pathFull, fullPage: true });
    await page.screenshot({ path: pathVp, fullPage: false });
    console.log(`[capture-harness-flow] ${p.key} ${p.width}x${p.height}`);
    await ctx.close();
}
await browser.close();
console.log("[capture-harness-flow] done");
