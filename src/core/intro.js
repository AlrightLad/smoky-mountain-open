/* ═══════════════════════════════════════════════════════════════════════════
   TEE-SHOT WELCOME INTRO (v8.24.95 — wrapped finish + filled torso + 2-segment arm · task #34)

   A pro-golfer SILHOUETTE, viewed side-on (profile, facing the target to the
   RIGHT), swings off the tee at dawn — the club traces a big clean overhead
   arc, the ball launches down the fairway on a brass trail, then the overlay
   fades into the Clubhouse.

   Why profile (v8.24.82): the v8.24.80 FACE-ON build read as "waving a stick
   sideways" — a real golf swing foreshortens into/out of the screen face-on,
   so the club never looked like it went up and behind. Side-on, the club
   sweeps a visible ~220° arc (down at the ball → up behind the head → down
   through impact → wrapped high at the finish): the iconic golf-swing read.

   The arm+club rotate as one unit around the shoulder; the spine un-tilts and
   the body posts up onto the lead leg through impact to a balanced finish.
   Tour-tempo timing (~3:1 back:through with a beat at the top), reduced-motion
   safe, once/session, ON by default (opt out via pb_intro_enabled='0').

   Colors are an intentional dawn-silhouette art palette (like the share card),
   not themeable Clubhouse tokens.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var DUR = 2500;
  var _raf = null, _root = null, _started = false, _t0 = 0;

  var C = {
    skyTop: "#0c2c20", skyMid: "#1a4636", glow: "#caa04a", glowHot: "#f0d488",
    sun: "#f6e6b4", ground: "#06140e", figure: "#071109",
    shaft: "#0a1810", brass: "#d8b260", ball: "#fdfcf7", trail: "218,178,96"
  };

  function _reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function _enabled() { try { return localStorage.getItem("pb_intro_enabled") !== "0"; } catch (e) { return true; } }
  function _seen() { try { return sessionStorage.getItem("pb_intro_seen") === "1"; } catch (e) { return false; } }
  function _markSeen() { try { sessionStorage.setItem("pb_intro_seen", "1"); } catch (e) {} }

  function _easeInOut(f) { return f < .5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2; }
  function _easeIn(f) { return f * f * f; }
  function _easeOut(f) { return 1 - Math.pow(1 - f, 3); }

  // Profile swing. armDeg: arm direction from straight-DOWN (0), POSITIVE =
  // rotating BACK (counter-clockwise, up-and-behind for a right-facing golfer).
  // lagDeg: club hinge vs the arm line (held through transition, released at
  // impact). lean: spine forward-tilt toward the ball (deg, + = bent over the
  // ball; drops to ~0 standing tall at the finish). turn: body rotation toward
  // the target through impact (deg). weight: hip slide toward target (px, +right).
  // heel: trail-foot heel lift at the finish (px).
  // [endPct, armDeg, lagDeg, lean, turn, weight, heel]
  var KEY = [
    [0.00,  -28,   8,  34,  0,   0,  0],   // address — bent over, club down to the ball
    [0.12,   26,  14,  33, -2,  -3,  0],   // takeaway — low and slow, club starts back
    [0.45,  205,  40,  30, -6,  -6,  0],   // top — club UP over the head (light lag, not flat)
    [0.53,  200,  46,  29, -4,   2,  0],   // transition beat — weight bumps target-ward
    [0.62,   90,  60,  24,  6,  10,  2],   // downswing — arm drops FAST, lag holds, hips clearing
    [0.66,  -26,   8,  18, 16,  13,  4],   // impact — shaft to the ball, body posting up, head still
    [0.69,  -52,  -6,  14, 22,  13,  6],   // through impact — release, hands lead
    [0.82, -150, -70,  4,  42,  14, 16],   // follow-through — hands rising toward the head, club folding over
    [1.00, -185,-124, -3,  60,  15, 26]    // finish — HANDS HIGH by the head, club WRAPPED down-behind, posted tall
  ];
  function _pose(t) {
    var prev = KEY[0], prevPct = 0;
    for (var i = 0; i < KEY.length; i++) {
      var k = KEY[i];
      if (t <= k[0]) {
        var span = (k[0] - prevPct) || 1;
        var f = (t - prevPct) / span;
        f = (k[0] > 0.53 && k[0] <= 0.66) ? _easeIn(f) : (k[0] <= 0.45 || k[0] > 0.82) ? _easeInOut(f) : _easeOut(f);
        return {
          arm: prev[1]+(k[1]-prev[1])*f, lag: prev[2]+(k[2]-prev[2])*f, lean: prev[3]+(k[3]-prev[3])*f,
          turn: prev[4]+(k[4]-prev[4])*f, weight: prev[5]+(k[5]-prev[5])*f, heel: prev[6]+(k[6]-prev[6])*f
        };
      }
      prev = k; prevPct = k[0];
    }
    var l = KEY[KEY.length-1];
    return { arm:l[1], lag:l[2], lean:l[3], turn:l[4], weight:l[5], heel:l[6] };
  }

  function _scene() {
    return '' +
    '<svg id="pbi-svg" viewBox="0 0 480 460" width="100%" style="max-width:520px;display:block;height:auto" aria-hidden="true">' +
      '<defs>' +
        '<radialGradient id="pbi-sky" cx="62%" cy="80%" r="95%">' +
          '<stop offset="0%" stop-color="' + C.glow + '"/><stop offset="34%" stop-color="' + C.skyMid + '"/><stop offset="100%" stop-color="' + C.skyTop + '"/>' +
        '</radialGradient>' +
        '<radialGradient id="pbi-sun" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="' + C.sun + '"/><stop offset="45%" stop-color="' + C.sun + '" stop-opacity=".9"/><stop offset="100%" stop-color="' + C.glow + '" stop-opacity="0"/>' +
        '</radialGradient>' +
      '</defs>' +
      '<rect x="0" y="0" width="480" height="460" fill="url(#pbi-sky)"/>' +
      '<circle id="pbi-sun" cx="338" cy="372" r="50" fill="url(#pbi-sun)" opacity=".85"/>' +   // sun down-target (right)
      '<path d="M0 392 Q 240 374 480 388 L480 460 L0 460 Z" fill="' + C.ground + '"/>' +
      '<line id="pbi-tee" x1="286" y1="390" x2="286" y2="381" stroke="' + C.ground + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path id="pbi-trail" d="" fill="none" stroke="rgba(' + C.trail + ',0)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<circle id="pbi-ball" cx="286" cy="376" r="5.5" fill="' + C.ball + '"/>' +
      '<path id="pbi-smear" d="" fill="none" stroke="rgba(' + C.trail + ',.4)" stroke-width="9" stroke-linecap="round" opacity="0"/>' +
      '<g id="pbi-burst" opacity="0">' +
        '<line x1="286" y1="376" x2="300" y2="366" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="286" y1="376" x2="298" y2="358" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="286" y1="376" x2="278" y2="360" stroke="' + C.brass + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '</g>' +
      '<g id="pbi-golfer">' +
        '<path id="pbi-leg-trail" d="" fill="none" stroke="' + C.figure + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path id="pbi-leg-lead" d="" fill="none" stroke="' + C.figure + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle id="pbi-hips" cx="0" cy="0" r="12" fill="' + C.figure + '"/>' +
        '<g id="pbi-upper">' +
          '<path id="pbi-torso" d="" fill="' + C.figure + '"/>' +
          '<circle id="pbi-head" cx="0" cy="0" r="14" fill="' + C.figure + '"/>' +
          '<path id="pbi-cap" d="" fill="' + C.figure + '"/>' +
          '<path id="pbi-arm" d="" fill="none" stroke="' + C.figure + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
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
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:" + C.skyTop + ";transition:opacity .4s ease";
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

  function _set(id, attrs) { var el = document.getElementById(id); if (!el) return; for (var k in attrs) el.setAttribute(k, String(attrs[k])); }

  function _apply(t) {
    var p = _pose(t);
    var HX = 205, HY = 302;                 // hips
    var golfer = document.getElementById("pbi-golfer");
    if (!golfer) return;
    golfer.setAttribute("transform", "translate(" + p.weight + " 0)");

    // hips
    _set("pbi-hips", { cx: HX, cy: HY });
    // shoulder sits up the spine; the spine tilts FORWARD (toward target/right)
    // by `lean`, and the whole upper body rotates toward the target by `turn`.
    var leanR = p.lean * Math.PI / 180;
    var SLEN = 56;
    var SX = HX + Math.sin(leanR) * SLEN;   // shoulder x (forward of hips when leaning)
    var SY = HY - Math.cos(leanR) * SLEN;   // shoulder y (up)
    // Torso as a tapered FILLED silhouette (broad shoulders -> narrower hips),
    // not a single stroke — this is what stops the figure reading as a stick.
    var _tdx = SX - HX, _tdy = SY - HY, _tdl = Math.sqrt(_tdx*_tdx + _tdy*_tdy) || 1;
    var _px = -_tdy / _tdl, _py = _tdx / _tdl;   // unit perpendicular to the spine
    var WSH = 36, WHIP = 24;                       // shoulder + hip widths
    _set("pbi-torso", { d:
      "M " + (HX + _px*WHIP/2) + " " + (HY + _py*WHIP/2) +
      " L " + (SX + _px*WSH/2) + " " + (SY + _py*WSH/2) +
      " Q " + SX + " " + (SY - 4) + " " + (SX - _px*WSH/2) + " " + (SY - _py*WSH/2) +
      " L " + (HX - _px*WHIP/2) + " " + (HY - _py*WHIP/2) + " Z" });
    // head above the shoulder along the spine line; cap bill toward target (right)
    var hx = SX + Math.sin(leanR) * 18, hy = SY - Math.cos(leanR) * 18;
    _set("pbi-head", { cx: hx, cy: hy });
    _set("pbi-cap", { d: "M " + (hx-4) + " " + (hy-10) + " Q " + (hx+14) + " " + (hy-13) + " " + (hx+20) + " " + (hy-3) +
      " L " + (hx+20) + " " + (hy+1) + " L " + (hx+8) + " " + (hy+1) + " Q " + (hx+6) + " " + (hy-4) + " " + (hx-4) + " " + (hy-5) + " Z" });

    // arm + club rotate around the shoulder. armDeg from straight-down,
    // POSITIVE = back/CCW (up-behind). turn rotates the whole arm plane toward
    // target slightly (adds the through-swing release feel).
    var ARM = 60, SHAFT = 78;
    var aDeg = p.arm - p.turn * 0.35;
    var aRad = aDeg * Math.PI / 180;
    var ax = SX - ARM * Math.sin(aRad);
    var ay = SY + ARM * Math.cos(aRad);
    var cRad = (aDeg + p.lag) * Math.PI / 180;
    var cx2 = ax - SHAFT * Math.sin(cRad);
    var cy2 = ay + SHAFT * Math.cos(cRad);
    // 2-segment arm (shoulder -> elbow -> hands): a subtle elbow bend reads as a
    // real arm, not a single stick. Bend grows with the wrist hinge (lag) and is
    // biased to the trailing side of the arm line.
    var _adx = ax - SX, _ady = ay - SY, _adl = Math.sqrt(_adx*_adx + _ady*_ady) || 1;
    var _apx = -_ady / _adl, _apy = _adx / _adl;     // unit perpendicular to the arm
    if (_apy < 0) { _apx = -_apx; _apy = -_apy; }    // bias the elbow downward (natural)
    var _bend = 7 + Math.abs(p.lag) * 0.06;          // more bend when the wrist is hinged
    var _ex = (SX + ax) / 2 + _apx * _bend, _ey = (SY + ay) / 2 + _apy * _bend;
    _set("pbi-arm", { d: "M " + SX + " " + SY + " L " + _ex + " " + _ey + " L " + ax + " " + ay });
    _set("pbi-club", { x1: ax, y1: ay, x2: cx2, y2: cy2 });
    var px = (cy2 - ay), py = -(cx2 - ax), pl = Math.sqrt(px*px + py*py) || 1;
    _set("pbi-clubhead", { x1: cx2 - 6*px/pl, y1: cy2 - 6*py/pl, x2: cx2 + 6*px/pl, y2: cy2 + 6*py/pl });

    // legs (profile): trail leg behind (left), lead leg toward target (right).
    // Lead leg straightens + trail heel lifts as weight posts up at the finish.
    var footY = HY + 86, kneeY = HY + 46;
    _set("pbi-leg-trail", { d: "M " + (HX-3) + " " + (HY-1) + " L " + (HX-16) + " " + kneeY + " L " + (HX-14) + " " + (footY - p.heel) });
    _set("pbi-leg-lead",  { d: "M " + (HX+5) + " " + (HY-1) + " L " + (HX+15) + " " + (kneeY+2) + " L " + (HX+16) + " " + footY });

    // ball flight: launches toward the target (RIGHT) at impact (~0.66)
    var ball = document.getElementById("pbi-ball"), trail = document.getElementById("pbi-trail");
    if (ball) {
      if (t < 0.66) { _set("pbi-ball", { cx: 286, cy: 376, opacity: 1 }); if (trail) trail.setAttribute("opacity", "0"); }
      else {
        var f = Math.min(1, (t - 0.66) / 0.32);
        var bx = 286 + 250 * f;                          // toward target (right)
        var by = 376 - (250 * f - 180 * f * f);          // parabola
        _set("pbi-ball", { cx: bx, cy: by, opacity: (f >= 1 ? 0 : 1) });
        if (trail) {
          var tf = Math.max(0, f - 0.10);
          var txb = 286 + 250 * tf, tyb = 376 - (250 * tf - 180 * tf * tf);
          trail.setAttribute("d", "M " + txb + " " + tyb + " L " + bx + " " + by);
          trail.setAttribute("stroke", "rgba(" + C.trail + "," + (0.55 * (1 - f)) + ")");
          trail.setAttribute("opacity", f >= 1 ? "0" : "1");
        }
      }
    }
    // downswing smear: a brass arc tracing the clubhead path through the fast zone
    var smear = document.getElementById("pbi-smear");
    if (smear) {
      if (t >= 0.55 && t <= 0.67) {
        smear.setAttribute("d", "M " + (SX+10) + " " + (SY-70) + " A 120 120 0 0 1 " + (cx2) + " " + (cy2));
        smear.setAttribute("opacity", String(0.8 * (1 - Math.abs((t - 0.61) / 0.06))));
      } else smear.setAttribute("opacity", "0");
    }
    var burst = document.getElementById("pbi-burst");
    if (burst) burst.setAttribute("opacity", (t >= 0.655 && t <= 0.74) ? String(1 - (t - 0.655) / 0.085) : "0");
    var sun = document.getElementById("pbi-sun");
    if (sun) sun.setAttribute("opacity", String(0.85 + ((t >= 0.65 && t <= 0.82) ? 0.15 * (1 - Math.abs((t - 0.72) / 0.1)) : 0)));
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
      else { setTimeout(_teardown, 480); }
    })(_t0);
  }

  function skip() { _teardown(); }

  var _onTeardown = null;  // cold-open bridge: the onboarding FTUE arms on intro finish
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
    if (typeof _onTeardown === "function") { var cb = _onTeardown; _onTeardown = null; cb(); }
  }

  function maybeShow() {
    if (!_enabled() || _seen() || _reduced() || _root) return false;
    _markSeen();
    _mount();
    _apply(0);
    // Auto-play: tee off on its own after a short beat so it ACTUALLY animates
    // without requiring a tap (the long-promised "plays on its own"). A tap still
    // fires it immediately; swing() guards against a double-start.
    setTimeout(function() { if (_root && !_started) swing(); }, 1100);
    return true;
  }

  window.pbTeeIntro = { maybeShow: maybeShow, show: function() { if (!_root) { _mount(); _apply(0); } }, skip: skip, _applyAt: _apply, setOnTeardown: function(fn) { _onTeardown = fn; } };
})();
