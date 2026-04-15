Router.register("activity", function() {
  var h = '<div class="sh"><h2>Activity</h2>';
  if (rangeActiveView === "range") {
    h += '<button class="btn-sm green" onclick="startRangeSession()">Hit the Range</button>';
  } else {
    h += '<button class="btn-sm green" onclick="Router.go(\'playnow\')">Play now</button>';
  }
  h += '</div>';

  // Toggle bar
  h += '<div class="activity-toggle">';
  h += '<button class="' + (rangeActiveView==="rounds"?"active":"") + '" onclick="rangeActiveView=\'rounds\';Router.go(\'activity\')">Rounds</button>';
  h += '<button class="' + (rangeActiveView==="range"?"active":"") + '" onclick="rangeActiveView=\'range\';Router.go(\'activity\')">Range</button>';
  h += '</div>';

  if (rangeActiveView === "rounds") {
    h += renderActivityRounds();
  } else {
    h += renderActivityRange();
  }
  h += renderPageFooter();
  document.querySelector('[data-page="activity"]').innerHTML = h;
  // Auto-render hole-by-hole grid for Log a Round
  if (rangeActiveView === "rounds") {
    setTimeout(renderLogHoleGrid, 50);
  }
});

function renderActivityRounds() {
  var rounds = PB.getRounds();
  var myId = currentUser ? currentUser.uid : null;
  var myLocal = currentProfile ? currentProfile.claimedFrom : null;
  var myRounds = rounds.filter(function(r) { return r.player === myId || r.player === myLocal || r.player === "zach"; });
  var hcap = PB.calcHandicap(myRounds);
  var h = '';

  // Handicap
  h += '<div class="hcap-box"><div class="hcap-val">' + (hcap !== null ? hcap : "—") + '</div><div class="hcap-label">Your handicap index</div></div>';

  // Form
  h += '<div class="form-section"><div class="form-title">Log a round</div>';
  h += '<div class="ff"><label class="ff-label">Player</label>';
  var myRoundPlayer = currentUser ? PB.getPlayer(currentUser.uid) : null;
  var myRoundLocal = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name || p.id === currentProfile.id); });
  if (!myRoundPlayer && !myRoundLocal && currentUser && typeof fbMemberCache !== "undefined" && fbMemberCache[currentUser.uid]) myRoundLocal = fbMemberCache[currentUser.uid];
  if (!myRoundPlayer && !myRoundLocal && currentProfile && currentProfile.name) myRoundLocal = currentProfile;
  var roundAs = myRoundPlayer || myRoundLocal;
  if (!roundAs) {
    h += '<div style="font-size:12px;color:var(--red)">Could not identify your player profile.</div></div>';
  } else {
    h += '<div class="ff-input" style="background:var(--bg4);color:var(--gold);font-weight:600">' + escHtml(roundAs.name) + '</div><input type="hidden" id="rf-player" value="' + roundAs.id + '"></div>';
  }
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="rf-course" placeholder="Search courses..." autocomplete="off" oninput="showRoundCourseSearch(this);renderLogHoleGrid()"><div id="search-round-course" class="search-results"></div></div>';
  h += '<div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="rf-format"><option value="stroke">Stroke play</option><option value="parbaugh">Parbaugh Stroke Play</option><option value="stableford">Modified Stableford</option><option value="scramble">Scramble (2-man)</option><option value="scramble4">Scramble (4-man)</option><option value="bestball">Best ball</option><option value="alternate">Alternate shot</option><option value="skins">Skins</option><option value="match">Match play</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Holes</label><select class="ff-input" id="rf-holes" onchange="renderLogHoleGrid()"><option value="18">18 holes</option><option value="front9">Front 9</option><option value="back9">Back 9</option></select></div>';
  h += '</div>';
  h += '<div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Date</label><input type="date" class="ff-input" id="rf-date" value="' + localDateStr() + '" style="min-width:0"></div>';
  h += '<div class="ff"><label class="ff-label">Score (auto)</label><input type="number" inputmode="numeric" class="ff-input" id="rf-score" placeholder="auto" style="min-width:0;background:var(--bg4);color:var(--gold)" readonly></div>';
  h += '</div><div class="ff-row" style="grid-template-columns:1fr 1fr">';
  h += '<div class="ff"><label class="ff-label">Rating</label><input type="number" step="0.1" class="ff-input" id="rf-rating" placeholder="auto" style="min-width:0"></div>';
  h += '<div class="ff"><label class="ff-label">Slope</label><input type="number" class="ff-input" id="rf-slope" placeholder="auto" style="min-width:0"></div>';
  h += '</div>';
  h += '<div id="rf-hbh-section" style="margin-top:4px"></div>';
  h += '<div class="ff"><label class="ff-label">Scorecard photo (optional)</label><input type="file" accept="image/*" id="rf-photo" style="color:var(--muted);font-size:12px"></div>';
  h += '<button class="btn full green" onclick="submitRound()">+ Log round</button></div>';

  // History — group scramble rounds like home feed
  if (rounds.length) {
    // Separate individual and scramble, group scramble by course+date
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
  }
  return h;
}

function renderActivityRange() {
  var h = '';
  var myId = currentUser ? currentUser.uid : "local";
  var mySessions = liveRangeSessions.filter(function(s) { return s.playerId === myId; });

  // Active session indicator
  if (activeRangeStart) {
    h += '<div class="section"><div class="card" onclick="Router.go(\'range\')" style="cursor:pointer;border-left:3px solid var(--pink)">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--pink)">Session in progress</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">Tap to return</div></div>';
    h += '<div style="display:flex;align-items:center;gap:4px"><div style="width:7px;height:7px;border-radius:50%;background:var(--pink);animation:pulse-dot 2s infinite"></div><span style="font-size:9px;color:var(--pink);font-weight:700">LIVE</span></div>';
    h += '</div></div></div>';
  }

  // Stats summary
  var totalSessions = mySessions.length;
  var totalMins = mySessions.reduce(function(a,s){return a+(s.durationMin||0)},0);
  var totalHrs = Math.floor(totalMins/60);
  var avgFeel = totalSessions ? (mySessions.reduce(function(a,s){return a+(s.feel||2)},0)/totalSessions).toFixed(1) : "—";
  var streakWeeks = calcRangeStreak(mySessions);

  h += '<div class="stats-grid" style="padding:0 16px 8px">';
  h += statBox(totalSessions, "Sessions");
  h += statBox(totalHrs + "h " + (totalMins%60) + "m", "Total Time");
  h += statBox(streakWeeks + "wk", "Streak");
  h += '</div>';

  // Practice Insights
  if (mySessions.length >= 3) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Practice Insights</span></div>';
    var drillCounts = {};
    var catCounts = {path:0,extension:0,short:0,general:0,custom:0};
    var allDrills = DRILL_LIBRARY.concat(customDrills);
    mySessions.forEach(function(s) {
      if (!s.drills) return;
      s.drills.forEach(function(did) {
        drillCounts[did] = (drillCounts[did]||0)+1;
        var drill = allDrills.find(function(x){return x.id===did});
        if (drill) catCounts[drill.cat] = (catCounts[drill.cat]||0)+1;
      });
    });
    var totalDrillUse = Object.values(catCounts).reduce(function(a,b){return a+b},0) || 1;
    var catColors = {path:"var(--blue)",extension:"var(--purple)",short:"var(--live)",general:"var(--gold)",custom:"var(--pink)"};
    h += '<div class="card"><div style="font-size:11px;font-weight:600;color:var(--cream);margin-bottom:8px">Practice Distribution</div>';
    Object.keys(DRILL_CATS).forEach(function(cat) {
      if (!catCounts[cat]) return;
      var pct = Math.round((catCounts[cat]/totalDrillUse)*100);
      h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:2px"><span>' + DRILL_CATS[cat] + '</span><span style="color:var(--cream)">' + pct + '%</span></div>';
      h += '<div class="insight-bar"><div class="insight-bar-fill" style="width:'+pct+'%;background:'+catColors[cat]+'"></div></div>';
      h += '<div style="height:6px"></div>';
    });
    // Check for gaps
    var catKeys = Object.keys(catCounts);
    var zeroCats = ["path","extension","short","general"].filter(function(c){return !catCounts[c]});
    if (zeroCats.length && mySessions.length >= 5) {
      h += '<div style="margin-top:8px;padding:8px;background:rgba(var(--gold-rgb),.06);border-radius:4px;font-size:10px;color:var(--gold)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle"><path d="M8 1C5 1 3 3.5 3 6c0 1.5.7 2.7 2 3.5V12h6V9.5c1.3-.8 2-2 2-3.5 0-2.5-2-5-5-5z"/><path d="M6 14h4"/></svg> You haven\'t touched ' + zeroCats.map(function(c){return DRILL_CATS[c]}).join(" or ") + ' drills in a while</div>';
    }
    h += '</div></div>';
  }

  // Session history
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Range Sessions</span><span class="sec-link">' + totalSessions + ' total</span></div>';
  if (!mySessions.length) {
    h += '<div class="card"><div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>';
    h += '<div class="empty-text">No range sessions yet. Hit the Range to get started!</div></div></div>';
  }
  mySessions.slice(0, 20).forEach(function(s) {
    var allDrills = DRILL_LIBRARY.concat(customDrills);
    var drillNames = (s.drills||[]).map(function(did){var d=allDrills.find(function(x){return x.id===did});return d?d.name:did;});
    var feelIcon = s.feel === 1 ? '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--red)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10s1-1.5 3-1.5 3 1.5 3 1.5"/></svg>' : s.feel === 3 ? '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10s1 1.5 3 1.5 3-1.5 3-1.5"/></svg>' : '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--cream)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10h6"/></svg>';
    var dateObj = new Date(s.date+"T12:00:00");
    var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var fmtDate = monNames[dateObj.getMonth()] + " " + dateObj.getDate();
    h += '<div class="card" style="border-left:3px solid var(--pink)"><div style="display:flex;justify-content:space-between;align-items:flex-start">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream);display:flex;align-items:center;gap:4px">' + s.durationMin + ' min ' + feelIcon + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + fmtDate + '</div>';
    if (drillNames.length) h += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + drillNames.join(", ") + '</div>';
    h += '</div>';
    h += '<div style="font-size:11px;font-weight:600;color:var(--gold)">+' + getRangeSessionXP(s) + ' XP</div>';
    h += '</div></div>';
  });
  h += '</div>';
  return h;
}

function calcRangeStreak(sessions) {
  if (!sessions.length) return 0;
  var weekSet = {};
  sessions.forEach(function(s) {
    if (!s.date) return;
    var d = new Date(s.date+"T12:00:00");
    var yr = d.getFullYear();
    var wk = Math.floor((d - new Date(yr,0,1)) / 604800000);
    weekSet[yr+"-"+wk] = 1;
  });
  var weeks = Object.keys(weekSet).sort().reverse();
  if (!weeks.length) return 0;
  var streak = 1;
  for (var i = 1; i < weeks.length; i++) {
    var prev = weeks[i-1].split("-"), curr = weeks[i].split("-");
    if (parseInt(prev[0])===parseInt(curr[0]) && parseInt(prev[1])===parseInt(curr[1])+1) streak++;
    else break;
  }
  return streak;
}

// ========== RANGE ACTIVE SESSION PAGE ==========
