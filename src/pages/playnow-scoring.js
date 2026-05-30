// PlayNow — Live scoring rendering + per-hole interactions. Extracted per
// W1.A5 (AMD-027). Functions: renderLiveScoring, _renderLiveScoringInner,
// _renderBottomNavInner, _redrawBottomNav, adjustLiveScore, _redrawScoreCard,
// liveNav{Next,Prev,Jump}, _applyTriToggle, _refreshAdvCount, toggleFir,
// toggleGir, cyclePutts, toggleAdvancedStats, toggleBunker, toggleSand,
// toggleUpDown, setMiss, adjustPenalty, finishLiveRound, showFinishOptions.

function renderLiveScoring() {
  try { _renderLiveScoringInner(); } catch(e) { pbWarn("[PlayNow] Render error:", e.message, e.stack); }
}
function _renderLiveScoringInner() {
  var hole = liveState.currentHole;
  var player = PB.getPlayer(liveState.player);
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

  // Resolve hole data from liveState or fallback
  var holeData = (liveState.holes && liveState.holes[hole]) || null;
  var par = (holeData && holeData.par) ? holeData.par : (defaultPar[hole] || 4);
  var yardage = holeData ? (holeData.yardage || holeData.yards || 0) : 0;
  var holeHdcp = holeData ? (holeData.handicap || holeData.hdcp || 0) : 0;
  var isPar3 = par === 3;

  // Parbaugh stroke allocation for this hole
  var strokesOnHole = 0;
  if (liveState.format === "parbaugh" && player) {
    var playerRounds = PB.getPlayerRounds(player.id);
    var playerHandicap = PB.calcHandicap(playerRounds);
    if (playerHandicap !== null) {
      strokesOnHole = getStrokesOnHole(playerHandicap, liveState.rating, liveState.slope, liveState.par || 72, holeHdcp);
    }
  }
  var netPar = par + strokesOnHole;

  // Calculate running total
  var totalSoFar = 0, holesPlayed = 0;
  liveState.scores.forEach(function(s) { if (s !== "") { totalSoFar += parseInt(s); holesPlayed++; } });
  var parSoFar = 0;
  for (var pi = 0; pi < holesPlayed; pi++) {
    var hd = liveState.holes && liveState.holes[pi];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[pi] || 4);
  }

  var h = '';

  // Top bar with course name and running score
  h += '<div style="padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-size:13px;font-weight:600">' + liveState.course + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + (player ? player.name : '') + ' · ' + PB.fmtLabel(liveState.format) + '</div></div>';
  h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold)">' + (totalSoFar || "—") + '</div>';
  if (holesPlayed > 0) {
    var diff = totalSoFar - parSoFar;
    h += '<div style="font-size:10px;color:' + (diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (diff > 0 ? '+' : '') + diff + ' thru ' + holesPlayed + '</div>';
  }
  h += '</div></div>';

  // Hole selector — bigger tap targets
  var selectorStart = liveState.holesMode === "back9" ? 9 : 0;
  var selectorEnd = liveState.holesMode === "18" ? 18 : (liveState.holesMode === "back9" ? 18 : 9);
  h += '<div style="padding:8px 12px;display:flex;gap:3px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none">';
  for (var d = selectorStart; d < selectorEnd; d++) {
    var scored = liveState.scores[d] !== "";
    var isCurrent = d === hole;
    var dotColor = isCurrent ? 'var(--gold)' : scored ? 'var(--birdie)' : 'var(--border)';
    var dotBg = isCurrent ? 'rgba(var(--gold-rgb),.18)' : scored ? 'rgba(var(--birdie-rgb),.1)' : 'transparent';
    h += '<div onclick="liveNavJump(' + d + ')" style="min-width:32px;height:32px;border-radius:16px;border:1.5px solid ' + dotColor + ';background:' + dotBg + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:' + dotColor + ';cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent">' + (d+1) + '</div>';
  }
  h += '</div>';

  // Hole header — 18 Birdies style
  h += '<div style="padding:12px 16px 0">';

  // Hole info card
  h += '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px">';
  // Top row: hole number + tee label
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:2px">Hole ' + (hole+1) + '</div>';
  h += '<div style="display:flex;align-items:center;gap:8px">';
  if (liveState.tee) h += '<div style="font-size:9px;color:var(--muted2);background:var(--bg2);padding:2px 8px;border-radius:10px;border:1px solid var(--border)">' + escHtml(liveState.tee) + '</div>';
  // BL-001 — "Adjust" toggle reveals the inline par/yardage editor below the stats.
  var heOpen = !!holeEditOpen[hole];
  h += '<button id="pn-holeedit-toggle-' + hole + '" onclick="toggleHoleEdit(' + hole + ')" aria-expanded="' + (heOpen ? 'true' : 'false') + '" style="display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:' + (heOpen ? 'var(--gold)' : 'var(--muted)') + ';background:transparent;border:1px solid ' + (heOpen ? 'rgba(var(--gold-rgb),.35)' : 'var(--border)') + ';border-radius:10px;padding:4px 9px;cursor:pointer;-webkit-tap-highlight-color:transparent">';
  h += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M11.5 2.5l2 2L5 13l-2.6.6.6-2.6z"/></svg>';
  h += (heOpen ? 'Done' : 'Adjust') + '</button>';
  h += '</div>';
  h += '</div>';
  // Stats row: Par / Yardage / Hdcp
  h += '<div style="display:flex;align-items:center;gap:0">';
  h += '<div style="flex:1;text-align:center;border-right:1px solid var(--border)">';
  h += '<div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--cream);line-height:1">' + par + '</div>';
  h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Par</div>';
  h += '</div>';
  if (yardage) {
    h += '<div style="flex:1;text-align:center;border-right:1px solid var(--border)">';
    h += '<div style="font-size:24px;font-weight:700;color:var(--cream);line-height:1">' + yardage + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Yards</div>';
    h += '</div>';
  }
  if (holeHdcp) {
    h += '<div style="flex:1;text-align:center">';
    h += '<div style="font-size:24px;font-weight:700;color:var(--cream);line-height:1">' + holeHdcp + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Hdcp</div>';
    h += '</div>';
  }
  h += '</div>';
  // BL-001 — inline par/yardage editor, revealed by the header "Adjust" toggle.
  // Writes to the round-scoped liveState.holes copy; a full re-render on each
  // commit refreshes every par-derived value (diff label, running +/-, turn
  // summary, par-3 FIR gating, and the saved round's holePars -> differential).
  if (holeEditOpen[hole]) {
    h += '<div id="pn-holeedit-' + hole + '" style="margin-top:12px;padding:12px 14px;background:var(--bg2);border:1px solid rgba(var(--gold-rgb),.2);border-radius:10px">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
    h += '<span style="font-size:12px;color:var(--cream);font-weight:600">Par</span>';
    h += '<div class="adv-stepper">';
    h += '<button class="adv-step-btn" onclick="adjustHolePar(' + hole + ',-1)"' + (par <= 3 ? ' disabled' : '') + ' aria-label="Decrease par">−</button>';
    h += '<span class="adv-step-val" id="pn-holepar-val-' + hole + '">' + par + '</span>';
    h += '<button class="adv-step-btn" onclick="adjustHolePar(' + hole + ',1)"' + (par >= 6 ? ' disabled' : '') + ' aria-label="Increase par">+</button>';
    h += '</div></div>';
    h += '<div style="display:flex;align-items:center;justify-content:space-between">';
    h += '<span style="font-size:12px;color:var(--cream);font-weight:600">Yards</span>';
    h += '<input type="number" inputmode="numeric" id="pn-holeyards-' + hole + '" value="' + (yardage || '') + '" placeholder="—" onchange="setHoleYardage(' + hole + ',this.value)" style="width:100px;text-align:center;font-size:15px;font-weight:600;color:var(--cream);background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 8px;-webkit-appearance:none;min-height:44px">';
    h += '</div>';
    h += '<div style="font-size:9px;color:var(--muted);margin-top:10px;line-height:1.4">Applies to this round only. The course record stays unchanged.</div>';
    h += '</div>';
  }
  // Parbaugh stroke indicator
  if (liveState.format === "parbaugh" && holeHdcp) {
    if (strokesOnHole > 0) {
      h += '<div style="margin-top:10px;padding:6px 10px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.25);border-radius:6px;display:flex;align-items:center;justify-content:space-between">';
      h += '<span style="font-size:11px;color:var(--gold);font-weight:600">+' + strokesOnHole + ' stroke' + (strokesOnHole > 1 ? 's' : '') + ' · Net par ' + netPar + '</span>';
      h += '<span style="font-size:9px;color:var(--muted)">Parbaugh</span></div>';
    } else {
      h += '<div style="margin-top:10px;padding:6px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;display:flex;align-items:center;justify-content:space-between">';
      h += '<span style="font-size:11px;color:var(--muted)">No stroke · Net par ' + netPar + '</span>';
      h += '<span style="font-size:9px;color:var(--muted)">Parbaugh</span></div>';
    }
  }
  h += '</div>'; // end hole info card

  // Score stepper — full width row, huge tap targets
  var currentScore = liveState.scores[hole];
  h += '<div style="margin-bottom:18px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;text-align:center;margin-bottom:8px">Score</div>';
  h += '<div style="display:flex;align-items:stretch;gap:0;border:1.5px solid var(--border);border-radius:14px;overflow:hidden;height:76px">';
  h += '<div onclick="adjustLiveScore(-1)" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;color:var(--muted);cursor:pointer;background:var(--bg3);-webkit-tap-highlight-color:transparent;user-select:none;border-right:1px solid var(--border)">−</div>';
  h += '<div id="liveScoreNum" style="flex:1.2;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg2)">';
  h += '<div style="font-family:var(--font-display);font-size:46px;font-weight:700;color:var(--gold);line-height:1">' + (currentScore || "—") + '</div>';
  if (currentScore !== "") {
    var scoreDiff = parseInt(currentScore) - par;
    var labels = {"-3":"Albatross","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Double","3":"Triple"};
    var label = labels[scoreDiff.toString()] || (scoreDiff > 0 ? '+' + scoreDiff : scoreDiff);
    var labelColor = scoreDiff < 0 ? 'var(--birdie)' : scoreDiff === 0 ? 'var(--muted)' : 'var(--red)';
    h += '<div style="font-size:10px;color:' + labelColor + ';font-weight:600;margin-top:2px;letter-spacing:.3px">' + label + '</div>';
  }
  h += '</div>';
  h += '<div onclick="adjustLiveScore(1)" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;color:var(--muted);cursor:pointer;background:var(--bg3);-webkit-tap-highlight-color:transparent;user-select:none;border-left:1px solid var(--border)">+</div>';
  h += '</div>';
  h += '</div>';

  // FIR / GIR / Putts — binary toggles, direct-DOM update on tap (v8.2.2)
  h += '<div style="display:flex;gap:8px;margin-bottom:20px">';
  var firActive = !!liveState.fir[hole];
  var firCls = isPar3 ? 'pn-fg-btn disabled' : ('pn-fg-btn' + (firActive ? ' active' : ''));
  var firAttr = isPar3 ? '' : ' onclick="toggleFir(' + hole + ')"';
  h += '<div id="pn-fir-' + hole + '" class="' + firCls + '"' + firAttr + '>';
  h += '<div class="pn-fg-title">FIR</div>';
  h += '<div class="pn-fg-state">' + (isPar3 ? 'N/A (Par 3)' : (firActive ? '\u2713 Hit' : 'Miss')) + '</div>';
  h += '</div>';

  var girActive = !!liveState.gir[hole];
  h += '<div id="pn-gir-' + hole + '" class="pn-fg-btn' + (girActive ? ' active' : '') + '" onclick="toggleGir(' + hole + ')">';
  h += '<div class="pn-fg-title">GIR</div>';
  h += '<div class="pn-fg-state">' + (girActive ? '\u2713 Hit' : 'Miss') + '</div>';
  h += '</div>';

  var puttVal = liveState.putts[hole];
  h += '<div id="pn-putts-' + hole + '" class="pn-putts-btn' + (puttVal ? ' active' : '') + '" onclick="cyclePutts(' + hole + ')">';
  h += '<div class="pn-putts-val">' + (puttVal || '—') + '</div>';
  h += '<div class="pn-putts-lbl">Putts</div>';
  h += '</div>';
  h += '</div>';

  // ── Advanced stats expander (v8.2.0) ────────────────────────────────
  var isAdvOpen = !!advancedOpen[hole];
  // Count filled advanced fields for badge
  var advFilled = 0;
  if (liveState.bunker[hole] !== null) advFilled++;
  if (liveState.sand[hole] !== null) advFilled++;
  if (liveState.upDown[hole] !== null) advFilled++;
  if (liveState.miss[hole]) advFilled++;
  if (liveState.penalty[hole] > 0) advFilled++;
  var advCountStr = advFilled > 0 ? 'Advanced stats \u00b7 ' + advFilled : 'Advanced stats';
  h += '<button id="pn-advtoggle-' + hole + '" class="advanced-stats-toggle' + (isAdvOpen ? ' open' : '') + '" onclick="toggleAdvancedStats(' + hole + ')">';
  h += '<span id="pn-advcount-' + hole + '">' + advCountStr + '</span>';
  h += '<span id="pn-advicon-' + hole + '" style="font-size:16px;color:var(--gold)">' + (isAdvOpen ? '\u2212' : '+') + '</span>';
  h += '</button>';

  // Advanced stats body — always in DOM, .hidden toggled (v8.2.2 direct-DOM refactor).
  // Conditional rows (sand save, up-and-down, miss direction) are also always in DOM,
  // with .hidden applied when their condition is not met. Toggle helpers update these.
  var gir = liveState.gir[hole];
  var bunker = liveState.bunker[hole];
  var sand = liveState.sand[hole];
  var upDown = liveState.upDown[hole];
  var miss = liveState.miss[hole];
  var penalty = liveState.penalty[hole] || 0;

  h += '<div id="pn-advbody-' + hole + '" class="advanced-stats-body' + (isAdvOpen ? '' : ' hidden') + '">';

  // Bunker toggle — v8.13.1 per-span onclick (Pattern B direct-set; was Pattern C parent-onclick + hidden cycling)
  h += '<div class="adv-row">';
  h += '<span class="adv-label">In bunker?</span>';
  h += '<div id="pn-tri-bunker-' + hole + '" class="adv-tri">';
  h += '<span class="adv-tri-opt' + (bunker === null ? ' active-neutral' : '') + '" onclick="toggleBunker(' + hole + ',null)">\u2014</span>';
  h += '<span class="adv-tri-opt' + (bunker === true ? ' active-yes' : '') + '" onclick="toggleBunker(' + hole + ',true)">Yes</span>';
  h += '<span class="adv-tri-opt' + (bunker === false ? ' active-no' : '') + '" onclick="toggleBunker(' + hole + ',false)">No</span>';
  h += '</div></div>';

  // Sand save — always rendered, hidden when bunker !== true
  h += '<div id="pn-row-sand-' + hole + '" data-row="sand-save" class="adv-row' + (bunker !== true ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Sand save?</span>';
  h += '<div id="pn-tri-sand-' + hole + '" class="adv-tri">';
  h += '<span class="adv-tri-opt' + (sand === null ? ' active-neutral' : '') + '" onclick="toggleSand(' + hole + ',null)">\u2014</span>';
  h += '<span class="adv-tri-opt' + (sand === true ? ' active-yes' : '') + '" onclick="toggleSand(' + hole + ',true)">Yes</span>';
  h += '<span class="adv-tri-opt' + (sand === false ? ' active-no' : '') + '" onclick="toggleSand(' + hole + ',false)">No</span>';
  h += '</div></div>';

  // Up-and-down — always rendered, hidden unless GIR missed (gir === false)
  h += '<div id="pn-row-updown-' + hole + '" data-row="up-down" class="adv-row' + (gir !== false ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Up and down?</span>';
  h += '<div id="pn-tri-updown-' + hole + '" class="adv-tri">';
  h += '<span class="adv-tri-opt' + (upDown === null ? ' active-neutral' : '') + '" onclick="toggleUpDown(' + hole + ',null)">\u2014</span>';
  h += '<span class="adv-tri-opt' + (upDown === true ? ' active-yes' : '') + '" onclick="toggleUpDown(' + hole + ',true)">Yes</span>';
  h += '<span class="adv-tri-opt' + (upDown === false ? ' active-no' : '') + '" onclick="toggleUpDown(' + hole + ',false)">No</span>';
  h += '</div></div>';

  // Miss direction — always rendered, hidden unless GIR missed
  h += '<div id="pn-row-missdir-' + hole + '" data-row="miss-dir" class="adv-col' + (gir !== false ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Miss direction</span>';
  h += '<div class="miss-chips">';
  ['left','right','long','short'].forEach(function(dir) {
    var isActive = miss === dir;
    h += '<button id="pn-miss-' + hole + '-' + dir + '" class="miss-chip' + (isActive ? ' active' : '') + '" onclick="setMiss(' + hole + ',\'' + dir + '\')">' + dir.charAt(0).toUpperCase() + dir.slice(1) + '</button>';
  });
  h += '</div></div>';

  // Penalty strokes stepper
  h += '<div class="adv-row">';
  h += '<span class="adv-label">Penalty strokes</span>';
  h += '<div class="adv-stepper">';
  h += '<button id="pn-pen-minus-' + hole + '" class="adv-step-btn" onclick="adjustPenalty(' + hole + ',-1)"' + (penalty <= 0 ? ' disabled' : '') + '>\u2212</button>';
  h += '<span id="pn-pen-val-' + hole + '" class="adv-step-val">' + penalty + '</span>';
  h += '<button id="pn-pen-plus-' + hole + '" class="adv-step-btn" onclick="adjustPenalty(' + hole + ',1)"' + (penalty >= 5 ? ' disabled' : '') + '>+</button>';
  h += '</div></div>';

  h += '</div>'; // end advanced-stats-body

  // Turn summary (show at hole 9)
  if (hole === 9 || hole === 17) {
    var front = 0, frontCount = 0, back = 0, backCount = 0;
    for (var ti = 0; ti < 9; ti++) { if (liveState.scores[ti] !== "") { front += parseInt(liveState.scores[ti]); frontCount++; } }
    for (var bi = 9; bi < 18; bi++) { if (liveState.scores[bi] !== "") { back += parseInt(liveState.scores[bi]); backCount++; } }
    var frontPar = 0, backPar = 0;
    for (var fpi = 0; fpi < 9; fpi++) { var fhd = liveState.holes && liveState.holes[fpi]; frontPar += (fhd && fhd.par) ? fhd.par : (defaultPar[fpi] || 4); }
    for (var bpi = 9; bpi < 18; bpi++) { var bhd = liveState.holes && liveState.holes[bpi]; backPar += (bhd && bhd.par) ? bhd.par : (defaultPar[bpi] || 4); }
    if (frontCount > 0) {
      var frontDiff = front - frontPar;
      var backDiff = back - backPar;
      h += '<div style="margin-bottom:16px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);display:flex;justify-content:space-around;text-align:center">';
      h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Front</div>';
      h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + front + '</div>';
      h += '<div style="font-size:9px;color:' + (frontDiff > 0 ? 'var(--red)' : frontDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (frontDiff > 0 ? '+' : '') + frontDiff + '</div></div>';
      if (backCount > 0) {
        h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Back</div>';
        h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + back + '</div>';
        h += '<div style="font-size:9px;color:' + (backDiff > 0 ? 'var(--red)' : backDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (backDiff > 0 ? '+' : '') + backDiff + '</div></div>';
      }
      var totalDiff = totalSoFar - parSoFar;
      h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Total</div>';
      h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + totalSoFar + '</div>';
      h += '<div style="font-size:9px;color:' + (totalDiff > 0 ? 'var(--red)' : totalDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (totalDiff > 0 ? '+' : '') + totalDiff + '</div></div>';
      h += '</div>';
    }
  }

  // v8.11.6 — Backup Submit affordance. Always renders when at least one hole
  // is scored, regardless of which hole is being viewed or whether the panel
  // above rendered. Defense-in-depth against bottom-nav rendering failures
  // (Mr Parbaugh Ocean Pines stuck-round, April 28, 2026 — undiagnosed mobile
  // bug where _redrawBottomNav fix from v8.11.5 didn't restore visibility).
  // Bottom nav at line ~761+ remains as primary affordance; this is the
  // redundant escape hatch. finishLiveRound's existing >=9 guard handles
  // early taps via Router.toast — no state corruption risk.
  if (holesPlayed >= 1) {
    var totalHoles = liveState.holesMode === "front9" || liveState.holesMode === "back9" ? 9 : 18;
    h += '<button id="liveBodyFinishBtn" onclick="showFinishOptions()" style="display:block;width:100%;margin-top:12px;padding:12px;background:transparent;color:var(--gold);border:1px solid rgba(var(--gold-rgb),.3);border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.3px;cursor:pointer">\u2714 Finish round (<span id="liveBodyFinishCount">' + holesPlayed + '</span>/' + totalHoles + ')</button>';
  }

  // Quit confirm panel
  h += '<div id="quit-confirm" style="display:none;margin-bottom:8px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
  h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">Quit this round? Scores will be lost.</div>';
  h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'quit-confirm\').style.display=\'none\'">Cancel</button>';
  h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="clearLiveState(\'abandoned\');updatePresence._force=true;updatePresence();Router.go(\'rounds\')">Quit</button></div></div>';
  h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red);font-size:11px;margin-bottom:80px" onclick="document.getElementById(\'quit-confirm\').style.display=\'block\'">Quit round</button>';

  h += '</div>';

  // Finish options panel (before submit)
  h += '<div id="finish-options" style="display:none;position:fixed;bottom:56px;left:0;right:0;z-index:200;padding:12px 16px;background:var(--bg2);border-top:1px solid var(--border)">';
  h += '<div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Publish round</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:10px">';
  h += '<div onclick="document.getElementById(\'vis-public\').style.borderColor=\'var(--gold)\';document.getElementById(\'vis-private\').style.borderColor=\'var(--border)\';liveState.visibility=\'public\'" id="vis-public" style="flex:1;padding:10px;text-align:center;border:2px solid var(--gold);border-radius:var(--radius);cursor:pointer;background:rgba(var(--gold-rgb),.06)"><div style="font-size:12px;font-weight:600;color:var(--cream)">Public</div><div style="font-size:9px;color:var(--muted);margin-top:2px">Shows in activity feed</div></div>';
  h += '<div onclick="document.getElementById(\'vis-private\').style.borderColor=\'var(--gold)\';document.getElementById(\'vis-public\').style.borderColor=\'var(--border)\';liveState.visibility=\'private\'" id="vis-private" style="flex:1;padding:10px;text-align:center;border:2px solid var(--border);border-radius:var(--radius);cursor:pointer"><div style="font-size:12px;font-weight:600;color:var(--cream)">Private</div><div style="font-size:9px;color:var(--muted);margin-top:2px">Only on your profile</div></div>';
  h += '</div>';
  h += '<button class="btn full green" onclick="finishLiveRound()">Confirm &amp; save</button>';
  h += '</div>';

  // Sticky bottom nav — always reachable.
  // v8.11.5: extracted to _renderBottomNavInner so adjustLiveScore + per-stat
  // toggles can refresh nav state via _redrawBottomNav without a full page
  // re-render. Container has id="liveBottomNav" for surgical innerHTML swap.
  h += '<div id="liveBottomNav" style="position:fixed;bottom:0;left:0;right:0;z-index:100;background:var(--bg2);border-top:1px solid var(--border);padding:8px 12px">';
  h += _renderBottomNavInner(hole);
  h += '</div>';

  document.querySelector('[data-page="playnow"]').innerHTML = h;
}

// v8.11.5 — Bottom-nav inner string-builder. Extracted so initial render
// (_renderLiveScoringInner) and surgical repaint (_redrawBottomNav) share
// a single source of truth. Inputs derived from liveState globals + the
// passed `hole` (always liveState.currentHole; passed explicitly for clarity).
//
// ringPulse animation inlined via style attribute survives innerHTML swap —
// when the BIG button is freshly inserted the animation starts at frame 0,
// which is the desired behavior when allScored flips from false to true.
function _renderBottomNavInner(hole) {
  var lastHole = liveState.holesMode === "front9" ? 8 : (liveState.holesMode === "back9" ? 17 : 17);
  var isLastHole = hole >= lastHole;
  var scoredCount = liveState.scores.filter(function(s){return s!==""}).length;
  var totalHoles = liveState.holesMode === "front9" || liveState.holesMode === "back9" ? 9 : 18;
  var allScored = scoredCount >= totalHoles;
  var h = "";

  if (scoredCount >= 1) {
    if (isLastHole || allScored) {
      // On last hole or all scored: BIG prominent finish button
      h += '<div style="display:flex;gap:8px">';
      if (hole > 0) h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:11px" onclick="liveNavPrev()">← Prev</button>';
      var _finishPulse = allScored ? 'animation:ringPulse 1.5s ease-in-out infinite;' : '';
      h += '<button class="btn" style="flex:1;padding:16px 0;font-size:16px;font-weight:800;background:linear-gradient(135deg,var(--birdie),var(--cb-green-3));color:#fff;border:none;border-radius:var(--radius);' + _finishPulse + '" onclick="showFinishOptions()">\u2714 Finish Round (' + scoredCount + '/' + totalHoles + ')</button>';
      h += '</div>';
    } else {
      // Not on last hole: Next + small Finish option
      h += '<div style="display:flex;gap:8px">';
      if (hole > 0) h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:11px" onclick="liveNavPrev()">← Prev</button>';
      h += '<button class="btn green" style="flex:1;padding:14px 0;font-size:14px;font-weight:700" onclick="liveNavNext(' + hole + ')">Next hole \u2192</button>';
      h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:10px;color:var(--gold);border-color:rgba(var(--gold-rgb),.3)" onclick="showFinishOptions()">Finish</button>';
      h += '</div>';
    }
  } else {
    // No scores yet: just Next
    h += '<div style="display:flex;gap:8px">';
    h += '<button class="btn green" style="flex:1;padding:14px 0;font-size:14px;font-weight:700" onclick="liveNavNext(' + hole + ')">Next hole \u2192</button>';
    h += '</div>';
  }

  // Quit round — always tiny and de-emphasized
  h += '<div style="text-align:center;margin-top:6px"><span style="font-size:9px;color:var(--red);cursor:pointer;opacity:.5" onclick="quitLiveRound()">Quit round (discard scores)</span></div>';
  return h;
}

// v8.11.5 — Surgical bottom-nav repaint. Called by every liveState mutator
// that doesn't trigger a full Router.go("playnow") re-render. Conservative
// coverage per audit Call 3: all 9 mutators (adjustLiveScore + 8 per-stat
// toggles) call this. Per-stat toggles don't change bottom-nav inputs today,
// but conservative coverage forecloses the memory #9 trap if Ship 4a/4b
// expands the nav's input set (e.g., FIR/GIR running counts in the bottom
// strip). Cost: idempotent innerHTML swap, ~negligible per call.
function _redrawBottomNav() {
  var nav = document.getElementById("liveBottomNav");
  if (nav) nav.innerHTML = _renderBottomNavInner(liveState.currentHole);
  // Keep the body backup "Submit Round (n/total)" count truthful on every score
  // change. It's emitted once per full page render, so without this it lags the
  // real scored-hole count by one between scoring the current hole and the next
  // hole navigation (P9 visible-truth).
  var bodyCount = document.getElementById("liveBodyFinishCount");
  if (bodyCount) bodyCount.textContent = liveState.scores.filter(function(s){ return s !== ""; }).length;
}

function adjustLiveScore(delta) {
  try {
  var hole = liveState.currentHole;
  var current = liveState.scores[hole];
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var par = (liveState.holes && liveState.holes[hole] && liveState.holes[hole].par) || defaultPar[hole] || 4;
  var changed = false;
  if (current === "") {
    liveState.scores[hole] = par;
    changed = true;
  } else {
    var newVal = parseInt(current) + delta;
    if (newVal >= 1 && newVal <= 15) {
      liveState.scores[hole] = newVal;
      changed = true;
    }
  }
  updatePresence(); // broadcast to watchers
  saveLiveState();  // persist for crash recovery / cross-device
  // Direct-DOM update — primary score display, diff label, and running total.
  // Turn-summary and hole-selector-dot update on next hole navigation.
  _redrawScoreCard(hole, par);
  _redrawBottomNav(); // v8.11.5 — refresh Finish button label/state
  if (changed && typeof hapticLight === "function") hapticLight();
  } catch(e) { pbWarn("[PlayNow] adjustLiveScore error:", e.message); }
}

// Update only the parts of the scorecard that the score number touches.
// Called from adjustLiveScore on every tap. Full re-render still fires on hole nav.
function _redrawScoreCard(hole, par) {
  var scoreVal = liveState.scores[hole];
  var scoreNumEl = document.getElementById("liveScoreNum");
  if (scoreNumEl) {
    // scoreNum wraps two children: the big number and the diff label. Rebuild both.
    var inner = '<div style="font-family:var(--font-display);font-size:46px;font-weight:700;color:var(--gold);line-height:1">' + (scoreVal || '\u2014') + '</div>';
    if (scoreVal !== "") {
      var scoreDiff = parseInt(scoreVal) - par;
      var labels = {"-3":"Albatross","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Double","3":"Triple"};
      var label = labels[scoreDiff.toString()] || (scoreDiff > 0 ? '+' + scoreDiff : scoreDiff);
      var labelColor = scoreDiff < 0 ? 'var(--birdie)' : scoreDiff === 0 ? 'var(--muted)' : 'var(--red)';
      inner += '<div style="font-size:10px;color:' + labelColor + ';font-weight:600;margin-top:2px;letter-spacing:.3px">' + label + '</div>';
    }
    scoreNumEl.innerHTML = inner;
    scoreNumEl.classList.remove("score-pop");
    void scoreNumEl.offsetWidth;
    scoreNumEl.classList.add("score-pop");
  }
}

function liveNavNext(hole) {
  if (liveState.scores[hole] === "") { Router.toast("Enter a score"); return; }
  liveState.currentHole++;
  saveLiveState();
  Router.go("playnow");
}

function liveNavPrev() {
  liveState.currentHole--;
  saveLiveState();
  Router.go("playnow");
}

function liveNavJump(hole) {
  liveState.currentHole = hole;
  saveLiveState();
  Router.go("playnow");
}

// ── Scoring toggle helpers (v8.2.2 direct-DOM refactor) ───────────────────
// All helpers update liveState, call saveLiveState for persistence, then
// mutate only the affected DOM nodes. Router.go is NOT called — the page
// is never re-rendered during in-hole interaction. Hole navigation is the
// only thing that triggers a full Router.go("playnow") re-render.

// Shared: apply active class to the correct tri-toggle option for a tri-state value.
function _applyTriToggle(triEl, value) {
  if (!triEl) return;
  var opts = triEl.querySelectorAll(".adv-tri-opt");
  if (opts.length < 3) return;
  opts[0].className = "adv-tri-opt" + (value === null ? " active-neutral" : "");
  opts[1].className = "adv-tri-opt" + (value === true ? " active-yes" : "");
  opts[2].className = "adv-tri-opt" + (value === false ? " active-no" : "");
}

// Shared: recompute advFilled count and write to the toggle-button badge.
function _refreshAdvCount(hole) {
  var n = 0;
  if (liveState.bunker[hole] !== null) n++;
  if (liveState.sand[hole] !== null) n++;
  if (liveState.upDown[hole] !== null) n++;
  if (liveState.miss[hole]) n++;
  if (liveState.penalty[hole] > 0) n++;
  var countEl = document.getElementById("pn-advcount-" + hole);
  if (countEl) countEl.textContent = n > 0 ? ("Advanced stats \u00b7 " + n) : "Advanced stats";
}

function toggleFir(hole) {
  liveState.fir[hole] = !liveState.fir[hole];
  var el = document.getElementById("pn-fir-" + hole);
  if (el) {
    var active = !!liveState.fir[hole];
    el.classList.toggle("active", active);
    var state = el.querySelector(".pn-fg-state");
    if (state) state.textContent = active ? "\u2713 Hit" : "Miss";
  }
  saveLiveState();
  _redrawBottomNav();
}

function toggleGir(hole) {
  var newVal = !liveState.gir[hole];
  liveState.gir[hole] = newVal;
  // If GIR flipped to hit, the up-and-down and miss-direction rows no longer
  // apply — clear any values that were captured while GIR was missed.
  if (newVal === true) {
    if (liveState.upDown[hole] !== null) {
      liveState.upDown[hole] = null;
      var triUpDown = document.getElementById("pn-tri-updown-" + hole);
      _applyTriToggle(triUpDown, null);
    }
    if (liveState.miss[hole]) {
      liveState.miss[hole] = null;
      ["left","right","long","short"].forEach(function(dir) {
        var chip = document.getElementById("pn-miss-" + hole + "-" + dir);
        if (chip) chip.classList.remove("active");
      });
    }
  }
  var el = document.getElementById("pn-gir-" + hole);
  if (el) {
    el.classList.toggle("active", newVal);
    var state = el.querySelector(".pn-fg-state");
    if (state) state.textContent = newVal ? "\u2713 Hit" : "Miss";
  }
  // Conditional rows: visible only when GIR missed.
  var showUd = newVal === false;
  var udRow = document.getElementById("pn-row-updown-" + hole);
  if (udRow) udRow.classList.toggle("hidden", !showUd);
  var missRow = document.getElementById("pn-row-missdir-" + hole);
  if (missRow) missRow.classList.toggle("hidden", !showUd);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function cyclePutts(hole) {
  var current = liveState.putts[hole];
  if (!current) liveState.putts[hole] = 1;
  else if (current >= 4) liveState.putts[hole] = "";
  else liveState.putts[hole] = current + 1;
  var newVal = liveState.putts[hole];
  var el = document.getElementById("pn-putts-" + hole);
  if (el) {
    el.classList.toggle("active", !!newVal);
    var valEl = el.querySelector(".pn-putts-val");
    if (valEl) valEl.textContent = newVal || "\u2014";
  }
  saveLiveState();
  _redrawBottomNav();
}

// ── Advanced stats helpers (v8.2.0) ────────────────────────────────────
function toggleAdvancedStats(hole) {
  advancedOpen[hole] = !advancedOpen[hole];
  var open = !!advancedOpen[hole];
  var body = document.getElementById("pn-advbody-" + hole);
  if (body) body.classList.toggle("hidden", !open);
  var toggle = document.getElementById("pn-advtoggle-" + hole);
  if (toggle) toggle.classList.toggle("open", open);
  var icon = document.getElementById("pn-advicon-" + hole);
  if (icon) icon.textContent = open ? "\u2212" : "+";
  // Ephemeral UI state — not persisted, matches prior behavior.
}

// v8.13.1 — Tri-toggle handlers converted from cycling-on-parent-onclick to
// direct-set-per-span-onclick (Pattern C → Pattern B). Each span passes its
// own value (null/true/false) so taps select directly. Function names retained
// semantically — toggleBunker(hole, value) reads as "toggle bunker to value."
// Bug introduced v8.2.0; fixed v8.13.1 after surfacing in production.
function toggleBunker(hole, value) {
  liveState.bunker[hole] = value;
  // If bunker is no longer true, clear sand save.
  if (value !== true && liveState.sand[hole] !== null) {
    liveState.sand[hole] = null;
    _applyTriToggle(document.getElementById("pn-tri-sand-" + hole), null);
  }
  _applyTriToggle(document.getElementById("pn-tri-bunker-" + hole), value);
  // Sand save row visible only when bunker === true.
  var sandRow = document.getElementById("pn-row-sand-" + hole);
  if (sandRow) sandRow.classList.toggle("hidden", value !== true);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function toggleSand(hole, value) {
  liveState.sand[hole] = value;
  _applyTriToggle(document.getElementById("pn-tri-sand-" + hole), value);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function toggleUpDown(hole, value) {
  liveState.upDown[hole] = value;
  _applyTriToggle(document.getElementById("pn-tri-updown-" + hole), value);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function setMiss(hole, direction) {
  // Toggle off if same direction tapped again.
  var newVal = liveState.miss[hole] === direction ? null : direction;
  liveState.miss[hole] = newVal;
  ["left","right","long","short"].forEach(function(dir) {
    var chip = document.getElementById("pn-miss-" + hole + "-" + dir);
    if (chip) chip.classList.toggle("active", newVal === dir);
  });
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function adjustPenalty(hole, delta) {
  var cur = liveState.penalty[hole] || 0;
  var next = cur + delta;
  if (next < 0) next = 0;
  if (next > 5) next = 5;
  liveState.penalty[hole] = next;
  var valEl = document.getElementById("pn-pen-val-" + hole);
  if (valEl) valEl.textContent = next;
  var minusBtn = document.getElementById("pn-pen-minus-" + hole);
  if (minusBtn) minusBtn.disabled = next <= 0;
  var plusBtn = document.getElementById("pn-pen-plus-" + hole);
  if (plusBtn) plusBtn.disabled = next >= 5;
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

// ── BL-001: in-round par/yardage edit ─────────────────────────────────────
// The "Adjust" toggle on the hole info card reveals an inline editor. Edits
// write to the round-scoped liveState.holes copy (deep-copied at round start),
// so the shared course master is never mutated. Each commit triggers a full
// re-render so every par-derived value recomputes (score diff, running +/-,
// turn summary, par-3 FIR gating, and finishLiveRound's holePars -> differential).
function toggleHoleEdit(hole) {
  holeEditOpen[hole] = !holeEditOpen[hole];
  saveLiveState();
  Router.go("playnow");
}

// Materialize a dense 18-hole array on first edit. A course with no per-hole
// data would otherwise yield a sparse holePars on finish, which under-counts
// the handicap differential (handicap.js skips NaN pars). Existing hole objects
// are preserved; only gaps are filled with the same defaultPar the renderer
// already falls back to, so this changes nothing downstream except density.
function _ensureLiveHole(hole) {
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  if (!Array.isArray(liveState.holes)) liveState.holes = [];
  for (var i = 0; i < 18; i++) {
    if (!liveState.holes[i]) liveState.holes[i] = { par: defaultPar[i] || 4 };
  }
  return liveState.holes[hole];
}

function adjustHolePar(hole, delta) {
  var hd = _ensureLiveHole(hole);
  var cur = parseInt(hd.par, 10) || 4;
  var next = cur + delta;
  if (next < 3) next = 3;
  if (next > 6) next = 6;
  if (next === cur) return;
  liveState.holes[hole] = Object.assign({}, hd, { par: next });
  saveLiveState();
  if (typeof hapticLight === "function") hapticLight();
  Router.go("playnow");
}

function setHoleYardage(hole, value) {
  var hd = _ensureLiveHole(hole);
  var y = parseInt(value, 10);
  if (isNaN(y) || y < 0) y = 0;
  if (y > 999) y = 999;
  // Normalize onto .yardage and drop any legacy .yards so the renderer reads
  // a single field (it checks .yardage || .yards).
  var next = Object.assign({}, hd, { yardage: y });
  delete next.yards;
  liveState.holes[hole] = next;
  saveLiveState();
  Router.go("playnow");
}

function finishLiveRound() {
  var startHole = liveState.holesMode === "back9" ? 9 : 0;
  var endHole = liveState.holesMode === "front9" ? 9 : 18;
  var totalScore = 0, completed = 0;
  for (var hi = startHole; hi < endHole; hi++) {
    if (liveState.scores[hi] !== "") { totalScore += parseInt(liveState.scores[hi]); completed++; }
  }

  if (completed < 9) { Router.toast("Play at least 9 holes"); return; }

  // Save as a local round.
  // v8.13.0 — Pass liveState.roundId so /rounds/{id} aligns with the same
  // identifier used in /liverounds/{playerUid}.roundId during the live phase.
  // Enables /round/:roundId lookup to find the same round across both
  // collections (Ship 4a Gate 1).
  var _pName = currentProfile ? (currentProfile.name || currentProfile.username || liveState.player) : liveState.player;
  var round = PB.addRound({
    id: liveState.roundId || undefined,
    player: liveState.player,
    playerName: _pName,
    course: liveState.course,
    score: totalScore,
    date: localDateStr(),
    rating: completed <= 9 ? (liveState.rating || 72) / 2 : (liveState.rating || 72),
    slope: liveState.slope,
    format: liveState.format,
    holesPlayed: completed,
    holesMode: liveState.holesMode || "18",
    holeScores: liveState.scores.slice(),
    holePars: liveState.holes && liveState.holes.length ? liveState.holes.map(function(h){return h.par||4;}) : null,
    holeYards: liveState.holes && liveState.holes.length ? liveState.holes.map(function(h){return (h.yardage!=null?h.yardage:(h.yards||0));}) : null,
    firData: liveState.fir.slice(),
    girData: liveState.gir.slice(),
    puttsData: liveState.putts.slice(),
    bunkerData: liveState.bunker.slice(),
    sandData: liveState.sand.slice(),
    upDownData: liveState.upDown.slice(),
    missData: liveState.miss.slice(),
    penaltyData: liveState.penalty.slice(),
    visibility: liveState.visibility || "public"
  });
  // Sync to Firestore immediately — critical for cross-device visibility and loadRoundsFromFirestore
  syncRound(round);

  // Haptic success on round finish (Ship 0b-iii)
  if (typeof hapticSuccess === "function") hapticSuccess();

  // Persist computed stats back to member doc so they're always available even if rounds don't load
  setTimeout(function() { persistPlayerStats(liveState.player); }, 2000);

  // Calculate stats
  var firCount = 0, girCount = 0, totalPutts = 0;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  // BL-001 — read per-round edited pars (liveState.holes) with default fallback so
  // a corrected hole par flows into the differential and par-3 FIR gating.
  function _holePar(i) { var hd = liveState.holes && liveState.holes[i]; return (hd && hd.par) ? hd.par : (defaultPar[i] || 4); }
  var parTotal = 0;
  for (var i = 0; i < completed; i++) {
    if (_holePar(i) !== 3 && liveState.fir[i]) firCount++;
    if (liveState.gir[i]) girCount++;
    if (liveState.putts[i]) totalPutts += liveState.putts[i];
    parTotal += _holePar(i);
  }
  var firHoles = 0;
  for (var j = 0; j < completed; j++) { if (_holePar(j) !== 3) firHoles++; }

  // Capture state BEFORE clearing — clearLiveState wipes everything
  var savedScores = liveState.scores.slice();
  var savedHoles = liveState.holes ? liveState.holes.slice() : [];
  var savedTee = liveState.tee || "";
  var savedYards = liveState.yards || 0;
  var savedCourse = liveState.course;

  liveState.active = false;
  clearLiveState(); // remove crash recovery data — round committed to Firestore
  updatePresence._force = true;
  updatePresence(); // clear liveRound from presence so watchers see round ended
  setTimeout(checkAndAwardNewAchievements, 1500); // check for newly unlocked achievements

  // ── ParCoin: award coins for completing a round ──
  if (currentUser && liveState.format !== "scramble" && liveState.format !== "scramble4") {
    var is9h = completed < 18;
    var isAttested = !!round.attestedBy;
    var roundCoins = calcRoundCoins(is9h, isAttested);
    awardCoins(currentUser.uid, roundCoins, "round_complete", "Completed " + (is9h ? "9H" : "18H") + " round at " + liveState.course + " (" + totalScore + ")" + (isAttested ? " [attested]" : ""), "round_" + round.id);
    // Personal best check
    var prevBest = PB.getPlayerBest(currentUser.uid);
    if (!is9h && prevBest && prevBest.score && totalScore < prevBest.score) {
      awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_18h, "personal_best", "New PB (18H): " + totalScore + " at " + liveState.course, "pb_" + round.id);
    } else if (is9h) {
      var prevBest9 = PB.getPlayerRounds(currentUser.uid).filter(function(r){return r.holesPlayed&&r.holesPlayed<18&&r.score}).map(function(r){return r.score});
      if (prevBest9.length > 1 && totalScore < Math.min.apply(null, prevBest9.slice(0,-1))) {
        awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_9h, "personal_best_9h", "New PB (9H): " + totalScore, "pb9_" + round.id);
      }
    }
  }
  // Check if any wagers or bounties can be resolved with this round
  setTimeout(function() {
    if (typeof checkWagerResolution === "function") checkWagerResolution(round);
    if (typeof checkBountyClaims === "function") checkBountyClaims(round);
  }, 3000);

  var commentary = PB.generateRoundCommentary(round);
  var msg = commentary.roasts.length ? commentary.roasts[0] : (commentary.highlights.length ? commentary.highlights[0] : "Round complete!");

  // Build share card text
  var diff = totalScore - parTotal;
  var diffStr = diff > 0 ? "+" + diff : diff === 0 ? "E" : diff;
  var playerName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
  var shareText = playerName + " shot " + totalScore + " (" + diffStr + ") at " + savedCourse;
  if (firHoles > 0) shareText += " · FIR " + firCount + "/" + firHoles;
  shareText += " · GIR " + girCount + "/" + completed;
  if (totalPutts > 0) shareText += " · " + totalPutts + " putts";
  shareText += "\nparbaughs.golf";

  // Show share card modal
  showShareCard(totalScore, diffStr, savedCourse, playerName, firCount, firHoles, girCount, completed, totalPutts, shareText, round.id, savedScores, savedHoles, savedTee, savedYards);
}

function showFinishOptions() {
  var el = document.getElementById("finish-options");
  if (el) el.style.display = "block";
  liveState.visibility = "public";
  window.scrollTo(0, document.body.scrollHeight);
}

