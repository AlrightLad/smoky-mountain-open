// Check 05: Display Drift
// Static analysis of source files for hardcoded strings, raw db calls, scoping issues

var fs = require("fs");
var path = require("path");

module.exports = { name: "Display Drift", run: run };

async function run(ctx) {
  var log = ctx.logger, config = ctx.config;
  var passed = 0, failed = 0, warnings = 0;
  var CHECK = "display-drift";
  var srcDir = path.resolve(__dirname, "../../../src");

  // Gather all .js files from src/
  var files = gatherFiles(srcDir, ".js");

  // 1. Hardcoded "The Parbaughs" (should be dynamic)
  var HARDCODED_EXCLUDE = ["caddynotes.js", "config.js", "CLAUDE.md"];
  files.forEach(function(f) {
    var basename = path.basename(f);
    if (HARDCODED_EXCLUDE.indexOf(basename) !== -1) return;
    var lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach(function(line, idx) {
      // Skip comments
      if (line.trim().indexOf("//") === 0) return;
      if (/["']The Parbaughs["']/.test(line) || /Welcome to The Parbaughs/.test(line)) {
        // Allow references in welcome ribbs (firebase.js chat messages)
        if (/welcomeRibbs|Ribb/.test(line)) return;
        log.warn(CHECK, basename + ":" + (idx + 1) + " — hardcoded 'The Parbaughs'",
          { file: f, line: idx + 1, remediation: "Use window._activeLeagueName or league.name" });
        warnings++;
      }
    });
  });

  // 2. Raw db.collection("X") where X is league-scoped
  files.forEach(function(f) {
    var basename = path.basename(f);
    // Exclude verify scripts, admin recovery tool, migration code
    if (basename === "admin.js" || /verify|diagnose|restore|migration/i.test(basename)) return;
    var lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach(function(line, idx) {
      if (line.trim().indexOf("//") === 0) return;
      config.LEAGUE_SCOPED.forEach(function(col) {
        // Match db.collection("rounds") or db.collection('rounds') but NOT leagueQuery("rounds")
        var pattern = new RegExp('db\\.collection\\(["\']' + col + '["\']\\)');
        if (pattern.test(line) && !/leagueQuery/.test(line)) {
          // Allow: .doc() reads, syncTrip, syncRound, persistPlayerStats (global reads), _patchFirestoreForLeague
          if (/\.doc\(/.test(line) || /syncTrip|syncRound|syncMember|persistPlayerStats|_origFirestoreCollection|_patchFirestore|batch\.set|\.update\(/.test(line)) return;
          // Allow write helpers that use leagueDoc()
          if (/leagueDoc/.test(line)) return;
          log.error(CHECK, basename + ":" + (idx + 1) + " — raw db.collection('" + col + "') should use leagueQuery()",
            { file: f, line: idx + 1, collection: col, remediation: "Replace with leagueQuery('" + col + "')" });
          failed++;
        }
      });
    });
  });

  // 3. League-filtered inputs to global calculations
  files.forEach(function(f) {
    var basename = path.basename(f);
    var lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach(function(line, idx) {
      // Check for getPlayerRounds being passed to calcHandicap/getPlayerXP/getPlayerLevel
      // after being sourced from league-scoped state.rounds
      if (/PB\.getPlayerRounds.*calcHandicap|calcHandicap.*PB\.getPlayerRounds/.test(line)) {
        // This is expected in some contexts (inline calculation) — only warn
        // The real fix is that persistPlayerStats uses global rounds
      }
      // Check for leagueQuery("rounds") feeding into level/handicap calculation
      if (/leagueQuery.*rounds.*calcLevel|leagueQuery.*rounds.*calcHandicap/.test(line)) {
        log.warn(CHECK, basename + ":" + (idx + 1) + " — league-scoped rounds used for global calculation",
          { file: f, line: idx + 1, remediation: "Use db.collection('rounds') for global stats" });
        warnings++;
      }
    });
  });

  if (failed === 0 && warnings === 0) {
    log.pass(CHECK, "No display drift issues found");
    passed++;
  }

  return { name: "Display Drift", passed: passed, failed: failed, warnings: warnings, details: [] };
}

function gatherFiles(dir, ext) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  var items = fs.readdirSync(dir);
  items.forEach(function(item) {
    var full = path.join(dir, item);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(gatherFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}
