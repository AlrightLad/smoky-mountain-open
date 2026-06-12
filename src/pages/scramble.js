/* ================================================
   PAGE: SCRAMBLE TEAMS
   ================================================ */

Router.register("scramble", function(params) {
  if (params.create) { renderCreateTeam(); return; }
  if (params.match) { renderLogMatch(params.challenger || null); return; }
  if (params.teamround) { renderLogTeamRound(params.teamround); return; }
  if (params.id) { renderTeamDetail(params.id); return; }
  renderTeamList();
});

// v8.25.13 — initial-bearing avatar for the scramble surfaces. The shared
// Router.getAvatar() always assigns one of six stock JPGs when a member has no
// uploaded photo, so an all-default roster reads as a row of near-identical dark
// discs with no per-member signal. Here, when a player has no detectable photo,
// we draw a felt-green disc with their brass first initial instead — distinct,
// on-token, and still wearing the member's real ring (founder brass / cosmetic /
// hairline) via the shared ring helpers. Players WITH a real photo still go
// through renderAvatar so images + cosmetic ring art render unchanged.
function scrambleAvatar(p, size, clickToProfile) {
  size = size || 36;
  var hasPhoto = p && (p.photoUrl || p.photo || p.stockAvatar);
  if (!p || hasPhoto) return renderAvatar(p, size, clickToProfile);

  var ringStyle = typeof playerRingStyle === "function" ? playerRingStyle(p) : 'border:2px solid var(--gold)';
  var ringCls = typeof playerRingClass === "function" ? playerRingClass(p) : '';
  var pid = p.id || '';
  var raw = (p.username || p.name || '?').charAt(0).toUpperCase();
  var initial = escHtml(raw);
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';
  var fontPx = Math.max(11, Math.round(size * 0.42));
  return '<div' + (ringCls ? ' class="' + ringCls + '"' : '') +
    ' style="width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;border-radius:50%;position:relative;' + ringStyle + ';' + cursor + 'flex-shrink:0"' + click +
    '><div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--cb-felt);display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:' + fontPx + 'px;line-height:1">' + initial + '</div></div>';
}

function renderTeamList() {
  var teams = PB.getScrambleTeams();
  var h = '<div class="sh"><h2>Scramble teams</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'home\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'scramble\',{create:true})">+ New team</button></div></div>';

  if (teams.length) {
    if (teams.length >= 2) {
      h += '<div style="padding:0 16px 12px"><button class="btn full outline" onclick="Router.go(\'scramble\',{match:true})">Log a match</button></div>';
    }
    // v8.25.13 — collect every team's real rounds + matches into one timeline so
    // the page can show a "Recent scramble activity" feed below the cards (the
    // bottom half of the viewport was empty cream). Built ONLY from data we
    // already surface per-card (team.matches[] + the same course+date-derived
    // founding rounds) — no fabricated values.
    var activity = [];
    teams.forEach(function(team) {
      var members = team.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);
      var captain = team.captain ? PB.getPlayer(team.captain) : null;
      // team.matches[] is the authoritative team-scoped store (written by
      // addScrambleMatch + finishScrambleLive, both keyed to this team). We do
      // NOT merge by single-member overlap. But v8.25.9 surfaces founding
      // scramble rounds (the SMO Sequoyah scramble) that were logged as
      // individual scramble round docs and never as a team match — derived
      // ONLY when every member shares a course+date, so no cross-team bleed
      // (Founder: "scramble teams are still showing no score").
      var allMatches = (team.matches || []).slice();
      if (typeof _deriveTeamScrambleRounds === "function") {
        _deriveTeamScrambleRounds(team).forEach(function(dr){ if (!allMatches.some(function(m){return m.course===dr.course && m.date===dr.date;})) allMatches.push(dr); });
      }
      var scored = allMatches.filter(function(m){return m.score;}).sort(function(a,b){return a.score-b.score;});
      var best = scored.length ? scored[0].score : null;
      var last3 = allMatches.slice(-3).reverse();

      // Feed the cross-team activity timeline (Fix #1). Each item keeps the
      // team it belongs to so the row is tap-through to that team's detail.
      allMatches.forEach(function(m) {
        if (!m.score) return;
        activity.push({ teamId: team.id, teamName: team.name, score: m.score, course: m.course || '', date: m.date || '', result: m.result || null, opponent: m.opponent || null, opponentScore: m.opponentScore });
      });

      h += '<div class="card" onclick="Router.go(\'scramble\',{id:\'' + team.id + '\'})" style="cursor:pointer">';
      h += '<div style="padding:14px 16px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';

      // Left — name, avatars, captain
      h += '<div>';
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
      h += '<div style="font-size:15px;font-weight:700;color:var(--gold)">' + escHtml(team.name) + '</div>';
      h += '<span class="badge" style="font-size:9px">' + members.length + '-man</span></div>';
      h += '<div style="display:flex;gap:6px;margin-bottom:6px">';
      members.forEach(function(p) {
        var isCap = captain && p.id === team.captain;
        h += scrambleAvatar(p, 28, false);
      });
      h += '</div>';
      if (captain) h += '<div style="font-size:10px;color:var(--muted)">Captain: <span style="color:var(--gold);font-weight:600">' + escHtml(captain.name) + '</span></div>';
      h += '</div>';

      // Right — W-L if team has H2H matches, otherwise best score
      var h2h = allMatches.filter(function(m) { return m.result === 'win' || m.result === 'loss' || m.result === 'tie'; });
      h += '<div style="text-align:right">';
      if (h2h.length > 0) {
        var wins = h2h.filter(function(m) { return m.result === "win"; }).length;
        var losses = h2h.filter(function(m) { return m.result === "loss"; }).length;
        h += '<div style="font-size:28px;font-weight:800;color:var(--gold);line-height:1">' + wins + '-' + losses + '</div>';
        h += '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">W-L</div>';
        if (best !== null) h += '<div style="font-size:10px;color:var(--muted2)">Best: ' + best + '</div>';
      } else if (best !== null) {
        h += '<div style="font-size:28px;font-weight:800;color:var(--gold);line-height:1">' + best + '</div>';
        h += '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">' + (scored.length === 1 ? 'Score' : 'Best score') + '</div>';
        // Only show the recent-scores strip when there's MORE than the single
        // best — otherwise it just repeats the same number ("77 / 77 Last 1").
        if (scored.length > 1 && last3.filter(function(m){return m.score;}).length) {
          h += '<div style="font-size:10px;color:var(--muted2)">';
          last3.filter(function(m){return m.score;}).forEach(function(m,i) {
            var d = m.score - 72;
            // Community-safe: under or at the team baseline reads quiet green, over stays
            // neutral. Never alarm-red on a member's score, here or anywhere else.
            var c = d <= 0 ? 'var(--birdie)' : 'var(--muted)';
            h += '<span style="color:' + c + ';margin-left:' + (i?4:0) + 'px">' + m.score + '</span>';
          });
          h += '<div style="font-size:9px;color:var(--muted2);margin-top:1px">Last ' + last3.filter(function(m){return m.score;}).length + '</div>';
          h += '</div>';
        }
      } else {
        h += '<div style="font-size:12px;color:var(--muted2);margin-top:4px">No rounds</div>';
      }
      h += '</div>';

      h += '</div></div></div>';
    });

    // ── Recent scramble activity ──────────────────────────────────────────
    // Fills the lower fold with a real, glanceable timeline of the league's
    // scramble play. Most-recent first; dated rounds rank above undated ones.
    activity.sort(function(a, b) {
      if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Recent scramble activity</span></div>';
    if (activity.length) {
      activity.slice(0, 5).forEach(function(a) {
        var diff = a.score - 72;
        // Community-safe colour rule (scramble.js): under/at par reads quiet
        // green, over par stays neutral — never alarm-red on a member's score.
        var diffColor = diff <= 0 ? 'var(--birdie)' : 'var(--muted)';
        var isMatch = a.result === 'win' || a.result === 'loss' || a.result === 'tie';
        var line2;
        if (isMatch) {
          var verb = a.result === 'win' ? 'beat' : a.result === 'loss' ? 'lost to' : 'tied';
          line2 = verb + ' ' + escHtml(a.opponent || 'a team') + (a.course ? ' · ' + escHtml(a.course) : '');
        } else {
          line2 = a.course ? escHtml(a.course) : 'Team round';
        }
        h += '<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="Router.go(\'scramble\',{id:\'' + a.teamId + '\'})">';
        h += '<div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center">';
        h += '<div style="min-width:0"><div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(a.teamName) + '</div>';
        h += '<div style="font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + line2 + (a.date ? ' · ' + escHtml(a.date) : '') + '</div></div>';
        h += '<div style="text-align:right;flex-shrink:0;margin-left:10px">';
        h += '<div style="font-size:16px;font-weight:700;color:var(--gold);line-height:1.1">' + a.score + '</div>';
        h += '<div style="font-size:10px;font-weight:600;color:' + diffColor + '">' + (diff > 0 ? '+' : '') + diff + '</div>';
        h += '</div></div></div>';
      });
    } else {
      // P10 actionable empty-state: teams exist but none have logged a round.
      h += '<div class="card"><div style="padding:16px;text-align:center">';
      h += '<div style="font-size:12px;color:var(--muted);line-height:1.5">No rounds logged yet. Open a team and tap <span style="color:var(--gold);font-weight:600">Log team round</span> to start the activity feed.</div>';
      h += '</div></div>';
    }
    h += '</div>';
  } else {
    h += '<div style="text-align:center;padding:32px 16px">';
    h += '<div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><circle cx="16" cy="16" r="6"/><circle cx="32" cy="16" r="6"/><path d="M8 36c0-4.4 3.6-8 8-8h16c4.4 0 8 3.6 8 8"/></svg></div>';
    // v8.24.37 — serif/brass empty-state title, matching the Bounty Board
    // recipe (the heavy sans title was the page's last pre-Clubhouse relic).
    h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">No Scramble Teams</div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Create a scramble team to track W-L records and team scores. Pick your partner and dominate together.</div>';
    h += '<button class="btn full green" style="margin-top:16px;max-width:280px;margin-left:auto;margin-right:auto" onclick="Router.go(\'scramble\',{create:true})">Create a Team</button>';
    h += '</div>';
  }

  document.querySelector('[data-page="scramble"]').innerHTML = h;
}

function renderCreateTeam() {
  var players = PB.getPlayers();
  var h = '<div class="sh"><h2>Create team</h2><button class="back" onclick="Router.back(\'scramble\')">← Back</button></div>';

  h += '<div class="form-section"><div class="form-title">Team info</div>';
  h += formField("Team name", "st-name", "", "text", "e.g. Zach & Kayvan");
  h += '</div>';

  h += '<div class="form-section"><div class="form-title">Team size</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:12px">';
  h += '<button class="btn-sm outline" id="sz-2" onclick="setTeamSize(2)" style="flex:1">2-man</button>';
  h += '<button class="btn-sm outline" id="sz-3" onclick="setTeamSize(3)" style="flex:1">3-man</button>';
  h += '<button class="btn-sm outline" id="sz-4" onclick="setTeamSize(4)" style="flex:1">4-man</button>';
  h += '</div></div>';

  h += '<div class="form-section"><div class="form-title">Select members</div>';
  h += '<div id="st-members">';
  players.forEach(function(p) {
    h += '<div class="h2h-row" style="cursor:pointer" onclick="toggleScrambleMember(\'' + p.id + '\')">';
    h += '<div class="h2h-left">' + scrambleAvatar(p, 28, false) + '<span class="h2h-name">' + renderUsername(p, '', false) + '</span></div>';
    h += '<div id="st-check-' + p.id + '" style="width:22px;height:22px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--birdie)"></div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '<div class="form-section"><button class="btn full green" onclick="submitCreateTeam()">Create team</button></div>';

  document.querySelector('[data-page="scramble"]').innerHTML = h;
  setTeamSize(2);
}

var scrambleSelected = [];
var scrambleTeamSize = 2;

function setTeamSize(n) {
  scrambleTeamSize = n;
  scrambleSelected = [];
  // Reset all checks
  PB.getPlayers().forEach(function(p) {
    var el = document.getElementById("st-check-" + p.id);
    if (el) { el.textContent = ""; el.style.background = "transparent"; el.style.borderColor = "var(--border)"; }
  });
  [2,3,4].forEach(function(s) {
    var btn = document.getElementById("sz-" + s);
    if (btn) { btn.style.background = s === n ? "var(--green)" : "transparent"; btn.style.color = s === n ? "var(--gold)" : "var(--muted)"; btn.style.borderColor = s === n ? "var(--green)" : "var(--border)"; }
  });
}

function toggleScrambleMember(pid) {
  var idx = scrambleSelected.indexOf(pid);
  if (idx === -1) {
    if (scrambleSelected.length >= scrambleTeamSize) { Router.toast("Max " + scrambleTeamSize + " for this team"); return; }
    scrambleSelected.push(pid);
  } else {
    scrambleSelected.splice(idx, 1);
  }
  var el = document.getElementById("st-check-" + pid);
  var isIn = scrambleSelected.indexOf(pid) !== -1;
  if (el) {
    el.textContent = isIn ? "Done" : "";
    el.style.background = isIn ? "var(--green)" : "transparent";
    el.style.borderColor = isIn ? "var(--green)" : "var(--border)";
  }
}

function submitCreateTeam() {
  var name = document.getElementById("st-name").value.trim();
  if (!name) { Router.toast("Enter a team name"); return; }
  // Check for duplicate team names
  var existing = PB.getScrambleTeams().find(function(t){ return t.name.toLowerCase() === name.toLowerCase(); });
  if (existing) { Router.toast("A team named '" + name + "' already exists"); return; }
  if (scrambleSelected.length !== scrambleTeamSize) { Router.toast("Select exactly " + scrambleTeamSize + " members"); return; }
  var team = PB.addScrambleTeam({ name: name, members: scrambleSelected.slice(), size: scrambleTeamSize });
  scrambleSelected = [];
  if (team) { syncScrambleTeam(team); Router.toast("Team created!"); Router.go("scramble", { id: team.id }); }
}

function renameScrambleTeam(teamId, _newName) {
  var teams = PB.getScrambleTeams();
  var team = teams.find(function(t) { return t.id === teamId; });
  if (!team) return;
  var myId = currentProfile && (currentProfile.claimedFrom || currentProfile.id);
  if (!currentProfile || (myId !== team.captain && currentProfile.id !== team.captain)) {
    Router.toast("Only the team captain can rename this team");
    return;
  }
  // v8.24.34 — branded pbPrompt (was a native prompt()).
  if (_newName === undefined) {
    pbPrompt({ title: "Rename team", value: team.name, confirmLabel: "Rename" })
      .then(function(n) { if (n !== null) renameScrambleTeam(teamId, n); });
    return;
  }
  var newName = _newName;
  if (!newName || !newName.trim() || newName.trim() === team.name) return;
  newName = newName.trim();
  // Check for duplicate team names
  var dupTeam = teams.find(function(t){ return t.id !== teamId && t.name.toLowerCase() === newName.toLowerCase(); });
  if (dupTeam) { Router.toast("A team named '" + newName + "' already exists"); return; }
  if (!db) { Router.toast("No connection, try again when online"); return; }
  // Firestore-first: write to Firestore, then update local state on success
  db.collection("scrambleTeams").doc(teamId).set({ name: newName }, { merge: true }).then(function() {
    team.name = newName; // update local state only after Firestore confirms
    Router.toast("Team renamed!");
    Router.go("scramble", { id: teamId });
  }).catch(function(err) {
    pbWarn("[renameTeam] failed:", err.message);
    Router.toast("Couldn't save, check permissions");
  });
}

function renderTeamDetail(teamId) {
  var teams = PB.getScrambleTeams();
  var team = teams.find(function(t) { return t.id === teamId; });
  if (!team) { Router.go("scramble"); return; }

  var members = team.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);
  var matches = (team.matches || []).slice();
  // Team rounds come from team.matches[] (team-scoped, set via Log team round /
  // finishScrambleLive). We do NOT merge the rounds collection by single-member
  // overlap — that bled rounds across teams sharing a member.
  // v8.25.6 — but the FOUNDING scramble (e.g. the Smoky Mountain Open) was
  // logged as individual scramble round docs per player, never as a team match,
  // so the team showed "No rounds played yet" despite having played (Founder:
  // "teams are showing no rounds ... it WAS displaying properly"). Derive those
  // rounds safely: a scramble round counts for THIS team only when EVERY member
  // has a scramble round at the same course+date — that uniquely identifies a
  // real team scramble and can't bleed from a team that merely shares one member.
  _deriveTeamScrambleRounds(team).forEach(function(dr) {
    if (!matches.some(function(m){ return m.course === dr.course && m.date === dr.date; })) matches.push(dr);
  });
  var captain = team.captain ? (PB.getPlayer(team.captain) || {name:team.captain}) : null;
  var scored = matches.filter(function(m){return m.score;}).sort(function(a,b){return a.score-b.score;});
  var coursePar = 72;

  var _myId = currentProfile && (currentProfile.claimedFrom || currentProfile.id);
  var isCaptainHere = currentProfile && team.captain && (_myId === team.captain || currentProfile.id === team.captain);
  var renameBtn = isCaptainHere ? '<button class="btn-sm outline" style="font-size:10px" onclick="renameScrambleTeam(\'' + team.id + '\')">Rename</button>' : '';
  var h = '<div class="sh"><h2>' + escHtml(team.name) + '</h2><div style="display:flex;gap:6px">' + renameBtn + '<button class="back" onclick="Router.back(\'scramble\')">← Back</button></div></div>';

  // Team header — all avatars gold border, captain gets label
  h += '<div class="pd-banner" style="padding-bottom:16px">';
  h += '<div style="display:flex;justify-content:center;gap:12px;margin-bottom:12px">';
  members.forEach(function(p) {
    var isCaptain = captain && (p.id === team.captain);
    h += '<div style="text-align:center">';
    h += scrambleAvatar(p, 60, true);
    h += '<div style="font-size:12px;font-weight:600;margin-top:4px">' + renderUsername(p, '', false) + '</div>';
    if (isCaptain) h += '<div style="font-size:8px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700">Captain</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div style="font-size:13px;color:var(--muted)">' + team.size + '-man scramble</div></div>';

  // Action buttons — log round + challenge for any team with same-size opponents
  var allTeams = PB.getScrambleTeams();
  var sameSize = allTeams.filter(function(t){ return t.id !== team.id && (t.size||t.members.length) === (team.size||members.length); });
  h += '<div style="padding:0 16px 16px;display:flex;gap:8px">';
  h += '<button class="btn full green" style="flex:1" onclick="Router.go(\'scramble\',{teamround:\'' + team.id + '\'})">Log team round</button>';
  if (sameSize.length > 0) {
    h += '<button class="btn full outline" style="flex:1" onclick="Router.go(\'scramble\',{match:true,challenger:\'' + team.id + '\'})">Challenge a team</button>';
  }
  h += '</div>';
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Best rounds</span></div>';
  if (scored.length) {
    scored.slice(0,3).forEach(function(m, idx) {
      var medal = idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--medal-silver)' : 'var(--medal-bronze)';
      var diff = m.score - coursePar;
      h += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="display:flex;align-items:center;gap:10px">';
      h += '<div style="width:28px;height:28px;border-radius:50%;background:' + medal + '15;border:1.5px solid ' + medal + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:' + medal + '">' + (idx+1) + '</div>';
      h += '<div><div style="font-size:13px;font-weight:600;color:var(--cream)">' + m.score + '</div>';
      h += '<div style="font-size:10px;color:var(--muted)">' + escHtml(m.course || "Unknown course") + (m.date ? ' · ' + m.date : '') + '</div></div></div>';
      h += '<div style="display:flex;align-items:center;gap:8px">';
      h += '<div style="font-size:14px;font-weight:700;color:' + (diff <= 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (diff > 0 ? '+' : '') + diff + '</div>';
      var safeTeam = escHtml(team.name || '');
      var safeCourse = escHtml(m.course || '');
      var safeFormat = escHtml(m.format || 'Scramble');
      h += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px" onclick="showScrambleShareCard(\'' + safeTeam.replace(/'/g,"\\'") + '\',' + m.score + ',\'' + safeCourse.replace(/'/g,"\\'") + '\',\'' + safeFormat.replace(/'/g,"\\'") + '\')">Share</button>';
      h += '</div></div></div>';
    });
  } else {
    h += '<div class="card"><div class="empty"><div class="empty-text">No rounds played yet</div></div></div>';
  }
  h += '</div>';

  // Team stats — best, worst, avg, courses played, team handicap
  var coursesPlayed = {};
  matches.forEach(function(m){ if (m.course) coursesPlayed[m.course] = 1; });
  var uniqueCourses = Object.keys(coursesPlayed).length;
  var favCourse = Object.keys(coursesPlayed).sort(function(a,b){
    return matches.filter(function(m){return m.course===b;}).length - matches.filter(function(m){return m.course===a;}).length;
  })[0] || null;
  var bestScore = scored.length ? scored[0].score : null;
  var worstScore = scored.length ? scored[scored.length-1].score : null;
  var avgScore = scored.length ? Math.round(scored.reduce(function(a,m){return a+m.score;},0) / scored.length) : null;

  // Team handicap: best 3 differentials × 0.96 (same concept as individual GHIN)
  var teamHdcp = null;
  if (scored.length >= 3) {
    var diffs = scored.map(function(m){ return (113/113) * (m.score - coursePar); });
    var best3 = diffs.slice(0,3);
    teamHdcp = Math.round((best3.reduce(function(a,b){return a+b;},0) / best3.length) * 0.96 * 10) / 10;
  }

  h += '<div class="section"><div class="sec-head"><span class="sec-title">Team stats</span></div>';
  // v8.24.74 — a team with zero rounds used to render a 7-row table of every
  // value as "—", which reads as broken. Show one path-forward line instead
  // (P10 actionable-empty-state); the full table appears once they've played.
  var h2hMatches = matches.filter(function(m){ return m.result === "win" || m.result === "loss" || m.result === "tie"; });
  if (!matches.length) {
    h += '<div class="hof-card"><div class="empty"><div class="empty-text">No stats yet — log this team\'s first round to start tracking best score, handicap, and match record.</div></div></div></div>';
  } else {
    h += '<div class="hof-card">';
    h += '<div class="hof-row"><span class="hof-label">Rounds played</span><span class="hof-val">' + matches.length + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Courses played</span><span class="hof-val">' + (uniqueCourses || '—') + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Favorite course</span><span class="hof-val">' + escHtml(favCourse || '—') + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Best score</span><span class="hof-val"' + (bestScore ? ' style="color:var(--birdie)"' : '') + '>' + (bestScore || '—') + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Worst score</span><span class="hof-val"' + (worstScore && worstScore !== bestScore ? ' style="color:var(--muted)"' : '') + '>' + (worstScore && worstScore !== bestScore ? worstScore : '—') + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Average score</span><span class="hof-val">' + (avgScore || '—') + '</span></div>';
    h += '<div class="hof-row"><span class="hof-label">Team handicap</span><span class="hof-val"' + (teamHdcp !== null ? ' style="color:var(--gold)"' : '') + '>' + (teamHdcp !== null ? teamHdcp : '—') + '</span></div>';
    // W-L record from matches
    var teamWins = h2hMatches.filter(function(m){ return m.result === "win"; }).length;
    var teamLosses = h2hMatches.filter(function(m){ return m.result === "loss"; }).length;
    var teamTies = h2hMatches.filter(function(m){ return m.result === "tie"; }).length;
    h += '<div class="hof-row"><span class="hof-label">Match record (W-L' + (teamTies ? '-T' : '') + ')</span><span class="hof-val" style="color:var(--gold);font-weight:700">' + (h2hMatches.length ? teamWins + '-' + teamLosses + (teamTies ? '-' + teamTies : '') : '—') + '</span></div>';
    h += '</div></div>';
  }

  // Match history — vs other teams
  if (h2hMatches.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Match history</span></div>';
    h2hMatches.slice().reverse().forEach(function(m) {
      var resultColor = m.result === "win" ? "var(--birdie)" : m.result === "loss" ? "var(--red)" : "var(--gold)";
      var resultLabel = m.result === "win" ? "WIN" : m.result === "loss" ? "LOSS" : "TIE";
      h += '<div class="card" style="margin-bottom:6px"><div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">vs ' + escHtml(m.opponent || "Unknown") + '</div>';
      h += '<div style="font-size:10px;color:var(--muted)">' + escHtml(m.course || "") + ' · ' + (m.date || "") + '</div></div>';
      h += '<div style="text-align:right"><div style="font-size:14px;font-weight:700;color:var(--cream)">' + m.score + ' - ' + (m.opponentScore || '?') + '</div>';
      h += '<div style="font-size:10px;font-weight:700;color:' + resultColor + '">' + resultLabel + '</div></div>';
      h += '</div></div>';
    });
    h += '</div>';
  }

  // Round history — color-coded +/- vs par
  if (matches.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Round history</span></div>';
    matches.slice().reverse().forEach(function(m) {
      var diff = m.score ? m.score - coursePar : null;
      // Community-safe (scramble.js:67-69 rule): under/at par reads quiet
      // green, over par is neutral muted — never alarm-red on a member's score.
      var diffColor = diff === null ? 'var(--muted)' : diff <= 0 ? 'var(--birdie)' : 'var(--muted)';
      var diffStr = diff === null ? '—' : (diff > 0 ? '+' : '') + diff;
      h += '<div class="card" style="margin-bottom:6px"><div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(m.course || "Unknown") + '</div>';
      h += '<div style="font-size:10px;color:var(--muted)">' + (m.date || "") + '</div></div>';
      h += '<div style="text-align:right">';
      if (m.score) h += '<div style="font-size:18px;font-weight:700;color:var(--gold)">' + m.score + '</div>';
      h += '<div style="font-size:11px;font-weight:600;color:' + diffColor + '">' + diffStr + '</div>';
      h += '</div></div></div>';
    });
    h += '</div>';
  }

  document.querySelector('[data-page="scramble"]').innerHTML = h;
}

function renderLogMatch(challengerId) {
  var teams = PB.getScrambleTeams();
  var challenger = challengerId ? teams.find(function(t){ return t.id === challengerId; }) : null;
  var teamSize = challenger ? (challenger.size || challenger.members.length) : 0;
  
  // Filter to same-size teams if challenger specified
  var availableTeams = teamSize ? teams.filter(function(t){ return (t.size||t.members.length) === teamSize; }) : teams;
  var opponentTeams = teamSize ? availableTeams.filter(function(t){ return t.id !== challengerId; }) : teams;
  
  if (availableTeams.length < 2) { Router.toast("Need at least 2 teams of the same size"); Router.go("scramble"); return; }

  var h = '<div class="sh"><h2>' + (challenger ? challenger.name + ' vs ...' : 'Log match') + '</h2><button class="back" onclick="Router.back(\'scramble\')">← Back</button></div>';

  h += '<div class="form-section"><div class="form-title">' + (teamSize ? teamSize + '-man scramble match' : 'Match details') + '</div>';

  h += '<div class="ff"><label class="ff-label">Team 1</label><select class="ff-input" id="lm-team1" onchange="updateMatchTeam2Options()">';
  availableTeams.forEach(function(t) { h += '<option value="' + t.id + '"' + (challenger && t.id === challengerId ? ' selected' : '') + '>' + t.name + ' (' + (t.size||t.members.length) + '-man)</option>'; });
  h += '</select></div>';

  h += '<div class="ff"><label class="ff-label">Team 2</label><select class="ff-input" id="lm-team2">';
  var defaultOpp = opponentTeams.length ? opponentTeams[0] : null;
  opponentTeams.forEach(function(t, i) { h += '<option value="' + t.id + '"' + (i === 0 ? ' selected' : '') + '>' + t.name + '</option>'; });
  h += '</select></div>';

  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="lm-course" placeholder="Search courses..." autocomplete="off" oninput="showRoundCourseSearch(this)"><div id="search-round-course" class="search-results"></div></div>';

  h += '<div class="ff-row">';
  h += '<div class="ff"><label class="ff-label">Team 1 score</label><input type="number" inputmode="numeric" class="ff-input" id="lm-score1" placeholder="72"></div>';
  h += '<div class="ff"><label class="ff-label">Team 2 score</label><input type="number" inputmode="numeric" class="ff-input" id="lm-score2" placeholder="72"></div>';
  h += '</div>';

  h += formField("Date", "lm-date", localDateStr(), "date");

  h += '<button class="btn full green" onclick="submitLogMatch()">Log match result</button></div>';

  // Past matches between these teams
  if (challenger && defaultOpp) {
    var pastMatches = (challenger.matches || []).filter(function(m){ return m.opponent === defaultOpp.name; });
    if (pastMatches.length) {
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Match history vs ' + escHtml(defaultOpp.name) + '</span></div>';
      pastMatches.slice().reverse().forEach(function(m) {
        var resultColor = m.result === "win" ? "var(--birdie)" : m.result === "loss" ? "var(--red)" : "var(--gold)";
        var resultLabel = m.result === "win" ? "W" : m.result === "loss" ? "L" : "T";
        h += '<div class="card" style="margin-bottom:4px"><div style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center;font-size:11px">';
        h += '<div><span style="color:var(--cream);font-weight:600">' + escHtml(m.course || "—") + '</span><span style="color:var(--muted);margin-left:6px">' + (m.date || "") + '</span></div>';
        h += '<div style="display:flex;align-items:center;gap:8px"><span style="color:var(--cream)">' + m.score + ' - ' + m.opponentScore + '</span><span style="font-weight:700;color:' + resultColor + ';width:16px;text-align:center">' + resultLabel + '</span></div>';
        h += '</div></div>';
      });
      h += '</div>';
    }
  }

  document.querySelector('[data-page="scramble"]').innerHTML = h;
}

function updateMatchTeam2Options() {
  var t1id = document.getElementById("lm-team1").value;
  var teams = PB.getScrambleTeams();
  var t1 = teams.find(function(t){ return t.id === t1id; });
  var size = t1 ? (t1.size || t1.members.length) : 0;
  var sel = document.getElementById("lm-team2");
  if (!sel) return;
  sel.innerHTML = "";
  teams.filter(function(t){ return t.id !== t1id && (t.size||t.members.length) === size; }).forEach(function(t) {
    var opt = document.createElement("option");
    opt.value = t.id; opt.textContent = t.name;
    sel.appendChild(opt);
  });
}

function submitLogMatch() {
  var t1id = document.getElementById("lm-team1").value;
  var t2id = document.getElementById("lm-team2").value;
  if (t1id === t2id) { Router.toast("Pick two different teams"); return; }
  var course = document.getElementById("lm-course").value;
  var score1 = parseInt(document.getElementById("lm-score1").value);
  var score2 = parseInt(document.getElementById("lm-score2").value);
  var date = document.getElementById("lm-date").value;
  if (!score1 || !score2) { Router.toast("Enter both scores"); return; }

  var teams = PB.getScrambleTeams();
  var t1 = teams.find(function(t) { return t.id === t1id; });
  var t2 = teams.find(function(t) { return t.id === t2id; });

  // Team 1 match record
  PB.addScrambleMatch(t1id, {
    opponent: t2.name,
    course: course,
    score: score1,
    opponentScore: score2,
    result: score1 < score2 ? "win" : score1 > score2 ? "loss" : "tie",
    date: date
  });

  // Team 2 match record
  PB.addScrambleMatch(t2id, {
    opponent: t1.name,
    course: course,
    score: score2,
    opponentScore: score1,
    result: score2 < score1 ? "win" : score2 > score1 ? "loss" : "tie",
    date: date
  });

  Router.toast("Match logged! " + (score1 < score2 ? t1.name + " wins!" : score2 < score1 ? t2.name + " wins!" : "Tie!"));
  Router.go("scramble");
}

// ---- Log a team round (no opponent required) ----
function renderLogTeamRound(teamId) {
  var teams = PB.getScrambleTeams();
  var team = teams.find(function(t){ return t.id === teamId; });
  if (!team) { Router.go("scramble"); return; }

  var h = '<div class="sh"><h2>Log team round</h2><button class="back" onclick="Router.go(\'scramble\',{id:\'' + teamId + '\'})">← Back</button></div>';
  h += '<div class="form-section">';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:14px">Track a round you played together, no opponent needed. Counts toward your team\'s best score and round history.</div>';
  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="tr-course" placeholder="Start typing..." autocomplete="off" oninput="showRoundCourseSearch(this)"><div id="search-round-course" class="search-results"></div></div>';
  h += '<div class="ff"><label class="ff-label">Team score</label><input type="number" class="ff-input" id="tr-score" placeholder="e.g. 68" min="40" max="120"></div>';
  h += formField("Date", "tr-date", localDateStr(), "date");
  h += '<button class="btn full green" onclick="submitLogTeamRound(\'' + teamId + '\')">Save round</button>';
  h += '</div>';
  document.querySelector('[data-page="scramble"]').innerHTML = h;
}

function submitLogTeamRound(teamId) {
  var course = document.getElementById("tr-course").value.trim();
  var score = parseInt(document.getElementById("tr-score").value);
  var date = document.getElementById("tr-date").value;
  if (!course) { Router.toast("Enter a course"); return; }
  if (!score || score < 40 || score > 120) { Router.toast("Enter a valid score (40–120)"); return; }
  // Log without opponent/result — pure team round for tracking
  PB.addScrambleMatch(teamId, { course: course, score: score, date: date, opponent: null, result: null });
  var team = PB.getScrambleTeams().find(function(t){ return t.id === teamId; });
  syncScrambleTeam(team);
  Router.toast("Round saved!");
  Router.go("scramble", { id: teamId });
}

/* ================================================
   HEAD-TO-HEAD TRACKING
   ================================================ */

// v8.25.6 — derive a team's scramble rounds from members' individual scramble
// round docs, for teams whose play predates the "Log team round" flow (the
// founding SMO scramble). A course|date group counts ONLY when every member is
// present, so it uniquely identifies a true team scramble and never bleeds
// across teams that merely share a member. Returns synthetic match objects
// (result:null — they were rounds played, not head-to-head matches, so they
// never touch the team's W-L record).
function _deriveTeamScrambleRounds(team) {
  var memberIds = (team && team.members) || [];
  if (memberIds.length < 2 || typeof PB === "undefined" || !PB.getRounds) return [];
  var allRounds = PB.getRounds();
  var aliasByMember = memberIds.map(function(id) { return PB.getAllPlayerIds(id); });
  var groups = {};
  memberIds.forEach(function(mid, mi) {
    var aliases = aliasByMember[mi];
    allRounds.forEach(function(r) {
      if (r.format !== "scramble" && r.format !== "scramble4") return;
      if (aliases.indexOf(r.player) === -1) return;
      var key = PB.normCourseName(r.course) + "|" + (r.date || "");
      if (!groups[key]) groups[key] = { course: r.course, date: r.date, score: r.score, format: r.format, present: {} };
      groups[key].present[mi] = true;
      // In a scramble every member logs the same team score; min() is a safe
      // tie-break if a stray differs.
      if (r.score && (!groups[key].score || r.score < groups[key].score)) groups[key].score = r.score;
    });
  });
  var out = [];
  Object.keys(groups).forEach(function(k) {
    var g = groups[k];
    if (Object.keys(g.present).length === memberIds.length) {
      out.push({ course: g.course, date: g.date, score: g.score, format: g.format, result: null });
    }
  });
  return out;
}

function calcH2H(pid1, pid2) {
  var rounds = PB.getRounds();
  var p1wins = 0, p2wins = 0, ties = 0;
  var counted = {}; // dedup key: course+date

  // Resolve all possible IDs for each player (Firebase UID + seed ID + claimedFrom)
  function resolveIds(pid) {
    var ids = [pid];
    var p = PB.getPlayer(pid);
    if (p && p.claimedFrom && ids.indexOf(p.claimedFrom) === -1) ids.push(p.claimedFrom);
    // Check if this pid IS a claimedFrom for someone else
    PB.getPlayers().forEach(function(pl) {
      if (pl.claimedFrom === pid && ids.indexOf(pl.id) === -1) ids.push(pl.id);
    });
    // Check Firebase member cache
    if (typeof fbMemberCache !== "undefined") {
      Object.keys(fbMemberCache).forEach(function(k) {
        var m = fbMemberCache[k];
        if ((m.claimedFrom === pid || m.id === pid) && ids.indexOf(k) === -1) ids.push(k);
        if (k === pid && m.claimedFrom && ids.indexOf(m.claimedFrom) === -1) ids.push(m.claimedFrom);
      });
    }
    return ids;
  }

  var p1ids = resolveIds(pid1);
  var p2ids = resolveIds(pid2);

  // 1) Regular rounds — same course, same date (individual only, no scramble)
  var p1rounds = rounds.filter(function(r) { return p1ids.indexOf(r.player) !== -1 && r.format !== "scramble" && r.format !== "scramble4"; });
  var p2rounds = rounds.filter(function(r) { return p2ids.indexOf(r.player) !== -1 && r.format !== "scramble" && r.format !== "scramble4"; });

  var countedCourse = {}; // normCourse already settled via standalone round docs
  p1rounds.forEach(function(r1) {
    var match = p2rounds.find(function(r2) {
      return r2.date === r1.date && PB.normCourseName(r2.course) === PB.normCourseName(r1.course);
    });
    if (match) {
      var nc = PB.normCourseName(r1.course);
      var key = nc + "|" + r1.date;
      if (counted[key]) return;
      counted[key] = true;
      countedCourse[nc] = true;
      if (r1.score < match.score) p1wins++;
      else if (r1.score > match.score) p2wins++;
      else ties++;
    }
  });

  // 2) Trip scorecard rounds — both players scored on the same trip course (exclude scramble)
  var trips = PB.getTrips();
  trips.forEach(function(tr) {
    if (!tr.courses) return;
    tr.courses.forEach(function(crs) {
      if (crs.s) return; // Skip scramble courses
      // v8.25.5 — a course already settled by a standalone round doc above is
      // the SAME game as its trip scorecard; counting both double-counts the
      // head-to-head (the trip key uses a day label like "Friday PM" while the
      // round doc uses an ISO date, so the course|date keys never collide).
      if (countedCourse[PB.normCourseName(crs.n || crs.key)]) return;
      // Try all possible IDs for each player
      var s1 = null, s2 = null;
      p1ids.forEach(function(id) { if (!s1 || !s1.length) s1 = PB.getScores(tr.id, crs.key, id); });
      p2ids.forEach(function(id) { if (!s2 || !s2.length) s2 = PB.getScores(tr.id, crs.key, id); });
      if (!s1 || !s1.length || !s2 || !s2.length) return;
      var t1 = 0, t2 = 0, h1 = 0, h2 = 0;
      s1.forEach(function(v) { if (v !== "" && v !== null && v !== undefined) { t1 += parseInt(v) || 0; h1++; } });
      s2.forEach(function(v) { if (v !== "" && v !== null && v !== undefined) { t2 += parseInt(v) || 0; h2++; } });
      if (h1 === 0 || h2 === 0 || h1 !== h2) return;
      var key = PB.normCourseName(crs.n || crs.key) + "|" + (crs.d || tr.startDate || "");
      if (counted[key]) return;
      counted[key] = true;
      if (t1 < t2) p1wins++;
      else if (t1 > t2) p2wins++;
      else ties++;
    });
  });

  return { p1wins: p1wins, p2wins: p2wins, ties: ties };
}

