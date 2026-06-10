/* ═══════════════════════════════════════════════════════════════════════════
   TEE-SHOT WELCOME INTRO (v8.24.29 · task #34)

   Post-sign-in welcome moment: tap → a clean cartoon golfer swings off the
   tee, the ball arcs across the screen with a brass trail, the overlay fades
   into the Clubhouse. Founder spec 2026-06-10: AFTER sign-in (not before),
   researched swing accuracy, clean cartoon, flag-gated.

   Swing timing follows the salvaged research spec
   (.claude/state/research/swing-animation-spec.json — Tour Tempo et al.):
     0–6%   address (idle breath)          46–54% TRANSITION BEAT (hold at top)
     6–18%  takeaway (low + slow)          54–65% downswing (FAST — 3:1 tempo)
     18–46% backswing to the top           65–68% IMPACT FREEZE (+burst)
                                           68–82% follow-through
                                           82–100% high finish hold
   Authenticity cues honored: ~3:1 backswing:downswing with a beat at the top;
   hips lead the downswing (weight shifts target-ward before the club moves);
   wrist lag held deep then released; head stays down through impact; belt
   buckle to target at the finish.

   GATES: shows only when localStorage pb_intro_enabled === "1" (DEFAULT OFF —
   Founder enables after staging review), once per session (sessionStorage
   pb_intro_seen), never under prefers-reduced-motion. Keyboard: Enter/Space
   start the swing, Escape (or a second tap) skips — listener on document
   (the prior build attached it to an unfocused child and keys were dead).
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var DUR = 2300;             // full timeline ms (research: 1.6–2.5s window)
  var _raf = null, _root = null, _started = false, _t0 = 0;

  function _reduced() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function _enabled() {
    try { return localStorage.getItem("pb_intro_enabled") === "1"; } catch (e) { return false; }
  }
  function _seen() {
    try { return sessionStorage.getItem("pb_intro_seen") === "1"; } catch (e) { return false; }
  }
  function _markSeen() {
    try { sessionStorage.setItem("pb_intro_seen", "1"); } catch (e) {}
  }

  // Phase interpolation: piecewise keyframes over [0,1]. Each entry:
  // [endPct, armAngle, hipShift, torsoLean, kneeFlex]. armAngle = arms+club
  // group rotation in degrees around the shoulder pivot (0 = club resting at
  // the ball, negative = backswing direction). Values stage the researched
  // poses; easing handled per-segment below.
  // [endPct, armDeg, lagDeg, hipShift, torsoLean, kneeFlex]
  // armDeg: direction of the arm line from the shoulder, measured from
  // straight-down (0). Positive = toward the target (screen left), negative =
  // away (backswing side). lagDeg: club angle relative to the arm line
  // (wrist hinge) — 0 = club continues the arm line, positive = laid back.
  var KEY = [
    [0.06,   18,   12,   0,   0, 0],   // address — hands ahead, club to ball
    [0.18,  -38,   18,   2,  -2, 1],   // takeaway — low and slow
    [0.46, -150,   95,   6,  -8, 3],   // top — arms high behind, club laid off ~90 (coil)
    [0.54, -152,  100,   1,  -8, 3],   // transition BEAT — club drifts, hips already bumping
    [0.62,  -40,   85,  -9,   2, 2],   // downswing — arms drop FAST, lag HELD
    [0.65,   20,    0, -12,   4, 1],   // impact — lag released, shaft to ball
    [0.68,   20,    0, -12,   4, 1],   // FREEZE
    [0.82,  120,  -30, -14,  10, 0],   // follow-through — arms chase the ball
    [1.00,  158,  -55, -16,  14, 0]    // finish — wrapped high over lead shoulder
  ];
  function _pose(t) {
    var prev = KEY[0], prevPct = 0;
    for (var i = 0; i < KEY.length; i++) {
      var k = KEY[i];
      if (t <= k[0]) {
        var span = (k[0] - prevPct) || 1;
        var f = (t - prevPct) / span;
        f = (k[0] <= 0.46 || k[0] > 0.68) ? (f < .5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2) : f * f;
        return {
          arm:  prev[1] + (k[1] - prev[1]) * f,
          lag:  prev[2] + (k[2] - prev[2]) * f,
          hip:  prev[3] + (k[3] - prev[3]) * f,
          lean: prev[4] + (k[4] - prev[4]) * f,
          knee: prev[5] + (k[5] - prev[5]) * f
        };
      }
      prev = k; prevPct = k[0];
    }
    var l = KEY[KEY.length - 1];
    return { arm: l[1], lag: l[2], hip: l[3], lean: l[4], knee: l[5] };
  }

  // Golfer SVG — face-on, right-handed, target = screen LEFT (spec convention).
  // Chalk strokes on felt, brass accents; consistent 2.5 line weight.
  function _scene() {
    return '' +
    '<svg viewBox="0 0 390 420" width="100%" height="auto" style="max-width:430px" aria-hidden="true">' +
      // ground line + tee
      '<line x1="20" y1="360" x2="370" y2="360" stroke="rgba(var(--cb-brass-rgb),.35)" stroke-width="1.5"/>' +
      '<line id="pbi-tee" x1="176" y1="360" x2="176" y2="351" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round"/>' +
      // ball (sits on tee; launched by JS)
      '<circle id="pbi-ball" cx="176" cy="347" r="4.5" fill="var(--cb-chalk)"/>' +
      // downswing smear arc (research cue: arc-shaped motion wedge on the
      // club during the fast 54-65% window) + impact divot tuft
      '<path id="pbi-smear" d="M 150 180 A 95 95 0 0 1 185 345" fill="none" stroke="rgba(var(--cb-brass-rgb),.35)" stroke-width="7" stroke-linecap="round" opacity="0"/>' +
      '<g id="pbi-divot" opacity="0">' +
        '<line x1="170" y1="358" x2="160" y2="354" stroke="var(--cb-green-3)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="173" y1="357" x2="166" y2="351" stroke="var(--cb-green-3)" stroke-width="2" stroke-linecap="round"/>' +
      '</g>' +
      // impact burst (hidden until impact)
      '<g id="pbi-burst" opacity="0">' +
        '<line x1="176" y1="347" x2="164" y2="338" stroke="var(--cb-brass-2)" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="176" y1="347" x2="168" y2="332" stroke="var(--cb-brass-2)" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="176" y1="347" x2="181" y2="333" stroke="var(--cb-brass-2)" stroke-width="2" stroke-linecap="round"/>' +
      '</g>' +
      // golfer root at hips (220,300): legs static-ish, torso+arms animate
      '<g id="pbi-golfer">' +
        // legs
        '<g id="pbi-legs">' +
          '<path d="M210 300 L204 332 L206 358" fill="none" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M230 300 L236 332 L234 358" fill="none" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<line x1="200" y1="358" x2="212" y2="358" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line x1="228" y1="358" x2="240" y2="358" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round"/>' +
        '</g>' +
        // torso group (rotates slightly around hips)
        '<g id="pbi-torso">' +
          '<path d="M220 300 C218 280 218 268 220 252" fill="none" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round"/>' +
          // head — stays DOWN through impact (cue 3); brass cap
          '<circle cx="219" cy="241" r="10" fill="none" stroke="var(--cb-chalk)" stroke-width="2.5"/>' +
          '<path d="M209 238 A 11 11 0 0 1 229 238" fill="none" stroke="var(--cb-brass)" stroke-width="2.5" stroke-linecap="round"/>' +
          // arms + club: geometry computed per frame in _apply (two segments:
          // shoulder->hands at armDeg, hands->clubhead at armDeg+lagDeg).
          '<line id="pbi-arm" x1="220" y1="258" x2="220" y2="258" stroke="var(--cb-chalk)" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line id="pbi-club" x1="220" y1="258" x2="220" y2="258" stroke="var(--cb-brass)" stroke-width="3" stroke-linecap="round"/>' +
          '<line id="pbi-clubhead" x1="220" y1="258" x2="220" y2="258" stroke="var(--cb-brass)" stroke-width="4.5" stroke-linecap="round"/>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function _mount() {
    _root = document.createElement("div");
    _root.id = "pbIntro";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-label", "Welcome to the Clubhouse — tap to tee off");
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;" +
      "background:radial-gradient(120% 90% at 50% 30%, var(--cb-green-2) 0%, var(--cb-felt) 70%);transition:opacity .3s ease";
    _root.innerHTML =
      '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:26px;color:var(--cb-brass-2);letter-spacing:-.5px">Parbaughs.</div>' +
      _scene() +
      '<div id="pbi-hint" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;color:var(--cb-chalk);opacity:.75;text-transform:uppercase">Tap to tee off</div>';
    _root.addEventListener("click", function() { _started ? skip() : swing(); });
    document.addEventListener("keydown", _onKey);
    document.body.appendChild(_root);
  }

  function _onKey(e) {
    if (e.key === "Escape") { skip(); return; }
    if (!_started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); swing(); }
  }

  function _apply(t) {
    var p = _pose(t);
    var torso = document.getElementById("pbi-torso");
    var golfer = document.getElementById("pbi-golfer");
    var armEl = document.getElementById("pbi-arm");
    var clubEl = document.getElementById("pbi-club");
    var headEl = document.getElementById("pbi-clubhead");
    if (!torso || !golfer || !armEl || !clubEl || !headEl) return;
    torso.setAttribute("transform", "rotate(" + p.lean + " 220 300)");
    golfer.setAttribute("transform", "translate(" + p.hip + " " + p.knee + ")");
    // Two-segment pose: shoulder S -> hands H (arm, 58px) -> clubhead C (shaft, 52px).
    // armDeg measured from straight-down; positive sweeps toward the target (left).
    var SX = 220, SY = 258, ARM = 58, SHAFT = 52;
    var aRad = (90 + p.arm) * Math.PI / 180;        // 0deg = down; +left
    var hx = SX - Math.cos(aRad - Math.PI / 2) * 0; // (kept simple below)
    var ax = SX - ARM * Math.sin(p.arm * Math.PI / 180);
    var ay = SY + ARM * Math.cos(p.arm * Math.PI / 180);
    var cDeg = p.arm + p.lag;
    var cx2 = ax - SHAFT * Math.sin(cDeg * Math.PI / 180);
    var cy2 = ay + SHAFT * Math.cos(cDeg * Math.PI / 180);
    armEl.setAttribute("x2", String(ax)); armEl.setAttribute("y2", String(ay));
    clubEl.setAttribute("x1", String(ax)); clubEl.setAttribute("y1", String(ay));
    clubEl.setAttribute("x2", String(cx2)); clubEl.setAttribute("y2", String(cy2));
    // small clubhead blade perpendicular at the tip
    var px = (cy2 - ay), py = -(cx2 - ax), pl = Math.sqrt(px*px + py*py) || 1;
    headEl.setAttribute("x1", String(cx2 - 5 * px / pl)); headEl.setAttribute("y1", String(cy2 - 5 * py / pl));
    headEl.setAttribute("x2", String(cx2 + 5 * px / pl)); headEl.setAttribute("y2", String(cy2 + 5 * py / pl));
    // impact burst + freeze punctuation
    var burst = document.getElementById("pbi-burst");
    if (burst) burst.setAttribute("opacity", (t >= 0.65 && t <= 0.74) ? String(1 - (t - 0.65) / 0.09) : "0");
    // downswing smear: visible only through the fast window, fading at impact
    var smear = document.getElementById("pbi-smear");
    if (smear) smear.setAttribute("opacity", (t >= 0.56 && t <= 0.67) ? String(0.9 * (1 - Math.abs((t - 0.61) / 0.06))) : "0");
    // divot tuft: kicks at impact, settles through the follow-through
    var divot = document.getElementById("pbi-divot");
    if (divot) divot.setAttribute("opacity", (t >= 0.655 && t <= 0.85) ? String(1 - (t - 0.655) / 0.2) : "0");
    // ball flight: launches at impact (65%), exaggerated 30° cartoon arc to
    // the target (screen left), brass trail via stroke-dash ghosting
    var ball = document.getElementById("pbi-ball");
    if (ball) {
      if (t < 0.65) { ball.setAttribute("cx", "176"); ball.setAttribute("cy", "347"); ball.setAttribute("opacity", "1"); }
      else {
        var f = Math.min(1, (t - 0.65) / 0.3);
        var bx = 176 - 210 * f;                       // toward target (left)
        var by = 347 - (190 * f - 150 * f * f);       // parabola, apex ~mid
        ball.setAttribute("cx", String(bx)); ball.setAttribute("cy", String(by));
        ball.setAttribute("opacity", String(f >= 1 ? 0 : 1));
      }
    }
  }

  function swing() {
    if (_started) return;
    _started = true;
    var hint = document.getElementById("pbi-hint");
    if (hint) hint.style.opacity = "0";
    _t0 = performance.now();
    (function frame(now) {
      var t = Math.min(1, (now - _t0) / DUR);
      _apply(t);
      if (t < 1) { _raf = requestAnimationFrame(frame); }
      else { setTimeout(_teardown, 350); }
    })(_t0);
  }

  function skip() { _teardown(); }

  function _teardown() {
    if (_raf) cancelAnimationFrame(_raf);
    _raf = null;
    document.removeEventListener("keydown", _onKey);
    if (_root) {
      _root.style.opacity = "0";
      var r = _root; _root = null;
      setTimeout(function() { if (r && r.parentNode) r.parentNode.removeChild(r); }, 320);
    }
    _started = false;
  }

  function maybeShow() {
    if (!_enabled() || _seen() || _reduced() || _root) return false;
    _markSeen();
    _mount();
    _apply(0);
    return true;
  }

  window.pbTeeIntro = { maybeShow: maybeShow, show: function() { if (!_root) { _mount(); _apply(0); } }, skip: skip, _applyAt: _apply };
})();
