/* ================================================
   PAGE: RECORDS
   ================================================ */
Router.register("records", function() {
  var rounds = PB.getRounds().filter(function(r){return r.visibility !== "private";});
  var players = PB.getPlayers();
  var rec = PB.getRecords();

  // v8.25.60 — editorial masthead (matches Members/Standings/Scramble) replacing
  // the legacy .sh header, with the single most impressive live record as a deck
  // so the page leads with a real number, not a generic title (WF2 audit).
  var _mFull = rounds.filter(function(r){ return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4" && r.score; });
  var _mBest = _mFull.length ? _mFull.reduce(function(a, b){ return a.score < b.score ? a : b; }) : null;
  var h = '<div class="roster-masthead"><div class="roster-eyebrow">THE RECORD BOOK</div><h1 class="roster-headline">The numbers.</h1>';
  if (_mBest) h += '<p style="font-family:var(--font-mono);font-size:12px;color:var(--cb-mute);margin:10px 0 0;letter-spacing:.3px">Best round · <b style="color:var(--cb-ink)">' + _mBest.score + '</b> by ' + escHtml(_mBest.playerName) + (_mBest.course ? ' at ' + escHtml(_mBest.course) : '') + '</p>';
  h += '</div>';

  // v8.25.124 — SIGNATURE RECORDS marquee: the league's greatest-hits numbers as
  // premium visual cards leading the page (was a row of mostly-empty CTA stat
  // tiles + a wall of collapsed accordions — read flat/empty per Founder). Real
  // values lead; empty records show a "be the first" prompt, never a bare dash.
  var _nineAll = rounds.filter(function(r){ return r.holesPlayed && r.holesPlayed <= 9 && r.format !== "scramble" && r.format !== "scramble4" && r.score; });
  var _bestNine = _nineAll.length ? _nineAll.reduce(function(a, b){ return a.score < b.score ? a : b; }) : null;
  var _aceN = (rec.holeInOnes && rec.holeInOnes.length) || 0;
  function _sigCard(eyebrow, big, detail, route, accent) {
    var has = big != null && big !== "";
    var c = '<div class="rec-sig' + (has ? '' : ' rec-sig--empty') + (accent ? ' rec-sig--hero' : '') + '"' + (route ? ' onclick="Router.go(\'' + route + '\')" style="cursor:pointer"' : '') + '>';
    c += '<div class="rec-sig__eyebrow">' + eyebrow + '</div>';
    c += '<div class="rec-sig__big">' + (has ? big : '—') + '</div>';
    c += '<div class="rec-sig__detail">' + (detail || (has ? '' : 'Be the first')) + '</div>';
    c += '</div>';
    return c;
  }
  h += '<div class="rec-sig-grid">';
  h += _sigCard("Lowest 18", _mBest ? _mBest.score : "", _mBest ? escHtml(_mBest.playerName) : "Log an 18-hole round", null, true);
  h += _sigCard("Lowest 9", _bestNine ? _bestNine.score : "", _bestNine ? escHtml(_bestNine.playerName) : "Log a 9-hole round", null, false);
  h += _sigCard("Longest drive", rec.longestDrive ? (rec.longestDrive.distance + "<span class='rec-sig__unit'>yds</span>") : "", rec.longestDrive ? escHtml(rec.longestDrive.by) : "Tap to log it", rec.longestDrive ? null : null, false);
  h += _sigCard("Hole-in-ones", _aceN ? _aceN : "", _aceN ? "View the Ace Wall →" : "The wall awaits", "aces", false);
  h += '</div>';

  // Season standings card (prominent at top)
  var year = new Date().getFullYear();
  var month = new Date().getMonth();
  var inSeason = month >= 2 && month <= 8;
  h += '<div class="card" onclick="Router.go(\'standings\')" style="cursor:pointer;' + (inSeason ? 'border-color:rgba(var(--gold-rgb),.2);background:linear-gradient(135deg,var(--grad-card),var(--card))' : '') + '">';
  h += '<div style="padding:16px;display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--gold)">' + year + ' Season Standings</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:3px;letter-spacing:.3px">March – September · ' + (inSeason ? 'In season' : 'Offseason') + '</div></div>';
  h += '<div class="m-arrow" style="color:var(--gold);font-size:20px">›</div></div></div>';

  // Navigation grid — 2 columns
  // v8.22+ (design-pass 2026-05-22): added comparative caption beneath each
  // numeral, brass for non-zero + mute for zero. Per AMD-026 Actionable
  // Surfacing: zero-counts get context copy explaining WHY zero + what
  // populates them.
  h += '<div class="qlinks" style="grid-template-columns:1fr 1fr;margin-bottom:12px">';

  function statCard(route, value, label, zeroHint, populatedHint) {
    var v = value || 0;
    var hasCount = v > 0;
    var cap = hasCount ? populatedHint : zeroHint;
    // v8.25.20 (records critique) — zero/CTA tiles use an AA-safe ink-faint
    // caption (was --muted; ink-faint reads as deliberate prompt copy, AA on
    // the card ground) so a count vs a prompt is legible. Live-count tiles keep
    // the brass populated-hint.
    var capColor = hasCount ? "var(--gold)" : "var(--cb-ink-faint)";
    // v8.25.20 — visual distinction between live-count tiles and zero/CTA
    // prompt tiles. A count tile is a solid filled card; a prompt tile drops the
    // fill + shadow and gets a quieter dashed brass hairline, so a tap-to-act
    // prompt reads at a glance without competing with a real number (AMD-026
    // actionable surfacing).
    // v8.25.162 (records contrast/P10 fix) — empty/zero tiles drop the ad-hoc
    // dashed-transparent override (read as a BROKEN card, not a prompt) for the
    // canonical .pb-card--recessed inset-well material via the page-scoped
    // .rec-stat--empty hook. Live-count tiles keep the solid .pb-card filled stock.
    var tileCls = hasCount ? 'pb-card rec-stat' : 'pb-card pb-card--recessed rec-stat rec-stat--empty';
    var s = '<div class="' + tileCls + '" onclick="Router.go(\'' + route + '\')" style="cursor:pointer;margin-bottom:0"><div style="padding:14px 12px;text-align:center">';
    // v8.24.67 — zero numeral muted (brass reserved for real values per the
    // brass-role rule; a gold "0" reads as a broken stat, P9/P10 dead-state).
    // v8.25.162 — empty-tile zero numeral was --cb-mute-3 (#C9C5BD ~1.2:1 on the
    // canvas — the pale tan-on-tan that read as a broken stat). Promoted to
    // --cb-brass-deep (AA on the recessed well) so an honest zero reads as a real,
    // not-yet-earned record. Live counts keep brass --gold per the brass-role rule.
    s += '<div style="font-size:20px;font-family:var(--font-display);font-weight:700;color:' + (hasCount ? 'var(--gold)' : 'var(--cb-brass-deep)') + '">' + v + '</div>';
    // Label stays AA (--cb-mute) on both tile kinds; on a prompt tile it reads
    // as the thing-being-prompted, on a count tile as the stat name.
    s += '<div style="font-size:10px;color:var(--cb-mute);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">' + label + '</div>';
    if (cap) {
      // v8.25.162 (P10) — on an empty tile the caption IS the call-to-action, so it
      // renders as a brass-underlined affordance (.rec-stat__cta) in --cb-brass-deep
      // (AA on the recessed well) instead of dead --cb-ink-faint label text, making
      // 'Tap to start one' / 'Tap to log the first' / 'Form a scramble team' clearly
      // tappable. Live-count tiles keep the quiet brass populated-hint inline.
      if (hasCount) {
        s += '<div style="font-size:9px;color:' + capColor + ';margin-top:4px;letter-spacing:0.4px;line-height:1.3">' + cap + '</div>';
      } else {
        s += '<div class="rec-stat__cta">' + cap + '</div>';
      }
    }
    s += '</div></div>';
    return s;
  }

  // Challenges
  var challengeCount = 0;
  try { PB.getPlayers().forEach(function(p){challengeCount += PB.getChallenges(p.id).filter(function(c){return c.status==="pending"}).length}); } catch(e) {}
  h += statCard("challenges", challengeCount, "Challenges", "Tap to start one", "Pending");

  // Ace Wall
  var aceCount = (rec.holeInOnes && rec.holeInOnes.length) || 0;
  h += statCard("aces", aceCount, "Aces", "Tap to log the first", "Immortalized");

  // Teams
  var teamCount = PB.getScrambleTeams().length;
  h += statCard("scramble", teamCount, "Teams", "Form a scramble team", "Active");

  // Courses — distinct course names across the league's public rounds, not the
  // directory count. A member who logs rounds without curating the course
  // directory still played those courses, so deriving from `rounds` keeps the
  // value truthful (matches the distinct-course pattern in data.js/scramble.js).
  var _coursesSeen = {};
  rounds.forEach(function(r){ if (r.course) _coursesSeen[r.course] = 1; });
  var coursesPlayed = Object.keys(_coursesSeen).length;
  h += statCard("courses", coursesPlayed, "Courses played", "Log a round to start", "In rotation");

  h += '</div>';

  // Stroke-based 24x24 brass glyphs, one per section — gives each otherwise
  // identical accordion card a semantic signifier at a glance (no emoji).
  function recIcon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" style="flex-shrink:0;color:var(--gold);opacity:.85">' + path + '</svg>';
  }
  var REC_ICONS = {
    // trophy — event champions
    champions: recIcon('<path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v1a4 4 0 0 0 3 3.87"/><path d="M18 5h3v1a4 4 0 0 1-3 3.87"/><path d="M9 18h6"/><path d="M12 13v5"/>'),
    // target — all-time records
    alltime: recIcon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>'),
    // pencil — log a record
    logrecord: recIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    // swords — head-to-head
    h2h: recIcon('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="m11 19-6-6"/><path d="m8 16-4 4"/><path d="M5 21l-2-2"/>'),
    // flag — scramble teams
    scramble: recIcon('<path d="M4 21V4"/><path d="M4 4h11l-1.5 3L15 10H4"/>'),
    // bar chart — best scores by course
    courses: recIcon('<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>'),
    // gauge — handicap leaderboard
    hcap: recIcon('<path d="M12 14a4 4 0 0 0-3.46 6"/><path d="M15.46 20A4 4 0 0 0 12 14"/><path d="m13.5 12.5 2-2"/><path d="M5 18a9 9 0 1 1 14 0"/>'),
    // users — member averages
    avg: recIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')
  };

  // Helper for collapsible hof card.
  //  - `subtitle` (optional) surfaces a real value inline under the title so the
  //    section conveys data before any tap (P10).
  //  - `tier === "headline"` gives the two marquee record cards (champions,
  //    all-time) a subtle brass left-rail + slightly heavier title, creating a
  //    two-tier weight ladder instead of a flat identical stack. Done with an
  //    inline override on the page's own element (no shared-CSS edit).
  function hofCard(id, title, content, subtitle, tier) {
    var icon = REC_ICONS[id] || '';
    var isHeadline = tier === "headline";
    var titleSize = isHeadline ? "font-size:var(--text-md);font-weight:800" : "";
    var titleBlock = '<span style="display:flex;align-items:center;gap:8px;min-width:0">' + icon + '<span style="display:flex;flex-direction:column;min-width:0">' + '<span style="' + titleSize + '">' + title + '</span>' +
      (subtitle ? '<span style="font-size:11px;font-weight:500;color:var(--cb-mute);margin-top:2px;letter-spacing:.1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + subtitle + '</span>' : '') +
      '</span></span>';
    var cardStyle = isHeadline ? ' style="border-left:2px solid rgba(var(--gold-rgb),.45);padding-left:calc(var(--sp-4) - 2px)"' : '';
    return '<div class="hof-card"' + cardStyle + '><div class="hof-title" onclick="toggleSection(\'rec-' + id + '\')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px"><span style="min-width:0;display:flex">' + titleBlock + '</span><span id="rec-' + id + '-toggle" style="font-size:12px;color:var(--muted);display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s;color:var(--muted);' + (isHeadline ? 'transform:rotate(90deg)' : '') + '"><path d="M9 18l6-6-6-6"/></svg></span></div><div id="rec-' + id + '" style="display:' + (isHeadline ? 'block' : 'none') + '">' + content + '</div></div>';
  }

  // 1. Event Champions — collapsible hofCard matching all other sections
  var trips = PB.getTrips();
  if (trips.length) {
    var champContent = '';
    trips.forEach(function(t) {
      var champ = t.champion ? PB.getPlayer(t.champion) : null;
      var champName = champ ? (champ.username || champ.name) : "TBD";
      var isChamp = !!t.champion;
      champContent += '<div class="hof-row" style="padding:6px 0;' + (isChamp ? 'border-bottom:1px solid rgba(var(--gold-rgb),.08)' : '') + '">';
      champContent += '<div><span class="hof-label">' + escHtml(t.name) + '</span>';
      champContent += '<div style="font-size:9px;color:var(--muted2);margin-top:1px">' + escHtml(t.dates||"") + ' · ' + escHtml(t.location||"") + '</div></div>';
      champContent += '<span class="hof-val" style="color:' + (isChamp ? 'var(--gold)' : 'var(--muted)') + '">' + escHtml(champName) + '</span>';
      champContent += '</div>';
    });
    // Surface the most recent crowned champion inline (P10); falls back to the
    // count of events when none is crowned yet. Names are escaped (XSS).
    var champPreview = '';
    var crowned = trips.filter(function(t){ return t.champion; });
    if (crowned.length) {
      var latest = crowned[crowned.length - 1];
      var latestChamp = PB.getPlayer(latest.champion);
      var latestName = latestChamp ? (latestChamp.username || latestChamp.name) : "";
      if (latestName) champPreview = escHtml(latestName) + ' · ' + escHtml(latest.name);
    }
    h += hofCard("champions", "Event champions", champContent, champPreview, "headline");
  }

  // 2. All-time records — with inline Log a record
  var recContent = '';
  if (rounds.length) {
    var full18 = rounds.filter(function(r){return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";});
    var nine = rounds.filter(function(r){return r.holesPlayed && r.holesPlayed <= 9 && r.format !== "scramble" && r.format !== "scramble4";});
    var best18 = full18.length ? full18.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
    var best9 = nine.length ? nine.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
    recContent += '<div style="display:flex;gap:8px;margin-bottom:6px">';
    recContent += '<div style="flex:1;background:var(--bg3);border-radius:var(--radius);padding:10px 12px;text-align:center">';
    recContent += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Best 18 holes</div>';
    if (best18) {
      recContent += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold)">' + best18.score + '</div>';
      recContent += '<div style="font-size:10px;color:var(--cream);margin-top:2px">' + escHtml(best18.playerName) + '</div>';
      recContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(best18.course) + '</div>';
    } else {
      recContent += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--muted2)">—</div>';
    }
    recContent += '</div>';
    recContent += '<div style="flex:1;background:var(--bg3);border-radius:var(--radius);padding:10px 12px;text-align:center">';
    recContent += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Best 9 holes</div>';
    if (best9) {
      var nineLabel = best9.holesMode === "back9" ? "Back 9" : "Front 9";
      recContent += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold)">' + best9.score + '</div>';
      recContent += '<div style="font-size:10px;color:var(--cream);margin-top:2px">' + escHtml(best9.playerName) + '</div>';
      recContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(best9.course) + ' · ' + nineLabel + '</div>';
    } else {
      recContent += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--muted2)">—</div>';
    }
    recContent += '</div></div>';
  } else {
    recContent += '<div class="hof-row"><span class="hof-label">Best round</span><span class="hof-val">—</span></div>';
  }
  var rec = PB.getRecords();
  recContent += '<div class="hof-row"><span class="hof-label">Longest drive</span><span class="hof-val">' + (rec.longestDrive ? rec.longestDrive.distance + ' yds, ' + rec.longestDrive.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Longest putt</span><span class="hof-val">' + (rec.longestPutt ? rec.longestPutt.distance + ' ft, ' + rec.longestPutt.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Longest hole out</span><span class="hof-val">' + (rec.longestHoleOut ? rec.longestHoleOut.distance + ' yds, ' + rec.longestHoleOut.by : "—") + '</span></div>';
  recContent += '<div class="hof-row"><span class="hof-label">Chip-ins</span><span class="hof-val">' + (rec.chipIns || 0) + '</span></div>';
  recContent += '<div class="hof-row" onclick="Router.go(\'aces\')" style="cursor:pointer"><span class="hof-label">Hole-in-ones</span><span class="hof-val" style="color:var(--gold)">' + (rec.holeInOnes && rec.holeInOnes.length ? rec.holeInOnes.length + ' → View Ace Wall' : 'View Ace Wall →') + '</span></div>';
  // Inline the top record under the title so the section shows real data before
  // any tap (P10). best18/best9 are var-hoisted from the block above; guard for
  // the no-rounds case. Names are escaped (XSS) since they originate from data.
  var alltimePreview = '';
  if (best18) {
    alltimePreview = 'Best 18: ' + best18.score + ' · ' + escHtml(best18.playerName);
  } else if (best9) {
    alltimePreview = 'Best 9: ' + best9.score + ' · ' + escHtml(best9.playerName);
  }
  h += hofCard("alltime", "All-time records", recContent, alltimePreview, "headline");

  // Log record — hofCard style, consistent with all other sections
  var logContent = '<div style="padding:4px 0">';
  logContent += '<div class="ff"><label class="ff-label">Record type</label><select class="ff-input" id="rec-type"><option value="longestDrive">Longest drive</option><option value="longestPutt">Longest putt</option><option value="longestHoleOut">Longest hole out</option><option value="chipIn">Chip-in</option></select></div>';
  logContent += '<div class="ff"><label class="ff-label">Player</label><select class="ff-input" id="rec-player">';
  var recPlayer = currentUser ? PB.getPlayer(currentUser.uid) : null;
  var recLocal = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name); });
  var recAs = recPlayer || recLocal;
  if (recAs) {
    logContent += '<option value="' + escHtml(recAs.name) + '">' + escHtml(recAs.name) + '</option>';
  } else {
    players.forEach(function(p) { logContent += '<option value="' + escHtml(p.name) + '">' + escHtml(p.name) + '</option>'; });
  }
  logContent += '</select></div>';
  logContent += '<div class="ff"><label class="ff-label">Distance (yds or ft)</label><input class="ff-input" id="rec-distance" type="number" placeholder="e.g. 285"></div>';
  logContent += '<div class="ff"><label class="ff-label">Club used</label><input class="ff-input" id="rec-club" placeholder="e.g. 7 iron"></div>';
  logContent += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="rec-course" placeholder="Course name"></div>';
  logContent += '<button class="btn full green" style="margin-top:4px" onclick="submitRecord()">Save record</button>';
  logContent += '</div>';
  h += hofCard("logrecord", "Log a record", logContent);

  // 3. Head-to-head records
  var h2hContent = '';
  for (var i = 0; i < players.length; i++) {
    for (var j = i + 1; j < players.length; j++) {
      var h2h = calcH2H(players[i].id, players[j].id);
      var total = h2h.p1wins + h2h.p2wins + h2h.ties;
      if (total > 0) {
        var leader = h2h.p1wins > h2h.p2wins ? players[i].name : h2h.p2wins > h2h.p1wins ? players[j].name : "Tied";
        h2hContent += '<div class="hof-row"><span class="hof-label">' + escHtml(players[i].name) + ' vs ' + escHtml(players[j].name) + '</span><span class="hof-val">' + h2h.p1wins + '-' + h2h.p2wins + (h2h.ties ? '-' + h2h.ties + 'T' : '') + '</span></div>';
      }
    }
  }
  if (!h2hContent) h2hContent = '<div class="hof-row"><span class="hof-label">No head-to-head data</span><span class="hof-val">Play same course, same day</span></div>';
  h += hofCard("h2h", "Head-to-head records", h2hContent);

  // 4. Scramble team records
  var teams = PB.getScrambleTeams();
  var scrambleContent = '';
  if (teams.length) {
    // Group by size
    [2,3,4].forEach(function(sz) {
      var sizeTeams = teams.filter(function(t) { return (t.members ? t.members.length : (t.size || 2)) === sz; });
      if (!sizeTeams.length) return;
      scrambleContent += '<div style="font-size:12px;font-weight:700;color:var(--muted);margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px">' + sz + '-man teams</div>';
      var sorted = sizeTeams.slice().sort(function(a, b) {
        var aw = (a.matches || []).filter(function(m) { return m.result === "win"; }).length;
        var bw = (b.matches || []).filter(function(m) { return m.result === "win"; }).length;
        return bw - aw;
      });
      sorted.forEach(function(t) {
        // v8.25.9 — combine team.matches with derived founding-scramble rounds
        // so a team that played but logged no H2H match still shows its score
        // here, not a blank 0-0 (Founder: scramble teams must track in league).
        var combined = (t.matches || []).slice();
        if (typeof _deriveTeamScrambleRounds === "function") {
          _deriveTeamScrambleRounds(t).forEach(function(dr){ if (!combined.some(function(m){return m.course===dr.course && m.date===dr.date;})) combined.push(dr); });
        }
        var w = combined.filter(function(m) { return m.result === "win"; }).length;
        var l = combined.filter(function(m) { return m.result === "loss"; }).length;
        var scoredM = combined.filter(function(m){ return m.score; });
        var bestScore = scoredM.length ? Math.min.apply(null, scoredM.map(function(m){return m.score})) : null;
        // Show W-L when there are head-to-head matches, else a rounds-played count.
        var recStr = (w + l > 0) ? (w + '-' + l) : (scoredM.length ? (scoredM.length + (scoredM.length === 1 ? ' round' : ' rounds')) : '—');
        scrambleContent += '<div class="hof-row"><span class="hof-label">' + escHtml(t.name) + '</span><span class="hof-val">' + recStr + (bestScore ? ' · Best: ' + bestScore : '') + '</span></div>';
      });
    });
  } else {
    scrambleContent = '<div class="hof-row"><span class="hof-label">No teams yet</span><span class="hof-val">Create a team</span></div>';
  }
  h += hofCard("scramble", "Scramble team records", scrambleContent);

  // 5. Best scores by course
  var courseContent = '';
  var courses = PB.getCourses();
  var coursesWithData = courses.filter(function(c) { return PB.getCourseRounds(c.name).length > 0 || teams.some(function(t){return(t.matches||[]).some(function(m){return m.course===c.name})}); });
  if (coursesWithData.length) {
    coursesWithData.forEach(function(c) {
      var cr = PB.getCourseRounds(c.name).filter(function(r){ return (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4"; });
      var bestSolo = cr.length ? cr.reduce(function(a, b) { return a.score < b.score ? a : b; }) : null;
      var scrambleBests = {};
      teams.forEach(function(t) {
        var sz = t.members ? t.members.length : (t.size || 2);
        (t.matches || []).forEach(function(m) {
          if (m.course === c.name && m.score && (!scrambleBests[sz] || m.score < scrambleBests[sz].score)) {
            scrambleBests[sz] = { score: m.score, team: t.name };
          }
        });
      });
      var extras = [];
      if (scrambleBests[2]) extras.push('2m: ' + scrambleBests[2].score);
      if (scrambleBests[3]) extras.push('3m: ' + scrambleBests[3].score);
      if (scrambleBests[4]) extras.push('4m: ' + scrambleBests[4].score);
      courseContent += '<div class="hof-row"><span class="hof-label">' + escHtml(c.name) + '</span><span class="hof-val">' + (bestSolo ? bestSolo.score + ' (' + escHtml(bestSolo.playerName) + ')' : '—') + (extras.length ? ' · ' + extras.join(' · ') : '') + '</span></div>';
    });
  } else {
    courseContent = '<div class="hof-row"><span class="hof-label">No course records</span><span class="hof-val">Log rounds to populate</span></div>';
  }
  h += hofCard("courses", "Best scores by course", courseContent);

  // 6. Handicap leaderboard — uses computed handicap from rounds, falls back to Firestore-persisted value
  var hcapContent = '';
  var allKnownPlayers = players.slice();
  if (typeof fbMemberCache !== "undefined") {
    Object.values(fbMemberCache).forEach(function(m) {
      if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(m)) return;
      if (m.id && !allKnownPlayers.find(function(p){return p.id===m.id||p.id===m.claimedFrom;})) {
        allKnownPlayers.push(m);
      }
    });
  }
  var hcapsSeen = {};
  var hcaps = allKnownPlayers.map(function(p) {
    var key = p.claimedFrom || p.id;
    if (hcapsSeen[key]) return null;
    hcapsSeen[key] = true;
    var computed = PB.calcHandicap(PB.getPlayerRounds(p.id)) ||
                   (p.claimedFrom ? PB.calcHandicap(PB.getPlayerRounds(p.claimedFrom)) : null);
    // Fall back to the MATERIALIZED computedHandicap (what profile/members/home
    // display) before the legacy `handicap` field, so the leaderboard never
    // disagrees with the rest of the app on the same player's index (P9).
    var stored = (p.computedHandicap != null ? p.computedHandicap : p.handicap);
    if (stored == null) stored = null;
    var hcap = computed !== null ? computed : stored;
    if (hcap === null) return null;
    return { name: p.name || p.username, hcap: hcap };
  }).filter(Boolean).sort(function(a, b) { return a.hcap - b.hcap; });
  if (hcaps.length) { hcaps.forEach(function(x) { hcapContent += '<div class="hof-row"><span class="hof-label">' + escHtml(x.name) + '</span><span class="hof-val">' + (+x.hcap).toFixed(1) + '</span></div>'; }); }
  else hcapContent = '<div class="hof-row"><span class="hof-label">No handicaps yet</span><span class="hof-val">Log 3+ rounds</span></div>';
  // Inline the leader (lowest handicap — list is sorted ascending) under the
  // title so the section conveys data before any tap (P10).
  var hcapPreview = hcaps.length ? ('Leader: ' + escHtml(hcaps[0].name) + ' · ' + (+hcaps[0].hcap).toFixed(1)) : '';
  h += hofCard("hcap", "Handicap leaderboard", hcapContent, hcapPreview);

  // 7. Member averages — use all known members (fbMemberCache has everyone)
  var avgContent = '';
  var allRounds = PB.getRounds().filter(function(r){return r.visibility !== "private";});
  // Build set of seed IDs that have been claimed by a Firestore member
  var claimedSeedIds = {};
  if (typeof fbMemberCache !== "undefined") {
    Object.values(fbMemberCache).forEach(function(m) {
      if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(m)) return;
      if (m.claimedFrom) claimedSeedIds[m.claimedFrom] = true;
    });
  }
  var seenAvgIds = {};
  var allMembersForAvg = [];
  // Add seed players only if not already claimed by a Firestore account
  PB.getPlayers().forEach(function(p) {
    if (!claimedSeedIds[p.id] && !seenAvgIds[p.id]) {
      seenAvgIds[p.id] = true;
      allMembersForAvg.push({id:p.id, name:p.name, claimedFrom:null});
    }
  });
  if (typeof fbMemberCache !== "undefined") {
    // Build set of claimedFrom values and best doc per username
    var realAccounts = {};
    var bestByUsername = {};
    Object.values(fbMemberCache).forEach(function(m) {
      if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(m)) return;
      if (m.claimedFrom && m.username) realAccounts[m.claimedFrom] = true;
      if (m.username) {
        var key = m.username.toLowerCase();
        var ex = bestByUsername[key];
        if (!ex || Object.keys(m).length > Object.keys(ex).length) bestByUsername[key] = m;
      }
    });
    Object.values(fbMemberCache).forEach(function(m) {
      // v8.17.0 Path B+ hardening — defensive visibility check (currently
      // safe-by-inheritance via bestByUsername above, but explicit guard
      // protects against future regressions).
      if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(m)) return;
      if (m.id && !seenAvgIds[m.id]) {
        if (m.claimedFrom && !m.username && realAccounts[m.claimedFrom]) return;
        if (m.username && bestByUsername[m.username.toLowerCase()] !== m) return;
        seenAvgIds[m.id] = true;
        allMembersForAvg.push({id:m.id, name:m.name||m.username||"Member", claimedFrom:m.claimedFrom||null});
      }
    });
  }
  allMembersForAvg.sort(function(a,b){ return a.name.localeCompare(b.name); });
  allMembersForAvg.forEach(function(p) {
    var r = allRounds.filter(function(rd){ return (rd.player === p.id || (p.claimedFrom && rd.player === p.claimedFrom)) && rd.format !== "scramble" && rd.format !== "scramble4" && (!rd.holesPlayed || rd.holesPlayed >= 18); });
    var avg = r.length ? Math.round(r.reduce(function(a, x) { return a + x.score; }, 0) / r.length) : "—";
    avgContent += '<div class="hof-row"><span class="hof-label">' + escHtml(p.name) + '</span><span class="hof-val">' + avg + (r.length ? ' (' + r.length + ')' : '') + '</span></div>';
  });
  h += hofCard("avg", "Member averages", avgContent);

  h += renderPageFooter();
  document.querySelector('[data-page="records"]').innerHTML = h;
});

function showAddRecord() {
  var form = document.getElementById("add-record-form");
  if (form) form.style.display = form.style.display === "none" ? "block" : "none";
}

function submitRecord() {
  var type = document.getElementById("rec-type").value;
  var player = document.getElementById("rec-player").value;
  var distance = document.getElementById("rec-distance").value;
  var club = document.getElementById("rec-club").value;
  var course = document.getElementById("rec-course").value;
  var rec = PB.getRecords();
  var entry = { by: player, distance: distance, club: club, course: course, date: localDateStr() };

  if (type === "longestDrive") {
    if (!rec.longestDrive || parseInt(distance) > parseInt(rec.longestDrive.distance)) {
      PB.setRecord("longestDrive", entry);
      Router.toast("New longest drive record!");
    } else Router.toast("Didn't beat the record (" + rec.longestDrive.distance + " yds)");
  } else if (type === "longestPutt") {
    if (!rec.longestPutt || parseInt(distance) > parseInt(rec.longestPutt.distance)) {
      PB.setRecord("longestPutt", entry);
      Router.toast("New longest putt record!");
    } else Router.toast("Didn't beat the record (" + rec.longestPutt.distance + " ft)");
  } else if (type === "longestHoleOut") {
    if (!rec.longestHoleOut || parseInt(distance) > parseInt(rec.longestHoleOut.distance)) {
      PB.setRecord("longestHoleOut", entry);
      Router.toast("New longest hole out record!");
    } else Router.toast("Didn't beat the record (" + rec.longestHoleOut.distance + " yds)");
  } else if (type === "chipIn") {
    PB.setRecord("chipIns", (rec.chipIns || 0) + 1);
    Router.toast("Chip-in logged! Total: " + ((rec.chipIns || 0) + 1));
  } else if (type === "holeInOne") {
    if (!rec.holeInOnes) rec.holeInOnes = [];
    rec.holeInOnes.push(entry);
    PB.setRecord("holeInOnes", rec.holeInOnes);
    Router.toast("Hole in one logged");
  }
  Router.go("records");
}


