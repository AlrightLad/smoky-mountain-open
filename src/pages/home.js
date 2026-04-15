/* ================================================
   PAGE: HOME
   ================================================ */

// Shared footer links rendered at the bottom of every main tab page
function renderPageFooter() {
  var d = "·";
  var s = "font-size:11px;color:var(--muted2);cursor:pointer;letter-spacing:.5px";
  var sm = "font-size:11px;color:var(--muted2)";
  return '<div style="text-align:center;padding:20px 16px 8px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap">' +
    '<span style="' + s + '" onclick="Router.go(\'merch\')">Merch</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="Router.go(\'rules\')">Rules</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="Router.go(\'faq\')">FAQ</span>' +
    '<span style="' + sm + '">' + d + '</span>' +
    '<span style="' + s + '" onclick="openFeatureRequest()">Feature Request</span>' +
    '</div>' +
    '<div style="text-align:center;padding:2px 16px 16px">' +
    '<span style="' + s + '" onclick="Router.go(\'caddynotes\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12" style="vertical-align:middle"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> The Caddy Notes</span>' +
    '</div>';
}

Router.register("home", function() {
  var players = PB.getPlayers();
  var tournaments = PB.getTrips();
  var rounds = PB.getRounds();
  var recent = rounds.slice().reverse().slice(0, 5);
  var season = PB.getSeasonStandings(new Date().getFullYear());

  var h = '';

  // ── Compact Hero + Personal Stats ──
  var myRounds = currentUser ? PB.getPlayerRounds(currentUser.uid) : [];
  if (!myRounds.length && currentProfile && currentProfile.claimedFrom) myRounds = PB.getPlayerRounds(currentProfile.claimedFrom);
  var myLevel = currentUser ? PB.getPlayerLevel(currentUser.uid) : {level:1,xp:0,nextLevelXp:100,currentLevelXp:0};
  if (myLevel.level <= 1 && currentProfile && currentProfile.claimedFrom) myLevel = PB.getPlayerLevel(currentProfile.claimedFrom);
  var xpToNext = myLevel.nextLevelXp - myLevel.xp;
  var achievementCount = currentUser ? PB.getAchievements(currentUser.uid).length : 0;
  if (!achievementCount && currentProfile && currentProfile.claimedFrom) achievementCount = PB.getAchievements(currentProfile.claimedFrom).length;
  var xpPct = myLevel.nextLevelXp > 0 ? Math.round(((myLevel.xp - myLevel.currentLevelXp) / (myLevel.nextLevelXp - myLevel.currentLevelXp)) * 100) : 0;
  
  var myIndividualRounds = myRounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
  var myFull18 = myIndividualRounds.filter(function(r){return !r.holesPlayed || r.holesPlayed >= 18;});
  var myBest = myFull18.length ? Math.min.apply(null, myFull18.map(function(r){return r.score||999})) : null;
  var myBestRound = myBest ? myFull18.find(function(r){return r.score===myBest}) : null;
  var myBestRoundId = myBestRound ? myBestRound.id : null;
  var myHcap = myIndividualRounds.length >= 3 ? PB.calcHandicap(myRounds) : null;

  h += '<div style="padding:20px 16px 0;text-align:center;background:linear-gradient(180deg,var(--grad-hero),var(--bg))">';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px">';
  h += '<div style="width:48px;height:48px;border-radius:14px;overflow:hidden;flex-shrink:0;border:1px solid var(--border)"><img alt="" src="watermark.jpg" style="width:100%;height:100%;object-fit:cover"></div>';
  h += '<div style="text-align:left"><div style="font-family:Playfair Display,serif;font-size:18px;font-weight:800;color:var(--gold);letter-spacing:2px">THE PARBAUGHS</div>';
  h += '<div style="font-size:8px;color:var(--muted);letter-spacing:4px;text-transform:uppercase;font-weight:500">Est. 2026 · York, PA</div></div></div>';

  // Personal stat bar
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px">';
  h += '<div style="text-align:center;cursor:pointer" onclick="Router.go(\'trophyroom\')"><div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)" data-count="' + myLevel.level + '">' + myLevel.level + '</div><div style="font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600">Level</div>';
  h += '<div style="height:3px;background:var(--bg3);border-radius:2px;margin-top:4px;overflow:hidden"><div style="height:100%;width:' + xpPct + '%;background:linear-gradient(90deg,var(--gold2),var(--gold3));border-radius:2px"></div></div></div>';
  h += '<div style="text-align:center;cursor:pointer" onclick="Router.go(\'members\',{id:\'' + (currentUser?currentUser.uid:"") + '\'})">';
  h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--cream)">' + (myHcap !== null ? myHcap : "—") + '</div>';
  h += '<div style="font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600">Handicap</div></div>';
  h += '<div style="text-align:center;cursor:pointer" onclick="Router.go(\'roundhistory\')"><div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--cream)" data-count="' + myIndividualRounds.length + '">' + myIndividualRounds.length + '</div>';
  h += '<div style="font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600">Rounds <svg viewBox="0 0 12 12" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div></div>';
  h += '<div style="text-align:center;' + (myBestRoundId ? 'cursor:pointer' : '') + '"' + (myBestRoundId ? ' onclick="Router.go(\'rounds\',{roundId:\'' + myBestRoundId + '\'})"' : '') + '>';
  if (myBest && myBest < 999) {
    h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--birdie)" data-count="' + myBest + '">' + myBest + '</div>';
  } else {
    h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--muted2)">—</div>';
  }
  h += '<div style="font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600">Best' + (myBestRoundId ? ' <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg>' : '') + '</div></div>';
  h += '</div></div>';

  // 0. Who's Online
  h += '<div class="home-wrap">';

  // New user welcome — show when 0 individual rounds
  if (myIndividualRounds.length === 0) {
    h += '<div style="background:linear-gradient(135deg,rgba(var(--gold-rgb),.08),rgba(var(--birdie-rgb),.06));border:1px solid rgba(var(--gold-rgb),.15);border-radius:var(--radius-lg);padding:20px 16px;margin-bottom:12px;text-align:center">';
    h += '<div style="font-size:16px;font-weight:700;color:var(--gold);margin-bottom:6px">Welcome to The Parbaughs</div>';
    h += '<div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:16px">Log your first round to start earning XP, climbing the leaderboard, and unlocking achievements.</div>';
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
    h += '<button class="btn-sm green" onclick="Router.go(\'playnow\')" style="font-size:11px;padding:10px 16px"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle;margin-right:4px"><circle cx="8" cy="8" r="6"/><polygon points="7,5.5 11,8 7,10.5" fill="currentColor"/></svg>Log a Round</button>';
    h += '<button class="btn-sm outline" onclick="Router.go(\'courses\')" style="font-size:11px;padding:10px 16px">Browse Courses</button>';
    h += '<button class="btn-sm outline" onclick="Router.go(\'members\',{edit:\'' + (currentUser?currentUser.uid:'') + '\'})" style="font-size:11px;padding:10px 16px">Set Up Profile</button>';
    h += '</div></div>';
  }

  h += '<div id="onlineSection"></div>';

  // Quick Actions — 4 buttons
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px">';
  h += '<button class="btn full green" onclick="Router.go(\'playnow\')" style="font-size:10px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>Play Now</button>';
  h += '<button class="btn full outline" onclick="startRangeSession()" style="font-size:10px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><svg viewBox="0 0 24 24" fill="none" stroke="var(--pink)" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Range</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'tee-create\')" style="font-size:10px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tee Time</button>';
  h += '<button class="btn full outline" onclick="Router.go(\'partygames\')" style="font-size:10px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>Games</button>';
  h += '</div>';

  // ── Live Spotlight — MOVED UP, most urgent info first ──
  var liveRounds = [];
  if (liveState.active) {
    var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "You";
    var myThru = liveState.scores.filter(function(s){return s!==""}).length;
    var myScore = liveState.scores.filter(function(s){return s!==""}).reduce(function(a,b){return a+parseInt(b)},0);
    liveRounds.push({uid: currentUser ? currentUser.uid : null, name: myName, course: liveState.course, hole: liveState.currentHole + 1, thru: myThru, score: myScore, isMe: true});
  }
  Object.keys(onlineMembers).forEach(function(uid) {
    if (currentUser && uid === currentUser.uid) return;
    var m = onlineMembers[uid];
    if (m.liveRound && m.liveRound.course && m.liveRound.thru > 0) {
      liveRounds.push({uid: uid, name: m.name || "Member", course: m.liveRound.course, hole: m.liveRound.hole || 0, thru: m.liveRound.thru || 0, score: m.liveRound.score || 0, isMe: false});
    }
  });
  var todayStr = new Date().getFullYear() + "-" + String(new Date().getMonth()+1).padStart(2,"0") + "-" + String(new Date().getDate()).padStart(2,"0");
  var todayTees = liveTeeTimes.filter(function(t) { return t.date === todayStr && t.status !== "cancelled"; });
  
  if (liveRounds.length || todayTees.length) {
    h += '<div class="section" style="padding-top:0"><div class="sec-head"><span class="sec-title" style="color:var(--live)"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite;vertical-align:middle;margin-right:6px"></span>Live</span></div>';
    liveRounds.forEach(function(lr) {
      var holePars = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
      var parThru = 0; for (var pi=0;pi<lr.thru;pi++) parThru += holePars[pi];
      var diff = lr.thru > 0 ? lr.score - parThru : 0;
      var diffStr = lr.thru === 0 ? "—" : diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
      var diffColor = diff < 0 ? "var(--birdie)" : diff > 0 ? "var(--red)" : "var(--cream)";
      var clickAction = lr.isMe ? "Router.go('playnow')" : (lr.uid ? "Router.go('watchround',{uid:'" + lr.uid + "'})" : "");
      h += '<div class="card" style="padding:14px 16px;' + (lr.isMe ? 'border-left:3px solid var(--gold)' : 'border-left:3px solid var(--live);cursor:pointer') + '" onclick="' + clickAction + '">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="pill pill-live">LIVE</span><span style="font-size:12px;font-weight:700;color:var(--cream)">' + escHtml(lr.name) + '</span></div>';
      h += '<div style="font-size:11px;color:var(--muted)">' + escHtml(lr.course) + ' · Hole ' + lr.hole + (lr.thru > 0 ? ' · Thru ' + lr.thru : '') + '</div></div>';
      h += '<div style="text-align:right"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:800;color:' + diffColor + '">' + diffStr + '</div>';
      if (!lr.isMe) h += '<div style="font-size:9px;color:var(--gold);font-weight:600">Watch →</div>';
      h += '</div></div></div>';
    });
    todayTees.forEach(function(t) {
      var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted"}).length : 0;
      h += '<div class="card" style="padding:14px 16px;cursor:pointer" onclick="Router.go(\'teetimes\')">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(t.courseName || "Tee Time") + '</div>';
      h += '<div style="font-size:11px;color:var(--muted)">Today at ' + (t.time || "TBD") + '</div></div>';
      h += '<div style="font-size:11px;color:var(--gold)">' + accepted + ' going</div>';
      h += '</div></div>';
    });
    h += '</div>';
  }

  // ── Profile completion reminder ──
  if (currentProfile) {
    var _profDone = 0, _profTotal = 6;
    if (currentProfile.bio && currentProfile.bio.trim()) _profDone++;
    if (currentProfile.range && currentProfile.range.trim()) _profDone++;
    if (currentProfile.homeCourse && currentProfile.homeCourse.trim()) _profDone++;
    if (currentProfile.favoriteCourse && currentProfile.favoriteCourse.trim()) _profDone++;
    var _clubsDone = 0;
    if (currentProfile.clubs) Object.keys(currentProfile.clubs).forEach(function(k){if(currentProfile.clubs[k])_clubsDone++});
    if (_clubsDone >= 1) _profDone++;
    var _hasPhoto = false;
    if (typeof photoCache !== "undefined") {
      var _pc = photoCache["member:" + (currentUser?currentUser.uid:"")];
      if (_pc && _pc.indexOf("stock_profile") === -1) _hasPhoto = true;
    }
    if (_hasPhoto) _profDone++;
    if (_profDone < 4) {
      var _missing = [];
      if (!currentProfile.bio || !currentProfile.bio.trim()) _missing.push("bio");
      if (!currentProfile.range || !currentProfile.range.trim()) _missing.push("score range");
      if (!currentProfile.homeCourse || !currentProfile.homeCourse.trim()) _missing.push("home course");
      if (_clubsDone < 1) _missing.push("club distances");
      h += '<div onclick="Router.go(\'members\',{edit:\'' + (currentUser?currentUser.uid:"") + '\'})" style="margin-bottom:12px;padding:12px 16px;background:linear-gradient(135deg,rgba(var(--gold-rgb),.08),rgba(var(--gold-rgb),.02));border:1px solid rgba(var(--gold-rgb),.15);border-radius:var(--radius);cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:10px"><div style="flex-shrink:0;color:var(--gold)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M3 21c0-4.4 3.6-8 9-8s9 3.6 9 8"/><path d="M12 14v4M10 16h4"/></svg></div>';
      h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--gold)">Complete your profile</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">Add your ' + _missing.slice(0,2).join(" & ") + ' to earn XP and unlock achievements</div></div>';
      h += '<div style="font-size:10px;color:var(--gold);font-weight:600">' + _profDone + '/' + _profTotal + '</div>';
      h += '</div></div>';
    }
  }

  // ── Motivation card ──
  var motivationCards = [];
  if (myRounds.length === 0) {
    motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='8' cy='4' r='3'/><path d='M4 14l4-4 4 4'/><line x1='8' y1='10' x2='8' y2='16'/></svg>", title:"Log your first round", sub:"Earn 100 XP, unlock the First Blood badge, and establish your handicap.", cta:"Play Now →", page:"playnow"});
  } else if (myRounds.length < 3) {
    motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><rect x='2' y='3' width='12' height='10' rx='1'/><path d='M5 7h6M5 10h4'/></svg>", title: (3 - myRounds.length) + " more round" + (myRounds.length < 2 ? "s" : "") + " until your handicap", sub:"Log " + (3 - myRounds.length) + " more to get your official GHIN handicap calculated.", cta:"Play Now →", page:"playnow"});
  }
  if (xpToNext <= 200 && myLevel.level > 1) {
    motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M9 1L4 9h4l-1 6 6-8H9l1-6z' fill='none' stroke='currentColor' stroke-width='1'/></svg>", title: xpToNext + " XP to Level " + (myLevel.level+1), sub:"One solid round could get you there. New title unlocks every 5 levels.", cta:"View Trophy Room →", page:"trophyroom"});
  }
  if (myRounds.length >= 3 && myRounds.length < 10 && myBest && myBest < 999) {
    motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='8' cy='8' r='6'/><circle cx='8' cy='8' r='3'/><circle cx='8' cy='8' r='.8' fill='currentColor'/></svg>", title:"Your best: " + myBest, sub:"Can you beat it? Every round that ties or beats your PR earns a 50-point bonus.", cta:"Play Now →", page:"playnow"});
  }
  var now = new Date();
  var inSeason = now.getMonth() >= 2 && now.getMonth() <= 8;
  if (inSeason && season.standings.length > 0) {
    var myStanding = season.standings.find(function(s) { return s.id === (currentUser ? currentUser.uid : "") || s.id === (currentProfile ? currentProfile.claimedFrom : ""); });
    if (myStanding && season.standings.indexOf(myStanding) > 0) {
      var ahead = season.standings[season.standings.indexOf(myStanding) - 1];
      var gap = ahead.points - myStanding.points;
      motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><path d='M5 2h6v5a3 3 0 01-6 0V2z'/><path d='M5 4H3a1 1 0 00-1 1v1a2 2 0 002 2h1M11 4h2a1 1 0 011 1v1a2 2 0 01-2 2h-1'/><path d='M6 10v2h4v-2M4 14h8'/></svg>", title: gap + " points behind " + (ahead.name||ahead.username), sub:"One big round with an attested score could close that gap.", cta:"View Standings →", page:"standings"});
    }
  }
  if (!motivationCards.length) {
    motivationCards.push({icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><path d='M3 2v12'/><path d='M3 2l9 3.5L3 9'/></svg>", title:"The course is calling", sub:"Every round earns XP, builds your handicap, and pushes you up the standings.", cta:"Play Now →", page:"playnow"});
  }
  var mCard;
  if (motivationCards.length === 1) { mCard = motivationCards[0]; }
  else {
    var userSeed = currentUser ? currentUser.uid.charCodeAt(0) : 0;
    var dayIndex = (Math.floor(Date.now() / 86400000) + userSeed) % motivationCards.length;
    mCard = motivationCards[dayIndex];
  }
  h += '<div style="margin-bottom:12px"><div onclick="Router.go(\'' + mCard.page + '\')" style="background:linear-gradient(135deg,rgba(var(--gold-rgb),.06),rgba(var(--gold-rgb),.02));border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius);padding:14px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent">';
  h += '<div style="display:flex;align-items:flex-start;gap:12px">';
  h += '<div style="font-size:24px;flex-shrink:0;margin-top:2px">' + mCard.icon + '</div>';
  h += '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--cream)">' + mCard.title + '</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:3px;line-height:1.4">' + mCard.sub + '</div>';
  h += '<div style="font-size:11px;color:var(--gold);font-weight:600;margin-top:8px">' + mCard.cta + '</div>';
  h += '</div></div></div></div>';

  // ── Unfinished trip banners ──
  var myUidForBanner = currentUser ? currentUser.uid : null;
  var myClaimedFrom = currentProfile ? currentProfile.claimedFrom : null;
  if (myUidForBanner) {
    var todayStr2 = localDateStr();
    var allTrips2 = PB.getTrips();
    allTrips2.forEach(function(tr) {
      if (!tr.courses || !tr.startDate || !tr.endDate) return;
      if (todayStr2 < tr.startDate || todayStr2 > tr.endDate) return;
      var isTripMember2 = tr.members && (
        tr.members.indexOf(myUidForBanner) !== -1 ||
        (myClaimedFrom && tr.members.indexOf(myClaimedFrom) !== -1)
      );
      if (!isTripMember2 && currentProfile && currentProfile.role !== "commissioner") return;
      var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      var todayDay = dayNames[new Date().getDay()];
      tr.courses.forEach(function(crs) {
        if (crs.finished) return;
        var courseDay = (crs.d || "").split(" ")[0];
        if (courseDay && courseDay !== todayDay) return;
        var tid = escHtml(tr.id);
        var ck = escHtml(crs.key);
        h += '<div data-trip-id="' + tid + '" data-course-key="' + ck + '" onclick="Router.go(\'scorecard\',{tripId:this.getAttribute(\'data-trip-id\'),course:this.getAttribute(\'data-course-key\')})" style="margin-bottom:8px;padding:12px 16px;background:linear-gradient(135deg,rgba(var(--birdie-rgb),.06),rgba(var(--birdie-rgb),.02));border:1px solid rgba(var(--birdie-rgb),.15);border-radius:var(--radius);cursor:pointer;-webkit-tap-highlight-color:rgba(var(--birdie-rgb),.15)">';
        h += '<div style="display:flex;align-items:center;gap:10px;pointer-events:none"><div style="flex-shrink:0;color:var(--birdie)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2M14 14h2M8 18h2"/></svg></div>';
        h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--birdie)">' + escHtml(crs.n || crs.key) + ' — scores not finalized</div>';
        h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(tr.name) + ' · Tap to review and finish round</div></div>';
        h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M6 4l4 4-4 4"/></svg>';
        h += '</div></div>';
      });
    });
  }

  // ── Next Event ──
  var nextTournament = tournaments.find(function(t) { return t.status !== "closed" && !t.champion; });
  if (nextTournament) {
    var days = PB.daysUntil(nextTournament.startDate);
    var daysUntilEnd = nextTournament.endDate ? PB.daysUntil(nextTournament.endDate) : days;
    var isUpcoming = days > 0;
    var isLiveEvent = days <= 0 && daysUntilEnd >= 0;
    var isPastEvent = days <= 0 && daysUntilEnd < 0;
    h += '<div class="next-trip" onclick="Router.go(\'scorecard\',{tripId:\'' + nextTournament.id + '\'})">';
    if (isLiveEvent) {
      h += '<div class="nt-eye"><span class="pill pill-live" style="font-size:8px">LIVE EVENT</span></div>';
    } else if (isPastEvent) {
      h += '<div class="nt-eye"><span class="pill pill-final" style="font-size:8px">AWAITING RESULTS</span></div>';
    } else {
      h += '<div class="nt-eye"><span style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:3px;font-weight:700">Upcoming</span></div>';
    }
    h += '<div class="nt-name">' + nextTournament.name + '</div>';
    h += '<div class="nt-detail">' + nextTournament.dates + ' · ' + nextTournament.location + ' · ' + nextTournament.courses.length + ' rounds</div>';
    if (isUpcoming) h += '<div class="nt-count">' + days + ' days away</div>';
    else if (isLiveEvent) h += '<div class="nt-count live">Happening now</div>';
    else h += '<div class="nt-count" style="color:var(--muted)">Tap to finalize results</div>';
    h += '</div>';
  }

  // ── Season Standings Mini-Leaderboard (top 3) ──
  if (season.standings.length > 0) {
    h += '<div class="section" style="padding-top:6px"><div class="sec-head"><span class="sec-title">Season Standings</span><span class="sec-link" onclick="Router.go(\'standings\')">View All</span></div>';
    var top3 = season.standings.slice(0, 3);
    top3.forEach(function(s, idx) {
      var p = PB.getPlayer(s.id);
      var medalIcon = idx === 0 ? '<span style="color:var(--gold);font-weight:800">1</span>' : idx === 1 ? '<span style="color:var(--medal-silver);font-weight:700">2</span>' : '<span style="color:var(--medal-bronze);font-weight:700">3</span>';
      var isFirst = idx === 0;
      h += '<div class="card" style="margin-bottom:4px;cursor:pointer;' + (isFirst ? 'border-color:rgba(var(--gold-rgb),.2);background:linear-gradient(135deg,var(--grad-card),var(--card))' : '') + '" onclick="Router.go(\'members\',{id:\'' + s.id + '\'})">';
      h += '<div style="padding:10px 14px;display:flex;align-items:center;gap:12px">';
      h += '<div style="width:24px;text-align:center;font-size:14px">' + medalIcon + '</div>';
      var _lbRingS = typeof playerRingStyle === "function" ? playerRingStyle(p || s) : "border:2px solid var(--gold)";
      h += '<div class="m-av" style="width:32px;height:32px;font-size:13px;' + _lbRingS + '">' + Router.getAvatar(p || s) + '</div>';
      h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(s.name || s.username || "") + '</div>';
      h += '<div style="font-size:10px;color:var(--muted)">' + (s.rounds||0) + ' rounds</div></div>';
      h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)" data-count="' + (s.points||0) + '">0</div>';
      h += '</div></div>';
    });
    h += '</div>';
  }

  // ── Event Results ──
  var pastTournaments = tournaments.filter(function(t) { return t.champion; });
  if (pastTournaments.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Event results</span><span class="sec-link" onclick="Router.go(\'trips\',{create:true})">Start New Event</span></div>';
    pastTournaments.forEach(function(t) {
      var champ = PB.getPlayer(t.champion);
      var champName = champ ? champ.name : t.champion;
      h += '<div class="card" onclick="Router.go(\'scorecard\',{tripId:\'' + t.id + '\'})" style="cursor:pointer"><div style="padding:14px 16px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">';
      h += '<div><div style="font-size:14px;font-weight:700;color:var(--cream)">' + escHtml(t.name) + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(t.dates || "") + ' · ' + escHtml(t.location || "") + '</div></div>';
      h += '<span class="pill pill-final">FINAL</span></div>';
      if (t.finalStandings && t.finalStandings.length) {
        var placeLabels = ["1st","2nd","3rd","4th","5th","6th"];
        t.finalStandings.forEach(function(s, i) {
          var isWinner = i === 0;
          h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;' + (i < t.finalStandings.length - 1 ? 'border-bottom:1px solid var(--border);' : '') + '">';
          h += '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;color:' + (isWinner ? 'var(--gold)' : 'var(--muted)') + ';width:24px;font-weight:600">' + (placeLabels[i]||"") + '</span>';
          h += '<span style="font-size:12px;color:' + (isWinner ? 'var(--gold)' : 'var(--cream)') + ';font-weight:' + (isWinner ? '700' : '400') + '">' + escHtml(s.name) + '</span></div>';
          h += '<span style="font-size:12px;font-weight:600;color:' + (isWinner ? 'var(--gold)' : 'var(--muted)') + '">' + s.points + ' pts</span></div>';
        });
      } else {
        h += '<div style="font-size:12px;color:var(--gold);font-weight:600">Champion: ' + escHtml(champName) + '</div>';
      }
      h += '</div></div>';
    });
    h += '</div>';
  }

  // ── Activity Feed ──
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Activity feed</span></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">';
  h += '<input class="ff-input" id="homeChatInput" placeholder="Say something..." style="flex:1;margin:0;font-size:12px;padding:9px 14px;border-radius:20px" onkeydown="if(event.key===\'Enter\')sendHomeChat()">';
  h += '<button style="background:var(--gold);border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0" onclick="sendHomeChat()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--bg)" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
  h += '</div>';
  h += '<div id="homeActivityFeed"><div class="card"><div style="padding:20px;text-align:center;font-size:11px;color:var(--muted)">Loading...</div></div></div>';

  // Quick links
  h += '<div style="display:flex;gap:8px;margin-bottom:8px">';
  h += '<div class="ql" style="flex:1" onclick="Router.go(\'teetimes\')"><div class="ql-icon" style="color:var(--gold)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="ql-label">Tee Times</div></div>';
  h += '<div class="ql" style="flex:1" onclick="Router.go(\'records\')"><div class="ql-icon" style="color:var(--gold)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div><div class="ql-label">Records</div></div>';
  h += '<div class="ql" style="flex:1" onclick="Router.go(\'syncround\')"><div class="ql-icon" style="color:var(--gold)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/><path d="M21 9A9 9 0 006.3 5.3L3 9"/><path d="M3 15a9 9 0 0014.7 3.7L21 15"/></svg></div><div class="ql-label">Sync Round</div></div>';
  h += '</div>';

  h += '</div>'; // close home-wrap
  
  h += renderPageFooter();

    document.querySelector('[data-page="home"]').innerHTML = h;
  // Re-render online section since the div was just recreated
  if (typeof renderOnlineSection === "function") renderOnlineSection();
  // Load activity feed async from Firestore
  loadHomeActivityFeed();
});

function showRivalryDetail(p1id, p2id) {
  var p1 = PB.getPlayer(p1id), p2 = PB.getPlayer(p2id);
  if (!p1 || !p2) return;
  var h2h = calcH2H(p1id, p2id);
  
  // Find shared rounds for match history
  var p1rounds = PB.getPlayerRounds(p1id);
  var p2rounds = PB.getPlayerRounds(p2id);
  var matches = [];
  var matchedKeys = {};
  p1rounds.forEach(function(r1) {
    var match = p2rounds.find(function(r2) { return r2.course === r1.course && r2.date === r1.date; });
    if (match) {
      matchedKeys[r1.course + "|" + r1.date] = true;
      matches.push({ date: r1.date, course: r1.course, p1score: r1.score, p2score: match.score, winner: r1.score < match.score ? p1id : match.score < r1.score ? p2id : "tie" });
    }
  });
  // Also include trip scorecard rounds
  PB.getTrips().forEach(function(tr) {
    if (!tr.courses) return;
    tr.courses.forEach(function(crs) {
      var s1 = PB.getScores(tr.id, crs.key, p1id);
      var s2 = PB.getScores(tr.id, crs.key, p2id);
      if (!s1 || !s1.length || !s2 || !s2.length) return;
      var t1=0,t2=0,h1c=0,h2c=0;
      s1.forEach(function(v){if(v!==""&&v!==null&&v!==undefined){t1+=parseInt(v)||0;h1c++;}});
      s2.forEach(function(v){if(v!==""&&v!==null&&v!==undefined){t2+=parseInt(v)||0;h2c++;}});
      if(h1c===0||h2c===0||h1c!==h2c) return;
      var key = (crs.n||crs.key)+"|"+(crs.d||tr.startDate||"");
      if(matchedKeys[key]) return;
      matches.push({date:crs.d||tr.startDate||"",course:crs.n||crs.key,p1score:t1,p2score:t2,winner:t1<t2?p1id:t1>t2?p2id:"tie"});
    });
  });
  matches.sort(function(a,b) { return b.date > a.date ? 1 : -1; });

  var h = '<div class="sh"><h2>' + escHtml(p1.name) + ' vs ' + escHtml(p2.name) + '</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  // Big score display
  h += '<div style="text-align:center;padding:20px">';
  h += '<div class="rivalry-vs">';
  h += '<div class="rv-player"><div class="rv-av" style="width:56px;height:56px;font-size:22px;border-color:' + playerFrameColor(p1) + '">' + Router.getAvatar(p1) + '</div><div class="rv-name">' + escHtml(p1.name) + '</div></div>';
  h += '<div class="rv-x">vs</div>';
  h += '<div class="rv-player"><div class="rv-av" style="width:56px;height:56px;font-size:22px;border-color:' + playerFrameColor(p2) + '">' + Router.getAvatar(p2) + '</div><div class="rv-name">' + escHtml(p2.name) + '</div></div>';
  h += '</div>';
  h += '<div class="rv-score" style="margin-top:12px">' + h2h.p1wins + ' — ' + h2h.p2wins + '</div>';
  h += '<div class="rv-label">' + (h2h.ties > 0 ? h2h.ties + ' ties' : 'Head-to-head record') + '</div>';
  h += '</div>';

  // Action buttons
  h += '<div class="section"><div style="display:flex;gap:8px">';
  h += '<button class="btn full green" style="flex:1" onclick="Router.go(\'challenges\',{opponent:\'' + p2id + '\'})">Issue Challenge</button>';
  h += '<button class="btn full outline" style="flex:1" onclick="Router.go(\'tee-create\')">Post Tee Time</button>';
  h += '</div></div>';

  // Match history
  if (matches.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Match History</span></div>';
    matches.forEach(function(m) {
      var winnerName = m.winner === p1id ? p1.name : m.winner === p2id ? p2.name : "Tie";
      var winColor = m.winner === "tie" ? "var(--muted)" : "var(--gold)";
      h += '<div class="card"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:12px;font-weight:600">' + escHtml(m.course) + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">' + m.date + '</div></div>';
      h += '<div style="text-align:right"><div style="font-family:Playfair Display,serif;font-size:18px;font-weight:700;color:' + winColor + '">' + m.p1score + ' — ' + m.p2score + '</div>';
      h += '<div style="font-size:9px;color:var(--muted)">' + escHtml(winnerName) + '</div></div>';
      h += '</div></div></div>';
    });
    h += '</div>';
  } else {
    h += '<div class="section"><div class="card"><div class="empty"><div class="empty-text">No head-to-head matches yet. Time to change that.</div></div></div></div>';
  }

  // Reuse the standings page container for this detail view
  document.querySelector('[data-page="standings"]').innerHTML = h;
}

function doCopy() {
  var code = PB.exportBackup();
  navigator.clipboard.writeText(code).then(function() { Router.toast("Backup copied!"); }).catch(function() { prompt("Copy this code:", code); });
}
function doRestore() {
  var code = prompt("Paste backup code:");
  if (code && PB.importBackup(code)) { Router.toast("Restored!"); Router.go("home"); }
  else if (code) Router.toast("Invalid code");
}

