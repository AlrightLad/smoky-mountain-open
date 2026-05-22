// Home — Activity feed + HQ band-specific lead/features columns (A + B).
// Extracted per W1.A5 (AMD-027).

function _renderActivityFeedCompact(ctx, limit) {
  var items = _hqBuildActivityItems(limit || 12);
  // v8.16.0 Item 2 — wrapped in .hq-activity-feed-shell + .hq-activity-feed
  // for bounded scrollbox + bottom fade gradient. Header lives outside the
  // scroll area so it stays visible while the bucket list scrolls.
  var h = '<div>';
  // Header (outside scrollbox)
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">';
  h += '<div>';
  // v8.21.0 (Ship 5+6 Phase 3 / D2): League name prefixes the ACTIVITY eyebrow
  // as secondary wayfinding anchor. Member sees "THE PARBAUGHS · ACTIVITY"
  // reinforcing league context. Fallback chain matches the masthead chip.
  var _eyebrowLeague = (typeof window !== "undefined" && window._activeLeagueName) || "Parbaughs";
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:4px">' + escHtml(String(_eyebrowLeague).toUpperCase()) + ' · ACTIVITY</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-section-header-size);font-weight:700;color:var(--cb-ink);line-height:1.2">League pulse</div>';
  h += '</div>';
  h += '<div onclick="Router.go(\'feed\')" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);cursor:pointer;text-transform:uppercase">Full feed →</div>';
  h += '</div>';

  if (!items.length) {
    h += '<div style="padding:var(--sp-6) 0;text-align:center;font-family:var(--font-mono);font-size:11px;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">QUIET WEEK</div>';
    h += '</div>';
    return h;
  }

  // Open scrollbox shell + scroll surface around the bucket list below.
  h += '<div class="hq-activity-feed-shell">';
  h += '<div class="hq-activity-feed">';

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
      // Ship 5 Gate 2 (v8.15.1) — .hq-feed-card with chip + conditional
      // photo slot + markup-only actions row per Q-AUDIT-D Option A. Hover
      // bleed CSS in components.css. dest still wires onclick on the card root.
      var clickAttr = it.dest ? ' onclick="' + it.dest + '"' : '';
      b += '<article class="hq-feed-card"' + clickAttr + '>';
      // Top row: avatar + body + timeAgo
      b += '<div class="hq-feed-card__top">';
      // v8.19.0 (Ship 5+3 / B.26) — replace single-letter placeholder with
      // renderAvatar() to surface profile photos. Synthesizes a player from
      // actorName when no UID lookup exists (state.activity events).
      var actorPlayer = (it.actorUid && typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(it.actorUid) : null;
      b += renderAvatar(actorPlayer || { name: it.actorName || "?", id: "" }, 32, !!actorPlayer);
      b += '<div class="hq-feed-card__body">';
      // Chip (entityType) — only when defined
      if (it.entityType) {
        b += '<div class="hq-feed-card__chip">' + escHtml(it.entityType) + '</div>';
      }
      b += '<div class="hq-feed-card__text">' + escHtml(it.text) + '</div>';
      if (it.sub) b += '<div class="hq-feed-card__sub">' + escHtml(it.sub) + '</div>';
      b += '</div>';
      b += '<div class="hq-feed-card__time">' + escHtml(it.timeAgo) + '</div>';
      b += '</div>';
      // Photo slot — conditional on it.photoUrl (B.11 backlog wires data layer).
      if (it.photoUrl) {
        b += '<div class="hq-feed-card__photo"><img src="' + escHtml(it.photoUrl) + '" alt=""></div>';
      }
      // v8.20.0 (Ship 5+5) — Action row restored on round-type cards per
      // Option B (2 actions: Kudos | Comment). Wired to /feed engagement
      // writers (feedToggleLike, feedShowCommentInput) — shared model. Card-
      // level tap still navigates to round detail (clickAttr above), so
      // Scorecard equivalent is the card body itself. Per V12.8: state.activity
      // items now also have dest plumbing, so their cards tap-navigate too —
      // they don't show an action row (no engagement target).
      var isRoundType = (it.entityType === "ROUND" || it.entityType === "SCRAMBLE") && it.roundId;
      if (isRoundType) {
        var rLikes = it.likes || [];
        var rComments = it.comments || [];
        var iLikedR = (typeof currentUser !== "undefined" && currentUser) && rLikes.indexOf(currentUser.uid) !== -1;
        var rLikeColor = iLikedR ? "var(--cb-brass)" : "var(--cb-mute)";
        var rLikeLabel = "Kudos" + (rLikes.length ? " " + rLikes.length : "");
        var rCommentLabel = "Comment" + (rComments.length ? " " + rComments.length : "");
        // S1.2: data-feed-action-row="1" added so cross-surface DOM patches
        // (feed.js _patchKudosButton, _appendCommentRowToDOM, etc.) target
        // both /feed and League Pulse via a single selector.
        b += '<div class="hq-feed-card__actions" data-feed-action-row="1" data-round-id="' + it.roundId + '">';
        // S1.2: kudos button carries data-i-liked + data-likes-count for
        // revert state. Uses `data-likes-count` (not `data-count`) to avoid
        // collision with src/core/animate.js initCountAnimations.
        b += '<button data-action="kudos" data-i-liked="' + (iLikedR ? '1' : '0') + '" data-likes-count="' + rLikes.length + '" type="button" class="hq-feed-card__action" onclick="event.stopPropagation();feedToggleLike(\'' + it.roundId + '\')" style="color:' + rLikeColor + '"><svg viewBox="0 0 16 16" width="11" height="11" fill="' + (iLikedR ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.3"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg><span>' + rLikeLabel + '</span></button>';
        // v8.21.0 (Ship 5+6 Phase 5 / H1): Comment button opens inline input
        // on this card via feedShowCommentInput. Members no longer leave the
        // page to comment.
        b += '<button data-action="comment" type="button" class="hq-feed-card__action" onclick="event.stopPropagation();feedShowCommentInput(\'' + it.roundId + '\')"><svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg><span>' + rCommentLabel + '</span></button>';
        b += '</div>';

        // S1.2: comment thread via shared helper (feed.js _renderCommentThread).
        // Single source of truth across /feed and HQ Home League Pulse —
        // prevents data-attribute drift between surfaces that the surgical
        // DOM patches depend on.
        b += _renderCommentThread(it.roundId, rComments, it.commentLikes);
        b += '<div id="feedComment-' + it.roundId + '" style="display:none;padding:6px 14px 8px;gap:6px">';
        b += '<input type="text" class="ff-input" style="flex:1;padding:6px 10px;font-size:11px" id="feedCommentText-' + it.roundId + '" placeholder="Add a comment..." onkeydown="if(event.key===\'Enter\')feedSubmitComment(\'' + it.roundId + '\')">';
        b += '<button class="btn-sm green" style="font-size:10px;padding:6px 10px" onclick="event.stopPropagation();feedSubmitComment(\'' + it.roundId + '\')">Post</button>';
        b += '</div>';
      }
      b += '</article>';
    });
    return b;
  }

  h += renderBucket("TODAY", buckets.today, true);
  h += renderBucket("YESTERDAY", buckets.yesterday, false);
  h += renderBucket("THIS WEEK", buckets.week, false);
  h += renderBucket("EARLIER", buckets.earlier, false);

  h += '</div>';   // close .hq-activity-feed (scroll surface)
  h += '</div>';   // close .hq-activity-feed-shell (gradient host)
  h += '</div>';   // close outer wrapper
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
      // v8.21.0 (Ship 5+6 Phase 5 / B.29): always-emit hole count + format
      // sub-line. Pre-fix logic dropped the format when "stroke" and dropped
      // the hole count when 18 — leading to silent (no sub-line) cards for
      // 18-hole stroke rounds. Now every round card shows "18 holes · Stroke"
      // or "9 holes · Stableford (1.5x)" consistently.
      var fmtRaw = r.format || "stroke";
      var fmt = fmtRaw.charAt(0).toUpperCase() + fmtRaw.slice(1);
      var holesNum = (r.holesPlayed && r.holesPlayed < 18) ? r.holesPlayed : 18;
      var sub = holesNum + " holes · " + fmt;
      // Ship 5 Gate 2 (v8.15.1) — entityType chip per Q-AUDIT-D Option A.
      // Scramble rounds chip as "SCRAMBLE"; otherwise plain "ROUND".
      var entityType = (fmtRaw === "scramble" || fmtRaw === "scramble4") ? "SCRAMBLE" : "ROUND";
      // v8.20.0 (Ship 5+5) — roundId / likes / comments surfaced for League
      // Pulse 2-action row (Kudos | Comment) on round-type cards. Reuses the
      // same /feed engagement model + writers (feedToggleLike, feedSubmitComment).
      // v8.21.0 (Ship 5+6 Phase 5 / H1+H3): commentLikes added so League Pulse
      // comment thread can render heart counts per comment.
      items.push({ ts: ts, actorName: actor, actorUid: r.player || "", text: text, sub: sub, timeAgo: feedTimeAgo(ts), dest: r.id ? "Router.go('rounds',{roundId:'" + r.id + "'})" : "", entityType: entityType, roundId: r.id || "", likes: r.likes || [], comments: r.comments || [], commentLikes: r.commentLikes || {} });
    });
  }
  // state.activity (in-memory events)
  if (typeof state !== "undefined" && state && state.activity) {
    state.activity.slice(-30).forEach(function(a) {
      if (!a || !a.ts) return;
      var actor = a.name || a.playerName || "Member";
      var text = actor;
      // Ship 5 Gate 2 (v8.15.1) — entityType chip derivation per Q-AUDIT-D.
      var entityType = "";
      // v8.20.0 (Ship 5+5 / V12.8) — dest plumbing so non-round activity
      // items also tap-navigate. Previously orphan cards (no onclick).
      var dest = "";
      if (a.type === "post") { text += " posted: " + (a.text || "").slice(0, 60); entityType = "POST"; dest = "Router.go('feed')"; }
      else if (a.type === "trip_created") { text += " started a trip"; entityType = "TRIP"; dest = "Router.go('trips')"; }
      else if (a.type === "review") { text += " reviewed " + (a.course || "a course"); entityType = "REVIEW"; dest = "Router.go('courses')"; }
      else if (a.type === "member_joined") { text += " joined the league"; entityType = "JOINED"; dest = "Router.go('members')"; }
      else text += " did something";
      items.push({ ts: a.ts, actorName: actor, actorUid: a.uid || a.playerId || "", text: text, sub: "", timeAgo: feedTimeAgo(a.ts), dest: dest, entityType: entityType });
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
  // W2.S1 pull-forward (2026-05-22 design pass): "The league this week"
  // 4-stat strip with delta vs prior week per CLUBHOUSE_SPEC-HQ-3a-Home.md
  // § 3a.1.5 Section B. Inserted between personal quartet + season ladder.
  h += _renderLeagueThisWeekStrip(ctx);
  h += _renderSeasonLadderTop10(ctx);
  // v8.16.1 Item 1 — idle state shows 6 recent rounds (was 3). Active state
  // stays at 2 per Q-AUDIT-Q1A ruling (live round is the focus when active).
  var recent = (ctx.myRounds || []).slice(0, 6);
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
  h += _renderLeagueThisWeekStrip(ctx);
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
