// ========== SEASON RECAP ==========
Router.register("seasonrecap", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var season = PB.getSeasonStandings(year, "_year"); // annual (calendar Jan–Dec), same as Wrapped (#59) — the recap is the YEAR's story; the seasonal Spring/Summer/Fall board lives on Standings
  var players = PB.getPlayers();
  var allRounds = [];
  players.forEach(function(p) {
    PB.getPlayerRounds(p.id).forEach(function(r) {
      if (r.date && r.date >= year + "-01-01" && r.date <= year + "-12-31") {
        allRounds.push(Object.assign({playerName: p.name || p.username, playerId: p.id}, r));
      }
    });
  });
  var indivRounds = allRounds.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18); });
  
  // v8.25.61 — season-award GATING (Founder 2026-06-13: "award night + season
  // awards hidden until each season is completed"). Mirrors the Wrapped Dec-1
  // gate: the CURRENT year before Dec 1 is still being played, so the champion +
  // awards are not crowned yet. A past year (or on/after Dec 1) shows full results.
  var _now = new Date();
  var seasonOver = !(year >= _now.getFullYear() && _now < new Date(year, 11, 1));

  // v8.25.61 — editorial masthead (matches Members/Standings/Records/Scramble)
  // replacing the centered grad-hero block that read a design generation behind.
  var h = '<div class="roster-masthead">';
  h += '<button class="back" onclick="Router.back(\'standings\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">SEASON RECAP · ' + year + '</div>';
  h += '<h1 class="roster-headline">The year in full.</h1>';
  h += '<p style="font-family:var(--font-mono);font-size:12px;color:var(--cb-mute);margin:10px 0 0;letter-spacing:.3px">January – December · ' + allRounds.length + ' round' + (allRounds.length === 1 ? '' : 's') + (seasonOver ? '' : ' so far') + '</p>';
  h += '<div style="margin-top:14px"><button class="btn-sm green" style="min-height:44px;padding:0 22px;display:inline-flex;align-items:center;gap:7px" onclick="Router.go(\'wrapped\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M4.5 3.2v9.6a.6.6 0 00.92.5l7.2-4.8a.6.6 0 000-1l-7.2-4.8a.6.6 0 00-.92.5z"/></svg>Play your Wrapped</button></div>';
  h += '</div>';
  
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
  
  // Champion — only crowned once the season is over (gating).
  if (seasonOver && season.standings.length) {
    var champ = season.standings[0];
    h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--gold)">Season Champion</span></div>';
    h += '<div class="card" style="border-color:rgba(var(--gold-rgb),.3);background:linear-gradient(135deg,var(--grad-card),var(--card))">';
    h += '<div style="padding:20px;text-align:center">';
    h += '';
    h += '<div style="font-family:var(--font-display);font-size:22px;color:var(--gold);font-weight:700">' + escHtml(champ.name||champ.username) + '</div>';
    h += '<div style="font-size:24px;font-weight:800;color:var(--cream);margin-top:4px">' + champ.points + ' points</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:8px">' + champ.rounds + ' rounds · Avg: ' + (champ.avg||"—") + ' · Best: ' + (champ.best||"—") + '</div>';
    h += '</div></div></div>';
  }
  
  // Awards
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Season Awards</span></div>';
  
  var awards = [];
  
  // Best single round (individual only)
  var bestRound = null;
  indivRounds.forEach(function(r) { if (r.score && (!bestRound || r.score < bestRound.score)) bestRound = r; });
  if (bestRound) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1C6 4 4 5 4 8a4 4 0 008 0c0-2-1-3-2-4-.5 1-1 2-2 1 0-2 0-3 0-4z' fill='none' stroke='currentColor' stroke-width='1.5'/></svg>", title:"Low Round of the Season", winner: bestRound.playerName, detail: bestRound.score + " at " + bestRound.course});
  
  // Most rounds played
  var roundCounts = {};
  allRounds.forEach(function(r) { roundCounts[r.playerName] = (roundCounts[r.playerName]||0) + 1; });
  var mostRounds = Object.entries(roundCounts).sort(function(a,b){return b[1]-a[1]});
  if (mostRounds.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M3 7h10M5 5v4M11 5v4M8 4v8'/></svg>", title:"Grinder Award", winner: mostRounds[0][0], detail: mostRounds[0][1] + " rounds played"});
  
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
      awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M2 12l4-4 3 2 5-6'/><path d='M11 4h3v3'/></svg>", title:"Most Improved", winner: mostImproved[0].name||mostImproved[0].username, detail: "Improved " + Math.round(mostImproved[0]._improvement*10)/10 + " strokes"});
    }
  }
  
  // Road warrior (most courses)
  var courseCounts = {};
  allRounds.forEach(function(r) {
    if (!courseCounts[r.playerName]) courseCounts[r.playerName] = {};
    courseCounts[r.playerName][r.course] = 1;
  });
  var roadWarriors = Object.entries(courseCounts).map(function(e){return [e[0], Object.keys(e[1]).length]}).sort(function(a,b){return b[1]-a[1]});
  if (roadWarriors.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M2 3l4 1 4-1 4 1v10l-4-1-4 1-4-1z'/><path d='M6 4v10M10 3v10'/></svg>", title:"Road Warrior", winner: roadWarriors[0][0], detail: roadWarriors[0][1] + " different courses", coins: 75});

  // Course Specialist (best avg at most-played course)
  var courseSpecData = [];
  players.forEach(function(p) {
    var pr = indivRounds.filter(function(r){return r.playerId === p.id});
    var courseMap = {};
    pr.forEach(function(r) { if (!courseMap[r.course]) courseMap[r.course] = []; courseMap[r.course].push(r.score); });
    var best = null;
    Object.keys(courseMap).forEach(function(c) {
      if (courseMap[c].length >= 2) {
        var avg = courseMap[c].reduce(function(a,b){return a+b},0) / courseMap[c].length;
        if (!best || avg < best.avg) best = {course:c, avg:avg, count:courseMap[c].length};
      }
    });
    if (best) courseSpecData.push({name:p.name||p.username, course:best.course, avg:Math.round(best.avg*10)/10, count:best.count});
  });
  courseSpecData.sort(function(a,b){return a.avg-b.avg});
  if (courseSpecData.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M4 15l8-12'/><path d='M4 3l8 4-8 4V3z'/></svg>", title:"Course Specialist", winner: courseSpecData[0].name, detail: courseSpecData[0].avg + " avg at " + courseSpecData[0].course + " (" + courseSpecData[0].count + " rounds)", coins: 100});

  // Rivalry Winner (best H2H record among players with 2+ H2H rounds)
  var h2hData = [];
  var pList = players.filter(function(p) { return allRounds.some(function(r){return r.playerId===p.id}); });
  pList.forEach(function(p) {
    var wins = 0, total = 0;
    pList.forEach(function(opp) {
      if (opp.id === p.id) return;
      // Find rounds on same course + same date
      var myR = allRounds.filter(function(r){return r.playerId===p.id});
      myR.forEach(function(r) {
        var oppR = allRounds.find(function(o){return o.playerId===opp.id && o.course===r.course && o.date===r.date});
        if (oppR) { total++; if (r.score < oppR.score) wins++; }
      });
    });
    if (total >= 2) h2hData.push({name:p.name||p.username, wins:wins, total:total, pct:Math.round(wins/total*100)});
  });
  h2hData.sort(function(a,b){return b.pct-a.pct||b.wins-a.wins});
  if (h2hData.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M13 10V3L4 14h7v7l9-11h-7z'/></svg>", title:"Rivalry Winner", winner: h2hData[0].name, detail: h2hData[0].wins + " wins in " + h2hData[0].total + " H2H matches (" + h2hData[0].pct + "%)", coins: 100});

  // Iron Will (most range sessions)
  if (typeof liveRangeSessions !== "undefined" && liveRangeSessions.length) {
    var rangeByPlayer = {};
    liveRangeSessions.forEach(function(s) {
      if (s.date && s.date >= season.seasonStart && s.date <= season.seasonEnd) {
        var pn = s.playerName || "Unknown";
        rangeByPlayer[pn] = (rangeByPlayer[pn]||0) + 1;
      }
    });
    var topRange = Object.entries(rangeByPlayer).sort(function(a,b){return b[1]-a[1]});
    if (topRange.length) awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='8' r='6'/><path d='M8 5v3l2 1.5'/></svg>", title:"Iron Will", winner: topRange[0][0], detail: topRange[0][1] + " range sessions", coins: 75});
  }

  // Consistency king (lowest std dev — individual 18-hole rounds only)
  var consistencyData = [];
  players.forEach(function(p) {
    var pr = indivRounds.filter(function(r){return r.playerId === p.id});
    if (pr.length >= 3) {
      var avg = pr.reduce(function(a,r){return a+r.score},0) / pr.length;
      var variance = pr.reduce(function(a,r){return a + Math.pow(r.score-avg,2)},0) / pr.length;
      var stdDev = Math.sqrt(variance);
      if (!Number.isFinite(stdDev)) stdDev = 0;
      consistencyData.push({name: p.name||p.username, stdDev: stdDev});
    }
  });
  if (consistencyData.length) {
    consistencyData.sort(function(a,b){return a.stdDev-b.stdDev});
    awards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='8' r='6'/><circle cx='8' cy='8' r='3'/><circle cx='8' cy='8' r='.8' fill='currentColor'/></svg>", title:"Consistency King", winner: consistencyData[0].name, detail: "±" + Math.round(consistencyData[0].stdDev*10)/10 + " stroke variance"});
  }
  
  if (!seasonOver) {
    // Gating (Founder): awards crown only when the season closes.
    h += '<div class="card"><div style="padding:18px 16px;text-align:center">';
    h += '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:17px;color:var(--cb-ink)">Awards crown when the season closes.</div>';
    h += '<div style="font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5;max-width:300px;margin-left:auto;margin-right:auto">The ' + year + ' season is still being played — Champion, Low Round, the Grinder and the rest stay sealed until <b style="color:var(--cb-ink)">December 31</b>. Keep teeing it up.</div></div></div>';
  } else {
    awards.forEach(function(a) {
      // .sr-award__ico is a real brass icon chip (the old inline font-size:28px
      // wrapper did nothing — the SVG is a fixed 14px, so it just added dead box).
      h += '<div class="card sr-award"><div style="padding:14px 16px;display:flex;align-items:center;gap:14px">';
      h += '<div class="sr-award__ico">' + a.icon + '</div>';
      h += '<div><div class="sr-award__title">' + a.title + '</div>';
      h += '<div class="sr-award__winner">' + escHtml(a.winner) + '</div>';
      h += '<div class="sr-award__detail">' + escHtml(a.detail) + '</div>';
      h += '</div></div></div>';
    });
    if (!awards.length) {
      h += '<div class="card"><div class="empty"><div class="empty-text">No awards yet, log some rounds!</div></div></div>';
    }
  }
  h += '</div>';
  
  // Final standings
  if (season.standings.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">' + (seasonOver ? 'Final' : 'Current') + ' Standings</span></div>';
    season.standings.forEach(function(s, idx) {
      var chipCls = idx === 0 ? 'sr-rank--gold' : idx === 1 ? 'sr-rank--silver' : idx === 2 ? 'sr-rank--bronze' : '';
      h += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="display:flex;align-items:center;gap:12px">';
      h += '<div class="sr-rank ' + chipCls + '">' + (idx + 1) + '</div>';
      h += '<div><div style="font-size:13px;font-weight:600;color:var(--cb-ink)">' + escHtml(s.name||s.username) + '</div>';
      h += '<div style="font-size:10px;color:var(--cb-mute);margin-top:2px">' + s.rounds + ' rd' + (s.rounds === 1 ? '' : 's') + ' · Avg ' + (s.avg||"—") + '</div></div></div>';
      h += '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--cb-brass)">' + s.points + '</div>';
      h += '</div></div>';
    });
    h += '</div>';
  }
  
  h += '<div style="text-align:center;padding:20px;font-size:10px;color:var(--muted2)">Here\'s to ' + (year+1) + '</div>';
  
  document.querySelector('[data-page="seasonrecap"]').innerHTML = h;
  // v8.25.50 — entrance: stat boxes + award/standings cards reveal in, numbers
  // count up. Reduced-motion no-ops inside the helpers.
  if (window.staggeredReveal) {
    window.staggeredReveal(document.querySelectorAll('[data-page="seasonrecap"] .stat-box'), { gap: 70, duration: 340 });
    window.staggeredReveal(document.querySelectorAll('[data-page="seasonrecap"] .card'), { gap: 60, duration: 360 });
  }
  if (window.initCountAnimations) window.initCountAnimations(document.querySelector('[data-page="seasonrecap"]'));
});
