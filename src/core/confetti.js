/* ═══════════════════════════════════════════════════════════════════════════
   CONFETTI CELEBRATION (task #31)
   iMessage-style confetti sprinkle — tasteful, never overwhelming (Founder).
   Hand-rolled canvas, zero dependencies (P4: vendoring needs central approval).

   Public API: window.pbCelebrate(opts)
     key:    throttle bucket, e.g. 'best' | 'league' (default 'default')
     subtle: true → shorter, sparser burst (league-page arrival)
     once:   true → fires at most once per browser session for this key

   Behavior:
     - Full-screen fixed canvas, pointer-events:none, z-index 999 (above the
       share-card modal at 300, below the toast stack at 1000 so copy stays
       crisp, below quick-search 9000 / crisis banner 10000).
     - ~100 particles (subtle: ~45) in Clubhouse palette, gravity + sideways
       drift + spin + flutter, ~2.3s (subtle: ~1.4s), then fades + removes.
     - prefers-reduced-motion: reduce → no-op.
     - Throttle: same key can't fire twice within 30s (sessionStorage guard).
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  var THROTTLE_MS = 30000;
  var Z_INDEX = 999;
  // Clubhouse tokens, read at fire-time (canvas can't resolve CSS var()).
  // Hex fallbacks = brass / felt green / chalk / brass-2 per task spec.
  var TOKENS = ["--cb-brass", "--cb-felt", "--cb-chalk", "--cb-brass-2"];
  var FALLBACK = ["#B4893E", "#2F4A3A", "#F4EFE4", "#C9A04A"];
  var _active = false;

  function _palette() {
    var out = [];
    try {
      var cs = getComputedStyle(document.documentElement);
      for (var i = 0; i < TOKENS.length; i++) {
        var v = (cs.getPropertyValue(TOKENS[i]) || "").trim();
        out.push(v || FALLBACK[i]);
      }
    } catch (e) { out = FALLBACK.slice(); }
    return out;
  }

  // True when the celebration must not fire: no DOM yet, reduced-motion set,
  // a celebration already running, or this key fired within the throttle
  // window (once:true = once per browser session). Arms the guard on pass.
  function _blocked(key, once) {
    if (typeof document === "undefined" || !document.body) return true;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (_active) return true; // one celebration at a time
    try {
      var gkey = "pb_celebrate_" + key;
      var last = parseInt(sessionStorage.getItem(gkey) || "0", 10);
      if (last && (once || Date.now() - last < THROTTLE_MS)) return true;
      sessionStorage.setItem(gkey, String(Date.now()));
    } catch (e) { /* sessionStorage unavailable (private mode) — celebrate anyway */ }
    return false;
  }

  function pbCelebrate(opts) {
    opts = opts || {};
    if (_blocked(opts.key || "default", !!opts.once)) return;

    var subtle = !!opts.subtle;
    var lifeMs = subtle ? 1400 : 2300;  // visible sprinkle window
    var fadeMs = 450;                   // global fade tail after lifeMs
    var count = subtle ? 45 : 100;

    var canvas = document.createElement("canvas");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:" + Z_INDEX;
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.body.appendChild(canvas);
    ctx.scale(dpr, dpr);

    var colors = _palette();
    var sprinkleWindow = lifeMs * 0.4; // staggered spawn — a sprinkle, not a blast
    var parts = [];
    for (var i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W,
        y: -12 - Math.random() * H * 0.15,        // start just above the viewport
        vx: (Math.random() - 0.5) * 60,           // px/s sideways drift
        vy: 130 + Math.random() * 110,            // px/s initial fall speed
        w: 5 + Math.random() * 4,
        h: 8 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 7,            // rad/s spin
        sway: 1.5 + Math.random() * 2,            // flutter frequency (Hz-ish)
        phase: Math.random() * Math.PI * 2,
        delay: Math.random() * sprinkleWindow,
        color: colors[i % colors.length]
      });
    }

    var GRAVITY = 320; // px/s²
    var start = null, prev = null, raf = null;
    _active = true;

    function cleanup() {
      _active = false;
      if (raf) cancelAnimationFrame(raf);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    function frame(ts) {
      if (start === null) { start = ts; prev = ts; }
      var elapsed = ts - start;
      var dt = Math.min((ts - prev) / 1000, 0.05); // clamp background-tab jumps
      prev = ts;
      ctx.clearRect(0, 0, W, H);
      var alpha = elapsed > lifeMs ? Math.max(0, 1 - (elapsed - lifeMs) / fadeMs) : 1;
      if (alpha <= 0) { cleanup(); return; }
      ctx.globalAlpha = alpha;
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        if (elapsed < p.delay) continue;
        p.vy += GRAVITY * dt;
        p.x += (p.vx + Math.sin((elapsed / 1000) * p.sway + p.phase) * 40) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 20) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // Squash one axis as it spins — reads as a fluttering paper rectangle.
        ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin((elapsed / 1000) * p.sway * 2 + p.phase)));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    // Hard safety net: rAF can stall in hidden tabs — never leave the canvas behind.
    setTimeout(function() { if (canvas.parentNode) cleanup(); }, lifeMs + fadeMs + 3000);
  }

  // Exposed globally for the wired triggers (PB round, league arrival) and
  // future milestone wiring. All call sites guard with typeof checks so the
  // app is unaffected if this module isn't loaded.
  window.pbCelebrate = pbCelebrate;
})();
