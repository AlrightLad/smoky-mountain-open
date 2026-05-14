#!/usr/bin/env node
/*
 * Extract additional frames from the Dave Jeffery video by loading the
 * HLS manifest in a local HTML harness with hls.js, then seeking to
 * specific timestamps and screenshotting the video element. This avoids
 * needing ffmpeg.
 *
 * Saves frames to .claude/state/main-flows-v2/reference-frames/
 */
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2", "reference-frames");

const M3U8 = "https://video.twimg.com/amplify_video/2053865860108894208/pl/avc1/1768x1080/uwuVmcmB2lzQpzkT.m3u8";

const HARNESS_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #000; }
  video { width: 1768px; height: 1080px; display: block; }
</style></head>
<body>
  <video id="v" autoplay muted playsinline crossorigin="anonymous"></video>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"></script>
  <script>
    const v = document.getElementById('v');
    const hls = new Hls();
    hls.loadSource(${JSON.stringify(M3U8)});
    hls.attachMedia(v);
    window.__hlsReady = false;
    hls.on(Hls.Events.MANIFEST_PARSED, () => { window.__hlsReady = true; });
  </script>
</body></html>`;

(async () => {
    const harnessPath = resolve(OUT_DIR, "_harness.html");
    await writeFile(harnessPath, HARNESS_HTML);

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1768, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(harnessPath).toString(), { waitUntil: "load" });

    // Wait for hls.js to attach + first frame
    await page.waitForFunction(() => window.__hlsReady === true, null, { timeout: 20000 });
    await page.waitForFunction(() => document.getElementById('v').readyState >= 2, null, { timeout: 20000 });
    await page.waitForTimeout(800);
    console.log("[extract-frames] HLS ready, capturing seeks");

    const seekTimes = [0.5, 3.0, 6.0, 9.0, 12.0, 15.0, 17.5];
    for (const t of seekTimes) {
        await page.evaluate((time) => {
            const v = document.getElementById('v');
            v.pause();
            v.currentTime = time;
        }, t);
        // wait for seek to settle (seeked event)
        try {
            await page.waitForFunction((time) => {
                const v = document.getElementById('v');
                return !v.seeking && Math.abs(v.currentTime - time) < 0.2 && v.readyState >= 2;
            }, t, { timeout: 8000 });
        } catch (e) {
            console.warn(`[extract-frames] seek t=${t} timed out, continuing anyway`);
        }
        await page.waitForTimeout(300);
        const out = resolve(OUT_DIR, `dave-frame-t${String(t).padStart(5, "0").replace(".", "p")}.png`);
        const video = page.locator("#v");
        await video.screenshot({ path: out });
        const meta = await page.evaluate(() => {
            const v = document.getElementById('v');
            return { ct: v.currentTime, rs: v.readyState, dur: v.duration };
        });
        console.log(`[extract-frames] t=${t}  →  ${out}  meta=${JSON.stringify(meta)}`);
    }
    await browser.close();
})();
