/* ═══════════════════════════════════════════════════════════════════════════
   CHARTS — Vanilla SVG chart generators for analytics dashboards
   Zero dependencies. Theme-aware via CSS variables. Inline SVG output.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Bar Chart ──
// data: [{label, value, color?}], options: {width, height, barGap, showLabels, showValues, baseline?}
function svgBarChart(data, options) {
  var o = Object.assign({width:320, height:140, barGap:4, showLabels:true, showValues:true, baseline:null}, options || {});
  if (!data || !data.length) return '';
  data = data.filter(function(d){return Number.isFinite(d.value)});
  if (!data.length) return '';
  var maxVal = Math.max.apply(null, data.map(function(d){return Math.abs(d.value)}));
  if (maxVal === 0) maxVal = 1;
  var barW = Math.floor((o.width - (data.length - 1) * o.barGap) / data.length);
  var chartH = o.height - (o.showLabels ? 20 : 0) - (o.showValues ? 16 : 0);
  var hasNeg = data.some(function(d){return d.value < 0});
  var zeroY = hasNeg ? chartH / 2 + (o.showValues ? 16 : 0) : chartH + (o.showValues ? 16 : 0);

  // v8.14.4 (Approach B) — viewBox + width:100% + FIXED pixel height.
  // preserveAspectRatio="none" lets x-axis fill container width while y-axis
  // stays at the declared o.height pixels. Data charts have independent x
  // (time) and y (value) dimensions; aspect distortion is fine and preferred
  // — prevents the v8.14.3 proportional-height blow-up at wide containers.
  // See P16 memory rule (refined v8.14.4) for icon-vs-data-chart distinction.
  var svg = '<svg viewBox="0 0 ' + o.width + ' ' + o.height + '" preserveAspectRatio="none" style="width:100%;height:' + o.height + 'px;display:block">';

  // Baseline
  if (o.baseline !== null || hasNeg) {
    svg += '<line x1="0" y1="' + zeroY + '" x2="' + o.width + '" y2="' + zeroY + '" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2"/>';
  }

  data.forEach(function(d, i) {
    var x = i * (barW + o.barGap);
    var barH = Math.abs(d.value) / maxVal * (hasNeg ? chartH / 2 : chartH);
    var color = d.color || (d.value >= 0 ? 'var(--birdie)' : 'var(--red)');
    var y = d.value >= 0 ? zeroY - barH : zeroY;
    var radius = Math.min(3, barW / 4);

    svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(barH, 1) + '" rx="' + radius + '" fill="' + color + '" opacity=".85"/>';

    if (o.showValues) {
      var valY = d.value >= 0 ? y - 4 : y + barH + 12;
      var valStr = d.value > 0 ? '+' + (Math.round(d.value * 10) / 10) : (Math.round(d.value * 10) / 10);
      svg += '<text x="' + (x + barW / 2) + '" y="' + valY + '" text-anchor="middle" fill="' + color + '" font-size="9" font-weight="600" font-family="Inter,sans-serif">' + valStr + '</text>';
    }

    if (o.showLabels) {
      svg += '<text x="' + (x + barW / 2) + '" y="' + (o.height - 2) + '" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="Inter,sans-serif">' + (d.label || '') + '</text>';
    }
  });

  svg += '</svg>';
  return svg;
}

// ── Line Chart ──
// data: [{label, value}], options: {width, height, color, showDots, showArea, yMin?, yMax?}
function svgLineChart(data, options) {
  var o = Object.assign({width:320, height:120, color:'var(--gold)', showDots:true, showArea:true}, options || {});
  if (!data || data.length < 2) return '';
  data = data.filter(function(d){return Number.isFinite(d.value)});
  if (data.length < 2) return '';
  var values = data.map(function(d){return d.value});
  var yMin = o.yMin !== undefined ? o.yMin : Math.min.apply(null, values) - 2;
  var yMax = o.yMax !== undefined ? o.yMax : Math.max.apply(null, values) + 2;
  var range = yMax - yMin || 1;
  var padTop = 12, padBot = 20, padLeft = 0, padRight = 0;
  var chartW = o.width - padLeft - padRight;
  var chartH = o.height - padTop - padBot;

  function px(i) { return padLeft + (i / (data.length - 1)) * chartW; }
  function py(v) { return padTop + (1 - (v - yMin) / range) * chartH; }

  // v8.14.4 (Approach B) — viewBox + width:100% + FIXED pixel height with
  // preserveAspectRatio="none". Same data-chart pattern as svgBarChart above.
  var svg = '<svg viewBox="0 0 ' + o.width + ' ' + o.height + '" preserveAspectRatio="none" style="width:100%;height:' + o.height + 'px;display:block">';

  // Grid lines
  for (var gi = 0; gi <= 3; gi++) {
    var gy = padTop + (gi / 3) * chartH;
    svg += '<line x1="' + padLeft + '" y1="' + gy + '" x2="' + (o.width - padRight) + '" y2="' + gy + '" stroke="var(--border)" stroke-width=".5" opacity=".3"/>';
  }

  // Area fill
  if (o.showArea) {
    var areaPath = 'M' + px(0) + ',' + py(data[0].value);
    for (var ai = 1; ai < data.length; ai++) areaPath += 'L' + px(ai) + ',' + py(data[ai].value);
    areaPath += 'L' + px(data.length-1) + ',' + (padTop + chartH) + 'L' + px(0) + ',' + (padTop + chartH) + 'Z';
    svg += '<path d="' + areaPath + '" fill="' + o.color + '" opacity=".08"/>';
  }

  // Line
  var linePath = 'M' + px(0) + ',' + py(data[0].value);
  for (var li = 1; li < data.length; li++) linePath += 'L' + px(li) + ',' + py(data[li].value);
  svg += '<path d="' + linePath + '" fill="none" stroke="' + o.color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  // Dots
  if (o.showDots) {
    data.forEach(function(d, i) {
      svg += '<circle cx="' + px(i) + '" cy="' + py(d.value) + '" r="3" fill="' + o.color + '" stroke="var(--bg)" stroke-width="1.5"/>';
    });
  }

  // X labels (first, middle, last)
  // v8.14.4 — first label uses text-anchor="start" + last uses text-anchor="end"
  // so labels don't half-overflow viewBox edges. Middle label keeps "middle"
  // anchor for natural centering. Edge anchoring keeps labels readable at
  // narrow chart widths where viewBox=0 sits at the literal left edge.
  if (data.length >= 3) {
    var lastIdx = data.length - 1;
    [0, Math.floor(data.length/2), lastIdx].forEach(function(idx) {
      if (!data[idx].label) return;
      var anchor = idx === 0 ? 'start' : (idx === lastIdx ? 'end' : 'middle');
      svg += '<text x="' + px(idx) + '" y="' + (o.height - 2) + '" text-anchor="' + anchor + '" fill="var(--muted)" font-size="8" font-family="Inter,sans-serif">' + data[idx].label + '</text>';
    });
  }

  svg += '</svg>';
  return svg;
}

// ── Horizontal Bar Chart (for stat comparisons) ──
// data: [{label, value, maxValue?, color?}]
function svgHorizontalBars(data, options) {
  var o = Object.assign({width:280, barHeight:18, gap:8, showValues:true}, options || {});
  if (!data || !data.length) return '';
  data = data.filter(function(d){return Number.isFinite(d.value)});
  if (!data.length) return '';
  var maxVal = Math.max.apply(null, data.map(function(d){return d.maxValue || d.value}));
  if (maxVal === 0) maxVal = 1;
  var totalH = data.length * (o.barHeight + o.gap) - o.gap;

  // v8.14.4 (Approach B) — viewBox + width:100% + FIXED pixel height (totalH
  // computed from data length). preserveAspectRatio="none" matches sibling
  // helpers; horizontal bars distort gracefully on x-axis if container exceeds
  // o.width while bar heights stay readable.
  var svg = '<svg viewBox="0 0 ' + o.width + ' ' + totalH + '" preserveAspectRatio="none" style="width:100%;height:' + totalH + 'px;display:block">';
  var labelW = 50;
  var barAreaW = o.width - labelW - (o.showValues ? 40 : 0);

  data.forEach(function(d, i) {
    var y = i * (o.barHeight + o.gap);
    var barW = (d.value / maxVal) * barAreaW;
    var color = d.color || 'var(--gold)';
    svg += '<text x="' + (labelW - 4) + '" y="' + (y + o.barHeight / 2 + 4) + '" text-anchor="end" fill="var(--muted)" font-size="9" font-family="Inter,sans-serif">' + (d.label || '') + '</text>';
    svg += '<rect x="' + labelW + '" y="' + y + '" width="' + barAreaW + '" height="' + o.barHeight + '" rx="3" fill="var(--bg3)" opacity=".5"/>';
    svg += '<rect x="' + labelW + '" y="' + y + '" width="' + Math.max(barW, 2) + '" height="' + o.barHeight + '" rx="3" fill="' + color + '" opacity=".8"/>';
    if (o.showValues) {
      svg += '<text x="' + (labelW + barAreaW + 4) + '" y="' + (y + o.barHeight / 2 + 4) + '" fill="var(--cream)" font-size="10" font-weight="600" font-family="Inter,sans-serif">' + (Math.round(d.value * 10) / 10) + (d.suffix || '') + '</text>';
    }
  });

  svg += '</svg>';
  return svg;
}

/* ── Hole Heat Map (CLUBHOUSE_SPEC-HQ-3r) ────────────────────────────────────
   Editorial per-hole heat map over calcCourseBreakdown() output. Categorical
   tiers (under / at / over par) — magnitude lives in the optional number, never
   in saturation. Cell tint opacity carries a consistency signal (std dev of raw
   hole scores). Cells are keyboard-focusable gridcells; click opens a per-hole
   detail sheet (best/worst/consistency + per-round list). Used by Round History
   and member-detail Stats. All viz tokens are editorial --cb-*. */
var _hmSeq = 0;

function _hmTier(diff) {
  if (diff <= -0.5) return 'under';
  if (diff >= 0.5) return 'over';
  return 'par';
}
function _hmVarMult(count, std) {
  // count is >= 2 (calcCourseBreakdown filters count>=2). 5+ rounds gets full
  // weight when steady (std<=1), pulled back to 70% when streaky; 2-4 = 90%.
  if (count >= 5) return std > 1 ? 0.7 : 1.0;
  return 0.9;
}
function _hmDiffLabel(diff) {
  var d = Math.round(diff * 10) / 10;
  if (d > 0) return '+' + d;
  if (d < 0) return '' + d;
  return 'E';
}
function _hmShortDate(d) {
  if (!d || d.length < 10) return '';
  var mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var mo = parseInt(d.substring(5,7)) - 1, day = parseInt(d.substring(8,10));
  if (isNaN(mo) || mo < 0 || mo > 11 || isNaN(day)) return '';
  return mn[mo] + ' ' + day;
}

function _hmCellHTML(hmId, hole, n) {
  if (!hole) {
    return '<div class="hm-cell hm-cell--empty" role="gridcell" aria-label="Hole ' + n + ', no data">'
      + '<span class="hm-cell__hole">' + n + '</span></div>';
  }
  var tier = _hmTier(hole.diff);
  var base = tier === 'par' ? 0.3 : 0.8;
  var alpha = Math.round(base * _hmVarMult(hole.count, hole.std) * 100) / 100;
  var fill = tier === 'under' ? 'var(--cb-moss)' : tier === 'over' ? 'var(--cb-claret)' : 'var(--cb-ink-faint)';
  var aria = 'Hole ' + n + ', par ' + hole.par + ', you average ' + hole.avg + ', '
    + (tier === 'par' ? 'around par' : (Math.abs(hole.diff) + ' ' + (tier === 'under' ? 'under' : 'over') + ' par'))
    + ', across ' + hole.count + ' rounds. Open detail.';
  return '<div class="hm-cell hm-cell--' + tier + '" role="gridcell" tabindex="0"'
    + ' style="--hm-fill:' + fill + ';--hm-alpha:' + alpha + '"'
    + ' aria-label="' + aria + '"'
    + ' onclick="_hmCellClick(\'' + hmId + '\',' + n + ')"'
    + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();_hmCellClick(\'' + hmId + '\',' + n + ')}">'
    + '<span class="hm-cell__fill" aria-hidden="true"></span>'
    + '<span class="hm-cell__hole">' + n + '</span>'
    + '<span class="hm-cell__val">' + _hmDiffLabel(hole.diff) + '</span>'
    + '</div>';
}
function _hmRowHTML(hmId, holesByNum, fromHole, toHole, label) {
  var html = '<div class="hm__rowlabel" aria-hidden="true">' + label + '</div>';
  for (var n = fromHole; n <= toHole; n++) html += _hmCellHTML(hmId, holesByNum[n], n);
  return html;
}
function _hmStat(value, label) {
  return '<div class="hm__stat"><div class="hm__stat-val">' + value + '</div><div class="hm__stat-label">' + label + '</div></div>';
}

// breakdown: calcCourseBreakdown() output. opts: {showNumbers=true, linkRounds=false}
function renderHeatMap(breakdown, opts) {
  if (!breakdown || !breakdown.holes || !breakdown.holes.length) return '';
  opts = opts || {};
  var holeCount = breakdown.holeCount || 18;
  var hmId = 'hm' + (++_hmSeq);
  var holesByNum = {};
  breakdown.holes.forEach(function(hh) { holesByNum[hh.hole] = hh; });
  if (typeof window !== 'undefined') {
    window._hmRegistry = window._hmRegistry || {};
    window._hmRegistry[hmId] = { course: breakdown.course, holeCount: holeCount, linkRounds: !!opts.linkRounds, holesByNum: holesByNum };
  }
  var showNums = opts.showNumbers !== false;

  var h = '<div class="hm' + (showNums ? ' hm--nums' : '') + '" id="' + hmId + '">';
  h += '<div class="hm__head">';
  h += '<div class="hm__head-id"><div class="hm__eyebrow">Hole heat map</div>';
  h += '<div class="hm__course">' + escHtml(breakdown.course) + '</div></div>';
  h += '<button type="button" class="hm__toggle" aria-pressed="' + (showNums ? 'true' : 'false') + '" onclick="_hmToggleNums(\'' + hmId + '\',this)">' + (showNums ? 'Numbers on' : 'Numbers off') + '</button>';
  h += '</div>';

  h += '<div class="hm__grid hm__grid--' + holeCount + '" role="grid" aria-label="Per-hole scoring heat map for ' + escHtml(breakdown.course) + '">';
  if (holeCount >= 18) {
    h += _hmRowHTML(hmId, holesByNum, 1, 9, 'OUT');
    h += _hmRowHTML(hmId, holesByNum, 10, 18, 'IN');
  } else {
    h += _hmRowHTML(hmId, holesByNum, 1, 9, '');
  }
  h += '</div>';

  h += '<div class="hm__legend">'
    + '<span class="hm__legend-item"><span class="hm__sw hm__sw--under"></span>Under par</span>'
    + '<span class="hm__legend-item"><span class="hm__sw hm__sw--par"></span>At par</span>'
    + '<span class="hm__legend-item"><span class="hm__sw hm__sw--over"></span>Over par</span>'
    + '</div>';

  var tough = breakdown.holes.slice().sort(function(a, b) { return b.diff - a.diff; })[0];
  h += '<div class="hm__summary">';
  h += _hmStat(breakdown.rounds, 'Rounds');
  h += _hmStat(breakdown.avgScore != null ? breakdown.avgScore : '—', 'Avg score');
  h += _hmStat(breakdown.bestScore != null ? breakdown.bestScore : '—', breakdown.bestDate ? ('Best · ' + _hmShortDate(breakdown.bestDate)) : 'Best');
  h += _hmStat(tough ? ('#' + tough.hole) : '—', tough ? ('Toughest ' + _hmDiffLabel(tough.diff)) : 'Toughest');
  h += '</div>';
  h += '</div>';
  return h;
}

// 3r.4 — locked/empty state. plays = rounds WITH hole-by-hole scores logged at
// this course so far (<3). Counts hole-by-hole rounds, not total-score rounds, so
// the copy must say so: a member may have played the course but logged only totals.
function renderHeatMapLocked(courseName, plays) {
  var pct = Math.max(0, Math.min(100, Math.round((plays / 3) * 100)));
  var safe = escHtml(courseName || 'this course');
  var h = '<div class="hm hm--locked">';
  h += '<div class="hm__lock-badge" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>';
  h += '<div class="hm__lock-title">Heat map unlocks at 3 rounds</div>';
  h += '<div class="hm__lock-copy">Log hole-by-hole scores at <strong>' + safe + '</strong> three times and your heat map appears here.</div>';
  h += '<div class="hm__lock-progress">' + plays + ' of 3 hole-by-hole rounds</div>';
  h += '<div class="hm__lock-bar"><span style="width:' + pct + '%"></span></div>';
  h += '</div>';
  return h;
}

function _hmCellDetailHTML(hole, reg) {
  var tier = _hmTier(hole.diff);
  var h = '<div class="hm-detail">';
  h += '<div class="hm-detail__hero">';
  h += '<div class="hm-detail__avg">' + hole.avg + '</div>';
  h += '<div class="hm-detail__avg-meta">avg · par ' + hole.par + ' · <span class="hm-detail__diff hm-detail__diff--' + tier + '">' + _hmDiffLabel(hole.diff) + '</span></div>';
  h += '</div>';
  h += '<div class="hm-detail__strip">';
  h += '<div class="hm-detail__cell"><div class="hm-detail__k">Best</div><div class="hm-detail__v">' + hole.best.score + '</div></div>';
  h += '<div class="hm-detail__cell"><div class="hm-detail__k">Worst</div><div class="hm-detail__v">' + hole.worst.score + '</div></div>';
  h += '<div class="hm-detail__cell"><div class="hm-detail__k">Consistency</div><div class="hm-detail__v">' + (hole.std <= 1 ? 'Steady' : 'Streaky') + '</div></div>';
  h += '</div>';
  h += '<div class="hm-detail__list-head">' + hole.samples.length + ' rounds at hole ' + hole.hole + '</div>';
  h += '<div class="hm-detail__list">';
  hole.samples.forEach(function(s) {
    var d = s.score - s.par;
    var dl = d > 0 ? '+' + d : (d < 0 ? '' + d : 'E');
    var dt = _hmTier(d);
    var canLink = reg.linkRounds && s.roundId;
    var open = canLink
      ? '<button type="button" class="hm-detail__round hm-detail__round--link" onclick="closeBottomSheet();Router.go(\'rounds\',{roundId:\'' + escHtml(s.roundId) + '\'})">'
      : '<div class="hm-detail__round">';
    var close = canLink ? '</button>' : '</div>';
    h += open
      + '<span class="hm-detail__round-date">' + (_hmShortDate(s.date) || escHtml(s.date) || 'Round') + '</span>'
      + '<span class="hm-detail__round-score">' + s.score + '</span>'
      + '<span class="hm-detail__round-diff hm-detail__diff--' + dt + '">' + dl + '</span>'
      + (canLink ? '<span class="hm-detail__round-go" aria-hidden="true">→</span>' : '')
      + close;
  });
  h += '</div></div>';
  return h;
}
function _hmCellClick(hmId, holeNum) {
  var reg = (typeof window !== 'undefined' && window._hmRegistry) ? window._hmRegistry[hmId] : null;
  if (!reg) return;
  var hole = reg.holesByNum[holeNum];
  if (!hole || typeof openBottomSheet !== 'function') return;
  openBottomSheet({ size: 'compact', title: 'Hole ' + holeNum + ' · ' + reg.course, content: _hmCellDetailHTML(hole, reg) });
}
function _hmToggleNums(hmId, btn) {
  var el = document.getElementById(hmId);
  if (!el) return;
  var on = el.classList.toggle('hm--nums');
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.textContent = on ? 'Numbers on' : 'Numbers off';
}
