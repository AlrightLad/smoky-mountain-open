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

// HQ desktop breakpoint: ≥720px gets the editorial HQ layout. Within HQ, five
// design bands (mobile / A / B / C / D) drive layout + typography:
//   mobile (<720):       mobile-editorial layout (v8.6.3 lowers cutoff)
//   A      (720-959):    drawer-nav, single column 640px, two-row masthead
//   B      (960-1279):   single 600px lead column; chart promoted into lead flow
//   C      (1280-1439):  lead 480 + features 400
//   D      (1440+):      lead 480 + features 400 + agate 196
var HQ_BREAKPOINT = 720;
function _isHQViewport() { return window.innerWidth >= HQ_BREAKPOINT; }

// Returns the active design band based on viewport width.
// TODO (post-v8.11.4): when at least 3 pages consume PB.pageShell, deprecate
// this duplicate and read from PB.pageShell.currentBand() instead. Today both
// home.js (for _bindHQResize) and page-shell.js own a copy. Constants must
// stay in sync — see page-shell.js BREAKPOINTS.
function _currentBand() {
  var w = window.innerWidth;
  if (w < 720) return "mobile";
  if (w < 960) return "A";
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
      // Shell stamps data-render-path="hq-shell" + data-render-band itself
      // during PB.pageShell.render. We do NOT overwrite — preserves the shell
      // observability surface for debugging. Width/page already in shell stamps.
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
  // v8.11.7: handicap + bestRound fall back to live computation when cached
  // fields are null. Original asymmetry (totalRounds had live fallback,
  // handicap + bestRound did not) caused HQ Home to render "—" on devices
  // where persistPlayerStats hadn't run, even with rounds loaded.
  //
  // Handicap: pass myRounds directly to PB.calcHandicap. Function self-gates
  // (n < 3 → null per handicap.js:88), no caller-side length check needed.
  //
  // Best round: inline IIFE with the SAME filter persistPlayerStats uses
  // (sync.js:146-148) — visibility !== "private", format !== scramble/scramble4,
  // holesPlayed >= 18 OR undefined. Returns null when no qualifying rounds.
  var totalRounds = (currentProfile && currentProfile.totalRounds != null) ? currentProfile.totalRounds : myRounds.length;
  var handicap = (currentProfile && currentProfile.computedHandicap != null)
    ? currentProfile.computedHandicap
    : (myRounds.length ? PB.calcHandicap(myRounds) : null);
  var bestRound = (currentProfile && currentProfile.bestRound != null)
    ? currentProfile.bestRound
    : (function() {
        var fullPub = myRounds.filter(function(r) {
          return r.format !== "scramble" && r.format !== "scramble4"
            && (!r.holesPlayed || r.holesPlayed >= 18)
            && r.visibility !== "private";
        });
        return fullPub.length ? Math.min.apply(null, fullPub.map(function(r){return r.score;})) : null;
      })();
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

// HQ desktop layout — thin orchestrator over PB.pageShell (v8.11.4 refactor).
// Shell owns the chrome (banner placement above masthead, masthead variant
// dispatch, content max-width wrapper, footer placement). Page provides slot
// data. Mobile path bypasses shell entirely (Router dispatcher handles).
//
// Banner slot: email verify only (full-width above masthead, matches pre-
// refactor placement). Location banner stays inside content slot so it
// inherits the band-aware max-width wrapper — same visual treatment as
// pre-refactor where it sat between content opening and grid.
//
// rightRail null: agate rail stays inside _renderHQGridInner at Band D
// (per v8.11.4 Call 7 — keep agate inside content slot for the refactor;
// future ship extracts to rail when other rail-consuming pages arrive).
function _renderHQHome(ctx) {
  var pageEl = document.querySelector('[data-page="home"]');
  PB.pageShell.render(pageEl, {
    pageKey: 'home',
    bands: ['A', 'B', 'C', 'D'],
    banner: function() { return _renderEmailVerifyBanner(); },
    masthead: function(band) {
      if (band === 'A') {
        var d = new Date();
        var dayShort = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
        var monthShort = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
        return {
          variant: 'bandA',
          title: 'Parbaughs',
          date: dayShort + " · " + monthShort + " " + d.getDate() + " · ",
          weatherSiteId: 'hq-weather-caption'
        };
      }
      return {
        variant: 'default',
        title: 'Parbaughs',
        date: _formatHQMastheadDate(),
        weatherSiteId: 'hq-weather-pill'
      };
    },
    scope: function(band) {
      // Band A: always condensed labels + flex-shrink:0 (compact two-row masthead)
      // Band B: condensed labels (window.innerWidth < 1280 in pre-refactor logic)
      // Bands C/D: full labels
      var condensed = (band === 'A' || band === 'B');
      var flexShrink = (band === 'A');
      return _renderHQScopeSwitcher(condensed, flexShrink);
    },
    content: function() {
      // Location banner inside content wrapper preserves pre-refactor band-
      // aware width treatment + position (above grid, below masthead).
      return _renderHQLocationBanner() + _renderHQGridInner(ctx);
    },
    leftRail: null,
    rightRail: null,
    footer: function() { return renderPageFooter(); },
    contentMaxWidth: _hqContentMaxWidth
  });
  _initWeatherDisplays();
}

// Scope switcher — extracted from inline masthead HTML during v8.11.4 refactor
// (Call 5). Pre-refactor lived in two copies inside _renderHQMastheadDefault and
// _renderHQMastheadBandA. Behavior identical post-extraction:
//   condensed=true  → "League" / "All"           (Bands A + B)
//   condensed=false → "My league" / "All Parbaughs" (Bands C + D)
//   flexShrink=true → adds flex-shrink:0          (Band A only — two-row layout)
function _renderHQScopeSwitcher(condensed, flexShrink) {
  var myLeagueLabel = condensed ? "League" : "My league";
  var allParbaughsLabel = condensed ? "All" : "All Parbaughs";
  var shrink = flexShrink ? ";flex-shrink:0" : "";
  var h = '<div style="display:inline-flex;align-items:stretch;background:var(--cb-chalk-2);border-radius:6px;padding:2px;gap:2px' + shrink + '">';
  h += '<div style="padding:6px 10px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.2px;color:var(--cb-ink);background:var(--cb-chalk);border-radius:var(--r-1);text-transform:uppercase">' + escHtml(myLeagueLabel) + '</div>';
  h += '<div title="All Parbaughs view coming in a future update" style="padding:6px 10px;font-family:var(--font-mono);font-size:11px;font-weight:500;letter-spacing:1.2px;color:var(--cb-mute);text-transform:uppercase;cursor:not-allowed;opacity:0.55">' + escHtml(allParbaughsLabel) + '</div>';
  h += '</div>';
  return h;
}

// HQ Home location banner (v8.11.0 · Member Location ship). Inline (NOT
// PB.banner per Call 1 — PB.banner is system-level; this is HQ-Home contextual).
// Renders below masthead, above editorial hero (inside the content wrapper so
// it respects band-aware width). Hidden when PB.weather.getResolutionStatus()
// reports a non-fallback source — design bot Option B per Call 2: banner is
// wrong-weather disclosure, not feature promotion. Founding-4 with valid
// homeCourse coords never see this banner.
//
// Edge case: page renders before PB.weather initializes. Banner returns ""
// in that case; it'll appear on the next full render (route change). Most
// users have currentProfile loaded before HQ Home renders, so this is rare.
function _renderHQLocationBanner() {
  if (typeof PB === "undefined" || !PB.weather || !PB.weather.getResolutionStatus) return "";
  var status = PB.weather.getResolutionStatus();
  if (status.resolved) return "";
  var locationName = escHtml(status.name);
  var h = '<div style="background:var(--cb-chalk-2);border-bottom:1px solid var(--cb-chalk-3);padding:var(--sp-3) var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-1);margin-top:var(--sp-3);border-radius:var(--r-3)">';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:500;color:var(--cb-ink);line-height:1.3">';
  h += "We're showing weather for " + locationName + ".";
  h += '</div>';
  h += '<a onclick="Router.go(\'settings\',{section:\'location\'})" style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;text-decoration:none;align-self:flex-start" role="link" tabindex="0">Set your location →</a>';
  h += '</div>';
  return h;
}

// Populate the three weather sites (masthead pill, Band A caption, hero eyebrow)
// after innerHTML is set. Each site emits a "—°" placeholder; this fires
// PB.weather.getDisplay() and patches the DOM when data resolves. Failures are
// silent — pill hides if first-ever fetch fails with no cache; Band A + eyebrow
// retain their "—°" placeholder.
function _initWeatherDisplays() {
  if (typeof PB === "undefined" || !PB.weather) return;
  var sites = [
    { id: "hq-weather-pill", format: "pill", includeWind: true, withTooltip: true },
    { id: "hq-weather-caption", format: "caption", includeWind: false, withTooltip: false },
    { id: "hq-weather-eyebrow", format: "eyebrow", includeWind: false, withTooltip: false }
  ];
  sites.forEach(function(site) {
    var el = document.getElementById(site.id);
    if (!el) return;
    PB.weather.getDisplay({ format: site.format, includeWind: site.includeWind }).then(function(w) {
      if (!w) {
        // First-fetch fail with no cache — only the pill hides; caption + eyebrow stay as "—"
        if (site.id === "hq-weather-pill" && el.textContent === "—°") el.style.display = "none";
        return;
      }
      el.textContent = w.displayString;
      if (site.withTooltip && w.locationName) {
        el.title = w.locationName.toUpperCase() + " · WEATHER UPDATES EVERY 30 MIN";
      }
    });
  });
  // v8.11.1 — Background staleness check (silent, granted-only, ≥7d gate, once-per-session).
  // Deferred so it never blocks the synchronous render path or visible weather paint.
  if (typeof PB.weather.checkStaleness === "function") {
    setTimeout(function() {
      try { PB.weather.checkStaleness(); } catch (e) { /* silent */ }
    }, 100);
  }
}

// HQ content width helper — used by all HQ pages to bound content + footer
// to the column width at each band. Ships 2-7 page renders should consume
// this same helper for consistent width treatment across HQ surfaces.
function _hqContentMaxWidth(band) {
  if (band === "A") return "640px";       // single column, drawer-nav, no sidebar
  if (band === "B") return "600px";       // single 600px lead column
  if (band === "C") return "912px";       // 480 + 32 + 400
  return "1132px";                        // 480 + 32 + 400 + 24 + 196 (Band D)
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

// Editorial greeting hero — Fraunces 56 with italic name, eyebrow with date/weather,
// data-derived subhead, inline pull-quote stat block.
function _renderEditorialGreetingHero(ctx) {
  var d = new Date();
  var dayParts = ["MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","MORNING","AFTERNOON","AFTERNOON","AFTERNOON","AFTERNOON","AFTERNOON","EVENING","EVENING","EVENING","EVENING","EVENING","EVENING","EVENING"];
  var dayName = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
  // Date+time prefix renders static; weather portion populated post-render via PB.weather (v8.10.0).
  var eyebrowPrefix = dayName + " " + dayParts[d.getHours()] + " · ";

  var h = '<div>';
  // Eyebrow
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">' + escHtml(eyebrowPrefix) + '<span id="hq-weather-eyebrow" data-weather-site="eyebrow">—</span></div>';
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
  var roundsCaption = "MTD: " + thisMonth;

  var best = ctx.bestRound != null ? String(ctx.bestRound) : "—";
  var bestCourse = "";
  if (ctx.bestRoundId) {
    var br = (ctx.myRounds || []).find(function(r){ return r.id === ctx.bestRoundId; });
    if (br && br.course) bestCourse = br.course.toUpperCase();
  }
  var bestCaption = bestCourse || "";

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
    h += '<div style="font-family:var(--font-display);font-size:var(--hq-stat-number-size);font-weight:700;color:var(--cb-ink);line-height:1;font-variant-numeric:lining-nums tabular-nums">' + escHtml(c.value) + '</div>';
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

// ════════════════════════════════════════════════════════════════════════
// COMPLETION CROSS-FADE + FINISHED-SUMMARY CARD (v8.11.11 — Gate 3)
// Closes the cross-device sync trilogy. When listener fires status='completed',
// _triggerCompletionCrossFade animates the live-card → finished-summary card
// transition over 600ms (Pattern A dual-card stacked per design C1). The
// finished-summary card retains for 5 minutes via window._completedRoundOverlay
// (HYBRID retention pattern: render-side expiry check + 5-min setTimeout for
// active-on-page user trigger).
// ════════════════════════════════════════════════════════════════════════

// Render finished-summary card per design C1.
//   Eyebrow: FINAL · X MIN AGO (mono brass 11px)
//   Hero:    playerName · course · totalScore (diff)   for full 18-hole rounds
//            playerName · course · totalScore thru N   for partial rounds
//   Caption: ROUND COMPLETE · OPEN FOR DETAILS (mono brass 11px)
//   No footer link (round is over).
//   Same green chrome as live card for visual continuity during cross-fade.
//
// Diff calculation uses defaultPar approximation since /liverounds/ doc does
// not persist holes-array per-hole pars. Conservative: only show diff for
// full-18 completions; partial rounds show "thru N" without diff to avoid
// inaccurate par-thru-N math.
function _renderFinishedSummaryCard(round) {
  if (!round) return "";
  var playerName = round.playerName || "Member";
  var course = round.course || "";
  var totalScore = (typeof round.totalScore === "number") ? round.totalScore : 0;
  var thru = (typeof round.thru === "number") ? round.thru : 0;
  var lastWriteAt = (typeof round.lastWriteAt === "number") ? round.lastWriteAt : null;

  var ageStr = lastWriteAt ? _formatAge(Date.now() - lastWriteAt).toUpperCase() : "JUST NOW";

  // Diff uses round.par (course's actual total par from /liverounds/ doc) —
  // accurate for any course, NOT the par-72 defaultPar approximation. Only
  // computed for full-18 completions; partial rounds show "thru N" instead.
  var subhead;
  if (thru === 18) {
    var parTotal = (typeof round.par === "number") ? round.par : 72;
    var diff = totalScore - parTotal;
    var diffStr = (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
    subhead = escHtml(playerName) + " · " + escHtml(course) + " · " + totalScore + " (" + diffStr + ")";
  } else if (thru > 0) {
    subhead = escHtml(playerName) + " · " + escHtml(course) + " · " + totalScore + " thru " + thru;
  } else {
    subhead = escHtml(playerName) + " · " + escHtml(course);
  }

  var h = '<div id="live-round-card-finished" style="background:var(--cb-green);border-radius:var(--r-4);padding:var(--sp-6);color:var(--cb-chalk);position:relative;overflow:hidden">';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:18px">FINAL · ' + ageStr + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-chalk);letter-spacing:-0.3px;line-height:1.3;margin-bottom:18px">' + subhead + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-brass)">ROUND COMPLETE · OPEN FOR DETAILS</div>';
  h += '</div>';
  return h;
}

// Pattern A dual-card stacked cross-fade. Dynamically positions the
// finished-summary card absolutely overlaid on the existing live-card,
// animates simultaneous opacity transitions over 600ms, then removes
// the live-card and switches finished-summary to in-flow positioning.
//
// Layout-shift safety: parent of #live-round-card receives a temporary
// position:relative if its computed position is static. Original
// positioning is restored after transition completes. Live-card removal
// + finished-summary absolute→relative swap happen atomically (no layout
// shift since both cards have matching height in the same green chrome).
//
// Defensive idempotent: bails if liveState.active is false (stale call
// from delayed setTimeout) or if #live-round-card is absent (already
// removed by prior fade).
function _triggerCompletionCrossFade(doc) {
  if (typeof liveState === "undefined" || !liveState || !liveState.active) return;
  var liveCard = document.getElementById("live-round-card");
  if (!liveCard) return;
  var parent = liveCard.parentElement;
  if (!parent) return;

  // Save + ensure parent positioning for absolute child overlay
  var originalParentPos = parent.style.position;
  var computedPos = window.getComputedStyle(parent).position;
  if (computedPos === "static") parent.style.position = "relative";

  // Build finished-summary card DOM
  var shell = document.createElement("div");
  shell.innerHTML = _renderFinishedSummaryCard(doc);
  var finishedCard = shell.firstElementChild;
  if (!finishedCard) return;

  // Position finishedCard absolutely overlaid on liveCard
  finishedCard.style.position = "absolute";
  finishedCard.style.top = liveCard.offsetTop + "px";
  finishedCard.style.left = liveCard.offsetLeft + "px";
  finishedCard.style.width = liveCard.offsetWidth + "px";
  finishedCard.style.opacity = "0";
  finishedCard.style.transition = "opacity 600ms ease";

  // Insert as sibling AFTER liveCard
  liveCard.parentNode.insertBefore(finishedCard, liveCard.nextSibling);

  // Setup liveCard transition
  liveCard.style.transition = "opacity 600ms ease";

  // Force reflow so transition kicks in
  void finishedCard.offsetWidth;

  // Trigger simultaneous fades (true cross-fade per design C1)
  liveCard.style.opacity = "0";
  finishedCard.style.opacity = "1";

  // After transition completes (600ms + 50ms safety margin)
  setTimeout(function() {
    if (liveCard.parentNode) liveCard.parentNode.removeChild(liveCard);
    finishedCard.style.position = "";
    finishedCard.style.top = "";
    finishedCard.style.left = "";
    finishedCard.style.width = "";
    finishedCard.style.transition = "";
    if (computedPos === "static") parent.style.position = originalParentPos;
  }, 650);
}

// Live round expanded card — single-player editorial fallback (group leaderboard
// awaits sync-round / tee-time pairing infrastructure; backlog: post-Part-B).
//
// v8.11.10 — Variant dispatch via liveState.deviceOwnership flag (set by
// saveLiveState 'local' / loadLiveState 'local' / hydrateFromFirestore 'remote').
// Primary variant unchanged from prior ships modulo caption slot insertion.
// Secondary variant is view-only per design B1/B2.
function _renderLiveRoundExpandedCard(ctx) {
  // v8.11.11 — Completed-round retention overlay check (5-min window after
  // listener-observed completion). Render-side expiry is the source of truth;
  // _triggerCompletionCrossFade DOM is replaced on next render, finished-
  // summary card persists via this check until expiresAt.
  if (window._completedRoundOverlay) {
    if (Date.now() < window._completedRoundOverlay.expiresAt) {
      return _renderFinishedSummaryCard(window._completedRoundOverlay.round);
    }
    window._completedRoundOverlay = null;
  }
  if (typeof liveState === "undefined" || !liveState || !liveState.active) {
    return _renderHQPlaceholder("Lead column", ctx.state);
  }
  if (liveState.deviceOwnership === "remote") {
    return _renderLiveRoundSecondary({ size: "full" });
  }
  // PRIMARY variant — unchanged from prior ships, plus caption slot.
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

  var h = '<div id="live-round-card" onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:var(--r-4);padding:var(--sp-6);color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
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
  // v8.11.10 — caption slot for multi-device caption. Empty → zero footprint.
  h += '<div id="live-round-caption"></div>';
  // CTA
  h += '<div style="background:var(--cb-chalk-2);height:48px;border-radius:var(--r-3);display:flex;align-items:center;justify-content:center;gap:var(--sp-2);margin-top:24px">';
  h += '<span style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-ink)">Open scorecard</span>';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="2"><path d="M5 4l4 4-4 4"/></svg>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Secondary variant — view-only, rendered when liveState.deviceOwnership === 'remote'.
// Per design rulings B1, B2: no scoring chrome, opacity 1.0 (NOT greyed),
// "VIEWING · LIVE ON PHONE" eyebrow, hero score panel, elapsed/last-hole subline,
// caption slot, footer link with toast (no deep-link navigation in v8.11.10).
//
// size: "full" (HQ desktop) | "compact" (mobile). Compact shrinks hero score
// from 48px → 32px and tightens spacing.
// v8.13.2 — Ship 4a Gate 2: mode parameter added.
//   'live-card' (default) — v8.11.10 secondary digest card on HQ Home + mobile.
//                            Reads from liveState. Behavior preserved byte-identical.
//   'live-page'           — Spectator HUD hero panel on /round/:roundId page.
//                            Reads from opts.round (Firestore /liverounds/ doc).
//                            Avatar + bigger fonts + pace projection + no footer link.
function _renderLiveRoundSecondary(opts) {
  opts = opts || {};
  if (opts.mode === "live-page") return _renderLivePageHero(opts.round || {});

  // ─── 'live-card' mode (default) — v8.11.10 production code, byte-identical ───
  var size = opts.size || "full";
  var compact = size === "compact";

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

  var elapsedStr = _formatElapsed(liveState.startTime);
  // Last hole age — compute from liveState.lastWriteAt if available, fallback to startTime.
  var lastWriteAt = (typeof liveState.lastWriteAt === "number") ? liveState.lastWriteAt : null;
  var lastHoleAgeStr = lastWriteAt ? _formatAge(Date.now() - lastWriteAt) : "—";

  var pad = compact ? "22px" : "var(--sp-6)";
  var heroSize = compact ? "32px" : "48px";
  var courseSize = compact ? "18px" : "22px";

  var h = '<div id="live-round-card" style="background:var(--cb-green);border-radius:var(--r-4);padding:' + pad + ';color:var(--cb-chalk);position:relative;overflow:hidden;opacity:1">';
  // Eyebrow — VIEWING · LIVE ON PHONE
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:18px">VIEWING · LIVE ON PHONE</div>';
  // Hero — course · hole, then score thru holes
  h += '<div style="margin-bottom:14px">';
  h += '<div style="font-family:var(--font-display);font-size:' + courseSize + ';font-weight:700;color:var(--cb-chalk);letter-spacing:-0.3px;line-height:1.15">' + escHtml(course) + ' · Hole ' + hole + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:' + heroSize + ';font-weight:700;color:var(--cb-chalk);line-height:1;margin-top:8px;font-variant-numeric:lining-nums tabular-nums">' + diffStr + ' thru ' + thru + '</div>';
  h += '</div>';
  // Subline — elapsed + last hole age
  h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-mute-2);margin-bottom:16px">' + escHtml(elapsedStr) + ' elapsed · last hole ' + escHtml(lastHoleAgeStr) + '</div>';
  // Caption slot
  h += '<div id="live-round-caption"></div>';
  // Footer link — brass underline, no button chrome. Toast on tap.
  h += '<div style="margin-top:16px"><a onclick="_liveRoundOpenOnPhoneToast()" style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-brass);text-decoration:underline;cursor:pointer">Open round on phone to keep scoring</a></div>';
  h += '</div>';
  return h;
}

// v8.13.2 — 'live-page' mode hero panel for Spectator HUD page (Ship 4a Gate 2).
// Reads from `round` (Firestore /liverounds/ doc), NOT from liveState — Spectator
// HUD displays OTHER user's round data fetched directly via /round/:roundId route.
//
// Differences from 'live-card':
//   - No id="live-round-card" — only one card per page; that wrapper id is for
//     v8.11.11 cross-fade animation on HQ Home digest-card surface, not HUD page
//   - Avatar 64px brass-stroke circle via existing renderAvatar(player, 64, false)
//   - Eyebrow VIEWING · LIVE (no "ON PHONE" — page IS the experience, not a redirect)
//   - Player name + handicap (Fraunces italic 18-22px)
//   - Bigger hero score (Fraunces 64px display)
//   - Course · hole · time mono small caps subline (per design C1)
//   - "ON PACE FOR N" projection when 0 < thru < 18
//   - NO footer link
//   - NO course wordmark/photo (deferred — no data path in current course schema)
//   - Caption slot preserved for Gate 7 connection-state-escalation reuse
// v8.14.0 (Ship 4a Gate 8a) — class-based extraction with structural redesign
// per CTO Q-C rulings:
//   - Avatar dropped (mock authority)
//   - Handicap rendered as italic em-tail on player name
//   - Last-hole-age line dropped (Gate 7 stale chrome owns this signal via
//     #live-round-caption — editorial doesn't duplicate functional state)
//   - .sphud-hero-actions row OMITTED until action ship lands
//   - .sphud-hero-delta carries pace projection in-progress / empty completed
//   - Course/hole/elapsed kept as .sphud-hero-where
// Gate 6 (.sphud-hero-diff, .sphud-hero-thru) cross-fade hooks PRESERVED.
// Gate 7 (.sphud-hero-eyebrow, .sphud-hero-card, #live-round-caption)
// modifier targets PRESERVED. New editorial modifiers (--in-progress /
// --completed) coexist additively with functional modifiers (--dimmed /
// --alert / --mute) per Q-C ruling 5.
function _renderLivePageHero(round) {
  var playerName = round.playerName || "Member";
  var course = round.course || "Round";
  var hole = (round.currentHole || 0) + 1;
  var thru = (typeof round.thru === "number") ? round.thru : 0;
  var totalScore = (typeof round.totalScore === "number") ? round.totalScore : 0;

  // Diff via defaultPar approximation. Per-hole pars not in /liverounds/ doc.
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) parSoFar += (defaultPar[i] || 4);
  var diff = thru > 0 ? totalScore - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));

  var elapsedStr = _formatElapsed(round.startTime);

  // Pace projection — linear extrapolation. Renders only 0<thru<18.
  // Becomes deltaText source for in-progress mode.
  var paceProjection = (thru > 0 && thru < 18) ? Math.round((totalScore / thru) * 18) : null;

  // Handicap from cached member profile (fbMemberCache pre-populated post-auth).
  // Avatar HTML deliberately NOT generated — name carries identity per mock.
  var player = (typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(round.playerId) : null;
  var handicap = player ? (player.computedHandicap != null ? player.computedHandicap : (player.handicap != null ? player.handicap : null)) : null;

  // Editorial mode dispatch. round.status === "active" reaches this render
  // path per round.js dispatch (other + completed routes to RoundDetail).
  // Defensive "completed" branch covers the theoretical case where status
  // transitions mid-render; _triggerFinalModeVariant flips modifier post-render.
  var editorialMode = (round.status === "completed") ? "completed" : "in-progress";

  // Handicap-as-em-tail logic per CTO Q-C-2:
  //   "Mike Hill" + 12.4 → first="Mike", emTail="Hill · 12.4 hcp"
  //   "Mike" + 12.4 → first="Mike", emTail=" · 12.4 hcp"   (single-word name)
  //   "flossonthefairway" + null → first="flossonthefairway", emTail=""
  //   "Mike Hill" + null → first="Mike", emTail="Hill"
  var nameParts = playerName.split(' ');
  var firstName = nameParts[0];
  var surname = nameParts.slice(1).join(' ');
  var emTail = '';
  if (surname && handicap !== null) {
    emTail = surname + ' · ' + handicap + ' hcp';
  } else if (surname) {
    emTail = surname;
  } else if (handicap !== null) {
    emTail = ' · ' + handicap + ' hcp';
  }

  // Eyebrow text — initial baseline. Gate 7 _applyChrome mutates at runtime
  // for connection-state chrome ("VIEWING · OFFLINE" / "PLAYER NOT CONNECTED")
  // and Gate 6 _triggerFinalModeVariant overwrites for completion.
  var eyebrowText = "VIEWING · LIVE";

  // Delta text — in-progress mode renders pace projection; completed mode
  // empty (future ship adds editorial commentary like "best of the season").
  var deltaText = (editorialMode === "in-progress" && paceProjection !== null)
    ? "ON PACE FOR " + paceProjection
    : "";

  // Stats line — empty for 8a. StatsPanel below the hero already shows
  // GIR / PUTTS / FIR; duplicating in hero adds cognitive load. Future ship
  // may populate with summarized stats string if mock direction shifts.
  var statsLineText = "";

  var h = '<div class="sphud-hero sphud-hero-card sphud-hero-card--' + editorialMode + '">';

  // Eyebrow with pulse dot (in-progress only). Dot suppressed via CSS rule
  // .sphud-hero-card--completed .sphud-hero-eyebrow-dot{display:none}.
  h += '<div class="sphud-hero-eyebrow">';
  if (editorialMode === "in-progress") {
    h += '<span class="sphud-hero-eyebrow-dot"></span>';
  }
  h += '<span>' + escHtml(eyebrowText) + '</span>';
  h += '</div>';

  // Player name + handicap-as-em-tail.
  h += '<h2 class="sphud-hero-name">' + escHtml(firstName);
  if (emTail) {
    h += ' <em>' + escHtml(emTail) + '</em>';
  }
  h += '</h2>';

  // Course / hole / elapsed subline (kept per Q-C-6).
  h += '<div class="sphud-hero-where">';
  h += escHtml(course) + ' · HOLE ' + hole + ' · ' + escHtml(elapsedStr) + ' ELAPSED';
  h += '</div>';

  // Score row: score + delta + thru. Gate 6 cross-fade hooks (.sphud-hero-diff
  // for the diff value, .sphud-hero-thru for the thru count) PRESERVED inside
  // the new structural wrappers.
  h += '<div class="sphud-hero-score-row">';
  h += '<div class="sphud-hero-score-num' + (diff < 0 ? ' sphud-hero-score-num--under' : '') + '">';
  h += '<span class="sphud-hero-diff">' + escHtml(diffStr) + '</span>';
  h += '</div>';
  h += '<div class="sphud-hero-delta">' + escHtml(deltaText) + '</div>';
  h += '<div class="sphud-hero-thru">';
  h += '<div class="sphud-hero-thru-lbl">THRU</div>';
  h += '<div class="sphud-hero-thru-val"><span class="sphud-hero-thru">' + thru + '</span></div>';
  h += '</div>';
  h += '</div>';

  // Stats line — render only if non-empty (8a always-empty; future ship populates).
  if (statsLineText) {
    h += '<div class="sphud-hero-stats-line">' + escHtml(statsLineText) + '</div>';
  }

  // Caption slot — Gate 7 connection-state chrome consumes this id.
  // PRESERVE — removing breaks Gate 7 _applyChrome + final-mode caption.
  h += '<div id="live-round-caption"></div>';

  // .sphud-hero-actions row — OMITTED in 8a per CTO Q-C-3. Action set
  // undefined; future ship adds when affordances + click handlers are spec'd.

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

// Handicap trend chart for HQ Home (Features column / Band B lead column).
// v8.14.5 — Stub 30D/90D/1Y pills replaced with functional 30D/SEASON/ANNUAL
// toggle (P17 pattern). Toggle state persists via PB.getChartRange/setChartRange
// keyed 'handicap_home'. Surgical rerender via _rerenderTrendChart in members.js
// (delegated click handler app-wide). SVG modernized to Approach B per P16
// (preserveAspectRatio="none" + width:100% + fixed pixel height).
//
// Theme-aware via CSS custom-property in style attr (presentation attributes
// don't resolve var(), so color wires through the SVG root's style and uses
// currentColor on plot elements). Chart width configurable via opts.width
// (defaults 400 for features column; 600 when promoted into Band B lead column).
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

  var h = '<div>';
  // Header
  var current = ctx.handicap != null ? Number(ctx.handicap).toFixed(1) : "—";
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">HANDICAP</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">' + current + '</div>';
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

  var emptyState = '<div style="height:140px;background:var(--cb-chalk-2);border-radius:var(--r-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">TREND APPEARS AFTER 3 ROUNDS</div>';

  if (recent.length < 3) return emptyState;

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

  if (series.length < 2) return emptyState;

  // Render inline SVG with currentColor + style-defined accent.
  var w = width, height = 140;
  var pad = { t: 14, b: 22, l: 0, r: 32 };
  var chartW = w - pad.l - pad.r, chartH = height - pad.t - pad.b;
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
  var svg = '<svg viewBox="0 0 ' + w + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px;display:block;color:var(--cb-brass)">';
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

  return '<div style="background:var(--cb-chalk-2);border-radius:var(--r-2);padding:14px 16px">' + svg + '</div>';
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
    h += '<div style="padding:var(--sp-6) 0;text-align:center;font-family:var(--font-mono);font-size:11px;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">QUIET WEEK</div>';
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
      b += '<div' + (it.dest ? ' onclick="' + it.dest + '" style="cursor:pointer;' : ' style="') + 'min-height:56px;padding:var(--sp-2) 0;display:flex;align-items:center;gap:var(--sp-3);border-bottom:1px solid var(--cb-chalk-3)">';
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
  if (ctx.state === "new") return _renderHQLeadColumnNew(ctx);
  return _renderHQLeadColumnIdle(ctx);
}

function _renderHQLeadColumnIdle(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
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
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
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
  if (ctx.state === "new") return _renderHQFeaturesColumnNew(ctx);
  var feedLimit = ctx.state === "active" ? 8 : 12;
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
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
  if (ctx.state === "new") return _renderHQLeadColumnNew(ctx);  // same component fits at 600px
  return _renderHQLeadColumnBandBIdle(ctx);
}

function _renderHQLeadColumnBandBIdle(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
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
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
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

// ─── Band A (720-959) sibling lead-column composers ────────────────────────
// At Band A the features column + agate are dropped; activity feed (5 rows)
// promoted into lead flow. Stats quartet adapts to 2×2 grid via runtime band
// detection inside _renderStatsSnapshotQuartet. Ladder takes opts.limit:6.
// State 3 reuses _renderHQLeadColumnNew (welcome flow scales via tokens).

function _renderHQLeadColumnBandA(ctx) {
  if (ctx.state === "active") return _renderHQLeadColumnBandAActive(ctx);
  if (ctx.state === "new") return _renderHQLeadColumnNew(ctx);
  return _renderHQLeadColumnBandAIdle(ctx);
}

function _renderHQLeadColumnBandAIdle(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderEditorialGreetingHero(ctx);    // hero scales to 36 via --hq-hero-size token
  h += _renderStatsSnapshotQuartet(ctx);     // 2×2 grid via band-aware container
  h += _renderSeasonLadderTop10(ctx, { limit: 6 });
  var recent = (ctx.myRounds || []).slice(0, 2);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += _renderActivityFeedCompact(ctx, 5);
  h += '</div>';
  return h;
}

function _renderHQLeadColumnBandAActive(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderLiveRoundExpandedCard(ctx);    // score scales to 64 via --hq-live-score-size
  h += _renderSeasonPositionStrip(ctx);
  var recent = (ctx.myRounds || []).slice(0, 2);
  if (recent.length > 0) {
    h += '<div style="display:flex;flex-direction:column">';
    recent.forEach(function(r) { h += _renderRecentRoundRow(r); });
    h += '</div>';
  }
  h += _renderActivityFeedCompact(ctx, 5);
  h += '</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// === AGATE RAIL (Band D · v8.6.1 · Ship 1b-iii) ===
// ═══════════════════════════════════════════════════════════════════════════

// Online-now strip — 4-up avatar grid (2×2) of members active in last 10 min.
// Listener race: onlineMembers may be empty on first render — empty state covers
// this; subsequent re-renders refresh data when presence listener fires.
function _renderOnlineNowStrip(ctx) {
  var entries = (typeof onlineMembers !== "undefined" && onlineMembers) ? Object.keys(onlineMembers) : [];
  // Exclude self for cleaner display (you know you're online)
  var uid = currentUser ? currentUser.uid : null;
  entries = entries.filter(function(id) { return id !== uid; });
  var count = entries.length;

  var h = '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:12px">';
  h += '<span style="color:var(--cb-mute)">ONLINE · </span><span style="color:var(--cb-brass)">' + count + '</span>';
  h += '</div>';

  if (count === 0) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase;padding:var(--sp-2) 0">QUIET RIGHT NOW</div>';
    h += '</div>';
    return h;
  }

  // 2×2 grid, 4 visible max
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 10px">';
  entries.slice(0, 4).forEach(function(id) {
    var data = onlineMembers[id];
    var name = (data && data.name) || "Member";
    var initial = (name.charAt(0) || "?").toUpperCase();
    // Truncate handle to 8 chars + ellipsis
    var handle = name.length > 8 ? name.slice(0, 7) + "…" : name;
    h += '<div onclick="Router.go(\'members\',{id:\'' + id + '\'})" style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-1);cursor:pointer">';
    h += '<div style="position:relative;width:36px;height:36px">';
    h += '<div style="width:36px;height:36px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700">' + escHtml(initial) + '</div>';
    h += '<div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:var(--cb-moss);border:2px solid var(--cb-chalk)"></div>';
    h += '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:500;color:var(--cb-ink);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(handle) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
}

// Upcoming tee times — next 5 league sessions. Listener race: liveTeeTimes may
// be empty on first render — empty state covers this; subsequent re-renders
// refresh data when teetime listener fires.
function _renderUpcomingTeeTimes(ctx) {
  var upcoming = _getUpcomingTeeTimes(5) || [];
  var newUserFraming = ctx.state === "new";

  var h = '<div>';
  if (newUserFraming) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:4px">OPEN TEE TIMES</div>';
    h += '<div onclick="Router.go(\'teetimes\')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;margin-bottom:12px">JOIN ANOTHER MEMBER →</div>';
  } else {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:12px">TEE TIMES</div>';
  }

  if (!upcoming.length) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase;padding:var(--sp-2) 0">NOTHING SCHEDULED</div>';
    h += '</div>';
    return h;
  }

  upcoming.forEach(function(t) {
    var hourLabel = (t.time || "").toUpperCase().replace(/^0/, "");  // "8 AM" / "11 AM" / "2 PM"
    var dateLabel = "";
    if (t.date) {
      var d = new Date(t.date + "T12:00:00");
      var month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
      dateLabel = month + " " + d.getDate();
    }
    var max = t.maxPlayers || 4;
    var rsvps = (t.rsvps && t.rsvps.length) || (t.players && t.players.length) || 0;
    var spotsOpen = Math.max(0, max - rsvps);
    var spotsLabel = spotsOpen > 0 ? spotsOpen + " OPEN" : "FULL";
    var spotsColor = spotsOpen > 0 ? "var(--cb-brass)" : "var(--cb-moss)";

    h += '<div onclick="Router.go(\'teetimes\',{id:\'' + (t._id || "") + '\'})" style="height:48px;border-bottom:1px solid var(--cb-chalk-3);display:flex;align-items:center;gap:10px;cursor:pointer">';
    // Time stack
    h += '<div style="flex-shrink:0">';
    h += '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink);line-height:1">' + escHtml(hourLabel || "—") + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px;margin-top:2px">' + escHtml(dateLabel) + '</div>';
    h += '</div>';
    // Course
    h += '<div style="flex:1;min-width:0;font-family:var(--font-ui);font-size:var(--hq-eyebrow-size);font-weight:500;color:var(--cb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(t.course || "TBD") + '</div>';
    // Spots
    h += '<div style="flex-shrink:0;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:1px;color:' + spotsColor + ';text-transform:uppercase">' + escHtml(spotsLabel) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// Member spotlight — featured member intro for State 3 only. Founding-four
// rotation by day-of-week, excluding self. Falls back to first non-self
// member if pool is empty; skips render if pool is still empty.
function _renderMemberSpotlight(ctx) {
  if (typeof PB === "undefined" || !PB.getPlayers) return "";
  var uid = currentUser ? currentUser.uid : null;
  var claimedFrom = currentProfile ? currentProfile.claimedFrom : null;

  var allPlayers = PB.getPlayers() || [];
  var pool = allPlayers.filter(function(p) {
    return p && (p.founding || p.isFoundingFour) && p.id !== uid && p.id !== claimedFrom;
  });
  if (!pool.length) {
    // Fallback: any non-self member
    pool = allPlayers.filter(function(p) {
      return p && p.id !== uid && p.id !== claimedFrom;
    });
  }
  if (!pool.length) return "";  // Graceful skip — no other members to spotlight

  // Deterministic rotation by day-of-week
  var idx = new Date().getDay() % pool.length;
  var member = pool[idx];
  if (!member) return "";

  var name = member.name || member.username || "Member";
  var handle = member.username ? "@" + member.username : "";
  var initial = (name.charAt(0) || "?").toUpperCase();
  var bio = member.bio || "";
  var bioOrCourse = bio || (member.homeCourse ? "Plays out of " + member.homeCourse + "." : "");
  var tenureLabel = (member.founding || member.isFoundingFour) ? "FOUNDING MEMBER" : "MEMBER";

  var h = '<div onclick="Router.go(\'members\',{id:\'' + member.id + '\'})" style="cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:12px">MEET</div>';
  h += '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:var(--sp-2)">';
  // Avatar 64×64
  h += '<div style="width:64px;height:64px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:24px;font-weight:700">' + escHtml(initial) + '</div>';
  // Name
  h += '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink);line-height:1.2">' + escHtml(name) + '</div>';
  // Handle + tenure
  if (handle) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px">' + escHtml(handle) + ' · ' + tenureLabel + '</div>';
  } else {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px">' + tenureLabel + '</div>';
  }
  // Bio (or course fallback) — 2 lines max
  if (bioOrCourse) {
    h += '<div style="font-family:var(--font-ui);font-size:var(--hq-agate-body-size);font-weight:500;color:var(--cb-charcoal);line-height:1.4;max-height:34px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + escHtml(bioOrCourse) + '</div>';
  }
  // CTA
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);text-transform:uppercase;margin-top:4px">Say hi →</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Agate rail composer — stacks online + tee times. State 3 adds member spotlight.
function _renderHQAgateRail(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderOnlineNowStrip(ctx);
  h += _renderUpcomingTeeTimes(ctx);
  if (ctx.state === "new") {
    h += _renderMemberSpotlight(ctx);
  }
  h += '</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// === STATE 3 LEAD COLUMN COMPONENTS (v8.6.1 · Ship 1b-iii) ===
// ═══════════════════════════════════════════════════════════════════════════

// Welcome hero — same architecture as _renderEditorialGreetingHero but with
// member-count-derived subhead and tenure eyebrow.
function _renderWelcomeHero(ctx) {
  var memberCount = 0;
  var courseCount = 0;
  if (typeof PB !== "undefined") {
    if (PB.getPlayers) memberCount = (PB.getPlayers() || []).length;
    if (PB.getRounds) {
      var courses = {};
      (PB.getRounds() || []).forEach(function(r) { if (r.course) courses[r.course] = true; });
      courseCount = Object.keys(courses).length;
    }
  }
  // New user is +1 to current count
  var memberNum = memberCount + 1;
  var d = new Date();
  var monthName = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"][d.getMonth()];
  var eyebrow = "MEMBER #" + memberNum + " · " + monthName + " " + d.getFullYear();

  var subhead;
  if (memberCount > 0 && courseCount > 0) {
    subhead = memberCount + " members. " + courseCount + " courses played. One season already underway. Here's how to get in.";
  } else {
    subhead = "A small league with big games. Log a round to claim your spot.";
  }

  var h = '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">' + escHtml(eyebrow) + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-hero-size);font-weight:var(--hq-hero-weight);line-height:1.05;letter-spacing:-2px;color:var(--cb-ink);margin-bottom:14px">';
  h += 'Welcome to the Parbaughs, <em style="font-style:italic;font-weight:700">' + escHtml(ctx.firstName) + '</em>.';
  h += '</div>';
  h += '<div style="font-family:var(--font-ui);font-size:var(--hq-subhead-size);font-weight:500;color:var(--cb-charcoal);max-width:480px;line-height:1.45">' + escHtml(subhead) + '</div>';
  h += '</div>';
  return h;
}

// Start-first-round panel — green CTA panel with stacked actions.
function _renderStartFirstRoundPanel(ctx) {
  var h = '<div style="background:var(--cb-green);border-radius:var(--r-4);padding:var(--sp-6);color:var(--cb-chalk)">';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">FIRST MOVE</div>';
  // Primary CTA — brass-on-chalk
  h += '<div onclick="Router.go(\'playnow\')" style="background:var(--cb-chalk);color:var(--cb-ink);height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:var(--sp-2);cursor:pointer;margin-bottom:10px">';
  h += '<span style="font-family:var(--font-ui);font-size:14px;font-weight:600">Start a round</span>';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="2"><path d="M5 4l4 4-4 4"/></svg>';
  h += '</div>';
  // Secondary CTA — ghost chalk-2
  h += '<div onclick="Router.go(\'courses\')" style="background:rgba(var(--bg-rgb),0.10);color:rgba(var(--bg-rgb),0.85);height:44px;border-radius:var(--r-2);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:14px">';
  h += '<span style="font-family:var(--font-ui);font-size:13px;font-weight:500">Browse courses</span>';
  h += '</div>';
  // Tertiary text link
  h += '<div onclick="Router.go(\'teetimes\')" style="text-align:center;cursor:pointer">';
  h += '<span style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.2px;color:var(--cb-brass);text-transform:uppercase">Or join an open match →</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Ghosted stats quartet — same structure as _renderStatsSnapshotQuartet but
// at 35% opacity, "—" values, and a "YOUR STATS APPEAR..." caption above.
function _renderGhostedStatsQuartet(ctx) {
  var h = '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:12px">YOUR STATS APPEAR AFTER YOUR FIRST ROUND</div>';
  h += '<div style="opacity:0.35;pointer-events:none">';
  h += '<div style="display:flex;align-items:stretch;height:120px">';
  var labels = ["HCP", "ROUNDS", "BEST", "STREAK"];
  labels.forEach(function(label, i) {
    var sep = i > 0 ? "border-left:1px solid var(--cb-chalk-3);" : "";
    h += '<div style="flex:1;' + sep + 'padding:18px 14px;display:flex;flex-direction:column;justify-content:center;gap:6px">';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + label + '</div>';
    h += '<div style="font-family:var(--font-display);font-size:var(--hq-stat-number-size);font-weight:700;color:var(--cb-ink);line-height:1">—</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// State 3 lead column composer — same component shapes work at Band B/C/D
// because tokens drive size and flex-children stretch to column width.
function _renderHQLeadColumnNew(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderWelcomeHero(ctx);
  h += _renderStartFirstRoundPanel(ctx);
  h += _renderGhostedStatsQuartet(ctx);
  h += '</div>';
  return h;
}

// State 3 features column composer — reuses ladder (state-aware) + activity feed.
function _renderHQFeaturesColumnNew(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderSeasonLadderTop10(ctx);   // state-aware; renders "your position" placeholder
  h += _renderActivityFeedCompact(ctx, 12);
  h += '</div>';
  return h;
}

function _renderEmailVerifyBanner() {
  if (!currentUser || currentUser.emailVerified) return "";
  var h = '<div style="padding:10px 22px;background:rgba(180,137,62,0.08);border-bottom:1px solid rgba(180,137,62,0.15);display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="1.5" style="flex-shrink:0"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z"/><path d="M1 5l7 4 7-4"/></svg>';
  h += '<div style="flex:1;font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;color:var(--cb-brass);line-height:1.4">Verify your email to unlock wagers, bounties, DMs, and the shop.</div>';
  h += '<button style="background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:var(--r-1);font:700 10px/1 var(--font-ui);padding:6px 12px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px" onclick="sendVerificationEmail()">Verify</button>';
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

// Mobile live-round card — v8.11.10 adds variant dispatch via deviceOwnership.
// Compact secondary variant rendered when 'remote'; primary variant otherwise
// (existing behavior preserved with caption slot inserted).
function _renderLiveRoundCard() {
  // v8.11.11 — Completed-round retention overlay check (mirror HQ pattern).
  if (window._completedRoundOverlay) {
    if (Date.now() < window._completedRoundOverlay.expiresAt) {
      return '<div style="padding:18px 22px 0">' + _renderFinishedSummaryCard(window._completedRoundOverlay.round) + '</div>';
    }
    window._completedRoundOverlay = null;
  }
  if (typeof liveState === "undefined" || !liveState || !liveState.active) return "";
  if (liveState.deviceOwnership === "remote") {
    return '<div style="padding:18px 22px 0">' + _renderLiveRoundSecondary({ size: "compact" }) + '</div>';
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

  var h = '<div style="padding:18px 22px 0">';
  h += '<div id="live-round-card" class="tappable" onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:var(--r-4);padding:22px;color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);display:flex;align-items:center;gap:var(--sp-2);margin-bottom:14px">';
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
  // v8.11.10 — caption slot for multi-device caption (mobile primary variant)
  h += '<div id="live-round-caption"></div>';
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
  h += '<div style="display:inline-flex;align-items:center;gap:var(--sp-2);padding:11px 18px;background:var(--cb-green);color:var(--cb-chalk);border-radius:var(--r-2);font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.3px">';
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
  h += '<div' + (roundsClickable ? ' class="tappable" onclick="Router.go(\'roundhistory\')"' : '') + ' style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px;' + (roundsClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">ROUNDS</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + roundsStr + '</div>';
  h += '</div>';

  // HCP
  h += '<div style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">HCP</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + hcapStr + '</div>';
  h += '</div>';

  // BEST
  var bestClickable = !!bestRoundId;
  h += '<div' + (bestClickable ? ' class="tappable" onclick="Router.go(\'rounds\',{roundId:\'' + escHtml(bestRoundId) + '\'})"' : '') + ' style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px;' + (bestClickable ? 'cursor:pointer' : '') + '">';
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

function _getUpcomingTeeTimes(limit) {
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
  return upcoming.slice(0, limit || 3);
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
    h += '<div class="tappable" onclick="Router.go(\'teetimes\')" style="padding:var(--sp-3) 0;' + (i === 0 ? '' : 'border-top:1px solid var(--cb-chalk-3);') + 'display:flex;align-items:baseline;gap:14px;cursor:pointer">';
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
  return '<div style="text-align:center;padding:20px 16px 8px;display:flex;justify-content:center;gap:var(--sp-3);flex-wrap:wrap">' +
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
  h += '<div class="section"><div style="display:flex;gap:var(--sp-2)">';
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
