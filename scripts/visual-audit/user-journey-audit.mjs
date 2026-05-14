#!/usr/bin/env node
/*
 * scripts/visual-audit/user-journey-audit.mjs
 *
 * Click-through user-journey audit — OPERATION, not measurement.
 *
 * Authored 2026-05-14 per Founder directive "USE THE DAMN BROWSER LIKE
 * A USER". Iter 11 shipped with iter-11 fixes passing measurement tests
 * but Founder found visual issues remaining in actual usage. Root cause:
 * team was using Playwright as a measurement tool (getComputedStyle,
 * getBoundingClientRect, programmatic scrollTop = N) instead of as a
 * user-simulation tool (mouse wheel events, real clicks, navigation).
 *
 * This script does ACTUAL user actions:
 *   - page.mouse.wheel() for real scroll events
 *   - page.click() for clicks on interactive elements
 *   - page.goto() to traverse pages (or click <a> links)
 *   - Screenshots at each step
 *   - Writes a transcript.md of what happened + what was observed
 *
 * Each user-facing page gets:
 *   - "I opened the page" - screenshot 00
 *   - "I scrolled to <section>" - screenshot 01..N
 *   - "I clicked <element>" - screenshot of post-click state
 *   - "I navigated to <next page>" - screenshot of next page
 *
 * Output:
 *   .claude/state/user-journey-audits/<timestamp>/
 *     dashboard/  (per-page subdir)
 *     main-flows/
 *     amendments/
 *     transcript.md
 *
 * Exit 0 always — this is diagnostic, not pass/fail. Read the
 * transcript + screenshots to evaluate.
 */

import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, writeFile, appendFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const REPORTS_DIR = resolve(REPO, "docs", "reports");

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
const OUT_DIR = resolve(REPO, ".claude", "state", "user-journey-audits", TIMESTAMP);
const TRANSCRIPT_PATH = resolve(OUT_DIR, "transcript.md");

async function shot(page, dir, name) {
    const outPath = resolve(OUT_DIR, dir, `${name}.png`);
    await mkdir(dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, fullPage: false });
    return resolve(dir, `${name}.png`).replace(OUT_DIR + "/", "").replace(OUT_DIR + "\\", "");
}

async function log(line) {
    await appendFile(TRANSCRIPT_PATH, line + "\n", "utf-8");
    console.log(line);
}

async function auditDashboard(page) {
    await log("\n## /dashboard.html — User journey\n");
    await page.goto(pathToFileURL(resolve(REPORTS_DIR, "dashboard.html")).toString(), { waitUntil: "load" });
    await page.waitForTimeout(2000);
    let p = await shot(page, "dashboard", "01-opened");
    await log(`**Step 1 — Opened dashboard.html.** Screenshot: \`${p}\``);

    // Find Founder Review Queue section
    const fqText = await page.locator("#founder-review-queue").innerText().catch(() => null);
    if (fqText) {
        await log(`  - Founder Review Queue section present. First 200 chars: ${JSON.stringify(fqText.slice(0, 200))}`);
    } else {
        await log("  - WARNING: Founder Review Queue section NOT found on page");
    }

    // Scroll to Recent 7 Days using real mouse wheel events
    await log("\n**Step 2 — Scrolled to Recent 7 Days using mouse wheel (page.mouse.wheel × 4 × 400px).**");
    for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(150);
    }
    p = await shot(page, "dashboard", "02-after-wheel-scroll");
    await log(`  Screenshot: \`${p}\``);

    // Inspect the Recent 7 Days chart presence
    const r7Charts = await page.locator(".recent-7days-charts").count();
    await log(`  - .recent-7days-charts count: ${r7Charts}`);
    if (r7Charts > 0) {
        const r7Vis = await page.locator(".recent-7days-charts").first().isVisible();
        await log(`  - Recent 7 Days charts visible: ${r7Vis}`);
        if (r7Vis) {
            await page.locator(".recent-7days-charts").first().scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
            p = await shot(page, "dashboard", "03-recent-7days-in-view");
            await log(`  Screenshot of Recent 7 Days area: \`${p}\``);

            // Read the legend swatches + check perceptual color distinguishability
            const legend = await page.evaluate(() => {
                const swatches = Array.from(document.querySelectorAll(".r7-legend-swatch"));
                return swatches.map(s => {
                    const cs = window.getComputedStyle(s);
                    const label = (s.parentElement?.textContent || "").trim();
                    // Parse rgb(r, g, b) to compute approximate hue/saturation/lightness
                    const m = cs.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (!m) return { label, color: cs.backgroundColor };
                    const r = +m[1], g = +m[2], b = +m[3];
                    // HSL approximation
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    const l = (max + min) / 2 / 255;
                    const d = max - min;
                    let h = 0;
                    if (d !== 0) {
                        if (max === r) h = ((g - b) / d) % 6;
                        else if (max === g) h = (b - r) / d + 2;
                        else h = (r - g) / d + 4;
                        h = h * 60;
                        if (h < 0) h += 360;
                    }
                    const s_v = max === 0 ? 0 : d / max;
                    return { label, color: cs.backgroundColor, hue: Math.round(h), saturation: Math.round(s_v * 100), lightness: Math.round(l * 100) };
                });
            });
            await log("  - Recent 7 Days legend swatches (with HSL for perceptual check):");
            legend.forEach(l => {
                log(`      ${l.label.padEnd(20)} ${l.color}  HSL(${l.hue}°, ${l.saturation}%, ${l.lightness}%)`);
            });
            // Perceptual distinguishability check: any two swatches with hue-delta < 25 AND similar saturation are perceptually close
            const warn = [];
            for (let i = 0; i < legend.length; i++) {
                for (let j = i + 1; j < legend.length; j++) {
                    const a = legend[i], b = legend[j];
                    if (typeof a.hue !== "number" || typeof b.hue !== "number") continue;
                    const dh = Math.min(Math.abs(a.hue - b.hue), 360 - Math.abs(a.hue - b.hue));
                    if (dh < 25 && Math.abs(a.lightness - b.lightness) < 25) {
                        warn.push(`PERCEPTUAL COLLISION: ${a.label} (HSL ${a.hue},${a.saturation},${a.lightness}) vs ${b.label} (HSL ${b.hue},${b.saturation},${b.lightness}) — hue delta=${dh}°`);
                    }
                }
            }
            if (warn.length) {
                await log("\n  ⚠ PERCEPTUAL COLOR ISSUES:");
                for (const w of warn) await log("      " + w);
            } else {
                await log("  ✓ No perceptual collisions detected");
            }
        }
    }

    // Inspect the cron banner area
    await log("\n**Step 3 — Cron banner inspection.**");
    const cronBannerText = await page.locator('[data-fq="cron-install-status"]').innerText().catch(() => null);
    if (cronBannerText) {
        await log(`  Cron banner inner text (first 300 chars): ${JSON.stringify(cronBannerText.slice(0, 300))}`);
        if (/requires install|need.*action/i.test(cronBannerText) && !/newly installed/i.test(cronBannerText)) {
            await log("  ⚠ Cron banner still shows action-needed language");
        } else if (/newly installed/i.test(cronBannerText)) {
            await log("  ✓ Cron banner shows benign newly-installed language");
        } else if (/all.*cron.*firing/i.test(cronBannerText)) {
            await log("  ✓ Cron banner shows all-firing");
        } else {
            await log("  ? Cron banner text uncategorized");
        }
    }

    // Click nav links to verify cross-page navigation
    await log("\n**Step 4 — Cross-page navigation.**");
    for (const linkText of ["Activity", "Discussion Bubbles", "Proposals", "Amendments", "Escalations", "Main Flows"]) {
        try {
            await page.goto(pathToFileURL(resolve(REPORTS_DIR, "dashboard.html")).toString(), { waitUntil: "load" });
            await page.waitForTimeout(500);
            const navLink = page.locator(`.pb-page-nav-links a:has-text("${linkText}")`);
            if (await navLink.count() === 0) {
                await log(`  ✗ Nav link "${linkText}" not found in nav`);
                continue;
            }
            const href = await navLink.first().getAttribute("href");
            await navLink.first().click();
            await page.waitForTimeout(800);
            const newUrl = page.url();
            const ok = newUrl.includes(href.replace("./", "").replace("../", ""));
            await log(`  ${ok ? "✓" : "✗"} Click "${linkText}" → ${href} → page URL contains href? ${ok}`);
        } catch (e) {
            await log(`  ✗ Click "${linkText}" threw: ${e.message}`);
        }
    }
}

async function auditMainFlows(page) {
    await log("\n## /main-flows.html — User journey\n");
    await page.goto(pathToFileURL(resolve(REPORTS_DIR, "main-flows.html")).toString(), { waitUntil: "load" });
    await page.waitForTimeout(2000);
    let p = await shot(page, "main-flows", "01-opened");
    await log(`**Step 1 — Opened main-flows.html.** Screenshot: \`${p}\``);

    // Scroll the rail using mouse wheel (hover over rail, then wheel scroll)
    await log("\n**Step 2 — Scrolled rail using mouse wheel (hover over rail, wheel × 10 × 200px).**");
    const railBox = await page.locator(".mf-flows-list").boundingBox();
    if (!railBox) {
        await log("  ✗ .mf-flows-list bounding box null — rail not laid out");
    } else {
        await log(`  Rail bbox: top=${Math.round(railBox.y)} bottom=${Math.round(railBox.y + railBox.height)} viewport h=${page.viewportSize().height}`);
        // Move mouse over the rail center
        await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2);
        for (let i = 0; i < 10; i++) {
            await page.mouse.wheel(0, 200);
            await page.waitForTimeout(120);
        }
        p = await shot(page, "main-flows", "02-rail-after-wheel-scroll");
        await log(`  Screenshot after wheel scroll: \`${p}\``);

        // Check whether F62 is in viewport NOW (after user-style scroll)
        const f62Rect = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll(".mf-flows-list .mf-flows-item"));
            const last = items[items.length - 1];
            if (!last) return null;
            const r = last.getBoundingClientRect();
            return {
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                height: Math.round(r.height),
                text: (last.textContent || "").trim().slice(0, 50),
                inViewport: r.top < window.innerHeight && r.bottom > 0,
            };
        });
        if (f62Rect) {
            await log(`  Last rail item (F62): rect.top=${f62Rect.top} rect.bottom=${f62Rect.bottom} viewport h=${page.viewportSize().height}`);
            await log(`  Last item text: ${JSON.stringify(f62Rect.text)}`);
            await log(`  Last item in viewport (after wheel scroll): ${f62Rect.inViewport ? "✓ YES" : "✗ NO"}`);
        }
    }

    // Click F1 to test flow selection
    await log("\n**Step 3 — Clicked F1 in rail.**");
    const f1 = page.locator(".mf-flows-list .mf-flows-item").first();
    if (await f1.count() > 0) {
        await f1.scrollIntoViewIfNeeded();
        await f1.click();
        await page.waitForTimeout(800);
        p = await shot(page, "main-flows", "03-f1-clicked");
        await log(`  Screenshot after F1 click: \`${p}\``);

        // Verify path highlighted + steps panel populated
        const hasSelection = await page.evaluate(() => {
            const grid = document.querySelector(".mf-grid");
            const stepsList = document.querySelector(".mf-steps-list");
            return {
                gridHasSelection: grid?.classList.contains("has-selection") || false,
                stepsListHidden: stepsList?.hasAttribute("hidden") || false,
                stepsCount: stepsList ? stepsList.children.length : 0,
            };
        });
        await log(`  After F1 click: gridHasSelection=${hasSelection.gridHasSelection} stepsHidden=${hasSelection.stepsListHidden} stepsCount=${hasSelection.stepsCount}`);
        await log(`  ${hasSelection.gridHasSelection && hasSelection.stepsCount > 0 ? "✓" : "✗"} Flow selection works`);
    } else {
        await log("  ✗ No items in rail to click");
    }
}

async function auditAmendments(page) {
    await log("\n## /amendments.html — User journey\n");
    await page.goto(pathToFileURL(resolve(REPORTS_DIR, "amendments.html")).toString(), { waitUntil: "load" });
    await page.waitForTimeout(2000);
    let p = await shot(page, "amendments", "01-opened");
    await log(`**Step 1 — Opened amendments.html.** Screenshot: \`${p}\``);

    // Look for pending amendments
    const pendingCount = await page.locator('[data-fq="amendments-pending"], #amd-pending-count').innerText().catch(() => null);
    await log(`  Pending amendments count text: ${JSON.stringify(pendingCount)}`);

    // Expand any <details> elements so archive content is visible
    await log("\n**Step 2 — Expanded <details> archive sections.**");
    await page.evaluate(() => {
        document.querySelectorAll("details").forEach(d => { d.open = true; });
    });
    await page.waitForTimeout(500);

    // Scroll until bottom. Move mouse to viewport-center first — page.mouse.wheel
    // requires a mouse position over a scrollable region. Default position (0,0)
    // or wherever the previous interaction left it can be over fixed nav / overlay
    // / out-of-bounds, in which case wheel events don't reach the document scroller.
    await log("\n**Step 3 — Scrolled until at page bottom (wheel + scrollY-monitoring loop, mouse over viewport center).**");
    const vp = page.viewportSize();
    await page.mouse.move(vp.width / 2, vp.height / 2);
    let lastScrollY = -1;
    let plateauCount = 0;
    let wheelCount = 0;
    const MAX_WHEELS = 60;
    while (wheelCount < MAX_WHEELS) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(120);
        wheelCount++;
        const sy = await page.evaluate(() => window.scrollY);
        if (sy === lastScrollY) {
            plateauCount++;
            // Two consecutive plateaus = at-bottom (one plateau could be a
            // single missed scroll event)
            if (plateauCount >= 2) {
                await log(`  At-bottom reached after ${wheelCount} wheel events (scrollY plateau at ${sy} for 2 ticks).`);
                break;
            }
        } else {
            plateauCount = 0;
        }
        lastScrollY = sy;
    }
    if (wheelCount >= MAX_WHEELS) {
        await log(`  Max-wheel cap (${MAX_WHEELS}) reached at scrollY=${lastScrollY} — page may be exceptionally long`);
    }
    p = await shot(page, "amendments", "02-scrolled-to-bottom");
    await log(`  Screenshot after scroll: \`${p}\``);

    const lastApplied = await page.locator('#applied-list > *:last-child').first();
    if (await lastApplied.count() > 0) {
        const rect = await lastApplied.evaluate(el => {
            const r = el.getBoundingClientRect();
            return { top: Math.round(r.top), bottom: Math.round(r.bottom), text: (el.textContent || "").trim().slice(0, 80) };
        });
        await log(`  Last applied amendment rect: top=${rect.top} bottom=${rect.bottom} viewport h=${page.viewportSize().height}`);
        await log(`  Last applied text: ${JSON.stringify(rect.text)}`);
        const inView = rect.top < page.viewportSize().height && rect.bottom > 0;
        await log(`  ${inView ? "✓" : "✗"} Last applied amendment visible after scroll`);
    }
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(TRANSCRIPT_PATH, `# User-journey audit transcript\n\nStarted: ${new Date().toISOString()}\nViewport: 1920x1080\nMode: ${process.env.PLAYWRIGHT_HEADLESS === "1" ? "headless" : "headed channel:chrome"}\n`, "utf-8");

    const forcedHeadless = process.env.PLAYWRIGHT_HEADLESS === "1";
    const browser = await chromium.launch({
        channel: forcedHeadless ? undefined : "chrome",
        headless: forcedHeadless,
    }).catch(async () => chromium.launch({ headless: forcedHeadless }));

    const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });
    const page = await ctx.newPage();

    try {
        await auditDashboard(page);
    } catch (e) { await log(`\n## dashboard audit threw: ${e.message}\n`); }
    try {
        await auditMainFlows(page);
    } catch (e) { await log(`\n## main-flows audit threw: ${e.message}\n`); }
    try {
        await auditAmendments(page);
    } catch (e) { await log(`\n## amendments audit threw: ${e.message}\n`); }

    await log(`\n---\nFinished: ${new Date().toISOString()}\nOutput dir: ${OUT_DIR}`);
    await browser.close();
}

main().catch(err => { console.error(err); process.exit(2); });
