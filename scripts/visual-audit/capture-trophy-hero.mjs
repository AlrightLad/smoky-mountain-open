#!/usr/bin/env node
/* Capture the Trophy Room hero (viewport only) to inspect the level halo. */
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
const OUT = resolve(REPO, ".claude/state/design-pass-2026-05-22/trophy-hero");
await mkdir(OUT, { recursive: true });

const USERS = (await import(pathToFileURL(resolve(REPO, "tests/e2e/setup/fixtures/users.js")).href)).users;
const testZach = USERS.find(u => u.key === "testZach");

if (!admin.apps.length) admin.initializeApp({ projectId: "parbaughs" });
const token = await admin.auth().createCustomToken(testZach.uid);

const browser = await chromium.launch({ headless: true });
for (const p of [{ key: "hq", w: 1440, h: 900 }, { key: "iphone14", w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: p.w, height: p.h } });
    await ctx.addInitScript(() => { try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto("http://localhost:5173/?emulator=1", { waitUntil: "load" });
    await page.waitForFunction(() => typeof window.auth !== "undefined" && window._pbEmulator === true, { timeout: 10000 });
    await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
    await page.waitForFunction(() => { var m = document.getElementById("mainApp"); return m && !m.classList.contains("hidden"); }, { timeout: 15000 });
    await page.evaluate(() => Router.go("trophyroom"));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(OUT, p.key + "-viewport.png"), fullPage: false });
    console.log(`captured ${p.key}`);
    await ctx.close();
}
await browser.close();
