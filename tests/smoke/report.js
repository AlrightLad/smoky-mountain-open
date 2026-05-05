// Render a pass/fail matrix from a smoke run's results.json files.
// Used by run.js at end of run; can also be invoked standalone:
//   node tests/smoke/report.js tests/smoke/output/<timestamp>

const fs = require('fs');
const path = require('path');

function loadRun(runDir) {
  var browsers = fs.readdirSync(runDir).filter(function(f) {
    return fs.statSync(path.join(runDir, f)).isDirectory();
  });
  var data = {};
  browsers.forEach(function(b) {
    var p = path.join(runDir, b, 'results.json');
    if (fs.existsSync(p)) {
      data[b] = JSON.parse(fs.readFileSync(p, 'utf8'));
    } else {
      data[b] = { error: 'missing results.json' };
    }
  });
  return { browsers: browsers, data: data };
}

function pad(s, n) {
  s = String(s);
  while (s.length < n) s += ' ';
  return s;
}

function render(runDir) {
  var loaded = loadRun(runDir);
  var browsers = loaded.browsers;
  var data = loaded.data;

  // Collect scenario IDs across all browsers (intersection + union).
  var idSet = {};
  browsers.forEach(function(b) {
    var r = data[b];
    if (r.results) r.results.forEach(function(s) { idSet[s.id] = s.name; });
  });
  var ids = Object.keys(idSet);

  var lines = [];
  lines.push('');
  lines.push('SMOKE REPORT — ' + path.basename(runDir));
  lines.push('='.repeat(70));
  lines.push('');

  // Header
  var idCol = 4;
  var nameCol = 40;
  var browserCol = 10;
  var hdr = pad('ID', idCol) + pad('Scenario', nameCol);
  browsers.forEach(function(b) { hdr += pad(b, browserCol); });
  lines.push(hdr);
  lines.push('-'.repeat(hdr.length));

  // Rows
  ids.forEach(function(id) {
    var name = idSet[id];
    var truncName = name.length > nameCol - 1 ? name.substring(0, nameCol - 4) + '... ' : name;
    var row = pad(id, idCol) + pad(truncName, nameCol);
    browsers.forEach(function(b) {
      var r = data[b];
      var s = (r.results || []).find(function(x) { return x.id === id; });
      var cell;
      if (!s) cell = '—';
      else if (s.passed) cell = 'PASS';
      else cell = 'FAIL';
      row += pad(cell, browserCol);
    });
    lines.push(row);
  });

  // Footer summary per browser
  lines.push('-'.repeat(hdr.length));
  var summaryRow = pad('', idCol) + pad('TOTAL pass / total', nameCol);
  browsers.forEach(function(b) {
    var r = data[b];
    if (r.error) {
      summaryRow += pad('ERR', browserCol);
    } else {
      var total = (r.results || []).length;
      var passed = (r.results || []).filter(function(s) { return s.passed; }).length;
      summaryRow += pad(passed + '/' + total, browserCol);
    }
  });
  lines.push(summaryRow);
  lines.push('');

  // Failure details
  var anyFail = false;
  browsers.forEach(function(b) {
    var r = data[b];
    if (!r.results) return;
    r.results.forEach(function(s) {
      if (!s.passed) {
        if (!anyFail) {
          lines.push('FAILURES');
          lines.push('-'.repeat(70));
          anyFail = true;
        }
        lines.push('[' + b + '] ' + s.id + ' — ' + s.name);
        if (s.error) lines.push('  ' + s.error);
      }
    });
  });
  if (anyFail) lines.push('');

  return lines.join('\n');
}

if (require.main === module) {
  var runDir = process.argv[2];
  if (!runDir) {
    console.error('Usage: node tests/smoke/report.js <run-dir>');
    process.exit(2);
  }
  console.log(render(runDir));
}

module.exports = { render, loadRun };
