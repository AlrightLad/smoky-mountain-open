#!/usr/bin/env node
/*
 * scripts/visual-audit/verify-main-flows.mjs
 *
 * Visual-layer assertion for docs/reports/main-flows.html. Loads the page
 * in a headless browser, renders at 1920x1080, then verifies:
 *
 *   1. Component count per column matches data block (not just non-empty)
 *   2. SVG arrow lines drawn = path-rich flows' max-step-count when a flow
 *      is selected (verifies arrows actually render — not just SVG exists)
 *   3. Architecture section height as proportion of total page height is
 *      within an acceptable range (catches the v1 visual failure mode where
 *      sentinels passed but the catalog dwarfed the diagram)
 *   4. Rail renders all 62 flows after Ship 3
 *   5. Filter chips actually filter (functional, not just present)
 *
 * Exits 0 on full pass, non-zero on any failure. Intended to run after
 * tests/round-trip-test.py (which covers static HTML/JSON sentinels) for
 * the layer Python can't reach.
 *
 * Founder diagnostic 2026-05-14: P5 (diagnostic-first) + P8 (visual-layer
 * smoke assertions). The prior failure mode — "sentinels pass but page is
 * wrong" — is exactly what this script is designed to catch.
 */

import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");

// Acceptable proportions, per Founder Q1C (2026-05-14):
// architecture section ≥ 22% of page (target ~30%, allow margin)
// catalog section ≤ 70% (target ~50%, allow margin while preventing regression to 78%)
const ARCH_MIN_RATIO = 0.22;
const CATALOG_MAX_RATIO = 0.70;

function fail(label, msg) {
    console.error(`  ✗ ${label}  ${msg}`);
    return false;
}
function pass(label, msg) {
    console.log(`  ✓ ${label}  ${msg}`);
    return true;
}

(async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(600);

    // Auto-select F1 to verify arrow rendering
    await page.locator(".mf-flows-item").first().click();
    await page.waitForTimeout(400);

    const M = await page.evaluate(() => {
        const out = { errors: [] };
        // Data-block ground truth
        try {
            const raw = document.getElementById("report-data").textContent;
            const data = JSON.parse(raw);
            out.expected = {
                column_counts: (data.columns || []).map((c) => ({
                    id: c.id,
                    label: c.label,
                    count: (c.components || []).length,
                })),
                total_components: (data.columns || []).reduce((s, c) => s + (c.components || []).length, 0),
                f1_step_count: ((data.flows || []).find((f) => f.id === "F1") || {}).steps?.length || 0,
                flow_rail_count: (data.flow_rail || []).length,
            };
        } catch (e) {
            out.errors.push("data-block parse: " + e.message);
        }

        // Rendered grid metrics
        const cols = Array.from(document.querySelectorAll(".mf-column"));
        out.rendered_columns = cols.map((c) => ({
            id: c.getAttribute("data-col"),
            count: c.querySelectorAll(".mf-node").length,
        }));

        // SVG arrows
        const arrows = document.getElementById("mf-arrows");
        out.arrow_line_count = arrows ? arrows.querySelectorAll(".mf-arrow-line").length : -1;
        out.arrow_badge_count = arrows ? arrows.querySelectorAll(".mf-arrow-badge-bg").length : -1;

        // Section heights
        const workspace = document.querySelector(".mf-workspace");
        const catalog = document.getElementById("flow-rail-section");
        const totalH = document.documentElement.scrollHeight;
        out.heights = {
            total: totalH,
            workspace: workspace ? workspace.getBoundingClientRect().height : -1,
            catalog: catalog ? catalog.getBoundingClientRect().height : -1,
            arch_section_inclusive: catalog && workspace
                ? (catalog.getBoundingClientRect().top + window.scrollY) - (workspace.getBoundingClientRect().top + window.scrollY - 80)
                : -1,
        };

        // Rail rendering
        const railItems = document.querySelectorAll("#mf-flows-list .mf-flows-item");
        out.rail_item_count = railItems.length;
        out.rail_has_path_count = document.querySelectorAll("#mf-flows-list .mf-flows-item.has-path").length;

        // Filter chips presence
        out.rail_search_present = !!document.getElementById("mf-rail-search");
        out.rail_actor_chips = document.querySelectorAll('.mf-rail-chips[data-axis="actor"] .mf-rail-chip').length;
        out.rail_tier_chips = document.querySelectorAll('.mf-rail-chips[data-axis="tier"] .mf-rail-chip').length;

        return out;
    });

    let ok = true;

    if (M.errors && M.errors.length) {
        for (const e of M.errors) ok = fail("data-block", e) && ok;
    }

    // 1. Component count per column
    if (M.expected && M.expected.column_counts) {
        for (const expected of M.expected.column_counts) {
            const rendered = M.rendered_columns.find((c) => c.id === expected.id);
            if (!rendered) {
                ok = fail("col-render", `column ${expected.id} not rendered`) && false;
                continue;
            }
            if (rendered.count !== expected.count) {
                ok = fail(`col-${expected.id}`, `expected ${expected.count}, rendered ${rendered.count}`) && false;
            } else {
                pass(`col-${expected.id}`, `${rendered.count} components rendered`);
            }
        }
    }

    // 2. SVG arrows
    const f1Steps = (M.expected && M.expected.f1_step_count) || 0;
    if (M.arrow_line_count !== f1Steps) {
        ok = fail("svg-arrows", `F1 has ${f1Steps} steps but ${M.arrow_line_count} arrow lines rendered`) && false;
    } else {
        pass("svg-arrows", `${M.arrow_line_count} arrow lines + ${M.arrow_badge_count} badges (F1 has ${f1Steps} steps)`);
    }

    // 3. Page proportions
    const total = M.heights.total;
    const archSection = M.heights.arch_section_inclusive;
    const catalog = M.heights.catalog;
    const archRatio = archSection / total;
    const catalogRatio = catalog / total;

    if (archRatio < ARCH_MIN_RATIO) {
        ok = fail("arch-proportion", `architecture section is ${(archRatio * 100).toFixed(1)}% of page — must be ≥ ${(ARCH_MIN_RATIO * 100).toFixed(0)}%`) && false;
    } else {
        pass("arch-proportion", `architecture section ${(archRatio * 100).toFixed(1)}% of page (≥ ${(ARCH_MIN_RATIO * 100).toFixed(0)}%)`);
    }
    if (catalogRatio > CATALOG_MAX_RATIO) {
        ok = fail("catalog-proportion", `catalog section is ${(catalogRatio * 100).toFixed(1)}% of page — must be ≤ ${(CATALOG_MAX_RATIO * 100).toFixed(0)}%`) && false;
    } else {
        pass("catalog-proportion", `catalog section ${(catalogRatio * 100).toFixed(1)}% of page (≤ ${(CATALOG_MAX_RATIO * 100).toFixed(0)}%)`);
    }

    // 4. Rail count = flow_rail count
    const expectedRail = (M.expected && M.expected.flow_rail_count) || 0;
    if (M.rail_item_count !== expectedRail) {
        ok = fail("rail-count", `expected ${expectedRail} rail items, rendered ${M.rail_item_count}`) && false;
    } else {
        pass("rail-count", `${M.rail_item_count} flows in rail (${M.rail_has_path_count} have step paths)`);
    }

    // 5. Filter chips present + non-trivial
    if (!M.rail_search_present) ok = fail("rail-search", "search input missing") && false;
    else pass("rail-search", "search input present");
    if (M.rail_actor_chips < 3) ok = fail("rail-actor-chips", `expected ≥ 3 actor chips, found ${M.rail_actor_chips}`) && false;
    else pass("rail-actor-chips", `${M.rail_actor_chips} actor filter chips`);
    if (M.rail_tier_chips < 3) ok = fail("rail-tier-chips", `expected ≥ 3 tier chips, found ${M.rail_tier_chips}`) && false;
    else pass("rail-tier-chips", `${M.rail_tier_chips} tier filter chips`);

    // 6. Functional: applying tier=core filters rail
    const filterTest = await page.evaluate(() => {
        const chip = document.querySelector('.mf-rail-chips[data-axis="tier"] .mf-rail-chip[data-tier="core"]');
        if (!chip) return { ok: false, reason: "no core chip" };
        chip.click();
        // Trigger same event the click handler binds to; click also fires the handler.
        const visible = document.querySelectorAll("#mf-flows-list .mf-flows-item:not(.is-hidden)").length;
        const total = document.querySelectorAll("#mf-flows-list .mf-flows-item").length;
        return { ok: true, visible, total };
    });
    if (!filterTest.ok) {
        ok = fail("rail-filter-functional", filterTest.reason) && false;
    } else if (filterTest.visible >= filterTest.total) {
        ok = fail("rail-filter-functional", `tier=core didn't reduce visible count: ${filterTest.visible}/${filterTest.total}`) && false;
    } else {
        pass("rail-filter-functional", `tier=core reduced rail to ${filterTest.visible}/${filterTest.total}`);
    }

    await browser.close();

    if (!ok) {
        console.error("\nverify-main-flows: FAIL\n");
        process.exit(1);
    }
    console.log("\nverify-main-flows: PASS\n");
})();
