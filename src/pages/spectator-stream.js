// Spectator — Live stream subsystem (recent shots feed + Firestore listener
// + presence emission + watchdog + reconnect + chrome resolution).
// Extracted per W1.A5 (AMD-027).

function _renderRecentShotsFeed(round, mode) {
  if (mode !== 'live') return '';
  if (!round) return '';

  var thru = (typeof round.thru === "number") ? round.thru : 0;
  if (thru <= 0) {
    return '<div class="rsf-feed"><div class="rsf-empty">RECENT SHOTS · NONE YET</div></div>';
  }

  var entries = [];
  for (var i = 0; i < thru; i++) {
    var entry = generateShotEntry(i, round);
    if (entry) entries.push(entry);
  }
  // Most-recent-first, cap at 10
  entries = entries.reverse().slice(0, 10);

  if (entries.length === 0) {
    // Defensive: thru > 0 but no valid scores resolved (corrupt data?)
    return '<div class="rsf-feed"><div class="rsf-empty">RECENT SHOTS · NONE YET</div></div>';
  }

  var h = '<div class="rsf-feed">';
  for (var j = 0; j < entries.length; j++) {
    var e = entries[j];
    h += '<div class="rsf-entry">';
    h += '<div class="rsf-eyebrow">' + escHtml(e.eyebrow) + '</div>';
    h += '<div class="rsf-sentence">' + escHtml(e.sentence) + '</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// ════════════════════════════════════════════════════════════════════════
// v8.13.7 — Real-time spectator listener (Ship 4a Gate 6 of 9)
// ════════════════════════════════════════════════════════════════════════
// Subscribes to /liverounds/{otherUid} on Spectator HUD entry. Diff state
// machine identifies newly-completed holes, hero changes, and status flips
// across emissions. Drives surgical DOM updates per design ruling D1:
//   - 300ms slide-down on new RecentShotsFeed entries
//   - 4s brass left-border settle (--duration-settle)
//   - 200ms Pattern A cross-fade on hero diff/thru changes
//   - 400ms fade-in on PerHoleStrip cell update (--duration-slow)
//
// Lifecycle (attach/detach symmetry):
//   - attach: round.js _renderSpectatorHUDPlaceholder calls
//             PB.spectator.attachListener(roundId, otherUid) post-render
//   - detach: 4 exit paths — back nav, dispatch change, beforeunload,
//             status-flip ("completed" → in-place final mode;
//                          "abandoned" → re-route via Router.go)
//
// CTO Part 1 spec fixes encoded:
//   FIX 1 — detach BEFORE Router.go re-dispatch on abandoned status flip
//           (avoid race where late emission re-triggers re-route)
//   FIX 2 — parent inline-position captured + restored explicitly per
//           cross-fade unit; relative-position management refcounted
//           across simultaneous diff/thru fades to avoid stuck mutation
//   FIX 3 — console.info (not console.debug) for emission instrumentation
//           so smoke test observability doesn't require verbose log toggle
// ════════════════════════════════════════════════════════════════════════

// ── Gate 7 constants (v8.13.8 · D2 connection-state + F3 host-presence) ──
var STALE_THRESHOLD_MS = 10 * 60 * 1000;          // 10 min — matches home.js own-user staleness convention
var WATCHDOG_TICK_MS = 30 * 1000;                  // 30s — fast detection, negligible battery cost
var RECOVERY_DEBOUNCE_MS = 5000;                   // 5s exit-debounce — suppresses strobe on flaky networks
var HOST_PRESENCE_STALE_MS = 10 * 60 * 1000;       // 10 min — matches router.js onlineMembers convention
var MAX_RETRY_ATTEMPTS = 10;                       // After 10, surface "failed" chrome; user must refresh
var RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000];

function _attachSpectatorListener(roundId, otherUid) {
  if (typeof db === "undefined" || !db || !roundId || !otherUid) return;
  // Detach prior state symmetrically — covers dispatch-change-to-different-round.
  _detachSpectatorListener();

  // Gate 7 — extended state shape: 7 v8.13.7 fields + 9 Gate 7 fields = 16 total.
  // EVERY field added to this object MUST register cleanup in _detachSpectatorListener
  // in the SAME commit (pattern enforcement — see memory rule).
  window._spectatorState = {
    // v8.13.7 fields
    roundId: roundId,
    otherUid: otherUid,
    unsub: null,
    prevScored: new Set(),
    prevStatus: "active",
    prevHero: null,
    pendingFirstEmission: true,
    // Gate 7 D2 connection-state
    lastEmissionAt: Date.now(),                    // attach moment treated as initial signal
    connectionState: "live",
    watchdogId: null,
    retryAttempt: 0,
    retryTimerId: null,
    // Gate 7 F3 host-presence
    hostOnline: true,                              // defensive default — assume online if presence lookup fails
    hostLastSeenAt: 0,
    presenceUnsub: null,
    // Gate 7 chrome state
    lastChromeKey: "live",
    recoveryDebounceTimer: null
  };

  // Mirror playnow.js attachLiveRoundsListener's 800ms first-emission flag.
  setTimeout(function() {
    if (window._spectatorState) window._spectatorState.pendingFirstEmission = false;
  }, 800);

  // Liverounds listener — uses Gate 7 error handler for state-tracked recovery.
  try {
    window._spectatorState.unsub = db.collection("liverounds").doc(otherUid).onSnapshot(
      _handleSpectatorEmission,
      function(err) { _handleListenerError(err, "liverounds"); }
    );
  } catch (e) {
    if (typeof pbWarn === "function") pbWarn("listener:spectator:attach-failed:", e.message);
  }

  // Gate 7 — Presence listener for F3 host-online detection. Decoupled from
  // router.js _presenceUnsub (which only attaches on Home page; not guaranteed
  // for spectators arriving via deep-link to /round/:roundId).
  try {
    window._spectatorState.presenceUnsub = db.collection("presence").doc(otherUid).onSnapshot(
      _handlePresenceEmission,
      function(err) { _handleListenerError(err, "presence"); }
    );
  } catch (e) {
    if (typeof pbWarn === "function") pbWarn("listener:spectator-presence:attach-failed:", e.message);
  }

  // Gate 7 — Watchdog timer for D2 stale detection. 30s tick, 10-min threshold.
  window._spectatorState.watchdogId = setInterval(_watchdogTick, WATCHDOG_TICK_MS);
}

// Single gatekeeper for all spectator HUD cleanup. Every exit path funnels
// through this function. Adding a field to _spectatorState requires adding
// the matching teardown line here in the SAME commit (memory rule).
function _detachSpectatorListener() {
  if (!window._spectatorState) return;
  var state = window._spectatorState;

  // v8.13.7 — liverounds listener
  if (typeof state.unsub === "function") {
    try { state.unsub(); } catch (e) { /* silent */ }
  }

  // Gate 7 — presence listener
  if (typeof state.presenceUnsub === "function") {
    try { state.presenceUnsub(); } catch (e) { /* silent */ }
  }

  // Gate 7 — watchdog timer
  if (state.watchdogId !== null) {
    clearInterval(state.watchdogId);
  }

  // Gate 7 — retry backoff timer
  if (state.retryTimerId !== null) {
    clearTimeout(state.retryTimerId);
  }

  // Gate 7 — recovery debounce timer
  if (state.recoveryDebounceTimer !== null) {
    clearTimeout(state.recoveryDebounceTimer);
  }

  window._spectatorState = null;
}

// ──────────────────────────────────────────────────────────────────────────
// Gate 7 — D2 connection-state machine + F3 host-presence handlers
// ──────────────────────────────────────────────────────────────────────────

// Watchdog: 30s tick. Compares Date.now() - lastEmissionAt against 10-min
// threshold. Fires "stale" chrome when threshold breached AND status active
// AND currently in live state (transitions only from live → stale; other
// transitions handled elsewhere).
function _watchdogTick() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.connectionState !== "live") return;
  if (state.prevStatus !== "active") return;
  var age = Date.now() - state.lastEmissionAt;
  if (age > STALE_THRESHOLD_MS) {
    state.connectionState = "stale";
    _applyChrome(_resolveChromeKey(state));
  }
}

// Presence emission handler — F3 host-online detection per Q5 BOTH-signals rule.
// hostOnline = (presence.online === true) AND (lastSeen NOT stale beyond 10min).
// Mobile force-close case: app killed by iOS, beforeunload didn't fire, online
// stays true forever — but lastSeen ages out, so OR'd staleness check catches it.
function _handlePresenceEmission(snap) {
  var state = window._spectatorState;
  if (!state) return;

  if (!snap.exists) {
    // No presence doc — host never logged in / doc deleted.
    state.hostOnline = false;
    state.hostLastSeenAt = 0;
  } else {
    var data = snap.data();
    var lastSeenMs = (data && data.lastSeen && data.lastSeen.toMillis) ? data.lastSeen.toMillis() : 0;
    state.hostLastSeenAt = lastSeenMs;
    var stale = lastSeenMs > 0 && (Date.now() - lastSeenMs > HOST_PRESENCE_STALE_MS);
    state.hostOnline = (data && data.online === true) && !stale;
  }
  _applyChrome(_resolveChromeKey(state));
}

// Listener error handler with state transition + exponential backoff re-subscribe.
// Per Q6: liverounds errors transition connectionState; presence errors log only
// (default hostOnline=true means F3 doesn't false-trigger when presence lookup
// fails — watchdog drives D2 stale detection regardless).
function _handleListenerError(err, listenerType) {
  if (typeof pbWarn === "function") {
    pbWarn("listener:spectator-" + listenerType + ":error", err && err.message);
  }
  if (listenerType !== "liverounds") return;
  var state = window._spectatorState;
  if (!state) return;
  state.connectionState = "disconnected";
  _applyChrome(_resolveChromeKey(state));
  _scheduleReSubscribe();
}

// Exponential backoff re-subscribe. Cap at 10 attempts, then surface "failed"
// chrome — battery + Firestore read cost protection. retryAttempt resets to 0
// on successful emission post-resubscribe (see _handleSpectatorEmission below).
function _scheduleReSubscribe() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.retryAttempt >= MAX_RETRY_ATTEMPTS) {
    state.connectionState = "failed";
    _applyChrome(_resolveChromeKey(state));
    return;
  }
  var delay = RETRY_DELAYS_MS[state.retryAttempt] || 30000;
  state.connectionState = "reconnecting";
  _applyChrome(_resolveChromeKey(state));

  state.retryTimerId = setTimeout(function() {
    var s = window._spectatorState;
    if (!s) return;  // detached during backoff
    s.retryAttempt++;
    s.retryTimerId = null;
    try {
      s.unsub = db.collection("liverounds").doc(s.otherUid).onSnapshot(
        _handleSpectatorEmission,
        function(err) { _handleListenerError(err, "liverounds"); }
      );
    } catch (e) {
      if (typeof pbWarn === "function") pbWarn("listener:spectator:resubscribe-failed:", e.message);
      _scheduleReSubscribe();  // recurse with incremented retry
    }
  }, delay);
}

// 5s exit-debounce — every emission resets the timer. After 5s of held
// emissions in non-live state, flip back to live. Suppresses strobe on
// flaky networks per Q4.
function _scheduleRecoveryDebounce() {
  var state = window._spectatorState;
  if (!state) return;
  if (state.recoveryDebounceTimer !== null) {
    clearTimeout(state.recoveryDebounceTimer);
  }
  state.recoveryDebounceTimer = setTimeout(function() {
    var s = window._spectatorState;
    if (!s) return;
    s.recoveryDebounceTimer = null;
    s.connectionState = "live";
    _applyChrome(_resolveChromeKey(s));
  }, RECOVERY_DEBOUNCE_MS);
}

// Chrome resolution — single source of truth. Host-offline takes priority
// over connection state per audit reasoning (host being offline is the
// relevant fact; spectator's connection irrelevant when no data is coming).
function _resolveChromeKey(state) {
  if (!state) return "live";
  if (!state.hostOnline) return "host-offline";
  if (state.connectionState === "failed") return "failed";
  if (state.connectionState === "disconnected") return "disconnected";
  if (state.connectionState === "reconnecting") return "reconnecting";
  if (state.connectionState === "stale") return "stale";
  return "live";
}

// Chrome renderer — idempotent via lastChromeKey guard. Only mutates DOM
// when the resolved chrome key changes. CTO Q1 corrections encoded:
//   - "stale" caption: "LAST UPDATE X MIN AGO" (no "CONNECTION MAY BE SLOW" tail)
//   - "host-offline" caption: "PLAYER NOT CONNECTED" (no "WILL RESUME" tail)
//   - "failed" caption: "CONNECTION FAILED · REFRESH TO RETRY" (instructional tail kept)
function _applyChrome(key) {
  var state = window._spectatorState;
  if (!state) return;
  if (key === state.lastChromeKey) return;  // idempotency
  state.lastChromeKey = key;

  var eyebrow = document.querySelector('.sphud-hero-eyebrow');
  var card = document.querySelector('.sphud-hero-card');
  var caption = document.getElementById('live-round-caption');

  // Reset modifier classes — clean slate before applying per-key chrome.
  if (eyebrow) {
    eyebrow.classList.remove('sphud-hero-eyebrow--alert');
    eyebrow.classList.remove('sphud-hero-eyebrow--mute');
  }
  if (card) card.classList.remove('sphud-hero-card--dimmed');
  if (caption) { caption.innerHTML = ""; caption.style.cssText = ""; }

  if (key === "live") {
    if (eyebrow) eyebrow.textContent = "VIEWING · LIVE";
    return;
  }
  if (key === "stale") {
    if (eyebrow) eyebrow.textContent = "VIEWING · LIVE";  // unchanged per audit table
    if (caption) {
      var ageStr = (typeof _formatAge === "function")
        ? _formatAge(Date.now() - state.lastEmissionAt).toUpperCase()
        : "RECENTLY";
      _writeCaption("LAST UPDATE " + ageStr, "brass");
    }
    return;
  }
  if (key === "disconnected") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("CONNECTION LOST · WAITING FOR RECONNECT", "alert");
    return;
  }
  if (key === "reconnecting") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("RECONNECTING...", "brass-deep");
    return;
  }
  if (key === "failed") {
    if (eyebrow) {
      eyebrow.textContent = "VIEWING · OFFLINE";
      eyebrow.classList.add('sphud-hero-eyebrow--alert');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("CONNECTION FAILED · REFRESH TO RETRY", "alert");
    return;
  }
  if (key === "host-offline") {
    if (eyebrow) {
      eyebrow.textContent = "PLAYER NOT CONNECTED";
      eyebrow.classList.add('sphud-hero-eyebrow--mute');
    }
    if (card) card.classList.add('sphud-hero-card--dimmed');
    _writeCaption("PLAYER NOT CONNECTED", "mute");
    return;
  }
}

