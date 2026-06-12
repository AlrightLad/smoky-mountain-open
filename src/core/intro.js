/* ═══════════════════════════════════════════════════════════════════════════
   TEE-SHOT WELCOME INTRO (v8.25.39 — professional Lottie golf swing · task #34/#61)

   A professionally-authored Lottie golf-swing animation (MJ Mograph via
   LottieFiles, Simple License) plays once over a dawn-gradient backdrop when a
   member signs in, then the overlay fades into the Clubhouse. Replaces the prior
   hand-coded SVG keyframe rig (rigid sticks, no secondary motion, snappy easing).

   Playback: we let LOTTIE own its own timeline — goToAndPlay() runs the 96-frame
   / 24fps comp at its authored ~4s tempo, and its 'complete' event flips to the
   "tap to enter" finish gate. (An earlier build drove the frames off our own rAF
   via goToAndStop; the rAF clock misbehaved and the swing flashed by in ~1s — V1
   capture caught it. Letting Lottie play itself guarantees the authored tempo.)

   A double-click CANNOT fast-forward the swing: once it starts, _ffLocked makes
   mid-swing taps inert until the finish gate (Founder report — double-click used
   to skip it). Reduced-motion shows the finished frame statically (no motion).

   Once/session, ON by default (opt out via pb_intro_enabled='0'). lottie-web
   loads from cdnjs (already in index.html script-src CSP). Asset:
   public/lottie/golf-swing.json.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  // Resolve the asset against the page's base directory — /smoky-mountain-open/
  // in prod (GitHub Pages) and / in dev. (document.baseURI, NOT import.meta:
  // intro.js is concatenated into the CORE IIFE, which ESLint parses as a script
  // where import.meta is a parse error.)
  var LOTTIE_URL = (function() { try { return new URL("lottie/golf-swing.json", document.baseURI).href; } catch (e) { return "/lottie/golf-swing.json"; } })();
  var _root = null, _started = false, _done = false, _safety = null;
  var _anim = null;        // the lottie AnimationItem
  var _ready = false;      // true once the Lottie JSON has parsed (DOMLoaded)
  var _wantPlay = false;   // swing() requested before the asset finished loading
  var _ffLocked = false;   // true once the swing starts — blocks any fast-forward (no double-click skip)

  // Dawn backdrop palette — the Lottie golfer renders over this gradient. An
  // intentional dawn-silhouette art scene (like the share card), NOT themed
  // Clubhouse tokens. The old SVG carried its own sky; that gradient now lives on
  // #pbIntro itself via CSS so the arrival moment keeps its mood.
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

  function _mount() {
    _root = document.createElement("div");
    _root.id = "pbIntro";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-label", "Welcome to the Clubhouse — tap to tee off");
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(95% 95% at 62% 80%, " + SKY_GLOW + " 0%, " + SKY_MID + " 34%, " + SKY_TOP + " 100%);transition:opacity .4s ease";
    _root.innerHTML =
      '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:30px;color:' + GLOW_HOT + ';letter-spacing:-.5px;text-shadow:0 1px 12px rgba(0,0,0,.3)">Parbaughs.</div>' +
      _scene() +
      '<div id="pbi-hint" style="font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:2.5px;color:' + SUN + ';opacity:.7;text-transform:uppercase">Tap to tee off</div>';
    // Tap on the finished gate ENTERS; tap mid-swing is intentionally ignored (no
    // skip-ahead / double-click fast-forward); tap before it starts tees off.
    _root.addEventListener("click", function() { if (_done) _enter(); else if (_started) { /* swing in progress — ignore, no skip-ahead */ } else swing(); });
    document.addEventListener("keydown", _onKey);
    document.body.appendChild(_root);
    _initLottie();
  }

  function _initLottie() {
    var mount = document.getElementById("pbi-lottie");
    if (!mount) return;
    if (typeof window.lottie === "undefined") {
      // lottie-web (cdnjs, deferred) hasn't parsed yet — retry briefly. The swing
      // won't visually start until _anim is ready (_wantPlay remembers a pending
      // swing), so a slow CDN just delays the first painted frame.
      setTimeout(_initLottie, 60);
      return;
    }
    try {
      _anim = window.lottie.loadAnimation({
        container: mount, renderer: "svg", loop: false, autoplay: false, path: LOTTIE_URL
      });
      _anim.addEventListener("DOMLoaded", _onReady);
      // Non-looping play reaches the end → flip to the tap-to-enter gate.
      _anim.addEventListener("complete", function() { if (_started && !_done) _finishHold(); });
    } catch (e) { _anim = null; }
  }

  function _onReady() {
    _ready = true;
    if (!_anim) return;
    if (_reduced()) {
      // Reduced motion: park on the FINISHED frame, no playback (accessible —
      // the golfer still appears as the arrival moment; maybeShow showed the gate).
      try { _anim.goToAndStop(Math.max(0, (_anim.totalFrames || 96) - 1), true); } catch (e) {}
      return;
    }
    try { _anim.goToAndStop(0, true); } catch (e) {}   // address pose until it tees off
    if (_wantPlay) _play();   // swing() fired before the asset finished loading
  }

  // The asset's native play is brisk (~1.3s); slow it to a deliberate, cinematic
  // arrival tempo. setSpeed scales lottie's own clock, so 'complete' (→ the
  // finish gate) lands at the stretched end — no separate timer needed.
  var SWING_SPEED = 0.55;
  function _play() { _wantPlay = false; try { _anim.setSpeed(SWING_SPEED); _anim.goToAndPlay(0, true); } catch (e) {} }

  function _onKey(e) {
    if (e.key === "Escape") { skip(); return; }
    if (!_started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); swing(); }
  }

  // Seek the Lottie to progress t (0..1). Retained for the public _applyAt hook
  // and the fast-forward path; normal playback uses _play() (Lottie's own clock).
  function _apply(t) {
    if (!_anim) return;
    var total = (typeof _anim.totalFrames === "number" && _anim.totalFrames) ? _anim.totalFrames : 96;
    var frame = Math.max(0, Math.min(total, t * total));
    try { _anim.goToAndStop(frame, true); } catch (e) {}
  }

  function swing() {
    if (_started) return;
    _started = true;
    _ffLocked = true;   // from here, mid-swing taps cannot fast-forward the animation
    var hint = document.getElementById("pbi-hint");
    if (hint) hint.style.opacity = "0";
    if (_reduced()) { _finishHold(); return; }
    if (_ready) _play();
    else _wantPlay = true;   // play as soon as the asset is ready
  }

  // After the ball flies, HOLD on a "tap to enter" gate rather than auto-closing:
  // the tap opens the app + arms the onboarding (the Founder's flow). A generous
  // safety timer still advances so a non-tapper is never trapped (and the FTUE,
  // armed on teardown via the cold-open bridge, always eventually fires).
  function _finishHold() {
    _done = true;
    var hint = document.getElementById("pbi-hint");
    if (hint) { hint.textContent = "Tap to enter the Clubhouse"; hint.style.opacity = "0.95"; }
    if (_safety) clearTimeout(_safety);
    _safety = setTimeout(_teardown, 8000);
  }
  function _enter() { if (_safety) { clearTimeout(_safety); _safety = null; } _teardown(); }
  // Double-guarded: a mid-swing fast-forward is blocked entirely (_ffLocked), so
  // even a programmatic call during playback is inert (Founder: double-click must
  // not skip the swing).
  function _fastForward() { if (_ffLocked) return; if (_anim) { try { _anim.stop(); } catch (e) {} } _apply(1); _finishHold(); }

  function skip() { _teardown(); }

  var _onTeardown = null;  // cold-open bridge: the onboarding FTUE arms on intro finish
  function _teardown() {
    if (_safety) { clearTimeout(_safety); _safety = null; }
    _done = false;
    document.removeEventListener("keydown", _onKey);
    _started = false;
    // Free the Lottie player's SVG subtree + internal timers (it builds its own),
    // and reset the guards, so a re-mount within the session is clean.
    if (_anim) { try { _anim.destroy(); } catch (e) {} _anim = null; }
    _ffLocked = false; _ready = false; _wantPlay = false;
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
    if (_reduced()) {
      // Static finished frame (parked by _onReady) + the tap-to-enter gate now.
      _finishHold();
      return true;
    }
    // Auto-play: tee off on its own after a short beat so the swing ACTUALLY plays
    // without requiring a tap. A tap still fires it immediately; swing() guards
    // against a double-start, and _play() runs Lottie's own ~4s timeline.
    setTimeout(function() { if (_root && !_started) swing(); }, 1100);
    return true;
  }

  window.pbTeeIntro = { maybeShow: maybeShow, show: function() { if (!_root) { _mount(); } }, skip: skip, _applyAt: _apply, setOnTeardown: function(fn) { _onTeardown = fn; } };
})();
