#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-side-by-side.mjs
 *
 * Render a side-by-side comparison HTML artifact as a PNG for commit
 * evidence. Used by main-flows iter 8+ ship reports as the
 * replacement for "Founder eyes-test" verification.
 *
 * Usage:
 *   node scripts/visual-audit/capture-side-by-side.mjs \
 *     <html-path-relative-to-repo-root> \
 *     <output-png-path-relative-to-repo-root>
 */

import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const htmlRel = process.argv[2];
const outRel  = process.argv[3];

if (!htmlRel || !outRel) {
    console.error("usage: capture-side-by-side.mjs <html-relative-path> <out-png-relative-path>");
    process.exit(2);
}

const htmlPath = resolve(REPO_ROOT, htmlRel);
const outPath  = resolve(REPO_ROOT, outRel);

const browser = await chromium.launch();
const ctx = await browser.newContext({
    viewport: { width: 2400, height: 1400 },
    deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: "load" });
await page.waitForTimeout(800);

await mkdir(dirname(outPath), { recursive: true });
await page.screenshot({ path: outPath, fullPage: true });
console.log(`captured ${outRel}`);
await browser.close();
