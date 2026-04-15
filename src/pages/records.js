/* ================================================
   PAGE: RECORDS
   ================================================ */
Router.register("records", function() {
  var rounds = PB.getRounds().filter(function(r){return r.visibility !== "private";});
  var players = PB.getPlayers();
  var rec = PB.getRecords();

  var h = '<div class="sh"><h2>Records</h2></div>';

  // Season standings card (prominent at top)
  var year = new Date().getFullYear();
  var month = new Date().getMonth();
  var inSeason = month >= 2 && month <= 8;
  h += '<div class="card" onclick="Router.go(\'standings\')" style="cursor:pointer;' + (inSeason ? 'border-color:rgba(var(--gold-rgb),.2);background:linear-gradient(135deg,var(--grad-card),var(--card))' : '') + '">';
  h += '<div style="padding:16px;display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-family:Playfair Display,serif;font-size:16px;font-weight:700;color:var(--gold)">' + year + ' Season Standings</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:3px;letter-spacing:.3px">March — September · ' + (inSeason ? 'In season' : 'Offseason') + '</div></div>';
  h += '<div class="m-arrow" style="color:var(--gold);font-size:20px">›</div></div></div>';

  // Navigation grid — 2 columns
  h += '<div class="qlinks" style="grid-template-columns:1fr 1fr;margin-bottom:12px">';

  // Challenges
  var challengeCount = 0;
  try { PB.getPlayers().forEach(function(p){challengeCount += PB.getChallenges(p.id).filter(function(c){return c.status==="pending"}).length}); } catch(e) {}
  h += '<div class="card" onclick="Router.go(\'challenges\')" style="cursor:pointer;margin-bottom:0"><div style="padding:14px 12px;text-align:center">';
  h += '<div style="font-size:20px;font-family:Playfair Display,serif;font-weight:700;color:var(--gold)">' + (challengeCount || "0") + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">Challenges</div></div></div>';

  // Ace Wall
  var aceCount = (rec.holeInOnes && rec.holeInOnes.length) || 0;
  h += '<div class="card" onclick="Router.go(\'aces\')" style="cursor:pointer;margin-bottom:0"><div style="padding:14px 12px;text-align:center">';
  h += '<div style="font-size:20px;font-family:Playfair Display,serif;font-weight:700;color:var(--gold)">' + aceCount + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">Aces</div></div></div>';

  // Teams
  var teamCount = PB.getScrambleTeams().length;
  h += '<div class="card" onclick="Router.go(\'scramble\')" style="cursor:pointer;margin-bottom:0"><div style="padding:14px 12px;text-align:center">';
  h += '<div style="font-size:20px;font-family:Playfair Display,serif;font-weight:700;color:var(--gold)">' + teamCount + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">Teams</div></div></div>';

  // Courses
  var coursesPlayed = PB.getCourses().filter(function(c){return PB.getCourseRounds(c.name).length>0}).length;
  h += '<div class="card" onclick="Router.go(\'courses\')" style="cursor:pointer;margin-bottom:0"><div style="padding:14px 12px;text-align:center">';
  h += '<div style="font-size:20px;font-family:Playfair Display,serif;font-weight:700;color:var(--gold)">' + coursesPlayed + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">Courses played</div></div></div>';

  h += '</div>';

  // Helper for collapsible hof card
  function hofCard(id, title, content) {
    return '<div class="hof-card"><div class="hof-title" onclick="toggleSection(\'rec-' + id + '\')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>' + title + '</span><span id="rec-' + id + '-toggle" style="font-size:12px;color:var(--muted);display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s;color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></span></div><div id="rec-' + id + '" style="display:none">' + content + '</div></div>';
  }

  // 1. Event Champions — collapsible hofCard matching all other sections
  var trips = PB.getTrips();
  if (trips.length) {
    var champContent = '';
    trips.forEach(function(t) {
      var champ = t.champion ? PB.getPlayer(t.champion) : null;
      var champName = champ ? (champ.username || champ.name) : "TBD";
      var isChamp = !!t.champion;
      champContent += '<div class="hof-row" style="padding:6px 0;' + (isChamp ? 'border-bottom:1px solid rgba(var(--gold-rgb),.08)' : '') + '">';
      champContent += '<div><span class="hof-label">' + escHtml(t.name) + '</span>';
      champContent += '<div style="font-size:9px;color:var(--muted2);margin-top:1px">' + escHtml(t.dates||"") + ' · ' + escHtml(t.location||"") + '</div></div>';
      champContent += '<span class="hof-val" style="color:' + (isChamp ? 'var(--gold)' : 'var(--muted)') + '">' + escHtml(champName) + '</span>';
      champContent += '</div>';
    });
    h += hofCard("champions", "Event champions", champContent);
  }

  // 2. All-time records — with inline Log a record
  var recContent = '';
  if (rounds.length) {
    var full18 = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
    var nine = rounds.filter(function(r){return r.holesPlayed && r.holesPlayed <= 9 && r.format !== "scramble" && r.format !== "scramble4";});
    var best18 = full18.length ? full18.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
    var best9 = nine.length ? nine.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
    recContent += '<div style="display:flex;gap:8px;margin-bottom:6px">';
    recContent += '<div style="flex:1;background:var(--bg3);border-radius:var(--radius);padding:10px 12px;text-align:center">';
    recContent += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Best 18 holes</div>';
    if (best18) {
      recContent += '<div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:var(--gold)">' + best18.score + '</div>';
      recContent += '<div style="font-size:10px;color:var(--cream);margin-top:2px">' + escHtml(best18.playerName) + '</div>';
      recContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(best18.course) + '</div>';
    } else {
      recContent += '<div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:var(--muted2)">—</div>';
    }
    recContent += '</div>';
    recContent += '<div style="flex:1;background:var(--bg3);border-radius:var(--radius);padding:10px 12px;text-align:center">';
    recContent += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Best 9 holes</div>';
    if (best9) {
      var nineLabel = best9.holesMode === "back9" ? "Back 9" : "Front 9";
      recContent += '<div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:var(--gold)">' + best9.score + '</div>';
      recContent += '<div style="font-size:10px;color:var(--cream);margin-top:2px">' + escHtml(best9.playerName) + '</div>';
      recContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(best9.course) + ' · ' + nineLabel + '</div>';
    } else {
      recContent += '<div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:var(--muted2)">—</div>';
    }
    recContent += '</div></div>';
  } else {
    recContent += '<div class="hof-row"><span class="hof-label">Best round</span><span class="hof-val">—</span></div>';
  }
  var rec = PB.getRecords();
  recContent += '<div class="hof-row"><span class="hof-label">Longest drive</span><span class="hof-val">' + (rec.longestDrive ? rec.longestDrive.distance + ' yds — ' + rec.longestDrive.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Longest putt</span><span class="hof-val">' + (rec.longestPutt ? rec.longestPutt.distance + ' ft — ' + rec.longestPutt.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Longest hole out</span><span class="hof-val">' + (rec.longestHoleOut ? rec.longestHoleOut.distance + ' yds — ' + rec.longestHoleOut.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Chip-ins</span><span class="hof-val">' + (rec.chipIns || 0) + '</span></div>';
  recContent += '<div class="hof-row" onclick="Router.go(\'aces\')" style="cursor:pointer"><span class="hof-label">Hole-in-ones</span><span class="hof-val" style="color:var(--gold)">' + (rec.holeInOnes && rec.holeInOnes.length ? rec.holeInOnes.length + ' → View Ace Wall' : 'View Ace Wall →') + '</span></div>';
  h += hofCard("alltime", "All-time records", recContent);

  // Log record — hofCard style, consistent with all other sections
  var logContent = '<div style="padding:4px 0">';
  logContent += '<div class="ff"><label class="ff-label">Record type</label><select class="ff-input" id="rec-type"><option value="longestDrive">Longest drive</option><option value="longestPutt">Longest putt</option><option value="longestHoleOut">Longest hole out</option><option value="chipIn">Chip-in</option></select></div>';
  logContent += '<div class="ff"><label class="ff-label">Player</label><select class="ff-input" id="rec-player">';
  var recPlayer = currentUser ? PB.getPlayer(currentUser.uid) : null;
  var recLocal = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name); });
  var recAs = recPlayer || recLocal;
  if (recAs) {
    logContent += '<option value="' + escHtml(recAs.name) + '">' + escHtml(recAs.name) + '</option>';
  } else {
    players.forEach(function(p) { logContent += '<option value="' + escHtml(p.name) + '">' + escHtml(p.name) + '</option>'; });
  }
  logContent += '</select></div>';
  logContent += '<div class="ff"><label class="ff-label">Distance (yds or ft)</label><input class="ff-input" id="rec-distance" type="number" placeholder="e.g. 285"></div>';
  logContent += '<div class="ff"><label class="ff-label">Club used</label><input class="ff-input" id="rec-club" placeholder="e.g. 7 iron"></div>';
  logContent += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="rec-course" placeholder="Course name"></div>';
  logContent += '<button class="btn full green" style="margin-top:4px" onclick="submitRecord()">Save record</button>';
  logContent += '</div>';
  h += hofCard("logrecord", "Log a record", logContent);

  // 3. Head-to-head records
  var h2hContent = '';
  for (var i = 0; i < players.length; i++) {
    for (var j = i + 1; j < players.length; j++) {
      var h2h = calcH2H(players[i].id, players[j].id);
      var total = h2h.p1wins + h2h.p2wins + h2h.ties;
      if (total > 0) {
        var leader = h2h.p1wins > h2h.p2wins ? players[i].name : h2h.p2wins > h2h.p1wins ? players[j].name : "Tied";
        h2hContent += '<div class="hof-row"><span class="hof-label">' + players[i].name + ' vs ' + players[j].name + '</span><span class="hof-val">' + h2h.p1wins + '-' + h2h.p2wins + (h2h.ties ? '-' + h2h.ties + 'T' : '') + '</span></div>';
      }
    }
  }
  if (!h2hContent) h2hContent = '<div class="hof-row"><span class="hof-label">No head-to-head data</span><span class="hof-val">Play same course, same day</span></div>';
  h += hofCard("h2h", "Head-to-head records", h2hContent);

  // 4. Scramble team records
  var teams = PB.getScrambleTeams();
  var scrambleContent = '';
  if (teams.length) {
    // Group by size
    [2,3,4].forEach(function(sz) {
      var sizeTeams = teams.filter(function(t) { return (t.members ? t.members.length : (t.size || 2)) === sz; });
      if (!sizeTeams.length) return;
      scrambleContent += '<div style="font-size:12px;font-weight:700;color:var(--muted);margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px">' + sz + '-man teams</div>';
      var sorted = sizeTeams.slice().sort(function(a, b) {
        var aw = (a.matches || []).filter(function(m) { return m.result === "win"; }).length;
        var bw = (b.matches || []).filter(function(m) { return m.result === "win"; }).length;
        return bw - aw;
      });
      sorted.forEach(function(t) {
        var w = (t.matches || []).filter(function(m) { return m.result === "win"; }).length;
        var l = (t.matches || []).filter(function(m) { return m.result === "loss"; }).length;
        var bestScore = t.matches && t.matches.length ? Math.min.apply(null, t.matches.filter(function(m){return m.score}).map(function(m){return m.score})) : null;
        scrambleContent += '<div class="hof-row"><span class="hof-label">' + t.name + '</span><span class="hof-val">' + w + '-' + l + (bestScore ? ' · Best: ' + bestScore : '') + '</span></div>';
      });
    });
  } else {
    scrambleContent = '<div class="hof-row"><span class="hof-label">No teams yet</span><span class="hof-val">Create a team</span></div>';
  }
  h += hofCard("scramble", "Scramble team records", scrambleContent);

  // 5. Best scores by course
  var courseContent = '';
  var courses = PB.getCourses();
  var coursesWithData = courses.filter(function(c) { return PB.getCourseRounds(c.name).length > 0 || teams.some(function(t){return(t.matches||[]).some(function(m){return m.course===c.name})}); });
  if (coursesWithData.length) {
    coursesWithData.forEach(function(c) {
      var cr = PB.getCourseRounds(c.name).filter(function(r){ return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4"; });
      var bestSolo = cr.length ? cr.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
      var scrambleBests = {};
      teams.forEach(function(t) {
        var sz = t.members ? t.members.length : (t.size || 2);
        (t.matches || []).forEach(function(m) {
          if (m.course === c.name && m.score && (!scrambleBests[sz] || m.score < scrambleBests[sz].score)) {
            scrambleBests[sz] = { score: m.score, team: t.name };
          }
        });
      });
      var extras = [];
      if (scrambleBests[2]) extras.push('2m: ' + scrambleBests[2].score);
      if (scrambleBests[3]) extras.push('3m: ' + scrambleBests[3].score);
      if (scrambleBests[4]) extras.push('4m: ' + scrambleBests[4].score);
      courseContent += '<div class="hof-row"><span class="hof-label">' + c.name + '</span><span class="hof-val">' + (bestSolo ? bestSolo.score + ' (' + bestSolo.playerName + ')' : '—') + (extras.length ? ' · ' + extras.join(' · ') : '') + '</span></div>';
    });
  } else {
    courseContent = '<div class="hof-row"><span class="hof-label">No course records</span><span class="hof-val">Log rounds to populate</span></div>';
  }
  h += hofCard("courses", "Best scores by course", courseContent);

  // 6. Handicap leaderboard — uses computed handicap from rounds, falls back to Firestore-persisted value
  var hcapContent = '';
  var allKnownPlayers = players.slice();
  if (typeof fbMemberCache !== "undefined") {
    Object.values(fbMemberCache).forEach(function(m) {
      if (m.id && !allKnownPlayers.find(function(p){return p.id===m.id||p.id===m.claimedFrom;})) {
        allKnownPlayers.push(m);
      }
    });
  }
  var hcapsSeen = {};
  var hcaps = allKnownPlayers.map(function(p) {
    var key = p.claimedFrom || p.id;
    if (hcapsSeen[key]) return null;
    hcapsSeen[key] = true;
    var computed = PB.calcHandicap(PB.getPlayerRounds(p.id)) ||
                   (p.claimedFrom ? PB.calcHandicap(PB.getPlayerRounds(p.claimedFrom)) : null);
    var stored = p.handicap || null;
    var hcap = computed !== null ? computed : stored;
    if (hcap === null) return null;
    return { name: p.name || p.username, hcap: hcap };
  }).filter(Boolean).sort(function(a, b) { return a.hcap - b.hcap; });
  if (hcaps.length) { hcaps.forEach(function(x) { hcapContent += '<div class="hof-row"><span class="hof-label">' + escHtml(x.name) + '</span><span class="hof-val">' + x.hcap + '</span></div>'; }); }
  else hcapContent = '<div class="hof-row"><span class="hof-label">No handicaps yet</span><span class="hof-val">Log 3+ rounds</span></div>';
  h += hofCard("hcap", "Handicap leaderboard", hcapContent);

  // 7. Member averages — use all known members (fbMemberCache has everyone)
  var avgContent = '';
  var allRounds = PB.getRounds().filter(function(r){return r.visibility !== "private";});
  // Build set of seed IDs that have been claimed by a Firestore member
  var claimedSeedIds = {};
  if (typeof fbMemberCache !== "undefined") {
    Object.values(fbMemberCache).forEach(function(m) {
      if (m.claimedFrom) claimedSeedIds[m.claimedFrom] = true;
    });
  }
  var seenAvgIds = {};
  var allMembersForAvg = [];
  // Add seed players only if not already claimed by a Firestore account
  PB.getPlayers().forEach(function(p) {
    if (!claimedSeedIds[p.id] && !seenAvgIds[p.id]) {
      seenAvgIds[p.id] = true;
      allMembersForAvg.push({id:p.id, name:p.name, claimedFrom:null});
    }
  });
  if (typeof fbMemberCache !== "undefined") {
    // Build set of claimedFrom values and best doc per username
    var realAccounts = {};
    var bestByUsername = {};
    Object.values(fbMemberCache).forEach(function(m) {
      if (m.claimedFrom && m.username) realAccounts[m.claimedFrom] = true;
      if (m.username) {
        var key = m.username.toLowerCase();
        var ex = bestByUsername[key];
        if (!ex || Object.keys(m).length > Object.keys(ex).length) bestByUsername[key] = m;
      }
    });
    Object.values(fbMemberCache).forEach(function(m) {
      if (m.id && !seenAvgIds[m.id]) {
        if (m.claimedFrom && !m.username && realAccounts[m.claimedFrom]) return;
        if (m.username && bestByUsername[m.username.toLowerCase()] !== m) return;
        seenAvgIds[m.id] = true;
        allMembersForAvg.push({id:m.id, name:m.name||m.username||"Member", claimedFrom:m.claimedFrom||null});
      }
    });
  }
  allMembersForAvg.sort(function(a,b){ return a.name.localeCompare(b.name); });
  allMembersForAvg.forEach(function(p) {
    var r = allRounds.filter(function(rd){ return (rd.player === p.id || (p.claimedFrom && rd.player === p.claimedFrom)) && rd.format !== "scramble" && rd.format !== "scramble4" && (!rd.holesPlayed || rd.holesPlayed >= 18); });
    var avg = r.length ? Math.round(r.reduce(function(a, x) { return a + x.score; }, 0) / r.length) : "—";
    avgContent += '<div class="hof-row"><span class="hof-label">' + escHtml(p.name) + '</span><span class="hof-val">' + avg + (r.length ? ' (' + r.length + ')' : '') + '</span></div>';
  });
  h += hofCard("avg", "Member averages", avgContent);

  h += renderPageFooter();
  document.querySelector('[data-page="records"]').innerHTML = h;
});

function showAddRecord() {
  var form = document.getElementById("add-record-form");
  if (form) form.style.display = form.style.display === "none" ? "block" : "none";
}

function submitRecord() {
  var type = document.getElementById("rec-type").value;
  var player = document.getElementById("rec-player").value;
  var distance = document.getElementById("rec-distance").value;
  var club = document.getElementById("rec-club").value;
  var course = document.getElementById("rec-course").value;
  var rec = PB.getRecords();
  var entry = { by: player, distance: distance, club: club, course: course, date: localDateStr() };

  if (type === "longestDrive") {
    if (!rec.longestDrive || parseInt(distance) > parseInt(rec.longestDrive.distance)) {
      PB.setRecord("longestDrive", entry);
      Router.toast("New longest drive record!");
    } else Router.toast("Didn't beat the record (" + rec.longestDrive.distance + " yds)");
  } else if (type === "longestPutt") {
    if (!rec.longestPutt || parseInt(distance) > parseInt(rec.longestPutt.distance)) {
      PB.setRecord("longestPutt", entry);
      Router.toast("New longest putt record!");
    } else Router.toast("Didn't beat the record (" + rec.longestPutt.distance + " ft)");
  } else if (type === "longestHoleOut") {
    if (!rec.longestHoleOut || parseInt(distance) > parseInt(rec.longestHoleOut.distance)) {
      PB.setRecord("longestHoleOut", entry);
      Router.toast("New longest hole out record!");
    } else Router.toast("Didn't beat the record (" + rec.longestHoleOut.distance + " yds)");
  } else if (type === "chipIn") {
    PB.setRecord("chipIns", (rec.chipIns || 0) + 1);
    Router.toast("Chip-in logged! Total: " + ((rec.chipIns || 0) + 1));
  } else if (type === "holeInOne") {
    if (!rec.holeInOnes) rec.holeInOnes = [];
    rec.holeInOnes.push(entry);
    PB.setRecord("holeInOnes", rec.holeInOnes);
    Router.toast("Hole in one logged");
  }
  Router.go("records");
}


