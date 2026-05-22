// Rounds — Log Hole-By-Hole subsystem. Extracted per W1.A5 (AMD-027).
// Functions: toggleLogHoleByHole, renderLogHoleGrid, updateLogTotal,
// getLogHoleData, _populateHoleGridFromRound. Globals attach to window.

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

  function _advRowsHtml(startIdx, endIdx) {
    // Produces 5 rows of advanced-stat inputs for holes [startIdx, endIdx)
    var out = '';
    out += '<tr><td class="sc-lbl">Bunker</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-bunker" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Sand</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-sand" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Up/Dn</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-updown" data-hole="' + i + '" style="width:36px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="Yes">Y</option><option value="No">N</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Miss</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><select class="rf-hole-miss" data-hole="' + i + '" style="width:40px;padding:2px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:10px"><option value="">—</option><option value="left">L</option><option value="right">R</option><option value="long">Lo</option><option value="short">Sh</option></select></td>';
    out += '</tr><tr><td class="sc-lbl">Pen</td>';
    for (var i = startIdx; i < endIdx; i++) out += '<td><input type="number" inputmode="numeric" class="rf-hole-penalty" data-hole="' + i + '" min="0" max="5" value="0" style="width:28px;padding:4px 2px;text-align:center;background:var(--bg3);border:1px solid var(--border);border-radius:4px;color:var(--cream);font-size:11px"></td>';
    out += '</tr>';
    return out;
  }

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
    h += '</tr></table>';
    h += '<details style="margin-top:6px"><summary style="font-size:10px;color:var(--muted);cursor:pointer;padding:6px 0">+ Advanced stats (front 9)</summary>';
    h += '<table class="sc-table" style="font-size:10px;width:100%;margin-top:4px"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 1; i <= 9; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr>' + _advRowsHtml(0, 9) + '</table>';
    h += '</details></div>';
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
    h += '</tr></table>';
    h += '<details style="margin-top:6px"><summary style="font-size:10px;color:var(--muted);cursor:pointer;padding:6px 0">+ Advanced stats (back 9)</summary>';
    h += '<table class="sc-table" style="font-size:10px;width:100%;margin-top:4px"><tr><td class="sc-lbl">Hole</td>';
    for (var i = 10; i <= 18; i++) h += '<td class="sc-hdr">' + i + '</td>';
    h += '</tr>' + _advRowsHtml(9, 18) + '</table>';
    h += '</details></div>';
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
  var bunker = Array(18).fill(null);
  var sand = Array(18).fill(null);
  var upDown = Array(18).fill(null);
  var miss = Array(18).fill(null);
  var penalty = Array(18).fill(0);
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
  document.querySelectorAll(".rf-hole-bunker").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") bunker[idx] = true;
    else if (sel.value === "No") bunker[idx] = false;
  });
  document.querySelectorAll(".rf-hole-sand").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") sand[idx] = true;
    else if (sel.value === "No") sand[idx] = false;
  });
  document.querySelectorAll(".rf-hole-updown").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value === "Yes") upDown[idx] = true;
    else if (sel.value === "No") upDown[idx] = false;
  });
  document.querySelectorAll(".rf-hole-miss").forEach(function(sel) {
    var idx = parseInt(sel.dataset.hole);
    if (sel.value) miss[idx] = sel.value;
  });
  document.querySelectorAll(".rf-hole-penalty").forEach(function(inp) {
    var idx = parseInt(inp.dataset.hole);
    var v = parseInt(inp.value) || 0;
    if (v < 0) v = 0;
    if (v > 5) v = 5;
    penalty[idx] = v;
  });
  var hasData = scores.some(function(s) { return s !== ""; });
  return hasData ? {
    holeScores: scores,
    firData: fir,
    girData: gir,
    puttsData: putts,
    bunkerData: bunker,
    sandData: sand,
    upDownData: upDown,
    missData: miss,
    penaltyData: penalty
  } : null;
}

// v8.22.0 (Ship 5+7 Phase 3) — Populate hole-grid inputs from a round
// doc. Inverse of getLogHoleData. One-shot post-mount call — runs after
// renderLogHoleGrid has built the grid for the round's course. Skipped
// silently if a course-driven re-render later wipes the grid (changing
// course/holes-mode mid-edit is rare, and starting fresh is correct UX).
function _populateHoleGridFromRound(round) {
  if (!round) return;
  var holeScores = round.holeScores || [];
  var firData = round.firData || [];
  var girData = round.girData || [];
  var puttsData = round.puttsData || [];
  var bunkerData = round.bunkerData || [];
  var sandData = round.sandData || [];
  var upDownData = round.upDownData || [];
  var missData = round.missData || [];
  var penaltyData = round.penaltyData || [];

  document.querySelectorAll(".rf-hole-score").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (holeScores[i] !== undefined && holeScores[i] !== null && holeScores[i] !== "") inp.value = holeScores[i];
  });
  document.querySelectorAll(".rf-hole-fir").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    inp.checked = !!firData[i];
  });
  document.querySelectorAll(".rf-hole-gir").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    inp.checked = !!girData[i];
  });
  document.querySelectorAll(".rf-hole-putts").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (puttsData[i] !== undefined && puttsData[i] !== null && puttsData[i] !== "") inp.value = puttsData[i];
  });
  document.querySelectorAll(".rf-hole-bunker").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (bunkerData[i] === true) sel.value = "Yes";
    else if (bunkerData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-sand").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (sandData[i] === true) sel.value = "Yes";
    else if (sandData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-updown").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (upDownData[i] === true) sel.value = "Yes";
    else if (upDownData[i] === false) sel.value = "No";
  });
  document.querySelectorAll(".rf-hole-miss").forEach(function(sel) {
    var i = parseInt(sel.dataset.hole);
    if (missData[i]) sel.value = missData[i];
  });
  document.querySelectorAll(".rf-hole-penalty").forEach(function(inp) {
    var i = parseInt(inp.dataset.hole);
    if (penaltyData[i] !== undefined && penaltyData[i] !== null) inp.value = penaltyData[i];
  });
  // Refresh the hole-by-hole total + the auto-filled score field after
  // populating, so the form's running tally reflects the prefill state.
  if (typeof updateLogTotal === "function") updateLogTotal();
}
