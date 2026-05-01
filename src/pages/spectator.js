/* ════════════════════════════════════════════════════════════════════════
   Spectator HUD shell (Ship 4a Gate 2 of 9 — v8.13.2)
   ════════════════════════════════════════════════════════════════════════
   Hosts the SpectatorHUD experience for OTHER members' active rounds.
   Composed via PB.spectator.renderHUDShell(round) which emits HTML for the
   Page Shell content slot (HQ) or inline render (mobile) per round.js's
   _renderRoundPage dispatch (Gate 1).

   Composition (Ship 4a multi-gate):
     Gate 2 (this) — HeroScorePanel ('live-page' mode, in home.js per Option 1C)
                     + Gate 3-5 placeholders
     Gate 3 — PerHoleStrip component
     Gate 4 — StatsPanel + CoursePanel
     Gate 5 — RecentShotsFeed
     Gate 6 — Real-time spectator listener + completion handling
     Gate 7 — Connection state escalation (D2 5-state machine) + F3 player offline
     Gate 8 — Spotlight visual upgrade + mobile band layouts
     Gate 9 — Final consolidated review

   Architecture decision (Ship 4a Gate 2 Call 5 — Option 1C):
     HeroScorePanel rendering lives in home.js (where 'live-card' mode already
     lives). spectator.js is the consumer — calls _renderLiveRoundSecondary
     with mode='live-page' to render the HUD hero. Avoids coupling production-
     stable v8.11.10/v8.11.11 code to newly-introduced spectator.js code.
   ════════════════════════════════════════════════════════════════════════ */

// Render full SpectatorHUD shell HTML. Round is the Firestore /liverounds/ doc
// with status='active' and ownership !== currentUser.uid.
function _renderSpectatorHUDShell(round) {
  if (!round) return '';
  var h = '';

  // Hero score panel — calls home.js _renderLiveRoundSecondary in 'live-page' mode.
  // Per Gate 0 Option 1C: home.js owns the rendering; spectator.js consumes.
  if (typeof _renderLiveRoundSecondary === "function") {
    h += _renderLiveRoundSecondary({ mode: 'live-page', round: round });
  }

  // Gate 3-5 placeholders. Mono mute-2 11px text per v8.13.0 placeholder convention.
  // Each placeholder occupies a logical section of the HUD; replaced as gates ship.
  var placeholderStyle = 'padding:24px 0;border-top:1px solid var(--cb-chalk-3);margin-top:24px';
  var labelStyle = 'font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-mute-2)';

  // v8.13.3 Gate 3 — PerHoleStrip lands here. Wrapper preserved for visual
  // rhythm consistency with remaining Gate 4-5 placeholders.
  h += '<div style="' + placeholderStyle + '">' + _renderPerHoleStrip(round, 'live') + '</div>';
  // v8.13.5 Gate 4 — StatsPanel + CoursePanel land here.
  h += '<div style="' + placeholderStyle + '">' + _renderStatsPanel(round, 'live') + '</div>';
  h += '<div style="' + placeholderStyle + '">' + _renderCoursePanel(round) + '</div>';
  // v8.13.6 Gate 5 — RecentShotsFeed lands here.
  h += '<div style="' + placeholderStyle + '">' + _renderRecentShotsFeed(round, 'live') + '</div>';

  return h;
}

// v8.13.3 — Per-hole detail strip for Spectator HUD (Ship 4a Gate 3 of 9).
// Renders 18 cells: hole-num eyebrow + score + to-par diff. Cell BG color
// classifies score-to-par per design C2 (par chalk-3, bogey+ claret 10%,
// birdie moss 20%, eagle+ brass 40%). Current hole gets brass left-border
// + pulsing ◉ dot; future holes get static dot indicator. Mobile stacks
// to two rows of 9 via CSS flex-wrap. Front/back visual break via
// nth-child(9) margin-right (CSS).
//
// Per-hole pars NOT in /liverounds/ doc per Gate 0 audit + v8.11.11
// finding. defaultPar approximation [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5]
// used for to-par calculation. Established pattern across 5 prior render
// sites in the codebase.
//
// mode parameter accepted for future extensibility:
//   'live'   (Gate 3, this) — read scores from round Firestore doc
//   'scoring' (future)      — playnow.js scoring UI replacement
//   'static'  (Ship 7)      — RoundDetail page read-only display
// Gate 3 implements 'live' only; defensive empty render for other modes.
function _renderPerHoleStrip(round, mode) {
  if (mode !== 'live') return ''; // Future modes Gate 3 doesn't implement
  if (!round) return '';

  var scores = Array.isArray(round.scores) ? round.scores : [];
  var currentHole = (typeof round.currentHole === "number") ? round.currentHole : 0;
  var thru = (typeof round.thru === "number") ? round.thru : 0;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

  function classifyScore(score, par) {
    if (score === null || score === undefined || score === "") return null;
    var n = parseInt(score, 10);
    if (isNaN(n)) return null;
    var diff = n - par;
    if (diff <= -2) return 'eagle';
    if (diff === -1) return 'birdie';
    if (diff === 0) return 'par';
    return 'bogey'; // bogey or worse
  }

  function formatDiff(score, par) {
    if (score === null || score === undefined || score === "") return '';
    var n = parseInt(score, 10);
    if (isNaN(n)) return '';
    var diff = n - par;
    if (diff === 0) return 'E';
    if (diff > 0) return '+' + diff;
    return String(diff);
  }

  var h = '<div class="phs-strip"><div class="phs-row">';
  for (var i = 0; i < 18; i++) {
    var par = defaultPar[i] || 4;
    var score = scores[i];
    var classification = classifyScore(score, par);
    var isCurrent = i === currentHole && thru < 18;
    var isFuture = i > currentHole - 1 && i >= thru;
    var hasScore = score !== null && score !== undefined && score !== "";

    var classes = ['phs-cell'];
    if (classification) classes.push('phs-cell--' + classification);
    if (isCurrent) classes.push('phs-cell--current');
    else if (isFuture && !hasScore) classes.push('phs-cell--future');

    h += '<div class="' + classes.join(' ') + '">';
    h += '<div class="phs-hole-num">' + (i + 1) + '</div>';
    if (hasScore) {
      h += '<div class="phs-score">' + escHtml(String(score)) + '</div>';
      h += '<div class="phs-diff">' + escHtml(formatDiff(score, par)) + '</div>';
    } else {
      // Empty cell — no score/diff text. Current/future indicator via ::before pseudo-element.
      h += '<div class="phs-score">—</div>';
    }
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}

// v8.13.5 — StatsPanel for Spectator HUD (Ship 4a Gate 4 of 9).
// Two stacked 3-column grids:
//   Top row    — FRONT 9 | BACK 9 | TOTAL (score + diff + pace+proj under TOTAL)
//   Bottom row — GIR | PUTTS | FIR (aggregate stats, thru-aware)
//
// Calculation conventions per Gate 0 audit:
//   - defaultPar [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5] (front 36 + back 36 = 72)
//     used for all section diffs. Consistent with PerHoleStrip + 4 other render
//     sites. Per-hole pars NOT in /liverounds/ doc.
//   - scores[]/putts[] are STRINGS ("" empty / number-string) — parseInt required.
//   - fir[]/gir[] are booleans.
//   - thru === 0: render section + "—" placeholders (don't hide).
//   - Pace+proj: render only when 0 < thru < 18.
//   - FIR: par-3 holes excluded (no fairway-in-regulation concept on par-3).
//
// mode parameter: 'live' for Gate 4. Future modes ('scoring', 'static') return ''.
function _renderStatsPanel(round, mode) {
  if (mode !== 'live') return '';
  if (!round) return '';

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var scores = Array.isArray(round.scores) ? round.scores : [];
  var fir = Array.isArray(round.fir) ? round.fir : [];
  var gir = Array.isArray(round.gir) ? round.gir : [];
  var putts = Array.isArray(round.putts) ? round.putts : [];
  var thru = (typeof round.thru === "number") ? round.thru : 0;

  // Sum scores in [start, end) bounded by thru. Coerces "" / non-numeric to 0.
  function sumScores(start, end) {
    var sum = 0;
    var endCap = Math.min(end, thru);
    for (var i = start; i < endCap; i++) {
      var s = scores[i];
      if (s === "" || s === null || s === undefined) continue;
      var n = parseInt(s, 10);
      if (!isNaN(n)) sum += n;
    }
    return sum;
  }

  // Sum defaultPar in [start, end) bounded by thru.
  function sumPar(start, end) {
    var sum = 0;
    var endCap = Math.min(end, thru);
    for (var i = start; i < endCap; i++) sum += defaultPar[i] || 4;
    return sum;
  }

  function diffStr(played, score, par) {
    if (played <= 0) return "—";
    var d = score - par;
    if (d === 0) return "E";
    return (d > 0 ? "+" : "") + d;
  }

  var front9Played = Math.min(9, thru);
  var back9Played = Math.max(0, thru - 9);
  var front9Score = sumScores(0, 9);
  var back9Score = sumScores(9, 18);
  var totalScore = sumScores(0, 18);
  var front9Par = sumPar(0, 9);
  var back9Par = sumPar(9, 18);
  var totalPar = front9Par + back9Par;

  var front9Diff = diffStr(front9Played, front9Score, front9Par);
  var back9Diff = diffStr(back9Played, back9Score, back9Par);
  var totalDiff = diffStr(thru, totalScore, totalPar);

  // Pace+proj only when 0 < thru < 18 (per design C3 + Call 5).
  var paceProjStr = "";
  if (thru > 0 && thru < 18) {
    var pace = totalScore / thru;
    var proj = Math.round(totalScore + pace * (18 - thru));
    paceProjStr = "PACE " + pace.toFixed(1) + "/HOLE · PROJ " + proj;
  }

  // GIR: count of true booleans in gir[0..thru-1] / thru
  function girStr() {
    if (thru <= 0) return "—";
    var hits = 0;
    for (var i = 0; i < thru; i++) if (gir[i]) hits++;
    return hits + "/" + thru;
  }

  // PUTTS: avg putts per hole among holes with non-empty putts entry
  function puttsStr() {
    if (thru <= 0) return "—";
    var sum = 0, count = 0;
    for (var i = 0; i < thru; i++) {
      var p = putts[i];
      if (p === "" || p === null || p === undefined) continue;
      var n = parseInt(p, 10);
      if (!isNaN(n)) { sum += n; count++; }
    }
    if (count === 0) return "—";
    return (sum / count).toFixed(1);
  }

  // FIR: hits / eligible (par-4/5 holes only) per Call 4
  function firStr() {
    if (thru <= 0) return "—";
    var hits = 0, eligible = 0;
    for (var i = 0; i < thru; i++) {
      if (defaultPar[i] === 3) continue;
      eligible++;
      if (fir[i]) hits++;
    }
    if (eligible === 0) return "—";
    return hits + "/" + eligible;
  }

  function scoreStr(played, score) {
    return played > 0 ? String(score) : "—";
  }

  var h = '<div class="sp-panel">';
  h += '<div class="sp-row sp-row-top">';
  h += '<div class="sp-cell"><div class="sp-label">FRONT 9</div><div class="sp-value">' + scoreStr(front9Played, front9Score) + '</div><div class="sp-diff">' + front9Diff + '</div></div>';
  h += '<div class="sp-cell"><div class="sp-label">BACK 9</div><div class="sp-value">' + scoreStr(back9Played, back9Score) + '</div><div class="sp-diff">' + back9Diff + '</div></div>';
  h += '<div class="sp-cell"><div class="sp-label">TOTAL</div><div class="sp-value">' + scoreStr(thru, totalScore) + '</div><div class="sp-diff">' + totalDiff + '</div>';
  if (paceProjStr) h += '<div class="sp-pace">' + paceProjStr + '</div>';
  h += '</div>';
  h += '</div>';
  h += '<div class="sp-row sp-row-bottom">';
  h += '<div class="sp-cell"><div class="sp-label">GIR</div><div class="sp-substat">' + girStr() + '</div></div>';
  h += '<div class="sp-cell"><div class="sp-label">PUTTS / HOLE</div><div class="sp-substat">' + puttsStr() + '</div></div>';
  h += '<div class="sp-cell"><div class="sp-label">FIR</div><div class="sp-substat">' + firStr() + '</div></div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// v8.13.5 — CoursePanel for Spectator HUD (Ship 4a Gate 4 of 9).
// Course name + tee/yardage/par meta-line + async weather strip.
//
// Yardage strategy (per Gate 0 audit Call 11 — Option A):
//   /liverounds/ doc lacks `yards` field. Fall through to in-memory PB.getCourse
//   lookup → match round.tee against course.allTees[].name → read .yards.
//   Synchronous (PB state cached from data.js); ~5 lines defensive code.
//
// Weather strip (per Gate 0 audit Call 1):
//   PB.weather.getCourseDisplay({lat, lng}) accepts arbitrary coords (v8.11.3).
//   Course doc has c.lat/c.lng (data.js:278-279). Sentinel 0/0 returns null.
//   Async DOM patch via setTimeout(50ms) — HTML is in DOM by the time the
//   callback fires. Pattern mirrors home.js:_initWeatherDisplays:302.
function _renderCoursePanel(round) {
  if (!round) return '';

  var courseName = round.course || "";
  var teeName = round.tee || "";
  var par = (typeof round.par === "number") ? round.par : 72;
  var courseId = round.courseId || "";

  // Yardage via PB.getCourse → allTees lookup (Option A).
  var courseDoc = (typeof PB !== "undefined" && PB.getCourse && courseId) ? PB.getCourse(courseId) : null;
  var teeData = (courseDoc && courseDoc.allTees) ? courseDoc.allTees.find(function(t) { return t.name === teeName; }) : null;
  var yardage = (teeData && teeData.yards) ? teeData.yards : null;

  // Build mono meta-line: TEE · YDS · PAR. Yardage segment dropped if unavailable.
  var metaParts = [];
  if (teeName) metaParts.push(teeName.toUpperCase());
  if (yardage) metaParts.push(yardage + " YDS");
  metaParts.push("PAR " + par);
  var metaLine = metaParts.join(" · ");

  // Weather strip placeholder. roundId is unique per round (set by playnow.js
  // genId at round start); fall back to playerId for pre-v8.13.0 docs lacking
  // roundId field (memory #20 self-healing window).
  var weatherKey = (round.roundId || round.playerId || "").toString().replace(/[^a-zA-Z0-9_-]/g, "");
  var weatherId = "cp-weather-" + weatherKey;

  var h = '<div class="cp-panel">';
  h += '<div class="cp-name">' + escHtml(courseName) + '</div>';
  h += '<div class="cp-meta">' + escHtml(metaLine) + '</div>';
  h += '<div class="cp-weather" id="' + weatherId + '"></div>';
  h += '</div>';

  // Async weather DOM patch. setTimeout(50ms) gives DOM insertion time to land.
  // Defensive: bail if PB.weather missing, course coords unset/sentinel, or
  // element no longer in DOM (user navigated away). Silent failure on all paths
  // — empty weather strip is acceptable graceful degradation.
  if (courseDoc && typeof courseDoc.lat === "number" && typeof courseDoc.lng === "number"
      && typeof PB !== "undefined" && PB.weather && typeof PB.weather.getCourseDisplay === "function") {
    setTimeout(function() {
      try {
        PB.weather.getCourseDisplay(
          { lat: courseDoc.lat, lng: courseDoc.lng, name: courseName },
          { format: "pill", includeWind: false }
        ).then(function(w) {
          if (!w) return;
          var el = document.getElementById(weatherId);
          if (el) el.textContent = w.displayString;
        });
      } catch (e) { /* silent — weather strip degrades gracefully */ }
    }, 50);
  }

  return h;
}

// v8.13.6 — Recent Shots Feed for Spectator HUD (Ship 4a Gate 5 of 9).
//
// generateShotEntry(holeIndex, round) — pure function. Deterministic given
// inputs. Returns { eyebrow, sentence } shape per design B2 two-line entry,
// or null when the hole is unscored / invalid (caller skips). No DOM, no
// side effects. Gate 6 calls this on each listener-emission diff hit to
// produce a new entry, then prepends to the live feed array with animation.
//
// Schema interpretation (Gate 0 audit findings):
//   - scores[]/putts[] are STRINGS (parseInt + NaN guard required)
//   - fir[]/gir[] are booleans
//   - bunker[]/sand[]/upDown[] are TRI-STATE: null=unanswered, true=yes,
//     false=no. Templates use === true / === false comparisons (truthy
//     check misclassifies false as unanswered).
//   - miss[] is string ("left"/"right"/"long"/"short") OR null. Only
//     populated when GIR === false.
//   - penalty[] is number (default 0).
//   - Per-hole timestamps are NOT in /liverounds/ doc. Eyebrow omits time.
//
// Templates: 13 conditional branches across 5 classifications, each with
// default fall-through to terse classification name. Voice is founding-crew
// neutral-observational — factual, not cheerleading or pity.
function generateShotEntry(holeIndex, round) {
  if (!round) return null;
  if (typeof holeIndex !== "number" || holeIndex < 0 || holeIndex >= 18) return null;

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var par = defaultPar[holeIndex] || 4;

  // Score: required. Empty/non-numeric returns null (caller skips entry).
  var scoreRaw = (Array.isArray(round.scores) && round.scores[holeIndex] !== undefined) ? round.scores[holeIndex] : "";
  if (scoreRaw === "" || scoreRaw === null || scoreRaw === undefined) return null;
  var score = parseInt(scoreRaw, 10);
  if (isNaN(score)) return null;

  var diff = score - par;

  // Optional advanced stats. Defensive defaults preserve template fall-through
  // semantics (missing data → terse default, never crash).
  var gir = Array.isArray(round.gir) ? !!round.gir[holeIndex] : false;
  var puttsRaw = (Array.isArray(round.putts) && round.putts[holeIndex] !== undefined) ? round.putts[holeIndex] : "";
  var putts = (puttsRaw === "" || puttsRaw === null || puttsRaw === undefined) ? null : parseInt(puttsRaw, 10);
  if (putts !== null && isNaN(putts)) putts = null;
  var sand = Array.isArray(round.sand) ? round.sand[holeIndex] : null;
  var upDown = Array.isArray(round.upDown) ? round.upDown[holeIndex] : null;
  var miss = Array.isArray(round.miss) ? round.miss[holeIndex] : null;
  var penalty = (Array.isArray(round.penalty) && typeof round.penalty[holeIndex] === "number") ? round.penalty[holeIndex] : 0;

  var eyebrow = "HOLE " + (holeIndex + 1) + " · PAR " + par;
  var sentence;

  if (diff <= -2) {
    // EAGLE+ classification
    if (score === 1) sentence = "Aced it.";
    else if (diff <= -3) sentence = "Albatross. Three under par.";
    else sentence = "Eagle.";
  } else if (diff === -1) {
    // BIRDIE classification
    if (gir && putts === 1) sentence = "Stuck it close. One-putt birdie.";
    else if (gir && putts === 2) sentence = "Hit the green and rolled it in for birdie.";
    else if (!gir && putts === 1) sentence = "Holed it from off the green for birdie.";
    else sentence = "Birdie.";
  } else if (diff === 0) {
    // PAR classification
    if (gir && putts === 1) sentence = "Hit and held. One-putt par.";
    else if (gir && (putts === null || putts >= 2)) sentence = "Routine par.";
    else if (sand === true) sentence = "Sand save for par.";
    else if (!gir && upDown === true) sentence = "Up-and-down for par.";
    else sentence = "Par.";
  } else if (diff === 1) {
    // BOGEY classification
    if (penalty > 0) sentence = "Penalty stroke. Bogey.";
    else if (putts !== null && putts >= 3) sentence = "Three-putted. Bogey.";
    else if (!gir && upDown === false) sentence = "Missed up-and-down for bogey.";
    else if (!gir && miss) sentence = "Missed it " + miss + ". Bogey.";
    else sentence = "Bogey.";
  } else {
    // DOUBLE+ classification (diff >= 2)
    if (penalty >= 2) sentence = "Multiple penalties. Double bogey or worse.";
    else if (diff === 2) sentence = "Double bogey.";
    else if (diff >= 3) sentence = "Triple bogey or worse.";
    else sentence = "Double bogey or worse.";
  }

  return { eyebrow: eyebrow, sentence: sentence };
}

// _renderRecentShotsFeed(round, mode) — static render of the recent-shots
// feed for Spectator HUD. Gate 5 ships static-from-fetch only; Gate 6
// will wire OTHER-user listener emissions to prepend new entries with
// animation per design D1 (300ms slide + 4s brass settle).
//
// Iterates played holes [0..thru-1], generates editorial entries via
// generateShotEntry, reverses for most-recent-first, caps at 10. Empty
// state (thru === 0) renders mute-2 placeholder — section never hides
// for visual rhythm consistency with surrounding HUD components.
function _renderRecentShotsFeed(round, mode) {
  if (mode !== 'live') return '';
  if (!round) return '';

  var thru = (typeof round.thru === "number") ? round.thru : 0;
  if (thru <= 0) {
    return '<div class="rsf-feed"><div class="rsf-empty">RECENT SHOTS · NONE YET</div></div>';
  }

  var entries = [];
  for (var i = 0; i < thru; i++) {
    var entry = generateShotEntry(i, round);
    if (entry) entries.push(entry);
  }
  // Most-recent-first, cap at 10
  entries = entries.reverse().slice(0, 10);

  if (entries.length === 0) {
    // Defensive: thru > 0 but no valid scores resolved (corrupt data?)
    return '<div class="rsf-feed"><div class="rsf-empty">RECENT SHOTS · NONE YET</div></div>';
  }

  var h = '<div class="rsf-feed">';
  for (var j = 0; j < entries.length; j++) {
    var e = entries[j];
    h += '<div class="rsf-entry">';
    h += '<div class="rsf-eyebrow">' + escHtml(e.eyebrow) + '</div>';
    h += '<div class="rsf-sentence">' + escHtml(e.sentence) + '</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// Attach to PB namespace for round.js consumption.
// generateShotEntry exposed for Gate 6 listener-emission diff reuse.
if (typeof PB !== "undefined") {
  PB.spectator = {
    renderHUDShell: _renderSpectatorHUDShell,
    generateShotEntry: generateShotEntry
  };
}
