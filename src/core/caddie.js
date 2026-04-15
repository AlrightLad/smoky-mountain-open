/* ═══════════════════════════════════════════════════════════════════════════
   THE CADDIE — Rule-based analysis engine
   Pure math and logic from existing round data. No API calls, no external
   services. Runs instantly, costs nothing, works offline.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── 1. POST-ROUND ANALYSIS ──
// Generates insights from a single round's hole-by-hole data.
// Returns array of {text, type} where type = "positive"|"negative"|"neutral"
function caddieAnalyzeRound(round, playerRounds) {
  var insights = [];
  if (!round || !round.holeScores || round.holeScores.length < 9) return insights;

  var scores = round.holeScores.map(function(s) { return parseInt(s) || 0; });
  var pars = round.holePars || [];
  var is9 = round.holesPlayed && round.holesPlayed <= 9;
  var numHoles = is9 ? 9 : 18;
  var startHole = is9 && round.holesMode === "back9" ? 9 : 0;

  // Scoring by par type
  var parTypeScores = {3:[], 4:[], 5:[]};
  for (var i = startHole; i < startHole + numHoles; i++) {
    var s = scores[i], p = pars[i] || 4;
    if (s > 0 && p >= 3 && p <= 5) parTypeScores[p].push(s - p);
  }
  Object.keys(parTypeScores).forEach(function(par) {
    var arr = parTypeScores[par];
    if (arr.length >= 2) {
      var avg = arr.reduce(function(a,b){return a+b},0) / arr.length;
      var avgStr = (avg >= 0 ? "+" : "") + (Math.round(avg * 10) / 10);
      if (avg > 1.5) insights.push({text:"Par " + par + "s averaged " + avgStr + " over par — that\u2019s where strokes are leaking.", type:"negative"});
      else if (avg <= 0.3) insights.push({text:"Par " + par + "s averaged " + avgStr + " — solid play on these holes.", type:"positive"});
    }
  });

  // Front vs back comparison (18-hole only)
  if (!is9 && scores.length >= 18) {
    var front = 0, back = 0;
    for (var fi = 0; fi < 9; fi++) front += scores[fi] || 0;
    for (var bi = 9; bi < 18; bi++) back += scores[bi] || 0;
    var diff = front - back;
    if (Math.abs(diff) >= 3) {
      if (diff > 0) insights.push({text:"Back 9 was " + diff + " strokes better than front \u2014 strong finish.", type:"positive"});
      else insights.push({text:"Front 9 was " + Math.abs(diff) + " strokes better \u2014 fatigue or focus dropped on the back.", type:"negative"});
    }
  }

  // GIR impact
  if (round.girData && round.girData.length >= numHoles) {
    var girHit = [], girMiss = [];
    for (var gi = startHole; gi < startHole + numHoles; gi++) {
      if (scores[gi] > 0) {
        if (round.girData[gi]) girHit.push(scores[gi]);
        else girMiss.push(scores[gi]);
      }
    }
    if (girHit.length >= 2 && girMiss.length >= 2) {
      var hitAvg = girHit.reduce(function(a,b){return a+b},0) / girHit.length;
      var missAvg = girMiss.reduce(function(a,b){return a+b},0) / girMiss.length;
      var girSave = Math.round((missAvg - hitAvg) * 10) / 10;
      if (girSave > 0.5) insights.push({text:"When you hit the green: " + Math.round(hitAvg*10)/10 + " avg. When you missed: " + Math.round(missAvg*10)/10 + " avg. GIR saves you " + girSave + " strokes per hole.", type:"neutral"});
    }
    var girPct = Math.round(girHit.length / (girHit.length + girMiss.length) * 100);
    if (girPct < 25) insights.push({text:girPct + "% greens in regulation \u2014 we can do better. Focus on approach shots at the range this week.", type:"negative"});
    else if (girPct >= 50) insights.push({text:girPct + "% GIR \u2014 great ball striking today.", type:"positive"});
  }

  // Putting
  if (round.puttsData && round.puttsData.length >= numHoles) {
    var totalPutts = 0, threePutts = 0, onePutts = 0;
    for (var pi = startHole; pi < startHole + numHoles; pi++) {
      var pv = round.puttsData[pi] || 0;
      totalPutts += pv;
      if (pv >= 3) threePutts++;
      if (pv === 1) onePutts++;
    }
    if (totalPutts > 0) {
      if (threePutts >= 3) insights.push({text:threePutts + " three-putts today. Lag putting drills will save you " + threePutts + "+ strokes next round.", type:"negative"});
      if (onePutts >= 4) insights.push({text:onePutts + " one-putts \u2014 the flat stick was working.", type:"positive"});
      var puttsPer = Math.round(totalPutts / numHoles * 10) / 10;
      if (puttsPer > 2.2) insights.push({text:puttsPer + " putts per hole. Tour average is 1.7. Prioritize putting practice.", type:"negative"});
    }
  }

  // Birdie/bogey ratio
  var birdies = 0, doubles = 0, bogeys = 0;
  for (var bi2 = startHole; bi2 < startHole + numHoles; bi2++) {
    var sd = (scores[bi2] || 0) - (pars[bi2] || 4);
    if (sd <= -1) birdies++;
    if (sd === 1) bogeys++;
    if (sd >= 2) doubles++;
  }
  if (doubles >= 3 && birdies < doubles) {
    insights.push({text:birdies + " birdie" + (birdies!==1?"s":"") + " vs " + doubles + " double bogeys \u2014 the doubles are costing more than the birdies save. Damage control on bad holes is key.", type:"negative"});
  }

  // Bogey streak detection
  var streak = 0, maxStreak = 0, streakStart = 0;
  for (var si = startHole; si < startHole + numHoles; si++) {
    if ((scores[si] || 0) > (pars[si] || 4)) { streak++; if (streak > maxStreak) { maxStreak = streak; streakStart = si - streak + 1; } }
    else streak = 0;
  }
  if (maxStreak >= 3) insights.push({text:"You bogeyed holes " + (streakStart+1) + " through " + (streakStart+maxStreak) + " \u2014 mid-round slumps happen. Take a deep breath and reset after every bad hole.", type:"negative"});

  // Comparison to season average
  if (playerRounds && playerRounds.length >= 3) {
    var indiv = playerRounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"});
    var comparable = is9 ? indiv.filter(function(r){return r.holesPlayed&&r.holesPlayed<=9}) : indiv.filter(function(r){return !r.holesPlayed||r.holesPlayed>=18});
    if (comparable.length >= 3) {
      var avg = comparable.reduce(function(a,r){return a+r.score},0) / comparable.length;
      var diff2 = round.score - avg;
      if (diff2 <= -3) insights.push({text:"This round was " + Math.abs(Math.round(diff2)) + " strokes better than your average of " + Math.round(avg) + ". Outstanding day.", type:"positive"});
      else if (diff2 >= 5) insights.push({text:"This was " + Math.round(diff2) + " strokes above your average of " + Math.round(avg) + ". One rough round doesn\u2019t define you \u2014 shake it off.", type:"negative"});
    }
  }

  // Personal best check at this course
  if (playerRounds && round.course) {
    var courseRounds = playerRounds.filter(function(r){return r.course===round.course&&r.id!==round.id&&r.score});
    if (courseRounds.length) {
      var bestHere = Math.min.apply(null, courseRounds.map(function(r){return r.score}));
      if (round.score < bestHere) insights.push({text:"New personal best at " + round.course + "! Previous best was " + bestHere + ".", type:"positive"});
      else if (round.score - bestHere <= 3) insights.push({text:"Just " + (round.score - bestHere) + " off your best of " + bestHere + " here. The PB is within reach.", type:"neutral"});
    }
  }

  return insights;
}

// ── 2. PRE-ROUND SCOUTING REPORT ──
// Returns insights for a course the player has played before.
function caddieScoutingReport(courseName, playerRounds) {
  if (!courseName || !playerRounds) return [];
  var courseRounds = playerRounds.filter(function(r){return r.course===courseName&&r.format!=="scramble"&&r.score});
  if (courseRounds.length < 2) return [];

  var insights = [];
  var lastRound = courseRounds[courseRounds.length - 1];
  var best = Math.min.apply(null, courseRounds.map(function(r){return r.score}));
  var avg = Math.round(courseRounds.reduce(function(a,r){return a+r.score},0) / courseRounds.length);

  insights.push({text:"You\u2019ve played " + courseName + " " + courseRounds.length + " times. Average: " + avg + ". Best: " + best + ".", type:"neutral"});

  // Toughest and best holes (from hole-by-hole data)
  var holeAvgs = {};
  courseRounds.forEach(function(r) {
    if (!r.holeScores || !r.holePars) return;
    for (var i = 0; i < Math.min(r.holeScores.length, r.holePars.length); i++) {
      var hs = parseInt(r.holeScores[i]), hp = r.holePars[i];
      if (hs > 0 && hp > 0) {
        if (!holeAvgs[i]) holeAvgs[i] = {total:0, count:0, par:hp};
        holeAvgs[i].total += hs - hp;
        holeAvgs[i].count++;
      }
    }
  });

  var holes = Object.entries(holeAvgs).filter(function(e){return e[1].count>=2}).map(function(e){return {hole:parseInt(e[0])+1, avg:Math.round(e[1].total/e[1].count*10)/10, par:e[1].par}});
  if (holes.length >= 4) {
    holes.sort(function(a,b){return b.avg-a.avg});
    var hardest = holes[0];
    var easiest = holes[holes.length-1];
    insights.push({text:"Your toughest hole: #" + hardest.hole + " (avg +" + hardest.avg + " over par). Play conservative here \u2014 aim for bogey, not par.", type:"negative"});
    insights.push({text:"Your best hole: #" + easiest.hole + " (avg " + (easiest.avg >= 0 ? "+" : "") + easiest.avg + "). Trust your game here.", type:"positive"});
  }

  return insights;
}

// ── 3. PRACTICE PLAN GENERATOR ──
// Based on last 5 rounds, identify weakness and generate a focused 30-min plan.
function caddieGeneratePracticePlan(playerRounds) {
  if (!playerRounds || playerRounds.length < 3) return null;
  var recent = playerRounds.filter(function(r){return r.format!=="scramble"&&r.holeScores&&r.holeScores.length>=9}).slice(-5);
  if (recent.length < 2) return null;

  // Calculate stats across recent rounds
  var totalGirHit = 0, totalGirHoles = 0, totalFirHit = 0, totalFirHoles = 0, totalPutts = 0, totalPuttHoles = 0;
  var par3Scores = [], par4Scores = [], par5Scores = [];

  recent.forEach(function(r) {
    var pars = r.holePars || [];
    var scores = r.holeScores || [];
    for (var i = 0; i < scores.length; i++) {
      var s = parseInt(scores[i]), p = pars[i] || 4;
      if (s <= 0) continue;
      if (p === 3) par3Scores.push(s - p);
      else if (p === 4) par4Scores.push(s - p);
      else if (p === 5) par5Scores.push(s - p);
      if (r.girData && r.girData[i] !== undefined) { totalGirHoles++; if (r.girData[i]) totalGirHit++; }
      if (r.firData && p !== 3) { totalFirHoles++; if (r.firData[i]) totalFirHit++; }
      if (r.puttsData && r.puttsData[i]) { totalPutts += r.puttsData[i]; totalPuttHoles++; }
    }
  });

  var girPct = totalGirHoles ? Math.round(totalGirHit / totalGirHoles * 100) : null;
  var firPct = totalFirHoles ? Math.round(totalFirHit / totalFirHoles * 100) : null;
  var puttAvg = totalPuttHoles ? Math.round(totalPutts / totalPuttHoles * 10) / 10 : null;
  var par3Avg = par3Scores.length ? par3Scores.reduce(function(a,b){return a+b},0) / par3Scores.length : null;

  // Find the weakest area
  var weaknesses = [];
  if (girPct !== null && girPct < 30) weaknesses.push({area:"approaches", score:100-girPct, plan:"Your GIR is " + girPct + "% \u2014 below average. Spend 15 min hitting 150yd targets with your 7-iron. Then 10 min chipping from 30 yards. Finish with 5 min lag putts from 30+ feet."});
  if (firPct !== null && firPct < 40) weaknesses.push({area:"driving", score:100-firPct, plan:"Only " + firPct + "% fairways hit. Start with 10 driver swings at 70% power focusing on center contact. Then 10 more at full speed. Finish with 10 min short game to offset the misses."});
  if (puttAvg !== null && puttAvg > 2.0) weaknesses.push({area:"putting", score:Math.round(puttAvg*20), plan:puttAvg + " putts per hole \u2014 too many. Spend 15 min on the circle drill (3-footers). Then 10 min on lag putts from 30-40 feet. Finish with 5 min gate drill for stroke consistency."});
  if (par3Avg !== null && par3Avg > 1.5) weaknesses.push({area:"par3s", score:Math.round(par3Avg*20), plan:"Par 3 scoring is +" + Math.round(par3Avg*10)/10 + " on average. Hit 10 balls each with your 150yd club and 180yd club. Focus on smooth tempo, not distance. Then 10 min chipping for when you miss the green."});

  if (!weaknesses.length) {
    return {title:"Maintenance Day", plan:"Your stats are solid across the board. Hit 10 drivers, 10 approach shots, 10 chips, and 10 putts. Stay sharp and have fun.", focus:"all-around"};
  }

  weaknesses.sort(function(a,b){return b.score-a.score});
  var worst = weaknesses[0];
  return {title:"Focus: " + worst.area.charAt(0).toUpperCase() + worst.area.slice(1), plan:worst.plan, focus:worst.area};
}

// ── 4. TREND ALERTS ──
// Returns alerts based on recent round patterns. Shown on home page.
function caddieTrendAlerts(playerRounds) {
  if (!playerRounds || playerRounds.length < 3) return [];
  var indiv = playerRounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"&&r.score&&(!r.holesPlayed||r.holesPlayed>=18)});
  if (indiv.length < 3) return [];
  var alerts = [];
  var recent = indiv.slice(-5);

  // Improving streak
  var improving = true;
  for (var i = 1; i < Math.min(recent.length, 4); i++) {
    if (recent[i].score >= recent[i-1].score) { improving = false; break; }
  }
  if (improving && recent.length >= 3) alerts.push({text:recent.length + "-round improving streak \u2014 keep it up! You\u2019re trending in the right direction.", type:"positive"});

  // Worsening trend
  var worsening = true;
  for (var j = 1; j < Math.min(recent.length, 4); j++) {
    if (recent[j].score <= recent[j-1].score) { worsening = false; break; }
  }
  if (worsening && recent.length >= 3) alerts.push({text:"Scores have risen the last " + Math.min(recent.length,4) + " rounds. Time to hit the range and reset.", type:"negative"});

  // Inactivity
  if (indiv.length) {
    var lastDate = indiv[indiv.length-1].date;
    if (lastDate) {
      var daysSince = Math.round((Date.now() - new Date(lastDate+"T12:00:00").getTime()) / 86400000);
      if (daysSince >= 14) alerts.push({text:"You haven\u2019t played in " + daysSince + " days. Your crew is pulling ahead \u2014 get out there!", type:"negative"});
    }
  }

  // PB within reach
  if (recent.length >= 2) {
    var allBest = Math.min.apply(null, indiv.map(function(r){return r.score}));
    var recentAvg = recent.reduce(function(a,r){return a+r.score},0) / recent.length;
    if (recentAvg - allBest <= 3 && recentAvg > allBest) alerts.push({text:"Your recent average is just " + Math.round(recentAvg-allBest) + " off your PB of " + allBest + ". A new personal best is within reach.", type:"positive"});
  }

  return alerts;
}

// ── 5. COURSE-SPECIFIC INSIGHTS ──
// Same as scouting report but for the course detail page (all members).
function caddieCourseInsights(courseName, allRounds) {
  if (!courseName || !allRounds) return [];
  var courseRounds = allRounds.filter(function(r){return r.course===courseName&&r.format!=="scramble"&&r.score});
  if (courseRounds.length < 3) return [];
  var insights = [];
  var avg = Math.round(courseRounds.reduce(function(a,r){return a+r.score},0) / courseRounds.length);
  insights.push({text:"Members average " + avg + " here across " + courseRounds.length + " rounds.", type:"neutral"});

  // Repeat player improvement
  var playerCounts = {};
  courseRounds.forEach(function(r){playerCounts[r.player||r.playerName]=(playerCounts[r.player||r.playerName]||0)+1});
  var repeats = Object.entries(playerCounts).filter(function(e){return e[1]>=3});
  if (repeats.length) {
    insights.push({text:"Members who play here 3+ times tend to improve. Practice rounds pay off.", type:"positive"});
  }

  return insights;
}

// ── 6. HEAD-TO-HEAD INSIGHTS ──
function caddieH2HInsights(p1Id, p2Id, allRounds) {
  if (!p1Id || !p2Id || !allRounds) return [];
  var p1Rounds = allRounds.filter(function(r){return r.player===p1Id});
  var p2Rounds = allRounds.filter(function(r){return r.player===p2Id});
  var insights = [];

  // Find shared courses
  var p1Courses = {}, p2Courses = {};
  p1Rounds.forEach(function(r){if(r.course)p1Courses[r.course]=(p1Courses[r.course]||[]).concat(r)});
  p2Rounds.forEach(function(r){if(r.course)p2Courses[r.course]=(p2Courses[r.course]||[]).concat(r)});

  var sharedCourses = Object.keys(p1Courses).filter(function(c){return p2Courses[c]});
  sharedCourses.forEach(function(course) {
    var p1Avg = p1Courses[course].reduce(function(a,r){return a+r.score},0) / p1Courses[course].length;
    var p2Avg = p2Courses[course].reduce(function(a,r){return a+r.score},0) / p2Courses[course].length;
    var diff = Math.round((p1Avg - p2Avg) * 10) / 10;
    if (Math.abs(diff) >= 2) {
      var better = diff < 0 ? "you" : "they";
      insights.push({text:"At " + course + ", " + better + " have the edge by " + Math.abs(diff) + " strokes on average.", type:diff < 0 ? "positive" : "negative"});
    }
  });

  return insights;
}

// ── Render helper: format insights as Caddy messages ──
function renderCaddieInsights(insights, maxShow) {
  if (!insights || !insights.length) return '';
  maxShow = maxShow || 5;
  var h = '<div style="margin-top:12px;padding:12px;background:rgba(var(--birdie-rgb),.04);border:1px solid rgba(var(--birdie-rgb),.12);border-radius:var(--radius-lg)">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  h += '<div style="width:24px;height:24px;border-radius:50%;background:rgba(var(--birdie-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:12px">\u26f3</span></div>';
  h += '<span style="font-size:11px;font-weight:700;color:var(--birdie)">The Caddie\u2019s Take</span></div>';
  insights.slice(0, maxShow).forEach(function(ins) {
    var color = ins.type === "positive" ? "var(--birdie)" : ins.type === "negative" ? "var(--red)" : "var(--cream)";
    var icon = ins.type === "positive" ? "\u2713" : ins.type === "negative" ? "\u26A0" : "\u2022";
    h += '<div style="display:flex;gap:6px;margin-bottom:6px;font-size:11px;line-height:1.5;color:var(--cream)">';
    h += '<span style="color:' + color + ';flex-shrink:0;font-size:10px;margin-top:2px">' + icon + '</span>';
    h += '<span>' + ins.text + '</span></div>';
  });
  h += '</div>';
  return h;
}
