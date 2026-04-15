/* ================================================
   PAGE: WAGERS — ParCoin head-to-head betting
   Wager types: stroke play, best 9, most pars, fewest putts, Nassau
   Escrow: coins locked on accept, released on resolution.
   ParCoins are cosmetic-only with zero real-world cash value.
   ================================================ */

var WAGER_TYPES = {
  stroke:   {label: "Stroke Play",    desc: "Lower total score wins",                icon: "S"},
  best9:    {label: "Best 9",         desc: "Best front or back 9 wins",             icon: "9"},
  pars:     {label: "Most Pars",      desc: "Most pars (or better) wins",            icon: "P"},
  putts:    {label: "Fewest Putts",   desc: "Fewer total putts wins",                icon: "T"},
  nassau:   {label: "Nassau",         desc: "3 bets: front 9, back 9, and total",    icon: "N"}
};

Router.register("wagers", function(params) {
  if (params && params.create) { renderCreateWager(params.opponent); return; }
  renderWagerList();
});

function renderWagerList() {
  var uid = currentUser ? currentUser.uid : null;
  var h = '<div class="sh"><h2>Wagers</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'home\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'wagers\',{create:true})">+ New Wager</button></div></div>';

  // Balance
  var balance = getParCoinBalance(uid);
  h += '<div style="padding:0 16px 12px;display:flex;align-items:center;gap:8px">';
  h += '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="var(--gold)" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg>';
  h += '<span style="font-size:14px;font-weight:700;color:var(--gold)">' + balance + '</span>';
  h += '<span style="font-size:10px;color:var(--muted)">available to wager</span>';
  h += '</div>';

  // Active wagers
  h += '<div id="wager-list"><div class="loading"><div class="spinner"></div>Loading wagers...</div></div>';

  h += renderPageFooter();
  document.querySelector('[data-page="wagers"]').innerHTML = h;

  // Async load wagers from Firestore
  if (db && uid) {
    db.collection("wagers").orderBy("createdAt", "desc").limit(50).get().then(function(snap) {
      var wagers = [];
      snap.forEach(function(doc) { wagers.push(Object.assign({_id: doc.id}, doc.data())); });
      // Filter to active wagers involving this user
      var mine = wagers.filter(function(w) { return (w.status === "pending" || w.status === "accepted") && (w.fromUid === uid || w.toUid === uid); });
      var el = document.getElementById("wager-list");
      if (!el) return;
      if (!mine.length) {
        el.innerHTML = '<div class="empty" style="padding:32px"><div style="font-size:28px;margin-bottom:6px"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div class="empty-text" style="color:var(--gold)">Ready to put your coins on the line?</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">Challenge a friend and bet ParCoins on who plays better</div><button class="btn green" onclick="Router.go(\'wagers\',{create:true})" style="margin-top:12px;font-size:12px">Start a Wager</button></div>';
        // Show completed wagers below
        _loadCompletedWagers(uid, el);
        return;
      }
      var wh = '';
      mine.forEach(function(w) { wh += _renderWagerCard(w, uid); });
      el.innerHTML = '<div class="section"><div class="sec-head"><span class="sec-title">Active wagers</span></div>' + wh + '</div>';
      _loadCompletedWagers(uid, el);
    }).catch(function(err) {
      pbWarn("[Wagers]", err.message);
      var el = document.getElementById("wager-list");
      if (el) el.innerHTML = '<div class="empty" style="padding:32px"><div style="font-size:28px;margin-bottom:6px"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div class="empty-text" style="color:var(--gold)">Ready to put your coins on the line?</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">Challenge a friend and bet ParCoins on who plays better</div><button class="btn green" onclick="Router.go(\'wagers\',{create:true})" style="margin-top:12px;font-size:12px">Start a Wager</button></div>';
    });
  }
}

function _loadCompletedWagers(uid, appendTo) {
  db.collection("wagers").where("status", "==", "completed").orderBy("completedAt", "desc").limit(15).get().then(function(snap) {
    var completed = [];
    snap.forEach(function(doc) {
      var w = Object.assign({_id: doc.id}, doc.data());
      if (w.fromUid === uid || w.toUid === uid) completed.push(w);
    });
    if (!completed.length) return;
    var ch = '<div class="section" style="margin-top:8px"><div class="sec-head"><span class="sec-title">Past wagers</span></div>';
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
  var statusColor = w.status === "pending" ? "var(--gold)" : w.status === "accepted" ? "var(--birdie)" : w.status === "completed" ? "var(--muted)" : "var(--red)";
  var statusLabel = w.status === "pending" ? "PENDING" : w.status === "accepted" ? "ACTIVE" : w.status === "completed" ? (w.winner === uid ? "WON" : w.winner === "tie" ? "TIE" : "LOST") : w.status.toUpperCase();
  var statusBg = w.winner === uid ? "rgba(var(--birdie-rgb),.08)" : w.winner === "tie" ? "rgba(var(--gold-rgb),.06)" : w.status === "completed" ? "rgba(var(--red-rgb),.06)" : "transparent";

  var h = '<div class="card" style="background:' + statusBg + '">';
  h += '<div style="padding:14px 16px">';
  // Header: type icon + opponent + amount
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
  h += '<div style="display:flex;align-items:center;gap:10px">';
  h += '<div style="width:32px;height:32px;border-radius:50%;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--gold)">' + type.icon + '</div>';
  h += '<div><div style="font-size:13px;font-weight:700;color:var(--cream)">' + escHtml(myName) + ' vs ' + escHtml(oppName) + '</div>';
  h += '<div style="font-size:10px;color:var(--muted)">' + type.label + (w.course ? ' · ' + escHtml(w.course) : '') + '</div></div></div>';
  h += '<div style="text-align:right"><div style="font-size:16px;font-weight:700;color:var(--gold)">' + coinAmt + '</div>';
  h += '<div style="font-size:8px;font-weight:700;color:' + statusColor + ';letter-spacing:.5px">' + statusLabel + '</div></div>';
  h += '</div>';
  // Actions
  if (w.status === "pending" && !isFrom) {
    h += '<div style="display:flex;gap:6px">';
    h += '<button class="btn-sm green" style="flex:1" onclick="acceptWager(\'' + w._id + '\')">Accept (' + w.amount + ' coins)</button>';
    h += '<button class="btn-sm outline" style="flex:1;color:var(--red);border-color:rgba(var(--red-rgb),.2)" onclick="declineWager(\'' + w._id + '\')">Decline</button>';
    h += '</div>';
  } else if (w.status === "pending" && isFrom) {
    h += '<div style="font-size:10px;color:var(--muted);font-style:italic">Waiting for ' + escHtml(oppName) + ' to accept...</div>';
  }
  // Result details for completed
  if (w.status === "completed" && w.resultDetail) {
    h += '<div style="font-size:10px;color:var(--muted);margin-top:4px;border-top:1px solid var(--border);padding-top:6px">' + escHtml(w.resultDetail) + '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderCreateWager(presetOpponent) {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);
  var players = PB.getPlayers().filter(function(p) { return p.id !== uid && p.role !== "removed"; });

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

  // Wager type
  h += '<div class="ff"><label class="ff-label">Wager type</label>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="wager-types">';
  Object.keys(WAGER_TYPES).forEach(function(key) {
    var wt = WAGER_TYPES[key];
    h += '<div onclick="selectWagerType(\'' + key + '\')" id="wt-' + key + '" style="cursor:pointer;padding:12px;border:1px solid var(--border);border-radius:var(--radius);text-align:center;transition:border-color .15s">';
    h += '<div style="font-size:20px;font-weight:800;color:var(--gold);margin-bottom:2px">' + wt.icon + '</div>';
    h += '<div style="font-size:11px;font-weight:600;color:var(--cream)">' + wt.label + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + wt.desc + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<input type="hidden" id="wager-type" value="stroke"></div>';

  // Course (optional)
  h += '<div class="ff"><label class="ff-label">Course (optional — leave blank for any)</label>';
  h += '<input type="text" class="ff-input" id="wager-course" placeholder="Any course" oninput="showWagerCourseSearch(this)"></div>';
  h += '<div id="search-wager-course"></div>';

  // Amount
  h += '<div class="ff"><label class="ff-label">Coins to wager (you have ' + balance + ')</label>';
  h += '<div style="display:flex;gap:6px">';
  [25, 50, 100, 200].forEach(function(amt) {
    var disabled = balance < amt ? ' style="opacity:.3;pointer-events:none"' : '';
    h += '<button class="btn-sm outline" onclick="document.getElementById(\'wager-amount\').value=' + amt + ';document.querySelectorAll(\'#wager-amounts .btn-sm\').forEach(function(b){b.style.background=\'transparent\'});this.style.background=\'rgba(var(--gold-rgb),.1)\'"' + disabled + '>' + amt + '</button>';
  });
  h += '</div>';
  h += '<input type="number" class="ff-input" id="wager-amount" value="50" min="10" max="' + balance + '" style="margin-top:6px;text-align:center;font-size:18px;font-weight:700;color:var(--gold)"></div>';
  h += '<div id="wager-amounts"></div>';

  // Visibility
  h += '<div class="ff"><label class="ff-label">Visibility</label>';
  h += '<select class="ff-input" id="wager-visibility">';
  h += '<option value="public">Public (shows in feed)</option>';
  h += '<option value="private">Private (only you two see it)</option>';
  h += '</select></div>';

  // Nassau note
  h += '<div id="nassau-note" style="display:none;padding:8px 12px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius);font-size:10px;color:var(--muted);margin-bottom:12px">Nassau wagers are 3 separate bets (front 9, back 9, total). The coin amount is per bet, so a 50-coin Nassau costs 150 total.</div>';

  // Submit
  h += '<button class="btn full green" onclick="submitWager()" style="font-size:14px;padding:14px;font-weight:600">Send Challenge</button>';
  h += '<div style="font-size:9px;color:var(--muted2);text-align:center;margin-top:8px">Coins are held in escrow until the wager resolves. Zero real-world cash value.</div>';
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
    if (el) el.style.borderColor = key === type ? "var(--gold)" : "var(--border)";
    if (el) el.style.background = key === type ? "rgba(var(--gold-rgb),.06)" : "transparent";
  });
  var nassauNote = document.getElementById("nassau-note");
  if (nassauNote) nassauNote.style.display = type === "nassau" ? "block" : "none";
}

function submitWager() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
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

  // Escrow: deduct coins from challenger
  awardCoins(currentUser.uid, -totalCost, "wager_escrow", "Wager escrow: " + WAGER_TYPES[type].label + " vs " + oppName, "escrow_" + Date.now());

  // Create wager doc
  db.collection("wagers").add({
    fromUid: currentUser.uid,
    fromName: myName,
    toUid: toUid,
    toName: oppName,
    type: type,
    amount: amount,
    course: course,
    visibility: visibility,
    status: "pending",
    createdAt: fsTimestamp()
  }).then(function(docRef) {
    // Notify opponent
    sendNotification(toUid, {
      type: "wager_challenge",
      title: myName + " challenged you!",
      message: WAGER_TYPES[type].label + " for " + totalCost + " ParCoins" + (course ? " at " + course : ""),
      page: "wagers"
    });
    // Post to feed if public
    if (visibility === "public") {
      db.collection("chat").add({
        id: genId(), text: myName + " challenged " + oppName + " to a " + WAGER_TYPES[type].label + " wager for " + totalCost + " ParCoins" + (course ? " at " + course : "") + "!",
        authorId: "system", authorName: "Parbaughs", createdAt: fsTimestamp()
      }).catch(function(){});
    }
    Router.toast("Challenge sent to " + oppName + "!");
    Router.go("wagers");
  }).catch(function(err) { Router.toast("Failed: " + err.message); });
}

function acceptWager(wagerId) {
  if (!currentUser || !db) return;
  db.collection("wagers").doc(wagerId).get().then(function(doc) {
    if (!doc.exists) { Router.toast("Wager not found"); return; }
    var w = doc.data();
    if (w.status !== "pending" || w.toUid !== currentUser.uid) { Router.toast("Can't accept this wager"); return; }
    var totalCost = w.type === "nassau" ? w.amount * 3 : w.amount;
    var balance = getParCoinBalance(currentUser.uid);
    if (totalCost > balance) { Router.toast("Not enough coins (need " + totalCost + ", have " + balance + ")"); return; }
    // Escrow: deduct coins from accepter
    awardCoins(currentUser.uid, -totalCost, "wager_escrow", "Wager escrow: " + (WAGER_TYPES[w.type] || {label:w.type}).label + " vs " + w.fromName);
    // Update wager status
    db.collection("wagers").doc(wagerId).update({ status: "accepted", acceptedAt: fsTimestamp() }).then(function() {
      sendNotification(w.fromUid, {
        type: "wager_accepted",
        title: (currentProfile ? currentProfile.name : "Your opponent") + " accepted your wager!",
        message: (WAGER_TYPES[w.type] || {label:w.type}).label + " for " + totalCost + " ParCoins",
        page: "wagers"
      });
      Router.toast("Wager accepted! Game on.");
      Router.go("wagers", {}, true);
    });
  }).catch(function(err) { Router.toast("Error: " + err.message); });
}

function declineWager(wagerId) {
  if (!currentUser || !db) return;
  db.collection("wagers").doc(wagerId).get().then(function(doc) {
    if (!doc.exists) return;
    var w = doc.data();
    if (w.status !== "pending" || w.toUid !== currentUser.uid) return;
    // Refund challenger's escrow
    var totalCost = w.type === "nassau" ? w.amount * 3 : w.amount;
    awardCoins(w.fromUid, totalCost, "wager_refund", "Wager declined — coins refunded");
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
  db.collection("wagers").where("status", "==", "accepted").get().then(function(snap) {
    snap.forEach(function(doc) {
      var w = Object.assign({_id: doc.id}, doc.data());
      // Must involve this player
      if (w.fromUid !== uid && w.toUid !== uid) return;
      var oppUid = w.fromUid === uid ? w.toUid : w.fromUid;
      // If course-specific, round must match
      if (w.course && round.course !== w.course) return;
      // Find opponent's round at same course on same date
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
    awardCoins(myUid, refund, "wager_tie", "Wager tied — coins refunded");
    awardCoins(oppUid, refund, "wager_tie", "Wager tied — coins refunded");
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
    sendNotification(pid, { type: "wager_result", title: "Wager resolved!", message: detail + " — " + (winner === "tie" ? "It's a tie! Coins refunded." : winnerName + " wins " + totalPot + " ParCoins!"), page: "wagers" });
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
