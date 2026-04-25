/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: HOME — Clubhouse editorial layout (v8.4.0 · Ship 1)

   Three render states gated by user/round context:
     · "active"  — liveState.active === true  (live round in progress)
     · "idle"    — returning user, no active round, rounds.length > 0
     · "new"     — 0 rounds ever (welcome flow)

   Render order is consistent across states:
     1. Email verification banner (always, if unverified)
     2. Greeting (all states)
     3. State-specific primary block (live card / CTA / new-user CTAs)
     4. Stats strip (all states — zeros/em-dashes for new)
     5. Pulses (idle only — up to 2 lightweight editorial items)
     6. Tee times section (conditional, not on new state)
     7. Page footer

   Visual tokens: --cb-chalk, --cb-chalk-2, --cb-chalk-3, --cb-green, --cb-ink,
   --cb-charcoal, --cb-mute, --cb-brass, --font-display, --font-mono, --font-ui.
   All theme-aware via v8.3.5 token system.
   ═══════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════
// === PART 1: Home render (Clubhouse editorial) ===
// ═══════════════════════════════════════════════════════════════════════════

// HQ desktop breakpoint: ≥960px gets the editorial HQ layout. Within HQ, four
// design bands (mobile / B / C / D) drive layout + typography:
//   mobile (<960):       mobile-editorial layout (Capacitor app, narrow browsers)
//   B      (960-1279):   single 600px lead column; chart promoted into lead flow
//   C      (1280-1439):  lead 480 + features 400
//   D      (1440+):      lead 480 + features 400 + agate 196
var HQ_BREAKPOINT = 960;
function _isHQViewport() { return window.innerWidth >= HQ_BREAKPOINT; }

// Returns the active design band based on viewport width.
function _currentBand() {
  var w = window.innerWidth;
  if (w < 960) return "mobile";
  if (w < 1280) return "B";
  if (w < 1440) return "C";
  return "D";
}

// Resize handler is bound once on first home render. Re-renders when crossing
// any band boundary (mobile/B/C/D) — band-specific layouts need this for
// chart promotion (B), features column toggle (B↔C), agate toggle (C↔D).
var _hqResizeBound = false;
var _hqLastBand = null;
function _bindHQResize() {
  if (_hqResizeBound) return;
  _hqResizeBound = true;
  _hqLastBand = _currentBand();
  window.addEventListener("resize", function() {
    if (Router.getPage() !== "home") return;
    var nowBand = _currentBand();
    if (nowBand !== _hqLastBand) {
      _hqLastBand = nowBand;
      Router.go("home", Router.getParams());
    }
  });
}

Router.register("home", function() {
  _bindHQResize();
  var ctx = _buildHomeContext();
  var w = window.innerWidth;
  var pageEl = document.querySelector('[data-page="home"]');
  if (_isHQViewport()) {
    try {
      _renderHQHome(ctx);
      if (pageEl) { pageEl.dataset.renderPath = "hq"; pageEl.dataset.renderWidth = w; }
    } catch (e) {
      console.error("[Home] HQ render failed, falling back to mobile:", e);
      _renderMobileHome(ctx);
      if (pageEl) { pageEl.dataset.renderPath = "hq-fallback"; pageEl.dataset.renderWidth = w; pageEl.dataset.renderError = (e && e.message) || String(e); }
    }
  } else {
    _renderMobileHome(ctx);
    if (pageEl) { pageEl.dataset.renderPath = "mobile"; pageEl.dataset.renderWidth = w; }
  }
});

// Build the shared render context — same data shape consumed by both layouts.
function _buildHomeContext() {
  var myRounds = currentUser ? PB.getPlayerRounds(currentUser.uid) : [];
  if (!myRounds.length && currentProfile && currentProfile.claimedFrom) {
    myRounds = PB.getPlayerRounds(currentProfile.claimedFrom);
  }
  var season = PB.getSeasonStandings(new Date().getFullYear());
  var state = _homeState(myRounds);
  var greetingWord = state === "new" ? "Welcome" : _greetingForTime();
  var firstName = _firstName(currentProfile);

  // Materialized stats preferred (kept in sync by persistPlayerStats).
  var totalRounds = (currentProfile && currentProfile.totalRounds != null) ? currentProfile.totalRounds : myRounds.length;
  var handicap = (currentProfile && currentProfile.computedHandicap != null) ? currentProfile.computedHandicap : null;
  var bestRound = (currentProfile && currentProfile.bestRound != null) ? currentProfile.bestRound : null;
  var bestRoundId = null;
  if (bestRound != null) {
    var myFull18 = myRounds.filter(function(r) {
      return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18);
    });
    var br = myFull18.find(function(r) { return r.score === bestRound; });
    if (br) bestRoundId = br.id;
  }
  var myLevel = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(currentUser ? currentUser.uid : null));

  return {
    myRounds: myRounds, season: season, state: state,
    greetingWord: greetingWord, firstName: firstName,
    totalRounds: totalRounds, handicap: handicap,
    bestRound: bestRound, bestRoundId: bestRoundId,
    myLevel: myLevel
  };
}

// v8.4.1 mobile-editorial layout — preserved unchanged below HQ_BREAKPOINT.
function _renderMobileHome(ctx) {
  var h = "";
  h += _renderEmailVerifyBanner();
  h += _renderGreeting(ctx.greetingWord, ctx.firstName);

  if (ctx.state === "active") {
    h += _renderLiveRoundCard();
  } else if (ctx.state === "new") {
    h += _renderNewUserIntro();
    h += _renderNewUserCTAs();
  } else {
    // state === "idle"
    h += _renderUnfinishedTripBanner(
      PB.getTrips(),
      currentUser ? currentUser.uid : null,
      currentProfile ? currentProfile.claimedFrom : null
    );
    h += _renderReadyCTA();
  }

  h += _renderStatsStrip(ctx.totalRounds, ctx.handicap, ctx.bestRound, ctx.bestRoundId, ctx.state === "new");

  if (ctx.state === "idle") {
    var pulses = _generatePulses(currentProfile, ctx.myRounds, ctx.myLevel, ctx.season);
    h += _renderPulses(pulses);
  }

  if (ctx.state !== "new") {
    var upcoming = _getUpcomingTeeTimes();
    if (upcoming && upcoming.length > 0) h += _renderTeeTimesSection(upcoming);
  }

  h += renderPageFooter();

  document.querySelector('[data-page="home"]').innerHTML = h;
}

// HQ desktop layout — masthead + three-column asymmetric grid (lead/features/agate).
// Ship 1b-i: shell + masthead only. Columns hold typed placeholders. Ships 1b-ii
// and 1b-iii populate the column components.
function _renderHQHome(ctx) {
  var h = "";
  h += _renderEmailVerifyBanner();
  h += _renderHQMasthead();
  h += _renderHQGrid(ctx);
  h += renderPageFooter();
  document.querySelector('[data-page="home"]').innerHTML = h;
}

// ─── Private helpers (home-only — underscore prefix) ──────────────────────

function _homeState(myRounds) {
  var hasLive = typeof liveState !== "undefined" && liveState && liveState.active === true;
  if (hasLive) return "active";
  if (!myRounds || myRounds.length === 0) return "new";
  return "idle";
}

function _greetingForTime() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function _firstName(profile) {
  if (!profile) return "Friend";
  var name = profile.name || profile.username || "";
  if (!name) return "Friend";
  var words = String(name).trim().split(/\s+/);
  if (words.length === 0) return "Friend";

  // Skip common titles if present as first word AND there are more words
  var titles = ["mr","mrs","ms","miss","dr","prof","sir","madam","mx"];
  var firstWordLower = words[0].replace(/\./g, "").toLowerCase();
  if (words.length > 1 && titles.indexOf(firstWordLower) !== -1) {
    return words[1];
  }
  return words[0] || "Friend";
}

function _formatDateEyebrow() {
  var d = new Date();
  var day = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
  var month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  return day + " · " + month + " " + d.getDate();
}

// Long-form date for HQ masthead: "Saturday · April 24, 2026"
function _formatHQMastheadDate() {
  var d = new Date();
  var day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  var month = ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()];
  return day + " · " + month + " " + d.getDate() + ", " + d.getFullYear();
}

// HQ masthead — full-width 56px-tall band: wordmark + date on left, weather pill +
// scope switcher on right. Weather is mocked for v1 (TODO v1.1: Open-Meteo wiring).
// Scope switcher is visual-only — "All Parbaughs" pill disabled until cross-league
// aggregate data path lands in a future ship.
function _renderHQMasthead() {
  var date = _formatHQMastheadDate();
  var condensed = window.innerWidth < 1280;
  var myLeagueLabel = condensed ? "League" : "My league";
  var allParbaughsLabel = condensed ? "All" : "All Parbaughs";
  var h = '<div style="background:var(--cb-chalk);border-bottom:1px solid var(--cb-chalk-3);max-width:1152px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between">';

  // Left: wordmark + divider + date
  h += '<div style="display:flex;align-items:center;gap:14px">';
  h += '<div style="font-family:var(--font-display);font-weight:700;font-size:22px;line-height:24px;color:var(--cb-ink);letter-spacing:-0.5px">Parbaughs</div>';
  h += '<div style="width:1px;height:24px;background:var(--cb-chalk-3)"></div>';
  h += '<div style="font-family:var(--font-ui);font-weight:500;font-size:13px;color:var(--cb-charcoal)">' + escHtml(date) + '</div>';
  h += '</div>';

  // Right: weather pill + scope switcher
  h += '<div style="display:flex;align-items:center;gap:12px">';
  // TODO v1.1: replace mock with Open-Meteo fetch (geo-permission + sessionStorage cache)
  h += '<div title="York, PA · weather will go live in a future update" style="display:inline-flex;align-items:center;height:28px;padding:0 12px;background:var(--cb-chalk-2);border-radius:6px;font-family:var(--font-ui);font-weight:500;font-size:12px;color:var(--cb-brass);letter-spacing:0.3px">58° · CLEAR</div>';
  // Scope switcher — visual-only until cross-league aggregate data exists
  h += '<div style="display:inline-flex;align-items:stretch;background:var(--cb-chalk-2);border-radius:6px;padding:2px;gap:2px">';
  h += '<div style="padding:6px 10px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.2px;color:var(--cb-ink);background:var(--cb-chalk);border-radius:4px;text-transform:uppercase">' + escHtml(myLeagueLabel) + '</div>';
  h += '<div title="All Parbaughs view coming in a future update" style="padding:6px 10px;font-family:var(--font-mono);font-size:11px;font-weight:500;letter-spacing:1.2px;color:var(--cb-mute);text-transform:uppercase;cursor:not-allowed;opacity:0.55">' + escHtml(allParbaughsLabel) + '</div>';
  h += '</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

// HQ three-column grid. At 1280-1439px renders lead (480) + features (400) only.
// At ≥1440px adds the agate rail (196). Content capped at 1152px and centered.
// Ship 1b-i: typed placeholders in each column. Ship 1b-ii fills lead + features;
// Ship 1b-iii fills agate.
function _renderHQGrid(ctx) {
  var band = _currentBand();
  var h = '<div style="max-width:1152px;margin:0 auto;padding:32px 24px 0;display:flex">';

  if (band === "B") {
    // Band B (960-1279): single 600px lead column, chart promoted into flow.
    h += '<div style="width:600px;flex-shrink:0">';
    h += _renderHQLeadColumnBandB(ctx);
    h += '</div>';
  } else {
    // Bands C (1280-1439) and D (1440+): existing v8.5.1 architecture.
    h += '<div style="width:480px;flex-shrink:0">';
    h += _renderHQLeadColumn(ctx);
    h += '</div>';
    h += '<div style="width:400px;flex-shrink:0;margin-left:32px">';
    h += _renderHQFeaturesColumn(ctx);
    h += '</div>';
    if (band === "D") {
      h += '<div style="width:196px;flex-shrink:0;margin-left:24px">';
      h += _renderHQPlaceholder("Agate rail", ctx.state);
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
  return '<div style="height:400px;background:var(--cb-chalk-2);border-radius:12px;border:1px dashed var(--cb-chalk-3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:var(--font-mono);color:var(--cb-mute);text-transform:uppercase">' +
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

// Editorial greeting hero — Fraunces 56 with italic name, eyebrow with date/weather,
// data-derived subhead, inline pull-quote stat block.
function _renderEditorialGreetingHero(ctx) {
  var d = new Date();
  var dayParts = ["MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","AFTERNOON","AFTERNOON","AFTERNOON","AFTERNOON","AFTERNOON","EVENING","EVENING","EVENING","EVENING","EVENING","EVENING","EVENING"];
  var dayName = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
  var eyebrow = dayName + " " + dayParts[d.getHours()] + " · YORK, PA · 58° AND CLEAR";

  var h = '<div>';
  // Eyebrow
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">' + escHtml(eyebrow) + '</div>';
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
  var thisMonth = (ctx.myRounds || []).filter(function(r) {
    if (!r.date) return false;
    var d = new Date(r.date + "T00:00:00");
    var now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  var roundsCaption = thisMonth + " THIS MONTH";

  var best = ctx.bestRound != null ? String(ctx.bestRound) : "—";
  var bestCourse = "";
  if (ctx.bestRoundId) {
    var br = (ctx.myRounds || []).find(function(r){ return r.id === ctx.bestRoundId; });
    if (br && br.course) bestCourse = br.course.toUpperCase();
  }
  var bestCaption = bestCourse || "";

  var streak = _hqStreakCount(ctx.myRounds);
  var streakVal = streak > 0 ? String(streak) : "—";
  var streakCaption = streak > 0 ? streak + " ROUND" + (streak === 1 ? "" : "S") + " UNDER" : "ROUNDS LOGGED: " + rounds;
  var streakColor = streak > 0 ? "var(--cb-moss)" : "var(--cb-mute)";

  // Universal 13-char caption cap with ellipsis — fits cleanly across all bands.
  var cells = [
    { label: "HCP", value: hcap, caption: _truncateCaption(hcapDelta), captionColor: hcapDeltaColor, click: "Router.go('records')" },
    { label: "ROUNDS", value: String(rounds), caption: _truncateCaption(roundsCaption), captionColor: "var(--cb-mute)", click: "Router.go('roundhistory')" },
    { label: "BEST", value: best, caption: _truncateCaption(bestCaption), captionColor: "var(--cb-mute)", click: ctx.bestRoundId ? ("Router.go('rounds',{roundId:'" + ctx.bestRoundId + "'})") : "" },
    { label: "STREAK", value: streakVal, caption: _truncateCaption(streakCaption), captionColor: streakColor, click: "" }
  ];

  var h = '<div style="display:flex;align-items:stretch;height:120px">';
  cells.forEach(function(c, i) {
    var sep = i > 0 ? "border-left:1px solid var(--cb-chalk-3);" : "";
    var cursor = c.click ? "cursor:pointer;" : "";
    var onclick = c.click ? ' onclick="' + c.click + '"' : "";
    h += '<div' + onclick + ' style="flex:1;' + sep + cursor + 'padding:18px 14px;display:flex;flex-direction:column;justify-content:center;gap:6px">';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + escHtml(c.label) + '</div>';
    h += '<div style="font-family:var(--font-display);font-size:var(--hq-stat-number-size);font-weight:700;color:var(--cb-ink);line-height:1;font-variant-numeric:lining-nums tabular-nums">' + escHtml(c.value) + '</div>';
    if (c.caption) h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.2px;color:' + c.captionColor + ';text-transform:uppercase">' + escHtml(c.caption) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// Season ladder top 10 — current user highlighted; if outside top 10, pinned
// below a divider with "YOUR POSITION" caption.
function _renderSeasonLadderTop10(ctx) {
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

  var top10 = standings.slice(0, 10);
  var leaderPts = top10[0] ? (top10[0].points || 0) : 0;
  var myIdx = standings.findIndex(function(s){ return s.id === uid || s.id === claimedFrom; });
  var myInTop10 = myIdx >= 0 && myIdx < 10;

  top10.forEach(function(s, idx) {
    h += _hqLadderRow(s, idx + 1, leaderPts, idx === myIdx);
  });

  if (!myInTop10 && myIdx >= 0) {
    h += '<div style="height:1px;background:var(--cb-chalk-3);margin:12px 0 10px"></div>';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:6px">YOUR POSITION</div>';
    h += _hqLadderRow(standings[myIdx], myIdx + 1, leaderPts, true);
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
  var h = '<div' + click + ' style="' + bg + rule + 'padding-right:12px;height:var(--hq-ladder-row-height);display:flex;align-items:center;gap:10px;cursor:pointer;border-radius:4px">';
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
  h += '<div style="flex-shrink:0;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);background:var(--cb-chalk-2);padding:5px 9px;border-radius:4px;text-transform:uppercase">' + escHtml(fmtPill) + '</div>';
  h += '</div>';
  return h;
}

// ─── Lead column · State 1 (active) ────────────────────────────────────────

// Live round expanded card — single-player editorial fallback (group leaderboard
// awaits sync-round / tee-time pairing infrastructure; backlog: post-Part-B).
function _renderLiveRoundExpandedCard(ctx) {
  if (typeof liveState === "undefined" || !liveState || !liveState.active) {
    return _renderHQPlaceholder("Lead column", ctx.state);
  }
  var course = liveState.course || "Round in progress";
  var hole = (liveState.currentHole || 0) + 1;
  var scored = liveState.scores ? liveState.scores.filter(function(s) { return s !== ""; }) : [];
  var thru = scored.length;
  var total = scored.reduce(function(a, b) { return a + parseInt(b); }, 0);

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) {
    var hd = liveState.holes && liveState.holes[i];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[i] || 4);
  }
  var diff = thru > 0 ? total - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
  var fmt = (liveState.format || "stroke").toString();
  var formatLabel = fmt === "scramble" ? "SCRAMBLE" : fmt.toUpperCase() + " PLAY";

  var h = '<div onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:16px;padding:32px;color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
  // Top eyebrow with pulsing dot
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cb-brass);display:flex;align-items:center;gap:10px;margin-bottom:18px">';
  h += '<span style="width:6px;height:6px;border-radius:50%;background:var(--cb-brass);animation:pulse-dot 2s infinite;flex-shrink:0"></span>';
  h += 'LIVE · HOLE ' + hole + ' · ' + escHtml(course.toUpperCase());
  h += '</div>';
  // Big score-vs-par block — score scales 64/80/88/96 across bands
  h += '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px">';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-live-score-size);font-weight:700;line-height:0.95;letter-spacing:-3px;color:var(--cb-chalk);font-variant-numeric:lining-nums tabular-nums">' + diffStr + '</div>';
  h += '<div style="text-align:right;padding-bottom:8px">';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);margin-bottom:6px">THRU</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-chalk);line-height:1">' + thru + '</div>';
  h += '</div>';
  h += '</div>';
  // Sub-meta row
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);letter-spacing:1.5px;color:rgba(var(--bg-rgb),0.65);margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid rgba(var(--bg-rgb),0.18)">';
  h += 'TOTAL ' + (thru > 0 ? total : "—") + ' · PAR ' + (thru > 0 ? parSoFar : "—") + ' · ' + formatLabel;
  h += '</div>';
  // CTA
  h += '<div style="background:var(--cb-chalk-2);height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px">';
  h += '<span style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-ink)">Open scorecard</span>';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="2"><path d="M5 4l4 4-4 4"/></svg>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Compact 80px strip showing user's standing in the active season.
function _renderSeasonPositionStrip(ctx) {
  var season = ctx.season;
  var standings = (season && season.standings) || [];
  var uid = currentUser ? currentUser.uid : null;
  var claimedFrom = currentProfile ? currentProfile.claimedFrom : null;
  var myIdx = standings.findIndex(function(s){ return s.id === uid || s.id === claimedFrom; });
  var weekInfo = _hqWeekNum(season);
  var label = (season && season.label) ? season.label.toUpperCase() : "SEASON";
  var eyebrow = label + " · WEEK " + weekInfo.week + "/" + weekInfo.total;

  var h = '<div onclick="Router.go(\'standings\')" style="background:var(--cb-chalk-2);border-radius:12px;padding:18px 24px;cursor:pointer">';
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

// 30-day handicap trend chart. Theme-aware via CSS custom-property in style attr
// (presentation attributes don't resolve var(), so we wire color through the SVG
// root's style and use currentColor on plot elements). Chart width configurable
// via opts.width (defaults 400 for features column; 600 when promoted into the
// Band B lead column).
function _renderHandicapTrendChart(ctx, opts) {
  opts = opts || {};
  var chartWidth = opts.width || 400;
  var rounds = ctx.myRounds || [];
  var now = Date.now();
  var windowMs = 30 * 86400000;
  var recent = rounds.filter(function(r) {
    if (r.format === "scramble" || r.format === "scramble4") return false;
    var t = r.timestamp || (r.date ? new Date(r.date).getTime() : 0);
    return t && (now - t) <= windowMs;
  }).sort(function(a, b) {
    var ax = a.timestamp || new Date(a.date + "T00:00:00").getTime();
    var bx = b.timestamp || new Date(b.date + "T00:00:00").getTime();
    return ax - bx;
  });

  var h = '<div>';
  // Header
  var current = ctx.handicap != null ? Number(ctx.handicap).toFixed(1) : "—";
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">HANDICAP</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">' + current + '</div>';
  h += '</div>';
  // Range pills
  h += '<div style="display:inline-flex;background:var(--cb-chalk-2);border-radius:6px;padding:2px;gap:2px">';
  h += '<div style="padding:5px 9px;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.2px;color:var(--cb-ink);background:var(--cb-chalk);border-radius:4px;text-transform:uppercase">30D</div>';
  h += '<div title="Coming in a future update" style="padding:5px 9px;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:500;letter-spacing:1.2px;color:var(--cb-mute);text-transform:uppercase;cursor:not-allowed;opacity:0.55">90D</div>';
  h += '<div title="Coming in a future update" style="padding:5px 9px;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:500;letter-spacing:1.2px;color:var(--cb-mute);text-transform:uppercase;cursor:not-allowed;opacity:0.55">1Y</div>';
  h += '</div>';
  h += '</div>';

  if (recent.length < 3) {
    h += '<div style="height:140px;background:var(--cb-chalk-2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">TREND APPEARS AFTER 3 ROUNDS</div>';
    h += '</div>';
    return h;
  }

  // Build cumulative-handicap series. Each point = handicap as of that round date.
  var allUpToRecent = rounds.slice().sort(function(a, b) {
    var ax = a.timestamp || new Date(a.date + "T00:00:00").getTime();
    var bx = b.timestamp || new Date(b.date + "T00:00:00").getTime();
    return ax - bx;
  });
  var series = [];
  recent.forEach(function(r, idx) {
    var rt = r.timestamp || new Date(r.date + "T00:00:00").getTime();
    var upTo = allUpToRecent.filter(function(x) {
      var xt = x.timestamp || new Date(x.date + "T00:00:00").getTime();
      return xt <= rt;
    });
    var hcap = PB.calcHandicap(upTo);
    if (hcap !== null && Number.isFinite(hcap)) series.push({ value: hcap, ts: rt });
  });

  if (series.length < 2) {
    h += '<div style="height:140px;background:var(--cb-chalk-2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">TREND APPEARS AFTER 3 ROUNDS</div>';
    h += '</div>';
    return h;
  }

  // Render inline SVG with currentColor + style-defined accent.
  var w = chartWidth, height = 140;
  var pad = { t: 14, b: 22, l: 0, r: 32 };
  var chartW = w - pad.l - pad.r, chartH = height - pad.t - pad.b;
  var values = series.map(function(p){return p.value});
  var yMin = Math.min.apply(null, values), yMax = Math.max.apply(null, values);
  if (yMax - yMin < 1) { yMin -= 0.5; yMax += 0.5; } // floor minimum span
  var range = yMax - yMin;
  function px(i) { return pad.l + (i / (series.length - 1)) * chartW; }
  function py(v) { return pad.t + (1 - (v - yMin) / range) * chartH; }

  var svg = '<svg width="' + w + '" height="' + height + '" viewBox="0 0 ' + w + ' ' + height + '" style="display:block;color:var(--cb-brass)">';
  // Baseline
  svg += '<line x1="0" y1="' + (pad.t + chartH) + '" x2="' + chartW + '" y2="' + (pad.t + chartH) + '" stroke="var(--cb-chalk-3)" stroke-width="1"/>';
  // Area fill
  var areaPath = 'M' + px(0) + ',' + py(series[0].value);
  for (var i = 1; i < series.length; i++) areaPath += 'L' + px(i) + ',' + py(series[i].value);
  areaPath += 'L' + px(series.length-1) + ',' + (pad.t + chartH) + 'L' + px(0) + ',' + (pad.t + chartH) + 'Z';
  svg += '<path d="' + areaPath + '" fill="currentColor" opacity="0.08"/>';
  // Line
  var linePath = 'M' + px(0) + ',' + py(series[0].value);
  for (var li = 1; li < series.length; li++) linePath += 'L' + px(li) + ',' + py(series[li].value);
  svg += '<path d="' + linePath + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  // Last-point dot
  svg += '<circle cx="' + px(series.length-1) + '" cy="' + py(series[series.length-1].value) + '" r="4" fill="currentColor"/>';
  // Y annotations (right edge)
  svg += '<text x="' + (chartW + 6) + '" y="' + (pad.t + 4) + '" font-family="Fraunces,serif" font-size="10" fill="var(--cb-mute)">' + yMax.toFixed(1) + '</text>';
  svg += '<text x="' + (chartW + 6) + '" y="' + (pad.t + chartH) + '" font-family="Fraunces,serif" font-size="10" fill="var(--cb-mute)">' + yMin.toFixed(1) + '</text>';
  // X month markers (first + last)
  var monthShort = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var firstM = monthShort[new Date(series[0].ts).getMonth()];
  var lastM = monthShort[new Date(series[series.length-1].ts).getMonth()];
  svg += '<text x="0" y="' + (height - 4) + '" font-family="ui-monospace,monospace" font-size="9" fill="var(--cb-mute)" letter-spacing="1">' + firstM + '</text>';
  svg += '<text x="' + chartW + '" y="' + (height - 4) + '" font-family="ui-monospace,monospace" font-size="9" fill="var(--cb-mute)" text-anchor="end" letter-spacing="1">' + lastM + '</text>';
  svg += '</svg>';

  h += '<div style="background:var(--cb-chalk-2);border-radius:8px;padding:14px 16px">';
  h += svg;
  h += '</div>';
  h += '</div>';
  return h;
}

// Compact league activity feed. Synchronous: reads PB.getRounds() last 30 +
// state.activity recent items, time-bucketed (today / yesterday / this week).
// TODO v1.x: upgrade to loadHomeActivityFeed (Firestore-backed, richer set).
function _renderActivityFeedCompact(ctx, limit) {
  var items = _hqBuildActivityItems(limit || 12);
  var h = '<div>';
  // Header
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">ACTIVITY</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">League pulse</div>';
  h += '</div>';
  h += '<div onclick="Router.go(\'feed\')" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);cursor:pointer;text-transform:uppercase">Full feed →</div>';
  h += '</div>';

  if (!items.length) {
    h += '<div style="padding:32px 0;text-align:center;font-family:var(--font-mono);font-size:11px;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">QUIET WEEK</div>';
    h += '</div>';
    return h;
  }

  // Bucket by relative time
  var now = Date.now();
  var startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
  var startOfTodayMs = startOfToday.getTime();
  var startOfYesterdayMs = startOfTodayMs - 86400000;
  var startOfWeekMs = startOfTodayMs - 7 * 86400000;
  var buckets = { today: [], yesterday: [], week: [], earlier: [] };
  items.forEach(function(it) {
    if (it.ts >= startOfTodayMs) buckets.today.push(it);
    else if (it.ts >= startOfYesterdayMs) buckets.yesterday.push(it);
    else if (it.ts >= startOfWeekMs) buckets.week.push(it);
    else buckets.earlier.push(it);
  });

  function renderBucket(label, list, brassEyebrow) {
    if (!list.length) return "";
    var color = brassEyebrow ? "var(--cb-brass)" : "var(--cb-mute)";
    var b = '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;color:' + color + ';text-transform:uppercase;padding:10px 0 6px;border-top:1px solid var(--cb-chalk-3)">' + label + '</div>';
    list.forEach(function(it) {
      b += '<div' + (it.dest ? ' onclick="' + it.dest + '" style="cursor:pointer;' : ' style="') + 'min-height:56px;padding:8px 0;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--cb-chalk-3)">';
      var initial = (it.actorName.charAt(0) || "?").toUpperCase();
      b += '<div style="width:32px;height:32px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700;flex-shrink:0">' + escHtml(initial) + '</div>';
      b += '<div style="flex:1;min-width:0;line-height:1.4">';
      b += '<div style="font-family:var(--font-ui);font-size:13px;font-weight:500;color:var(--cb-ink)">' + escHtml(it.text) + '</div>';
      if (it.sub) b += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);letter-spacing:0.6px;margin-top:2px">' + escHtml(it.sub) + '</div>';
      b += '</div>';
      b += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);flex-shrink:0">' + escHtml(it.timeAgo) + '</div>';
      b += '</div>';
    });
    return b;
  }

  h += '<div>';
  h += renderBucket("TODAY", buckets.today, true);
  h += renderBucket("YESTERDAY", buckets.yesterday, false);
  h += renderBucket("THIS WEEK", buckets.week, false);
  h += renderBucket("EARLIER", buckets.earlier, false);
  h += '</div>';

  h += '</div>';
  return h;
}

// Synchronous activity item builder. Reads PB.getRounds() for league-wide rounds
// and merges with state.activity events. Caps query depth at 30 rounds + 30
// activity items pre-sort to bound work in large leagues.
function _hqBuildActivityItems(limit) {
  var items = [];
  // Recent rounds (last 30, scramble-grouped)
  if (typeof PB !== "undefined" && PB.getRounds) {
    var rounds = PB.getRounds() || [];
    var sorted = rounds.slice().sort(function(a,b) {
      return (b.timestamp || 0) - (a.timestamp || 0);
    }).slice(0, 30);
    sorted.forEach(function(r) {
      if (!r) return;
      var ts = r.timestamp || (r.date ? new Date(r.date + "T00:00:00").getTime() : 0);
      if (!ts) return;
      var actor = r.playerName || (r.player && PB.getPlayer ? (PB.getPlayer(r.player) || {}).name : "") || "A Parbaugh";
      var text = actor + " logged " + (r.score || "—") + " at " + (r.course || "a course");
      var fmt = r.format && r.format !== "stroke" ? r.format : "";
      var holes = r.holesPlayed && r.holesPlayed <= 9 ? " · 9 holes" : "";
      var sub = (fmt ? fmt.charAt(0).toUpperCase() + fmt.slice(1) : "") + holes;
      items.push({ ts: ts, actorName: actor, text: text, sub: sub.replace(/^ · /, ""), timeAgo: feedTimeAgo(ts), dest: r.id ? "Router.go('rounds',{roundId:'" + r.id + "'})" : "" });
    });
  }
  // state.activity (in-memory events)
  if (typeof state !== "undefined" && state && state.activity) {
    state.activity.slice(-30).forEach(function(a) {
      if (!a || !a.ts) return;
      var actor = a.name || a.playerName || "Member";
      var text = actor;
      if (a.type === "post") text += " posted: " + (a.text || "").slice(0, 60);
      else if (a.type === "trip_created") text += " started a trip";
      else if (a.type === "review") text += " reviewed " + (a.course || "a course");
      else if (a.type === "member_joined") text += " joined the league";
      else text += " did something";
      items.push({ ts: a.ts, actorName: actor, text: text, sub: "", timeAgo: feedTimeAgo(a.ts), dest: "" });
    });
  }
  items.sort(function(a, b) { return b.ts - a.ts; });
  return items.slice(0, limit);
}

// ─── Column composers ──────────────────────────────────────────────────────

function _renderHQLeadColumn(ctx) {
  if (ctx.state === "active") return _renderHQLeadColumnActive(ctx);
  if (ctx.state === "new") return _renderHQPlaceholder("Lead column", ctx.state);
  return _renderHQLeadColumnIdle(ctx);
}

function _renderHQLeadColumnIdle(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:32px">';
  h += _renderEditorialGreetingHero(ctx);
  h += _renderStatsSnapshotQuartet(ctx);
  h += _renderSeasonLadderTop10(ctx);
  var recent = (ctx.myRounds || []).slice(0, 3);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function _renderHQLeadColumnActive(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:32px">';
  h += _renderLiveRoundExpandedCard(ctx);
  h += _renderSeasonPositionStrip(ctx);
  var recent = (ctx.myRounds || []).slice(0, 2);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function _renderHQFeaturesColumn(ctx) {
  if (ctx.state === "new") return _renderHQPlaceholder("Features column", ctx.state);
  var feedLimit = ctx.state === "active" ? 8 : 12;
  var h = '<div style="display:flex;flex-direction:column;gap:32px">';
  h += _renderHandicapTrendChart(ctx);
  h += _renderActivityFeedCompact(ctx, feedLimit);
  // Events strip deferred to v1.x
  h += '</div>';
  return h;
}

// ─── Band B (960-1279) sibling lead-column composers ───────────────────────
// At Band B the features column is hidden, so the handicap chart is promoted
// into the lead column flow at 600px width. Activity feed is dropped.
// State 3 (new user) at Band B still placeholder until v8.6.1.

function _renderHQLeadColumnBandB(ctx) {
  if (ctx.state === "active") return _renderHQLeadColumnBandBActive(ctx);
  if (ctx.state === "new") return _renderHQPlaceholder("Lead column", ctx.state);
  return _renderHQLeadColumnBandBIdle(ctx);
}

function _renderHQLeadColumnBandBIdle(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:32px">';
  h += _renderEditorialGreetingHero(ctx);
  h += _renderStatsSnapshotQuartet(ctx);
  h += _renderHandicapTrendChart(ctx, { width: 600 });  // promoted from features
  h += _renderSeasonLadderTop10(ctx);
  var recent = (ctx.myRounds || []).slice(0, 3);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function _renderHQLeadColumnBandBActive(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:32px">';
  h += _renderLiveRoundExpandedCard(ctx);
  h += _renderSeasonPositionStrip(ctx);
  h += _renderHandicapTrendChart(ctx, { width: 600 });  // promoted from features
  var recent = (ctx.myRounds || []).slice(0, 2);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function _renderEmailVerifyBanner() {
  if (!currentUser || currentUser.emailVerified) return "";
  var h = '<div style="padding:10px 22px;background:rgba(180,137,62,0.08);border-bottom:1px solid rgba(180,137,62,0.15);display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="1.5" style="flex-shrink:0"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z"/><path d="M1 5l7 4 7-4"/></svg>';
  h += '<div style="flex:1;font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;color:var(--cb-brass);line-height:1.4">Verify your email to unlock wagers, bounties, DMs, and the shop.</div>';
  h += '<button style="background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:4px;font:700 10px/1 var(--font-ui);padding:6px 12px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px" onclick="sendVerificationEmail()">Verify</button>';
  h += '</div>';
  return h;
}

function _renderGreeting(greetingWord, firstName) {
  var h = '<div style="padding:28px 22px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:10px">' + _formatDateEyebrow() + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-ink);line-height:1.15;letter-spacing:-0.5px">';
  h += escHtml(greetingWord) + ',<br>';
  h += '<span style="font-style:italic;font-weight:600">' + escHtml(firstName) + '.</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderLiveRoundCard() {
  if (typeof liveState === "undefined" || !liveState || !liveState.active) return "";

  var course = liveState.course || "Round in progress";
  var hole = (liveState.currentHole || 0) + 1;
  var scored = liveState.scores ? liveState.scores.filter(function(s) { return s !== ""; }) : [];
  var thru = scored.length;
  var total = scored.reduce(function(a, b) { return a + parseInt(b); }, 0);

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) {
    var hd = liveState.holes && liveState.holes[i];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[i] || 4);
  }
  var diff = thru > 0 ? total - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));

  var fmt = (liveState.format || "stroke").toString();
  var formatLabel = fmt === "scramble" ? "SCRAMBLE" : fmt.toUpperCase() + " PLAY";

  var h = '<div style="padding:18px 22px 0">';
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:16px;padding:22px;color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h += '<span style="width:6px;height:6px;border-radius:50%;background:var(--cb-brass);animation:pulse-dot 2s infinite"></span>';
  h += 'LIVE · YOUR ROUND';
  h += '</div>';
  h += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--cb-chalk);line-height:1.2;letter-spacing:-0.3px;margin-bottom:6px">' + escHtml(course) + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1.5px">HOLE ' + hole + ' · THRU ' + thru + ' · ' + formatLabel + '</div>';
  h += '<div style="display:flex;gap:22px;padding-top:16px;margin-top:16px;border-top:1px solid rgba(var(--bg-rgb),0.14)">';
  h += '<div style="flex:1">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">YOU</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-chalk);line-height:1">' + (thru > 0 ? total : "—") + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1px;margin-top:4px">' + diffStr + (thru > 0 ? " THRU " + thru : "") + '</div>';
  h += '</div>';
  h += '<div style="flex:1;text-align:right;align-self:center">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">RESUME</div>';
  h += '<div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--cb-chalk)">Scorecard →</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderUnfinishedTripBanner(trips, uid, claimedFrom) {
  if (!uid || !trips || !trips.length) return "";
  var today = localDateStr();
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var todayDay = dayNames[new Date().getDay()];
  var h = "";
  trips.forEach(function(tr) {
    if (!tr.courses || !tr.startDate || !tr.endDate) return;
    if (today < tr.startDate || today > tr.endDate) return;
    var isMember = tr.members && (
      tr.members.indexOf(uid) !== -1 ||
      (claimedFrom && tr.members.indexOf(claimedFrom) !== -1)
    );
    if (!isMember && !isFounderRole(currentProfile)) return;
    tr.courses.forEach(function(crs) {
      if (crs.finished) return;
      var courseDay = (crs.d || "").split(" ")[0];
      if (courseDay && courseDay !== todayDay) return;
      var tid = escHtml(tr.id);
      var ck = escHtml(crs.key);
      h += '<div data-trip-id="' + tid + '" data-course-key="' + ck + '" class="tappable" onclick="Router.go(\'scorecard\',{tripId:this.getAttribute(\'data-trip-id\'),course:this.getAttribute(\'data-course-key\')})" style="margin:18px 22px 0;padding:14px 16px;background:var(--cb-chalk-2);border-left:2px solid var(--cb-moss);border-radius:10px;cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:10px;pointer-events:none">';
      h += '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--cb-moss)" stroke-width="1.5" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
      h += '<div style="flex:1">';
      h += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--cb-ink);line-height:1.3">' + escHtml(crs.n || crs.key) + ' — scores not finalized</div>';
      h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px">' + escHtml(tr.name) + ' · Tap to review and finish round</div>';
      h += '</div>';
      h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--cb-mute)" stroke-width="1.5" style="flex-shrink:0"><path d="M6 4l4 4-4 4"/></svg>';
      h += '</div></div>';
    });
  });
  return h;
}

function _renderReadyCTA() {
  var h = '<div style="padding:18px 22px 0">';
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="padding:22px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:10px">NO ROUND TODAY</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-ink);line-height:1.2;letter-spacing:-0.2px;margin-bottom:8px">Ready when you are.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-charcoal);line-height:1.55;max-width:380px;margin-bottom:16px">Start a round and the scorecard, skins pot and your caddie will wake up.</div>';
  h += '<div style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;background:var(--cb-green);color:var(--cb-chalk);border-radius:8px;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.3px">';
  h += '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14V2l8 3-8 3"/></svg>';
  h += 'Start a round';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderNewUserIntro() {
  var h = '<div style="padding:10px 22px 0">';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.55;max-width:440px">You’re in. Start by logging a round, or hit the range to warm up.</div>';
  h += '</div>';
  return h;
}

function _renderNewUserCTAs() {
  var h = '<div style="padding:18px 22px 0;display:flex;gap:10px;flex-wrap:wrap">';
  // First round
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">START HERE</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Your first round.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Log a full round and the Clubhouse comes alive.</div>';
  h += '</div>';
  // Range session
  h += '<div class="tappable" onclick="Router.go(\'range\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">OR WARM UP</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Range session.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Track your bucket and focus drills.</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderStatsStrip(totalRounds, handicap, bestRound, bestRoundId, isNew) {
  var roundsStr = isNew ? "0" : String(totalRounds != null ? totalRounds : 0);
  var hcapStr = (!isNew && handicap != null && !isNaN(handicap)) ? (+handicap).toFixed(1) : "—";
  var bestStr = (!isNew && bestRound != null) ? String(bestRound) : "—";

  var h = '<div style="padding:22px;display:grid;grid-template-columns:repeat(3, 1fr);gap:10px">';

  // ROUNDS
  var roundsClickable = !isNew && totalRounds > 0;
  h += '<div' + (roundsClickable ? ' class="tappable" onclick="Router.go(\'roundhistory\')"' : '') + ' style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px;' + (roundsClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">ROUNDS</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + roundsStr + '</div>';
  h += '</div>';

  // HCP
  h += '<div style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">HCP</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + hcapStr + '</div>';
  h += '</div>';

  // BEST
  var bestClickable = !!bestRoundId;
  h += '<div' + (bestClickable ? ' class="tappable" onclick="Router.go(\'rounds\',{roundId:\'' + escHtml(bestRoundId) + '\'})"' : '') + ' style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px;' + (bestClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">BEST</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + bestStr + '</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

function _generatePulses(profile, myRounds, myLevel, season) {
  var pulses = [];

  // Near level-up (≤ 200 XP to next)
  if (myLevel && myLevel.level > 1 && (myLevel.nextLevelXp - myLevel.xp) <= 200 && (myLevel.nextLevelXp - myLevel.xp) > 0) {
    var xpToNext = myLevel.nextLevelXp - myLevel.xp;
    pulses.push({ eyebrow: "NEXT LEVEL", text: xpToNext + " XP to Level " + (myLevel.level + 1) + "." });
  }

  // 1-2 rounds: encourage handicap threshold
  if (myRounds && myRounds.length > 0 && myRounds.length < 3) {
    var n = 3 - myRounds.length;
    pulses.push({
      eyebrow: "HANDICAP",
      text: n + " more round" + (n === 1 ? "" : "s") + " until your handicap is official."
    });
  }

  // Season gap — only if under ~80 pts (reachable)
  if (season && season.standings && season.standings.length > 0) {
    var uid = currentUser ? currentUser.uid : null;
    var claimedFrom = profile ? profile.claimedFrom : null;
    var myStanding = season.standings.find(function(s) { return s.id === uid || s.id === claimedFrom; });
    if (myStanding) {
      var idx = season.standings.indexOf(myStanding);
      if (idx > 0) {
        var ahead = season.standings[idx - 1];
        var gap = ahead.points - myStanding.points;
        if (gap > 0 && gap <= 80) {
          pulses.push({
            eyebrow: "SEASON",
            text: gap + " point" + (gap === 1 ? "" : "s") + " behind " + (ahead.name || ahead.username || "them") + "."
          });
        }
      }
    }
  }

  return pulses.slice(0, 2);
}

function _renderPulses(pulses) {
  if (!pulses || pulses.length === 0) return "";
  var h = '<div style="padding:0 22px">';
  pulses.forEach(function(p) {
    h += '<div style="padding:14px 16px;background:var(--cb-chalk-2);border-left:2px solid var(--cb-brass);border-radius:6px;margin-bottom:8px">';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:4px">' + escHtml(p.eyebrow) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-ink);line-height:1.5">' + escHtml(p.text) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

function _getUpcomingTeeTimes() {
  if (typeof liveTeeTimes === "undefined" || !liveTeeTimes) return null;
  var today = localDateStr();
  var upcoming = liveTeeTimes.filter(function(t) {
    return t.date && t.date >= today && t.status !== "cancelled";
  });
  // Sort by date (ascending), then time
  upcoming.sort(function(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.time || "") < (b.time || "") ? -1 : 1;
  });
  return upcoming.slice(0, 3);
}

function _teeTimeDateLabel(dateStr, timeStr) {
  if (!dateStr) return (timeStr || "").toUpperCase();
  var today = localDateStr();
  var d = new Date(Date.now() + 86400000);
  var tomorrow = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  var prefix;
  if (dateStr === today) prefix = "TODAY";
  else if (dateStr === tomorrow) prefix = "TMRW";
  else {
    var dd = new Date(dateStr + "T12:00:00");
    prefix = ["SUN","MON","TUE","WED","THU","FRI","SAT"][dd.getDay()];
  }
  return prefix + (timeStr ? " " + timeStr : "");
}

function _renderTeeTimesSection(upcoming) {
  if (!upcoming || upcoming.length === 0) return "";
  var h = '<div style="padding:22px 22px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:10px">ON THE TEE</div>';
  upcoming.forEach(function(t, i) {
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k) { return t.responses[k] === "accepted"; }).length : 0;
    var label = _teeTimeDateLabel(t.date, t.time);
    h += '<div class="tappable" onclick="Router.go(\'teetimes\')" style="padding:12px 0;' + (i === 0 ? '' : 'border-top:1px solid var(--cb-chalk-3);') + 'display:flex;align-items:baseline;gap:14px;cursor:pointer">';
    h += '<div style="font-family:var(--font-mono);font-size:11px;color:var(--cb-brass);font-weight:700;letter-spacing:0.5px;min-width:74px;flex-shrink:0">' + escHtml(label) + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--cb-ink);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(t.courseName || "Tee time") + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px">' + (t.postedByName ? "Posted by " + escHtml(t.postedByName) + " · " : "") + accepted + ' going</div>';
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// === PART 2: External helpers (DO NOT DELETE — used by other pages) ===
// These functions are called from pages outside home.js. Removing them will
// break: 11+ pages that call renderPageFooter(), members.js (showRivalryDetail),
// scorecard.js + settings.js (doCopy / doRestore). Future cleanup ship can
// extract these to src/core/page-helpers.js — logged to backlog.
// ═══════════════════════════════════════════════════════════════════════════

// Shared footer links rendered at the bottom of every main tab page.
// Used by: activity, drills, findplayers, leagues, members, more, records,
// richlist, roundhistory, teetimes, trips, wagers.
function renderPageFooter() {
  var d = "·";
  var s = "font-size:11px;color:var(--muted2);cursor:pointer;letter-spacing:.5px";
  var sm = "font-size:11px;color:var(--muted2)";
  return '<div style="text-align:center;padding:20px 16px 8px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap">' +
    '<span style="' + s + '" onclick="Router.go(\'merch\')">Merch</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="Router.go(\'rules\')">Rules</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="Router.go(\'faq\')">FAQ</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="openFeatureRequest()">Feature Request</span>' +
    '</div>' +
    '<div style="text-align:center;padding:2px 16px 16px">' +
    '<span style="' + s + '" onclick="Router.go(\'caddynotes\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12" style="vertical-align:middle"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> The Caddy Notes</span>' +
    '</div>';
}

// Rivalry detail view — used by members.js H2H list.
function showRivalryDetail(p1id, p2id) {
  var p1 = PB.getPlayer(p1id), p2 = PB.getPlayer(p2id);
  if (!p1 || !p2) return;
  var h2h = calcH2H(p1id, p2id);

  // Find shared rounds for match history
  var p1rounds = PB.getPlayerRounds(p1id);
  var p2rounds = PB.getPlayerRounds(p2id);
  var matches = [];
  var matchedKeys = {};
  p1rounds.forEach(function(r1) {
    var match = p2rounds.find(function(r2) { return r2.course === r1.course && r2.date === r1.date; });
    if (match) {
      matchedKeys[r1.course + "|" + r1.date] = true;
      matches.push({ date: r1.date, course: r1.course, p1score: r1.score, p2score: match.score, winner: r1.score < match.score ? p1id : match.score < r1.score ? p2id : "tie" });
    }
  });
  // Also include trip scorecard rounds
  PB.getTrips().forEach(function(tr) {
    if (!tr.courses) return;
    tr.courses.forEach(function(crs) {
      var s1 = PB.getScores(tr.id, crs.key, p1id);
      var s2 = PB.getScores(tr.id, crs.key, p2id);
      if (!s1 || !s1.length || !s2 || !s2.length) return;
      var t1=0,t2=0,h1c=0,h2c=0;
      s1.forEach(function(v){if(v!==""&&v!==null&&v!==undefined){t1+=parseInt(v)||0;h1c++;}});
      s2.forEach(function(v){if(v!==""&&v!==null&&v!==undefined){t2+=parseInt(v)||0;h2c++;}});
      if(h1c===0||h2c===0||h1c!==h2c) return;
      var key = (crs.n||crs.key)+"|"+(crs.d||tr.startDate||"");
      if(matchedKeys[key]) return;
      matches.push({date:crs.d||tr.startDate||"",course:crs.n||crs.key,p1score:t1,p2score:t2,winner:t1<t2?p1id:t1>t2?p2id:"tie"});
    });
  });
  matches.sort(function(a,b) { return b.date > a.date ? 1 : -1; });

  var h = '<div class="sh"><h2>' + escHtml(p1.name) + ' vs ' + escHtml(p2.name) + '</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // Big score display
  h += '<div style="text-align:center;padding:20px">';
  h += '<div class="rivalry-vs">';
  h += '<div class="rv-player">' + renderAvatar(p1, 56, true) + '<div class="rv-name">' + renderUsername(p1, 'font-size:12px;color:var(--cream);', false) + '</div></div>';
  h += '<div class="rv-x">vs</div>';
  h += '<div class="rv-player">' + renderAvatar(p2, 56, true) + '<div class="rv-name">' + renderUsername(p2, 'font-size:12px;color:var(--cream);', false) + '</div></div>';
  h += '</div>';
  h += '<div class="rv-score" style="margin-top:12px">' + h2h.p1wins + ' — ' + h2h.p2wins + '</div>';
  h += '<div class="rv-label">' + (h2h.ties > 0 ? h2h.ties + ' ties' : 'Head-to-head record') + '</div>';
  h += '</div>';

  // Action buttons
  h += '<div class="section"><div style="display:flex;gap:8px">';
  h += '<button class="btn full green" style="flex:1" onclick="Router.go(\'challenges\',{opponent:\'' + p2id + '\'})">Issue Challenge</button>';
  h += '<button class="btn full outline" style="flex:1" onclick="Router.go(\'tee-create\')">Post Tee Time</button>';
  h += '</div></div>';

  // Match history
  if (matches.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Match History</span></div>';
    matches.forEach(function(m) {
      var winnerName = m.winner === p1id ? p1.name : m.winner === p2id ? p2.name : "Tie";
      var winColor = m.winner === "tie" ? "var(--muted)" : "var(--gold)";
      h += '<div class="card"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:12px;font-weight:600">' + escHtml(m.course) + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">' + m.date + '</div></div>';
      h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:' + winColor + '">' + m.p1score + ' — ' + m.p2score + '</div>';
      h += '<div style="font-size:9px;color:var(--muted)">' + escHtml(winnerName) + '</div></div>';
      h += '</div></div></div>';
    });
    h += '</div>';
  } else {
    h += '<div class="section"><div class="card"><div class="empty"><div class="empty-text">No head-to-head matches yet. Time to change that.</div></div></div></div>';
  }

  // Reuse the standings page container for this detail view
  document.querySelector('[data-page="standings"]').innerHTML = h;
}

// Backup export — used by scorecard.js and settings.js.
function doCopy() {
  var code = PB.exportBackup();
  navigator.clipboard.writeText(code).then(function() { Router.toast("Backup copied!"); }).catch(function() { prompt("Copy this code:", code); });
}

// Backup import — used by scorecard.js and settings.js.
function doRestore() {
  var code = prompt("Paste backup code:");
  if (code && PB.importBackup(code)) { Router.toast("Restored!"); Router.go("home"); }
  else if (code) Router.toast("Invalid code");
}
