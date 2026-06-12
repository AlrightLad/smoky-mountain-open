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
  var TOTAL_STEPS = 5;             // truthful denominator (no +1 profile padding)
  var _root = null, _voice = "caddy", _calib = null, _step = 0, _onKey = null, _stage = null, _focusReturn = null;

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
    // tap on the overlay background (not the card) = skip
    _root.addEventListener("click", function (e) { if (e.target === _root) skip(); });
  }

  // ── STAGE card (centered, with the Caddy figure) ─────────────────────────────
  // opts: { eyebrow, body, pose, primaryLabel, onPrimary, extraHtml, stepIdx, choices }
  function _stageCard(opts) {
    if (!_root) _mount();
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
    _root.innerHTML =
      '<button class="pbw-skip pbw-skip-tr" id="pbw-skip">Skip the tour</button>' +
      '<div class="pbw-card" role="document">' +
        '<div class="pbw-stage" id="pbw-stage"></div>' +
        (opts.eyebrow ? '<div class="pbw-eyebrow">' + esc(opts.eyebrow) + '</div>' : "") +
        '<div class="pbw-body">' + esc(opts.body) + '</div>' +
        (opts.extraHtml || "") +
        choicesHtml +
        actionsHtml +
        _dots(opts.stepIdx == null ? _step : opts.stepIdx) +
      '</div>';
    _scrimTapToSkip();
    document.getElementById("pbw-skip").onclick = skip;
    // mount the caddy figure into the stage + pose it
    if (window.pbCaddy) { try { window.pbCaddy.mount("#pbw-stage", { size: 140 }); if (opts.pose) window.pbCaddy.setPose(opts.pose); } catch (e) {} }
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
    var target = selector ? document.querySelector(selector) : null;
    if (!target) { // degrade gracefully — never point at empty space
      _stageCard({ eyebrow: opts.eyebrow, body: opts.body, pose: "point", primaryLabel: opts.primaryLabel || "Got it", onPrimary: opts.onPrimary || function () {}, stepIdx: opts.stepIdx });
      return;
    }
    try { target.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) {}
    var r = target.getBoundingClientRect(), pad = 6;
    _root.innerHTML =
      '<button class="pbw-skip pbw-skip-tr" id="pbw-skip">Skip the tour</button>' +
      '<div class="pbw-spotlight" style="top:' + (r.top - pad) + 'px;left:' + (r.left - pad) + 'px;width:' + (r.width + pad*2) + 'px;height:' + (r.height + pad*2) + 'px"></div>' +
      '<div class="pbw-coach" id="pbw-coach"></div>';
    _scrimTapToSkip();
    document.getElementById("pbw-skip").onclick = skip;
    var coach = document.getElementById("pbw-coach");
    coach.innerHTML =
      (opts.eyebrow ? '<div class="pbw-eyebrow">' + esc(opts.eyebrow) + '</div>' : "") +
      '<div class="pbw-body" style="font-size:15px;margin-bottom:10px">' + esc(opts.body) + '</div>' +
      '<div class="pbw-actions"><button class="primary" id="pbw-primary">' + esc(opts.primaryLabel || "Got it") + '</button></div>';
    // place the coachmark below the target (or above if no room)
    var below = (r.bottom + 150) < window.innerHeight;
    coach.style.left = Math.max(12, Math.min(window.innerWidth - coach.offsetWidth - 12, r.left)) + "px";
    coach.style.top = (below ? r.bottom + 14 : r.top - coach.offsetHeight - 14) + "px";
    document.getElementById("pbw-primary").onclick = opts.onPrimary || function () {};
  }

  // ── the 5-beat FTUE spine ────────────────────────────────────────────────────
  function runFtue(startStep) { _mount(); _step = startStep || 0; _beat(_step); }

  function _beat(n) {
    _step = n;
    if (n === 0) return _beatPickCaddie();
    if (n === 1) return _beatFrame();
    if (n === 2) return _beatCalibrate();
    if (n === 3) return _beatDemonstrate();
    if (n === 4) return _beatWin();
    return _complete("done");
  }

  // Beat 0 — pick your caddie (opt-in; defaults to The Caddy)
  function _beatPickCaddie() {
    var roster = window.pbCaddies || [{ id: "caddy", name: "The Caddy" }];
    var thumbs = '<div style="display:flex;gap:8px;margin-bottom:14px">';
    roster.forEach(function (c) {
      var lockNote = c.locked ? '<div style="font-size:9px;color:var(--cb-mute);margin-top:3px">Unlock in the Pro Shop</div>' : '';
      thumbs += '<button class="pbw-caddie-pick" data-id="' + c.id + '" ' + (c.locked ? "disabled" : "") +
        ' style="flex:1;min-height:64px;border:1px solid var(--border);background:var(--cb-paper);border-radius:10px;cursor:' + (c.locked ? "not-allowed" : "pointer") + ';opacity:' + (c.locked ? ".5" : "1") + ';padding:8px 4px">' +
        '<div style="font-family:var(--font-ui);font-weight:700;font-size:12px;color:var(--cb-ink)">' + esc(c.name) + '</div>' + lockNote + '</button>';
    });
    thumbs += '</div>';
    _stageCard({
      eyebrow: "Your caddie",
      body: "Pick who shows you around. You can change this any time.",
      pose: "tipCap", extraHtml: thumbs, stepIdx: 0
    });
    Array.prototype.forEach.call(_root.querySelectorAll(".pbw-caddie-pick"), function (btn) {
      if (btn.disabled) return;
      btn.onclick = function () { _voice = btn.getAttribute("data-id"); _beat(1); };
    });
  }

  function _beatFrame() {
    _stageCard({ eyebrow: "Welcome to the Clubhouse", body: _voiceLine("frame"), pose: "tipCap",
      primaryLabel: "Show me around", onPrimary: function () { _beat(2); }, stepIdx: 1 });
  }

  function _beatCalibrate() {
    _stageCard({
      eyebrow: "Quick question", body: _voiceLine("calibrate"), pose: "nod", stepIdx: 2,
      choices: [
        { label: "Just me", onPick: function () { _calib = "solo"; _beat(3); } },
        { label: "With my crew", onPick: function () { _calib = "crew"; _beat(3); } }
      ]
    });
  }

  function _beatDemonstrate() {
    // crew → point at standings/feed; solo → point at the Play CTA / scorecard.
    var sel = _calib === "crew" ? '[data-walk="standings-link"]' : '[data-walk="play-cta"]';
    var body = _calib === "crew"
      ? "Here's your crew's board — this is the race you're in."
      : "Here's where you start a round and log your score, hole by hole.";
    spotlight(sel, { eyebrow: _calib === "crew" ? "Standings" : "Play", body: body, primaryLabel: "Got it",
      onPrimary: function () { _beat(4); }, stepIdx: 3 });
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
    _stageCard({ eyebrow: "Your first card", body: _voiceLine("demoHole"), pose: "tipCap", extraHtml: card, stepIdx: 4 });
    var fired = false;
    Array.prototype.forEach.call(_root.querySelectorAll(".pbw-demo-score"), function (btn) {
      btn.onclick = function () {
        if (fired) return; fired = true;
        var v = btn.getAttribute("data-v");
        Array.prototype.forEach.call(_root.querySelectorAll(".pbw-demo-score"), function (b2) { b2.disabled = true; b2.style.opacity = ".45"; });
        btn.style.opacity = "1"; btn.style.background = "var(--cb-brass-3)"; btn.style.transform = "scale(1.04)";
        var msg = document.getElementById("pbw-demo-msg");
        if (msg) { msg.textContent = _voiceLine("win"); msg.style.color = "var(--cb-ink)"; msg.style.fontWeight = "600"; }
        if (window.pbCaddy) { try { window.pbCaddy.setPose("pump"); } catch (e) {} }
        if (window.pbCelebrate) { try { window.pbCelebrate({ key: "ftue-demo" }); } catch (e) {} }
        var prim = '<div class="pbw-actions" style="margin-top:12px"><button class="primary" id="pbw-finish">Start my first real round</button></div>';
        document.getElementById("pbw-demo-card").insertAdjacentHTML("afterend", prim);
        document.getElementById("pbw-finish").onclick = function () { _complete("done"); };
      };
    });
  }

  // ── completion (write + Rookie grant) ────────────────────────────────────────
  function _complete(state) {
    var uid = _uid();
    if (uid && typeof db !== "undefined" && db) {
      var patch = {
        "walkthrough.ftueState": state,
        "walkthrough.ftueVersion": (typeof WALKTHROUGH_MAJOR !== "undefined" ? WALKTHROUGH_MAJOR : 1),
        "walkthrough.ftueStep": _step,
        "walkthrough.caddieVoice": _voice,
        "walkthrough.calibrationProfile": _calib,
        "walkthrough.ftueCompletedAt": (typeof fsTimestamp === "function" ? fsTimestamp() : new Date().toISOString())
      };
      try {
        if (currentProfile) { currentProfile.walkthrough = Object.assign({}, currentProfile.walkthrough || {}, { ftueState: state, ftueVersion: patch["walkthrough.ftueVersion"], caddieVoice: _voice, calibrationProfile: _calib }); }
        db.collection("members").doc(uid).update(patch).catch(function () {});
      } catch (e) {}
      // Rookie grant only on a genuine completion (not a skip). dedupKey makes it idempotent.
      if (state === "done" && typeof awardCoins === "function") {
        try { awardCoins(uid, ROOKIE_COINS, "onboarding", "Rookie — finished the walkthrough", "rookie_ftue_v" + patch["walkthrough.ftueVersion"]); } catch (e) {}
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
    var wt = _wt();
    if (wt.ftueState == null && _uid()) {
      try { sessionStorage.setItem("pb_wt_routed", "1"); } catch (e) {}
      runFtue(0); return "ftue";
    }
    return null;
  }

  window.pbWalk = { runFtue: runFtue, route: route, coachmark: coachmark, spotlight: spotlight, skip: skip, _complete: _complete };
})();
