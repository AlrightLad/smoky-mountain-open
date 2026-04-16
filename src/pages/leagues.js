/* ================================================
   PAGE: LEAGUES — Create, join, switch, manage leagues
   v6.0.0: Multi-league architecture
   ================================================ */

Router.register("leagues", function(params) {
  if (params && params.create) { renderCreateLeague(); return; }
  if (params && params.join) { renderJoinLeague(); return; }
  if (params && params.id) { renderLeagueDetail(params.id); return; }
  renderLeagueList();
});

function renderLeagueList() {
  var h = '<div class="sh"><h2>My Leagues</h2><button class="back" onclick="Router.back(\'more\')">← Back</button></div>';
  var myLeagues = currentProfile && currentProfile.leagues ? currentProfile.leagues : ["the-parbaughs"];
  var activeLeague = getActiveLeague();

  h += '<div style="padding:12px 16px">';

  if (!myLeagues.length) {
    h += '<div style="text-align:center;padding:32px 0"><div style="font-size:16px;font-weight:700;color:var(--cream)">No Leagues Yet</div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-top:6px">Create your own league or join one via invite code.</div></div>';
  }

  h += '<div id="leagueCards"><div class="loading"><div class="spinner"></div>Loading leagues...</div></div>';

  h += '<div style="display:flex;gap:8px;margin-top:16px">';
  h += '<button class="btn full green" style="flex:1" onclick="Router.go(\'leagues\',{create:true})">+ Create a League</button>';
  h += '<button class="btn full outline" style="flex:1" onclick="Router.go(\'leagues\',{join:true})">Join a League</button>';
  h += '</div>';

  // Browse public leagues
  h += '<div style="margin-top:20px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:8px">Discover Leagues</div>';
  h += '<div id="publicLeagues"><div style="font-size:11px;color:var(--muted);padding:12px 0">Loading public leagues...</div></div>';
  h += '</div>';

  h += '</div>';
  h += renderPageFooter();
  document.querySelector('[data-page="leagues"]').innerHTML = h;

  // Load my league details
  if (db && myLeagues.length) {
    var cardsH = '';
    var loaded = 0;
    myLeagues.forEach(function(lid) {
      db.collection("leagues").doc(lid).get().then(function(doc) {
        loaded++;
        if (doc.exists) {
          var l = doc.data();
          var isActive = lid === activeLeague;
          var isFounding = l.badge === "founding";
          cardsH += '<div class="card" style="margin-bottom:8px;border-color:' + (isActive ? 'var(--gold)' : 'var(--border)') + ';cursor:pointer" onclick="Router.go(\'leagues\',{id:\'' + lid + '\'})">';
          cardsH += '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">';
          cardsH += '<div><div style="display:flex;align-items:center;gap:8px">';
          cardsH += '<div style="font-size:15px;font-weight:700;color:var(--cream)">' + escHtml(l.name) + '</div>';
          if (isFounding) cardsH += '<span style="font-size:7px;font-weight:800;color:var(--gold);background:rgba(var(--gold-rgb),.1);padding:2px 6px;border-radius:4px;letter-spacing:.5px">FOUNDING LEAGUE</span>';
          cardsH += '</div>';
          cardsH += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + escHtml(l.location || '') + ' \u00b7 ' + (l.memberCount || 0) + ' members</div>';
          cardsH += '</div>';
          if (isActive) cardsH += '<div style="font-size:8px;font-weight:700;color:var(--birdie);letter-spacing:.5px;padding:4px 8px;background:rgba(var(--birdie-rgb),.08);border-radius:4px">ACTIVE</div>';
          else cardsH += '<button class="btn-sm outline" style="font-size:9px" onclick="event.stopPropagation();switchLeague(\'' + lid + '\')">Switch</button>';
          cardsH += '</div></div>';
        }
        if (loaded === myLeagues.length) {
          var el = document.getElementById("leagueCards");
          if (el) el.innerHTML = cardsH || '<div style="font-size:11px;color:var(--muted)">No league data found</div>';
        }
      }).catch(function() { loaded++; });
    });
  }

  // Load public leagues
  if (db) {
    db.collection("leagues").where("visibility", "==", "public").limit(10).get().then(function(snap) {
      var el = document.getElementById("publicLeagues");
      if (!el) return;
      if (snap.empty) { el.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:8px 0">No public leagues yet. Be the first to create one!</div>'; return; }
      var ph = '';
      snap.forEach(function(doc) {
        var l = doc.data();
        var lid = doc.id;
        var alreadyMember = myLeagues.indexOf(lid) !== -1;
        ph += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
        ph += '<div><div style="font-size:13px;font-weight:600;color:var(--cream)">' + escHtml(l.name) + '</div>';
        ph += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(l.location || '') + ' \u00b7 ' + (l.memberCount || 0) + ' members</div></div>';
        if (alreadyMember) ph += '<span style="font-size:9px;color:var(--muted)">Joined</span>';
        else ph += '<button class="btn-sm green" style="font-size:9px" onclick="requestJoinLeague(\'' + lid + '\')">Request</button>';
        ph += '</div></div>';
      });
      el.innerHTML = ph;
    }).catch(function() {});
  }
}

function renderCreateLeague() {
  var h = '<div class="sh"><h2>Create a League</h2><button class="back" onclick="Router.back(\'leagues\')">← Back</button></div>';
  h += '<div class="form-section" style="padding:16px">';
  h += '<div class="ff"><label class="ff-label">League name</label><input class="ff-input" id="cl-name" placeholder="e.g. Weekend Warriors"></div>';
  h += '<div class="ff"><label class="ff-label">Location</label><input class="ff-input" id="cl-location" placeholder="e.g. Austin, TX"></div>';
  h += '<div class="ff"><label class="ff-label">Description</label><textarea class="ff-input" id="cl-desc" rows="2" placeholder="What makes your crew special?"></textarea></div>';
  h += '<div class="ff"><label class="ff-label">Visibility</label><select class="ff-input" id="cl-visibility">';
  h += '<option value="private">Private (invite-only)</option>';
  h += '<option value="public">Public (discoverable)</option>';
  h += '</select></div>';
  h += '<button class="btn full green" style="margin-top:12px" onclick="submitCreateLeague()">Create League</button>';
  h += '<div style="font-size:9px;color:var(--muted2);text-align:center;margin-top:8px">You\'ll be the commissioner of this league.</div>';
  h += '</div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;
}

function submitCreateLeague() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var name = (document.getElementById("cl-name") || {}).value || "";
  var location = (document.getElementById("cl-location") || {}).value || "";
  var desc = (document.getElementById("cl-desc") || {}).value || "";
  var visibility = (document.getElementById("cl-visibility") || {}).value || "private";
  if (!name.trim() || name.trim().length < 3) { Router.toast("League name must be 3+ characters"); return; }

  var slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  var inviteCode = "LG-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  var uid = currentUser.uid;

  var leagueData = {
    name: name.trim(),
    slug: slug,
    location: location.trim(),
    description: desc.trim(),
    founded: localDateStr(),
    badge: "",
    tier: "crew",
    visibility: visibility,
    commissioner: uid,
    admins: [uid],
    memberCount: 1,
    memberUids: [uid],
    inviteCode: inviteCode,
    theme: "classic",
    createdAt: fsTimestamp(),
    settings: { seasons: true, parcoins: true, wagers: true, bounties: true, trashTalk: true }
  };

  db.collection("leagues").doc(slug).set(leagueData).then(function() {
    // Add league to member's leagues array
    db.collection("members").doc(uid).update({
      leagues: firebase.firestore.FieldValue.arrayUnion(slug),
      activeLeague: slug
    }).then(function() {
      if (currentProfile) {
        if (!currentProfile.leagues) currentProfile.leagues = [];
        currentProfile.leagues.push(slug);
        currentProfile.activeLeague = slug;
      }
      Router.toast("League created! Invite code: " + inviteCode);
      Router.go("leagues", { id: slug });
    });
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function renderJoinLeague() {
  var h = '<div class="sh"><h2>Join a League</h2><button class="back" onclick="Router.back(\'leagues\')">← Back</button></div>';
  h += '<div style="padding:16px">';
  h += '<div class="ff"><label class="ff-label">Invite code</label><input class="ff-input" id="jl-code" placeholder="e.g. LG-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px;text-align:center;font-family:\'SF Mono\',monospace"></div>';
  h += '<button class="btn full green" style="margin-top:12px" onclick="submitJoinLeague()">Join League</button>';
  h += '<div style="font-size:10px;color:var(--muted);text-align:center;margin-top:12px">Ask the league commissioner for an invite code, or browse public leagues.</div>';
  h += '</div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;
}

function submitJoinLeague() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var code = (document.getElementById("jl-code") || {}).value.trim().toUpperCase();
  if (!code) { Router.toast("Enter an invite code"); return; }

  // Find league by invite code
  db.collection("leagues").where("inviteCode", "==", code).limit(1).get().then(function(snap) {
    if (snap.empty) { Router.toast("Invalid invite code"); return; }
    var doc = snap.docs[0];
    var league = doc.data();
    var lid = doc.id;
    var uid = currentUser.uid;

    // Check if already a member
    if (league.memberUids && league.memberUids.indexOf(uid) !== -1) {
      Router.toast("You're already in " + league.name);
      Router.go("leagues");
      return;
    }

    // Join the league
    db.collection("leagues").doc(lid).update({
      memberUids: firebase.firestore.FieldValue.arrayUnion(uid),
      memberCount: firebase.firestore.FieldValue.increment(1)
    });
    db.collection("members").doc(uid).update({
      leagues: firebase.firestore.FieldValue.arrayUnion(lid),
      activeLeague: lid
    });
    if (currentProfile) {
      if (!currentProfile.leagues) currentProfile.leagues = [];
      currentProfile.leagues.push(lid);
      currentProfile.activeLeague = lid;
    }
    Router.toast("Joined " + league.name + "!");
    Router.go("leagues");
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function renderLeagueDetail(lid) {
  var h = '<div class="sh"><h2>League</h2><button class="back" onclick="Router.back(\'leagues\')">← Back</button></div>';
  h += '<div id="leagueDetail"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;

  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) { Router.toast("League not found"); Router.go("leagues"); return; }
    var l = doc.data();
    var el = document.getElementById("leagueDetail");
    if (!el) return;
    var isComm = currentUser && l.commissioner === currentUser.uid;
    var isFounding = l.badge === "founding";

    var dh = '<div style="text-align:center;padding:24px 16px;background:linear-gradient(180deg,var(--grad-hero),var(--bg));border-bottom:1px solid var(--border)">';
    dh += '<div style="font-family:Playfair Display,serif;font-size:24px;color:var(--gold);font-weight:700">' + escHtml(l.name) + '</div>';
    if (isFounding) dh += '<div style="display:inline-block;margin-top:8px;padding:4px 12px;background:linear-gradient(135deg,rgba(var(--gold-rgb),.12),rgba(var(--gold-rgb),.04));border:1px solid rgba(var(--gold-rgb),.2);border-radius:8px;font-size:9px;font-weight:800;color:var(--gold);letter-spacing:1px">FOUNDING LEAGUE \u00b7 EST. 2026</div>';
    dh += '<div style="font-size:11px;color:var(--muted);margin-top:6px">' + escHtml(l.location || '') + ' \u00b7 ' + (l.memberCount || 0) + ' members \u00b7 ' + (l.visibility === "public" ? "Public" : "Private") + '</div>';
    if (l.description) dh += '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5">' + escHtml(l.description) + '</div>';
    dh += '</div>';

    // Invite code (for commissioner or members)
    dh += '<div class="section"><div class="sec-head"><span class="sec-title">Invite Code</span></div>';
    dh += '<div class="card"><div style="padding:16px;text-align:center"><div style="font-family:\'SF Mono\',monospace;font-size:20px;font-weight:700;color:var(--gold);letter-spacing:4px">' + escHtml(l.inviteCode || "N/A") + '</div>';
    dh += '<div style="font-size:10px;color:var(--muted);margin-top:6px">Share this code with friends to invite them</div></div></div></div>';

    var isAdmin = currentUser && l.admins && l.admins.indexOf(currentUser.uid) !== -1;

    // Commissioner/Admin settings
    if (isComm || isAdmin) {
      // Member management
      dh += '<div class="section"><div class="sec-head"><span class="sec-title">Members (' + (l.memberCount || 0) + ')</span></div>';
      dh += '<div id="leagueMemberList"><div class="loading"><div class="spinner"></div></div></div></div>';

      // Pending join requests
      dh += '<div class="section"><div class="sec-head"><span class="sec-title">Join Requests</span></div>';
      dh += '<div id="leagueJoinRequests"><div style="font-size:11px;color:var(--muted);padding:12px">Loading...</div></div></div>';

      // League settings (commissioner only)
      if (isComm) {
        dh += '<div class="section"><div class="sec-head"><span class="sec-title">League Settings</span></div>';
        dh += '<div class="card"><div style="padding:14px 16px">';
        dh += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:var(--cream)">Visibility</span>';
        dh += '<button class="btn-sm outline" style="font-size:10px" onclick="toggleLeagueVisibility(\'' + lid + '\')">' + (l.visibility === "public" ? "Public" : "Private") + '</button></div>';
        dh += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:var(--cream)">Require approval</span>';
        dh += '<button class="btn-sm outline" style="font-size:10px" onclick="toggleLeagueApproval(\'' + lid + '\')">' + (l.requireApproval ? "On" : "Off") + '</button></div>';
        dh += '<button class="btn-sm outline" style="font-size:10px;margin-bottom:8px" onclick="regenerateInviteCode(\'' + lid + '\')">Regenerate Invite Code</button>';
        dh += '</div></div></div>';

        // Danger zone
        if (!isFounding) {
          dh += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--red)">Danger Zone</span></div>';
          dh += '<div class="card" style="border-color:rgba(var(--red-rgb),.2)"><div style="padding:14px 16px">';
          dh += '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Deleting a league removes it from all members. Rounds are preserved.</div>';
          dh += '<button class="btn full" style="background:rgba(var(--red-rgb),.08);border:1px solid rgba(var(--red-rgb),.2);color:var(--red);font-size:11px" onclick="confirmDeleteLeague(\'' + lid + '\',\'' + escHtml(l.name).replace(/'/g,"\\\\'") + '\')">Delete League</button>';
          dh += '</div></div></div>';
        }
      }
    }

    // Switch to this league
    var isActive = currentProfile && currentProfile.activeLeague === lid;
    if (!isActive) {
      dh += '<div style="padding:16px"><button class="btn full green" onclick="switchLeague(\'' + lid + '\')">Switch to ' + escHtml(l.name) + '</button></div>';
    }

    el.innerHTML = dh;

    // Async load members
    if (isComm || isAdmin) {
      _loadLeagueMembers(lid, l);
      _loadJoinRequests(lid);
    }
  }).catch(function(e) { Router.toast("Error: " + e.message); });
}

function switchLeague(lid) {
  if (!currentUser || !db) return;
  db.collection("members").doc(currentUser.uid).update({ activeLeague: lid }).then(function() {
    if (currentProfile) currentProfile.activeLeague = lid;
    Router.toast("Switching to " + lid + "...");
    // Tear down ALL league-scoped listeners
    if (window._chatFeedUnsub) { window._chatFeedUnsub(); window._chatFeedUnsub = null; }
    if (window._teeTimeUnsub) { window._teeTimeUnsub(); window._teeTimeUnsub = null; }
    if (window._rangeUnsub) { window._rangeUnsub(); window._rangeUnsub = null; }
    if (typeof _roundsListener !== "undefined" && _roundsListener) { _roundsListener(); _roundsListener = null; }
    if (typeof tripScoreListener !== "undefined" && tripScoreListener) { tripScoreListener(); tripScoreListener = null; }
    // Clear in-memory data from old league
    liveTeeTimes = [];
    liveRangeSessions = [];
    liveChat = [];
    // Reinitialize with new league context
    loadRoundsFromFirestore();
    startRoundsListener();
    syncScrambleTeamsFromFirestore();
    if (typeof startTeeTimeListener === "function") startTeeTimeListener();
    if (typeof startRangeSessionListener === "function") startRangeSessionListener();
    Router.go("home");
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function requestJoinLeague(lid) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var uid = currentUser.uid;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "Someone";
  // Create a pending join request doc
  db.collection("leagues").doc(lid).collection("joinRequests").doc(uid).set({
    uid: uid,
    name: myName,
    handicap: currentProfile ? (currentProfile.computedHandicap || null) : null,
    level: currentProfile ? (currentProfile.level || 1) : 1,
    homeCourse: currentProfile ? (currentProfile.homeCourse || "") : "",
    createdAt: fsTimestamp(),
    status: "pending"
  }).then(function() {
    // Notify commissioner + admins
    db.collection("leagues").doc(lid).get().then(function(doc) {
      if (!doc.exists) return;
      var l = doc.data();
      var notifyUids = [l.commissioner].concat(l.admins || []);
      var seen = {};
      notifyUids.forEach(function(nuid) {
        if (seen[nuid]) return; seen[nuid] = true;
        sendNotification(nuid, { type:"league_request", title:"Join Request", message:myName + " wants to join " + l.name, page:"leagues" });
      });
    });
    Router.toast("Request sent! An admin will review it.");
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

// ── League member management ──
function _loadLeagueMembers(lid, league) {
  var el = document.getElementById("leagueMemberList");
  if (!el || !league.memberUids) return;
  var mh = '';
  league.memberUids.forEach(function(uid) {
    var p = PB.getPlayer(uid);
    if (!p) return;
    var role = uid === league.commissioner ? "Commissioner" : (league.admins && league.admins.indexOf(uid) !== -1) ? "Admin" : "Member";
    var roleColor = role === "Commissioner" ? "var(--gold)" : role === "Admin" ? "var(--blue)" : "var(--muted)";
    mh += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">';
    mh += renderAvatar(p, 32, true);
    mh += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(p.name || p.username) + '</div>';
    mh += '<div style="font-size:9px;color:' + roleColor + ';font-weight:600">' + role + '</div></div>';
    if (currentUser && league.commissioner === currentUser.uid && uid !== currentUser.uid) {
      var isAdmin = league.admins && league.admins.indexOf(uid) !== -1;
      mh += '<button class="btn-sm outline" style="font-size:8px" onclick="toggleLeagueAdmin(\'' + lid + '\',\'' + uid + '\',' + isAdmin + ')">' + (isAdmin ? "Remove Admin" : "Make Admin") + '</button>';
    }
    mh += '</div>';
  });
  el.innerHTML = mh || '<div style="font-size:11px;color:var(--muted)">No members</div>';
}

function _loadJoinRequests(lid) {
  var el = document.getElementById("leagueJoinRequests");
  if (!el || !db) return;
  db.collection("leagues").doc(lid).collection("joinRequests").where("status","==","pending").get().then(function(snap) {
    if (snap.empty) { el.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:8px 0">No pending requests</div>'; return; }
    var rh = '';
    snap.forEach(function(doc) {
      var req = doc.data();
      rh += '<div class="card" style="margin-bottom:6px"><div style="padding:12px 16px;display:flex;align-items:center;gap:10px">';
      var reqPlayer = PB.getPlayer(req.uid);
      rh += renderAvatar(reqPlayer || {name:req.name,id:req.uid}, 36, false);
      rh += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(req.name) + '</div>';
      var meta = [];
      if (req.handicap) meta.push("Hcap " + req.handicap);
      if (req.homeCourse) meta.push(req.homeCourse);
      rh += '<div style="font-size:9px;color:var(--muted)">' + (meta.join(" \u00b7 ") || "Level " + (req.level||1)) + '</div></div>';
      rh += '<div style="display:flex;gap:4px">';
      rh += '<button class="btn-sm green" style="font-size:9px;padding:6px 10px" onclick="approveJoinRequest(\'' + lid + '\',\'' + req.uid + '\')">Approve</button>';
      rh += '<button class="btn-sm" style="font-size:9px;padding:6px 10px;background:rgba(var(--red-rgb),.08);border:1px solid rgba(var(--red-rgb),.2);color:var(--red)" onclick="denyJoinRequest(\'' + lid + '\',\'' + req.uid + '\')">Deny</button>';
      rh += '</div></div></div>';
    });
    el.innerHTML = rh;
  }).catch(function() { el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Could not load requests</div>'; });
}

function approveJoinRequest(lid, reqUid) {
  if (!db) return;
  // Add member to league
  db.collection("leagues").doc(lid).update({
    memberUids: firebase.firestore.FieldValue.arrayUnion(reqUid),
    memberCount: firebase.firestore.FieldValue.increment(1)
  });
  db.collection("members").doc(reqUid).update({
    leagues: firebase.firestore.FieldValue.arrayUnion(lid)
  });
  // Update request status
  db.collection("leagues").doc(lid).collection("joinRequests").doc(reqUid).update({ status: "approved" });
  // Notify the requester
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (doc.exists) sendNotification(reqUid, { type:"league_approved", title:"Welcome!", message:"You've been approved to join " + doc.data().name + "!", page:"leagues" });
  });
  Router.toast("Member approved!");
  Router.go("leagues", { id: lid });
}

function denyJoinRequest(lid, reqUid) {
  if (!db) return;
  db.collection("leagues").doc(lid).collection("joinRequests").doc(reqUid).update({ status: "denied" });
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (doc.exists) sendNotification(reqUid, { type:"league_denied", title:"Request Update", message:"Your request to join " + doc.data().name + " was not approved.", page:"leagues" });
  });
  Router.toast("Request denied");
  Router.go("leagues", { id: lid });
}

function toggleLeagueAdmin(lid, uid, isCurrentlyAdmin) {
  if (!db || !currentUser) return;
  var update = isCurrentlyAdmin
    ? { admins: firebase.firestore.FieldValue.arrayRemove(uid) }
    : { admins: firebase.firestore.FieldValue.arrayUnion(uid) };
  db.collection("leagues").doc(lid).update(update).then(function() {
    Router.toast(isCurrentlyAdmin ? "Admin removed" : "Admin added");
    Router.go("leagues", { id: lid });
  });
}

function toggleLeagueVisibility(lid) {
  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var newVis = doc.data().visibility === "public" ? "private" : "public";
    db.collection("leagues").doc(lid).update({ visibility: newVis }).then(function() {
      Router.toast("League is now " + newVis);
      Router.go("leagues", { id: lid });
    });
  });
}

function toggleLeagueApproval(lid) {
  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var newVal = !doc.data().requireApproval;
    db.collection("leagues").doc(lid).update({ requireApproval: newVal }).then(function() {
      Router.toast("Approval " + (newVal ? "required" : "not required"));
      Router.go("leagues", { id: lid });
    });
  });
}

function regenerateInviteCode(lid) {
  if (!db) return;
  var newCode = "LG-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  db.collection("leagues").doc(lid).update({ inviteCode: newCode }).then(function() {
    Router.toast("New invite code: " + newCode);
    Router.go("leagues", { id: lid });
  });
}

function confirmDeleteLeague(lid, leagueName) {
  var typed = prompt("Type the league name to confirm deletion: \"" + leagueName + "\"");
  if (typed !== leagueName) { Router.toast("Names don't match — deletion cancelled"); return; }
  if (!db || !currentUser) return;
  // Remove league from all members
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var l = doc.data();
    if (l.badge === "founding") { Router.toast("Cannot delete the founding league"); return; }
    if (l.commissioner !== currentUser.uid) { Router.toast("Only commissioner can delete"); return; }
    var promises = (l.memberUids || []).map(function(uid) {
      return db.collection("members").doc(uid).update({
        leagues: firebase.firestore.FieldValue.arrayRemove(lid)
      }).catch(function(){});
    });
    Promise.all(promises).then(function() {
      return db.collection("leagues").doc(lid).delete();
    }).then(function() {
      if (currentProfile) {
        currentProfile.leagues = (currentProfile.leagues || []).filter(function(l2){return l2!==lid});
        if (currentProfile.activeLeague === lid) {
          currentProfile.activeLeague = currentProfile.leagues.length ? currentProfile.leagues[0] : "";
          db.collection("members").doc(currentUser.uid).update({ activeLeague: currentProfile.activeLeague }).catch(function(){});
        }
      }
      Router.toast("League deleted");
      Router.go("leagues");
    });
  });
}
