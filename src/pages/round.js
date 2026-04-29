/* ════════════════════════════════════════════════════════════════════════
   /round/:roundId — Universal round route (Ship 4a Gate 1 of 9)
   ════════════════════════════════════════════════════════════════════════
   4-way dispatch per design B1:
     self  + active    → Router.go('playnow') silent replaceState
     self  + completed → <RoundDetail/> placeholder (Ship 7 implements full UX)
     self  + abandoned → F2 abandoned chrome
     other + active    → <SpectatorHUD/> placeholder (Gate 2-9 implement full UX)
     other + completed → <RoundDetail/> placeholder (Ship 7)
     other + abandoned → F2 abandoned chrome
     missing round     → F1 editorial 404

   Lookup strategy (per Gate 0 audit Call 3 — composite index required):
     1. Try /rounds/{id}  — direct doc lookup (completed case)
     2. Fallback: leagueQuery('liverounds').where('roundId','==',id).limit(1)
        Composite index on liverounds(leagueId,roundId) ASC ASC required.

   Render strategy (per Gate 0 audit Caveat 2 — Page Shell throws at mobile):
     HQ bands (A/B/C/D): PB.pageShell.render with content slot function
     Mobile band:        Inline render bypassing shell, mirroring _renderMobileHome pattern

   Ship 4a follow-on gates (out of scope for Gate 1):
     Gate 2 — SpectatorHUD shell + HeroScorePanel extraction
     Gate 3 — PerHoleStrip
     Gate 4 — StatsPanel + CoursePanel
     Gate 5 — RecentShotsFeed
     Gate 6 — Real-time spectator listener + completion handling
     Gate 7 — Connection state escalation (D2) + F3 player-offline
     Gate 8 — Spotlight visual upgrade + mobile band layouts
     Gate 9 — Final consolidated review
   ════════════════════════════════════════════════════════════════════════ */

Router.register("round", function(params) {
  var pageEl = document.querySelector('[data-page="round"]');
  if (!pageEl) return;

  var id = params && params.roundId;
  if (!id) { _renderRoundMissing(pageEl); return; }
  if (typeof db === "undefined" || !db) { _renderRoundMissing(pageEl); return; }

  // Step 1 — Try /rounds/{id} for completed rounds (direct doc lookup)
  db.collection("rounds").doc(id).get().then(function(roundDoc) {
    if (roundDoc.exists) {
      var round = roundDoc.data();
      var role = (typeof currentUser !== "undefined" && currentUser && round.player === currentUser.uid) ? "self" : "other";
      _renderRoundDetailPlaceholder(pageEl, round, role);
      return;
    }
    // Step 2 — Fallback to /liverounds/ via roundId field query.
    // leagueQuery scopes to active league (composite index covers this).
    if (typeof leagueQuery !== "function") { _renderRoundMissing(pageEl); return; }
    leagueQuery("liverounds").where("roundId", "==", id).limit(1).get().then(function(snap) {
      if (snap.empty) { _renderRoundMissing(pageEl); return; }
      var live = snap.docs[0].data();
      var isSelf = (typeof currentUser !== "undefined" && currentUser && live.playerId === currentUser.uid);
      if (isSelf) {
        if (live.status === "active") { Router.go("playnow", {}, true); return; }
        if (live.status === "completed") { _renderRoundDetailPlaceholder(pageEl, live, "self"); return; }
        if (live.status === "abandoned") { _renderAbandonedChrome(pageEl, live); return; }
      } else {
        if (live.status === "active") { _renderSpectatorHUDPlaceholder(pageEl, live); return; }
        if (live.status === "completed") { _renderRoundDetailPlaceholder(pageEl, live, "other"); return; }
        if (live.status === "abandoned") { _renderAbandonedChrome(pageEl, live); return; }
      }
      // Unknown status — treat as missing
      _renderRoundMissing(pageEl);
    }).catch(function(err) {
      if (typeof pbWarn === "function") pbWarn("[round] liverounds query failed:", err && err.message);
      _renderRoundMissing(pageEl);
    });
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[round] rounds.doc lookup failed:", err && err.message);
    _renderRoundMissing(pageEl);
  });
});

// ─── Render-path dispatcher ─────────────────────────────────────────────
// HQ bands route through Page Shell with content slot. Mobile band bypasses
// shell entirely (page-shell.js:161-163 throws at mobile per v8.11.4 design).
// Both paths receive the same content HTML; mobile gets a basic header with
// back button (mirrors _renderMobileHome pattern).
function _renderRoundPage(pageEl, contentHtml, mastheadTitle) {
  var band = (typeof PB !== "undefined" && PB.pageShell && PB.pageShell.currentBand) ? PB.pageShell.currentBand() : "mobile";
  if (band === "mobile") {
    var h = '<div class="sh"><h2>' + escHtml(mastheadTitle || "Round") + '</h2>';
    h += '<button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
    h += contentHtml;
    pageEl.innerHTML = h;
    return;
  }
  // HQ — Page Shell render
  PB.pageShell.render(pageEl, {
    pageKey: 'round',
    bands: ['A', 'B', 'C', 'D'],
    banner: null,
    masthead: function(b) {
      return {
        variant: b === 'A' ? 'bandA' : 'default',
        title: 'Parbaughs',
        date: typeof _formatHQMastheadDate === "function" ? _formatHQMastheadDate() : '',
        weatherSiteId: ''
      };
    },
    scope: null,
    content: function() { return contentHtml; },
    leftRail: null,
    rightRail: null,
    footer: function() { return typeof renderPageFooter === "function" ? renderPageFooter() : ''; },
    contentMaxWidth: function(b) {
      if (b === 'A') return '640px';
      if (b === 'B') return '600px';
      if (b === 'C') return '912px';
      return '1132px';
    }
  });
}

// ─── F1 missing round (editorial 404) ───────────────────────────────────
// Per design F1: charcoal subhead, two brass underline links, no error glyph,
// no redirect. Renders inside Page Shell content slot for HQ; inline for mobile.
function _renderRoundMissing(pageEl) {
  var h = '';
  h += '<div style="padding:60px 24px;text-align:center;max-width:560px;margin:0 auto">';
  h += '<div style="font-family:var(--font-display);font-size:24px;font-weight:600;color:var(--cb-charcoal);margin-bottom:18px;line-height:1.4">';
  h += "This round isn't available.";
  h += '</div>';
  h += '<div style="font-family:var(--font-ui);font-size:15px;color:var(--cb-mute-2);line-height:1.6;margin-bottom:24px">';
  h += "It may have been removed, or the link may be from a private league.";
  h += '</div>';
  h += '<div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap">';
  h += '<a onclick="Router.go(\'feed\')" style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-brass);text-decoration:underline;cursor:pointer">Try the activity feed</a>';
  h += '<a onclick="Router.go(\'rounds\')" style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-brass);text-decoration:underline;cursor:pointer">Your rounds</a>';
  h += '</div>';
  h += '</div>';
  _renderRoundPage(pageEl, h, "Round");
}

// ─── F2 abandoned round chrome ──────────────────────────────────────────
// Per design F2: ABANDONED · X DAYS AGO eyebrow (mute-2), italic player+course
// subhead, mute-2 score (NOT ink), "didn't count toward Mike's history" copy.
// Hero opacity 0.85. No per-hole strip / recent-shots feed (Gate 3-5 territory).
// _formatAge from home.js v8.11.10 caption helpers reused.
function _renderAbandonedChrome(pageEl, round) {
  var lastWriteAt = (typeof round.lastWriteAt === "number") ? round.lastWriteAt : null;
  var ageStr = (lastWriteAt && typeof _formatAge === "function") ? _formatAge(Date.now() - lastWriteAt).toUpperCase() : "RECENTLY";
  var playerName = round.playerName || "Member";
  var course = round.course || "Round";
  var thru = round.thru || 0;
  var totalScore = round.totalScore || 0;

  var h = '';
  h += '<div style="padding:32px 24px;max-width:680px;margin:0 auto;opacity:0.85">';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cb-mute-2);margin-bottom:18px">ABANDONED · ' + escHtml(ageStr) + '</div>';
  h += '<div style="font-family:var(--font-display);font-style:italic;font-size:22px;font-weight:600;color:var(--cb-mute-2);line-height:1.4;margin-bottom:14px">';
  h += escHtml(playerName) + ' · ' + escHtml(course);
  h += '</div>';
  h += '<div style="font-family:var(--font-display);font-size:48px;font-weight:700;color:var(--cb-mute-2);line-height:1;margin-bottom:32px;font-variant-numeric:lining-nums tabular-nums">';
  h += totalScore + (thru > 0 ? ' thru ' + thru : '');
  h += '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-mute-2);margin-bottom:8px">THIS ROUND DIDN\'T FINISH.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-mute-2);line-height:1.5">It doesn\'t count toward ' + escHtml(playerName) + '\'s history.</div>';
  h += '</div>';
  _renderRoundPage(pageEl, h, "Abandoned round");
}

// ─── RoundDetail placeholder (Ship 7 territory) ─────────────────────────
// Minimal read-only display for self-completed and other-completed cases
// until Ship 7 ships full <RoundDetail/> experience. viewerRole reserved
// for Ship 7's edit-affordance dispatch (self can edit; other cannot).
function _renderRoundDetailPlaceholder(pageEl, round, viewerRole) {
  var playerName = round.playerName || "Member";
  var course = round.course || "Course";
  var totalScore = (typeof round.totalScore === "number") ? round.totalScore : (round.score || 0);
  var par = (typeof round.par === "number") ? round.par : null;
  var diff = (par !== null) ? totalScore - par : null;
  var diffStr = diff === null ? '' : (diff === 0 ? ' (E)' : (diff > 0 ? ' (+' + diff + ')' : ' (' + diff + ')'));

  var h = '';
  h += '<div style="padding:32px 24px;max-width:680px;margin:0 auto">';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:18px">FINAL</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:600;color:var(--cb-ink);line-height:1.3;margin-bottom:14px">';
  h += escHtml(playerName) + ' · ' + escHtml(course);
  h += '</div>';
  h += '<div style="font-family:var(--font-display);font-size:48px;font-weight:700;color:var(--cb-ink);line-height:1;margin-bottom:32px;font-variant-numeric:lining-nums tabular-nums">';
  h += totalScore + diffStr;
  h += '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-brass)">ROUND DETAIL · COMING IN A FUTURE SHIP</div>';
  h += '</div>';
  _renderRoundPage(pageEl, h, "Final round");
}

// ─── SpectatorHUD render (Gate 2 of 9 wires real shell from spectator.js) ───
// Gate 2 (v8.13.2) replaced the v8.13.0 minimal placeholder with PB.spectator.
// renderHUDShell which emits the real HUD shell: HeroScorePanel (live-page mode)
// + Gate 3-5 placeholders. round.js stays as the route + dispatch layer; spectator.js
// owns the HUD content. Defensive fallback to inline placeholder if spectator.js
// hasn't loaded yet (vite DEFERRED_PAGES; small theoretical window).
function _renderSpectatorHUDPlaceholder(pageEl, round) {
  var contentHtml;
  if (typeof PB !== "undefined" && PB.spectator && typeof PB.spectator.renderHUDShell === "function") {
    contentHtml = '<div style="padding:32px 24px;max-width:680px;margin:0 auto">' + PB.spectator.renderHUDShell(round) + '</div>';
  } else {
    // Defensive fallback — spectator.js not yet loaded (rare; DEFERRED_PAGES script load order edge case)
    contentHtml = '<div style="padding:60px 24px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--cb-mute-2)">SPECTATOR HUD LOADING...</div>';
  }
  _renderRoundPage(pageEl, contentHtml, "Live round");
}
