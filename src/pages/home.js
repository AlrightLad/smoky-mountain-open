/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: HOME — Clubhouse editorial layout (v8.4.0 · Ship 1)

   Three render states gated by user/round context:
     · "active"  — liveState.active === true  (live round in progress)
     · "idle"    — returning user, no active round, rounds.length > 0
     · "new"     — 0 rounds ever (welcome flow)

   Render order is consistent across states:
     1. Email verification banner (always, if unverified)
     2. Greeting (all states)
     3. State-specific primary block (live card / CTA / new-user CTAs)
     4. Stats strip (all states — zeros/em-dashes for new)
     5. Pulses (idle only — up to 2 lightweight editorial items)
     6. Tee times section (conditional, not on new state)
     7. Page footer

   Visual tokens: --cb-chalk, --cb-chalk-2, --cb-chalk-3, --cb-green, --cb-ink,
   --cb-charcoal, --cb-mute, --cb-brass, --font-display, --font-mono, --font-ui.
   All theme-aware via v8.3.5 token system.
   ═══════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════
// === PART 1: Home render (Clubhouse editorial) ===
// ═══════════════════════════════════════════════════════════════════════════

Router.register("home", function() {
  var myRounds = currentUser ? PB.getPlayerRounds(currentUser.uid) : [];
  if (!myRounds.length && currentProfile && currentProfile.claimedFrom) {
    myRounds = PB.getPlayerRounds(currentProfile.claimedFrom);
  }
  var season = PB.getSeasonStandings(new Date().getFullYear());

  var state = _homeState(myRounds);
  var greetingWord = state === "new" ? "Welcome" : _greetingForTime();
  var firstName = _firstName(currentProfile);

  // Materialized stats preferred (kept in sync by persistPlayerStats).
  var totalRounds = (currentProfile && currentProfile.totalRounds != null) ? currentProfile.totalRounds : myRounds.length;
  var handicap = (currentProfile && currentProfile.computedHandicap != null) ? currentProfile.computedHandicap : null;
  var bestRound = (currentProfile && currentProfile.bestRound != null) ? currentProfile.bestRound : null;
  var bestRoundId = null;
  if (bestRound != null) {
    var myFull18 = myRounds.filter(function(r) {
      return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18);
    });
    var br = myFull18.find(function(r) { return r.score === bestRound; });
    if (br) bestRoundId = br.id;
  }

  var myLevel = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(currentUser ? currentUser.uid : null));

  var h = "";
  h += _renderEmailVerifyBanner();
  h += _renderGreeting(greetingWord, firstName);

  if (state === "active") {
    h += _renderLiveRoundCard();
  } else if (state === "new") {
    h += _renderNewUserIntro();
    h += _renderNewUserCTAs();
  } else {
    // state === "idle"
    h += _renderUnfinishedTripBanner(
      PB.getTrips(),
      currentUser ? currentUser.uid : null,
      currentProfile ? currentProfile.claimedFrom : null
    );
    h += _renderReadyCTA();
  }

  h += _renderStatsStrip(totalRounds, handicap, bestRound, bestRoundId, state === "new");

  if (state === "idle") {
    var pulses = _generatePulses(currentProfile, myRounds, myLevel, season);
    h += _renderPulses(pulses);
  }

  if (state !== "new") {
    var upcoming = _getUpcomingTeeTimes();
    if (upcoming && upcoming.length > 0) h += _renderTeeTimesSection(upcoming);
  }

  h += renderPageFooter();

  document.querySelector('[data-page="home"]').innerHTML = h;
});

// ─── Private helpers (home-only — underscore prefix) ──────────────────────

function _homeState(myRounds) {
  var hasLive = typeof liveState !== "undefined" && liveState && liveState.active === true;
  if (hasLive) return "active";
  if (!myRounds || myRounds.length === 0) return "new";
  return "idle";
}

function _greetingForTime() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function _firstName(profile) {
  if (!profile) return "Friend";
  var name = profile.name || profile.username || "";
  if (!name) return "Friend";
  var words = String(name).trim().split(/\s+/);
  if (words.length === 0) return "Friend";

  // Skip common titles if present as first word AND there are more words
  var titles = ["mr","mrs","ms","miss","dr","prof","sir","madam","mx"];
  var firstWordLower = words[0].replace(/\./g, "").toLowerCase();
  if (words.length > 1 && titles.indexOf(firstWordLower) !== -1) {
    return words[1];
  }
  return words[0] || "Friend";
}

function _formatDateEyebrow() {
  var d = new Date();
  var day = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][d.getDay()];
  var month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  return day + " · " + month + " " + d.getDate();
}

function _renderEmailVerifyBanner() {
  if (!currentUser || currentUser.emailVerified) return "";
  var h = '<div style="padding:10px 22px;background:rgba(180,137,62,0.08);border-bottom:1px solid rgba(180,137,62,0.15);display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="1.5" style="flex-shrink:0"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z"/><path d="M1 5l7 4 7-4"/></svg>';
  h += '<div style="flex:1;font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;color:var(--cb-brass);line-height:1.4">Verify your email to unlock wagers, bounties, DMs, and the shop.</div>';
  h += '<button style="background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:4px;font:700 10px/1 var(--font-ui);padding:6px 12px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px" onclick="sendVerificationEmail()">Verify</button>';
  h += '</div>';
  return h;
}

function _renderGreeting(greetingWord, firstName) {
  var h = '<div style="padding:28px 22px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:10px">' + _formatDateEyebrow() + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-ink);line-height:1.15;letter-spacing:-0.5px">';
  h += escHtml(greetingWord) + ',<br>';
  h += '<span style="font-style:italic;font-weight:600">' + escHtml(firstName) + '.</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderLiveRoundCard() {
  if (typeof liveState === "undefined" || !liveState || !liveState.active) return "";

  var course = liveState.course || "Round in progress";
  var hole = (liveState.currentHole || 0) + 1;
  var scored = liveState.scores ? liveState.scores.filter(function(s) { return s !== ""; }) : [];
  var thru = scored.length;
  var total = scored.reduce(function(a, b) { return a + parseInt(b); }, 0);

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) {
    var hd = liveState.holes && liveState.holes[i];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[i] || 4);
  }
  var diff = thru > 0 ? total - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));

  var fmt = (liveState.format || "stroke").toString();
  var formatLabel = fmt === "scramble" ? "SCRAMBLE" : fmt.toUpperCase() + " PLAY";

  var h = '<div style="padding:18px 22px 0">';
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:16px;padding:22px;color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);display:flex;align-items:center;gap:8px;margin-bottom:14px">';
  h += '<span style="width:6px;height:6px;border-radius:50%;background:var(--cb-brass);animation:pulse-dot 2s infinite"></span>';
  h += 'LIVE · YOUR ROUND';
  h += '</div>';
  h += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--cb-chalk);line-height:1.2;letter-spacing:-0.3px;margin-bottom:6px">' + escHtml(course) + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1.5px">HOLE ' + hole + ' · THRU ' + thru + ' · ' + formatLabel + '</div>';
  h += '<div style="display:flex;gap:22px;padding-top:16px;margin-top:16px;border-top:1px solid rgba(var(--bg-rgb),0.14)">';
  h += '<div style="flex:1">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">YOU</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-chalk);line-height:1">' + (thru > 0 ? total : "—") + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1px;margin-top:4px">' + diffStr + (thru > 0 ? " THRU " + thru : "") + '</div>';
  h += '</div>';
  h += '<div style="flex:1;text-align:right;align-self:center">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">RESUME</div>';
  h += '<div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--cb-chalk)">Scorecard →</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderUnfinishedTripBanner(trips, uid, claimedFrom) {
  if (!uid || !trips || !trips.length) return "";
  var today = localDateStr();
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var todayDay = dayNames[new Date().getDay()];
  var h = "";
  trips.forEach(function(tr) {
    if (!tr.courses || !tr.startDate || !tr.endDate) return;
    if (today < tr.startDate || today > tr.endDate) return;
    var isMember = tr.members && (
      tr.members.indexOf(uid) !== -1 ||
      (claimedFrom && tr.members.indexOf(claimedFrom) !== -1)
    );
    if (!isMember && !isFounderRole(currentProfile)) return;
    tr.courses.forEach(function(crs) {
      if (crs.finished) return;
      var courseDay = (crs.d || "").split(" ")[0];
      if (courseDay && courseDay !== todayDay) return;
      var tid = escHtml(tr.id);
      var ck = escHtml(crs.key);
      h += '<div data-trip-id="' + tid + '" data-course-key="' + ck + '" class="tappable" onclick="Router.go(\'scorecard\',{tripId:this.getAttribute(\'data-trip-id\'),course:this.getAttribute(\'data-course-key\')})" style="margin:18px 22px 0;padding:14px 16px;background:var(--cb-chalk-2);border-left:2px solid var(--cb-moss);border-radius:10px;cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:10px;pointer-events:none">';
      h += '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--cb-moss)" stroke-width="1.5" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
      h += '<div style="flex:1">';
      h += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--cb-ink);line-height:1.3">' + escHtml(crs.n || crs.key) + ' — scores not finalized</div>';
      h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px">' + escHtml(tr.name) + ' · Tap to review and finish round</div>';
      h += '</div>';
      h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--cb-mute)" stroke-width="1.5" style="flex-shrink:0"><path d="M6 4l4 4-4 4"/></svg>';
      h += '</div></div>';
    });
  });
  return h;
}

function _renderReadyCTA() {
  var h = '<div style="padding:18px 22px 0">';
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="padding:22px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:10px">NO ROUND TODAY</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-ink);line-height:1.2;letter-spacing:-0.2px;margin-bottom:8px">Ready when you are.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-charcoal);line-height:1.55;max-width:380px;margin-bottom:16px">Start a round and the scorecard, skins pot and your caddie will wake up.</div>';
  h += '<div style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;background:var(--cb-green);color:var(--cb-chalk);border-radius:8px;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.3px">';
  h += '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14V2l8 3-8 3"/></svg>';
  h += 'Start a round';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderNewUserIntro() {
  var h = '<div style="padding:10px 22px 0">';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.55;max-width:440px">You’re in. Start by logging a round, or hit the range to warm up.</div>';
  h += '</div>';
  return h;
}

function _renderNewUserCTAs() {
  var h = '<div style="padding:18px 22px 0;display:flex;gap:10px;flex-wrap:wrap">';
  // First round
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">START HERE</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Your first round.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Log a full round and the Clubhouse comes alive.</div>';
  h += '</div>';
  // Range session
  h += '<div class="tappable" onclick="Router.go(\'range\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">OR WARM UP</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Range session.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Track your bucket and focus drills.</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderStatsStrip(totalRounds, handicap, bestRound, bestRoundId, isNew) {
  var roundsStr = isNew ? "0" : String(totalRounds != null ? totalRounds : 0);
  var hcapStr = (!isNew && handicap != null && !isNaN(handicap)) ? (+handicap).toFixed(1) : "—";
  var bestStr = (!isNew && bestRound != null) ? String(bestRound) : "—";

  var h = '<div style="padding:22px;display:grid;grid-template-columns:repeat(3, 1fr);gap:10px">';

  // ROUNDS
  var roundsClickable = !isNew && totalRounds > 0;
  h += '<div' + (roundsClickable ? ' class="tappable" onclick="Router.go(\'roundhistory\')"' : '') + ' style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px;' + (roundsClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">ROUNDS</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + roundsStr + '</div>';
  h += '</div>';

  // HCP
  h += '<div style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">HCP</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + hcapStr + '</div>';
  h += '</div>';

  // BEST
  var bestClickable = !!bestRoundId;
  h += '<div' + (bestClickable ? ' class="tappable" onclick="Router.go(\'rounds\',{roundId:\'' + escHtml(bestRoundId) + '\'})"' : '') + ' style="padding:12px 10px;background:var(--cb-chalk-2);border-radius:10px;' + (bestClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">BEST</div>';
  h += '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + bestStr + '</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

function _generatePulses(profile, myRounds, myLevel, season) {
  var pulses = [];

  // Near level-up (≤ 200 XP to next)
  if (myLevel && myLevel.level > 1 && (myLevel.nextLevelXp - myLevel.xp) <= 200 && (myLevel.nextLevelXp - myLevel.xp) > 0) {
    var xpToNext = myLevel.nextLevelXp - myLevel.xp;
    pulses.push({ eyebrow: "NEXT LEVEL", text: xpToNext + " XP to Level " + (myLevel.level + 1) + "." });
  }

  // 1-2 rounds: encourage handicap threshold
  if (myRounds && myRounds.length > 0 && myRounds.length < 3) {
    var n = 3 - myRounds.length;
    pulses.push({
      eyebrow: "HANDICAP",
      text: n + " more round" + (n === 1 ? "" : "s") + " until your handicap is official."
    });
  }

  // Season gap — only if under ~80 pts (reachable)
  if (season && season.standings && season.standings.length > 0) {
    var uid = currentUser ? currentUser.uid : null;
    var claimedFrom = profile ? profile.claimedFrom : null;
    var myStanding = season.standings.find(function(s) { return s.id === uid || s.id === claimedFrom; });
    if (myStanding) {
      var idx = season.standings.indexOf(myStanding);
      if (idx > 0) {
        var ahead = season.standings[idx - 1];
        var gap = ahead.points - myStanding.points;
        if (gap > 0 && gap <= 80) {
          pulses.push({
            eyebrow: "SEASON",
            text: gap + " point" + (gap === 1 ? "" : "s") + " behind " + (ahead.name || ahead.username || "them") + "."
          });
        }
      }
    }
  }

  return pulses.slice(0, 2);
}

function _renderPulses(pulses) {
  if (!pulses || pulses.length === 0) return "";
  var h = '<div style="padding:0 22px">';
  pulses.forEach(function(p) {
    h += '<div style="padding:14px 16px;background:var(--cb-chalk-2);border-left:2px solid var(--cb-brass);border-radius:6px;margin-bottom:8px">';
    h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:4px">' + escHtml(p.eyebrow) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-ink);line-height:1.5">' + escHtml(p.text) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

function _getUpcomingTeeTimes() {
  if (typeof liveTeeTimes === "undefined" || !liveTeeTimes) return null;
  var today = localDateStr();
  var upcoming = liveTeeTimes.filter(function(t) {
    return t.date && t.date >= today && t.status !== "cancelled";
  });
  // Sort by date (ascending), then time
  upcoming.sort(function(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.time || "") < (b.time || "") ? -1 : 1;
  });
  return upcoming.slice(0, 3);
}

function _teeTimeDateLabel(dateStr, timeStr) {
  if (!dateStr) return (timeStr || "").toUpperCase();
  var today = localDateStr();
  var d = new Date(Date.now() + 86400000);
  var tomorrow = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  var prefix;
  if (dateStr === today) prefix = "TODAY";
  else if (dateStr === tomorrow) prefix = "TMRW";
  else {
    var dd = new Date(dateStr + "T12:00:00");
    prefix = ["SUN","MON","TUE","WED","THU","FRI","SAT"][dd.getDay()];
  }
  return prefix + (timeStr ? " " + timeStr : "");
}

function _renderTeeTimesSection(upcoming) {
  if (!upcoming || upcoming.length === 0) return "";
  var h = '<div style="padding:22px 22px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:10px">ON THE TEE</div>';
  upcoming.forEach(function(t, i) {
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k) { return t.responses[k] === "accepted"; }).length : 0;
    var label = _teeTimeDateLabel(t.date, t.time);
    h += '<div class="tappable" onclick="Router.go(\'teetimes\')" style="padding:12px 0;' + (i === 0 ? '' : 'border-top:1px solid var(--cb-chalk-3);') + 'display:flex;align-items:baseline;gap:14px;cursor:pointer">';
    h += '<div style="font-family:var(--font-mono);font-size:11px;color:var(--cb-brass);font-weight:700;letter-spacing:0.5px;min-width:74px;flex-shrink:0">' + escHtml(label) + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--cb-ink);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(t.courseName || "Tee time") + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px">' + (t.postedByName ? "Posted by " + escHtml(t.postedByName) + " · " : "") + accepted + ' going</div>';
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// === PART 2: External helpers (DO NOT DELETE — used by other pages) ===
// These functions are called from pages outside home.js. Removing them will
// break: 11+ pages that call renderPageFooter(), members.js (showRivalryDetail),
// scorecard.js + settings.js (doCopy / doRestore). Future cleanup ship can
// extract these to src/core/page-helpers.js — logged to backlog.
// ═══════════════════════════════════════════════════════════════════════════

// Shared footer links rendered at the bottom of every main tab page.
// Used by: activity, drills, findplayers, leagues, members, more, records,
// richlist, roundhistory, teetimes, trips, wagers.
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

// Rivalry detail view — used by members.js H2H list.
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
  h += '<div class="rv-player">' + renderAvatar(p1, 56, true) + '<div class="rv-name">' + renderUsername(p1, 'font-size:12px;color:var(--cream);', false) + '</div></div>';
  h += '<div class="rv-x">vs</div>';
  h += '<div class="rv-player">' + renderAvatar(p2, 56, true) + '<div class="rv-name">' + renderUsername(p2, 'font-size:12px;color:var(--cream);', false) + '</div></div>';
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
      h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:' + winColor + '">' + m.p1score + ' — ' + m.p2score + '</div>';
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

// Backup export — used by scorecard.js and settings.js.
function doCopy() {
  var code = PB.exportBackup();
  navigator.clipboard.writeText(code).then(function() { Router.toast("Backup copied!"); }).catch(function() { prompt("Copy this code:", code); });
}

// Backup import — used by scorecard.js and settings.js.
function doRestore() {
  var code = prompt("Paste backup code:");
  if (code && PB.importBackup(code)) { Router.toast("Restored!"); Router.go("home"); }
  else if (code) Router.toast("Invalid code");
}
