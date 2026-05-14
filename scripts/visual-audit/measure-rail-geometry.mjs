#!/usr/bin/env node
// Quick measurement: where does the rail sit + how tall is it relative to viewport?
import { chromium } from "playwright";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const url = pathToFileURL(resolve(REPO, "docs/reports/main-flows.html")).toString();

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(1500);

const m = await page.evaluate(() => {
    const rail = document.querySelector(".mf-rail");
    const list = document.querySelector(".mf-flows-list");
    const railRect = rail?.getBoundingClientRect();
    const listRect = list?.getBoundingClientRect();
    const last = document.querySelector(".mf-flows-list .mf-flows-item:last-child");
    if (list) list.scrollTop = list.scrollHeight;
    const lastAfterScroll = last?.getBoundingClientRect();
    return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        rail: railRect ? { top: railRect.top, bottom: railRect.bottom, height: railRect.height } : null,
        list_at_top: listRect ? { top: listRect.top, bottom: listRect.bottom, height: listRect.height, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight } : null,
        last_item_after_scroll: lastAfterScroll ? { top: lastAfterScroll.top, bottom: lastAfterScroll.bottom, text: last.textContent.trim().slice(0, 50) } : null,
    };
});

console.log(JSON.stringify(m, null, 2));
await browser.close();
