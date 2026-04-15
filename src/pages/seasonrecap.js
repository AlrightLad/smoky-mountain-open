// ========== SEASON RECAP ==========
Router.register("seasonrecap", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var season = PB.getSeasonStandings(year);
  var players = PB.getPlayers();
  var allRounds = [];
  players.forEach(function(p) {
    PB.getPlayerRounds(p.id).forEach(function(r) {
      if (r.date && r.date >= year + "-03-01" && r.date <= year + "-09-30") {
        allRounds.push(Object.assign({playerName: p.name || p.username, playerId: p.id}, r));
      }
    });
  });
  var indivRounds = allRounds.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18); });
  
  var h = '<div class="sh"><h2>' + year + ' Recap</h2><button class="back" onclick="Router.back(\'standings\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:24px 16px;background:linear-gradient(180deg,var(--grad-hero),var(--bg));border-bottom:1px solid var(--border)">';
  h += '';
  h += '<div style="font-family:Playfair Display,serif;font-size:24px;color:var(--gold);font-weight:700">' + year + ' Season Recap</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:6px">March 1 — September 30</div></div>';
  
  // Overall stats
  var uniquePlayers = {};
  var uniqueCourses = {};
  var totalScore = 0;
  allRounds.forEach(function(r) { uniquePlayers[r.playerId] = 1; uniqueCourses[r.course] = 1; totalScore += (r.score||0); });
  
  h += '<div class="stats-grid" style="padding:16px">';
  h += '<div class="stat-box"><div class="stat-val">' + allRounds.length + '</div><div class="stat-label">Total Rounds</div></div>';
  h += '<div class="stat-box"><div class="stat-val">' + Object.keys(uniquePlayers).length + '</div><div class="stat-label">Active Players</div></div>';
  h += '<div class="stat-box"><div class="stat-val">' + Object.keys(uniqueCourses).length + '</div><div class="stat-label">Courses Played</div></div>';
  h += '</div>';
  
  // Champion
  if (season.standings.length) {
    var champ = season.standings[0];
    h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--gold)">Season Champion</span></div>';
    h += '<div class="card" style="border-color:rgba(var(--gold-rgb),.3);background:linear-gradient(135deg,var(--grad-card),var(--card))">';
    h += '<div style="padding:20px;text-align:center">';
    h += '';
    h += '<div style="font-family:Playfair Display,serif;font-size:22px;color:var(--gold);font-weight:700">' + escHtml(champ.name||champ.username) + '</div>';
    h += '<div style="font-size:24px;font-weight:800;color:var(--cream);margin-top:4px">' + champ.points + ' points</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:8px">' + champ.rounds + ' rounds · Avg: ' + champ.avg + ' · Best: ' + champ.best + '</div>';
    h += '</div></div></div>';
  }
  
  // Awards
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Season Awards</span></div>';
  
  var awards = [];
  
  // Best single round (individual only)
  var bestRound = null;
  indivRounds.forEach(function(r) { if (r.score && (!bestRound || r.score < bestRound.score)) bestRound = r; });
  if (bestRound) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1C6 4 4 5 4 8a4 4 0 008 0c0-2-1-3-2-4-.5 1-1 2-2 1 0-2 0-3 0-4z' fill='none' stroke='currentColor' stroke-width='1'/></svg>", title:"Low Round of the Season", winner: bestRound.playerName, detail: bestRound.score + " at " + bestRound.course});
  
  // Most rounds played
  var roundCounts = {};
  allRounds.forEach(function(r) { roundCounts[r.playerName] = (roundCounts[r.playerName]||0) + 1; });
  var mostRounds = Object.entries(roundCounts).sort(function(a,b){return b[1]-a[1]});
  if (mostRounds.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><path d='M3 7h10M5 5v4M11 5v4M8 4v8'/></svg>", title:"Grinder Award", winner: mostRounds[0][0], detail: mostRounds[0][1] + " rounds played"});
  
  // Most improved (biggest avg drop)
  if (season.standings.length >= 2) {
    var lastStandings = season.standings.filter(function(s){return s.rounds >= 3});
    // Use first half vs second half avg
    lastStandings.forEach(function(s) {
      var pRounds = allRounds.filter(function(r){return r.playerId === s.id}).sort(function(a,b){return a.date > b.date ? 1 : -1});
      if (pRounds.length >= 4) {
        var half = Math.floor(pRounds.length / 2);
        var firstHalf = pRounds.slice(0, half);
        var secondHalf = pRounds.slice(half);
        var firstAvg = firstHalf.reduce(function(a,r){return a+r.score},0) / firstHalf.length;
        var secondAvg = secondHalf.reduce(function(a,r){return a+r.score},0) / secondHalf.length;
        s._improvement = firstAvg - secondAvg;
      } else { s._improvement = 0; }
    });
    var mostImproved = lastStandings.sort(function(a,b){return (b._improvement||0)-(a._improvement||0)});
    if (mostImproved.length && mostImproved[0]._improvement > 0) {
      awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><path d='M2 12l4-4 3 2 5-6'/><path d='M11 4h3v3'/></svg>", title:"Most Improved", winner: mostImproved[0].name||mostImproved[0].username, detail: "Improved " + Math.round(mostImproved[0]._improvement*10)/10 + " strokes"});
    }
  }
  
  // Road warrior (most courses)
  var courseCounts = {};
  allRounds.forEach(function(r) {
    if (!courseCounts[r.playerName]) courseCounts[r.playerName] = {};
    courseCounts[r.playerName][r.course] = 1;
  });
  var roadWarriors = Object.entries(courseCounts).map(function(e){return [e[0], Object.keys(e[1]).length]}).sort(function(a,b){return b[1]-a[1]});
  if (roadWarriors.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><path d='M2 3l4 1 4-1 4 1v10l-4-1-4 1-4-1z'/><path d='M6 4v10M10 3v10'/></svg>", title:"Road Warrior", winner: roadWarriors[0][0], detail: roadWarriors[0][1] + " different courses"});
  
  // Consistency king (lowest std dev — individual 18-hole rounds only)
  var consistencyData = [];
  players.forEach(function(p) {
    var pr = indivRounds.filter(function(r){return r.playerId === p.id});
    if (pr.length >= 3) {
      var avg = pr.reduce(function(a,r){return a+r.score},0) / pr.length;
      var variance = pr.reduce(function(a,r){return a + Math.pow(r.score-avg,2)},0) / pr.length;
      consistencyData.push({name: p.name||p.username, stdDev: Math.sqrt(variance)});
    }
  });
  if (consistencyData.length) {
    consistencyData.sort(function(a,b){return a.stdDev-b.stdDev});
    awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='8' cy='8' r='6'/><circle cx='8' cy='8' r='3'/><circle cx='8' cy='8' r='.8' fill='currentColor'/></svg>", title:"Consistency King", winner: consistencyData[0].name, detail: "±" + Math.round(consistencyData[0].stdDev*10)/10 + " stroke variance"});
  }
  
  awards.forEach(function(a) {
    h += '<div class="card" style="margin-bottom:8px"><div style="padding:14px 16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="font-size:28px;flex-shrink:0">' + a.icon + '</div>';
    h += '<div><div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">' + a.title + '</div>';
    h += '<div style="font-size:15px;font-weight:700;color:var(--cream)">' + escHtml(a.winner) + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(a.detail) + '</div>';
    h += '</div></div></div>';
  });
  
  if (!awards.length) {
    h += '<div class="card"><div class="empty"><div class="empty-text">No awards yet — log some rounds!</div></div></div>';
  }
  h += '</div>';
  
  // Final standings
  if (season.standings.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Final Standings</span></div>';
    season.standings.forEach(function(s, idx) {
      var medal = idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : (idx+1) + ".";
      h += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="display:flex;align-items:center;gap:12px">';
      h += '<div style="font-size:18px;width:28px;text-align:center">' + medal + '</div>';
      h += '<div><div style="font-size:13px;font-weight:600">' + escHtml(s.name||s.username) + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + s.rounds + ' rds · Avg: ' + s.avg + '</div></div></div>';
      h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)">' + s.points + '</div>';
      h += '</div></div>';
    });
    h += '</div>';
  }
  
  h += '<div style="text-align:center;padding:20px;font-size:10px;color:var(--muted2)">See you next season · March ' + (year+1) + '</div>';
  
  document.querySelector('[data-page="seasonrecap"]').innerHTML = h;
});
