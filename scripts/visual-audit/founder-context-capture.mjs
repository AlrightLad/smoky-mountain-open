#!/usr/bin/env node
/*
 * scripts/visual-audit/founder-context-capture.mjs
 *
 * Bridge agent-context (Playwright headless Chromium) and user-
 * context (Founder's actual browser, OS, scrollbar treatment, fonts).
 *
 * Authored 2026-05-14 after 9 iterations of main-flows.html shipped
 * "fixed" in agent context while Founder eyes caught regressions in
 * user context. Founder directive: a SINGLE command Founder runs
 * that captures pixels from Founder's actual rendering pipeline.
 *
 * Approach:
 *   - Launch Playwright via channel: "chrome" — uses Founder's
 *     INSTALLED Chrome binary, not Playwright's bundled Chromium.
 *     Same fonts, same scrollbar OS treatment, same rendering.
 *   - Headed mode (visible window) so Founder sees what's captured.
 *   - Scroll the rail to bottom + capture at three positions
 *     (top, middle, bottom) to surface scroll behavior + visual
 *     state.
 *   - Save to predictable paths the team picks up via downloads-
 *     watcher pattern.
 *   - Print clear "DONE" + file paths to the console.
 *
 * Usage (single command for Founder):
 *   node scripts/visual-audit/founder-context-capture.mjs
 *
 * Or for a specific page:
 *   node scripts/visual-audit/founder-context-capture.mjs <page-name.html>
 *
 * Output:
 *   .claude/state/main-flows-v2/founder-real-context/<timestamp>/
 *     - 00-page-top.png             (full page from top)
 *     - 01-rail-mid-scroll.png      (rail scrolled to F30 area)
 *     - 02-rail-bottom.png          (rail scrolled to F62 — the
 *                                    iter 7-8 reachability target)
 *     - 03-full-page-bottom.png     (full page scrolled to bottom)
 *     - capture-meta.json           (browser version, viewport,
 *                                    DPR, OS info, file checksums)
 *
 * Exit code 0 even on partial capture so Founder gets whatever
 * landed; the diff step downstream is permitted to fail loudly.
 */

import { chromium } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { platform, release, hostname } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const REPORTS_DIR = resolve(REPO_ROOT, "docs", "reports");

const pageArg = process.argv[2] || "main-flows.html";

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "founder-real-context", TIMESTAMP);

async function sha256(path) {
    const buf = await readFile(path);
    return createHash("sha256").update(buf).digest("hex");
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });

    const fileUrl = pathToFileURL(resolve(REPORTS_DIR, pageArg)).toString();
    console.log(`[founder-ctx] target: ${pageArg}`);
    console.log(`[founder-ctx] output: ${OUT_DIR.replace(REPO_ROOT + "\\", "").replace(REPO_ROOT + "/", "")}`);
    console.log(`[founder-ctx] launching headed Chrome (channel: chrome) — your real Chrome binary, not Playwright's bundled Chromium`);

    let browser, browserVersion = "unknown", launchMode = "channel:chrome";
    try {
        browser = await chromium.launch({
            channel: "chrome",
            headless: false,
            args: ["--start-maximized"],
        });
    } catch (err) {
        console.log(`[founder-ctx] channel:chrome unavailable (${err.message.split('\n')[0]}); falling back to Playwright Chromium headed`);
        launchMode = "playwright-chromium-headed";
        browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
    }
    try {
        browserVersion = await browser.version();
    } catch (_) {}

    const ctx = await browser.newContext({
        viewport: null, // use full window size
        deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    const meta = {
        captured_at: new Date().toISOString(),
        page: pageArg,
        launch_mode: launchMode,
        browser_version: browserVersion,
        os: { platform: platform(), release: release(), hostname: hostname() },
        viewport: null,
        captures: [],
    };

    try {
        await page.goto(fileUrl, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(2000); // JS render

        const vp = await page.evaluate(() => ({
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            userAgent: navigator.userAgent,
        }));
        meta.viewport = vp;

        const captureAt = async (name, action) => {
            if (action) await action();
            await page.waitForTimeout(400);
            const outPath = resolve(OUT_DIR, `${name}.png`);
            await page.screenshot({ path: outPath, fullPage: false });
            const s = await stat(outPath);
            const digest = await sha256(outPath);
            meta.captures.push({ name, file: `${name}.png`, size_bytes: s.size, sha256: digest });
            console.log(`  captured ${name}.png (${(s.size / 1024).toFixed(1)} KB)`);
        };

        await captureAt("00-page-top");
        await captureAt("01-rail-mid-scroll", async () => {
            // Scroll the .mf-flows-list to ~50% if it exists; otherwise no-op.
            await page.evaluate(() => {
                const c = document.querySelector(".mf-flows-list");
                if (c) c.scrollTop = c.scrollHeight * 0.5;
            });
        });
        await captureAt("02-rail-bottom", async () => {
            await page.evaluate(() => {
                const c = document.querySelector(".mf-flows-list");
                if (c) c.scrollTop = c.scrollHeight;
            });
        });
        await captureAt("03-full-page-bottom", async () => {
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
        });
    } catch (err) {
        console.error(`[founder-ctx] capture error: ${err.message}`);
        meta.error = err.message;
    }

    const metaPath = resolve(OUT_DIR, "capture-meta.json");
    await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
    console.log(`[founder-ctx] meta: capture-meta.json`);

    console.log(`\n[founder-ctx] DONE`);
    console.log(`  browser: ${browserVersion} (${launchMode})`);
    console.log(`  viewport: ${meta.viewport?.width}x${meta.viewport?.height} @ DPR=${meta.viewport?.devicePixelRatio}`);
    console.log(`  os: ${meta.os.platform} ${meta.os.release}`);
    console.log(`  captures: ${meta.captures.length}`);
    console.log(`  output: ${OUT_DIR}`);
    console.log(`\nNext step: paste the OUT_DIR path back to the agent, OR commit the directory.`);
    console.log(`Team picks up the screenshots via the downloads-watcher pattern when you commit + push.`);
    console.log(`If diagnosing the current bug: ${OUT_DIR}\\02-rail-bottom.png shows what your real Chrome renders.`);

    await browser.close();
}

main().catch(err => { console.error(err); process.exit(2); });
