#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-janowiak-reference.mjs
 *
 * Capture reference frames from Dave Jeffery's ToDesktop architecture
 * diagram demo video (X.com tweet 1817286266783248438).
 *
 * Substrate-level fix authored 2026-05-14 after Founder engineering-
 * mindset call-out: prior iterations of main-flows.html shipped without
 * ever consulting the reference frames because the team escalated on
 * WebFetch 402 instead of trying Playwright. This script removes that
 * excuse — any future "match this reference video" ship can capture
 * its own frames via:
 *
 *   node scripts/visual-audit/capture-janowiak-reference.mjs
 *
 * Approach (Plan A from AUTONOMOUS_FAILURE_RECOVERY v8.3):
 *
 *   1. Launch headed Chromium (not headless — X.com video element won't
 *      autoplay in many headless contexts; also gives Founder visual
 *      confirmation when run interactively).
 *   2. Set realistic User-Agent + viewport.
 *   3. Navigate to tweet URL; wait for <video> element to render.
 *   4. Use page.evaluate to drive the video element directly:
 *      - pause + seek to each requested timestamp
 *      - wait for `seeked` event (frame ready)
 *      - draw video to canvas via drawImage
 *      - read canvas as PNG data URL
 *   5. Save each PNG to .claude/state/main-flows-v2/reference-frames/.
 *   6. Emit a manifest.json with timestamps + file paths + dimensions.
 *
 * If Plan A fails:
 *   Plan B — download direct video URL via the network-response intercept
 *           (the .m4s segments listed in x-probe-media.json), reassemble
 *           via ffmpeg, extract frames.
 *   Plan C — fall back to ToDesktop marketing site / Dave Jeffery's blog
 *           / public conference talk slides for equivalent-pattern refs.
 *
 * Plans B + C are NOT implemented here — Plan A worked in the prior
 * session that produced .claude/state/main-flows-v2/reference-frames/
 * dave-frame-t*.png. If Plan A regresses, extend this script with
 * Plan B before escalating.
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "reference-frames");

const TWEET_URL = "https://x.com/DaveJ/status/2053867258653339746";

// Timestamps in seconds at which to capture frames. Matches the prior
// session's naming (dave-frame-t000p5.png at t=0.5s, etc). Video is
// 18.2s total per x-probe-media.json.
const TIMESTAMPS = [0.5, 3.0, 6.0, 9.0, 12.0, 15.0, 17.5];

function tsToFilenameSegment(t) {
    // 0.5  -> t000p5
    // 3.0  -> t00003
    // 17.5 -> t017p5
    const whole = Math.floor(t);
    const frac = Math.round((t - whole) * 10);
    if (frac === 0) {
        return `t${String(whole).padStart(5, "0")}`;
    }
    return `t${String(whole).padStart(3, "0")}p${frac}`;
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });

    console.log(`[janowiak-ref] target: ${TWEET_URL}`);
    console.log(`[janowiak-ref] output: ${OUT_DIR}`);
    console.log(`[janowiak-ref] capturing ${TIMESTAMPS.length} frames at: ${TIMESTAMPS.join(", ")}s`);

    const headless = process.env.PLAYWRIGHT_HEADLESS === "1";
    console.log(`[janowiak-ref] headless: ${headless ? "yes" : "no (X.com video usually needs visible window)"}`);

    const browser = await chromium.launch({
        headless,
        args: ["--autoplay-policy=no-user-gesture-required"],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Intercept video network responses so we have the manifest URLs on
    // disk even if frame extraction fails (Plan B fodder).
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
        timestamps_requested: TIMESTAMPS,
        frames: [],
        media_responses: mediaResponses,
        errors: [],
    };

    try {
        console.log("[janowiak-ref] navigating...");
        await page.goto(TWEET_URL, { waitUntil: "load", timeout: 30000 });
        // Give X.com SPA time to hydrate the video element. Articles
        // load lazily so a fixed wait beats waiting on a specific selector.
        await page.waitForTimeout(4500);

        // Locate the video element. X.com renders the tweet video inside
        // an article. Some sessions need explicit click to ensure the
        // video is ready (X.com pauses by default for unauthenticated
        // visitors).
        const hasVideo = await page.locator("article video").first().count();
        if (hasVideo === 0) {
            manifest.errors.push({ phase: "locate-video", message: "no <video> element inside <article> after 4.5s wait" });
            throw new Error("video element not found — Plan A regression; investigate X.com markup");
        }

        console.log("[janowiak-ref] video element located");

        // Capture each frame via page.evaluate. We pause + seek + drawImage
        // entirely inside the page so we don't need to download the video
        // separately.
        for (const t of TIMESTAMPS) {
            const segment = tsToFilenameSegment(t);
            const outPath = resolve(OUT_DIR, `dave-frame-${segment}.png`);
            console.log(`  capturing t=${t}s → dave-frame-${segment}.png`);

            try {
                const result = await page.evaluate(async (target) => {
                    const v = document.querySelector("article video");
                    if (!v) return { ok: false, error: "no video element" };
                    v.pause();
                    v.muted = true;
                    v.currentTime = target;
                    // Wait for seeked event so the frame is actually decoded
                    await new Promise((resolveSeek, rejectSeek) => {
                        const onSeeked = () => { v.removeEventListener("seeked", onSeeked); resolveSeek(); };
                        const onError = () => { v.removeEventListener("error", onError); rejectSeek(new Error("video error")); };
                        v.addEventListener("seeked", onSeeked, { once: true });
                        v.addEventListener("error", onError, { once: true });
                        setTimeout(() => { v.removeEventListener("seeked", onSeeked); resolveSeek(); }, 2000);
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
                    manifest.errors.push({ phase: `frame-${segment}`, message: result.error });
                    continue;
                }

                const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, "");
                await writeFile(outPath, Buffer.from(base64, "base64"));
                manifest.frames.push({
                    timestamp_seconds: t,
                    filename: `dave-frame-${segment}.png`,
                    path: `.claude/state/main-flows-v2/reference-frames/dave-frame-${segment}.png`,
                    width: result.width,
                    height: result.height,
                });
            } catch (err) {
                manifest.errors.push({ phase: `frame-${segment}`, message: err.message });
                console.error(`    FAIL: ${err.message}`);
            }
        }
    } catch (err) {
        manifest.errors.push({ phase: "main", message: err.message });
        console.error(`[janowiak-ref] FAIL: ${err.message}`);
    } finally {
        await browser.close();
    }

    const manifestPath = resolve(OUT_DIR, "capture-manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`[janowiak-ref] manifest: ${manifestPath}`);

    if (manifest.errors.length > 0) {
        console.error(`[janowiak-ref] ${manifest.errors.length} error(s); ${manifest.frames.length}/${TIMESTAMPS.length} frames captured.`);
        if (manifest.frames.length === 0) {
            process.exit(1);
        }
        // Partial captures still useful — exit 0 if any frames landed.
    }
    console.log(`[janowiak-ref] OK: ${manifest.frames.length}/${TIMESTAMPS.length} frames captured.`);
}

main().catch(err => { console.error(err); process.exit(2); });
