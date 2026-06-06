/* ================================================
   PAGE: SEASON STANDINGS — CLUBHOUSE_SPEC-HQ-3d (Leaderboard)
   ================================================
   Editorial redesign (W1 3d). Structural language mirrors the Members
   roster (3e): editorial masthead + scope tabs + dense .roster-table +
   two-column .hq-grid with an agate right rail. Every visible value
   traces to source (P9). Spec features with no data model are skipped,
   not fabricated: week-over-week "Movers" deltas and the WeekDoc[]
   Schedule rail have no source, so neither renders. The spec's
   Stableford/Stroke/Net scope maps to the existing season selector
   (the only ranking dimension the data model carries: season points).

   Trophy Watch stays in the MAIN column (not the agate rail): the rail
   is hidden <960px and Trophy Watch (birdies, best round) is not
   derivable from the standings table, so railing it would drop the
   content on mobile — a regression for a mobile-first PWA. */

Router.register("standings", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var seasonKey = (params && params.season) ? params.season : null;
  var season = PB.getSeasonStandings(year, seasonKey);
  var standings = season.standings || [];
  var now = new Date();
  var todayStr = localDateStr(now);
  var isUpcoming = todayStr < season.seasonStart;
  var isComplete = todayStr > season.seasonEnd;
  var inSeason = !isUpcoming && !isComplete;

  var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var sStartD = new Date(season.seasonStart + "T12:00:00");
  var sEndD = new Date(season.seasonEnd + "T12:00:00");
  var dateRange = monthNames[sStartD.getMonth()] + " " + sStartD.getDate() + " – " +
                  monthNames[sEndD.getMonth()] + " " + sEndD.getDate() + ", " + year;

  var totalRounds = standings.reduce(function(a, s){ return a + (s.rounds || 0); }, 0);
  var bestScore = Math.min.apply(null, standings.filter(function(s){ return s.best; }).map(function(s){ return s.best; }).concat([999]));
  var leader = standings.length ? standings[0] : null;
  var leaderName = leader ? (leader.name || leader.username || "A member") : "";
  var leaderPts = leader ? (leader.points || 0) : 0;

  var viewerUid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
  var viewerClaimed = (typeof currentProfile !== "undefined" && currentProfile) ? currentProfile.claimedFrom : null;

  // ── Masthead ──────────────────────────────────────────────────────────
  var headlineMain, headlineAccent;
  if (!standings.length) { headlineMain = "The board "; headlineAccent = "awaits."; }
  else if (isComplete) { headlineMain = "The final "; headlineAccent = "board."; }
  else { headlineMain = "The board "; headlineAccent = "so far."; }

  var deck;
  if (!standings.length) {
    deck = isUpcoming
      ? "The " + season.seasonLabel + " season has not teed off yet."
      : "No rounds logged yet this " + season.seasonLabel + ". Log a round to open the board.";
  } else if (isComplete) {
    deck = leaderPts > 0
      ? leaderName + " takes the " + season.seasonLabel + " title with " + leaderPts + " pts."
      : leaderName + " tops the final " + season.seasonLabel + " board.";
  } else {
    deck = standings.length + " golfer" + (standings.length !== 1 ? "s" : "") + ", " +
           totalRounds + " round" + (totalRounds !== 1 ? "s" : "") + " in." +
           (leaderPts > 0 ? " " + leaderName + " leads with " + leaderPts + " pts." : "");
  }

  var badge;
  if (isUpcoming) {
    badge = '<span class="std-badge">Upcoming</span>';
  } else if (inSeason) {
    var daysLeft = Math.max(0, Math.ceil((sEndD - now) / 86400000));
    badge = '<span class="std-badge std-badge--live"><span class="std-badge__dot"></span>In season · ' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left</span>';
  } else {
    badge = '<span class="std-badge">Season complete</span>';
  }

  var h = '<div class="hq-grid"><div class="hq-grid__main">';
  h += '<div class="roster-masthead">';
  h += '<div class="roster-eyebrow">' + escHtml("Standings · " + season.seasonLabel) + '</div>';
  h += '<h1 class="roster-headline">' + escHtml(headlineMain) + '<span class="std-accent">' + escHtml(headlineAccent) + '</span></h1>';
  h += '<p class="std-deck">' + escHtml(deck) + '</p>';
  h += '<div class="std-dateline">' + escHtml(dateRange) + badge + '</div>';
  h += '</div>';

  // ── Scope: season selector (the only real ranking dimension) ──────────
  h += '<div class="roster-scope"><div class="roster-tabs" role="tablist">';
  PB.SEASON_CONFIG.forEach(function(cfg) {
    var isActive = season.seasonKey === cfg.key && season.year === year;
    h += '<button type="button" class="roster-tab' + (isActive ? ' roster-tab--active' : '') + '" role="tab" aria-selected="' + (isActive ? 'true' : 'false') + '" onclick="Router.go(\'standings\',{year:' + year + ',season:\'' + cfg.key + '\'},true)">' + escHtml(cfg.label) + '</button>';
  });
  h += '</div></div>';

  // ── Standings table ───────────────────────────────────────────────────
  if (standings.length) {
    h += '<table class="roster-table">';
    h += '<thead><tr>';
    h += '<th class="std-rank-col" scope="col">#</th>';
    h += '<th class="roster-cell-av" scope="col" aria-label="Avatar"></th>';
    h += '<th scope="col">Member</th>';
    h += '<th class="roster-num roster-col-rounds" scope="col">Rds</th>';
    h += '<th class="roster-num std-col-avg" scope="col">Avg</th>';
    h += '<th class="roster-num" scope="col">Pts</th>';
    h += '</tr></thead><tbody>';
    standings.forEach(function(s, idx) {
      var rank = idx + 1;
      var isFirst = idx === 0;
      var isViewer = !!(viewerUid && (s.id === viewerUid || s.id === viewerClaimed));
      var pl = (PB.getPlayer && PB.getPlayer(s.id)) || s;
      var name = s.username || s.name || "Member";
      var titleSub = "";
      if (pl.equippedTitle && pl.equippedTitle !== "Member" && pl.equippedTitle !== "Rookie") titleSub = escHtml(pl.equippedTitle);
      var rowClass = "roster-row std-row" + (isFirst ? " std-row--leader" : "") + (isViewer ? " std-row--you" : "");
      var aria = name + ", rank " + rank + ", " + (s.rounds || 0) + (s.rounds === 1 ? " round" : " rounds") + ", " + (s.points || 0) + " points";
      var go = "Router.go('members',{id:'" + s.id + "'})";
      h += '<tr class="' + rowClass + '" tabindex="0" aria-label="' + escHtml(aria) + '" onclick="' + go + '" onkeydown="if(event.key===\'Enter\'){' + go + '}">';
      h += '<td class="std-rank">' + rank + '</td>';
      h += '<td class="roster-cell-av">' + renderAvatar(pl, 40, false) + '</td>';
      h += '<td><div class="roster-name"><span class="std-name-txt">' + escHtml(name) + '</span>' + (isViewer ? '<span class="std-you-chip">YOU</span>' : '') + '</div>' + (titleSub ? '<div class="roster-handle">' + titleSub + '</div>' : '') + '</td>';
      h += '<td class="roster-num roster-col-rounds"><span class="roster-rounds">' + (s.rounds || 0) + '</span></td>';
      h += '<td class="roster-num std-col-avg"><span class="std-avg">' + (s.avg || "—") + '</span></td>';
      h += '<td class="roster-num"><span class="std-pts">' + (s.points || 0) + '</span></td>';
      h += '</tr>';
    });
    h += '</tbody></table>';
  } else {
    h += '<div class="std-empty">';
    h += '<div class="std-empty__title">' + (isUpcoming ? "Tee off is coming." : "Nobody on the board yet.") + '</div>';
    h += '<div class="std-empty__sub">' + (isUpcoming ? escHtml("The " + season.seasonLabel + " season has not started.") : "Log a round between March and September to appear.") + '</div>';
    h += '</div>';
  }

  // ── Trophy Watch (real-data sub-leaderboards, kept main-column) ───────
  // Per W2.S2 spec: stroke avg / best round / most rounds / most birdies.
  // Net avg needs a per-round handicap join not modeled here, so it is
  // not rendered (P9 — no fabricated leader).
  if (standings.length) {
    function _twLeader(label, statKey, formatVal, sortDir) {
      var pool = standings.filter(function(s) {
        var v = s[statKey];
        return v != null && !isNaN(v) && (statKey === "best" || statKey === "rounds" || s.rounds >= 3);
      });
      if (!pool.length) return null;
      pool.sort(function(a, b) {
        return sortDir === "desc" ? (b[statKey] - a[statKey]) : (a[statKey] - b[statKey]);
      });
      var top = pool[0];
      return { label: label, winnerName: top.name || top.username || "Member", winnerId: top.id, value: formatVal(top[statKey]) };
    }

    var trophies = [];
    var t1 = _twLeader("STROKE AVG", "avg", function(v){ return (+v).toFixed(1); }, "asc"); if (t1) trophies.push(t1);
    var t2 = _twLeader("BEST ROUND", "best", function(v){ return String(v); }, "asc"); if (t2) trophies.push(t2);
    var t3 = _twLeader("MOST ROUNDS", "rounds", function(v){ return v + " rds"; }, "desc"); if (t3) trophies.push(t3);
    if (typeof PB !== "undefined" && PB.getRounds) {
      var allRounds = PB.getRounds() || [];
      var perPlayer = {};
      allRounds.forEach(function(r) {
        if (!r.player || !r.score || r.format === "scramble" || r.format === "scramble4") return;
        if (!perPlayer[r.player]) perPlayer[r.player] = { birdies: 0 };
        if (r.holeScores && r.holePars && r.holeScores.length === r.holePars.length) {
          for (var i = 0; i < r.holeScores.length; i++) {
            var sc = parseInt(r.holeScores[i]) || 0;
            var pr = parseInt(r.holePars[i]) || 0;
            if (sc > 0 && pr > 0 && sc <= pr - 1) perPlayer[r.player].birdies++;
          }
        }
      });
      var birdiePool = Object.keys(perPlayer).map(function(pid) {
        return { id: pid, birdies: perPlayer[pid].birdies };
      }).filter(function(p){ return p.birdies > 0; });
      birdiePool.sort(function(a, b) { return b.birdies - a.birdies; });
      if (birdiePool.length) {
        var bWin = standings.find(function(s){ return s.id === birdiePool[0].id; });
        if (bWin) trophies.push({ label: "MOST BIRDIES", winnerName: bWin.name || bWin.username || "Member", winnerId: bWin.id, value: birdiePool[0].birdies + " ♦" });
      }
    }

    if (trophies.length) {
      h += '<div class="std-section">';
      h += '<div class="std-section__head"><span class="std-section__title">Trophy Watch</span><span class="std-section__meta">This season</span></div>';
      h += '<div class="std-trophies">';
      trophies.forEach(function(t) {
        h += '<div class="std-trophy" onclick="Router.go(\'members\',{id:\'' + t.winnerId + '\'})">';
        h += '<div class="std-trophy__label">' + escHtml(t.label) + '</div>';
        h += '<div class="std-trophy__value">' + escHtml(t.value) + '</div>';
        h += '<div class="std-trophy__winner">' + escHtml(t.winnerName) + '</div>';
        h += '</div>';
      });
      h += '</div></div>';
    }
  }

  // ── League trophies (custom catalog; real computed leaders fill in async) ──
  h += '<div class="std-section" id="stdLeagueTrophies" style="display:none">';
  h += '<div class="std-section__head"><span class="std-section__title">League trophies</span><span class="std-section__meta">Live leaders</span></div>';
  h += '<div class="std-trophies" id="stdLeagueTrophyGrid"></div>';
  h += '</div>';

  // ── Season rules (collapsible) ────────────────────────────────────────
  h += '<div class="std-collapse-head" onclick="toggleSection(\'std-rules\')"><span class="std-section__title">Season rules</span><span id="std-rules-toggle" class="std-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s"><path d="M9 18l6-6-6-6"/></svg></span></div>';
  h += '<div id="std-rules" style="display:none" class="std-dl">';
  var rules = [
    ["Seasons", "Spring (Mar–May), Summer (Jun–Aug), Fall (Sep–Nov)"],
    ["Off-season", "Dec–Feb: rounds count for handicap, no season points"],
    ["Ranking method", "Season point system"],
    ["Base rules", "USGA rules apply"],
    ["Breakfast balls", "2 per round (1 front, 1 back)"],
    ["Honor system", "Scouts honor: attested scores earn 150 XP"],
    ["Inactivity", "3 months = 3 rounds to reactivate"],
    ["Eligible rounds", "Public rounds only"],
    ["Season winner", "Earns title + Champion Red theme + ParCoins"]
  ];
  rules.forEach(function(r) {
    h += '<div class="std-dl-row"><span class="std-dl-row__k">' + escHtml(r[0]) + '</span><span class="std-dl-row__v">' + escHtml(r[1]) + '</span></div>';
  });
  h += '</div>';

  // ── Season archive (past champions) ───────────────────────────────────
  var archiveSeasons = [];
  var curYear = new Date().getFullYear();
  for (var ay = curYear; ay >= 2026; ay--) {
    PB.SEASON_CONFIG.forEach(function(cfg) {
      var aEnd = ay + cfg.end;
      if (localDateStr() > aEnd) {
        try {
          var ss = PB.getSeasonStandings(ay, cfg.key);
          if (ss.standings.length) {
            var isInaugural = ay === 2026 && cfg.key === "spring";
            archiveSeasons.push({
              label: cfg.label + " " + ay,
              champ: ss.standings[0].name || ss.standings[0].username,
              pts: ss.standings[0].points,
              rounds: ss.standings.reduce(function(a, s){ return a + s.rounds; }, 0),
              inaugural: isInaugural
            });
          }
        } catch (e) {}
      }
    });
  }
  if (archiveSeasons.length) {
    h += '<div class="std-section"><div class="std-section__head"><span class="std-section__title">Season Archive</span></div>';
    archiveSeasons.forEach(function(as) {
      h += '<div class="std-arch-row">';
      h += '<div><div class="std-arch-row__season">' + escHtml(as.label) + (as.inaugural ? '<span class="std-inaugural">INAUGURAL</span>' : '') + '</div><div class="std-arch-row__meta">' + as.rounds + ' total rounds</div></div>';
      h += '<div><div class="std-arch-row__champ">' + escHtml(as.champ) + '</div><div class="std-arch-row__pts">' + as.pts + ' pts</div></div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // ── Courses this season (collapsible) ─────────────────────────────────
  var seasonStartCourses = year + '-03-01';
  var seasonEndCourses = year + '-09-30';
  var seasonRounds = PB.getRounds().filter(function(r){
    return r.visibility !== "private" && r.date >= seasonStartCourses && r.date <= seasonEndCourses && r.format !== "scramble" && r.format !== "scramble4";
  });
  var seasonCourseMap = {};
  seasonRounds.forEach(function(r){
    if (!r.course) return;
    if (!seasonCourseMap[r.course]) seasonCourseMap[r.course] = { name: r.course, rounds: 0, best18: null, best18player: null, best9: null, best9player: null, best9mode: null, players: {} };
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
  var seasonCourseList = Object.values(seasonCourseMap).sort(function(a, b){ return b.rounds - a.rounds; });
  h += '<div class="std-collapse-head" onclick="toggleSection(\'std-courses\')"><span class="std-section__title">Courses this season <span class="std-section__meta" style="margin-left:6px">(' + seasonCourseList.length + ')</span></span><span id="std-courses-toggle" class="std-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s"><path d="M9 18l6-6-6-6"/></svg></span></div>';
  h += '<div id="std-courses" style="display:none" class="std-dl">';
  if (seasonCourseList.length) {
    seasonCourseList.forEach(function(c){
      var playerCount = Object.keys(c.players).length;
      var bestParts = [];
      if (c.best18) bestParts.push(c.best18 + ' (' + escHtml(c.best18player) + ')');
      if (c.best9) bestParts.push(c.best9 + ' ' + c.best9mode + ' (' + escHtml(c.best9player) + ')');
      var bestLabel = bestParts.length ? bestParts.join(' · ') : '—';
      h += '<div class="std-dl-row"><span class="std-dl-row__k">' + escHtml(c.name) + ' <span style="color:var(--cb-mute);font-family:var(--font-mono);font-size:10px">(' + c.rounds + ' rds · ' + playerCount + ' player' + (playerCount !== 1 ? 's' : '') + ')</span></span><span class="std-dl-row__v">' + bestLabel + '</span></div>';
    });
  } else {
    h += '<div class="std-dl-row"><span class="std-dl-row__v" style="max-width:100%;text-align:left">No courses played this season</span></div>';
  }
  h += '</div>';

  // ── Recap / Courses / Awards links ────────────────────────────────────
  h += '<div class="std-links">';
  h += '<button class="btn full outline" onclick="window._courseViewMode=\'ours\';Router.go(\'courses\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"/><path d="M9 4v13M15 7v13"/></svg> Courses</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'seasonrecap\',{year:' + year + '})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> Season Recap</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'awards\',{year:' + year + '})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4M4 5h16v4a6 6 0 01-6 6h-4a6 6 0 01-6-6V5z"/><path d="M12 15v3M8 21h8"/></svg> Awards Night</button>';
  h += '</div>';

  h += '</div>'; // end .hq-grid__main

  // ── Agate rail (desktop ≥960px only) ──────────────────────────────────
  var rail = '';
  if (standings.length >= 2) {
    var a = standings[0], b = standings[1];
    var gap = (a.points || 0) - (b.points || 0);
    var aName = a.name || a.username || "Leader";
    var bName = b.name || b.username || "Second";
    var raceHtml = gap <= 0
      ? 'Dead heat. <strong>' + escHtml(aName) + '</strong> and <strong>' + escHtml(bName) + '</strong> are tied at the top.'
      : '<strong>' + escHtml(aName) + '</strong> leads <strong>' + escHtml(bName) + '</strong> by <em>' + gap + ' pt' + (gap !== 1 ? 's' : '') + '</em>.';
    rail += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Closest race</div><p class="std-race">' + raceHtml + '</p></div>';
  }
  if (standings.length) {
    rail += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">This season</div>';
    rail += '<div class="std-glance-row"><span class="std-glance-row__k">Active</span><span class="std-glance-row__v">' + standings.length + '</span></div>';
    rail += '<div class="std-glance-row"><span class="std-glance-row__k">Rounds</span><span class="std-glance-row__v">' + totalRounds + '</span></div>';
    rail += '<div class="std-glance-row"><span class="std-glance-row__k">Low round</span><span class="std-glance-row__v">' + (bestScore < 999 ? bestScore : '—') + '</span></div>';
    rail += '</div>';
  }
  rail += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Clubhouse</div><p class="std-pull">"Community over competition. The board\'s just for bragging rights."</p></div>';
  h += '<aside class="hq-grid__rail-right" aria-label="Standings highlights">' + rail + '</aside>';

  h += '</div>'; // end .hq-grid

  document.querySelector('[data-page="standings"]').innerHTML = h;
  appendStdLeagueTrophies();
});

// Custom-catalog trophies on the standings board. Honest by construction: only
// trophies with a real computed current leader are rendered here (non-computable
// or no-qualifying-rounds trophies stay off the leaderboard, where they would
// otherwise read as a fabricated leader — P9). The trophy room shows those with
// an explicit "leader pending" line.
function appendStdLeagueTrophies() {
  var grid = document.getElementById("stdLeagueTrophyGrid");
  var sec = document.getElementById("stdLeagueTrophies");
  if (!grid || !sec) return;
  if (typeof loadTrophyCatalog !== "function" || typeof evaluateTrophy !== "function") return;
  loadTrophyCatalog(function() {
    var g = document.getElementById("stdLeagueTrophyGrid");
    var s = document.getElementById("stdLeagueTrophies");
    if (!g || !s) return;
    var defs = (typeof pbCachedTrophyDefs === "function" ? pbCachedTrophyDefs() : []).filter(function(d) { return d && d.active !== false; });
    var html = "";
    defs.forEach(function(d) {
      var ev = evaluateTrophy(d);
      if (!ev.computable || !ev.leader) return;
      var wid = String(ev.leader.id || "").replace(/'/g, "\\'");
      var val = ev.leader.display != null ? ev.leader.display : ev.leader.value;
      html += '<div class="std-trophy" onclick="Router.go(\'members\',{id:\'' + wid + '\'})">';
      html += '<div class="std-trophy__label">' + escHtml(String(d.name || "Trophy").toUpperCase()) + '</div>';
      html += '<div class="std-trophy__value">' + escHtml(String(val)) + '</div>';
      html += '<div class="std-trophy__winner">' + escHtml(String(ev.leader.name || "Member")) + '</div>';
      html += '</div>';
    });
    if (html) { g.innerHTML = html; s.style.display = ""; }
  });
}
