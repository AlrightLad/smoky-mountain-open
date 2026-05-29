#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-coherence-verify.mjs
 *
 * Design Coherence Pass capture harness. Signs in as testZach against the
 * local emulator and screenshots each surface at HQ (1440) + iPhone (390)
 * viewports for the compare/contrast/critique loop. Originally built to
 * verify side-stripe removal (home/standings/feed/calendar); extended to the
 * HQ surfaces awaiting Wave-2 aesthetic coherence review.
 *
 * Native-viewport (fullPage:false) so the output is legible when Read —
 * the design-pass harness uses fullPage which downscales past the 2000px
 * readable limit.
 *
 * Output: .claude/state/design-pass-2026-05-22/coherence-verify/<profile>/<surface>.png
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "parbaughs";

const admin = (await import("firebase-admin")).default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const OUT = resolve(REPO, ".claude", "state", "design-pass-2026-05-22", "coherence-verify");

const PROFILES = [
    { key: "hq",        width: 1440, height: 1200 },
    { key: "iphone14",  width: 390,  height: 1400 },
];

const SURFACES = [
    { key: "home",       route: "/",           wait: "[data-stat='round-count'], [data-page='home']" },
    { key: "standings",  route: "/standings",  wait: ".sp-list, [data-page='standings']" },
    { key: "feed",       route: "/feed",       wait: "[data-page='feed'], .feed-list" },
    { key: "calendar",   route: "/calendar",   wait: "[data-page='calendar'], .calendar-page", selectPopulatedDay: true },
    // HQ surfaces awaiting Wave-2 aesthetic coherence review (design_pass_pending
    // in .claude/state/ship-progress/HQ-Ship-5-*.json). Captured for the
    // compare/contrast/critique loop against peer benchmarks (Linear/Stripe/etc).
    { key: "members",    route: "/members",    wait: "[data-page='members']" },
    { key: "bounties",   route: "/bounties",   wait: "[data-page='bounties']" },
    { key: "wagers",     route: "/wagers",     wait: "[data-page='wagers']" },
    { key: "scramble",   route: "/scramble",   wait: "[data-page='scramble']" },
    { key: "trips",      route: "/trips",      wait: "[data-page='trips']" },
    { key: "challenges", route: "/challenges", wait: "[data-page='challenges']" },
    { key: "trophyroom", route: "/trophyroom", wait: "[data-page='trophyroom']" },
    { key: "range",      route: "/range",      wait: "[data-page='range-detail'], [data-page='range']" },
    { key: "onboarding", route: "/onboarding", wait: "[data-page='onboarding']" },
];

const USERS = (await import(pathToFileURL(resolve(REPO, "tests/e2e/setup/fixtures/users.js")).href)).users;
const testZach = USERS.find(u => u.key === "testZach");
if (!testZach) throw new Error("testZach fixture missing");

async function captureProfile(profile, token) {
    const outProfile = resolve(OUT, profile.key);
    await mkdir(outProfile, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
    await ctx.addInitScript(() => {
        try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {}
    });
    const page = await ctx.newPage();
    page.on("console", (msg) => {
        if (msg.type() === "error") console.warn(`[${profile.key} console:error]`, msg.text());
    });

    console.log(`[coherence-verify] profile=${profile.key} ${profile.width}x${profile.height}`);
    await page.goto("http://localhost:5173/?emulator=1", { waitUntil: "load" });

    await page.waitForFunction(() => {
        return typeof window.firebase !== "undefined"
            && typeof window.auth !== "undefined"
            && window._pbEmulator === true;
    }, { timeout: 10000 });

    await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);

    await page.waitForFunction(() => {
        const main = document.getElementById("mainApp");
        const auth = document.getElementById("authScreen");
        return main && !main.classList.contains("hidden")
            && auth && auth.classList.contains("hidden");
    }, { timeout: 15000 });

    await page.evaluate(() => {
        try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {}
        document.querySelectorAll(".toast").forEach(el => el.remove());
    });

    for (const s of SURFACES) {
        try {
            await page.evaluate((r) => {
                var name = r === "/" ? "home" : r.replace(/^\//, "");
                if (typeof Router !== "undefined" && Router.go) {
                    Router.go(name);
                } else {
                    location.hash = "#/" + name;
                }
            }, s.route);
            await page.waitForTimeout(900);
            try { await page.waitForSelector(s.wait, { timeout: 4000 }); } catch {}
            await page.waitForTimeout(400);
            if (s.selectPopulatedDay) {
                await page.evaluate(() => {
                    try {
                        if (typeof _calBuildEventMap === "function" && typeof selectCalDay === "function") {
                            var em = _calBuildEventMap();
                            var keys = Object.keys(em || {});
                            if (keys.length) selectCalDay(keys[0]);
                        }
                    } catch (e) {}
                });
                await page.waitForTimeout(600);
                const detail = await page.$("#cal-day-detail");
                if (detail) {
                    await detail.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(200);
                    const path = resolve(outProfile, `${s.key}.png`);
                    await detail.screenshot({ path });
                    console.log(`  [${profile.key}] ✓ ${s.key} (detail-clip)`);
                    continue;
                }
            }
            const path = resolve(outProfile, `${s.key}.png`);
            await page.screenshot({ path, fullPage: false });
            console.log(`  [${profile.key}] ✓ ${s.key}`);
        } catch (e) {
            console.warn(`  [${profile.key}] ✗ ${s.key}  →  ${e.message}`);
        }
    }

    await ctx.close();
    await browser.close();
}

async function main() {
    await mkdir(OUT, { recursive: true });
    if (!admin.apps.length) admin.initializeApp({ projectId: "parbaughs" });
    const token = await admin.auth().createCustomToken(testZach.uid);
    console.log(`[coherence-verify] signing in as ${testZach.key} (${testZach.uid})`);
    for (const profile of PROFILES) {
        await captureProfile(profile, token);
    }
    console.log(`[coherence-verify] done.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
