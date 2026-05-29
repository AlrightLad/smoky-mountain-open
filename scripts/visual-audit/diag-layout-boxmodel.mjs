#!/usr/bin/env node
/*
 * scripts/visual-audit/diag-layout-boxmodel.mjs
 *
 * Layout diagnostic for the compare/contrast/critique loop. Signs in as
 * testZach against the local emulator (same path as capture-coherence-verify),
 * navigates to a target HQ route at a desktop width, and dumps the ground-truth
 * box model (getBoundingClientRect + key computed styles) for the page content
 * element, its ancestor chain up to <body>, the .sh section header, and the
 * first .card. Zero-guess input for deciding where a content max-width is safe.
 *
 * Usage:  node scripts/visual-audit/diag-layout-boxmodel.mjs [route] [width]
 *   route default = /scramble   width default = 1440
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

const ROUTE = process.argv[2] || "/scramble";
const WIDTH = Number(process.argv[3] || 1440);
const NAME = ROUTE === "/" ? "home" : ROUTE.replace(/^\//, "");

const USERS = (await import(pathToFileURL(resolve(REPO, "tests/e2e/setup/fixtures/users.js")).href)).users;
const testZach = USERS.find(u => u.key === "testZach");
if (!testZach) throw new Error("testZach fixture missing");

if (!admin.apps.length) admin.initializeApp({ projectId: "parbaughs" });
const token = await admin.auth().createCustomToken(testZach.uid);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 1200 } });
await ctx.addInitScript(() => { try { localStorage.setItem("pb_clubhouse_welcomed", "1"); } catch (e) {} });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/?emulator=1", { waitUntil: "load" });
await page.waitForFunction(() => typeof window.auth !== "undefined" && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => {
  const m = document.getElementById("mainApp");
  return m && !m.classList.contains("hidden");
}, { timeout: 15000 });
await page.evaluate((nm) => { if (window.Router && Router.go) Router.go(nm); }, NAME);
await page.waitForTimeout(900);
try { await page.waitForSelector(`[data-page="${NAME}"]`, { timeout: 6000 }); } catch {}
await page.waitForTimeout(400);
const report = await page.evaluate((nm) => {
  const sel = '[data-page="' + nm + '"]';
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      cls: (el.className && el.className.toString().slice(0, 60)) || null,
      x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width),
      maxWidth: cs.maxWidth, marginLeft: cs.marginLeft, marginRight: cs.marginRight,
      paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight,
      position: cs.position, display: cs.display, boxSizing: cs.boxSizing
    };
  }
  const out = { viewport: window.innerWidth, sel: sel, matchCount: document.querySelectorAll(sel).length, chain: [], sh: null, card: null };
  // The active page element is the one with content; pick the visible/non-empty match.
  const matches = Array.from(document.querySelectorAll(sel));
  let node = matches.find(el => el.offsetParent !== null && el.innerHTML.trim().length > 0) || matches.find(el => el.innerHTML.trim().length > 0) || matches[0] || null;
  out.pageEl = box(node);
  // ancestor chain up to body
  let p = node ? node.parentElement : null;
  while (p) { out.chain.push(box(p)); if (p.tagName === "BODY") break; p = p.parentElement; }
  if (node) {
    out.sh = box(node.querySelector(".sh"));
    out.card = box(node.querySelector(".card"));
  }
  return out;
}, NAME);

console.log(JSON.stringify(report, null, 2));
await ctx.close();
await browser.close();
