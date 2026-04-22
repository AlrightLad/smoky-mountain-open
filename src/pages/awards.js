// ========== YEARLY AWARDS CEREMONY ==========
Router.register("awards", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var now = new Date();
  var seasonOver = now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() === 30);
  var season = PB.getSeasonStandings(year);
  var players = PB.getPlayers();
  
  var h = '<div class="sh"><h2>Awards Night</h2><button class="back" onclick="Router.back(\'standings\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:30px 16px 24px;background:linear-gradient(180deg,var(--bg),var(--grad-hero),var(--bg));border-bottom:1px solid rgba(var(--gold-rgb),.15)">';
  h += '';
  h += '<div style="font-family:Playfair Display,serif;font-size:28px;color:var(--gold);font-weight:700;letter-spacing:1px">The ' + year + '</div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:22px;color:var(--cream);font-weight:400;margin-top:2px">Parbaugh Awards</div>';
  if (!seasonOver) {
    h += '<div style="display:inline-block;margin-top:14px;padding:5px 14px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:12px;font-size:10px;color:var(--gold);font-weight:600;letter-spacing:.5px">PROJECTED · SEASON IN PROGRESS</div>';
  }
  h += '</div>';
  
  // Build all awards from season data
  var allRounds = [];
  players.forEach(function(p) {
    PB.getPlayerRounds(p.id).forEach(function(r) {
      if (r.date && r.date >= year + "-03-01" && r.date <= year + "-09-30") {
        allRounds.push(Object.assign({playerName: p.name || p.username, playerId: p.id}, r));
      }
    });
  });
  var indivAwardRounds = allRounds.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18); });
  
  var ceremonyAwards = [];
  
  // 1. Player of the Year
  if (season.standings.length) {
    ceremonyAwards.push({icon: "", title: "Player of the Year", winner: season.standings[0].name||season.standings[0].username, detail: season.standings[0].points + " season points", tier: "gold"});
  }
  
  // 2. Scoring Champion (lowest avg)
  var scoringChamp = season.standings.filter(function(s){return s.rounds >= 3}).sort(function(a,b){return a.avg-b.avg});
  if (scoringChamp.length) {
    ceremonyAwards.push({icon: "", title: "Scoring Champion", winner: scoringChamp[0].name||scoringChamp[0].username, detail: "Average: " + scoringChamp[0].avg, tier: "gold"});
  }
  
  // 3. Round of the Year
  var bestRound = null;
  allRounds.forEach(function(r) { if (r.score && (!bestRound || r.score < bestRound.score)) bestRound = r; });
  if (bestRound) ceremonyAwards.push({icon: "", title: "Round of the Year", winner: bestRound.playerName, detail: bestRound.score + " at " + bestRound.course, tier: "gold"});
  
  // 4. Iron Man (most rounds)
  var roundCounts = {};
  allRounds.forEach(function(r) { roundCounts[r.playerName] = (roundCounts[r.playerName]||0) + 1; });
  var ironMan = Object.entries(roundCounts).sort(function(a,b){return b[1]-a[1]});
  if (ironMan.length) ceremonyAwards.push({icon: "", title: "Iron Man", winner: ironMan[0][0], detail: ironMan[0][1] + " rounds played", tier: "silver"});
  
  // 5. Most Improved
  var improvData = season.standings.filter(function(s){return s.rounds >= 3});
  improvData.forEach(function(s) {
    var pRounds = allRounds.filter(function(r){return r.playerId === s.id}).sort(function(a,b){return a.date > b.date ? 1 : -1});
    if (pRounds.length >= 4) {
      var half = Math.floor(pRounds.length / 2);
      var firstAvg = pRounds.slice(0, half).reduce(function(a,r){return a+r.score},0) / half;
      var secondAvg = pRounds.slice(half).reduce(function(a,r){return a+r.score},0) / (pRounds.length - half);
      s._improv = firstAvg - secondAvg;
    } else s._improv = 0;
  });
  var mostImproved = improvData.sort(function(a,b){return (b._improv||0)-(a._improv||0)});
  if (mostImproved.length && mostImproved[0]._improv > 0) {
    ceremonyAwards.push({icon: "", title: "Most Improved", winner: mostImproved[0].name||mostImproved[0].username, detail: "Dropped " + Math.round(mostImproved[0]._improv*10)/10 + " strokes avg", tier: "silver"});
  }
  
  // 6. Explorer
  var exploreCounts = {};
  allRounds.forEach(function(r) {
    if (!exploreCounts[r.playerName]) exploreCounts[r.playerName] = {};
    exploreCounts[r.playerName][r.course] = 1;
  });
  var explorers = Object.entries(exploreCounts).map(function(e){return [e[0], Object.keys(e[1]).length]}).sort(function(a,b){return b[1]-a[1]});
  if (explorers.length) ceremonyAwards.push({icon: "", title: "Explorer Award", winner: explorers[0][0], detail: explorers[0][1] + " courses played", tier: "silver"});
  
  // 7. Consistency Award (individual 18-hole rounds only)
  var conData = [];
  players.forEach(function(p) {
    var pr = indivAwardRounds.filter(function(r){return r.playerId === p.id});
    if (pr.length >= 3) {
      var avg = pr.reduce(function(a,r){return a+r.score},0) / pr.length;
      var variance = pr.reduce(function(a,r){return a + Math.pow(r.score-avg,2)},0) / pr.length;
      var stdDev = Math.sqrt(variance);
      if (!Number.isFinite(stdDev)) stdDev = 0;
      conData.push({name: p.name||p.username, stdDev: stdDev});
    }
  });
  if (conData.length) {
    conData.sort(function(a,b){return a.stdDev-b.stdDev});
    ceremonyAwards.push({icon: "", title: "Mr. Consistent", winner: conData[0].name, detail: "±" + Math.round(conData[0].stdDev*10)/10 + " variance", tier: "bronze"});
  }
  
  // 8. Attendance award (perfect attendance = played every month Mar-Sep)
  players.forEach(function(p) {
    var months = {};
    allRounds.filter(function(r){return r.playerId === p.id}).forEach(function(r) {
      var m = parseInt(r.date.split("-")[1]);
      months[m] = true;
    });
    var activeMonths = Object.keys(months).length;
    if (activeMonths >= 7) ceremonyAwards.push({icon: "", title: "Perfect Attendance", winner: p.name||p.username, detail: "Played all 7 months", tier: "bronze"});
  });
  
  // Render ceremony
  ceremonyAwards.forEach(function(a) {
    var borderColor = a.tier === "gold" ? "rgba(var(--gold-rgb),.25)" : a.tier === "silver" ? "rgba(var(--cream-rgb),.08)" : "rgba(var(--gold-rgb),.06)";
    var bgGrad = a.tier === "gold" ? "linear-gradient(135deg,var(--grad-card),var(--card))" : "var(--card)";
    h += '<div class="card" style="margin:8px 16px;border-color:' + borderColor + ';background:' + bgGrad + '">';
    h += '<div style="padding:16px;display:flex;align-items:center;gap:16px">';
    h += '<div style="font-size:36px;flex-shrink:0">' + a.icon + '</div>';
    h += '<div style="flex:1"><div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px">' + a.title + '</div>';
    h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--cream);font-weight:700">' + escHtml(a.winner) + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + escHtml(a.detail) + '</div>';
    h += '</div></div></div>';
  });
  
  if (!ceremonyAwards.length) {
    h += '<div class="card" style="margin:16px"><div class="empty" style="padding:32px"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><path d="M12 22V2"/><path d="M12 2l8 4-8 4"/><circle cx="12" cy="22" r="2"/></svg></div><div class="empty-text">No season data yet</div>';
    h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Log rounds during the season (Mar—Sep) to unlock awards</div></div></div>';
  }
  
  h += '<div style="text-align:center;padding:24px;font-size:10px;color:var(--muted2);font-style:italic">"It\'s not about the handicap you have, it\'s about the stories you make."</div>';
  
  document.querySelector('[data-page="awards"]').innerHTML = h;
});
