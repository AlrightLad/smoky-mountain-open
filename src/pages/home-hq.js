// Home — HQ home rendering tier: banded layout, hero, stats quartet, ladder,
// recent rounds, live-round caption helpers. Extracted per W1.A5 (AMD-027).

function _renderHQHomeBanded(ctx) {
  // Ship 5 Gate 2 simplified (v8.15.3) — 2-state layout. Empty cinema left
  // rail removed; was cosmetic only. Mobile (<960 viewport): main only,
  // right rail hidden via CSS. Desktop (≥960): main + 280px right rail.
  var h = '<div class="hq-grid">';
  // Main column — state-aware lead content (greeting/live/welcome).
  h += '<div class="hq-grid__main">';
  h += _renderHQLeadColumn(ctx);
  h += '</div>';
  // Right rail — features (chart + feed) + agate (online + tee times + spotlight).
  // CSS hides at <960 viewport; visible at ≥960.
  h += '<div class="hq-grid__rail-right">';
  h += _renderHQFeaturesColumn(ctx);
  h += _renderHQAgateRail(ctx);
  h += '</div>';
  h += '</div>';
  return h;
}

// DEPRECATED v8.15.0 (Ship 5 Gate 1) — superseded by _renderHQHomeBanded above.
// Function retained for reference until follow-on ship retires the 5-band JS-
// branched layout entirely. Do not consume in new code paths.
//
// HQ three-column grid. At 1280-1439px renders lead (480) + features (400) only.
// At ≥1440px adds the agate rail (196). Content capped at 1152px and centered.
// Ship 1b-i: typed placeholders in each column. Ship 1b-ii fills lead + features;
// Ship 1b-iii fills agate.
// Inner grid — bounded width + horizontal padding now live in _renderHQHome's
// content wrapper. This emits only the column flex container.
function _renderHQGridInner(ctx) {
  var band = _currentBand();
  var h = '<div style="padding-top:32px;display:flex">';

  if (band === "A") {
    // Band A (720-959): single content column, full-width within 640px wrapper.
    // Chart + features column dropped; activity feed promoted into lead flow.
    h += '<div style="width:100%;min-width:0">';
    h += _renderHQLeadColumnBandA(ctx);
    h += '</div>';
  } else if (band === "B") {
    // Band B (960-1279): single 600px lead column, chart promoted into flow.
    h += '<div style="width:600px;flex-shrink:0">';
    h += _renderHQLeadColumnBandB(ctx);
    h += '</div>';
  } else {
    // Bands C (1280-1439) and D (1440+): lead + features (+ agate at D).
    h += '<div style="width:480px;flex-shrink:0">';
    h += _renderHQLeadColumn(ctx);
    h += '</div>';
    h += '<div style="width:400px;flex-shrink:0;margin-left:32px">';
    h += _renderHQFeaturesColumn(ctx);
    h += '</div>';
    if (band === "D") {
      h += '<div style="width:196px;flex-shrink:0;margin-left:24px">';
      h += _renderHQAgateRail(ctx);
      h += '</div>';
    }
  }

  h += '</div>';
  return h;
}

// Empty-column placeholder. Visible during Ship 1b-i so the grid architecture is
// inspectable before column components arrive in Ships 1b-ii and 1b-iii.
function _renderHQPlaceholder(label, state) {
  var stateLabel = (state || "idle").toUpperCase();
  return '<div style="height:400px;background:var(--cb-chalk-2);border-radius:var(--r-3);border:1px dashed var(--cb-chalk-3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:var(--font-mono);color:var(--cb-mute);text-transform:uppercase">' +
    '<div style="font-size:10px;letter-spacing:2.5px">' + escHtml(label) + '</div>' +
    '<div style="font-size:9px;letter-spacing:2px;opacity:0.7">v8.5.x · state: ' + stateLabel + '</div>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════
// === HQ LEAD + FEATURES COLUMN HELPERS (v8.5.1 · Ship 1b-ii) ===
// ═══════════════════════════════════════════════════════════════════════════

// ─── Shared derivation helpers ──────────────────────────────────────────────

// Sum hole pars on a round if available, else look up course par, else 72.
// Used by streak detection and round-vs-par display in recent rows.
function _hqRoundParTotal(r) {
  if (r.holePars && r.holePars.length) {
    var sum = 0, ok = true;
    for (var i = 0; i < r.holePars.length; i++) {
      var p = parseInt(r.holePars[i]);
      if (!p) { ok = false; break; }
      sum += p;
    }
    if (ok && sum > 0) return sum;
  }
  if (r.course && typeof PB !== "undefined" && PB.getCourseByName) {
    var c = PB.getCourseByName(r.course);
    if (c && c.par) {
      // 9-hole rounds use half par
      if (r.holesPlayed && r.holesPlayed <= 9) return Math.round(c.par / 2);
      return c.par;
    }
  }
  return r.holesPlayed && r.holesPlayed <= 9 ? 36 : 72;
}

// Consecutive most-recent under-par individual non-scramble rounds.
function _hqStreakCount(myRounds) {
  if (!myRounds || !myRounds.length) return 0;
  var sorted = myRounds.slice().sort(function(a,b) {
    var ax = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
    var bx = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);
    return bx - ax;
  });
  var streak = 0;
  for (var i = 0; i < sorted.length; i++) {
    var r = sorted[i];
    if (r.format === "scramble" || r.format === "scramble4") continue;
    var par = _hqRoundParTotal(r);
    if (r.score && r.score < par) streak++;
    else break;
  }
  return streak;
}

// Week of season (1..N) and total weeks. Returns {week, total}.
function _hqWeekNum(season) {
  if (!season || !season.start || !season.end) return { week: 1, total: 1 };
  var startMs = new Date(season.start + "T00:00:00").getTime();
  var endMs = new Date(season.end + "T00:00:00").getTime();
  var now = Date.now();
  var elapsedDays = Math.max(0, Math.floor((now - startMs) / 86400000));
  var totalDays = Math.max(1, Math.floor((endMs - startMs) / 86400000));
  var week = Math.max(1, Math.ceil(elapsedDays / 7));
  var total = Math.max(1, Math.ceil(totalDays / 7));
  if (week > total) week = total;
  return { week: week, total: total };
}

// Days since most-recent round timestamp.
function _hqDaysSinceLastRound(myRounds) {
  if (!myRounds || !myRounds.length) return null;
  var newest = myRounds.reduce(function(m, r) {
    var t = r.timestamp || (r.date ? new Date(r.date).getTime() : 0);
    return t > m ? t : m;
  }, 0);
  if (!newest) return null;
  return Math.floor((Date.now() - newest) / 86400000);
}

// ─── Lead column · State 2 (idle) ──────────────────────────────────────────

// Editorial greeting hero — Fraunces 56 with italic name + data-derived subhead +
// inline pull-quote stat block. v8.21.0 (Ship 5+6 Phase 1 / B.23+B.24): eyebrow
// with date/weather prefix REMOVED — date lives in masthead chrome (page-shell
// hqHome variant), weather lives in masthead pill. Both are now single-source.
function _renderEditorialGreetingHero(ctx) {
  var h = '<div>';
  // Headline — Fraunces, scales 36/44/52/56 across bands
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-hero-size);font-weight:var(--hq-hero-weight);line-height:1.05;letter-spacing:-2px;color:var(--cb-ink);margin-bottom:14px">';
  h += 'Welcome back, <em style="font-style:italic;font-weight:700">' + escHtml(ctx.firstName) + '</em>.';
  h += '</div>';
  // Subhead — scales 15/16/17/18
  h += '<div style="font-family:var(--font-ui);font-size:var(--hq-subhead-size);font-weight:500;color:var(--cb-charcoal);max-width:380px;line-height:1.45;margin-bottom:22px">' + escHtml(_hqHeroSubhead(ctx)) + '</div>';
  // Pull-quote
  h += _hqHeroPullquote(ctx);
  h += '</div>';
  return h;
}

function _hqHeroSubhead(ctx) {
  var rounds = ctx.myRounds || [];
  if (!rounds.length) return "Ready when you are. The course is calling.";
  var sortedDesc = rounds.slice().sort(function(a,b) {
    var ax = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
    var bx = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);
    return bx - ax;
  });
  var last = sortedDesc[0];
  var daysSince = _hqDaysSinceLastRound(rounds);

  if (daysSince !== null && daysSince <= 7) {
    var dayName = "";
    if (last && last.date) {
      var dn = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(last.date + "T00:00:00").getDay()];
      dayName = dn ? " · " + dn : "";
    }
    var courseStr = last.course ? " at " + last.course : "";
    return "Last out: " + (last.score || "—") + courseStr + dayName + ".";
  }
  if (daysSince !== null && daysSince >= 14) {
    return "It's been " + daysSince + " days since your last round.";
  }
  // Middle case — count rounds in season window
  var season = ctx.season;
  var seasonRounds = 0;
  if (season && season.start && season.end) {
    seasonRounds = rounds.filter(function(r) { return r.date && r.date >= season.start && r.date <= season.end; }).length;
  }
  // 3+ rounds in last 14 days → warming up; else → ladder copy
  var recent14 = rounds.filter(function(r) {
    var t = r.timestamp || (r.date ? new Date(r.date).getTime() : 0);
    return t && (Date.now() - t) <= 14 * 86400000;
  }).length;
  if (recent14 >= 3) return seasonRounds + " rounds this season. You're warming up.";
  return seasonRounds + " rounds this season. The ladder won't climb itself.";
}

function _hqHeroPullquote(ctx) {
  var rounds = ctx.myRounds || [];
  var indiv = rounds.filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18); });
  var eyebrow, statValue, caption;

  if (indiv.length >= 5) {
    var sorted = indiv.slice().sort(function(a,b) {
      var ax = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
      var bx = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);
      return bx - ax;
    });
    var last5 = sorted.slice(0, 5);
    var avg = Math.round(last5.reduce(function(a,r){return a+(r.score||0)},0) / 5);
    var pr = ctx.bestRound;
    eyebrow = "RECENT FORM";
    statValue = String(avg);
    caption = pr != null ? "Last 5 rounds avg. Personal best is " + pr + "." : "Average across your last 5 rounds.";
  } else if (indiv.length < 3) {
    var n = 3 - indiv.length;
    eyebrow = "HANDICAP";
    statValue = String(indiv.length);
    caption = n + " more round" + (n === 1 ? "" : "s") + " until your handicap is official.";
  } else {
    eyebrow = "HANDICAP";
    statValue = ctx.handicap != null ? Number(ctx.handicap).toFixed(1) : "—";
    caption = "Your handicap sits at " + statValue + ".";
  }

  var h = '<div style="background:var(--cb-chalk-2);border-left:6px solid var(--cb-brass);padding:16px 20px;border-radius:0 8px 8px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:6px">' + escHtml(eyebrow) + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-ink);line-height:1.1;margin-bottom:4px">' + escHtml(statValue) + '</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-charcoal);line-height:1.4">' + escHtml(caption) + '</div>';
  h += '</div>';
  return h;
}

// Truncate a caption string to a max char count with ellipsis. Used by the
// stats quartet to keep cell captions inside the column at all bands.
function _truncateCaption(s, max) {
  if (!s) return s;
  max = max || 13;
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// v8.21.0 (Ship 5+6 Phase 2 / B.28): shorten common golf-club name suffixes
// so long course names fit the BEST cell width without mid-word ellipsis
// truncation. Strips "Golf & Country Club", "Golf Club", "Golf Links",
// "Golf Course", "Golf Resort", "Resort", trailing "GC". Names ≤18 chars
// pass through unchanged. Edge cases (e.g., "Pebble Beach Golf Links" still
// 23 chars after strip; "The Old Course at St Andrews") may still truncate;
// addressing those would need a course shortName field per B.28 deferred.
function _shortenCourseName(name) {
  if (!name) return "";
  if (name.length <= 18) return name;
  return name
    .replace(/\s+golf\s+(&\s+)?country\s+club\s*$/i, "")
    .replace(/\s+golf\s+club\s*$/i, "")
    .replace(/\s+golf\s+links\s*$/i, "")
    .replace(/\s+golf\s+(course|resort)\s*$/i, "")
    .replace(/\s+gc\s*$/i, "")
    .replace(/\s+resort\s*$/i, "")
    .trim();
}

// Stats snapshot quartet — 4 cells, no card chrome, vertical chalk-3 dividers
// between cells. Baseball box-score feel. Some cells are clickable.
function _renderStatsSnapshotQuartet(ctx) {
  var hcap = ctx.handicap != null ? Number(ctx.handicap).toFixed(1) : "—";
  var hcapDelta = "—";
  var hcapDeltaColor = "var(--cb-mute)";
  // Lacking persisted history — surface "OFFICIAL" if we have a real handicap, else "PROVISIONAL"
  if (ctx.handicap != null) { hcapDelta = "OFFICIAL"; hcapDeltaColor = "var(--cb-moss)"; }
  else if (ctx.myRounds && ctx.myRounds.length) { hcapDelta = "PROVISIONAL"; hcapDeltaColor = "var(--cb-mute)"; }

  var rounds = ctx.totalRounds != null ? ctx.totalRounds : 0;
  // v8.21.0 (Ship 5+6 Phase 2 / B.31): rolling 30-day window, replaces calendar-
  // MTD per V7 ruling. Calendar-MTD reset to 0 on the 1st of each month, which
  // didn't match members' mental model of "recent activity." Rolling 30D keeps
  // recent activity visible across month boundaries. Uses r.timestamp (epoch ms)
  // primarily; falls back to r.date parsing for legacy rounds without timestamp.
  var THIRTY_DAYS_MS = 30 * 86400000;
  var cutoff = Date.now() - THIRTY_DAYS_MS;
  var last30 = (ctx.myRounds || []).filter(function(r) {
    var t = r.timestamp || (r.date ? new Date(r.date + "T00:00:00").getTime() : 0);
    return t >= cutoff;
  }).length;
  var roundsCaption = "LAST 30D: " + last30;

  var best = ctx.bestRound != null ? String(ctx.bestRound) : "—";
  // v8.21.0 (Ship 5+6 Phase 2 / B.7+B.28): always-truthy caption fallback chain
  // prevents row-count drift across cells (root cause of strip alignment bug).
  // Course names shortened via _shortenCourseName to fit cell width without
  // ellipsis truncation on common Golf-suffix patterns.
  var bestCaption;
  if (!ctx.bestRoundId) {
    bestCaption = "NO ROUNDS YET";
  } else {
    var br = (ctx.myRounds || []).find(function(r){ return r.id === ctx.bestRoundId; });
    if (br && br.course) {
      bestCaption = _shortenCourseName(br.course).toUpperCase();
    } else {
      bestCaption = "COURSE UNKNOWN";
    }
  }

  var streak = _hqStreakCount(ctx.myRounds);
  var streakVal = streak > 0 ? String(streak) : "—";
  var streakCaption = streak > 0 ? streak + " UNDER" : rounds + " LOGGED";
  var streakColor = streak > 0 ? "var(--cb-moss)" : "var(--cb-mute)";

  // Captions kept naturally short; CSS text-overflow:ellipsis on the caption
  // div handles overflow (e.g., long course names in BEST cell) at narrow bands.
  var cells = [
    { label: "HCP", value: hcap, caption: hcapDelta, captionColor: hcapDeltaColor, click: "Router.go('records')" },
    { label: "ROUNDS", value: String(rounds), caption: roundsCaption, captionColor: "var(--cb-mute)", click: "Router.go('roundhistory')" },
    { label: "BEST", value: best, caption: bestCaption, captionColor: "var(--cb-mute)", click: ctx.bestRoundId ? ("Router.go('rounds',{roundId:'" + ctx.bestRoundId + "'})") : "" },
    { label: "STREAK", value: streakVal, caption: streakCaption, captionColor: streakColor, click: "" }
  ];

  // Band A renders 2×2 grid (each cell ~50% width); Bands B/C/D use horizontal flex row.
  var isBandA = _currentBand() === "A";
  var containerStyle = isBandA
    ? 'display:grid;grid-template-columns:1fr 1fr'
    : 'display:flex;align-items:stretch;height:120px';
  var h = '<div style="' + containerStyle + '">';
  cells.forEach(function(c, i) {
    var sep;
    if (isBandA) {
      // 2×2: cells 0,1 top row; 2,3 bottom row. Right cell gets left border;
      // bottom row gets top border.
      sep = '';
      if (i === 1 || i === 3) sep += 'border-left:1px solid var(--cb-chalk-3);';
      if (i === 2 || i === 3) sep += 'border-top:1px solid var(--cb-chalk-3);';
    } else {
      sep = i > 0 ? 'border-left:1px solid var(--cb-chalk-3);' : '';
    }
    // min-width:0 enables text-overflow:ellipsis on caption inside flex/grid children
    var cellSize = isBandA ? 'min-height:108px;min-width:0;' : 'flex:1;min-width:0;';
    var cursor = c.click ? 'cursor:pointer;' : '';
    var onclick = c.click ? ' onclick="' + c.click + '"' : '';
    h += '<div' + onclick + ' style="' + cellSize + sep + cursor + 'padding:18px 14px;display:flex;flex-direction:column;justify-content:center;gap:6px">';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + escHtml(c.label) + '</div>';
    // Ship 5 Gate 2 (v8.15.1) — extracted to .hq-stat-strip__numeral so the
    // 'opsz' 60 axis declaration lives in CSS (memory P9 axis discipline).
    // Smoke selector — `data-stat="round-count"` lets Playwright assert the
    // visible round count on home (tests/e2e/flows/01-all-users-baseline).
    // Same pattern as members-detail.js. Cell labels match the cells array
    // above: HCP / ROUNDS / BEST / STREAK.
    var cellDataAttrs = '';
    if (c.label === "ROUNDS") cellDataAttrs = ' data-stat="round-count" data-count="' + escHtml(c.value) + '"';
    else if (c.label === "HCP") cellDataAttrs = ' data-stat="handicap"';
    else if (c.label === "BEST") cellDataAttrs = ' data-stat="best-round"';
    h += '<div class="hq-stat-strip__numeral"' + cellDataAttrs + '>' + escHtml(c.value) + '</div>';
    if (c.caption) h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.2px;color:' + c.captionColor + ';text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(c.caption) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// Season ladder — top N (default 10, Band A passes 6); current user highlighted;
// if outside top N, pinned below a divider with "YOUR POSITION" caption.
function _renderSeasonLadderTop10(ctx, opts) {
  opts = opts || {};
  var limit = opts.limit || 10;
  var season = ctx.season;
  var standings = (season && season.standings) || [];
  var label = (season && season.label) || "Season";
  var uid = currentUser ? currentUser.uid : null;
  var claimedFrom = currentProfile ? currentProfile.claimedFrom : null;

  var h = '<div>';
  // Section header
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">SEASON LADDER · ' + escHtml(label.toUpperCase()) + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">Standings</div>';
  h += '</div>';
  h += '<div onclick="Router.go(\'standings\')" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);cursor:pointer;text-transform:uppercase">Full ladder →</div>';
  h += '</div>';

  if (!standings.length) {
    h += '<div style="padding:28px 0;font-family:var(--font-mono);font-size:11px;letter-spacing:1.5px;color:var(--cb-mute);text-align:center;text-transform:uppercase">No rounds this season yet</div>';
    h += '</div>';
    return h;
  }

  var top10 = standings.slice(0, limit);
  var leaderPts = top10[0] ? (top10[0].points || 0) : 0;
  var myIdx = standings.findIndex(function(s){ return s.id === uid || s.id === claimedFrom; });
  var myInTop10 = myIdx >= 0 && myIdx < limit;

  top10.forEach(function(s, idx) {
    h += _hqLadderRow(s, idx + 1, leaderPts, idx === myIdx);
  });

  if (!myInTop10 && myIdx >= 0) {
    h += '<div style="height:1px;background:var(--cb-chalk-3);margin:var(--sp-3) 0 10px"></div>';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:6px">YOUR POSITION</div>';
    h += _hqLadderRow(standings[myIdx], myIdx + 1, leaderPts, true);
  } else if (ctx.state === "new") {
    // New user has 0 rounds, won't appear in standings. Pin a placeholder row
    // so they can see where their position will land once they log a round.
    var initial = (ctx.firstName || "?").charAt(0).toUpperCase();
    h += '<div style="height:1px;background:var(--cb-chalk-3);margin:var(--sp-3) 0 10px"></div>';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:6px">YOUR POSITION</div>';
    h += '<div style="background:var(--cb-chalk-2);padding:0 12px;height:var(--hq-ladder-row-height);display:flex;align-items:center;gap:10px;border-radius:var(--r-1)">';
    h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--cb-mute);width:24px;flex-shrink:0">—</div>';
    h += '<div style="width:24px;height:24px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:11px;font-weight:700;flex-shrink:0">' + escHtml(initial) + '</div>';
    h += '<div style="flex:1;min-width:0;font-family:var(--font-ui);font-size:13px;font-weight:500;color:var(--cb-mute)">You</div>';
    h += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);font-style:italic;flex-shrink:0">Appears after your first round</div>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function _hqLadderRow(s, rank, leaderPts, isMe) {
  var name = s.username || s.name || "Member";
  var pts = s.points || 0;
  var gap = leaderPts - pts;
  var bg = isMe ? "background:var(--cb-chalk-2);" : "";
  var rule = isMe ? "border-left:3px solid var(--cb-brass);padding-left:9px;" : "padding-left:12px;";
  var weight = isMe ? "600" : "500";
  var click = s.id ? ' onclick="Router.go(\'members\',{id:\'' + s.id + '\'})"' : "";
  var h = '<div' + click + ' style="' + bg + rule + 'padding-right:12px;height:var(--hq-ladder-row-height);display:flex;align-items:center;gap:10px;cursor:pointer;border-radius:var(--r-1)">';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--cb-mute);width:24px;flex-shrink:0">' + rank + '</div>';
  // Avatar — initial fallback (24×24)
  var initial = (name.charAt(0) || "?").toUpperCase();
  h += '<div style="width:24px;height:24px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:11px;font-weight:700;flex-shrink:0">' + escHtml(initial) + '</div>';
  h += '<div style="flex:1;min-width:0;font-family:var(--font-ui);font-size:13px;font-weight:' + weight + ';color:var(--cb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(name) + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:13px;color:var(--cb-ink);text-align:right;font-variant-numeric:tabular-nums">' + pts + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);width:50px;text-align:right;font-variant-numeric:tabular-nums">' + (rank === 1 ? "—" : "−" + gap) + '</div>';
  h += '</div>';
  return h;
}

// Recent round row — 64px tall, no card chrome, brass divider on bottom edge.
function _renderRecentRoundRow(r) {
  if (!r) return "";
  var par = _hqRoundParTotal(r);
  var diff = (r.score && par) ? r.score - par : null;
  var diffStr = diff === null ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
  var diffColor = diff === null ? "var(--cb-mute)" : (diff < 0 ? "var(--cb-moss)" : (diff > 0 ? "var(--cb-claret)" : "var(--cb-mute)"));

  var fmt = (r.format || "stroke").toUpperCase();
  var fmtPill = fmt === "STROKE" ? "STROKE" : fmt;
  var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? "Back 9" : "Front 9") : "18 holes";
  var dateLabel = r.date || "";

  var h = '<div onclick="Router.go(\'rounds\',{roundId:\'' + (r.id || "") + '\'})" style="height:var(--hq-recent-row-height);border-bottom:1px solid var(--cb-chalk-3);display:flex;align-items:center;gap:14px;padding:0 4px;cursor:pointer">';
  // Score block
  h += '<div style="width:80px;flex-shrink:0;text-align:left">';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1;font-variant-numeric:lining-nums tabular-nums">' + (r.score || "—") + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:0.5px;color:' + diffColor + ';margin-top:2px">' + diffStr + '</div>';
  h += '</div>';
  // Course + meta
  h += '<div style="flex:1;min-width:0">';
  h += '<div style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(r.course || "Unknown") + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);letter-spacing:0.8px;margin-top:3px">' + escHtml(dateLabel) + ' · ' + escHtml(holeLabel) + '</div>';
  h += '</div>';
  // Format pill
  h += '<div style="flex-shrink:0;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);background:var(--cb-chalk-2);padding:5px 9px;border-radius:var(--r-1);text-transform:uppercase">' + escHtml(fmtPill) + '</div>';
  h += '</div>';
  return h;
}

// ─── Lead column · State 1 (active) ────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════════
// LIVE-ROUND CARD HELPERS (v8.11.10 — Gate 2 of cross-device trilogy)
// Caption slot + format helpers shared between HQ + mobile renderers.
// Caption slot DOM lives inside both primary and secondary card variants;
// helpers operate via direct DOM mutation (no Router.go re-render).
// ════════════════════════════════════════════════════════════════════════

// Format milliseconds since startTime as "3H 14M" or "47M" elapsed display.
function _formatElapsed(startTime) {
  if (!startTime) return "—";
  var ts = startTime;
  if (typeof ts === "string") ts = Date.parse(ts);
  if (typeof ts !== "number" || isNaN(ts)) return "—";
  var diffMs = Date.now() - ts;
  if (diffMs < 0) return "—";
  var totalMin = Math.floor(diffMs / 60000);
  var h = Math.floor(totalMin / 60);
  var m = totalMin % 60;
  if (h > 0) return h + "H " + m + "M";
  return m + "M";
}

// Format millisecond delta as "4 min ago" / "12 min ago" / "1H 14M ago" / "just now".
function _formatAge(ms) {
  if (typeof ms !== "number" || isNaN(ms) || ms < 0) return "just now";
  var totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return "just now";
  if (totalMin < 60) return totalMin + " min ago";
  var h = Math.floor(totalMin / 60);
  var m = totalMin % 60;
  return h + "H " + m + "M ago";
}

// Set caption text + tone class. tone: 'staleness' | 'multi-device' | null
// (clears caption). Direct DOM mutation; silently no-ops when slot absent
// (handles route-change cleanup gracefully).
function _setLiveRoundCaption(text, tone) {
  var el = document.getElementById("live-round-caption");
  if (!el) return;
  if (!text || !tone) {
    el.innerHTML = "";
    el.style.cssText = "";
    return;
  }
  var color = tone === "multi-device" ? "var(--cb-brass-deep)" : "var(--cb-brass)";
  el.style.cssText = "font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:" + color + ";margin-top:14px";
  el.textContent = text;
}

// A2: 30s auto-dismiss multi-device caption. Idempotent — clears any existing
// timer before setting new one. Called from handleLiveRoundEmission when
// status='active' fires from peer device while liveState.active===true locally.
function _showMultiDeviceCaption(lastWriteAt) {
  if (window._liveRoundMultiDeviceTimer) {
    clearTimeout(window._liveRoundMultiDeviceTimer);
    window._liveRoundMultiDeviceTimer = null;
  }
  var ageMs = Date.now() - (lastWriteAt || Date.now());
  var ageStr = _formatAge(ageMs);
  _setLiveRoundCaption("ALSO BEING SCORED ON ANOTHER DEVICE · LAST PHONE WRITE " + ageStr, "multi-device");
  window._liveRoundMultiDeviceTimer = setTimeout(function() {
    _setLiveRoundCaption(null, null);
    window._liveRoundMultiDeviceTimer = null;
  }, 30000);
}

// E2: staleness caption appears after 10 min no-update. Polls every 60s
// updating "X MIN AGO". Idempotent self-clean: stored in
// window._liveRoundCaptionPollerId, cleared at top of each call. Single
// timer reference covers both the initial setTimeout and the recurring
// setInterval (only one is active at any time).
function _scheduleStalenessPolling(lastWriteAt) {
  if (window._liveRoundCaptionPollerId) {
    clearTimeout(window._liveRoundCaptionPollerId);
    clearInterval(window._liveRoundCaptionPollerId);
    window._liveRoundCaptionPollerId = null;
  }
  if (typeof lastWriteAt !== "number") return;
  var THRESHOLD_MS = 10 * 60 * 1000;
  var ageMs = Date.now() - lastWriteAt;
  function showAndStartInterval() {
    _showStalenessCaption(lastWriteAt);
    window._liveRoundCaptionPollerId = setInterval(function() {
      var el = document.getElementById("live-round-caption");
      if (!el) {
        clearInterval(window._liveRoundCaptionPollerId);
        window._liveRoundCaptionPollerId = null;
        return;
      }
      _showStalenessCaption(lastWriteAt);
    }, 60000);
  }
  if (ageMs >= THRESHOLD_MS) {
    showAndStartInterval();
  } else {
    window._liveRoundCaptionPollerId = setTimeout(showAndStartInterval, THRESHOLD_MS - ageMs);
  }
}

function _showStalenessCaption(lastWriteAt) {
  var ageStr = _formatAge(Date.now() - lastWriteAt);
  _setLiveRoundCaption("LAST UPDATE " + ageStr.toUpperCase() + " · OPEN ROUND TO REFRESH", "staleness");
}

function _clearLiveRoundCaption() {
  if (window._liveRoundMultiDeviceTimer) {
    clearTimeout(window._liveRoundMultiDeviceTimer);
    window._liveRoundMultiDeviceTimer = null;
  }
  if (window._liveRoundCaptionPollerId) {
    clearTimeout(window._liveRoundCaptionPollerId);
    clearInterval(window._liveRoundCaptionPollerId);
    window._liveRoundCaptionPollerId = null;
  }
  _setLiveRoundCaption(null, null);
}

// Toast handler for secondary-variant footer link. Does NOT navigate per
// design B1 (no handoff, no shared scoring). Future ship swaps for deep-link
// when parbaughs:// scheme infrastructure lands.
function _liveRoundOpenOnPhoneToast() {
  if (Router && Router.toast) Router.toast("This round is being scored on another device.");
}
