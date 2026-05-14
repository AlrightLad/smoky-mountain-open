#!/usr/bin/env node
/*
 * Plan F extension: extract the video's poster image (first frame) from
 * the embedded media on the X.com tweet page. X serves video posters even
 * to unauthenticated viewers via pbs.twimg.com URLs; if we can grab one
 * we have the first reference frame.
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
        viewport: { width: 1440, height: 2400 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await ctx.newPage();

    // Capture all responses for image/video media URLs
    const mediaUrls = [];
    page.on("response", (r) => {
        const u = r.url();
        if (/pbs\.twimg\.com|video\.twimg\.com|t\.co/i.test(u)) {
            mediaUrls.push({ url: u, status: r.status(), type: r.headers()["content-type"] || null });
        }
    });

    try {
        await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
        console.error("[probe-x-media] nav:", e.message);
    }
    await page.waitForTimeout(5000);

    // Dismiss any modals
    try { await page.keyboard.press("Escape"); } catch (e) { /* ignore */ }
    await page.waitForTimeout(500);

    const articleInfo = await page.evaluate(() => {
        const out = { posters: [], videos: [], imgs_in_tweet: [], og_image: null, twitter_image: null };
        const og = document.querySelector('meta[property="og:image"]');
        if (og) out.og_image = og.getAttribute("content");
        const tw = document.querySelector('meta[name="twitter:image"]');
        if (tw) out.twitter_image = tw.getAttribute("content");

        const article = document.querySelector("article");
        if (article) {
            article.querySelectorAll("video").forEach((v) => {
                out.videos.push({
                    src: v.currentSrc || v.src || null,
                    poster: v.poster || null,
                    duration: isFinite(v.duration) ? v.duration : null,
                });
            });
            // Background-image based poster (X uses this pattern)
            article.querySelectorAll("*").forEach((el) => {
                const bg = getComputedStyle(el).backgroundImage;
                if (bg && bg !== "none" && /twimg\.com.*\.(jpg|png|webp)/i.test(bg)) {
                    const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
                    if (m && !out.posters.includes(m[1])) out.posters.push(m[1]);
                }
            });
            article.querySelectorAll("img").forEach((img) => {
                if (/twimg\.com/i.test(img.src) && !/profile_image/i.test(img.src)) {
                    out.imgs_in_tweet.push(img.src);
                }
            });
        }
        return out;
    });

    // Screenshot the article element specifically
    const article = page.locator("article").first();
    let articlePath = null;
    if (await article.count()) {
        try {
            articlePath = resolve(OUT_DIR, "x-tweet-article.png");
            await article.screenshot({ path: articlePath });
        } catch (e) {
            console.error("[probe-x-media] article screenshot:", e.message);
        }
    }

    const report = {
        target: TARGET,
        article_info: articleInfo,
        all_media_responses: mediaUrls,
        article_screenshot: articlePath,
        timestamp: new Date().toISOString(),
    };
    await writeFile(resolve(OUT_DIR, "x-probe-media.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
})();
