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
  return renderRoundsList();
});

// List view — handicap header + scramble-grouped history + "Log a round"
// CTA. Ports the renderActivityRounds() history-rendering pattern from
// the legacy Activity Rounds tab so members lose nothing in the move.
function renderRoundsList() {
  var rounds = PB.getRounds();
  var myId = currentUser ? currentUser.uid : null;
  var myLocal = currentProfile ? currentProfile.claimedFrom : null;
  var myRounds = rounds.filter(function(r) { return r.player === myId || r.player === myLocal || r.player === "zach"; });
  var hcap = PB.calcHandicap(myRounds);

  var h = '<div class="sh"><h2>Rounds</h2>';
  h += '<button class="btn-sm green" onclick="Router.go(\'rounds\',{action:\'new\'})">+ Log a round</button>';
  h += '</div>';

  // Handicap (mirrors the legacy activity.js:38-42 treatment so the
  // member-visible header is unchanged across the surface migration).
  if (hcap !== null) {
    h += '<div class="hcap-box"><div class="hcap-val" data-count="' + (+hcap).toFixed(1) + '" data-count-decimals="1">0.0</div><div class="hcap-label">Your handicap index</div></div>';
  } else {
    h += '<div class="hcap-box"><div class="hcap-val">—</div><div class="hcap-label">Your handicap index</div></div>';
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
          scrambleGroups[gk] = { course: r.course, date: r.date, score: r.score, tee: r.tee, format: r.format, players: [], ts: r.timestamp || 0, id: r.id };
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

    h += '<div class="section"><div class="sec-head"><span class="sec-title">Round history</span><span class="sec-link">' + rounds.length + ' total</span></div>';
    h += '<div style="max-height:500px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    historyItems.forEach(function(item) {
      if (item.type === "individual") {
        var r = item.round;
        var c = PB.generateRoundCommentary(r);
        var quip = c.roasts.length ? c.roasts[0] : (c.highlights.length ? c.highlights[0] : "");
        var histCourse = PB.getCourseByName(r.course);
        var histTee = r.tee || (histCourse ? histCourse.tee : "") || "";
        var fmtLabel = r.format && r.format !== 'stroke' ? ' · ' + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
        h += '<div class="card"><div class="round-card"><div class="rc-top"><div onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})" style="cursor:pointer;flex:1"><div class="rc-course">' + escHtml(r.course) + '</div><div class="rc-date">' + r.date + ' · ' + escHtml(r.playerName||"") + (histTee ? ' · ' + histTee : '') + (r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? ' · Back 9' : ' · Front 9') : '') + fmtLabel + '</div></div>';
        h += '<div style="display:flex;align-items:center;gap:8px"><div class="rc-score">' + r.score + '</div>';
        h += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px;flex-shrink:0" onclick="event.stopPropagation();showRoundShareCard(\'' + r.id + '\')">Share</button>';
        h += '</div></div>';
        if (quip) h += '<div class="rc-quip">' + quip + '</div>';
        h += '</div></div>';
      } else {
        var g = item.group;
        h += '<div class="card"><div class="round-card"><div class="rc-top"><div style="flex:1"><div class="rc-course" style="color:var(--gold)">' + escHtml(g.teamName) + ' · Scramble</div><div class="rc-date">' + escHtml(g.course) + ' · ' + g.date + (g.tee ? ' · ' + g.tee : '') + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">' + g.players.join(", ") + '</div></div>';
        h += '<div style="display:flex;align-items:center;gap:8px"><div class="rc-score">' + g.score + '</div>';
        h += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px;flex-shrink:0" onclick="event.stopPropagation();showRoundShareCard(\'' + g.id + '\')">Share</button>';
        h += '</div></div></div></div>';
      }
    });
    h += '</div></div>';
  } else {
    h += '<div class="section"><div class="card"><div class="empty"><div class="empty-text">No rounds logged yet. Tap "+ Log a round" above to add one.</div></div></div></div>';
  }

  h += renderPageFooter();
  document.querySelector('[data-page="rounds"]').innerHTML = h;
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
    Router.toast("Couldn't load round — please try again");
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
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var label = diff === 0 ? "Even" : (diff > 0 ? "+" + diff : diff);
  var text = round.playerName + " shot " + round.score + " (" + label + ") at " + round.course + " on " + round.date + " — The Parbaughs";

  if (navigator.share) {
    navigator.share({ title: "Parbaugh Round", text: text, url: "https://alrightlad.github.io/smoky-mountain-open/" }).catch(function(){});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { Router.toast("Copied to clipboard"); }).catch(function() { Router.toast("Copy failed"); });
  } else {
    Router.toast("Share not supported on this device");
  }
}

function renderRoundDetail(roundId) {
  var rounds = PB.getRounds();
  var round = rounds.find(function(r) { return r.id === roundId; });
  if (!round) { Router.go("rounds"); return; }

  var commentary = PB.generateRoundCommentary(round);
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var player = PB.getPlayer(round.player);

  var courseObj = PB.getCourseByName(round.course);
  var roundTee = round.tee || (courseObj ? courseObj.tee : "") || "";
  var diffColor = diff < 0 ? "var(--birdie)" : diff === 0 ? "var(--gold)" : "var(--red)";
  var diffStr = diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
  var holeLabel = round.holesPlayed && round.holesPlayed <= 9 ? (round.holesMode === "back9" ? "Back 9" : "Front 9") : "18 holes";
  var fmtLabel = round.format && round.format !== "stroke" ? round.format.charAt(0).toUpperCase() + round.format.slice(1) : "Stroke";

  var h = '<div style="position:relative;background:linear-gradient(180deg,var(--grad-hero),var(--bg));padding:16px 16px 20px;border-bottom:1px solid var(--border)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<button class="back" onclick="Router.back(\'home\')" style="padding:6px 10px;min-height:40px">← Back</button>';
  h += '</div>';
  // Score hero
  h += '<div style="text-align:center">';
  if (player) h += '<div style="display:flex;justify-content:center;margin-bottom:8px">' + renderAvatar(player, 52, true) + '</div>';
  h += '<div style="font-size:14px;font-weight:600;color:var(--cream)">' + renderUsername(player || {name:round.playerName,id:''}, '', false) + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + escHtml(round.course) + '</div>';
  h += '<div style="margin-top:12px"><span style="font-family:var(--font-display);font-size:56px;font-weight:800;color:var(--gold);line-height:1">' + round.score + '</span></div>';
  h += '<div style="margin-top:6px"><span style="font-size:14px;font-weight:700;color:' + diffColor + ';background:' + diffColor + '15;padding:4px 14px;border-radius:var(--radius-full);border:1px solid ' + diffColor + '30">' + diffStr + '</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:10px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">';
  h += '<span>' + round.date + '</span><span>·</span><span>' + holeLabel + '</span><span>·</span><span>' + fmtLabel + '</span>';
  if (roundTee) h += '<span>·</span><span>' + roundTee + '</span>';
  h += '</div>';
  h += '</div></div>';

  // Stat chips
  h += '<div style="display:flex;justify-content:center;gap:6px;padding:12px 16px;flex-wrap:wrap">';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + (round.rating || 72) + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Rating</div></div>';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + (round.slope || 113) + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Slope</div></div>';
  if (round.yards) h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + round.yards + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Yards</div></div>';
  h += '</div>';

  // AI Commentary — consolidated card
  if (commentary.highlights.length || commentary.roasts.length) {
    h += '<div class="card" style="margin-top:4px"><div class="card-body" style="padding:12px 14px">';
    h += '<div style="font-size:9px;font-weight:700;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Parbaugh Commentary</div>';
    var allComments = [];
    commentary.highlights.forEach(function(hl) { allComments.push({text:hl,type:"up"}); });
    commentary.roasts.forEach(function(r) { allComments.push({text:r,type:"down"}); });
    allComments.forEach(function(c) {
      var ic = c.type === "up" ? "var(--birdie)" : "var(--red)";
      var arrow = c.type === "up" ? "M8 13V3M3 8l5-5 5 5" : "M8 3v10M3 8l5 5 5-5";
      h += '<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="' + ic + '" stroke-width="2" style="flex-shrink:0;margin-top:2px"><path d="' + arrow + '"/></svg><div style="font-size:12px;color:var(--cream);line-height:1.4">' + c.text + '</div></div>';
    });
    h += '</div></div>';
  }

  // Scorecard photo
  if (round.scorecardPhoto) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
    h += '<div class="card"><div style="border-radius:var(--radius);overflow:hidden"><img alt="" src="' + round.scorecardPhoto + '" style="width:100%;display:block"></div></div>';
    h += '</div>';
  }

  // Share card preview — embedded directly in round detail
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
  h += '<div id="rdSharePreviewWrap" style="width:100%;border-radius:12px;overflow:hidden;background:var(--grad-deep);box-shadow:0 4px 20px rgba(0,0,0,.4)">';
  h += '<div style="transform-origin:top left;pointer-events:none" id="rdSharePreviewInner"></div>';
  h += '</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">';
  h += '<button class="btn full green" onclick="captureShareCard()" style="font-size:13px;padding:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;width:100%"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 4l1-2h3l1 2" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>Save image &amp; share to socials</button>';
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
    h += '<div class="section">';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">Manage round</div>';
    if (isAuthor) {
      h += '<button class="btn full" style="background:transparent;border:1px solid var(--gold);color:var(--gold);margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px" onclick="Router.go(\'rounds\',{roundId:\'' + roundId + '\',action:\'edit\'})">';
      h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0"><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>';
      h += '<span>Edit round</span></button>';
    }
    h += '<div id="del-confirm" style="display:none;margin-bottom:8px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
    h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">Delete this round?</div>';
    h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'del-confirm\').style.display=\'none\'">Cancel</button>';
    h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="(function(){PB.deleteRound(\'' + roundId + '\');if(db)db.collection(\'rounds\').doc(\'' + roundId + '\').delete().catch(function(){});setTimeout(function(){persistPlayerStats(currentUser?currentUser.uid:null);},1500);Router.toast(\'Round deleted\');Router.go(\'rounds\');})()">Delete</button></div></div>';
    h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red);display:flex;align-items:center;justify-content:center;gap:8px" onclick="document.getElementById(\'del-confirm\').style.display=\'block\'">';
    h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" style="flex-shrink:0"><path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/></svg>';
    h += '<span>Delete round</span></button>';
    h += '</div>';
  }

  // ── The Caddie's Take (post-round analysis) ──
  if (typeof caddieAnalyzeRound === "function" && round.holeScores && round.holeScores.length >= 9) {
    var playerRds = round.player ? PB.getPlayerRounds(round.player) : [];
    var caddieInsights = caddieAnalyzeRound(round, playerRds);
    if (caddieInsights.length) h += '<div class="section">' + renderCaddieInsights(caddieInsights, 6) + '</div>';
  }

  // Story display
  if (round.story) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Round Story</span></div>';
    h += '<div class="card"><div style="padding:14px 16px"><div style="font-size:12px;color:var(--cream);line-height:1.6;font-style:italic">\u201c' + escHtml(round.story) + '\u201d</div>';
    if (round.storyPhoto) h += '<div style="margin-top:8px;border-radius:var(--radius);overflow:hidden"><img alt="" src="' + round.storyPhoto + '" style="width:100%;display:block"></div>';
    h += '</div></div></div>';
  }

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

function toggleLogHoleByHole() {
  // Legacy — grid is always visible now
  renderLogHoleGrid();
}

function renderLogHoleGrid() {
  var sec = document.getElementById("rf-hbh-section");
  if (!sec) return;
  var courseName = document.getElementById("rf-course") ? document.getElementById("rf-course").value : "";
  var course = courseName ? PB.getCourseByName(courseName) : null;
  
  // Don't show grid until a valid course is selected
  if (!course || !course.holes || !course.holes.length) {
    sec.innerHTML = courseName ? '<div style="font-size:11px;color:var(--muted);padding:8px 0">Course not found in database — enter total score manually</div>' : '';
    return;
  }
  
  var holes = course.holes;
  var defaultPar = course.holes.map(function(h){return h.par||4;});
  var holesMode = document.getElementById("rf-holes") ? document.getElementById("rf-holes").value : "18";
  var showFront = holesMode === "18" || holesMode === "front9";
  var showBack = holesMode === "18" || holesMode === "back9";

  var h = '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Enter your score for each hole</div>';

  function _advRowsHtml(startIdx, endIdx) {
    // Produces 5 rows of advanced-stat inputs for holes [startIdx, endIdx)
    var out = '';
    out += '<tr><td class="sc-lbl">Bunker</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-bunker" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Sand</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-sand" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Up/Dn</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-updown" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Miss</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-miss" data-hole="' + i + '" style="width:40px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="left">L</option><option value="right">R</option><option value="long">Lo</option><option value="short">Sh</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Pen</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><input type="number" inputmode="numeric" class="rf-hole-penalty" data-hole="' + i + '" min="0" max="5" value="0" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    out += '</tr>';
    return out;
  }

  if (showFront) {
    h += '<div style="overflow-x:auto;margin-bottom:8px"><table class="sc-table" style="font-size:10px;width:100%"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 1; i <= 9; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr><tr><td class="sc-lbl">Par</td>';
    for (var i = 0; i < 9; i++) { var p = holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]; h += '<td class="sc-par">' + p + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">Score</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-score" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px" oninput="updateLogTotal()"></td>';
    h += '</tr><tr><td class="sc-lbl">FIR</td>';
    for (var i = 0; i < 9; i++) { var isPar3 = (holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]) === 3; h += '<td>' + (isPar3 ? '<span style="color:var(--muted2);font-size:9px">—</span>' : '<input type="checkbox" class="rf-hole-fir" data-hole="' + i + '" style="width:14px;height:14px">') + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">GIR</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="checkbox" class="rf-hole-gir" data-hole="' + i + '" style="width:14px;height:14px"></td>';
    h += '</tr><tr><td class="sc-lbl">Putts</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-putts" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    h += '</tr></table>';
    h += '<details style="margin-top:6px"><summary style="font-size:10px;color:var(--muted);cursor:pointer;padding:6px 0">+ Advanced stats (front 9)</summary>';
    h += '<table class="sc-table" style="font-size:10px;width:100%;margin-top:4px"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 1; i <= 9; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr>' + _advRowsHtml(0, 9) + '</table>';
    h += '</details></div>';
  }

  if (showBack) {
    h += '<div style="overflow-x:auto;margin-bottom:8px"><table class="sc-table" style="font-size:10px;width:100%"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 10; i <= 18; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr><tr><td class="sc-lbl">Par</td>';
    for (var i = 9; i < 18; i++) { var p = holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]; h += '<td class="sc-par">' + p + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">Score</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-score" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px" oninput="updateLogTotal()"></td>';
    h += '</tr><tr><td class="sc-lbl">FIR</td>';
    for (var i = 9; i < 18; i++) { var isPar3 = (holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]) === 3; h += '<td>' + (isPar3 ? '<span style="color:var(--muted2);font-size:9px">—</span>' : '<input type="checkbox" class="rf-hole-fir" data-hole="' + i + '" style="width:14px;height:14px">') + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">GIR</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="checkbox" class="rf-hole-gir" data-hole="' + i + '" style="width:14px;height:14px"></td>';
    h += '</tr><tr><td class="sc-lbl">Putts</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-putts" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    h += '</tr></table>';
    h += '<details style="margin-top:6px"><summary style="font-size:10px;color:var(--muted);cursor:pointer;padding:6px 0">+ Advanced stats (back 9)</summary>';
    h += '<table class="sc-table" style="font-size:10px;width:100%;margin-top:4px"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 10; i <= 18; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr>' + _advRowsHtml(9, 18) + '</table>';
    h += '</details></div>';
  }
  h += '<div id="rf-hbh-total" style="font-size:12px;color:var(--gold);text-align:center;margin-bottom:8px"></div>';

  sec.innerHTML = h;
}

function updateLogTotal() {
  var inputs = document.querySelectorAll(".rf-hole-score");
  var total = 0, count = 0;
  inputs.forEach(function(inp) { if (inp.value) { total += parseInt(inp.value) || 0; count++; } });
  var el = document.getElementById("rf-hbh-total");
  if (el) el.textContent = count > 0 ? "Hole-by-hole total: " + total + " (" + count + " holes)" : "";
  // Auto-fill the score field
  if (count > 0) {
    var scoreField = document.getElementById("rf-score");
    if (scoreField) scoreField.value = total;
  }
}

function getLogHoleData() {
  var scores = Array(18).fill("");
  var fir = Array(18).fill(false);
  var gir = Array(18).fill(false);
  var putts = Array(18).fill("");
  var bunker = Array(18).fill(null);
  var sand = Array(18).fill(null);
  var upDown = Array(18).fill(null);
  var miss = Array(18).fill(null);
  var penalty = Array(18).fill(0);
  document.querySelectorAll(".rf-hole-score").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    if (inp.value) scores[idx] = inp.value;
  });
  document.querySelectorAll(".rf-hole-fir").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    fir[idx] = inp.checked;
  });
  document.querySelectorAll(".rf-hole-gir").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    gir[idx] = inp.checked;
  });
  document.querySelectorAll(".rf-hole-putts").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    if (inp.value) putts[idx] = parseInt(inp.value);
  });
  document.querySelectorAll(".rf-hole-bunker").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") bunker[idx] = true;
    else if (sel.value === "No") bunker[idx] = false;
  });
  document.querySelectorAll(".rf-hole-sand").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") sand[idx] = true;
    else if (sel.value === "No") sand[idx] = false;
  });
  document.querySelectorAll(".rf-hole-updown").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") upDown[idx] = true;
    else if (sel.value === "No") upDown[idx] = false;
  });
  document.querySelectorAll(".rf-hole-miss").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value) miss[idx] = sel.value;
  });
  document.querySelectorAll(".rf-hole-penalty").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    var v = parseInt(inp.value) || 0;
    if (v < 0) v = 0;
    if (v > 5) v = 5;
    penalty[idx] = v;
  });
  var hasData = scores.some(function(s) { return s !== ""; });
  return hasData ? {
    holeScores: scores,
    firData: fir,
    girData: gir,
    puttsData: putts,
    bunkerData: bunker,
    sandData: sand,
    upDownData: upDown,
    missData: miss,
    penaltyData: penalty
  } : null;
}

// v8.22.0 (Ship 5+7 Phase 3) — Populate hole-grid inputs from a round
// doc. Inverse of getLogHoleData. One-shot post-mount call — runs after
// renderLogHoleGrid has built the grid for the round's course. Skipped
// silently if a course-driven re-render later wipes the grid (changing
// course/holes-mode mid-edit is rare, and starting fresh is correct UX).
function _populateHoleGridFromRound(round) {
  if (!round) return;
  var holeScores = round.holeScores || [];
  var firData = round.firData || [];
  var girData = round.girData || [];
  var puttsData = round.puttsData || [];
  var bunkerData = round.bunkerData || [];
  var sandData = round.sandData || [];
  var upDownData = round.upDownData || [];
  var missData = round.missData || [];
  var penaltyData = round.penaltyData || [];

  document.querySelectorAll(".rf-hole-score").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (holeScores[i] !== undefined && holeScores[i] !== null && holeScores[i] !== "") inp.value = holeScores[i];
  });
  document.querySelectorAll(".rf-hole-fir").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    inp.checked = !!firData[i];
  });
  document.querySelectorAll(".rf-hole-gir").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    inp.checked = !!girData[i];
  });
  document.querySelectorAll(".rf-hole-putts").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (puttsData[i] !== undefined && puttsData[i] !== null && puttsData[i] !== "") inp.value = puttsData[i];
  });
  document.querySelectorAll(".rf-hole-bunker").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (bunkerData[i] === true) sel.value = "Yes";
    else if (bunkerData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-sand").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (sandData[i] === true) sel.value = "Yes";
    else if (sandData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-updown").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (upDownData[i] === true) sel.value = "Yes";
    else if (upDownData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-miss").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (missData[i]) sel.value = missData[i];
  });
  document.querySelectorAll(".rf-hole-penalty").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (penaltyData[i] !== undefined && penaltyData[i] !== null) inp.value = penaltyData[i];
  });
  // Refresh the hole-by-hole total + the auto-filled score field after
  // populating, so the form's running tally reflects the prefill state.
  if (typeof updateLogTotal === "function") updateLogTotal();
}

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
      Router.toast("Couldn't save changes — please try again");
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

function quickAddCourseForRound(name) {
  var state = prompt("State (e.g. VA, PA, NC):", "");
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
  if (db) db.collection("courses").doc(id).set({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
  document.getElementById("rf-course").value = name;
  var ri = document.getElementById("rf-rating"); if (ri) ri.value = "72";
  var si = document.getElementById("rf-slope"); if (si) si.value = "113";
  document.getElementById("search-round-course").innerHTML = "";
  renderLogHoleGrid();
  Router.toast("Added " + name);
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

