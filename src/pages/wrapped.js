// ========== PARBAUGHS WRAPPED (v8.24.44, growth #2) ==========
// Story-format season recap for the signed-in member — tap-through
// full-screen slides ending in confetti + a public share link (rides the
// v8.24.43 shares infrastructure; the rules' 'recap' type was reserved
// for this). Strategy brief: must land before the founding season ends.
//
// Engine: slides render into the page container as a fixed overlay-style
// column. Right 2/3 tap = next, left 1/3 = back, X exits to seasonrecap.
// Progress segments across the top. Reduced-motion drops the slide-in.

var _wrappedSlides = [];
var _wrappedIdx = 0;

Router.register("wrapped", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  // v8.25.52 — a year's Wrapped doesn't FINALIZE until the year is essentially
  // over: before Dec 1 of the CURRENT year, show a "pending yearly progress"
  // screen rather than a premature champion/final recap (Founder 2026-06-13).
  // Past years (or Dec onward) render the full Wrapped.
  var _now = new Date();
  if (year >= _now.getFullYear() && _now < new Date(year, 11, 1)) { _renderWrappedPending(year); return; }
  _wrappedSlides = _buildWrappedSlides(year);
  _wrappedIdx = 0;
  _renderWrappedSlide();
});

// Pre-December "your year is still being written" gate (Founder: don't show the
// yearly Wrapped before Dec 1 — show pending progress instead).
function _renderWrappedPending(year) {
  var myPid = (typeof currentProfile !== "undefined" && currentProfile) ? (currentProfile.claimedFrom || currentProfile.id) : null;
  var yc = 0;
  try { yc = myPid ? PB.getPlayerRounds(myPid).filter(function(r) { return r.date && r.date >= year + "-01-01" && r.date <= year + "-12-31" && r.visibility !== "private"; }).length : 0; } catch (e) {}
  var bg = "var(--cb-felt, #1d3a2a)", fg = "var(--cb-chalk, #f1ead3)", mute = "rgba(241,234,211,.72)";
  // #41 v8.25.155 — anchor content in the upper third (was dead-center with a
  // ~70% void) + a felt radial vignette glow behind it so the screen reads as a
  // composed editorial moment, not a lonely centered block.
  var h = '<div style="position:fixed;inset:0;z-index:900;background:radial-gradient(125% 80% at 50% 22%, rgba(255,247,222,.08), transparent 60%), ' + bg + ';color:' + fg + ';display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;padding:calc(13vh + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));gap:18px;overflow-y:auto">';
  h += '<button onclick="Router.back(\'seasonrecap\')" style="position:absolute;top:calc(14px + env(safe-area-inset-top));left:16px;background:none;border:none;color:' + mute + ';font-size:13px;cursor:pointer;z-index:2">← Back</button>';
  h += '<div class="pb-card pb-card--felt wrapped-pending-hero">';
  h += '<div style="font-family:var(--font-mono);font-size:11px;letter-spacing:3px;color:var(--cb-brass-3,#E0BB60);text-transform:uppercase">' + year + ' · In Progress</div>';
  h += '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:31px;line-height:1.12;color:var(--cb-chalk,#F4EFE4)">Your year is still<br>being written.</div>';
  h += '<div style="font-size:13px;color:rgba(241,234,211,.78);max-width:300px;line-height:1.5">Your ' + year + ' Wrapped unlocks <b style="color:var(--cb-chalk,#F4EFE4)">December 1</b>. ' + (yc > 0 ? (yc + ' round' + (yc === 1 ? '' : 's') + ' in the books so far — keep teeing it up.') : 'Log a round and your story starts here.') + '</div>';
  h += '<div class="wrapped-pending-medallion" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#2a1e08" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/></svg></div>';
  h += '</div>';
  // Secondary band — fills the void below the focal-peak hero with a preview of
  // what unlocks Dec 1, plus a tappable affordance (P10: says WHAT + WHAT-ACTION,
  // and looks tappable via a brass-underlined control, not dead tan text).
  h += '<div class="pb-card pb-card--felt wrapped-pending-band">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:2.5px;color:var(--cb-brass-3,#E0BB60);text-transform:uppercase;margin-bottom:10px">Unlocks December 1</div>';
  h += '<div style="display:flex;flex-direction:column;gap:9px">';
  h += '<div class="wrapped-pending-row"><span>Your scoring year</span><span class="wrapped-pending-row-v">' + (yc > 0 ? (yc + ' round' + (yc === 1 ? '' : 's')) : 'not started') + '</span></div>';
  h += '<div class="wrapped-pending-row"><span>Home course &amp; best round</span><span class="wrapped-pending-row-v">pending</span></div>';
  h += '<div class="wrapped-pending-row"><span>League finish &amp; share card</span><span class="wrapped-pending-row-v">pending</span></div>';
  h += '</div>';
  h += '<button class="wrapped-pending-cta" onclick="Router.go(\'playnow\')">' + (yc > 0 ? 'Log another round' : 'Log your first round') + '</button>';
  h += '</div>';
  var el = document.querySelector('[data-page="wrapped"]');
  if (el) el.innerHTML = h;
}

function _buildWrappedSlides(year) {
  // Wrapped covers the whole CALENDAR YEAR (Founder 2026-06-12) — Jan 1 to Dec 31,
  // not the narrow golf sub-season. Round-derived slides filter on the year window
  // below; the league-rank slide uses the full-year standings ("_year").
  var season = PB.getSeasonStandings(year, "_year");
  var label = String(year);
  var yearStart = year + "-01-01", yearEnd = year + "-12-31";
  var myPid = (typeof currentProfile !== "undefined" && currentProfile) ? (currentProfile.claimedFrom || currentProfile.id) : null;
  var myName = (typeof currentProfile !== "undefined" && currentProfile) ? (PB.getDisplayName(currentProfile) || currentProfile.name || "You") : "You";
  var myRounds = myPid ? PB.getPlayerRounds(myPid).filter(function(r) {
    return r.date && r.date >= yearStart && r.date <= yearEnd && r.visibility !== "private";
  }) : [];

  // Not enough story yet — one warm card instead of an empty montage.
  if (!myRounds.length) {
    return [{
      bg: "felt",
      eyebrow: label,
      title: "Your story starts with a round.",
      body: "Wrapped is built from the golf you log. Play a round this year and come back — the Caddy will have something to say.",
      cta: { label: "Start a round", action: "Router.go('playnow')" }
    }];
  }

  var indiv = myRounds.filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });
  var holesWalked = myRounds.reduce(function(a, r) { return a + (r.holesPlayed || 18); }, 0);

  // Most-played course + best there
  var courseCounts = {}, courseBest = {};
  myRounds.forEach(function(r) {
    if (!r.course) return;
    courseCounts[r.course] = (courseCounts[r.course] || 0) + 1;
    if (r.score && (!courseBest[r.course] || r.score < courseBest[r.course])) courseBest[r.course] = r.score;
  });
  var homeCourse = Object.keys(courseCounts).sort(function(a, b) { return courseCounts[b] - courseCounts[a]; })[0] || null;

  // Most active month
  var monthCounts = {};
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  myRounds.forEach(function(r) { var m = parseInt(r.date.substring(5, 7)) - 1; monthCounts[m] = (monthCounts[m] || 0) + 1; });
  var topMonth = Object.keys(monthCounts).sort(function(a, b) { return monthCounts[b] - monthCounts[a]; })[0];

  // Best + average (18-hole individual; 9-hole members get their best 9 —
  // brief #8: nine-hole golf is first-class, not a missing slide)
  var full18 = indiv.filter(function(r) { return (!r.holesPlayed || r.holesPlayed >= 18) && r.score; });
  var best = null;
  full18.forEach(function(r) { if (!best || r.score < best.score) best = r; });
  var avg = full18.length ? Math.round(full18.reduce(function(a, r) { return a + r.score; }, 0) / full18.length * 10) / 10 : null;
  var best9 = null;
  if (!best) {
    indiv.filter(function(r) { return r.holesPlayed && r.holesPlayed <= 9 && r.score; })
      .forEach(function(r) { if (!best9 || r.score < best9.score) best9 = r; });
  }

  // League position
  var standings = season.standings || [];
  var myRow = null, myRank = 0;
  standings.forEach(function(st, i) { if (!myRow && (st.id === myPid || st.playerId === myPid)) { myRow = st; myRank = i + 1; } });
  var leaderName = standings.length ? (standings[0].name || standings[0].username) : null;

  var slides = [];
  slides.push({
    bg: "felt", eyebrow: (window._activeLeagueName || "Parbaughs") + " · " + label,
    title: "Your " + label.toLowerCase() + ", wrapped.",
    body: "Tap through. The Caddy kept notes all year."
  });
  slides.push({
    bg: "paper", eyebrow: "The work",
    stat: String(myRounds.length), statLabel: myRounds.length === 1 ? "round logged" : "rounds logged",
    body: holesWalked + " holes played" + (topMonth !== undefined ? " — " + monthNames[topMonth] + " was your month (" + monthCounts[topMonth] + " rounds)" : "") + "."
  });
  if (best) {
    slides.push({
      bg: "paper", eyebrow: "The scoring",
      stat: String(best.score), statLabel: "your best 18",
      body: "Shot at " + best.course + (best.date ? " on " + best.date : "") + (avg ? ". Year average: " + avg + "." : ".")
    });
  } else if (best9) {
    slides.push({
      bg: "paper", eyebrow: "The scoring",
      stat: String(best9.score), statLabel: "your best 9",
      body: "Shot at " + best9.course + (best9.date ? " on " + best9.date : "") + ". Nine-hole golf counts here."
    });
  }
  if (homeCourse) {
    slides.push({
      bg: "paper", eyebrow: "The home course",
      stat: String(courseCounts[homeCourse]) + "x", statLabel: homeCourse,
      body: courseBest[homeCourse] ? "Nobody sees it more than you. Your best there: " + courseBest[homeCourse] + "." : "Nobody sees it more than you."
    });
  }
  if (myRow) {
    slides.push({
      bg: "felt", eyebrow: "The league",
      stat: "#" + myRank, statLabel: (myRow.points || 0) + " points",
      body: myRank === 1 ? "Top of the board. Defend it." : ("Chasing " + (leaderName || "the leader") + ". The year isn't over.")
    });
  }
  slides.push({
    bg: "felt", eyebrow: label,
    title: "That's your year so far, " + myName.split(" ")[0] + ".",
    body: "Cut a public link and show the group chat that hasn't joined yet.",
    finale: true,
    shareRows: [
      { rank: 1, name: "Rounds", value: String(myRounds.length) },
      best ? { rank: 2, name: "Best 18", value: best.score + " · " + best.course } : (best9 ? { rank: 2, name: "Best 9", value: best9.score + " · " + best9.course } : null),
      avg ? { rank: 3, name: "Average", value: String(avg) } : null,
      homeCourse ? { rank: 4, name: "Home course", value: homeCourse + " (" + courseCounts[homeCourse] + "x)" } : null,
      myRow ? { rank: 5, name: "League rank", value: "#" + myRank + " · " + (myRow.points || 0) + " pts" } : null
    ].filter(Boolean),
    shareTitle: myName + "'s " + label.toLowerCase() + ", wrapped"
  });
  return slides;
}

function _renderWrappedSlide() {
  var s = _wrappedSlides[_wrappedIdx];
  if (!s) { Router.go("seasonrecap"); return; }
  var isFelt = s.bg === "felt";
  var bg = isFelt ? "var(--cb-felt, #1d3a2a)" : "var(--cb-paper, #faf7ef)";
  var fg = isFelt ? "var(--cb-chalk, #f1ead3)" : "var(--cb-ink, #14130f)";
  var mute = isFelt ? "rgba(241,234,211,.7)" : "var(--cb-mute, #6f6a5b)";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var h = '<div id="wrappedStage" style="position:fixed;inset:0;z-index:900;background:' + bg + ';color:' + fg + ';display:flex;flex-direction:column;overflow:hidden' + (reduced ? '' : ';animation:wrappedIn .35s ease') + '">';
  // progress segments
  h += '<div style="display:flex;gap:4px;padding:calc(10px + env(safe-area-inset-top)) 14px 0">';
  _wrappedSlides.forEach(function(_, i) {
    h += '<div style="flex:1;height:3px;border-radius:2px;background:' + (i <= _wrappedIdx ? 'var(--gold, #b58a3a)' : (isFelt ? 'rgba(241,234,211,.25)' : 'rgba(20,19,15,.15)')) + '"></div>';
  });
  h += '</div>';
  // close
  // v8.25.6 — close with Router.back, not Router.go. A forward go('seasonrecap')
  // pushed a new history entry on top of wrapped, so the browser/OS back button
  // then RE-ENTERED wrapped — the Founder-reported "back arrow loops" bug.
  // back() pops the wrapped entry, so back from the recap lands on standings.
  h += '<button aria-label="Close Wrapped" onclick="event.stopPropagation();Router.back(\'seasonrecap\')" style="position:absolute;top:calc(16px + env(safe-area-inset-top));right:10px;background:none;border:none;color:' + mute + ';font-size:24px;font-weight:300;min-width:44px;min-height:44px;cursor:pointer;z-index:2">×</button>';
  // content
  h += '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px 28px;max-width:480px;margin:0 auto;width:100%">';
  h += '<div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold, #b58a3a);margin-bottom:14px">' + escHtml(s.eyebrow || "") + '</div>';
  if (s.stat) {
    h += '<div style="font-family:var(--font-display);font-size:88px;line-height:1;font-weight:700">' + escHtml(s.stat) + '</div>';
    h += '<div style="font-family:var(--font-display);font-size:20px;margin-top:6px">' + escHtml(s.statLabel || "") + '</div>';
  }
  if (s.title) h += '<div style="font-family:var(--font-display);font-size:32px;line-height:1.2;font-weight:700">' + escHtml(s.title) + '</div>';
  if (s.body) h += '<div style="font-size:14px;line-height:1.6;color:' + mute + ';margin-top:14px;max-width:340px">' + escHtml(s.body) + '</div>';
  if (s.cta) h += '<button class="btn full green" style="margin-top:22px;max-width:260px" onclick="event.stopPropagation();' + s.cta.action + '">' + escHtml(s.cta.label) + '</button>';
  if (s.finale) {
    h += '<button class="btn full green" style="margin-top:22px;max-width:280px" onclick="event.stopPropagation();shareWrapped()">Share your Wrapped</button>';
    h += '<button style="margin-top:10px;background:none;border:none;color:' + mute + ';font-size:12px;cursor:pointer;min-height:44px" onclick="event.stopPropagation();Router.back(\'seasonrecap\')">Back to the recap</button>';
  }
  h += '</div>';
  // tap hint on first slide
  if (_wrappedIdx === 0 && _wrappedSlides.length > 1) {
    h += '<div style="text-align:center;padding-bottom:calc(22px + env(safe-area-inset-bottom));font-size:11px;color:' + mute + '">Tap to continue</div>';
  } else {
    h += '<div style="padding-bottom:calc(22px + env(safe-area-inset-bottom))"></div>';
  }
  h += '</div>';

  var el = document.querySelector('[data-page="wrapped"]');
  el.innerHTML = h;
  var stage = document.getElementById("wrappedStage");
  stage.addEventListener("click", function(e) {
    var x = e.clientX || 0;
    if (x < window.innerWidth / 3) { if (_wrappedIdx > 0) { _wrappedIdx--; _renderWrappedSlide(); } }
    else if (_wrappedIdx < _wrappedSlides.length - 1) { _wrappedIdx++; _renderWrappedSlide(); }
  });
  // confetti greets the finale
  var cur = _wrappedSlides[_wrappedIdx];
  if (cur && cur.finale && typeof pbCelebrate === "function") {
    try { pbCelebrate({ key: "wrapped_" + new Date().getFullYear() }); } catch (e) {}
  }
}

// Finale share — frozen public snapshot via the v8.24.43 shares pipeline.
function shareWrapped() {
  var s = _wrappedSlides[_wrappedSlides.length - 1];
  if (!s || !s.shareRows || !s.shareRows.length) { Router.toast("Nothing to share yet"); return; }
  Router.toast("Cutting your public link...");
  pbCreateShareLink({ type: "recap", title: s.shareTitle, meta: "Shared from Parbaughs Wrapped", rows: s.shareRows })
    .then(function(url) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
          Router.toast("Public link copied — no account needed to view");
        }).catch(function() {
          pbPrompt({ title: "Your public link", message: "Copy it from here.", value: url, confirmLabel: "Done" });
        });
      } else {
        pbPrompt({ title: "Your public link", message: "Copy it from here.", value: url, confirmLabel: "Done" });
      }
    })
    .catch(function() { Router.toast("Could not create the link — try again"); });
}
