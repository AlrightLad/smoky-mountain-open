#!/usr/bin/env node
/**
 * Supply-chain poisoning check (Founder directive 2026-05-29: "periodically
 * check and ensure that our data or anything is poisoned ... keep an eye out
 * when you added new tools to the orchestration stack").
 *
 * Complements existing security tooling (scan-repo-secrets.js, scan-bundle.js,
 * AgentShield) — those cover secrets + bundle exposure; this covers the npm
 * supply-chain attack surface:
 *
 *   1. Production-dependency vulnerabilities (npm audit --omit=dev): the code
 *      that actually ships to members must have 0 known vulns.
 *   2. Lifecycle scripts in node_modules (preinstall/install/postinstall) — the
 *      #1 npm poisoning vector. Any script NOT in the reviewed allowlist is a
 *      finding (could be a compromised/typosquatted package running code at
 *      install time).
 *   3. Lockfile presence — npm install without a lockfile resolves floating
 *      versions and is how a poisoned transitive dep slips in.
 *
 * Exit 0 = clean. Exit 1 = finding requiring review. Run after every dependency
 * change and on a periodic cadence.
 *
 * Usage:  node scripts/security/supply-chain-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Packages whose install-time lifecycle scripts have been reviewed and are
// known-legitimate. Keyed by package name -> the script body we expect. If the
// body changes, treat it as a finding (the package may have been tampered).
const REVIEWED_LIFECYCLE = {
  '@firebase/util': { postinstall: 'node ./postinstall.js' },
  protobufjs: { postinstall: 'node scripts/postinstall' },
};

const findings = [];
const notes = [];

function section(title) {
  process.stdout.write(`\n=== ${title} ===\n`);
}

// ── 1. Production-dependency vulnerabilities ────────────────────────────────
section('1. Production dependency audit (npm audit --omit=dev)');
try {
  const raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const audit = JSON.parse(raw);
  const total = audit?.metadata?.vulnerabilities?.total ?? 0;
  if (total > 0) {
    findings.push(`Production deps have ${total} vulnerabilit${total === 1 ? 'y' : 'ies'} (npm audit --omit=dev)`);
  } else {
    notes.push('Production deps: 0 vulnerabilities');
  }
  process.stdout.write(`  production vulnerabilities: ${total}\n`);
} catch (err) {
  // npm audit exits non-zero when vulns exist; parse stdout from the error.
  try {
    const audit = JSON.parse(err.stdout?.toString() || '{}');
    const total = audit?.metadata?.vulnerabilities?.total ?? 0;
    if (total > 0) findings.push(`Production deps have ${total} vulnerability(ies) (npm audit --omit=dev)`);
    process.stdout.write(`  production vulnerabilities: ${total}\n`);
  } catch {
    findings.push(`npm audit --omit=dev could not be parsed: ${err.message}`);
  }
}

// ── 2. Lifecycle scripts in node_modules ────────────────────────────────────
section('2. node_modules lifecycle scripts (install/postinstall poisoning)');
const seen = [];
function scan(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === '.bin') continue;
    if (!e.isDirectory()) continue;
    const full = join(dir, e.name);
    if (e.name.startsWith('@')) { scan(full); continue; } // scope dir
    const pj = join(full, 'package.json');
    if (existsSync(pj)) {
      try {
        const p = JSON.parse(readFileSync(pj, 'utf8'));
        const s = p.scripts || {};
        for (const k of ['preinstall', 'install', 'postinstall']) {
          if (!s[k]) continue;
          const name = p.name || e.name;
          seen.push({ name, hook: k, body: String(s[k]) });
          const reviewed = REVIEWED_LIFECYCLE[name]?.[k];
          if (reviewed === undefined) {
            findings.push(`UNREVIEWED lifecycle script: ${name} [${k}]: ${String(s[k]).slice(0, 100)}`);
          } else if (reviewed !== String(s[k])) {
            findings.push(`CHANGED lifecycle script: ${name} [${k}] expected "${reviewed}" got "${String(s[k])}"`);
          }
        }
      } catch { /* unreadable package.json — ignore */ }
    }
    const nested = join(full, 'node_modules');
    if (existsSync(nested)) scan(nested);
  }
}
scan(join(ROOT, 'node_modules'));
process.stdout.write(`  lifecycle scripts found: ${seen.length}\n`);
for (const s of seen) {
  const ok = REVIEWED_LIFECYCLE[s.name]?.[s.hook] === s.body;
  process.stdout.write(`    ${ok ? '[reviewed]' : '[FLAG]    '} ${s.name} [${s.hook}]: ${s.body.slice(0, 70)}\n`);
}

// ── 3. Lockfile presence ────────────────────────────────────────────────────
section('3. Lockfile integrity');
if (existsSync(join(ROOT, 'package-lock.json'))) {
  notes.push('package-lock.json present');
  process.stdout.write('  package-lock.json: present\n');
} else {
  findings.push('package-lock.json is MISSING — installs would resolve floating versions');
  process.stdout.write('  package-lock.json: MISSING\n');
}

// ── Verdict ─────────────────────────────────────────────────────────────────
section('VERDICT');
if (findings.length === 0) {
  for (const n of notes) process.stdout.write(`  ok  ${n}\n`);
  process.stdout.write('\nSUPPLY CHAIN CLEAN — no findings.\n');
  process.exit(0);
}
process.stdout.write(`SUPPLY CHAIN: ${findings.length} finding(s) requiring review:\n`);
for (const f of findings) process.stdout.write(`  ! ${f}\n`);
process.stdout.write('\nReview each finding. For a newly-added package with a legitimate\n');
process.stdout.write('lifecycle script, add it to REVIEWED_LIFECYCLE after inspecting the\n');
process.stdout.write('script body. For an unexpected vuln, run `npm audit` for detail.\n');
process.exit(1);
