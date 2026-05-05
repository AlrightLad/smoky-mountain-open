// Per-scenario capture: screenshots, console logs, page errors.
// Each browser run gets its own output dir under tests/smoke/output/<ts>/<browser>/.

const fs = require('fs');
const path = require('path');

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function makeCapture(page, runDir, browserName) {
  var browserDir = path.join(runDir, browserName);
  var screenshotsDir = path.join(browserDir, 'screenshots');
  mkdirp(screenshotsDir);

  var consoleLog = [];
  var pageErrors = [];

  page.on('console', function(msg) {
    var t = msg.type();
    var text = msg.text();
    consoleLog.push('[' + t + '] ' + text);
    if (t === 'error') pageErrors.push(text);
  });

  page.on('pageerror', function(err) {
    var msg = '[pageerror] ' + (err.message || String(err));
    consoleLog.push(msg);
    pageErrors.push(err.message || String(err));
  });

  return {
    screenshot: async function(name) {
      var safe = String(name).replace(/[^a-zA-Z0-9_-]/g, '_');
      var p = path.join(screenshotsDir, safe + '.png');
      await page.screenshot({ path: p, fullPage: false });
      return p;
    },
    flushConsole: function() {
      var p = path.join(browserDir, 'console.log');
      fs.writeFileSync(p, consoleLog.join('\n') + '\n', 'utf8');
      return p;
    },
    pageErrors: function() { return pageErrors.slice(); },
    consoleSnapshot: function() { return consoleLog.slice(); },
    browserDir: browserDir,
    screenshotsDir: screenshotsDir
  };
}

module.exports = { makeCapture, mkdirp };
