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

// DEPRECATED v8.15.0 (Ship 5 Gate 1) — Ship 5 swaps the 5-band JS-driven
// layout for a 4-band CSS-driven layout (.hq-grid in components.css). This
// helper survives in the codebase only as long as _renderHQGridInner does;
// follow-on ship retires both. PB.pageShell still consumes its own internal
// _currentBand for shell stamping — that copy is intentionally retained.
//
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

// DEPRECATED v8.15.0 (Ship 5 Gate 1) — re-render-on-band-change loses its
// reason-for-being once layout is CSS-driven (.hq-grid). The new banded grid
// reflows automatically via media queries; no JS re-render needed. Helper
// retained until follow-on ship retires _renderHQGridInner; the listener
// remains harmless (re-renders home page on band cross with identical content).
// Do not consume in new code paths.
//
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
  var firstName = _displayName(currentProfile);  // B.41 — was _firstName

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

  // v8.22+ (design-pass 2026-05-22): inject league pulse on mobile home so
  // members see what others are doing without navigating to /feed. Mirrors
  // the HQ League Pulse section but compressed: eyebrow + 3 most-recent
  // activity items as compact rows, no time-bucket grouping (space at a
  // premium on mobile). Routes to /feed on tap.
  if (ctx.state !== "new" && typeof _hqBuildActivityItems === "function") {
    h += _renderMobileLeaguePulse();
  }

  h += renderPageFooter();

  document.querySelector('[data-page="home"]').innerHTML = h;
}

// Compact league pulse for mobile home — 3 most-recent activity items as
// avatar + line cards. Per design-pass 2026-05-22: gives mobile members
// social context without leaving home. Routes the entire section to /feed
// on tap of "FULL FEED →".
function _renderMobileLeaguePulse() {
  var items;
  try { items = _hqBuildActivityItems(3); } catch(e) { items = []; }
  if (!items || !items.length) return "";
  var leagueName = (typeof window !== "undefined" && window._activeLeagueName) || "Parbaughs";

  var h = '<div style="padding:0 22px;margin-top:20px">';
  // Eyebrow + full feed link
  h += '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase">' + escHtml(String(leagueName).toUpperCase()) + ' · PULSE</div>';
  h += '<div onclick="Router.go(\'feed\')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);cursor:pointer;text-transform:uppercase">Full feed →</div>';
  h += '</div>';

  // Item rows
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  items.slice(0, 3).forEach(function(it) {
    var clickAttr = it.dest ? ' onclick="' + it.dest + '"' : '';
    h += '<div' + clickAttr + ' style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--cb-chalk-2);border-radius:8px;' + (it.dest ? 'cursor:pointer;' : '') + '">';
    // Avatar (32px)
    var actorPlayer = (it.actorUid && typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(it.actorUid) : null;
    if (typeof renderAvatar === "function") {
      h += '<div style="flex-shrink:0">' + renderAvatar(actorPlayer || { name: it.actorName || "?", id: "" }, 28, !!actorPlayer) + '</div>';
    }
    // Body
    h += '<div style="flex:1;min-width:0">';
    if (it.entityType) {
      h += '<div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:3px">' + escHtml(it.entityType) + '</div>';
    }
    h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-ink);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + escHtml(it.text) + '</div>';
    if (it.sub) h += '<div style="font-family:var(--font-mono);font-size:9px;color:var(--cb-mute);margin-top:2px;letter-spacing:0.3px">' + escHtml(it.sub) + '</div>';
    h += '</div>';
    // Time
    h += '<div style="flex-shrink:0;font-family:var(--font-mono);font-size:9px;color:var(--cb-mute);letter-spacing:0.3px">' + escHtml(it.timeAgo) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
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
      // Ship 5 Gate 2 (v8.15.1) — editorial 'hqHome' variant per Q6 ruling.
      // Eyebrow: "HQ · <Day> Edition" (e.g. "HQ · Saturday Edition"). Headline:
      // "Parbaughs" italic Fraunces. Subhead: contextual ladder/handicap blurb.
      // Date stamp: long form ("Saturday · April 24, 2026"). Replaces prior
      // 'default' / 'bandA' wordmark+date variants for HQ Home.
      var d = new Date();
      var dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
      return {
        variant: 'hqHome',
        eyebrow: 'HQ · ' + dayName + ' Edition',
        headline: 'Parbaughs',
        subhead: _hqMastheadSubhead(ctx),
        date: _formatHQMastheadDate(),
        weatherSiteId: 'hq-weather-pill'
      };
    },
    scope: function() {
      // v8.21.0 (Ship 5+6 Phase 3 / D2 League wayfinding) — League chip in
      // masthead right cluster, parallel to weather pill (V8.4 verified slot
      // positioning matches D2 directive). Wayfinding for new/beginner
      // golfers landing on HQ Home so they understand they're in a league
      // context. Cold-cache async race per V8.1: chip may flash default
      // "Parbaughs" briefly before window._activeLeagueName resolves from
      // /leagues/{id}.name — acceptable per design.
      //
      // Multi-league users (currentProfile.leagues.length > 1) get a chevron
      // affordance signaling the chip is a switcher. Single-league users see
      // a pure label — chip still routes to /leagues for create-or-join.
      var leagueName = (typeof window !== "undefined" && window._activeLeagueName) || "Parbaughs";
      var multiLeague = !!(typeof currentProfile !== "undefined" && currentProfile && currentProfile.leagues && currentProfile.leagues.length > 1);
      // A5 amendment (Ship 5+6 Phase 3): aria-label conditionalized — single-
      // league users see "Manage leagues" (chip opens league management for
      // create/join); multi-league sees "Switch league" (chip is a switcher).
      var ariaLabel = multiLeague ? "Switch league" : "Manage leagues";
      var chip = '<button class="hq-league-chip" type="button" onclick="Router.go(\'leagues\')" aria-label="' + escHtml(ariaLabel) + '">';
      chip += '<span class="hq-league-chip__dot" aria-hidden="true">◉</span>';
      chip += '<span class="hq-league-chip__name" data-league-name>' + escHtml(String(leagueName).toUpperCase()) + '</span>';
      if (multiLeague) {
        chip += '<svg class="hq-league-chip__chevron" viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
      }
      chip += '</button>';
      return chip;
    },
    content: function() {
      // Location banner inside content wrapper preserves pre-refactor band-
      // aware width treatment + position (above grid, below masthead).
      // Ship 5 Gate 1 (v8.15.0) — grid swapped from 5-band JS-driven
      // _renderHQGridInner to 4-band CSS-driven _renderHQHomeBanded per
      // Q-RULING-B. Concatenation preserved (banner stays at content-
      // wrapper level above the grid, P5 functional vs editorial split).
      return _renderHQLocationBanner() + _renderHQHomeBanded(ctx);
    },
    leftRail: null,
    rightRail: null,
    footer: function() { return renderPageFooter(); },
    // Ship 5 Gate 2 (v8.15.1) — HQ Home opts into container queries via
    // _hqHomeContentMaxWidth (returns "none" at all bands). Wrapper becomes
    // .page-shell__container's actual content area; .hq-grid responds via
    // @container hq-content rules in components.css. See Q-AUDIT-A ruling.
    contentMaxWidth: _hqHomeContentMaxWidth
  });
  _initWeatherDisplays();
}

// Scope switcher — extracted from inline masthead HTML during v8.11.4 refactor
// (Call 5). Pre-refactor lived in two copies inside _renderHQMastheadDefault and
// _renderHQMastheadBandA. Behavior identical post-extraction:
//   condensed=true  → "League" / "All"           (Bands A + B)
//   condensed=false → "My league" / "All Parbaughs" (Bands C + D)
//   flexShrink=true → adds flex-shrink:0          (Band A only — two-row layout)
//
// DEPRECATED v8.15.0 (Ship 5 Gate 1) — scope switcher hidden per design bot Q3
// ruling. Function retained for reference until follow-on ship ships chip row
// markup (All / This week / This month). Do not consume in new code paths.
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
  // Polish 2026-05-22 (iter3): banner was a stacked 2-row card with 18px
  // display headline + below-link CTA — felt heavy for a hint message.
  // Compressed to single-row inline layout: subtle ui-font hint + inline
  // brass action link. Less visual weight, faster scan. Chrome is a full
  // hairline brass-tinted border (Design Coherence Pass 2026-05-29 retired
  // the decorative left-rule per the side-stripe ban).
  var h = '<div style="background:var(--cb-chalk-2);border:1px solid rgba(var(--cb-brass-rgb),.22);padding:10px 14px;margin-top:var(--sp-3);border-radius:var(--r-2);display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;font-family:var(--font-ui)">';
  h += '<span style="font-size:13px;color:var(--cb-charcoal);line-height:1.3">';
  h += "Showing weather for " + locationName + ".";
  h += '</span>';
  h += '<a onclick="Router.go(\'settings\',{section:\'location\'})" style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.2px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;text-decoration:none" role="link" tabindex="0">Set your location →</a>';
  h += '</div>';
  return h;
}

// Populate the masthead weather pill after innerHTML is set. Emits "—°"
// placeholder; this fires PB.weather.getDisplay() and patches the DOM when
// data resolves. Failures are silent — pill hides if first-ever fetch fails
// with no cache.
//
// v8.21.0 (Ship 5+6 Phase 1 / B.24): hq-weather-caption + hq-weather-eyebrow
// site population removed. Weather is now single-source via the masthead pill;
// the caption + eyebrow elements are no longer rendered.
function _initWeatherDisplays() {
  if (typeof PB === "undefined" || !PB.weather) return;
  var el = document.getElementById("hq-weather-pill");
  if (el) {
    PB.weather.getDisplay({ format: "pill", includeWind: true }).then(function(w) {
      if (!w) {
        if (el.textContent === "—°") el.style.display = "none";
        return;
      }
      el.textContent = w.displayString;
      if (w.locationName) {
        el.title = w.locationName.toUpperCase() + " · WEATHER UPDATES EVERY 30 MIN";
      }
    });
  }
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

// Ship 5 Gate 2 (v8.15.1) — HQ Home-specific content width override per
// Q-AUDIT-A ruling. Returns "none" at every band so the page-shell wrapper
// becomes container-query-host (.page-shell__container has container-type:
// inline-size in components.css). .hq-grid then responds to its actual
// available content area, not viewport — fixes the >1440px "left-shifted
// with empty space" issue caused by the 1132px cap at Band D, and properly
// activates standard band at viewport 1120-1439 (was capped at 912px).
//
// Subsequent HQ pages (Members, Spotlight, etc.) keep _hqContentMaxWidth's
// per-band caps; they don't yet author @container hq-content rules, so their
// layout is unaffected by the always-on container-type: inline-size declaration.
function _hqHomeContentMaxWidth() {
  return "none";
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

// v8.21.0 (Ship 5+6 Phase 1 / B.30): return the full displayName as-is.
// Previously stripped Mr/Mrs/Dr titles via a `titles` array — but CTO uses
// "Mr Parbaugh" as a deliberate displayname and the strip was rendering
// just "Parbaugh." Members configure their displayname; greeting renders
// what they configured, no transform.
//
// B.41 (2026-05-22): renamed _firstName -> _displayName since the function
// now returns the full display name as configured. _firstName retained as
// an alias so external references (if any survive concatenation) don't
// break; remove alias after one full main-deploy cycle confirms no consumers.
function _displayName(profile) {
  if (!profile) return "Friend";
  return profile.name || profile.username || "Friend";
}
function _firstName(profile) { return _displayName(profile); }

function _formatDateEyebrow() {
  var d = new Date();
  var day = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
  var month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  return day + " · " + month + " " + d.getDate();
}

// Ship 5 Gate 2 (v8.15.1) — editorial subhead for hqHome masthead variant.
// Contextual one-liner: leader name + position phrasing for league context.
// Falls back to a generic line when standings are unavailable.
function _hqMastheadSubhead(ctx) {
  var season = ctx && ctx.season;
  var standings = (season && season.standings) || [];
  if (!standings.length) return "A small league with big games — log a round to claim your spot.";
  var leader = standings[0];
  var leaderName = leader && (leader.name || leader.playerName) ? (leader.name || leader.playerName) : "the leader";
  var weekCount = standings.length;
  return leaderName + " leads. " + weekCount + " on the ladder. The week is in motion.";
}

// Long-form date for HQ masthead: "Saturday · April 24, 2026"
function _formatHQMastheadDate() {
  var d = new Date();
  var day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  var month = ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()];
  return day + " · " + month + " " + d.getDate() + ", " + d.getFullYear();
}

// Ship 5 Gate 1 (v8.15.0) — banded grid foundation. CSS-driven 4-band layout
// primitive (.hq-grid in components.css) replaces the JS-branched 5-band
// _renderHQGridInner below. Bands (Q1 hybrid scheme):
//   compact   (720-1119): main only
//   standard  (1120-1439): main + right rail (280px)
//   cinema    (≥1440):   left rail (240px, empty per Q4) + main + right rail (320px)
//
// Content composition uses existing state-aware composers:
//   main       → _renderHQLeadColumn   (idle / active / new branching internal)
//   right rail → _renderHQFeaturesColumn + _renderHQAgateRail
//   left rail  → empty placeholder (Q4 ruling — content reserved for Gate 2+)
//
// Per P18 (primitives extracted on second consumer, not authored on first),
// .hq-grid CSS + this composer stay in home.js until League v1 ships as the
// second consumer. At that point the API design emerges from comparing both
// real consumers. For Gate 1, scaffold + content reuse only.
//
// Known Gate 1 tradeoff: at compact band (720-1119), the right rail content
// (chart + activity feed + online + tee times + spotlight) is hidden via CSS
// display:none. Subsequent gates reflow these into main at compact band per
// the mock's mobile-tail pattern. Tracked for Gate 3 (mobile reflow).
// Extracted to src/pages/home-hq.js per W1.A5. Originally lines 465-1051 of this file.

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
// Extracted to src/pages/home-live.js per W1.A5. Originally lines 1077-1455 of this file.
// Extracted to src/pages/home-charts.js per W1.A5. Originally lines 1456-1718 of this file.
// Extracted to src/pages/home-band.js per W1.A5. Originally lines 1719-2049 of this file.
// Extracted to src/pages/home-rail-newuser.js per W1.A5. Originally lines 2050-2547 of this file.
function _renderPulses(pulses) {
  if (!pulses || pulses.length === 0) return "";
  var h = '<div style="padding:0 22px">';
  pulses.forEach(function(p) {
    h += '<div style="padding:14px 16px;background:var(--cb-chalk-2);border:1px solid rgba(var(--cb-brass-rgb),.22);border-radius:6px;margin-bottom:8px">';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:4px">' + escHtml(p.eyebrow) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-ink);line-height:1.5">' + escHtml(p.text) + '</div>';
    // v8.22+ (design-pass 2026-05-22): brass progress bar when a pulse carries
    // a numeric progress (0-100). Currently only NEXT LEVEL sets it. Bar is
    // 4px tall, brass-faint track + brass fill, with a subtle min-width on
    // the fill so 0% still reads as "started" rather than empty.
    if (typeof p.progress === "number" && p.progress >= 0 && p.progress <= 100) {
      h += '<div style="margin-top:10px;height:4px;background:var(--cb-brass-faint, rgba(212,168,87,0.18));border-radius:2px;overflow:hidden">';
      h += '<div style="height:100%;width:' + Math.max(p.progress, 4) + '%;background:var(--cb-brass);border-radius:2px;transition:width 600ms cubic-bezier(0.25,0.4,0.25,1)"></div>';
      h += '</div>';
    }
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// v8.18.0 / Ship 5+2 (V10.2) — time field is a formatted string
// ("h:mm AM/PM"); lexical sort produces wrong order for same-date tees
// (e.g. "11:00 AM" < "1:00 AM" lexically because ':' > '1'). Parse to
// minutes-since-midnight for correct ordering.
function _parseTimeMinutes(t) {
  if (!t) return 0;
  var m = String(t).match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 0;
  var h = parseInt(m[1], 10) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

function _getUpcomingTeeTimes(limit) {
  if (typeof liveTeeTimes === "undefined" || !liveTeeTimes) return null;
  var today = localDateStr();
  var upcoming = liveTeeTimes.filter(function(t) {
    return t.date && t.date >= today && t.status !== "cancelled";
  });
  // Sort by date (ascending), then time-of-day (parsed)
  upcoming.sort(function(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return _parseTimeMinutes(a.time) - _parseTimeMinutes(b.time);
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
