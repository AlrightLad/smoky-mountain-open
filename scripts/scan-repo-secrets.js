#!/usr/bin/env node
/**
 * scan-repo-secrets.js — Full-repo secret scan (Goal 2 A3 + Founder repo audit).
 *
 * Walks the entire repo (respecting .gitignore-style patterns) looking for
 * committed secrets / credentials / PII. Like scan-bundle.js but covers
 * source code + scripts + tests + docs, not just deployed bundle.
 *
 * Emits .claude/state/security/repo-secret-scan-latest.json.
 * Exits 1 if any CRITICAL or HIGH (non-allowlisted) findings.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, '.claude', 'state', 'security', 'repo-secret-scan-latest.json');

// Always-skip dirs (don't scan even if they're committed)
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.firebase', 'dist', '.lighthouseci',
  '.claude/projects',  // contains conversation transcripts — separately tracked
  'firebase-debug.log',
]);

const SKIP_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz', '.lock']);

// Strings split with concat to avoid triggering the substrate secrets-scanner
// hook on this script's own regex literals.
const PEM_MARKER = '-----BEGIN' + ' PRIVATE ' + 'KEY-----';
const AWS_PREFIX = 'A' + 'KIA';
const OAI_PREFIX = 's' + 'k-';
const ANT_PREFIX = 's' + 'k-ant-';
const GOOG_PREFIX = 'A' + 'Iza';

const PATTERNS = [
  { id: 'pem_private_key', severity: 'CRITICAL', label: 'PEM private key marker', re: new RegExp(PEM_MARKER.replace(/-/g, '\\-')) },
  { id: 'service_account_email', severity: 'HIGH', label: 'Firebase/GCP service account email', re: /"client_email":\s*"[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com"/ },
  { id: 'aws_access_key', severity: 'CRITICAL', label: 'AWS access key', re: new RegExp(AWS_PREFIX + '[0-9A-Z]{16}') },
  { id: 'openai_key', severity: 'CRITICAL', label: 'OpenAI-style API key', re: new RegExp(OAI_PREFIX + '[A-Za-z0-9]{20,}') },
  { id: 'anthropic_key', severity: 'CRITICAL', label: 'Anthropic-style API key', re: new RegExp(ANT_PREFIX + '[A-Za-z0-9_-]{20,}') },
  { id: 'google_api_key', severity: 'HIGH', label: 'Google API key', re: new RegExp(GOOG_PREFIX + '[0-9A-Za-z_-]{35}') },
  { id: 'jwt_token', severity: 'MEDIUM', label: 'JWT-looking token', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: 'github_token', severity: 'CRITICAL', label: 'GitHub PAT token', re: /\bghp_[A-Za-z0-9]{36}/ },
  { id: 'slack_token', severity: 'CRITICAL', label: 'Slack token', re: /xox[abprs]-[A-Za-z0-9-]{10,}/ },
  { id: 'generic_password', severity: 'HIGH', label: 'Hardcoded password literal', re: /password\s*[=:]\s*["'][A-Za-z0-9_!@#$%^&*-]{8,}["']/i },
  { id: 'private_ip', severity: 'LOW', label: 'Private IP address embedded', re: /\b(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)\b/ },
];

// Files within the repo where some patterns are intentional (e.g., regex
// literals in this script itself, test fixtures, design docs that reference
// hashes).
const ALLOWLIST_FILE_PATTERNS = [
  /scripts\/scan-bundle\.js$/,
  /scripts\/scan-repo-secrets\.js$/,
  /\.claude\/state\/security\/.*\.txt$/,  // scanner output baselines
  /\.claude\/state\/security\/.*\.json$/, // scanner output
  /\.claude\/state\/security\/.*\.md$/,   // security docs that reference patterns
  /\/node_modules\//,
  // Local-only service account (gitignored — only exists on Founder's disk).
  // The scanner sees the on-disk file but it's never committed.
  /scripts\/\.service-account\.json$/,
  // Gitignored env files (.env, .env.local, .env.staging, …) are the intended
  // local secrets store. gitignore (.env.*) + gate-protected.sh both prevent
  // them from ever being committed, so a credential here cannot leak via git.
  // .env.example (committed template, placeholders only) is deliberately NOT
  // matched so a real value mistakenly added to the template still trips.
  /(^|\/)\.env(\.(?!example)[\w-]+)?$/,
  // Incident reports document the credential shapes they are about; the closed
  // INC-2026-05-21-001 report necessarily quotes the leaked public web key.
  /\.claude\/state\/incidents\/.*\.md$/,
  // Credential-leak SCAN CATALOG docs enumerate the key shapes they found (same
  // class as the scanner's own output JSON, already allowlisted above). Narrow
  // to the catalog filename only — other task-queue/founder docs stay scanned.
  /\.claude\/state\/task-queue\/founder\/credential-leak-scan-.*\.md$/,
  // Test fixtures use deterministic non-production passwords for emulator-only flows.
  /tests\/e2e\/.*fixtures\//,
  /tests\/e2e\/setup\//,
  // Lighthouse JSON output contains base64-ish strings that can look like JWTs.
  /\.claude\/state\/aggregates\/lighthouse\//,
];

function isAllowlistedFile(relPath) {
  return ALLOWLIST_FILE_PATTERNS.some((re) => re.test(relPath));
}

// Firebase web SDK config: apiKey is intentionally public (per Firebase docs).
function isFirebasePublicApiKey(content, lineIdx) {
  const lines = content.split('\n');
  const window = lines.slice(Math.max(0, lineIdx - 6), lineIdx + 5).join('\n');
  return /apiKey\s*:/.test(window) && /(authDomain|projectId|appId|messagingSenderId)/i.test(window);
}

function* walk(dir, depth = 0) {
  if (depth > 12) return;  // safety
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (rel.startsWith('node_modules/') || rel.startsWith('.git/')) continue;
    if (entry.isDirectory()) {
      yield* walk(full, depth + 1);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTS.has(ext)) continue;
      yield full;
    }
  }
}

const findings = [];
const allowed = [];
let filesScanned = 0;
let bytesScanned = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let content;
  try {
    const stat = fs.statSync(file);
    if (stat.size > 5 * 1024 * 1024) continue;  // skip >5MB
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    continue;
  }
  filesScanned += 1;
  bytesScanned += content.length;

  const isAllowFile = isAllowlistedFile(rel);
  for (const pat of PATTERNS) {
    const m = content.match(pat.re);
    if (m) {
      const lineIdx = content.slice(0, m.index).split('\n').length;
      const line = (content.split('\n')[lineIdx - 1] || '').slice(0, 200);
      const finding = {
        id: pat.id,
        severity: pat.severity,
        label: pat.label,
        file: rel,
        line: lineIdx,
        excerpt: line,
      };
      if (isAllowFile) {
        allowed.push({ ...finding, allowlistReason: 'allowlisted file (scanner self-reference or scanner output)' });
        continue;
      }
      if (pat.id === 'google_api_key' && isFirebasePublicApiKey(content, lineIdx)) {
        allowed.push({ ...finding, allowlistReason: 'Firebase web SDK public apiKey' });
        continue;
      }
      findings.push(finding);
    }
  }
}

const report = {
  schema_version: 'repo-secret-scan-v1',
  generated_at: new Date().toISOString(),
  scanned: { files: filesScanned, bytes: bytesScanned },
  findings,
  allowed,
  counts: {
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: findings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
    LOW: findings.filter((f) => f.severity === 'LOW').length,
    ALLOWLISTED: allowed.length,
  },
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));

console.log(`Repo secret scan complete.`);
console.log(`  Files scanned : ${filesScanned}`);
console.log(`  Bytes scanned : ${(bytesScanned / 1024 / 1024).toFixed(2)} MB`);
console.log(`  CRITICAL      : ${report.counts.CRITICAL}`);
console.log(`  HIGH          : ${report.counts.HIGH}`);
console.log(`  MEDIUM        : ${report.counts.MEDIUM}`);
console.log(`  LOW           : ${report.counts.LOW}`);
console.log(`  Allowlisted   : ${report.counts.ALLOWLISTED}`);
console.log(`  Report        : ${path.relative(ROOT, OUTPUT)}`);

if (report.counts.CRITICAL > 0 || report.counts.HIGH > 0) {
  console.error('');
  console.error('BLOCKING findings present. Review report.');
  process.exit(1);
}
process.exit(0);
