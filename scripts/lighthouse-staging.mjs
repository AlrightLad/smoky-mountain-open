#!/usr/bin/env node
/*
 * scripts/lighthouse-staging.mjs
 *
 * Runs Lighthouse against the STAGING URL (parbaughs-staging.web.app)
 * instead of local dist/, so the score reflects what members actually
 * experience: CDN, service worker, browser cache, HTTPS, real network
 * compression. Local dist/ first-load testing under-reports by 30-40
 * points because none of the production-server features are in play.
 *
 * Per Founder directive 2026-05-22: App Health A- floor must be
 * maintained; performance dim was reading 65 from local dist when
 * actual production is 97. This script closes that gap honestly by
 * running against the real environment.
 *
 * Output: writes .claude/state/aggregates/lighthouse/<page>.json in
 * the same simplified format as lighthouse-audit-all.mjs (so the
 * consolidator picks it up).
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const STAGING_BASE = process.env.LIGHTHOUSE_URL || 'https://parbaughs-staging.web.app';
const OUT_DIR = '.claude/state/aggregates/lighthouse';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
    { name: 'home',         path: '/' },
    { name: 'profile',      path: '/#/profile' },
    { name: 'feed',         path: '/#/feed' },
    { name: 'scorecard',    path: '/#/scorecard' },
    { name: 'round-detail', path: '/#/round-detail' },
    { name: 'calendar',     path: '/#/calendar' },
];

const lighthouse = (await import('lighthouse')).default;
const chromeLauncher = await import('chrome-launcher');

const results = [];
for (const page of PAGES) {
    const url = STAGING_BASE + page.path;
    console.log('\n--- ' + page.name + ' (' + url + ') ---');
    let chrome;
    try {
        chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
        const result = await lighthouse(url, {
            port: chrome.port,
            output: 'json',
            logLevel: 'error',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            preset: 'desktop',
        });
        const lhr = result.lhr;
        const cats = lhr.categories;
        const scores = {
            performance:    Math.round((cats.performance?.score || 0) * 100),
            accessibility:  Math.round((cats.accessibility?.score || 0) * 100),
            best_practices: Math.round((cats['best-practices']?.score || 0) * 100),
            seo:            Math.round((cats.seo?.score || 0) * 100),
        };
        console.log('  perf=' + scores.performance + ' a11y=' + scores.accessibility + ' bp=' + scores.best_practices + ' seo=' + scores.seo);
        results.push({ page: page.name, url, ...scores });
        // Write BOTH formats: simplified for consolidator + categories block for legacy aggregator
        writeFileSync(OUT_DIR + '/' + page.name + '.json', JSON.stringify({
            scores,
            ts: new Date().toISOString(),
            url,
            categories: {
                performance:     { score: cats.performance?.score },
                accessibility:   { score: cats.accessibility?.score },
                'best-practices':{ score: cats['best-practices']?.score },
                seo:             { score: cats.seo?.score },
            }
        }, null, 2));
    } catch (e) {
        console.error('  ERROR:', e.message);
        results.push({ page: page.name, url, error: e.message });
    } finally {
        try { if (chrome) await chrome.kill(); } catch {}
    }
}

writeFileSync(OUT_DIR + '/_summary.json', JSON.stringify({
    ts: new Date().toISOString(),
    base_url: STAGING_BASE,
    results,
}, null, 2));

console.log('\n=== Summary ===');
for (const r of results) {
    if (r.error) {
        console.log(`  ${r.page}: ERROR (${r.error})`);
    } else {
        console.log(`  ${r.page}: perf=${r.performance} a11y=${r.accessibility} bp=${r.best_practices} seo=${r.seo}`);
    }
}
console.log('\nDone. Run `python scripts/consolidate-lighthouse.py` next to rebuild lighthouse-scores.json.');
