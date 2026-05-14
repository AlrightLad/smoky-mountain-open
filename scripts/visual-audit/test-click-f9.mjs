#!/usr/bin/env node
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");
const OUT = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "current-render-F9-selected.png");

(async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load" });
    await page.waitForTimeout(600);

    // Click F9 (Mobile onboarding) — metadata-only
    const f9 = page.locator('[data-flow-id="F9"]');
    if (!(await f9.count())) { console.error("F9 not found"); process.exit(1); }
    await f9.scrollIntoViewIfNeeded();
    await f9.click();
    await page.waitForTimeout(400);

    const state = await page.evaluate(() => {
        const steps = document.getElementById('mf-steps-list');
        const empty = document.getElementById('mf-steps-empty');
        const meta = document.getElementById('mf-steps-meta');
        const arrows = document.getElementById('mf-arrows');
        const grid = document.getElementById('mf-grid');
        return {
            steps_hidden: steps && steps.hidden,
            empty_hidden: empty && empty.hidden,
            empty_text_start: empty ? empty.textContent.slice(0, 120) : null,
            meta_text: meta ? meta.textContent : null,
            grid_has_selection: grid ? grid.classList.contains('has-selection') : null,
            arrow_path_count: arrows ? arrows.querySelectorAll('.mf-arrow-line').length : null,
            active_id: (document.querySelector('.mf-flows-item.is-active') || {}).getAttribute && document.querySelector('.mf-flows-item.is-active').getAttribute('data-flow-id'),
        };
    });
    console.log("F9 selected state:", JSON.stringify(state, null, 2));

    const arch = page.locator(".mf-workspace");
    const wsBox = await arch.boundingBox();
    await page.screenshot({
        path: OUT,
        clip: { x: 0, y: 300, width: 1920, height: Math.min(wsBox.height + 200, 1080) },
    });
    await browser.close();
})();
