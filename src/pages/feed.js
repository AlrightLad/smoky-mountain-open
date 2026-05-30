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

  // Composer prompt — Fraunces italic; posts a league chat message today.
  h += '<div class="feed-composer">';
  h += '<input class="feed-composer__input" id="feedChatInput" placeholder="What’s on your mind?" aria-label="Post to the feed" onkeydown="if(event.key===\'Enter\')sendFeedChat()">';
  h += '<button class="feed-composer__send" type="button" aria-label="Post" title="Post" onclick="sendFeedChat()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
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
        var player = msg.authorId ? PB.getPlayer(msg.authorId) : null;
        items.push({
          type: "chat",
          player: player,
          playerId: msg.authorId || "",
          author: msg.system ? "The Caddy" : msg.authorName || msg.user || "Member",
          text: msg.text || "",
          ts: tsMillis(msg.createdAt) || (msg.timestamp || 0),
          system: !!msg.system
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
function _feedStatChips(item) {
  var chips = [];
  if (item.frontScore && item.backScore) {
    chips.push('F9 ' + item.frontScore);
    chips.push('B9 ' + item.backScore);
  }
  if (item.firData && Array.isArray(item.firData)) {
    var firC = 0, firH = 0;
    item.firData.forEach(function(v, i) { var par = item.holePars ? (item.holePars[i] || 4) : 4; if (par !== 3) { firH++; if (v) firC++; } });
    if (firH > 0) chips.push('FIR ' + firC + '/' + firH);
  }
  if (item.girData && Array.isArray(item.girData)) {
    var girC = 0, girH = 0;
    item.girData.forEach(function(v) { girH++; if (v) girC++; });
    if (girH > 0) chips.push('GIR ' + girC + '/' + girH);
  }
  if (item.puttsData && Array.isArray(item.puttsData)) {
    var pTotal = 0;
    item.puttsData.forEach(function(v) { pTotal += (v || 0); });
    if (pTotal > 0) chips.push('PUTTS ' + pTotal);
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
    cta = '<button class="feed-empty__cta" type="button" onclick="var i=document.getElementById(\'feedChatInput\');if(i)i.focus()">+ Post a Chip →</button>';
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
  var lastDay = null;
  items.slice(0, 60).forEach(function(item) {
    var dk = _feedDayKey(item.ts);
    if (dk !== lastDay) { fh += _feedDayEyebrow(item.ts); lastDay = dk; }
    if (item.type === "round") fh += _renderRoundCard(item);
    else if (item.type === "chat") fh += _renderChatCard(item);
    else if (item.type === "range") fh += _renderRangeCard(item);
  });
  el.innerHTML = fh;
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

  h += '<div class="feed-actions" data-feed-action-row="1" data-round-id="' + item.roundId + '">';
  h += '<button class="feed-action" type="button" data-action="scorecard" aria-label="View scorecard" onclick="event.stopPropagation();' + roundClick + '"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8h4M5 10h5"/></svg><span>Scorecard</span></button>';
  h += '<button class="feed-action' + (iLiked ? ' feed-action--on' : '') + '" type="button" data-action="kudos" data-i-liked="' + (iLiked ? '1' : '0') + '" data-likes-count="' + likes.length + '" aria-pressed="' + (iLiked ? 'true' : 'false') + '" aria-label="Kudos, ' + likes.length + ' reactions" onclick="event.stopPropagation();feedToggleLike(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="' + (iLiked ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg><span>' + likeLabel + '</span></button>';
  h += '<button class="feed-action" type="button" data-action="comment" aria-label="Reply" onclick="event.stopPropagation();feedShowCommentInput(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg><span>' + commentLabel + '</span></button>';
  h += '<button class="feed-action" type="button" data-action="share" aria-label="Share to DM" onclick="event.stopPropagation();shareScorecard(\'' + item.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg><span>Share</span></button>';
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

// ── CHAT CARD (Chip-style post — member message or The Caddy) ──
function _renderChatCard(item) {
  var isSystem = item.system;
  var who = isSystem ? "The Caddy" : (item.author || "Member");
  var aria = (isSystem ? "The Caddy" : who) + " posted, " + feedTimeAgo(item.ts);
  var h = '<article class="feed-card feed-card--chat' + (isSystem ? ' feed-card--caddy' : '') + '" role="article" aria-label="' + escHtml(aria) + '">';
  h += '<div class="feed-card__head">';
  if (isSystem) {
    h += '<div class="feed-caddy-av" aria-hidden="true">⛳</div>';
  } else {
    h += renderAvatar(item.player, 40, true);
  }
  h += '<div class="feed-card__who">';
  if (isSystem) {
    h += '<div class="feed-card__name feed-card__name--caddy">The Caddy</div>';
  } else if (item.player) {
    h += '<div class="feed-card__name">' + renderUsername(item.player, "font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;color:var(--cb-ink);", true) + '</div>';
  } else {
    h += '<div class="feed-card__name" style="font-family:var(--font-display);font-style:italic;font-weight:600;font-size:16px;color:var(--cb-ink)">' + escHtml(who) + '</div>';
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

function sendFeedChat() {
  var input = document.getElementById("feedChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
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
  })).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't send your message.")); });
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
