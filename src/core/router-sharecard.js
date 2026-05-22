// Share card system: round share, range/scramble/event canvas. Extracted per W1.A5.

// ========== SHARE ROUND CARD ==========

// Populate the hidden 1080x1080 pbShareTemplate with a round's data.
// Returns true if template was populated successfully.
function populateShareTemplateForRound(round) {
  if (!round) return false;
  // Apply user's active theme colors to the share template
  var tpl = document.getElementById("pbShareTemplate");
  if (tpl) {
    var bg = cssVar("--bg") || "#070b10";
    var gold = cssVar("--gold") || "#c9a84c";
    var cream = cssVar("--cream") || "#eae8e0";
    tpl.style.background = bg;
    tpl.style.color = cream;
    // Update brand name color
    var brandEl = tpl.querySelector(".pbs-brand-name");
    if (brandEl) brandEl.style.color = gold;
    // Update score diff colors
    var diffPos = tpl.querySelector(".pbs-diff-pos");
    if (diffPos) diffPos.style.color = gold;
    // Update stat labels
    tpl.querySelectorAll(".pbs-stat-lbl").forEach(function(el) { el.style.color = cssVar("--muted") || "#3d4a5c"; });
    tpl.querySelectorAll(".pbs-tot").forEach(function(el) { el.style.background = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.08)"; el.style.borderColor = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.2)"; });
    tpl.querySelectorAll(".pbs-tot-lbl").forEach(function(el) { el.style.color = gold; });
    tpl.querySelectorAll(".pbs-hn").forEach(function(el) { el.style.color = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.6)"; });
  }
  var course = PB.getCourseByName(round.course);
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var diffStr = diff > 0 ? "+" + diff : diff === 0 ? "E" : "" + diff;
  var playerName = round.playerName || (currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh");
  var holeScores = round.holeScores || [];
  // Par source priority: round.holePars > course.holes > defaultPars
  var holesData = [];
  if (round.holePars && round.holePars.length) {
    holesData = round.holePars.map(function(p) { return { par: p }; });
  } else if (course && course.holes && course.holes.length) {
    holesData = course.holes;
  }
  var teeName = round.tee || (course ? course.tee : "") || "";
  var teeYards = round.yards || (course ? course.yards : 0) || 0;
  var defaultPars = round.holePars || [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

  // Compute FIR/GIR/putts
  var firCount = 0, girCount = 0, totalPutts = 0, firHoles = 0, completed = 0;
  for (var i = 0; i < holeScores.length; i++) {
    if (holeScores[i] === "" || holeScores[i] === undefined) continue;
    completed++;
    var par = (holesData[i] && holesData[i].par) ? holesData[i].par : defaultPars[i] || 4;
    if (par !== 3 && round.firData && round.firData[i]) firCount++;
    if (par !== 3) firHoles++;
    if (round.girData && round.girData[i]) girCount++;
    if (round.puttsData && round.puttsData[i]) totalPutts += round.puttsData[i];
  }

  var comm = PB.generateRoundCommentary({score:round.score, rating:round.rating||72, slope:round.slope||113});
  var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");

  // Populate hidden template elements
  var isScramble = round.format === "scramble" || round.format === "scramble4";
  var teamMembersEl = document.getElementById("pbs-team-members");
  if (isScramble) {
    // Find team and show team name + members
    var allRounds = PB.getRounds().filter(function(r){ return r.course === round.course && r.date === round.date && (r.format === "scramble" || r.format === "scramble4"); });
    var memberNames = allRounds.map(function(r){ return r.playerName; }).filter(Boolean);
    if (memberNames.indexOf(playerName) === -1) memberNames.unshift(playerName);
    var teamObj = PB.getScrambleTeams().find(function(t){ return memberNames.some(function(pn){ return t.members.some(function(mid){ var mp = PB.getPlayer(mid); return mp && mp.name === pn; }); }); });
    var teamName = teamObj ? teamObj.name : "Scramble Team";
    document.getElementById("pbs-player-name").textContent = teamName;
    if (teamMembersEl) { teamMembersEl.textContent = memberNames.join(", "); teamMembersEl.style.display = ""; }
  } else {
    document.getElementById("pbs-player-name").textContent = playerName || "—";
    if (teamMembersEl) { teamMembersEl.textContent = ""; teamMembersEl.style.display = "none"; }
  }
  document.getElementById("pbs-course").textContent = round.course || "—";
  var teeEl = document.getElementById("pbs-tee-info");
  if (teeEl) {
    var teeParts = [teeName, teeYards ? teeYards.toLocaleString() + " yds" : ""];
    if (round.format && round.format !== "stroke") {
      var fmtLabel = round.format === "scramble" ? "Scramble" : round.format === "scramble4" ? "4-Man Scramble" : round.format.charAt(0).toUpperCase() + round.format.slice(1);
      teeParts.push(fmtLabel);
    }
    if (round.holesPlayed && round.holesPlayed <= 9) {
      teeParts.push(round.holesMode === "back9" ? "Back 9" : "Front 9");
    }
    var teeStr = teeParts.filter(Boolean).join(" · ");
    teeEl.textContent = teeStr;
    teeEl.style.display = teeStr ? "" : "none";
  }
  document.getElementById("pbs-score").textContent = round.score;
  var diffEl = document.getElementById("pbs-diff");
  diffEl.textContent = diffStr;
  diffEl.className = "pbs-diff " + (diffStr.charAt(0) === "+" ? "pbs-diff-pos" : diffStr === "E" ? "pbs-diff-even" : "pbs-diff-neg");

  var statsEl = document.getElementById("pbs-stats-row");
  var statsHTML = "";
  if (firHoles > 0 && firCount > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + firCount + "/" + firHoles + '</div><div class="pbs-stat-lbl">FIR</div></div>';
  if (completed > 0 && girCount > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + girCount + "/" + completed + '</div><div class="pbs-stat-lbl">GIR</div></div>';
  if (totalPutts > 0 && round.puttsData && round.puttsData.some(function(p){return p > 0;})) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + totalPutts + '</div><div class="pbs-stat-lbl">Putts</div></div>';
  statsEl.innerHTML = statsHTML;

  document.getElementById("pbs-quip").textContent = quip ? "\u201C" + quip + "\u201D" : "";

  var scEl = document.getElementById("pbs-scorecard");
  var played = holeScores.filter(function(s){ return s !== "" && s !== undefined; }).length;
  if (played > 0) {
    scEl.innerHTML = buildScorecardHTML(holeScores, holesData, defaultPars, played);
  } else {
    scEl.innerHTML = "";
  }
  return true;
}

function showShareCard(score, diffStr, course, playerName, fir, firHoles, gir, holes, putts, shareText, roundId, holeScores, holesData, teeName, teeYards) {
  holeScores = holeScores || [];
  holesData  = holesData  || [];
  window._currentShareRoundId = roundId || null;
  var defaultPars = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var comm = PB.generateRoundCommentary({score:score, rating:72, slope:113});
  var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");

  // ── Populate the hidden template ──────────────────────────────
  document.getElementById("pbs-player-name").textContent = playerName || "—";
  document.getElementById("pbs-course").textContent      = course     || "—";

  // Tee + yards subtitle
  var teeEl = document.getElementById("pbs-tee-info");
  if (teeEl) {
    var teeStr = [teeName, teeYards ? teeYards.toLocaleString() + " yds" : ""].filter(Boolean).join(" · ");
    teeEl.textContent = teeStr;
    teeEl.style.display = teeStr ? "" : "none";
  }

  document.getElementById("pbs-score").textContent       = score;

  var diffEl = document.getElementById("pbs-diff");
  diffEl.textContent = diffStr || "";
  diffEl.className   = "pbs-diff " + (diffStr && diffStr.charAt(0) === "+" ? "pbs-diff-pos" : diffStr === "E" ? "pbs-diff-even" : "pbs-diff-neg");

  // Stats
  var statsEl = document.getElementById("pbs-stats-row");
  var statsHTML = "";
  if (firHoles > 0 && fir > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + fir + "/" + firHoles + "</div><div class=\"pbs-stat-lbl\">FIR</div></div>";
  if ((holes||18) > 0 && gir > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + gir + "/" + (holes||18) + "</div><div class=\"pbs-stat-lbl\">GIR</div></div>";
  if (putts > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + putts + "</div><div class=\"pbs-stat-lbl\">Putts</div></div>";
  statsEl.innerHTML = statsHTML;

  // Quip
  document.getElementById("pbs-quip").textContent = quip ? "\u201C" + quip + "\u201D" : "";

  // Scorecard
  var scEl = document.getElementById("pbs-scorecard");
  var played = holeScores.filter(function(s){return s !== "" && s !== undefined;}).length;
  if (played > 0) {
    scEl.innerHTML = buildScorecardHTML(holeScores, holesData, defaultPars, played);
  } else {
    scEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.3);font-size:16px;padding:20px 0">No hole-by-hole data — log with Play Now to see your scorecard here</div>';
  }

  // ── Show full-page share card ────────────────────────────────────
  var existing = document.getElementById("shareCardModal");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = "shareCardModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:300;overflow-y:auto;background:var(--bg);-webkit-overflow-scrolling:touch";

  var h = '';
  h += '<div style="width:100%;max-width:400px;margin:0 auto;padding:16px 16px 40px">';

  // ── Close / back button ──
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
  h += '<button onclick="closeShareCard()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:4px 0">← Back</button>';
  h += '</div>';

  // ── Header ──
  h += '<div style="text-align:center;margin-bottom:20px">';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px">'
        + '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><path d="M3 14V2" stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round"/><path d="M3 2l8 3-8 3" fill="rgba(var(--gold-rgb),.25)" stroke="var(--gold)" stroke-width="1.4" stroke-linejoin="round"/></svg>'
        + '<div style="font-size:20px;font-weight:700;color:var(--cream)">Your Scorecard</div>'
        + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);line-height:1.5">Share to Instagram, iMessage, or anywhere else</div>';
  h += '</div>';

  // ── Preview card ──
  h += '<div id="pbsPreviewWrap" style="width:100%;border-radius:12px;overflow:hidden;background:var(--grad-deep);box-shadow:0 8px 40px rgba(0,0,0,.6);margin-bottom:20px">';
  h += '<div style="transform:scale(0.315);transform-origin:top left;width:1080px;height:1080px;pointer-events:none" id="pbsPreviewInner"></div>';
  h += '</div>';

  // ── Action label ──
  h += '<div style="font-size:11px;color:var(--muted2);text-align:center;margin-bottom:10px;letter-spacing:.3px">Tap to save your scorecard as an image</div>';

  // ── Buttons ──
  h += '<div style="display:flex;flex-direction:column;gap:10px">';
  h += '<button class="btn full green" onclick="captureShareCard()" style="font-size:14px;padding:16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;width:100%"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 4l1-2h3l1 2" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>Save image &amp; share to socials</button>';
  h += '<button class="btn full outline" onclick="closeShareCard()" style="font-size:13px;padding:14px">Done</button>';
  h += '</div>';

  // ── Reassurance ──
  h += '<div style="font-size:10px;color:var(--muted2);text-align:center;margin-top:14px;opacity:.6">You can always reshare from your Round History</div>';
  h += '</div>';

  modal.innerHTML = h;
  document.body.appendChild(modal);

  // Set preview wrap height to match 31.5% of 1080
  var wrap = document.getElementById("pbsPreviewWrap");
  if (wrap) wrap.style.height = Math.round(1080 * 0.315) + "px";

  // Clone the template into the preview
  var previewInner = document.getElementById("pbsPreviewInner");
  var template = document.getElementById("pbShareTemplate");
  if (previewInner && template) {
    previewInner.innerHTML = template.innerHTML;
  }

  // Party games
  if (db) {
    var today = localDateStr();
    db.collection("partygames").where("roundDate","==",today).where("status","==","completed").get().then(function(snap) {
      if (snap.empty) return;
      var qEl = document.getElementById("pbs-quip");
      if (!qEl) return;
      var gameLines = "";
      snap.forEach(function(doc) {
        var g = doc.data();
        var game = PARTY_GAMES.find(function(pg){return pg.id===g.gameType})||{name:g.gameType};
        gameLines += "\n" + game.name + ": " + escHtml(g.winnerName||"TBD");
      });
      if (gameLines && qEl.textContent) qEl.textContent += gameLines;
    }).catch(function(){});
  }
}

function buildScorecardHTML(holeScores, holesData, defaultPars, played) {
  function getPar(i) {
    if (holesData && holesData[i] && holesData[i].par) return holesData[i].par;
    return defaultPars[i] || 4;
  }

  // Determine which nines have data
  var front9count = 0, back9count = 0;
  for (var fi = 0; fi < 9; fi++) { if (holeScores[fi] !== "" && holeScores[fi] !== undefined) front9count++; }
  for (var bi = 9; bi < 18; bi++) { if (holeScores[bi] !== "" && holeScores[bi] !== undefined) back9count++; }

  var is9only = (front9count > 0 && back9count === 0) || (back9count > 0 && front9count === 0);

  // Fixed-size container for each score symbol — prevents overflow
  var W = 'rgba(255,255,255,.88)';
  var F = 'display:flex;align-items:center;justify-content:center;';

  // Larger symbols for 9-hole cards
  var symScale = is9only ? 1.3 : 1;

  function num(n, size) { return '<span style="font-size:' + Math.round(size * symScale) + 'px;font-weight:700;color:#fff;line-height:1">' + n + '</span>'; }

  function sym(score, par) {
    var n = parseInt(score), d = n - par;
    // Font size scales down for 2+ digit scores to prevent overflow
    var baseSize = n >= 10 ? 16 : 20;
    var smallSize = n >= 10 ? 12 : 14;
    var outerW = Math.round(46 * symScale), innerW = Math.round(30 * symScale);
    var birdW = Math.round(38 * symScale), bogW = Math.round(38 * symScale);
    var shape;
    if (d <= -2) {
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:50%;border:2px solid ' + W + '">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:50%;border:2px solid ' + W + '">' + num(n, smallSize) + '</div></div>';
    } else if (d === -1) {
      shape = '<div style="' + F + 'width:' + birdW + 'px;height:' + birdW + 'px;border-radius:50%;border:2px solid ' + W + '">' + num(n, baseSize) + '</div>';
    } else if (d === 0) {
      shape = num(n, baseSize + 2);
    } else if (d === 1) {
      shape = '<div style="' + F + 'width:' + bogW + 'px;height:' + bogW + 'px;border-radius:3px;border:2px solid ' + W + '">' + num(n, baseSize) + '</div>';
    } else if (d === 2) {
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:3px;border:2px solid ' + W + '">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:2px;border:2px solid ' + W + '">' + num(n, smallSize) + '</div></div>';
    } else {
      var ts = n >= 10 ? 11 : 13;
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:3px;border:2px solid rgba(255,255,255,.45)">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:2px;border:2px solid rgba(255,255,255,.45)">' + num(n, ts) + '</div></div>';
    }
    var cellW = Math.round(54 * symScale);
    return '<div style="' + F + 'width:' + cellW + 'px;height:' + cellW + 'px;flex-shrink:0;overflow:visible">' + shape + '</div>';
  }

  function nineHTML(start, label) {
    var count = 0;
    for (var ci = start; ci < start + 9; ci++) { if (holeScores[ci] !== "" && holeScores[ci] !== undefined) count++; }
    if (count === 0) return "";

    // 9-hole card: larger cells, bigger hole numbers
    var cellPad = is9only ? "12px 5px 14px" : "8px 3px 10px";
    var cellMinH = is9only ? "110px" : "82px";
    var hnSize = is9only ? "14px" : "10px";

    var html = '<div class="pbs-nine">';
    var total = 0, totalPar = 0;
    for (var i = 0; i < 9; i++) {
      var hi = start + i, s = holeScores[hi], par = getPar(hi);
      var hasScore = s !== "" && s !== undefined;
      if (hasScore) { total += parseInt(s); totalPar += par; }
      html += '<div class="pbs-cell" style="padding:' + cellPad + ';min-height:' + cellMinH + '"><div class="pbs-hn" style="font-size:' + hnSize + '">' + (hi + 1) + '</div>';
      html += '<div class="pbs-sw">' + (hasScore ? sym(s, par) : "") + '</div></div>';
    }
    var over = total - totalPar, tc = over > 0 ? "pbs-tot-pos" : over < 0 ? "pbs-tot-neg" : "pbs-tot-even";
    var totW = is9only ? "90px" : "76px";
    var totValSize = is9only ? "38px" : "32px";
    html += '<div class="pbs-tot" style="width:' + totW + '"><div class="pbs-tot-lbl">' + label + '</div><div class="pbs-tot-val ' + tc + '" style="font-size:' + totValSize + '">' + (total||"—") + '</div></div></div>';
    return html;
  }

  var html = "";
  if (front9count > 0) html += nineHTML(0, "F9");
  if (back9count > 0) html += nineHTML(9, "B9");
  return html;
}

function captureShareCard() {
  var template = document.getElementById("pbShareTemplate");
  if (!template || typeof html2canvas === "undefined") {
    Router.toast("Share not available — try updating the app");
    return;
  }
  Router.toast("Generating image...");
  // Briefly make visible at its actual size so html2canvas can capture it
  template.style.left = "-1080px";
  template.style.visibility = "visible";

  document.fonts.ready.then(function() {
    html2canvas(template.querySelector(".pbs-inner") || template, {
      scale: 1,
      width: 1080,
      height: 1080,
      backgroundColor: "#090d14",
      useCORS: false,
      logging: false,
      allowTaint: true
    }).then(function(canvas) {
      template.style.left = "-9999px";
      template.style.visibility = "";
      canvas.toBlob(function(blob) {
        if (!blob) { Router.toast("Couldn't generate image"); return; }

        // ── Track share count + check achievements ──────────────────────
        // Only count 1 share per unique round — no inflation from re-downloads
        if (!window._sharedRoundIds) window._sharedRoundIds = {};
        var rid = window._currentShareRoundId;
        var isNewShare = rid && !window._sharedRoundIds[rid];
        if (isNewShare) {
          window._sharedRoundIds[rid] = true;
          var shareCount = (window._pbShareCount || 0) + 1;
          window._pbShareCount = shareCount;
          if (db && currentUser) {
            db.collection("members").doc(currentUser.uid).update({
              shareCount: firebase.firestore.FieldValue.increment(1),
              sharedRounds: firebase.firestore.FieldValue.arrayUnion(rid)
            }).catch(function(){});
          }
          var shareMilestones = {1:"share_1", 5:"share_5", 10:"share_10", 25:"share_25", 50:"share_50", 100:"share_100"};
          if (shareMilestones[shareCount]) {
            var achId = shareMilestones[shareCount];
            var allAch = getAllPossibleAchievements();
            var ach = allAch.find(function(a){return a.id===achId;});
            if (ach) Router.toast("Achievement unlocked: " + ach.name + " +" + ach.xp + " XP");
          }
        }
        var file = new File([blob], "parbaughs-scorecard.png", {type:"image/png"});
        if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
          navigator.share({files:[file], title:"The Parbaughs Scorecard"})
            .then(function() { showShareSuccess(); })
            .catch(function(){ downloadScorecardImage(blob); showShareSuccess(); });
        } else {
          downloadScorecardImage(blob);
          showShareSuccess();
        }
      }, "image/png");
    }).catch(function(e) {
      template.style.left = "-9999px";
      template.style.visibility = "";
      console.error("html2canvas error:", e);
      Router.toast("Couldn't generate image");
    });
  });
}
function showRoundShareCard(roundId) {
  // Navigate to round detail page where the scorecard preview is embedded
  Router.go("rounds", {roundId: roundId});
}

// ── Generic share image modal — used by all contexts ─────────────────────────
var _rangeReviewState = {}; // Set by endRangeSession()

function showShareImageModal(drawFn, filename) {
  var existing = document.getElementById("shareCardModal");
  if (existing) existing.remove();
  var modal = document.createElement("div");
  modal.id = "shareCardModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:300;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center;padding:20px;padding-top:40px";
  modal.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,.7)" onclick="closeShareCard()"></div>'
    + '<div style="position:relative;width:100%;max-width:320px">'
    + '<canvas id="genericShareCanvas" style="width:100%;border-radius:12px;display:block;box-shadow:0 8px 32px rgba(0,0,0,.6)"></canvas>'
    + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
    + '<button class="btn full green" onclick="shareGenericCanvas(\'' + (filename||'parbaughs.png') + '\')" style="font-size:13px">Save as image</button>'
    + '<button class="btn full outline" onclick="closeShareCard()" style="font-size:12px">Done</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function() { drawFn(document.getElementById("genericShareCanvas")); }, 60);
}

function shareGenericCanvas(filename) {
  var canvas = document.getElementById("genericShareCanvas");
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    if (!blob) return;
    var file = new File([blob], filename, {type:"image/png"});
    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
      navigator.share({files:[file], title:(window._activeLeagueName || "Parbaughs")}).catch(function(){ downloadScorecardImage(blob); });
    } else { downloadScorecardImage(blob); }
  }, "image/png");
}

// ── CSS Variable resolver for Canvas 2D API ─────────────────────────────────
// Canvas 2D ctx.fillStyle/strokeStyle cannot resolve CSS variables directly.
// This helper reads computed values so canvas share cards stay theme-aware.
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function cssRgba(rgbVarName, alpha) {
  return 'rgba(' + cssVar(rgbVarName) + ',' + alpha + ')';
}

// ── Range session share card ──────────────────────────────────────────────────
function showRangeShareCard() {
  var s = _rangeReviewState;
  showShareImageModal(function(canvas) {
    drawRangeCanvas(canvas, s.elapsed||0, s.xp||0, s.drillNames||[], s.focus||"", s.feel||0);
  }, "parbaughs-range.png");
}

function drawRangeCanvas(canvas, elapsed, xp, drillNames, focus, feel) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");

  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18'), PINK=cssVar('--pink');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--pink-rgb','.06')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, S-48, S-48);

  // Brand
  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.fillStyle = PINK; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("RANGE SESSION", S/2, 112);

  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 130); ctx.lineTo(S-80, 130); ctx.stroke();

  // Time
  var mins = Math.round(elapsed/60); if (mins < 1) mins = 1;
  var m = Math.floor(mins); var secs = elapsed - m*60;
  var timeStr = m + ":" + (secs < 10 ? "0" : "") + secs;
  ctx.fillStyle = GOLD; ctx.font = "800 160px 'Helvetica Neue',Arial,sans-serif";
  ctx.textAlign = "center"; ctx.fillText(timeStr, S/2, 320);
  ctx.fillStyle = MUTED; ctx.font = "500 24px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("time on range", S/2, 360);

  // XP
  if (xp) {
    ctx.fillStyle = GOLD; ctx.font = "700 44px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("+" + xp + " XP", S/2, 430);
  }

  // Focus
  if (focus) {
    ctx.fillStyle = CREAM; ctx.font = "600 28px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("Focus: " + focus, S/2, 500);
  }

  // Feel
  var feelLabel = ["","Rough","Solid","Dialed"][feel] || "";
  var feelColor = [MUTED,cssVar('--red'),CREAM,GOLD][feel] || MUTED;
  if (feelLabel) {
    ctx.fillStyle = feelColor; ctx.font = "600 24px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText(feelLabel, S/2, 548);
  }

  // Drills
  if (drillNames.length) {
    var dy = 610;
    ctx.fillStyle = MUTED; ctx.font = "500 17px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("DRILLS WORKED", S/2, dy);
    drillNames.slice(0,5).forEach(function(n) {
      dy += 40;
      ctx.fillStyle = CREAM; ctx.font = "400 22px 'Helvetica Neue',Arial,sans-serif";
      ctx.fillText(n, S/2, dy);
    });
  }

  // Footer
  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80, S-56, S-160, 1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

// ── Scramble round share card ─────────────────────────────────────────────────
function showScrambleShareCard(teamName, score, course, format) {
  showShareImageModal(function(canvas) {
    drawScrambleCanvas(canvas, teamName, score, course, format);
  }, "parbaughs-scramble.png");
}

function drawScrambleCanvas(canvas, teamName, score, course, format) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");
  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18');
  var par = 72; var diff = score - par;
  var diffStr = diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
  var diffColor = diff > 0 ? cssVar('--red') : diff < 0 ? cssVar('--live') : GOLD;
  ctx.fillStyle = BG; ctx.fillRect(0,0,S,S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--gold-rgb','.05')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3; ctx.strokeRect(24,24,S-48,S-48);

  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.fillStyle = MUTED; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("SCRAMBLE", S/2, 112);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80,130); ctx.lineTo(S-80,130); ctx.stroke();

  ctx.fillStyle = CREAM; ctx.font = "800 160px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText(score, S/2, 320);
  ctx.fillStyle = diffColor; ctx.font = "700 48px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText(diffStr, S/2, 386);
  ctx.fillStyle = CREAM; ctx.font = "600 32px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText(teamName || "Team", S/2, 456);
  ctx.fillStyle = MUTED; ctx.font = "400 22px 'Helvetica Neue',Arial,sans-serif";
  var cText = (course||"").length > 32 ? (course||"").substring(0,32)+"…" : (course||"");
  ctx.fillText(cText, S/2, 496);
  if (format) { ctx.fillStyle = GOLD; ctx.font = "500 18px 'Helvetica Neue',Arial,sans-serif"; ctx.fillText(format.toUpperCase(), S/2, 536); }

  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80,S-56,S-160,1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

// ── Event leaderboard share card ──────────────────────────────────────────────
function showEventShareCard(eventName, standings) {
  showShareImageModal(function(canvas) {
    drawEventCanvas(canvas, eventName, standings);
  }, "parbaughs-event.png");
}

function drawEventCanvas(canvas, eventName, standings) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");
  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18');
  ctx.fillStyle = BG; ctx.fillRect(0,0,S,S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--gold-rgb','.05')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3; ctx.strokeRect(24,24,S-48,S-48);

  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80,100); ctx.lineTo(S-80,100); ctx.stroke();

  // Event name
  ctx.fillStyle = CREAM; ctx.font = "700 46px 'Helvetica Neue',Arial,sans-serif";
  var eName = (eventName||"Event").length > 24 ? (eventName||"Event").substring(0,24)+"…" : (eventName||"Event");
  ctx.fillText(eName, S/2, 178);

  // Standings
  var medals = ["#1","#2","#3"];
  var medalColors = [GOLD,cssVar('--medal-silver'),cssVar('--medal-bronze'),MUTED,MUTED,MUTED];
  var sy = 260;
  (standings || []).slice(0,6).forEach(function(s, i) {
    var isWinner = i === 0;
    var rowH = isWinner ? 112 : 80;
    var pad = 48;
    ctx.fillStyle = isWinner ? cssRgba('--gold-rgb','.08') : "rgba(255,255,255,.02)";
    roundRectFill(ctx, pad, sy, S - pad*2, rowH - 8, 8);
    if (isWinner) {
      ctx.strokeStyle = cssRgba('--gold-rgb','.2'); ctx.lineWidth = 1;
      roundRectStroke(ctx, pad, sy, S - pad*2, rowH - 8, 8);
    }
    ctx.fillStyle = medalColors[i] || MUTED;
    ctx.font = (isWinner ? "800" : "600") + " " + (isWinner ? 36 : 26) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText((i+1)+".", pad + 24, sy + (isWinner ? 44 : 32));
    ctx.fillStyle = isWinner ? CREAM : MUTED;
    ctx.font = (isWinner ? "700" : "500") + " " + (isWinner ? 34 : 26) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText(s.name||"", pad + 80, sy + (isWinner ? 44 : 32));
    ctx.fillStyle = medalColors[i] || MUTED;
    ctx.font = (isWinner ? "800" : "700") + " " + (isWinner ? 38 : 28) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.textAlign = "right";
    ctx.fillText((s.pts||0) + " pts", S - pad - 24, sy + (isWinner ? 44 : 32));
    sy += rowH;
  });

  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80,S-56,S-160,1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.fill();
}
function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.stroke();
}

function copyShareText() {
  var ta = document.getElementById("shareCardText");
  if (ta) {
    ta.style.left = "0";
    ta.select();
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ta.value).then(function() { Router.toast("Copied!"); });
      } else {
        document.execCommand("copy");
        Router.toast("Copied!");
      }
    } catch(e) { Router.toast("Couldn't copy — long press to select"); }
    ta.style.left = "-9999px";
  }
}

function closeShareCard() {
  var modal = document.getElementById("shareCardModal");
  if (modal) modal.remove();
  Router.go("rounds");
}

function showShareSuccess() {
  var modal = document.getElementById("shareCardModal");
  if (!modal) return;
  modal.innerHTML = '<div style="position:relative;width:100%;max-width:360px;text-align:center;padding-top:120px">' +
    '<div style="margin-bottom:16px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--birdie)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg></div>' +
    '<div style="font-size:22px;font-weight:700;color:var(--gold);margin-bottom:8px">SUCCESS</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-bottom:24px">Scorecard saved! Share it everywhere.</div>' +
    '<button class="btn full green" onclick="closeShareCard()" style="max-width:280px;margin:0 auto">Done</button>' +
    '</div>';
}


