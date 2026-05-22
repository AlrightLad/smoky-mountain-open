// W1.A8 — run Lighthouse against all 6 sampled pages and capture scores.
// Uses a local static server (Vite preview) on dist/ + chrome-launcher.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';
import http from 'http';
import net from 'net';

const OUT_DIR = '.claude/state/aggregates/lighthouse';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
    { name: 'home',         path: '/index.html' },
    { name: 'profile',      path: '/index.html#/profile' },
    { name: 'feed',         path: '/index.html#/feed' },
    { name: 'scorecard',    path: '/index.html#/scorecard' },
    { name: 'round-detail', path: '/index.html#/round-detail' },
    { name: 'calendar',     path: '/index.html#/calendar' },
];

// Static-serve dist/ on a free port
const port = await new Promise((res) => {
    const srv = net.createServer();
    srv.listen(0, () => { const p = srv.address().port; srv.close(() => res(p)); });
});

const server = http.createServer((req, res) => {
    let path = req.url.split('#')[0].split('?')[0];
    if (path === '/' || path === '') path = '/index.html';
    const filePath = resolve('dist' + path);
    try {
        const buf = readFileSync(filePath);
        const ext = path.split('.').pop();
        const mime = { html:'text/html', js:'application/javascript', css:'text/css', jpg:'image/jpeg', png:'image/png', svg:'image/svg+xml', json:'application/json' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(buf);
    } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((res) => server.listen(port, '127.0.0.1', res));
console.log('Serving dist/ on http://127.0.0.1:' + port);

const lighthouse = (await import('lighthouse')).default;
const chromeLauncher = await import('chrome-launcher');

const results = [];
for (const page of PAGES) {
    const url = 'http://127.0.0.1:' + port + page.path;
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
        writeFileSync(OUT_DIR + '/' + page.name + '.json', JSON.stringify({ scores, ts: new Date().toISOString() }, null, 2));
    } catch (e) {
        console.error('  ERROR:', e.message);
        results.push({ page: page.name, url, error: e.message });
    } finally {
        try { if (chrome) await chrome.kill(); } catch {}
    }
}

server.close();

console.log('\n=== Summary ===');
console.log('page          perf  a11y  bp   seo');
console.log('-'.repeat(40));
results.forEach(r => {
    if (r.error) { console.log(r.page.padEnd(14) + ' ERROR: ' + r.error.slice(0, 60)); return; }
    console.log(r.page.padEnd(14) + ' ' + String(r.performance).padStart(4) + '  ' + String(r.accessibility).padStart(4) + '  ' + String(r.best_practices).padStart(3) + '  ' + String(r.seo).padStart(3));
});
writeFileSync(OUT_DIR + '/_summary.json', JSON.stringify({ ts: new Date().toISOString(), results }, null, 2));
console.log('\nSummary saved to ' + OUT_DIR + '/_summary.json');

const allOver85 = results.every(r => !r.error && r.performance >= 85);
process.exit(allOver85 ? 0 : 1);
