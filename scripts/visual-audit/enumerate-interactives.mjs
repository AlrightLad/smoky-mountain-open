#!/usr/bin/env node
/*
 * scripts/visual-audit/enumerate-interactives.mjs
 *
 * Enumerate every interactive element on a page. Per Founder addendum
 * 2026-05-14 "BUTTON COVERAGE IS MANDATORY": page audit ≠ button audit.
 * Visual inspection misses buttons that look correct but fail when
 * clicked. Every interactive element must be enumerated → clicked →
 * verified.
 *
 * Usage:
 *   node scripts/visual-audit/enumerate-interactives.mjs <page-name.html> [output-json-path]
 *
 * Output: JSON list of {selector, type, text, location} per element.
 */
import { chromium } from "playwright";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");

const pageArg = process.argv[2];
const outArg = process.argv[3];
if (!pageArg) {
    console.error("usage: enumerate-interactives.mjs <page-name.html> [output-json]");
    process.exit(2);
}

const pagePath = resolve(REPO, "docs", "reports", pageArg);
const outPath = outArg
    ? resolve(REPO, outArg)
    : resolve(REPO, ".claude", "state", "app-audit-2026-05-14", basename(pageArg, ".html") + "-interactives.json");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(pathToFileURL(pagePath).toString(), { waitUntil: "load" });
await page.waitForTimeout(2000);

// Enumerate every interactive element. Cast a wide net:
// - <button>
// - <a>
// - <input type=button|submit|reset|checkbox|radio>
// - elements with onclick
// - elements with role=button
// - elements with cursor:pointer
// - <details><summary> (collapsible)
// - <select>
const interactives = await page.evaluate(() => {
    const all = [];
    const seen = new WeakSet();

    function record(el, type) {
        if (seen.has(el)) return;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        // Skip elements that have zero size or are far off-screen (likely templates)
        if (rect.width === 0 && rect.height === 0 && rect.top > 5000) return;
        const cs = window.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        // Build a stable-ish selector
        let sel = el.tagName.toLowerCase();
        if (el.id) sel = `#${el.id}`;
        else if (el.className && typeof el.className === "string") {
            const cls = el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".");
            if (cls) sel = `${el.tagName.toLowerCase()}.${cls}`;
        }
        const dataFlowId = el.getAttribute("data-flow-id");
        if (dataFlowId) sel += `[data-flow-id="${dataFlowId}"]`;
        const dataActor = el.getAttribute("data-actor");
        if (dataActor !== null) sel += `[data-actor="${dataActor}"]`;
        const dataTier = el.getAttribute("data-tier");
        if (dataTier !== null) sel += `[data-tier="${dataTier}"]`;
        const dataAxis = el.getAttribute("data-axis");
        if (dataAxis !== null) sel += `[data-axis="${dataAxis}"]`;
        all.push({
            type,
            tag: el.tagName.toLowerCase(),
            selector_hint: sel,
            text: (el.innerText || el.textContent || el.value || el.title || el.getAttribute("aria-label") || "").trim().slice(0, 80),
            href: el.tagName === "A" ? el.getAttribute("href") : undefined,
            id: el.id || undefined,
            class: el.className || undefined,
            role: el.getAttribute("role") || undefined,
            location: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                w: Math.round(rect.width),
                h: Math.round(rect.height),
            },
        });
    }

    document.querySelectorAll("button").forEach(el => record(el, "button"));
    document.querySelectorAll("a").forEach(el => record(el, "link"));
    document.querySelectorAll('input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"]').forEach(el => record(el, "input"));
    document.querySelectorAll("[onclick]").forEach(el => record(el, "onclick"));
    document.querySelectorAll('[role="button"]').forEach(el => record(el, "role-button"));
    document.querySelectorAll("details > summary").forEach(el => record(el, "details-summary"));
    document.querySelectorAll("select").forEach(el => record(el, "select"));
    // cursor:pointer elements (excluding what we already caught)
    document.querySelectorAll("*").forEach(el => {
        const cs = window.getComputedStyle(el);
        if (cs.cursor === "pointer" && !["A", "BUTTON", "INPUT", "SUMMARY", "SELECT"].includes(el.tagName)) {
            record(el, "cursor-pointer");
        }
    });

    return all;
});

await mkdir(dirname(outPath), { recursive: true });
const payload = {
    page: pageArg,
    captured_at: new Date().toISOString(),
    viewport: { width: 1920, height: 1080 },
    total_interactives: interactives.length,
    by_type: interactives.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {}),
    elements: interactives,
};
await writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");
console.log(`${pageArg}: ${interactives.length} interactive elements enumerated`);
console.log("By type:", payload.by_type);
console.log(`Output: ${outPath}`);

await browser.close();
