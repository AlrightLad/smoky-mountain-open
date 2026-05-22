// Visual-gate — fail-loud check that every dashboard page actually RENDERS content,
// not just that the file exists and the smoke harness's structural checks pass.
//
// Per Founder directive 2026-05-21: "you NEED TO ALWAYS LOOK why am I having to
// tell you just do it on each commit and push you are not doing enough checks
// before you sign off on things."
//
// What this catches that the structural smoke does not:
//   - Pages where the JSON payload is `{}` (regen never wrote data) so the JS
//     falls into the empty-state branch -> Founder sees "No items captured yet"
//   - Pages where the data block parses but produces 0 visible cards
//   - Pages where a JS error wipes the main content area
//
// What it does NOT replace:
//   - Founder visual review (taste, copy, design — P7)
//   - Manual QA on actual member devices (V1 vision-verify)
//
// Exit non-zero if any page falls under the minimum-content threshold.
// Writes a screenshot per page to .claude/state/visual-gate/ for offline review.

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const REPORTS = path.join(REPO, 'docs', 'reports');
const OUT = path.join(REPO, '.claude', 'state', 'visual-gate');
fs.mkdirSync(OUT, { recursive: true });

// Per-page minimum-content contract. The selector is the primary content
// container; the min property is the minimum number of expected items.
//
// Adding a new dashboard page: add an entry here. Skipping it = no enforcement.
const CONTRACTS = [
    { file: 'dashboard.html',           selector: '.pb-kpi-value',          min: 20, role: 'KPI cells populated' },
    { file: 'activity.html',            selector: '.activity-row, .act-row, .pb-kpi-value', min: 1, role: 'activity rows OR KPIs' },
    { file: 'amendments.html',          selector: '.amd-row, .pb-kpi-value', min: 1, role: 'amendment rows OR KPIs' },
    { file: 'app-health.html',          selector: '.ah-dim-card, .ah-findings-card, .ah-attention-item', min: 5, role: 'dimension cards' },
    { file: 'design-system.html',       selector: '.token-row, .ds-token, .pb-page-main *', min: 5, role: 'design tokens' },
    { file: 'discussion-bubbles.html',  selector: '.db-thread, .pb-kpi-value', min: 1, role: 'threads OR KPIs' },
    { file: 'escalations.html',         selector: '.esc-row, .pb-kpi-value', min: 1, role: 'rows OR KPIs' },
    // founder-checklist: items expected when data has open items. The contract
    // splits the empty-state from the regen-failed case via the JSON-data check:
    // if data.counts.open === 0 AND .fc-empty is rendered, that's LEGITIMATE
    // empty (Founder is clear). If counts.open > 0 but .fc-item count is 0,
    // that's REGEN FAILURE (Founder action-required items not rendered).
    { file: 'founder-checklist.html',   selector: '.fc-item', min: 1, role: 'open checklist items', emptyStateOk: true, emptyStateSelector: '.fc-empty', emptyStateDataCheck: 'open===0' },
    { file: 'main-flows.html',          selector: 'main img, main video, .pb-page-main *', min: 1, role: 'main-flows content' },
    { file: 'proposals.html',           selector: '.prop-row, .pb-kpi-value', min: 1, role: 'proposal rows OR KPIs' },
    // sessions: cards expected when summaries exist. Strict — .sess-card only.
    { file: 'sessions.html',            selector: '.sess-card', min: 1, role: 'session cards (strict, NO empty-state fallback)' },
    { file: 'token-usage.html',         selector: '.token-row, .pb-kpi-value, .tu-card', min: 1, role: 'token rows OR cards' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const failures = [];

for (const contract of CONTRACTS) {
    const filePath = path.join(REPORTS, contract.file);
    if (!fs.existsSync(filePath)) {
        failures.push({ file: contract.file, error: 'FILE MISSING', count: 0, min: contract.min });
        continue;
    }
    const url = 'file://' + filePath.replace(/\\/g, '/');
    const page = await ctx.newPage();
    const consoleErrs = [];
    page.on('console', m => {
        if (m.type() === 'error') {
            const t = m.text();
            // Filter file:// CORS noise (same heuristic as dashboard smoke run.js)
            if (!/has been blocked by CORS/i.test(t) && !/cross.origin/i.test(t)) {
                consoleErrs.push(t);
            }
        }
    });
    page.on('pageerror', e => consoleErrs.push('pageerror: ' + e.message));
    try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(600);
        const count = await page.locator(contract.selector).count();
        // Also check for "Loading..." stuck states
        const bodyText = await page.locator('body').textContent();
        const stuckLoading = /Loading…|Loading\.\.\.|^Loading$/m.test(bodyText.slice(0, 1000));
        // Screenshot for offline review
        const shot = path.join(OUT, contract.file.replace('.html', '') + '.png');
        await page.screenshot({ path: shot, fullPage: false });

        if (count < contract.min) {
            // emptyStateOk: if the contract opts in, AND the page renders
            // .fc-empty AND data.counts.open === 0, treat as LEGITIMATE empty.
            // Distinguishes "Founder is clear" from "regen failed to render".
            let legitimateEmpty = false;
            if (contract.emptyStateOk) {
                const hasEmptyState = await page.locator(contract.emptyStateSelector).count() > 0;
                if (hasEmptyState) {
                    const dataOpen = await page.evaluate(() => {
                        const el = document.getElementById('report-data');
                        if (!el) return null;
                        try { return JSON.parse(el.textContent || '{}').counts?.open ?? null; }
                        catch { return null; }
                    });
                    if (dataOpen === 0) legitimateEmpty = true;
                }
            }
            if (legitimateEmpty) {
                process.stdout.write(`  PASS  ${contract.file.padEnd(28)} ${count} items + legitimate empty-state (counts.open=0)\n`);
            } else {
                failures.push({
                    file: contract.file,
                    error: `expected >=${contract.min} of [${contract.selector}], found ${count}`,
                    count,
                    min: contract.min,
                    screenshot: path.relative(REPO, shot),
                    consoleErrors: consoleErrs.slice(0, 3),
                });
            }
        } else if (stuckLoading) {
            failures.push({
                file: contract.file,
                error: 'STUCK_LOADING — page body still shows "Loading..." after networkidle + 600ms',
                count,
                min: contract.min,
                screenshot: path.relative(REPO, shot),
                consoleErrors: consoleErrs.slice(0, 3),
            });
        } else {
            process.stdout.write(`  PASS  ${contract.file.padEnd(28)} ${count} ${contract.role} (>=${contract.min})\n`);
        }
    } catch (e) {
        failures.push({ file: contract.file, error: 'NAVIGATION FAILED: ' + e.message, count: 0, min: contract.min });
    } finally {
        await page.close();
    }
}

await browser.close();

if (failures.length === 0) {
    console.log('\nvisual-gate: ALL ' + CONTRACTS.length + ' PAGES RENDER CONTENT');
    process.exit(0);
} else {
    console.log('\nvisual-gate: ' + failures.length + ' FAILURE(S)');
    for (const f of failures) {
        console.log(`  FAIL  ${f.file}`);
        console.log('    ' + f.error);
        if (f.screenshot) console.log('    screenshot: ' + f.screenshot);
        if (f.consoleErrors && f.consoleErrors.length) {
            console.log('    console errors:');
            f.consoleErrors.forEach(c => console.log('      ' + c));
        }
    }
    process.exit(1);
}
