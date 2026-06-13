/* ═══════════════════════════════════════════════════════════════════════════
   TEE-SHOT WELCOME INTRO (v8.25.41 — Lottie golf swing, auto-open flow · #34/#61)

   A professionally-authored Lottie golf swing (MJ Mograph via LottieFiles, Simple
   License), recolored to the Parbaughs dawn palette (brass/cream/felt-green),
   plays once over an inline dawn golf-course scene when a member signs in — then
   the app opens ON ITS OWN. No "tap to enter" gate, no skip, no double-click.

   FLOW (Founder 2026-06-12): the golfer addresses the ball; one tap tees off
   (or it auto-tees after a short beat if untouched); the swing plays at its
   natural tempo (NOT slowed); when it completes the overlay fades straight into
   the Clubhouse. Taps during the swing are ignored — it can't be skipped or
   fast-forwarded.

   Renderer is CANVAS (not svg): the rig's torso wedges between two coplanar leg
   fills, and the svg renderer's sub-pixel anti-aliasing jittered that seam (the
   "knee flicker"); canvas rasterizes per frame, so the seam is stable.

   Our requestAnimationFrame is gone — Lottie owns its own ~ native-tempo clock;
   its 'complete' event drives the auto-open (a safety timer force-opens if it
   never fires). Once/session, ON by default (opt out via pb_intro_enabled='0'),
   reduced-motion safe (static finished frame, then auto-open). lottie-web loads
   from cdnjs (already in index.html script-src CSP). Asset:
   public/lottie/golf-swing-pb.json (recolored; 96f@24fps, 30 layers).
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  // Resolve the asset against the page's base directory — /smoky-mountain-open/
  // in prod (GitHub Pages) and / in dev. (document.baseURI, NOT import.meta:
  // intro.js is concatenated into the CORE IIFE, which ESLint parses as a script
  // where import.meta is a parse error.)
  var LOTTIE_URL = (function() { try { return new URL("lottie/golf-swing-pb.json", document.baseURI).href; } catch (e) { return "/lottie/golf-swing-pb.json"; } })();
  var _root = null, _started = false, _done = false, _safety = null, _autoTee = null;
  var _anim = null;        // the lottie AnimationItem
  var _ready = false;      // true once the Lottie JSON has parsed (DOMLoaded)
  var _wantPlay = false;   // a tee-off was requested before the asset finished loading
  var SWING_SPEED = 1;      // native tempo — Founder: "not at a slow speed"
  var FINISH_FRAME = 74;    // stop at the follow-through "watching the shot down the
                            // fairway" pose — BEFORE the ball returns + before he
                            // recenters (Founder); play [0..FINISH_FRAME] then hold.
  var SAFETY_MS = 8000;     // hard backstop: force the app open even if 'complete' never fires

  // Dawn backdrop palette (the COURSE_SVG + the #pbIntro radial both use these).
  var SKY_TOP = "#0c2c20", SKY_MID = "#1a4636", SKY_GLOW = "#caa04a", GLOW_HOT = "#f0d488", SUN = "#f6e6b4";

  function _reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function _enabled() { try { return localStorage.getItem("pb_intro_enabled") !== "0"; } catch (e) { return true; } }
  function _seen() { try { return sessionStorage.getItem("pb_intro_seen") === "1"; } catch (e) { return false; } }
  function _markSeen() { try { sessionStorage.setItem("pb_intro_seen", "1"); } catch (e) {} }

  function _scene() {
    // Lottie mount point — the asset is square (1920×1920); aspect-ratio:1/1 at
    // max 360px keeps the golfer a similar on-screen size to the old ~520px SVG.
    return '<div id="pbi-lottie" style="width:100%;max-width:360px;aspect-ratio:1/1;display:block" aria-hidden="true"></div>';
  }

  // Inline dawn golf-course backdrop (no external asset) — a real scene behind the
  // golfer, not a bare gradient (Founder 2026-06-12). Sits at z-index:-1 so the
  // golfer (#pbi-lottie, in the z-index:1 overlay) stands ON the green. On-brand:
  // dawn sky → felt-green rolling hills → lit green + brass flagstick + sun glow.
  // Gradient/filter ids are pbi-prefixed to avoid collisions with other inline SVGs.
  var COURSE_SVG = '<svg id="pbi-course" viewBox="0 0 1080 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;z-index:-1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pbiSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0a2218"/><stop offset="42%" stop-color="#16382a"/><stop offset="80%" stop-color="#2e4d36"/><stop offset="100%" stop-color="#3c5037"/></linearGradient><radialGradient id="pbiSun" cx="52%" cy="100%" r="60%"><stop offset="0%" stop-color="#f6e6b4" stop-opacity="0.5"/><stop offset="55%" stop-color="#f0d488" stop-opacity="0.13"/><stop offset="100%" stop-color="#f0d488" stop-opacity="0"/></radialGradient><linearGradient id="pbiFairway" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2f4a38"/><stop offset="100%" stop-color="#477152"/></linearGradient></defs><rect width="1080" height="440" fill="url(#pbiSkyGrad)"/><ellipse cx="560" cy="440" rx="400" ry="240" fill="url(#pbiSun)"/><path d="M0 432 Q 220 392 440 420 Q 700 396 1080 424 L1080 470 L0 470 Z" fill="#13291e"/><rect y="424" width="1080" height="656" fill="#26402f"/><path d="M 180 1080 L 498 430 L 582 430 L 900 1080 Z" fill="url(#pbiFairway)"/><path d="M 332 1080 L 516 430 L 534 430 L 512 1080 Z" fill="#54845f" opacity="0.4"/><path d="M 648 1080 L 548 430 L 566 430 L 768 1080 Z" fill="#54845f" opacity="0.4"/><ellipse cx="540" cy="436" rx="42" ry="10" fill="#5b885f"/><line x1="556" y1="436" x2="556" y2="388" stroke="#d8b260" stroke-width="2.5" stroke-linecap="round"/><polygon points="556,388 556,401 580,394.5" fill="#caa04a"/><ellipse cx="540" cy="930" rx="230" ry="58" fill="#54845f" opacity="0.45"/></svg>';

  function _mount() {
    _root = document.createElement("div");
    _root.id = "pbIntro";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-label", "Welcome to the Clubhouse — teeing off");
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(95% 95% at 62% 80%, " + SKY_GLOW + " 0%, " + SKY_MID + " 34%, " + SKY_TOP + " 100%);transition:opacity .4s ease;overflow:hidden";
    // Course scene behind (z-index:-1); content in a z-index:1 overlay so the
    // golfer stands ON the green rather than floating over a bare gradient.
    _root.innerHTML = COURSE_SVG;
    var overlay = document.createElement("div");
    overlay.style.cssText = "position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px";
    overlay.innerHTML =
      '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:30px;color:' + GLOW_HOT + ';letter-spacing:-.5px;text-shadow:0 1px 12px rgba(0,0,0,.3)">Parbaughs.</div>' +
      _scene() +
      '<div id="pbi-hint" style="font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:2.5px;color:' + SUN + ';opacity:.7;text-transform:uppercase;text-shadow:0 1px 6px rgba(0,0,0,.4)">Tap to start your adventure</div>';
    _root.appendChild(overlay);
    // ONE tap tees off; taps during/after the swing are ignored (no skip, no
    // double-click, no "tap to enter" — the app opens on its own when it ends).
    _root.addEventListener("click", function() { if (!_started) swing(); });
    document.addEventListener("keydown", _onKey);
    document.body.appendChild(_root);
    _initLottie();
  }

  function _initLottie() {
    var mount = document.getElementById("pbi-lottie");
    if (!mount) return;
    if (typeof window.lottie === "undefined") {
      // lottie-web (cdnjs, deferred) hasn't parsed yet — retry briefly.
      setTimeout(_initLottie, 60);
      return;
    }
    try {
      _anim = window.lottie.loadAnimation({
        // canvas (not svg): rasterizes per frame → no sub-pixel seam jitter at the
        // torso/leg coplanar boundary (the Founder-reported knee flicker). The full
        // cdnjs lottie build includes the canvas renderer; max-width 360px so the
        // raster is never visibly soft.
        container: mount, renderer: "canvas", loop: false, autoplay: false, path: LOTTIE_URL
      });
      _anim.addEventListener("DOMLoaded", _onReady);
      // Non-looping play reaches the end → open the app automatically.
      _anim.addEventListener("complete", _onComplete);
    } catch (e) { _anim = null; }
  }

  function _onReady() {
    _ready = true;
    if (!_anim) return;
    if (_reduced()) { try { _anim.goToAndStop(Math.max(0, (_anim.totalFrames || 96) - 1), true); } catch (e) {} return; }
    try { _anim.goToAndStop(0, true); } catch (e) {}   // address pose until it tees off
    if (_wantPlay) _play();
  }

  // Play 0 → FINISH_FRAME then STOP (loop:false) so the golfer holds his
  // follow-through, watching the shot down the fairway, instead of looping back
  // to address. 'complete' fires at FINISH_FRAME → _onComplete holds, then opens.
  function _play() { _wantPlay = false; try { _anim.setSpeed(SWING_SPEED); _anim.playSegments([0, FINISH_FRAME], true); } catch (e) {} }

  function _onKey(e) {
    // Escape still bails to the app (keyboard accessibility); space/enter tees off
    // if it hasn't yet. No mid-swing skip.
    if (e.key === "Escape") { _teardown(); return; }
    if (!_started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); swing(); }
  }

  function swing() {
    if (_started) return;
    _started = true;
    if (_autoTee) { clearTimeout(_autoTee); _autoTee = null; }
    var hint = document.getElementById("pbi-hint");
    if (hint) hint.style.opacity = "0";
    // Hard backstop so the member is never trapped if 'complete' doesn't fire.
    if (_safety) clearTimeout(_safety);
    _safety = setTimeout(_teardown, SAFETY_MS);
    if (_reduced()) { _safety && clearTimeout(_safety); _safety = setTimeout(_teardown, 1100); return; }
    if (_ready) _play();
    else _wantPlay = true;
  }

  // Swing finished → admire the follow-through for a beat, then open the app on
  // its own (no tap gate — Founder: "then it opens the app").
  function _onComplete() {
    if (!_started || _done) return;
    _done = true;
    if (_safety) clearTimeout(_safety);
    // Hold the finish pose ~1s (watching the shot down the fairway) before the
    // overlay fades into the app — the golfer never recenters.
    _safety = setTimeout(_teardown, 1000);
  }

  var _onTeardown = null;  // cold-open bridge: the onboarding FTUE arms on intro finish
  function _teardown() {
    if (_safety) { clearTimeout(_safety); _safety = null; }
    if (_autoTee) { clearTimeout(_autoTee); _autoTee = null; }
    _done = false;
    document.removeEventListener("keydown", _onKey);
    _started = false;
    if (_anim) { try { _anim.destroy(); } catch (e) {} _anim = null; }
    _ready = false; _wantPlay = false;
    // Fire the cold-open bridge callback (the onboarding FTUE) ONLY AFTER #pbIntro
    // is actually removed from the DOM. Firing it during the 420ms fade let
    // walkthrough.js route() still find #pbIntro and re-defer to setOnTeardown
    // forever — so the FTUE never started (caught in V1 capture v8.25.17). Now the
    // element is gone first, so route() falls through and runs the tour.
    function _fireBridge() { if (typeof _onTeardown === "function") { var cb = _onTeardown; _onTeardown = null; cb(); } }
    if (_root) {
      _root.style.opacity = "0";
      var r = _root; _root = null;
      setTimeout(function() { if (r && r.parentNode) r.parentNode.removeChild(r); _fireBridge(); }, 420);
    } else {
      _fireBridge();
    }
  }

  function maybeShow() {
    // reduce-motion no longer SUPPRESSES the swing — the Founder wants the arrival
    // moment on EVERY sign-in. Only an explicit opt-out (pb_intro_enabled='0'),
    // already-seen-this-session, or a live overlay short-circuits.
    if (!_enabled() || _seen() || _root) return false;
    _markSeen();
    _mount();
    // No auto-advance (Founder): the welcome WAITS for the member's tap and must
    // never continue on its own. The tap (or Enter/Space) tees off; the swing then
    // holds its follow-through and the overlay fades into the app.
    return true;
  }

  // skip()/_applyAt kept for API compatibility (smoke + diag scripts reference the
  // export shape). skip() bails straight to the app; _applyAt seeks a frame.
  function skip() { _teardown(); }
  function _applyAt(t) {
    if (!_anim) return;
    var total = (typeof _anim.totalFrames === "number" && _anim.totalFrames) ? _anim.totalFrames : 96;
    try { _anim.goToAndStop(Math.max(0, Math.min(total, t * total)), true); } catch (e) {}
  }

  window.pbTeeIntro = { maybeShow: maybeShow, show: function() { if (!_root) { _mount(); } }, skip: skip, _applyAt: _applyAt, setOnTeardown: function(fn) { _onTeardown = fn; } };
})();
