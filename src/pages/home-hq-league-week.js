// "The league this week" stat strip — per CLUBHOUSE_SPEC-HQ-3a-Home.md § 3a.1.5
// Section B. 4-column league-wide weekly snapshot with delta-vs-prior-week
// indicators. Reads PB.getRounds() for league-wide round data; falls back to
// the viewer's own myRounds when PB is unavailable (band-A SSR-ish path).
//
// Design pass 2026-05-22 (W2.S1 pull-forward) — this is a NEW section
// inserted between the personal stats quartet and the season ladder. Stripe
// delta-indicator pattern + Linear restraint (single brass accent on
// section title; values stay in chalk).
function _hqWeekWindow() {
  var nowMs = Date.now();
  var weekMs = 7 * 86400000;
  return {
    weekStart: nowMs - weekMs,
    priorStart: nowMs - 2 * weekMs,
    priorEnd: nowMs - weekMs,
    end: nowMs
  };
}

function _hqLeagueRoundsInRange(startMs, endMs) {
  if (typeof PB === "undefined" || !PB.getRounds) return [];
  var rounds = PB.getRounds() || [];
  return rounds.filter(function(r) {
    // v8.25.234 — window by PLAY date first (when the round happened), not the write
    // timestamp; a recently re-synced but old round must not re-enter "this week".
    var ts = r.date ? new Date(r.date + "T12:00:00").getTime() : (r.timestamp || 0);
    return ts >= startMs && ts < endMs;
  });
}

function _renderLeagueThisWeekStrip(ctx) {
  if (typeof PB === "undefined" || !PB.getRounds) return ""; // no data path

  var win = _hqWeekWindow();
  var thisWeek = _hqLeagueRoundsInRange(win.weekStart, win.end);
  var priorWeek = _hqLeagueRoundsInRange(win.priorStart, win.priorEnd);

  // 1. ROUNDS — count + delta vs prior week
  var roundsCount = thisWeek.length;
  var roundsDelta = roundsCount - priorWeek.length;
  var roundsDeltaStr, roundsDeltaColor;
  if (priorWeek.length === 0 && roundsCount === 0) {
    roundsDeltaStr = "QUIET WEEK"; roundsDeltaColor = "var(--cb-mute)";
  } else if (roundsDelta > 0) {
    roundsDeltaStr = "↑ " + roundsDelta + " VS LAST WK"; roundsDeltaColor = "var(--cb-moss)";
  } else if (roundsDelta < 0) {
    roundsDeltaStr = "↓ " + Math.abs(roundsDelta) + " VS LAST WK"; roundsDeltaColor = "var(--cb-mute)";
  } else {
    roundsDeltaStr = "● SAME AS LAST WK"; roundsDeltaColor = "var(--cb-mute)";
  }

  // 2. AVG SCORE — mean of scores (real scores only) + delta vs prior week
  var thisScores = thisWeek.filter(function(r){ return r.score && r.score > 0; }).map(function(r){ return r.score; });
  var priorScores = priorWeek.filter(function(r){ return r.score && r.score > 0; }).map(function(r){ return r.score; });
  var avgVal = "—";
  var avgCaption = "NO ROUNDS YET";
  var avgColor = "var(--cb-mute)";
  if (thisScores.length) {
    var avgNum = thisScores.reduce(function(a,b){return a+b;},0) / thisScores.length;
    avgVal = avgNum.toFixed(1);
    if (priorScores.length) {
      var priorAvg = priorScores.reduce(function(a,b){return a+b;},0) / priorScores.length;
      var diff = avgNum - priorAvg;
      if (diff <= -0.5) {
        avgCaption = "↓ " + Math.abs(diff).toFixed(1) + " STRONGER";
        avgColor = "var(--cb-moss)";
      } else if (diff >= 0.5) {
        avgCaption = "↑ " + diff.toFixed(1) + " OFF";
        avgColor = "var(--cb-mute)";
      } else {
        avgCaption = "● HOLDING STEADY";
        avgColor = "var(--cb-mute)";
      }
    } else {
      avgCaption = "FIRST WEEK OUT";
    }
  }

  // 3. LOW ROUND — min score this week + member + course
  var lowVal = "—";
  var lowCaption = "NO ROUNDS LOGGED";
  if (thisWeek.length) {
    var scored = thisWeek.filter(function(r){ return r.score && r.score > 0; });
    if (scored.length) {
      var low = scored.reduce(function(min, r){ return (!min || r.score < min.score) ? r : min; }, null);
      if (low) {
        lowVal = String(low.score);
        var actor = low.playerName || (low.player && typeof PB !== "undefined" && PB.getPlayer ? (PB.getPlayer(low.player) || {}).name : "") || "A Parbaugh";
        var courseShort = low.course ? _shortenCourseName(low.course) : "";
        // First name only for tighter cell
        var firstName = actor.split(/\s+/)[0];
        lowCaption = (firstName + " · " + courseShort).toUpperCase();
      }
    }
  }

  // 4. MOST ACTIVE — member with most rounds this week (replaces "Coins Earned"
  //    from spec since coin economy not yet wired per AMD-018 gate). When the
  //    parcoin grants land, swap to {N,NNN} + "across the room" per spec.
  var activeVal = "—";
  var activeCaption = "NO ROUNDS YET";
  if (thisWeek.length) {
    var byPlayer = {};
    thisWeek.forEach(function(r) {
      var pid = r.player || r.playerName || "?";
      byPlayer[pid] = (byPlayer[pid] || 0) + 1;
    });
    var topPid = null, topCount = 0;
    Object.keys(byPlayer).forEach(function(pid) {
      if (byPlayer[pid] > topCount) { topPid = pid; topCount = byPlayer[pid]; }
    });
    if (topPid) {
      activeVal = String(topCount);
      var topName = "";
      if (typeof PB !== "undefined" && PB.getPlayer) {
        var p = PB.getPlayer(topPid);
        if (p && p.name) topName = p.name.split(/\s+/)[0];
      }
      if (!topName) {
        var byRound = thisWeek.find(function(r){ return (r.player || r.playerName) === topPid; });
        if (byRound) topName = (byRound.playerName || "").split(/\s+/)[0];
      }
      activeCaption = ("MOST ACTIVE: " + (topName || "?")).toUpperCase();
    }
  }

  // Format week window date label, e.g. "May 16 – May 22"
  function _fmtMD(ms) {
    var d = new Date(ms);
    var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return mons[d.getMonth()] + " " + d.getDate();
  }
  var windowLabel = _fmtMD(win.weekStart) + " – " + _fmtMD(win.end);

  // Render
  var h = '<section class="hq-league-week" style="display:flex;flex-direction:column;gap:14px">';
  // Section header — H2 + right-aligned date window
  h += '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">';
  h += '<h2 style="font-family:var(--font-display);font-size:22px;font-weight:600;color:var(--cb-ink);letter-spacing:-0.01em;margin:0;line-height:1.2">The league <em style="font-style:italic">this week</em>.</h2>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:500;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + escHtml(windowLabel) + '</div>';
  h += '</div>';
  // 4-col stat strip
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--cb-chalk-3);border-bottom:1px solid var(--cb-chalk-3)">';

  var cells = [
    { label: "ROUNDS",     value: String(roundsCount), caption: roundsDeltaStr, color: roundsDeltaColor },
    { label: "AVG SCORE",  value: avgVal,              caption: avgCaption,     color: avgColor },
    { label: "LOW ROUND",  value: lowVal,              caption: lowCaption,     color: "var(--cb-mute)" },
    { label: "MOMENTUM",   value: activeVal,           caption: activeCaption,  color: "var(--cb-mute)" }
  ];
  cells.forEach(function(c, i) {
    var sep = i > 0 ? 'border-left:1px solid var(--cb-chalk-3);' : '';
    h += '<div style="padding:18px 14px;' + sep + 'min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center">';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size, 9px);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + escHtml(c.label) + '</div>';
    h += '<div class="hq-stat-strip__numeral" style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1;font-variant-numeric:lining-nums tabular-nums">' + escHtml(c.value) + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:9.5px;font-weight:600;letter-spacing:1px;color:' + c.color + ';text-transform:uppercase;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(c.caption) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</section>';
  return h;
}
