#!/usr/bin/env node
/*
 * Plan F (AUTONOMOUS_FAILURE_RECOVERY): empirically verify whether the
 * X.com URL is reachable, and what its loaded DOM contains. WebFetch
 * returned HTTP 402; Playwright with a real browser context may reach
 * a partial render before any login gate triggers.
 *
 * Outputs:
 *   - response status + final URL after redirects
 *   - text content of the page (truncated)
 *   - any video / image elements detected
 *   - screenshot of whatever rendered (proof of empirical attempt)
 */
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "reference-frames");
const TARGET = "https://x.com/DaveJ/status/2053867258653339746";

(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await ctx.newPage();
    let response = null;
    try {
        response = await page.goto(TARGET, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
        console.error("[probe-x] navigation error:", e.message);
    }
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    const status = response ? response.status() : null;
    const title = await page.title().catch(() => null);
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 2000) : null);
    const videoCount = await page.evaluate(() => document.querySelectorAll("video").length);
    const imgCount = await page.evaluate(() => document.querySelectorAll("img").length);
    const articleHtml = await page.evaluate(() => {
        const article = document.querySelector("article");
        return article ? article.outerHTML.slice(0, 4000) : null;
    });
    const loginGate = await page.evaluate(() => {
        return /sign in|log in|enter your|to keep .* premium/i.test(document.body.innerText);
    });

    await page.screenshot({ path: resolve(OUT_DIR, "x-probe-attempt.png"), fullPage: false });

    const report = {
        target: TARGET,
        final_url: finalUrl,
        http_status: status,
        title,
        login_gate_detected: loginGate,
        video_count: videoCount,
        img_count: imgCount,
        body_text_preview: bodyText,
        article_html_preview: articleHtml,
        timestamp: new Date().toISOString(),
    };
    await writeFile(resolve(OUT_DIR, "x-probe-result.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
})();
