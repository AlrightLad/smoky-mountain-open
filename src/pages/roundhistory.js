/* ================================================
   PAGE: ROUND HISTORY — Lifetime round journal
   Every round since the user joined. Never resets.
   ================================================ */

var _rhFilter = "all"; // all, 9, 18
var _rhCourse = "";
var _rhSeason = "";

Router.register("roundhistory", function(params) {
  var uid = currentUser ? currentUser.uid : null;
  if (!uid) { Router.go("home"); return; }
  var allRounds = PB.getPlayerRounds(uid);
  if (!allRounds.length && currentProfile && currentProfile.claimedFrom) {
    allRounds = PB.getPlayerRounds(currentProfile.claimedFrom);
  }
  // Sort newest first
  allRounds = allRounds.slice().sort(function(a,b) { return (b.date||"") > (a.date||"") ? 1 : -1; });

  // Filter out scramble for individual stats
  var indivRounds = allRounds.filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });
  var full18 = indivRounds.filter(function(r) { return !r.holesPlayed || r.holesPlayed >= 18; });

  // Quick stats
  var totalRounds = allRounds.length;
  var lowest = full18.length ? Math.min.apply(null, full18.map(function(r){return r.score||999})) : null;
  var avg = full18.length ? Math.round(full18.reduce(function(a,r){return a+(r.score||0)},0) / full18.length * 10) / 10 : null;
  var courseCounts = {};
  allRounds.forEach(function(r) { if (r.course) courseCounts[r.course] = (courseCounts[r.course]||0) + 1; });
  var mostPlayed = Object.keys(courseCounts).sort(function(a,b){return courseCounts[b]-courseCounts[a]})[0] || "—";
  var dateRange = allRounds.length ? allRounds[allRounds.length-1].date + " — Present" : "";

  // Unique courses and seasons for filters
  var courses = Object.keys(courseCounts).sort();
  var seasons = [];
  var seenSeasons = {};
  allRounds.forEach(function(r) {
    if (!r.date) return;
    var y = parseInt(r.date.substring(0,4));
    var m = parseInt(r.date.substring(5,7));
    var sk = m <= 5 ? "spring" : m <= 8 ? "summer" : m <= 11 ? "fall" : "winter";
    var key = sk + "_" + y;
    if (!seenSeasons[key]) { seenSeasons[key] = true; var labels = {spring:"Spring",summer:"Summer",fall:"Fall",winter:"Winter"}; seasons.push({key:key, label:labels[sk] + " " + y, start:y+"-"+(sk==="spring"?"03":sk==="summer"?"06":sk==="fall"?"09":"12")+"-01", end:y+"-"+(sk==="spring"?"05":sk==="summer"?"08":sk==="fall"?"11":"02")+"-31"}); }
  });

  var h = '<div class="sh"><h2>My Rounds</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // Header stats
  h += '<div style="padding:12px 16px 16px;background:linear-gradient(180deg,var(--grad-hero),var(--bg));border-bottom:1px solid var(--border)">';
  h += '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">' + totalRounds + ' round' + (totalRounds !== 1 ? 's' : '') + (dateRange ? ' · ' + dateRange : '') + '</div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)">' + totalRounds + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Rounds</div></div>';
  h += '<div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--birdie)">' + (lowest || "—") + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Lowest</div></div>';
  h += '<div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--cream)">' + (avg || "—") + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Average</div></div>';
  h += '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:8px">Most played: <span style="color:var(--cream);font-weight:600">' + escHtml(mostPlayed) + '</span></div>';
  h += '</div>';

  // Filters
  h += '<div style="padding:8px 16px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--border)">';
  ["all","9","18"].forEach(function(f) {
    var label = f === "all" ? "All" : f + "-Hole";
    var isActive = _rhFilter === f;
    h += '<button class="btn-sm' + (isActive ? ' green' : ' outline') + '" onclick="_rhFilter=\'' + f + '\';Router.go(\'roundhistory\',{},true)" style="font-size:10px;padding:5px 10px">' + label + '</button>';
  });
  if (courses.length > 1) {
    h += '<select onchange="_rhCourse=this.value;Router.go(\'roundhistory\',{},true)" style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--cream);padding:5px 8px;font-size:10px">';
    h += '<option value="">All courses</option>';
    courses.forEach(function(c) { h += '<option value="' + escHtml(c) + '"' + (_rhCourse === c ? ' selected' : '') + '>' + escHtml(c) + '</option>'; });
    h += '</select>';
  }
  h += '</div>';

  // Hole dot legend
  h += '<div style="padding:6px 16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:9px;color:var(--muted)">';
  h += '<span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#FFD700"></span>Eagle</span>';
  h += '<span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#4CAF50"></span>Birdie</span>';
  h += '<span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#888888"></span>Par</span>';
  h += '<span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#F59E42"></span>Bogey</span>';
  h += '<span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#E53935"></span>Double+</span>';
  h += '</div>';

  // Apply filters
  var filtered = allRounds;
  if (_rhFilter === "9") filtered = filtered.filter(function(r) { return r.holesPlayed && r.holesPlayed <= 9; });
  if (_rhFilter === "18") filtered = filtered.filter(function(r) { return !r.holesPlayed || r.holesPlayed >= 18; });
  if (_rhCourse) filtered = filtered.filter(function(r) { return r.course === _rhCourse; });

  // Find personal best for badge marking
  var pb18 = full18.length ? Math.min.apply(null, full18.map(function(r){return r.score||999})) : 999;

  // Round list
  if (!filtered.length) {
    h += '<div class="empty" style="padding:40px"><div class="empty-text">No rounds match this filter</div></div>';
  } else {
    h += '<div style="padding:8px 16px">';
    filtered.forEach(function(r) {
      var isPB = r.score === pb18 && (!r.holesPlayed || r.holesPlayed >= 18) && r.format !== "scramble" && r.format !== "scramble4";
      var is9 = r.holesPlayed && r.holesPlayed <= 9;
      var fmtLabel = r.format && r.format !== "stroke" ? r.format.charAt(0).toUpperCase() + r.format.slice(1) : "Stroke";
      var holeLabel = is9 ? (r.holesMode === "back9" ? "Back 9" : "Front 9") : "18 holes";

      h += '<div class="card" style="margin-bottom:6px;cursor:pointer;' + (isPB ? 'border-color:rgba(var(--birdie-rgb),.3);background:rgba(var(--birdie-rgb),.03)' : '') + '" onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})">';
      h += '<div style="padding:12px 14px">';

      // Top row: course + score
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font-size:13px;font-weight:700;color:var(--cream)">' + escHtml(r.course || "Unknown") + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + (r.date || "") + ' · ' + holeLabel + ' · ' + fmtLabel + '</div>';
      h += '</div>';
      h += '<div style="text-align:right;flex-shrink:0;margin-left:12px">';
      h += '<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:' + (isPB ? 'var(--birdie)' : 'var(--gold)') + '">' + (r.score || "—") + '</div>';
      if (isPB) h += '<div style="font-size:8px;font-weight:700;color:var(--birdie);letter-spacing:.5px;margin-top:2px">PERSONAL BEST</div>';
      h += '</div></div>';

      // F9/B9 breakdown from hole-by-hole data
      var frontScore = null, backScore = null;
      if (r.frontScore) frontScore = r.frontScore;
      if (r.backScore) backScore = r.backScore;
      if ((frontScore === null || backScore === null) && r.holeScores && r.holeScores.length >= 18) {
        var fs = 0, bs = 0, fv = true, bv = true;
        for (var si = 0; si < 9; si++) { var v = parseInt(r.holeScores[si]); if (v > 0) fs += v; else fv = false; }
        for (var si2 = 9; si2 < 18; si2++) { var v2 = parseInt(r.holeScores[si2]); if (v2 > 0) bs += v2; else bv = false; }
        if (fv && fs > 0 && frontScore === null) frontScore = fs;
        if (bv && bs > 0 && backScore === null) backScore = bs;
      }
      var hasBreakdown = frontScore !== null || backScore !== null;

      // Mini stat row
      var statParts = [];
      if (frontScore !== null) statParts.push("F9: " + frontScore);
      if (backScore !== null) statParts.push("B9: " + backScore);
      if (r.firData) { var firC = 0, firH = 0; r.firData.forEach(function(v,i) { var par = r.holePars ? r.holePars[i] : 4; if (par !== 3) { firH++; if (v) firC++; } }); if (firH > 0) statParts.push("FIR: " + firC + "/" + firH); }
      if (r.girData) { var girC = 0, girH = 0; r.girData.forEach(function(v) { girH++; if (v) girC++; }); if (girH > 0) statParts.push("GIR: " + girC + "/" + girH); }
      if (r.puttsData) { var pTotal = 0; r.puttsData.forEach(function(v) { pTotal += (v||0); }); if (pTotal > 0) statParts.push("Putts: " + pTotal); }
      if (statParts.length) {
        h += '<div style="font-size:9px;color:var(--muted);margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">';
        statParts.forEach(function(sp) { h += '<span>' + sp + '</span>'; });
        h += '</div>';
      }

      // Mini hole visualization (colored dots)
      if (r.holeScores && r.holeScores.length >= 9) {
        var pars = r.holePars || [];
        h += '<div style="display:flex;gap:2px;margin-top:6px">';
        var numHoles = Math.min(r.holeScores.length, is9 ? 9 : 18);
        var startHole = is9 && r.holesMode === "back9" ? 9 : 0;
        for (var hi = startHole; hi < startHole + numHoles; hi++) {
          var hs = parseInt(r.holeScores[hi]);
          var hp = pars[hi] || 4;
          // STATIC scoring colors — never change per theme (universal golf convention)
          var dotColor = "#444"; // no data
          if (hs > 0) {
            var diff = hs - hp;
            if (diff <= -2) dotColor = "#FFD700";      // eagle+ (gold)
            else if (diff === -1) dotColor = "#4CAF50"; // birdie (green)
            else if (diff === 0) dotColor = "#888888";  // par (gray)
            else if (diff === 1) dotColor = "#F59E42";  // bogey (orange)
            else dotColor = "#E53935";                   // double+ (red)
          }
          h += '<div style="width:' + (is9 ? '8px' : '5px') + ';height:' + (is9 ? '8px' : '5px') + ';border-radius:50%;background:' + dotColor + '"></div>';
        }
        h += '</div>';
      }

      // Attestation note
      if (r.attestedBy) {
        h += '<div style="font-size:9px;color:var(--muted2);margin-top:4px;font-style:italic">Attested by ' + escHtml(r.attestedBy) + '</div>';
      }

      h += '</div></div>';
    });
    h += '</div>';
  }

  h += renderPageFooter();
  document.querySelector('[data-page="roundhistory"]').innerHTML = h;
  setTimeout(initCountAnimations, 50);
});
