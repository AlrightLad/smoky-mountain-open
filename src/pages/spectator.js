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
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">STATS PANEL · COMING IN GATE 4</div></div>';
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">COURSE PANEL · COMING IN GATE 4</div></div>';
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">RECENT SHOTS · COMING IN GATE 5</div></div>';

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

// Attach to PB namespace for round.js consumption.
if (typeof PB !== "undefined") {
  PB.spectator = {
    renderHUDShell: _renderSpectatorHUDShell
  };
}
