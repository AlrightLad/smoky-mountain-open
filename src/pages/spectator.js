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

  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">PER-HOLE STRIP · COMING IN GATE 3</div></div>';
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">STATS PANEL · COMING IN GATE 4</div></div>';
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">COURSE PANEL · COMING IN GATE 4</div></div>';
  h += '<div style="' + placeholderStyle + '"><div style="' + labelStyle + '">RECENT SHOTS · COMING IN GATE 5</div></div>';

  return h;
}

// Attach to PB namespace for round.js consumption.
if (typeof PB !== "undefined") {
  PB.spectator = {
    renderHUDShell: _renderSpectatorHUDShell
  };
}
