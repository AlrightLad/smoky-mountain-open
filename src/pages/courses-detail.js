// Courses — Course Detail rendering. Extracted per W1.A5 (AMD-027).
// Function: renderCourseDetail (large standalone — handles course-card render,
// recent rounds list, reviews, photos, scorecard, and tee selection).

function renderCourseDetail(courseId) {
  var c = PB.getCourse(courseId);
  if (!c) { Router.go("courses"); return; }
  var roundsHere = PB.getCourseRounds(c.name);

  var h = '<div class="sh"><h2>' + c.name + '</h2><button class="back" onclick="Router.back(\'courses\')">← Back</button></div>';

  var coursePhotoSrc = photoCache["course:" + courseId] || c.photo || "";
  // Async-load course photo(s) from Firestore if not cached
  if (!photoCache["course:" + courseId]) {
    loadCoursePhotos(courseId);
  }
  if (coursePhotoSrc && coursePhotoSrc !== COURSE_DEFAULT_IMG) {
    h += '<div id="course-photo-area" class="course-banner"><img alt="" src="' + coursePhotoSrc + '" onerror="this.parentElement.style.display=\'none\'"></div>';
  } else {
    // No photo: branded per-course monogram hero (v8.23.53), same lane identity
    // as the directory thumbnail (courseThumbLane/courseThumbInitials in courses.js).
    h += '<div id="course-photo-area" class="c-thumb-ph--' + courseThumbLane(c.name) + '" style="height:110px;margin:0 16px;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;overflow:hidden"><span class="course-hero-mono">' + escHtml(courseThumbInitials(c.name)) + '</span></div>';
  }
  h += '<div class="section"><div class="c-detail-info">' + c.loc + ' · Rating: ' + c.rating + ' · Slope: ' + c.slope + ' · Par: ' + c.par + '</div>';
  if (c.tee || c.yards) {
    h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">';
    if (c.tee) h += c.tee + ' Tees';
    if (c.tee && c.yards) h += ' · ';
    if (c.yards) h += c.yards.toLocaleString() + ' yards';
    h += '</div>';
  }
  h += '<button class="btn-sm outline" style="margin-top:8px" onclick="uploadCoursePhoto(\'' + courseId + '\')">Upload photo</button>';

  // Community scorecard data status
  var cd = c.communityData || {};
  var cdStatus = cd.status || "api_only";
  var verCount = cd.verifications ? cd.verifications.length : 0;
  var hasPlayedHere2 = currentUser && PB.getPlayerRounds(currentUser.uid).some(function(r){ return PB.normCourseName(r.course) === PB.normCourseName(c.name); });
  var isContributor = currentUser && cd.contributorId === currentUser.uid;
  var hasVerified = currentUser && cd.verifications && cd.verifications.some(function(v){ return v.uid === currentUser.uid; });

  h += '<div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
  if (cdStatus === "verified") {
    h += '<span style="font-size:9px;font-weight:700;color:var(--birdie);background:rgba(var(--birdie-rgb),.08);padding:3px 8px;border-radius:4px;letter-spacing:.5px">COMMUNITY VERIFIED \u2713</span>';
    h += '<span style="font-size:9px;color:var(--muted)">' + verCount + ' verified</span>';
  } else if (cdStatus === "community_added") {
    h += '<span style="font-size:9px;font-weight:700;color:var(--orange);background:rgba(var(--orange-rgb),.08);padding:3px 8px;border-radius:4px;letter-spacing:.5px">UNVERIFIED</span>';
    if (cd.contributorName) h += '<span style="font-size:9px;color:var(--muted)">Added by ' + escHtml(cd.contributorName) + '</span>';
  } else {
    h += '<span style="font-size:9px;color:var(--muted2);background:var(--bg3);padding:3px 8px;border-radius:4px;letter-spacing:.5px">API DATA</span>';
  }
  h += '</div>';

  // Action buttons based on state
  h += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
  if (cdStatus === "api_only" && hasPlayedHere2) {
    h += '<button class="btn-sm green" style="font-size:10px" onclick="showScorecardEditor(\'' + courseId + '\')">Add Scorecard Data (+50 coins)</button>';
  } else if (cdStatus === "community_added" && hasPlayedHere2 && !isContributor && !hasVerified) {
    h += '<button class="btn-sm green" style="font-size:10px" onclick="verifyCourseData(\'' + courseId + '\')">Verify This Data (+10 coins)</button>';
    h += '<button class="btn-sm outline" style="font-size:10px" onclick="showScorecardEditor(\'' + courseId + '\')">Suggest Edit</button>';
  } else if (cdStatus === "verified") {
    h += '<button class="btn-sm outline" style="font-size:10px" onclick="showScorecardEditor(\'' + courseId + '\')">Suggest Edit</button>';
  } else if (!hasPlayedHere2) {
    h += '<span style="font-size:9px;color:var(--muted)">Play this course to contribute data</span>';
  }
  h += '</div>';

  h += '</div>';

  // All tees overview
  if (c.allTees && c.allTees.length > 0) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Tees</span></div>';
    h += '<div style="padding:0 16px 8px">';
    c.allTees.forEach(function(tee, ti) {
      var isDefault = tee.name === c.tee;
      h += '<div class="card" style="margin-bottom:6px;cursor:pointer;border-color:' + (isDefault ? 'var(--gold)' : 'var(--border)') + '" onclick="showTeeScorecard(\'' + courseId + '\',' + ti + ')">';
      h += '<div class="card-body" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px">';
      h += '<div><div style="font-size:12px;font-weight:600;color:' + (isDefault ? 'var(--gold)' : 'var(--cream)') + '">' + escHtml(tee.name) + (isDefault ? ' <span style="font-size:9px;color:var(--muted)">(default)</span>' : '') + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + (tee.yards ? tee.yards.toLocaleString() + ' yds' : '') + ' · Par ' + (tee.par||72) + ' · Rating ' + (tee.rating||'—') + ' · Slope ' + (tee.slope||'—') + '</div></div>';
      h += '<svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>';
      h += '</div></div>';
    });
    h += '</div></div>';
  }

  // Scorecard section with tee selector
  if ((c.allTees && c.allTees.length > 0) || (c.holes && c.holes.length === 18)) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
    h += '<div id="courseScorecardArea">';
    h += '</div></div>';
  }

  // Course Legend (rank 14) — the most-DEDICATED regular here (most rounds in 90
  // days), not the best scorer. Community-over-competition: rewards showing up.
  var _cl = (typeof computeCourseLegend === "function") ? computeCourseLegend(c.name) : null;
  if (_cl && _cl.legend) {
    var _lg = _cl.legend;
    var _lgP = PB.getPlayer(_lg.id);
    var _clRoundWord = _lg.count === 1 ? " round" : " rounds";
    var _clSub = (_cl.runnerUp && _cl.runnerUpGap > 0)
      ? escHtml(_cl.runnerUp.name) + " needs " + _cl.runnerUpGap + " more to take it"
      : (_lg.count === 1 ? "First on the board here — play to claim it" : "The most-played regular here");
    h += '<div class="course-legend" onclick="Router.go(\'members\',{id:\'' + String(_lg.id).replace(/'/g, "\\'") + '\'})" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'){Router.go(\'members\',{id:\'' + String(_lg.id).replace(/'/g, "\\'") + '\'})}">';
    h += '<div class="course-legend__crown"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 20h14M6.5 20c-1.2-5-2-8-1-12 2.2 2 4 2 5-1 1 3 2.8 3 5 1 1 4 .2 7-1 12"/></svg></div>';
    h += '<div class="course-legend__main"><div class="course-legend__label">Course Legend</div><div class="course-legend__name">' + escHtml(_lg.name) + '</div><div class="course-legend__sub">' + _lg.count + _clRoundWord + ' in 90 days · ' + _clSub + '</div></div>';
    h += renderAvatar(_lgP, 40, false);
    h += '</div>';
  }

  // Course leaderboard — top 3 per format category
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Leaderboard</span></div>';

  function renderLeaderboardCategory(label, entries) {
    // entries: [{name, score, date}] already sorted low→high, max 3
    var lh = '<div style="margin-bottom:14px">';
    lh += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600;padding:0 16px;margin-bottom:6px">' + label + '</div>';
    if (!entries.length) {
      lh += '<div style="padding:0 16px;font-size:11px;color:var(--muted2)">No rounds yet</div>';
    } else {
      entries.forEach(function(e, idx) {
        var medal = idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--medal-silver)' : 'var(--medal-bronze)';
        var diff = e.score - (e.par || 72);
        var diffStr = diff === 0 ? 'E' : (diff > 0 ? '+' : '') + diff;
        // Community-safe binary, matching every other surface: under or even reads quiet
        // green, over stays neutral. Never alarm-red on a member's leaderboard line.
        var diffColor = diff <= 0 ? 'var(--birdie)' : 'var(--muted)';
        lh += '<div style="display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid var(--border-default)">';
        lh += '<div style="width:22px;height:22px;border-radius:50%;background:' + medal + '18;border:1.5px solid ' + medal + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:' + medal + ';flex-shrink:0">' + (idx+1) + '</div>';
        lh += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(e.name) + '</div>';
        lh += '<div style="font-size:9px;color:var(--muted)">' + (e.date || '') + '</div></div>';
        lh += '<div style="text-align:right;flex-shrink:0"><div style="font-size:16px;font-weight:700;color:var(--gold)">' + e.score + '</div>';
        lh += '<div style="font-size:10px;font-weight:600;color:' + diffColor + '">' + diffStr + '</div></div>';
        lh += '</div>';
      });
    }
    lh += '</div>';
    return lh;
  }

  // Solo (all non-scramble formats combined — stroke, parbaugh, stableford, etc.)
  // Only full 18-hole rounds count for leaderboards
  var soloEntries = roundsHere
    .filter(function(r){ return r.format !== 'scramble' && (!r.holesPlayed || r.holesPlayed >= 18); })
    .sort(function(a,b){ return a.score - b.score; })
    .slice(0,3)
    .map(function(r){ return {name: r.playerName || r.player, score: r.score, date: r.date, par: c.par}; });
  h += renderLeaderboardCategory('Solo', soloEntries);

  // Scramble by team size — pull from both team.matches AND rounds collection
  var teams = PB.getScrambleTeams();
  [2,3,4].forEach(function(sz) {
    var entries = [];
    var entryKeys = {};
    // From team matches
    teams.filter(function(t){ return (t.size||t.members.length) === sz; }).forEach(function(t) {
      (t.matches||[]).filter(function(m){ return m.course && PB.normCourseName(m.course) === PB.normCourseName(c.name) && m.score; }).forEach(function(m) {
        var key = t.name + "|" + m.date;
        if (!entryKeys[key]) { entries.push({name: t.name, score: m.score, date: m.date, par: c.par}); entryKeys[key] = true; }
      });
    });
    // From rounds collection (scramble rounds on this course)
    // From rounds collection — only match rounds whose player belongs to a team of THIS size
    var scrambleRounds = roundsHere.filter(function(r){ 
      if (r.format !== "scramble" && r.format !== "scramble4") return false;
      // Find the team this player belongs to and check size
      var playerTeam = teams.find(function(t){ return (t.size||t.members.length) === sz && t.members.indexOf(r.player) !== -1; });
      return !!playerTeam;
    });
    // Group by date to avoid duplicates
    var scrambleDates = {};
    scrambleRounds.forEach(function(r) {
      if (!scrambleDates[r.date] || r.score < scrambleDates[r.date].score) scrambleDates[r.date] = r;
    });
    Object.values(scrambleDates).forEach(function(r) {
      var teamForRound = teams.find(function(t){ return (t.size||t.members.length) === sz && t.members.indexOf(r.player) !== -1; });
      var teamName = teamForRound ? teamForRound.name : "Team";
      var key = teamName + "|" + r.date;
      if (!entryKeys[key]) { entries.push({name: teamName, score: r.score, date: r.date, par: c.par}); entryKeys[key] = true; }
    });
    entries.sort(function(a,b){ return a.score - b.score; });
    var seen = {};
    entries = entries.filter(function(e) {
      if (seen[e.name]) return false;
      seen[e.name] = true;
      return true;
    }).slice(0,3);
    h += renderLeaderboardCategory(sz + '-Man Scramble', entries);
  });

  h += '</div>';

  if (roundsHere.length) {
    var soloRounds = roundsHere.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4"; });
    var scrambleRounds = roundsHere.filter(function(r){ return r.format === "scramble" || r.format === "scramble4"; });
    
    if (soloRounds.length) {
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Individual scores</span></div>';
      soloRounds.slice().reverse().forEach(function(r) {
        var is9h = r.holesPlayed && r.holesPlayed <= 9;
        var holeLabel = is9h ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
        var teeName = r.tee || c.tee || "";
        var teeDisplay = teeName ? " · " + teeName + (/tees$/i.test(teeName) ? "" : " Tees") : "";
        var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
        var clickHandler = r.id ? " onclick=\"Router.go('rounds',{roundId:'" + r.id + "'})\" style=\"cursor:pointer\"" : "";
        h += '<div class="card"' + clickHandler + '><div class="round-card"><div class="rc-top"><div><div class="rc-course">' + escHtml(r.playerName) + '</div><div class="rc-date">' + r.date + teeDisplay + holeLabel + fmtLabel + '</div></div>';
        h += '<div class="rc-score">' + r.score + '</div></div></div></div>';
      });
      h += '</div>';
    }
    
    if (scrambleRounds.length) {
      var scrambleDates = {};
      scrambleRounds.forEach(function(r) { if (!scrambleDates[r.date]) scrambleDates[r.date] = []; scrambleDates[r.date].push(r); });
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Scramble scores</span></div>';
      Object.keys(scrambleDates).sort().reverse().forEach(function(dt) {
        var group = scrambleDates[dt];
        var score = group[0].score;
        var teamObj = PB.getScrambleTeams().find(function(t){ return group.some(function(r){ return t.members.indexOf(r.player) !== -1; }); });
        var teamName = teamObj ? teamObj.name : "Team Scramble";
        var memberNames = group.map(function(r){ return r.playerName; }).join(", ");
        var teeName = group[0].tee || c.tee || "";
        var teeDisplay = teeName ? " · " + teeName + (/tees$/i.test(teeName) ? "" : " Tees") : "";
        var clickHandler = group[0].id ? " onclick=\"Router.go('rounds',{roundId:'" + group[0].id + "'})\" style=\"cursor:pointer\"" : "";
        h += '<div class="card"' + clickHandler + '><div class="round-card"><div class="rc-top"><div><div class="rc-course" style="color:var(--gold)">' + escHtml(teamName) + '</div><div class="rc-date" style="font-size:10px">' + escHtml(memberNames) + '</div><div class="rc-date">' + dt + teeDisplay + ' · Scramble</div></div>';
        h += '<div class="rc-score">' + score + '</div></div></div></div>';
      });
      h += '</div>';
    }
  }

  // ── Member Stats (auto-generated from round data) ──
  var courseRounds = PB.getCourseRounds(c.name).filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });
  if (courseRounds.length >= 3) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Member Stats</span></div>';
    var full18cr = courseRounds.filter(function(r) { return !r.holesPlayed || r.holesPlayed >= 18; });
    var front9cr = courseRounds.filter(function(r) { return (r.holesPlayed === 9 && (!r.holesMode || r.holesMode === "front9")) || r.holesMode === "front9"; });
    var back9cr = courseRounds.filter(function(r) { return r.holesMode === "back9"; });
    var avgScore = full18cr.length ? Math.round(full18cr.reduce(function(a,r){return a+r.score},0) / full18cr.length) : null;
    var avgFront9 = front9cr.length ? Math.round(front9cr.reduce(function(a,r){return a+r.score},0) / front9cr.length) : null;
    var avgBack9 = back9cr.length ? Math.round(back9cr.reduce(function(a,r){return a+r.score},0) / back9cr.length) : null;

    // Most played by
    var playedBy = {};
    courseRounds.forEach(function(r) { var pn = r.playerName || "Unknown"; playedBy[pn] = (playedBy[pn]||0) + 1; });
    var topPlayer = Object.entries(playedBy).sort(function(a,b){return b[1]-a[1]})[0];

    h += '<div class="card"><div style="padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    if (avgScore) {
      var nineSubParts = [];
      if (avgFront9 !== null) nineSubParts.push("F9 " + avgFront9);
      if (avgBack9 !== null) nineSubParts.push("B9 " + avgBack9);
      var nineSubHTML = nineSubParts.length ? '<div class="stat-sub" style="font-size:9px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.5px">9-hole · ' + nineSubParts.join(" · ") + '</div>' : '';
      h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Members average ' + (full18cr.length ? '(18)' : '') + '</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cream)">' + avgScore + '</div>' + nineSubHTML + '</div>';
    } else if (avgFront9 !== null || avgBack9 !== null) {
      var nineOnlyParts = [];
      if (avgFront9 !== null) nineOnlyParts.push("F9 " + avgFront9);
      if (avgBack9 !== null) nineOnlyParts.push("B9 " + avgBack9);
      h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Members average (9)</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cream)">' + nineOnlyParts.join(" · ") + '</div></div>';
    }
    h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Total rounds</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cream)">' + courseRounds.length + '</div></div>';
    if (topPlayer) h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Most played by</div><div style="font-size:13px;font-weight:600;color:var(--gold)">' + escHtml(topPlayer[0]) + ' <span style="font-size:10px;color:var(--muted)">(' + topPlayer[1] + ' rounds)</span></div></div>';

    // Hardest/easiest hole (from hole-by-hole data)
    var holeData = {};
    courseRounds.forEach(function(r) {
      if (!r.holeScores || !r.holePars) return;
      for (var hi = 0; hi < Math.min(r.holeScores.length, r.holePars.length); hi++) {
        var hs = parseInt(r.holeScores[hi]), hp = r.holePars[hi];
        if (hs > 0 && hp > 0) {
          if (!holeData[hi]) holeData[hi] = { total: 0, count: 0, par: hp };
          holeData[hi].total += hs - hp;
          holeData[hi].count++;
        }
      }
    });
    var holeAvgs = Object.entries(holeData).filter(function(e){return e[1].count >= 2}).map(function(e) {
      return { hole: parseInt(e[0]) + 1, avg: Math.round(e[1].total / e[1].count * 10) / 10, par: e[1].par };
    });
    if (holeAvgs.length >= 2) {
      holeAvgs.sort(function(a,b){return b.avg - a.avg});
      var hardest = holeAvgs[0];
      var easiest = holeAvgs[holeAvgs.length - 1];
      h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Hardest hole</div><div style="font-size:13px;font-weight:600;color:var(--red)">#' + hardest.hole + ' <span style="font-size:10px;color:var(--muted)">(par ' + hardest.par + ', avg +' + hardest.avg + ')</span></div></div>';
      h += '<div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Easiest hole</div><div style="font-size:13px;font-weight:600;color:var(--birdie)">#' + easiest.hole + ' <span style="font-size:10px;color:var(--muted)">(par ' + easiest.par + ', avg ' + (easiest.avg >= 0 ? '+' : '') + easiest.avg + ')</span></div></div>';
    }
    h += '</div></div></div>';
  }

  // ── Caddie's Course Insights ──
  if (typeof caddieCourseInsights === "function") {
    var cInsights = caddieCourseInsights(c.name, PB.getRounds());
    // Add personal scouting if player has rounds here
    if (currentUser && typeof caddieScoutingReport === "function") {
      var myRds = PB.getPlayerRounds(currentUser.uid);
      var scout = caddieScoutingReport(c.name, myRds);
      cInsights = cInsights.concat(scout);
    }
    if (cInsights.length) h += '<div class="section">' + renderCaddieInsights(cInsights, 5) + '</div>';
  }

  // ── Reviews (enhanced with stars + aggregate) ──
  var reviews = c.reviews || [];
  var avgRating = reviews.length ? Math.round(reviews.reduce(function(a,r){return a+(r.rating||0)},0) / reviews.length * 10) / 10 : null;
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Reviews' + (reviews.length ? ' <span style="font-size:12px;color:var(--muted);font-weight:400">(' + reviews.length + ')</span>' : '') + '</span></div>';

  // Aggregate rating
  if (avgRating) {
    h += '<div style="display:flex;align-items:center;gap:8px;padding:0 0 8px">';
    h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--gold)">' + avgRating + '</div>';
    h += '<div>';
    for (var si = 1; si <= 5; si++) h += '<span style="color:' + (si <= Math.round(avgRating) ? 'var(--gold)' : 'var(--bg3)') + ';font-size:16px">\u2605</span>';
    h += '<div style="font-size:10px;color:var(--muted)">' + reviews.length + ' review' + (reviews.length !== 1 ? 's' : '') + '</div>';
    h += '</div></div>';
  }

  // Individual reviews
  reviews.slice().reverse().forEach(function(r) {
    h += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    h += '<div>';
    for (var rs = 1; rs <= 5; rs++) h += '<span style="color:' + (rs <= r.rating ? 'var(--gold)' : 'var(--bg3)') + ';font-size:12px">\u2605</span>';
    h += ' <span style="font-size:11px;font-weight:600;color:var(--cream)">' + escHtml(r.by || "Member") + '</span></div>';
    h += '<span style="font-size:9px;color:var(--muted2)">' + (r.date || "") + '</span></div>';
    h += '<div style="font-size:12px;color:var(--cream);line-height:1.5">' + escHtml(r.text || "") + '</div>';
    if (r.photo) h += '<div style="margin-top:6px;border-radius:var(--radius);overflow:hidden;max-height:160px"><img alt="" src="' + r.photo + '" style="width:100%;display:block;object-fit:cover"></div>';
    // Helpful voting
    var helpfulCount = (r.helpful || []).length;
    var isHelpful = currentUser && (r.helpful || []).indexOf(currentUser.uid) !== -1;
    h += '<div style="display:flex;gap:12px;margin-top:6px;font-size:10px;color:var(--muted2)">';
    h += '<span style="cursor:pointer;' + (isHelpful ? 'color:var(--birdie);font-weight:600' : '') + '" onclick="event.stopPropagation();voteReviewHelpful(\'' + courseId + '\',' + reviews.indexOf(r) + ')"><svg viewBox="0 0 16 16" width="11" height="11" fill="' + (isHelpful ? 'var(--birdie)' : 'none') + '" stroke="currentColor" stroke-width="1.3" style="vertical-align:middle"><path d="M2 8l5 5 7-9"/></svg> Helpful' + (helpfulCount ? ' (' + helpfulCount + ')' : '') + '</span>';
    h += '</div>';
    h += '</div></div>';
  });

  // Check if user has played here
  var hasPlayedHere = false;
  if (currentUser) {
    var myRoundsHere = PB.getPlayerRounds(currentUser.uid).filter(function(r) { return PB.normCourseName(r.course) === PB.normCourseName(c.name); });
    hasPlayedHere = myRoundsHere.length > 0;
  }

  h += '<div id="review-form-' + courseId + '" style="display:none;margin-top:8px">';
  h += '<div class="ff"><label class="ff-label">Rating</label><div style="display:flex;gap:4px" id="rev-stars">';
  for (var sti = 1; sti <= 5; sti++) h += '<span onclick="setReviewStars(' + sti + ')" style="font-size:24px;cursor:pointer;color:var(--bg3)" data-star="' + sti + '">\u2605</span>';
  h += '</div><input type="hidden" id="rev-rating" value="5"></div>';
  h += '<div class="ff"><label class="ff-label">Review</label><textarea class="ff-input" id="rev-text" rows="3" placeholder="What did you think of this course?"></textarea></div>';
  h += '<div class="ff"><label class="ff-label">Photo (optional)</label><input type="file" accept="image/*" id="rev-photo" style="font-size:11px;color:var(--muted)"></div>';
  h += '<button class="btn full green" onclick="submitCourseReview(\'' + courseId + '\')">Submit Review</button></div>';
  if (hasPlayedHere) {
    h += '<button class="btn full outline" onclick="document.getElementById(\'review-form-' + courseId + '\').style.display=\'block\';this.style.display=\'none\'">+ Write a Review</button>';
  } else {
    h += '<div style="font-size:10px;color:var(--muted);text-align:center;padding:8px 0">Play this course to leave a review</div>';
  }
  h += '</div>';

  document.querySelector('[data-page="courses"]').innerHTML = h;
  // Auto-render default tee scorecard
  if (c.allTees && c.allTees.length > 0) {
    var defaultIdx = c.allTees.findIndex(function(t){ return t.name === c.tee; });
    if (defaultIdx === -1) defaultIdx = 0;
    showTeeScorecard(courseId, defaultIdx);
  }
}
