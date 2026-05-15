#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-janowiak-12-frames.mjs
 *
 * 12-frame capture of Dave Jeffery's ToDesktop architecture demo tweet
 * for dashboard-completion-spec-2026-05-15.md PHASE D.
 *
 * Tweet URL: https://x.com/DaveJ/status/2053867258653339746
 * Video duration: ~18.2s (per x-probe-media.json).
 *
 * 12 timestamps chosen as evenly-spaced sample of 18.2s:
 *   [0.5, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 12.0, 13.5, 15.0, 17.5]
 *
 * Output directory: .claude/state/main-flows-v2/janowiak-reference-frames/
 * Naming: frame-NN-tS.Ss.png  (e.g. frame-01-t0.5s.png, frame-12-t17.5s.png)
 *
 * Approach: re-use the proven Plan A approach that successfully captured
 * 7 frames on 2026-05-14 (capture-manifest.json). Same network intercept
 * pattern, same canvas drawImage extraction, same X.com SPA handling.
 *
 * Manifest output includes observed_state placeholder (null) per frame.
 * The driving agent fills observed_state AFTER capture via Read tool.
 */

import { chromium } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "janowiak-reference-frames");

const TWEET_URL = "https://x.com/DaveJ/status/2053867258653339746";

// 12 evenly-spaced timestamps across the 18.2s video.
const TIMESTAMPS = [0.5, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 12.0, 13.5, 15.0, 17.5];

function frameFilename(index, t) {
    const idx = String(index).padStart(2, "0");
    // e.g. 0.5 -> "0.5", 17.5 -> "17.5", 3 -> "3.0"
    const tStr = (Number.isInteger(t) ? t.toFixed(1) : t.toString());
    return `frame-${idx}-t${tStr}s.png`;
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });

    console.log(`[janowiak-12] target: ${TWEET_URL}`);
    console.log(`[janowiak-12] output: ${OUT_DIR}`);
    console.log(`[janowiak-12] capturing ${TIMESTAMPS.length} frames at: ${TIMESTAMPS.join(", ")}s`);

    const headless = process.env.PLAYWRIGHT_HEADLESS === "1";
    console.log(`[janowiak-12] headless: ${headless ? "yes" : "no (X.com video usually needs visible window)"}`);

    const browser = await chromium.launch({
        headless,
        args: ["--autoplay-policy=no-user-gesture-required"],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    const mediaResponses = [];
    page.on("response", async (res) => {
        const u = res.url();
        if (/video\.twimg\.com|pbs\.twimg\.com\/amplify_video/.test(u)) {
            mediaResponses.push({ url: u, status: res.status(), type: res.headers()["content-type"] || "" });
        }
    });

    const manifest = {
        captured_at: new Date().toISOString(),
        tweet_url: TWEET_URL,
        video_duration_seconds: 18.2,
        timestamps_requested: TIMESTAMPS,
        frames: [],
        media_responses: mediaResponses,
        errors: [],
    };

    try {
        console.log("[janowiak-12] navigating...");
        await page.goto(TWEET_URL, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(4500);

        const hasVideo = await page.locator("article video").first().count();
        if (hasVideo === 0) {
            manifest.errors.push({ phase: "locate-video", message: "no <video> element inside <article> after 4.5s wait" });
            throw new Error("video element not found");
        }

        console.log("[janowiak-12] video element located");

        // Get actual video duration once located
        const actualDuration = await page.evaluate(() => {
            const v = document.querySelector("article video");
            return v ? v.duration : null;
        });
        if (actualDuration && Number.isFinite(actualDuration)) {
            manifest.video_duration_seconds = actualDuration;
            console.log(`[janowiak-12] actual video duration: ${actualDuration}s`);
        }

        for (let i = 0; i < TIMESTAMPS.length; i++) {
            const t = TIMESTAMPS[i];
            const index = i + 1;
            const filename = frameFilename(index, t);
            const outPath = resolve(OUT_DIR, filename);
            console.log(`  capturing #${index} t=${t}s → ${filename}`);

            try {
                const result = await page.evaluate(async (target) => {
                    const v = document.querySelector("article video");
                    if (!v) return { ok: false, error: "no video element" };
                    v.pause();
                    v.muted = true;
                    v.currentTime = target;
                    await new Promise((resolveSeek) => {
                        const onSeeked = () => { v.removeEventListener("seeked", onSeeked); resolveSeek(); };
                        v.addEventListener("seeked", onSeeked, { once: true });
                        setTimeout(() => { v.removeEventListener("seeked", onSeeked); resolveSeek(); }, 2500);
                    });
                    const w = v.videoWidth || 1280;
                    const h = v.videoHeight || 720;
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(v, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL("image/png");
                    return { ok: true, dataUrl, width: w, height: h };
                }, t);

                if (!result.ok) {
                    manifest.errors.push({ phase: `frame-${index}`, message: result.error });
                    continue;
                }

                const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, "");
                await writeFile(outPath, Buffer.from(base64, "base64"));

                // Verify file size > 5KB
                const st = await stat(outPath);
                if (st.size < 5000) {
                    manifest.errors.push({ phase: `frame-${index}`, message: `file too small: ${st.size} bytes (need > 5000)` });
                }

                manifest.frames.push({
                    index,
                    timestamp: t,
                    filename,
                    path: `.claude/state/main-flows-v2/janowiak-reference-frames/${filename}`,
                    width: result.width,
                    height: result.height,
                    file_size_bytes: st.size,
                    observed_state: null,  // filled by agent after capture via Read tool
                });
            } catch (err) {
                manifest.errors.push({ phase: `frame-${index}`, message: err.message });
                console.error(`    FAIL: ${err.message}`);
            }
        }
    } catch (err) {
        manifest.errors.push({ phase: "main", message: err.message });
        console.error(`[janowiak-12] FAIL: ${err.message}`);
    } finally {
        await browser.close();
    }

    const manifestPath = resolve(OUT_DIR, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`[janowiak-12] manifest: ${manifestPath}`);

    if (manifest.errors.length > 0) {
        console.error(`[janowiak-12] ${manifest.errors.length} error(s); ${manifest.frames.length}/${TIMESTAMPS.length} frames captured.`);
        if (manifest.frames.length === 0) {
            process.exit(1);
        }
    }
    console.log(`[janowiak-12] OK: ${manifest.frames.length}/${TIMESTAMPS.length} frames captured.`);
}

main().catch(err => { console.error(err); process.exit(2); });
