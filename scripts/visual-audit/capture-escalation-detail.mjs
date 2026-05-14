#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-escalation-detail.mjs
 *
 * Captures dashboard.html escalation detail UI for the Founder
 * directive 2026-05-14 "escalation panel needs functionality" ship.
 *
 * Captures (1440x900 + 375x812):
 *   - dashboard-escalation-collapsed-desktop.png (default state)
 *   - dashboard-escalation-expanded-desktop.png  (after click)
 *   - dashboard-escalation-collapsed-mobile.png  (default at 375px)
 *   - dashboard-escalation-expanded-mobile.png   (expanded at 375px)
 *
 * Also asserts via DOM probe that:
 *   - escalations-count text matches the data block's open_escalations length
 *   - clicking the KPI card toggles the detail panel hidden attr
 *   - each rendered fq-escalation-card has the expected child structure
 *
 * Exit non-zero on any functional assertion failure (per AMD-009 P4 + AMD-012).
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "dashboard.html");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "founder-review-queue-v1");

async function captureAt(viewport, label) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "dark" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`); });

    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(500);

    // Probe data block for expected count
    const expectedCount = await page.evaluate(() => {
        const data = JSON.parse(document.getElementById("report-data").textContent);
        const fq = data.founder_queue || {};
        const gov = fq.governance_gates || {};
        const esc = gov.open_escalations || [];
        return esc.length;
    });

    // Probe rendered count
    const renderedCount = await page.evaluate(() => {
        const el = document.querySelector('[data-fq="escalations-count"]');
        return el ? Number(el.textContent.trim()) : -1;
    });

    if (expectedCount !== renderedCount) {
        throw new Error(`[${label}] count mismatch: rendered=${renderedCount} expected=${expectedCount}`);
    }

    // Panel hidden by default
    const beforeHidden = await page.evaluate(() => {
        const panel = document.getElementById("fq-escalation-detail");
        return panel ? panel.hidden : null;
    });
    if (!beforeHidden) {
        throw new Error(`[${label}] panel should be hidden by default; got hidden=${beforeHidden}`);
    }

    // Capture collapsed state
    await page.screenshot({
        path: resolve(OUT_DIR, `dashboard-escalation-collapsed-${label}.png`),
        fullPage: true,
    });

    // Click the toggle
    await page.click('[data-fq-toggle="escalation-detail"]');
    await page.waitForTimeout(200);

    // Panel should now be visible
    const afterHidden = await page.evaluate(() => {
        const panel = document.getElementById("fq-escalation-detail");
        return panel ? panel.hidden : null;
    });
    if (afterHidden !== false) {
        throw new Error(`[${label}] panel should be visible after click; got hidden=${afterHidden}`);
    }

    // aria-expanded should be "true"
    const ariaExpanded = await page.getAttribute('[data-fq-toggle="escalation-detail"]', "aria-expanded");
    if (ariaExpanded !== "true") {
        throw new Error(`[${label}] aria-expanded should be 'true' after click; got '${ariaExpanded}'`);
    }

    // Each rendered card should have expected structure
    const cardCheck = await page.evaluate(() => {
        const cards = document.querySelectorAll(".fq-escalation-card");
        return Array.from(cards).map((c) => ({
            id: c.getAttribute("data-escalation-id"),
            hasTitle: !!c.querySelector(".fq-escalation-title"),
            hasProposed: !!c.querySelector(".fq-escalation-body"),
            hasResolveBtn: !!c.querySelector("[data-fq-resolve]"),
            hasSourceLink: !!c.querySelector(".fq-escalation-btn--source"),
            isStale: c.classList.contains("is-stale"),
        }));
    });
    for (const c of cardCheck) {
        if (!c.hasTitle || !c.hasResolveBtn) {
            throw new Error(`[${label}] card ${c.id} missing required elements: ${JSON.stringify(c)}`);
        }
    }

    // Capture expanded state
    await page.screenshot({
        path: resolve(OUT_DIR, `dashboard-escalation-expanded-${label}.png`),
        fullPage: true,
    });

    await browser.close();

    return { expectedCount, renderedCount, cardCount: cardCheck.length, cards: cardCheck, errors };
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[capture-escalation-detail] out: ${OUT_DIR}`);

    const results = {
        captured_at: new Date().toISOString(),
        desktop: null,
        mobile: null,
    };

    console.log("[capture-escalation-detail] desktop 1440x900...");
    results.desktop = await captureAt({ width: 1440, height: 900 }, "desktop");
    console.log("  ✓ desktop:", results.desktop.cardCount, "cards rendered");

    console.log("[capture-escalation-detail] mobile 375x812...");
    results.mobile = await captureAt({ width: 375, height: 812 }, "mobile");
    console.log("  ✓ mobile:", results.mobile.cardCount, "cards rendered");

    await writeFile(
        resolve(OUT_DIR, "capture-meta.json"),
        JSON.stringify(results, null, 2),
        "utf-8"
    );
    console.log("[capture-escalation-detail] PASS");
}

main().catch((err) => {
    console.error("[capture-escalation-detail] FAIL:", err.message);
    process.exit(1);
});
