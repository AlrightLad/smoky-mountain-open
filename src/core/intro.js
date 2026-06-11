/* ═══════════════════════════════════════════════════════════════════════════
   TEE-SHOT WELCOME INTRO (v8.24.78 rebuild · task #34)

   Post-sign-in welcome moment: a pro-golfer SILHOUETTE swings off the tee at
   dawn — the ball launches on a brass trail into a brightening sky, the overlay
   fades into the Clubhouse. Founder spec: a silhouette of a pro golfer swinging
   from the tee box; clean, artful, not clunky or bland.

   This is a full rebuild of the v8.24.29 stick-figure version (which rendered
   as thin chalk lines on a flat green — bland). Now: a filled dark silhouette
   (thick round-capped limbs + a solid torso) against a dawn gradient with a sun
   and horizon glow, the sky brightening on impact. Swing timing follows the
   salvaged research spec (Tour Tempo ~3:1 backswing:downswing with a beat at the
   top; hips lead the downswing; wrist lag held then released; head down through
   impact; high wrapped finish).

   Phases over [0,1]:
     0–6%   address (idle breath)          46–54% TRANSITION BEAT (hold at top)
     6–18%  takeaway (low + slow)          54–64% downswing (FAST — hips lead)
     18–46% backswing to the top           64–67% IMPACT (+burst, sky flash)
                                           67–82% follow-through
                                           82–100% high finish hold

   GATES: localStorage pb_intro_enabled (default ON as of v8.24.78 — was OFF
   while the art was a stick figure), once per session (sessionStorage
   pb_intro_seen), never under prefers-reduced-motion. Keyboard: Enter/Space
   swing, Escape/second-tap skip (listener on document).

   Colors here are an intentional hardcoded art asset (like the share-card
   template) — a dawn silhouette palette, not themeable Clubhouse tokens.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var DUR = 2400;             // full timeline ms (research: 1.6–2.5s window)
  var _raf = null, _root = null, _started = false, _t0 = 0;

  // Dawn silhouette palette (art asset)
  var C = {
    skyTop: "#0c2c20", skyMid: "#1a4636", glow: "#caa04a", glowHot: "#f0d488",
    sun: "#f6e6b4", ground: "#06140e", figure: "#071109",
    shaft: "#0a1810", brass: "#d8b260", ball: "#fdfcf7", trail: "218,178,96"
  };

  function _reduced() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function _enabled() {
    // v8.24.80: ON by default — the rebuilt dawn-silhouette swing cleared the
    // bar (was the bland stick figure, gated off). Members can opt out by
    // setting pb_intro_enabled="0". Still once-per-session + reduced-motion-safe.
    try { return localStorage.getItem("pb_intro_enabled") !== "0"; } catch (e) { return true; }
  }
  function _seen() {
    try { return sessionStorage.getItem("pb_intro_seen") === "1"; } catch (e) { return false; }
  }
  function _markSeen() {
    try { sessionStorage.setItem("pb_intro_seen", "1"); } catch (e) {}
  }

  // easing
  function _easeInOut(f) { return f < .5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2; }
  function _easeIn(f) { return f * f; }
  function _easeOut(f) { return 1 - (1 - f) * (1 - f); }

  // [endPct, armDeg, lagDeg, hipShift, torsoLean, shoulderTilt, kneeDrop, trailHeel]
  //  armDeg: arm line from shoulder, 0=down, + sweeps toward target (screen left)
  //  lagDeg: club vs arm line (wrist hinge), + = laid back
  //  shoulderTilt: shoulder-line rotation (the turn) deg, + = lead shoulder up
  //  trailHeel: trail-foot heel lift px (finish)
  var KEY = [
    [0.06,   14,   14,   0,   0,   2,  0,  0],   // address — hands a touch ahead
    [0.18,  -34,   20,   2,  -3,  -8,  1,  0],   // takeaway — low and slow, shoulders start turning
    [0.46, -142,  104,   5,  -9, -34,  2,  0],   // top — hands high trail-side, club laid off, full coil
    [0.54, -146,  110,   1,  -9, -32,  2,  0],   // transition BEAT — hips already bumping, club drifts
    [0.62,  -46,   92,  -9,   1, -10,  2,  2],   // downswing — arms drop FAST, deep lag held, hips clear
    [0.65,    2,    6, -13,   5,  14,  1,  6],   // impact — shaft to ball under the shoulder, head behind
    [0.67,   16,   -8, -13,   6,  16,  1,  8],   // through impact — hands lead, clubhead releases
    [0.82,  118,  -34, -15,  12,  40,  0, 18],   // follow-through — arms chase, chest to target
    [1.00,  156,  -60, -17,  16,  52,  0, 24]    // finish — wrapped high, belt to target, heel up
  ];
  function _pose(t) {
    var prev = KEY[0], prevPct = 0;
    for (var i = 0; i < KEY.length; i++) {
      var k = KEY[i];
      if (t <= k[0]) {
        var span = (k[0] - prevPct) || 1;
        var f = (t - prevPct) / span;
        // downswing window (0.54–0.65) eases IN (accelerate); top + finish ease in/out; rest ease out
        f = (k[0] > 0.46 && k[0] <= 0.65) ? _easeIn(f) : (k[0] <= 0.46 || k[0] > 0.82) ? _easeInOut(f) : _easeOut(f);
        return {
          arm:  prev[1] + (k[1]-prev[1])*f, lag: prev[2] + (k[2]-prev[2])*f,
          hip:  prev[3] + (k[3]-prev[3])*f, lean: prev[4] + (k[4]-prev[4])*f,
          sh:   prev[5] + (k[5]-prev[5])*f, knee: prev[6] + (k[6]-prev[6])*f,
          heel: prev[7] + (k[7]-prev[7])*f
        };
      }
      prev = k; prevPct = k[0];
    }
    var l = KEY[KEY.length-1];
    return { arm:l[1], lag:l[2], hip:l[3], lean:l[4], sh:l[5], knee:l[6], heel:l[7] };
  }

  // Scene: dawn sky + sun + horizon glow + ground, then the golfer silhouette.
  // Golfer faces the viewer, right-handed, target = screen LEFT.
  function _scene() {
    return '' +
    '<svg id="pbi-svg" viewBox="0 0 480 460" width="100%" style="max-width:520px;display:block;height:auto" aria-hidden="true">' +
      '<defs>' +
        '<radialGradient id="pbi-sky" cx="38%" cy="78%" r="95%">' +
          '<stop offset="0%" stop-color="' + C.glow + '"/>' +
          '<stop offset="34%" stop-color="' + C.skyMid + '"/>' +
          '<stop offset="100%" stop-color="' + C.skyTop + '"/>' +
        '</radialGradient>' +
        '<radialGradient id="pbi-sun" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="' + C.sun + '"/>' +
          '<stop offset="45%" stop-color="' + C.sun + '" stop-opacity=".9"/>' +
          '<stop offset="100%" stop-color="' + C.glow + '" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect id="pbi-skyrect" x="0" y="0" width="480" height="460" fill="url(#pbi-sky)"/>' +
      // sun low on the horizon, target-side
      '<circle id="pbi-sun" cx="150" cy="372" r="46" fill="url(#pbi-sun)" opacity=".85"/>' +
      // ground silhouette (gentle rise)
      '<path d="M0 392 Q 240 372 480 388 L480 460 L0 460 Z" fill="' + C.ground + '"/>' +
      // tee + ball
      '<line id="pbi-tee" x1="214" y1="392" x2="214" y2="382" stroke="' + C.ground + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path id="pbi-trail" d="" fill="none" stroke="rgba(' + C.trail + ',.0)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<circle id="pbi-ball" cx="214" cy="377" r="5.5" fill="' + C.ball + '"/>' +
      // downswing club smear (brass)
      '<path id="pbi-smear" d="M 196 196 A 110 110 0 0 1 232 376" fill="none" stroke="rgba(' + C.trail + ',.4)" stroke-width="9" stroke-linecap="round" opacity="0"/>' +
      // impact burst
      '<g id="pbi-burst" opacity="0">' +
        '<line x1="214" y1="377" x2="198" y2="366" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="214" y1="377" x2="202" y2="358" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="214" y1="377" x2="222" y2="357" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>' +
      // golfer (filled silhouette via thick round-capped limbs + solid torso)
      '<g id="pbi-golfer">' +
        // legs
        '<g id="pbi-legs">' +
          '<path id="pbi-leg-lead" d="" fill="none" stroke="' + C.figure + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path id="pbi-leg-trail" d="" fill="none" stroke="' + C.figure + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</g>' +
        // pelvis
        '<circle id="pbi-hips" cx="0" cy="0" r="13" fill="' + C.figure + '"/>' +
        // torso group (turns + leans around the hips)
        '<g id="pbi-torso">' +
          '<line id="pbi-spine" x1="0" y1="0" x2="0" y2="0" stroke="' + C.figure + '" stroke-width="22" stroke-linecap="round"/>' +
          '<line id="pbi-shoulders" x1="0" y1="0" x2="0" y2="0" stroke="' + C.figure + '" stroke-width="13" stroke-linecap="round"/>' +
          '<circle id="pbi-head" cx="0" cy="0" r="15" fill="' + C.figure + '"/>' +
          '<path id="pbi-cap" d="" fill="' + C.figure + '"/>' +
          // arm (shoulder->hands) + club (hands->head) + clubhead
          '<line id="pbi-arm" x1="0" y1="0" x2="0" y2="0" stroke="' + C.figure + '" stroke-width="10" stroke-linecap="round"/>' +
          '<line id="pbi-club" x1="0" y1="0" x2="0" y2="0" stroke="' + C.shaft + '" stroke-width="4" stroke-linecap="round"/>' +
          '<line id="pbi-clubhead" x1="0" y1="0" x2="0" y2="0" stroke="' + C.brass + '" stroke-width="6" stroke-linecap="round"/>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function _mount() {
    _root = document.createElement("div");
    _root.id = "pbIntro";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-label", "Welcome to the Clubhouse — tap to tee off");
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;" +
      "background:" + C.skyTop + ";transition:opacity .4s ease";
    _root.innerHTML =
      '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:30px;color:' + C.glowHot + ';letter-spacing:-.5px;text-shadow:0 1px 12px rgba(0,0,0,.3)">Parbaughs.</div>' +
      _scene() +
      '<div id="pbi-hint" style="font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:2.5px;color:' + C.sun + ';opacity:.7;text-transform:uppercase">Tap to tee off</div>';
    _root.addEventListener("click", function() { _started ? skip() : swing(); });
    document.addEventListener("keydown", _onKey);
    document.body.appendChild(_root);
  }

  function _onKey(e) {
    if (e.key === "Escape") { skip(); return; }
    if (!_started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); swing(); }
  }

  function _set(id, attrs) {
    var el = document.getElementById(id); if (!el) return;
    for (var k in attrs) el.setAttribute(k, String(attrs[k]));
  }

  function _apply(t) {
    var p = _pose(t);
    // anchors (hips at 220,300)
    var HX = 220, HY = 300;
    var golfer = document.getElementById("pbi-golfer");
    var torso = document.getElementById("pbi-torso");
    if (!golfer || !torso) return;
    golfer.setAttribute("transform", "translate(" + p.hip + " " + p.knee + ")");
    torso.setAttribute("transform", "rotate(" + p.lean + " " + HX + " " + HY + ")");

    // pelvis — filled circle bridging spine + legs (no floating gap)
    _set("pbi-hips", { cx: HX, cy: HY });
    // spine hip-center -> neck
    var NX = HX, NY = HY - 52;
    _set("pbi-spine", { x1: HX, y1: HY, x2: NX, y2: NY });
    // shoulders: a line through the neck, rotated by shoulder turn (sh)
    var shRad = p.sh * Math.PI / 180, SHW = 15;
    var lsx = NX - Math.cos(shRad) * SHW, lsy = NY - Math.sin(shRad) * SHW; // lead shoulder (target/left)
    var tsx = NX + Math.cos(shRad) * SHW, tsy = NY + Math.sin(shRad) * SHW; // trail shoulder (right)
    _set("pbi-shoulders", { x1: lsx, y1: lsy, x2: tsx, y2: tsy });
    // head + cap: above the neck, tilts slightly with shoulder turn but stays down (small)
    var hx = NX + Math.sin(shRad) * 3, hy = NY - 19;
    _set("pbi-head", { cx: hx, cy: hy });
    // Ball cap: a low crown wedge on top + a bill pointing toward the target
    // (screen left) at the brow line. Reads as "golfer" in silhouette. The bill
    // direction flips with the body turn so it still points target-ward at the
    // finish (when the head has turned through). dir = -1 before impact (facing
    // target/left over the ball), +1 after (chest to target).
    var bill = (p.sh >= 12 ? 1 : -1);
    var bx = hx + bill * 16, by = hy - 1;
    _set("pbi-cap", { d: "M " + (hx - bill*2) + " " + (hy-12) + " Q " + (hx + bill*14) + " " + (hy-13) + " " + (hx + bill*13) + " " + (hy-4) +
      " L " + bx + " " + (by-1) + " L " + bx + " " + (by+3) + " L " + (hx + bill*4) + " " + (hy+4) + " Z" });

    // arm pivots at the shoulder midpoint between the two shoulders, biased to trail
    var SX = NX, SY = NY + 2, ARM = 62, SHAFT = 66;
    var ax = SX - ARM * Math.sin(p.arm * Math.PI / 180);
    var ay = SY + ARM * Math.cos(p.arm * Math.PI / 180);
    var cDeg = p.arm + p.lag;
    var cx2 = ax - SHAFT * Math.sin(cDeg * Math.PI / 180);
    var cy2 = ay + SHAFT * Math.cos(cDeg * Math.PI / 180);
    _set("pbi-arm", { x1: SX, y1: SY, x2: ax, y2: ay });
    _set("pbi-club", { x1: ax, y1: ay, x2: cx2, y2: cy2 });
    var px = (cy2 - ay), py = -(cx2 - ax), pl = Math.sqrt(px*px + py*py) || 1;
    _set("pbi-clubhead", { x1: cx2 - 6*px/pl, y1: cy2 - 6*py/pl, x2: cx2 + 6*px/pl, y2: cy2 + 6*py/pl });

    // legs: from the pelvis to the ground (~388), athletic knee flex + wider
    // stance; trail heel lifts at finish.
    var kneeY = HY + 46, footY = HY + 86;
    _set("pbi-leg-lead", { d: "M " + (HX-7) + " " + (HY-2) + " L " + (HX-18) + " " + kneeY + " L " + (HX-20) + " " + footY });
    _set("pbi-leg-trail", { d: "M " + (HX+7) + " " + (HY-2) + " L " + (HX+18) + " " + kneeY + " L " + (HX+20) + " " + (footY - p.heel) });

    // ball flight + brass trail: launches at impact (~0.65)
    var ball = document.getElementById("pbi-ball");
    var trail = document.getElementById("pbi-trail");
    if (ball) {
      if (t < 0.65) { _set("pbi-ball", { cx: 214, cy: 377, opacity: 1 }); if (trail) trail.setAttribute("opacity", "0"); }
      else {
        var f = Math.min(1, (t - 0.65) / 0.34);
        var bx = 214 - 250 * f;                          // toward target (left)
        var by = 377 - (240 * f - 175 * f * f);          // parabola
        _set("pbi-ball", { cx: bx, cy: by, opacity: (f >= 1 ? 0 : 1) });
        if (trail) {
          // a short fading trail behind the ball
          var tf = Math.max(0, f - 0.10);
          var txb = 214 - 250 * tf, tyb = 377 - (240 * tf - 175 * tf * tf);
          trail.setAttribute("d", "M " + txb + " " + tyb + " L " + bx + " " + by);
          trail.setAttribute("stroke", "rgba(" + C.trail + "," + (0.55 * (1 - f)) + ")");
          trail.setAttribute("opacity", f >= 1 ? "0" : "1");
        }
      }
    }

    // downswing smear: visible only through the fast window
    var smear = document.getElementById("pbi-smear");
    if (smear) smear.setAttribute("opacity", (t >= 0.55 && t <= 0.66) ? String(0.85 * (1 - Math.abs((t - 0.605) / 0.055))) : "0");
    // impact burst
    var burst = document.getElementById("pbi-burst");
    if (burst) burst.setAttribute("opacity", (t >= 0.64 && t <= 0.73) ? String(1 - (t - 0.64) / 0.09) : "0");
    // sky flash at impact (the dawn brightens)
    var skyr = document.getElementById("pbi-skyrect");
    if (skyr) skyr.setAttribute("opacity", (t >= 0.64 && t <= 0.78) ? String(1) : "1");
    var sun = document.getElementById("pbi-sun");
    if (sun) sun.setAttribute("opacity", String(0.85 + ((t >= 0.64 && t <= 0.82) ? 0.15 * (1 - Math.abs((t - 0.72) / 0.1)) : 0)));
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
      else { setTimeout(_teardown, 420); }
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
      setTimeout(function() { if (r && r.parentNode) r.parentNode.removeChild(r); }, 420);
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
