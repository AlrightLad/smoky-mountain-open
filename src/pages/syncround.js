// ========== SYNCED ROUND (Real-time Multiplayer Scorecard) ==========
var activeSyncRound = null;
var syncRoundListener = null;

Router.register("syncround", function(params) {
  if (params && params.roundId) {
    joinSyncRound(params.roundId);
    return;
  }
  renderSyncRoundSetup();
});

function renderSyncRoundSetup() {
  var h = '<div class="sh"><h2>Parbaugh Round</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  h += '<div style="text-align:center;padding:20px 16px"><div style="font-size:11px;color:var(--muted);line-height:1.6">Play together on one shared scorecard. Everyone sees scores update in real-time. Counts as one round for each player — no double XP.</div></div>';
  
  // Start new Parbaugh Round
  h += '<div class="form-section"><div class="form-title">Start a Parbaugh Round</div>';
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="sync-course" placeholder="Start typing..." oninput="showSyncCourseSearch(this)"><div id="search-sync-course" class="search-results"></div></div>';
  h += '<input type="hidden" id="sync-rating" value=""><input type="hidden" id="sync-slope" value="">';
  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="sync-format"><option value="stroke">Stroke play</option><option value="parbaugh">Parbaugh Stroke Play (handicap-adjusted)</option><option value="stableford">Stableford</option><option value="scramble">Scramble</option><option value="bestball">Best Ball</option><option value="match">Match Play</option><option value="skins">Skins</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Holes</label><select class="ff-input" id="sync-holes"><option value="18">18 holes</option><option value="front9">Front 9 (holes 1–9)</option><option value="back9">Back 9 (holes 10–18)</option></select></div>';
  h += '<button class="btn full green" onclick="createSyncRound()">Create Parbaugh Round</button>';
  h += '</div>';
  
  // Join existing
  h += '<div class="form-section"><div class="form-title">Join a Round</div>';
  h += '<div id="openSyncRounds"><div class="loading"><div class="spinner"></div>Looking for active rounds...</div></div>';
  h += '</div>';
  
  document.querySelector('[data-page="syncround"]').innerHTML = h;
  
  // Load open Parbaugh Rounds
  if (db) {
    leagueQuery("syncrounds").where("status","==","active").get().then(function(snap) {
      var rounds = []; snap.forEach(function(doc) { rounds.push(Object.assign({_id:doc.id}, doc.data())); });
      rounds.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
      rounds = rounds.slice(0, 10);
      var el = document.getElementById("openSyncRounds");
      if (!el) return;
      if (!rounds.length) { el.innerHTML = '<div style="font-size:11px;color:var(--muted);text-align:center;padding:12px">No active Parbaugh Rounds. Start one above!</div>'; return; }
      var rh = '';
      rounds.forEach(function(r) {
        var playerCount = r.players ? Object.keys(r.players).length : 0;
        rh += '<div class="card" style="cursor:pointer" onclick="Router.go(\'syncround\',{roundId:\'' + r._id + '\'})">';
        rh += '<div class="card-body"><div style="font-size:14px;font-weight:600;color:var(--cream)">' + escHtml(r.courseName || "Unknown Course") + '</div>';
        rh += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + r.format + ' · ' + playerCount + ' player' + (playerCount!==1?'s':'') + ' · Started by ' + escHtml(r.createdByName || "") + '</div>';
        rh += '<div style="font-size:10px;color:var(--gold);margin-top:4px">Tap to join →</div>';
        rh += '</div></div>';
      });
      el.innerHTML = rh;
    }).catch(function() { var el = document.getElementById("openSyncRounds"); if (el) el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Could not load</div>'; });
  }
}

function showSyncCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-sync-course",
    function(c) { return "document.getElementById('sync-course').value='" + c.name.replace(/'/g, "\\'") + "';document.getElementById('search-sync-course').innerHTML='';document.getElementById('sync-rating').value='" + c.rating + "';document.getElementById('sync-slope').value='" + c.slope + "'"; },
    function(val) { return "quickAddCourse('" + val.replace(/'/g, "\\'") + "')"; }
  );
}

function createSyncRound() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Sign in required"); return; }
  var courseName = document.getElementById("sync-course").value;
  if (!courseName) { Router.toast("Pick a course"); return; }
  var format = document.getElementById("sync-format").value;
  var rating = parseFloat(document.getElementById("sync-rating").value) || 72;
  var slope = parseInt(document.getElementById("sync-slope").value) || 113;
  var holesEl = document.getElementById("sync-holes");
  var holesMode = holesEl ? holesEl.value : "18"; // "18", "front9", "back9"
  var startHole = holesMode === "back9" ? 9 : 0;
  
  var myId = currentUser.uid;
  var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Unknown";
  var players = {};
  players[myId] = { name: myName, scores: Array(18).fill(""), joinedAt: new Date().toISOString() };
  
  db.collection("syncrounds").add(leagueDoc("syncrounds", {
    courseName: courseName,
    rating: rating,
    slope: slope,
    format: format,
    holesMode: holesMode,
    status: "active",
    players: players,
    currentHole: startHole,
    createdBy: myId,
    createdByName: myName,
    createdAt: fsTimestamp()
  })).then(function(docRef) {
    Router.toast("Synced round created! Share with your group.");
    Router.go("syncround", { roundId: docRef.id });
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function joinSyncRound(roundId) {
  if (!db || !currentUser) { Router.toast("Sign in required"); return; }
  
  // Show loading
  document.querySelector('[data-page="syncround"]').innerHTML = '<div class="loading"><div class="spinner"></div>Joining round...</div>';
  
  var myId = currentUser.uid;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "Unknown";
  
  // Add self to players if not already in
  var playerField = "players." + myId;
  var update = {};
  update[playerField] = { name: myName, scores: Array(18).fill(""), joinedAt: new Date().toISOString() };
  
  db.collection("syncrounds").doc(roundId).update(update).then(function() {
    activeSyncRound = roundId;
    startSyncRoundListener(roundId);
  }).catch(function(e) { Router.toast("Failed to join: " + e.message); Router.go("rounds"); });
}

function startSyncRoundListener(roundId) {
  if (syncRoundListener) syncRoundListener();
  
  syncRoundListener = db.collection("syncrounds").doc(roundId).onSnapshot(function(doc) {
    if (!doc.exists) { Router.toast("Round not found"); Router.go("rounds"); return; }
    renderSyncRoundLive(Object.assign({ _id: doc.id }, doc.data()));
  });
}

function renderSyncRoundLive(round) {
  var myId = currentUser ? currentUser.uid : null;
  var players = round.players || {};
  var playerIds = Object.keys(players);
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  
  var h = '<div style="padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-size:14px;font-weight:600">' + escHtml(round.courseName) + '</div>';
  h += '<div style="font-size:10px;color:var(--muted)">' + round.format + ' · ' + playerIds.length + ' players · Live</div></div>';
  h += '<div style="display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:var(--birdie);animation:pulse 2s infinite"></div><span style="font-size:10px;color:var(--birdie)">LIVE</span></div>';
  h += '</div>';
  
  // Scorecard table
  h += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">';
  h += '<table style="min-width:' + (80 + playerIds.length * 65) + 'px"><thead><tr><th>H</th><th>Par</th>';
  playerIds.forEach(function(pid) {
    var isMe = pid === myId;
    h += '<th class="g" style="' + (isMe ? 'color:var(--gold)' : '') + '">' + escHtml(players[pid].name.split(" ")[0]) + '</th>';
  });
  h += '</tr></thead><tbody>';
  
  var totals = {};
  playerIds.forEach(function(pid) { totals[pid] = 0; });
  var parTotal = 0;
  var syncStartHole = round.holesMode === "back9" ? 9 : 0;
  var syncEndHole = round.holesMode === "front9" ? 9 : 18;
  
  for (var i = syncStartHole; i < syncEndHole; i++) {
    if (i === 9 && syncStartHole === 0) {
      // OUT row
      h += '<tr class="sr"><td>OUT</td><td>' + defaultPar.slice(0,9).reduce(function(a,b){return a+b},0) + '</td>';
      playerIds.forEach(function(pid) {
        var front = 0; for (var f=0;f<9;f++) { var v=parseInt(players[pid].scores[f]); if(!isNaN(v)) front+=v; }
        h += '<td>' + (front||"—") + '</td>';
      });
      h += '</tr>';
    }
    var par = defaultPar[i] || 4;
    parTotal += par;
    var rowClass = i % 2 === 0 ? "r0" : "r1";
    h += '<tr class="' + rowClass + '"><td>' + (i+1) + '</td><td class="' + (par===3?"p3":par===5?"p5":"p4") + '">' + par + '</td>';
    
    playerIds.forEach(function(pid) {
      var v = players[pid].scores[i];
      var isMe = pid === myId;
      var val = v !== "" && v !== null && v !== undefined ? parseInt(v) : "";
      if (val !== "") totals[pid] += val;
      
      if (isMe) {
        // Editable input for my scores
        var sc = val !== "" ? scoreClass(val, par) : "";
        h += '<td><input type="number" inputmode="numeric" class="s ' + sc + '" value="' + (val !== "" ? val : "") + '" onfocus="this.select()" onchange="updateSyncScore(\'' + round._id + '\',' + i + ',this.value)"></td>';
      } else {
        // Read-only display for others
        var sc = val !== "" ? scoreClass(val, par) : "";
        h += '<td><div class="s ' + sc + '" style="display:inline-flex;align-items:center;justify-content:center;border:none;background:' + (sc?"rgba(var(--gold-rgb),.05)":"transparent") + '">' + (val !== "" ? val : "·") + '</div></td>';
      }
    });
    h += '</tr>';
  }
  
  // IN row — only for 18-hole rounds
  if (syncEndHole === 18 && syncStartHole === 0) {
    h += '<tr class="sr"><td>IN</td><td>' + defaultPar.slice(9).reduce(function(a,b){return a+b},0) + '</td>';
    playerIds.forEach(function(pid) {
      var back = 0; for (var f=9;f<18;f++) { var v=parseInt(players[pid].scores[f]); if(!isNaN(v)) back+=v; }
      h += '<td>' + (back||"—") + '</td>';
    });
    h += '</tr>';
  }
  
  // TOTAL row
  h += '<tr class="ttr"><td>TOT</td><td>' + parTotal + '</td>';
  playerIds.forEach(function(pid) {
    h += '<td>' + (totals[pid] || "—") + '</td>';
  });
  h += '</tr></tbody></table></div>';
  
  // Finish & Discard buttons
  if (round.createdBy === myId || (currentProfile && currentProfile.role === "commissioner")) {
    h += '<div class="section" style="display:flex;gap:8px">';
    h += '<button class="btn full" style="flex:1;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red)" onclick="finishSyncRound(\'' + round._id + '\')">Finish Round</button>';
    h += '<button class="btn full" style="flex:1;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red);opacity:.7" onclick="discardSyncRound(\'' + round._id + '\')">Discard</button>';
    h += '</div>';
  }
  h += '<div style="text-align:center;padding:8px;font-size:10px;color:var(--muted2)">Scores sync live across all devices</div>';
  
  document.querySelector('[data-page="syncround"]').innerHTML = h;
}

function updateSyncScore(roundId, holeIndex, value) {
  if (!db || !currentUser) return;
  var val = value === "" ? "" : Math.max(1, Math.min(15, parseInt(value) || 0));
  var field = "players." + currentUser.uid + ".scores";
  
  // Get current scores, update the hole, write back
  db.collection("syncrounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var myScores = data.players[currentUser.uid].scores.slice();
    myScores[holeIndex] = val;
    var update = {};
    update["players." + currentUser.uid + ".scores"] = myScores;
    return db.collection("syncrounds").doc(roundId).update(update);
  }).catch(function(e) { pbWarn("[Sync] Score update failed:", e.message); });
}

function finishSyncRound(roundId) {
  if (!confirm("Finish this round? Scores will be saved to each player's history.")) return;
  if (!db) return;
  
  db.collection("syncrounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var players = data.players || {};
    
    // Create individual rounds for each player — minimum 9 holes required
    var holesMode = data.holesMode || "18";
    var startHole = holesMode === "back9" ? 9 : 0;
    var endHole = holesMode === "front9" ? 9 : 18;
    var playerIds = [];
    var skipped = [];
    Object.keys(players).forEach(function(pid) {
      var p = players[pid];
      var scores = p.scores || [];
      // Count scored holes within the selected range only
      var holesPlayed = 0, total = 0;
      for (var hi = startHole; hi < endHole; hi++) {
        var s = scores[hi];
        if (s !== "" && s !== null && s !== undefined) { holesPlayed++; total += parseInt(s) || 0; }
      }
      if (holesPlayed < 9) { skipped.push(p.name || pid); return; }
      var is9 = holesPlayed <= 9;
      var round = {
        id: genId(),
        player: pid,
        playerId: pid,
        playerName: p.name,
        course: data.courseName,
        score: total,
        holeScores: scores.slice(startHole, endHole),
        holesPlayed: holesPlayed,
        holesMode: holesMode,
        date: localDateStr(),
        rating: is9 ? (data.rating || 72) / 2 : (data.rating || 72),
        slope: data.slope || 113,
        format: data.format,
        visibility: "public",
        syncedRound: true,
        syncRoundId: roundId
      };
      db.collection("rounds").doc(round.id).set(Object.assign({}, round, { createdAt: fsTimestamp() }));
      var localPlayer = PB.getPlayer(pid);
      if (localPlayer) PB.addRound(round);
      playerIds.push(pid);
    });
    
    if (playerIds.length === 0) {
      Router.toast("Need at least 9 holes scored per player");
      return Promise.reject("not enough holes");
    }
    if (skipped.length) Router.toast(skipped.join(", ") + " skipped — need 9+ holes");
    
    // Persist updated stats for all saved players
    setTimeout(function() {
      playerIds.forEach(function(pid) { persistPlayerStats(pid); });
    }, 2000);
    
    // Mark Parbaugh Round as completed
    return db.collection("syncrounds").doc(roundId).update({ status: "completed", completedAt: fsTimestamp() });
  }).then(function() {
    if (syncRoundListener) { syncRoundListener(); syncRoundListener = null; }
    Router.toast("Round finished! Scores saved.");
    Router.go("rounds");
  }).catch(function(e) {
    if (e !== "not enough holes") pbWarn("[SyncRound] finish failed:", e);
  });
}

function discardSyncRound(roundId) {
  if (!confirm("Discard this Parbaugh Round? No scores will be saved.")) return;
  if (!db) return;
  db.collection("syncrounds").doc(roundId).update({ status: "discarded", completedAt: fsTimestamp() }).then(function() {
    if (syncRoundListener) { syncRoundListener(); syncRoundListener = null; }
    Router.toast("Round discarded.");
    Router.go("home");
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}
