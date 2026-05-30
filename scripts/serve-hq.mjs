// serve-hq.mjs — local always-on dev-HQ server for docs/reports/.
//
// Why this exists (Founder directive 2026-05-30): the dashboard is "my
// development dashboard hq ... must be updated and accurate at all times."
// It is regenerated on every commit by .husky/post-commit, so the files on
// disk are always current. This script serves them over http://localhost so
// the HQ behaves like a real app:
//   - fetch()-based panels (live-refresh.js, main-flows-data.json) work, which
//     they cannot over file:// (browsers block local-file fetch via CORS).
//   - one stable URL to bookmark instead of a long file:/// path.
//
// It is LOCAL ONLY by design. The dashboard carries internal ops + security
// posture (pentest workflow, deploy gates, Sentry wiring). Exposing it on a
// public URL is a Founder access-control decision tracked in
// .claude/state/task-queue/founder/dashboard-production-hosting.md — NOT a
// thing this script does. No data leaves the machine.
//
// Usage:  npm run hq           (serves :8099, opens the index)
//         npm run hq -- 9000   (custom port)

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, normalize, extname, sep } from 'path';
import { spawn } from 'child_process';

const ROOT = normalize(join(process.cwd(), 'docs', 'reports'));
const PORT = Number(process.argv[2]) || 8099;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Resolve a request URL to a real file inside ROOT, or null if it escapes ROOT
// or does not exist. Path-traversal guard: the resolved path MUST stay under
// ROOT (defends against ../ and encoded traversal).
async function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  // Bare page name (e.g. /founder-checklist) -> .html
  if (!extname(rel)) rel = rel.replace(/\/$/, '') + '.html';

  const abs = normalize(join(ROOT, rel));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null; // escaped ROOT

  try {
    const s = await stat(abs);
    if (s.isDirectory()) return null;
    return abs;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — not found under docs/reports/');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      // HQ must always reflect the latest regen — never let the browser cache it.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 — ' + err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/index.html`;
  console.log('PARBAUGHS dev-HQ serving docs/reports/ (always-current, local-only)');
  console.log('  ' + url);
  console.log('  Ctrl+C to stop.');
  // Open the default browser (best-effort, platform-aware).
  const opener =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  try {
    spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref();
  } catch {
    /* opening the browser is a convenience; ignore failures */
  }
});
