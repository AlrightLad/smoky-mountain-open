// Cross-browser smoke runner.
//
// Env vars:
//   BROWSERS  comma-separated: chromium,firefox,webkit,webkit-mobile (default: chromium)
//   HEADED    1/true to run with visible browser window (default: headless)
//   SLOWMO    ms delay between actions (default: 0)
//   DEVTOOLS  1/true to open devtools on launch (default: off; chromium only)
//   DEV_URL   dev server URL (default: http://localhost:5173/)
//
// Usage:
//   npm run smoke              # chromium only, headless
//   npm run smoke:full         # all 4 browsers
//   npm run smoke:headed       # chromium, visible
//   npm run smoke:debug        # chromium, visible, slow, devtools
//
// Requires:
//   - dev server running on DEV_URL (or pass DEV_URL env var)
//   - SMOKE_EMAIL + SMOKE_PASSWORD set if scenarios call auth.loginReal
//   - playwright browsers installed (npx playwright install <browser>)

const fs = require('fs');
const path = require('path');

// Auto-load .env.local (Smoke credentials per docs/SMOKE_TEST_ACCOUNT.md).
// File is gitignored. Existing process.env values take precedence so inline
// overrides (SMOKE_EMAIL=... npm run smoke) still work.
function loadDotEnvLocal() {
  try {
    var p = path.resolve(__dirname, '..', '..', '.env.local');
    if (!fs.existsSync(p)) return;
    var lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
    lines.forEach(function(line) {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      var eq = line.indexOf('=');
      if (eq < 1) return;
      var key = line.substring(0, eq).trim();
      var val = line.substring(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    });
  } catch(e) {
    console.warn('[smoke] failed to load .env.local:', e.message);
  }
}
loadDotEnvLocal();

const { chromium, firefox, webkit, devices } = require('@playwright/test');
const scenarios = require('./scenarios');
const { makeCapture, mkdirp } = require('./helpers/capture.js');
const report = require('./report.js');

const BROWSERS = (process.env.BROWSERS || 'chromium').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
const HEADED = process.env.HEADED === '1' || process.env.HEADED === 'true';
const SLOWMO = parseInt(process.env.SLOWMO || '0', 10);
const DEVTOOLS = process.env.DEVTOOLS === '1' || process.env.DEVTOOLS === 'true';
const DEV_URL = process.env.DEV_URL || 'http://localhost:5173/smoky-mountain-open/';

// Scenarios navigate with ?smoke=1 so firebase.js forces Firestore long-polling
// for this headless context (see src/core/firebase.js). Without it, Playwright
// cannot hold a WebChannel stream against prod, so onSnapshot delivers only its
// initial snapshot and every admin-SDK seed written mid-run is dropped — which
// stalled S3-S8. The param hits the real prod backend (no useEmulator); real
// members never carry it, so their default transport is untouched.
function withSmokeParam(u) {
  return u + (u.indexOf('?') === -1 ? '?' : '&') + 'smoke=1';
}
const SMOKE_NAV_URL = withSmokeParam(DEV_URL);

function timestamp() {
  var d = new Date();
  function p(n) { return String(n).padStart(2, '0'); }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         'T' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
}

// Browser launcher map. webkit-mobile uses the iPhone 14 Pro device profile
// (touch + mobile viewport + WebKit engine).
function launcherFor(name) {
  if (name === 'chromium') return { type: chromium, contextOpts: {} };
  if (name === 'firefox')  return { type: firefox,  contextOpts: {} };
  if (name === 'webkit')   return { type: webkit,   contextOpts: {} };
  if (name === 'webkit-mobile') {
    return { type: webkit, contextOpts: Object.assign({}, devices['iPhone 14 Pro']) };
  }
  return null;
}

async function probeDevServer(url) {
  // Lightweight reachability check — uses node http to avoid pulling in fetch polyfills.
  // v8.24.38 — probe both address families. Vite binds [::1] only on this
  // box while node sometimes resolves "localhost" to 127.0.0.1, which made
  // the probe (and therefore the whole suite) fail intermittently even with
  // the server up. Playwright itself resolves localhost fine.
  function probeHost(host, port, path) {
    return new Promise(function(resolve) {
      var http = require('http');
      var req = http.request({ host: host, port: port, path: path, method: 'HEAD', timeout: 3000 }, function(res) {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', function() { resolve(false); });
      req.on('timeout', function() { req.destroy(); resolve(false); });
      req.end();
    });
  }
  var u = require('url').parse(url);
  var port = u.port || 80;
  var path = u.path || '/';
  if (await probeHost(u.hostname, port, path)) return true;
  if (u.hostname === 'localhost') {
    if (await probeHost('::1', port, path)) return true;
    if (await probeHost('127.0.0.1', port, path)) return true;
  }
  return false;
}

async function runOnBrowser(browserName, runDir) {
  var spec = launcherFor(browserName);
  if (!spec) {
    return { browser: browserName, error: 'unknown browser: ' + browserName, results: [] };
  }

  var browser;
  try {
    browser = await spec.type.launch({
      headless: !HEADED,
      slowMo: SLOWMO,
      devtools: DEVTOOLS && browserName === 'chromium'
    });
  } catch (e) {
    return {
      browser: browserName,
      error: 'launch failed: ' + e.message + '\n  Try: npx playwright install ' + (browserName === 'webkit-mobile' ? 'webkit' : browserName),
      results: []
    };
  }

  var context = await browser.newContext(spec.contextOpts);
  var page = await context.newPage();
  // v8.24.80 — the tee-shot welcome intro is ON by default and mounts a
  // full-screen overlay post-sign-in (waits for a tap). In the smoke that
  // would block every scenario's interaction, so mark it seen before any
  // page load. S27 resets this itself to validate the gate.
  await page.addInitScript(function() { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
  var capture = makeCapture(page, runDir, browserName);

  var results = [];
  for (var i = 0; i < scenarios.length; i++) {
    var scenario = scenarios[i];
    var startMs = Date.now();
    var record = { id: scenario.id, name: scenario.name, passed: false, durationMs: 0 };
    try {
      // Optional Node-side setup hook (e.g., Firestore admin SDK seeding)
      if (typeof scenario.setup === 'function') {
        await scenario.setup();
        // 2s settle gives the browser's onSnapshot listener time to receive
        // the new data before run() begins waiting for it. WebKit's WebSocket
        // replication is variable; 2s is well within budget.
        await page.waitForTimeout(2000);
      }
      var out = await scenario.run({ page: page, capture: capture, devUrl: SMOKE_NAV_URL });
      record.passed = !!(out && out.passed);
      if (out && out.details) record.details = out.details;
    } catch (e) {
      record.passed = false;
      record.error = e.message || String(e);
      try { await capture.screenshot('FAIL_' + scenario.id); } catch(_) {}
    }
    record.durationMs = Date.now() - startMs;
    results.push(record);
    process.stdout.write('  [' + browserName + '] ' + scenario.id + ' ' + scenario.name + ' — ' + (record.passed ? 'PASS' : 'FAIL') + ' (' + record.durationMs + 'ms)\n');
  }

  capture.flushConsole();
  await context.close();
  await browser.close();

  var browserResults = { browser: browserName, results: results };
  // Write per-browser results.json
  fs.writeFileSync(path.join(runDir, browserName, 'results.json'), JSON.stringify(browserResults, null, 2), 'utf8');
  return browserResults;
}

async function main() {
  console.log('SMOKE RUNNER');
  console.log('  browsers: ' + BROWSERS.join(', '));
  console.log('  headed:   ' + HEADED + ' (slowMo=' + SLOWMO + 'ms, devtools=' + DEVTOOLS + ')');
  console.log('  devUrl:   ' + DEV_URL);
  console.log('  navUrl:   ' + SMOKE_NAV_URL + ' (forces Firestore long-polling for headless)');
  console.log('  scenarios:' + scenarios.length);
  console.log('');

  // Probe dev server first. v8.24.42 — retry up to 4x with 2s gaps; the
  // single-shot probe flaked when vite was mid-(re)start or while the OS
  // settled a just-released port, failing whole suite runs with the server
  // genuinely up.
  var ok = false;
  for (var probeTry = 0; probeTry < 4 && !ok; probeTry++) {
    if (probeTry > 0) await new Promise(function(r) { setTimeout(r, 2000); });
    ok = await probeDevServer(DEV_URL);
  }
  if (!ok) {
    console.error('ERROR: dev server not reachable at ' + DEV_URL);
    console.error('  Start it in another terminal:  npm run dev');
    console.error('  Or override:  DEV_URL=http://localhost:PORT/ npm run smoke');
    process.exit(2);
  }

  var ts = timestamp();
  var runDir = path.join(__dirname, 'output', ts);
  mkdirp(runDir);
  console.log('  output:   tests/smoke/output/' + ts + '/');
  console.log('');

  var allResults = [];
  for (var i = 0; i < BROWSERS.length; i++) {
    process.stdout.write('▸ ' + BROWSERS[i] + '\n');
    var r = await runOnBrowser(BROWSERS[i], runDir);
    allResults.push(r);
    process.stdout.write('\n');
  }

  // Update "latest" pointer (text file rather than symlink for Windows compat).
  fs.writeFileSync(path.join(__dirname, 'output', 'latest.txt'), ts, 'utf8');

  var matrix = report.render(runDir);
  console.log(matrix);

  // Exit non-zero if any failure.
  var anyFail = allResults.some(function(r) {
    return r.error || (r.results || []).some(function(s) { return !s.passed; });
  });
  process.exit(anyFail ? 1 : 0);
}

main().catch(function(e) {
  console.error('FATAL:', e.stack || e.message || e);
  process.exit(2);
});
