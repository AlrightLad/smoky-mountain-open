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

// Defensive shape validator — minimal per design F3. Status enum + lastWriteAt
// numeric. Other fields validated implicitly by downstream rendering with
// existing fallback patterns ("Round in progress" if course missing, etc.).
function isValidLiveRound(doc) {
  if (!doc || typeof doc !== "object") return false;
  if (!doc.status || ["active","completed","abandoned"].indexOf(doc.status) === -1) return false;
  if (typeof doc.lastWriteAt !== "number") return false;
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
    // Gate 3 will add 600ms cross-fade transition. For Gate 1: clear local
    // (remote already has truth) + re-render. Card disappears abruptly.
    if (liveState && liveState.active) {
      _clearLiveStateLocally();
      _triggerRouteAwareRender();
    }
    return;
  }

  if (status === "abandoned") {
    // C2 silent dismiss — clear local + re-render. No UI announcement.
    if (liveState && liveState.active) {
      _clearLiveStateLocally();
      _triggerRouteAwareRender();
    }
    return;
  }

  if (status === "active") {
    // Pattern 3 strict: hydrate-if-empty. NEVER overrides locally-active state.
    if (liveState && !liveState.active) {
      _hydrateLiveStateFromFirestore(doc);
      // D2: only swap render on first emission within 800ms window. Late
      // emissions hydrate liveState but commit idle for this page load —
      // surface the card on next navigation.
      if (wasFirstEmission) {
        _triggerRouteAwareRender();
      }
    }
    // liveState already active locally: no-op (multi-device caption is Gate 2)
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
    h += '<div style="font-size:11px;color:var(--muted);padding:4px 0 10px">No teams yet — create one below.</div>';
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
    penalty: Array(18).fill(0)
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

function renderLiveScoring() {
  try { _renderLiveScoringInner(); } catch(e) { pbWarn("[PlayNow] Render error:", e.message, e.stack); }
}
function _renderLiveScoringInner() {
  var hole = liveState.currentHole;
  var player = PB.getPlayer(liveState.player);
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

  // Resolve hole data from liveState or fallback
  var holeData = (liveState.holes && liveState.holes[hole]) || null;
  var par = (holeData && holeData.par) ? holeData.par : (defaultPar[hole] || 4);
  var yardage = holeData ? (holeData.yardage || holeData.yards || 0) : 0;
  var holeHdcp = holeData ? (holeData.handicap || holeData.hdcp || 0) : 0;
  var isPar3 = par === 3;

  // Parbaugh stroke allocation for this hole
  var strokesOnHole = 0;
  if (liveState.format === "parbaugh" && player) {
    var playerRounds = PB.getPlayerRounds(player.id);
    var playerHandicap = PB.calcHandicap(playerRounds);
    if (playerHandicap !== null) {
      strokesOnHole = getStrokesOnHole(playerHandicap, liveState.rating, liveState.slope, liveState.par || 72, holeHdcp);
    }
  }
  var netPar = par + strokesOnHole;

  // Calculate running total
  var totalSoFar = 0, holesPlayed = 0;
  liveState.scores.forEach(function(s) { if (s !== "") { totalSoFar += parseInt(s); holesPlayed++; } });
  var parSoFar = 0;
  for (var pi = 0; pi < holesPlayed; pi++) {
    var hd = liveState.holes && liveState.holes[pi];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[pi] || 4);
  }

  var h = '';

  // Top bar with course name and running score
  h += '<div style="padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">';
  h += '<div><div style="font-size:13px;font-weight:600">' + liveState.course + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + (player ? player.name : '') + ' · ' + liveState.format + '</div></div>';
  h += '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold)">' + (totalSoFar || "—") + '</div>';
  if (holesPlayed > 0) {
    var diff = totalSoFar - parSoFar;
    h += '<div style="font-size:10px;color:' + (diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (diff > 0 ? '+' : '') + diff + ' thru ' + holesPlayed + '</div>';
  }
  h += '</div></div>';

  // Hole selector — bigger tap targets
  var selectorStart = liveState.holesMode === "back9" ? 9 : 0;
  var selectorEnd = liveState.holesMode === "18" ? 18 : (liveState.holesMode === "back9" ? 18 : 9);
  h += '<div style="padding:8px 12px;display:flex;gap:3px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none">';
  for (var d = selectorStart; d < selectorEnd; d++) {
    var scored = liveState.scores[d] !== "";
    var isCurrent = d === hole;
    var dotColor = isCurrent ? 'var(--gold)' : scored ? 'var(--birdie)' : 'var(--border)';
    var dotBg = isCurrent ? 'rgba(var(--gold-rgb),.18)' : scored ? 'rgba(var(--birdie-rgb),.1)' : 'transparent';
    h += '<div onclick="liveNavJump(' + d + ')" style="min-width:32px;height:32px;border-radius:16px;border:1.5px solid ' + dotColor + ';background:' + dotBg + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:' + dotColor + ';cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent">' + (d+1) + '</div>';
  }
  h += '</div>';

  // Hole header — 18 Birdies style
  h += '<div style="padding:12px 16px 0">';

  // Hole info card
  h += '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px">';
  // Top row: hole number + tee label
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:2px">Hole ' + (hole+1) + '</div>';
  if (liveState.tee) h += '<div style="font-size:9px;color:var(--muted2);background:var(--bg2);padding:2px 8px;border-radius:10px;border:1px solid var(--border)">' + escHtml(liveState.tee) + '</div>';
  h += '</div>';
  // Stats row: Par / Yardage / Hdcp
  h += '<div style="display:flex;align-items:center;gap:0">';
  h += '<div style="flex:1;text-align:center;border-right:1px solid var(--border)">';
  h += '<div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--cream);line-height:1">' + par + '</div>';
  h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Par</div>';
  h += '</div>';
  if (yardage) {
    h += '<div style="flex:1;text-align:center;border-right:1px solid var(--border)">';
    h += '<div style="font-size:24px;font-weight:700;color:var(--cream);line-height:1">' + yardage + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Yards</div>';
    h += '</div>';
  }
  if (holeHdcp) {
    h += '<div style="flex:1;text-align:center">';
    h += '<div style="font-size:24px;font-weight:700;color:var(--cream);line-height:1">' + holeHdcp + '</div>';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px">Hdcp</div>';
    h += '</div>';
  }
  h += '</div>';
  // Parbaugh stroke indicator
  if (liveState.format === "parbaugh" && holeHdcp) {
    if (strokesOnHole > 0) {
      h += '<div style="margin-top:10px;padding:6px 10px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.25);border-radius:6px;display:flex;align-items:center;justify-content:space-between">';
      h += '<span style="font-size:11px;color:var(--gold);font-weight:600">+' + strokesOnHole + ' stroke' + (strokesOnHole > 1 ? 's' : '') + ' · Net par ' + netPar + '</span>';
      h += '<span style="font-size:9px;color:var(--muted)">Parbaugh</span></div>';
    } else {
      h += '<div style="margin-top:10px;padding:6px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;display:flex;align-items:center;justify-content:space-between">';
      h += '<span style="font-size:11px;color:var(--muted)">No stroke · Net par ' + netPar + '</span>';
      h += '<span style="font-size:9px;color:var(--muted)">Parbaugh</span></div>';
    }
  }
  h += '</div>'; // end hole info card

  // Score stepper — full width row, huge tap targets
  var currentScore = liveState.scores[hole];
  h += '<div style="margin-bottom:18px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;text-align:center;margin-bottom:8px">Score</div>';
  h += '<div style="display:flex;align-items:stretch;gap:0;border:1.5px solid var(--border);border-radius:14px;overflow:hidden;height:76px">';
  h += '<div onclick="adjustLiveScore(-1)" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;color:var(--muted);cursor:pointer;background:var(--bg3);-webkit-tap-highlight-color:transparent;user-select:none;border-right:1px solid var(--border)">−</div>';
  h += '<div id="liveScoreNum" style="flex:1.2;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg2)">';
  h += '<div style="font-family:var(--font-display);font-size:46px;font-weight:700;color:var(--gold);line-height:1">' + (currentScore || "—") + '</div>';
  if (currentScore !== "") {
    var scoreDiff = parseInt(currentScore) - par;
    var labels = {"-3":"Albatross","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Double","3":"Triple"};
    var label = labels[scoreDiff.toString()] || (scoreDiff > 0 ? '+' + scoreDiff : scoreDiff);
    var labelColor = scoreDiff < 0 ? 'var(--birdie)' : scoreDiff === 0 ? 'var(--muted)' : 'var(--red)';
    h += '<div style="font-size:10px;color:' + labelColor + ';font-weight:600;margin-top:2px;letter-spacing:.3px">' + label + '</div>';
  }
  h += '</div>';
  h += '<div onclick="adjustLiveScore(1)" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;color:var(--muted);cursor:pointer;background:var(--bg3);-webkit-tap-highlight-color:transparent;user-select:none;border-left:1px solid var(--border)">+</div>';
  h += '</div>';
  h += '</div>';

  // FIR / GIR / Putts — binary toggles, direct-DOM update on tap (v8.2.2)
  h += '<div style="display:flex;gap:8px;margin-bottom:20px">';
  var firActive = !!liveState.fir[hole];
  var firCls = isPar3 ? 'pn-fg-btn disabled' : ('pn-fg-btn' + (firActive ? ' active' : ''));
  var firAttr = isPar3 ? '' : ' onclick="toggleFir(' + hole + ')"';
  h += '<div id="pn-fir-' + hole + '" class="' + firCls + '"' + firAttr + '>';
  h += '<div class="pn-fg-title">FIR</div>';
  h += '<div class="pn-fg-state">' + (isPar3 ? 'N/A (Par 3)' : (firActive ? '\u2713 Hit' : 'Miss')) + '</div>';
  h += '</div>';

  var girActive = !!liveState.gir[hole];
  h += '<div id="pn-gir-' + hole + '" class="pn-fg-btn' + (girActive ? ' active' : '') + '" onclick="toggleGir(' + hole + ')">';
  h += '<div class="pn-fg-title">GIR</div>';
  h += '<div class="pn-fg-state">' + (girActive ? '\u2713 Hit' : 'Miss') + '</div>';
  h += '</div>';

  var puttVal = liveState.putts[hole];
  h += '<div id="pn-putts-' + hole + '" class="pn-putts-btn' + (puttVal ? ' active' : '') + '" onclick="cyclePutts(' + hole + ')">';
  h += '<div class="pn-putts-val">' + (puttVal || '—') + '</div>';
  h += '<div class="pn-putts-lbl">Putts</div>';
  h += '</div>';
  h += '</div>';

  // ── Advanced stats expander (v8.2.0) ────────────────────────────────
  var isAdvOpen = !!advancedOpen[hole];
  // Count filled advanced fields for badge
  var advFilled = 0;
  if (liveState.bunker[hole] !== null) advFilled++;
  if (liveState.sand[hole] !== null) advFilled++;
  if (liveState.upDown[hole] !== null) advFilled++;
  if (liveState.miss[hole]) advFilled++;
  if (liveState.penalty[hole] > 0) advFilled++;
  var advCountStr = advFilled > 0 ? 'Advanced stats \u00b7 ' + advFilled : 'Advanced stats';
  h += '<button id="pn-advtoggle-' + hole + '" class="advanced-stats-toggle' + (isAdvOpen ? ' open' : '') + '" onclick="toggleAdvancedStats(' + hole + ')">';
  h += '<span id="pn-advcount-' + hole + '">' + advCountStr + '</span>';
  h += '<span id="pn-advicon-' + hole + '" style="font-size:16px;color:var(--gold)">' + (isAdvOpen ? '\u2212' : '+') + '</span>';
  h += '</button>';

  // Advanced stats body — always in DOM, .hidden toggled (v8.2.2 direct-DOM refactor).
  // Conditional rows (sand save, up-and-down, miss direction) are also always in DOM,
  // with .hidden applied when their condition is not met. Toggle helpers update these.
  var gir = liveState.gir[hole];
  var bunker = liveState.bunker[hole];
  var sand = liveState.sand[hole];
  var upDown = liveState.upDown[hole];
  var miss = liveState.miss[hole];
  var penalty = liveState.penalty[hole] || 0;

  h += '<div id="pn-advbody-' + hole + '" class="advanced-stats-body' + (isAdvOpen ? '' : ' hidden') + '">';

  // Bunker toggle
  h += '<div class="adv-row">';
  h += '<span class="adv-label">In bunker?</span>';
  h += '<div id="pn-tri-bunker-' + hole + '" class="adv-tri" onclick="toggleBunker(' + hole + ')">';
  h += '<span class="adv-tri-opt' + (bunker === null ? ' active-neutral' : '') + '">\u2014</span>';
  h += '<span class="adv-tri-opt' + (bunker === true ? ' active-yes' : '') + '">Yes</span>';
  h += '<span class="adv-tri-opt' + (bunker === false ? ' active-no' : '') + '">No</span>';
  h += '</div></div>';

  // Sand save — always rendered, hidden when bunker !== true
  h += '<div id="pn-row-sand-' + hole + '" data-row="sand-save" class="adv-row' + (bunker !== true ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Sand save?</span>';
  h += '<div id="pn-tri-sand-' + hole + '" class="adv-tri" onclick="toggleSand(' + hole + ')">';
  h += '<span class="adv-tri-opt' + (sand === null ? ' active-neutral' : '') + '">\u2014</span>';
  h += '<span class="adv-tri-opt' + (sand === true ? ' active-yes' : '') + '">Yes</span>';
  h += '<span class="adv-tri-opt' + (sand === false ? ' active-no' : '') + '">No</span>';
  h += '</div></div>';

  // Up-and-down — always rendered, hidden unless GIR missed (gir === false)
  h += '<div id="pn-row-updown-' + hole + '" data-row="up-down" class="adv-row' + (gir !== false ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Up and down?</span>';
  h += '<div id="pn-tri-updown-' + hole + '" class="adv-tri" onclick="toggleUpDown(' + hole + ')">';
  h += '<span class="adv-tri-opt' + (upDown === null ? ' active-neutral' : '') + '">\u2014</span>';
  h += '<span class="adv-tri-opt' + (upDown === true ? ' active-yes' : '') + '">Yes</span>';
  h += '<span class="adv-tri-opt' + (upDown === false ? ' active-no' : '') + '">No</span>';
  h += '</div></div>';

  // Miss direction — always rendered, hidden unless GIR missed
  h += '<div id="pn-row-missdir-' + hole + '" data-row="miss-dir" class="adv-col' + (gir !== false ? ' hidden' : '') + '">';
  h += '<span class="adv-label">Miss direction</span>';
  h += '<div class="miss-chips">';
  ['left','right','long','short'].forEach(function(dir) {
    var isActive = miss === dir;
    h += '<button id="pn-miss-' + hole + '-' + dir + '" class="miss-chip' + (isActive ? ' active' : '') + '" onclick="setMiss(' + hole + ',\'' + dir + '\')">' + dir.charAt(0).toUpperCase() + dir.slice(1) + '</button>';
  });
  h += '</div></div>';

  // Penalty strokes stepper
  h += '<div class="adv-row">';
  h += '<span class="adv-label">Penalty strokes</span>';
  h += '<div class="adv-stepper">';
  h += '<button id="pn-pen-minus-' + hole + '" class="adv-step-btn" onclick="adjustPenalty(' + hole + ',-1)"' + (penalty <= 0 ? ' disabled' : '') + '>\u2212</button>';
  h += '<span id="pn-pen-val-' + hole + '" class="adv-step-val">' + penalty + '</span>';
  h += '<button id="pn-pen-plus-' + hole + '" class="adv-step-btn" onclick="adjustPenalty(' + hole + ',1)"' + (penalty >= 5 ? ' disabled' : '') + '>+</button>';
  h += '</div></div>';

  h += '</div>'; // end advanced-stats-body

  // Turn summary (show at hole 9)
  if (hole === 9 || hole === 17) {
    var front = 0, frontCount = 0, back = 0, backCount = 0;
    for (var ti = 0; ti < 9; ti++) { if (liveState.scores[ti] !== "") { front += parseInt(liveState.scores[ti]); frontCount++; } }
    for (var bi = 9; bi < 18; bi++) { if (liveState.scores[bi] !== "") { back += parseInt(liveState.scores[bi]); backCount++; } }
    var frontPar = 0, backPar = 0;
    for (var fpi = 0; fpi < 9; fpi++) { var fhd = liveState.holes && liveState.holes[fpi]; frontPar += (fhd && fhd.par) ? fhd.par : (defaultPar[fpi] || 4); }
    for (var bpi = 9; bpi < 18; bpi++) { var bhd = liveState.holes && liveState.holes[bpi]; backPar += (bhd && bhd.par) ? bhd.par : (defaultPar[bpi] || 4); }
    if (frontCount > 0) {
      var frontDiff = front - frontPar;
      var backDiff = back - backPar;
      h += '<div style="margin-bottom:16px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);display:flex;justify-content:space-around;text-align:center">';
      h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Front</div>';
      h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + front + '</div>';
      h += '<div style="font-size:9px;color:' + (frontDiff > 0 ? 'var(--red)' : frontDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (frontDiff > 0 ? '+' : '') + frontDiff + '</div></div>';
      if (backCount > 0) {
        h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Back</div>';
        h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + back + '</div>';
        h += '<div style="font-size:9px;color:' + (backDiff > 0 ? 'var(--red)' : backDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (backDiff > 0 ? '+' : '') + backDiff + '</div></div>';
      }
      var totalDiff = totalSoFar - parSoFar;
      h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Total</div>';
      h += '<div style="font-family:var(--font-display);font-size:20px;color:var(--gold)">' + totalSoFar + '</div>';
      h += '<div style="font-size:9px;color:' + (totalDiff > 0 ? 'var(--red)' : totalDiff < 0 ? 'var(--birdie)' : 'var(--muted)') + '">' + (totalDiff > 0 ? '+' : '') + totalDiff + '</div></div>';
      h += '</div>';
    }
  }

  // v8.11.6 — Backup Submit affordance. Always renders when at least one hole
  // is scored, regardless of which hole is being viewed or whether the panel
  // above rendered. Defense-in-depth against bottom-nav rendering failures
  // (Mr Parbaugh Ocean Pines stuck-round, April 28, 2026 — undiagnosed mobile
  // bug where _redrawBottomNav fix from v8.11.5 didn't restore visibility).
  // Bottom nav at line ~761+ remains as primary affordance; this is the
  // redundant escape hatch. finishLiveRound's existing >=9 guard handles
  // early taps via Router.toast — no state corruption risk.
  if (holesPlayed >= 1) {
    var totalHoles = liveState.holesMode === "front9" || liveState.holesMode === "back9" ? 9 : 18;
    h += '<button onclick="showFinishOptions()" style="display:block;width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,var(--birdie),var(--cb-green-3));color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;cursor:pointer">\u2714 Submit Round (' + holesPlayed + '/' + totalHoles + ')</button>';
  }

  // Quit confirm panel
  h += '<div id="quit-confirm" style="display:none;margin-bottom:8px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
  h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">Quit this round? Scores will be lost.</div>';
  h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'quit-confirm\').style.display=\'none\'">Cancel</button>';
  h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="clearLiveState(\'abandoned\');updatePresence._force=true;updatePresence();Router.go(\'rounds\')">Quit</button></div></div>';
  h += '<button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red);font-size:11px;margin-bottom:80px" onclick="document.getElementById(\'quit-confirm\').style.display=\'block\'">Quit round</button>';

  h += '</div>';

  // Finish options panel (before submit)
  h += '<div id="finish-options" style="display:none;position:fixed;bottom:56px;left:0;right:0;z-index:200;padding:12px 16px;background:var(--bg2);border-top:1px solid var(--border)">';
  h += '<div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Publish round</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:10px">';
  h += '<div onclick="document.getElementById(\'vis-public\').style.borderColor=\'var(--gold)\';document.getElementById(\'vis-private\').style.borderColor=\'var(--border)\';liveState.visibility=\'public\'" id="vis-public" style="flex:1;padding:10px;text-align:center;border:2px solid var(--gold);border-radius:var(--radius);cursor:pointer;background:rgba(var(--gold-rgb),.06)"><div style="font-size:12px;font-weight:600;color:var(--cream)">Public</div><div style="font-size:9px;color:var(--muted);margin-top:2px">Shows in activity feed</div></div>';
  h += '<div onclick="document.getElementById(\'vis-private\').style.borderColor=\'var(--gold)\';document.getElementById(\'vis-public\').style.borderColor=\'var(--border)\';liveState.visibility=\'private\'" id="vis-private" style="flex:1;padding:10px;text-align:center;border:2px solid var(--border);border-radius:var(--radius);cursor:pointer"><div style="font-size:12px;font-weight:600;color:var(--cream)">Private</div><div style="font-size:9px;color:var(--muted);margin-top:2px">Only on your profile</div></div>';
  h += '</div>';
  h += '<button class="btn full green" onclick="finishLiveRound()">Confirm &amp; save</button>';
  h += '</div>';

  // Sticky bottom nav — always reachable.
  // v8.11.5: extracted to _renderBottomNavInner so adjustLiveScore + per-stat
  // toggles can refresh nav state via _redrawBottomNav without a full page
  // re-render. Container has id="liveBottomNav" for surgical innerHTML swap.
  h += '<div id="liveBottomNav" style="position:fixed;bottom:0;left:0;right:0;z-index:100;background:var(--bg2);border-top:1px solid var(--border);padding:8px 12px">';
  h += _renderBottomNavInner(hole);
  h += '</div>';

  document.querySelector('[data-page="playnow"]').innerHTML = h;
}

// v8.11.5 — Bottom-nav inner string-builder. Extracted so initial render
// (_renderLiveScoringInner) and surgical repaint (_redrawBottomNav) share
// a single source of truth. Inputs derived from liveState globals + the
// passed `hole` (always liveState.currentHole; passed explicitly for clarity).
//
// ringPulse animation inlined via style attribute survives innerHTML swap —
// when the BIG button is freshly inserted the animation starts at frame 0,
// which is the desired behavior when allScored flips from false to true.
function _renderBottomNavInner(hole) {
  var lastHole = liveState.holesMode === "front9" ? 8 : (liveState.holesMode === "back9" ? 17 : 17);
  var isLastHole = hole >= lastHole;
  var scoredCount = liveState.scores.filter(function(s){return s!==""}).length;
  var totalHoles = liveState.holesMode === "front9" || liveState.holesMode === "back9" ? 9 : 18;
  var allScored = scoredCount >= totalHoles;
  var h = "";

  if (scoredCount >= 1) {
    if (isLastHole || allScored) {
      // On last hole or all scored: BIG prominent finish button
      h += '<div style="display:flex;gap:8px">';
      if (hole > 0) h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:11px" onclick="liveNavPrev()">← Prev</button>';
      var _finishPulse = allScored ? 'animation:ringPulse 1.5s ease-in-out infinite;' : '';
      h += '<button class="btn" style="flex:1;padding:16px 0;font-size:16px;font-weight:800;background:linear-gradient(135deg,var(--birdie),var(--cb-green-3));color:#fff;border:none;border-radius:var(--radius);' + _finishPulse + '" onclick="showFinishOptions()">\u2714 Finish Round (' + scoredCount + '/' + totalHoles + ')</button>';
      h += '</div>';
    } else {
      // Not on last hole: Next + small Finish option
      h += '<div style="display:flex;gap:8px">';
      if (hole > 0) h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:11px" onclick="liveNavPrev()">← Prev</button>';
      h += '<button class="btn green" style="flex:1;padding:14px 0;font-size:14px;font-weight:700" onclick="liveNavNext(' + hole + ')">Next hole \u2192</button>';
      h += '<button class="btn outline" style="flex:0 0 70px;padding:14px 0;font-size:10px;color:var(--gold);border-color:rgba(var(--gold-rgb),.3)" onclick="showFinishOptions()">Finish</button>';
      h += '</div>';
    }
  } else {
    // No scores yet: just Next
    h += '<div style="display:flex;gap:8px">';
    h += '<button class="btn green" style="flex:1;padding:14px 0;font-size:14px;font-weight:700" onclick="liveNavNext(' + hole + ')">Next hole \u2192</button>';
    h += '</div>';
  }

  // Quit round — always tiny and de-emphasized
  h += '<div style="text-align:center;margin-top:6px"><span style="font-size:9px;color:var(--red);cursor:pointer;opacity:.5" onclick="quitLiveRound()">Quit round (discard scores)</span></div>';
  return h;
}

// v8.11.5 — Surgical bottom-nav repaint. Called by every liveState mutator
// that doesn't trigger a full Router.go("playnow") re-render. Conservative
// coverage per audit Call 3: all 9 mutators (adjustLiveScore + 8 per-stat
// toggles) call this. Per-stat toggles don't change bottom-nav inputs today,
// but conservative coverage forecloses the memory #9 trap if Ship 4a/4b
// expands the nav's input set (e.g., FIR/GIR running counts in the bottom
// strip). Cost: idempotent innerHTML swap, ~negligible per call.
function _redrawBottomNav() {
  var nav = document.getElementById("liveBottomNav");
  if (!nav) return;
  nav.innerHTML = _renderBottomNavInner(liveState.currentHole);
}

function adjustLiveScore(delta) {
  try {
  var hole = liveState.currentHole;
  var current = liveState.scores[hole];
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var par = (liveState.holes && liveState.holes[hole] && liveState.holes[hole].par) || defaultPar[hole] || 4;
  var changed = false;
  if (current === "") {
    liveState.scores[hole] = par;
    changed = true;
  } else {
    var newVal = parseInt(current) + delta;
    if (newVal >= 1 && newVal <= 15) {
      liveState.scores[hole] = newVal;
      changed = true;
    }
  }
  updatePresence(); // broadcast to watchers
  saveLiveState();  // persist for crash recovery / cross-device
  // Direct-DOM update — primary score display, diff label, and running total.
  // Turn-summary and hole-selector-dot update on next hole navigation.
  _redrawScoreCard(hole, par);
  _redrawBottomNav(); // v8.11.5 — refresh Finish button label/state
  if (changed && typeof hapticLight === "function") hapticLight();
  } catch(e) { pbWarn("[PlayNow] adjustLiveScore error:", e.message); }
}

// Update only the parts of the scorecard that the score number touches.
// Called from adjustLiveScore on every tap. Full re-render still fires on hole nav.
function _redrawScoreCard(hole, par) {
  var scoreVal = liveState.scores[hole];
  var scoreNumEl = document.getElementById("liveScoreNum");
  if (scoreNumEl) {
    // scoreNum wraps two children: the big number and the diff label. Rebuild both.
    var inner = '<div style="font-family:var(--font-display);font-size:46px;font-weight:700;color:var(--gold);line-height:1">' + (scoreVal || '\u2014') + '</div>';
    if (scoreVal !== "") {
      var scoreDiff = parseInt(scoreVal) - par;
      var labels = {"-3":"Albatross","-2":"Eagle","-1":"Birdie","0":"Par","1":"Bogey","2":"Double","3":"Triple"};
      var label = labels[scoreDiff.toString()] || (scoreDiff > 0 ? '+' + scoreDiff : scoreDiff);
      var labelColor = scoreDiff < 0 ? 'var(--birdie)' : scoreDiff === 0 ? 'var(--muted)' : 'var(--red)';
      inner += '<div style="font-size:10px;color:' + labelColor + ';font-weight:600;margin-top:2px;letter-spacing:.3px">' + label + '</div>';
    }
    scoreNumEl.innerHTML = inner;
    scoreNumEl.classList.remove("score-pop");
    void scoreNumEl.offsetWidth;
    scoreNumEl.classList.add("score-pop");
  }
}

function liveNavNext(hole) {
  if (liveState.scores[hole] === "") { Router.toast("Enter a score"); return; }
  liveState.currentHole++;
  saveLiveState();
  Router.go("playnow");
}

function liveNavPrev() {
  liveState.currentHole--;
  saveLiveState();
  Router.go("playnow");
}

function liveNavJump(hole) {
  liveState.currentHole = hole;
  saveLiveState();
  Router.go("playnow");
}

// ── Scoring toggle helpers (v8.2.2 direct-DOM refactor) ───────────────────
// All helpers update liveState, call saveLiveState for persistence, then
// mutate only the affected DOM nodes. Router.go is NOT called — the page
// is never re-rendered during in-hole interaction. Hole navigation is the
// only thing that triggers a full Router.go("playnow") re-render.

// Shared: apply active class to the correct tri-toggle option for a tri-state value.
function _applyTriToggle(triEl, value) {
  if (!triEl) return;
  var opts = triEl.querySelectorAll(".adv-tri-opt");
  if (opts.length < 3) return;
  opts[0].className = "adv-tri-opt" + (value === null ? " active-neutral" : "");
  opts[1].className = "adv-tri-opt" + (value === true ? " active-yes" : "");
  opts[2].className = "adv-tri-opt" + (value === false ? " active-no" : "");
}

// Shared: recompute advFilled count and write to the toggle-button badge.
function _refreshAdvCount(hole) {
  var n = 0;
  if (liveState.bunker[hole] !== null) n++;
  if (liveState.sand[hole] !== null) n++;
  if (liveState.upDown[hole] !== null) n++;
  if (liveState.miss[hole]) n++;
  if (liveState.penalty[hole] > 0) n++;
  var countEl = document.getElementById("pn-advcount-" + hole);
  if (countEl) countEl.textContent = n > 0 ? ("Advanced stats \u00b7 " + n) : "Advanced stats";
}

function toggleFir(hole) {
  liveState.fir[hole] = !liveState.fir[hole];
  var el = document.getElementById("pn-fir-" + hole);
  if (el) {
    var active = !!liveState.fir[hole];
    el.classList.toggle("active", active);
    var state = el.querySelector(".pn-fg-state");
    if (state) state.textContent = active ? "\u2713 Hit" : "Miss";
  }
  saveLiveState();
  _redrawBottomNav();
}

function toggleGir(hole) {
  var newVal = !liveState.gir[hole];
  liveState.gir[hole] = newVal;
  // If GIR flipped to hit, the up-and-down and miss-direction rows no longer
  // apply — clear any values that were captured while GIR was missed.
  if (newVal === true) {
    if (liveState.upDown[hole] !== null) {
      liveState.upDown[hole] = null;
      var triUpDown = document.getElementById("pn-tri-updown-" + hole);
      _applyTriToggle(triUpDown, null);
    }
    if (liveState.miss[hole]) {
      liveState.miss[hole] = null;
      ["left","right","long","short"].forEach(function(dir) {
        var chip = document.getElementById("pn-miss-" + hole + "-" + dir);
        if (chip) chip.classList.remove("active");
      });
    }
  }
  var el = document.getElementById("pn-gir-" + hole);
  if (el) {
    el.classList.toggle("active", newVal);
    var state = el.querySelector(".pn-fg-state");
    if (state) state.textContent = newVal ? "\u2713 Hit" : "Miss";
  }
  // Conditional rows: visible only when GIR missed.
  var showUd = newVal === false;
  var udRow = document.getElementById("pn-row-updown-" + hole);
  if (udRow) udRow.classList.toggle("hidden", !showUd);
  var missRow = document.getElementById("pn-row-missdir-" + hole);
  if (missRow) missRow.classList.toggle("hidden", !showUd);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function cyclePutts(hole) {
  var current = liveState.putts[hole];
  if (!current) liveState.putts[hole] = 1;
  else if (current >= 4) liveState.putts[hole] = "";
  else liveState.putts[hole] = current + 1;
  var newVal = liveState.putts[hole];
  var el = document.getElementById("pn-putts-" + hole);
  if (el) {
    el.classList.toggle("active", !!newVal);
    var valEl = el.querySelector(".pn-putts-val");
    if (valEl) valEl.textContent = newVal || "\u2014";
  }
  saveLiveState();
  _redrawBottomNav();
}

// ── Advanced stats helpers (v8.2.0) ────────────────────────────────────
function toggleAdvancedStats(hole) {
  advancedOpen[hole] = !advancedOpen[hole];
  var open = !!advancedOpen[hole];
  var body = document.getElementById("pn-advbody-" + hole);
  if (body) body.classList.toggle("hidden", !open);
  var toggle = document.getElementById("pn-advtoggle-" + hole);
  if (toggle) toggle.classList.toggle("open", open);
  var icon = document.getElementById("pn-advicon-" + hole);
  if (icon) icon.textContent = open ? "\u2212" : "+";
  // Ephemeral UI state — not persisted, matches prior behavior.
}

function toggleBunker(hole) {
  var cur = liveState.bunker[hole];
  // Tri-state cycle: null -> true -> false -> null
  if (cur === null) liveState.bunker[hole] = true;
  else if (cur === true) liveState.bunker[hole] = false;
  else liveState.bunker[hole] = null;
  var newBunker = liveState.bunker[hole];
  // If bunker is no longer true, clear sand save.
  if (newBunker !== true && liveState.sand[hole] !== null) {
    liveState.sand[hole] = null;
    _applyTriToggle(document.getElementById("pn-tri-sand-" + hole), null);
  }
  _applyTriToggle(document.getElementById("pn-tri-bunker-" + hole), newBunker);
  // Sand save row visible only when bunker === true.
  var sandRow = document.getElementById("pn-row-sand-" + hole);
  if (sandRow) sandRow.classList.toggle("hidden", newBunker !== true);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function toggleSand(hole) {
  var cur = liveState.sand[hole];
  if (cur === null) liveState.sand[hole] = true;
  else if (cur === true) liveState.sand[hole] = false;
  else liveState.sand[hole] = null;
  _applyTriToggle(document.getElementById("pn-tri-sand-" + hole), liveState.sand[hole]);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function toggleUpDown(hole) {
  var cur = liveState.upDown[hole];
  if (cur === null) liveState.upDown[hole] = true;
  else if (cur === true) liveState.upDown[hole] = false;
  else liveState.upDown[hole] = null;
  _applyTriToggle(document.getElementById("pn-tri-updown-" + hole), liveState.upDown[hole]);
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function setMiss(hole, direction) {
  // Toggle off if same direction tapped again.
  var newVal = liveState.miss[hole] === direction ? null : direction;
  liveState.miss[hole] = newVal;
  ["left","right","long","short"].forEach(function(dir) {
    var chip = document.getElementById("pn-miss-" + hole + "-" + dir);
    if (chip) chip.classList.toggle("active", newVal === dir);
  });
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function adjustPenalty(hole, delta) {
  var cur = liveState.penalty[hole] || 0;
  var next = cur + delta;
  if (next < 0) next = 0;
  if (next > 5) next = 5;
  liveState.penalty[hole] = next;
  var valEl = document.getElementById("pn-pen-val-" + hole);
  if (valEl) valEl.textContent = next;
  var minusBtn = document.getElementById("pn-pen-minus-" + hole);
  if (minusBtn) minusBtn.disabled = next <= 0;
  var plusBtn = document.getElementById("pn-pen-plus-" + hole);
  if (plusBtn) plusBtn.disabled = next >= 5;
  _refreshAdvCount(hole);
  saveLiveState();
  _redrawBottomNav();
}

function finishLiveRound() {
  var startHole = liveState.holesMode === "back9" ? 9 : 0;
  var endHole = liveState.holesMode === "front9" ? 9 : 18;
  var totalScore = 0, completed = 0;
  for (var hi = startHole; hi < endHole; hi++) {
    if (liveState.scores[hi] !== "") { totalScore += parseInt(liveState.scores[hi]); completed++; }
  }

  if (completed < 9) { Router.toast("Play at least 9 holes"); return; }

  // Save as a local round
  var _pName = currentProfile ? (currentProfile.name || currentProfile.username || liveState.player) : liveState.player;
  var round = PB.addRound({
    player: liveState.player,
    playerName: _pName,
    course: liveState.course,
    score: totalScore,
    date: localDateStr(),
    rating: completed <= 9 ? (liveState.rating || 72) / 2 : (liveState.rating || 72),
    slope: liveState.slope,
    format: liveState.format,
    holesPlayed: completed,
    holesMode: liveState.holesMode || "18",
    holeScores: liveState.scores.slice(),
    holePars: liveState.holes && liveState.holes.length ? liveState.holes.map(function(h){return h.par||4;}) : null,
    firData: liveState.fir.slice(),
    girData: liveState.gir.slice(),
    puttsData: liveState.putts.slice(),
    bunkerData: liveState.bunker.slice(),
    sandData: liveState.sand.slice(),
    upDownData: liveState.upDown.slice(),
    missData: liveState.miss.slice(),
    penaltyData: liveState.penalty.slice(),
    visibility: liveState.visibility || "public"
  });
  // Sync to Firestore immediately — critical for cross-device visibility and loadRoundsFromFirestore
  syncRound(round);

  // Haptic success on round finish (Ship 0b-iii)
  if (typeof hapticSuccess === "function") hapticSuccess();

  // Persist computed stats back to member doc so they're always available even if rounds don't load
  setTimeout(function() { persistPlayerStats(liveState.player); }, 2000);

  // Calculate stats
  var firCount = 0, girCount = 0, totalPutts = 0;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parTotal = 0;
  for (var i = 0; i < completed; i++) {
    if (defaultPar[i] !== 3 && liveState.fir[i]) firCount++;
    if (liveState.gir[i]) girCount++;
    if (liveState.putts[i]) totalPutts += liveState.putts[i];
    parTotal += defaultPar[i] || 4;
  }
  var firHoles = 0;
  for (var j = 0; j < completed; j++) { if (defaultPar[j] !== 3) firHoles++; }

  // Capture state BEFORE clearing — clearLiveState wipes everything
  var savedScores = liveState.scores.slice();
  var savedHoles = liveState.holes ? liveState.holes.slice() : [];
  var savedTee = liveState.tee || "";
  var savedYards = liveState.yards || 0;
  var savedCourse = liveState.course;

  liveState.active = false;
  clearLiveState(); // remove crash recovery data — round committed to Firestore
  updatePresence._force = true;
  updatePresence(); // clear liveRound from presence so watchers see round ended
  setTimeout(checkAndAwardNewAchievements, 1500); // check for newly unlocked achievements

  // ── ParCoin: award coins for completing a round ──
  if (currentUser && liveState.format !== "scramble" && liveState.format !== "scramble4") {
    var is9h = completed < 18;
    var isAttested = !!round.attestedBy;
    var roundCoins = calcRoundCoins(is9h, isAttested);
    awardCoins(currentUser.uid, roundCoins, "round_complete", "Completed " + (is9h ? "9H" : "18H") + " round at " + liveState.course + " (" + totalScore + ")" + (isAttested ? " [attested]" : ""), "round_" + round.id);
    // Personal best check
    var prevBest = PB.getPlayerBest(currentUser.uid);
    if (!is9h && prevBest && prevBest.score && totalScore < prevBest.score) {
      awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_18h, "personal_best", "New PB (18H): " + totalScore + " at " + liveState.course, "pb_" + round.id);
    } else if (is9h) {
      var prevBest9 = PB.getPlayerRounds(currentUser.uid).filter(function(r){return r.holesPlayed&&r.holesPlayed<18&&r.score}).map(function(r){return r.score});
      if (prevBest9.length > 1 && totalScore < Math.min.apply(null, prevBest9.slice(0,-1))) {
        awardCoins(currentUser.uid, PARCOIN_RATES.personal_best_9h, "personal_best_9h", "New PB (9H): " + totalScore, "pb9_" + round.id);
      }
    }
  }
  // Check if any wagers or bounties can be resolved with this round
  setTimeout(function() {
    if (typeof checkWagerResolution === "function") checkWagerResolution(round);
    if (typeof checkBountyClaims === "function") checkBountyClaims(round);
  }, 3000);

  var commentary = PB.generateRoundCommentary(round);
  var msg = commentary.roasts.length ? commentary.roasts[0] : (commentary.highlights.length ? commentary.highlights[0] : "Round complete!");

  // Build share card text
  var diff = totalScore - parTotal;
  var diffStr = diff > 0 ? "+" + diff : diff === 0 ? "E" : diff;
  var playerName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
  var shareText = playerName + " shot " + totalScore + " (" + diffStr + ") at " + savedCourse;
  if (firHoles > 0) shareText += " · FIR " + firCount + "/" + firHoles;
  shareText += " · GIR " + girCount + "/" + completed;
  if (totalPutts > 0) shareText += " · " + totalPutts + " putts";
  shareText += "\nparbaughs.golf";

  // Show share card modal
  showShareCard(totalScore, diffStr, savedCourse, playerName, firCount, firHoles, girCount, completed, totalPutts, shareText, round.id, savedScores, savedHoles, savedTee, savedYards);
}

function showFinishOptions() {
  var el = document.getElementById("finish-options");
  if (el) el.style.display = "block";
  liveState.visibility = "public";
  window.scrollTo(0, document.body.scrollHeight);
}

