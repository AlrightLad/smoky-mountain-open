// Home — Charts: season position strip + handicap trend chart + series.
// Extracted per W1.A5 (AMD-027).

function _renderSeasonPositionStrip(ctx) {
  var season = ctx.season;
  var standings = (season && season.standings) || [];
  var uid = currentUser ? currentUser.uid : null;
  var claimedFrom = currentProfile ? currentProfile.claimedFrom : null;
  var myIdx = standings.findIndex(function(s){ return s.id === uid || s.id === claimedFrom; });
  var weekInfo = _hqWeekNum(season);
  var label = (season && season.label) ? season.label.toUpperCase() : "SEASON";
  var eyebrow = label + " · WEEK " + weekInfo.week + "/" + weekInfo.total;

  var h = '<div onclick="Router.go(\'standings\')" style="background:var(--cb-chalk-2);border-radius:var(--r-3);padding:18px 24px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:8px">' + escHtml(eyebrow) + '</div>';
  if (myIdx < 0) {
    h += '<div style="display:flex;align-items:baseline;gap:14px">';
    h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-ink);line-height:1">—</div>';
    h += '<div style="font-family:var(--font-mono);font-size:11px;letter-spacing:1.5px;color:var(--cb-charcoal);text-transform:uppercase">JOIN A SEASON · LOG A ROUND →</div>';
    h += '</div>';
  } else {
    var me = standings[myIdx];
    var rank = myIdx + 1;
    var rankSuffix = (rank === 1) ? "st" : (rank === 2) ? "nd" : (rank === 3) ? "rd" : "th";
    var pts = me.points || 0;
    var leaderPts = standings[0] ? (standings[0].points || 0) : 0;
    var gap = leaderPts - pts;
    var meta = pts + " PTS · " + (rank === 1 ? "LEADING" : gap + " BACK OF LEADER");
    h += '<div style="display:flex;align-items:baseline;gap:14px">';
    h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-ink);line-height:1;font-variant-numeric:lining-nums">' + rank + rankSuffix + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--cb-charcoal);text-transform:uppercase">' + escHtml(meta) + '</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// ─── Features column components ─────────────────────────────────────────────

// v8.21.0 (Ship 5+6 Phase 4 / D1): handicap delta vs. start of current
// calendar month. Returns { value, direction } or null.
// - direction "down" = handicap improved (current < prior)
// - direction "up"   = handicap worsened (current > prior)
// - null when insufficient history (< 5 total rounds, < 3 prior-month rounds)
//   or delta is below noise threshold (< 0.05).
// Calendar-month boundary chosen per CTO ruling D2 — "vs last month" reads
// as calendar semantics. (V7 rolling-window semantics apply to LAST 30D
// rounds count, a different metric.)
function _calcHandicapDelta(rounds) {
  if (!rounds || rounds.length < 5) return null;
  if (typeof PB === "undefined" || !PB.calcHandicap) return null;
  var current = PB.calcHandicap(rounds);
  if (current == null) return null;
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  var priorRounds = rounds.filter(function(r) {
    var t = r.timestamp || (r.date ? new Date(r.date + "T00:00:00").getTime() : 0);
    return t < monthStart;
  });
  if (priorRounds.length < 3) return null;
  var prior = PB.calcHandicap(priorRounds);
  if (prior == null) return null;
  var delta = current - prior;
  if (Math.abs(delta) < 0.05) return null;
  return { value: Math.abs(delta), direction: delta < 0 ? "down" : "up" };
}

// Handicap trend chart for HQ Home (Features column / Band B lead column).
// v8.14.5 — Stub 30D/90D/1Y pills replaced with functional 30D/SEASON/ANNUAL
// toggle (P17 pattern). Toggle state persists via PB.getChartRange/setChartRange
// keyed 'handicap_home'. Surgical rerender via _rerenderTrendChart in members.js
// (delegated click handler app-wide). SVG modernized to Approach B per P16
// (preserveAspectRatio="none" + width:100% + fixed pixel height).
//
// v8.21.0 (Ship 5+6 Phase 4 / D1): chart polish per design bot directive.
// Card chrome stripped → hairline rules. Header derived delta sub-stat added.
// Range pills brass-underline-on-active (scoped to .hq-handicap-chart so
// Members chart at members.js:2023 keeps current visual treatment until B.8
// ships). Empty state replaced with dashed-line placeholder at same dimensions
// as populated chart (zero layout shift on data arrival).
function _renderHandicapTrendChart(ctx, opts) {
  opts = opts || {};
  var chartWidth = opts.width || 400;
  var rounds = ctx.myRounds || [];
  var range = (typeof PB !== "undefined" && PB.getChartRange) ? PB.getChartRange('handicap_home', '30D') : '30D';

  // Filter rounds by selected range. PB.filterRoundsByRange handles 30D /
  // SEASON / ANNUAL semantics. Also filter out scramble rounds (handicap math
  // excludes them per existing chart logic).
  var filtered = ((typeof PB !== "undefined" && PB.filterRoundsByRange) ? PB.filterRoundsByRange(rounds, range) : rounds)
    .filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });

  // currentUser uid stashed on toggle for surgical rerender lookup (P17 contract).
  var pidForToggle = (typeof currentUser !== "undefined" && currentUser && currentUser.uid) ? currentUser.uid
                   : (typeof currentProfile !== "undefined" && currentProfile && currentProfile.claimedFrom) ? currentProfile.claimedFrom : '';

  // v8.21.0 (Ship 5+6 Phase 4 / D1): wrap in .hq-handicap-chart so the new
  // brass-underline range pill CSS scopes to this chart only. Members chart
  // at members.js:2023 keeps current treatment until B.8 ships.
  var h = '<div class="hq-handicap-chart">';
  // Header
  var current = ctx.handicap != null ? Number(ctx.handicap).toFixed(1) : "—";
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">HANDICAP</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">' + current + '</div>';
  // v8.21.0 (Ship 5+6 Phase 4 / D1): derived delta sub-stat. Renders only
  // when there's enough history + a non-trivial change vs start of current
  // calendar month. Per RULING 3 Option C: brass for "down" (improved —
  // lower handicap, rewarded by spotlight color), cb-mute for "up" (worsened
  // — subdued, no alarm-state color).
  var deltaInfo = _calcHandicapDelta(rounds);
  if (deltaInfo) {
    var arrow = deltaInfo.direction === "down" ? "↘" : "↗";
    var sign = deltaInfo.direction === "down" ? "−" : "+";
    var deltaColor = deltaInfo.direction === "down" ? "var(--cb-brass)" : "var(--cb-mute)";
    h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1px;color:' + deltaColor + ';margin-top:6px">' + arrow + ' ' + sign + deltaInfo.value.toFixed(1) + ' vs. last month</div>';
  }
  h += '</div>';
  // v8.14.5 — Functional toggle pills using shared P17 .chart-range-toggle/.chart-range-pill
  // classes. Replaces v8.14.4 stub UI (90D/1Y were "Coming in a future update"
  // placeholders with cursor:not-allowed). Click handled by delegated listener
  // in members.js; rerender via _rerenderTrendChart 'handicap_home' branch.
  var ranges = ['30D', 'SEASON', 'ANNUAL'];
  h += '<div class="chart-range-toggle" data-chart-id="handicap_home" data-pid="' + escHtml(pidForToggle) + '">';
  ranges.forEach(function(r) {
    var activeClass = (r === range) ? ' chart-range-pill--active' : '';
    h += '<button class="chart-range-pill' + activeClass + '" data-range="' + r + '" type="button">' + r + '</button>';
  });
  h += '</div>';
  h += '</div>';

  // v8.14.5 — wrap chart body in .chart-container so 720px max-width cap
  // applies (components.css). chartId selector enables surgical rerender on
  // toggle change (P17 pattern).
  h += '<div class="chart-container" data-chart-id="handicap_home">';
  h += _renderHandicapTrendSeries(filtered, rounds, chartWidth);
  h += '</div>';
  h += '</div>';
  return h;
}

// v8.21.0 (Ship 5+6 Phase 4 / D1 / A6 amendment): empty-state SVG renderer.
// Extracted from _renderHandicapTrendSeries which had two branches emitting
// the same dashed-line placeholder shape. Helper enforces visual consistency
// across both call sites (recent.length < 3 guard + post-series-build sparse
// case) and prevents future drift between them. Same viewBox + height as the
// populated chart so layout is identical regardless of branch.
function _renderEmptySeriesState(w, height, pad, chartW, chartH, count) {
  var midY = pad.t + chartH / 2;
  var s = '<svg viewBox="0 0 ' + w + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px;display:block">';
  // Dashed baseline
  s += '<line x1="0" y1="' + (pad.t + chartH) + '" x2="' + chartW + '" y2="' + (pad.t + chartH) + '" stroke="var(--cb-chalk-3)" stroke-width="1" stroke-dasharray="4 4"/>';
  // Dashed mid-line (placeholder for "where the trend will live")
  s += '<line x1="0" y1="' + midY + '" x2="' + chartW + '" y2="' + midY + '" stroke="var(--cb-chalk-3)" stroke-width="1" stroke-dasharray="4 4"/>';
  // Centered progress copy. Range-scoped phrasing: "LOGGED" implied zero total
  // rounds even when the member has rounds outside this window or in excluded
  // formats (scrambles are dropped from handicap math). Matches the rerender
  // path's established "Not enough rounds in this range." truth.
  var label = count === 0 ? 'NO ROUNDS IN THIS RANGE' : count + ' OF 3 ROUNDS IN THIS RANGE';
  s += '<text x="' + (chartW / 2) + '" y="' + (midY - 8) + '" font-family="ui-monospace,monospace" font-size="11" font-weight="600" fill="var(--cb-mute)" text-anchor="middle" letter-spacing="1.5">' + label + '</text>';
  s += '</svg>';
  return s;
}

// v8.14.5 — Extracted handicap series rendering helper. Reused by initial
// home.js render AND surgical rerender via members.js _rerenderTrendChart's
// 'handicap_home' branch on toggle change. Returns chart body HTML (chrome
// container + SVG OR empty-state placeholder).
//
// rangeFiltered: rounds already filtered by selected time range (in-window).
// allRounds: complete round set, used for cumulative handicap-up-to-date math.
// chartWidth: viewBox width (400 features column / 600 Band B lead).
function _renderHandicapTrendSeries(rangeFiltered, allRounds, chartWidth) {
  var width = chartWidth || 400;
  var recent = (rangeFiltered || []).slice().sort(function(a, b) {
    var ax = a.timestamp || new Date(a.date + "T00:00:00").getTime();
    var bx = b.timestamp || new Date(b.date + "T00:00:00").getTime();
    return ax - bx;
  });

  // v8.21.0 (Ship 5+6 Phase 4 / D1): empty state engineered for ZERO layout
  // shift. Same SVG container + viewBox + height as populated chart. Dashed
  // baseline + dashed mid-line act as visual placeholder. Range-scoped
  // progress copy centers in the chart area. When the 3rd qualifying round
  // arrives, the SVG content swaps but outer dimensions stay identical.
  var w = width, height = 140;
  var pad = { t: 14, b: 22, l: 0, r: 32 };
  var chartW = w - pad.l - pad.r, chartH = height - pad.t - pad.b;

  if (recent.length < 3) {
    return _renderEmptySeriesState(w, height, pad, chartW, chartH, recent.length);
  }

  // Build cumulative-handicap series. Each point = handicap as of that round
  // date. Iterates allRounds (NOT filtered) for the upTo computation — handicap
  // math uses entire history up to date, not just the time window.
  var allSorted = (allRounds || []).slice().sort(function(a, b) {
    var ax = a.timestamp || new Date(a.date + "T00:00:00").getTime();
    var bx = b.timestamp || new Date(b.date + "T00:00:00").getTime();
    return ax - bx;
  });
  var series = [];
  recent.forEach(function(r) {
    var rt = r.timestamp || new Date(r.date + "T00:00:00").getTime();
    var upTo = allSorted.filter(function(x) {
      var xt = x.timestamp || new Date(x.date + "T00:00:00").getTime();
      return xt <= rt;
    });
    var hcap = PB.calcHandicap(upTo);
    if (hcap !== null && Number.isFinite(hcap)) series.push({ value: hcap, ts: rt });
  });

  if (series.length < 2) {
    // Series too sparse to render a trend — same shape as the recent < 3 guard.
    return _renderEmptySeriesState(w, height, pad, chartW, chartH, recent.length);
  }

  var values = series.map(function(p){return p.value});
  var yMin = Math.min.apply(null, values), yMax = Math.max.apply(null, values);
  if (yMax - yMin < 1) { yMin -= 0.5; yMax += 0.5; } // floor minimum span
  var range = yMax - yMin;
  function px(i) { return pad.l + (i / (series.length - 1)) * chartW; }
  function py(v) { return pad.t + (1 - (v - yMin) / range) * chartH; }

  // v8.14.5 — Approach B per P16: viewBox + width:100% + fixed pixel height
  // + preserveAspectRatio="none". Container governs render width (max-width
  // cap via .chart-container); height stays at declared px so chart doesn't
  // grow proportionally tall on wider parents.
  //
  // v8.21.0 (Ship 5+6 Phase 4 / D1): card chrome wrapper stripped — chart
  // renders as a bare SVG against page background. Line uses ink color +
  // 1.5px width (1.75 at chartWidth >= 600). Area fill explicit brass at
  // 12% opacity. Last-point dot now has a chalk halo BEHIND it (rendered
  // before the dot in SVG z-order).
  var lineWidth = (chartWidth >= 600) ? 1.75 : 1.5;
  var lastIdx = series.length - 1;
  var svg = '<svg viewBox="0 0 ' + w + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px;display:block">';
  // Baseline (hairline rule)
  svg += '<line x1="0" y1="' + (pad.t + chartH) + '" x2="' + chartW + '" y2="' + (pad.t + chartH) + '" stroke="var(--cb-chalk-3)" stroke-width="1"/>';
  // Area fill — explicit brass at 12% opacity
  var areaPath = 'M' + px(0) + ',' + py(series[0].value);
  for (var i = 1; i < series.length; i++) areaPath += 'L' + px(i) + ',' + py(series[i].value);
  areaPath += 'L' + px(lastIdx) + ',' + (pad.t + chartH) + 'L' + px(0) + ',' + (pad.t + chartH) + 'Z';
  svg += '<path d="' + areaPath + '" fill="var(--cb-brass)" opacity="0.12"/>';
  // Line — ink, 1.5/1.75 px
  var linePath = 'M' + px(0) + ',' + py(series[0].value);
  for (var li = 1; li < series.length; li++) linePath += 'L' + px(li) + ',' + py(series[li].value);
  svg += '<path d="' + linePath + '" fill="none" stroke="var(--cb-ink)" stroke-width="' + lineWidth + '" stroke-linecap="round" stroke-linejoin="round"/>';
  // Last-point chalk halo (BEHIND the dot in SVG z-order)
  svg += '<circle cx="' + px(lastIdx) + '" cy="' + py(series[lastIdx].value) + '" r="7" fill="var(--cb-chalk)" opacity="0.30"/>';
  // Last-point dot
  svg += '<circle cx="' + px(lastIdx) + '" cy="' + py(series[lastIdx].value) + '" r="4" fill="var(--cb-brass)"/>';
  // Y annotations (right edge) — mono per D1
  svg += '<text x="' + (chartW + 6) + '" y="' + (pad.t + 4) + '" font-family="ui-monospace,monospace" font-size="10" fill="var(--cb-mute)">' + yMax.toFixed(1) + '</text>';
  svg += '<text x="' + (chartW + 6) + '" y="' + (pad.t + chartH) + '" font-family="ui-monospace,monospace" font-size="10" fill="var(--cb-mute)">' + yMin.toFixed(1) + '</text>';
  // X month markers (first + last)
  var monthShort = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var firstM = monthShort[new Date(series[0].ts).getMonth()];
  var lastM = monthShort[new Date(series[lastIdx].ts).getMonth()];
  svg += '<text x="0" y="' + (height - 4) + '" font-family="ui-monospace,monospace" font-size="9" fill="var(--cb-mute)" letter-spacing="1">' + firstM + '</text>';
  svg += '<text x="' + chartW + '" y="' + (height - 4) + '" font-family="ui-monospace,monospace" font-size="9" fill="var(--cb-mute)" text-anchor="end" letter-spacing="1">' + lastM + '</text>';
  svg += '</svg>';

  return svg;
}

// Compact league activity feed. Synchronous: reads PB.getRounds() last 30 +
// state.activity recent items, time-bucketed (today / yesterday / this week).
// TODO v1.x: upgrade to loadHomeActivityFeed (Firestore-backed, richer set).
