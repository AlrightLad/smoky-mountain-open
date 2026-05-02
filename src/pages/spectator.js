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
// v8.13.7 — Cell rendering refactored into module-level helpers so Gate 6
// surgical single-cell updates and full-strip render share one code path.
// Full-strip output is byte-identical to the prior closure-based version.
var _phsDefaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

function _phsClassifyScore(score, par) {
  if (score === null || score === undefined || score === "") return null;
  var n = parseInt(score, 10);
  if (isNaN(n)) return null;
  var diff = n - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  return 'bogey'; // bogey or worse
}

function _phsFormatDiff(score, par) {
  if (score === null || score === undefined || score === "") return '';
  var n = parseInt(score, 10);
  if (isNaN(n)) return '';
  var diff = n - par;
  if (diff === 0) return 'E';
  if (diff > 0) return '+' + diff;
  return String(diff);
}

// Compute CSS classes for a single phs cell. Used by full-strip render
// AND surgical single-cell update on Gate 6 listener emission diff hit.
function _computePhsCellClasses(holeIndex, round) {
  var par = _phsDefaultPar[holeIndex] || 4;
  var scores = Array.isArray(round.scores) ? round.scores : [];
  var score = scores[holeIndex];
  var classification = _phsClassifyScore(score, par);
  var currentHole = (typeof round.currentHole === "number") ? round.currentHole : 0;
  var thru = (typeof round.thru === "number") ? round.thru : 0;
  var isCurrent = holeIndex === currentHole && thru < 18;
  var isFuture = holeIndex > currentHole - 1 && holeIndex >= thru;
  var hasScore = score !== null && score !== undefined && score !== "";

  var classes = ['phs-cell'];
  if (classification) classes.push('phs-cell--' + classification);
  if (isCurrent) classes.push('phs-cell--current');
  else if (isFuture && !hasScore) classes.push('phs-cell--future');
  return classes.join(' ');
}

// Render INNER HTML of a single phs cell (excludes the wrapping div). Used
// by full-strip render AND surgical single-cell update.
function _renderPhsCellHTML(holeIndex, round) {
  var par = _phsDefaultPar[holeIndex] || 4;
  var scores = Array.isArray(round.scores) ? round.scores : [];
  var score = scores[holeIndex];
  var hasScore = score !== null && score !== undefined && score !== "";

  var h = '<div class="phs-hole-num">' + (holeIndex + 1) + '</div>';
  if (hasScore) {
    h += '<div class="phs-score">' + escHtml(String(score)) + '</div>';
    h += '<div class="phs-diff">' + escHtml(_phsFormatDiff(score, par)) + '</div>';
  } else {
    // Empty cell — no score/diff text. Current/future indicator via ::before pseudo-element.
    h += '<div class="phs-score">—</div>';
  }
  return h;
}

function _renderPerHoleStrip(round, mode) {
  if (mode !== 'live') return ''; // Future modes Gate 3 doesn't implement
  if (!round) return '';

  var h = '<div class="phs-strip"><div class="phs-row">';
  for (var i = 0; i < 18; i++) {
    h += '<div class="' + _computePhsCellClasses(i, round) + '">' + _renderPhsCellHTML(i, round) + '</div>';
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

// ════════════════════════════════════════════════════════════════════════
// v8.13.7 — Real-time spectator listener (Ship 4a Gate 6 of 9)
// ════════════════════════════════════════════════════════════════════════
// Subscribes to /liverounds/{otherUid} on Spectator HUD entry. Diff state
// machine identifies newly-completed holes, hero changes, and status flips
// across emissions. Drives surgical DOM updates per design ruling D1:
//   - 300ms slide-down on new RecentShotsFeed entries
//   - 4s brass left-border settle (--duration-settle)
//   - 200ms Pattern A cross-fade on hero diff/thru changes
//   - 400ms fade-in on PerHoleStrip cell update (--duration-slow)
//
// Lifecycle (attach/detach symmetry):
//   - attach: round.js _renderSpectatorHUDPlaceholder calls
//             PB.spectator.attachListener(roundId, otherUid) post-render
//   - detach: 4 exit paths — back nav, dispatch change, beforeunload,
//             status-flip ("completed" → in-place final mode;
//                          "abandoned" → re-route via Router.go)
//
// CTO Part 1 spec fixes encoded:
//   FIX 1 — detach BEFORE Router.go re-dispatch on abandoned status flip
//           (avoid race where late emission re-triggers re-route)
//   FIX 2 — parent inline-position captured + restored explicitly per
//           cross-fade unit; relative-position management refcounted
//           across simultaneous diff/thru fades to avoid stuck mutation
//   FIX 3 — console.info (not console.debug) for emission instrumentation
//           so smoke test observability doesn't require verbose log toggle
// ════════════════════════════════════════════════════════════════════════

// ── Gate 7 constants (v8.13.8 · D2 connection-state + F3 host-presence) ──
var STALE_THRESHOLD_MS = 10 * 60 * 1000;          // 10 min — matches home.js own-user staleness convention
var WATCHDOG_TICK_MS = 30 * 1000;                  // 30s — fast detection, negligible battery cost
var RECOVERY_DEBOUNCE_MS = 5000;                   // 5s exit-debounce — suppresses strobe on flaky networks
var HOST_PRESENCE_STALE_MS = 10 * 60 * 1000;       // 10 min — matches router.js onlineMembers convention
var MAX_RETRY_ATTEMPTS = 10;                       // After 10, surface "failed" chrome; user must refresh
var RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000];

function _attachSpectatorListener(roundId, otherUid) {
  if (typeof db === "undefined" || !db || !roundId || !otherUid) return;
  // Detach prior state symmetrically — covers dispatch-change-to-different-round.
  _detachSpectatorListener();

  // Gate 7 — extended state shape: 7 v8.13.7 fields + 9 Gate 7 fields = 16 total.
  // EVERY field added to this object MUST register cleanup in _detachSpectatorListener
  // in the SAME commit (pattern enforcement — see memory rule).
  window._spectatorState = {
    // v8.13.7 fields
    roundId: roundId,
    otherUid: otherUid,
    unsub: null,
    prevScored: new Set(),
    prevStatus: "active",
    prevHero: null,
    pendingFirstEmission: true,
    // Gate 7 D2 connection-state
    lastEmissionAt: Date.now(),                    // attach moment treated as initial signal
    connectionState: "live",
    watchdogId: null,
    retryAttempt: 0,
    retryTimerId: null,
    // Gate 7 F3 host-presence
    hostOnline: true,                              // defensive default — assume online if presence lookup fails
    hostLastSeenAt: 0,
    presenceUnsub: null,
    // Gate 7 chrome state
    lastChromeKey: "live",
    recoveryDebounceTimer: null
  };

  // Mirror playnow.js attachLiveRoundsListener's 800ms first-emission flag.
  setTimeout(function() {
    if (window._spectatorState) window._spectatorState.pendingFirstEmission = false;
  }, 800);

  // Liverounds listener — uses Gate 7 error handler for state-tracked recovery.
  try {
    window._spectatorState.unsub = db.collection("liverounds").doc(otherUid).onSnapshot(
      _handleSpectatorEmission,
      function(err) { _handleListenerError(err, "liverounds"); }
    );
  } catch (e) {
    if (typeof pbWarn === "function") pbWarn("listener:spectator:attach-failed:", e.message);
  }

  // Gate 7 — Presence listener for F3 host-online detection. Decoupled from
  // router.js _presenceUnsub (which only attaches on Home page; not guaranteed
  // for spectators arriving via deep-link to /round/:roundId).
  try {
    window._spectatorState.presenceUnsub = db.collection("presence").doc(otherUid).onSnapshot(
      _handlePresenceEmission,
      function(err) { _handleListenerError(err, "presence"); }
    );
  } catch (e) {
    if (typeof pbWarn === "function") pbWarn("listener:spectator-presence:attach-failed:", e.message);
  }

  // Gate 7 — Watchdog timer for D2 stale detection. 30s tick, 10-min threshold.
  window._spectatorState.watchdogId = setInterval(_watchdogTick, WATCHDOG_TICK_MS);
}

// Single gatekeeper for all spectator HUD cleanup. Every exit path funnels
// through this function. Adding a field to _spectatorState requires adding
// the matching teardown line here in the SAME commit (memory rule).
function _detachSpectatorListener() {
  if (!window._spectatorState) return;
  var state = window._spectatorState;

  // v8.13.7 — liverounds listener
  if (typeof state.unsub === "function") {
    try { state.unsub(); } catch (e) { /* silent */ }
  }

  // Gate 7 — presence listener
  if (typeof state.presenceUnsub === "function") {
    try { state.presenceUnsub(); } catch (e) { /* silent */ }
  }

  // Gate 7 — watchdog timer
  if (state.watchdogId !== null) {
    clearInterval(state.watchdogId);
  }

  // Gate 7 — retry backoff timer
  if (state.retryTimerId !== null) {
    clearTimeout(state.retryTimerId);
  }

  // Gate 7 — recovery debounce timer
  if (state.recoveryDebounceTimer !== null) {
    clearTimeout(state.recoveryDebounceTimer);
  }

  window._spectatorState = null;
}

// ──────────────────────────────────────────────────────────────────────────
// Gate 7 — D2 connection-state machine + F3 host-presence handlers
// ──────────────────────────────────────────────────────────────────────────

// Watchdog: 30s tick. Compares Date.now() - lastEmissionAt against 10-min
// threshold. Fires "stale" chrome when threshold breached AND status active
// AND currently in live state (transitions only from live → stale; other
// transitions handled elsewhere).
function _watchdogTick() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.connectionState !== "live") return;
  if (state.prevStatus !== "active") return;
  var age = Date.now() - state.lastEmissionAt;
  if (age > STALE_THRESHOLD_MS) {
    state.connectionState = "stale";
    _applyChrome(_resolveChromeKey(state));
  }
}

// Presence emission handler — F3 host-online detection per Q5 BOTH-signals rule.
// hostOnline = (presence.online === true) AND (lastSeen NOT stale beyond 10min).
// Mobile force-close case: app killed by iOS, beforeunload didn't fire, online
// stays true forever — but lastSeen ages out, so OR'd staleness check catches it.
function _handlePresenceEmission(snap) {
  var state = window._spectatorState;
  if (!state) return;

  if (!snap.exists) {
    // No presence doc — host never logged in / doc deleted.
    state.hostOnline = false;
    state.hostLastSeenAt = 0;
  } else {
    var data = snap.data();
    var lastSeenMs = (data && data.lastSeen && data.lastSeen.toMillis) ? data.lastSeen.toMillis() : 0;
    state.hostLastSeenAt = lastSeenMs;
    var stale = lastSeenMs > 0 && (Date.now() - lastSeenMs > HOST_PRESENCE_STALE_MS);
    state.hostOnline = (data && data.online === true) && !stale;
  }
  _applyChrome(_resolveChromeKey(state));
}

// Listener error handler with state transition + exponential backoff re-subscribe.
// Per Q6: liverounds errors transition connectionState; presence errors log only
// (default hostOnline=true means F3 doesn't false-trigger when presence lookup
// fails — watchdog drives D2 stale detection regardless).
function _handleListenerError(err, listenerType) {
  if (typeof pbWarn === "function") {
    pbWarn("listener:spectator-" + listenerType + ":error", err && err.message);
  }
  if (listenerType !== "liverounds") return;
  var state = window._spectatorState;
  if (!state) return;
  state.connectionState = "disconnected";
  _applyChrome(_resolveChromeKey(state));
  _scheduleReSubscribe();
}

// Exponential backoff re-subscribe. Cap at 10 attempts, then surface "failed"
// chrome — battery + Firestore read cost protection. retryAttempt resets to 0
// on successful emission post-resubscribe (see _handleSpectatorEmission below).
function _scheduleReSubscribe() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.retryAttempt >= MAX_RETRY_ATTEMPTS) {
    state.connectionState = "failed";
    _applyChrome(_resolveChromeKey(state));
    return;
  }
  var delay = RETRY_DELAYS_MS[state.retryAttempt] || 30000;
  state.connectionState = "reconnecting";
  _applyChrome(_resolveChromeKey(state));

  state.retryTimerId = setTimeout(function() {
    var s = window._spectatorState;
    if (!s) return;  // detached during backoff
    s.retryAttempt++;
    s.retryTimerId = null;
    try {
      s.unsub = db.collection("liverounds").doc(s.otherUid).onSnapshot(
        _handleSpectatorEmission,
        function(err) { _handleListenerError(err, "liverounds"); }
      );
    } catch (e) {
      if (typeof pbWarn === "function") pbWarn("listener:spectator:resubscribe-failed:", e.message);
      _scheduleReSubscribe();  // recurse with incremented retry
    }
  }, delay);
}

// 5s exit-debounce — every emission resets the timer. After 5s of held
// emissions in non-live state, flip back to live. Suppresses strobe on
// flaky networks per Q4.
function _scheduleRecoveryDebounce() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.recoveryDebounceTimer !== null) {
    clearTimeout(state.recoveryDebounceTimer);
  }
  state.recoveryDebounceTimer = setTimeout(function() {
    var s = window._spectatorState;
    if (!s) return;
    s.recoveryDebounceTimer = null;
    s.connectionState = "live";
    _applyChrome(_resolveChromeKey(s));
  }, RECOVERY_DEBOUNCE_MS);
}

// Chrome resolution — single source of truth. Host-offline takes priority
// over connection state per audit reasoning (host being offline is the
// relevant fact; spectator's connection irrelevant when no data is coming).
function _resolveChromeKey(state) {
  if (!state) return "live";
  if (!state.hostOnline) return "host-offline";
  if (state.connectionState === "failed") return "failed";
  if (state.connectionState === "disconnected") return "disconnected";
  if (state.connectionState === "reconnecting") return "reconnecting";
  if (state.connectionState === "stale") return "stale";
  return "live";
}

// Chrome renderer — idempotent via lastChromeKey guard. Only mutates DOM
// when the resolved chrome key changes. CTO Q1 corrections encoded:
//   - "stale" caption: "LAST UPDATE X MIN AGO" (no "CONNECTION MAY BE SLOW" tail)
//   - "host-offline" caption: "PLAYER NOT CONNECTED" (no "WILL RESUME" tail)
//   - "failed" caption: "CONNECTION FAILED · REFRESH TO RETRY" (instructional tail kept)
function _applyChrome(key) {
  var state = window._spectatorState;
  if (!state) return;
  if (key === state.lastChromeKey) return;  // idempotency
  state.lastChromeKey = key;

  var eyebrow = document.querySelector('.sphud-hero-eyebrow');
  var card = document.querySelector('.sphud-hero-card');
  var caption = document.getElementById('live-round-caption');

  // Reset modifier classes — clean slate before applying per-key chrome.
  if (eyebrow) {
    eyebrow.classList.remove('sphud-hero-eyebrow--alert');
    eyebrow.classList.remove('sphud-hero-eyebrow--mute');
  }
  if (card) card.classList.remove('sphud-hero-card--dimmed');
  if (caption) { caption.innerHTML = ""; caption.style.cssText = ""; }

  if (key === "live") {
    if (eyebrow) eyebrow.textContent = "VIEWING · LIVE";
    return;
  }
  if (key === "stale") {
    if (eyebrow) eyebrow.textContent = "VIEWING · LIVE";  // unchanged per audit table
    if (caption) {
      var ageStr = (typeof _formatAge === "function")
        ? _formatAge(Date.now() - state.lastEmissionAt).toUpperCase()
        : "RECENTLY";
      _writeCaption("LAST UPDATE " + ageStr, "brass");
    }
    return;
  }
  if (key === "disconnected") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("CONNECTION LOST · WAITING FOR RECONNECT", "alert");
    return;
  }
  if (key === "reconnecting") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("RECONNECTING...", "brass-deep");
    return;
  }
  if (key === "failed") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("CONNECTION FAILED · REFRESH TO RETRY", "alert");
    return;
  }
  if (key === "host-offline") {
    if (eyebrow) {
      eyebrow.textContent = "PLAYER NOT CONNECTED";
      eyebrow.classList.add('sphud-hero-eyebrow--mute');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("PLAYER NOT CONNECTED", "mute");
    return;
  }
}

// Caption writer — duplicated from home.js _setLiveRoundCaption rather than
// imported. Per v8.13.7 Q1C minimal-API discipline, spectator.js stays
// self-contained on rendering primitives.
function _writeCaption(text, tone) {
  var el = document.getElementById('live-round-caption');
  if (!el) return;
  var color = tone === "alert" ? "var(--alert)"
            : tone === "mute" ? "var(--cb-mute-2)"
            : tone === "brass-deep" ? "var(--cb-brass-deep)"
            : "var(--cb-brass)";
  el.style.cssText = "font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:" + color + ";margin-top:14px";
  el.textContent = text;
}

function _handleSpectatorEmission(snap) {
  var state = window._spectatorState;
  if (!state) return;             // late emission post-detach — drop
  if (!snap.exists) return;       // F2 silent — round doc deleted

  var doc = snap.data();
  if (typeof isValidLiveRound === "function" && !isValidLiveRound(doc)) {
    if (typeof pbWarn === "function") {
      pbWarn("listener:spectator:invalid-shape", { keys: doc ? Object.keys(doc) : [] });
    }
    return;
  }

  // Gate 7 — Track emission for D2 watchdog + reset retry counter on success.
  state.lastEmissionAt = Date.now();
  state.retryAttempt = 0;
  // If we were in non-live state, schedule 5s recovery debounce per Q4.
  // Every emission resets the timer; 5 sustained seconds → flip to live.
  if (state.connectionState !== "live") {
    _scheduleRecoveryDebounce();
  }

  // Diff size + holeIndices computed up-front for instrumentation.
  var newHoleIndices = [];
  if (Array.isArray(doc.scores)) {
    for (var i = 0; i < doc.scores.length && i < 18; i++) {
      var s = doc.scores[i];
      if (s !== "" && s !== null && s !== undefined) {
        var n = parseInt(s, 10);
        if (!isNaN(n) && !state.prevScored.has(i)) newHoleIndices.push(i);
      }
    }
  }

  // FIX 3 — console.info for visibility without DevTools verbose toggle.
  console.info("[Spectator] emission", {
    roundId: state.roundId,
    otherUid: state.otherUid,
    status: doc.status,
    thru: doc.thru,
    diffSize: newHoleIndices.length,
    holeIndices: newHoleIndices,
    connectionState: state.connectionState,
    hostOnline: state.hostOnline
  });

  // ── Status-flip handling ──────────────────────────────────────────────
  if (doc.status === "completed") {
    // Gate 7 CALL SITE 6a — reset connection chrome BEFORE final-mode
    // variant renders. Otherwise eyebrow modifier classes / dimming /
    // captions from active stale/disconnected/host-offline state would
    // bleed into final-mode display.
    state.connectionState = "live";
    state.hostOnline = true;
    _applyChrome("live");
    // Final-mode in-place variant — render BEFORE detach so prevHero
    // remains available to crossFadeHero invoked inside the variant render.
    _triggerFinalModeVariant(doc);
    _detachSpectatorListener();
    return;
  }
  if (doc.status === "abandoned") {
    // Gate 7 CALL SITE 6b — reset connection chrome BEFORE Router.go
    // re-dispatch. Otherwise stale/disconnected chrome flashes during
    // the route transition before F2 abandoned chrome takes over.
    state.connectionState = "live";
    state.hostOnline = true;
    _applyChrome("live");
    // FIX 1 — detach BEFORE Router.go re-dispatch. If a late emission lands
    // mid-route while the listener is still attached, re-handler would
    // re-fire and attempt re-route again. Detach-first eliminates the race.
    _detachSpectatorListener();
    if (typeof Router !== "undefined" && typeof Router.go === "function" && doc.roundId) {
      Router.go("round", { roundId: doc.roundId }, true);
    }
    return;
  }

  // ── Active diff processing ────────────────────────────────────────────
  if (doc.status !== "active") {
    if (typeof pbWarn === "function") pbWarn("listener:spectator:unknown-status:", doc.status);
    return;
  }

  newHoleIndices.sort(function(a, b) { return a - b; });
  for (var k = 0; k < newHoleIndices.length; k++) {
    var holeIndex = newHoleIndices[k];
    var entry = generateShotEntry(holeIndex, doc);
    if (entry) {
      _prependEntryToFeed(entry);
      _surgicalUpdatePhsCell(holeIndex, doc);
    }
    state.prevScored.add(holeIndex);
  }

  // Hero cross-fade: detect any visible hero-value change.
  var newHero = _computeHeroValues(doc);
  if (state.prevHero && _heroChanged(state.prevHero, newHero)) {
    _crossFadeHero(state.prevHero, newHero);
  }
  state.prevHero = newHero;
  state.prevStatus = "active";
}

// Hero value snapshot for cross-fade comparison. Mirrors home.js
// _renderLivePageHero diff calculation (defaultPar approximation).
function _computeHeroValues(round) {
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var thru = (typeof round.thru === "number") ? round.thru : 0;
  var totalScore = (typeof round.totalScore === "number") ? round.totalScore : 0;
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) parSoFar += (defaultPar[i] || 4);
  var diff = thru > 0 ? totalScore - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));
  return { diff: diffStr, thru: thru, totalScore: totalScore };
}

function _heroChanged(prev, next) {
  return prev.diff !== next.diff || prev.thru !== next.thru;
}

// Prepend a new shot entry to the RecentShotsFeed, animate slide-down
// (300ms) and brass settle (4s via --duration-settle). Caps feed at 10.
function _prependEntryToFeed(entry) {
  var feed = document.querySelector('.rsf-feed');
  if (!feed) return;
  // Drop empty placeholder if present (transition from thru===0 → thru>0)
  var empty = feed.querySelector('.rsf-empty');
  if (empty) empty.remove();

  var div = document.createElement('div');
  div.className = 'rsf-entry rsf-entry--fresh';
  div.innerHTML = '<div class="rsf-eyebrow">' + escHtml(entry.eyebrow) + '</div>'
                + '<div class="rsf-sentence">' + escHtml(entry.sentence) + '</div>';

  feed.insertBefore(div, feed.firstChild);

  // Cap at 10 — drop overflow tail, preserves v8.13.6 most-recent-first contract.
  var entries = feed.querySelectorAll('.rsf-entry');
  for (var i = 10; i < entries.length; i++) entries[i].remove();

  // Force reflow so 300ms slide-in animation kicks in.
  void div.offsetWidth;

  // After 300ms slide finishes, transition to --settled (4s brass border fade).
  setTimeout(function() {
    if (div.parentNode) div.classList.add('rsf-entry--settled');
  }, 300);
}

// Surgical update of a single PerHoleStrip cell. Refreshes innerHTML +
// CSS classes via shared _renderPhsCellHTML/_computePhsCellClasses helpers.
// 400ms fade-in via --duration-slow.
function _surgicalUpdatePhsCell(holeIndex, round) {
  var cell = document.querySelector('.phs-row .phs-cell:nth-child(' + (holeIndex + 1) + ')');
  if (!cell) return;
  cell.innerHTML = _renderPhsCellHTML(holeIndex, round);
  cell.className = _computePhsCellClasses(holeIndex, round);
  cell.classList.add('phs-cell--fresh');
  void cell.offsetWidth;
  setTimeout(function() {
    if (cell.parentNode) cell.classList.remove('phs-cell--fresh');
  }, 400);
}

// FIX 2 — parent inline-position captured + restored per cross-fade unit.
// Refcount `pending` so the relative-position mutation is restored only
// after ALL simultaneous fades complete (.sphud-hero-diff + .sphud-hero-thru
// can both fire on a single emission). Mirrors home.js:_triggerCompletionCrossFade
// pattern but adapted for inline-span value swap (not full-card swap).
function _crossFadeHero(prevHero, newHero) {
  var diffEl = document.querySelector('.sphud-hero-diff');
  if (!diffEl) return;
  var heroParent = diffEl.parentNode;
  if (!heroParent) return;

  var originalInlinePos = heroParent.style.position;
  var needsRelative = window.getComputedStyle(heroParent).position === "static";
  if (needsRelative) heroParent.style.position = "relative";

  var pending = 0;

  function fade(cls, oldText, newText) {
    if (oldText === newText) return;
    var el = document.querySelector('.' + cls);
    if (!el) return;

    pending++;

    var newSpan = document.createElement('span');
    newSpan.className = cls;
    newSpan.textContent = newText;
    newSpan.style.position = "absolute";
    newSpan.style.left = el.offsetLeft + "px";
    newSpan.style.top = el.offsetTop + "px";
    newSpan.style.opacity = "0";
    newSpan.style.transition = "opacity 200ms ease";  // 200ms hardcoded per design ruling D1

    el.style.transition = "opacity 200ms ease";
    el.parentNode.insertBefore(newSpan, el.nextSibling);

    void newSpan.offsetWidth;

    el.style.opacity = "0";
    newSpan.style.opacity = "1";

    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
      newSpan.style.position = "";
      newSpan.style.left = "";
      newSpan.style.top = "";
      newSpan.style.opacity = "";
      newSpan.style.transition = "";
      pending--;
      // Restore parent position only after ALL pending fades complete.
      if (pending === 0 && needsRelative) {
        heroParent.style.position = originalInlinePos;
      }
    }, 250);  // 200ms transition + 50ms safety margin (mirrors home.js cross-fade pattern)
  }

  fade('sphud-hero-diff', prevHero.diff, newHero.diff);
  fade('sphud-hero-thru', ' thru ' + prevHero.thru, ' thru ' + newHero.thru);

  // Edge case: if no fades fired (no visible change after diff detected
  // upstream), restore parent position immediately.
  if (pending === 0 && needsRelative) {
    heroParent.style.position = originalInlinePos;
  }
}

// Final-mode in-place variant. Mutates SpectatorHUD content without
// Router.go re-dispatch. Per CTO Q1: spectator present at the moment of
// completion earned the live view — final mode persists for the page
// session, no auto-expiry. Listener detached after this fires.
function _triggerFinalModeVariant(doc) {
  // Gate 8a — flip editorial-mode modifier class on hero card.
  // Editorial state (.sphud-hero-card--in-progress / --completed) is independent
  // of functional state (.sphud-hero-card--dimmed) per Gate 8a Q-C ruling P1
  // editorial-vs-functional split. Both modifier-class layers coexist additively.
  var heroCard = document.querySelector('.sphud-hero-card');
  if (heroCard) {
    heroCard.classList.remove('sphud-hero-card--in-progress');
    heroCard.classList.add('sphud-hero-card--completed');
  }

  // Gate 7 — Reset all connection-state chrome before final-mode mutations.
  // Without this, eyebrow modifier classes / dimming / captions from active
  // stale/disconnected/host-offline state would bleed into final-mode display.
  var state = window._spectatorState;
  if (state) {
    state.connectionState = "live";
    state.hostOnline = true;
    state.lastChromeKey = "live";
  }
  if (typeof _applyChrome === "function") _applyChrome("live");

  // 1. Eyebrow swap: VIEWING · LIVE → FINAL · X MIN AGO
  var eyebrow = document.querySelector('.sphud-hero-eyebrow');
  if (eyebrow) {
    var ageStr = "JUST NOW";
    if (typeof doc.lastWriteAt === "number" && typeof _formatAge === "function") {
      ageStr = _formatAge(Date.now() - doc.lastWriteAt).toUpperCase();
    }
    eyebrow.textContent = "FINAL · " + ageStr;
  }

  // 2. Hero cross-fade for final score (one last cross-fade trigger).
  // Reuses `state` reference declared above for editorial-mode + chrome reset.
  var newHero = _computeHeroValues(doc);
  if (state && state.prevHero && _heroChanged(state.prevHero, newHero)) {
    _crossFadeHero(state.prevHero, newHero);
  }

  // 3. PerHoleStrip — refresh all cells (clears current-hole pulsing dot
  //    via class recomputation; thru===18 → no future cells either).
  for (var i = 0; i < 18; i++) {
    var cell = document.querySelector('.phs-row .phs-cell:nth-child(' + (i + 1) + ')');
    if (cell) {
      cell.innerHTML = _renderPhsCellHTML(i, doc);
      cell.className = _computePhsCellClasses(i, doc);
    }
  }

  // 4. StatsPanel re-render with final values (pace+proj sub-line is
  //    suppressed when thru===18 per v8.13.5 spec).
  var statsPanel = document.querySelector('.sp-panel');
  if (statsPanel && statsPanel.parentNode) {
    statsPanel.parentNode.innerHTML = _renderStatsPanel(doc, 'live');
  }

  // 5. ROUND COMPLETE caption in #live-round-caption slot (slot exists
  //    in home.js:_renderLivePageHero per Gate 7 reuse contract).
  var caption = document.getElementById('live-round-caption');
  if (caption) {
    caption.innerHTML = '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-brass);margin-top:14px">ROUND COMPLETE</div>';
  }
}

// Attach to PB namespace for round.js consumption.
// generateShotEntry exposed for in-house Gate 6 reuse via _handleSpectatorEmission
// (and remains exposed for any future gate that needs editorial entry generation).
// attachListener / detachListener are the public Gate 6 lifecycle hooks called
// from round.js dispatch and router.js Router.go interception + beforeunload.
if (typeof PB !== "undefined") {
  PB.spectator = {
    renderHUDShell: _renderSpectatorHUDShell,
    generateShotEntry: generateShotEntry,
    attachListener: _attachSpectatorListener,
    detachListener: _detachSpectatorListener
  };
}
