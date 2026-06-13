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
  // v8.25.81 — realistic dawn-fairway PHOTO backdrop (Pexels, license-free: free
  // commercial use, no attribution). Replaces the flat green-tinted SVG sky the
  // Founder flagged ("sky shade isn't green but realistic colors"). Same
  // baseURI-relative resolution as the Lottie so the GitHub-Pages base path holds.
  var BG_URL = (function() { try { return new URL("img/swing-fairway.jpg", document.baseURI).href; } catch (e) { return "/img/swing-fairway.jpg"; } })();
  var _root = null, _started = false, _done = false, _safety = null, _autoTee = null;
  var _anim = null;        // the lottie AnimationItem
  var _ready = false;      // true once the Lottie JSON has parsed (DOMLoaded)
  var _wantPlay = false;   // a tee-off was requested before the asset finished loading
  var SWING_SPEED = 1;      // native tempo — Founder: "not at a slow speed"
  var FINISH_FRAME = 58;    // hold the follow-through (club at top, watching down the
                            // fairway) — frame-verified clean: both legs match, the
                            // ball sits at its farthest landed-downrange point, and
                            // it's BEFORE the respawn ball walks back to the tee (f61+)
                            // + before he recenters (f71+). (was 74 — mid-recenter.)
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
  // "Dawn Break at the 18th" — a layered, atmospheric-perspective course scene.
  // Five depth bands (sky · far ridge · mid hills · fairway · foreground) with the
  // brightest bloom kept LOW (sun half-clipped at a low horizon ~y660) so the upper
  // ~40% stays dark and the GLOW_HOT "Parbaughs." wordmark reads cleanly over it.
  // All motion is gated behind @media (prefers-reduced-motion: no-preference); the
  // reduced-motion state is the painted mid-pose. Template-literal delimited so the
  // SVG can use double-quotes throughout (the JS file otherwise uses single quotes).
  var COURSE_SVG = `<svg id="pbi-course" viewBox="0 0 1080 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;z-index:-1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="pbiSkyBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#091f17"/><stop offset="34%" stop-color="#0e2c20"/><stop offset="62%" stop-color="#274a3c"/><stop offset="84%" stop-color="#6a6a55"/><stop offset="100%" stop-color="#b78a4e"/></linearGradient>
<radialGradient id="pbiBloom" cx="58%" cy="61%" r="46%"><stop offset="0%" stop-color="#f6e6b4" stop-opacity="0.95"/><stop offset="30%" stop-color="#f0d488" stop-opacity="0.6"/><stop offset="62%" stop-color="#caa04a" stop-opacity="0.22"/><stop offset="100%" stop-color="#caa04a" stop-opacity="0"/></radialGradient>
<radialGradient id="pbiSunCore" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff6dd"/><stop offset="55%" stop-color="#f6e6b4"/><stop offset="100%" stop-color="#f0d488" stop-opacity="0.2"/></radialGradient>
<linearGradient id="pbiFairway" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3f6a4c"/><stop offset="55%" stop-color="#4f8159"/><stop offset="100%" stop-color="#5f9968"/></linearGradient>
<linearGradient id="pbiFore" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c4a36"/><stop offset="100%" stop-color="#173023"/></linearGradient>
<linearGradient id="pbiFlagstick" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8c6a2e"/><stop offset="42%" stop-color="#e4cf94"/><stop offset="58%" stop-color="#C9A04A"/><stop offset="100%" stop-color="#8c6a2e"/></linearGradient>
<linearGradient id="pbiDew" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#eafaf0" stop-opacity="0"/><stop offset="50%" stop-color="#eafaf0" stop-opacity="0.5"/><stop offset="100%" stop-color="#eafaf0" stop-opacity="0"/></linearGradient>
<filter id="pbiSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="pbiHaze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>
<clipPath id="pbiHorizon"><rect x="0" y="0" width="1080" height="660"/></clipPath>
<style>
@keyframes pbiDrift{from{transform:translateX(0)}to{transform:translateX(140px)}}
@keyframes pbiFog{0%{transform:translateX(-40px);opacity:.18}50%{transform:translateX(40px);opacity:.34}100%{transform:translateX(-40px);opacity:.18}}
@keyframes pbiRay{0%{opacity:.05}50%{opacity:.20}100%{opacity:.05}}
@keyframes pbiFlutter{0%{transform:skewX(0deg)}50%{transform:skewX(7deg)}100%{transform:skewX(0deg)}}
@keyframes pbiShimmer{0%{transform:translateX(-520px)}60%{transform:translateX(540px)}100%{transform:translateX(540px)}}
#pbi-flag{transform-box:fill-box;transform-origin:left center}
@media (prefers-reduced-motion: no-preference){
/* v8.25.73 PERF — was 9 concurrent CSS animations + 2 blur filters over the
   running Lottie canvas → jank on mobile (Founder: "more laggy"). Cut to TWO
   cheap transform-only animations (one slow cloud + the flag flutter); the rays/
   fog/dew/extra-clouds are now static, and the blur filters are removed below.
   The scene stays rich (depth, bloom, rays, stripes) but composites cleanly. */
.pbi-c1{animation:pbiDrift 80s linear infinite alternate}
#pbi-flag{animation:pbiFlutter 4.5s ease-in-out infinite}
}
</style>
</defs>

<!-- BAND 1 · sky: linear base + radial bloom blurred so the low horizon blooms instead of banding -->
<rect width="1080" height="1080" fill="url(#pbiSkyBase)"/>
<rect width="1080" height="900" fill="url(#pbiBloom)"/>

<!-- god-ray cone: thin blurred triangles fanning up from the sun, staggered breathing -->
<g clip-path="url(#pbiHorizon)">
<polygon class="pbi-ray1" points="626,652 470,40 540,30" fill="#f6e6b4"/>
<polygon class="pbi-ray2" points="626,652 612,20 690,28" fill="#f0d488"/>
<polygon class="pbi-ray3" points="626,652 760,46 836,70" fill="#f6e6b4"/>
</g>

<!-- sun core, half-clipped at the horizon (only the top dome shows) -->
<g clip-path="url(#pbiHorizon)"><circle cx="626" cy="678" r="70" fill="url(#pbiSunCore)"/></g>

<!-- parallax clouds (3 speeds); palette desaturated to sit against the dawn sky -->
<g opacity="0.30" fill="#cdbf9a"><path class="pbi-c1" d="M120 196 q34 -30 78 -10 q28 -22 62 4 q38 -4 30 28 l-196 4 q-20 -12 -8 -26z"/></g>
<g opacity="0.22" fill="#b7a880"><path class="pbi-c2" d="M740 150 q28 -24 66 -8 q26 -18 54 6 l2 28 l-140 4 q-18 -14 18 -26z"/></g>
<g opacity="0.16" fill="#a89870"><path class="pbi-c3" d="M430 110 q24 -20 56 -6 q22 -14 46 6 l2 22 l-118 2 q-14 -10 14 -22z"/></g>

<!-- BAND 2 · far ridge: high value, low saturation, soft (blurred) edge — recedes into sky -->
<path d="M0 642 Q 240 612 470 632 Q 720 612 1080 636 L1080 700 L0 700 Z" fill="#52614e" opacity="0.7"/>

<!-- BAND 3 · mid hills: rim-lit crest + fog ribbon in the valley -->
<path d="M0 706 Q 270 666 540 692 Q 800 668 1080 700 L1080 800 L0 800 Z" fill="#33503c"/>
<path d="M0 706 Q 270 666 540 692 Q 800 668 1080 700" fill="none" stroke="#bfa86a" stroke-width="3" opacity="0.45"/>
<g clip-path="url(#pbiHorizon)"><ellipse class="pbi-fog" cx="540" cy="724" rx="430" ry="34" fill="#dfe6da"/></g>

<!-- BAND 4 · fairway: full-saturation green, mowing stripes converging to the flag (vanishing point ~626,720) -->
<rect y="760" width="1080" height="320" fill="#2f5740"/>
<path d="M 60 1080 L 560 728 L 626 720 L 360 1080 Z" fill="url(#pbiFairway)"/>
<path d="M 360 1080 L 626 720 L 692 728 L 1010 1080 Z" fill="url(#pbiFairway)"/>
<g opacity="0.16" fill="#7cb585">
<path d="M 196 1080 L 588 726 L 600 725 L 280 1080 Z"/>
<path d="M 470 1080 L 614 721 L 626 720 L 530 1080 Z"/>
<path d="M 760 1080 L 660 724 L 672 725 L 880 1080 Z"/>
</g>
<g opacity="0.12" fill="#1e3c2c">
<path d="M 280 1080 L 600 725 L 608 724 L 400 1080 Z"/>
<path d="M 640 1080 L 644 722 L 656 723 L 780 1080 Z"/>
</g>

<!-- dew-shimmer sweep across the green (clipped to the lit fairway zone) -->
<g clip-path="url(#pbiHorizon)"></g>
<rect class="pbi-dew" x="60" y="820" width="320" height="260" fill="url(#pbiDew)" opacity="0.7" transform="skewX(-22)"/>

<!-- ONE organic asymmetric bunker (lower-left): sand body, shadow-side stroke, cast shadow -->
<path d="M 150 980 C 90 940 130 902 210 906 C 300 902 372 922 388 962 C 402 1004 320 1028 236 1024 C 168 1022 198 1008 150 980 Z" fill="#1c3424" opacity="0.5" transform="translate(14 16)"/>
<path d="M 150 980 C 90 940 130 902 210 906 C 300 902 372 922 388 962 C 402 1004 320 1028 236 1024 C 168 1022 198 1008 150 980 Z" fill="#e6cf9c"/>
<path d="M 150 980 C 90 940 130 902 210 906 C 300 902 372 922 388 962" fill="none" stroke="#b89a62" stroke-width="6" opacity="0.7"/>

<!-- lit putting green disc at the vanishing point, with a soft cast shadow -->
<ellipse cx="630" cy="724" rx="58" ry="15" fill="#173023" opacity="0.45" transform="translate(8 5)"/>
<ellipse cx="630" cy="722" rx="56" ry="14" fill="#74bd84"/>
<ellipse cx="630" cy="722" rx="56" ry="14" fill="none" stroke="#bfa86a" stroke-width="1.5" opacity="0.4"/>

<!-- brass flagstick (vertical metal-sheen gradient) + fluttering pennant -->
<rect x="623" y="722" width="6" height="8" rx="2" fill="#3a3024"/>
<rect x="624.5" y="620" width="4" height="106" fill="url(#pbiFlagstick)"/>
<g id="pbi-flag"><path d="M628 622 L692 636 L628 654 Z" fill="#C9A04A"/><path d="M628 622 L692 636 L660 629 Z" fill="#B4893E"/></g>

<!-- BAND 5 · foreground: crisp edge, full-to-dark saturation, grass-tuft cluster -->
<path d="M0 1006 Q 280 968 540 1000 Q 820 972 1080 1004 L1080 1080 L0 1080 Z" fill="url(#pbiFore)"/>
<g stroke="#1f3a2a" stroke-width="5" stroke-linecap="round" fill="none">
<path d="M96 1080 C 92 1040 84 1024 70 1010"/><path d="M118 1080 C 118 1036 122 1018 134 1004"/><path d="M140 1080 C 134 1044 128 1026 116 1014"/>
<path d="M958 1080 C 962 1038 970 1020 984 1006"/><path d="M982 1080 C 980 1040 974 1022 962 1010"/><path d="M1004 1080 C 1008 1042 1016 1024 1030 1010"/>
</g>
</svg>`;

  function _mount() {
    _root = document.createElement("div");
    _root.id = "pbIntro";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-label", "Welcome to the Clubhouse — teeing off");
    _root.style.cssText = "position:fixed;inset:0;z-index:9000;background:#0b1a13;transition:opacity .4s ease;overflow:hidden";
    // Realistic dawn-fairway PHOTO backdrop (z-index:0) + a top/bottom dark scrim
    // so the wordmark (top) and the hint (bottom) stay legible over the bright
    // sky/turf. Replaces the green COURSE_SVG. The golfer (#pbi-lottie, in the
    // z-index:1 overlay) is positioned over the LOWER fairway so he tees off
    // "down the fairway" instead of floating in the sky (Founder alignment note).
    _root.innerHTML =
      '<div style="position:absolute;inset:0;z-index:0;background:#0b1a13 url(\'' + BG_URL + '\') center/cover no-repeat"></div>' +
      '<div style="position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(7,15,11,.60) 0%,rgba(7,15,11,.14) 24%,rgba(7,15,11,.04) 50%,rgba(7,15,11,.30) 78%,rgba(7,15,11,.62) 100%)"></div>';
    var overlay = document.createElement("div");
    overlay.style.cssText = "position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;padding:0 0 13vh";
    overlay.innerHTML =
      '<div style="position:absolute;top:8vh;left:0;right:0;text-align:center;font-family:var(--font-display);font-style:italic;font-weight:700;font-size:32px;color:' + GLOW_HOT + ';letter-spacing:-.5px;text-shadow:0 2px 16px rgba(0,0,0,.55)">Parbaughs.</div>' +
      _scene() +
      '<div id="pbi-hint" style="font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:2.5px;color:#fff;opacity:.82;text-transform:uppercase;text-shadow:0 1px 8px rgba(0,0,0,.7)">Tap to start your adventure</div>';
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
