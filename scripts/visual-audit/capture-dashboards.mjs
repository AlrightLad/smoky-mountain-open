#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-dashboards.mjs
 *
 * Capture full-page screenshots of every dashboard at two viewport widths:
 * desktop (1440x900) and mobile (375x812 — iPhone X portrait).
 *
 * Usage:
 *   node scripts/visual-audit/capture-dashboards.mjs [output-date-dir]
 *
 * Defaults output to scripts/visual-audit/<today YYYY-MM-DD>/. Writes
 * 16 PNGs (8 dashboards x 2 viewports) plus a manifest.json with
 * capture timestamps, viewport sizes, and file sizes.
 *
 * Trigger: Dashboard Consolidation visual verification pass between
 * Phase 0 and DC-5. Founder reviews these before authorizing continued
 * normalization across activity / bubbles / proposals / index / etc.
 */

import { chromium } from "playwright";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const REPORTS_DIR = resolve(REPO_ROOT, "docs", "reports");

const PAGES = [
    "dashboard.html",
    "activity.html",
    "proposals.html",
    "discussion-bubbles.html",
    "main-flows.html",
    "design-system.html",
    "token-usage.html",
    "index.html",
];

// Four canonical widths (DC-8 mobile QA). 1920 = desktop wide, 1280 = desktop
// standard (--max-content), 768 = tablet portrait, 375 = mobile (iPhone X).
const VIEWPORTS = [
    { name: "desktop-wide", width: 1920, height: 1080 },
    { name: "desktop",      width: 1280, height: 900  },
    { name: "tablet",       width: 768,  height: 1024 },
    { name: "mobile",       width: 375,  height: 812  },
];

function todayIso() {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

async function main() {
    const dateDir = process.argv[2] || todayIso();
    const outDir = resolve(__dirname, dateDir);
    await mkdir(outDir, { recursive: true });

    console.log(`[capture] output: ${outDir}`);
    console.log(`[capture] pages: ${PAGES.length}, viewports: ${VIEWPORTS.length}, total: ${PAGES.length * VIEWPORTS.length}`);

    const browser = await chromium.launch();
    const manifest = {
        captured_at: new Date().toISOString(),
        repo_root: REPO_ROOT,
        reports_dir: REPORTS_DIR,
        viewports: VIEWPORTS,
        pages: PAGES,
        files: [],
    };

    try {
        for (const vp of VIEWPORTS) {
            const ctx = await browser.newContext({
                viewport: { width: vp.width, height: vp.height },
                deviceScaleFactor: 1,
                colorScheme: "dark",
            });
            for (const page of PAGES) {
                const pageObj = await ctx.newPage();
                const fileUrl = pathToFileURL(resolve(REPORTS_DIR, page)).toString();
                const slug = page.replace(/\.html$/, "");
                const screenshotPath = resolve(outDir, `${slug}-${vp.name}.png`);
                try {
                    await pageObj.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
                    // Inline JS on the dashboards renders KPIs + tables from the
                    // data block on DOMContentLoaded. Give it a beat to settle
                    // before snapshotting.
                    await pageObj.waitForTimeout(400);
                    await pageObj.screenshot({ path: screenshotPath, fullPage: true });
                    const s = await stat(screenshotPath);
                    manifest.files.push({
                        page,
                        viewport: vp.name,
                        path: `scripts/visual-audit/${dateDir}/${slug}-${vp.name}.png`,
                        size_bytes: s.size,
                    });
                    console.log(`  ${slug}-${vp.name}.png  ${(s.size / 1024).toFixed(1)} KB`);
                } catch (err) {
                    console.error(`  FAIL ${slug}-${vp.name}: ${err.message}`);
                    manifest.files.push({
                        page,
                        viewport: vp.name,
                        path: `scripts/visual-audit/${dateDir}/${slug}-${vp.name}.png`,
                        error: err.message,
                    });
                } finally {
                    await pageObj.close();
                }
            }
            await ctx.close();
        }
    } finally {
        await browser.close();
    }

    const manifestPath = resolve(outDir, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`[capture] manifest: ${manifestPath}`);

    // Sanity: report any failures.
    const failures = manifest.files.filter(f => f.error || (f.size_bytes !== undefined && f.size_bytes === 0));
    if (failures.length > 0) {
        console.error(`\n[capture] ${failures.length} failure(s):`);
        for (const f of failures) {
            console.error(`  ${f.page}-${f.viewport}: ${f.error || "zero-byte file"}`);
        }
        process.exit(1);
    }
    console.log(`\n[capture] OK: ${manifest.files.length} screenshots captured.`);
}

main().catch(err => { console.error(err); process.exit(2); });
