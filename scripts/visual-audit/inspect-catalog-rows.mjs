#!/usr/bin/env node
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");

(async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load" });
    await page.waitForTimeout(800);
    const data = await page.evaluate(() => {
        const row = document.querySelector("#flow-rail-section .rail-card-row");
        if (!row) return { error: "no row" };
        const id = row.querySelector(".rail-id");
        const name = row.querySelector(".rail-name");
        const goal = row.querySelector(".rail-goal");
        const actor = row.querySelector(".rail-actor-badge");
        const status = row.querySelector(".rail-status-chip");
        const dim = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return { tag: el.tagName, h: r.height, w: r.width, display: cs.display, lineHeight: cs.lineHeight, fontSize: cs.fontSize, padding: cs.padding, margin: cs.margin, height: cs.height, minHeight: cs.minHeight };
        };
        return {
            row: dim(row),
            id: dim(id),
            name: dim(name),
            goal: dim(goal),
            actor: dim(actor),
            status: dim(status),
        };
    });
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
})();
