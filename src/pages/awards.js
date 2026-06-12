// ========== YEARLY AWARDS CEREMONY ==========
Router.register("awards", function(params) {
  var year = (params && params.year) ? parseInt(params.year) : new Date().getFullYear();
  var now = new Date();
  var seasonOver = now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() === 30);
  // The ceremony scores the whole year (Mar–Sep), not just the live sub-season.
  // getSeasonStandings() with no seasonKey snaps to getCurrentSeason()'s narrow
  // window (e.g. Summer = Jun–Aug), which silently drops Spring rounds and left
  // Player of the Year + Scoring Champion empty while the manual awards (built
  // from the full-year allRounds below) still rendered. Passing an unrecognized
  // key routes to the function's full-year fallback (Mar 1 – Nov 30), so the
  // gold awards now see the same round set as the rest of the page.
  var season = PB.getSeasonStandings(year, "_year");
  var players = PB.getPlayers();
  
  var h = '<div class="sh"><h2>Awards Night</h2><button class="back" onclick="Router.back(\'standings\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:30px 16px 24px;background:linear-gradient(180deg,var(--bg),var(--grad-hero),var(--bg));border-bottom:1px solid rgba(var(--gold-rgb),.15)">';
  h += '';
  h += '<div style="font-family:var(--font-display);font-size:28px;color:var(--gold);font-weight:700;letter-spacing:1px">The ' + year + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;color:var(--cream);font-weight:400;margin-top:2px">Parbaugh Awards</div>';
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

  // Tier emblems — inline SVG sized to the 36px icon slot. Gold = filled trophy
  // (strongest), silver = struck medal disc, bronze = ribbon/laurel sprig. Colored
  // via the theme-aware medal tokens (--medal-gold/silver/bronze) so they track
  // every palette. No emoji per house style.
  var TIER_ICON = {
    gold:   '<svg viewBox="0 0 24 24" width="28" height="28" fill="rgba(var(--cb-brass-rgb),.16)" stroke="var(--medal-gold)" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v3a6 6 0 0 1-12 0V4Z"/><path d="M6 5H3.5v1.5A3.5 3.5 0 0 0 6 9.8M18 5h2.5v1.5A3.5 3.5 0 0 1 18 9.8"/><path d="M12 13v3" stroke-linecap="round"/><path d="M9 20h6M10 16h4l.6 4h-5.2L10 16Z" stroke-linecap="round"/></svg>',
    silver: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--medal-silver)" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M9 3l3 6 3-6" stroke-linecap="round"/><circle cx="12" cy="16" r="5"/><path d="M12 13.4l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9.1 15.6l2-.3.9-1.9Z" stroke-width="1.2" stroke-linecap="round"/></svg>',
    bronze: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--medal-bronze)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4c-2 3-2 7 4 9 6-2 6-6 4-9"/><path d="M12 13v4"/><path d="M9.5 17.5l2.5 2 2.5-2-.7 3.5h-3.6l-.7-3.5Z"/></svg>'
  };
  // Tier presentation: border weight + a small uppercase rank chip. Gold reads
  // first (warm brass border + filled star chip); silver/bronze step down to
  // outlined chips so the hierarchy is legible at a glance instead of three
  // identical beige cards. Only --cb-brass-rgb has an RGB triple available, so
  // silver/bronze chips use the medal color as a faint outline rather than a
  // tinted fill (keeps everything theme-aware without new shared tokens).
  var TIER_STYLE = {
    gold:   {border: "rgba(var(--cb-brass-rgb),.45)", bg: "linear-gradient(135deg,var(--grad-card),var(--card))", chipFill: "rgba(var(--cb-brass-rgb),.14)", chipBorder: "rgba(var(--cb-brass-rgb),.40)", chipColor: "var(--medal-gold)", label: "GOLD", star: true},
    silver: {border: "rgba(var(--cb-brass-rgb),.22)", bg: "var(--card)", chipFill: "transparent", chipBorder: "var(--medal-silver)", chipColor: "var(--medal-silver)", label: "SILVER", star: false},
    bronze: {border: "rgba(var(--cb-brass-rgb),.12)", bg: "var(--card)", chipFill: "transparent", chipBorder: "var(--medal-bronze)", chipColor: "var(--medal-bronze)", label: "BRONZE", star: false}
  };

  // 1. Player of the Year
  if (season.standings.length) {
    ceremonyAwards.push({title: "Player of the Year", winner: season.standings[0].name||season.standings[0].username, detail: season.standings[0].points + " season points", tier: "gold"});
  }
  
  // 2. Scoring Champion (lowest avg)
  // v8.22+ (design-pass 2026-05-22): exclude null/NaN avg from this
  // award. Was leaking 'Average: null' to the card when the top-ranked
  // player had no avg yet — a data hole, not a useful award.
  var scoringChamp = season.standings
    .filter(function(s){return s.rounds >= 3 && s.avg != null && !isNaN(s.avg);})
    .sort(function(a,b){return a.avg-b.avg});
  if (scoringChamp.length) {
    ceremonyAwards.push({title: "Scoring Champion", winner: scoringChamp[0].name||scoringChamp[0].username, detail: (+scoringChamp[0].avg).toFixed(1) + " scoring avg", tier: "gold"});
  }

  // 3. Round of the Year — lowest 18-hole INDIVIDUAL round, shown to-par so the
  // value is self-evidently a full round. Ranking allRounds by raw score let a
  // 9-hole card (e.g. a "44") masquerade as the year's best; restrict to confident
  // 18-hole individual rounds (explicit holesPlayed>=18, or an untracked round
  // whose score is in 18-hole range) and surface the to-par delta for legibility.
  var royRounds = indivAwardRounds.filter(function(r){ return r.score && (r.holesPlayed >= 18 || (!r.holesPlayed && r.score >= 60)); });
  var bestRound = null;
  royRounds.forEach(function(r) { if (!bestRound || r.score < bestRound.score) bestRound = r; });
  if (bestRound) {
    var royPar = 72;
    try { var royC = PB.getCourseByName && PB.getCourseByName(bestRound.course); if (royC && royC.par) royPar = royC.par; } catch (e) {}
    var royDelta = bestRound.score - royPar;
    ceremonyAwards.push({title: "Round of the Year", winner: bestRound.playerName, detail: bestRound.score + " (" + (royDelta >= 0 ? "+" : "") + royDelta + " to par) at " + bestRound.course, tier: "gold"});
  }
  
  // 4. Iron Man (most rounds)
  // Counts EVERY round in the window — scrambles + partials + 18-hole, all
  // formats — so the headline number is intentionally broader than league
  // standings (which only count individual play). Label it "logged" so the
  // count is honest: e.g. an 8-league-round member with 8 scramble entries
  // truthfully reads "16 rounds logged", not "16 rounds played" in the league.
  var roundCounts = {};
  allRounds.forEach(function(r) { roundCounts[r.playerName] = (roundCounts[r.playerName]||0) + 1; });
  var ironMan = Object.entries(roundCounts).sort(function(a,b){return b[1]-a[1]});
  if (ironMan.length) ceremonyAwards.push({title: "Iron Man", winner: ironMan[0][0], detail: ironMan[0][1] + " rounds logged", tier: "silver"});
  
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
    ceremonyAwards.push({title: "Most Improved", winner: mostImproved[0].name||mostImproved[0].username, detail: "Dropped " + Math.round(mostImproved[0]._improv*10)/10 + " strokes avg", tier: "silver"});
  }
  
  // 6. Explorer
  var exploreCounts = {};
  allRounds.forEach(function(r) {
    if (!exploreCounts[r.playerName]) exploreCounts[r.playerName] = {};
    exploreCounts[r.playerName][r.course] = 1;
  });
  var explorers = Object.entries(exploreCounts).map(function(e){return [e[0], Object.keys(e[1]).length]}).sort(function(a,b){return b[1]-a[1]});
  if (explorers.length) ceremonyAwards.push({title: "Explorer Award", winner: explorers[0][0], detail: explorers[0][1] + " courses played", tier: "silver"});
  
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
    ceremonyAwards.push({title: "Mr. Consistent", winner: conData[0].name, detail: "±" + Math.round(conData[0].stdDev*10)/10 + " variance", tier: "bronze"});
  }
  
  // 8. Attendance award (perfect attendance = played every month Mar-Sep)
  players.forEach(function(p) {
    var months = {};
    allRounds.filter(function(r){return r.playerId === p.id}).forEach(function(r) {
      var m = parseInt(r.date.split("-")[1]);
      months[m] = true;
    });
    var activeMonths = Object.keys(months).length;
    if (activeMonths >= 7) ceremonyAwards.push({title: "Perfect Attendance", winner: p.name||p.username, detail: "Played all 7 months", tier: "bronze"});
  });
  
  // Render ceremony — each card leads with its tier emblem (filled trophy / medal
  // / ribbon), carries a tier-weighted border, and pins a small rank chip so gold
  // reads as the headline tier and silver/bronze step down clearly.
  var STAR_SVG = '<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true" style="margin-right:4px;vertical-align:-1px"><path d="M12 2l2.9 6.3 6.6.7-4.9 4.5 1.4 6.5L12 17.3 5.8 20.5l1.4-6.5L2.3 9l6.6-.7L12 2Z"/></svg>';
  ceremonyAwards.forEach(function(a) {
    var ts = TIER_STYLE[a.tier] || TIER_STYLE.bronze;
    var icon = TIER_ICON[a.tier] || TIER_ICON.bronze;
    var chip = '<span style="display:inline-flex;align-items:center;font-size:9px;font-weight:700;letter-spacing:.8px;line-height:1;padding:3px 7px;border-radius:999px;color:' + ts.chipColor + ';background:' + ts.chipFill + ';border:1px solid ' + ts.chipBorder + '">' + (ts.star ? STAR_SVG : '') + ts.label + '</span>';
    h += '<div class="card" style="margin:8px 16px;border-color:' + ts.border + ';background:' + ts.bg + '">';
    h += '<div style="padding:16px;display:flex;align-items:center;gap:14px">';
    h += '<div style="width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + icon + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="font-size:10px;font-weight:700;color:var(--cb-ink-link);text-transform:uppercase;letter-spacing:1.5px">' + a.title + '</div>' + chip + '</div>';
    h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--cream);font-weight:700">' + escHtml(a.winner) + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:3px">' + escHtml(a.detail) + '</div>';
    h += '</div></div></div>';
  });
  
  if (!ceremonyAwards.length) {
    h += '<div class="card" style="margin:16px"><div class="empty" style="padding:32px"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><path d="M12 22V2"/><path d="M12 2l8 4-8 4"/><circle cx="12" cy="22" r="2"/></svg></div><div class="empty-text">No season data yet</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">Log rounds during the season (Mar–Sep) to unlock awards</div></div></div>';
  }

  // "More to earn" — fill the fold honestly when only a few awards have winners.
  // We never invent a recipient: we just name the awards still up for grabs from
  // the full eight-award slate, so the ceremony reads as ongoing rather than
  // leaving the lower half as empty beige.
  if (ceremonyAwards.length) {
    var FULL_SLATE = ["Player of the Year","Scoring Champion","Round of the Year","Iron Man","Most Improved","Explorer Award","Mr. Consistent","Perfect Attendance"];
    var earned = {};
    ceremonyAwards.forEach(function(a){ earned[a.title] = 1; });
    var unearned = FULL_SLATE.filter(function(t){ return !earned[t]; });
    if (unearned.length) {
      h += '<div style="margin:18px 16px 4px;padding-top:14px;border-top:1px solid rgba(var(--cb-brass-rgb),.12)">';
      h += '<div style="font-size:10px;font-weight:700;color:var(--cb-ink-link);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;text-align:center">Still up for grabs</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">';
      unearned.forEach(function(t) {
        h += '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--cb-mute-1);padding:7px 12px;border-radius:999px;border:1px dashed rgba(var(--cb-brass-rgb),.22)">';
        h += '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--medal-bronze)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M9 14.5L8 22l4-2.5L16 22l-1-7.5"/></svg>';
        h += escHtml(t) + '</span>';
      });
      h += '</div></div>';
    }
  }

  h += '<div style="text-align:center;padding:24px;font-size:11px;color:var(--cb-mute);font-style:italic">"It\'s not about the handicap you have, it\'s about the stories you make."</div>';
  
  document.querySelector('[data-page="awards"]').innerHTML = h;
});
