/* ═══════════════════════════════════════════════════════════════════════════
   CADDY FIGURE — standing-caddy SVG rig for the onboarding walkthrough (FTUE)

   A NEW standing rig — NOT a reuse of intro.js's swing KEY[] (which is pure
   swing-phase data). It reuses ONLY the proven silhouette VOCABULARY from the
   tee-shot intro (filled tapered torso, 2-segment arm, filled head + cap path,
   round-capped limb strokes) plus a small lerp — that vocabulary is already
   visually verified to read as a person.

   The caddy stands at ease, weight on the trail leg, a golf bag shouldered at
   the trail side. Six authored poses (idle / tipCap / nod / leanBag / point /
   pump) blend via lerp (snap under reduced-motion). point(tx,ty) is explicit
   inverse-kinematics (atan2) so he gestures at a real on-screen control.

   Token-driven fills (--cb-felt figure, --cb-brass accents) so all 6 themes
   recolor automatically — the deliberate inverse of intro.js's art-palette
   hardcode. Inert until walkthrough.js mounts it. window.pbCaddy.

   CADDY_KEY column schema (standing figure):
     [0] hipShift   horizontal weight shift (px, + = toward lead/front side)
     [1] hipLift    vertical hip bob (px, + = up)
     [2] armDeg     gesturing-arm angle from straight-down (deg, + = back/CCW)
     [3] headTilt   head tilt toward target (deg, + = cocked toward lead)
     [4] shoulderTilt shoulder roll (deg, + = trail shoulder down)
     [5] bagLift    bag shouldering height (px, + = up)
     [6] chinPose   chin height (px, + = lifted/attentive)
     [7] lagDeg     forearm hinge vs the arm line (deg)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  // [hipShift, hipLift, armDeg, headTilt, shoulderTilt, bagLift, chinPose, lagDeg]
  var POSES = {
    idle:    [ -8,  0, -15,   0,   2, 12,  0,  10],
    tipCap:  [ -8,  0,  45,   8,   2, 12,  0,  28],
    nod:     [ -6,  0,  20,  -4,   4, 12,  3,  14],
    leanBag: [-16, -2, -28,  -6,  -8,  6,  0,   2],
    point:   [ -4,  0,  60,  20,   0, 12,  2, -50],   // armDeg overwritten by point()
    pump:    [ 12,  4, 120,  12,   0, 18,  6,  -8]
  };

  var C = { fig: "var(--cb-felt)", accent: "var(--cb-brass)", depth: "var(--cb-mute-3)" };

  var _root = null, _raf = null, _cur = null, _target = null, _t0 = 0, _dur = 320, _onbench = null;

  function _reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function _lerp(a, b, f) { return a + (b - a) * f; }
  function _ease(f) { return f < .5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2; }
  function _clone(p) { return p.slice(); }

  // Base anchor geometry (viewBox 0 0 160 300). Scale-independent; the <svg>
  // width sets the rendered size (140 stage / 56 bust).
  var HIPX0 = 80, HIPY = 188, TORSO = 64, WSH = 42, WHIP = 26, HEADR = 15, ARM = 46, FORE = 30, LEGLEN = 96;

  function _scene() {
    return '' +
    '<svg id="pbc-svg" viewBox="0 0 160 300" width="100%" style="height:auto;display:block;overflow:visible" aria-hidden="true">' +
      // bag sits BEHIND the figure (drawn first)
      '<g id="pbc-bag">' +
        '<path id="pbc-strap" d="" fill="none" stroke="' + C.depth + '" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>' +
        '<rect id="pbc-bagbody" x="0" y="0" width="22" height="70" rx="11" fill="' + C.fig + '" stroke="' + C.depth + '" stroke-width="1"/>' +
        '<line id="pbc-club1" x1="0" y1="0" x2="0" y2="0" stroke="' + C.accent + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line id="pbc-club2" x1="0" y1="0" x2="0" y2="0" stroke="' + C.accent + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line id="pbc-club3" x1="0" y1="0" x2="0" y2="0" stroke="' + C.accent + '" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +
      // legs
      '<path id="pbc-leg-trail" d="" fill="none" stroke="' + C.fig + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path id="pbc-leg-lead" d="" fill="none" stroke="' + C.fig + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      // torso (filled tapered silhouette — the de-stick mass)
      '<path id="pbc-torso" d="" fill="' + C.fig + '"/>' +
      // head + cap
      '<circle id="pbc-head" cx="0" cy="0" r="' + HEADR + '" fill="' + C.fig + '"/>' +
      '<path id="pbc-cap" d="" fill="' + C.fig + '"/>' +
      '<circle id="pbc-capbtn" cx="0" cy="0" r="2.2" fill="' + C.accent + '"/>' +
      // gesturing arm (2-segment) — drawn last, in front
      '<path id="pbc-arm" d="" fill="none" stroke="' + C.fig + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  }

  function _set(id, attrs) { var el = document.getElementById(id); if (!el) return; for (var k in attrs) el.setAttribute(k, String(attrs[k])); }

  function _apply(p) {
    // p = [hipShift, hipLift, armDeg, headTilt, shoulderTilt, bagLift, chinPose, lagDeg]
    var hipX = HIPX0 + p[0], hipY = HIPY - p[1];
    var tiltR = p[4] * Math.PI / 180;
    // shoulder center sits up the (slightly tilted) spine
    var sCx = hipX + Math.sin(tiltR) * 6;
    var sCy = hipY - TORSO;
    // torso trapezoid (broad shoulders -> narrow hips), perpendicular to the spine
    var dx = sCx - hipX, dy = sCy - hipY, dl = Math.sqrt(dx*dx + dy*dy) || 1;
    var px = -dy/dl, py = dx/dl;
    _set("pbc-torso", { d:
      "M " + (hipX + px*WHIP/2) + " " + (hipY + py*WHIP/2) +
      " L " + (sCx + px*WSH/2) + " " + (sCy + py*WSH/2) +
      " Q " + sCx + " " + (sCy - 4) + " " + (sCx - px*WSH/2) + " " + (sCy - py*WSH/2) +
      " L " + (hipX - px*WHIP/2) + " " + (hipY - py*WHIP/2) + " Z" });

    // head + cap (cap bill points toward lead/front = right)
    var hx = sCx + Math.sin((p[3]) * Math.PI/180) * 4 + 2;
    var hy = sCy - 26 - (p[6] * 0.4);
    _set("pbc-head", { cx: hx, cy: hy });
    _set("pbc-cap", { d: "M " + (hx-6) + " " + (hy-9) + " Q " + (hx+12) + " " + (hy-15) + " " + (hx+19) + " " + (hy-4) +
      " L " + (hx+19) + " " + (hy-1) + " L " + (hx+6) + " " + (hy-1) + " Q " + (hx+4) + " " + (hy-6) + " " + (hx-6) + " " + (hy-6) + " Z" });
    _set("pbc-capbtn", { cx: hx+2, cy: hy-11 });

    // legs: trail leg (behind, weight side) + lead leg (front). Weight side reads
    // straighter; lead leg slightly bent. footY fixed (figure stands on ground).
    var footY = hipY + LEGLEN, kneeY = hipY + LEGLEN*0.5;
    _set("pbc-leg-trail", { d: "M " + (hipX-7) + " " + (hipY-2) + " L " + (hipX-12) + " " + kneeY + " L " + (hipX-13) + " " + footY });
    _set("pbc-leg-lead",  { d: "M " + (hipX+7) + " " + (hipY-2) + " L " + (hipX+13) + " " + (kneeY+2) + " L " + (hipX+15) + " " + (footY-2) });

    // gesturing arm (near/lead shoulder), 2-segment with elbow
    var shX = sCx + px*WSH*0.30, shY = sCy + py*WSH*0.30 + 4;
    var aRad = p[2] * Math.PI / 180;
    var ex = shX - ARM * Math.sin(aRad), ey = shY + ARM * Math.cos(aRad);
    var cRad = (p[2] + p[7]) * Math.PI / 180;
    var hX = ex - FORE * Math.sin(cRad), hY = ey + FORE * Math.cos(cRad);
    _set("pbc-arm", { d: "M " + shX + " " + shY + " L " + ex + " " + ey + " L " + hX + " " + hY });

    // Golf bag shouldered at the TRAIL side: a vertical body clearly offset
    // left of the torso so its outline reads, with club heads poking UP above
    // the shoulder (the unmistakable "caddy with a bag" silhouette). Drawn
    // behind the torso (see _scene order) so the torso overlaps its inner edge.
    var trailX = hipX - 40, bagTop = sCy - 26 - p[5];
    _set("pbc-bagbody", { x: trailX, y: bagTop });
    // three club heads fanned up above the bag mouth
    _set("pbc-club1", { x1: trailX+5,  y1: bagTop+2, x2: trailX+1,  y2: bagTop-18 });
    _set("pbc-club2", { x1: trailX+11, y1: bagTop+2, x2: trailX+11, y2: bagTop-21 });
    _set("pbc-club3", { x1: trailX+17, y1: bagTop+2, x2: trailX+21, y2: bagTop-17 });
    // strap crosses the chest from the bag to the lead shoulder
    _set("pbc-strap", { d: "M " + (trailX+18) + " " + (bagTop+10) + " Q " + sCx + " " + (sCy+4) + " " + (sCx + px*WSH*0.42) + " " + (sCy + py*WSH*0.42) });
  }

  function _animate(to) {
    _target = to;
    if (_reduced()) { _cur = _clone(to); _apply(_cur); return; }
    var from = _cur ? _clone(_cur) : _clone(to);
    _t0 = performance.now();
    if (_raf) cancelAnimationFrame(_raf);
    (function frame(now) {
      var f = Math.min(1, (now - _t0) / _dur), e = _ease(f);
      var blend = []; for (var i = 0; i < to.length; i++) blend[i] = _lerp(from[i], to[i], e);
      _cur = blend; _apply(blend);
      if (f < 1) _raf = requestAnimationFrame(frame); else _cur = _clone(to);
    })(_t0);
  }

  // ── Public API ──
  function mount(container, opts) {
    opts = opts || {};
    if (typeof container === "string") container = document.querySelector(container);
    if (!container) return null;
    container.innerHTML = _scene();
    _root = container.querySelector("#pbc-svg");
    if (_root && opts.size) _root.setAttribute("width", String(opts.size));
    // Bust mode crops the viewBox to the head + shoulders + shouldered clubs
    // (the corner 56px bust), instead of the full standing figure.
    if (_root && opts.bust) { _root.setAttribute("viewBox", "38 58 88 92"); _root.style.width = "100%"; _root.style.height = "100%"; }
    _cur = _clone(POSES.idle);
    _apply(_cur);
    if (opts.pose && opts.pose !== "idle") setPose(opts.pose);
    else if (!_reduced()) _startBreath();
    return _root;
  }

  function setPose(name, opts) {
    var p = POSES[name]; if (!p) return;
    _stopBench();
    _dur = (opts && opts.dur) || (name === "pump" ? 500 : 320);
    _animate(_clone(p));
    // idle resumes its breathing loop after a discrete pose settles
    if (name === "idle" && !_reduced()) _startBreath();
  }

  // point(tx, ty): rotate the gesturing arm toward an on-screen target via IK.
  // sx/sy are the figure's shoulder joint in the SAME coordinate space as tx/ty
  // (caller passes target relative to the figure's viewBox, or screen coords if
  // the figure fills the viewport). atan2 → armDeg in intro.js's down-zero convention.
  function point(tx, ty, sx, sy) {
    var armAngle = Math.atan2(ty - (sy == null ? (HIPY - TORSO) : sy), tx - (sx == null ? HIPX0 : sx)) * 180 / Math.PI;
    var armDeg = armAngle - 90;
    var p = _clone(POSES.point);
    p[2] = armDeg;
    p[3] = (armAngle - 90) * 0.4; // head softly follows
    _stopBench();
    _dur = 320;
    _animate(p);
  }

  function _startBreath() {
    _stopBench();
    if (_reduced()) return;
    _onbench = setInterval(function () {
      var lift = (Math.sin(performance.now() / 1100) + 1) * 1; // 0..2px bob
      if (_cur) { var b = _clone(_cur); b[1] = lift; _apply(b); }
    }, 60);
  }
  function _stopBench() { if (_onbench) { clearInterval(_onbench); _onbench = null; } }

  function destroy() { _stopBench(); if (_raf) cancelAnimationFrame(_raf); _raf = null; _root = null; _cur = null; }

  window.pbCaddy = { mount: mount, setPose: setPose, point: point, destroy: destroy, _apply: _apply, POSES: POSES };
})();
