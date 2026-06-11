// ========== LEAGUE CONTEXT ==========
// Returns the current user's active league ID. Falls back to "the-parbaughs" for
// backward compatibility — all pre-migration data has leagueId: "the-parbaughs".
function getActiveLeague() {
  if (currentProfile && currentProfile.activeLeague) return currentProfile.activeLeague;
  return "the-parbaughs";
}

// Cache the active league name for display (loaded from leagues collection)
window._activeLeagueName = "Parbaughs";
window._activeLeagueCommissioner = null; // uid of the active league's commissioner
function loadActiveLeagueName() {
  if (!db) return;
  var lid = getActiveLeague();
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (doc.exists) {
      var d = doc.data();
      if (d.name) window._activeLeagueName = d.name;
      window._activeLeagueCommissioner = d.commissioner || null;
      // v8.24.38 — cache membership for league-scoped rosters (members.js).
      window._activeLeagueMemberUids = Array.isArray(d.memberUids) ? d.memberUids : null;
      // v8.24.48 — rounds-in-chat (Founder chose B): missing setting = ON.
      window._activeLeagueRoundsInChat = !(d.settings && d.settings.roundsInChat === false);
    }
  }).catch(function(){});
}

// Synchronous commissioner check for the active league. Relies on the cached
// commissioner uid from loadActiveLeagueName(); callers that render before the
// cache is warm should also confirm async (see ensureActiveLeagueCommissioner).
function isActiveLeagueCommissioner() {
  return !!(typeof currentUser !== "undefined" && currentUser &&
            window._activeLeagueCommissioner &&
            currentUser.uid === window._activeLeagueCommissioner);
}

// Fetch the active league's commissioner uid and invoke cb(isCommissioner).
// Used by surfaces that gate UI on commissioner status and may render before
// loadActiveLeagueName() has populated the cache.
function ensureActiveLeagueCommissioner(cb) {
  if (window._activeLeagueCommissioner !== null) { cb(isActiveLeagueCommissioner()); return; }
  if (!db) { cb(false); return; }
  db.collection("leagues").doc(getActiveLeague()).get().then(function(doc) {
    if (doc.exists) window._activeLeagueCommissioner = doc.data().commissioner || null;
    cb(isActiveLeagueCommissioner());
  }).catch(function(){ cb(false); });
}

// ========== LEAGUE-SCOPED WRITE HELPER ==========
// Wraps db.collection().add() to automatically include leagueId for league-scoped collections.
// MUST stay in sync with LEAGUE_SCOPED in utils.js — single source of truth.
var LEAGUE_SCOPED_COLLECTIONS = LEAGUE_SCOPED;

// Monkey-patch Firestore add() to auto-inject leagueId for league-scoped collections.
// This ensures EVERY write to a league-scoped collection gets the correct leagueId
// without modifying 30+ call sites across the codebase.
var _origFirestoreCollection;
function _patchFirestoreForLeague() {
  if (!db || _origFirestoreCollection) return;
  _origFirestoreCollection = db.collection.bind(db);
  db.collection = function(name) {
    var ref = _origFirestoreCollection(name);
    if (LEAGUE_SCOPED_COLLECTIONS.indexOf(name) !== -1) {
      var origAdd = ref.add.bind(ref);
      ref.add = function(data) {
        if (data && typeof data === 'object' && !data.leagueId) {
          data.leagueId = getActiveLeague();
        }
        return origAdd(data);
      };
    }
    return ref;
  };
}

// ========== SYNC STATUS ==========
var syncStatus = "connecting";
function setSyncStatus(s) {
  syncStatus = s;
  var txt = document.getElementById("syncStatusText");
  var dot = document.getElementById("connDot");
  if (txt) txt.textContent = s === "online" ? "Live" : s === "syncing" ? "Syncing..." : s === "offline" ? "Offline" : "Connecting...";
  if (dot) {
    dot.style.background = s === "online" ? "var(--live)" : s === "syncing" ? "var(--gold)" : s === "offline" ? "var(--alert)" : "var(--muted)";
    if (s === "syncing") dot.style.animation = "pulse-dot 1s infinite";
    else dot.style.animation = "none";
  }
}

function initSync() {
  if (!db) { setSyncStatus("offline"); return; }
  // Don't show syncing bar on load — go silent until confirmed.
  // A RESOLVED read means Firestore is reachable, so we are online regardless
  // of whether the bootstrap doc exists yet. Seeding (when the doc is missing)
  // is best-effort and must never downgrade a confirmed-online connection: a
  // read-only member legitimately can't write the seed but is still online.
  // Previously the missing-doc branch fell through to seedFirestore() whose
  // rules-denied write flipped the footer to "Offline" on a live connection.
  db.collection("config").doc("app").get().then(function(doc) {
    setSyncStatus("online");
    if (!doc.exists) { seedFirestore(); }
  }).catch(function() { setSyncStatus("offline"); });
}

function seedFirestore() {
  if (!db) return;
  var batch = db.batch();
  batch.set(db.collection("config").doc("app"), { version:"5.0", foundingFour:["zach","kayvan","kiyan","nick"], createdAt:fsTimestamp() });
  PB.getPlayers().forEach(function(p) {
    var doc = JSON.parse(JSON.stringify(p)); doc.createdAt = fsTimestamp();
    if (doc.photo && doc.photo.length > 500) { doc.photoLocal = true; delete doc.photo; }
    batch.set(db.collection("members").doc(p.id), doc);
  });
  PB.getCourses().forEach(function(c) { batch.set(db.collection("courses").doc(c.id), Object.assign({}, c, { createdAt:fsTimestamp() })); });
  PB.getTrips().forEach(function(t) {
    var doc = JSON.parse(JSON.stringify(t)); doc.createdAt = fsTimestamp();
    batch.set(db.collection("trips").doc(t.id), doc);
  });
  // Seed is best-effort. Connectivity was already confirmed by the resolving
  // read in initSync(), so a write failure here (e.g. Firestore rules denying
  // a non-privileged member the bulk seed) must NOT report the app offline.
  batch.commit().then(function() { pbLog("[Sync] Seeded"); setSyncStatus("online"); }).catch(function(e) { pbLog("[Sync] Seed skipped:", e && e.message); });
}

// Dual-write helpers — text data only, photos go to photos collection
function syncCoursesFromFirestore() {
  if (!db) return;
  db.collection("courses").get().then(function(snap) {
    var fsCourses = [];
    snap.forEach(function(doc) {
      var c = doc.data();
      if (c && c.name) fsCourses.push(c);
    });
    if (fsCourses.length > 0) {
      PB.setCoursesFromFirestore(fsCourses);
      pbLog("[Sync] Loaded", fsCourses.length, "courses from Firestore");
    }
    // Also load reviews from dedicated collection and merge into courses
    db.collection("course_reviews").orderBy("createdAt","asc").get().then(function(rsnap) {
      var reviewsByCourse = {};
      rsnap.forEach(function(rdoc) {
        var rv = rdoc.data();
        if (!rv.courseId) return;
        if (!reviewsByCourse[rv.courseId]) reviewsByCourse[rv.courseId] = [];
        reviewsByCourse[rv.courseId].push({ rating: rv.rating, text: rv.text, by: rv.by, date: rv.date || "" });
      });
      Object.keys(reviewsByCourse).forEach(function(cid) {
        var course = PB.getCourse(cid);
        if (course) {
          course.reviews = reviewsByCourse[cid];
        }
      });
      if (Object.keys(reviewsByCourse).length) pbLog("[Sync] Loaded reviews for", Object.keys(reviewsByCourse).length, "courses");
    }).catch(function(e) { pbWarn("[Sync] Review sync failed:", e.message); });
  }).catch(function(err) { pbWarn("[Sync] Course sync failed:", err.message); });
}

function syncMember(m) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(m)); d.updatedAt=fsTimestamp(); delete d.photo; db.collection("members").doc(m.id).set(d,{merge:true}).catch(function(){}); }
// v8.24.49 — multi-league dual-write window (founder-approved 2026-06-11):
// every round carries BOTH the legacy scalar leagueId and the new
// leagueIds[] array. Readers migrate per-surface later; the scalar retires
// only in post-cutover cleanup. A round already carrying leagueIds (future
// multi-publish UI) keeps its own list.
function syncRound(r) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(r)); d.createdAt=fsTimestamp(); d.leagueId=getActiveLeague(); if (!Array.isArray(d.leagueIds) || !d.leagueIds.length) d.leagueIds = [d.leagueId]; db.collection("rounds").doc(r.id||genId()).set(d,{merge:true}).catch(function(){}); }

// Compute and persist player stats to Firestore member doc after any round change.
// IMPORTANT: Stats are GLOBAL — calculated from ALL rounds across ALL leagues.
// Uses db.collection("rounds") directly, NOT leagueQuery("rounds").
function persistPlayerStats(pid) {
  if (!db || !pid) return;
  // Resolve Firestore doc ID — may differ from seed/claimedFrom ID
  var docId = pid;
  if (currentUser && (pid === currentUser.uid || pid === (currentProfile && currentProfile.claimedFrom))) {
    docId = currentUser.uid;
  } else if (typeof fbMemberCache !== "undefined" && fbMemberCache[pid] && fbMemberCache[pid].id) {
    docId = fbMemberCache[pid].id;
  }
  // Fetch ALL rounds for this player across ALL leagues (global stats)
  var allIds = PB.getAllPlayerIds(pid);
  var queries = allIds.map(function(id) {
    return db.collection("rounds").where("player", "==", id).get();
  });
  Promise.all(queries).then(function(snaps) {
    var rounds = [];
    snaps.forEach(function(snap) {
      snap.forEach(function(doc) { var d = doc.data(); if (d && d.id) rounds.push(d); });
    });
    var publicRounds = rounds.filter(function(r){return r.visibility !== "private";});
    var individualPublic = publicRounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
    var full18public = individualPublic.filter(function(r){return !r.holesPlayed || r.holesPlayed >= 18;});
    var handicap = calculateHandicapIndex(rounds);
    var avg = full18public.length ? Math.round(full18public.reduce(function(a,r){return a+r.score;},0)/full18public.length) : null;
    var best = full18public.length ? Math.min.apply(null, full18public.map(function(r){return r.score;})) : null;
    // XP and level: use the FULL getPlayerXP formula with global rounds.
    // Temporarily swap state.rounds so getPlayerXP reads all rounds, then restore.
    var savedRounds = PB.getRounds();
    PB.setRoundsFromFirestore(rounds);
    var xp = PB.getPlayerXP(pid);
    var level = PB.getPlayerLevel(pid);
    PB.setRoundsFromFirestore(savedRounds);
    var stats = {
      computedHandicap: handicap !== null ? handicap : null,
      avgScore: avg,
      bestRound: best,
      totalRounds: rounds.length,
      xp: xp,
      level: level.level,
      updatedAt: fsTimestamp()
    };
    // v7.9 — skip the write if computed values match what's already persisted.
    // Prevents a cosmetic re-render cascade on session-start calls when nothing changed.
    var existing = (typeof currentProfile !== "undefined" && currentProfile && pid === (currentUser && currentUser.uid))
      ? currentProfile
      : (typeof fbMemberCache !== "undefined" && fbMemberCache[pid]) || null;
    if (existing
        && existing.xp === stats.xp
        && existing.level === stats.level
        && existing.totalRounds === stats.totalRounds
        && existing.avgScore === stats.avgScore
        && existing.bestRound === stats.bestRound
        && existing.computedHandicap === stats.computedHandicap) {
      pbLog("[Stats] Skip persist for", docId, "— values unchanged (xp:", xp, "rounds:", rounds.length + ")");
      return;
    }
    db.collection("members").doc(docId).update(stats).catch(function(){});
    pbLog("[Stats] Persisted GLOBAL stats for", docId, "handicap:", handicap, "xp:", xp, "rounds:", rounds.length);
  }).catch(function(e) { pbWarn("[Stats] persistPlayerStats failed:", e.message); });
}
function syncCourse(c) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(c)); d.updatedAt=fsTimestamp(); delete d.photo; db.collection("courses").doc(c.id).set(d,{merge:true}).catch(function(){}); }
function syncTrip(t) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(t)); d.updatedAt=fsTimestamp(); if(d.photos){delete d.photos;} leagueDoc("trips",d); db.collection("trips").doc(t.id).set(d,{merge:true}).catch(function(){}); }

// Pull trips from Firestore — league-scoped query so only current league's trips show.
function syncTripsFromFirestore() {
  if (!db) return;
  leagueQuery("trips").get().then(function(snap) {
    snap.forEach(function(doc) {
      var remote = doc.data();
      if (!remote || !remote.id) return;
      var trip = PB.getTrip(remote.id);
      if (!trip) {
        // Trip exists in Firestore but not locally — add it
        PB.addTripFromFirestore(remote);
        trip = PB.getTrip(remote.id);
        if (!trip) return;
      }
      // Pull event closure state from Firestore (authoritative)
      if (remote.status) trip.status = remote.status;
      if (remote.champion) trip.champion = remote.champion;
      if (remote.finalStandings) trip.finalStandings = remote.finalStandings;
      if (remote.closedAt) trip.closedAt = remote.closedAt;
      // Merge remote course settings (scorekeeper, finished) into local trip
      if (remote.courses && Array.isArray(remote.courses) && trip.courses) {
        remote.courses.forEach(function(rc) {
          var lc = trip.courses.find(function(c) { return c.key === rc.key; });
          if (lc) {
            if (rc.scorekeeper !== undefined) lc.scorekeeper = rc.scorekeeper;
            if (rc.finished !== undefined) lc.finished = rc.finished;
          }
        });
      }
      // Pull miniWinners and bonusWinners from Firestore
      if (remote.miniWinners) {
        Object.keys(remote.miniWinners).forEach(function(k) {
          PB.setMiniWinnerSilent(k, remote.miniWinners[k]);
        });
      }
      if (remote.bonusWinners) {
        Object.keys(remote.bonusWinners).forEach(function(k) {
          PB.setBonusWinnerSilent(k, remote.bonusWinners[k]);
        });
      }
      pbLog("[Sync] Trip loaded from Firestore:", trip.id);
    });
    PB.save();
    if (Router.getPage() === "scorecard") Router.go("scorecard", Router.getParams(), true);
  }).catch(function(e) {
    // v8.24.31 — a read denied because the user signed out mid-flight is
    // expected, not actionable; only log while a user is actually signed in.
    if (typeof currentUser !== "undefined" && currentUser) pbWarn("[Sync] Trip sync failed:", e.message);
  });

  // Also pull FIR/GIR data from tripscores collection
  leagueQuery("tripscores").get().then(function(snap) {
    snap.forEach(function(doc) {
      var d = doc.data();
      if (!d.fir && !d.gir) return;
      if (!PB.getState().firGir) PB.getState().firGir = {};
      var key = d.tripId + ":" + d.courseKey + ":" + d.playerId;
      PB.getState().firGir[key] = {
        fir: d.fir || Array(18).fill(false),
        gir: d.gir || Array(18).fill(false)
      };
    });
  }).catch(function() {});
}

function syncScrambleTeam(team) {
  if (!db || syncStatus === "offline") return;
  var d = JSON.parse(JSON.stringify(team));
  d.updatedAt = fsTimestamp();
  // v8 rules require leagueId on scrambleTeams writes. leagueDoc() mutates
  // d in place to add the active league id. v8.24.35 — a team that already
  // carries a leagueId keeps it: restamping with the CURRENTLY active league
  // would silently move a team between leagues on re-push.
  var teamLeague = d.leagueId;
  leagueDoc("scrambleTeams", d);
  if (teamLeague) d.leagueId = teamLeague;
  db.collection("scrambleTeams").doc(team.id).set(d, {merge: true}).catch(function(err) { pbWarn("[Sync] scrambleTeam write failed:", err.message); });
}

// ---- Rounds: Firestore is source of truth ----
var _roundsListener = null;
// v8.24.31 — sign-out cleanup. After auth.signOut() the server revokes every
// league-scoped snapshot listener; any left attached fires its error callback
// with permission-denied (the v8.24.30 prod spam at 19:27-20:01Z, userId null,
// pages home/playnow, was exactly this). Detach everything we own here; the
// auth handler's sign-out branch calls it.
function stopLeagueDataSync() {
  if (_roundsListener) { _roundsListener(); _roundsListener = null; }
  if (typeof window !== "undefined") {
    if (window._teeTimeUnsub) { window._teeTimeUnsub(); window._teeTimeUnsub = null; }
    if (window._rangeUnsub) { window._rangeUnsub(); window._rangeUnsub = null; }
    if (window._memberProfileUnsub) { window._memberProfileUnsub(); window._memberProfileUnsub = null; }
  }
}
if (typeof window !== "undefined") window.stopLeagueDataSync = stopLeagueDataSync;
function loadRoundsFromFirestore() {
  if (!db) return;
  leagueQuery("rounds").orderBy("date", "desc").limit(500).get().then(function(snap) {
    var fsRounds = [];
    snap.forEach(function(doc) { var d = doc.data(); if (d && d.id) fsRounds.push(d); });
    if (fsRounds.length > 0) {
      PB.setRoundsFromFirestore(fsRounds);
      pbLog("[Sync] Loaded", fsRounds.length, "rounds for league", _league);
    }
  }).catch(function(err) { pbWarn("[Sync] rounds load failed:", err.message); });
}

function startRoundsListener() {
  if (!db) return;
  if (_roundsListener) _roundsListener();
  _roundsListener = leagueQuery("rounds").orderBy("date", "desc").limit(500).onSnapshot(function(snap) {
    var fsRounds = [];
    snap.forEach(function(doc) { var d = doc.data(); if (d && d.id) fsRounds.push(d); });
    if (fsRounds.length > 0) {
      PB.setRoundsFromFirestore(fsRounds);
      if (window._suppressRoundsRerender) return; // Skip re-render for like/comment updates
      var pg = Router.getPage();
      if (pg === "rounds" || pg === "records" || pg === "activity" || pg === "standings" || pg === "home") {
        Router.go(pg, Router.getParams(), true);
      }
    }
  }, function(err) { pbWarn("[RoundsListener]", err.message); });
}

// ---- Club records / Ace Wall (records/global) ----
// v8.24.79 — records + the Ace Wall write to records/global but were NEVER
// read back (no hydrate path + the rule was missing), so they were device-
// local and lost on reload. This listener hydrates state.records from
// Firestore + re-renders the records/aces/trophyroom surfaces on change.
var _recordsListener = null;
function startRecordsListener() {
  if (!db) return;
  if (_recordsListener) _recordsListener();
  _recordsListener = db.collection("records").doc("global").onSnapshot(function(doc) {
    if (!doc.exists) return;
    var d = doc.data() || {};
    PB.setRecordsFromFirestore(d);
    var pg = Router.getPage();
    if (pg === "records" || pg === "aces" || pg === "trophyroom" || pg === "home") {
      Router.go(pg, Router.getParams(), true);
    }
  }, function(err) { pbWarn("[RecordsListener]", err.message); });
}

// ---- Custom drills: Firestore only ----
function loadCustomDrillsFromFirestore() {
  if (!db) return;
  db.collection("config").doc("customDrills").get().then(function(doc) {
    if (doc.exists && doc.data().drills && doc.data().drills.length) {
      customDrills = doc.data().drills;
    }
  }).catch(function() {});
}

function saveCustomDrillsToFirestore() {
  if (!db) return;
  db.collection("config").doc("customDrills").set({drills: customDrills}).catch(function() {});
}

function syncScrambleTeamsFromFirestore() {
  if (!db) return;
  leagueQuery("scrambleTeams").get().then(function(snap) {
    var local = PB.getScrambleTeams();
    var remoteIds = {};
    var merged = 0;
    snap.forEach(function(doc) {
      var t = doc.data();
      remoteIds[t.id] = true;
      if (!t.id || !t.name) return;
      var existing = local.find(function(lt) { return lt.id === t.id; });
      if (!existing) {
        PB.addScrambleTeamFromFirestore(t); merged++;
      } else if (existing.name !== t.name) {
        // Firestore is authoritative for name — overwrite local
        existing.name = t.name;
        merged++;
      }
    });
    // Push any local teams that aren't in Firestore yet.
    // v8.24.35 — only teams THIS member belongs to. Rosters hold legacy
    // profile ids on pre-v8 teams and auth uids on new ones, so check both
    // id spaces plus captain. The old unconditional push re-sent teams the
    // booting user isn't on (rules deny those writes by design).
    var myPid = (typeof currentProfile !== "undefined" && currentProfile) ? (currentProfile.claimedFrom || currentProfile.id) : null;
    var myUid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
    local.forEach(function(t) {
      if (remoteIds[t.id]) return;
      var roster = t.members || [];
      var mine = (myPid && (roster.indexOf(myPid) !== -1 || t.captain === myPid))
              || (myUid && (roster.indexOf(myUid) !== -1 || t.captain === myUid));
      if (mine) syncScrambleTeam(t);
    });
    if (merged > 0) pbLog("[Sync] Merged", merged, "scramble teams from Firestore");
  }).catch(function(err) {
    if (typeof currentUser !== "undefined" && currentUser) pbWarn("[Sync] scrambleTeams read failed:", err.message);
  });
}

// Trip score sync — pushes individual scores to Firestore for live viewing.
// leagueId denormalized onto the doc per DESIGN NEEDED 3.3.2 so v8 rules can
// authorize without a chained get to the parent trip.
// Uses the "player" field name to match the v8 tripscores create rule
// (player == uid() branch lets the player write their own score without
// requiring leadership authority).
// Extracted to src/core/sync-attestation.js per W1.A5. Originally lines 340-927 of this file.
