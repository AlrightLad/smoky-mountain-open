// ========== WATCH ROUND (spectator live view) ==========
var _watchRoundUid = null;

Router.register("watchround", function(params) {
  _watchRoundUid = params && params.uid ? params.uid : null;
  if (!_watchRoundUid) { Router.go("home"); return; }
  renderWatchRound();
});

function renderWatchRound() {
  var uid = _watchRoundUid;
  var member = onlineMembers[uid];
  var el = document.querySelector('[data-page="watchround"]');
  if (!el) return;

  if (!member || !member.liveRound || !member.liveRound.course) {
    el.innerHTML = '<div class="sh"><h2>Watch Round</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div><div style="padding:40px 16px;text-align:center;font-size:12px;color:var(--muted)">This player has finished their round or is no longer active.</div>';
    return;
  }

  var lr = member.liveRound;
  var name = member.name || "Player";
  var scores = lr.holeScores || Array(18).fill("");
  var pars = lr.holePars || [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var currentHole = (lr.hole || 1) - 1; // 0-indexed
  var thru = lr.thru || 0;
  var totalScore = scores.filter(function(s){return s!==""}).reduce(function(a,b){return a+parseInt(b)},0);
  var parThru = 0; for (var i=0;i<thru;i++) parThru += pars[i]||4;
  var diff = thru > 0 ? totalScore - parThru : 0;
  var diffStr = thru === 0 ? "—" : diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
  var diffColor = diff < 0 ? "var(--birdie)" : diff > 0 ? "var(--red)" : "var(--muted)";

  var h = '<div style="padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">';
  h += '<div><button class="back" onclick="Router.go(\'home\')" style="margin-bottom:4px">← Back</button><div style="font-size:13px;font-weight:600">' + escHtml(name) + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + escHtml(lr.course) + (lr.tee ? ' · ' + escHtml(lr.tee) : '') + ' · ' + escHtml(lr.format || "stroke") + '</div></div>';
  h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:26px;font-weight:700;color:' + diffColor + '">' + diffStr + '</div>';
  h += '<div style="font-size:9px;color:var(--muted)">' + (thru > 0 ? 'Thru ' + thru : 'Not started') + '</div>';
  h += '<div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:2px"><div style="width:5px;height:5px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite"></div><span style="font-size:9px;color:var(--live);font-weight:600">LIVE</span></div>';
  h += '</div></div>';

  // Current hole indicator
  if (thru < 18) {
    h += '<div style="padding:8px 16px;background:rgba(var(--gold-rgb),.06);border-bottom:1px solid var(--border);font-size:11px;color:var(--gold);text-align:center">';
    h += '<svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>';
    h += 'Currently on hole ' + (currentHole + 1) + ' · Par ' + (pars[currentHole] || 4);
    h += '</div>';
  }

  // Scorecard — front 9
  h += '<div style="padding:14px 16px 0">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Scorecard</div>';

  function renderNine(startHole, label) {
    var nineTotal = 0, ninePar = 0;
    var row = '<div style="margin-bottom:12px">';
    row += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">' + label + '</div>';
    row += '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:2px;text-align:center">';
    // Hole numbers header
    for (var hh = startHole; hh < startHole + 9; hh++) {
      row += '<div style="font-size:8px;color:var(--muted2);padding:2px 0">' + (hh+1) + '</div>';
    }
    row += '<div style="font-size:8px;color:var(--muted2);padding:2px 0">TOT</div>';
    // Par row
    for (var ph = startHole; ph < startHole + 9; ph++) {
      var p = pars[ph] || 4;
      ninePar += p;
      row += '<div style="font-size:8px;color:var(--muted);padding:2px 0">' + p + '</div>';
    }
    row += '<div style="font-size:8px;color:var(--muted);padding:2px 0">' + ninePar + '</div>';
    // Score row
    for (var sh = startHole; sh < startHole + 9; sh++) {
      var sc = scores[sh];
      var isActive = sh === currentHole && thru <= sh;
      var par = pars[sh] || 4;
      var d = sc !== "" ? parseInt(sc) - par : null;
      var bg = "transparent", color = "var(--cream)", border = "transparent";
      if (isActive) { border = "var(--gold)"; color = "var(--gold)"; }
      else if (sc === "") { color = "var(--muted2)"; }
      else if (d !== null) {
        if (d <= -2) { bg = "rgba(var(--gold-rgb),.25)"; color = "var(--gold)"; }
        else if (d === -1) { bg = "rgba(var(--birdie-rgb),.2)"; color = "var(--birdie)"; }
        else if (d === 0) { color = "var(--cream)"; }
        else if (d === 1) { bg = "rgba(var(--red-rgb),.15)"; color = "var(--red)"; }
        else { bg = "rgba(var(--red-rgb),.3)"; color = "var(--red)"; }
      }
      if (sc !== "") nineTotal += parseInt(sc);
      row += '<div style="font-size:12px;font-weight:700;color:' + color + ';background:' + bg + ';border:1px solid ' + border + ';border-radius:4px;padding:5px 2px;min-height:28px;display:flex;align-items:center;justify-content:center">';
      row += sc !== "" ? sc : (isActive ? '<svg viewBox="0 0 8 10" width="8" height="10" fill="currentColor"><polygon points="0,0 8,5 0,10"/></svg>' : '<span style="color:var(--border)">·</span>');
      row += '</div>';
    }
    var totalColor = nineTotal === ninePar ? "var(--cream)" : nineTotal < ninePar ? "var(--birdie)" : "var(--red)";
    row += '<div style="font-size:12px;font-weight:700;color:' + totalColor + ';background:var(--bg3);border-radius:4px;padding:5px 2px;min-height:28px;display:flex;align-items:center;justify-content:center">' + (nineTotal > 0 ? nineTotal : '—') + '</div>';
    row += '</div></div>';
    return row;
  }

  h += renderNine(0, "Front 9");
  h += renderNine(9, "Back 9");

  // Total row
  var grandPar = pars.reduce(function(a,b){return a+(b||4)},0);
  h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg3);border-radius:8px;margin-top:4px">';
  h += '<span style="font-size:11px;color:var(--muted)">Total · Par ' + grandPar + '</span>';
  h += '<span style="font-size:18px;font-weight:700;color:' + diffColor + '">' + (thru > 0 ? totalScore : "—") + ' (' + diffStr + ')</span>';
  h += '</div>';

  h += '</div>'; // end padding div

  // Refresh hint
  h += '<div style="padding:16px;text-align:center;font-size:10px;color:var(--muted2)">Updates automatically as scores are entered</div>';

  el.innerHTML = h;
}

// Re-render watch page when presence updates
var _origRenderOnline = null;
function hookWatchRoundRefresh() {
  // Called after presence listener fires — if watching a round, re-render it
  if (Router.getPage() === "watchround" && _watchRoundUid) {
    renderWatchRound();
  }
}
