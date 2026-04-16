// ========== LEAGUE CONTEXT ==========
// Returns the current user's active league ID. Falls back to "the-parbaughs" for
// backward compatibility — all pre-migration data has leagueId: "the-parbaughs".
function getActiveLeague() {
  if (currentProfile && currentProfile.activeLeague) return currentProfile.activeLeague;
  return "the-parbaughs";
}

// ========== LEAGUE-SCOPED WRITE HELPER ==========
// Wraps db.collection().add() to automatically include leagueId for league-scoped collections.
var LEAGUE_SCOPED_COLLECTIONS = ['rounds','chat','trips','teetimes','wagers','bounties','scrambleTeams','calendar_events','scheduling_chat','social_actions','invites','syncrounds','liverounds'];

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
  // Don't show syncing bar on load — go silent until confirmed
  db.collection("config").doc("app").get().then(function(doc) {
    if (doc.exists) { setSyncStatus("online"); }
    else { seedFirestore(); }
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
  batch.commit().then(function() { pbLog("[Sync] Seeded"); setSyncStatus("online"); }).catch(function() { setSyncStatus("offline"); });
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
function syncRound(r) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(r)); d.createdAt=fsTimestamp(); d.leagueId=getActiveLeague(); db.collection("rounds").doc(r.id||genId()).set(d,{merge:true}).catch(function(){}); }

// Compute and persist player stats to Firestore member doc after any round change.
// This ensures handicap, XP, level, avg, and best are always current even if rounds fail to load.
function persistPlayerStats(pid) {
  if (!db || !pid) return;
  // Resolve Firestore doc ID — may differ from seed/claimedFrom ID
  var docId = pid;
  if (currentUser && (pid === currentUser.uid || pid === (currentProfile && currentProfile.claimedFrom))) {
    docId = currentUser.uid;
  } else if (typeof fbMemberCache !== "undefined" && fbMemberCache[pid] && fbMemberCache[pid].id) {
    docId = fbMemberCache[pid].id;
  }
  var rounds = PB.getPlayerRounds(pid);
  if (!rounds.length && typeof fbMemberCache !== "undefined") {
    var cached = fbMemberCache[pid];
    if (cached && cached.claimedFrom) rounds = PB.getPlayerRounds(cached.claimedFrom);
  }
  var publicRounds = rounds.filter(function(r){return r.visibility !== "private";});
  var individualPublic = publicRounds.filter(function(r){return r.format !== "scramble" && r.format !== "scramble4";});
  var full18public = individualPublic.filter(function(r){return !r.holesPlayed || r.holesPlayed >= 18;});
  var handicap = PB.calcHandicap(rounds); // calcHandicap internally excludes scramble
  var avg = full18public.length ? Math.round(full18public.reduce(function(a,r){return a+r.score;},0)/full18public.length) : null;
  var best = full18public.length ? Math.min.apply(null, full18public.map(function(r){return r.score;})) : null;
  var xp = PB.getPlayerXP(pid);
  var level = PB.getPlayerLevel(pid);
  var stats = {
    handicap: handicap !== null ? handicap : null,
    avgScore: avg,
    bestRound: best,
    roundCount: rounds.length,
    xp: xp,
    level: level.level,
    updatedAt: fsTimestamp()
  };
  db.collection("members").doc(docId).update(stats).catch(function(){});
  pbLog("[Stats] Persisted stats for", docId, "handicap:", handicap, "xp:", xp);
}
function syncCourse(c) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(c)); d.updatedAt=fsTimestamp(); delete d.photo; db.collection("courses").doc(c.id).set(d,{merge:true}).catch(function(){}); }
function syncTrip(t) { if (!db||syncStatus==="offline") return; var d=JSON.parse(JSON.stringify(t)); d.updatedAt=fsTimestamp(); if(d.photos){delete d.photos;} db.collection("trips").doc(t.id).set(d,{merge:true}).catch(function(){}); }

// Pull trip settings (scorekeeper, finished, miniWinners, bonusWinners) from Firestore on startup
// Trips are hardcoded in seed but settings only live in Firestore
function syncTripsFromFirestore() {
  if (!db) return;
  var localTrips = PB.getTrips();
  if (!localTrips || !localTrips.length) return;
  localTrips.forEach(function(trip) {
    db.collection("trips").doc(trip.id).get().then(function(doc) {
      if (!doc.exists) {
        // First time — push local trip to Firestore
        syncTrip(trip);
        return;
      }
      var remote = doc.data();
      // Pull event closure state from Firestore (authoritative)
      if (remote.status) trip.status = remote.status;
      if (remote.champion) trip.champion = remote.champion;
      if (remote.finalStandings) trip.finalStandings = remote.finalStandings;
      if (remote.closedAt) trip.closedAt = remote.closedAt;
      // Merge remote course settings (scorekeeper, finished) into local trip
      if (remote.courses && Array.isArray(remote.courses)) {
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
      pbLog("[Sync] Trip settings loaded from Firestore:", trip.id);
      PB.save(); // Persist merged state (including closed status)
      // Refresh scorecard if user is on it
      if (Router.getPage() === "scorecard") Router.go("scorecard", Router.getParams(), true);
    }).catch(function(e) { pbWarn("[Sync] Trip load failed:", e.message); });

    // Also pull FIR/GIR data from tripscores collection
    leagueQuery("tripscores").where("tripId", "==", trip.id).get().then(function(snap) {
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.fir && !d.gir) return; // no FIR/GIR data on this doc
        if (!PB.getState().firGir) PB.getState().firGir = {};
        var key = d.tripId + ":" + d.courseKey + ":" + d.playerId;
        PB.getState().firGir[key] = {
          fir: d.fir || Array(18).fill(false),
          gir: d.gir || Array(18).fill(false)
        };
      });
    }).catch(function() {});
  });
}

function syncScrambleTeam(team) {
  if (!db || syncStatus === "offline") return;
  var d = JSON.parse(JSON.stringify(team));
  d.updatedAt = fsTimestamp();
  db.collection("scrambleTeams").doc(team.id).set(d, {merge: true}).catch(function(err) { pbWarn("[Sync] scrambleTeam write failed:", err.message); });
}

// ---- Rounds: Firestore is source of truth ----
var _roundsListener = null;
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
    // Push any local teams that aren't in Firestore yet
    local.forEach(function(t) {
      if (!remoteIds[t.id]) { syncScrambleTeam(t); }
    });
    if (merged > 0) pbLog("[Sync] Merged", merged, "scramble teams from Firestore");
  }).catch(function(err) { pbWarn("[Sync] scrambleTeams read failed:", err.message); });
}

// Trip score sync — pushes individual scores to Firestore for live viewing
function syncTripScore(tripId, courseKey, playerId, scores) {
  if (!db || syncStatus === "offline") return;
  var docId = tripId + "_" + courseKey + "_" + playerId;
  db.collection("tripscores").doc(docId).set({
    tripId: tripId,
    courseKey: courseKey,
    playerId: playerId,
    scores: scores,
    updatedAt: fsTimestamp(),
    updatedBy: currentUser ? currentUser.uid : "local"
  }, { merge: true }).catch(function(e) { pbWarn("[Sync] Trip score failed:", e.message); });
}

// Sync FIR/GIR data to Firestore — stored on the tripscores doc alongside scores
function syncFirGir(tripId, courseKey, playerId) {
  if (!db || syncStatus === "offline") return;
  var fg = PB.getFirGir(tripId, courseKey, playerId);
  var docId = tripId + "_" + courseKey + "_" + playerId;
  db.collection("tripscores").doc(docId).set({
    tripId: tripId,
    courseKey: courseKey,
    playerId: playerId,
    fir: fg.fir,
    gir: fg.gir,
    updatedAt: fsTimestamp()
  }, { merge: true }).catch(function(e) { pbWarn("[Sync] FIR/GIR sync failed:", e.message); });
}

// In-place score input handler — saves score without re-rendering the whole scorecard
// This prevents other input values being wiped on each keystroke
function tripScoreInput(el, tripId, courseKey, playerId, hole, par) {
  var raw = el.value === "" ? "" : Math.max(1, Math.min(15, parseInt(el.value) || 0));
  if (raw !== "" && raw !== el.value) el.value = raw; // clamp display value
  PB.setScore(tripId, courseKey, playerId, hole, raw);

  // Update cell colour class — use scoreClass() for consistency with initial render
  el.className = el.className.replace(/\b(ea|bi|bo|db|eagle|birdie|par|bogey|dbl|blow)\b/g, "").trim();
  var cls = scoreClass(raw, par);
  if (cls) el.classList.add(cls);

  // Update OUT / IN / TOT totals in-place without re-rendering
  var trip = PB.getTrip(tripId);
  if (!trip) return;
  var iS = (courseKey === "scramble" || (trip.courses.find(function(c) { return c.key === courseKey; }) || {}).s);
  var players = iS ? ["team"] : trip.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean).map(function(p) { return p.id; });

  // Find the scorecard table and update totals rows
  var rows = document.querySelectorAll(".pbsc-totals");
  if (rows.length) {
    rows.forEach(function(row) {
      var cells = row.querySelectorAll("td");
      var label = cells[0] ? cells[0].textContent : "";
      players.forEach(function(pid, idx) {
        var cell = cells[2 + idx];
        if (!cell) return;
        if (label === "OUT") cell.textContent = PB.getTripTotal(tripId, courseKey, pid, 0, 9) || "—";
        else if (label === "IN") cell.textContent = PB.getTripTotal(tripId, courseKey, pid, 9, 18) || "—";
        else if (label === "TOT") cell.textContent = PB.getTripTotal(tripId, courseKey, pid, 0, 18) || "—";
      });
    });
    // Also update Stableford points row
    var ptsRows = document.querySelectorAll(".ptsr");
    ptsRows.forEach(function(row) {
      var cells = row.querySelectorAll("td");
      // First cell is "STBL PTS" label (colspan=2), player cells start at index 1
      players.forEach(function(pid, idx) {
        var cell = cells[1 + idx];
        if (!cell) return;
        cell.textContent = PB.getTripStableford(tripId, courseKey, pid);
      });
    });
  } else {
    // Fallback: totals rows not found, do a targeted re-render of just the scorecard section
    var sc = document.getElementById("pbTripScorecard");
    if (sc) {
      var trip2 = PB.getTrip(tripId);
      if (trip2) {
        var players2 = trip2.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);
        sc.innerHTML = renderTripScorecard(trip2, players2);
      }
    }
  }
}


var tripScoreListener = null;
function startTripScoreListener(tripId) {
  if (!db) return;
  if (tripScoreListener) tripScoreListener();
  tripScoreListener = leagueQuery("tripscores").where("tripId","==",tripId).onSnapshot(function(snap) {
    var changed = false;
    snap.forEach(function(doc) {
      var d = doc.data();
      // Update local PB state with remote scores
      if (!PB.getTrip(d.tripId)) return;
      var localScores = PB.getScores(d.tripId, d.courseKey, d.playerId);
      var remoteScores = d.scores || [];
      // Merge — take remote if local is empty for that hole
      for (var i = 0; i < 18; i++) {
        if (remoteScores[i] && remoteScores[i] !== "" && (!localScores[i] || localScores[i] === "")) {
          PB.setScoreSilent(d.tripId, d.courseKey, d.playerId, i, remoteScores[i]);
          changed = true;
        } else if (remoteScores[i] && remoteScores[i] !== localScores[i] && d.updatedBy !== (currentUser ? currentUser.uid : "local")) {
          // Remote is different and from another user — take it
          PB.setScoreSilent(d.tripId, d.courseKey, d.playerId, i, remoteScores[i]);
          changed = true;
        }
      }
    });
    if (changed && Router.getPage() === "scorecard") {
      Router.go("scorecard", Router.getParams());
    }
  });
}

// Event activity announcements
function announceEventStart(tripId, courseName) {
  if (!db) return;
  db.collection("chat").add({
    id: genId(),
    text: "Live scoring started for " + courseName + "! Watch the scorecard update in real-time.",
    authorId: "system",
    authorName: "The Caddy",
    system: true,
    tripId: tripId,
    linkType: "event",
    createdAt: fsTimestamp()
  });
}

function announceEventEnd(tripId, courseName, results) {
  if (!db) return;
  var msg = courseName + " is complete!";
  if (results) msg += " " + results;
  db.collection("chat").add({
    id: genId(),
    text: msg,
    authorId: "system",
    authorName: "The Caddy",
    system: true,
    tripId: tripId,
    linkType: "event",
    createdAt: fsTimestamp()
  });
}

function assignScorekeeper(tripId, courseKey, uid) {
  var trip = PB.getTrip(tripId);
  if (!trip) return;
  var course = trip.courses.find(function(c) { return c.key === courseKey; });
  if (!course) return;
  course.scorekeeper = uid || null;
  PB.save();
  // Sync to Firestore
  if (db) {
    db.collection("trips").doc(tripId).update({ courses: trip.courses }).catch(function(){});
  }
  var skName = uid ? (PB.getPlayer(uid) || {}).name || "Member" : "Anyone";
  Router.toast("Scorekeeper: " + skName);
  Router.go("scorecard", { tripId: tripId });
}

function finishTripRound(tripId, courseKey) {
  var trip = PB.getTrip(tripId);
  if (!trip) return;
  var course = trip.courses.find(function(c) { return c.key === courseKey; });
  if (!course) return;
  
  if (!confirm("End scoring for " + course.n + " and start attestation?")) return;
  
  // Mark course as finished (locks scores for non-Commissioner)
  course.finished = true;
  PB.save();
  if (db) {
    db.collection("trips").doc(tripId).update({ courses: trip.courses }).catch(function(){});
  }
  
  // Create attestation record in Firestore
  if (!db) { Router.toast("Firebase required"); return; }
  
  var tripPlayers = trip.members.map(function(id) { return PB.getPlayer(id); }).filter(Boolean);
  // Only include players who actually have scores on this course
  var playersWithScores = tripPlayers.filter(function(p) {
    if (course.s) return true; // Scramble — all members participated
    var scores = PB.getScores(tripId, courseKey, p.id);
    if (!scores || !scores.length) return false;
    return scores.some(function(s) { return s !== "" && s !== null && s !== undefined; });
  });
  var attestations = {};
  playersWithScores.forEach(function(p) { attestations[p.id] = { name: p.name, attested: false, attestedAt: null }; });
  
  // Build standings for the record
  var standings = [];
  if (!course.s) {
    standings = playersWithScores.map(function(p) {
      var pts = PB.getTripStableford(tripId, courseKey, p.id);
      var total = PB.getTripTotal(tripId, courseKey, p.id, 0, 18);
      return { id: p.id, name: p.name, score: total, pts: pts };
    }).sort(function(a, b) { return b.pts - a.pts; });
  } else {
    var teamTotal = PB.getTripTotal(tripId, courseKey, "team", 0, 18);
    standings = [{ id: "team", name: "Team", score: teamTotal, pts: 0 }];
  }
  
  var docId = tripId + "_" + courseKey;
  db.collection("attestations").doc(docId).set({
    tripId: tripId,
    courseKey: courseKey,
    courseName: course.n,
    status: "pending", // pending, complete, overridden
    standings: standings,
    attestations: attestations,
    createdBy: currentUser ? currentUser.uid : "local",
    createdAt: fsTimestamp()
  }).then(function() {
    // Announce to feed
    db.collection("chat").add({
      id: genId(),
      text: course.n + " scoring is complete. All players must attest their scores.",
      authorId: "system",
      authorName: "The Caddy",
      system: true,
      tripId: tripId,
      linkType: "event",
      createdAt: fsTimestamp()
    });
    Router.toast("Attestation started! Players must confirm their scores.");
    Router.go("scorecard", { tripId: tripId });
  });
}

function unlockTripRound(tripId, courseKey) {
  var trip = PB.getTrip(tripId);
  if (!trip) return;
  var course = trip.courses.find(function(c) { return c.key === courseKey; });
  if (!course) return;
  if (!confirm("Unlock " + course.n + " for score editing? This will reset attestation status.")) return;
  
  course.finished = false;
  PB.save();
  if (db) {
    db.collection("trips").doc(tripId).update({ courses: trip.courses }).catch(function(){});
    // Reset attestation status
    var docId = tripId + "_" + courseKey;
    db.collection("attestations").doc(docId).update({ status: "pending" }).catch(function(){});
  }
  Router.toast(course.n + " unlocked for editing");
  Router.go("scorecard", { tripId: tripId });
}

function attestMyScore(tripId, courseKey) {
  if (!db || !currentUser) { Router.toast("Sign in required"); return; }
  var docId = tripId + "_" + courseKey;
  
  if (!confirm("I attest that the scores on this scorecard are accurate and complete.")) return;
  
  // Find matching attestation key — may be stored under UID, claimedFrom, or seed ID
  var myUid = currentUser.uid;
  var myClaimed = currentProfile ? currentProfile.claimedFrom : null;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : null;
  
  // Read current attestation to find our entry
  db.collection("attestations").doc(docId).get().then(function(doc) {
    if (!doc.exists) { Router.toast("Attestation not found"); return; }
    var attestData = doc.data();
    var attestations = attestData.attestations || {};
    
    // Find which key matches this user
    var matchKey = null;
    if (attestations[myUid]) matchKey = myUid;
    else if (myClaimed && attestations[myClaimed]) matchKey = myClaimed;
    else {
      // Match by name as last resort
      Object.keys(attestations).forEach(function(k) {
        if (attestations[k].name && myName && attestations[k].name.toLowerCase() === myName.toLowerCase()) matchKey = k;
      });
    }
    
    if (!matchKey) {
      // No matching entry — add one under our UID
      matchKey = myUid;
    }
    
    var field = "attestations." + matchKey;
    var update = {};
    update[field + ".attested"] = true;
    update[field + ".attestedAt"] = fsTimestamp();
    if (!attestations[matchKey] || !attestations[matchKey].name) {
      update[field + ".name"] = myName || "Member";
    }
    
    return db.collection("attestations").doc(docId).update(update).then(function() {
      Router.toast("Score attested");
      return db.collection("attestations").doc(docId).get();
    });
  }).then(function(doc) {
    if (!doc || !doc.exists) return;
    var data = doc.data();
    // Check allAttested — deduplicate by name to handle UID/seed ID mismatches
    var seenNames = {};
    var allAttested = true;
    Object.keys(data.attestations).forEach(function(pid) {
      var a = data.attestations[pid];
      if (!a.name) return;
      var nl = a.name.toLowerCase();
      if (seenNames[nl]) { if (a.attested) seenNames[nl].attested = true; return; }
      seenNames[nl] = a;
    });
    Object.values(seenNames).forEach(function(a) { if (!a.attested) allAttested = false; });
    
    if (allAttested) {
      finalizeAttestedRound(docId, data);
    }
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function overrideAttestation(tripId, courseKey) {
  if (!currentProfile || currentProfile.role !== "commissioner") return;
  if (!confirm("Override attestation and post results now? Some players haven't attested yet.")) return;
  
  var docId = tripId + "_" + courseKey;
  db.collection("attestations").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    finalizeAttestedRound(docId, doc.data(), true);
  });
}

function finalizeAttestedRound(docId, data, overridden) {
  // Mark as complete
  db.collection("attestations").doc(docId).update({
    status: overridden ? "overridden" : "complete",
    completedAt: fsTimestamp()
  });
  
  // === CREATE ROUND DOCS for each player ===
  // This is critical — without round docs, nothing counts (XP, achievements, handicap, H2H)
  var trip = PB.getTrip(data.tripId);
  var course = trip ? trip.courses.find(function(c) { return c.key === data.courseKey; }) : null;
  
  if (trip && course) {
    var isScramble = !!course.s;
    var courseName = course.n || data.courseName;
    var courseRating = course.r || 72;
    var courseSlope = course.sl || 113;
    var courseTee = course.tee || "";
    var courseYards = course.y || 0;
    var coursePars = course.p || [];
    // Determine date from trip course day mapping
    var roundDate = localDateStr();
    if (trip.startDate && course.d) {
      // Dynamically compute date from trip start date and course day label
      var sd = new Date(trip.startDate + "T12:00:00");
      var startDow = sd.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
      var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      // Extract the base day name from labels like "Friday AM", "Friday PM"
      var courseDayName = course.d.replace(/ AM| PM/g, "");
      var targetDow = dayNames.indexOf(courseDayName);
      if (targetDow !== -1) {
        var offset = targetDow - startDow;
        if (offset < 0) offset += 7; // wrap around week
        var rd = new Date(sd);
        rd.setDate(rd.getDate() + offset);
        roundDate = rd.toISOString().slice(0, 10);
      }
    }
    
    var membersToLog = trip.members || [];
    var roundsCreated = 0;
    
    if (isScramble) {
      // Scramble: log team score for each participant
      var teamScores = PB.getScores(data.tripId, data.courseKey, "team");
      var teamTotal = 0;
      var holesPlayed = 0;
      teamScores.forEach(function(s) { if (s !== "" && s !== null && s !== undefined) { teamTotal += parseInt(s) || 0; holesPlayed++; } });
      
      if (teamTotal > 0) {
        membersToLog.forEach(function(pid) {
          var p = PB.getPlayer(pid);
          if (!p) return;
          // Check we haven't already logged this round
          var existing = PB.getPlayerRounds(pid).find(function(r) { return r.course === courseName && r.date === roundDate && r.format === "scramble"; });
          if (existing) return;
          var round = PB.addRound({
            player: pid,
            playerName: p.name || p.username,
            course: courseName,
            score: teamTotal,
            date: roundDate,
            rating: courseRating,
            slope: courseSlope,
            tee: courseTee,
            yards: courseYards,
            format: "scramble",
            holesPlayed: holesPlayed,
            holeScores: teamScores,
            holePars: coursePars.length ? coursePars : undefined,
            notes: "Event: " + (trip.name || "Trip") + " (Scramble)",
            visibility: "public"
          });
          syncRound(round);
          roundsCreated++;
        });
      }
    } else {
      // Individual format: log each player's own scores
      membersToLog.forEach(function(pid) {
        var p = PB.getPlayer(pid);
        if (!p) return;
        var scores = PB.getScores(data.tripId, data.courseKey, pid);
        if (!scores || !scores.length) return;
        var total = 0, holesPlayed = 0;
        scores.forEach(function(s) { if (s !== "" && s !== null && s !== undefined) { total += parseInt(s) || 0; holesPlayed++; } });
        if (total === 0 || holesPlayed === 0) return;
        // Check we haven't already logged this round
        var existing = PB.getPlayerRounds(pid).find(function(r) { return r.course === courseName && r.date === roundDate; });
        if (existing) return;
        // Get FIR/GIR data from trip scoring
        var fg = PB.getFirGir(data.tripId, data.courseKey, pid);
        var firArr = fg && fg.fir && fg.fir.some(function(v){return v;}) ? fg.fir : null;
        var girArr = fg && fg.gir && fg.gir.some(function(v){return v;}) ? fg.gir : null;
        var round = PB.addRound({
          player: pid,
          playerName: p.name || p.username,
          course: courseName,
          score: total,
          date: roundDate,
          rating: courseRating,
          slope: courseSlope,
          tee: courseTee,
          yards: courseYards,
          format: course.f || "stableford",
          holesPlayed: holesPlayed,
          holeScores: scores,
          holePars: coursePars.length ? coursePars : undefined,
          firData: firArr || undefined,
          girData: girArr || undefined,
          notes: "Event: " + (trip.name || "Trip"),
          visibility: "public"
        });
        syncRound(round);
        roundsCreated++;
      });
    }
    
    // Award event XP (150 bonus per round) + persist stats
    if (roundsCreated > 0) {
      membersToLog.forEach(function(pid) {
        // Add 150 event XP bonus via member doc
        if (db) {
          db.collection("members").doc(pid).update({
            eventXP: firebase.firestore.FieldValue.increment(150)
          }).catch(function(){});
        }
        setTimeout(function() { persistPlayerStats(pid); }, 1500);
      });
      pbLog("[Event] Created " + roundsCreated + " round docs from finalized trip course");
      // ── ParCoin: award coins for attested event round ──
      membersToLog.forEach(function(pid) {
        awardCoins(pid, PARCOIN_RATES.attest_round, "attest_round", "Attested round at " + (courseName || "event"), "attest_" + data.tripId + "_" + data.courseKey + "_" + pid);
      });
    }
  }

  // Post results to feed
  var results = "";
  if (data.standings && data.standings.length) {
    if (data.standings[0].id === "team") {
      results = "\nTeam score: " + data.standings[0].score;
    } else {
      results = "\n";
      data.standings.forEach(function(s, i) {
        var medal = i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : (i+1) + ".";
        if (s.score > 0) results += medal + " " + s.name + " — " + s.score + (s.pts ? " (" + s.pts + " pts)" : "") + "\n";
      });
    }
  }
  
  var attestNote = overridden ? " (Commissioner override)" : " (All players attested)";
  announceEventEnd(data.tripId, data.courseName, results + attestNote);
  Router.toast("Results posted! " + (overridden ? "Commissioner override." : "All players attested."));
  Router.go("scorecard", { tripId: data.tripId });
}

function renderAttestationStatus(tripId, courseKey) {
  var docId = tripId + "_" + courseKey;
  var h = '<div id="attestStatus_' + courseKey + '"><div class="loading"><div class="spinner"></div>Checking attestation...</div></div>';
  
  // Load attestation status asynchronously
  if (db) {
    setTimeout(function() {
      db.collection("attestations").doc(docId).get().then(function(doc) {
        var el = document.getElementById("attestStatus_" + courseKey);
        if (!el) return;
        
        if (!doc.exists) {
          el.innerHTML = '<div style="font-size:10px;color:var(--muted);text-align:center;padding:8px">Round has not been finalized yet</div>';
          return;
        }
        
        var data = doc.data();
        var ah = '<div class="card" style="margin:0 16px"><div class="card-body">';
        ah += '<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:8px">Score Attestation</div>';
        
        if (data.status === "complete") {
          ah += '<div style="font-size:11px;color:var(--birdie);margin-bottom:8px"> All players attested — scores are official</div>';
        } else if (data.status === "overridden") {
          ah += '<div style="font-size:11px;color:var(--gold);margin-bottom:8px"> Scores finalized (Commissioner override)</div>';
        } else {
          ah += '<div style="font-size:11px;color:var(--muted);margin-bottom:8px"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle"><path d="M4 2h8v3L8 8l4 3v3H4v-3l4-3L4 5z"/></svg> Waiting for all players to attest</div>';
        }
        
        // Show each player's attestation status — deduplicate by name, skip empty
        var attestations = data.attestations || {};
        var allAttested = true;
        var trip = PB.getTrip(tripId);
        var course = trip ? trip.courses.find(function(cx) { return cx.key === courseKey; }) : null;
        var seenNames = {};
        
        Object.keys(attestations).forEach(function(pid) {
          var a = attestations[pid];
          // Skip entries with no name
          if (!a.name || !a.name.trim()) return;
          // Deduplicate by name (same person may appear under UID + seed ID)
          var nameLower = a.name.trim().toLowerCase();
          if (seenNames[nameLower]) {
            // Keep the attested one if either is attested
            if (a.attested) seenNames[nameLower].attested = true;
            return;
          }
          seenNames[nameLower] = a;
          // For non-scramble: skip players without actual scores on this course
          if (trip && course && !course.s) {
            var scores = PB.getScores(tripId, courseKey, pid);
            if (!scores || !scores.some(function(s) { return s !== "" && s !== null && s !== undefined; })) {
              delete seenNames[nameLower];
              return;
            }
          }
          if (!a.attested) allAttested = false;
        });
        
        Object.keys(seenNames).forEach(function(nameLower) {
          var a = seenNames[nameLower];
          var status;
          if (data.status === "overridden" || data.status === "complete") {
            status = a.attested ? '<span style="color:var(--birdie)">Attested</span>' : '<span style="color:var(--muted)">Finalized</span>';
          } else {
            status = a.attested ? '<span style="color:var(--birdie)">Attested</span>' : '<span style="color:var(--red)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle"><path d="M4 2h8v3L8 8l4 3v3H4v-3l4-3L4 5z"/></svg> Pending</span>';
          }
          ah += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">';
          ah += '<span style="font-size:12px">' + escHtml(a.name) + '</span>';
          ah += '<span style="font-size:10px;font-weight:600">' + status + '</span></div>';
        });
        
        // Action buttons
        if (data.status === "pending") {
          var myAttestation = attestations[currentUser ? currentUser.uid : ""];
          // Also check by claimedFrom
          if (!myAttestation && currentProfile && currentProfile.claimedFrom) {
            myAttestation = attestations[currentProfile.claimedFrom];
          }
          
          if (myAttestation && !myAttestation.attested) {
            ah += '<div style="margin-top:10px"><button class="btn full green" onclick="attestMyScore(\'' + tripId + '\',\'' + courseKey + '\')">I Attest These Scores Are Accurate</button></div>';
          } else if (myAttestation && myAttestation.attested) {
            ah += '<div style="margin-top:8px;font-size:10px;color:var(--birdie);text-align:center">You have attested</div>';
          }
          
          // Commissioner override
          if (currentProfile && currentProfile.role === "commissioner" && !allAttested) {
            ah += '<div style="margin-top:8px"><button class="btn-sm outline" style="width:100%;font-size:9px;color:var(--muted)" onclick="overrideAttestation(\'' + tripId + '\',\'' + courseKey + '\')">Commissioner: Override & Finalize</button></div>';
          }
        }
        
        ah += '</div></div>';
        el.innerHTML = ah;
      }).catch(function() {
        var el = document.getElementById("attestStatus_" + courseKey);
        if (el) el.innerHTML = '';
      });
    }, 100);
  }
  
  return h;
}
