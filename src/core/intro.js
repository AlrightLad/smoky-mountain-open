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
  // v8.25.85 — FULLY ILLUSTRATED dawn-fairway scene (Founder 2026-06-13 17:15:
  // "Fully illustrated is the option I want as it fits brand"). Flat-vector,
  // realistic dawn COLORS (indigo→periwinkle→peach→gold sky, NOT green), soft
  // sun + glow, clouds, treeline, 4 receding fairway bands w/ mowing stripes, a
  // green w/ brass pin + claret flag, and a tee box the golfer stands on — one
  // cohesive illustrated style WITH the cartoon golfer (replaces the photo, which
  // clashed, and the glitchy posterize). No filters/animations → perf-safe.
  var COURSE_SVG_V2 = `<svg id="pbi-course" viewBox="0 0 1080 1920" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:0;left:0;z-index:0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="pbivSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2b4a"/><stop offset="0.28" stop-color="#3c4a73"/><stop offset="0.52" stop-color="#5a6b9a"/><stop offset="0.74" stop-color="#c98f72"/><stop offset="0.92" stop-color="#e8b65f"/><stop offset="1" stop-color="#eac072"/></linearGradient><radialGradient id="pbivSun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff4d6" stop-opacity="0.95"/><stop offset="0.3" stop-color="#fbe9b8" stop-opacity="0.55"/><stop offset="0.65" stop-color="#f3d28a" stop-opacity="0.22"/><stop offset="1" stop-color="#e8b65f" stop-opacity="0"/></radialGradient><linearGradient id="pbivBand1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aab80"/><stop offset="1" stop-color="#7f9469"/></linearGradient><linearGradient id="pbivBand2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f8b5b"/><stop offset="1" stop-color="#557049"/></linearGradient><linearGradient id="pbivBand3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#477049"/><stop offset="1" stop-color="#3a6140"/></linearGradient><linearGradient id="pbivBand4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#356139"/><stop offset="1" stop-color="#264327"/></linearGradient><radialGradient id="pbivGreen" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#74a25e"/><stop offset="1" stop-color="#56814a"/></radialGradient><radialGradient id="pbivTee" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#3f7044"/><stop offset="1" stop-color="#2c5333"/></radialGradient><style>#pbiv-flag{transform-box:fill-box;transform-origin:0 50%}@keyframes pbivDrift{from{transform:translateX(0)}to{transform:translateX(85px)}}@keyframes pbivFlutter{0%,100%{transform:skewX(0deg) scaleX(1)}50%{transform:skewX(-10deg) scaleX(.93)}}@keyframes pbivGlow{0%,100%{opacity:.82}50%{opacity:1}}@media (prefers-reduced-motion:no-preference){.pbiv-cloud{animation:pbivDrift 95s linear infinite alternate}.pbiv-cloud.c2{animation-duration:135s}.pbiv-cloud.c3{animation-duration:165s}#pbiv-flag{animation:pbivFlutter 4.6s ease-in-out infinite}#pbiv-glow{animation:pbivGlow 7s ease-in-out infinite}}</style></defs><rect x="0" y="0" width="1080" height="1090" fill="url(#pbivSky)"/><circle id="pbiv-glow" cx="640" cy="1010" r="430" fill="url(#pbivSun)"/><circle cx="640" cy="1018" r="62" fill="#fbe9b8"/><circle cx="640" cy="1018" r="62" fill="#fff4d6" opacity="0.5"/><g fill="#ffffff"><path class="pbiv-cloud" d="M170 330 q40 -52 110 -42 q26 -44 92 -28 q60 -8 70 40 q40 6 24 40 q-150 10 -296 6 q-30 -30 -100 -16 Z" opacity="0.13"/><path class="pbiv-cloud c2" d="M690 250 q34 -42 96 -32 q50 -28 96 6 q44 0 36 36 q-120 12 -224 6 q-22 -22 -100 -22 Z" opacity="0.11"/><path class="pbiv-cloud c3" d="M430 520 q30 -34 84 -26 q44 -20 78 8 q34 4 24 30 q-118 8 -210 4 q-12 -22 -76 -20 Z" opacity="0.16"/></g><path d="M0 1090 q90 -34 200 -30 q120 4 210 -14 q140 -28 250 -10 q120 16 230 -6 q110 -22 190 6 L1080 1100 L0 1100 Z" fill="#2c4a30"/><g fill="#2c4a30"><ellipse cx="70" cy="1058" rx="48" ry="62"/><ellipse cx="150" cy="1064" rx="40" ry="50"/><ellipse cx="232" cy="1056" rx="54" ry="66"/><ellipse cx="318" cy="1066" rx="38" ry="46"/><ellipse cx="398" cy="1058" rx="50" ry="60"/><ellipse cx="486" cy="1068" rx="42" ry="48"/><ellipse cx="572" cy="1054" rx="56" ry="68"/><ellipse cx="664" cy="1066" rx="40" ry="50"/><ellipse cx="748" cy="1060" rx="50" ry="62"/><ellipse cx="836" cy="1068" rx="38" ry="46"/><ellipse cx="918" cy="1056" rx="54" ry="64"/><ellipse cx="1006" cy="1066" rx="44" ry="52"/></g><path d="M0 1100 q260 -60 540 -44 q280 16 540 -28 L1080 1300 L0 1300 Z" fill="url(#pbivBand1)"/><path d="M0 1230 q300 -66 540 -40 q300 26 540 -32 L1080 1500 L0 1500 Z" fill="url(#pbivBand2)"/><path d="M0 1430 q320 -78 540 -46 q320 30 540 -38 L1080 1740 L0 1740 Z" fill="url(#pbivBand3)"/><path d="M0 1680 q330 -70 540 -40 q330 28 540 -44 L1080 1920 L0 1920 Z" fill="url(#pbivBand4)"/><g opacity="0.5"><path d="M120 1690 q300 -56 700 -36 q120 6 240 -22 L420 1920 L0 1920 Z" fill="#3a6140" opacity="0.35"/><path d="M520 1700 q220 -40 540 -56 L1080 1920 L640 1920 Z" fill="#264327" opacity="0.3"/></g><g><ellipse cx="540" cy="1218" rx="118" ry="46" fill="url(#pbivGreen)"/><ellipse cx="540" cy="1212" rx="118" ry="46" fill="#7da868" opacity="0.35"/><rect x="571" y="1118" width="5" height="98" rx="2" fill="#c9a84c"/><path id="pbiv-flag" d="M576 1120 L632 1138 L576 1156 Z" fill="#b5472f"/><circle cx="540" cy="1226" r="5" fill="#1f3322" opacity="0.5"/></g><g><ellipse cx="540" cy="1556" rx="172" ry="58" fill="url(#pbivTee)"/><ellipse cx="540" cy="1548" rx="172" ry="58" fill="#4a8050" opacity="0.28"/><ellipse cx="540" cy="1556" rx="172" ry="58" fill="none" stroke="#23402a" stroke-width="3" opacity="0.4"/></g></svg>`;
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
    // v8.25.84 (cohesion fix, Founder 2026-06-13 17:15): the real dawn-fairway
    // PHOTO clashed with the flat CARTOON golfer ("not the same art style"). Rather
    // than revert to the green SVG (he disliked) or ship a photoreal figure (needs
    // Figma Make / a realistic Lottie + fresh budget), the photo is POSTERIZED into
    // a flat illustrated/poster rendition (#pbiPoster: saturate + 6-level discrete
    // banding) so it reads as one cohesive illustrated style WITH the golfer, while
    // keeping the realistic dawn colors + composition. Static bg → filter renders
    // once (no per-frame cost; the golfer canvas is separate). A top/bottom scrim
    // keeps the wordmark + hint legible; golfer sits over the LOWER fairway.
    _root.innerHTML = COURSE_SVG_V2 +
      '<div style="position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(7,15,11,.46) 0%,rgba(7,15,11,.10) 22%,rgba(7,15,11,.02) 46%,rgba(7,15,11,.22) 76%,rgba(7,15,11,.50) 100%)"></div>';
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
    // AUTH GATE (Founder 2026-06-14 "animation is still playing before sign in"):
    // the swing is a SIGNED-IN arrival moment. router.js fires Router.go("home")
    // on cold load BEFORE onAuthStateChanged resolves, so an unauthenticated open
    // would render home and play the swing OVER the sign-in screen. Only play once
    // a member is actually signed in. (currentUser is the shared core IIFE global;
    // null when signed out, set in onAuthStateChanged before enterApp re-arms.)
    if (typeof currentUser === "undefined" || !currentUser) return false;
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
