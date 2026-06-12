var fs = require('fs');
var data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var results = (data.result && data.result.results) || data.results || [];
console.log('PAGES:', results.length);
console.log('=== SCORES (low to high) ===');
results.slice().sort(function (a, b) { return a.score - b.score; }).forEach(function (r) {
  console.log('  ' + r.score + '  ' + r.page + (r.rendersRealData ? '' : '  [NO DATA]'));
});
['critical', 'high'].forEach(function (sev) {
  var rows = [];
  results.forEach(function (r) { (r.issues || []).forEach(function (it) { if (it.severity === sev) rows.push({ p: r.page, d: it.dimension, w: it.what, f: it.fix }); }); });
  console.log('\n=== ' + sev.toUpperCase() + ' (' + rows.length + ') ===');
  rows.forEach(function (it) {
    console.log('* [' + it.p + '/' + it.d + '] ' + (it.w || '').replace(/\s+/g, ' ').slice(0, 150));
    console.log('   FIX: ' + (it.f || '').replace(/\s+/g, ' ').slice(0, 150));
  });
});
