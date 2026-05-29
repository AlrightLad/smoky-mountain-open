#!/usr/bin/env node
/*
 * scripts/visual-audit/verify-drawer-a11y.mjs
 *
 * BL-008 verification harness. Signs in as testZach against the local
 * emulator + dev server and dumps #rrSidebar ARIA semantics across the
 * three layout bands:
 *   - Desktop  (>=960px): persistent nav rail — must NOT be role=dialog
 *                         and must NOT be aria-hidden.
 *   - Band A   (720-959px): off-canvas drawer — role=dialog; aria-hidden
 *                         true when closed, false + aria-modal=true open.
 *   - Band B   (<720px): hidden via CSS — must not be role=dialog.
 *
 * Usage: node scripts/visual-audit/verify-drawer-a11y.mjs
 */
import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "parbaughs";

const admin = (await import("firebase-admin")).default;
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");

const USERS = (await import(pathToFileURL(resolve(REPO, "tests/e2e/setup/fixtures/users.js")).href)).users;
const testZach = USERS.find(u => u.key === "testZach");
if (!testZach) throw new Error("testZach fixture missing");

function readAria() {
  var el = document.getElementById("rrSidebar");
  if (!el) return { present: false };
  return {
    present: true,
    role: el.getAttribute("role"),
    ariaHidden: el.getAttribute("aria-hidden"),
    ariaModal: el.getAttribute("aria-modal"),
    ariaLabel: el.getAttribute("aria-label"),
    drawerOpen: !!window._drawerOpen,
    display: getComputedStyle(el).display,
    visibility: getComputedStyle(el).visibility,
  };
}

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: "parbaughs" });
  const token = await admin.auth().createCustomToken(testZach.uid);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {} });
  const page = await ctx.newPage();

  await page.goto("http://localhost:5173/?emulator=1", { waitUntil: "load" });
  await page.waitForFunction(() =>
    typeof window.firebase !== "undefined" && typeof window.auth !== "undefined" && window._pbEmulator === true,
    { timeout: 10000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => {
    const main = document.getElementById("mainApp");
    return main && !main.classList.contains("hidden");
  }, { timeout: 15000 });
  await page.waitForTimeout(500);

  // Desktop (>=960)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  const desktop = await page.evaluate(readAria);

  // Band A (720-959) — closed
  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForTimeout(300);
  const bandAClosed = await page.evaluate(readAria);

  // Band A — open
  await page.evaluate(() => { if (window._toggleHQDrawer) window._toggleHQDrawer(); });
  await page.waitForTimeout(300);
  const bandAOpen = await page.evaluate(readAria);

  // Close again, then Band B (<720)
  await page.evaluate(() => { if (window._drawerOpen && window._closeHQDrawer) window._closeHQDrawer(); });
  await page.setViewportSize({ width: 600, height: 900 });
  await page.waitForTimeout(300);
  const bandB = await page.evaluate(readAria);

  console.log(JSON.stringify({ desktop, bandAClosed, bandAOpen, bandB }, null, 2));

  await ctx.close();
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
