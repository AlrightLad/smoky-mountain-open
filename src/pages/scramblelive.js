// ========== SCRAMBLE LIVE SCORING ==========
var scrambleLiveState = { active: false, team: null, course: "", scores: [], currentHole: 0 };

function startScrambleLive() {
  var courseEl = document.getElementById("sl-course");
  var teamEl = document.getElementById("sl-team");
  if (!courseEl || !teamEl) return;
  var course = courseEl.value;
  var teamId = teamEl.value;
  if (!course) { Router.toast("Select a course"); return; }
  if (!teamId) { Router.toast("Select a team"); return; }
  
  var team = PB.getScrambleTeams().find(function(t) { return t.id === teamId; });
  if (!team) { Router.toast("Team not found"); return; }
  
  scrambleLiveState = {
    active: true,
    team: team,
    teamId: teamId,
    course: course,
    rating: parseFloat(document.getElementById("sl-rating").value) || 72,
    slope: parseInt(document.getElementById("sl-slope").value) || 113,
    startTime: Date.now(),
    currentHole: 0,
    scores: Array(18).fill(""),
    putts: Array(18).fill("")
  };
  Router.go("scramble-live");
}

Router.register("scramble-live", function() {
  if (!scrambleLiveState.active) {
    renderScrambleLiveSetup();
    return;
  }
  renderScrambleLiveScoring();
});

function renderScrambleLiveSetup() {
  var teams = PB.getScrambleTeams();
  var h = '<div class="sh"><h2>Scramble Round</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:16px"><div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">Live Scramble Scoring</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">Score hole by hole as a team</div></div>';
  
  h += '<div class="form-section">';
  h += '<div class="ff"><label class="ff-label">Team</label><select class="ff-input" id="sl-team">';
  h += '<option value="">Select team...</option>';
  teams.forEach(function(t) {
    var names = t.members.map(function(id) { var p = PB.getPlayer(id); return p ? p.name : id; }).join(" & ");
    h += '<option value="' + t.id + '">' + escHtml(t.name) + ' (' + names + ')</option>';
  });
  h += '</select></div>';
  
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="sl-course" placeholder="Start typing..." oninput="showScrambleCourseSearch(this)"><div id="search-sl-course" class="search-results"></div></div>';
  h += '<input type="hidden" id="sl-rating" value=""><input type="hidden" id="sl-slope" value="">';
  
  if (!teams.length) {
    h += '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">No scramble teams yet — <span style="color:var(--gold);cursor:pointer" onclick="Router.go(\'scramble\',{create:true})">create one first</span></div>';
  } else {
    h += '<button class="btn full green" onclick="startScrambleLive()" style="margin-top:8px">Start Scramble Round</button>';
  }
  h += '</div>';
  
  document.querySelector('[data-page="scramble-live"]').innerHTML = h;
}

function showScrambleCourseSearch(input) {
  var results = PB.searchCourses(input.value);
  var container = document.getElementById("search-sl-course");
  if (!results.length) { container.innerHTML = ""; return; }
  var h = '';
  results.forEach(function(c) {
    h += '<div class="search-item" onclick="document.getElementById(\'sl-course\').value=\'' + c.name.replace(/'/g, "\\'") + '\';document.getElementById(\'sl-rating\').value=\'' + c.rating + '\';document.getElementById(\'sl-slope\').value=\'' + c.slope + '\';document.getElementById(\'search-sl-course\').innerHTML=\'\'"><span>' + c.name + '</span> <span style="color:var(--muted);font-size:11px">' + c.loc + '</span></div>';
  });
  container.innerHTML = h;
}

function renderScrambleLiveScoring() {
  var s = scrambleLiveState;
  var hole = s.currentHole;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var par = defaultPar[hole] || 4;
  var members = s.team.members.map(function(id) { var p = PB.getPlayer(id); return p ? p.name : id; });
  
  var totalSoFar = 0, holesPlayed = 0;
  s.scores.forEach(function(sc) { if (sc !== "") { totalSoFar += parseInt(sc); holesPlayed++; } });
  var parSoFar = 0;
  for (var pi = 0; pi < holesPlayed; pi++) parSoFar += defaultPar[pi] || 4;
  
  var h = '';
  h += '<div style="padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-size:13px;font-weight:600">' + escHtml(s.course) + '</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:1px">' + escHtml(s.team.name) + ' · Scramble</div></div>';
  h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold)">' + (totalSoFar || "—") + '</div>';
  if (holesPlayed > 0) {
    var diff = totalSoFar - parSoFar;
    h += '<div style="font-size:10px;color:' + (diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (diff > 0 ? '+' : '') + diff + ' thru ' + holesPlayed + '</div>';
  }
  h += '</div></div>';
  
  // Hole dots
  h += '<div style="padding:10px 16px;display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none">';
  for (var i = 0; i < 18; i++) {
    var dotColor = s.scores[i] !== "" ? (parseInt(s.scores[i]) <= (defaultPar[i]||4) ? "var(--birdie)" : parseInt(s.scores[i]) > (defaultPar[i]||4)+1 ? "var(--red)" : "var(--gold)") : (i === hole ? "var(--cream)" : "var(--bg4)");
    h += '<div onclick="scrambleLiveState.currentHole=' + i + ';Router.go(\'scramble-live\')" style="width:14px;height:14px;border-radius:50%;background:' + dotColor + ';flex-shrink:0;cursor:pointer;border:' + (i === hole ? '2px solid var(--gold)' : '1px solid var(--border)') + '"></div>';
  }
  h += '</div>';
  
  // Current hole
  h += '<div style="text-align:center;padding:32px 16px">';
  h += '<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:2px">Hole ' + (hole+1) + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:48px;color:var(--gold);font-weight:700;margin:8px 0">Par ' + par + '</div>';
  h += '<div style="font-size:10px;color:var(--muted2)">' + members.join(" · ") + '</div>';
  
  // Score buttons
  h += '<div style="display:flex;gap:8px;justify-content:center;margin-top:24px;flex-wrap:wrap">';
  for (var sc = Math.max(1, par - 2); sc <= par + 4; sc++) {
    var label = sc === par - 2 ? "Eagle" : sc === par - 1 ? "Birdie" : sc === par ? "Par" : sc === par + 1 ? "Bogey" : sc === par + 2 ? "Double" : sc === par + 3 ? "Triple" : "+" + (sc - par);
    var color = sc < par ? "var(--birdie)" : sc === par ? "var(--gold)" : sc === par + 1 ? "var(--muted)" : "var(--red)";
    var isSelected = s.scores[hole] !== "" && parseInt(s.scores[hole]) === sc;
    h += '<div onclick="setScrambleScore(' + hole + ',' + sc + ')" style="width:68px;padding:12px 4px;text-align:center;border-radius:var(--radius);cursor:pointer;border:2px solid ' + (isSelected ? color : 'var(--border)') + ';background:' + (isSelected ? color + '15' : 'var(--card)') + '">';
    h += '<div style="font-size:20px;font-weight:700;color:' + color + '">' + sc + '</div>';
    h += '<div style="font-size:8px;color:var(--muted);margin-top:2px">' + label + '</div></div>';
  }
  h += '</div></div>';
  
  // Nav buttons
  h += '<div style="display:flex;gap:8px;padding:16px">';
  if (hole > 0) h += '<button class="btn full outline" onclick="scrambleLiveState.currentHole--;Router.go(\'scramble-live\')">← Prev</button>';
  if (hole < 17) h += '<button class="btn full green" onclick="scrambleLiveState.currentHole++;Router.go(\'scramble-live\')">Next →</button>';
  else h += '<button class="btn full green" onclick="finishScrambleLive()">Finish Round</button>';
  h += '</div>';
  
  // Quit option
  h += '<div style="text-align:center;padding:0 16px 20px"><span style="font-size:10px;color:var(--muted2);cursor:pointer" onclick="if(confirm(\'Quit this round?\')){ scrambleLiveState.active=false; Router.go(\'rounds\'); }">Quit round</span></div>';
  
  document.querySelector('[data-page="scramble-live"]').innerHTML = h;
}

function setScrambleScore(hole, score) {
  scrambleLiveState.scores[hole] = score;
  Router.go("scramble-live");
}

function finishScrambleLive() {
  var s = scrambleLiveState;
  var total = 0, played = 0;
  s.scores.forEach(function(sc) { if (sc !== "") { total += parseInt(sc); played++; } });
  
  if (played < 9) { Router.toast("Score at least 9 holes"); return; }
  if (!confirm("Finish scramble round? Total: " + total + " (" + played + " holes)")) return;
  
  // Log the match for the team
  var match = {
    id: Date.now().toString(36),
    date: localDateStr(),
    course: s.course,
    score: total,
    holes: played,
    result: "complete",
    scores: s.scores.slice()
  };
  
  var team = PB.getScrambleTeams().find(function(t) { return t.id === s.teamId; });
  if (team) {
    if (!team.matches) team.matches = [];
    team.matches.push(match);
    PB.save();
  }
  
  // Sync to Firebase
  if (db) {
    db.collection("scramble_rounds").add({
      teamId: s.teamId,
      teamName: s.team.name,
      course: s.course,
      score: total,
      holes: played,
      scores: s.scores,
      date: match.date,
      createdBy: currentUser ? currentUser.uid : "local",
      createdAt: fsTimestamp()
    }).catch(function(){});
    
    // Post to activity feed
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(),
      text: s.team.name + " shot " + total + " in a scramble at " + s.course + "!",
      authorId: "system",
      authorName: "Parbaughs",
      createdAt: fsTimestamp()
    }))(function(){});
  }
  
  scrambleLiveState = { active: false };
  // Haptic success on round finish (Ship 0b-iii)
  if (typeof hapticSuccess === "function") hapticSuccess();
  Router.toast("Scramble round saved! ");
  Router.go("rounds");
}
