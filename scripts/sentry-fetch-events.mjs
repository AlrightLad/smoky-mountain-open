#!/usr/bin/env node
/*
 * scripts/sentry-fetch-events.mjs
 *
 * Per feedback-sentry-error-repair-loop memory: every cycle, fetch
 * unresolved Sentry events for triage + repair. Reads SENTRY_AUTH_TOKEN
 * from .env (already in place per the credential audit; AMD-018 gate
 * #6 — agent uses, doesn't expose).
 *
 * USAGE:
 *   node scripts/sentry-fetch-events.mjs              # last 24h, unresolved
 *   node scripts/sentry-fetch-events.mjs --since=72h  # 72h window
 *   node scripts/sentry-fetch-events.mjs --raw        # dump JSON
 *
 * OUTPUT:
 *   - prints one summary line per unresolved event (count, last seen,
 *     title, URL to dashboard)
 *   - writes .claude/state/sentry/events-<ts>.json with the full payload
 *     for the next agent cycle to consume
 *
 * Sentry API docs:
 *   https://docs.sentry.io/api/events/list-an-organizations-issues/
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const ENV_FILE = resolve(REPO, '.env');
const OUT_DIR = resolve(REPO, '.claude', 'state', 'sentry');

// Parse .env for the auth token
let token = process.env.SENTRY_AUTH_TOKEN;
if (!token && existsSync(ENV_FILE)) {
    // Normalize CRLF → LF first so Windows-edited .env files parse correctly
    const lines = readFileSync(ENV_FILE, 'utf-8').replace(/\r\n/g, '\n').split('\n');
    for (const ln of lines) {
        const m = ln.match(/^SENTRY_AUTH_TOKEN\s*=\s*(.+)$/);
        if (m) { token = m[1].trim().replace(/^["']|["']$/g, ''); break; }
    }
}
if (!token) {
    console.error('SENTRY_AUTH_TOKEN not set in env or .env');
    process.exit(1);
}

const args = process.argv.slice(2);
const since = (args.find(a => a.startsWith('--since=')) || '--since=24h').split('=')[1];
const raw = args.includes('--raw');

// Org + project slugs. v8.24.47 — known slugs win: the 2026-06-11 token
// carries event:read + project:read but NOT org:read, so listing
// /organizations/ 403s while reading the project's issues works fine.
// Env overrides (SENTRY_ORG / SENTRY_PROJECT) > known defaults > discovery.
async function resolveOrgProject() {
    const envOrg = process.env.SENTRY_ORG || 'parbaughs';
    const envProject = process.env.SENTRY_PROJECT || 'javascript';
    if (envOrg && envProject) {
        const probe = await fetch(`https://sentry.io/api/0/projects/${envOrg}/${envProject}/`, {
            headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
        });
        if (probe.ok) return { org: envOrg, project: envProject };
        console.error(`[sentry-fetch] known slugs ${envOrg}/${envProject} probe: HTTP ${probe.status} — falling back to discovery`);
    }
    const orgRes = await fetch('https://sentry.io/api/0/organizations/', {
        headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!orgRes.ok) {
        const body = await orgRes.text();
        throw new Error(`/organizations/ ${orgRes.status} ${body.slice(0, 300)}`);
    }
    const orgs = await orgRes.json();
    if (!orgs.length) throw new Error('Token has access to 0 orgs');
    // Prefer an org with a project literally named parbaughs; else use first.
    for (const o of orgs) {
        const projRes = await fetch(`https://sentry.io/api/0/organizations/${o.slug}/projects/`, {
            headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
        });
        if (projRes.ok) {
            const projects = await projRes.json();
            const match = projects.find(p => /parbaugh/i.test(p.slug || p.name || '')) || projects[0];
            if (match) return { org: o.slug, project: match.slug };
        }
    }
    throw new Error('No project found across accessible orgs');
}

const { org: ORG, project: PROJECT } = await resolveOrgProject();
console.log(`[sentry-fetch] resolved org="${ORG}" project="${PROJECT}"`);

// Convert "24h" / "7d" → ISO timestamp for the statsPeriod query param.
const STATS = since.match(/^\d+[hd]$/) ? since : '24h';

const url = `https://sentry.io/api/0/projects/${ORG}/${PROJECT}/issues/?query=is:unresolved&statsPeriod=${STATS}&limit=100`;

console.log(`[sentry-fetch] GET ${url}`);

let res;
try {
    res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });
} catch (e) {
    console.error('[sentry-fetch] network error:', e.message);
    process.exit(1);
}

if (!res.ok) {
    const body = await res.text();
    console.error(`[sentry-fetch] HTTP ${res.status} ${res.statusText}`);
    console.error(body.slice(0, 1000));
    if (res.status === 401) {
        console.error('\n401 — SENTRY_AUTH_TOKEN may be expired or wrong scope.');
        console.error('Generate a new token at https://sentry.io/settings/account/api/auth-tokens/');
        console.error('Required scopes: org:read, project:read, event:read');
    }
    process.exit(1);
}

const events = await res.json();

if (raw) {
    console.log(JSON.stringify(events, null, 2));
    process.exit(0);
}

if (!Array.isArray(events) || events.length === 0) {
    console.log(`[sentry-fetch] No unresolved events in last ${STATS}. Clean.`);
} else {
    console.log(`\n=== ${events.length} unresolved event(s) in last ${STATS} ===\n`);
    for (const evt of events) {
        const lvl = (evt.level || 'error').toUpperCase().padEnd(7);
        const count = String(evt.count || '?').padStart(4);
        const lastSeen = (evt.lastSeen || '').slice(0, 19);
        const title = (evt.title || evt.metadata?.value || 'untitled').slice(0, 80);
        console.log(`  [${lvl}] ${count}× ${lastSeen}  ${title}`);
        console.log(`         ${evt.permalink || evt.shortId}`);
    }
    console.log('');
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const outPath = resolve(OUT_DIR, `events-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}Z.json`);
writeFileSync(outPath, JSON.stringify({ fetched_at: new Date().toISOString(), since: STATS, count: events.length, events }, null, 2));
console.log(`[sentry-fetch] full payload written to ${outPath.replace(REPO + '\\', '').replace(REPO + '/', '')}`);
