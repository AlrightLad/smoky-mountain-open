/* ================================================
   PLAY NOW - LIVE SCORING
   ================================================ */

var liveState = {
  active: false,
  player: null,
  course: null,
  courseData: null,
  startTime: null,
  currentHole: 0,
  scores: Array(18).fill(""),
  fir: Array(18).fill(false),
  gir: Array(18).fill(false),
  putts: Array(18).fill(""),
  bunker: Array(18).fill(null),
  sand: Array(18).fill(null),
  upDown: Array(18).fill(null),
  miss: Array(18).fill(null),
  penalty: Array(18).fill(0),
  // v8.11.8 — Device ownership flag drives card variant selection (Gate 2).
  // "local" = scoring on this device. "remote" = hydrated from another device's
  // /liverounds/ write via cross-device listener. Default "local" prevents
  // accidental view-only mode if a code path forgets to set it.
  deviceOwnership: "local"
};

// Per-hole "Advanced stats" expander open state (module-scoped, not persisted)
var advancedOpen = {};

// ── liveState crash recovery ──────────────────────────────────────────────
// If the phone restarts or browser crashes mid-round, we restore from this.
// Stored under a separate key — never mixed with PB state.

function saveLiveState() {
  if (!liveState.active) return;
  // v8.11.8 — Any local save → this device owns the round (drives card variant)
  liveState.deviceOwnership = "local";
  // Local crash recovery
  try {
    localStorage.setItem("pb_liveState", JSON.stringify(liveState));
  } catch(e) { /* quota or private browsing */ }
  // Firestore persistence — makes round visible to other members and survives device changes
  if (db && currentUser && liveState.visibility !== "private") {
    var scored = liveState.scores.filter(function(s){return s!==""});
    db.collection("liverounds").doc(currentUser.uid).set({
      playerId: currentUser.uid,
      playerName: currentProfile ? (currentProfile.name || currentProfile.username) : "Member",
      course: liveState.course || "",
      courseId: liveState.courseId || "",
      format: liveState.format || "stroke",
      holesMode: liveState.holesMode || "18",
      tee: liveState.tee || "",
      currentHole: liveState.currentHole || 0,
      scores: liveState.scores,
      fir: liveState.fir,
      gir: liveState.gir,
      putts: liveState.putts,
      bunker: liveState.bunker,
      sand: liveState.sand,
      upDown: liveState.upDown,
      miss: liveState.miss,
      penalty: liveState.penalty,
      rating: liveState.rating || 72,
      slope: liveState.slope || 113,
      par: liveState.par || 72,
      thru: scored.length,
      totalScore: scored.reduce(function(a,b){return a+parseInt(b)},0),
      startTime: liveState.startTime || null,
      status: "active",
      // v8.11.8 — Date.now() for cross-device elapsed-time displays. ±1s drift
      // between client clocks acceptable for "X min ago" labels.
      lastWriteAt: Date.now(),
      // v8.13.0 — Stable roundId enables /round/:roundId lookup. Pre-v8.13.0
      // active docs lack this field; validator accepts missing for self-
      // healing migration window (memory #20 pattern).
      roundId: liveState.roundId || null,
      updatedAt: fsTimestamp()
    }, { merge: true }).catch(function(e) { pbWarn("[LiveRound] save failed:", e.message); });
  }
}

function loadLiveState() {
  try {
    var saved = localStorage.getItem("pb_liveState");
    if (!saved) return;
    var parsed = JSON.parse(saved);
    if (parsed && parsed.active) {
      Object.assign(liveState, parsed);
      // v8.11.8 — localStorage hydration represents this device's prior crash-
      // recovery state, so always tagged as local-owned. Listener may later
      // reconcile with remote state if /liverounds/{uid} disagrees.
      liveState.deviceOwnership = "local";
    }
  } catch(e) { /* corrupt data, ignore */ }
}

// v8.11.8 — In-memory + localStorage clear, no Firestore writes. Used by
// clearLiveState (which then layers on Firestore writes) AND by listener
// emission handlers when remote already wrote the truth (avoids redundant
// status writes ricocheting back through the listener).
function _clearLiveStateLocally() {
  liveState.active = false;
  liveState.player = null;
  liveState.course = null;
  liveState.courseData = null;
  liveState.startTime = null;
  liveState.currentHole = 0;
  liveState.scores = Array(18).fill("");
  liveState.fir = Array(18).fill(false);
  liveState.gir = Array(18).fill(false);
  liveState.putts = Array(18).fill("");
  liveState.bunker = Array(18).fill(null);
  liveState.sand = Array(18).fill(null);
  liveState.upDown = Array(18).fill(null);
  liveState.miss = Array(18).fill(null);
  liveState.penalty = Array(18).fill(0);
  liveState.deviceOwnership = "local";
  advancedOpen = {};
  try { localStorage.removeItem("pb_liveState"); } catch(e) {}
}

// v8.11.8 — clearLiveState now takes a reason parameter. Default "completed"
// preserves backward compat with finishLiveRound's existing call. "abandoned"
// distinguishes intentional Quit from natural completion in /liverounds/ —
// listeners on other devices use this to differentiate cross-fade-to-summary
// (completed) from silent dismiss (abandoned). Per design ruling C2, abandoned
// docs are deleted 5s post-status-write so peer listeners observe the abandon
// before the doc disappears.
function clearLiveState(reason) {
  reason = reason || "completed";
  _clearLiveStateLocally();
  if (db && currentUser) {
    var uid = currentUser.uid;
    db.collection("liverounds").doc(uid).update({
      status: reason,
      lastWriteAt: Date.now(),
      updatedAt: fsTimestamp()
    }).catch(function(){});
    if (reason === "abandoned") {
      setTimeout(function() {
        if (db) db.collection("liverounds").doc(uid).delete().catch(function(){});
      }, 5000);
    }
  }
}

// v8.11.8 — Wires the previously dead onclick="quitLiveRound()" at the tiny
// "Quit round (discard scores)" link inside the bottom nav (renderLiveScoring).
// Reveals the existing #quit-confirm panel; the panel's "Quit" button calls
// clearLiveState('abandoned'). Pre-v8.11.8 this onclick threw a silent
// ReferenceError (undefined function); discovered during the v8.11.8 audit.
function quitLiveRound() {
  var el = document.getElementById("quit-confirm");
  if (el) el.style.display = "block";
}

// ════════════════════════════════════════════════════════════════════════
// CROSS-DEVICE SYNC LISTENER (v8.11.8 — Gate 1 foundation)
// Own-user /liverounds/{uid} subscription. Hydrates liveState from Firestore
// when the user starts a round on another device. Strict Pattern 3 hydrate-
// if-empty: never overrides locally-active scoring. Card variant rendering
// (Gate 2) and completion cross-fade (Gate 3) layer on top of this foundation.
// ════════════════════════════════════════════════════════════════════════

// Defensive shape validator — minimal per design F3. Status enum required;
// lastWriteAt optional but type-checked when present. Other fields validated
// implicitly by downstream rendering with existing fallback patterns
// ("Round in progress" if course missing, etc.).
//
// v8.11.9 hotfix: lastWriteAt relaxed from required-number to optional-number.
// Pre-v8.11.8 active /liverounds/{uid} docs lack the field; the original
// strict check rejected them silently and blocked cross-device hydration
// during the self-healing migration window. Self-healing fires naturally on
// the next saveLiveState write from any v8.11.8+ client; this validator
// keeps the hydration path unblocked while corruption (wrong type) is still
// caught.
function isValidLiveRound(doc) {
  if (!doc || typeof doc !== "object") return false;
  if (!doc.status || ["active","completed","abandoned"].indexOf(doc.status) === -1) return false;
  if (doc.lastWriteAt !== undefined && typeof doc.lastWriteAt !== "number") return false;
  // v8.13.0 — roundId optional for backward compat (pre-v8.13.0 docs lack it).
  // Self-healing migration: any saveLiveState call from v8.13.0+ client
  // backfills the field. Wrong-type roundId rejected.
  if (doc.roundId !== undefined && doc.roundId !== null && typeof doc.roundId !== "string") return false;
  return true;
}

// Hydrate liveState from a Firestore /liverounds/{uid} doc. Mutates fields
// in place; sets deviceOwnership="remote" to flag this is a peer-device round.
// Only called when liveState is currently inactive (Pattern 3 strict).
function _hydrateLiveStateFromFirestore(doc) {
  liveState.active = true;
  liveState.player = doc.playerId || liveState.player;
  liveState.course = doc.course || "";
  liveState.courseId = doc.courseId || "";
  liveState.format = doc.format || "stroke";
  liveState.holesMode = doc.holesMode || "18";
  liveState.tee = doc.tee || "";
  liveState.currentHole = doc.currentHole || 0;
  if (Array.isArray(doc.scores)) liveState.scores = doc.scores.slice();
  if (Array.isArray(doc.fir)) liveState.fir = doc.fir.slice();
  if (Array.isArray(doc.gir)) liveState.gir = doc.gir.slice();
  if (Array.isArray(doc.putts)) liveState.putts = doc.putts.slice();
  if (Array.isArray(doc.bunker)) liveState.bunker = doc.bunker.slice();
  if (Array.isArray(doc.sand)) liveState.sand = doc.sand.slice();
  if (Array.isArray(doc.upDown)) liveState.upDown = doc.upDown.slice();
  if (Array.isArray(doc.miss)) liveState.miss = doc.miss.slice();
  if (Array.isArray(doc.penalty)) liveState.penalty = doc.penalty.slice();
  liveState.rating = doc.rating || 72;
  liveState.slope = doc.slope || 113;
  liveState.par = doc.par || 72;
  liveState.startTime = doc.startTime || null;
  liveState.deviceOwnership = "remote";
}

// Re-render current page if it's one that displays live-round state. Mirrors
// _memberProfileUnsub's route-aware Router.go pattern (firebase.js:548-551).
function _triggerRouteAwareRender() {
  if (typeof Router === "undefined" || !Router.getPage) return;
  var pg = Router.getPage();
  if (pg === "home" || pg === "playnow") {
    Router.go(pg, Router.getParams ? Router.getParams() : {}, true);
  }
}

// Listener emission handler. Called for each /liverounds/{uid} snapshot.
// First emission post-attach uses _liveListenerPendingFirstEmission flag
// (set by attachLiveRoundsListener; cleared after 800ms or first emission).
function handleLiveRoundEmission(snap) {
  // Capture-and-clear the first-emission flag regardless of doc state, so
  // late emissions don't trigger render swaps (per design D2 commit-idle rule).
  var wasFirstEmission = !!window._liveListenerPendingFirstEmission;
  window._liveListenerPendingFirstEmission = false;

  if (!snap.exists) return;  // F2 silent — no remote round

  var doc = snap.data();
  if (!isValidLiveRound(doc)) {
    if (typeof pbWarn === "function") {
      pbWarn("listener:liverounds:invalid-shape", { id: snap.id, keys: doc ? Object.keys(doc) : [] });
    }
    return;
  }

  var status = doc.status;

  if (status === "completed") {
    // v8.11.11 — Cross-fade completion (Gate 3 of cross-device trilogy).
    // Stash retention overlay first so any concurrent render sees it.
    // Cross-fade BEFORE clearing local state — animation reads liveState
    // for idempotent guard. After 650ms (transition + safety), clear state
    // and caption timers without Router.go (finished-summary card is in DOM
    // via cross-fade; render-driven retention check handles 5-min expiry).
    // 5-min force-render covers users still on HQ Home at expiry moment.
    if (liveState && liveState.active) {
      window._completedRoundOverlay = {
        round: doc,
        expiresAt: Date.now() + 5 * 60 * 1000
      };
      if (typeof _triggerCompletionCrossFade === "function") {
        _triggerCompletionCrossFade(doc);
      }
      setTimeout(function() {
        // Defensive idempotent: if user navigated away or another emission
        // already cleared state, this setTimeout is stale — no-op.
        if (liveState && liveState.active) {
          _clearLiveStateLocally();
          if (typeof _clearLiveRoundCaption === "function") _clearLiveRoundCaption();
        }
      }, 650);
      setTimeout(function() {
        if (typeof Router !== "undefined" && Router.getPage && Router.getPage() === "home") {
          Router.go("home", Router.getParams ? Router.getParams() : {}, true);
        }
      }, 5 * 60 * 1000);
    }
    return;
  }

  if (status === "abandoned") {
    // C2 silent dismiss — clear local + re-render. No UI announcement.
    if (liveState && liveState.active) {
      _clearLiveStateLocally();
      if (typeof _clearLiveRoundCaption === "function") _clearLiveRoundCaption();
      _triggerRouteAwareRender();
    }
    return;
  }

  if (status === "active") {
    // Pattern 3 strict: hydrate-if-empty. NEVER overrides locally-active state.
    if (liveState && !liveState.active) {
      _hydrateLiveStateFromFirestore(doc);
      // v8.11.10 — store lastWriteAt on liveState for secondary-card subline
      // ("last hole 4 min ago") and for staleness polling.
      liveState.lastWriteAt = doc.lastWriteAt;
      // D2: only swap render on first emission within 800ms window. Late
      // emissions hydrate liveState but commit idle for this page load —
      // surface the card on next navigation.
      if (wasFirstEmission) {
        _triggerRouteAwareRender();
      }
      // v8.11.10 — schedule staleness polling from time of hydration. Helper
      // is idempotent: clears existing timer + reschedules.
      if (typeof _scheduleStalenessPolling === "function") {
        _scheduleStalenessPolling(doc.lastWriteAt);
      }
    } else if (liveState && liveState.active) {
      // v8.11.10 — A2: liveState already active locally + remote write detected.
      // Multi-device caption fires for 30s on the local card.
      if (typeof _showMultiDeviceCaption === "function") {
        _showMultiDeviceCaption(doc.lastWriteAt);
      }
    }
    return;
  }

  // Unknown status — observability only.
  if (typeof pbWarn === "function") pbWarn("listener:liverounds:unknown-status:", status);
}

// Attach own-user /liverounds/{uid} listener. Mirrors window._memberProfileUnsub
// (firebase.js:539-552): detach-before-reattach discipline, silent error path,
// route-aware re-render on snapshot. Sets _liveListenerPendingFirstEmission
// flag with 800ms TTL per design D2.
function attachLiveRoundsListener(uid) {
  if (!db || !uid) return;
  if (window._liveRoundsUnsub) { window._liveRoundsUnsub(); window._liveRoundsUnsub = null; }
  window._liveListenerPendingFirstEmission = true;
  setTimeout(function() {
    window._liveListenerPendingFirstEmission = false;
  }, 800);
  try {
    window._liveRoundsUnsub = db.collection("liverounds").doc(uid).onSnapshot(
      handleLiveRoundEmission,
      function(err) {
        if (typeof pbWarn === "function") pbWarn("listener:liverounds:attach-failed:", err && err.message);
      }
    );
  } catch (e) {
    if (typeof pbWarn === "function") pbWarn("listener:liverounds:attach-failed:", e.message);
  }
}

// Detach listener + clear local liveState per design D1. Called from sign-out
// path in firebase.js. Skips Firestore writes (currentUser is null at this
// point — clearLiveState's gate would skip anyway, but using
// _clearLiveStateLocally to be explicit about no-write intent).
function detachLiveRoundsListener() {
  if (window._liveRoundsUnsub) { window._liveRoundsUnsub(); window._liveRoundsUnsub = null; }
  window._liveListenerPendingFirstEmission = false;
  if (typeof liveState !== "undefined") _clearLiveStateLocally();
}

// ─────────────────────────────────────────────────────────────────────────

Router.register("playnow", function(params) {
  if (params.setup) { renderPlaySetup(); return; }
  if (liveState.active) { renderLiveScoring(); return; }
  renderPlaySetup();
});

function renderPlaySetup() {
  var h = '<div class="sh"><h2>Play now</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">Start a round</div><div style="font-size:11px;color:var(--muted);margin-top:4px;letter-spacing:.3px">Score hole by hole as you play</div>';
  h += '<div style="margin-top:10px"><span style="font-size:11px;color:var(--gold);cursor:pointer;text-decoration:underline" onclick="Router.go(\'scramble-live\')">Or start a Scramble Round →</span></div></div>';

  h += '<div class="form-section">';
  // Player is always the current user — try multiple identification methods
  var myPlayer = currentUser ? PB.getPlayer(currentUser.uid) : null;
  var myLocalPlayer = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name || p.id === currentProfile.id); });
  // Also check Firebase member cache
  if (!myPlayer && !myLocalPlayer && currentUser && typeof fbMemberCache !== "undefined" && fbMemberCache[currentUser.uid]) {
    myLocalPlayer = fbMemberCache[currentUser.uid];
  }
  // Last resort: use currentProfile itself if it has a name
  if (!myPlayer && !myLocalPlayer && currentProfile && currentProfile.name) {
    myLocalPlayer = currentProfile;
  }
  var playAs = myPlayer || myLocalPlayer;
  if (!playAs) {
    h += '<div style="padding:20px;text-align:center;font-size:12px;color:var(--red)">Could not identify your player profile. Please contact the Commissioner.</div>';
    document.querySelector('[data-page="playnow"]').innerHTML = h;
    return;
  }
  h += '<div class="ff"><label class="ff-label">Playing as</label><div class="ff-input" style="background:var(--bg4);color:var(--gold);font-weight:600">' + escHtml(playAs.name) + '</div><input type="hidden" id="pn-player" value="' + playAs.id + '"></div>';

  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="pn-course" placeholder="Search courses..." autocomplete="off" oninput="showPlayCourseSearch(this)"><div id="search-pn-course" class="search-results"></div></div>';
  h += '<input type="hidden" id="pn-rating" value=""><input type="hidden" id="pn-slope" value=""><input type="hidden" id="pn-course-id" value=""><input type="hidden" id="pn-tee-name" value="">';
  h += '<div id="pn-tee-section"></div>';

  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="pn-format" onchange="onPlayFormatChange()"><option value="stroke">Stroke play</option><option value="parbaugh">Parbaugh Stroke Play (handicap-adjusted)</option><option value="stableford">Stableford</option><option value="match">Match play</option><option value="scramble">Scramble</option><option value="bestball">Best ball</option><option value="skins">Skins</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Holes</label><select class="ff-input" id="pn-holes"><option value="18">18 holes</option><option value="front9">Front 9 (holes 1–9)</option><option value="back9">Back 9 (holes 10–18)</option></select></div>';
  h += '<div id="pn-scramble-team-section"></div>';

  h += '<button class="btn full green" onclick="startLiveRound()" style="margin-top:8px">Tee it up</button>';
  h += '</div>';

  document.querySelector('[data-page="playnow"]').innerHTML = h;
}

// ---- Play Now: inline scramble team creation ----
var pnScrambleSelected = [];
var pnScrambleTeamSize = 2;

function onPlayFormatChange() {
  var fmt = document.getElementById("pn-format");
  var sec = document.getElementById("pn-scramble-team-section");
  if (!fmt || !sec) return;
  if (fmt.value === "scramble") {
    renderPnScrambleTeamSelector();
  } else {
    sec.innerHTML = "";
  }
}

function renderPnScrambleTeamSelector() {
  var sec = document.getElementById("pn-scramble-team-section");
  if (!sec) return;
  var myId = currentUser ? currentUser.uid : null;
  var myPlayer = myId ? PB.getPlayer(myId) : null;
  var myLocalPlayer = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name); });
  var playAs = myPlayer || myLocalPlayer;
  var myPid = playAs ? playAs.id : null;

  var teams = PB.getScrambleTeams();
  var myTeams = myPid ? teams.filter(function(t) { return t.members && t.members.indexOf(myPid) !== -1; }) : [];
  var selectedId = (document.getElementById("pn-scramble-team-id") || {}).value || "";

  var h = '<div style="border-top:1px solid var(--border);padding-top:14px;margin-top:8px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;padding:0 0 10px;font-weight:600">Scramble team</div>';

  if (myTeams.length > 0) {
    myTeams.forEach(function(t) {
      var mates = t.members.map(function(mid) { var p = PB.getPlayer(mid); return p ? p.name : mid; }).join(", ");
      var sel = t.id === selectedId;
      h += '<div onclick="pnSelectTeam(\'' + t.id + '\')" id="pn-team-row-' + t.id + '" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;border:1.5px solid ' + (sel ? 'var(--gold)' : 'var(--border)') + ';border-radius:8px;padding:10px 12px;margin-bottom:6px;background:' + (sel ? 'rgba(var(--gold-rgb),.07)' : 'transparent') + '">';
      h += '<div><div style="font-size:13px;font-weight:600">' + escHtml(t.name) + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(mates) + '</div></div>';
      h += '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;color:var(--muted)">' + t.size + '-man</span>';
      h += '<div style="width:16px;height:16px;border-radius:8px;border:1.5px solid ' + (sel ? 'var(--gold)' : 'var(--border)') + ';background:' + (sel ? 'var(--gold)' : 'transparent') + ';display:flex;align-items:center;justify-content:center">' + (sel ? '<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="white" stroke-width="2"><path d="M2 5l2 2 4-4"/></svg>' : '') + '</div></div></div>';
    });
  } else {
    h += '<div style="font-size:11px;color:var(--muted);padding:4px 0 10px">No teams yet, create one below.</div>';
  }

  h += '<div id="pn-create-team-toggle-wrap" style="margin-top:4px"><button class="btn-sm" onclick="pnToggleCreateTeam()" style="width:100%;padding:9px;font-size:12px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer">+ Create new team</button></div>';
  h += '<div id="pn-create-team-form" style="display:none"></div>';
  h += '<input type="hidden" id="pn-scramble-team-id" value="' + escHtml(selectedId) + '">';
  h += '</div>';

  sec.innerHTML = h;
}

function pnSelectTeam(teamId) {
  var hidden = document.getElementById("pn-scramble-team-id");
  if (hidden) hidden.value = teamId;
  var teams = PB.getScrambleTeams();
  teams.forEach(function(t) {
    var row = document.getElementById("pn-team-row-" + t.id);
    if (!row) return;
    var sel = t.id === teamId;
    row.style.border = "1.5px solid " + (sel ? "var(--gold)" : "var(--border)");
    row.style.background = sel ? "rgba(var(--gold-rgb),.07)" : "transparent";
    var check = row.querySelector("div[style*='border-radius:8px']");
    if (check) {
      check.style.borderColor = sel ? "var(--gold)" : "var(--border)";
      check.style.background = sel ? "var(--gold)" : "transparent";
      check.innerHTML = sel ? '<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="white" stroke-width="2"><path d="M2 5l2 2 4-4"/></svg>' : "";
    }
  });
}

function pnToggleCreateTeam() {
  var form = document.getElementById("pn-create-team-form");
  if (!form) return;
  if (form.style.display === "none") {
    pnScrambleSelected = [];
    pnScrambleTeamSize = 2;
    pnRenderCreateTeamForm();
    form.style.display = "";
  } else {
    form.style.display = "none";
    pnScrambleSelected = [];
  }
}

function pnRenderCreateTeamForm() {
  var form = document.getElementById("pn-create-team-form");
  if (!form) return;
  var players = PB.getPlayers();
  var myId = currentUser ? currentUser.uid : null;
  var myPlayer = myId ? PB.getPlayer(myId) : null;
  var myLocalPlayer = PB.getPlayers().find(function(p) { return currentProfile && (p.id === currentProfile.claimedFrom || p.name === currentProfile.name); });
  var playAs = myPlayer || myLocalPlayer;
  var myPid = playAs ? playAs.id : null;

  var h = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:8px">';
  h += '<div style="font-size:12px;font-weight:600;color:var(--cream);margin-bottom:12px">New team</div>';

  h += '<div class="ff" style="margin-bottom:10px"><label class="ff-label" style="font-size:10px">Team name</label><input class="ff-input" id="pn-new-team-name" placeholder="e.g. The Bogey Boys" autocomplete="off"></div>';

  h += '<div style="margin-bottom:12px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Team size</div><div style="display:flex;gap:6px">';
  [2,3,4].forEach(function(n) {
    var a = pnScrambleTeamSize === n;
    h += '<button onclick="pnSetTeamSize(' + n + ')" style="flex:1;padding:8px;border-radius:6px;border:1.5px solid ' + (a ? 'var(--gold)' : 'var(--border)') + ';background:' + (a ? 'rgba(var(--gold-rgb),.12)' : 'transparent') + ';color:' + (a ? 'var(--gold)' : 'var(--muted)') + ';font-size:12px;font-weight:600;cursor:pointer">' + n + '-man</button>';
  });
  h += '</div></div>';

  h += '<div style="margin-bottom:10px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Members <span style="color:' + (pnScrambleSelected.length === pnScrambleTeamSize ? 'var(--birdie)' : 'var(--muted)') + '">(' + pnScrambleSelected.length + '/' + pnScrambleTeamSize + ')</span></div>';
  players.forEach(function(p) {
    var isSelf = p.id === myPid;
    var inTeam = pnScrambleSelected.indexOf(p.id) !== -1;
    h += '<div onclick="pnToggleMember(\'' + p.id + '\')" id="pn-m-' + p.id + '" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-radius:6px;border:1px solid ' + (inTeam ? 'var(--gold)' : 'var(--border)') + ';background:' + (inTeam ? 'rgba(var(--gold-rgb),.07)' : 'transparent') + ';margin-bottom:4px">';
    h += '<div style="font-size:12px;color:var(--cream)">' + escHtml(p.name) + (isSelf ? ' <span style="font-size:9px;color:var(--gold)">(you)</span>' : '') + '</div>';
    h += '<div style="width:16px;height:16px;border-radius:8px;border:1.5px solid ' + (inTeam ? 'var(--gold)' : 'var(--border)') + ';background:' + (inTeam ? 'var(--gold)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (inTeam ? '<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="white" stroke-width="2"><path d="M2 5l2 2 4-4"/></svg>' : '') + '</div>';
    h += '</div>';
  });
  h += '</div>';

  if (pnScrambleSelected.length > 0) {
    h += '<div class="ff" style="margin-bottom:12px"><label class="ff-label" style="font-size:10px">Captain (hits last every shot)</label><select class="ff-input" id="pn-new-team-captain">';
    pnScrambleSelected.forEach(function(pid) {
      var p = PB.getPlayer(pid);
      h += '<option value="' + pid + '">' + escHtml(p ? p.name : pid) + '</option>';
    });
    h += '</select></div>';
  }

  h += '<div style="display:flex;gap:8px;margin-top:4px">';
  h += '<button class="btn full green" onclick="pnSaveNewTeam()" style="flex:1;font-size:12px;padding:9px">Save &amp; use this team</button>';
  h += '<button onclick="pnToggleCreateTeam()" style="padding:9px 14px;font-size:11px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer">Cancel</button>';
  h += '</div></div>';

  form.innerHTML = h;
}

function pnSetTeamSize(n) {
  pnScrambleTeamSize = n;
  pnScrambleSelected = [];
  pnRenderCreateTeamForm();
}

function pnToggleMember(pid) {
  var idx = pnScrambleSelected.indexOf(pid);
  if (idx === -1) {
    if (pnScrambleSelected.length >= pnScrambleTeamSize) { Router.toast("Max " + pnScrambleTeamSize + " members for this team"); return; }
    pnScrambleSelected.push(pid);
  } else {
    pnScrambleSelected.splice(idx, 1);
  }
  pnRenderCreateTeamForm();
}

function pnSaveNewTeam() {
  var nameEl = document.getElementById("pn-new-team-name");
  var name = nameEl ? nameEl.value.trim() : "";
  var captainEl = document.getElementById("pn-new-team-captain");
  var captain = captainEl ? captainEl.value : (pnScrambleSelected[0] || "");
  if (!name) { Router.toast("Enter a team name"); return; }
  if (pnScrambleSelected.length !== pnScrambleTeamSize) { Router.toast("Select exactly " + pnScrambleTeamSize + " members"); return; }
  var team = PB.addScrambleTeam({ name: name, members: pnScrambleSelected.slice(), captain: captain, size: pnScrambleTeamSize });
  if (!team) { Router.toast("Could not create team"); return; }
  syncScrambleTeam(team);
  pnScrambleSelected = [];
  Router.toast("Team created!");
  renderPnScrambleTeamSelector();
  pnSelectTeam(team.id);
}

function showPlayCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-pn-course",
    function(c) { return "pnSelectCourse('" + c.id.replace(/'/g,"\\'") + "','" + c.name.replace(/'/g,"\\'") + "'," + (c.rating||72) + "," + (c.slope||113) + ")"; },
    function(val) { return "quickAddCourse('" + val.replace(/'/g, "\\'") + "')"; }
  );
}

function pnSelectCourse(courseId, courseName, rating, slope) {
  var ci = document.getElementById("pn-course"); if (ci) ci.value = courseName;
  var ri = document.getElementById("pn-rating"); if (ri) ri.value = rating;
  var si = document.getElementById("pn-slope"); if (si) si.value = slope;
  var cii = document.getElementById("pn-course-id"); if (cii) cii.value = courseId;
  var ti = document.getElementById("pn-tee-name"); if (ti) ti.value = "";
  var sr = document.getElementById("search-pn-course"); if (sr) sr.innerHTML = "";
  renderPnTeeSelector(courseId);
}

function renderPnTeeSelector(courseId) {
  var sec = document.getElementById("pn-tee-section");
  if (!sec) return;
  var course = PB.getCourse(courseId);
  if (!course || !course.allTees || !course.allTees.length) { sec.innerHTML = ""; return; }
  var currentTee = (document.getElementById("pn-tee-name") || {}).value || course.tee || (course.allTees[0] && course.allTees[0].name) || "";
  // Auto-set hidden fields for default tee if not yet set
  if (!(document.getElementById("pn-tee-name") || {}).value) {
    var defTee = course.allTees.find(function(t) { return t.name === course.tee; }) || course.allTees[0];
    if (defTee) {
      var ti = document.getElementById("pn-tee-name"); if (ti) { ti.value = defTee.name; currentTee = defTee.name; }
      var ri = document.getElementById("pn-rating"); if (ri && defTee.rating) ri.value = defTee.rating;
      var si = document.getElementById("pn-slope"); if (si && defTee.slope) si.value = defTee.slope;
    }
  }
  var h = '<div class="ff"><label class="ff-label">Tee</label><div style="display:flex;flex-wrap:wrap;gap:6px;padding:2px 0">';
  course.allTees.forEach(function(tee) {
    var sel = tee.name === currentTee;
    var info = [tee.yards ? tee.yards + " yds" : "", tee.rating && tee.slope ? tee.rating + "/" + tee.slope : ""].filter(Boolean).join(" · ");
    h += '<div onclick="pnSelectTee(\'' + courseId.replace(/'/g,"\\'") + '\',\'' + (tee.name||"").replace(/'/g,"\\'") + '\')" ';
    h += 'style="cursor:pointer;padding:8px 14px;border-radius:8px;border:1.5px solid ' + (sel ? "var(--gold)" : "var(--border)") + ';background:' + (sel ? "rgba(var(--gold-rgb),.1)" : "transparent") + ';-webkit-tap-highlight-color:transparent">';
    h += '<div style="font-size:13px;font-weight:600;color:' + (sel ? "var(--gold)" : "var(--cream)") + '">' + escHtml(tee.name || "") + '</div>';
    if (info) h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + escHtml(info) + '</div>';
    h += '</div>';
  });
  h += '</div></div>';
  sec.innerHTML = h;
}

function pnSelectTee(courseId, teeName) {
  var course = PB.getCourse(courseId);
  if (!course || !course.allTees) return;
  var tee = course.allTees.find(function(t) { return t.name === teeName; });
  if (!tee) return;
  var ti = document.getElementById("pn-tee-name"); if (ti) ti.value = teeName;
  var ri = document.getElementById("pn-rating"); if (ri && tee.rating) ri.value = tee.rating;
  var si = document.getElementById("pn-slope"); if (si && tee.slope) si.value = tee.slope;
  renderPnTeeSelector(courseId);
}

function quickAddCourse(name) {
  var state = prompt("State (e.g. VA, PA, NC):", "");
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  var course = {
    id: id,
    name: name,
    loc: (state ? state : "Unknown"),
    region: state || "US",
    rating: 72.0,
    slope: 113,
    par: 72,
    photo: "",
    reviews: [],
    addedBy: currentUser ? currentUser.uid : "local",
    quickAdd: true
  };
  
  PB.addCourse(course);
  if (db) {
    db.collection("courses").doc(id).set(Object.assign({}, course, {createdAt: fsTimestamp()})).catch(function(){});
  }
  
  // Auto-select the new course
  document.getElementById("pn-course").value = name;
  document.getElementById("pn-rating").value = "72";
  document.getElementById("pn-slope").value = "113";
  document.getElementById("search-pn-course").innerHTML = "";
  Router.toast("Added " + name + "! Rating/slope can be updated later.");
}

function startLiveRound() {
  var player = document.getElementById("pn-player").value;
  var course = document.getElementById("pn-course").value;
  if (!course) { Router.toast("Select a course"); return; }

  var fmt = document.getElementById("pn-format").value;
  var scrambleTeamId = "";
  if (fmt === "scramble") {
    var teamEl = document.getElementById("pn-scramble-team-id");
    scrambleTeamId = teamEl ? teamEl.value : "";
    if (!scrambleTeamId) { Router.toast("Select or create a scramble team first"); return; }
  }

  // Resolve course data for hole-by-hole display
  var courseIdEl = document.getElementById("pn-course-id");
  var courseId = courseIdEl ? courseIdEl.value : "";
  var teeNameEl = document.getElementById("pn-tee-name");
  var teeName = teeNameEl ? teeNameEl.value : "";
  var courseData = courseId ? PB.getCourse(courseId) : PB.getCourseByName(course);
  var holes = [];
  var coursePar = 72;
  if (courseData) {
    coursePar = courseData.par || 72;
    var teeData = null;
    if (teeName && courseData.allTees) teeData = courseData.allTees.find(function(t) { return t.name === teeName; });
    if (!teeData && courseData.allTees && courseData.allTees.length) teeData = courseData.allTees.find(function(t) { return t.name === courseData.tee; }) || courseData.allTees[0];
    if (teeData && teeData.holes && teeData.holes.length) holes = teeData.holes;
    else if (courseData.holes && courseData.holes.length) holes = courseData.holes;
  }

  var holesEl = document.getElementById("pn-holes");
  var holesMode = holesEl ? holesEl.value : "18"; // "18", "front9", "back9"
  var startHole = holesMode === "back9" ? 9 : 0;
  var maxHoles = holesMode === "18" ? 18 : 9;

  liveState = {
    active: true,
    player: player,
    course: course,
    courseId: courseId || (courseData ? courseData.id : ""),
    tee: teeName || (courseData ? (courseData.tee || "") : ""),
    yards: (teeData && teeData.yards) ? teeData.yards : (courseData ? (courseData.yards || 0) : 0),
    rating: parseFloat(document.getElementById("pn-rating").value) || 72,
    slope: parseInt(document.getElementById("pn-slope").value) || 113,
    par: coursePar,
    holes: holes,
    format: fmt,
    holesMode: holesMode,
    scrambleTeamId: scrambleTeamId,
    startTime: Date.now(),
    currentHole: startHole,
    maxHoles: maxHoles,
    scores: Array(18).fill(""),
    fir: Array(18).fill(false),
    gir: Array(18).fill(false),
    putts: Array(18).fill(""),
    bunker: Array(18).fill(null),
    sand: Array(18).fill(null),
    upDown: Array(18).fill(null),
    miss: Array(18).fill(null),
    penalty: Array(18).fill(0),
    // v8.13.0 — Stable roundId persists across saveLiveState calls + carries
    // forward to /rounds/{id} on completion. Enables /round/:roundId lookup
    // for both live and completed rounds with a single id (Ship 4a Gate 1).
    roundId: typeof genId === "function" ? genId() : (Date.now().toString(36) + Math.random().toString(36).substr(2, 6))
  };
  advancedOpen = {};

  Router.toast("Let's go!");
  saveLiveState(); // persist round start immediately for crash recovery
  Router.go("playnow");
}

function getStrokesOnHole(handicapIndex, rating, slope, par, holeHdcp) {
  if (!handicapIndex || !holeHdcp) return 0;
  var courseHdcp = Math.round(handicapIndex * (slope / 113) + (rating - par));
  courseHdcp = Math.max(0, Math.min(courseHdcp, 54));
  if (courseHdcp <= 0) return 0;
  if (courseHdcp <= 18) return holeHdcp <= courseHdcp ? 1 : 0;
  return 1 + (holeHdcp <= (courseHdcp - 18) ? 1 : 0); // double-stroke holes
}

// Extracted to src/pages/playnow-scoring.js per W1.A5. Originally lines 745-1457 of this file.
