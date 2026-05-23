#!/usr/bin/env node
/*
 * tests/visual-regression/run.mjs
 *
 * Visual regression suite — closes A11 testing weak_point per Founder
 * directive 2026-05-22 ("implement all how-to-improve suggestions on
 * dashboard app health page").
 *
 * Pipeline:
 *   1. Re-capture all member-facing surfaces at HQ + iPhone 14 + Pixel 7
 *      viewports via scripts/visual-audit/capture-design-pass-2026-05-22.mjs
 *      (writes to .claude/state/design-pass-2026-05-22/captures/<iter>/).
 *   2. For each captured PNG, compare against the corresponding baseline
 *      under tests/visual-regression/baselines/<profile>/<page>.png.
 *   3. Emit per-page diff counts + a summary. Exit 1 if any page exceeds
 *      the 2% pixel-diff threshold (Founder spec).
 *
 * To accept new baselines (after intentional visual change):
 *   npm run visual:bless
 *
 * Output:
 *   tests/visual-regression/last-run/<profile>/<page>.diff.png  — diff overlay
 *   tests/visual-regression/last-run/summary.json               — pass/fail per page
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const BASELINES = resolve(REPO, "tests", "visual-regression", "baselines");
const LAST_RUN = resolve(REPO, "tests", "visual-regression", "last-run");
const CAPTURES_ROOT = resolve(REPO, ".claude", "state", "design-pass-2026-05-22", "captures");

const PROFILES = ["hq", "iphone14", "pixel7"];
const PAGES = [
    "home-hq", "standings", "members", "rounds", "caddynotes",
    "playnow", "feed", "settings",
    "profile", "trophyroom", "shop",
    "courses", "calendar", "teetimes", "more",
    "records", "aces", "awards",
    "range", "trips",
    "wagers", "bounties", "challenges",
    "richlist", "leagues",
    "findplayers", "scorecard", "scramble"
];

// Per Founder spec "fail on >2% pixel diff"
const DIFF_THRESHOLD = 0.02; // 2% of total pixels

function loadPng(path) {
    if (!existsSync(path)) return null;
    return PNG.sync.read(readFileSync(path));
}

function findLatestIter() {
    // Find the highest-numbered iter directory
    if (!existsSync(CAPTURES_ROOT)) return null;
    const iters = readdirSync(CAPTURES_ROOT)
        .filter(f => f.startsWith("iter"))
        .map(f => ({ name: f, n: parseInt(f.replace("iter", ""), 10) }))
        .filter(it => !isNaN(it.n))
        .sort((a, b) => b.n - a.n);
    return iters.length ? iters[0].name : null;
}

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

async function main() {
    if (!existsSync(BASELINES)) {
        console.error(`\n  Baselines directory missing at ${BASELINES}`);
        console.error("  Run `npm run visual:bless` to establish baselines from the latest capture.\n");
        process.exit(2);
    }

    const iter = process.env.VR_ITER || findLatestIter();
    if (!iter) {
        console.error(`\n  No captures found under ${CAPTURES_ROOT}.`);
        console.error("  Run `node scripts/visual-audit/capture-design-pass-2026-05-22.mjs iterN` first.\n");
        process.exit(2);
    }

    ensureDir(LAST_RUN);
    const summary = { iter, ts: new Date().toISOString(), pages: [], pass: 0, fail: 0, skip: 0 };

    for (const profile of PROFILES) {
        const capDir = resolve(CAPTURES_ROOT, iter, profile);
        const baseDir = resolve(BASELINES, profile);
        const outDir = resolve(LAST_RUN, profile);
        ensureDir(outDir);

        for (const page of PAGES) {
            const capPath = resolve(capDir, `${page}.png`);
            const basePath = resolve(baseDir, `${page}.png`);
            const diffPath = resolve(outDir, `${page}.diff.png`);
            const entry = { profile, page, status: "skip", diff: 0, total: 0, pct: 0 };

            const cap = loadPng(capPath);
            const base = loadPng(basePath);
            if (!cap) {
                entry.note = "capture missing";
                summary.skip++; summary.pages.push(entry); continue;
            }
            if (!base) {
                entry.note = "baseline missing — run npm run visual:bless to accept";
                summary.skip++; summary.pages.push(entry); continue;
            }
            if (cap.width !== base.width || cap.height !== base.height) {
                entry.status = "fail";
                entry.note = `dimension mismatch: capture ${cap.width}x${cap.height} vs baseline ${base.width}x${base.height}`;
                summary.fail++; summary.pages.push(entry); continue;
            }

            const total = cap.width * cap.height;
            const diff = new PNG({ width: cap.width, height: cap.height });
            const diffPixels = pixelmatch(cap.data, base.data, diff.data, cap.width, cap.height, { threshold: 0.1 });
            const pct = diffPixels / total;
            entry.diff = diffPixels;
            entry.total = total;
            entry.pct = +(pct * 100).toFixed(3);
            entry.status = pct > DIFF_THRESHOLD ? "fail" : "pass";
            if (entry.status === "fail") {
                writeFileSync(diffPath, PNG.sync.write(diff));
                entry.diffPath = diffPath.replace(REPO + "\\", "").replace(REPO + "/", "");
            }
            summary[entry.status]++;
            summary.pages.push(entry);
        }
    }

    writeFileSync(resolve(LAST_RUN, "summary.json"), JSON.stringify(summary, null, 2));

    // Console report
    console.log(`\n=== Visual regression (iter=${iter}) ===`);
    for (const e of summary.pages) {
        const status = e.status === "pass" ? "✓" : (e.status === "fail" ? "✗" : "·");
        const pctStr = e.total ? ` ${e.pct}%` : "";
        const note = e.note ? ` — ${e.note}` : "";
        console.log(`  ${status} ${e.profile.padEnd(9)} ${e.page.padEnd(12)}${pctStr}${note}`);
    }
    console.log(`\nPASS: ${summary.pass}  FAIL: ${summary.fail}  SKIP: ${summary.skip}`);
    console.log(`Threshold: ${(DIFF_THRESHOLD * 100).toFixed(0)}% pixel diff. Run \`npm run visual:bless\` to accept new baselines after intentional changes.\n`);

    process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
