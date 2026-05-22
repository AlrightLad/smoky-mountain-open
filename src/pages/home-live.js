// Home — Live round renders: finished summary, expanded card, secondary,
// page hero. Extracted per W1.A5 (AMD-027).

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
