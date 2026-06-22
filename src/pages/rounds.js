/* ════════════════════════════════════════════════════════════════════════
   PAGE: ROUNDS
   ════════════════════════════════════════════════════════════════════════
   Ship 5+7 (v8.22.0) — Rounds is the canonical retroactive logging surface.
   Replaces the prior /rounds → /activity redirect. Multi-mode dispatch:

     /rounds                       → renderRoundsList    (handicap + history + CTA)
     /rounds?action=new            → renderRoundNewForm  (entry form, blank)
     /rounds?roundId=X             → renderRoundDetail   (existing detail view)
     /rounds?roundId=X&action=edit → renderRoundEditForm (Phase 3 — stub
                                       forwards to detail in Phase 2)

   The activity.js page is now Range-only. Form HTML extracted from
   activity.js:44-71 lives here in `_renderRoundEntryForm(prefill)` so
   Phase 3 edit reuses it with a populated prefill object. Form-input IDs
   (rf-player, rf-course, rf-rating, etc.) preserved so the in-rounds.js
   helpers (renderLogHoleGrid, getLogHoleData, submitRound,
   showRoundCourseSearch, quickAddCourseForRound) keep working without
   relocations.
   ════════════════════════════════════════════════════════════════════════ */
Router.register("rounds", function(params) {
  if (params && params.roundId) {
    if (params.action === "edit") return renderRoundEditForm(params.roundId);
    return renderRoundDetail(params.roundId);
  }
  if (params && params.action === "new") return renderRoundNewForm();
  return renderRoundsList(params);
});

// Low-chrome per-row share affordance. Demotes the old full-size outlined
// "Share" button (which gave every history row the same visual weight as the
// score) to an icon-only control so the list reads as a clean ledger and the
// score stays the hero. 44px tap target preserved (inline padding + min
// dimensions) per the touch-target rule; brass-on-hover keeps it reachable
// and obviously interactive. onclick/handler unchanged so the share flow and
// any smoke assertions on the affordance keep working.
function _shareIconBtn(id) {
  return '<button class="rc-share-btn" aria-label="Share round" title="Share" onclick="event.stopPropagation();showRoundShareCard(\'' + id + '\')" style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;background:none;border:none;color:var(--cb-mute,var(--muted));cursor:pointer;flex-shrink:0;border-radius:8px;transition:color var(--duration-fast,.16s) var(--ease-default,ease),background var(--duration-fast,.16s) var(--ease-default,ease)" onmouseover="this.style.color=\'var(--gold,var(--cb-brass))\';this.style.background=\'var(--bg3)\'" onmouseout="this.style.color=\'var(--cb-mute,var(--muted))\';this.style.background=\'none\'">' +
    '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>' +
    '</button>';
}

// List view — handicap header + scramble-grouped history + "Log a round"
// CTA. Ports the renderActivityRounds() history-rendering pattern from
// the legacy Activity Rounds tab so members lose nothing in the move.
function renderRoundsList(params) {
  var allRounds = PB.getRounds();
  var myId = currentUser ? currentUser.uid : null;
  // Alias-resolved self ids. v8.25.6 — replaces a hardcoded `|| r.player ===
  // "zach"` that leaked the Founder's rounds into EVERY member's handicap +
  // round history (every non-Zach member silently inherited his rounds).
  var selfIds = myId ? PB.getAllPlayerIds(myId) : ((currentProfile && currentProfile.claimedFrom) ? [currentProfile.claimedFrom] : []);

  // Scoped view — one player's FULL round history, reached via "View all
  // rounds →" on a profile (Founder: "I can't view all rounds from my player
  // account if I wanted"). Otherwise the league-wide history.
  var scopePid = (params && params.player) ? params.player : null;
  var scopeIds = scopePid ? PB.getAllPlayerIds(scopePid) : null;
  var rounds = scopePid ? allRounds.filter(function(r) { return scopeIds.indexOf(r.player) !== -1; }) : allRounds;

  // Focal rounds = whose handicap + PR the header reflects (the scoped player,
  // else me). myRounds keeps its downstream meaning (PR star, handicap box).
  var focalIds = scopePid ? scopeIds : selfIds;
  var myRounds = allRounds.filter(function(r) { return focalIds.indexOf(r.player) !== -1; });
  var hcap = PB.calcHandicap(myRounds);

  var scopePlayer = scopePid ? PB.getPlayer(scopePid) : null;
  var scopeName = scopePlayer ? (scopePlayer.name || scopePlayer.username || "Player") : null;
  var isSelfScope = scopePid && selfIds.indexOf(scopePid) !== -1;

  // v8.25.75 (ROUNDS lift) — editorial masthead replacing the legacy .sh/<h2>
  // header so the list hero reads in the same voice as the round-detail
  // masthead (mono eyebrow + Fraunces headline), matching Courses/Members/
  // Records/Scramble. The "+ Log a round" CTA is promoted into the masthead;
  // the scoped-player view leads with a back affordance + the player's name.
  var h = '<div class="roster-masthead">';
  if (scopePid) {
    h += '<button class="back" onclick="Router.back(\'rounds\')" style="margin-bottom:12px">← Back</button>';
    h += '<div class="roster-eyebrow">' + (isSelfScope ? 'YOUR SCORECARD' : 'PLAYER SCORECARD') + '</div>';
    h += '<h1 class="roster-headline">' + escHtml(isSelfScope ? 'My rounds.' : (scopeName + '’s rounds.')) + '</h1>';
  } else {
    h += '<div class="roster-eyebrow">THE SCORECARD</div>';
    h += '<h1 class="roster-headline">Rounds.</h1>';
    h += '<div style="margin-top:14px"><button class="btn-sm green" onclick="Router.go(\'rounds\',{action:\'new\'})">+ Log a round</button></div>';
  }
  h += '</div>';

  // Handicap (mirrors the legacy activity.js:38-42 treatment so the
  // member-visible header is unchanged across the surface migration).
  // v8.22+ (design-pass 2026-05-22): added secondary metadata line
  // beneath the headline numeral — total rounds + last-round date.
  // Stripe-pattern: every headline needs a comparative annotation.
  if (hcap !== null) {
    // MED-1 (design-pass 2026-06-12): the hero numeral and the league round-
    // card scores share the same display-serif brass treatment, so "20.9" (an
    // index) and "84" (a score) read as the same kind of number. An eyebrow
    // tag above the numeral anchors THIS one as a handicap index — the round
    // cards below carry no eyebrow, so the surface is now self-disambiguating.
    // --cb-eyebrow is the WCAG-AA on-light eyebrow token (deep brass on the
    // chalk hero ground); --font-mono matches the existing sub-line treatment.
    h += '<div class="hcap-box"><div style="font-family:var(--font-mono);font-size:9.5px;font-weight:700;letter-spacing:2px;color:var(--cb-eyebrow);text-transform:uppercase;margin-bottom:6px">Handicap Index</div><div class="hcap-val" data-count="' + (+hcap).toFixed(1) + '" data-count-decimals="1">0.0</div><div class="hcap-label">Your playing index</div>';
    // Sub-line: rounds count + last-round date
    var lastRound = myRounds.slice().sort(function(a,b){return (b.timestamp||0)-(a.timestamp||0);})[0];
    var subBits = [];
    var staleDays = null;
    subBits.push(myRounds.length + ' round' + (myRounds.length === 1 ? '' : 's'));
    if (lastRound && lastRound.date) {
      var dt = new Date(lastRound.date + "T00:00:00");
      var days = Math.floor((Date.now() - dt.getTime()) / 86400000);
      staleDays = days;
      if (days === 0) subBits.push('played today');
      else if (days === 1) subBits.push('played yesterday');
      else if (days < 7) subBits.push('played ' + days + ' days ago');
      else if (days < 30) subBits.push('last round ' + Math.floor(days / 7) + ' week' + (days < 14 ? '' : 's') + ' ago');
      else subBits.push('last round ' + Math.floor(days / 30) + ' month' + (days < 60 ? '' : 's') + ' ago');
    }
    h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-top:8px">' + subBits.join(' · ') + '</div>';
    // MED-4 (design-pass 2026-06-12): the "last round N weeks ago" sub-line
    // dead-ended with no next step. When the viewer's own play has gone stale
    // (14+ days since their last round), offer a gentle, in-context CTA to log
    // one. Self-scope only (isSelfScope) or unscoped self — a "log a round"
    // nudge on another player's history would be nonsensical. Brass link via
    // --cb-ink-link (WCAG-AA on the light chalk ground); 44px tap target.
    if (staleDays !== null && staleDays >= 14 && (!scopePid || isSelfScope)) {
      h += '<button onclick="Router.go(\'rounds\',{action:\'new\'})" style="display:inline-flex;align-items:center;gap:5px;min-height:44px;margin-top:6px;padding:4px 0;background:none;border:none;color:var(--cb-ink-link);font-family:var(--font-ui);font-size:12.5px;font-weight:600;cursor:pointer">Been a while — Log a round<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg></button>';
    }
    h += '</div>';
  } else {
    // v8.24.67 — empty-state numeral muted + made a progress count (was a
    // full-gold "—", which reads as a broken/missing value per the P9/P10
    // dead-dash rule). The path-forward line carries the meaning.
    var nMore = Math.max(0, 3 - myRounds.length);
    h += '<div class="hcap-box"><div style="font-family:var(--font-mono);font-size:9.5px;font-weight:700;letter-spacing:2px;color:var(--cb-eyebrow);text-transform:uppercase;margin-bottom:6px">Handicap Index</div><div class="hcap-val hcap-val--empty">' + (myRounds.length || 0) + '<span class="hcap-val__of">/3</span></div><div class="hcap-label">Rounds toward your index</div>';
    h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-top:8px">' + (nMore > 0 ? nMore + ' more to unlock your handicap' : 'log one more to refresh') + '</div>';
    // MED-4 (design-pass 2026-06-12): low-activity empty state gets a gentle
    // in-context CTA so the path-forward line is actionable, not just
    // informational. Self-scope only (a nudge on another player's empty
    // history would be nonsensical). --cb-ink-link is WCAG-AA on chalk; 44px.
    if (!scopePid || isSelfScope) {
      h += '<button onclick="Router.go(\'rounds\',{action:\'new\'})" style="display:inline-flex;align-items:center;gap:5px;min-height:44px;margin-top:6px;padding:4px 0;background:none;border:none;color:var(--cb-ink-link);font-family:var(--font-ui);font-size:12.5px;font-weight:600;cursor:pointer">Log a round<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg></button>';
    }
    h += '</div>';
  }

  // History — scramble-grouped, sorted, share buttons. Mirrors the
  // legacy renderActivityRounds() history block (activity.js:74-126).
  if (rounds.length) {
    var sortedRounds = rounds.slice().sort(function(a,b){return (b.timestamp||0)-(a.timestamp||0) || ((b.date||"")>(a.date||"")?1:-1);});
    var scrambleGroups = {};
    var historyItems = [];

    sortedRounds.forEach(function(r) {
      var isScramble = r.format === "scramble" || r.format === "scramble4";
      if (isScramble) {
        var gk = (r.course||"") + "|" + (r.date||"");
        if (!scrambleGroups[gk]) {
          // Carry the par-relevant fields off the representative round so the
          // group can render the same ±N to-par delta the individual branch
          // shows (via roundParTotal: holePars first, else course par).
          scrambleGroups[gk] = { course: r.course, date: r.date, score: r.score, tee: r.tee, format: r.format, holePars: r.holePars, holesPlayed: r.holesPlayed, holesMode: r.holesMode, players: [], ts: r.timestamp || 0, id: r.id };
        }
        scrambleGroups[gk].players.push(r.playerName || "Parbaugh");
        return;
      }
      historyItems.push({ type: "individual", round: r, ts: r.timestamp || 0 });
    });

    Object.values(scrambleGroups).forEach(function(g) {
      var teamObj = PB.getScrambleTeams().find(function(t){ return g.players.some(function(pn){ return t.members.some(function(mid){ var mp = PB.getPlayer(mid); return mp && mp.name === pn; }); }); });
      g.teamName = teamObj ? teamObj.name : "Scramble Team";
      historyItems.push({ type: "scramble", group: g, ts: g.ts });
    });

    historyItems.sort(function(a,b){ return (b.ts||0) - (a.ts||0); });

    // v8.22+ (design-pass 2026-05-22): compute viewer's personal-best score
    // so the PR star can render inline on the matching round. Filters out
    // scrambles + partial-hole rounds since those don't count for
    // handicap/PR per existing handicap.js rules. Uses `myRounds`
    // (already filtered to player === myId / myLocal at line 37) — not the
    // league-wide `rounds` — so PR carries personal semantic.
    var prScore = null;
    var prRoundId = null;
    myRounds.forEach(function(r) {
      if (r.format === "scramble" || r.format === "scramble4") return;
      if (r.holesPlayed && r.holesPlayed < 18) return;
      if (!r.score || r.score <= 0) return;
      if (prScore === null || r.score < prScore) {
        prScore = r.score;
        prRoundId = r.id;
      }
    });

    // Header scope label — disambiguates from the hero handicap card, which
    // counts only the viewer's/scoped player's OWN rounds. The history list
    // below is league-wide (every Parbaugh's rounds) unless the page is
    // scoped to a single player via "View all rounds →". Spelling the scope
    // out stops "8 rounds" (hero) vs "25 total" (history) reading as a
    // contradiction on the same member. Numbers unchanged — labels clarified.
    var histScopeLabel = scopePid
      ? (rounds.length + (rounds.length === 1 ? ' round' : ' rounds'))
      : (rounds.length + ' across the league');
    h += '<div class="section"><div class="sec-head"><span class="sec-title">' + (scopePid ? 'Round history' : 'League rounds') + '</span><span class="sec-link" style="cursor:default">' + histScopeLabel + '</span></div>';
    h += '<div style="max-height:500px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    historyItems.forEach(function(item) {
      if (item.type === "individual") {
        var r = item.round;
        var c = PB.generateRoundCommentary(r);
        var quip = c.roasts.length ? c.roasts[0] : (c.highlights.length ? c.highlights[0] : "");
        var histCourse = PB.getCourseByName(r.course);
        var histTee = r.tee || (histCourse ? histCourse.tee : "") || "";
        var fmtLabel = r.format && r.format !== 'stroke' ? ' · ' + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
        // ±N to par delta — score minus canonical par total (handicap.js;
        // 9-hole rounds sum only the holes actually played).
        var rPar = roundParTotal(r);
        var vsPar = (r.score && r.score > 0) ? (r.score - rPar) : null;
        var vsParStr = "";
        var vsParColor = "var(--cb-mute, var(--muted))";
        if (vsPar !== null) {
          if (vsPar < 0)      { vsParStr = vsPar + ""; vsParColor = "var(--cb-moss, var(--success, #4ea669))"; }
          else if (vsPar === 0) { vsParStr = "E"; }
          else                  { vsParStr = "+" + vsPar; }
        }
        var isPR = (r.id === prRoundId);

        h += '<div class="card"><div class="round-card"><div class="rc-top"><div onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})" style="cursor:pointer;flex:1"><div class="rc-course">' + escHtml(r.course);
        if (isPR) {
          // MED-3 (design-pass 2026-06-12): the badge read "★ PR" — ambiguous
          // (PR = personal record? press release?). Spelled out to "Best" with
          // a star marker so it's unmistakable in golf context. title preserved.
          h += ' <span title="Personal best" style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:1.2px;color:var(--gold, var(--cb-brass));background:rgba(201,169,97,0.16);padding:2px 6px;border-radius:3px;vertical-align:middle">★ BEST</span>';
        }
        h += '</div><div class="rc-date">' + r.date + ' · ' + escHtml(r.playerName||"") + (histTee ? ' · ' + histTee : '') + (r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? ' · Back 9' : ' · Front 9') : '') + fmtLabel + '</div></div>';
        h += '<div style="display:flex;align-items:center;gap:6px"><div style="text-align:right"><div class="rc-score">' + r.score + '</div>';
        if (vsParStr) {
          // MED-2 (design-pass 2026-06-12): delta moved off --font-mono onto the
          // page font family (--font-ui) so it matches the rest of the row;
          // tabular-nums keeps the digits aligned without the monospace face.
          h += '<div style="font-family:var(--font-ui);font-variant-numeric:tabular-nums;font-size:10px;font-weight:600;color:' + vsParColor + ';letter-spacing:0.3px;margin-top:2px;line-height:1">' + vsParStr + ' to par</div>';
        }
        h += '</div>';
        h += _shareIconBtn(r.id);
        h += '</div></div>';
        if (quip) h += '<div class="rc-quip">' + quip + '</div>';
        h += '</div></div>';
      } else {
        var g = item.group;
        // Scramble to-par delta — mirrors the individual branch so a team
        // round reads the same as a solo one (was rendering NO delta).
        // roundParTotal resolves par from the carried holePars, else course.
        var gPar = roundParTotal(g);
        var gVsPar = (g.score && g.score > 0) ? (g.score - gPar) : null;
        var gVsParStr = "";
        var gVsParColor = "var(--cb-mute, var(--muted))";
        if (gVsPar !== null) {
          if (gVsPar < 0)      { gVsParStr = gVsPar + ""; gVsParColor = "var(--cb-moss, var(--success, #4ea669))"; }
          else if (gVsPar === 0) { gVsParStr = "E"; }
          else                  { gVsParStr = "+" + gVsPar; }
        }
        h += '<div class="card"><div class="round-card"><div class="rc-top"><div style="flex:1"><div class="rc-course">' + escHtml(g.teamName) + ' · Scramble</div><div class="rc-date">' + escHtml(g.course) + ' · ' + g.date + (g.tee ? ' · ' + g.tee : '') + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(g.players.join(", ")) + '</div></div>';
        h += '<div style="display:flex;align-items:center;gap:6px"><div style="text-align:right"><div class="rc-score">' + g.score + '</div>';
        if (gVsParStr) {
          // MED-2 (design-pass 2026-06-12): same delta-on-page-font treatment as
          // the individual branch above, so a team round reads identically.
          h += '<div style="font-family:var(--font-ui);font-variant-numeric:tabular-nums;font-size:10px;font-weight:600;color:' + gVsParColor + ';letter-spacing:0.3px;margin-top:2px;line-height:1">' + gVsParStr + ' to par</div>';
        }
        h += '</div>';
        h += _shareIconBtn(g.id);
        h += '</div></div></div></div>';
      }
    });
    h += '</div></div>';
  } else {
    h += '<div class="section"><div class="card">' + renderContextualEmpty('rounds') + '</div></div>';
  }

  h += renderPageFooter();
  document.querySelector('[data-page="rounds"]').innerHTML = h;
  // v8.25.75 — entrance cascade on the history rows (the only .card elements in
  // the list view; hcap-box is its own recipe). The handicap-hero count-up is
  // already driven by the router's post-nav initCountAnimations hook
  // (router-sidebar.js). transform/opacity only, reduced-motion no-ops inside.
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="rounds"] .card'), { gap: 35, duration: 300 });
}

// New-round entry surface. Reuses _renderRoundEntryForm with no prefill.
// Async hole-grid render mirrors the activity.js:25 setTimeout pattern —
// renderLogHoleGrid reads from #rf-course value which only resolves after
// course selection (or via prefill in Phase 3 edit mode).
function renderRoundNewForm() {
  var h = '<div class="sh"><h2>Log a round</h2>';
  h += '<button class="back" onclick="Router.back(\'rounds\')">← Back</button>';
  h += '</div>';
  h += _renderRoundEntryForm(null);
  h += renderPageFooter();
  document.querySelector('[data-page="rounds"]').innerHTML = h;
  setTimeout(renderLogHoleGrid, 50);
}

// v8.22.0 (Ship 5+7 Phase 3) — Edit-existing-round surface. Fetches the
// round doc directly from Firestore (not from local cache — local may
// lag a recent write), renders the form prefilled via the Phase 2
// _renderRoundEntryForm helper, then populates the hole grid via the
// _populateHoleGridFromRound helper after the grid mounts.
//
// Failure modes:
//   - missing roundId param → list view
//   - round doc not found   → list view + toast
//   - permission denied / network error → list view + error toast
//
// Author guard: the round detail's Edit button is already author-gated
// client-side. Firestore rules (firestore.rules /rounds allow update)
// enforce server-side: only author / league leadership / founder /
// engagement-only writers can update. A spectator who guesses the URL
// and submits will be rejected at write time, surfacing as the generic
// "couldn't save" toast — not a silent corruption.
function renderRoundEditForm(roundId) {
  if (!roundId) { Router.go("rounds"); return; }
  if (typeof db === "undefined" || !db) { Router.go("rounds"); return; }

  var pageEl = document.querySelector('[data-page="rounds"]');
  if (pageEl) {
    pageEl.innerHTML = '<div class="sh"><h2>Edit round</h2><button class="back" onclick="Router.back(\'rounds\')">← Back</button></div><div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">Loading…</div>';
  }

  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) {
      Router.toast("Round not found");
      Router.go("rounds");
      return;
    }
    var round = Object.assign({ id: doc.id }, doc.data());
    var h = '<div class="sh"><h2>Edit round</h2>';
    h += '<button class="back" onclick="Router.go(\'rounds\',{roundId:\'' + roundId + '\'})">← Back</button>';
    h += '</div>';
    h += _renderRoundEntryForm(round);
    h += renderPageFooter();
    document.querySelector('[data-page="rounds"]').innerHTML = h;
    // Mount hole grid then populate from the round doc. The grid build
    // depends on #rf-course value which the form helper has already
    // prefilled, so renderLogHoleGrid produces a valid grid on first
    // call. _populateHoleGridFromRound runs after to fill the inputs.
    setTimeout(function() {
      renderLogHoleGrid();
      _populateHoleGridFromRound(round);
    }, 50);
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[rounds] edit fetch failed:", err && err.message);
    Router.toast("Couldn't load round, please try again");
    Router.go("rounds");
  });
}

// Form helper. Accepts optional prefill (a round doc shape) for Phase 3
// edit reuse. With prefill === null, renders a blank form with today's
// date and default Stroke / 18-hole / public-visibility values. With a
// populated prefill, every field gets its prefill value.
//
// Field IDs (rf-player, rf-course, rf-rating, etc.) preserved from the
// activity.js origin so the existing form helpers below — renderLogHoleGrid,
// getLogHoleData, submitRound, showRoundCourseSearch — keep working
// without rename. Migration is markup-only.
function _renderRoundEntryForm(prefill) {
  prefill = prefill || {};
  var myRoundPlayer = currentUser ? PB.getPlayer(currentUser.uid) : null;
  var myRoundLocal = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name || p.id === currentProfile.id); });
  if (!myRoundPlayer && !myRoundLocal && currentUser && typeof fbMemberCache !== "undefined" && fbMemberCache[currentUser.uid]) myRoundLocal = fbMemberCache[currentUser.uid];
  if (!myRoundPlayer && !myRoundLocal && currentProfile && currentProfile.name) myRoundLocal = currentProfile;
  var roundAs = myRoundPlayer || myRoundLocal;
  var isEdit = !!(prefill && prefill.id);

  var h = '<div class="form-section"><div class="form-title">' + (isEdit ? "Edit round" : "Log a round") + '</div>';
  h += '<div class="ff"><label class="ff-label">Player</label>';
  if (!roundAs) {
    h += '<div style="font-size:12px;color:var(--red)">Could not identify your player profile.</div></div>';
  } else {
    h += '<div class="ff-input" style="background:var(--bg4);color:var(--gold);font-weight:600">' + escHtml(roundAs.name) + '</div><input type="hidden" id="rf-player" value="' + (prefill.player || roundAs.id) + '"></div>';
  }

  // Course
  var prefillCourse = prefill.course ? escHtml(prefill.course) : "";
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="rf-course" placeholder="Search courses..." autocomplete="off" oninput="showRoundCourseSearch(this);renderLogHoleGrid()" value="' + prefillCourse + '"><div id="search-round-course" class="search-results"></div></div>';

  // Format + Holes
  function _opt(val, label, selected) { return '<option value="' + val + '"' + (selected ? ' selected' : '') + '>' + label + '</option>'; }
  var fmt = prefill.format || "stroke";
  var hm = prefill.holesMode || "18";
  h += '<div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="rf-format">';
  h += _opt("stroke","Stroke play",fmt==="stroke") + _opt("parbaugh","Parbaugh Stroke Play",fmt==="parbaugh") + _opt("stableford","Modified Stableford",fmt==="stableford");
  h += _opt("scramble","Scramble (2-man)",fmt==="scramble") + _opt("scramble4","Scramble (4-man)",fmt==="scramble4") + _opt("bestball","Best ball",fmt==="bestball");
  h += _opt("alternate","Alternate shot",fmt==="alternate") + _opt("skins","Skins",fmt==="skins") + _opt("match","Match play",fmt==="match");
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Holes</label><select class="ff-input" id="rf-holes" onchange="renderLogHoleGrid()">' + _opt("18","18 holes",hm==="18") + _opt("front9","Front 9",hm==="front9") + _opt("back9","Back 9",hm==="back9") + '</select></div>';
  h += '</div>';

  // Date + Score
  var dateVal = prefill.date || localDateStr();
  var scoreVal = (prefill.score != null) ? prefill.score : "";
  h += '<div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Date</label><input type="date" class="ff-input" id="rf-date" value="' + dateVal + '" style="min-width:0"></div>';
  h += '<div class="ff"><label class="ff-label">Score (auto)</label><input type="number" inputmode="numeric" class="ff-input" id="rf-score" placeholder="auto" value="' + scoreVal + '" style="min-width:0;background:var(--bg4);color:var(--gold)" readonly></div>';
  h += '</div>';

  // Rating + Slope
  var ratingVal = prefill.rating != null ? prefill.rating : "";
  var slopeVal = prefill.slope != null ? prefill.slope : "";
  h += '<div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Rating</label><input type="number" step="0.1" class="ff-input" id="rf-rating" placeholder="auto" value="' + ratingVal + '" style="min-width:0"></div>';
  h += '<div class="ff"><label class="ff-label">Slope</label><input type="number" class="ff-input" id="rf-slope" placeholder="auto" value="' + slopeVal + '" style="min-width:0"></div>';
  h += '</div>';

  // Hole-by-hole grid mounts here async via renderLogHoleGrid() after the
  // course is selected (or after DOM mount when prefill.course is set).
  h += '<div id="rf-hbh-section" style="margin-top:4px"></div>';

  // Photo input — Phase 2 always blank, even on edit. Re-uploading the
  // scorecard photo on edit is out of scope for v8.22.0 (file inputs
  // can't be prefilled via JS; would need a separate "replace photo"
  // affordance — defer to a follow-up).
  h += '<div class="ff"><label class="ff-label">Scorecard photo (optional)</label><input type="file" accept="image/*" id="rf-photo" style="color:var(--muted);font-size:12px"></div>';

  // Submit. Phase 3 (Ship 5+7) wires the edit branch: when prefill.id
  // is present (edit mode), the button calls submitRoundEdit(roundId)
  // which writes via _submitRoundEntry's edit path and skips create-
  // only side effects. Otherwise (create mode), submitRound() handles
  // the full create + side-effect chain.
  if (isEdit) {
    h += '<button class="btn full green" onclick="submitRoundEdit(\'' + prefill.id + '\')">Save changes</button></div>';
  } else {
    h += '<button class="btn full green" onclick="submitRound()">+ Log round</button></div>';
  }
  return h;
}

// Phase 2 (Ship 5+7) — submit-handler scaffold for Phase 3 edit reuse.
// PB.addRound is synchronous (data.js:344-384); syncRound is the Firestore
// write side. We wrap both in Promise.resolve so callers get a Promise-like
// regardless of branch — the edit path returns a native Promise from
// db.update; the create path returns Promise.resolve(localRound) for
// caller-side symmetry. Out of scope for this ship: refactoring PB.addRound
// to be Promise-returning (would touch every existing caller across
// playnow.js / sync.js / syncround.js).
function _submitRoundEntry(formData, options) {
  options = options || {};
  if (options.isEdit && options.roundId) {
    return db.collection("rounds").doc(options.roundId).update(formData);
  }
  var r = PB.addRound(formData);
  syncRound(r);
  return Promise.resolve(r);
}

function shareRoundCard(roundId) {
  var rounds = PB.getRounds();
  var round = rounds.find(function(r) { return r.id === roundId; });
  if (!round) return;
  // Par-relative so the shared text agrees with what the app shows everywhere else
  // (the old rating diff read an unlabeled decimal like +29.6). Phrased for non-golfers.
  var _par = roundParTotal(round);
  var diff = (round.score && _par) ? round.score - _par : null;
  var label = diff === null ? "" : (diff === 0 ? "even par" : (diff > 0 ? "+" + diff + " to par" : diff + " to par"));
  var text = round.playerName + " shot " + round.score + (label ? " (" + label + ")" : "") + " at " + round.course + " on " + round.date + ". The Parbaughs";

  if (navigator.share) {
    navigator.share({ title: "Parbaugh Round", text: text, url: "https://alrightlad.github.io/smoky-mountain-open/" }).catch(function(){});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { Router.toast("Copied to clipboard"); }).catch(function() { Router.toast("Copy failed"); });
  } else {
    Router.toast("Share not supported on this device");
  }
}

function renderRoundDetail(roundId, prefetched) {
  var round = prefetched || PB.getRounds().find(function(r) { return r.id === roundId; });
  if (!round) {
    // Not in the active-league cache. Reached via a share / deep link to a
    // round outside the active league, or before sync populated the cache.
    // Fetch the doc directly and re-render rather than bouncing to the list.
    if (typeof db !== "undefined" && db && roundId) {
      var loadEl = document.querySelector('[data-page="rounds"]');
      if (loadEl) loadEl.innerHTML = '<div class="rd-wrap"><button class="rd-back" onclick="Router.back(\'home\')"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>Back</button><p class="rd-deck">Loading round…</p></div>';
      db.collection("rounds").doc(roundId).get().then(function(doc) {
        if (!doc.exists) { Router.toast("Round not found"); Router.go("rounds"); return; }
        renderRoundDetail(roundId, Object.assign({ id: doc.id }, doc.data()));
      }).catch(function(err) {
        if (typeof pbWarn === "function") pbWarn("[rounds] detail fetch failed:", err && err.message);
        Router.toast("Couldn't load round, please try again");
        Router.go("rounds");
      });
      return;
    }
    Router.go("rounds"); return;
  }

  var commentary = PB.generateRoundCommentary(round);
  var player = PB.getPlayer(round.player);

  var courseObj = PB.getCourseByName(round.course);
  var roundTee = round.tee || (courseObj ? courseObj.tee : "") || "";
  // Community-safe par-relative hero (mirrors the feed card this detail opens from
  // and the rounds-list row above). Score-minus-PAR, not score-minus-rating: the old
  // rating diff produced an unlabeled decimal (e.g. +29.6) that disagreed with the
  // "+26 to par" the same round shows in the list/feed. Under or even reads quiet
  // green; over stays neutral. No alarm-red on a member's own round.
  var _par = roundParTotal(round);
  var diff = (round.score && _par) ? round.score - _par : null;
  var diffStr = diff === null ? "" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
  var holeLabel = round.holesPlayed && round.holesPlayed <= 9 ? (round.holesMode === "back9" ? "Back 9" : "Front 9") : "18 holes";
  var fmtLabel = round.format && round.format !== "stroke" ? round.format.charAt(0).toUpperCase() + round.format.slice(1) : "Stroke";

  // ── Editorial round detail (CLUBHOUSE_SPEC-HQ-3c) ──
  var hs = round.holeScores || [];
  var hp = round.holePars || [];
  var nCols = hs.length;
  var statLen = Math.max(nCols, (round.firData || []).length, (round.girData || []).length, (round.puttsData || []).length);

  // Hole-result tallies (par-relative) + fairways/greens/putts. Canonical
  // pattern (mirrors feed.js / router-sharecard.js): firData/girData truthy,
  // par-3s excluded from fairways-in-regulation, puttsData numeric.
  var nEagle = 0, nBird = 0, nPar = 0, nBog = 0, nDouble = 0;
  var firC = 0, firH = 0, girC = 0, girH = 0, totalPutts = 0, puttH = 0;
  for (var si = 0; si < statLen; si++) {
    var pPar = parseInt(hp[si]) || 4;
    var sVal = parseInt(hs[si]);
    if (!isNaN(sVal) && hp[si] != null) {
      var dd = sVal - parseInt(hp[si]);
      if (dd <= -2) nEagle++; else if (dd === -1) nBird++; else if (dd === 0) nPar++; else if (dd === 1) nBog++; else nDouble++;
    }
    if (round.firData && si < round.firData.length && pPar !== 3) { firH++; if (round.firData[si]) firC++; }
    if (round.girData && si < round.girData.length) { girH++; if (round.girData[si]) girC++; }
    if (round.puttsData && round.puttsData[si]) { totalPutts += parseInt(round.puttsData[si]) || 0; puttH++; }
  }
  var puttAvg = puttH ? (totalPutts / puttH) : null;

  var dateLine = round.date || "";
  var _dt = round.date ? new Date(round.date + "T00:00:00") : null;
  if (_dt && !isNaN(_dt.getTime())) dateLine = _dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  var playerName = player ? (player.name || player.username || round.playerName || "A Parbaugh") : (round.playerName || "A Parbaugh");
  var firstName = playerName.split(" ")[0] || "Score";
  // v8.25.233 — scramble rounds belong to a TEAM, not the logger. If the round
  // carries a team stamp, the masthead + deck speak as the team and list members
  // (Founder: scorecard showed only "jordyn" instead of "The Chuds" + roster).
  var _rdScr = (round.format === "scramble" || round.format === "scramble4");
  var _rdTeamName = _rdScr ? (round.teamName || (round.scrambleTeamId && typeof PB !== "undefined" && PB.getScrambleTeams ? (PB.getScrambleTeams().find(function(t){return t.id===round.scrambleTeamId;})||{}).name : null)) : null;
  var _rdTeamMembers = _rdScr ? (round.teamMembers || (round.scrambleTeamId && PB.getScrambleTeams ? (PB.getScrambleTeams().find(function(t){return t.id===round.scrambleTeamId;})||{}).members : null)) : null;
  // Resolve member names across BOTH the local player store AND the Firestore
  // member cache (team rosters store UIDs that PB.getPlayer often can't resolve
  // client-side — that's why the roster came back empty).
  function _rdMemberName(mid) {
    var mp = PB.getPlayer(mid);
    if (mp && (mp.name || mp.username)) return mp.name || mp.username;
    if (typeof fbMemberCache !== "undefined" && fbMemberCache[mid]) return fbMemberCache[mid].name || fbMemberCache[mid].username || null;
    return null;
  }
  // Prefer the denormalized names stamped on the round (no UID→name resolution
  // needed); fall back to resolving member ids only for legacy rounds.
  var _rdRoster = (round.teamMemberNames && round.teamMemberNames.length)
    ? round.teamMemberNames.join(", ")
    : ((_rdTeamMembers && _rdTeamMembers.length) ? _rdTeamMembers.map(_rdMemberName).filter(Boolean).join(", ") : "");
  if (_rdTeamName) { playerName = _rdTeamName; firstName = _rdTeamName; }

  var h = '<div class="rd-wrap">';
  h += '<button class="rd-back" onclick="Router.back(\'home\')"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>Back</button>';

  // Masthead
  h += '<div class="roster-masthead" style="padding:8px 0 12px">';
  h += '<div class="roster-eyebrow">Round · Final</div>';
  h += '<h1 class="roster-headline">' + escHtml(round.course) + ', <em class="rd-headline__score">' + round.score + '.</em></h1>';
  var deckToPar = diff === null ? "" : (diff === 0 ? "even par" : (diff < 0 ? Math.abs(diff) + " under par" : diff + " over par"));
  if (_rdTeamName) {
    h += '<p class="rd-deck"><strong>' + escHtml(_rdTeamName) + '</strong>' + (deckToPar ? ' went ' + deckToPar : ' turned in a scramble') + ' across ' + holeLabel.toLowerCase() + ' at ' + escHtml(round.course) + '.' + (_rdRoster ? ' <span style="color:var(--cb-mute)">Team: ' + escHtml(_rdRoster) + '</span>' : '') + '</p>';
  } else {
    h += '<p class="rd-deck">' + escHtml(firstName) + (deckToPar ? ' went ' + deckToPar : ' turned in a round') + ' across ' + holeLabel.toLowerCase() + ' at ' + escHtml(round.course) + '.</p>';
  }
  var dateBits = [dateLine, fmtLabel];
  if (roundTee) dateBits.push(roundTee + " tees");
  h += '<div class="rd-dateline">' + dateBits.filter(Boolean).join(' · ') + '</div>';
  h += '</div>';

  // Notice strip — the scoring BREAKDOWN only (Founder 2026-06-15: strokes /
  // to-par / putts moved out — they live in "By the numbers" below and the
  // masthead deck, so this strip no longer duplicates them; it now shows the
  // shape of the round, which nothing else does).
  if (nEagle + nBird + nPar + nBog + nDouble > 0) {
    var noteBits = [];
    if (nEagle) noteBits.push('<b>' + nEagle + '</b> eagle' + (nEagle === 1 ? '' : 's'));
    noteBits.push('<b>' + nBird + '</b> birdie' + (nBird === 1 ? '' : 's'));
    noteBits.push('<b>' + nPar + '</b> par' + (nPar === 1 ? '' : 's'));
    noteBits.push('<b>' + nBog + '</b> bogey' + (nBog === 1 ? '' : 's'));
    if (nDouble) noteBits.push('<b>' + nDouble + '</b> double+');
    h += '<div class="rd-notice">' + noteBits.join(' &nbsp;·&nbsp; ') + '</div>';
  }

  // ── Section A — The card (hole-by-hole) ──
  if (nCols > 0) {
    var is18 = nCols > 9;
    var startHole = (!is18 && round.holesMode === "back9") ? 10 : 1;
    var _scCell = function(i) {
      var sv = hs[i];
      if (sv === "" || sv == null || isNaN(parseInt(sv))) return '<td>—</td>';
      var cls = scoreClass(sv, parseInt(hp[i]));
      return '<td><span class="rd-sc' + (cls ? ' rd-sc--' + cls : '') + '">' + parseInt(sv) + '</span></td>';
    };
    var _sum = function(arr, a, b) { var t = 0; for (var k = a; k < b; k++) { var v = parseInt(arr[k]); if (!isNaN(v)) t += v; } return t; };

    // 9-over-9 (Founder 2026-06-15): an 18-hole card stacks Front nine over Back
    // nine so the whole scorecard fits the phone width — no sideways scroll. Each
    // block is a self-contained table; `trailing` columns are the segment + grand
    // totals (Out for the front, In + Tot for the back, Tot for a single nine).
    var _block = function (from, to, labelBase, trailing) {
      var s = '<table class="rd-card"><thead><tr><th>Hole</th>';
      for (var k = from; k < to; k++) s += '<th>' + (labelBase + (k - from)) + '</th>';
      trailing.forEach(function (t) { s += '<th>' + t.label + '</th>'; });
      s += '</tr></thead><tbody>';
      s += '<tr class="rd-card__row-par"><th>Par</th>';
      for (var pp = from; pp < to; pp++) s += '<td>' + (hp[pp] != null ? parseInt(hp[pp]) : '—') + '</td>';
      trailing.forEach(function (t) { s += '<td class="' + t.cls + '">' + t.par + '</td>'; });
      s += '</tr>';
      s += '<tr class="rd-card__row-score"><th>' + escHtml(firstName) + '</th>';
      for (var ss = from; ss < to; ss++) s += _scCell(ss);
      trailing.forEach(function (t) { s += '<td class="' + t.cls + '">' + t.score + '</td>'; });
      s += '</tr></tbody></table>';
      return s;
    };

    h += '<div class="rd-section">';
    h += '<div class="rd-section__eyebrow">Hole by hole</div>';
    h += '<h2 class="rd-section__title">The card</h2>';
    h += '<div class="rd-card-stack">';
    if (is18) {
      h += _block(0, 9, 1, [{ label: 'Out', par: _sum(hp, 0, 9), score: _sum(hs, 0, 9), cls: 'rd-card__seg' }]);
      h += _block(9, 18, 10, [
        { label: 'In', par: _sum(hp, 9, 18), score: _sum(hs, 9, 18), cls: 'rd-card__seg' },
        { label: 'Tot', par: _sum(hp, 0, 18), score: (round.score || _sum(hs, 0, 18)), cls: 'rd-card__tot' }
      ]);
    } else {
      h += _block(0, nCols, startHole, [{ label: 'Tot', par: _sum(hp, 0, nCols), score: (round.score || _sum(hs, 0, nCols)), cls: 'rd-card__tot' }]);
    }
    h += '</div>';
    h += '<div class="rd-legend">';
    h += '<span class="rd-legend__item"><span class="rd-legend__dot" style="background:rgba(var(--cb-brass-rgb),.55)"></span>Eagle+</span>';
    h += '<span class="rd-legend__item"><span class="rd-legend__dot" style="background:rgba(var(--cb-moss-rgb),.55)"></span>Birdie</span>';
    h += '<span class="rd-legend__item"><span class="rd-legend__dot" style="background:var(--cb-mute)"></span>Par</span>';
    h += '<span class="rd-legend__item"><span class="rd-legend__dot" style="background:rgba(var(--cb-claret-rgb),.55)"></span>Bogey+</span>';
    h += '</div></div>';
  } else {
    h += '<div class="rd-section"><div class="rd-section__eyebrow">Hole by hole</div><h2 class="rd-section__title">The card</h2>';
    h += '<p class="rd-deck">Hole-by-hole detail wasn’t logged for this round. Log holes as you play to see the full card here.</p></div>';
  }

  // ── Section B — By the numbers ──
  h += '<div class="rd-section"><div class="rd-section__eyebrow">Performance</div><h2 class="rd-section__title">By the numbers</h2>';
  h += '<div class="rd-stats">';
  h += '<div class="rd-stat"><div class="rd-stat__label">Score</div><div class="rd-stat__value">' + round.score + '</div><div class="rd-stat__delta ' + (diff !== null && diff < 0 ? 'rd-stat__delta--up' : diff !== null && diff > 0 ? 'rd-stat__delta--down' : 'rd-stat__delta--flat') + '">' + (diffStr || '—') + ' to par</div></div>';
  var firPct = firH ? Math.round(firC / firH * 100) : null;
  h += '<div class="rd-stat"><div class="rd-stat__label">Fairways</div><div class="rd-stat__value">' + (firPct !== null ? firPct + '%' : '—') + '</div><div class="rd-stat__delta rd-stat__delta--flat">' + (firH ? firC + '/' + firH : 'not logged') + '</div></div>';
  var girPct = girH ? Math.round(girC / girH * 100) : null;
  h += '<div class="rd-stat"><div class="rd-stat__label">Greens</div><div class="rd-stat__value">' + (girPct !== null ? girPct + '%' : '—') + '</div><div class="rd-stat__delta rd-stat__delta--flat">' + (girH ? girC + '/' + girH : 'not logged') + '</div></div>';
  h += '<div class="rd-stat"><div class="rd-stat__label">Putts</div><div class="rd-stat__value">' + (puttH ? totalPutts : '—') + '</div><div class="rd-stat__delta rd-stat__delta--flat">' + (puttAvg !== null ? puttAvg.toFixed(1) + '/hole' : 'not logged') + '</div></div>';
  h += '</div></div>';

  // Parbaugh commentary — editorial agate
  if (commentary.highlights.length || commentary.roasts.length) {
    h += '<div class="rd-section"><div class="rd-section__eyebrow">Word from the group</div><h2 class="rd-section__title">Parbaugh commentary</h2>';
    var allComments = [];
    commentary.highlights.forEach(function(hl) { allComments.push({text:hl,type:"up"}); });
    commentary.roasts.forEach(function(r) { allComments.push({text:r,type:"down"}); });
    allComments.forEach(function(c) {
      var ic = c.type === "up" ? "var(--cb-moss)" : "var(--cb-claret)";
      var arrow = c.type === "up" ? "M8 13V3M3 8l5-5 5 5" : "M8 3v10M3 8l5 5 5-5";
      h += '<div class="rd-quip"><svg class="rd-quip__mark" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="' + ic + '" stroke-width="2" aria-hidden="true"><path d="' + arrow + '"/></svg><div class="rd-quip__text">' + c.text + '</div></div>';
    });
    h += '</div>';
  }

  // ── The Caddy's Take (post-round analysis) ──
  if (typeof caddieAnalyzeRound === "function" && round.holeScores && round.holeScores.length >= 9) {
    var playerRds = round.player ? PB.getPlayerRounds(round.player) : [];
    var caddieInsights = caddieAnalyzeRound(round, playerRds);
    if (caddieInsights.length) h += '<div class="rd-section"><div class="rd-section__eyebrow">⛳ The Caddy</div><h2 class="rd-section__title">The Caddy’s take</h2>' + renderCaddieInsights(caddieInsights, 6) + '</div>';
  }

  // Story display
  if (round.story) {
    h += '<div class="rd-section"><div class="rd-section__eyebrow">In their words</div><h2 class="rd-section__title">The story</h2>';
    h += '<blockquote class="rd-story">' + escHtml(round.story) + '</blockquote>';
    if (round.storyPhoto) h += '<div class="rd-story__photo"><img alt="Round story photo" src="' + escHtml(round.storyPhoto) + '" style="width:100%;display:block"></div>';
    h += '</div>';
  }

  // Scorecard photo (if the member attached one)
  if (round.scorecardPhoto) {
    h += '<div class="rd-section"><div class="rd-section__eyebrow">From the bag</div><h2 class="rd-section__title">Scorecard photo</h2>';
    h += '<div class="rd-photo"><img alt="Scorecard photo" src="' + escHtml(round.scorecardPhoto) + '" style="width:100%;display:block"></div>';
    h += '</div>';
  }

  // Share card — embedded preview + capture
  h += '<div class="rd-section"><div class="rd-section__eyebrow">Take it to the group</div><h2 class="rd-section__title">Share</h2>';
  h += '<div id="rdSharePreviewWrap" class="rd-share-wrap">';
  h += '<div style="transform-origin:top left;pointer-events:none" id="rdSharePreviewInner"></div>';
  h += '</div>';
  h += '<div style="margin-top:12px">';
  h += '<button class="rd-btn rd-btn--brass" onclick="captureShareCard()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0" aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 4l1-2h3l1 2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>Save image &amp; share</button>';
  h += '</div></div>';

  // v8.22.0 (Ship 5+7 Phase 4) — "Manage round" grouped section. Three-
  // tier visibility model that mirrors firestore.rules /rounds:
  //   - Author (round.player === uid)              → eyebrow + Edit + Delete
  //   - Founder (isFounderRole(currentProfile))    → eyebrow + Delete only
  //   - Spectator (neither)                        → entire section hidden
  // Server-side rules (V11.3 audit) for delete: author OR founder.
  // For update: author OR leadership OR founder OR engagement-only.
  // We narrow the UI Edit path to author-only since leadership-edit on
  // behalf of members is a rare commissioner workflow that warrants its
  // own dedicated UI ship rather than mixing into per-round detail.
  var isAuthor = !!(currentUser && round.player === currentUser.uid);
  var isFounder = (typeof isFounderRole === "function") && isFounderRole(currentProfile);
  var canManage = isAuthor || isFounder;
  if (canManage) {
    h += '<div class="rd-section"><div class="rd-section__eyebrow">Yours to manage</div><h2 class="rd-section__title">This round</h2>';
    if (isAuthor) {
      h += '<button class="rd-btn rd-btn--ghost" style="margin-bottom:10px" onclick="Router.go(\'rounds\',{roundId:\'' + roundId + '\',action:\'edit\'})">';
      h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0" aria-hidden="true"><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>Edit round</button>';
    }
    h += '<div id="del-confirm" class="rd-confirm" style="display:none">';
    h += '<div class="rd-confirm__q">Delete this round? This can’t be undone.</div>';
    h += '<div style="display:flex;gap:8px"><button class="rd-btn rd-btn--ghost" style="flex:1" onclick="document.getElementById(\'del-confirm\').style.display=\'none\'">Cancel</button>';
    h += '<button class="rd-btn rd-btn--danger" style="flex:1" onclick="(function(){PB.deleteRound(\'' + roundId + '\');if(db)db.collection(\'rounds\').doc(\'' + roundId + '\').delete().catch(function(){});setTimeout(function(){persistPlayerStats(currentUser?currentUser.uid:null);},1500);Router.toast(\'Round deleted\');Router.go(\'rounds\');})()">Delete</button></div></div>';
    h += '<button class="rd-btn rd-btn--danger" onclick="document.getElementById(\'del-confirm\').style.display=\'block\'">';
    h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0" aria-hidden="true"><path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/></svg>Delete round</button>';
    h += '</div>';
  }

  h += '</div>'; // close .rd-wrap

  document.querySelector('[data-page="rounds"]').innerHTML = h;

  // Populate the hidden share template and clone into the inline preview
  setTimeout(function() {
    populateShareTemplateForRound(round);
    var template = document.getElementById("pbShareTemplate");
    var previewInner = document.getElementById("rdSharePreviewInner");
    var previewWrap = document.getElementById("rdSharePreviewWrap");
    if (template && previewInner && previewWrap) {
      previewInner.innerHTML = template.innerHTML;
      // Scale to fit container width — template is 1080px wide
      var wrapWidth = previewWrap.offsetWidth || 360;
      var scale = wrapWidth / 1080;
      previewInner.style.transform = "scale(" + scale + ")";
      previewInner.style.transformOrigin = "top left";
      previewInner.style.width = "1080px";
      previewInner.style.height = "1080px";
      previewWrap.style.height = Math.round(1080 * scale) + "px";
    }
  }, 80);
}

// Extracted to src/pages/rounds-loghole.js per W1.A5. Originally lines 437-663 of this file.

function submitRound() {
  var player = document.getElementById("rf-player").value;
  var courseName = document.getElementById("rf-course").value;
  if (!courseName) { Router.toast("Pick a course"); return; }

  // Hole-by-hole data is required
  var hbhData = getLogHoleData();
  if (!hbhData) { Router.toast("Enter your hole-by-hole scores"); return; }

  var filledScores = hbhData.holeScores.filter(function(s) { return s !== ""; });
  if (filledScores.length < 9) { Router.toast("Enter at least 9 holes"); return; }

  // Compute score from holes
  var score = 0;
  filledScores.forEach(function(s) { score += parseInt(s) || 0; });

  var course = PB.getCourseByName(courseName);
  var holesMode = document.getElementById("rf-holes") ? document.getElementById("rf-holes").value : "18";
  var is9hole = holesMode === "front9" || holesMode === "back9";
  var rating = parseFloat(document.getElementById("rf-rating").value) || (course ? course.rating : 72);
  var slope = parseInt(document.getElementById("rf-slope").value) || (course ? course.slope : 113);

  // Halve rating for 9-hole rounds
  if (is9hole && rating > 50) rating = rating / 2;

  var photoInput = document.getElementById("rf-photo");
  var addRoundData = {
    player: player,
    course: courseName,
    score: score,
    date: document.getElementById("rf-date").value,
    rating: rating,
    slope: slope,
    format: document.getElementById("rf-format").value,
    playerName: currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh",
    holesPlayed: filledScores.length,
    holesMode: holesMode,
    holeScores: hbhData.holeScores,
    firData: hbhData.firData,
    girData: hbhData.girData,
    puttsData: hbhData.puttsData,
    bunkerData: hbhData.bunkerData,
    sandData: hbhData.sandData,
    upDownData: hbhData.upDownData,
    missData: hbhData.missData,
    penaltyData: hbhData.penaltyData,
    visibility: "public"
  };

  // Add tee info from course if available
  if (course) {
    addRoundData.tee = course.tee || "";
    addRoundData.yards = course.yards || 0;
  }

  function _afterRoundSubmit(round) {
    // v8.22.0 (Ship 5+7) — persistence (PB.addRound + syncRound) lives in
    // _submitRoundEntry; this hook only handles post-submit side effects
    // (haptics, XP, notifications, wager/bounty resolution, story prompt).
    // Haptic success on round finish (Ship 0b-iii)
    if (typeof hapticSuccess === "function") hapticSuccess();
    setTimeout(function() { persistPlayerStats(player); }, 2000);
    // ── ParCoin: award coins for logging a round ──
    if (currentUser && addRoundData.format !== "scramble" && addRoundData.format !== "scramble4") {
      var is9h = filledScores.length < 18;
      var isAttested = !!round.attestedBy;
      var coins = calcRoundCoins(is9h, isAttested);
      awardCoins(currentUser.uid, coins, "round_complete", "Logged " + (is9h ? "9H" : "18H") + " at " + courseName + " (" + score + ")" + (isAttested ? " [attested]" : ""), "round_" + round.id);
      if (!is9h) {
        var prevBest = PB.getPlayerBest(currentUser.uid);
        if (prevBest && prevBest.score && score < prevBest.score) {
          awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_18h, "personal_best", "New PB (18H): " + score, "pb_" + round.id);
        }
      }
    }
    // Notify other members about this round (rival posted a round).
    // v8.17.0 Path B+ hardening — two-layer scope for the broadcast:
    //   1. League scope: only notify members of the round's league.
    //   2. Test/real isolation: don't broadcast across the test/real boundary
    //      (defensive — also prevents test account from spam-pushing real members).
    // Architectural multi-league filter is B.36 / Phase 2 territory.
    if (currentUser && round.visibility !== "private") {
      var _roundPlayerName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
      var _roundLeagueId = round.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
      var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
      PB.getPlayers().forEach(function(p) {
        var pUid = p.id;
        if (pUid === currentUser.uid) return;
        if (isBannedRole(p)) return;
        // 1. Skip members not in the round's league
        if (_roundLeagueId && (!p.leagues || p.leagues.indexOf(_roundLeagueId) === -1)) return;
        // 2. Don't broadcast across the test/real account boundary
        if (!!p.isTestAccount !== _writerIsTest) return;
        sendNotification(pUid, {
          type: "round_posted",
          title: _roundPlayerName + " posted a round",
          message: (round.score || "") + " at " + (round.course || "a course"),
          page: "feed"
        });
      });
    }
    // Check if any wagers or bounties can be resolved with this round
    setTimeout(function() {
      if (typeof checkWagerResolution === "function") checkWagerResolution(round);
      if (typeof checkBountyClaims === "function") checkBountyClaims(round);
    }, 3000);
    showRoundCommentary(round);
  }

  // v8.22.0 (Ship 5+7) — persistence routed through _submitRoundEntry so
  // Phase 3 edit can reuse the same chain via { isEdit, roundId } options.
  if (photoInput && photoInput.files && photoInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      addRoundData.scorecardPhoto = e.target.result;
      _submitRoundEntry(addRoundData).then(_afterRoundSubmit);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    _submitRoundEntry(addRoundData).then(_afterRoundSubmit);
  }
}

// v8.22.0 (Ship 5+7 Phase 3) — Edit-existing-round submit handler.
// Mirrors submitRound's form-data gathering but writes via the edit
// branch of _submitRoundEntry (db.update instead of PB.addRound +
// syncRound) and SKIPS all _afterRoundSubmit side effects.
//
// Side-effect preservation invariant (CTO ruling): once a side effect
// has fired (notifications sent, ParCoins awarded, XP granted, wagers
// resolved, bounties claimed, story created), it stays fired. Edits
// change round data going forward but do NOT roll back already-
// triggered events. Members making material changes that invalidate
// resolution outcomes should escalate to the commissioner for manual
// handling. Matches platform conventions (Twitter, Strava, etc. —
// edits don't unwind notifications or reactions).
//
// Photo handling: file inputs cannot be prefilled via JS, so the form
// always renders the photo input empty on edit. We only include
// scorecardPhoto in the update payload when the member selects a new
// file — otherwise the existing photo is preserved on the server.
//
// Preserved fields (NOT in update payload): id, player, playerName,
// leagueId, createdAt, visibility, highlights, blunders, story,
// storyPhoto, notes, attestedBy. Identity + audit + side-effect-
// generated fields are immutable through this path.
function submitRoundEdit(roundId) {
  if (!roundId) return;
  var courseName = document.getElementById("rf-course").value;
  if (!courseName) { Router.toast("Pick a course"); return; }

  var hbhData = getLogHoleData();
  if (!hbhData) { Router.toast("Enter your hole-by-hole scores"); return; }

  var filledScores = hbhData.holeScores.filter(function(s) { return s !== ""; });
  if (filledScores.length < 9) { Router.toast("Enter at least 9 holes"); return; }

  var score = 0;
  filledScores.forEach(function(s) { score += parseInt(s) || 0; });

  var course = PB.getCourseByName(courseName);
  var holesMode = document.getElementById("rf-holes") ? document.getElementById("rf-holes").value : "18";
  var is9hole = holesMode === "front9" || holesMode === "back9";
  var rating = parseFloat(document.getElementById("rf-rating").value) || (course ? course.rating : 72);
  var slope = parseInt(document.getElementById("rf-slope").value) || (course ? course.slope : 113);
  if (is9hole && rating > 50) rating = rating / 2;

  var dateVal = document.getElementById("rf-date").value;

  // Editable fields only. B.44 alignment: re-derive timestamp from the
  // edited date so retroactive edits keep correct sort order in feed
  // / window / streak code paths.
  var updatePayload = {
    course: courseName,
    score: score,
    date: dateVal,
    timestamp: dateVal ? new Date(dateVal + "T12:00:00").getTime() : Date.now(),
    rating: rating,
    slope: slope,
    format: document.getElementById("rf-format").value,
    holesPlayed: filledScores.length,
    holesMode: holesMode,
    holeScores: hbhData.holeScores,
    firData: hbhData.firData,
    girData: hbhData.girData,
    puttsData: hbhData.puttsData,
    bunkerData: hbhData.bunkerData,
    sandData: hbhData.sandData,
    upDownData: hbhData.upDownData,
    missData: hbhData.missData,
    penaltyData: hbhData.penaltyData
  };
  if (course) {
    updatePayload.tee = course.tee || "";
    updatePayload.yards = course.yards || 0;
  }

  function _commitEdit() {
    _submitRoundEntry(updatePayload, { isEdit: true, roundId: roundId }).then(function() {
      // Refresh local in-memory round so the detail view reflects edits
      // immediately (snapshot listener will reconcile in the background).
      if (typeof PB !== "undefined" && PB.getRounds) {
        var localRound = PB.getRounds().find(function(r) { return r.id === roundId; });
        if (localRound) Object.assign(localRound, updatePayload);
      }
      Router.toast("Round updated");
      Router.go("rounds", { roundId: roundId });
    }).catch(function(err) {
      if (typeof pbWarn === "function") pbWarn("[rounds] edit submit failed:", err && err.message);
      Router.toast("Couldn't save changes, please try again");
      // Form stays open; member's edits are preserved in the DOM for retry.
    });
  }

  // Photo: include in update only when a new file is selected. Empty
  // file input = preserve existing scorecardPhoto on the server.
  var photoInput = document.getElementById("rf-photo");
  if (photoInput && photoInput.files && photoInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      updatePayload.scorecardPhoto = e.target.result;
      _commitEdit();
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    _commitEdit();
  }
}

function showRoundCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-round-course",
    function(c) { return "document.getElementById('rf-course').value='" + c.name.replace(/'/g, "\\'") + "';document.getElementById('search-round-course').innerHTML='';var ri=document.getElementById('rf-rating');var si=document.getElementById('rf-slope');if(ri&&!ri.value)ri.value='" + c.rating + "';if(si&&!si.value)si.value='" + c.slope + "';renderLogHoleGrid()"; },
    function(val) { return "quickAddCourseForRound('" + val.replace(/'/g, "\\'") + "')"; }
  );
}

function quickAddCourseForRound(name, _state) {
  // v8.24.34 — branded pbPrompt (was a native prompt()).
  if (_state === undefined) {
    pbPrompt({ title: "Which state?", placeholder: "e.g. VA, PA, NC", confirmLabel: "Add course" })
      .then(function(st) { if (st !== null) quickAddCourseForRound(name, st); });
    return;
  }
  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  // v8.24.42 — auto-create: real GolfCourseAPI data first (zero-guessing
  // rule); the guessed-72s stub only when the API has no match.
  Router.toast("Looking up " + name + "...");
  pbAutoCreateCourse(name, state).then(function(apiCourse) {
    if (apiCourse) {
      document.getElementById("rf-course").value = apiCourse.name;
      var ri0 = document.getElementById("rf-rating"); if (ri0) ri0.value = String(apiCourse.rating || 72);
      var si0 = document.getElementById("rf-slope"); if (si0) si0.value = String(apiCourse.slope || 113);
      document.getElementById("search-round-course").innerHTML = "";
      renderLogHoleGrid();
      Router.toast("Added " + apiCourse.name + " with real course data");
      return;
    }
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
    PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
    if (db) db.collection("courses").doc(id).set({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
    document.getElementById("rf-course").value = name;
    var ri = document.getElementById("rf-rating"); if (ri) ri.value = "72";
    var si = document.getElementById("rf-slope"); if (si) si.value = "113";
    document.getElementById("search-round-course").innerHTML = "";
    renderLogHoleGrid();
    Router.toast("Added " + name + " (provisional pars)");
  });
}

function showRoundCommentary(round) {
  Router.toast("Round saved!");
  // Show story prompt before navigating
  _showStoryPrompt(round);
}

function _showStoryPrompt(round) {
  var h = '<div class="sh"><h2>How\'d It Go?</h2></div>';
  h += '<div style="text-align:center;padding:20px 16px">';
  h += '<div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--gold)">' + (round.score || "") + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);margin-top:4px">' + escHtml(round.course || "") + '</div>';
  h += '</div>';
  h += '<div style="padding:0 16px">';
  h += '<div class="ff"><label class="ff-label">Tell the story of this round (optional)</label>';
  h += '<textarea class="ff-input" id="story-text" rows="3" placeholder="The highlight of the day was... / I was cruising until hole 7... / First time breaking 100!"></textarea></div>';
  h += '<div class="ff"><label class="ff-label">Add a photo (optional)</label><input type="file" accept="image/*" id="story-photo" style="font-size:11px;color:var(--muted)"></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn full green" style="flex:1" onclick="submitRoundStory(\'' + round.id + '\')">Post Story</button>';
  h += '<button class="btn full outline" style="flex:1" onclick="Router.go(\'rounds\',{roundId:\'' + round.id + '\'})">Skip</button>';
  h += '</div></div>';
  document.querySelector('[data-page="rounds"]').innerHTML = h;
}

function submitRoundStory(roundId) {
  var text = (document.getElementById("story-text") || {}).value || "";
  if (!text.trim()) { Router.go("rounds", {roundId: roundId}); return; }
  var photoInput = document.getElementById("story-photo");

  function _doSubmit(photoData) {
    if (db && roundId) {
      var update = { story: text.trim() };
      if (photoData) update.storyPhoto = photoData;
      db.collection("rounds").doc(roundId).update(update).catch(function(){});
    }
    Router.toast("Story posted!");
    Router.go("rounds", {roundId: roundId});
  }

  if (photoInput && photoInput.files && photoInput.files[0]) {
    Router.toast("Saving story...");
    var reader = new FileReader();
    reader.onload = function(e) { compressPhoto(e.target.result, PHOTO_MAX_KB, 600, function(c) { _doSubmit(c); }); };
    reader.readAsDataURL(photoInput.files[0]);
    return;
  }
  _doSubmit(null);
}

