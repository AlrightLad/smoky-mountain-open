#!/usr/bin/env node
/*
 * scripts/visual-audit/click-every-interactive.mjs
 *
 * Click every interactive element on a page per Founder addendum
 * 2026-05-14 "BUTTON COVERAGE IS MANDATORY". Reads an enumeration
 * JSON produced by enumerate-interactives.mjs and clicks each element
 * via Playwright, capturing before/after state per click.
 *
 * Usage:
 *   node scripts/visual-audit/click-every-interactive.mjs <page-name.html>
 *
 * Output: JSON list of click results at
 * .claude/state/app-audit-2026-05-14/<page>-click-results.json
 *
 * Exit code: 0 if all clicks register without error; non-zero if any
 * click throws.
 */
import { chromium } from "playwright";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");

const pageArg = process.argv[2];
if (!pageArg) {
    console.error("usage: click-every-interactive.mjs <page-name.html>");
    process.exit(2);
}

const pagePath = resolve(REPO, "docs", "reports", pageArg);
const enumPath = resolve(REPO, ".claude", "state", "app-audit-2026-05-14", basename(pageArg, ".html") + "-interactives.json");
const outPath = resolve(REPO, ".claude", "state", "app-audit-2026-05-14", basename(pageArg, ".html") + "-click-results.json");

const enumDoc = JSON.parse(await readFile(enumPath, "utf-8"));
console.log(`Clicking ${enumDoc.total_interactives} elements on ${pageArg}...`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const fileUrl = pathToFileURL(pagePath).toString();
await page.goto(fileUrl, { waitUntil: "load" });
await page.waitForTimeout(2000);

const results = [];
const jsErrors = [];
page.on("pageerror", err => { jsErrors.push({ at: new Date().toISOString(), message: err.message }); });
page.on("console", msg => {
    if (msg.type() === "error") {
        jsErrors.push({ at: new Date().toISOString(), source: "console", text: msg.text() });
    }
});

let clicked = 0, errored = 0, navigated = 0;

for (const el of enumDoc.elements) {
    // Skip <a> links that navigate away — we'd lose context. Record as "would navigate".
    if (el.tag === "a" && el.href && !el.href.startsWith("#") && !el.href.startsWith("javascript:")) {
        results.push({
            selector_hint: el.selector_hint,
            text: el.text,
            type: el.type,
            outcome: "skipped-navigation",
            href: el.href,
            note: "anchor with non-fragment href; clicking would navigate away from page under test",
        });
        navigated++;
        continue;
    }

    let elementHandle = null;
    try {
        // Try the selector hint; fallback to coordinate-based click
        if (el.id) {
            elementHandle = await page.locator(`#${el.id}`).first();
        } else if (el.selector_hint) {
            elementHandle = await page.locator(el.selector_hint).first();
        }
        const count = await elementHandle.count();
        if (count === 0) {
            results.push({ selector_hint: el.selector_hint, text: el.text, type: el.type, outcome: "selector-not-found" });
            errored++;
            continue;
        }
        // Get before-state hash (innerHTML length of body — coarse change signal)
        const beforeLen = await page.evaluate(() => document.body.innerHTML.length);

        // Click. force:true so we click hidden/off-screen elements too
        await elementHandle.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
        await elementHandle.click({ timeout: 1500, force: false }).catch(err => { throw err; });
        await page.waitForTimeout(150);

        const afterLen = await page.evaluate(() => document.body.innerHTML.length);
        const changed = afterLen !== beforeLen;

        results.push({
            selector_hint: el.selector_hint,
            text: el.text,
            type: el.type,
            outcome: "clicked",
            state_changed: changed,
            before_dom_size: beforeLen,
            after_dom_size: afterLen,
        });
        clicked++;
    } catch (err) {
        results.push({
            selector_hint: el.selector_hint,
            text: el.text,
            type: el.type,
            outcome: "error",
            error: err.message.split("\n")[0].slice(0, 200),
        });
        errored++;
    }
}

const payload = {
    page: pageArg,
    captured_at: new Date().toISOString(),
    enumeration_source: enumPath.replace(REPO + "\\", "").replace(REPO + "/", ""),
    summary: {
        total_attempted: enumDoc.elements.length,
        clicked,
        navigated_skipped: navigated,
        errored,
        js_errors_emitted: jsErrors.length,
    },
    js_errors: jsErrors,
    results,
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");

console.log(`\n${pageArg} click coverage:`);
console.log(`  Clicked: ${clicked}`);
console.log(`  Navigation-skip (anchors): ${navigated}`);
console.log(`  Errored: ${errored}`);
console.log(`  JS errors emitted: ${jsErrors.length}`);
console.log(`  Output: ${outPath}`);

await browser.close();
process.exit(errored > 0 || jsErrors.length > 0 ? 1 : 0);
