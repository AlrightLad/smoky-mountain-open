/* ═══════════════════════════════════════════════════════════════════════════
   CADDY FIGURE — standing-caddy SVG rig for the onboarding walkthrough (FTUE)

   A standing rig that reuses the proven pose VOCABULARY from the tee-shot intro
   (tapered torso mass, 2-segment arm, filled head + cap path, round-capped
   limb strokes) plus a small lerp. v8.25.11 turns the figure from a flat
   monochrome silhouette into a friendly CARTOON: a tan FACE (dot eyes + smile
   + brow/nose hint), a COLLARED POLO over the torso, separately-toned PANTS,
   tapered LIMBS with HANDS at the wrists + SHOES at the feet, and per-caddy
   cap/tell differentiators (ball / flat+pipe / visor+ponytail / backwards+towel)
   tinted by each persona's accent token. Friendly + on-brand, never crude.

   The caddy stands at ease, weight on the trail leg, a golf bag shouldered at
   the trail side. Six authored poses (idle / tipCap / nod / leanBag / point /
   pump) blend via lerp (snap under reduced-motion). point(tx,ty) is explicit
   inverse-kinematics (atan2) so he gestures at a real on-screen control.

   Clothing + accents are token-driven (--cb-felt polo, --cb-green-3 pants,
   --cb-brass + the per-caddy accent for trim) so all 6 themes recolor
   automatically. Skin tone is a single tasteful hardcoded tan — the token set
   intentionally has no skin color, so we own one warm tone locally. Inert
   until walkthrough.js mounts it. window.pbCaddy.

   CADDY_KEY column schema (standing figure) — UNCHANGED, the pose engine and
   the walkthrough still drive exactly these eight columns:
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

  // Clothing + accent palette (token-driven so all 6 themes recolor). Skin is a
  // single warm hardcoded tan (no token exists); SKIN_DK is a touch darker for
  // the nose/brow hint + ear so the face reads with cheap 2-tone shading.
  var C = {
    polo:   "var(--cb-felt)",        // collared polo shirt block
    poloHi: "var(--cb-green-3)",     // lighter polo panel (subtle 2-tone shade)
    pants:  "var(--cb-green-3)",     // trousers — distinct tone from the polo
    pantsHi:"var(--cb-sand)",        // cuff / pant highlight
    accent: "var(--cb-brass)",       // default trim/cap-band (overridden per caddy)
    depth:  "var(--cb-mute-3)",      // bag body + strap (sits behind)
    shoe:   "var(--cb-ink)",         // shoes
    line:   "var(--cb-ink)",         // face features + thin outlines
    skin:   "#D8A878",               // tasteful warm tan (one tone)
    skinDk: "#B98A5E"                // nose/brow/ear shade
  };

  var _root = null, _raf = null, _cur = null, _target = null, _t0 = 0, _dur = 320, _onbench = null;
  // Active caddy id — chooses cap style + tell (ball / flat+pipe / visor+
  // ponytail / backwards+towel) and the accent tint. Default "caddy" = the
  // generic ball-cap guide, so existing mount({size}) calls are unchanged.
  var _caddy = "caddy";

  function _reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function _lerp(a, b, f) { return a + (b - a) * f; }
  function _ease(f) { return f < .5 ? 2*f*f : 1 - Math.pow(-2*f + 2, 2) / 2; }
  function _clone(p) { return p.slice(); }

  // Per-caddy spec. cap = which cap shape _apply() draws; tell = the extra prop;
  // accent = the trim token (mirrors window.pbCaddies in caddy-voices.js so the
  // figure matches the chosen voice). Falls back to "caddy".
  var CADDY_SPEC = {
    caddy:   { cap: "ball",      tell: null,       accent: "var(--cb-brass)" },
    oldtom:  { cap: "flat",      tell: "pipe",     accent: "var(--cb-brass-deep)" },
    birdie:  { cap: "visor",     tell: "ponytail", accent: "var(--cb-green)" },
    bagroom: { cap: "backwards", tell: "towel",    accent: "var(--cb-copper)" }
  };
  function _spec() { return CADDY_SPEC[_caddy] || CADDY_SPEC.caddy; }

  // Base anchor geometry (viewBox 0 0 160 300). Scale-independent; the <svg>
  // width sets the rendered size (140 stage / 56 bust). UNCHANGED — the cartoon
  // is layered onto the same skeleton the pose math already drives.
  var HIPX0 = 80, HIPY = 188, TORSO = 64, WSH = 42, WHIP = 26, HEADR = 15, ARM = 46, FORE = 30, LEGLEN = 96;

  function _scene() {
    var sp = _spec(), acc = sp.accent;
    return '' +
    '<svg id="pbc-svg" viewBox="0 0 160 300" width="100%" style="height:auto;display:block;overflow:visible" aria-hidden="true">' +
      // bag sits BEHIND the figure (drawn first)
      '<g id="pbc-bag">' +
        '<path id="pbc-strap" d="" fill="none" stroke="' + C.depth + '" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>' +
        '<rect id="pbc-bagbody" x="0" y="0" width="22" height="70" rx="11" fill="' + C.depth + '" stroke="' + C.line + '" stroke-width="1" opacity=".92"/>' +
        '<line id="pbc-club1" x1="0" y1="0" x2="0" y2="0" stroke="' + acc + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line id="pbc-club2" x1="0" y1="0" x2="0" y2="0" stroke="' + acc + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line id="pbc-club3" x1="0" y1="0" x2="0" y2="0" stroke="' + acc + '" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +
      // towel over the shoulder (bagroom only) — drawn behind the body
      '<path id="pbc-towel" d="" fill="' + acc + '" stroke="' + C.line + '" stroke-width="1" opacity="0"/>' +
      // PANTS — two tapered legs in their own tone, with rounded SHOES at the feet
      '<path id="pbc-leg-trail" d="" fill="none" stroke="' + C.pants + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path id="pbc-leg-lead" d="" fill="none" stroke="' + C.pants + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse id="pbc-shoe-trail" cx="0" cy="0" rx="9" ry="5" fill="' + C.shoe + '"/>' +
      '<ellipse id="pbc-shoe-lead"  cx="0" cy="0" rx="9" ry="5" fill="' + C.shoe + '"/>' +
      // TORSO — collared polo: filled mass (polo) + a lighter side panel (shade)
      '<path id="pbc-torso" d="" fill="' + C.polo + '"/>' +
      '<path id="pbc-torso-hi" d="" fill="' + C.poloHi + '" opacity=".55"/>' +
      '<path id="pbc-placket" d="" fill="none" stroke="' + acc + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path id="pbc-collar" d="" fill="' + acc + '"/>' +
      // ponytail (birdie only) — behind the head
      '<path id="pbc-ponytail" d="" fill="' + acc + '" stroke="' + C.line + '" stroke-width="1" opacity="0"/>' +
      // HEAD — tan face with ear + brow/nose shade, two dot eyes, a small smile
      '<circle id="pbc-head" cx="0" cy="0" r="' + HEADR + '" fill="' + C.skin + '"/>' +
      '<circle id="pbc-ear" cx="0" cy="0" r="3.4" fill="' + C.skinDk + '"/>' +
      '<path id="pbc-brow" d="" fill="none" stroke="' + C.line + '" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>' +
      '<circle id="pbc-eye1" cx="0" cy="0" r="1.7" fill="' + C.line + '"/>' +
      '<circle id="pbc-eye2" cx="0" cy="0" r="1.7" fill="' + C.line + '"/>' +
      '<path id="pbc-nose" d="" fill="none" stroke="' + C.skinDk + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path id="pbc-smile" d="" fill="none" stroke="' + C.line + '" stroke-width="1.5" stroke-linecap="round"/>' +
      // pipe (oldtom only)
      '<g id="pbc-pipe" opacity="0">' +
        '<path id="pbc-pipe-stem" d="" fill="none" stroke="' + C.shoe + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle id="pbc-pipe-bowl" cx="0" cy="0" r="3.2" fill="' + C.shoe + '"/>' +
      '</g>' +
      // CAP — shape varies per caddy (ball / flat / visor / backwards)
      '<path id="pbc-cap" d="" fill="' + C.polo + '"/>' +
      '<path id="pbc-cap-band" d="" fill="none" stroke="' + acc + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle id="pbc-capbtn" cx="0" cy="0" r="2.2" fill="' + acc + '"/>' +
      // gesturing arm (2-segment) — drawn last, in front — tapered polo sleeve +
      // bare forearm + a HAND at the wrist
      '<path id="pbc-sleeve" d="" fill="none" stroke="' + C.polo + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path id="pbc-forearm" d="" fill="none" stroke="' + C.skin + '" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle id="pbc-hand" cx="0" cy="0" r="5" fill="' + C.skin + '"/>' +
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
    var torsoD =
      "M " + (hipX + px*WHIP/2) + " " + (hipY + py*WHIP/2) +
      " L " + (sCx + px*WSH/2) + " " + (sCy + py*WSH/2) +
      " Q " + sCx + " " + (sCy - 4) + " " + (sCx - px*WSH/2) + " " + (sCy - py*WSH/2) +
      " L " + (hipX - px*WHIP/2) + " " + (hipY - py*WHIP/2) + " Z";
    _set("pbc-torso", { d: torsoD });
    // lighter polo panel down the lead (front) half — cheap 2-tone shading
    _set("pbc-torso-hi", { d:
      "M " + sCx + " " + (sCy - 3) +
      " L " + (sCx + px*WSH/2) + " " + (sCy + py*WSH/2) +
      " L " + (hipX + px*WHIP/2) + " " + (hipY + py*WHIP/2) +
      " L " + hipX + " " + hipY + " Z" });
    // collar — a small notched wedge at the neckline
    var nx = sCx, ny = sCy - 1;
    _set("pbc-collar", { d:
      "M " + (nx - 7) + " " + (ny - 2) +
      " L " + (nx - 2) + " " + (ny + 6) +
      " L " + (nx + 2) + " " + (ny + 6) +
      " L " + (nx + 7) + " " + (ny - 2) +
      " L " + (nx + 3) + " " + (ny - 3) +
      " L " + nx + " " + (ny + 2) +
      " L " + (nx - 3) + " " + (ny - 3) + " Z" });
    // placket — short button line down from the collar
    _set("pbc-placket", { d: "M " + nx + " " + (ny + 5) + " L " + nx + " " + (ny + 20) });

    // ── HEAD + FACE ───────────────────────────────────────────────────────────
    var hx = sCx + Math.sin((p[3]) * Math.PI/180) * 4 + 2;
    var hy = sCy - 26 - (p[6] * 0.4);
    var tiltF = p[3] * 0.18; // face features lean with the head tilt
    _set("pbc-head", { cx: hx, cy: hy });
    // ear on the trail (back) side
    _set("pbc-ear", { cx: hx - HEADR + 2, cy: hy + 1 });
    // eyes — two dots on the lead (front, +x) side of the face
    _set("pbc-eye1", { cx: hx + 3,  cy: hy - 1 + tiltF });
    _set("pbc-eye2", { cx: hx + 9,  cy: hy - 1 - tiltF });
    // brow hint above the eyes
    _set("pbc-brow", { d: "M " + (hx + 1) + " " + (hy - 5 + tiltF) + " Q " + (hx + 6) + " " + (hy - 7) + " " + (hx + 11) + " " + (hy - 5 - tiltF) });
    // a soft nose tick between eyes + smile
    _set("pbc-nose", { d: "M " + (hx + 7) + " " + (hy + 1) + " L " + (hx + 6.5) + " " + (hy + 4) });
    // small friendly smile
    _set("pbc-smile", { d: "M " + (hx + 3) + " " + (hy + 6) + " Q " + (hx + 7) + " " + (hy + 9.5) + " " + (hx + 11) + " " + (hy + 6) });

    // ── CAP — per-caddy shape ──────────────────────────────────────────────────
    var sp = _spec();
    var capBtnShown = true, bandShown = true;
    if (sp.cap === "flat") {
      // flat cap — low rounded dome + a short forward stub bill
      _set("pbc-cap", { d:
        "M " + (hx - 13) + " " + (hy - 6) +
        " Q " + (hx - 4) + " " + (hy - 17) + " " + (hx + 11) + " " + (hy - 9) +
        " Q " + (hx + 18) + " " + (hy - 7) + " " + (hx + 16) + " " + (hy - 4) +
        " L " + (hx - 12) + " " + (hy - 4) + " Z" });
      _set("pbc-cap-band", { d: "" }); bandShown = false;
      capBtnShown = false;
    } else if (sp.cap === "visor") {
      // visor — open top: just a headband arc + a forward bill, hair shows above
      _set("pbc-cap", { d:
        "M " + (hx - 13) + " " + (hy - 4) +
        " Q " + (hx - 6) + " " + (hy - 11) + " " + (hx + 8) + " " + (hy - 9) +
        " Q " + (hx + 20) + " " + (hy - 8) + " " + (hx + 19) + " " + (hy - 3) +
        " L " + (hx + 7) + " " + (hy - 3) +
        " Q " + (hx - 4) + " " + (hy - 4) + " " + (hx - 13) + " " + (hy - 2) + " Z" });
      _set("pbc-cap-band", { d: "M " + (hx - 12) + " " + (hy - 3) + " Q " + (hx - 2) + " " + (hy - 6) + " " + (hx + 7) + " " + (hy - 4) });
      capBtnShown = false;
    } else if (sp.cap === "backwards") {
      // backwards cap — bill points to the trail (back, -x) side; snap-strap front
      _set("pbc-cap", { d:
        "M " + (hx + 8) + " " + (hy - 9) +
        " Q " + (hx - 6) + " " + (hy - 16) + " " + (hx - 14) + " " + (hy - 5) +
        " L " + (hx - 21) + " " + (hy - 4) +
        " L " + (hx - 21) + " " + (hy - 1) +
        " L " + (hx - 6) + " " + (hy - 1) +
        " Q " + (hx + 6) + " " + (hy - 1) + " " + (hx + 9) + " " + (hy - 5) + " Z" });
      _set("pbc-cap-band", { d: "M " + (hx + 7) + " " + (hy - 6) + " L " + (hx + 7) + " " + (hy - 1) });
      _set("pbc-capbtn", { cx: hx - 4, cy: hy - 12 });
    } else {
      // ball cap (default) — rounded crown + a bill that points lead/front (+x)
      _set("pbc-cap", { d:
        "M " + (hx - 6) + " " + (hy - 9) +
        " Q " + (hx + 12) + " " + (hy - 16) + " " + (hx + 19) + " " + (hy - 4) +
        " L " + (hx + 19) + " " + (hy - 1) +
        " L " + (hx + 6) + " " + (hy - 1) +
        " Q " + (hx + 4) + " " + (hy - 6) + " " + (hx - 6) + " " + (hy - 6) + " Z" });
      _set("pbc-cap-band", { d: "M " + (hx - 5) + " " + (hy - 6) + " L " + (hx + 6) + " " + (hy - 1) });
      _set("pbc-capbtn", { cx: hx + 2, cy: hy - 11 });
    }
    _set("pbc-capbtn", { opacity: capBtnShown ? "1" : "0" });
    if (!bandShown) _set("pbc-cap-band", { d: "" });

    // ── TELLS — ponytail / pipe / towel (only one shown per caddy) ─────────────
    var ponyOn = sp.tell === "ponytail", pipeOn = sp.tell === "pipe", towelOn = sp.tell === "towel";
    _set("pbc-ponytail", { opacity: ponyOn ? ".95" : "0",
      d: ponyOn ? ("M " + (hx - 12) + " " + (hy - 2) +
        " Q " + (hx - 22) + " " + (hy + 4) + " " + (hx - 18) + " " + (hy + 16) +
        " Q " + (hx - 14) + " " + (hy + 10) + " " + (hx - 11) + " " + (hy + 4) + " Z") : "" });
    _set("pbc-pipe", { opacity: pipeOn ? "1" : "0" });
    if (pipeOn) {
      _set("pbc-pipe-stem", { d: "M " + (hx + 8) + " " + (hy + 7) + " L " + (hx + 17) + " " + (hy + 9) });
      _set("pbc-pipe-bowl", { cx: hx + 18, cy: hy + 7 });
    }
    // towel draped over the trail shoulder
    _set("pbc-towel", { opacity: towelOn ? ".9" : "0",
      d: towelOn ? ("M " + (sCx - px*WSH/2 - 2) + " " + (sCy - py*WSH/2 + 2) +
        " l -7 2 l 3 22 l 10 -2 l -2 -22 Z") : "" });

    // ── LEGS (pants) + SHOES ───────────────────────────────────────────────────
    var footY = hipY + LEGLEN, kneeY = hipY + LEGLEN*0.5;
    var tFootX = hipX - 13, lFootX = hipX + 15;
    _set("pbc-leg-trail", { d: "M " + (hipX-7) + " " + (hipY-2) + " L " + (hipX-12) + " " + kneeY + " L " + tFootX + " " + footY });
    _set("pbc-leg-lead",  { d: "M " + (hipX+7) + " " + (hipY-2) + " L " + (hipX+13) + " " + (kneeY+2) + " L " + lFootX + " " + (footY-2) });
    // shoes — rounded toe blocks poking forward (lead) of each ankle
    _set("pbc-shoe-trail", { cx: tFootX + 3, cy: footY + 1 });
    _set("pbc-shoe-lead",  { cx: lFootX + 3, cy: footY - 1 });

    // ── GESTURING ARM — tapered polo sleeve + bare forearm + HAND ──────────────
    var shX = sCx + px*WSH*0.30, shY = sCy + py*WSH*0.30 + 4;
    var aRad = p[2] * Math.PI / 180;
    var ex = shX - ARM * Math.sin(aRad), ey = shY + ARM * Math.cos(aRad);
    var cRad = (p[2] + p[7]) * Math.PI / 180;
    var hX = ex - FORE * Math.sin(cRad), hY = ey + FORE * Math.cos(cRad);
    // upper arm = polo sleeve (wider stroke); forearm = skin (narrower) — the
    // width step is the "taper" cue without per-vertex width math.
    _set("pbc-sleeve",  { d: "M " + shX + " " + shY + " L " + ex + " " + ey });
    _set("pbc-forearm", { d: "M " + ex + " " + ey + " L " + hX + " " + hY });
    _set("pbc-hand", { cx: hX, cy: hY });

    // ── Golf bag shouldered at the TRAIL side (unchanged geometry) ─────────────
    var trailX = hipX - 40, bagTop = sCy - 26 - p[5];
    _set("pbc-bagbody", { x: trailX, y: bagTop });
    var acc = sp.accent;
    _set("pbc-club1", { x1: trailX+5,  y1: bagTop+2, x2: trailX+1,  y2: bagTop-18, stroke: acc });
    _set("pbc-club2", { x1: trailX+11, y1: bagTop+2, x2: trailX+11, y2: bagTop-21, stroke: acc });
    _set("pbc-club3", { x1: trailX+17, y1: bagTop+2, x2: trailX+21, y2: bagTop-17, stroke: acc });
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
    // optional caddy id (e.g. mount(sel, { caddy: "oldtom" })); backward-compatible
    if (opts.caddy && CADDY_SPEC[opts.caddy]) _caddy = opts.caddy;
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

  // Switch the active persona live (cap + tell + accent). Re-renders the scene
  // markup in place and re-applies the current pose so the swap is seamless.
  function setCaddy(id) {
    if (!CADDY_SPEC[id] || id === _caddy) return;
    _caddy = id;
    if (!_root || !_root.parentNode) return;
    var container = _root.parentNode;
    var w = _root.getAttribute("width"), vb = _root.getAttribute("viewBox"), wasBust = vb !== "0 0 160 300";
    container.innerHTML = _scene();
    _root = container.querySelector("#pbc-svg");
    if (_root && w) _root.setAttribute("width", w);
    if (_root && wasBust) { _root.setAttribute("viewBox", vb); _root.style.width = "100%"; _root.style.height = "100%"; }
    _apply(_cur || _clone(POSES.idle));
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

  window.pbCaddy = { mount: mount, setPose: setPose, point: point, setCaddy: setCaddy, destroy: destroy, _apply: _apply, POSES: POSES };
})();
