#!/usr/bin/env node
// ========== PARBAUGHS VERIFICATION HARNESS ==========
// Read-only against production Firestore (except controlled test league cleanup).
// Detects drift, isolation leaks, display mismatches, stale data.

var path = require("path");
var chalk = require("chalk");
var _fs = require("./verify/lib/firestore");
var _log = require("./verify/lib/logger");
var config = require("./verify/config");

// Parse CLI args
var args = process.argv.slice(2);
var flags = {
  check: null,
  verbose: args.indexOf("--verbose") !== -1,
  failFast: args.indexOf("--fail-fast") !== -1,
  json: args.indexOf("--json") !== -1,
  confirmCleanup: args.indexOf("--confirm-cleanup") !== -1
};
args.forEach(function(a) {
  if (a.startsWith("--check=")) flags.check = a.split("=")[1];
});

// Load check modules
var checkModules = [
  require("./verify/checks/01-data-integrity"),
  require("./verify/checks/02-league-isolation"),
  require("./verify/checks/03-global-vs-scoped"),
  require("./verify/checks/04-economy"),
  require("./verify/checks/05-display-drift"),
  require("./verify/checks/06-query-health"),
  require("./verify/checks/07-code-pattern-scan")
];

// Filter if --check specified
if (flags.check) {
  checkModules = checkModules.filter(function(m) {
    return m.name.toLowerCase().replace(/\s+/g, "-").indexOf(flags.check.toLowerCase()) !== -1;
  });
  if (checkModules.length === 0) {
    console.error("No check matching: " + flags.check);
    console.error("Available:", ["data-integrity","league-isolation","global-vs-scoped","economy","display-drift","query-health","code-pattern-scan"].join(", "));
    process.exit(1);
  }
}

async function main() {
  var logger = _log.createLogger({ verbose: flags.verbose, json: flags.json });

  if (!flags.json) {
    console.log("");
    console.log(chalk.bold.yellow("  PARBAUGHS VERIFICATION HARNESS"));
    console.log(chalk.dim("  " + new Date().toISOString()));
    console.log("");
  }

  var ctx = {
    db: _fs.db,
    auth: _fs.auth,
    admin: _fs.admin,
    logger: logger,
    config: config,
    flags: flags
  };

  var results = [];
  var hasCritical = false;
  var hasFailure = false;

  for (var i = 0; i < checkModules.length; i++) {
    var mod = checkModules[i];
    if (!flags.json) console.log(chalk.bold("\n  Running: " + mod.name));
    if (!flags.json) console.log(chalk.dim("  " + "─".repeat(50)));

    try {
      var result = await mod.run(ctx);
      results.push(result);
      if (result.failed > 0) hasFailure = true;
    } catch (e) {
      logger.critical(mod.name, "Check crashed: " + e.message, { stack: e.stack });
      results.push({ name: mod.name, passed: 0, failed: 1, warnings: 0, details: [] });
      hasFailure = true;
      hasCritical = true;
    }

    if (flags.failFast && hasFailure) {
      logger.info("verify", "Stopping early (--fail-fast)");
      break;
    }
  }

  // Write log file
  var logDir = path.resolve(__dirname, "../logs");
  var logFile = path.join(logDir, "verify-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json");
  logger.writeLog(logFile);

  // Check for criticals in entries
  var entries = logger.getEntries();
  entries.forEach(function(e) { if (e.severity === "CRITICAL") hasCritical = true; });

  // Print summary
  if (flags.json) {
    console.log(JSON.stringify({ results: results, log: logFile, entries: entries }, null, 2));
  } else {
    printSummary(results, entries, logFile, flags);
  }

  process.exit(hasCritical ? 2 : hasFailure ? 1 : 0);
}

function printSummary(results, entries, logFile, flags) {
  console.log("\n");
  // Table
  var colW = [27, 8, 8, 10];
  var sep = "  +" + colW.map(function(w) { return "-".repeat(w + 2); }).join("+") + "+";
  var hdr = "  | " + pad("Check", colW[0]) + " | " + pad("Passed", colW[1]) + " | " + pad("Failed", colW[2]) + " | " + pad("Warnings", colW[3]) + " |";

  console.log(sep);
  console.log(hdr);
  console.log(sep);
  results.forEach(function(r) {
    var failColor = r.failed > 0 ? chalk.red.bold : chalk.green;
    var warnColor = r.warnings > 0 ? chalk.yellow : chalk.dim;
    console.log("  | " + pad(r.name, colW[0]) + " | " +
      pad(chalk.green(String(r.passed)), colW[1]) + " | " +
      pad(failColor(String(r.failed)), colW[2]) + " | " +
      pad(warnColor(String(r.warnings)), colW[3]) + " |");
  });
  console.log(sep);

  // Stale leagues
  var staleEntries = entries.filter(function(e) { return e.message && e.message.indexOf("Stale test league") !== -1; });
  if (staleEntries.length > 0) {
    console.log(chalk.yellow("\n  STALE LEAGUES DETECTED: " + staleEntries.length));
    staleEntries.forEach(function(e) { console.log(chalk.dim("    " + e.message)); });
    if (!flags.confirmCleanup) console.log(chalk.dim("    Run with --confirm-cleanup to execute"));
  }

  // Failures summary
  var failEntries = entries.filter(function(e) { return e.severity === "ERROR" || e.severity === "CRITICAL"; });
  if (failEntries.length > 0) {
    console.log(chalk.red.bold("\n  " + failEntries.length + " FAILURE(S):"));
    failEntries.forEach(function(e) {
      console.log(chalk.red("    " + (e.check ? "[" + e.check + "] " : "") + e.message));
    });
  }

  // Severity counts
  var counts = { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0, PASS: 0 };
  entries.forEach(function(e) { if (counts[e.severity] !== undefined) counts[e.severity]++; });
  console.log("\n  " + chalk.dim("Totals:") + " " +
    chalk.bgRed.white.bold(" " + counts.CRITICAL + " CRITICAL ") + " " +
    chalk.red.bold(counts.ERROR + " ERROR") + " " +
    chalk.yellow(counts.WARN + " WARN") + " " +
    chalk.green(counts.PASS + " PASS"));

  console.log(chalk.dim("\n  Full log: " + logFile + "\n"));
}

function pad(str, width) {
  // Strip ANSI for length calc
  var stripped = str.replace(/\x1B\[[0-9;]*m/g, "");
  var diff = width - stripped.length;
  return diff > 0 ? str + " ".repeat(diff) : str;
}

main().catch(function(e) {
  console.error(chalk.red("FATAL: " + e.message));
  console.error(e.stack);
  process.exit(2);
});
