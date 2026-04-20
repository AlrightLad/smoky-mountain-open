/* ================================================
   PAGE: SCORECARD
   ================================================ */
var scState = { courseKey: null, view: "scorecard" };

Router.register("scorecard", function(params) {
  var trip = PB.getTrip(params.tripId) || PB.getTrips()[0];
  if (!trip) { Router.go("trips"); return; }
  // If course param passed (from calendar day click), select that tab
  if (params.course && trip.courses.some(function(c){return c.key === params.course})) {
    scState.courseKey = params.course;
  }
  if (!scState.courseKey && trip.courses.length) scState.courseKey = trip.courses[0].key;
  var tripPlayers = trip.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);

  // Start live score listener for this trip
  startTripScoreListener(trip.id);

  var h = '<div class="sh"><h2>' + trip.name + '</h2><button class="back" onclick="Router.back(\'trips\')">← Trips</button></div>';

  // Live indicator (only for active events)
  if (trip.status !== "closed") {
    h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px;font-size:10px;color:var(--birdie);background:rgba(var(--birdie-rgb),.05);border-bottom:1px solid var(--border)">';
    h += '<div style="width:6px;height:6px;border-radius:50%;background:var(--birdie);animation:pulse 2s infinite"></div>Live scoring — updates sync across all devices</div>';
  } else {
    h += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px;font-size:10px;color:var(--gold);background:rgba(var(--gold-rgb),.05);border-bottom:1px solid var(--border)">';
    h += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2h8v3L8 8l4 3v3H4v-3l4-3L4 5z"/></svg> Event closed — scores are final</div>';
  }

  // Commissioner controls (only for active events). Username fallback
  // preserved from v7.x for local-only profiles that never migrated.
  var isCommissioner = isFounderRole(currentProfile) || (currentProfile && (currentProfile.username === "thecommissioner" || currentProfile.username === "TheCommissioner"));
  if (isCommissioner && trip.status !== "closed") {
    var currentCourse = trip.courses.find(function(x) { return x.key === scState.courseKey; }) || trip.courses[0];
    h += '<div style="display:flex;gap:6px;padding:8px 16px">';
    h += '<button class="btn-sm green" style="flex:1;font-size:9px" onclick="announceEventStart(\'' + trip.id + '\',\'' + escHtml(currentCourse.n).replace(/'/g,"\\'") + '\')"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M2 6v4l3 1V5L2 6zM5 5l7-3v12l-7-3"/><path d="M13 7h2M13 9h2"/></svg> Announce Start</button>';
    h += '</div>';
  }

  // View toggle
  h += '<div class="toggle-bar">';
  h += '<button class="' + (scState.view === "scorecard" ? "a" : "") + '" onclick="scState.view=\'scorecard\';Router.go(\'scorecard\',{tripId:\'' + trip.id + '\'})">Scorecards</button>';
  h += '<button class="' + (scState.view === "leaderboard" ? "a" : "") + '" onclick="scState.view=\'leaderboard\';Router.go(\'scorecard\',{tripId:\'' + trip.id + '\'})">Leaderboard</button>';
  h += '<button class="' + (scState.view === "photos" ? "a" : "") + '" onclick="scState.view=\'photos\';Router.go(\'scorecard\',{tripId:\'' + trip.id + '\'})">Photos</button>';
  h += '</div>';

  if (scState.view === "leaderboard") { h += renderTripLB(trip, tripPlayers); }
  else if (scState.view === "photos") { h += renderTripPhotos(trip); }
  else { h += renderTripScorecard(trip, tripPlayers); }

  // Attestation status
  if (scState.view === "scorecard" && scState.courseKey) {
    h += renderAttestationStatus(trip.id, scState.courseKey);
  }

  // Backup
  h += '<div class="section"><div class="bk-row"><button class="btn-sm green" onclick="doCopy()">Backup</button><button class="btn-sm outline" onclick="doRestore()">Restore</button></div></div>';

  document.querySelector('[data-page="scorecard"]').innerHTML = h;
});

function renderTripScorecard(trip, tripPlayers) {
  var h = '';
  if (!trip.courses.length) return '<div class="empty"><div class="empty-icon" style="font-size:14px;color:var(--muted)">No data</div><div class="empty-text">No courses added to this trip yet</div></div>';

  // Course tabs
  h += '<div class="sc-tabs">';
  trip.courses.forEach(function(c) {
    h += '<button class="' + (scState.courseKey === c.key ? "a" : "") + '" onclick="scState.courseKey=\'' + c.key + '\';Router.go(\'scorecard\',{tripId:\'' + trip.id + '\'})">';
    h += '<div>' + c.d + '</div><div class="ts">' + c.n.split(" ")[0] + '</div></button>';
  });
  h += '</div>';

  var c = trip.courses.find(function(x) { return x.key === scState.courseKey; }) || trip.courses[0];
  var iS = c.s, pT = c.p.reduce(function(a, b) { return a + b; }, 0);
  var isComm = isFounderRole(currentProfile);
  var myUid = currentUser ? currentUser.uid : null;
  var isScorekeeper = c.scorekeeper && myUid && c.scorekeeper === myUid;
  var isRoundFinished = c.finished === true;

  h += '<div class="ci"><div><div class="nm">' + c.n + '</div><div class="dt">' + c.d + ' · ' + c.t + ' · Par ' + pT + '</div></div><div class="bd">' + c.f + '</div></div>';

  // Scorekeeper info bar
  if (c.scorekeeper) {
    var skPlayer = PB.getPlayer(c.scorekeeper);
    var skName = skPlayer ? (skPlayer.name || skPlayer.username) : "Assigned";
    h += '<div style="padding:4px 16px 8px;font-size:10px;color:var(--muted);display:flex;align-items:center;gap:4px">';
    h += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M11 2l3 3-8 8H3v-3z"/></svg>';
    h += 'Scorekeeper: <span style="color:var(--gold);font-weight:600">' + escHtml(skName) + '</span>';
    if (isRoundFinished) h += ' <span style="color:var(--birdie);margin-left:6px"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg> Scores locked</span>';
    h += '</div>';
  } else if (isComm) {
    h += '<div style="padding:4px 16px 8px;font-size:10px;color:var(--muted2)">No scorekeeper assigned — all members can enter scores</div>';
  }

  // Commissioner: assign scorekeeper
  if (isComm) {
    h += '<div style="padding:0 16px 8px;display:flex;align-items:center;gap:8px">';
    h += '<label style="font-size:10px;color:var(--muted);white-space:nowrap">Scorekeeper:</label>';
    h += '<select class="ff-input" style="flex:1;padding:6px 8px;font-size:10px" onchange="assignScorekeeper(\'' + trip.id + '\',\'' + c.key + '\',this.value)">';
    h += '<option value="">Anyone can score</option>';
    tripPlayers.forEach(function(p) {
      h += '<option value="' + p.id + '"' + (c.scorekeeper === p.id ? ' selected' : '') + '>' + escHtml(p.name || p.username) + '</option>';
    });
    h += '</select></div>';
  }

  // Mini games
  if (iS && trip.miniGames && trip.miniGames.length) {
    h += '<div class="mg"><h3>Mini-game winners</h3><div class="mgr">';
    trip.miniGames.forEach(function(g) {
      h += '<div class="mgi"><label>' + g.l + ' (' + g.p + ')</label><select onchange="PB.setMiniWinner(\'' + g.i + '\',this.value)">';
      h += '<option value="">—</option>';
      tripPlayers.forEach(function(p) { var mw = PB.getMiniWinner(g.i); var isWinner = mw === p.id || PB.getAllPlayerIds(p.id).indexOf(mw) !== -1; h += '<option value="' + p.id + '"' + (isWinner ? " selected" : "") + '>' + p.name + '</option>'; });
      h += '</select></div>';
    });
    h += '</div></div>';
  }

  // Permission helper: can this user edit this player's score?
  function canEditCell(playerId) {
    if (isComm) return true; // Commissioner always
    if (isRoundFinished) return false; // Locked after finish
    if (isScorekeeper) return true; // Assigned scorekeeper
    if (!c.scorekeeper) return true; // No scorekeeper assigned = anyone can edit
    if (playerId === myUid) return true; // Own score
    return false;
  }

  // Table
  h += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">';
  h += '<table style="min-width:' + (iS ? "300" : (100 + tripPlayers.length * 70)) + 'px"><thead><tr><th>Hole</th><th>Par</th>';
  if (iS) h += '<th class="g">Team</th>';
  else tripPlayers.forEach(function(p) { h += '<th class="g">' + p.name + '</th>'; });
  h += '</tr></thead><tbody>';

  var tid = trip.id;
  for (var i = 0; i < 18; i++) {
    if (i === 9) {
      h += '<tr class="sr pbsc-totals"><td>OUT</td><td>' + c.p.slice(0, 9).reduce(function(a, b) { return a + b; }, 0) + '</td>';
      if (iS) h += '<td>' + (PB.getTripTotal(tid, c.key, "team", 0, 9) || "—") + '</td>';
      else tripPlayers.forEach(function(p) { h += '<td>' + (PB.getTripTotal(tid, c.key, p.id, 0, 9) || "—") + '</td>'; });
      h += '</tr>';
    }
    var pa = c.p[i], pc = pa === 3 ? "p3" : pa === 5 ? "p5" : "p4";
    h += '<tr class="r' + (i % 2) + '"><td>' + (i + 1) + '</td><td class="' + pc + '">' + pa + '</td>';
    if (iS) {
      var v = PB.getScores(tid, c.key, "team")[i] || "";
      var canEdit = canEditCell("team");
      h += '<td><input type="number" inputmode="numeric" class="s w ' + scoreClass(v, pa) + '" value="' + (v || "") + '"' + (canEdit ? '' : ' disabled style="opacity:.5"') + ' onchange="tripScoreInput(this,\'' + tid + "','" + c.key + "','team'," + i + ',' + pa + ')" onfocus="this.select()"></td>';
    } else {
      tripPlayers.forEach(function(p) {
        var v = PB.getScores(tid, c.key, p.id)[i] || "";
        var canEdit = canEditCell(p.id);
        h += '<td><input type="number" inputmode="numeric" class="s ' + scoreClass(v, pa) + '" value="' + (v || "") + '"' + (canEdit ? '' : ' disabled style="opacity:.5"') + ' onchange="tripScoreInput(this,\'' + tid + "','" + c.key + "','" + p.id + "'," + i + ',' + pa + ')" onfocus="this.select()"></td>';
      });
    }
    h += '</tr>';
  }

  // IN
  h += '<tr class="sr pbsc-totals"><td>IN</td><td>' + c.p.slice(9).reduce(function(a, b) { return a + b; }, 0) + '</td>';
  if (iS) h += '<td>' + (PB.getTripTotal(tid, c.key, "team", 9, 18) || "—") + '</td>';
  else tripPlayers.forEach(function(p) { h += '<td>' + (PB.getTripTotal(tid, c.key, p.id, 9, 18) || "—") + '</td>'; });
  h += '</tr>';

  // TOTAL
  h += '<tr class="ttr pbsc-totals"><td>TOT</td><td>' + pT + '</td>';
  if (iS) h += '<td>' + (PB.getTripTotal(tid, c.key, "team", 0, 18) || "—") + '</td>';
  else tripPlayers.forEach(function(p) { h += '<td>' + (PB.getTripTotal(tid, c.key, p.id, 0, 18) || "—") + '</td>'; });
  h += '</tr>';

  // Stableford
  if (!iS) {
    h += '<tr class="ptsr"><td colspan="2">STBL PTS</td>';
    tripPlayers.forEach(function(p) { h += '<td>' + PB.getTripStableford(tid, c.key, p.id) + '</td>'; });
    h += '</tr>';
  }
  h += '</tbody></table></div>';

  // FIR/GIR section (individual rounds only)
  if (!iS) {
    h += '<div style="padding:12px 16px"><div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Fairways & Greens</div>';
    tripPlayers.forEach(function(p) {
      var totals = PB.getFirGirTotals(tid, c.key, p.id);
      var fg = PB.getFirGir(tid, c.key, p.id);
      h += '<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between"><span>' + p.name + '</span><span style="color:var(--muted);font-size:10px">FIR: ' + totals.fir + '/14 · GIR: ' + totals.gir + '/18</span></div>';
      h += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table style="min-width:280px"><thead><tr><th style="font-size:8px;padding:4px 2px;position:static">H</th>';
      for (var hi = 0; hi < 18; hi++) h += '<th style="font-size:8px;padding:4px 2px;position:static">' + (hi+1) + '</th>';
      h += '</tr></thead><tbody>';
      // FIR row (only on non-par-3 holes)
      h += '<tr style="background:var(--bg2)"><td style="font-size:8px;padding:4px;color:var(--muted);position:static">FIR</td>';
      for (var fi = 0; fi < 18; fi++) {
        var isPar3 = c.p[fi] === 3;
        if (isPar3) {
          h += '<td style="padding:2px;position:static"><div style="width:18px;height:18px;margin:auto;font-size:8px;color:var(--muted2);display:flex;align-items:center;justify-content:center">—</div></td>';
        } else {
          var firVal = fg.fir[fi];
          h += '<td style="padding:2px;position:static"><div onclick="toggleFirGirBtn(this,\'' + tid + '\',\'' + c.key + '\',\'' + p.id + '\',' + fi + ',' + !firVal + ',\'fir\')" style="width:18px;height:18px;border-radius:3px;border:1px solid ' + (firVal ? 'var(--birdie)' : 'var(--border)') + ';background:' + (firVal ? 'rgba(var(--birdie-rgb),.15)' : 'transparent') + ';margin:auto;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--birdie)">' + (firVal ? '•' : '') + '</div></td>';
        }
      }
      h += '</tr>';
      // GIR row
      h += '<tr style="background:var(--bg)"><td style="font-size:8px;padding:4px;color:var(--muted);position:static">GIR</td>';
      for (var gi = 0; gi < 18; gi++) {
        var girVal = fg.gir[gi];
        h += '<td style="padding:2px;position:static"><div onclick="toggleFirGirBtn(this,\'' + tid + '\',\'' + c.key + '\',\'' + p.id + '\',' + gi + ',' + !girVal + ',\'gir\')" style="width:18px;height:18px;border-radius:3px;border:1px solid ' + (girVal ? 'var(--gold)' : 'var(--border)') + ';background:' + (girVal ? 'rgba(var(--gold-rgb),.15)' : 'transparent') + ';margin:auto;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gold)">' + (girVal ? '•' : '') + '</div></td>';
      }
      h += '</tr></tbody></table></div></div>';
    });
    h += '</div>';
  }

  if (!iS) {
    h += '<div class="lg"><div class="li"><span class="ld c" style="border:2px solid var(--gold);color:var(--gold)">6</span>Eagle+</div>';
    h += '<div class="li"><span class="ld c" style="border:1px solid var(--birdie);color:var(--birdie);background:var(--accept-bg)">4</span>Birdie</div>';
    h += '<div class="li"><span class="ld" style="color:var(--cream)">2</span>Par</div>';
    h += '<div class="li"><span class="ld" style="color:var(--red);background:rgba(var(--red-rgb),.12)">1</span>Bogey</div>';
    h += '<div class="li"><span class="ld" style="color:var(--red);background:rgba(var(--red-rgb),.12)">0</span>Dbl+</div></div>';
  }

  // ── Commissioner lock/unlock — bottom of scorecard ──────────────────
  if (isFounderRole(currentProfile)) {
    if (isRoundFinished) {
      h += '<div style="margin:16px;padding:14px 16px;background:rgba(var(--birdie-rgb),.06);border:1px solid rgba(var(--birdie-rgb),.2);border-radius:8px;display:flex;align-items:center;justify-content:space-between">';
      h += '<div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--birdie)" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0"/></svg><div><div style="font-size:12px;font-weight:600;color:var(--birdie)">' + escHtml(c.n) + ' — Scores Locked</div><div style="font-size:10px;color:var(--muted);margin-top:1px">Only you can make changes</div></div></div>';
      h += '<button class="btn-sm outline" style="font-size:10px;color:var(--gold);border-color:rgba(var(--gold-rgb),.3);flex-shrink:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:48px" onclick="unlockTripRound(\'' + tid + '\',\'' + c.key + '\')">Unlock</button>';
      h += '</div>';
    } else {
      h += '<div style="margin:16px">';
      h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.2);color:var(--cream);font-size:13px;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-user-select:none;user-select:none;min-height:48px" onclick="finishTripRound(\'' + tid + '\',\'' + c.key + '\')">';
      h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>';
      h += 'Lock ' + escHtml(c.n) + ' Scores</button>';
      h += '<div style="font-size:10px;color:var(--muted2);text-align:center;margin-top:8px">Locks scores for all members · only you can edit after</div>';
      h += '</div>';
    }
  }

  return h;
}

function renderTripLB(trip, tripPlayers) {
  var h = '', tid = trip.id;
  var sorted = tripPlayers.slice().sort(function(a, b) { return PB.getTripPoints(tid, b.id) - PB.getTripPoints(tid, a.id); });
  var md = ["1st", "2nd", "3rd", ""];

  h += '<div class="lbs"><div class="lb-title" style="display:flex;justify-content:space-between;align-items:center">Overall standings<button class="btn-sm outline" style="font-size:9px;padding:4px 10px" onclick="showEventShareCard(' + JSON.stringify(trip.name) + ',' + JSON.stringify(sorted.map(function(p){return {name:p.name,pts:PB.getTripPoints(tid,p.id)}})) + ')">Share</button></div>';
  sorted.forEach(function(p, i) {
    var tot = PB.getTripPoints(tid, p.id);
    var stbl = 0; trip.courses.forEach(function(c) { if (!c.s) stbl += PB.getTripStableford(tid, c.key, p.id); });
    h += '<div class="lb-card' + (i === 0 ? " first" : "") + '"><div class="lb-left"><span class="lb-medal">' + (md[i] || "") + '</span><div><div class="lb-name">' + p.name + '</div>';
    h += '<div class="lb-detail">Mini: ' + PB.getMiniPoints(tid, p.id) + ' · Stbl: ' + stbl + ' · Bonus: ' + PB.getBonusPoints(tid, p.id) + '</div></div></div><div class="lb-pts">' + tot + '</div></div>';
  });
  h += '</div>';

  // Round breakdown
  h += '<div class="lbs"><div class="lb-title">Round breakdown</div>';
  var st = PB.getTripTotal(tid, "scramble", "team", 0, 18);
  var scrambleTeam = PB.getScrambleTeams().find(function(t) { return t.id === "smo_scramble"; }) || {};
  var scrambleTeamName = scrambleTeam.name || (window._activeLeagueName || "Your Team");
  var scrambleMemberNames = (scrambleTeam.members || ["zach","kayvan","kiyan","nick"]).map(function(id) {
    var fb = (typeof fbMemberCache !== "undefined") && (fbMemberCache[id] || null);
    if (fb) return PB.getDisplayName(fb);
    var p = PB.getPlayer(id); return p ? PB.getDisplayName(p) : id;
  }).join(", ");
  h += '<div class="rc"><div class="rh">Sequoyah National · Scramble</div><div class="rc-body"><div style="font-size:11px;color:var(--gold);margin-bottom:4px">' + scrambleTeamName + ' — ' + scrambleMemberNames + '</div>Team score: ' + (st || "—") + (st > 0 ? " (" + (st - 72 >= 0 ? "+" : "") + (st - 72) + ")" : "") + '</div></div>';
  trip.courses.forEach(function(c) {
    if (c.s) return;
    h += '<div class="rc"><div class="rh">' + c.d + ' · ' + c.n + ' · ' + c.f + '</div>';
    tripPlayers.forEach(function(p) {
      h += '<div class="rc-row"><span>' + p.name + '</span><span><span class="rc-strokes">' + (PB.getTripTotal(tid, c.key, p.id, 0, 18) || "—") + '</span> <span class="rc-pts">' + PB.getTripStableford(tid, c.key, p.id) + ' pts</span></span></div>';
    });
    h += '</div>';
  });
  h += '</div>';

  // Bonus
  if (trip.bonusAwards && trip.bonusAwards.length) {
    h += '<div class="lbs"><div class="lb-title">Bonus awards</div>';
    trip.bonusAwards.forEach(function(b) {
      h += '<div class="bonus-card"><div class="bonus-info"><div class="bonus-label">' + b.l + '</div><div class="bonus-desc">' + b.d + ' · ' + b.p + ' pts</div></div>';
      h += '<select onchange="PB.setBonusWinner(\'' + b.i + '\',this.value);Router.go(\'scorecard\',{tripId:\'' + tid + '\'})">';
      h += '<option value="">—</option>';
      tripPlayers.forEach(function(p) { var bw = PB.getBonusWinner(b.i); var isWinner = bw === p.id || PB.getAllPlayerIds(p.id).indexOf(bw) !== -1; h += '<option value="' + p.id + '"' + (isWinner ? " selected" : "") + '>' + p.name + '</option>'; });
      h += '</select></div>';
    });
    h += '</div>';
  }
  
  // Close Event button (commissioner or event creator, not already closed)
  var isCommish = isFounderRole(currentProfile) || (currentProfile && (currentProfile.username === "thecommissioner" || currentProfile.username === "TheCommissioner"));
  var isCreator = currentProfile && trip.createdBy && (trip.createdBy === currentProfile.id || trip.createdBy === (currentProfile.claimedFrom || ""));
  if ((isCommish || isCreator) && trip.status !== "closed") {
    h += '<div style="padding:16px"><button class="btn full outline" style="color:var(--red);border-color:var(--red)" onclick="closeEvent(\'' + tid + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M4 2h8v3L8 8l4 3v3H4v-3l4-3L4 5z"/></svg> Close Event and Post Results</button></div>';
  }
  
  // If closed — show final results banner
  if (trip.status === "closed" && trip.champion) {
    var champPlayer = PB.getPlayer(trip.champion) || (typeof fbMemberCache !== "undefined" && fbMemberCache[trip.champion]);
    var champName = champPlayer ? (champPlayer.name || champPlayer.username) : "Champion";
    h += '<div style="padding:16px;text-align:center;background:linear-gradient(180deg,rgba(var(--gold-rgb),.08),transparent);border:1px solid rgba(var(--gold-rgb),.15);border-radius:var(--radius);margin:0 16px 16px">';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Event Complete</div>';
    h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)">' + escHtml(champName) + '</div>';
    h += '<div style="font-size:11px;color:var(--cream);margin-top:4px">Champion of ' + escHtml(trip.name) + '</div>';
    if (trip.finalStandings) {
      h += '<div style="margin-top:10px;font-size:11px;color:var(--muted)">';
      trip.finalStandings.forEach(function(s, i) {
        var placeLabels = ["1st","2nd","3rd","4th","5th","6th"];
        h += '<div style="padding:2px 0;color:' + (i === 0 ? 'var(--gold)' : 'var(--cream)') + '">' + (placeLabels[i]||"") + ' ' + escHtml(s.name) + ' — ' + s.points + ' pts</div>';
      });
      h += '</div>';
    }
    h += '</div>';
  }
  
  return h;
}

function closeEvent(tripId) {
  var isCommish = isFounderRole(currentProfile) || (currentProfile && (currentProfile.username === "thecommissioner" || currentProfile.username === "TheCommissioner"));
  if (!isCommish) { Router.toast("Only the commissioner can close events"); return; }
  var trip = PB.getTrip(tripId);
  if (!trip) return;
  
  var tripPlayers = trip.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);
  var sorted = tripPlayers.slice().sort(function(a, b) { return PB.getTripPoints(tripId, b.id) - PB.getTripPoints(tripId, a.id); });
  
  if (!sorted.length) { Router.toast("No players with scores"); return; }
  
  var winner = sorted[0];
  var winnerPts = PB.getTripPoints(tripId, winner.id);
  
  // Tie-breaker: if top 2 have same total points, compare stableford, then total strokes
  if (sorted.length >= 2 && PB.getTripPoints(tripId, sorted[1].id) === winnerPts) {
    var s1stbl = 0, s2stbl = 0, s1strokes = 0, s2strokes = 0;
    trip.courses.forEach(function(c) {
      if (c.s) return;
      s1stbl += PB.getTripStableford(tripId, c.key, sorted[0].id);
      s2stbl += PB.getTripStableford(tripId, c.key, sorted[1].id);
      s1strokes += PB.getTripTotal(tripId, c.key, sorted[0].id, 0, 18);
      s2strokes += PB.getTripTotal(tripId, c.key, sorted[1].id, 0, 18);
    });
    if (s2stbl > s1stbl) { var tmp = sorted[0]; sorted[0] = sorted[1]; sorted[1] = tmp; winner = sorted[0]; }
    else if (s2stbl === s1stbl && s2strokes < s1strokes) { var tmp2 = sorted[0]; sorted[0] = sorted[1]; sorted[1] = tmp2; winner = sorted[0]; }
  }
  
  var finalStandings = sorted.map(function(p, i) {
    return { pid: p.id, name: p.name || p.username, points: PB.getTripPoints(tripId, p.id), place: i + 1 };
  });
  
  if (!confirm("Close " + trip.name + " and crown " + winner.name + " as champion with " + winnerPts + " points?")) return;
  
  // Update trip doc
  trip.status = "closed";
  trip.champion = winner.id;
  trip.finalStandings = finalStandings;
  PB.save();
  
  if (db) {
    db.collection("trips").doc(tripId).update({
      status: "closed",
      champion: winner.id,
      finalStandings: finalStandings,
      closedAt: fsTimestamp()
    }).catch(function(e) { console.error("Close event error:", e); });
    
    // Increment winner's wins — try UID first, then claimedFrom, then seed ID
    var winnerIds = [winner.id];
    if (winner.claimedFrom && winnerIds.indexOf(winner.claimedFrom) === -1) winnerIds.push(winner.claimedFrom);
    if (typeof fbMemberCache !== "undefined") {
      Object.keys(fbMemberCache).forEach(function(k) {
        var m = fbMemberCache[k];
        if ((m.claimedFrom === winner.id || m.id === winner.id || k === winner.id) && winnerIds.indexOf(k) === -1) winnerIds.push(k);
      });
    }
    winnerIds.forEach(function(wid) {
      db.collection("members").doc(wid).update({
        wins: firebase.firestore.FieldValue.increment(1)
      }).catch(function(){});
    });
    
    // Post to activity feed
    var resultsText = trip.name + " has concluded!\n\nChampion: " + winner.name + " (" + winnerPts + " pts)\n\nFinal standings:\n";
    finalStandings.forEach(function(s, i) {
      resultsText += (i + 1) + ". " + s.name + " — " + s.points + " pts\n";
    });
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(),
      text: resultsText,
      authorId: "system",
      authorName: "The Caddy",
      system: true,
      tripId: tripId,
      linkType: "event",
      timestamp: Date.now(),
      createdAt: fsTimestamp()
    }))(function(){});
  }
  
  // Update local player wins
  if (winner) winner.wins = (winner.wins || 0) + 1;
  
  Router.toast(winner.name + " wins " + trip.name + "!");
  Router.go("scorecard", { tripId: tripId });
}

function renderTripPhotos(trip) {
  var h = '<div class="section">';
  h += '<button class="btn full green" onclick="uploadTripPhotoFirestore(\'' + trip.id + '\')">+ Add Photo</button>';
  h += '</div>';

  h += '<div id="tripPhotoGrid"><div class="loading"><div class="spinner"></div>Loading photos...</div></div>';

  // Load photos from Firestore
  loadTripPhotos(trip.id).then(function(photos) {
    var grid = document.getElementById("tripPhotoGrid");
    if (!grid) return;

    // Also include local photos
    var localPhotos = [];
    if (trip.photos && trip.photos.length) {
      trip.photos.forEach(function(p) {
        localPhotos.push({ src: p.data || p.url, caption: p.caption || "", local: true });
      });
    }

    var allPhotos = photos.concat(localPhotos);

    if (!allPhotos.length) {
      grid.innerHTML = '<div class="empty"><div class="empty-icon" style="font-size:14px;color:var(--muted)"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="4" width="12" height="9" rx="1"/><circle cx="8" cy="9" r="2.5"/><path d="M6 4l1-2h2l1 2"/></svg></div><div class="empty-text">No photos yet — add some from the trip!</div></div>';
      return;
    }

    var gh = '<div class="photo-grid">';
    allPhotos.forEach(function(p) {
      gh += '<div class="photo-thumb" style="position:relative"><img alt="" src="' + p.src + '" loading="lazy">';
      if (p.caption) gh += '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.6);color:white;font-size:9px;padding:3px 6px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">' + escHtml(p.caption) + '</div>';
      gh += '</div>';
    });
    gh += '</div>';
    gh += '<div style="text-align:center;padding:8px;font-size:10px;color:var(--muted2)">' + allPhotos.length + ' photos</div>';
    grid.innerHTML = gh;
  });

  return h;
}

function uploadTripPhotoFirestore(tripId) {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    Router.toast("Compressing...");
    var reader = new FileReader();
    reader.onload = function(e) {
      compressPhoto(e.target.result, PHOTO_MAX_KB, 800, function(compressed) {
        var caption = prompt("Caption (optional):", "") || "";
        savePhoto("trip", tripId, compressed, caption).then(function(ok) {
          if (ok) Router.toast("Photo uploaded to cloud!");
          else Router.toast("Saved locally");
          // Also save locally as backup
          PB.addTripPhoto(tripId, compressed);
          Router.go("scorecard", { tripId: tripId });
        });
      });
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function uploadTripPhoto(tripId) { uploadTripPhotoFirestore(tripId); }

function addTripPhotoUrl(tripId) {
  var url = prompt("Paste image URL:");
  if (!url) return;
  savePhoto("trip", tripId, url, "").then(function() {
    Router.toast("Photo added!");
    Router.go("scorecard", { tripId: tripId });
  });
}

function scoreClass(v, pa) {
  if (!v || v === "") return "";
  var d = parseInt(v) - pa;
  return d <= -2 ? "ea" : d === -1 ? "bi" : d === 0 ? "" : d === 1 ? "bo" : "db";
}

