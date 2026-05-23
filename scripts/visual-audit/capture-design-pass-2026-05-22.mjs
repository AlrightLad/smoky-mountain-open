#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-design-pass-2026-05-22.mjs
 *
 * Design-pass capture (2026-05-22). Founder directive: "Claude Code IS
 * the design capability. Use orchestration + competitor research +
 * engineering skills, then visually spot-check."
 *
 * Captures every major MEMBER-FACING surface as testZach (HQ admin).
 * Comparison target: peer references in
 * .claude/state/design-research/competitive-references/ — Linear,
 * Vercel, Stripe, Datadog, Sentry.
 *
 * Output:
 *   .claude/state/design-pass-2026-05-22/captures/iter0/<surface>.png
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
const ITER = process.argv[2] || "iter0";
const OUT = resolve(REPO, ".claude", "state", "design-pass-2026-05-22", "captures", ITER);

const PROFILES = [
    { key: "hq",        width: 1440, height: 900 },  // Desktop HQ — peer-rubric viewport
    { key: "iphone14",  width: 390,  height: 844 },  // iPhone 14 — mobile baseline
    { key: "pixel7",    width: 412,  height: 915 },  // Pixel 7 — Android baseline
];

const SURFACES = [
    { key: "home-hq",     route: "/",           wait: "[data-stat='round-count']" },
    { key: "standings",   route: "/standings",  wait: ".sp-list, [data-page='standings']" },
    { key: "members",     route: "/members",    wait: ".members-grid, [data-page='members'], .mb-grid" },
    { key: "rounds",      route: "/rounds",     wait: ".rounds-list, [data-page='rounds']" },
    { key: "caddynotes",  route: "/caddynotes", wait: "[data-page='caddynotes'], .cn-page" },
    { key: "playnow",     route: "/playnow",    wait: "[data-page='playnow'], .pn-page" },
    { key: "feed",        route: "/feed",       wait: "[data-page='feed'], .feed-list" },
    { key: "profile",     route: "/profile",    wait: "[data-page='profile'], .pr-page" },
    { key: "settings",    route: "/settings",   wait: "[data-page='settings'], .st-page" },
    { key: "trophyroom",  route: "/trophyroom", wait: "[data-page='trophyroom'], .trophy-room" },
    { key: "shop",        route: "/shop",       wait: "[data-page='shop'], .shop-grid" },
    { key: "courses",     route: "/courses",    wait: "[data-page='courses'], .course-list, .courses-grid" },
    { key: "calendar",    route: "/calendar",   wait: "[data-page='calendar'], .calendar-page" },
    { key: "teetimes",    route: "/teetimes",   wait: "[data-page='teetimes'], .teetimes-list" },
    { key: "more",        route: "/more",       wait: "[data-page='more'], .more-page" },
    { key: "records",     route: "/records",    wait: "[data-page='records']" },
    { key: "aces",        route: "/aces",       wait: "[data-page='aces']" },
    { key: "awards",      route: "/awards",     wait: "[data-page='awards']" },
    { key: "range",       route: "/range",      wait: "[data-page='range']" },
    { key: "trips",       route: "/trips",      wait: "[data-page='trips']" },
    { key: "wagers",      route: "/wagers",     wait: "[data-page='wagers']" },
    { key: "bounties",    route: "/bounties",   wait: "[data-page='bounties']" },
    { key: "challenges",  route: "/challenges", wait: "[data-page='challenges']" },
    { key: "richlist",    route: "/richlist",   wait: "[data-page='richlist']" },
    { key: "leagues",     route: "/leagues",    wait: "[data-page='leagues']" },
    { key: "findplayers", route: "/findplayers",wait: "[data-page='findplayers']" },
    { key: "scorecard",   route: "/scorecard",  wait: "[data-page='scorecard']" },
    { key: "scramble",    route: "/scramble",   wait: "[data-page='scramble']" },
    { key: "seasonrecap", route: "/seasonrecap",wait: "[data-page='seasonrecap']" },
    { key: "partygames",  route: "/partygames", wait: "[data-page='partygames']" },
    { key: "roundhistory", route: "/roundhistory", wait: "[data-page='roundhistory']" },
    { key: "bugreport",   route: "/bugreport",  wait: "[data-page='bugreport']" },
    { key: "rules",       route: "/rules",      wait: "[data-page='rules']" },
    { key: "faq",         route: "/faq",        wait: "[data-page='faq']" },
    { key: "chat",        route: "/chat",       wait: "[data-page='chat']" },
    { key: "dms",         route: "/dms",        wait: "[data-page='dms']" },
];

const USERS = (await import(pathToFileURL(resolve(REPO, "tests/e2e/setup/fixtures/users.js")).href)).users;
const testZach = USERS.find(u => u.key === "testZach");
if (!testZach) throw new Error("testZach fixture missing");

async function captureProfile(profile, token) {
    const outProfile = resolve(OUT, profile.key);
    await mkdir(outProfile, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
    // Pre-seed localStorage BEFORE any app code runs so the welcome toast
    // is suppressed on first sign-in (test users hit a fresh context every
    // run otherwise). Real members see the toast once on sign-in then never
    // again; this gives us the same "already seen it" state for captures.
    await ctx.addInitScript(() => {
        try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {}
    });
    const page = await ctx.newPage();

    page.on("console", (msg) => {
        if (msg.type() === "error") console.warn(`[${profile.key} console:error]`, msg.text());
    });

    console.log(`[capture-design-pass] profile=${profile.key} ${profile.width}x${profile.height}`);

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

    // Suppress the one-time "Clubhouse is open" welcome toast for capture
    // cleanliness. Real members see it for 5s on first sign-in then never
    // again; for screenshots the toast obscures content.
    await page.evaluate(() => {
        try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {}
        // Remove any toast already in the DOM from this session
        document.querySelectorAll(".toast").forEach(el => el.remove());
    });

    for (const s of SURFACES) {
        try {
            // Use the app's actual Router. The exposed global is `Router` (a
            // top-level var). For the home route we navigate to "/" which
            // Router.go('home') handles; for other routes drop the leading
            // slash and call Router.go(name).
            await page.evaluate((r) => {
                var name = r === "/" ? "home" : r.replace(/^\//, "");
                if (typeof Router !== "undefined" && Router.go) {
                    Router.go(name);
                } else {
                    location.hash = "#/" + name;
                }
            }, s.route);
            await page.waitForTimeout(900);
            try {
                await page.waitForSelector(s.wait, { timeout: 4000 });
            } catch {
                // Carry on with whatever shape the page took
            }
            await page.waitForTimeout(400);
            const path = resolve(outProfile, `${s.key}.png`);
            await page.screenshot({ path, fullPage: true });
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

    console.log(`[capture-design-pass] iter=${ITER} profiles=${PROFILES.length} surfaces=${SURFACES.length}`);
    console.log(`[capture-design-pass] signing in as ${testZach.key} (${testZach.uid})`);

    for (const profile of PROFILES) {
        await captureProfile(profile, token);
    }

    console.log(`[capture-design-pass] done. iter=${ITER} — total ${PROFILES.length * SURFACES.length} screenshots`);
}

main().catch(e => { console.error(e); process.exit(1); });
