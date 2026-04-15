/* ================================================
   PAGE: SEASON
   ================================================ */

Router.register("standings", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var seasonKey = (params && params.season) ? params.season : null;
  var season = PB.getSeasonStandings(year, seasonKey);
  var currentSeason = PB.getCurrentSeason();
  var now = new Date();
  var todayStr = localDateStr(now);
  var inSeason = todayStr >= season.seasonStart && todayStr <= season.seasonEnd;

  var h = '<div class="sh"><h2>Season</h2><button class="back" onclick="Router.back(\'records\')">← Back</button></div>';

  // Season selector tabs
  h += '<div class="toggle-bar" style="justify-content:center">';
  PB.SEASON_CONFIG.forEach(function(cfg) {
    var isActive = season.seasonKey === cfg.key && season.year === year;
    h += '<button' + (isActive ? ' class="a"' : '') + ' onclick="Router.go(\'standings\',{year:' + year + ',season:\'' + cfg.key + '\'},true)">' + cfg.label + '</button>';
  });
  h += '</div>';

  h += '<div style="text-align:center;padding:20px 16px 24px;background:linear-gradient(180deg,var(--grad-hero),var(--bg));border-bottom:1px solid var(--border)">';
  h += '<div style="font-family:Playfair Display,serif;font-size:28px;color:var(--gold);font-weight:700">' + escHtml(season.seasonLabel) + '</div>';
  var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var sStart = new Date(season.seasonStart + "T12:00:00");
  var sEnd = new Date(season.seasonEnd + "T12:00:00");
  h += '<div style="font-size:11px;color:var(--muted);margin-top:6px;letter-spacing:1.5px;text-transform:uppercase">' + monthNames[sStart.getMonth()] + ' ' + sStart.getDate() + ' — ' + monthNames[sEnd.getMonth()] + ' ' + sEnd.getDate() + ', ' + year + '</div>';
  if (inSeason) {
    var daysLeft = Math.ceil((sEnd - now) / (1000*60*60*24));
    h += '<div style="display:inline-block;margin-top:10px;padding:5px 14px;background:rgba(var(--birdie-rgb),.08);border:1px solid rgba(var(--birdie-rgb),.15);border-radius:12px;font-size:10px;color:var(--birdie);font-weight:600;letter-spacing:.5px">IN SEASON · ' + daysLeft + ' DAYS LEFT</div>';
  } else {
    h += '<div style="display:inline-block;margin-top:10px;padding:5px 14px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:12px;font-size:10px;color:var(--gold);font-weight:600;letter-spacing:.5px">SEASON COMPLETE</div>';
  }
  h += '</div>';

  if (season.standings.length) {
    var totalRounds = season.standings.reduce(function(a,s){return a+s.rounds},0);
    var bestScore = Math.min.apply(null, season.standings.filter(function(s){return s.best}).map(function(s){return s.best}).concat([999]));
    h += '<div class="stats-grid" style="padding:12px 16px">';
    h += '<div class="stat-box"><div class="stat-val" data-count="' + season.standings.length + '">0</div><div class="stat-label">Active</div></div>';
    h += '<div class="stat-box"><div class="stat-val" data-count="' + totalRounds + '">0</div><div class="stat-label">Rounds</div></div>';
    h += '<div class="stat-box"><div class="stat-val"' + (bestScore < 999 ? ' data-count="' + bestScore + '">0' : '>—') + '</div><div class="stat-label">Low round</div></div>';
    h += '</div>';
  }

  h += '<div class="section"><div class="sec-head"><span class="sec-title">Standings</span></div>';
  if (season.standings.length) {
    season.standings.forEach(function(s, idx) {
      var medal = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : (idx+1) + '';
      var medalColor = idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--medal-silver)' : idx === 2 ? 'var(--medal-bronze)' : 'var(--muted)';
      var isFirst = idx === 0;
      h += '<div class="card" style="' + (isFirst ? 'border-color:rgba(var(--gold-rgb),.2);background:linear-gradient(135deg,var(--grad-card),var(--card))' : '') + '">';
      h += '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="display:flex;align-items:center;gap:14px">';
      h += '<div style="font-size:16px;width:32px;text-align:center;font-weight:800;color:' + medalColor + '">' + medal + '</div>';
      h += '<div><div style="font-size:14px;font-weight:600">' + s.username + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + s.rounds + ' rds · Avg: ' + (s.avg||"—") + ' · Best: ' + (s.best||"—") + '</div>';
      if (s.courses && s.courses.length) {
        h += '<div style="font-size:9px;color:var(--muted2);margin-top:3px;line-height:1.4">' + s.courses.join(', ') + '</div>';
      }
      h += '</div></div>';
      h += '<div style="text-align:right"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:var(--gold)" data-count="' + (s.points||0) + '">0</div>';
      h += '<div style="font-size:9px;color:var(--muted);letter-spacing:.5px">PTS</div></div>';
      h += '</div></div>';
    });
  } else {
    h += '<div class="card"><div class="empty" style="padding:28px"><div style="width:40px;height:40px;margin:0 auto 8px;opacity:.3;border-radius:8px;overflow:hidden"><img alt="" src="watermark.jpg" style="width:100%;height:100%;object-fit:cover"></div>';
    h += '<div class="empty-text">No rounds this season</div>';
    h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Log rounds March—September to appear</div></div></div>';
  }
  h += '</div>';

  h += '<div class="section"><div class="sec-head" onclick="toggleSection(\'season-rules\')" style="cursor:pointer"><span class="sec-title">Season rules</span><span class="sec-link" id="season-rules-toggle" style="display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s;color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></span></div>';
  h += '<div id="season-rules" style="display:none">';
  h += '<div class="club-row"><span class="club-name">Season window</span><span class="club-yd">March 1 — September 30</span></div>';
  h += '<div class="club-row"><span class="club-name">Ranking method</span><span class="club-yd">Season point system</span></div>';
  h += '<div class="club-row"><span class="club-name">Base rules</span><span class="club-yd">USGA rules apply</span></div>';
  h += '<div class="club-row"><span class="club-name">Breakfast balls</span><span class="club-yd">2 per round (1 front, 1 back)</span></div>';
  h += '<div class="club-row"><span class="club-name">Honor system</span><span class="club-yd">Scouts honor — attested scores earn 150 XP</span></div>';
  h += '<div class="club-row"><span class="club-name">Inactivity</span><span class="club-yd">3 months = 3 rounds to reactivate</span></div>';
  h += '<div class="club-row"><span class="club-name">Eligible rounds</span><span class="club-yd">Public rounds only</span></div>';
  h += '<div class="club-row"><span class="club-name">Season winner</span><span class="club-yd">Earns title + unique profile photo</span></div>';
  h += '</div></div>';

  // Courses this season — individual rounds only (no scramble)
  var seasonStart = year + '-03-01';
  var seasonEnd = year + '-09-30';
  var seasonRounds = PB.getRounds().filter(function(r){
    return r.visibility !== "private" && r.date >= seasonStart && r.date <= seasonEnd && r.format !== "scramble" && r.format !== "scramble4";
  });
  var seasonCourseMap = {};
  seasonRounds.forEach(function(r){
    if (!r.course) return;
    if (!seasonCourseMap[r.course]) seasonCourseMap[r.course] = {name: r.course, rounds: 0, best18: null, best18player: null, best9: null, best9player: null, best9mode: null, players: {}};
    seasonCourseMap[r.course].rounds++;
    if (r.playerName) seasonCourseMap[r.course].players[r.playerName] = 1;
    var is18 = !r.holesPlayed || r.holesPlayed >= 18;
    if (is18 && r.score && (seasonCourseMap[r.course].best18 === null || r.score < seasonCourseMap[r.course].best18)) {
      seasonCourseMap[r.course].best18 = r.score;
      seasonCourseMap[r.course].best18player = r.playerName || "Unknown";
    }
    if (!is18 && r.score && (seasonCourseMap[r.course].best9 === null || r.score < seasonCourseMap[r.course].best9)) {
      seasonCourseMap[r.course].best9 = r.score;
      seasonCourseMap[r.course].best9player = r.playerName || "Unknown";
      seasonCourseMap[r.course].best9mode = r.holesMode === "back9" ? "B9" : "F9";
    }
  });
  var seasonCourseList = Object.values(seasonCourseMap).sort(function(a,b){return b.rounds - a.rounds;});
  var scContent = '';
  if (seasonCourseList.length) {
    seasonCourseList.forEach(function(c){
      var playerCount = Object.keys(c.players).length;
      var bestParts = [];
      if (c.best18) bestParts.push(c.best18 + ' (' + escHtml(c.best18player) + ')');
      if (c.best9) bestParts.push(c.best9 + ' ' + c.best9mode + ' (' + escHtml(c.best9player) + ')');
      var bestLabel = bestParts.length ? bestParts.join(' · ') : '—';
      scContent += '<div class="club-row"><span class="club-name">' + escHtml(c.name) + ' <span style="color:var(--muted);font-size:9px">(' + c.rounds + ' rds · ' + playerCount + ' player' + (playerCount !== 1 ? 's' : '') + ')</span></span><span class="club-yd" style="font-size:11px">' + bestLabel + '</span></div>';
    });
  } else {
    scContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No courses played this season</div>';
  }
  h += '<div class="section"><div class="sec-head" onclick="toggleSection(\'season-courses\')" style="cursor:pointer"><span class="sec-title">Courses this season <span style="font-size:11px;color:var(--muted);font-weight:400">(' + seasonCourseList.length + ')</span></span><span class="sec-link" id="season-courses-toggle" style="display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s;color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></span></div>';
  h += '<div id="season-courses" style="display:none"><div class="card">' + scContent + '</div></div></div>';

  // Season Recap, Courses & Awards links
  h += '<div class="section" style="padding:0 16px 16px;display:flex;gap:8px;flex-wrap:wrap">';
  h += '<button class="btn full outline" onclick="Router.go(\'courses\')" style="flex:1;min-width:45%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"/><path d="M9 4v13M15 7v13"/></svg> Courses</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'seasonrecap\',{year:' + year + '})" style="flex:1;min-width:45%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> Season Recap</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'awards\',{year:' + year + '})" style="flex:1;min-width:45%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4M4 5h16v4a6 6 0 01-6 6h-4a6 6 0 01-6-6V5z"/><path d="M12 15v3M8 21h8"/></svg> Awards Night</button>';
  h += '</div>';
  
  document.querySelector('[data-page="standings"]').innerHTML = h;
  setTimeout(initCountAnimations, 50);
});

