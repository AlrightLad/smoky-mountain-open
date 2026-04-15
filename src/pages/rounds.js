/* ================================================
   PAGE: ROUNDS
   ================================================ */
Router.register("rounds", function(params) {
  if (params.roundId) { renderRoundDetail(params.roundId); return; }
  // Redirect to new Activity page
  rangeActiveView = "rounds";
  Router.go("activity");
});

function shareRoundCard(roundId) {
  var rounds = PB.getRounds();
  var round = rounds.find(function(r) { return r.id === roundId; });
  if (!round) return;
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var label = diff === 0 ? "Even" : (diff > 0 ? "+" + diff : diff);
  var text = round.playerName + " shot " + round.score + " (" + label + ") at " + round.course + " on " + round.date + " — The Parbaughs";

  if (navigator.share) {
    navigator.share({ title: "Parbaugh Round", text: text, url: "https://alrightlad.github.io/smoky-mountain-open/" }).catch(function(){});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { Router.toast("Copied to clipboard"); }).catch(function() { Router.toast("Copy failed"); });
  } else {
    Router.toast("Share not supported on this device");
  }
}

function renderRoundDetail(roundId) {
  var rounds = PB.getRounds();
  var round = rounds.find(function(r) { return r.id === roundId; });
  if (!round) { Router.go("rounds"); return; }

  var commentary = PB.generateRoundCommentary(round);
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var player = PB.getPlayer(round.player);

  var courseObj = PB.getCourseByName(round.course);
  var roundTee = round.tee || (courseObj ? courseObj.tee : "") || "";
  var diffColor = diff < 0 ? "var(--birdie)" : diff === 0 ? "var(--gold)" : "var(--red)";
  var diffStr = diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
  var holeLabel = round.holesPlayed && round.holesPlayed <= 9 ? (round.holesMode === "back9" ? "Back 9" : "Front 9") : "18 holes";
  var fmtLabel = round.format && round.format !== "stroke" ? round.format.charAt(0).toUpperCase() + round.format.slice(1) : "Stroke";

  var h = '<div style="position:relative;background:linear-gradient(180deg,var(--grad-hero),var(--bg));padding:16px 16px 20px;border-bottom:1px solid var(--border)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<button class="back" onclick="Router.back(\'home\')" style="padding:6px 10px;min-height:40px">← Back</button>';
  h += '</div>';
  // Score hero
  h += '<div style="text-align:center">';
  if (player) h += '<div class="pd-av" style="width:52px;height:52px;font-size:20px;border-width:2px;border-color:' + playerFrameColor(player) + ';margin:0 auto 8px">' + Router.getAvatar(player) + '</div>';
  h += '<div style="font-size:14px;font-weight:600;color:var(--cream)">' + escHtml(round.playerName) + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + escHtml(round.course) + '</div>';
  h += '<div style="margin-top:12px"><span style="font-family:Playfair Display,serif;font-size:56px;font-weight:800;color:var(--gold);line-height:1">' + round.score + '</span></div>';
  h += '<div style="margin-top:6px"><span style="font-size:14px;font-weight:700;color:' + diffColor + ';background:' + diffColor + '15;padding:4px 14px;border-radius:var(--radius-full);border:1px solid ' + diffColor + '30">' + diffStr + '</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:10px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">';
  h += '<span>' + round.date + '</span><span>·</span><span>' + holeLabel + '</span><span>·</span><span>' + fmtLabel + '</span>';
  if (roundTee) h += '<span>·</span><span>' + roundTee + '</span>';
  h += '</div>';
  h += '</div></div>';

  // Stat chips
  h += '<div style="display:flex;justify-content:center;gap:6px;padding:12px 16px;flex-wrap:wrap">';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + (round.rating || 72) + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Rating</div></div>';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + (round.slope || 113) + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Slope</div></div>';
  if (round.yards) h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-align:center;min-width:70px"><div style="font-size:16px;font-weight:700;color:var(--cream)">' + round.yards + '</div><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-top:2px">Yards</div></div>';
  h += '</div>';

  // AI Commentary — consolidated card
  if (commentary.highlights.length || commentary.roasts.length) {
    h += '<div class="card" style="margin-top:4px"><div class="card-body" style="padding:12px 14px">';
    h += '<div style="font-size:9px;font-weight:700;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Parbaugh Commentary</div>';
    var allComments = [];
    commentary.highlights.forEach(function(hl) { allComments.push({text:hl,type:"up"}); });
    commentary.roasts.forEach(function(r) { allComments.push({text:r,type:"down"}); });
    allComments.forEach(function(c) {
      var ic = c.type === "up" ? "var(--birdie)" : "var(--red)";
      var arrow = c.type === "up" ? "M8 13V3M3 8l5-5 5 5" : "M8 3v10M3 8l5 5 5-5";
      h += '<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="' + ic + '" stroke-width="2" style="flex-shrink:0;margin-top:2px"><path d="' + arrow + '"/></svg><div style="font-size:12px;color:var(--cream);line-height:1.4">' + c.text + '</div></div>';
    });
    h += '</div></div>';
  }

  // Scorecard photo
  if (round.scorecardPhoto) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
    h += '<div class="card"><div style="border-radius:var(--radius);overflow:hidden"><img alt="" src="' + round.scorecardPhoto + '" style="width:100%;display:block"></div></div>';
    h += '</div>';
  }

  // Share card preview — embedded directly in round detail
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
  h += '<div id="rdSharePreviewWrap" style="width:100%;border-radius:12px;overflow:hidden;background:var(--grad-deep);box-shadow:0 4px 20px rgba(0,0,0,.4)">';
  h += '<div style="transform-origin:top left;pointer-events:none" id="rdSharePreviewInner"></div>';
  h += '</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">';
  h += '<button class="btn full green" onclick="captureShareCard()" style="font-size:13px;padding:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;width:100%"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 4l1-2h3l1 2" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>Save image &amp; share to socials</button>';
  h += '</div></div>';

  // Delete round
  h += '<div class="section">';
  h += '<div id="del-confirm" style="display:none;margin-bottom:8px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
  h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">Delete this round?</div>';
  h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'del-confirm\').style.display=\'none\'">Cancel</button>';
  h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="(function(){PB.deleteRound(\'' + roundId + '\');if(db)db.collection(\'rounds\').doc(\'' + roundId + '\').delete().catch(function(){});setTimeout(function(){persistPlayerStats(currentUser?currentUser.uid:null);},1500);Router.toast(\'Round deleted\');Router.go(\'rounds\');})()">Delete</button></div></div>';
  h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red)" onclick="document.getElementById(\'del-confirm\').style.display=\'block\'">Delete round</button></div>';

  document.querySelector('[data-page="rounds"]').innerHTML = h;

  // Populate the hidden share template and clone into the inline preview
  setTimeout(function() {
    populateShareTemplateForRound(round);
    var template = document.getElementById("pbShareTemplate");
    var previewInner = document.getElementById("rdSharePreviewInner");
    var previewWrap = document.getElementById("rdSharePreviewWrap");
    if (template && previewInner && previewWrap) {
      previewInner.innerHTML = template.innerHTML;
      // Scale to fit container width — template is 1080px wide
      var wrapWidth = previewWrap.offsetWidth || 360;
      var scale = wrapWidth / 1080;
      previewInner.style.transform = "scale(" + scale + ")";
      previewInner.style.transformOrigin = "top left";
      previewInner.style.width = "1080px";
      previewInner.style.height = "1080px";
      previewWrap.style.height = Math.round(1080 * scale) + "px";
    }
  }, 80);
}

function toggleLogHoleByHole() {
  // Legacy — grid is always visible now
  renderLogHoleGrid();
}

function renderLogHoleGrid() {
  var sec = document.getElementById("rf-hbh-section");
  if (!sec) return;
  var courseName = document.getElementById("rf-course") ? document.getElementById("rf-course").value : "";
  var course = courseName ? PB.getCourseByName(courseName) : null;
  
  // Don't show grid until a valid course is selected
  if (!course || !course.holes || !course.holes.length) {
    sec.innerHTML = courseName ? '<div style="font-size:11px;color:var(--muted);padding:8px 0">Course not found in database — enter total score manually</div>' : '';
    return;
  }
  
  var holes = course.holes;
  var defaultPar = course.holes.map(function(h){return h.par||4;});
  var holesMode = document.getElementById("rf-holes") ? document.getElementById("rf-holes").value : "18";
  var showFront = holesMode === "18" || holesMode === "front9";
  var showBack = holesMode === "18" || holesMode === "back9";

  var h = '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Enter your score for each hole</div>';

  if (showFront) {
    h += '<div style="overflow-x:auto;margin-bottom:8px"><table class="sc-table" style="font-size:10px;width:100%"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 1; i <= 9; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr><tr><td class="sc-lbl">Par</td>';
    for (var i = 0; i < 9; i++) { var p = holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]; h += '<td class="sc-par">' + p + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">Score</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-score" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px" oninput="updateLogTotal()"></td>';
    h += '</tr><tr><td class="sc-lbl">FIR</td>';
    for (var i = 0; i < 9; i++) { var isPar3 = (holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]) === 3; h += '<td>' + (isPar3 ? '<span style="color:var(--muted2);font-size:9px">—</span>' : '<input type="checkbox" class="rf-hole-fir" data-hole="' + i + '" style="width:14px;height:14px">') + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">GIR</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="checkbox" class="rf-hole-gir" data-hole="' + i + '" style="width:14px;height:14px"></td>';
    h += '</tr><tr><td class="sc-lbl">Putts</td>';
    for (var i = 0; i < 9; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-putts" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    h += '</tr></table></div>';
  }

  if (showBack) {
    h += '<div style="overflow-x:auto;margin-bottom:8px"><table class="sc-table" style="font-size:10px;width:100%"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 10; i <= 18; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr><tr><td class="sc-lbl">Par</td>';
    for (var i = 9; i < 18; i++) { var p = holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]; h += '<td class="sc-par">' + p + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">Score</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-score" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px" oninput="updateLogTotal()"></td>';
    h += '</tr><tr><td class="sc-lbl">FIR</td>';
    for (var i = 9; i < 18; i++) { var isPar3 = (holes.length > i ? (holes[i].par || defaultPar[i]) : defaultPar[i]) === 3; h += '<td>' + (isPar3 ? '<span style="color:var(--muted2);font-size:9px">—</span>' : '<input type="checkbox" class="rf-hole-fir" data-hole="' + i + '" style="width:14px;height:14px">') + '</td>'; }
    h += '</tr><tr><td class="sc-lbl">GIR</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="checkbox" class="rf-hole-gir" data-hole="' + i + '" style="width:14px;height:14px"></td>';
    h += '</tr><tr><td class="sc-lbl">Putts</td>';
    for (var i = 9; i < 18; i++) h += '<td><input type="number" inputmode="numeric" class="rf-hole-putts" data-hole="' + i + '" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    h += '</tr></table></div>';
  }
  h += '<div id="rf-hbh-total" style="font-size:12px;color:var(--gold);text-align:center;margin-bottom:8px"></div>';

  sec.innerHTML = h;
}

function updateLogTotal() {
  var inputs = document.querySelectorAll(".rf-hole-score");
  var total = 0, count = 0;
  inputs.forEach(function(inp) { if (inp.value) { total += parseInt(inp.value) || 0; count++; } });
  var el = document.getElementById("rf-hbh-total");
  if (el) el.textContent = count > 0 ? "Hole-by-hole total: " + total + " (" + count + " holes)" : "";
  // Auto-fill the score field
  if (count > 0) {
    var scoreField = document.getElementById("rf-score");
    if (scoreField) scoreField.value = total;
  }
}

function getLogHoleData() {
  var scores = Array(18).fill("");
  var fir = Array(18).fill(false);
  var gir = Array(18).fill(false);
  var putts = Array(18).fill("");
  document.querySelectorAll(".rf-hole-score").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    if (inp.value) scores[idx] = inp.value;
  });
  document.querySelectorAll(".rf-hole-fir").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    fir[idx] = inp.checked;
  });
  document.querySelectorAll(".rf-hole-gir").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    gir[idx] = inp.checked;
  });
  document.querySelectorAll(".rf-hole-putts").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    if (inp.value) putts[idx] = parseInt(inp.value);
  });
  var hasData = scores.some(function(s) { return s !== ""; });
  return hasData ? { holeScores: scores, firData: fir, girData: gir, puttsData: putts } : null;
}

function submitRound() {
  var player = document.getElementById("rf-player").value;
  var courseName = document.getElementById("rf-course").value;
  if (!courseName) { Router.toast("Pick a course"); return; }

  // Hole-by-hole data is required
  var hbhData = getLogHoleData();
  if (!hbhData) { Router.toast("Enter your hole-by-hole scores"); return; }

  var filledScores = hbhData.holeScores.filter(function(s) { return s !== ""; });
  if (filledScores.length < 9) { Router.toast("Enter at least 9 holes"); return; }

  // Compute score from holes
  var score = 0;
  filledScores.forEach(function(s) { score += parseInt(s) || 0; });

  var course = PB.getCourseByName(courseName);
  var holesMode = document.getElementById("rf-holes") ? document.getElementById("rf-holes").value : "18";
  var is9hole = holesMode === "front9" || holesMode === "back9";
  var rating = parseFloat(document.getElementById("rf-rating").value) || (course ? course.rating : 72);
  var slope = parseInt(document.getElementById("rf-slope").value) || (course ? course.slope : 113);

  // Halve rating for 9-hole rounds
  if (is9hole && rating > 50) rating = rating / 2;

  var photoInput = document.getElementById("rf-photo");
  var addRoundData = {
    player: player,
    course: courseName,
    score: score,
    date: document.getElementById("rf-date").value,
    rating: rating,
    slope: slope,
    format: document.getElementById("rf-format").value,
    playerName: currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh",
    holesPlayed: filledScores.length,
    holesMode: holesMode,
    holeScores: hbhData.holeScores,
    firData: hbhData.firData,
    girData: hbhData.girData,
    puttsData: hbhData.puttsData,
    visibility: "public"
  };

  // Add tee info from course if available
  if (course) {
    addRoundData.tee = course.tee || "";
    addRoundData.yards = course.yards || 0;
  }

  function _afterRoundSubmit(round) {
    syncRound(round);
    setTimeout(function() { persistPlayerStats(player); }, 2000);
    // ── ParCoin: award coins for logging a round ──
    if (currentUser && addRoundData.format !== "scramble" && addRoundData.format !== "scramble4") {
      var hcap = PB.calcHandicap(PB.getPlayerRounds(currentUser.uid));
      var coins = calcRoundCoins(score, rating, slope, hcap);
      awardCoins(currentUser.uid, coins, "round_complete", "Logged round at " + courseName + " (" + score + ")", "round_" + round.id);
      if (filledScores.length >= 18) {
        var prevBest = PB.getPlayerBest(currentUser.uid);
        if (prevBest && prevBest.score && score < prevBest.score) {
          awardCoins(currentUser.uid, PARCOIN_RATES.personal_best, "personal_best", "New personal best: " + score, "pb_" + round.id);
        }
      }
    }
    // Check if any wagers or bounties can be resolved with this round
    setTimeout(function() {
      if (typeof checkWagerResolution === "function") checkWagerResolution(round);
      if (typeof checkBountyClaims === "function") checkBountyClaims(round);
    }, 3000);
    showRoundCommentary(round);
  }

  if (photoInput && photoInput.files && photoInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      addRoundData.scorecardPhoto = e.target.result;
      _afterRoundSubmit(PB.addRound(addRoundData));
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    _afterRoundSubmit(PB.addRound(addRoundData));
  }
}

function showRoundCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-round-course",
    function(c) { return "document.getElementById('rf-course').value='" + c.name.replace(/'/g, "\\'") + "';document.getElementById('search-round-course').innerHTML='';var ri=document.getElementById('rf-rating');var si=document.getElementById('rf-slope');if(ri&&!ri.value)ri.value='" + c.rating + "';if(si&&!si.value)si.value='" + c.slope + "';renderLogHoleGrid()"; },
    function(val) { return "quickAddCourseForRound('" + val.replace(/'/g, "\\'") + "')"; }
  );
}

function quickAddCourseForRound(name) {
  var state = prompt("State (e.g. VA, PA, NC):", "");
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
  if (db) db.collection("courses").doc(id).set({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
  document.getElementById("rf-course").value = name;
  var ri = document.getElementById("rf-rating"); if (ri) ri.value = "72";
  var si = document.getElementById("rf-slope"); if (si) si.value = "113";
  document.getElementById("search-round-course").innerHTML = "";
  renderLogHoleGrid();
  Router.toast("Added " + name);
}

function showRoundCommentary(round) {
  Router.toast("Round saved!");
  Router.go("rounds", {roundId: round.id});
}

