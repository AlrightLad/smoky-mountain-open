// Check 07: Code Pattern Scan
// Version consistency, caddy notes, CLAUDE.md freshness, TODO/FIXME scan

var fs = require("fs");
var path = require("path");

module.exports = { name: "Code Pattern Scan", run: run };

async function run(ctx) {
  var log = ctx.logger;
  var passed = 0, failed = 0, warnings = 0;
  var CHECK = "code-patterns";

  var root = path.resolve(__dirname, "../../..");

  // 1. APP_VERSION matches package.json
  var utilsPath = path.join(root, "src/core/utils.js");
  var pkgPath = path.join(root, "package.json");
  var utilsContent = fs.readFileSync(utilsPath, "utf8");
  var pkgContent = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  var appVersionMatch = utilsContent.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  var appVersion = appVersionMatch ? appVersionMatch[1] : null;
  var pkgVersion = pkgContent.version;

  if (appVersion && pkgVersion && appVersion === pkgVersion) {
    log.pass(CHECK, "APP_VERSION (" + appVersion + ") matches package.json (" + pkgVersion + ")");
    passed++;
  } else {
    log.warn(CHECK, "APP_VERSION (" + appVersion + ") != package.json (" + pkgVersion + ")",
      { expected: appVersion, actual: pkgVersion, remediation: "Sync package.json version to " + appVersion });
    warnings++;
  }

  // 2. Caddy Notes has entry for current APP_VERSION
  var caddyPath = path.join(root, "src/pages/caddynotes.js");
  var caddyContent = fs.readFileSync(caddyPath, "utf8");
  if (caddyContent.indexOf("v" + appVersion) !== -1 || caddyContent.indexOf("APP_VERSION") !== -1) {
    log.pass(CHECK, "Caddy Notes references current version");
    passed++;
  } else {
    log.warn(CHECK, "Caddy Notes may not reference v" + appVersion,
      { remediation: "Add changelog entry for v" + appVersion });
    warnings++;
  }

  // 3. CLAUDE.md freshness — check last modified or content date
  var claudePath = path.join(root, "CLAUDE.md");
  if (fs.existsSync(claudePath)) {
    var claudeStat = fs.statSync(claudePath);
    var daysSinceMod = (Date.now() - claudeStat.mtimeMs) / 86400000;
    if (daysSinceMod <= 30) {
      log.pass(CHECK, "CLAUDE.md modified within 30 days (" + Math.round(daysSinceMod) + " days ago)");
      passed++;
    } else {
      log.warn(CHECK, "CLAUDE.md last modified " + Math.round(daysSinceMod) + " days ago",
        { remediation: "Review and update CLAUDE.md" });
      warnings++;
    }
  }

  // 4. Critical TODOs/FIXMEs
  var srcDir = path.join(root, "src");
  var files = gatherFiles(srcDir, ".js");
  var criticalTodos = 0;
  files.forEach(function(f) {
    var basename = path.basename(f);
    var lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach(function(line, idx) {
      if (/\b(TODO|FIXME|XXX|HACK)\b.*\b(P0|CRITICAL|URGENT|EMERGENCY)\b/i.test(line)) {
        log.warn(CHECK, basename + ":" + (idx + 1) + " — critical marker: " + line.trim().substring(0, 80),
          { file: f, line: idx + 1 });
        criticalTodos++;
        warnings++;
      }
    });
  });
  if (criticalTodos === 0) {
    log.pass(CHECK, "No critical TODO/FIXME/XXX markers found");
    passed++;
  }

  return { name: "Code Pattern Scan", passed: passed, failed: failed, warnings: warnings, details: [] };
}

function gatherFiles(dir, ext) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(function(item) {
    var full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) results = results.concat(gatherFiles(full, ext));
    else if (full.endsWith(ext)) results.push(full);
  });
  return results;
}
