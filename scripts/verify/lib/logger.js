// Structured logger for verify harness
var chalk = require("chalk");
var fs = require("fs");
var path = require("path");

var SEVERITY_COLORS = {
  CRITICAL: chalk.bgRed.white.bold,
  ERROR: chalk.red.bold,
  WARN: chalk.yellow,
  INFO: chalk.cyan,
  PASS: chalk.green
};

function createLogger(opts) {
  var entries = [];
  var verbose = opts && opts.verbose;
  var jsonOnly = opts && opts.json;

  function log(entry) {
    var e = Object.assign({ timestamp: new Date().toISOString() }, entry);
    entries.push(e);
    if (jsonOnly) return;
    var colorFn = SEVERITY_COLORS[e.severity] || chalk.white;
    var prefix = colorFn(" " + (e.severity || "INFO").padEnd(8) + " ");
    var msg = e.message || "";
    if (e.check) msg = chalk.dim("[" + e.check + "] ") + msg;
    if (e.severity === "PASS" && !verbose) return; // quiet passes unless verbose
    console.log(prefix + " " + msg);
    if (verbose && e.expected !== undefined) {
      console.log(chalk.dim("           expected: " + JSON.stringify(e.expected)));
      console.log(chalk.dim("           actual:   " + JSON.stringify(e.actual)));
    }
    if (verbose && e.remediation) {
      console.log(chalk.dim("           fix: " + e.remediation));
    }
  }

  function pass(check, message, extra) { log(Object.assign({ check: check, severity: "PASS", message: message }, extra || {})); }
  function info(check, message, extra) { log(Object.assign({ check: check, severity: "INFO", message: message }, extra || {})); }
  function warn(check, message, extra) { log(Object.assign({ check: check, severity: "WARN", message: message }, extra || {})); }
  function error(check, message, extra) { log(Object.assign({ check: check, severity: "ERROR", message: message }, extra || {})); }
  function critical(check, message, extra) { log(Object.assign({ check: check, severity: "CRITICAL", message: message }, extra || {})); }

  function writeLog(filepath) {
    var dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(entries, null, 2));
  }

  function getEntries() { return entries; }

  return { log: log, pass: pass, info: info, warn: warn, error: error, critical: critical, writeLog: writeLog, getEntries: getEntries };
}

module.exports = { createLogger: createLogger };
