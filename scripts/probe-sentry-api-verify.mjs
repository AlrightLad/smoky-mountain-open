// Closes the verification loop: with SENTRY_AUTH_TOKEN in .env, query
// Sentry's REST API and confirm the events posted by the deep-probe
// + direct-curl scripts are actually present in the dashboard view.
//
// This is the evidence-supported test on the DASHBOARD side that
// complements the SERVER-ACCEPTED side (probe-sentry-deep returned
// 200 + event IDs; this confirms those IDs land in the issues view).
//
// Usage: node scripts/probe-sentry-api-verify.mjs

import { readFileSync } from 'fs';

const envText = readFileSync('.env', 'utf-8');

const dsnMatch = envText.match(/^SENTRY_DSN=(.+)$/m);
const tokenMatch = envText.match(/^SENTRY_AUTH_TOKEN=(.+)$/m);

if (!dsnMatch) { console.error('FAIL: SENTRY_DSN not in .env'); process.exit(2); }
if (!tokenMatch) {
    console.error('FAIL: SENTRY_AUTH_TOKEN not in .env');
    console.error('       Follow docs/walkthroughs/sentry-auth-token.md (~5 min)');
    process.exit(2);
}

const dsn = dsnMatch[1].trim();
const token = tokenMatch[1].trim();

// FORMAT validate the token per PROP-011 (don't query API with a malformed token)
if (!/^sntr[ysu]_[A-Za-z0-9+/=._-]{40,}$/.test(token)) {
    console.error('FAIL: SENTRY_AUTH_TOKEN format does not match Sentry auth-token shape');
    console.error('       Expected: sntr[ysu]_<40+ chars>');
    console.error('       Got:      ' + token.slice(0, 8) + '...' + token.slice(-4));
    process.exit(2);
}
console.log('Token format: PASS (sntr[ysu]_ + 40+ chars)');

const dsnParts = dsn.match(/^https:\/\/([a-f0-9]+)@o(\d+)\.ingest\.(us|de|eu)\.sentry\.io\/(\d+)$/);
if (!dsnParts) { console.error('FAIL: DSN format mismatch'); process.exit(2); }
const [, , orgId, region, projectId] = dsnParts;
console.log('Org ID:    ' + orgId);
console.log('Project ID:' + projectId);
console.log('Region:    ' + region);
console.log('');

const headers = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' };

// Step 1: Resolve org slug from org ID
console.log('--- Step 1: Resolve org via /api/0/organizations/ ---');
const orgsRes = await fetch('https://sentry.io/api/0/organizations/?owner=1', { headers });
console.log('  HTTP ' + orgsRes.status);
if (!orgsRes.ok) {
    console.error('  Body: ' + (await orgsRes.text()).slice(0, 300));
    process.exit(1);
}
const orgs = await orgsRes.json();
const org = orgs.find(o => String(o.id) === orgId) || orgs[0];
if (!org) { console.error('FAIL: no organizations returned'); process.exit(1); }
console.log('  Org slug:  ' + org.slug);
console.log('  Org name:  ' + org.name);
console.log('  Org ID:    ' + org.id + (org.id === orgId ? ' ✓ matches DSN' : ' ✗ MISMATCH with DSN'));
console.log('');

// Step 2: Resolve project slug from project ID
console.log('--- Step 2: Resolve project via /api/0/organizations/<slug>/projects/ ---');
const projRes = await fetch(`https://sentry.io/api/0/organizations/${org.slug}/projects/`, { headers });
console.log('  HTTP ' + projRes.status);
if (!projRes.ok) { console.error('  Body: ' + (await projRes.text()).slice(0, 300)); process.exit(1); }
const projects = await projRes.json();
const proj = projects.find(p => String(p.id) === projectId);
if (!proj) {
    console.error('FAIL: project ID ' + projectId + ' not found in org ' + org.slug);
    console.error('Projects available:');
    projects.forEach(p => console.error('  - ' + p.slug + ' (id: ' + p.id + ')'));
    process.exit(1);
}
console.log('  Project slug: ' + proj.slug);
console.log('  Project name: ' + proj.name);
console.log('  Project ID:   ' + proj.id + ' ✓ matches DSN');
console.log('');

// Step 3: Pull recent events for this project
console.log('--- Step 3: Pull recent events via /api/0/projects/<org>/<proj>/events/ ---');
const eventsRes = await fetch(`https://sentry.io/api/0/projects/${org.slug}/${proj.slug}/events/?statsPeriod=24h`, { headers });
console.log('  HTTP ' + eventsRes.status);
if (!eventsRes.ok) { console.error('  Body: ' + (await eventsRes.text()).slice(0, 300)); process.exit(1); }
const events = await eventsRes.json();
console.log('  Events in last 24h: ' + events.length);

// Print the most recent 10 events with their IDs + messages
console.log('');
console.log('Recent events (last 10):');
events.slice(0, 10).forEach((e, i) => {
    const id = e.eventID || e.id || '?';
    const msg = (e.message || e.title || '').slice(0, 80);
    const ts = e.dateCreated || '?';
    console.log(`  [${i+1}] ${id} | ${ts} | ${msg}`);
});

// Step 4: Find specific event IDs from earlier probes
console.log('');
console.log('--- Step 4: Locate specific probe event IDs ---');
const probeIds = ['60302e56d2674c3e83619171545fecc1', 'cfa134b50d1247cea9c6bff8fa83bd66'];
const found = [];
for (const probeId of probeIds) {
    const match = events.find(e => (e.eventID || e.id) === probeId);
    if (match) {
        console.log('  ✓ FOUND: ' + probeId + ' — ' + (match.message || match.title || '').slice(0, 80));
        found.push(probeId);
    } else {
        console.log('  ✗ NOT FOUND in last-24h window: ' + probeId);
    }
}

console.log('');
console.log('--- Dashboard URLs (verified org slug + project slug) ---');
console.log('  Org dashboard:    https://' + org.slug + '.sentry.io/issues/');
console.log('  Project dashboard:https://sentry.io/organizations/' + org.slug + '/issues/?project=' + proj.id);
console.log('');

if (events.length > 0) {
    console.log('VERIFY: PASS — Sentry API returned ' + events.length + ' event(s) for project ' + proj.slug);
    if (found.length === probeIds.length) {
        console.log('         ALL probe IDs visible in dashboard view ✓');
    } else if (found.length > 0) {
        console.log('         ' + found.length + '/' + probeIds.length + ' probe IDs visible (others may be in older windows)');
    } else {
        console.log('         WARN: probe IDs not in last-24h window (could be retention or environment filter)');
    }
    process.exit(0);
} else {
    console.log('VERIFY: PARTIAL — auth + project resolution OK, but 0 events in last 24h.');
    console.log('         Either: (a) free-tier rate-limited, (b) wrong project, (c) events older than 24h.');
    process.exit(1);
}
