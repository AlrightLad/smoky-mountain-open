/* ================================================
   PAGE: WAGERS — ParCoin head-to-head betting
   Wager types: stroke play, best 9, most pars, fewest putts, Nassau
   Escrow: coins locked on accept, released on resolution.
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

var WAGER_TYPES = {
  stroke:   {label: "Stroke Play",     desc: "Lower total score wins",                          icon: '<path d="M6 21V4"/><path d="M6 4l10 3-10 3"/><path d="M3 21h18"/>'},
  best9:    {label: "Best 9",          desc: "Best front or back 9 wins",                       icon: '<path d="M4 15a8 8 0 0 1 16 0"/><line x1="3" y1="15" x2="21" y2="15"/>'},
  pars:     {label: "Most Pars",       desc: "Most pars (or better) wins",                      icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'},
  putts:    {label: "Fewest Putts",    desc: "Fewer total putts wins",                          icon: '<circle cx="12" cy="8" r="3"/><ellipse cx="12" cy="17" rx="7" ry="2.2"/>'},
  nassau:   {label: "Nassau",          desc: "3 bets: front 9, back 9, and total",              icon: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>'},
  beatscore:{label: "Beat Their Score",desc: "Bet you can beat their best at a specific course", icon: '<path d="M6 4h12v3a6 6 0 0 1-12 0z"/><path d="M12 13v3"/><path d="M8.5 19h7"/>'}
};

// Wrap a wager type's line-art glyph (inner SVG markup) in a sized, currentColor
// stroke SVG. Mirrors the v8.23.15 icon-coherence convention (24-grid line art
// that inherits its container tint) so wager type-icons read identically on
// iPhone and Android instead of the old letter monograms.
function wagerTypeIcon(key, size) {
  var t = WAGER_TYPES[key];
  var inner = (t && t.icon) ? t.icon : '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.2-1.5 1.7-2 2.7"/><path d="M12 17h.01"/>';
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}

Router.register("wagers", function(params) {
  if (params && params.create) { renderCreateWager(params.opponent); return; }
  renderWagerList();
});

// Canonical eyebrow+title section head — mono brass eyebrow over a
// display-serif title (the v8.24.24 members-detail pf-sec__* treatment,
// recipes in components.css).
function _wgSecHead(eyebrow, title) {
  return '<div class="sec-head"><div><div class="pf-sec__eyebrow">' + eyebrow + '</div><span class="sec-title pf-sec__title">' + title + '</span></div></div>';
}

function renderWagerList() {
  var uid = currentUser ? currentUser.uid : null;
  var h = '<div class="sh"><h2>Wagers</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'home\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'wagers\',{create:true})">+ New Wager</button></div></div>';

  // Balance
  var balance = getParCoinBalance(uid);
  h += '<div class="wg-balance">';
  h += '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="var(--cb-brass)" stroke-width="1.3" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg>';
  h += '<span class="wg-balance__amt">' + balance + '</span>';
  h += '<span class="wg-balance__note">available to wager</span>';
  h += '</div>';

  // Active wagers
  h += '<div id="wager-list"><div class="loading"><div class="spinner"></div>Loading wagers...</div></div>';

  h += renderPageFooter();
  document.querySelector('[data-page="wagers"]').innerHTML = h;

  // Async load wagers from Firestore
  if (db && uid) {
    leagueQuery("wagers").orderBy("createdAt", "desc").limit(50).get().then(function(snap) {
      var wagers = [];
      snap.forEach(function(doc) { wagers.push(Object.assign({_id: doc.id}, doc.data())); });
      // Filter to active wagers involving this user
      var mine = wagers.filter(function(w) { return (w.status === "pending" || w.status === "accepted") && (w.fromUid === uid || w.toUid === uid); });
      var el = document.getElementById("wager-list");
      if (!el) return;
      if (!mine.length) {
        el.innerHTML = _wagerEmptyHTML();
        // Show completed wagers below
        _loadCompletedWagers(uid, el);
        return;
      }
      var wh = '';
      mine.forEach(function(w) { wh += _renderWagerCard(w, uid); });
      el.innerHTML = '<div class="section">' + _wgSecHead("On the book", "Active wagers") + wh + '</div>';
      _loadCompletedWagers(uid, el);
    }).catch(function(err) {
      pbWarn("[Wagers]", err.message);
      var el = document.getElementById("wager-list");
      if (el) el.innerHTML = _wagerEmptyHTML();
    });
  }
}

// Designed empty state in the Caddy bookmaker voice — pf-empty dashed frame
// (the canonical designed-empty recipe) + felt CTA + idea slips kept from the
// bounties-family treatment so the sibling betting surfaces stay one family.
function _wagerEmptyHTML() {
  var eh = '<div class="pf-empty wg-empty">';
  eh += '<div class="wg-empty__icon"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>';
  eh += '<div class="pf-empty__h">No action on the books</div>';
  eh += '<div class="pf-empty__b">Call someone out — coins lock in escrow when the wager is accepted and pay out once the round is scored.</div>';
  eh += '<button class="wg-btn wg-btn--felt wg-empty__cta" onclick="Router.go(\'wagers\',{create:true})">Start a Wager</button>';
  eh += '<div class="wg-empty__ideas">';
  eh += '<div class="wg-empty__ideas-label">Wager ideas</div>';
  var examples = ["Lower total at Heritage Hills · 100 coins", "Fewest putts next round · 50 coins", "Beat my best at Sequoyah · 75 coins"];
  examples.forEach(function(ex) {
    eh += '<div class="wg-empty__idea"><span>' + ex + '</span></div>';
  });
  eh += '</div></div>';
  return eh;
}

function _loadCompletedWagers(uid, appendTo) {
  leagueQuery("wagers").where("status", "==", "completed").orderBy("completedAt", "desc").limit(15).get().then(function(snap) {
    var completed = [];
    snap.forEach(function(doc) {
      var w = Object.assign({_id: doc.id}, doc.data());
      if (w.fromUid === uid || w.toUid === uid) completed.push(w);
    });
    if (!completed.length) return;
    var ch = '<div class="section" style="margin-top:8px">' + _wgSecHead("Settled", "Past wagers");
    completed.forEach(function(w) { ch += _renderWagerCard(w, uid); });
    ch += '</div>';
    appendTo.innerHTML += ch;
  }).catch(function(){});
}

function _renderWagerCard(w, uid) {
  var type = WAGER_TYPES[w.type] || {label: w.type, icon: "?"};
  var isFrom = w.fromUid === uid;
  var oppName = isFrom ? (w.toName || "Opponent") : (w.fromName || "Challenger");
  var myName = isFrom ? (w.fromName || "You") : (w.toName || "You");
  var coinAmt = w.type === "nassau" ? (w.amount * 3) : w.amount;
  // One card geometry for every state; the mono status word carries the
  // outcome tone (wg-card__status--* recipes) instead of per-status washes.
  var statusTone = w.status === "pending" ? "pending" : w.status === "accepted" ? "live" : w.status === "completed" ? (w.winner === uid ? "won" : w.winner === "tie" ? "muted" : "lost") : "lost";
  var statusLabel = w.status === "pending" ? "Pending" : w.status === "accepted" ? "Active" : w.status === "completed" ? (w.winner === uid ? "Won" : w.winner === "tie" ? "Tie" : "Lost") : w.status;

  var h = '<div class="wg-card">';
  // Header: type icon + matchup + stake (brass mono) + status word
  h += '<div class="wg-card__row">';
  h += '<div class="wg-card__icon">' + wagerTypeIcon(w.type, 16) + '</div>';
  h += '<div class="wg-card__main">';
  h += '<div class="wg-card__name">' + escHtml(myName) + ' vs ' + escHtml(oppName) + '</div>';
  h += '<div class="wg-card__meta">' + type.label + (w.course ? ' · ' + escHtml(w.course) : '') + '</div>';
  h += '</div>';
  h += '<div class="wg-card__right">';
  h += '<div class="wg-card__stake">' + coinAmt + '</div>';
  h += '<div class="wg-card__status wg-card__status--' + statusTone + '">' + escHtml(statusLabel) + '</div>';
  h += '</div></div>';
  // Actions — felt confirm / ghost decline (44pt vocabulary)
  if (w.status === "pending" && !isFrom) {
    h += '<div class="wg-card__actions">';
    h += '<button class="wg-btn wg-btn--felt" onclick="acceptWager(\'' + w._id + '\')">Accept · ' + coinAmt + '</button>';
    h += '<button class="wg-btn wg-btn--ghost" onclick="declineWager(\'' + w._id + '\')">Decline</button>';
    h += '</div>';
  } else if (w.status === "pending" && isFrom) {
    h += '<div class="wg-card__wait">Waiting for ' + escHtml(oppName) + ' to accept...</div>';
  }
  // Result details for completed
  if (w.status === "completed" && w.resultDetail) {
    h += '<div class="wg-card__result">' + escHtml(w.resultDetail) + '</div>';
  }
  h += '</div>';
  return h;
}

function renderCreateWager(presetOpponent) {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);
  var players = PB.getPlayers().filter(function(p) { return p.id !== uid && !isBannedRole(p); });

  var h = '<div class="sh"><h2>New wager</h2><button class="back" onclick="Router.back(\'wagers\')">← Back</button></div>';

  h += '<div class="form-section">';
  // Opponent
  h += '<div class="ff"><label class="ff-label">Challenge</label>';
  h += '<select class="ff-input" id="wager-opponent">';
  h += '<option value="">Pick an opponent...</option>';
  players.forEach(function(p) {
    var sel = presetOpponent === p.id ? ' selected' : '';
    h += '<option value="' + p.id + '"' + sel + '>' + escHtml(p.name || p.username) + '</option>';
  });
  h += '</select></div>';

  // Wager type — radiogroup cells with the theme-row brass-ring selected state
  h += '<div class="ff"><label class="ff-label">Wager type</label>';
  h += '<div class="wg-type" role="radiogroup" aria-label="Wager type" id="wager-types">';
  Object.keys(WAGER_TYPES).forEach(function(key) {
    var wt = WAGER_TYPES[key];
    h += '<button type="button" class="wg-type__cell" role="radio" aria-checked="false" onclick="selectWagerType(\'' + key + '\')" id="wt-' + key + '">';
    h += '<div class="wg-type__icon">' + wagerTypeIcon(key, 26) + '</div>';
    h += '<div class="wg-type__name">' + wt.label + '</div>';
    h += '<div class="wg-type__desc">' + wt.desc + '</div>';
    h += '</button>';
  });
  h += '</div>';
  h += '<input type="hidden" id="wager-type" value="stroke"></div>';

  // Course (optional)
  h += '<div class="ff"><label class="ff-label">Course (optional, leave blank for any)</label>';
  h += '<input type="text" class="ff-input" id="wager-course" placeholder="Any course" oninput="showWagerCourseSearch(this)"></div>';
  h += '<div id="search-wager-course"></div>';

  // Amount — quick-picks share the brass-ring selection grammar; the typed
  // figure is brass mono like every stake on this page
  h += '<div class="ff"><label class="ff-label">Coins to wager (you have ' + balance + ')</label>';
  h += '<div class="wg-amt" id="wager-amounts">';
  [25, 50, 100, 200].forEach(function(amt) {
    h += '<button type="button" class="wg-amt__btn" aria-pressed="false" onclick="selectWagerAmount(' + amt + ',this)"' + (balance < amt ? ' disabled' : '') + '>' + amt + '</button>';
  });
  h += '</div>';
  h += '<input type="number" class="ff-input wg-amt__input" id="wager-amount" value="50" min="10" max="' + balance + '" oninput="clearWagerAmountPicks()"></div>';

  // Visibility
  h += '<div class="ff"><label class="ff-label">Visibility</label>';
  h += '<select class="ff-input" id="wager-visibility">';
  h += '<option value="public">Public (shows in feed)</option>';
  h += '<option value="private">Private (only you two see it)</option>';
  h += '</select></div>';

  // Type-specific escrow notes (shown/hidden by selectWagerType)
  h += '<div id="nassau-note" class="wg-note">Nassau wagers are 3 separate bets (front 9, back 9, total). The coin amount is per bet, so a 50-coin Nassau costs 150 total.</div>';
  h += '<div id="beatscore-note" class="wg-note"><div id="beatscore-target">Select opponent and course to see their best score</div><div style="margin-top:4px">You win if your next round at this course beats their personal best there.</div></div>';

  // Submit — felt confirm, full-width
  h += '<button class="wg-btn wg-btn--felt wg-btn--full" onclick="submitWager()">Send Challenge</button>';
  h += '<div class="wg-fine">Coins are held in escrow until the wager resolves. Zero real-world cash value.</div>';
  h += '</div>';

  document.querySelector('[data-page="wagers"]').innerHTML = h;
  // Default selection
  setTimeout(function() { selectWagerType("stroke"); }, 10);
}

var _selectedWagerType = "stroke";
function selectWagerType(type) {
  _selectedWagerType = type;
  var input = document.getElementById("wager-type");
  if (input) input.value = type;
  Object.keys(WAGER_TYPES).forEach(function(key) {
    var el = document.getElementById("wt-" + key);
    if (el) el.setAttribute("aria-checked", key === type ? "true" : "false");
  });
  var nassauNote = document.getElementById("nassau-note");
  if (nassauNote) nassauNote.style.display = type === "nassau" ? "block" : "none";
  var beatNote = document.getElementById("beatscore-note");
  if (beatNote) beatNote.style.display = type === "beatscore" ? "block" : "none";
  // Show opponent's best score at course when Beat Their Score is selected
  if (type === "beatscore") _updateBeatScoreTarget();
}

// Amount quick-picks — aria-pressed carries the brass-ring selected state
// (one pressed at a time; typing a custom figure clears the picks).
function selectWagerAmount(amt, btn) {
  var input = document.getElementById("wager-amount");
  if (input) input.value = amt;
  document.querySelectorAll("#wager-amounts .wg-amt__btn").forEach(function(b) {
    b.setAttribute("aria-pressed", b === btn ? "true" : "false");
  });
}

function clearWagerAmountPicks() {
  document.querySelectorAll("#wager-amounts .wg-amt__btn").forEach(function(b) {
    b.setAttribute("aria-pressed", "false");
  });
}

function _updateBeatScoreTarget() {
  var noteEl = document.getElementById("beatscore-target");
  if (!noteEl) return;
  var oppId = document.getElementById("wager-opponent") ? document.getElementById("wager-opponent").value : "";
  var course = document.getElementById("wager-course") ? document.getElementById("wager-course").value.trim() : "";
  if (!oppId || !course) { noteEl.textContent = "Select opponent and course to see their best score"; return; }
  var oppRounds = PB.getPlayerRounds(oppId).filter(function(r) { return r.course === course && r.format !== "scramble" && r.format !== "scramble4" && r.score; });
  if (!oppRounds.length) { noteEl.textContent = "No rounds found for this opponent at this course"; return; }
  var bestScore = Math.min.apply(null, oppRounds.map(function(r) { return r.score; }));
  var opp = PB.getPlayer(oppId);
  var oppName = opp ? (opp.name || opp.username) : "Opponent";
  noteEl.innerHTML = '<span style="color:var(--gold);font-weight:700">' + oppName + "\'s best: " + bestScore + '</span> at ' + escHtml(course) + '. Beat that to win!';
}

function submitWager() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  if (!requireVerified("create wagers")) return;
  var toUid = document.getElementById("wager-opponent").value;
  if (!toUid) { Router.toast("Pick an opponent"); return; }
  var type = document.getElementById("wager-type").value || "stroke";
  var amount = parseInt(document.getElementById("wager-amount").value) || 0;
  if (amount < 10) { Router.toast("Minimum wager is 10 coins"); return; }
  var balance = getParCoinBalance(currentUser.uid);
  var totalCost = type === "nassau" ? amount * 3 : amount;
  if (totalCost > balance) { Router.toast("Not enough coins (need " + totalCost + ", have " + balance + ")"); return; }

  var course = (document.getElementById("wager-course").value || "").trim();
  var visibility = document.getElementById("wager-visibility").value || "public";
  var opponent = PB.getPlayer(toUid);
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "Challenger";
  var oppName = opponent ? (opponent.name || opponent.username) : "Opponent";

  // Escrow: deduct coins from challenger — MUST succeed before creating wager
  if (!deductCoins(currentUser.uid, totalCost, "wager_escrow", "Wager escrow: " + WAGER_TYPES[type].label + " vs " + oppName)) return;

  // Create wager doc (with escrow tracking)
  db.collection("wagers").add(leagueDoc("wagers", {
    fromUid: currentUser.uid,
    fromName: myName,
    toUid: toUid,
    toName: oppName,
    type: type,
    amount: amount,
    course: course,
    visibility: visibility,
    status: "pending",
    escrowFrom: totalCost,
    escrowTo: 0,
    createdAt: fsTimestamp()
  })).then(function(docRef) {
    // Notify opponent
    sendNotification(toUid, {
      type: "wager_challenge",
      title: myName + " challenged you!",
      message: WAGER_TYPES[type].label + " for " + totalCost + " ParCoins" + (course ? " at " + course : ""),
      page: "wagers"
    });
    // Post to feed if public
    if (visibility === "public") {
      db.collection("chat").add(leagueDoc("chat", {
        id: genId(), text: myName + " challenged " + oppName + " to a " + WAGER_TYPES[type].label + " wager for " + totalCost + " ParCoins" + (course ? " at " + course : "") + "!",
        authorId: "system", authorName: "Parbaughs", createdAt: fsTimestamp()
      })).catch(function(){});
    }
    Router.toast("Challenge sent to " + oppName + "!");
    Router.go("wagers");
  }).catch(function(err) { Router.toast(pbErrMsg(err, "Couldn't send the wager.")); });
}

function acceptWager(wagerId) {
  if (!currentUser || !db) return;
  db.collection("wagers").doc(wagerId).get().then(function(doc) {
    if (!doc.exists) { Router.toast("Wager not found"); return; }
    var w = doc.data();
    if (w.status !== "pending" || w.toUid !== currentUser.uid) { Router.toast("Can't accept this wager"); return; }
    var totalCost = w.type === "nassau" ? w.amount * 3 : w.amount;
    // Escrow: deduct coins from accepter — MUST succeed
    if (!deductCoins(currentUser.uid, totalCost, "wager_escrow", "Wager escrow: " + (WAGER_TYPES[w.type] || {label:w.type}).label + " vs " + w.fromName)) return;
    // Update wager status with escrow tracking
    db.collection("wagers").doc(wagerId).update({ status: "accepted", escrowTo: totalCost, acceptedAt: fsTimestamp() }).then(function() {
      sendNotification(w.fromUid, {
        type: "wager_accepted",
        title: (currentProfile ? currentProfile.name : "Your opponent") + " accepted your wager!",
        message: (WAGER_TYPES[w.type] || {label:w.type}).label + " for " + totalCost + " ParCoins",
        page: "wagers"
      });
      Router.toast("Wager accepted! Game on.");
      Router.go("wagers", {}, true);
    });
  }).catch(function(err) { Router.toast(pbErrMsg(err, "Couldn't accept the wager.")); });
}

function declineWager(wagerId) {
  if (!currentUser || !db) return;
  db.collection("wagers").doc(wagerId).get().then(function(doc) {
    if (!doc.exists) return;
    var w = doc.data();
    if (w.status !== "pending" || w.toUid !== currentUser.uid) return;
    // Refund challenger's escrow
    var totalCost = w.type === "nassau" ? w.amount * 3 : w.amount;
    awardCoins(w.fromUid, totalCost, "wager_refund", "Wager declined, coins refunded");
    db.collection("wagers").doc(wagerId).update({ status: "declined", declinedAt: fsTimestamp() }).then(function() {
      sendNotification(w.fromUid, {
        type: "wager_declined",
        message: (currentProfile ? currentProfile.name : "Your opponent") + " declined your wager. Coins refunded.",
        page: "wagers"
      });
      Router.toast("Wager declined");
      Router.go("wagers", {}, true);
    });
  });
}

/* ── Auto-resolution: called after a round is logged ──
   Checks if any active wagers can be resolved based on new round data. */
function checkWagerResolution(round) {
  if (!db || !currentUser) return;
  var uid = currentUser.uid;
  leagueQuery("wagers").where("status", "==", "accepted").get().then(function(snap) {
    snap.forEach(function(doc) {
      var w = Object.assign({_id: doc.id}, doc.data());
      // Must involve this player
      if (w.fromUid !== uid && w.toUid !== uid) return;
      var oppUid = w.fromUid === uid ? w.toUid : w.fromUid;
      // If course-specific, round must match
      if (w.course && round.course !== w.course) return;
      // Beat Their Score: only the challenger needs to play
      if (w.type === "beatscore") {
        if (uid === w.fromUid) { _resolveWager(w, round, round, uid, oppUid); }
        return;
      }
      // All other types: find opponent's round at same course on same date
      var oppRounds = PB.getPlayerRounds(oppUid);
      var oppRound = oppRounds.find(function(r) { return r.course === round.course && r.date === round.date; });
      if (!oppRound) return; // opponent hasn't played yet
      // Both players have a round — resolve!
      _resolveWager(w, round, oppRound, uid, oppUid);
    });
  }).catch(function(){});
}

function _resolveWager(w, myRound, oppRound, myUid, oppUid) {
  var totalPot = w.type === "nassau" ? w.amount * 6 : w.amount * 2; // both players contributed
  var winner = null;
  var detail = "";

  if (w.type === "stroke") {
    if (myRound.score < oppRound.score) winner = myUid;
    else if (oppRound.score < myRound.score) winner = oppUid;
    else winner = "tie";
    detail = myRound.score + " vs " + oppRound.score;
  } else if (w.type === "best9") {
    var my9 = _bestNine(myRound);
    var opp9 = _bestNine(oppRound);
    if (my9 < opp9) winner = myUid;
    else if (opp9 < my9) winner = oppUid;
    else winner = "tie";
    detail = "Best 9: " + my9 + " vs " + opp9;
  } else if (w.type === "pars") {
    var myPars = _countPars(myRound);
    var oppPars = _countPars(oppRound);
    if (myPars > oppPars) winner = myUid;
    else if (oppPars > myPars) winner = oppUid;
    else winner = "tie";
    detail = "Pars: " + myPars + " vs " + oppPars;
  } else if (w.type === "putts") {
    var myPutts = _countPutts(myRound);
    var oppPutts = _countPutts(oppRound);
    if (myPutts > 0 && oppPutts > 0) {
      if (myPutts < oppPutts) winner = myUid;
      else if (oppPutts < myPutts) winner = oppUid;
      else winner = "tie";
    } else { winner = "tie"; }
    detail = "Putts: " + myPutts + " vs " + oppPutts;
  } else if (w.type === "beatscore") {
    // Challenger (fromUid) must beat opponent's best at this course
    var challengerRound = w.fromUid === myUid ? myRound : oppRound;
    var targetUid = w.fromUid === myUid ? oppUid : myUid;
    var targetRounds = PB.getPlayerRounds(targetUid).filter(function(r) { return r.course === w.course && r.format !== "scramble" && r.score; });
    var targetBest = targetRounds.length ? Math.min.apply(null, targetRounds.map(function(r){return r.score})) : 999;
    if (challengerRound.score < targetBest) { winner = w.fromUid; detail = "Shot " + challengerRound.score + " vs target " + targetBest + ". BEAT IT!"; }
    else if (challengerRound.score === targetBest) { winner = "tie"; detail = "Shot " + challengerRound.score + " vs target " + targetBest + ". Tied!"; }
    else { winner = w.toUid; detail = "Shot " + challengerRound.score + " vs target " + targetBest + ". Didn't beat it."; }
  } else if (w.type === "nassau") {
    var res = _resolveNassau(myRound, oppRound, myUid, oppUid, w.amount);
    winner = res.overallWinner;
    detail = res.detail;
    // Nassau distributes per-bet, not winner-take-all
    if (res.fromPayout > 0) awardCoins(myUid, res.fromPayout, "wager_win", "Nassau win vs " + (w.fromUid === myUid ? w.toName : w.fromName));
    if (res.toPayout > 0) awardCoins(oppUid, res.toPayout, "wager_win", "Nassau win vs " + (w.fromUid === oppUid ? w.toName : w.fromName));
    db.collection("wagers").doc(w._id).update({
      status: "completed", winner: winner, resultDetail: detail, completedAt: fsTimestamp(),
      myScore: myRound.score, oppScore: oppRound.score
    });
    return;
  }

  // Standard resolution (non-Nassau)
  if (winner === "tie") {
    // Refund both
    var refund = totalPot / 2;
    awardCoins(myUid, refund, "wager_tie", "Wager tied, coins refunded");
    awardCoins(oppUid, refund, "wager_tie", "Wager tied, coins refunded");
  } else {
    awardCoins(winner, totalPot, "wager_win", "Won wager: " + detail);
  }

  db.collection("wagers").doc(w._id).update({
    status: "completed", winner: winner, resultDetail: detail, completedAt: fsTimestamp(),
    myScore: myRound.score, oppScore: oppRound.score
  });

  // Notify both players
  var winnerName = winner === myUid ? "You" : (PB.getPlayer(winner) || {}).name || "Opponent";
  [myUid, oppUid].forEach(function(pid) {
    sendNotification(pid, { type: "wager_result", title: "Wager resolved!", message: detail + " " + (winner === "tie" ? "It's a tie! Coins refunded." : winnerName + " wins " + totalPot + " ParCoins!"), page: "wagers" });
  });
}

function _bestNine(round) {
  var scores = round.holeScores || [];
  if (scores.length < 9) return round.score;
  var front = 0, back = 0;
  for (var i = 0; i < 9; i++) front += parseInt(scores[i]) || 0;
  for (var j = 9; j < Math.min(18, scores.length); j++) back += parseInt(scores[j]) || 0;
  return Math.min(front, back || 999);
}

function _countPars(round) {
  var scores = round.holeScores || [];
  var pars = round.holePars || [];
  var count = 0;
  for (var i = 0; i < scores.length; i++) {
    var s = parseInt(scores[i]);
    var p = pars[i] || 4;
    if (s && s <= p) count++;
  }
  return count;
}

function _countPutts(round) {
  var putts = round.puttsData || [];
  var total = 0;
  for (var i = 0; i < putts.length; i++) total += (putts[i] || 0);
  return total;
}

function _resolveNassau(myRound, oppRound, myUid, oppUid, betPerLeg) {
  var myScores = myRound.holeScores || [];
  var oppScores = oppRound.holeScores || [];
  var myFront = 0, myBack = 0, oppFront = 0, oppBack = 0;
  for (var i = 0; i < 9; i++) { myFront += parseInt(myScores[i]) || 0; oppFront += parseInt(oppScores[i]) || 0; }
  for (var j = 9; j < 18; j++) { myBack += parseInt(myScores[j]) || 0; oppBack += parseInt(oppScores[j]) || 0; }
  var myTotal = myRound.score, oppTotal = oppRound.score;
  var myPayout = 0, oppPayout = 0;
  var legs = [];
  // Front 9
  if (myFront < oppFront) { myPayout += betPerLeg * 2; legs.push("F9: " + myFront + "-" + oppFront + " W"); }
  else if (oppFront < myFront) { oppPayout += betPerLeg * 2; legs.push("F9: " + myFront + "-" + oppFront + " L"); }
  else { myPayout += betPerLeg; oppPayout += betPerLeg; legs.push("F9: " + myFront + "-" + oppFront + " T"); }
  // Back 9
  if (myBack < oppBack) { myPayout += betPerLeg * 2; legs.push("B9: " + myBack + "-" + oppBack + " W"); }
  else if (oppBack < myBack) { oppPayout += betPerLeg * 2; legs.push("B9: " + myBack + "-" + oppBack + " L"); }
  else { myPayout += betPerLeg; oppPayout += betPerLeg; legs.push("B9: " + myBack + "-" + oppBack + " T"); }
  // Total
  if (myTotal < oppTotal) { myPayout += betPerLeg * 2; legs.push("18: " + myTotal + "-" + oppTotal + " W"); }
  else if (oppTotal < myTotal) { oppPayout += betPerLeg * 2; legs.push("18: " + myTotal + "-" + oppTotal + " L"); }
  else { myPayout += betPerLeg; oppPayout += betPerLeg; legs.push("18: " + myTotal + "-" + oppTotal + " T"); }

  var overallWinner = myPayout > oppPayout ? myUid : oppPayout > myPayout ? oppUid : "tie";
  return { overallWinner: overallWinner, fromPayout: myPayout, toPayout: oppPayout, detail: "Nassau: " + legs.join(" | ") };
}

function showWagerCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-wager-course",
    function(c) { return "document.getElementById('wager-course').value='" + c.name.replace(/'/g, "\\'") + "';document.getElementById('search-wager-course').innerHTML=''"; },
    function(v) { return ""; }
  );
}
