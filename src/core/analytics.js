/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS — Advanced stat calculations for player profiles
   All pure math from existing round data. No API calls.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Strokes Gained (simplified model) ──
// Uses FIR/GIR/putts to estimate where strokes are gained/lost vs baseline.
// Baseline: bogey golfer (90 for 18 holes). Adjustable per handicap.
function calcStrokesGained(rounds) {
  if (!rounds || rounds.length < 3) return null;
  var indiv = rounds.filter(function(r){return r.format!=="scramble"&&r.holeScores&&r.holePars&&r.holeScores.length>=9});
  if (indiv.length < 2) return null;

  var tee = 0, approach = 0, shortGame = 0, putting = 0, totalHoles = 0;

  indiv.forEach(function(r) {
    var pars = r.holePars || [];
    var scores = r.holeScores || [];
    for (var i = 0; i < scores.length; i++) {
      var s = parseInt(scores[i]), p = pars[i] || 4;
      if (s <= 0 || p <= 0) continue;
      totalHoles++;
      var overPar = s - p;

      // Distribute strokes gained across categories based on available data
      var hitFir = r.firData ? !!r.firData[i] : null;
      var hitGir = r.girData ? !!r.girData[i] : null;
      var putts = r.puttsData ? (r.puttsData[i] || 0) : 0;

      // Putting: putts - expected putts (baseline ~2 per hole)
      if (putts > 0) {
        putting += (2 - putts); // positive = gained, negative = lost
      }

      // GIR impact → approach strokes gained
      if (hitGir !== null) {
        approach += hitGir ? 0.3 : -0.3; // simplified: hitting green = +0.3 gained
      }

      // FIR impact → tee strokes gained (par 4/5 only)
      if (hitFir !== null && p >= 4) {
        tee += hitFir ? 0.2 : -0.2;
      }

      // Short game: remainder attributed to scrambling
      var accounted = (putts > 0 ? (2 - putts) : 0) + (hitGir !== null ? (hitGir ? 0.3 : -0.3) : 0) + (hitFir !== null && p >= 4 ? (hitFir ? 0.2 : -0.2) : 0);
      shortGame += (-overPar) - accounted; // what's left after other categories
    }
  });

  if (totalHoles < 18) return null;
  var perRound = totalHoles / (indiv.length || 1) || 18;
  return {
    tee: Math.round(tee / indiv.length * 10) / 10,
    approach: Math.round(approach / indiv.length * 10) / 10,
    shortGame: Math.round(shortGame / indiv.length * 10) / 10,
    putting: Math.round(putting / indiv.length * 10) / 10,
    rounds: indiv.length
  };
}

// ── Scoring Trends (rolling averages) ──
function calcScoringTrends(rounds) {
  var indiv = (rounds || []).filter(function(r){return r.format!=="scramble"&&r.score&&(!r.holesPlayed||r.holesPlayed>=18)});
  indiv.sort(function(a,b){return a.date>b.date?1:-1});
  if (indiv.length < 3) return null;

  var scores = indiv.map(function(r){return {date:r.date, score:r.score, label:r.date?r.date.substring(5):""}});

  // Rolling averages
  function rolling(arr, window) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var start = Math.max(0, i - window + 1);
      var slice = arr.slice(start, i + 1);
      var avg = slice.reduce(function(a,b){return a+b.score},0) / slice.length;
      result.push({date:arr[i].date, value:Math.round(avg*10)/10, label:arr[i].label});
    }
    return result;
  }

  return {
    raw: scores.map(function(s){return {value:s.score, label:s.label}}),
    rolling5: rolling(scores, 5),
    rolling10: rolling(scores, 10),
    count: indiv.length
  };
}

// ── Scoring Zones (by par type) ──
function calcScoringZones(rounds) {
  var indiv = (rounds || []).filter(function(r){return r.format!=="scramble"&&r.holeScores&&r.holePars&&r.holeScores.length>=9});
  if (indiv.length < 2) return null;

  var zones = {3:{total:0,count:0}, 4:{total:0,count:0}, 5:{total:0,count:0}};
  indiv.forEach(function(r) {
    for (var i = 0; i < r.holeScores.length; i++) {
      var s = parseInt(r.holeScores[i]), p = r.holePars[i] || 4;
      if (s > 0 && p >= 3 && p <= 5) { zones[p].total += s - p; zones[p].count++; }
    }
  });

  var result = {};
  [3,4,5].forEach(function(p) {
    if (zones[p].count >= 4) {
      result[p] = {avg:Math.round(zones[p].total/zones[p].count*10)/10, count:zones[p].count};
    }
  });
  return Object.keys(result).length >= 2 ? result : null;
}

// ── Course Breakdown (hole-by-hole at a specific course) ──
function calcCourseBreakdown(courseName, playerRounds) {
  var courseRounds = (playerRounds || []).filter(function(r){return r.course===courseName&&r.holeScores&&r.holePars&&r.holeScores.length>=9});
  if (courseRounds.length < 3) return null;

  var holeStats = {};
  courseRounds.forEach(function(r) {
    for (var i = 0; i < Math.min(r.holeScores.length, r.holePars.length); i++) {
      var s = parseInt(r.holeScores[i]), p = r.holePars[i] || 4;
      if (s > 0) {
        if (!holeStats[i]) holeStats[i] = {total:0, count:0, par:p};
        holeStats[i].total += s;
        holeStats[i].count++;
      }
    }
  });

  var holes = Object.entries(holeStats).filter(function(e){return e[1].count>=2}).map(function(e) {
    return {hole:parseInt(e[0])+1, avg:Math.round(e[1].total/e[1].count*10)/10, par:e[1].par, diff:Math.round((e[1].total/e[1].count-e[1].par)*10)/10};
  });
  holes.sort(function(a,b){return a.hole-b.hole});
  return holes.length >= 9 ? {holes:holes, rounds:courseRounds.length, course:courseName} : null;
}

// ── Stat Trends (FIR%, GIR%, putts over time) ──
function calcStatTrends(rounds) {
  var indiv = (rounds || []).filter(function(r){return r.format!=="scramble"&&r.holeScores&&r.holeScores.length>=9});
  indiv.sort(function(a,b){return a.date>b.date?1:-1});
  if (indiv.length < 3) return null;

  var firTrend = [], girTrend = [], puttsTrend = [];
  indiv.forEach(function(r) {
    var label = r.date ? r.date.substring(5) : "";
    if (r.firData) {
      var firH = 0, firC = 0;
      r.firData.forEach(function(v,i){var p=r.holePars?r.holePars[i]:4;if(p!==3){firH++;if(v)firC++;}});
      if (firH > 0) firTrend.push({value:Math.round(firC/firH*100), label:label});
    }
    if (r.girData) {
      var girH = 0, girC = 0;
      r.girData.forEach(function(v){girH++;if(v)girC++;});
      if (girH > 0) girTrend.push({value:Math.round(girC/girH*100), label:label});
    }
    if (r.puttsData) {
      var pTotal = 0, pHoles = 0;
      r.puttsData.forEach(function(v){if(v){pTotal+=v;pHoles++;}});
      if (pHoles > 0) puttsTrend.push({value:Math.round(pTotal/pHoles*10)/10, label:label});
    }
  });

  return {fir:firTrend, gir:girTrend, putts:puttsTrend};
}

// ── H2H Deep Stats ──
function calcH2HDeepStats(p1Id, p2Id, allRounds) {
  if (!p1Id || !p2Id || !allRounds) return null;
  var p1 = allRounds.filter(function(r){return r.player===p1Id&&r.format!=="scramble"&&r.holeScores});
  var p2 = allRounds.filter(function(r){return r.player===p2Id&&r.format!=="scramble"&&r.holeScores});
  if (p1.length < 2 || p2.length < 2) return null;

  function avgStat(rounds, fn) {
    var vals = rounds.map(fn).filter(function(v){return v!==null});
    return vals.length ? Math.round(vals.reduce(function(a,b){return a+b},0)/vals.length*10)/10 : null;
  }

  var p1Gir = avgStat(p1, function(r){if(!r.girData)return null;var h=0,c=0;r.girData.forEach(function(v){h++;if(v)c++});return h?c/h*100:null});
  var p2Gir = avgStat(p2, function(r){if(!r.girData)return null;var h=0,c=0;r.girData.forEach(function(v){h++;if(v)c++});return h?c/h*100:null});
  var p1Fir = avgStat(p1, function(r){if(!r.firData||!r.holePars)return null;var h=0,c=0;r.firData.forEach(function(v,i){var p=r.holePars[i]||4;if(p!==3){h++;if(v)c++}});return h?c/h*100:null});
  var p2Fir = avgStat(p2, function(r){if(!r.firData||!r.holePars)return null;var h=0,c=0;r.firData.forEach(function(v,i){var p=r.holePars[i]||4;if(p!==3){h++;if(v)c++}});return h?c/h*100:null});
  var p1Putts = avgStat(p1, function(r){if(!r.puttsData)return null;var t=0,h=0;r.puttsData.forEach(function(v){if(v){t+=v;h++}});return h?t/h:null});
  var p2Putts = avgStat(p2, function(r){if(!r.puttsData)return null;var t=0,h=0;r.puttsData.forEach(function(v){if(v){t+=v;h++}});return h?t/h:null});

  return {
    p1: {gir:p1Gir, fir:p1Fir, puttsPerHole:p1Putts, rounds:p1.length},
    p2: {gir:p2Gir, fir:p2Fir, puttsPerHole:p2Putts, rounds:p2.length}
  };
}
