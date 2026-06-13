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

// Per-hole "Adjust hole" (par/yardage edit) expander open state. Module-scoped,
// not persisted — mirrors advancedOpen. BL-001: lets a member correct the
// current hole's par/yardage during live play when the course record is wrong.
var holeEditOpen = {};

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
  holeEditOpen = {};
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

// ── Setup-surface presentation helpers (structural pass, task #29) ────────
// One check glyph for every selectable well (was 3x-duplicated inline, with
// a hardcoded white stroke — now the chalk token on the brass fill), and one
// keyboard-activation attribute string so tappable divs stay reachable
// without N copies of the onkeydown handler.
var PN_CHECK_SVG = '<svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="var(--cb-chalk)" stroke-width="2" aria-hidden="true"><path d="M2 5l2 2 4-4"/></svg>';
var PN_KEY_ACTIVATE = ' role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}"';

function renderPlaySetup() {
  // v8.25.71 — editorial masthead (matches Members/Standings/Scramble) so the
  // setup entry carries the same gravity as the live-scoring surface it launches.
  var h = '<div class="roster-masthead">';
  h += '<button class="back" onclick="Router.back(\'home\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">LIVE SCORING</div>';
  h += '<h1 class="roster-headline">Play now.</h1></div>';

  // Single hierarchy: the .sh "Play now" title is the only heading. This is a
  // quiet supporting line, not a second gold display heading competing with it,
  // and it stays left-aligned to match the form labels below. The Scramble
  // link pads to a 44pt hit area via the recipe's negative-margin trick.
  h += '<div class="pn-supporting">Score hole by hole as you play, or <span class="pn-supporting__link"' + PN_KEY_ACTIVATE + ' onclick="Router.go(\'scramble-live\')">start a Scramble round →</span></div>';

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
    // Designed error state (P10: an unlinked profile is a failure, not a
    // legitimate empty) — names the WHAT (no linked player profile) and the
    // ACTION (the Commissioner links it).
    h += '<div class="pf-empty pf-empty--error"><div class="pf-empty__h">We can\'t find your player profile</div><div class="pf-empty__b">Your account isn\'t linked to a member profile yet, so live scoring can\'t start. Message the Commissioner and they\'ll link you up.</div></div>';
    h += '</div>'; // .form-section
    document.querySelector('[data-page="playnow"]').innerHTML = h;
    return;
  }
  // v8.23.87 — elevated paper "form sheet" gives the setup figure-ground depth:
  // the card lifts off the deeper canvas so the fields read as crisp inset wells
  // (this page was the lone flat surface where fields sat muddy on the same
  // ground). Recipe now lives in components.css (.pn-setup-card).
  h += '<div class="pn-setup-card">';
  h += '<div class="ff"><label class="ff-label">Playing as</label><div class="ff-input pn-playas">' + escHtml(playAs.name) + '</div><input type="hidden" id="pn-player" value="' + playAs.id + '"></div>';

  h += '<div class="ff"><label class="ff-label">Course</label><input class="ff-input" id="pn-course" placeholder="Search courses..." autocomplete="off" oninput="showPlayCourseSearch(this)"><div id="search-pn-course" class="search-results"></div></div>';
  h += '<input type="hidden" id="pn-rating" value=""><input type="hidden" id="pn-slope" value=""><input type="hidden" id="pn-course-id" value=""><input type="hidden" id="pn-tee-name" value="">';
  h += '<div id="pn-tee-section"></div>';

  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="pn-format" onchange="onPlayFormatChange()"><option value="stroke">Stroke play</option><option value="parbaugh">Parbaugh Stroke Play (handicap-adjusted)</option><option value="stableford">Stableford</option><option value="match">Match play</option><option value="scramble">Scramble</option><option value="bestball">Best ball</option><option value="skins">Skins</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Holes</label><select class="ff-input" id="pn-holes"><option value="18">18 holes</option><option value="front9">Front 9 (holes 1–9)</option><option value="back9">Back 9 (holes 10–18)</option></select></div>';
  h += '<div id="pn-scramble-team-section"></div>';

  // Felt + brass CTA — the same voice as the Play hub card (activity.js):
  // felt ground, brass label, brass chevron. Recipe in components.css.
  h += '<button class="pn-cta" onclick="startLiveRound()">Tee it up<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button>';
  h += '</div>'; // .pn-setup-card
  h += '</div>'; // .form-section

  document.querySelector('[data-page="playnow"]').innerHTML = h;
  // v8.25.71 — entrance cascade on the setup fields (reduced-motion no-ops inside).
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="playnow"] .pn-setup-card .ff'), { gap: 45, duration: 320 });
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

  // Canonical in-card section head (mono brass eyebrow) + the shared
  // selectable-well recipe — selection state is a class toggle now, so
  // pnSelectTeam below stays in sync with this markup.
  var h = '<div class="pn-sec">';
  h += '<div class="pn-sec__eyebrow">Scramble team</div>';

  if (myTeams.length > 0) {
    myTeams.forEach(function(t) {
      var mates = t.members.map(function(mid) { var p = PB.getPlayer(mid); return p ? p.name : mid; }).join(", ");
      var sel = t.id === selectedId;
      h += '<div class="pn-well pn-team-row' + (sel ? ' pn-well--sel' : '') + '" id="pn-team-row-' + t.id + '"' + PN_KEY_ACTIVATE + ' onclick="pnSelectTeam(\'' + t.id + '\')">';
      h += '<div><div class="pn-row__title">' + escHtml(t.name) + '</div>';
      h += '<div class="pn-row__sub">' + escHtml(mates) + '</div></div>';
      h += '<div class="pn-row__right"><span class="pn-row__tag">' + t.size + '-man</span>';
      h += '<div class="pn-check">' + (sel ? PN_CHECK_SVG : '') + '</div></div></div>';
    });
  } else {
    // Designed empty (legitimate: a new member simply has no teams yet).
    h += '<div class="pf-empty" style="margin-bottom:10px"><div class="pf-empty__h">No teams yet</div><div class="pf-empty__b">Create one below — pick your partners and a captain.</div></div>';
  }

  h += '<div id="pn-create-team-toggle-wrap" style="margin-top:4px"><button class="pn-ghost pn-ghost--block" onclick="pnToggleCreateTeam()">+ Create new team</button></div>';
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
    // Selection is a class toggle — the .pn-well--sel recipe styles both the
    // row and its .pn-check disc; only the glyph needs imperative swapping.
    row.classList.toggle("pn-well--sel", sel);
    var check = row.querySelector(".pn-check");
    if (check) check.innerHTML = sel ? PN_CHECK_SVG : "";
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

  // Inset sheet keeps the inline form subordinate to the setup card; every
  // label rides the canonical ff-label rhythm (the old per-label inline
  // font-size:10px overrides broke the form's vertical voice).
  var h = '<div class="pn-subcard">';
  h += '<div class="pn-sec__eyebrow">New team</div>';

  h += '<div class="ff"><label class="ff-label">Team name</label><input class="ff-input" id="pn-new-team-name" placeholder="e.g. The Bogey Boys" autocomplete="off"></div>';

  h += '<div class="ff"><label class="ff-label">Team size</label><div style="display:flex;gap:6px">';
  [2,3,4].forEach(function(n) {
    var a = pnScrambleTeamSize === n;
    h += '<button class="pn-seg' + (a ? ' pn-seg--sel' : '') + '" onclick="pnSetTeamSize(' + n + ')">' + n + '-man</button>';
  });
  h += '</div></div>';

  h += '<div class="ff"><label class="ff-label">Members <span style="color:' + (pnScrambleSelected.length === pnScrambleTeamSize ? 'var(--birdie)' : 'var(--muted)') + '">(' + pnScrambleSelected.length + '/' + pnScrambleTeamSize + ')</span></label>';
  players.forEach(function(p) {
    var isSelf = p.id === myPid;
    var inTeam = pnScrambleSelected.indexOf(p.id) !== -1;
    h += '<div class="pn-well pn-member-row' + (inTeam ? ' pn-well--sel' : '') + '" id="pn-m-' + p.id + '"' + PN_KEY_ACTIVATE + ' onclick="pnToggleMember(\'' + p.id + '\')">';
    h += '<div class="pn-row__name">' + escHtml(p.name) + (isSelf ? ' <span class="pn-row__you">(you)</span>' : '') + '</div>';
    h += '<div class="pn-check">' + (inTeam ? PN_CHECK_SVG : '') + '</div>';
    h += '</div>';
  });
  h += '</div>';

  if (pnScrambleSelected.length > 0) {
    h += '<div class="ff"><label class="ff-label">Captain (hits last every shot)</label><select class="ff-input" id="pn-new-team-captain">';
    pnScrambleSelected.forEach(function(pid) {
      var p = PB.getPlayer(pid);
      h += '<option value="' + pid + '">' + escHtml(p ? p.name : pid) + '</option>';
    });
    h += '</select></div>';
  }

  h += '<div class="pn-actions">';
  h += '<button class="btn green" onclick="pnSaveNewTeam()">Save &amp; use this team</button>';
  h += '<button class="pn-ghost" onclick="pnToggleCreateTeam()">Cancel</button>';
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
  // Tee chips ride the same selectable-well recipe as the team rows (one
  // selection language across the whole setup card); full re-render on
  // select keeps the state class honest.
  var h = '<div class="ff"><label class="ff-label">Tee</label><div class="pn-tee-row">';
  course.allTees.forEach(function(tee) {
    var sel = tee.name === currentTee;
    var info = [tee.yards ? tee.yards + " yds" : "", tee.rating && tee.slope ? tee.rating + "/" + tee.slope : ""].filter(Boolean).join(" · ");
    h += '<div class="pn-well pn-tee-chip' + (sel ? ' pn-well--sel' : '') + '"' + PN_KEY_ACTIVATE + ' onclick="pnSelectTee(\'' + courseId.replace(/'/g,"\\'") + '\',\'' + (tee.name||"").replace(/'/g,"\\'") + '\')">';
    h += '<div class="pn-row__title">' + escHtml(tee.name || "") + '</div>';
    if (info) h += '<div class="pn-row__sub">' + escHtml(info) + '</div>';
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

function quickAddCourse(name, _state) {
  // v8.24.34 — branded pbPrompt (was a native prompt()).
  if (_state === undefined) {
    pbPrompt({ title: "Which state?", placeholder: "e.g. VA, PA, NC", confirmLabel: "Add course" })
      .then(function(st) { if (st !== null) quickAddCourse(name, st); });
    return;
  }
  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  
  // v8.24.42 — auto-create: real GolfCourseAPI data first (zero-guessing
  // rule); the guessed-72s stub only when the API has no match.
  Router.toast("Looking up " + name + "...");
  pbAutoCreateCourse(name, state).then(function(apiCourse) {
    if (apiCourse) {
      document.getElementById("pn-course").value = apiCourse.name;
      document.getElementById("pn-rating").value = String(apiCourse.rating || 72);
      document.getElementById("pn-slope").value = String(apiCourse.slope || 113);
      document.getElementById("search-pn-course").innerHTML = "";
      Router.toast("Added " + apiCourse.name + " with real course data");
      return;
    }
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
    document.getElementById("pn-course").value = name;
    document.getElementById("pn-rating").value = "72";
    document.getElementById("pn-slope").value = "113";
    document.getElementById("search-pn-course").innerHTML = "";
    Router.toast("Added " + name + " (provisional pars — update rating/slope when known)");
  });
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
    // BL-001 — deep-copy per-hole data so in-round par/yardage edits stay
    // scoped to this round. PB.getCourse / getCourseByName return live
    // references to the cached course object (data.js); without this clone,
    // editing a hole's par would mutate the shared course master in memory.
    holes: (holes && holes.length) ? holes.map(function(hh) { return Object.assign({}, hh); }) : [],
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
  holeEditOpen = {};

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
