#!/usr/bin/env node
/*
 * tests/visual-regression/bless.mjs
 *
 * Promotes the latest capture iter as the new baseline set. Use after
 * intentional visual changes have been reviewed + are correct.
 *
 *   npm run visual:bless        # accept latest iter as baseline
 *   VR_ITER=iter12 npm run ...  # accept a specific iter
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const BASELINES = resolve(REPO, "tests", "visual-regression", "baselines");
const CAPTURES_ROOT = resolve(REPO, ".claude", "state", "design-pass-2026-05-22", "captures");

const PROFILES = ["hq", "iphone14", "pixel7"];

function findLatestIter() {
    if (!existsSync(CAPTURES_ROOT)) return null;
    const iters = readdirSync(CAPTURES_ROOT)
        .filter(f => f.startsWith("iter"))
        .map(f => ({ name: f, n: parseInt(f.replace("iter", ""), 10) }))
        .filter(it => !isNaN(it.n))
        .sort((a, b) => b.n - a.n);
    return iters.length ? iters[0].name : null;
}

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

const iter = process.env.VR_ITER || findLatestIter();
if (!iter) { console.error("No captures found."); process.exit(2); }

console.log(`\n=== Blessing iter=${iter} as new baseline ===\n`);
let count = 0;
for (const profile of PROFILES) {
    const capDir = resolve(CAPTURES_ROOT, iter, profile);
    const baseDir = resolve(BASELINES, profile);
    ensureDir(baseDir);
    if (!existsSync(capDir)) {
        console.log(`  (skip ${profile}: no captures)`);
        continue;
    }
    const files = readdirSync(capDir).filter(f => f.endsWith(".png"));
    for (const f of files) {
        const src = resolve(capDir, f);
        const dst = resolve(baseDir, f);
        copyFileSync(src, dst);
        const size = statSync(dst).size;
        console.log(`  ${profile}/${f.padEnd(20)} ${(size/1024).toFixed(1)}KB`);
        count++;
    }
}
console.log(`\n${count} baseline images written to tests/visual-regression/baselines/`);
console.log("Commit them. Future captures compare against these.\n");
