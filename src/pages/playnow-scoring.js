// PlayNow — Live scoring rendering + per-hole interactions. Extracted per
// W1.A5 (AMD-027). Functions: renderLiveScoring, _renderLiveScoringInner,
// _renderBottomNavInner, _redrawBottomNav, adjustLiveScore, _redrawScoreCard,
// liveNav{Next,Prev,Jump}, _applyTriToggle, _refreshAdvCount, toggleFir,
// toggleGir, cyclePutts, toggleAdvancedStats, toggleBunker, toggleSand,
// toggleUpDown, setMiss, adjustPenalty, finishLiveRound, showFinishOptions.

function renderLiveScoring() {
  try { _renderLiveScoringInner(); } catch(e) { pbWarn("[PlayNow] Render error:", e.message, e.stack); }
}

// Score-numeral + diff-label inner HTML for #liveScoreNum. Shared by the initial
// render and the surgical _redrawScoreCard repaint so the markup stays in sync
// across both paths (CLUBHOUSE_SPEC-HQ-3g.1).
function _scoreHeroInner(scoreVal, par) {
  var has = scoreVal !== "" && scoreVal != null;
  if (!has) {
    // Empty state: a muted glyph plus a hint keeps the hero the same height as
    // the scored state and reads as "awaiting input" rather than a divider rule.
    return '<div class="ls-score__num is-empty">·</div>' +
           '<div class="ls-score__hint">Tap to score</div>';
  }
  var s = '<div class="ls-score__num">' + scoreVal + '</div>';
  var d = parseInt(scoreVal, 10) - par;
  var labels = {"-4":"Condor","-3":"Albatross","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Double","3":"Triple"};
  var label = labels[d.toString()] || (d > 0 ? '+' + d : '' + d);
  var cls = d < 0 ? 'is-under' : d === 0 ? 'is-par' : 'is-over';
  s += '<div class="ls-score__diff ' + cls + '">' + label + '</div>';
  return s;
}

// Desktop-only read-only scorecard rail (hidden <980px via CSS). Re-renders only
// on hole navigation, so the current hole shows "scoring" rather than a stale
// number — the live numeral lives in the entry pad's hero (P9 visible-truth).
function _renderCardRailInner(defaultPar, totalSoFar, parSoFar, holesPlayed) {
  var startH = liveState.holesMode === "back9" ? 9 : 0;
  var endH = liveState.holesMode === "18" ? 18 : (liveState.holesMode === "back9" ? 18 : 9);
  var diff = holesPlayed > 0 ? (totalSoFar - parSoFar) : null;
  var diffStr = diff === null ? '' : (diff > 0 ? '+' + diff : diff === 0 ? 'E' : '' + diff);
  var diffCls = diff === null ? '' : (diff < 0 ? 'is-under' : diff === 0 ? 'is-par' : 'is-over');

  var s = '<div class="ls-rail__head">';
  s += '<div class="ls-rail__eyebrow">Scorecard</div>';
  s += '<div class="ls-rail__tot"><span class="ls-rail__tot-num">' + (totalSoFar || '—') + '</span>';
  if (diff !== null) s += '<span class="ls-rail__tot-diff ' + diffCls + '">' + diffStr + '</span>';
  s += '</div></div>';

  s += '<div class="ls-rail__list">';
  for (var i = startH; i < endH; i++) {
    var hd = liveState.holes && liveState.holes[i];
    var rp = (hd && hd.par) ? hd.par : (defaultPar[i] || 4);
    var sc = liveState.scores[i];
    var isCur = i === liveState.currentHole;
    var scored = sc !== "" && sc != null;
    var scoreCell, scoreCls;
    if (isCur) { scoreCell = 'scoring'; scoreCls = 'is-scoring'; }
    else if (scored) {
      scoreCell = sc;
      var rd = parseInt(sc, 10) - rp;
      scoreCls = rd < 0 ? 'is-under' : rd === 0 ? 'is-par' : 'is-over';
    } else { scoreCell = '—'; scoreCls = 'is-empty'; }
    s += '<button class="ls-rail__row' + (isCur ? ' is-current' : '') + '" onclick="liveNavJump(' + i + ')"' + (isCur ? ' aria-current="true"' : '') + '>';
    s += '<span class="ls-rail__h">' + (i + 1) + '</span>';
    s += '<span class="ls-rail__p">par ' + rp + '</span>';
    s += '<span class="ls-rail__s ' + scoreCls + '">' + scoreCell + '</span>';
    s += '</button>';
    if (i === 8 && endH === 18) s += '<div class="ls-rail__turn">Back nine</div>';
  }
  s += '</div>';
  return s;
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
  var diffNow = holesPlayed > 0 ? (totalSoFar - parSoFar) : null;

  h += '<div class="ls-wrap">';

  // ── Desktop-only scorecard rail (read-only; hidden <980px) ──
  h += '<aside class="ls-rail" aria-label="Scorecard so far">' + _renderCardRailInner(defaultPar, totalSoFar, parSoFar, holesPlayed) + '</aside>';

  // ── Entry pad ──
  h += '<div class="ls-pad">';

  // Editorial masthead
  h += '<header class="ls-mast">';
  h += '<div class="ls-mast__lead">';
  h += '<div class="ls-mast__eyebrow"><span class="ls-mast__pulse" aria-hidden="true"></span>Live · Round in progress</div>';
  h += '<h1 class="ls-mast__course">' + escHtml(liveState.course || 'Your round') + '</h1>';
  var metaBits = [];
  if (liveState.tee) metaBits.push(escHtml(liveState.tee));
  metaBits.push('Par ' + (liveState.par || 72));
  metaBits.push(PB.fmtLabel(liveState.format));
  h += '<div class="ls-mast__meta">' + metaBits.join(' · ') + '</div>';
  h += '</div>';
  if (diffNow !== null) {
    h += '<div class="ls-mast__score">';
    h += '<div class="ls-mast__score-num">' + (diffNow > 0 ? '+' + diffNow : diffNow === 0 ? 'E' : diffNow) + '</div>';
    h += '<div class="ls-mast__score-lbl">thru ' + holesPlayed + '</div>';
    h += '</div>';
  }
  h += '</header>';

  // Hole selector dots
  var selectorStart = liveState.holesMode === "back9" ? 9 : 0;
  var selectorEnd = liveState.holesMode === "18" ? 18 : (liveState.holesMode === "back9" ? 18 : 9);
  h += '<div class="ls-holes" role="tablist" aria-label="Holes">';
  for (var d = selectorStart; d < selectorEnd; d++) {
    var scored = liveState.scores[d] !== "";
    var isCurrent = d === hole;
    var dotCls = 'ls-dot' + (isCurrent ? ' is-current' : scored ? ' is-scored' : '');
    h += '<button class="' + dotCls + '" onclick="liveNavJump(' + d + ')" role="tab" aria-selected="' + (isCurrent ? 'true' : 'false') + '"' + (isCurrent ? ' aria-current="true"' : '') + '>' + (d+1) + '</button>';
  }
  h += '</div>';

  // Hole context strip
  h += '<div class="ls-hole">';
  h += '<div class="ls-hole__lead">';
  // Cosmetics-in-play (Founder 2026-06-15, Lane C): the equipped tee-marker rides
  // the hole eyebrow — the hole header IS the tee box. Safe no-op when nothing is
  // equipped (pbTeeMarkerHtml returns ''). The ball-marker belongs on the Lane-A
  // hole map (see task-queue/founder/course-map-cosmetics-in-play-proposal.md).
  var _teeMk = (typeof pbTeeMarkerHtml === 'function' && typeof currentProfile !== 'undefined') ? pbTeeMarkerHtml(currentProfile) : '';
  h += '<div class="ls-hole__eyebrow">Hole ' + (hole+1) + _teeMk + '</div>';
  var hbits = ['Par ' + par];
  if (yardage) hbits.push(yardage + ' yds');
  if (holeHdcp) hbits.push('Hdcp ' + holeHdcp);
  h += '<div class="ls-hole__meta">' + hbits.join(' · ') + '</div>';
  h += '</div>';
  // BL-001 — "Adjust" toggle reveals the inline par/yardage editor below.
  var heOpen = !!holeEditOpen[hole];
  h += '<button id="pn-holeedit-toggle-' + hole + '" class="ls-adjust' + (heOpen ? ' is-open' : '') + '" onclick="toggleHoleEdit(' + hole + ')" aria-expanded="' + (heOpen ? 'true' : 'false') + '">';
  h += '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M11.5 2.5l2 2L5 13l-2.6.6.6-2.6z"/></svg>';
  h += (heOpen ? 'Done' : 'Adjust') + '</button>';
  h += '</div>';

  // GPS distance-to-pin (Front/Center/Back) — Founder-greenlit Lane A. Returns ''
  // when there's no course/GPS to anchor a green to, so it's a safe no-op there.
  if (typeof pbDistanceStrip === 'function') h += pbDistanceStrip(hole);

  // BL-001 — inline par/yardage editor, revealed by the "Adjust" toggle.
  // Writes to the round-scoped liveState.holes copy; a full re-render on each
  // commit refreshes every par-derived value (diff label, running +/-, turn
  // summary, par-3 FIR gating, and the saved round's holePars -> differential).
  if (holeEditOpen[hole]) {
    h += '<div id="pn-holeedit-' + hole + '" class="ls-holeedit">';
    h += '<div class="ls-holeedit__row">';
    h += '<span class="ls-holeedit__lbl">Par</span>';
    h += '<div class="adv-stepper">';
    h += '<button class="adv-step-btn" onclick="adjustHolePar(' + hole + ',-1)"' + (par <= 3 ? ' disabled' : '') + ' aria-label="Decrease par">−</button>';
    h += '<span class="adv-step-val" id="pn-holepar-val-' + hole + '">' + par + '</span>';
    h += '<button class="adv-step-btn" onclick="adjustHolePar(' + hole + ',1)"' + (par >= 6 ? ' disabled' : '') + ' aria-label="Increase par">+</button>';
    h += '</div></div>';
    h += '<div class="ls-holeedit__row">';
    h += '<span class="ls-holeedit__lbl">Yards</span>';
    h += '<input type="number" inputmode="numeric" id="pn-holeyards-' + hole + '" value="' + (yardage || '') + '" placeholder="—" onchange="setHoleYardage(' + hole + ',this.value)" class="ls-holeedit__input">';
    h += '</div>';
    h += '<div class="ls-holeedit__note">Applies to this round only. The course record stays unchanged.</div>';
    h += '</div>';
  }

  // Parbaugh stroke indicator
  if (liveState.format === "parbaugh" && holeHdcp) {
    if (strokesOnHole > 0) {
      h += '<div class="ls-stroke is-on"><span>+' + strokesOnHole + ' stroke' + (strokesOnHole > 1 ? 's' : '') + ' · Net par ' + netPar + '</span><span class="ls-stroke__tag">Parbaugh</span></div>';
    } else {
      h += '<div class="ls-stroke"><span>No stroke · Net par ' + netPar + '</span><span class="ls-stroke__tag">Parbaugh</span></div>';
    }
  }

  // Score hero — 56×56 brass steppers flank a 96px Fraunces numeral
  var currentScore = liveState.scores[hole];
  h += '<div class="ls-score">';
  h += '<button class="ls-step" onclick="adjustLiveScore(-1)" aria-label="Decrease score">−</button>';
  h += '<div id="liveScoreNum" class="ls-score__center" role="status" aria-live="polite">' + _scoreHeroInner(currentScore, par) + '</div>';
  h += '<button class="ls-step" onclick="adjustLiveScore(1)" aria-label="Increase score">+</button>';
  h += '</div>';

  // FIR / GIR / Putts — binary toggles, direct-DOM update on tap (v8.2.2)
  h += '<div class="ls-stats">';
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
  h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red);font-size:11px" onclick="document.getElementById(\'quit-confirm\').style.display=\'block\'">Quit round</button>';

  h += '</div>'; // end .ls-pad
  h += '</div>'; // end .ls-wrap

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
      h += '<button class="btn" style="flex:1;padding:16px 0;font-size:16px;font-weight:800;background:linear-gradient(135deg,var(--gold),var(--gold3));color:var(--cb-ink);border:none;border-radius:var(--radius);' + _finishPulse + '" onclick="showFinishOptions()">\u2714 Finish Round (' + scoredCount + '/' + totalHoles + ')</button>';
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
    // #liveScoreNum wraps the big numeral + diff label. _scoreHeroInner is the
    // single source of truth shared with the initial render.
    scoreNumEl.innerHTML = _scoreHeroInner(scoreVal, par);
    scoreNumEl.classList.remove("score-pop");
    void scoreNumEl.offsetWidth;
    scoreNumEl.classList.add("score-pop");
    // v8.25.82 — birdie/eagle micro-celebration: a small moss/brass label
    // floats up off the score hero when the entered score beats par. Tasteful
    // (not the full PB confetti), one-shot, reduced-motion-safe. position:relative
    // (no offsets) is layout-neutral so the absolute badge anchors to the hero.
    var _rm = false; try { _rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!_rm && scoreVal !== "" && !isNaN(parseInt(scoreVal))) {
      var _d = parseInt(scoreVal) - par;
      var _lbl = _d <= -2 ? "EAGLE" : _d === -1 ? "BIRDIE" : "";
      if (_lbl) {
        scoreNumEl.style.position = "relative";
        var _burst = document.createElement("div");
        _burst.className = "pn-birdie-burst" + (_d <= -2 ? " pn-birdie-burst--eagle" : "");
        _burst.textContent = _lbl;
        scoreNumEl.appendChild(_burst);
        setTimeout(function() { try { _burst.remove(); } catch (e) {} }, 1300);
      }
    }
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

  // task #31 — capture the PRIOR personal best BEFORE this round is committed.
  // PB.addRound() below makes the new round visible to PB.getPlayerBest/Best9
  // immediately, so reading it after the add would compare the round against
  // itself. Like-for-like: 18H vs prior 18H best, 9H vs prior 9H best.
  // Scramble team scores never count as personal bests.
  var _pbPriorBest = null;
  if (currentUser && liveState.format !== "scramble" && liveState.format !== "scramble4") {
    try {
      _pbPriorBest = completed >= 18 ? PB.getPlayerBest(currentUser.uid) : PB.getPlayerBest9(currentUser.uid);
    } catch (e) { _pbPriorBest = null; }
  }

  // Save as a local round.
  // v8.13.0 — Pass liveState.roundId so /rounds/{id} aligns with the same
  // identifier used in /liverounds/{playerUid}.roundId during the live phase.
  // Enables /round/:roundId lookup to find the same round across both
  // collections (Ship 4a Gate 1).
  var _pName = currentProfile ? (currentProfile.name || currentProfile.username || liveState.player) : liveState.player;
  // Scramble team link (Founder 2026-06-22 data-integrity fix): stamp the TEAM
  // identity onto the round so the feed/scorecard/profile attribute it to the team
  // ("The Chuds logged…") not the logger, group it per team, and show all members.
  var _isScr = liveState.format === "scramble" || liveState.format === "scramble4";
  var _scrTeam = (_isScr && liveState.scrambleTeamId && typeof PB !== "undefined" && PB.getScrambleTeams)
    ? PB.getScrambleTeams().find(function(t){ return t.id === liveState.scrambleTeamId; }) : null;
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
    scrambleTeamId: _isScr ? (liveState.scrambleTeamId || null) : undefined,
    teamName: _scrTeam ? _scrTeam.name : undefined,
    teamMembers: _scrTeam ? (_scrTeam.members || []).slice() : undefined,
    teamMemberNames: _scrTeam ? (_scrTeam.members || []).map(function(mid){ var mp = PB.getPlayer(mid); if (mp && (mp.name||mp.username)) return mp.name||mp.username; if (typeof fbMemberCache !== "undefined" && fbMemberCache[mid]) return fbMemberCache[mid].name||fbMemberCache[mid].username; return mid; }) : undefined,
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
    // Personal best check — v8.24.47 (founder-approved fix): compare against
    // _pbPriorBest, the snapshot taken BEFORE PB.addRound() committed this
    // round (same snapshot the confetti uses). The old code re-read the best
    // AFTER the round was added, so a new best compared against itself and
    // the award never paid out. The 9-hole slice(0,-1) workaround is replaced
    // by the same snapshot for symmetry (it assumed the new round is always
    // LAST in the list — true today, but the snapshot doesn't have to assume).
    if (!is9h && _pbPriorBest && _pbPriorBest.score && totalScore < _pbPriorBest.score) {
      awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_18h, "personal_best", "New PB (18H): " + totalScore + " at " + liveState.course, "pb_" + round.id);
    } else if (is9h && _pbPriorBest && _pbPriorBest.score && totalScore < _pbPriorBest.score) {
      awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_9h, "personal_best_9h", "New PB (9H): " + totalScore, "pb9_" + round.id);
    }
  }

  // v8.24.48 — rounds-in-chat option B (Founder decision 2026-06-11): a
  // finished LIVE round drops one quiet chip into the league chat — the
  // conversation starter, not an announcement. Private rounds never post;
  // the league can switch the whole thing off (settings.roundsInChat=false,
  // cached on window by loadActiveLeagueName; missing = ON). Manual
  // backfilled logs intentionally do not post (old dates make weird chat).
  if (db && currentUser && round && round.visibility !== "private"
      && window._activeLeagueRoundsInChat !== false
      && liveState.format !== "scramble" && liveState.format !== "scramble4") {
    var _chipScore = totalScore + (completed < 18 ? " (9H)" : "");
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(),
      type: "round_chip",
      text: _chipScore + " at " + (liveState.course || "the course"),
      roundId: round.id,
      authorId: currentUser.uid,
      authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Member",
      createdAt: fsTimestamp()
    })).catch(function(){});
  }

  // task #31 — confetti + Caddy toast when this round beats the prior personal
  // best. Independent of the ParCoin award block above (economy code untouched,
  // AMD-018 gate 4). pbCelebrate self-guards: no-op under prefers-reduced-motion
  // and throttled so the 'best' key can't fire twice within 30s. The typeof
  // guard keeps this path safe if confetti.js isn't in the bundle yet.
  if (_pbPriorBest && _pbPriorBest.score && totalScore < _pbPriorBest.score) {
    if (typeof window.pbCelebrate === "function") window.pbCelebrate({ key: "best" });
    if (typeof PB !== "undefined" && PB && typeof PB.toast === "function") {
      PB.toast({ type: "success", eyebrow: "The Caddy", message: "New personal best!" });
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

