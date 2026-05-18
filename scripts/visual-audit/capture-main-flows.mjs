#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-main-flows.mjs
 *
 * Targeted capture for docs/reports/main-flows.html. Founder diagnostic
 * 2026-05-14: sentinel counts proved the page renders SOMETHING; this
 * script proves whether the rendering matches the Janowiak ToDesktop
 * architecture-diagram pattern that is the reference target.
 *
 * Captures four screenshots into .claude/state/main-flows-v2/:
 *   1. current-render.png            — 1920x1080, default state, full page
 *   2. current-render-viewport.png   — 1920x1080, default state, viewport only (above-the-fold framing)
 *   3. current-render-flow-selected.png — 1920x1080, flow F1 clicked, full page (verifies SVG arrows + path highlight)
 *   4. current-render-arch-only.png  — 1920x1080, viewport clipped to architecture diagram section only
 *
 * Also writes capture-meta.json with DOM measurements:
 *   - mf-grid bounding box + computed grid-template-columns
 *   - mf-arrows SVG bounding box + arrow line count (paths drawn)
 *   - mf-flows-list bounding box + flow item count
 *   - mf-workspace grid-template-columns + actual rail position
 *   - section ordering verification (architecture section before flow rail)
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2");

const VIEWPORT = { width: 1920, height: 1080 };

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[capture-main-flows] viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);
    console.log(`[capture-main-flows] page: ${PAGE_PATH}`);
    console.log(`[capture-main-flows] out:  ${OUT_DIR}`);

    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        colorScheme: "dark",
    });
    const page = await ctx.newPage();
    const fileUrl = pathToFileURL(PAGE_PATH).toString();

    try {
        await page.goto(fileUrl, { waitUntil: "load", timeout: 20000 });
        // Renderers run on DOMContentLoaded. Give them a beat to populate
        // mf-grid + mf-flows-list + flow-rail before snapshotting.
        await page.waitForTimeout(600);

        // 1. Full-page default capture
        await page.screenshot({
            path: resolve(OUT_DIR, "current-render.png"),
            fullPage: true,
        });

        // 2. Viewport-only default capture (what fits above the fold at 1920x1080)
        await page.screenshot({
            path: resolve(OUT_DIR, "current-render-viewport.png"),
            fullPage: false,
        });

        // 3. Architecture-only crop: locate the mf-workspace and screenshot
        // just that element + its header so we isolate the reference target
        // from the secondary 62-flow catalog below.
        const archHeader = page.locator(".pb-section-title").first();
        const archWorkspace = page.locator(".mf-workspace");
        let archBox = null;
        if (await archWorkspace.count()) {
            await archWorkspace.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);
            archBox = await archWorkspace.boundingBox();
            // Extend up to include the section header
            if (await archHeader.count()) {
                const headerBox = await archHeader.boundingBox();
                if (headerBox && archBox) {
                    const top = Math.max(0, headerBox.y - 8);
                    const height = (archBox.y + archBox.height) - top + 16;
                    await page.screenshot({
                        path: resolve(OUT_DIR, "current-render-arch-only.png"),
                        clip: { x: 0, y: top, width: VIEWPORT.width, height: Math.min(height, 4000) },
                    });
                }
            }
        }

        // 4. Click first flow in the right rail (F1) to verify SVG arrows render
        const firstFlow = page.locator(".mf-flows-item").first();
        let flowSelected = false;
        if (await firstFlow.count()) {
            await firstFlow.click();
            // M5 path-draw animation: 220ms × 7-step stagger × 30ms = ~430ms +
            // badge fade-in 160ms with delay ~340ms = ~500ms. Wait 900ms total
            // to give the staggered animation room to settle before capture.
            await page.waitForTimeout(900);
            flowSelected = true;
            await page.screenshot({
                path: resolve(OUT_DIR, "current-render-flow-selected.png"),
                fullPage: true,
            });
        }

        // === DOM MEASUREMENTS ===
        const measurements = await page.evaluate(() => {
            const out = {};

            // Architecture grid metrics
            const grid = document.getElementById("mf-grid");
            if (grid) {
                const r = grid.getBoundingClientRect();
                const cs = getComputedStyle(grid);
                out.mf_grid = {
                    exists: true,
                    bbox: { x: r.x, y: r.y, width: r.width, height: r.height },
                    grid_template_columns: cs.gridTemplateColumns,
                    columns_count: grid.querySelectorAll(".mf-column").length,
                };
                // Per-column node counts
                out.mf_columns = Array.from(grid.querySelectorAll(".mf-column")).map((col) => ({
                    data_col: col.getAttribute("data-col"),
                    header: (col.querySelector(".mf-column-header") || {}).textContent || null,
                    node_count: col.querySelectorAll(".mf-node").length,
                }));
            } else {
                out.mf_grid = { exists: false };
            }

            // SVG arrows
            const svg = document.getElementById("mf-arrows");
            if (svg) {
                const r = svg.getBoundingClientRect();
                out.mf_arrows = {
                    exists: true,
                    bbox: { x: r.x, y: r.y, width: r.width, height: r.height },
                    line_count: svg.querySelectorAll(".mf-arrow-line, path").length,
                    head_count: svg.querySelectorAll(".mf-arrow-head").length,
                    badge_count: svg.querySelectorAll(".mf-arrow-badge-text").length,
                    children_total: svg.childNodes.length,
                };
            } else {
                out.mf_arrows = { exists: false };
            }

            // Right rail / flows list
            const list = document.getElementById("mf-flows-list");
            if (list) {
                const r = list.getBoundingClientRect();
                out.mf_flows_list = {
                    exists: true,
                    bbox: { x: r.x, y: r.y, width: r.width, height: r.height },
                    item_count: list.querySelectorAll(".mf-flows-item").length,
                };
            } else {
                out.mf_flows_list = { exists: false };
            }

            // Workspace layout
            const ws = document.querySelector(".mf-workspace");
            if (ws) {
                const r = ws.getBoundingClientRect();
                const cs = getComputedStyle(ws);
                out.mf_workspace = {
                    exists: true,
                    bbox: { x: r.x, y: r.y, width: r.width, height: r.height },
                    grid_template_columns: cs.gridTemplateColumns,
                    display: cs.display,
                };
            }

            // Steps panel state
            const stepsMeta = document.getElementById("mf-steps-meta");
            const stepsList = document.getElementById("mf-steps-list");
            out.mf_steps = {
                meta_text: stepsMeta ? stepsMeta.textContent : null,
                items_visible: stepsList && !stepsList.hidden,
                items_count: stepsList ? stepsList.querySelectorAll(".mf-steps-item").length : 0,
            };

            // Section ordering — architecture diagram must be visually before catalog
            const archSection = document.querySelector(".mf-workspace");
            const catalogSection = document.getElementById("flow-rail-section");
            if (archSection && catalogSection) {
                const ar = archSection.getBoundingClientRect();
                const cr = catalogSection.getBoundingClientRect();
                out.section_order = {
                    arch_top: ar.top + window.scrollY,
                    catalog_top: cr.top + window.scrollY,
                    arch_before_catalog: (ar.top + window.scrollY) < (cr.top + window.scrollY),
                };
            }

            // Flow rail catalog
            const railTotal = document.getElementById("rail-total-count");
            const railGroups = document.querySelectorAll(".rail-tier-group");
            out.flow_rail = {
                total_count_text: railTotal ? railTotal.textContent : null,
                tier_group_count: railGroups.length,
                card_count: document.querySelectorAll(".rail-card-row").length,
            };

            // Page dimensions
            out.page = {
                scroll_height: document.documentElement.scrollHeight,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
            };

            return out;
        });

        const meta = {
            captured_at: new Date().toISOString(),
            viewport: VIEWPORT,
            page_url: fileUrl,
            flow_selected_in_capture: flowSelected,
            measurements,
        };
        await writeFile(
            resolve(OUT_DIR, "capture-meta.json"),
            JSON.stringify(meta, null, 2),
            "utf8",
        );
        console.log("[capture-main-flows] wrote capture-meta.json");
        console.log(JSON.stringify(measurements, null, 2));
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
