#!/usr/bin/env node
/*
 * scripts/visual-audit/verify-p10-retrofit.mjs
 *
 * P10 retrofit verification (AMD-026 Phase 1). Opens dashboard.html, clicks
 * each health banner (test/security/approvals/architecture) to expand the
 * detail panel, captures a focused screenshot of each expanded panel so the
 * Founder can verify the new WHAT-ACTION block surfaces.
 *
 * Output: scripts/visual-audit/dashboard/p10-retrofit-{banner}-expanded.png
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const DASHBOARD_HTML = resolve(REPO_ROOT, "docs", "reports", "dashboard.html");
const OUTPUT_DIR = resolve(REPO_ROOT, "scripts", "visual-audit", "dashboard");

const BANNERS = ["test", "security", "approvals", "architecture"];

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const url = pathToFileURL(DASHBOARD_HTML).toString();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // Wait for JS to populate health banners.
    await page.waitForTimeout(800);

    for (const banner of BANNERS) {
        const btnSelector = `[data-fq-banner="${banner}"]`;
        const panelSelector = `[data-fq-banner-detail="${banner}"]`;
        const btn = await page.$(btnSelector);
        if (!btn) {
            console.log(`[p10] banner ${banner}: button not found, skipping`);
            continue;
        }
        // Collapse any previously expanded panels.
        for (const other of BANNERS) {
            if (other === banner) continue;
            const otherBtn = await page.$(`[data-fq-banner="${other}"]`);
            if (otherBtn) {
                const expanded = await otherBtn.getAttribute("aria-expanded");
                if (expanded === "true") {
                    await otherBtn.click();
                    await page.waitForTimeout(120);
                }
            }
        }
        // Expand this banner.
        const expandedNow = await btn.getAttribute("aria-expanded");
        if (expandedNow !== "true") {
            await btn.click();
            await page.waitForTimeout(200);
        }
        // Scroll the banner button into view so the panel below is captured.
        await btn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        const panel = await page.$(panelSelector);
        if (!panel) {
            console.log(`[p10] banner ${banner}: panel not found, skipping`);
            continue;
        }
        // Capture the panel + parent banner row for context.
        const bannerRow = await page.$("[data-fq-section=\"health\"]");
        const outPath = resolve(OUTPUT_DIR, `p10-retrofit-${banner}-expanded.png`);
        if (bannerRow) {
            await bannerRow.screenshot({ path: outPath });
        } else {
            await panel.screenshot({ path: outPath });
        }
        console.log(`[p10] captured: ${outPath}`);
    }

    await browser.close();
    console.log("[p10] done");
}

main().catch((e) => { console.error(e); process.exit(1); });
