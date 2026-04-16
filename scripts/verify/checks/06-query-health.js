// Check 06: Query Health
// Verifies composite indexes exist for all leagueQuery().orderBy() combinations
// Checks for untracked snapshot listeners

var fs = require("fs");
var path = require("path");

module.exports = { name: "Query Health", run: run };

async function run(ctx) {
  var log = ctx.logger, config = ctx.config;
  var passed = 0, failed = 0, warnings = 0;
  var CHECK = "query-health";

  // 1. Parse firestore.indexes.json
  var indexPath = path.resolve(__dirname, "../../../firestore.indexes.json");
  var indexes = [];
  try {
    var indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    indexes = indexData.indexes || [];
  } catch (e) {
    log.critical(CHECK, "Cannot read firestore.indexes.json: " + e.message);
    failed++;
    return { name: "Query Health", passed: 0, failed: 1, warnings: 0, details: [] };
  }

  log.info(CHECK, "Loaded " + indexes.length + " composite indexes from firestore.indexes.json");

  // Build index lookup: collection -> [field combinations]
  var indexLookup = {};
  indexes.forEach(function(idx) {
    var col = idx.collectionGroup;
    if (!indexLookup[col]) indexLookup[col] = [];
    var fields = idx.fields.map(function(f) { return f.fieldPath; });
    indexLookup[col].push(fields);
  });

  // 2. Scan source for .where().orderBy() on league-scoped collections
  var srcDir = path.resolve(__dirname, "../../../src");
  var files = gatherFiles(srcDir, ".js");
  var requiredIndexes = []; // {collection, fields[], file, line}

  files.forEach(function(f) {
    var basename = path.basename(f);
    var content = fs.readFileSync(f, "utf8");
    var lines = content.split("\n");

    lines.forEach(function(line, idx) {
      // Match leagueQuery("X").orderBy("Y") or leagueQuery("X").where("A").orderBy("Y")
      var lqMatch = line.match(/leagueQuery\(['"]([\w]+)['"]\)/);
      if (!lqMatch) return;
      var col = lqMatch[1];

      // Extract orderBy fields
      var orderBys = [];
      var obMatches = line.match(/\.orderBy\(['"](\w+)['"]/g);
      if (obMatches) {
        obMatches.forEach(function(m) {
          var field = m.match(/['"](\w+)['"]/);
          if (field) orderBys.push(field[1]);
        });
      }

      // Extract additional where fields (beyond leagueId)
      var wheres = [];
      var wMatches = line.match(/\.where\(['"](\w+)['"]/g);
      if (wMatches) {
        wMatches.forEach(function(m) {
          var field = m.match(/['"](\w+)['"]/);
          if (field && field[1] !== "leagueId") wheres.push(field[1]);
        });
      }

      if (orderBys.length > 0) {
        // Required index: leagueId + ...wheres + ...orderBys
        var neededFields = ["leagueId"].concat(wheres).concat(orderBys);
        requiredIndexes.push({ collection: col, fields: neededFields, file: basename, line: idx + 1 });
      }
    });
  });

  // 3. Check each required index exists
  var seen = {};
  requiredIndexes.forEach(function(req) {
    var key = req.collection + ":" + req.fields.join(",");
    if (seen[key]) return; // dedupe
    seen[key] = true;

    var colIndexes = indexLookup[req.collection] || [];
    var found = colIndexes.some(function(idx) {
      // Check if index fields cover the required fields (order matters for prefix)
      if (idx.length < req.fields.length) return false;
      for (var fi = 0; fi < req.fields.length; fi++) {
        if (idx[fi] !== req.fields[fi]) return false;
      }
      return true;
    });

    if (found) {
      log.pass(CHECK, "Index exists: " + req.collection + " [" + req.fields.join(", ") + "]");
      passed++;
    } else {
      log.critical(CHECK, "MISSING INDEX: " + req.collection + " [" + req.fields.join(", ") + "] (from " + req.file + ":" + req.line + ")",
        { collection: req.collection, fields: req.fields, file: req.file, line: req.line,
          remediation: "Add composite index to firestore.indexes.json and deploy" });
      failed++;
    }
  });

  // 4. Scan for onSnapshot listeners
  var listenerCount = 0;
  var untrackedCount = 0;
  files.forEach(function(f) {
    var basename = path.basename(f);
    var lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach(function(line, idx) {
      if (/\.onSnapshot\(/.test(line)) {
        listenerCount++;
        // Check if the listener is assigned to a variable or window property for cleanup
        // Also check the preceding line (multi-line chaining)
        var prevLine = idx > 0 ? lines[idx - 1] : "";
        var prevLine2 = idx > 1 ? lines[idx - 2] : "";
        var combined = prevLine2 + " " + prevLine + " " + line;
        if (!/=\s*.*\.onSnapshot|window\.\w+\s*=/.test(combined) && !/_\w+Listener\s*=/.test(combined) && !/Unsub\s*=/.test(combined)) {
          log.warn(CHECK, basename + ":" + (idx + 1) + " — onSnapshot listener may not be tracked for cleanup",
            { file: f, line: idx + 1, remediation: "Store return value for unsubscribe on league switch" });
          untrackedCount++;
          warnings++;
        }
      }
    });
  });
  log.info(CHECK, "Found " + listenerCount + " snapshot listeners, " + untrackedCount + " potentially untracked");

  return { name: "Query Health", passed: passed, failed: failed, warnings: warnings, details: [] };
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
