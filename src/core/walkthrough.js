/* ═══════════════════════════════════════════════════════════════════════════
   ONBOARDING WALKTHROUGH ENGINE (FTUE) — window.pbWalk

   One #pbWalk overlay (z-index 9100: above intro 9000, below celebrate 9999).
   Two modes: STAGE (centered card + Caddy figure) and SPOTLIGHT (brass-ring
   cutout over a real control, taps fall through). The 5-beat spine ends in an
   un-losable SANDBOXED demo hole — confetti fires on a single tap, a SAMPLE-
   flagged card lights up, and NOTHING is written to /rounds (a couch-bound new
   user can't log a real round; this gives the emotional win honestly). On
   completion it writes members/{uid}.walkthrough and grants the Rookie 100-coin
   bonus (dedup-guarded so it can never double-pay).

   Depends on: pbCaddy (figure), pbVoices (deck), pbCelebrate (confetti),
   awardCoins (parcoins), WALKTHROUGH_MAJOR, currentUser/currentProfile/db,
   Router, fsTimestamp. Skippable from any beat (button + Escape + scrim-tap).
   Reduced-motion safe (pose snaps, no glide) and STILL reaches the complete-
   write so the tour never re-prompts forever.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  var ROOKIE_COINS = 100;          // Founder-approved Rookie completion grant
  var TOTAL_STEPS = 8;             // welcome + calibrate + 4 tour beats + win + caddy
  var _root = null, _voice = "caddy", _calib = null, _step = 0, _onKey = null, _stage = null, _focusReturn = null, _spotPlace = null;
  // Tear down the live spotlight's resize/scroll re-anchor listeners (set in
  // spotlight()). Called before every new beat + on teardown so they never leak
  // or fire against a stale target.
  function _clearSpot() { if (_spotPlace) { window.removeEventListener("resize", _spotPlace); window.removeEventListener("scroll", _spotPlace, true); _spotPlace = null; } }

  function _profile() { return (typeof currentProfile !== "undefined" && currentProfile) || {}; }
  function _wt() { return _profile().walkthrough || {}; }
  function _uid() { return (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null; }
  function _voiceLine(beatId) { return (window.pbVoices ? window.pbVoices.line(beatId, _voice) : ""); }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ── overlay shell ──────────────────────────────────────────────────────────
  function _mount() {
    if (_root) return;
    try { _focusReturn = document.activeElement; } catch (e) {}   // WCAG 2.4.3 — return focus on teardown
    _root = document.createElement("div");
    _root.id = "pbWalk";
    _root.className = "pbw-overlay";
    _root.setAttribute("role", "dialog");
    _root.setAttribute("aria-modal", "true");
    _root.setAttribute("aria-label", "Welcome walkthrough");
    document.body.appendChild(_root);
    _onKey = function (e) { if (e.key === "Escape") skip(); };
    document.addEventListener("keydown", _onKey);
  }
  function _teardown() {
    _clearSpot();
    if (_onKey) { document.removeEventListener("keydown", _onKey); _onKey = null; }
    if (window.pbCaddy && window.pbCaddy.destroy) { try { window.pbCaddy.destroy(); } catch (e) {} }
    if (_root && _root.parentNode) _root.parentNode.removeChild(_root);
    _root = null; _stage = null;
    // Return focus to the control the member was on (keyboard-nav doesn't drop to <body>).
    if (_focusReturn && _focusReturn !== document.body && document.contains(_focusReturn)) { try { _focusReturn.focus(); } catch (e) {} }
    _focusReturn = null;
  }

  function _dots(idx) {
    var h = '<div class="pbw-dots" aria-hidden="true">';
    for (var i = 0; i < TOTAL_STEPS; i++) h += '<span class="pbw-dot' + (i <= idx ? ' pbw-dot--on' : '') + '"></span>';
    return h + '</div>';
  }
  function _scrimTapToSkip() {
    // tap on the overlay background OR the branded backdrop (not the card) = skip
    _root.addEventListener("click", function (e) {
      if (e.target === _root || (e.target.classList && e.target.classList.contains("pbw-backdrop"))) skip();
    });
  }

  // Resolve the hand-illustrated rubber-hose PORTRAIT for a caddy id (the real
  // brand art at public/img/avatars/caddy-*.jpg, declared on window.pbCaddies).
  // v8.25.241 — replaces the crude geometric SVG rig that read "comical vs the
  // competition" (Founder). Falls back to Murphy (the default) then a hard path.
  function _caddyImg(id) {
    var roster = window.pbCaddies || [];
    for (var i = 0; i < roster.length; i++) { if (roster[i].id === id) return roster[i].img || ""; }
    return (roster[0] && roster[0].img) || "img/avatars/caddy-caddy.jpg";
  }

  // ── STAGE card (immersive: branded backdrop + portrait hero + cream sheet) ────
  // opts: { eyebrow, body, primaryLabel, onPrimary, extraHtml, stepIdx, choices, portrait }
  // v8.25.241 — was a small card pinned over the fully-visible home (read as a
  // "pop up window", Founder). Now a full-cover branded backdrop kills the
  // bleed-through, the real caddy portrait is a warm hero, and the sheet rises in.
  function _stageCard(opts) {
    if (!_root) _mount();
    _clearSpot();
    _root.classList.add("pbw-stagemode");
    var choicesHtml = "";
    if (opts.choices) {
      choicesHtml = '<div style="display:flex;gap:10px;margin-bottom:12px">';
      opts.choices.forEach(function (c, i) {
        choicesHtml += '<button class="pbw-choice primary" data-ci="' + i + '" style="flex:1;min-height:44px;border:1px solid var(--cb-brass);background:var(--cb-chalk-2);color:var(--cb-ink);border-radius:8px;font-family:var(--font-ui);font-weight:600;cursor:pointer">' + esc(c.label) + '</button>';
      });
      choicesHtml += '</div>';
    }
    var actionsHtml = opts.primaryLabel
      ? '<div class="pbw-actions"><button class="primary" id="pbw-primary">' + esc(opts.primaryLabel) + '</button></div>'
      : "";
    var heroHtml = (opts.portrait === false) ? "" :
      '<div class="pbw-hero"><img class="pbw-portrait" id="pbw-portrait" src="' + esc(_caddyImg(_voice)) + '" alt="Your caddy" draggable="false"></div>';
    // Copy reads as the caddy SPEAKING — a tailed bubble pointing up to the portrait.
    var speechHtml =
      '<div class="pbw-speech">' +
        (opts.eyebrow ? '<div class="pbw-eyebrow">' + esc(opts.eyebrow) + '</div>' : "") +
        '<div class="pbw-body">' + esc(opts.body) + '</div>' +
      '</div>';
    var lowerHtml = speechHtml + (opts.extraHtml || "") + choicesHtml + actionsHtml + _dots(opts.stepIdx == null ? _step : opts.stepIdx);
    // SCENE beats (welcome/calibrate) fill the viewport: hero up top, copy+CTA band
    // at the bottom over a felt scrim. Content-heavy beats keep the bottom sheet.
    var bodyHtml = opts.scene ? (heroHtml + '<div class="pbw-scene-body">' + lowerHtml + '</div>') : (heroHtml + lowerHtml);
    _root.innerHTML =
      '<div class="pbw-backdrop"></div>' +
      '<button class="pbw-skip pbw-skip-tr' + (opts.quietSkip ? ' pbw-skip--quiet' : '') + '" id="pbw-skip">Skip the tour</button>' +
      // Scene cards are full-width + animate via their children (portrait pop + the
      // staggered fade-ups), so they must NOT use pbw-enter — its pbw-rise keyframe
      // bakes in translateX(-50%) for the centered bottom sheet and would shove a
      // full-width scene off-screen left. The bottom sheet keeps pbw-enter.
      '<div class="pbw-card ' + (opts.scene ? 'pbw-card--scene' : 'pbw-enter') + '" role="document">' +
        bodyHtml +
      '</div>';
    _scrimTapToSkip();
    document.getElementById("pbw-skip").onclick = skip;
    if (opts.primaryLabel) { var b = document.getElementById("pbw-primary"); b.focus(); b.onclick = opts.onPrimary; }
    if (opts.choices) {
      Array.prototype.forEach.call(_root.querySelectorAll(".pbw-choice"), function (btn) {
        btn.onclick = function () { opts.choices[+btn.getAttribute("data-ci")].onPick(); };
      });
    }
  }

  // ── SPOTLIGHT a real on-screen control ───────────────────────────────────────
  // opts: { eyebrow, body, primaryLabel, onPrimary, advanceEvent }
  function spotlight(selector, opts) {
    opts = opts || {};
    if (!_root) _mount();
    _clearSpot();
    _root.classList.remove("pbw-stagemode");   // spotlight dims via the ring's box-shadow, no backdrop
    var target = selector ? document.querySelector(selector) : null;
    if (!target) { // degrade gracefully — never point at empty space
      _stageCard({ eyebrow: opts.eyebrow, body: opts.body, pose: "point", primaryLabel: opts.primaryLabel || "Got it", onPrimary: opts.onPrimary || function () {}, stepIdx: opts.stepIdx });
      return;
    }
    try { target.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) {}
    _root.innerHTML =
      '<button class="pbw-skip pbw-skip-tr" id="pbw-skip">Skip the tour</button>' +
      '<div class="pbw-spotlight" id="pbw-spot"></div>' +
      '<div class="pbw-coach" id="pbw-coach"></div>';
    _scrimTapToSkip();
    document.getElementById("pbw-skip").onclick = skip;
    var coach = document.getElementById("pbw-coach");
    coach.innerHTML =
      (opts.eyebrow ? '<div class="pbw-eyebrow">' + esc(opts.eyebrow) + '</div>' : "") +
      '<div class="pbw-body" style="font-size:15px;margin-bottom:10px">' + esc(opts.body) + '</div>' +
      (opts.stepIdx != null ? _dots(opts.stepIdx) : "") +
      '<div class="pbw-actions"><button class="primary" id="pbw-primary">' + esc(opts.primaryLabel || "Got it") + '</button></div>';
    document.getElementById("pbw-primary").onclick = opts.onPrimary || function () {};
    // Position the ring over the live target + float the coach bubble clear of it,
    // and RE-ANCHOR on resize/scroll so both track the element (bottom-nav targets
    // sit at screen bottom, so the bubble must render ABOVE and be clamped into
    // the viewport — a raw r.top - height went negative for short top targets).
    _spotPlace = function () {
      var t = document.querySelector(selector), spot = document.getElementById("pbw-spot"), co = document.getElementById("pbw-coach");
      if (!t || !spot || !co) return;
      var r = t.getBoundingClientRect(), pad = 6;
      spot.style.top = (r.top - pad) + "px"; spot.style.left = (r.left - pad) + "px";
      spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      var below = (r.bottom + co.offsetHeight + 28) < window.innerHeight;
      var top = below ? (r.bottom + 14) : (r.top - co.offsetHeight - 14);
      top = Math.max(12, Math.min(window.innerHeight - co.offsetHeight - 12, top));
      co.style.left = Math.max(12, Math.min(window.innerWidth - co.offsetWidth - 12, r.left)) + "px";
      co.style.top = top + "px";
    };
    _spotPlace();
    requestAnimationFrame(_spotPlace);   // re-place once the bubble has measured its height
    window.addEventListener("resize", _spotPlace);
    window.addEventListener("scroll", _spotPlace, true);
  }

  // ── the 5-beat FTUE spine ────────────────────────────────────────────────────
  function runFtue(startStep) { _mount(); _step = startStep || 0; _beat(_step); }

  function _beat(n) {
    _step = n;
    if (n === 0) return _beatFrame();          // brief welcome
    if (n === 1) return _beatCalibrate();      // solo vs crew
    // Beats 2-5 SPOTLIGHT the real bottom-nav buttons — point at WHERE each thing
    // lives (dim the app, ring the live tab, anchored coach bubble), not a
    // centered card that only describes it. data-walk hooks are on #bottomNav.
    if (n === 2) return _beatTour(2, { eyebrow: "Play", selector: '[data-walk="nav-play"]', body: "Tap Play to start a round — you'll score it hole by hole, fairways to putts." });
    if (n === 3) return _beatTour(3, { eyebrow: "Home & Feed", selector: '[data-walk="nav-home"]', body: "Home is base. Your crew's rounds land in the feed here — kudos, trash talk, the Caddy's weekly report." });
    if (n === 4) return _beatTour(4, { eyebrow: "Courses", selector: '[data-walk="nav-courses"]', body: "Find and track any course here — every round ties back to where you played it." });
    if (n === 5) return _beatTour(5, { eyebrow: "Everything else", selector: '[data-walk="nav-more"]', body: "Standings, the Pro Shop, bounties and your settings all live under More." });
    if (n === 6) return _beatWin();            // the un-losable demo hole (kept — the WIN)
    if (n === 7) return _beatPickCaddie();     // LAST — meet your caddy (kept)
    return _complete("done");
  }

  // Beat 7 (LAST) — meet your caddy: explain WHAT it is, PREVIEW each voice on
  // tap (not select-and-jump), confirm with "Start playing". Defaults to The Caddy.
  function _beatPickCaddie() {
    var roster = window.pbCaddies || [{ id: "caddy", name: "Murphy", img: "img/avatars/caddy-caddy.jpg" }];
    // 2×2 grid of the REAL hand-illustrated rubber-hose PORTRAITS (v8.25.241) —
    // was text-only name buttons, which buried the brand's best art. Each tile
    // shows the character's face + name; tapping previews their voice + swaps the
    // hero portrait above. (The Caddy / Old Tom / Birdie free; Bag Room Guy earned.)
    var thumbs = '<div class="pbw-caddie-grid">';
    roster.forEach(function (c) {
      thumbs += '<button class="pbw-caddie-pick' + (c.id === _voice ? " is-on" : "") + '" data-id="' + esc(c.id) + '"' + (c.locked ? " disabled" : "") + '>' +
        '<img class="pbw-caddie-pic" src="' + esc(c.img || "") + '" alt="" draggable="false">' +
        '<span class="pbw-caddie-meta"><span class="pbw-caddie-nm">' + esc(c.name) + '</span>' +
        (c.locked ? '<span class="pbw-caddie-lk">Earned later</span>' : "") + '</span>' +
      '</button>';
    });
    thumbs += '</div>';
    thumbs += '<div id="pbw-caddie-preview" style="min-height:36px;font-family:var(--font-display);font-style:italic;font-size:14px;line-height:1.4;color:var(--cb-ink);background:var(--cb-chalk-2);border-radius:8px;padding:9px 11px;margin-bottom:12px">Tap a caddy to hear how they talk.</div>';
    _stageCard({
      eyebrow: "Meet your caddy",
      body: "Last thing. Your caddy is your guide here — a voice that calls out your moments and keeps you company on the course. Tap each to preview, then pick your favorite. You can change it any time.",
      extraHtml: thumbs, primaryLabel: "Start playing", onPrimary: function () { _complete("done"); }, stepIdx: 7
    });
    var preview = document.getElementById("pbw-caddie-preview");
    Array.prototype.forEach.call(_root.querySelectorAll(".pbw-caddie-pick"), function (btn) {
      if (btn.disabled) return;
      btn.onclick = function () {
        var id = btn.getAttribute("data-id");
        _voice = id; // tentative; confirmed on "Start playing"
        Array.prototype.forEach.call(_root.querySelectorAll(".pbw-caddie-pick"), function (b2) { b2.classList.remove("is-on"); });
        btn.classList.add("is-on");
        if (preview && window.pbVoices) { preview.textContent = "“" + window.pbVoices.line("frame", id) + "”"; }
        // Swap the HERO portrait to the picked caddy + a celebratory pop, so the
        // choice is felt (the four are visibly distinct real characters, not names).
        var hero = document.getElementById("pbw-portrait");
        if (hero) { hero.src = _caddyImg(id); hero.classList.remove("pbw-portrait--win"); void hero.offsetWidth; hero.classList.add("pbw-portrait--win"); }
      };
    });
  }

  function _beatFrame() {
    _stageCard({ eyebrow: "Welcome to the Clubhouse", body: "This is Parbaughs — your crew's private golf league. Quick tour of where everything lives.",
      scene: true, quietSkip: true, primaryLabel: "Show me around", onPrimary: function () { _beat(1); }, stepIdx: 0 });
  }

  function _beatCalibrate() {
    _stageCard({
      eyebrow: "Quick question", body: "How do you play most — solo, or with your crew? It tailors your first week.", scene: true, stepIdx: 1,
      choices: [
        { label: "Just me", onPick: function () { _calib = "solo"; _beat(2); } },
        { label: "With my crew", onPick: function () { _calib = "crew"; _beat(2); } }
      ]
    });
  }

  // Feature-tour beat — spotlights the real control if it's on the page, else a
  // stage card (the engine degrades gracefully). Teaches WHERE each feature lives.
  function _beatTour(n, cfg) {
    var next = function () { _beat(n + 1); };
    if (cfg.selector && document.querySelector(cfg.selector)) {
      spotlight(cfg.selector, { eyebrow: cfg.eyebrow, body: cfg.body, primaryLabel: "Got it", onPrimary: next, stepIdx: n });
    } else {
      _stageCard({ eyebrow: cfg.eyebrow, body: cfg.body, pose: "point", primaryLabel: "Got it", onPrimary: next, stepIdx: n });
    }
  }

  // Beat 4 — the un-losable sandboxed demo hole (the WIN). Never writes /rounds.
  function _beatWin() {
    var scores = [
      { v: 3, label: "Birdie" }, { v: 4, label: "Par" }, { v: 5, label: "Bogey" }, { v: 6, label: "+2" }
    ];
    var chips = '<div style="display:flex;gap:8px;margin-bottom:6px">';
    scores.forEach(function (s) {
      chips += '<button class="pbw-demo-score" data-v="' + s.v + '" aria-label="' + s.label + ', ' + s.v + ' strokes" style="flex:1;min-height:48px;border:1px solid var(--cb-brass);background:var(--cb-chalk-2);border-radius:8px;cursor:pointer;font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink)">' + s.v + '<div style="font-family:var(--font-mono);font-size:8px;letter-spacing:.5px;text-transform:uppercase;color:var(--cb-mute);font-weight:700">' + s.label + '</div></button>';
    });
    chips += '</div>';
    var card =
      '<div id="pbw-demo-card" style="background:var(--cb-paper);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:14px">' +
        '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-brass-deep);margin-bottom:8px">Sample · Hole 1 · Par 4</div>' +
        chips +
        '<div id="pbw-demo-msg" aria-live="polite" style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);text-align:center">Tap your score — just once, to feel it.</div>' +
      '</div>';
    _stageCard({ eyebrow: "Your first card", body: _voiceLine("demoHole"), extraHtml: card, quietSkip: true, stepIdx: 6 });
    // The WIN is the emotional peak — a 3-phase beat (anticipation → payoff snap →
    // reinforcement) with the longest motion budget in the whole tour.
    var fired = false;
    Array.prototype.forEach.call(_root.querySelectorAll(".pbw-demo-score"), function (btn) {
      btn.onclick = function () {
        if (fired) return; fired = true;
        // PHASE 1 — anticipation: the tapped chip swells, siblings dim, BEFORE the burst.
        Array.prototype.forEach.call(_root.querySelectorAll(".pbw-demo-score"), function (b2) { b2.disabled = true; if (b2 !== btn) b2.style.opacity = ".4"; });
        btn.style.transition = "transform 200ms cubic-bezier(.2,.8,.25,1)";
        btn.style.opacity = "1"; btn.style.background = "var(--cb-brass-3)"; btn.style.transform = "scale(1.08)";
        // PHASE 2 — payoff SNAP (~280ms later): confetti + card flash + haptic + portrait pop, together.
        setTimeout(function () {
          if (window.pbCelebrate) { try { window.pbCelebrate({ key: "ftue-demo" }); } catch (e) {} }
          try { if ("vibrate" in navigator) navigator.vibrate(18); } catch (e) {}
          var heroEl = document.getElementById("pbw-portrait");
          if (heroEl) { heroEl.classList.remove("pbw-portrait--win"); void heroEl.offsetWidth; heroEl.classList.add("pbw-portrait--win"); }
          var dcard = document.getElementById("pbw-demo-card");
          if (dcard) { dcard.style.transition = "border-color 220ms ease, box-shadow 220ms ease"; dcard.style.borderColor = "var(--cb-brass)"; dcard.style.boxShadow = "0 0 0 2px rgba(var(--cb-brass-rgb), .4)"; }
          // PHASE 3 — reinforcement line (+150ms) names the behavior just performed.
          setTimeout(function () {
            var msg = document.getElementById("pbw-demo-msg");
            if (msg) { msg.textContent = _voiceLine("win"); msg.style.color = "var(--cb-ink)"; msg.style.fontWeight = "600"; }
          }, 150);
          // CTA reveal after the moment lands (~700ms hold) — never double-insert.
          setTimeout(function () {
            var dc = document.getElementById("pbw-demo-card");
            if (dc && !document.getElementById("pbw-finish")) {
              dc.insertAdjacentHTML("afterend", '<div class="pbw-actions" style="margin-top:14px"><button class="primary" id="pbw-finish">One more thing — meet your caddy</button></div>');
              document.getElementById("pbw-finish").onclick = function () { _beat(7); };
            }
          }, 700);
        }, 280);
      };
    });
  }

  // ── completion (write + Rookie grant) ────────────────────────────────────────
  function _complete(state) {
    var uid = _uid();
    if (uid && typeof db !== "undefined" && db) {
      // v8.25.33 — EXPLOIT FIX: the Rookie grant must be once-EVER, not once-per-
      // completion. awardCoins' dedup is in-memory (per session), so replaying the
      // onboarding across reloads farmed ROOKIE_COINS infinitely (Founder-reported
      // 2026-06-12). Gate on a DURABLE member-doc flag (walkthrough.rookieRewarded)
      // written in the SAME patch as the grant, so a replay never re-awards.
      var alreadyRewarded = !!(currentProfile && currentProfile.walkthrough && currentProfile.walkthrough.rookieRewarded);
      var grantRookie = (state === "done" && !alreadyRewarded);
      var patch = {
        "walkthrough.ftueState": state,
        "walkthrough.ftueVersion": (typeof WALKTHROUGH_MAJOR !== "undefined" ? WALKTHROUGH_MAJOR : 1),
        "walkthrough.ftueStep": _step,
        "walkthrough.caddieVoice": _voice,
        "walkthrough.calibrationProfile": _calib,
        "walkthrough.ftueCompletedAt": (typeof fsTimestamp === "function" ? fsTimestamp() : new Date().toISOString())
      };
      if (grantRookie) patch["walkthrough.rookieRewarded"] = true;
      try {
        if (currentProfile) { currentProfile.walkthrough = Object.assign({}, currentProfile.walkthrough || {}, { ftueState: state, ftueVersion: patch["walkthrough.ftueVersion"], caddieVoice: _voice, calibrationProfile: _calib }); if (grantRookie) currentProfile.walkthrough.rookieRewarded = true; }
        db.collection("members").doc(uid).update(patch).catch(function () {});
      } catch (e) {}
      // Rookie grant: ONCE ever (first genuine completion), durable-flag-gated.
      if (grantRookie && typeof awardCoins === "function") {
        try { awardCoins(uid, ROOKIE_COINS, "onboarding", "Rookie — finished the walkthrough", "rookie_ftue_once"); } catch (e) {}
      }
    }
    _teardown();
  }

  function skip() { if (_root) _complete("skipped"); }

  // ── Tier-2 just-in-time coachmark (first visit to a surface) ─────────────────
  function coachmark(surfaceKey, opts) {
    opts = opts || {};
    var wt = _wt(), seen = wt.seenContextual || {};
    if (seen["coachmark:" + surfaceKey] || seen[surfaceKey]) return false;
    if (_wt().ftueState == null) return false; // don't stack on first-run FTUE
    _mount();
    spotlight(opts.selector, {
      eyebrow: opts.eyebrow || surfaceKey.toUpperCase(),
      body: _voiceLine("coachmark:" + surfaceKey) || opts.body || "",
      primaryLabel: "Got it",
      onPrimary: function () { _markSeen("coachmark:" + surfaceKey); _teardown(); }
    });
    return true;
  }
  function _markSeen(key) {
    var uid = _uid();
    if (currentProfile) { currentProfile.walkthrough = currentProfile.walkthrough || {}; currentProfile.walkthrough.seenContextual = currentProfile.walkthrough.seenContextual || {}; currentProfile.walkthrough.seenContextual[key] = true; }
    if (uid && typeof db !== "undefined" && db) { var p = {}; p["walkthrough.seenContextual." + key] = true; try { db.collection("members").doc(uid).update(p).catch(function () {}); } catch (e) {} }
  }

  // ── route decision (called post-onboarding / on home arrival) ────────────────
  function route() {
    if (_root) return;                          // already running
    // Fire at most once per session. This sessionStorage key is also the
    // smoke/E2E suppression hook (the harness presets it so the overlay never
    // blocks scenario interactions — mirrors the tee-intro's pb_intro_seen).
    try { if (sessionStorage.getItem("pb_wt_routed") === "1") return null; } catch (e) {}
    // Cold-open bridge: if the tee-shot intro is still playing, arm the FTUE for
    // ITS teardown instead of popping over it — removes the home.js 700ms timer
    // race. If the intro isn't showing (already done / disabled / reduced-motion),
    // fall straight through and fire now.
    if (document.getElementById("pbIntro") && window.pbTeeIntro && typeof window.pbTeeIntro.setOnTeardown === "function") {
      try { window.pbTeeIntro.setOnTeardown(function () { route(); }); } catch (e) {}
      return "deferred";
    }
    var wt = _wt();
    // Fire the FTUE for brand-new members (no ftueState) OR for anyone whose stored
    // ftueVersion predates the current WALKTHROUGH_MAJOR — a MAJOR bump (1->2 in
    // utils.js for the from-scratch onboarding rebuild) re-shows the tour for ALL
    // existing users exactly once. route() previously only checked ftueState==null,
    // so a MAJOR bump alone never re-fired (the gap this closes).
    var major = (typeof WALKTHROUGH_MAJOR !== "undefined") ? WALKTHROUGH_MAJOR : 1;
    if ((wt.ftueState == null || (wt.ftueVersion || 0) < major) && _uid()) {
      try { sessionStorage.setItem("pb_wt_routed", "1"); } catch (e) {}
      runFtue(0); return "ftue";
    }
    return null;
  }

  // Explicit user-triggered replay (Settings → "Replay the welcome tour"). The
  // settings button previously routed to Router.go('onboarding'), which renders
  // the PROFILE-SETUP form (the lecture screens were retired) — NOT this tour, so
  // "replay" never showed the walkthrough (Founder: "onboarding not playing").
  // Go to home first so the bottom-nav spotlight anchors exist, then run the FTUE
  // from beat 0, bypassing route()'s once-per-session + version gates.
  function replay() {
    try { if (typeof Router !== "undefined" && Router.go) Router.go("home"); } catch (e) {}
    setTimeout(function () { runFtue(0); }, 450);
  }

  window.pbWalk = { runFtue: runFtue, route: route, coachmark: coachmark, spotlight: spotlight, skip: skip, replay: replay, _complete: _complete };
})();
