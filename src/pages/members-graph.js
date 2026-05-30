// Members — Handicap graph rendering. Extracted per W1.A5 (AMD-027).
// Function: buildHandicapGraph (handicap-trend SVG + date axis + bookmarks).

function buildHandicapGraph(rounds, pid) {
  // Build monthly handicap data
  var sorted = rounds.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  if (!sorted.length) return '';

  var startDate = new Date(sorted[0].date);
  var now = new Date();
  var months = [];
  var d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (d <= now) {
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()], rounds: [] });
    d.setMonth(d.getMonth() + 1);
  }

  sorted.forEach(function(r) {
    var rd = new Date(r.date);
    var m = months.find(function(mo) { return mo.year === rd.getFullYear() && mo.month === rd.getMonth(); });
    if (m) m.rounds.push(r);
  });

  var lastHcap = null;
  var inactiveMonths = 0;
  var needsReactivation = false;
  var reactivationRounds = 0;
  var graphData = [];

  months.forEach(function(m) {
    var isSeason = m.month >= 2 && m.month <= 8;
    if (m.rounds.length > 0) {
      if (needsReactivation) {
        reactivationRounds += m.rounds.length;
        if (reactivationRounds >= 3) { needsReactivation = false; reactivationRounds = 0; }
      }
      var roundsToDate = sorted.filter(function(r) {
        var rd = new Date(r.date);
        return rd <= new Date(m.year, m.month + 1, 0);
      });
      lastHcap = PB.calcHandicap(roundsToDate);
      inactiveMonths = 0;
    } else {
      if (isSeason) inactiveMonths++;
      if (isSeason && inactiveMonths >= 3 && !needsReactivation) { needsReactivation = true; reactivationRounds = 0; }
    }
    graphData.push({ label: m.label, hcap: needsReactivation ? null : lastHcap, inactive: needsReactivation, roundCount: m.rounds.length });
  });

  if (graphData.length > 12) graphData = graphData.slice(-12);

  var validPts = graphData.filter(function(g) { return g.hcap !== null; });
  if (!validPts.length) return '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">Not enough data for graph</div>';

  // Single data point — clean text, graph builds with more months
  if (validPts.length === 1) {
    var totalRds = graphData.reduce(function(a,g){return a+g.roundCount},0);
    var result = '<div style="display:flex;justify-content:center;gap:20px;padding:8px 0;font-size:10px;color:var(--muted2)">';
    result += '<div>' + totalRds + ' qualifying round' + (totalRds !== 1 ? 's' : '') + '</div>';
    result += '<div style="color:var(--birdie)">Tap Score Differentials below for details</div>';
    result += '</div>';
    result += '<div style="text-align:center;font-size:10px;color:var(--muted);padding:4px 0 8px">Trend graph builds as you play across multiple months</div>';
    return result;
  }

  // v8.23.56 — "Nice" integer-step Y domain so gridlines land on evenly spaced
  // whole strokes. The old floor/ceil(+/-2) bounds fed fractional ticks through
  // toFixed(0), which rounded unevenly (e.g. 23,21.75,20.5,19.25,18 rendered as
  // "23,22,21,19,18", silently skipping 20) and misrepresented the axis. Centering
  // the data in an integer-stepped domain also keeps a steady handicap as a
  // centered flat line instead of one stranded near the top of an over-padded card.
  var gridSteps = 4;
  var hcaps = validPts.map(function(g) { return g.hcap; });
  var dataMin = Math.min.apply(null, hcaps);
  var dataMax = Math.max.apply(null, hcaps);
  var stepH = Math.max(1, Math.ceil(((dataMax + 1) - (dataMin - 1)) / gridSteps));
  var midH = (dataMin + dataMax) / 2;
  var minH = Math.round(midH - (stepH * gridSteps) / 2);
  var maxH = minH + stepH * gridSteps;
  var range = maxH - minH;

  var svgW = 320, svgH = 165, padL = 32, padR = 14, padT = 22, padB = 40;
  var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
  var gradId = "hcapGrad_" + pid;

  // v8.14.4 (Approach B) — viewBox + width:100% + FIXED pixel height with
  // preserveAspectRatio="none". Prevents v8.14.3 proportional-height blow-up
  // at wide containers. Month labels (line ~1062) sit inside padL=32 / padR=14
  // padding so edge-anchor fix from svgLineChart is NOT needed here — labels
  // never reach viewBox edges. text-anchor="middle" stays correct for monthly
  // bin labels.
  var svg = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" preserveAspectRatio="none" style="width:100%;height:' + svgH + 'px;display:block">';

  // Gradient definition for area fill
  svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">';
  svg += '<stop offset="0%" stop-color="rgba(var(--gold-rgb),.25)"/>';
  svg += '<stop offset="100%" stop-color="rgba(var(--gold-rgb),0)"/>';
  svg += '</linearGradient></defs>';

  // Dashed grid lines + Y-axis labels (gridSteps + integer domain computed above)
  for (var g = 0; g <= gridSteps; g++) {
    var gy = padT + (chartH / gridSteps) * g;
    var val = maxH - (range / gridSteps) * g;
    svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (svgW - padR) + '" y2="' + gy + '" stroke="rgba(255,255,255,.06)" stroke-width=".5" stroke-dasharray="3,3"/>';
    svg += '<text x="' + (padL - 5) + '" y="' + (gy + 3) + '" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="7.5" font-weight="500">' + val.toFixed(0) + '</text>';
  }

  // Month labels + round count
  graphData.forEach(function(pt, i) {
    var x = padL + (chartW / (graphData.length - 1 || 1)) * i;
    var isActive = pt.hcap !== null;
    svg += '<text x="' + x + '" y="' + (svgH - 16) + '" text-anchor="middle" fill="' + (isActive ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)') + '" font-size="7" font-weight="500">' + pt.label + '</text>';
    if (pt.roundCount > 0) {
      svg += '<text x="' + x + '" y="' + (svgH - 6) + '" text-anchor="middle" fill="rgba(var(--gold-rgb),.4)" font-size="6" font-weight="500">' + pt.roundCount + ' rd' + (pt.roundCount !== 1 ? 's' : '') + '</text>';
    }
  });

  // Build coordinate arrays
  var coords = [];
  graphData.forEach(function(pt, i) {
    if (pt.hcap === null) return;
    var x = padL + (chartW / (graphData.length - 1 || 1)) * i;
    var y = padT + chartH - ((pt.hcap - minH) / range) * chartH;
    coords.push({ x: x, y: y, hcap: pt.hcap, label: pt.label, inactive: pt.inactive, isLast: false });
  });
  if (coords.length) coords[coords.length - 1].isLast = true;

  // Area fill (gradient under line)
  if (coords.length > 1) {
    var areaPath = 'M' + coords[0].x + ',' + coords[0].y;
    for (var ai = 1; ai < coords.length; ai++) areaPath += 'L' + coords[ai].x + ',' + coords[ai].y;
    areaPath += 'L' + coords[coords.length-1].x + ',' + (padT + chartH) + 'L' + coords[0].x + ',' + (padT + chartH) + 'Z';
    svg += '<path d="' + areaPath + '" fill="url(#' + gradId + ')"/>';
  }

  // Line path
  if (coords.length > 1) {
    var linePath = 'M' + coords[0].x + ',' + coords[0].y;
    for (var li = 1; li < coords.length; li++) linePath += 'L' + coords[li].x + ',' + coords[li].y;
    svg += '<path d="' + linePath + '" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  }

  // Dots with value labels
  coords.forEach(function(pt) {
    var dotR = pt.isLast ? 4 : 3;
    var dotColor = pt.inactive ? 'var(--red)' : 'var(--gold)';
    // Glow ring on current month
    if (pt.isLast) {
      svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="8" fill="rgba(var(--gold-rgb),.12)" stroke="none"/>';
    }
    svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="' + dotR + '" fill="' + dotColor + '" stroke="var(--bg)" stroke-width="1.5"/>';
    // Value label above dot
    svg += '<text x="' + pt.x + '" y="' + (pt.y - 8) + '" text-anchor="middle" fill="' + (pt.isLast ? 'var(--gold)' : 'rgba(255,255,255,.5)') + '" font-size="' + (pt.isLast ? '8' : '7') + '" font-weight="' + (pt.isLast ? '700' : '500') + '">' + pt.hcap.toFixed(1) + '</text>';
  });

  svg += '</svg>';

  // v8.14.5 — chart-container wrapper for 720px max-width cap (components.css).
  // Legend + trend status divs appended after stay outside .chart-container
  // so they keep full-width treatment. Members profile buildHandicapGraph
  // remains untoggled per v8.14.4 Q-RULING-A (handicap monthly aggregation
  // doesn't fit naive filter-before-compute semantics).
  var result = '<div class="chart-container" style="padding:4px 0 0">' + svg + '</div>';

  // Compact legend
  result += '<div style="display:flex;justify-content:center;gap:16px;padding:2px 12px 8px;font-size:9px;color:var(--muted2)">';
  result += '<span>● Index over time</span>';
  result += '<span style="color:var(--birdie)">↓ Lower = better</span>';
  var totalGraphRounds = graphData.reduce(function(a,g){return a+g.roundCount},0);
  result += '<span>' + totalGraphRounds + ' round' + (totalGraphRounds !== 1 ? 's' : '') + '</span>';
  result += '</div>';

  // Trend status
  var currentHcap = graphData[graphData.length - 1];
  if (currentHcap.inactive) {
    result += '<div style="padding:8px 12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);font-size:11px;color:var(--red);margin-top:2px">Inactive, log 3 rounds to reactivate handicap</div>';
  } else if (validPts.length >= 2) {
    var first = validPts[0].hcap, last = validPts[validPts.length - 1].hcap;
    var diff = last - first;
    var trend = diff < -1 ? '↓ Improving' : diff > 1 ? '↑ Rising' : '→ Steady';
    var trendColor = diff < -1 ? 'var(--birdie)' : diff > 1 ? 'var(--red)' : 'var(--gold)';
    var trendDiff = diff < 0 ? diff.toFixed(1) : '+' + diff.toFixed(1);
    result += '<div style="text-align:center;font-size:11px;color:' + trendColor + ';letter-spacing:.3px">' + trend + ' <span style="font-weight:600">(' + trendDiff + ')</span></div>';
  }

  return result;
}

