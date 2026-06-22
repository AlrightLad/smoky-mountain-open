// ========== FEED — editorial single-column league feed (CLUBHOUSE_SPEC-HQ-3k) ==========
// W1.S11 (v8.23.74): Feed v2. Replaces the Instagram-card layout with a single
// editorial column in the Clubhouse register. Reuses the .roster-* masthead +
// scope-rail conventions from Members (3e) and adds a .feed-* card system:
// NO card backgrounds, hairline (--cb-chalk-3, the live alias of the spec's
// --cb-line) delineation, a Fraunces masthead ("What's happening."), and
// brass day eyebrows that stick under the top bar on scroll.
//
// Scope rail is League (default) / Community per spec § 3k.1.4. Community has
// no cross-league data source wired yet, so it renders the § 3k.4 editorial
// empty state ("OUTSIDE THE LEAGUE") rather than fabricating posts (P9).
//
// Deferred to later ships (data not yet on disk — not fabricated here):
//   · Card B "Chip post" + the composer-prompt modal → Composer ship (3l).
//     The prompt below stays functional today by posting a league chat message
//     (the real write path), and upgrades to the Composer modal when 3l lands.
//   · Card A "Live round pinned" (state 3k.5) → needs a live-round list source;
//     none exists in src/ yet, so nothing is pinned (no fabricated liveness).
//   · Card D "Auto-posted activity" → needs the feed-posts activity stream.
//
// The unified reverse-chron stream surfaces the three real sources the league
// produces today: rounds (public), range sessions, and league chat.
var _feedScope = "league";

Router.register("feed", function() {
  _feedScope = "league";
  var leagueName = (typeof window !== "undefined" && window._activeLeagueName) || "Parbaughs";

  var h = '<div class="feed-wrap">';

  // Masthead — editorial, working-surface density (no sub-deck / date line).
  h += '<header class="roster-masthead feed-masthead">';
  h += '<div class="roster-eyebrow">THE FEED · ' + escHtml(String(leagueName).toUpperCase()) + '</div>';
  h += '<h1 class="roster-headline feed-headline">What’s happening.</h1>';
  h += '</header>';

  // Scope rail — 2-tab League/Community (brass underline) + posts-today meta.
  h += '<div class="feed-scope">';
  h += '<div class="roster-tabs" role="tablist" aria-label="Feed scope">';
  h += '<button class="roster-tab roster-tab--active" role="tab" aria-selected="true" id="feedScopeLeague" onclick="setFeedScope(\'league\')">League</button>';
  h += '<button class="roster-tab" role="tab" aria-selected="false" id="feedScopeCommunity" onclick="setFeedScope(\'community\')">Community</button>';
  h += '</div>';
  h += '<div class="feed-poststoday" id="feedPostsMeta"></div>';
  h += '</div>';

  // Composer prompt — opens the Chip composer modal (3l.1). Reads like club
  // stationery, not a chat input; the modal carries the real authoring chrome.
  h += '<div class="feed-composer">';
  h += '<button class="feed-composer__prompt" type="button" aria-haspopup="dialog" aria-label="Post a Chip to the feed" onclick="openChipComposer()">';
  h += '<span class="feed-composer__promptText">What’s on your mind?</span>';
  h += '<span class="feed-composer__pencil" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>';
  h += '</button>';
  h += '</div>';

  h += '<div id="feedStream" class="feed-stream" role="feed" aria-busy="true"><div class="loading"><div class="spinner"></div>Loading the feed…</div></div>';
  h += '</div>';
  document.querySelector('[data-page="feed"]').innerHTML = h;

  // ── Load the three real sources into one unified stream ──
  window._feedItems = [];
  var items = window._feedItems;
  var pending = 3;

  function tryRender() {
    if (pending > 0) return;
    items.sort(function(a, b) { return b.ts - a.ts; });
    // App Store 1.2 — hide posts authored by members the viewer has blocked.
    window._feedItems = items.filter(function(it) {
      return typeof pbIsBlocked !== "function" || !pbIsBlocked(it.playerId);
    });
    _renderFeedItems();
  }

  // 1. Rounds — rich data for hole dots + stats.
  if (db) {
    leagueQuery("rounds").where("visibility", "==", "public").orderBy("createdAt", "desc").limit(40).get().then(function(snap) {
      snap.forEach(function(doc) {
        var r = doc.data();
        // v8.14.0 — render-side guard: abandoned rounds are dev-test artifacts
        // and never surface publicly (defense-in-depth behind the write filter).
        if (r.status === "abandoned") return;
        var rid = doc.id;
        var isScramble = r.format === "scramble" || r.format === "scramble4";
        var comm = PB.generateRoundCommentary({ score: r.score, rating: r.rating || 72, slope: r.slope || 113, player: r.player, holesPlayed: r.holesPlayed || 18 });
        var quip = isScramble ? "" : (comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : ""));
        var player = PB.getPlayer(r.player);
        items.push({
          type: "round",
          player: player,
          playerId: r.player,
          playerName: r.playerName || (player ? player.name || player.username : "A Parbaugh"),
          course: r.course || "",
          score: r.score,
          tee: r.tee || "",
          format: r.format || "stroke",
          holesPlayed: r.holesPlayed || 18,
          holesMode: r.holesMode || "18",
          frontScore: r.frontScore || null,
          backScore: r.backScore || null,
          holeScores: r.holeScores || [],
          holePars: r.holePars || [],
          firData: r.firData || null,
          girData: r.girData || null,
          puttsData: r.puttsData || null,
          quip: quip,
          date: r.date || "",
          ts: tsMillis(r.createdAt),
          roundId: rid,
          isScramble: isScramble,
          likes: r.likes || [],
          comments: r.comments || [],
          commentLikes: r.commentLikes || {}
        });
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }

  // 2. Range sessions.
  if (typeof liveRangeSessions !== "undefined" && liveRangeSessions.length) {
    liveRangeSessions.filter(function(s) { return s.visibility !== "private"; }).slice(0, 10).forEach(function(s) {
      var player = PB.getPlayer(s.playerId);
      items.push({
        type: "range",
        player: player,
        playerId: s.playerId,
        playerName: s.playerName || (player ? player.name || player.username : "A Parbaugh"),
        duration: s.durationMin || 0,
        focus: s.focus || "",
        drills: s.drills || [],
        sessionId: s._id || "",
        ts: s.startedAt ? new Date(s.startedAt).getTime() : 0
      });
    });
  }
  pending--;

  // 3. Chat messages.
  if (db) {
    leagueQuery("chat").orderBy("createdAt", "desc").limit(30).get().then(function(snap) {
      snap.forEach(function(doc) {
        var msg = doc.data();
        // RENDER-TIME NORMALIZATION (v8.25.x): any doc that is bot content —
        // new canonical (authorId "the-caddy" / bot:true) OR legacy ("system",
        // authorName "The Caddy"/"Parbaughs") — collapses into the single Caddy
        // identity here, so already-stored docs render branded without a
        // Firestore migration. Human posts keep their real member player.
        var isBot = (typeof isCaddyAuthor === "function") ? isCaddyAuthor(msg)
          : (!!msg.system || msg.authorName === "The Caddy" || msg.authorName === "The Caddies" || msg.authorName === "Parbaughs");
        var player = (!isBot && msg.authorId) ? PB.getPlayer(msg.authorId) : null;
        items.push({
          type: "chat",
          player: isBot ? (typeof PB_CADDY !== "undefined" ? PB_CADDY : { id: "the-caddy", name: "The Caddies", bot: true }) : player,
          playerId: isBot ? "" : (msg.authorId || ""),
          author: isBot ? "The Caddies" : (msg.authorName || msg.user || "Member"),
          text: msg.text || "",
          ts: tsMillis(msg.createdAt) || (msg.timestamp || 0),
          system: isBot
        });
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }
});

// ── Scope rail toggle (League / Community) ──
function setFeedScope(scope) {
  _feedScope = scope === "community" ? "community" : "league";
  var lg = document.getElementById("feedScopeLeague");
  var cm = document.getElementById("feedScopeCommunity");
  if (lg) { lg.classList.toggle("roster-tab--active", _feedScope === "league"); lg.setAttribute("aria-selected", _feedScope === "league" ? "true" : "false"); }
  if (cm) { cm.classList.toggle("roster-tab--active", _feedScope === "community"); cm.setAttribute("aria-selected", _feedScope === "community" ? "true" : "false"); }
  _renderFeedItems();
}

// ── Hole dot helper (hardcoded hole-dot colors are an allowed exception) ──
function _feedHoleDots(holeScores, holePars, holesPlayed, holesMode) {
  if (!holeScores || holeScores.length < 9) return '';
  var is9 = holesPlayed && holesPlayed <= 9;
  var numHoles = Math.min(holeScores.length, is9 ? 9 : 18);
  var startHole = is9 && holesMode === "back9" ? 9 : 0;
  var dh = '<div class="feed-dots">';
  for (var i = startHole; i < startHole + numHoles; i++) {
    var hs = parseInt(holeScores[i]);
    var hp = (holePars && holePars[i]) || 4;
    var color = "var(--cb-chalk-3)";
    if (hs > 0) {
      var diff = hs - hp;
      if (diff <= -2) color = "#FFD700";
      else if (diff === -1) color = "#4CAF50";
      else if (diff === 0) color = "#888888";
      else if (diff === 1) color = "#F59E42";
      else color = "#E53935";
    }
    dh += '<span class="feed-dot' + (is9 ? ' feed-dot--9' : '') + '" style="background:' + color + '"></span>';
  }
  dh += '</div>';
  return dh;
}

// ── Stat chips helper (mono editorial chips) ──
// P9 truth gate: firData/girData are stored as Array(18).fill(false) — an
// untouched FIR/GIR checkbox is indistinguishable from a real miss. So an
// all-false array is the *default untracked* state, not "0 fairways hit", and
// surfacing "FIR 0/13" reads as broken/fabricated. We only show a coverage chip
// when it traces to real tracking: at least one positive AND the player covered
// >=50% of eligible (played) holes. PUTTS is sparse (Array(18).fill("")) so we
// require a value on *every* played hole before showing a total — a partial
// "PUTTS 5" is misleading. A round with thin tracking simply shows no chip.
function _feedStatChips(item) {
  var chips = [];
  if (item.frontScore && item.backScore) {
    chips.push('F9 ' + item.frontScore);
    chips.push('B9 ' + item.backScore);
  }
  // Played-hole count drives the coverage denominators below.
  var played = 0;
  if (item.holeScores && Array.isArray(item.holeScores)) {
    item.holeScores.forEach(function(s) { if (parseInt(s) > 0) played++; });
  }

  if (item.firData && Array.isArray(item.firData)) {
    var firC = 0, firH = 0;
    item.firData.forEach(function(v, i) {
      var sc = item.holeScores ? parseInt(item.holeScores[i]) : 1;
      if (!(sc > 0)) return;                               // only count played holes
      var par = item.holePars ? (item.holePars[i] || 4) : 4;
      if (par !== 3) { firH++; if (v) firC++; }            // par-3s are not eligible for FIR
    });
    // Show only when it reads as real, tracked data: a hit fairway exists and
    // coverage clears half the eligible holes (kills the default 0/N chip).
    if (firH > 0 && firC > 0 && firC * 2 >= firH) chips.push('FIR ' + firC + '/' + firH);
  }
  if (item.girData && Array.isArray(item.girData)) {
    var girC = 0, girH = 0;
    item.girData.forEach(function(v, i) {
      var sc = item.holeScores ? parseInt(item.holeScores[i]) : 1;
      if (!(sc > 0)) return;                               // only count played holes
      girH++; if (v) girC++;
    });
    if (girH > 0 && girC > 0 && girC * 2 >= girH) chips.push('GIR ' + girC + '/' + girH);
  }
  if (item.puttsData && Array.isArray(item.puttsData)) {
    var pTotal = 0, pHoles = 0;
    item.puttsData.forEach(function(v, i) {
      var sc = item.holeScores ? parseInt(item.holeScores[i]) : 1;
      if (!(sc > 0)) return;                               // only count played holes
      var n = parseInt(v) || 0;
      if (n > 0) { pTotal += n; pHoles++; }
    });
    // Only a total over *every* played hole is honest; a partial sum misleads.
    if (pTotal > 0 && played > 0 && pHoles >= played) chips.push('PUTTS ' + pTotal);
  }
  if (!chips.length) return '';
  var ch = '<div class="feed-chips">';
  chips.forEach(function(c) { ch += '<span class="feed-chip">' + escHtml(c) + '</span>'; });
  ch += '</div>';
  return ch;
}

// ── Day eyebrows (per calendar day, sticky on scroll) ──
// Spec § 3k.1.5: mono 11px brass uppercase. Per-day grouping (not bucketed) so
// each day owns one eyebrow. Format: TODAY · APR 14 / YESTERDAY · APR 13 /
// APR 12 · SATURDAY (within the last week) / APR 5 (older, same year) /
// APR 5, 2025 (older, prior year).
function _feedDayKey(ts) {
  if (!ts) return "0000-0-0";
  var d = new Date(ts);
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function _feedDayLabel(ts) {
  if (!ts) return "EARLIER";
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var dayMs = 86400000;
  var d = new Date(ts);
  var mons = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var wk = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  var md = mons[d.getMonth()] + " " + d.getDate();
  if (ts >= startOfToday) return "TODAY · " + md;
  if (ts >= startOfToday - dayMs) return "YESTERDAY · " + md;
  if (ts >= startOfToday - 6 * dayMs) return md + " · " + wk[d.getDay()];
  if (d.getFullYear() === now.getFullYear()) return md;
  return md + ", " + d.getFullYear();
}
function _feedDayAria(ts) {
  if (!ts) return "earlier posts";
  var d = new Date(ts);
  var mons = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return "Posts from " + mons[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}
function _feedDayEyebrow(ts) {
  return '<h2 class="feed-day" aria-label="' + escHtml(_feedDayAria(ts)) + '">' + escHtml(_feedDayLabel(ts)) + '</h2>';
}

// ── Posts-today meta in the scope rail ──
function _setPostsTodayMeta(n) {
  var m = document.getElementById("feedPostsMeta");
  if (!m) return;
  m.textContent = n > 0 ? (n + (n === 1 ? " post today" : " posts today")) : "";
}

// ── Editorial empty states (spec § 3k.3 League / § 3k.4 Community) ──
function _feedEmptyState(scope) {
  var eyebrow, head, body, cta;
  if (scope === "community") {
    eyebrow = "OUTSIDE THE LEAGUE";
    head = "Quiet across the platform.";
    body = "Cross-league activity surfaces here. Check back when other leagues post.";
    cta = "";
  } else {
    eyebrow = "NOTHING HERE YET";
    head = "The league hasn’t started talking yet. Be the first.";
    body = "Post a Chip or log a round, and the feed wakes up when members post.";
    cta = '<button class="feed-empty__cta" type="button" onclick="openChipComposer(\'league\')">+ Post a Chip →</button>';
  }
  return '<div class="feed-empty">' +
    '<div class="feed-empty__eyebrow">' + eyebrow + '</div>' +
    '<div class="feed-empty__head">' + head + '</div>' +
    '<div class="feed-empty__body">' + body + '</div>' +
    cta +
    '</div>';
}

function _renderFeedItems() {
  var el = document.getElementById("feedStream");
  if (!el) return;
  el.setAttribute("aria-busy", "false");

  // Community scope has no cross-league data source yet — truthful empty state.
  if (_feedScope === "community") {
    _setPostsTodayMeta(0);
    el.innerHTML = _feedEmptyState("community");
    return;
  }

  var items = window._feedItems || [];
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  _setPostsTodayMeta(items.filter(function(i) { return i.ts >= startOfToday; }).length);

  if (!items.length) {
    el.innerHTML = _feedEmptyState("league");
    return;
  }

  var fh = '';
  // The Caddy's Report (rank 4) — the week's superlatives lead the league feed,
  // the app authoring the conversation. Honest "quiet week" state when no rounds.
  if (_feedScope === "league") fh += _renderWeeklyReport(_caddyWeeklyReport(items));
  // The Caddy's Front Page (rank 2) — crown the single most newsworthy recent
  // round as an oversize editorial LEAD, then run the rest as the uniform stream
  // below (asymmetric: one hero + satellites, never a wall of identical rows).
  // Honest by construction: falls back to the most recent round when nothing
  // clears the newsworthiness bar; never invents drama.
  var lead = (_feedScope === "league") ? _feedLeadPick(items) : null;
  if (lead) fh += _renderLeadStory(lead);

  // Density tiers — never a wall of identical full-fat cards. After the lead
  // hero, the single most-recent remaining round renders as the FULL card
  // (avatar + score + dots + chips + the four-button action row, smoke-locked).
  // Every round after that collapses into a compact row (avatar · name · score ·
  // time), tappable into the round. Chat + range cards are already light and
  // keep their existing treatment.
  var fullRoundUsed = false;
  var lastDay = null;
  items.slice(0, 60).forEach(function(item) {
    if (lead && item === lead) return; // the lead is already crowned above
    var dk = _feedDayKey(item.ts);
    if (dk !== lastDay) { fh += _feedDayEyebrow(item.ts); lastDay = dk; }
    if (item.type === "round") {
      if (!fullRoundUsed) { fh += _renderRoundCard(item); fullRoundUsed = true; }
      else fh += _renderRoundCompact(item);
    }
    else if (item.type === "chat") fh += _renderChatCard(item);
    else if (item.type === "range") fh += _renderRangeCard(item);
  });
  el.innerHTML = fh;
  // v8.25.79 — fade-up cascade over the feed blocks (weekly report → lead story
  // → day eyebrows + cards). transform/opacity only, reduced-motion no-ops
  // inside staggeredReveal. Fires once per full stream render (not on the
  // surgical kudos patch, which never re-runs _renderFeedItems).
  if (window.staggeredReveal) window.staggeredReveal(el.children, { gap: 40, duration: 320 });
}

// ── The Caddy's Weekly Report (rank 4) — the app authors the conversation ────
// Reduces the current ISO week's rounds (already loaded into _feedItems) into a
// digest of superlatives in the Caddy's voice. Pure render-time computation over
// data already fetched — no scheduled function, no new write. P9: every
// superlative traces to a real round; a quiet week says so honestly.
function _caddyWeeklyReport(items) {
  var now = new Date();
  var dow = (now.getDay() + 6) % 7;                 // 0 = Monday
  var weekStart = new Date(now); weekStart.setDate(now.getDate() - dow); weekStart.setHours(0, 0, 0, 0);
  var ws = weekStart.getTime();
  // v8.25.234 — filter by the round's PLAY date, not its write timestamp. A round
  // re-synced recently but PLAYED weeks ago must NOT count as this week (Founder:
  // a >1-week-old FatalBert round was stuck on the front page). Fall back to ts only
  // when a round somehow has no date.
  var rounds = (items || []).filter(function(it) {
    if (it.type !== "round" || it.isScramble) return false;
    var playMs = it.date ? new Date(it.date + "T12:00:00").getTime() : it.ts;
    return playMs >= ws;
  });
  var report = { weekStart: weekStart, rounds: rounds.length, bullets: [], empty: rounds.length === 0 };
  if (!rounds.length) return report;

  // Round of the Week — lowest score to par. 18-hole only, so a 9-hole round's
  // half-par to-par can't out-rank a full round (P9 — don't over-crown).
  var rotw = null, rotwDiff = 9999;
  rounds.forEach(function(r) {
    if (r.holesPlayed && r.holesPlayed < 18) return;
    var par = roundParTotal(r); var d = (r.score && par) ? r.score - par : null;
    if (d !== null && d < rotwDiff) { rotwDiff = d; rotw = r; }
  });
  if (rotw) {
    var dStr = rotwDiff === 0 ? "even" : (rotwDiff > 0 ? "+" + rotwDiff : String(rotwDiff));
    report.bullets.push({ label: "Round of the Week", player: rotw.player, name: rotw.playerName, line: rotw.score + " (" + dStr + ") at " + (rotw.course || "the course"), roundId: rotw.roundId });
  }

  // The Grinder — most rounds logged this week.
  var byPlayer = {};
  rounds.forEach(function(r) { var k = r.playerId; if (!k) return; if (!byPlayer[k]) byPlayer[k] = { count: 0, name: r.playerName, player: r.player }; byPlayer[k].count++; });
  var grinderKey = null;
  Object.keys(byPlayer).forEach(function(k) { if (!grinderKey || byPlayer[k].count > byPlayer[grinderKey].count) grinderKey = k; });
  if (grinderKey && byPlayer[grinderKey].count >= 2) {
    var g = byPlayer[grinderKey];
    report.bullets.push({ label: "The Grinder", player: g.player, name: g.name, line: g.count + " rounds logged — nobody's out there more." });
  }

  // Hot Hand / Sandbagger Watch — beat their season average by the most (18-hole).
  var hot = null, hotDelta = 0;
  rounds.forEach(function(r) {
    if (!r.playerId || !r.score || (r.holesPlayed && r.holesPlayed < 18)) return;
    var avg = (typeof PB !== "undefined" && PB.getPlayerAvg) ? PB.getPlayerAvg(r.playerId) : null;
    if (avg && !isNaN(avg)) { var delta = avg - r.score; if (delta > hotDelta) { hotDelta = delta; hot = r; } }
  });
  if (hot && hotDelta >= 3 && (!rotw || hot.roundId !== rotw.roundId)) {
    var label = hotDelta >= 8 ? "Sandbagger Watch" : "Hot Hand";
    var tail = hotDelta >= 8 ? " under his average. All in good fun." : " under his average.";
    report.bullets.push({ label: label, player: hot.player, name: hot.playerName, line: hot.score + ", " + hotDelta.toFixed(0) + tail, roundId: hot.roundId });
  }
  return report;
}

function _renderWeeklyReport(report) {
  if (!report) return "";
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var weekLabel = months[report.weekStart.getMonth()] + " " + report.weekStart.getDate();
  var h = '<section class="feed-report" aria-label="The Caddies\' Report">';
  h += '<div class="feed-report__masthead"><div class="feed-report__kicker">The Caddies\' Report</div><div class="feed-report__week">Week of ' + escHtml(weekLabel) + '</div></div>';
  if (report.empty) {
    h += '<div class="feed-report__quiet">Quiet week at the club. First tee\'s yours.</div>';
  } else {
    report.bullets.forEach(function(b) {
      var click = b.roundId ? "Router.go('rounds',{roundId:'" + b.roundId + "'})" : "";
      h += '<div class="feed-report__row"' + (click ? ' role="button" tabindex="0" onclick="' + click + '" onkeydown="if(event.key===\'Enter\'){' + click + '}"' : '') + '>';
      h += renderAvatar(b.player, 32, false);
      h += '<div class="feed-report__rowmain"><div class="feed-report__label">' + escHtml(b.label) + '</div><div class="feed-report__line"><strong>' + escHtml(b.name || "A Parbaugh") + '</strong> — ' + escHtml(b.line) + '</div></div>';
      h += '</div>';
    });
  }
  h += '</section>';
  return h;
}

// ── The Caddy's Front Page — lead-story selection + render (rank 2) ──────────
// Scores recent (<=14d) individual rounds by newsworthiness (eagles, low to-par,
// birdies, today-bonus) and returns the lead, or the most-recent round as a
// calmer fallback. Pure read over the items already loaded; no new data.
function _feedLeadPick(items) {
  if (!items || !items.length) return null;
  var now = Date.now();
  var WINDOW = 14 * 86400000;
  var startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  var best = null, bestNws = -1, firstRound = null;
  items.forEach(function(it) {
    if (it.type !== "round" || it.isScramble) return;
    if (!firstRound) firstRound = it;
    if (it.ts && (now - it.ts) > WINDOW) return;
    var par = roundParTotal(it);
    var diff = (it.score && par) ? it.score - par : null;
    var eagles = 0, birdies = 0;
    if (it.holeScores && it.holePars && it.holeScores.length === it.holePars.length) {
      for (var i = 0; i < it.holeScores.length; i++) {
        var sc = parseInt(it.holeScores[i]) || 0, pr = parseInt(it.holePars[i]) || 0;
        if (sc > 0 && pr > 0) { if (sc <= pr - 2) eagles++; else if (sc === pr - 1) birdies++; }
      }
    }
    var nws = 0;
    if (eagles > 0) nws += 50 + eagles * 10;
    if (diff !== null) nws += Math.max(0, 40 - diff);
    nws += birdies * 3;
    if (it.ts >= startToday.getTime()) nws += 15;
    it._nws = nws; it._eagles = eagles; it._birdies = birdies; it._diff = diff;
    if (nws > bestNws) { bestNws = nws; best = it; }
  });
  if (best && bestNws >= 25) return best;
  return firstRound; // calmer lead — most recent round, no fabricated drama
}

function _feedLeadKicker(ts) {
  var d = new Date(ts), now = new Date();
  var sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "Today";
  var y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return "This Week";
}

function _feedLeadHeadline(item) {
  var name = item.playerName || "A Parbaugh";
  var course = item.course || "the course";
  var diff = (item._diff != null) ? item._diff : null;
  if (item._eagles > 0) return item._eagles > 1 ? name + " drops " + item._eagles + " eagles at " + course + "." : name + " eagles " + course + ".";
  if (diff !== null && diff <= -3) return name + " torches " + course + ", " + item.score + ".";
  if (diff !== null && diff < 0) return name + " goes " + diff + " at " + course + ".";
  if (diff === 0) return name + " plays " + course + " to even par.";
  if (item._birdies >= 3) return name + " cards " + item._birdies + " birdies at " + course + ".";
  return name + " posts " + item.score + " at " + course + ".";
}

function _renderLeadStory(item) {
  var par = roundParTotal(item);
  var diff = (item.score && par) ? item.score - par : null;
  var diffStr = diff === null ? "" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
  var diffCls = (diff !== null && diff <= 0) ? "feed-topar--under" : "feed-topar--over";
  var roundClick = item.roundId ? "Router.go('rounds',{roundId:'" + item.roundId + "'})" : "";
  var headline = _feedLeadHeadline(item);
  var h = '<article class="feed-lead" role="article" aria-label="' + escHtml("Lead story: " + headline) + '">';
  h += '<div class="feed-lead__kicker">The Front Page · ' + escHtml(_feedLeadKicker(item.ts)) + '</div>';
  h += '<h2 class="feed-lead__headline"' + (roundClick ? ' role="button" tabindex="0" onclick="' + roundClick + '" onkeydown="if(event.key===\'Enter\'){' + roundClick + '}"' : '') + '>' + escHtml(headline) + '</h2>';
  h += '<div class="feed-lead__byline">' + renderAvatar(item.player, 28, true) + '<span class="feed-lead__by">' + renderUsername(item.player, "font-weight:600;", true) + '</span><span class="feed-lead__time">' + escHtml(feedTimeAgo(item.ts)) + '</span></div>';
  h += '<div class="feed-lead__scoreline">';
  h += '<div class="feed-lead__score">' + (item.score != null ? item.score : "—") + (diffStr ? '<span class="feed-lead__topar ' + diffCls + '">' + diffStr + '</span>' : '') + '</div>';
  h += '<div class="feed-lead__coursewrap"><div class="feed-lead__course">' + escHtml(item.course || "") + '</div>' + (item._eagles > 0 ? '<div class="feed-lead__flag">' + item._eagles + ' eagle' + (item._eagles !== 1 ? 's' : '') + '</div>' : (item._birdies > 0 ? '<div class="feed-lead__flag">' + item._birdies + ' birdie' + (item._birdies !== 1 ? 's' : '') + '</div>' : '')) + '</div>';
  h += '</div>';
  var dots = _feedHoleDots(item.holeScores, item.holePars, item.holesPlayed, item.holesMode);
  if (dots) h += dots;
  if (item.quip) h += '<blockquote class="feed-lead__quote">' + escHtml(item.quip) + '</blockquote>';
  h += _feedRoundFooter(item, roundClick);
  h += '</article>';
  return h;
}

// Shared interactive footer (action row + comment thread + reply input) for round
// surfaces. Extracted so the lead story and the satellite round card stay in sync;
// the satellite card keeps its own inline copy (smoke-locked DOM) for now.
function _feedRoundFooter(item, roundClick) {
  var likes = item.likes || [];
  var comments = item.comments || [];
  var iLiked = currentUser && likes.indexOf(currentUser.uid) !== -1;
  var likeLabel = "Kudos" + (likes.length ? " " + likes.length : "");
  var commentLabel = "Reply" + (comments.length ? " " + comments.length : "");
  var teeTaps = (item.reactions && item.reactions.teeTap) || [];
  var iTapped = currentUser && teeTaps.indexOf(currentUser.uid) !== -1;
  var tapLabel = "Tee Tap" + (teeTaps.length ? " " + teeTaps.length : "");
  var h = '<div class="feed-actions" data-feed-action-row="1" data-round-id="' + item.roundId + '">';
  h += '<button class="feed-action" type="button" data-action="scorecard" aria-label="View scorecard" onclick="event.stopPropagation();' + roundClick + '"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8h4M5 10h5"/></svg><span>Scorecard</span></button>';
  h += '<button class="feed-action' + (iLiked ? ' feed-action--on' : '') + '" type="button" data-action="kudos" title="Kudos — nice round (a like)" data-i-liked="' + (iLiked ? '1' : '0') + '" data-likes-count="' + likes.length + '" aria-pressed="' + (iLiked ? 'true' : 'false') + '" aria-label="Kudos, ' + likes.length + ' reactions" onclick="event.stopPropagation();feedToggleLike(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="' + (iLiked ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg><span>' + likeLabel + '</span></button>';
  // v8.25.32 — Tee Tap removed: ONE appreciation reaction (Kudos) only. Two was
  // redundant + confusing, and no peer app does it (Founder call 2026-06-12).
  h += '<button class="feed-action" type="button" data-action="comment" aria-label="Reply" onclick="event.stopPropagation();feedShowCommentInput(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg><span>' + commentLabel + '</span></button>';
  h += '<button class="feed-action" type="button" data-action="share" aria-label="Share to DM" onclick="event.stopPropagation();shareScorecard(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg><span>Share</span></button>';
  h += '</div>';
  h += _renderCommentThread(item.roundId, comments, item.commentLikes);
  h += '<div class="feed-commentinput" id="feedComment-' + item.roundId + '" style="display:none">';
  h += '<input type="text" class="ff-input" id="feedCommentText-' + item.roundId + '" placeholder="Add a reply…" onkeydown="if(event.key===\'Enter\')feedSubmitComment(\'' + item.roundId + '\')">';
  h += '<button class="feed-commentinput__post" type="button" onclick="event.stopPropagation();feedSubmitComment(\'' + item.roundId + '\')">Post</button>';
  h += '</div>';
  return h;
}

// H2H chip data — does another member have a public round at the same course on
// the same day as this round? Used to surface the rivalry where it happened.
function _feedH2HOpponent(item) {
  if (!item || item.type !== "round" || item.isScramble || !item.course || !item.date) return null;
  var items = window._feedItems || [];
  for (var i = 0; i < items.length; i++) {
    var o = items[i];
    if (o === item || o.type !== "round" || o.isScramble) continue;
    if (o.playerId && o.playerId !== item.playerId && o.date === item.date &&
        (typeof PB === "undefined" || !PB.normCourseName || PB.normCourseName(o.course) === PB.normCourseName(item.course))) {
      return o;
    }
  }
  return null;
}

// ── ROUND CARD (Card C — round post) ──
function _renderRoundCard(item) {
  var is9h = item.holesPlayed && item.holesPlayed <= 9;
  var holeLabel = is9h ? (item.holesMode === "back9" ? "Back 9" : "Front 9") : "";
  var teeLabel = item.tee ? item.tee + " Tees" : "";
  var meta = [teeLabel, holeLabel, item.format !== "stroke" ? item.format : ""].filter(Boolean).join(" · ");
  // Community-safe par-relative score: brass numeral, mono to-par. No alarm-red
  // on the social feed ("community over competition").
  var _par = roundParTotal(item);
  var _diff = (item.score && _par) ? item.score - _par : null;
  var _diffStr = _diff === null ? "" : (_diff === 0 ? "E" : (_diff > 0 ? "+" + _diff : String(_diff)));
  var _diffCls = (_diff !== null && _diff <= 0) ? "feed-topar--under" : "feed-topar--over";
  var roundClick = item.roundId ? "Router.go('rounds',{roundId:'" + item.roundId + "'})" : "";

  var aria = (item.playerName || "A member") + " posted a round at " + (item.course || "a course") + ", " + feedTimeAgo(item.ts);
  var h = '<article class="feed-card feed-card--round" role="article" aria-label="' + escHtml(aria) + '">';

  // Header: avatar + name + timestamp ... score numeral (right).
  h += '<div class="feed-card__head">';
  h += renderAvatar(item.player, 40, true);
  h += '<div class="feed-card__who">';
  h += '<div class="feed-card__name">' + renderUsername(item.player, "font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;color:var(--cb-ink);", true) + (item.isScramble ? ' <span class="feed-card__tag">Scramble</span>' : '') + '</div>';
  h += '<div class="feed-card__time">' + escHtml(feedTimeAgo(item.ts)) + '</div>';
  h += '</div>';
  h += '<div class="feed-score">';
  h += '<div class="feed-score__num">' + (item.score != null ? item.score : "—") + '</div>';
  if (_diffStr) h += '<div class="feed-topar ' + _diffCls + '">' + _diffStr + '</div>';
  h += '</div>';
  h += '</div>';

  // Course + meta (tap to round detail).
  h += '<div class="feed-card__course"' + (roundClick ? ' role="button" tabindex="0" onclick="' + roundClick + '" onkeydown="if(event.key===\'Enter\'){' + roundClick + '}"' : '') + '>';
  h += '<div class="feed-card__coursename">' + escHtml(item.course) + '</div>';
  if (meta) h += '<div class="feed-card__meta">' + escHtml(meta) + '</div>';
  h += '</div>';

  // H2H chip (rank 1) — when another member played the same course/day, surface
  // the rivalry right where it happened, one tap into the head-to-head tape.
  var _opp = _feedH2HOpponent(item);
  if (_opp && item.playerId && _opp.playerId) {
    var _oppName = _opp.playerName || (_opp.player ? (_opp.player.name || _opp.player.username) : "a Parbaugh");
    h += '<button type="button" class="feed-h2h-chip" onclick="event.stopPropagation();showRivalryDetail(\'' + String(item.playerId).replace(/'/g, "\\'") + '\',\'' + String(_opp.playerId).replace(/'/g, "\\'") + '\')" aria-label="' + escHtml("Head to head vs " + _oppName) + '"><svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 3v10M11 3v10M3 6h4M9 10h4"/></svg>H2H vs ' + escHtml(_oppName) + '</button>';
  }

  var dots = _feedHoleDots(item.holeScores, item.holePars, item.holesPlayed, item.holesMode);
  if (dots) h += dots;

  var chips = _feedStatChips(item);
  if (chips) h += chips;

  if (item.quip) h += '<div class="feed-card__quip">' + escHtml(item.quip) + '</div>';

  // Action row — Scorecard · Kudos · Comment · Share (functional; counts when > 0).
  var likes = item.likes || [];
  var comments = item.comments || [];
  var iLiked = currentUser && likes.indexOf(currentUser.uid) !== -1;
  var likeLabel = "Kudos" + (likes.length ? " " + likes.length : "");
  var commentLabel = "Reply" + (comments.length ? " " + comments.length : "");
  var teeTaps = (item.reactions && item.reactions.teeTap) || [];
  var iTapped = currentUser && teeTaps.indexOf(currentUser.uid) !== -1;
  var tapLabel = "Tee Tap" + (teeTaps.length ? " " + teeTaps.length : "");

  h += '<div class="feed-actions" data-feed-action-row="1" data-round-id="' + item.roundId + '">';
  h += '<button class="feed-action" type="button" data-action="scorecard" aria-label="View scorecard" onclick="event.stopPropagation();' + roundClick + '"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8h4M5 10h5"/></svg><span>Scorecard</span></button>';
  h += '<button class="feed-action' + (iLiked ? ' feed-action--on' : '') + '" type="button" data-action="kudos" title="Kudos — nice round (a like)" data-i-liked="' + (iLiked ? '1' : '0') + '" data-likes-count="' + likes.length + '" aria-pressed="' + (iLiked ? 'true' : 'false') + '" aria-label="Kudos, ' + likes.length + ' reactions" onclick="event.stopPropagation();feedToggleLike(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="' + (iLiked ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg><span>' + likeLabel + '</span></button>';
  // v8.25.32 — Tee Tap removed: ONE appreciation reaction (Kudos) only. Two was
  // redundant + confusing, and no peer app does it (Founder call 2026-06-12).
  h += '<button class="feed-action" type="button" data-action="comment" aria-label="Reply" onclick="event.stopPropagation();feedShowCommentInput(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg><span>' + commentLabel + '</span></button>';
  h += '<button class="feed-action" type="button" data-action="share" aria-label="Share to DM" onclick="event.stopPropagation();shareScorecard(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg><span>Share</span></button>';
  h += '</div>';

  // Comment thread (shared helper, single source of truth across /feed + HQ Home).
  h += _renderCommentThread(item.roundId, comments, item.commentLikes);

  // Comment input (hidden by default).
  h += '<div class="feed-commentinput" id="feedComment-' + item.roundId + '" style="display:none">';
  h += '<input type="text" class="ff-input" id="feedCommentText-' + item.roundId + '" placeholder="Add a reply…" onkeydown="if(event.key===\'Enter\')feedSubmitComment(\'' + item.roundId + '\')">';
  h += '<button class="feed-commentinput__post" type="button" onclick="event.stopPropagation();feedSubmitComment(\'' + item.roundId + '\')">Post</button>';
  h += '</div>';

  h += '</article>';
  return h;
}

// ── COMPACT ROUND ROW (density tier) ──────────────────────────────────────
// After the lead hero + the single most-recent full card, every further round
// collapses to a quiet one-line row: avatar · name · course · score · time. The
// whole row taps into the round (where the full scorecard + action row live),
// so no engagement chrome is duplicated here — keeping the smoke-locked
// four-button action row to the FULL card only (no data-feed-action-row here).
// Built from the existing .feed-card header classes so it needs no shared CSS;
// the inline padding just tightens the row for genuine density contrast.
function _renderRoundCompact(item) {
  var _par = roundParTotal(item);
  var _diff = (item.score && _par) ? item.score - _par : null;
  var _diffStr = _diff === null ? "" : (_diff === 0 ? "E" : (_diff > 0 ? "+" + _diff : String(_diff)));
  var _diffCls = (_diff !== null && _diff <= 0) ? "feed-topar--under" : "feed-topar--over";
  var roundClick = item.roundId ? "Router.go('rounds',{roundId:'" + item.roundId + "'})" : "";
  var name = item.playerName || (item.player ? (item.player.name || item.player.username) : "A Parbaugh");
  var aria = name + " posted " + (item.score != null ? item.score : "a round") + " at " + (item.course || "a course") + ", " + feedTimeAgo(item.ts);

  var h = '<article class="feed-card feed-card--round feed-card--compact" role="article" aria-label="' + escHtml(aria) + '"' +
    ' style="padding:11px 16px;cursor:pointer"' +
    (roundClick ? ' tabindex="0" onclick="' + roundClick + '" onkeydown="if(event.key===\'Enter\'){' + roundClick + '}"' : '') + '>';
  h += '<div class="feed-card__head" style="align-items:center">';
  h += renderAvatar(item.player, 30, false);
  h += '<div class="feed-card__who">';
  h += '<div class="feed-card__name" style="font-size:15px">' + escHtml(name) + (item.isScramble ? ' <span class="feed-card__tag">Scramble</span>' : '') + '</div>';
  h += '<div class="feed-card__time"><span style="font-family:var(--font-display);font-style:italic">' + escHtml(item.course || "") + '</span>' + (item.course ? ' · ' : '') + escHtml(feedTimeAgo(item.ts)) + '</div>';
  h += '</div>';
  h += '<div class="feed-score" style="flex-direction:row;align-items:baseline;gap:7px">';
  h += '<div class="feed-score__num" style="font-size:24px">' + (item.score != null ? item.score : "—") + '</div>';
  if (_diffStr) h += '<div class="feed-topar ' + _diffCls + '" style="margin-top:0">' + _diffStr + '</div>';
  h += '</div>';
  h += '</div>';
  h += '</article>';
  return h;
}

// ── CHAT CARD (Chip-style post — member message or The Caddy) ──
// v8.25.x — The Caddy renders through the SINGLE canonical avatar + username
// helpers (renderAvatar/renderUsername detect the bot identity and draw the
// branded flag mark + BOT badge). The old hardcoded ⛳ disc + plain name are
// gone, so the bot looks identical here and everywhere else (one treatment,
// not two). Member chats render their real avatar + name as before.
function _renderChatCard(item) {
  var isSystem = item.system || (typeof isCaddyPlayer === "function" && isCaddyPlayer(item.player));
  var who = isSystem ? "The Caddies" : (item.author || "Member");
  var aria = (isSystem ? "The Caddies (automated)" : who) + " posted, " + feedTimeAgo(item.ts);
  var h = '<article class="feed-card feed-card--chat' + (isSystem ? ' feed-card--caddy' : '') + '" role="article" aria-label="' + escHtml(aria) + '">';
  h += '<div class="feed-card__head">';
  if (isSystem) {
    var caddy = (typeof PB_CADDY !== "undefined") ? PB_CADDY : { id: "the-caddy", name: "The Caddies", bot: true };
    h += renderAvatar(caddy, 40, false);
    h += '<div class="feed-card__who">';
    h += '<div class="feed-card__name">' + renderUsername(caddy, "font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;") + '</div>';
  } else {
    h += renderAvatar(item.player, 40, true);
    h += '<div class="feed-card__who">';
    if (item.player) {
      h += '<div class="feed-card__name">' + renderUsername(item.player, "font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;color:var(--cb-ink);", true) + '</div>';
    } else {
      h += '<div class="feed-card__name" style="font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;color:var(--cb-ink)">' + escHtml(who) + '</div>';
    }
  }
  h += '<div class="feed-card__time">' + escHtml(feedTimeAgo(item.ts)) + '</div>';
  h += '</div>';
  h += '</div>';
  h += '<div class="feed-card__body">' + escHtml(item.text) + '</div>';
  h += '</article>';
  return h;
}

// ── RANGE CARD (Card D — auto-posted activity density) ──
function _renderRangeCard(item) {
  var rangeDest = item.sessionId ? "Router.go('range-detail',{sessionId:'" + item.sessionId + "'})" : "Router.go('range')";
  var subParts = [];
  if (item.duration) subParts.push(item.duration + " min");
  if (item.focus) subParts.push(item.focus);
  if (item.drills && item.drills.length) subParts.push(item.drills.length + " drill" + (item.drills.length > 1 ? "s" : ""));
  var who = item.playerName || (item.player ? (item.player.name || item.player.username) : "A Parbaugh");
  var aria = who + " hit the range, " + feedTimeAgo(item.ts);
  var h = '<article class="feed-card feed-card--range" role="article" aria-label="' + escHtml(aria) + '" tabindex="0" onclick="' + rangeDest + '" onkeydown="if(event.key===\'Enter\'){' + rangeDest + '}">';
  h += '<div class="feed-card__eyebrow">RANGE</div>';
  h += '<div class="feed-range__row">';
  h += renderAvatar(item.player, 32, false);
  h += '<div class="feed-range__body">';
  h += '<div class="feed-range__line"><span class="feed-range__who">' + escHtml(who) + '</span> hit the range</div>';
  h += '<div class="feed-card__meta">' + escHtml(subParts.join(" · ") || "Range session") + '</div>';
  h += '</div>';
  h += '<div class="feed-card__time">' + escHtml(feedTimeAgo(item.ts)) + '</div>';
  h += '</div>';
  h += '</article>';
  return h;
}

// ─────────────────────────────────────────────────────────────────────────
// CHIP COMPOSER (3l.1) — modal-overlay editorial composer for the Feed.
// Shell per CLUBHOUSE_SPEC-HQ-3l: chalk paper, 4px brass top-rule, Fraunces
// body w/ brass caret + bottom-line-only (writing on paper, not in a form),
// mono char counter, League/Community scope toggle. Posts a text Chip through
// the real league-chat write path (renders as a chat card in the stream today).
//
// Deferred to follow-on ships (no path on disk yet — not faked here):
//  · Image attach (§3l.SHELL.5) — needs Firebase Storage upload AND a feed
//    image render path; neither exists. Lands with the Storage ship.
//  · @mention autocomplete (§3l.SHELL.7) — chat cards render text-only today
//    (_renderChatCard escHtml's item.text); no mention render. Lands when the
//    feed renders mention tokens.
//  · Community submit — no cross-league write/render exists (the Community feed
//    tab is itself a truthful empty state). The toggle is present and the note
//    explains it; submit stays disabled on Community until cross-league lands.
//  · Cross-session draft — kept in-memory this session (no allow-listed
//    localStorage key for drafts per CLAUDE.md); upgrades to Preferences later.
// ─────────────────────────────────────────────────────────────────────────
var CHIP_LIMIT = 280;
var _chipDraft = "";        // in-memory draft, survives close/reopen this session
var _chipScope = "league";  // 'league' | 'community'
var _chipTrigger = null;    // element to restore focus to on close

function openChipComposer(scope) {
  if (document.getElementById("chipOverlay")) return; // already open
  _chipTrigger = document.activeElement;
  _chipScope = ((scope || _feedScope) === "community") ? "community" : "league";
  var leagueName = window._activeLeagueName || "your league";

  var ov = document.createElement("div");
  ov.className = "chip-overlay";
  ov.id = "chipOverlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Post a Chip");
  ov.onclick = function(e) { if (e.target === ov) closeChipComposer(); };

  var h = '<div class="chip-composer" role="document">';
  h += '<div class="chip-composer__head">';
  h += '<div class="chip-composer__eyebrow" id="chipEyebrow"></div>';
  h += '<button class="chip-composer__close" type="button" aria-label="Close composer" onclick="closeChipComposer()">×</button>';
  h += '</div>';
  h += '<div class="chip-scope" role="group" aria-label="Post scope">';
  h += '<button class="chip-scope__seg" type="button" data-scope="league" onclick="setChipScope(\'league\')">League: ' + escHtml(leagueName) + '</button>';
  h += '<button class="chip-scope__seg" type="button" data-scope="community" onclick="setChipScope(\'community\')">Community</button>';
  h += '</div>';
  h += '<div class="chip-composer__field">';
  h += '<textarea class="chip-composer__ta" id="chipText" rows="3" maxlength="' + (CHIP_LIMIT + 40) + '" placeholder="What’s on your mind?" aria-label="What’s on your mind?" oninput="updateChipComposer()"></textarea>';
  h += '</div>';
  h += '<div class="chip-composer__count" id="chipCount" aria-live="polite"></div>';
  h += '<div class="chip-composer__note" id="chipNote" style="display:none">Community chips arrive with the cross-league feed. Switch to League to post today.</div>';
  h += '<div class="chip-composer__actions">';
  h += '<button class="chip-composer__cancel" type="button" onclick="closeChipComposer()">Cancel</button>';
  h += '<button class="chip-composer__post" id="chipPost" type="button" disabled aria-label="Post chip" onclick="postChip()">Post →</button>';
  h += '</div>';
  h += '</div>';
  ov.innerHTML = h;
  document.body.appendChild(ov);

  var ta = document.getElementById("chipText");
  ta.value = _chipDraft || "";
  requestAnimationFrame(function() { ov.classList.add("open"); });
  setTimeout(function() { ta.focus(); var L = ta.value.length; try { ta.setSelectionRange(L, L); } catch (e) {} }, 30);
  setChipScope(_chipScope);
  updateChipComposer();
  document.addEventListener("keydown", _chipKeydown, true);
}

function _chipKeydown(e) {
  if (!document.getElementById("chipOverlay")) return;
  if (e.key === "Escape") { e.preventDefault(); closeChipComposer(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); postChip(); return; }
  if (e.key === "Tab") _chipTrapTab(e);
}

function _chipTrapTab(e) {
  var ov = document.getElementById("chipOverlay");
  if (!ov) return;
  var f = ov.querySelectorAll("button:not([disabled]), textarea");
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function setChipScope(scope) {
  _chipScope = (scope === "community") ? "community" : "league";
  var ov = document.getElementById("chipOverlay");
  if (!ov) return;
  var leagueName = window._activeLeagueName || "your league";
  ov.querySelectorAll(".chip-scope__seg").forEach(function(b) {
    b.setAttribute("aria-pressed", b.getAttribute("data-scope") === _chipScope ? "true" : "false");
  });
  var eb = document.getElementById("chipEyebrow");
  if (eb) eb.textContent = "POST A CHIP · " + (_chipScope === "community" ? "COMMUNITY" : leagueName);
  var note = document.getElementById("chipNote");
  if (note) note.style.display = (_chipScope === "community") ? "" : "none";
  updateChipComposer();
}

function updateChipComposer() {
  var ta = document.getElementById("chipText");
  var count = document.getElementById("chipCount");
  var post = document.getElementById("chipPost");
  if (!ta || !count || !post) return;
  _chipDraft = ta.value;
  var len = ta.value.trim().length;
  var remaining = CHIP_LIMIT - ta.value.length;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 174) + "px";
  count.textContent = remaining + "/" + CHIP_LIMIT;
  count.classList.toggle("near", remaining <= 20 && remaining >= 0);
  count.classList.toggle("over", remaining < 0);
  ta.classList.toggle("over", remaining < 0);
  post.disabled = !(len > 0 && remaining >= 0 && _chipScope === "league");
}

function postChip() {
  var ta = document.getElementById("chipText");
  if (!ta || _chipScope !== "league") return;
  var text = ta.value.trim();
  if (!text || text.length > CHIP_LIMIT || !db || !currentUser) return;
  var name = currentProfile ? PB.getDisplayName(currentProfile) : "Anon";
  if (window._feedItems) {
    window._feedItems.unshift({ type: "chat", player: currentProfile, playerId: currentUser.uid, author: name, text: text, ts: Date.now(), system: false });
    if (_feedScope !== "community") _renderFeedItems();
  }
  db.collection("chat").add(leagueDoc("chat", {
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: name,
    createdAt: fsTimestamp()
  })).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn’t post your chip.")); });
  _chipDraft = "";
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  closeChipComposer();
  Router.toast("Posted to the feed.");
}

function closeChipComposer() {
  var ov = document.getElementById("chipOverlay");
  if (!ov) return;
  document.removeEventListener("keydown", _chipKeydown, true);
  ov.classList.remove("open");
  setTimeout(function() { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
  if (_chipTrigger && _chipTrigger.focus) { try { _chipTrigger.focus(); } catch (e) {} }
}

// ─────────────────────────────────────────────────────────────────────────
// Round-post engagement writers (feedToggleLike / feedSubmitComment /
// feedShowCommentInput) + surgical DOM patch helpers + the shared comment
// render helpers (_renderCommentThread / _renderCommentRow) live in
// src/pages/feed-comments.js (extracted per W1.A5). They target /rounds and are
// reused by both /feed round cards and the HQ Home League Pulse cards, so the
// data attributes on .feed-actions ([data-feed-action-row], [data-action],
// data-i-liked, data-likes-count) must stay in sync with that module.
// ─────────────────────────────────────────────────────────────────────────
