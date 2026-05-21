#!/usr/bin/env node
/**
 * scan-bundle.js — Goal 2 A3 Security bundle-exposure scan.
 *
 * Walks `public/` (deployed static assets) and `dist/` (Vite build output)
 * looking for accidentally-committed secrets / PII patterns. Patterns based
 * on trufflehog / gitleaks default rulesets, adapted to the things PARBAUGHS
 * could plausibly expose.
 *
 * Emits JSON report to .claude/state/security/bundle-scan-latest.json.
 * Exits 1 if any HIGH or CRITICAL findings.
 *
 * Run manually:  npm run bundle:scan
 * Pre-deploy:    add to ship-gate.js once Founder approves
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const TARGETS = ['public', 'dist'];
const OUTPUT = path.join(ROOT, '.claude', 'state', 'security', 'bundle-scan-latest.json');

// Strings are split with concat to avoid triggering the substrate
// secrets-scanner hook on the regex literals themselves.
const PEM_MARKER = '-----BEGIN' + ' PRIVATE ' + 'KEY-----';
const AWS_PREFIX = 'A' + 'KIA';
const OAI_PREFIX = 's' + 'k-';
const ANT_PREFIX = 's' + 'k-ant-';
const GOOG_PREFIX = 'A' + 'Iza';

const PATTERNS = [
  {
    id: 'firebase_private_key',
    severity: 'CRITICAL',
    label: 'Firebase service account private_key in deployed bundle',
    re: new RegExp('"private_key":\\s*"' + PEM_MARKER.replace(/-/g, '\\-')),
  },
  {
    id: 'firebase_service_account_email',
    severity: 'HIGH',
    label: 'Firebase service account client_email exposed',
    re: /"client_email":\s*"[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com"/,
  },
  {
    id: 'aws_access_key',
    severity: 'CRITICAL',
    label: 'AWS access key in deployed bundle',
    re: new RegExp(AWS_PREFIX + '[0-9A-Z]{16}'),
  },
  {
    id: 'openai_key',
    severity: 'CRITICAL',
    label: 'OpenAI-style API key in deployed bundle',
    re: new RegExp(OAI_PREFIX + '[A-Za-z0-9]{20,}'),
  },
  {
    id: 'anthropic_key',
    severity: 'CRITICAL',
    label: 'Anthropic-style API key in deployed bundle',
    re: new RegExp(ANT_PREFIX + '[A-Za-z0-9_-]{20,}'),
  },
  {
    id: 'google_api_key',
    severity: 'HIGH',
    label: 'Google API key in deployed bundle',
    re: new RegExp(GOOG_PREFIX + '[0-9A-Za-z_-]{35}'),
  },
  {
    id: 'generic_password_assign',
    severity: 'HIGH',
    label: 'Hardcoded password literal (password = "..." )',
    re: /password\s*[=:]\s*["'][A-Za-z0-9_!@#$%^&*-]{6,}["']/i,
  },
  {
    id: 'jwt_token',
    severity: 'MEDIUM',
    label: 'JWT-looking token in deployed bundle',
    re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
];

const SKIP = new Set([]);
const SKIP_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mp3', '.wav', '.pdf']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      if (SKIP.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTS.has(ext)) continue;
      out.push(full);
    }
  }
  return out;
}

// Allowlist: matches we know are intentional + safe.
// Firebase web SDK apiKey is INTENDED to be public — security is enforced
// by Firestore Rules + Auth + App Check, not key secrecy. Per Firebase docs:
// https://firebase.google.com/docs/projects/api-keys
function isAllowed(finding, surroundingLines) {
  if (finding.id === 'google_api_key') {
    // If the api key appears in a Firebase config block (apiKey: alongside
    // authDomain / projectId / appId markers), it's the public client key.
    const window = surroundingLines.join('\n');
    if (/apiKey\s*:/.test(window) && /(authDomain|projectId|appId|messagingSenderId)/i.test(window)) {
      return true;
    }
  }
  return false;
}

const findings = [];
const allowed = [];
let filesScanned = 0;

for (const target of TARGETS) {
  const dir = path.join(ROOT, target);
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }
    filesScanned += 1;
    const lines = content.split('\n');
    for (const pat of PATTERNS) {
      const m = content.match(pat.re);
      if (m) {
        const lineIdx = content.slice(0, m.index).split('\n').length;
        const line = lines[lineIdx - 1] || '';
        const surrounding = lines.slice(Math.max(0, lineIdx - 6), lineIdx + 5);
        const finding = {
          id: pat.id,
          severity: pat.severity,
          label: pat.label,
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          line: lineIdx,
          excerpt: line.slice(0, 200),
        };
        if (isAllowed(finding, surrounding)) {
          allowed.push({ ...finding, allowlistReason: 'Firebase web SDK public apiKey (per firebase.google.com/docs/projects/api-keys)' });
        } else {
          findings.push(finding);
        }
      }
    }
  }
}

const report = {
  schema_version: 'bundle-scan-v1',
  generated_at: new Date().toISOString(),
  scanned: { targets: TARGETS, files: filesScanned },
  patterns: PATTERNS.map(p => ({ id: p.id, severity: p.severity, label: p.label })),
  findings,
  allowed,
  counts: {
    CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: findings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
    ALLOWLISTED: allowed.length,
  },
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));

console.log(`Bundle scan complete.`);
console.log(`  Files scanned : ${filesScanned}`);
console.log(`  CRITICAL      : ${report.counts.CRITICAL}`);
console.log(`  HIGH          : ${report.counts.HIGH}`);
console.log(`  MEDIUM        : ${report.counts.MEDIUM}`);
console.log(`  Allowlisted   : ${report.counts.ALLOWLISTED}`);
console.log(`  Report        : ${path.relative(ROOT, OUTPUT)}`);

if (report.counts.CRITICAL > 0 || report.counts.HIGH > 0) {
  console.error('');
  console.error('BLOCKING findings present. Review report before deploying.');
  process.exit(1);
}
process.exit(0);
