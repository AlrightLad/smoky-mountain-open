/* ================================================
   PAGE: MEMBERS
   ================================================ */

Router.register("members", function(params) {
  if (params.add) renderAddMemberForm();
  else if (params.edit) renderMemberEdit(params.edit);
  else if (params.id) renderMemberDetail(params.id);
  else renderMemberList();
});

function renderMemberList() {
  var players = PB.getPlayers();
  
  // Show loading while fetching Firebase members
  document.querySelector('[data-page="members"]').innerHTML = '<div class="sh"><h2>Parbaugh members</h2></div>' + skeletonMemberRow() + skeletonMemberRow() + skeletonMemberRow() + skeletonMemberRow();
  
  if (db) {
    db.collection("members").get({ source: 'server' }).then(function(snap) {
      var fbMembers = [];
      var claimedFromIds = [];
      var seenDocIds = {}; // dedup by Firestore doc ID — prevents double-render artifacts
      snap.forEach(function(doc) {
        if (seenDocIds[doc.id]) return;
        seenDocIds[doc.id] = true;
        var d = doc.data();
        d.id = d.id || doc.id;
        // v8.17.0 Path B+ hardening — direct Firestore query bypasses
        // PB.getPlayers() filter; apply visibility check explicitly here.
        // (V13.3 audit miss — patched in immediate followup.)
        if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(d)) return;
        fbMembers.push(d);
        if (d.claimedFrom) claimedFromIds.push(d.claimedFrom);
      });
      
      pbLog("[Members] Firebase:", fbMembers.length, "Local:", players.length, "Claimed:", claimedFromIds.length);
      
      // Filter local players: remove any whose ID was claimed by a Firebase account
      var filtered = players.filter(function(p) {
        return claimedFromIds.indexOf(p.id) === -1;
      });
      
      // Add Firebase members — deduplicate by doc ID, claimedFrom, AND username
      var filteredIds = filtered.map(function(p) { return p.id; });
      var seenClaimedFrom = {};
      var seenUsernames = {};
      // First pass: index all real accounts (has username + email = registered user)
      fbMembers.forEach(function(fm) {
        if (fm.claimedFrom && fm.username) seenClaimedFrom[fm.claimedFrom] = fm.id;
        // Track richest doc per username (most fields = real account)
        if (fm.username) {
          var key = fm.username.toLowerCase();
          var existing = seenUsernames[key];
          if (!existing) {
            seenUsernames[key] = fm;
          } else {
            // Keep the doc with more data (real account wins over stub)
            var fmScore = Object.keys(fm).length + (fm.email ? 5 : 0) + (fm.claimedFrom ? 2 : 0);
            var exScore = Object.keys(existing).length + (existing.email ? 5 : 0) + (existing.claimedFrom ? 2 : 0);
            if (fmScore > exScore) seenUsernames[key] = fm;
          }
        }
      });
      fbMembers.forEach(function(fm) {
        if (isBannedRole(fm)) return;
        if (filteredIds.indexOf(fm.id) !== -1) return;
        // Skip stub docs: has claimedFrom but no username, AND a real account exists
        if (fm.claimedFrom && !fm.username && seenClaimedFrom[fm.claimedFrom]) return;
        // Skip duplicate usernames: only add if this is the chosen (richest) doc
        if (fm.username && seenUsernames[fm.username.toLowerCase()] !== fm) return;
        filtered.push(fm);
        filteredIds.push(fm.id);
      });
      
      pbLog("[Members] Final list:", filtered.length, filtered.map(function(p){return p.name||p.username}).join(", "));
      
      var h2 = '<div class="sh"><h2>Parbaugh members</h2></div>';
      renderMemberListHtml(filtered, h2);
    }).catch(function(e) {
      console.error("[Members] Firebase load failed:", e);
      var h = '<div class="sh"><h2>Parbaugh members</h2></div>';
      renderMemberListHtml(players, h);
    });
  } else {
    var h = '<div class="sh"><h2>Parbaugh members</h2></div>';
    renderMemberListHtml(players, h);
  }
}

function renderMemberListHtml(players, h) {
  var totalCount = players.filter(function(p){return !isBannedRole(p);}).length;
  
  // Header with count
  h = '<div class="sh"><h2>Members <span style="font-size:14px;color:var(--muted);font-weight:400">' + totalCount + '</span></h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  // Search bar
  h += '<div style="padding:0 16px 12px"><input type="text" id="memberSearch" class="ff-input" placeholder="Search members..." oninput="filterMemberList()" style="background:var(--bg3);border:1px solid var(--border);font-size:13px;padding:10px 14px"></div>';
  
  // Sort controls
  h += '<div style="padding:0 16px 12px;display:flex;gap:6px;flex-wrap:wrap">';
  var sorts = [
    {key:"level",label:"Level"},
    {key:"rounds",label:"Rounds"},
    {key:"handicap",label:"Handicap"},
    {key:"alpha",label:"A-Z"}
  ];
  sorts.forEach(function(s) {
    var isActive = (s.key === "level"); // default sort
    h += '<button class="btn-sm ' + (isActive ? 'green' : 'outline') + '" id="sort-' + s.key + '" style="font-size:10px;padding:4px 10px" onclick="sortMemberList(\'' + s.key + '\')">' + s.label + '</button>';
  });
  h += '</div>';
  
  // Member list container
  h += '<div id="memberListContainer">';
  
  // Sort: founding members first, then by level
  var sortedPlayers = players.filter(function(p){return !isBannedRole(p);}).slice();
  sortedPlayers.sort(function(a, b) {
    var aFounder = a.founding || a.isFoundingFour ? 1 : 0;
    var bFounder = b.founding || b.isFoundingFour ? 1 : 0;
    if (aFounder !== bFounder) return bFounder - aFounder;
    var aLvl = 1, bLvl = 1;
    try { aLvl = (PB.getPlayerLevel(a.id) || {level:1}).level; } catch(e) {}
    try { bLvl = (PB.getPlayerLevel(b.id) || {level:1}).level; } catch(e) {}
    return bLvl - aLvl;
  });
  
  h += buildMemberCards(sortedPlayers);
  h += '</div>';
  
  h += '<div class="section">' + renderInviteMemberButton() + '</div>';
  document.querySelector('[data-page="members"]').innerHTML = h;
  
  // Store players for search/sort
  window._memberListPlayers = sortedPlayers;
  window._memberListSort = "level";
}

function buildMemberCards(players) {
  var h = '';
  var lastWasFounder = false;
  players.forEach(function(p, idx) {
    var isFounder = p.founding || p.isFoundingFour;
    // Divider between founders and rest
    if (lastWasFounder && !isFounder) {
      h += '<div style="padding:4px 16px 8px;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;border-top:1px solid var(--border);margin-top:4px;padding-top:12px">Members</div>';
    }
    lastWasFounder = isFounder;
    
    var avg = PB.getPlayerAvg(p.id);
    var rounds = PB.getPlayerRounds(p.id);
    var hcap = PB.calcHandicap(rounds);
    var plvl = {level:1};
    try { plvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(p.id)) || {level:1}; } catch(e) {}
    h += '<div class="card member-card" data-name="' + escHtml((p.name||"").toLowerCase() + " " + (p.username||"").toLowerCase()) + '" onclick="Router.go(\'members\',{id:\'' + p.id + '\'})">';
    h += '<div class="member-row"><div style="position:relative">' + renderAvatar(p, 40, false);
    h += '<div style="position:absolute;bottom:-3px;right:-3px;background:var(--gold);color:var(--bg);font-size:7px;font-weight:800;border-radius:6px;padding:1px 3px;border:1.5px solid var(--bg);line-height:1.3;min-width:12px;text-align:center;z-index:2;pointer-events:none">' + (plvl.level||1) + '</div>';
    h += '</div><div class="m-info">';
    h += '<div class="m-name">' + escHtml(p.username || p.name);
    if (isFounder) h += ' <svg viewBox="0 0 12 12" width="10" height="10" style="vertical-align:middle;margin-left:2px"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.6 3.5L6 9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" fill="var(--gold)" stroke="none"/></svg>';
    h += '</div>';
    if (p.equippedTitle && p.equippedTitle !== "Member" && p.equippedTitle !== "Rookie") h += '<div class="m-nick">' + escHtml(p.equippedTitle) + '</div>';
    // v8.0: "Founder" is the platform-wide role (Zach). The opal-ring
    // visual treatment lands in v8.0.1. For rc2.2, just the text label.
    else if (isFounderRole(p)) h += '<div class="m-nick">Founder</div>';
    else if (platformRoleOf(p) === "suspended") h += '<div class="m-nick" style="color:var(--red)">Suspended</div>';
    h += '<div class="m-stats">' + (hcap !== null ? 'HCP ' + hcap + ' · ' : '') + (avg ? 'Avg ' + avg + ' · ' : '') + rounds.length + ' rds</div>';
    h += '</div><div class="m-arrow">></div></div></div>';
  });
  return h;
}

function filterMemberList() {
  var query = (document.getElementById("memberSearch").value || "").toLowerCase().trim();
  var cards = document.querySelectorAll(".member-card");
  cards.forEach(function(card) {
    var name = card.getAttribute("data-name") || "";
    card.style.display = !query || name.indexOf(query) !== -1 ? "" : "none";
  });
}

function sortMemberList(key) {
  var players = window._memberListPlayers;
  if (!players) return;
  window._memberListSort = key;
  
  // Update button states
  ["level","rounds","handicap","alpha"].forEach(function(k) {
    var btn = document.getElementById("sort-" + k);
    if (btn) btn.className = "btn-sm " + (k === key ? "green" : "outline");
  });
  
  var sorted = players.slice();
  sorted.sort(function(a, b) {
    // Founders always first
    var aF = a.founding || a.isFoundingFour ? 1 : 0;
    var bF = b.founding || b.isFoundingFour ? 1 : 0;
    if (aF !== bF) return bF - aF;
    
    if (key === "level") {
      var aL = 1, bL = 1;
      try { aL = (PB.getPlayerLevel(a.id)||{level:1}).level; } catch(e) {}
      try { bL = (PB.getPlayerLevel(b.id)||{level:1}).level; } catch(e) {}
      return bL - aL;
    }
    if (key === "rounds") {
      return PB.getPlayerRounds(b.id).length - PB.getPlayerRounds(a.id).length;
    }
    if (key === "handicap") {
      var aH = PB.calcHandicap(PB.getPlayerRounds(a.id));
      var bH = PB.calcHandicap(PB.getPlayerRounds(b.id));
      if (aH === null && bH === null) return 0;
      if (aH === null) return 1;
      if (bH === null) return -1;
      return aH - bH; // lower handicap first
    }
    if (key === "alpha") {
      return (a.name||"").localeCompare(b.name||"");
    }
    return 0;
  });
  
  var container = document.getElementById("memberListContainer");
  if (container) container.innerHTML = buildMemberCards(sorted);
  
  // Re-apply search filter
  var query = (document.getElementById("memberSearch").value || "").trim();
  if (query) filterMemberList();
}

function renderMemberDetail(pid) {
  var p = PB.getPlayer(pid);
  
  // If not in local data, try Firebase
  if (!p && db) {
    db.collection("members").doc(pid).get().then(function(doc) {
      if (doc.exists) {
        renderMemberDetailWithData(doc.data());
      } else {
        renderMemberList();
      }
    }).catch(function() { renderMemberList(); });
    // Show loading while we fetch
    document.querySelector('[data-page="members"]').innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';
    return;
  }
  if (!p) { renderMemberList(); return; }
  renderMemberDetailWithData(p);
}

// Extracted to src/pages/members-detail.js per W1.A5. Originally lines 251-1019 of this file.
// Extracted to src/pages/members-graph.js per W1.A5. Originally lines 1020-1195 of this file.
// Extracted to src/pages/members-edit.js per W1.A5. Originally lines 1196-1625 of this file.
function handleEditPhoto(pid, input) {
  // Legacy wrapper — redirect to the proper upload function
  uploadMemberPhoto(pid);
}

function uploadMemberPhoto(pid) {
  // Strictly self-only — no one can change another user's photo
  var isOwnProfile = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwnProfile) {
    Router.toast("You can only change your own photo");
    return;
  }
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { Router.toast("Photo too large (max 10MB)"); return; }
    Router.toast("Compressing...");
    var reader = new FileReader();
    reader.onload = function(e) {
      compressPhoto(e.target.result, PHOTO_MAX_KB, 200, function(compressed) {
        // Cache locally under ALL known IDs for this player
        PB.updatePlayer(pid, { photo: compressed, stockAvatar: "" });
        photoCache["member:" + pid] = compressed;
        if (currentProfile && currentProfile.claimedFrom) {
          photoCache["member:" + currentProfile.claimedFrom] = compressed;
          PB.updatePlayer(currentProfile.claimedFrom, { photo: compressed, stockAvatar: "" });
        }
        if (currentUser && currentUser.uid !== pid) {
          photoCache["member:" + currentUser.uid] = compressed;
        }
        // Save to Firestore photos collection (visible to all members)
        savePhoto("member", pid, compressed).then(function(ok) {
          // Also write hasPhoto flag to member doc so it survives cache miss
          if (ok && db && currentUser) {
            db.collection("members").doc(currentUser.uid).update({
              hasPhoto: true,
              stockAvatar: "",
              updatedAt: fsTimestamp()
            }).catch(function() {});
          }
          Router.toast(ok ? "Photo updated!" : "Photo saved locally");
          updateProfileBar();
          Router.go("members", { id: pid });
        });
      });
    };
    reader.onerror = function() { Router.toast("Failed to read photo"); };
    reader.readAsDataURL(file);
  };
  input.click();
}

function renderInviteMemberButton() {
  if (!currentProfile) return '<button class="btn full outline" disabled>Sign in to invite members</button>';
  
  var isComm = isFounderRole(currentProfile);
  var invitesLeft = isComm ? 999 : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  var h = '';
  
  if (invitesLeft > 0 || isComm) {
    h += '<button class="btn full green" onclick="promptAddMember()">+ Invite New Member</button>';
    h += '<div style="text-align:center;margin-top:6px;font-size:10px;color:var(--muted)">';
    if (isComm) h += 'Commissioner · Unlimited invites';
    else h += invitesLeft + ' invite' + (invitesLeft !== 1 ? 's' : '') + ' remaining';
    h += '</div>';
  } else {
    h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--cream);margin-bottom:4px">No Invites Remaining</div>';
    h += '<div style="font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:12px">You\'ve used all ' + (currentProfile.maxInvites||3) + ' invites. Ask the Commissioner for more, or have them send an invite on your behalf.</div>';
    h += '<button class="btn full outline" onclick="requestInviteFromCommissioner()">Ask Commissioner for Invite</button>';
    h += '</div>';
  }
  return h;
}

function requestInviteFromCommissioner() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready"); return; }
  // Find commissioner
  var players = PB.getPlayers();
  var commissioner = players.find(function(p) { return isFounderRole(p); });
  if (!commissioner) { Router.toast("No commissioner found"); return; }
  
  // Send notification to commissioner
  sendNotification(commissioner.id, {
    type: "invite_request",
    title: "Invite Request",
    message: (currentProfile.name || currentProfile.username) + " is requesting an invite code for a new member"
  });
  Router.toast("Request sent to the Commissioner!");
}

function promptAddMember() {
  if (!currentProfile) { Router.toast("Sign in first"); return; }
  var isComm = isFounderRole(currentProfile);
  var invitesLeft = isComm ? 999 : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  
  if (invitesLeft <= 0 && !isComm) {
    Router.toast("No invites remaining");
    return;
  }
  Router.go("members", { add: true });
}

function renderAddMemberForm() {
  var isComm = isFounderRole(currentProfile);
  var invitesLeft = isComm ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  
  var h = '<div class="sh"><h2>Invite Member</h2><button class="back" onclick="Router.back(\'members\')">← Back</button></div>';
  
  h += '<div class="form-section">';
  h += '<div style="text-align:center;margin-bottom:16px;padding:12px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius)">';
  h += '<div id="inviteCountDisplay" style="font-size:11px;color:var(--gold);font-weight:600">Invites remaining: ' + invitesLeft + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">New member will receive an invite code to create their account</div>';
  h += '</div>';
  
  h += '<div class="form-title">Option 1: Generate Invite Code</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">Generate a code and share it with the person. They\'ll use it to sign up.</div>';
  h += '<button class="btn full green" onclick="generateInviteFromMembers()">Generate Invite Code</button>';
  h += '<div id="memberInviteResult" style="margin-top:8px"></div>';
  
  // Only Commissioner can add locally
  if (isComm) {
    h += '<div style="margin:20px 0;display:flex;align-items:center;gap:12px"><div style="flex:1;height:1px;background:var(--border)"></div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:2px">or</div><div style="flex:1;height:1px;background:var(--border)"></div></div>';
    
    h += '<div class="form-title">Commissioner: Add Locally</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">Add a player name to track scores now. They can claim their profile later when they sign up.</div>';
    h += formField("Name", "add-name", "", "text", "First name or nickname");
    h += '<div class="ff"><label class="ff-label">Referred by</label><select class="ff-input" id="add-referral"><option value="">— Select member —</option>';
    PB.getPlayers().forEach(function(p) {
      h += '<option value="' + p.name + '">' + p.name + (p.founding ? '' : '') + '</option>';
    });
    h += '</select></div>';
    h += formField("Score range", "add-range", "", "text", "e.g. 95-105");
    h += formField("Handicap", "add-handicap", "", "number", "e.g. 18.5");
    h += '<button class="btn full outline" onclick="submitAddMember()">Add Locally</button>';
  }
  h += '</div>';
  h += renderPageFooter();
  document.querySelector('[data-page="members"]').innerHTML = h;
  // Restore last generated invite if page was re-rendered by snapshot listener
  if (_lastGeneratedInvite) setTimeout(showGeneratedInvite, 50);
}

var _lastGeneratedInvite = null; // Survives page re-renders

function generateInviteFromMembers() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready — try refreshing"); return; }
  var isComm = isFounderRole(currentProfile);
  if (!isComm && (currentProfile.invitesUsed||0) >= (currentProfile.maxInvites||3)) { Router.toast("No invites remaining"); return; }
  
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; var code = "PB-";
  for (var i=0;i<8;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  var memberDocId = currentProfile.docId || currentUser.uid;
  var inviteLink = "https://alrightlad.github.io/smoky-mountain-open/?invite=" + code;
  
  // Show loading state
  var resultEl = document.getElementById("memberInviteResult");
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">Generating...</div>';
  
  db.collection("invites").doc(code).set({ code:code, createdBy:currentUser.uid, createdByName:currentProfile.name||currentProfile.username, usedBy:null, status:"active", createdAt:fsTimestamp() })
    .then(function() {
      // Store invite so it survives page re-renders from the profile snapshot listener
      _lastGeneratedInvite = { code: code, link: inviteLink };
      currentProfile.invitesUsed = (currentProfile.invitesUsed||0)+1;
      showGeneratedInvite();
      Router.toast("Invite created!");
      // Delay member doc update so it doesn't trigger re-render before user sees the code
      setTimeout(function() {
        db.collection("members").doc(memberDocId).update({invitesUsed:firebase.firestore.FieldValue.increment(1)}).catch(function(){});
      }, 1500);
    })
    .catch(function(err) {
      pbWarn("[Invite] Error:", err);
      _lastGeneratedInvite = null;
      if (resultEl) resultEl.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--red);text-align:center">Failed: ' + (err.message || "Permission denied. Ask the Commissioner to check Firestore rules for the invites collection.") + '</div>';
      Router.toast("Failed to create invite");
    });
}

function showGeneratedInvite() {
  if (!_lastGeneratedInvite) return;
  var resultEl = document.getElementById("memberInviteResult");
  if (!resultEl) return;
  var code = _lastGeneratedInvite.code;
  var inviteLink = _lastGeneratedInvite.link;
  var isComm = isFounderRole(currentProfile);
  var newLeft = isComm ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  var countEl = document.getElementById("inviteCountDisplay");
  if (countEl) countEl.textContent = "Invites remaining: " + newLeft;
  resultEl.innerHTML = '<div class="invite-code">'
    + '<div class="code">' + code + '</div>'
    + '<div style="margin:10px 0 6px"><input type="text" readonly value="' + inviteLink + '" id="inviteLinkField" style="width:100%;font-size:10px;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);text-align:center;font-family:monospace" onclick="this.select()"></div>'
    + '<button class="btn full outline" onclick="copyInviteLink()" style="font-size:11px;padding:10px;margin-top:4px" id="copyInviteBtn">Copy invite link</button>'
    + '<div class="hint" style="margin-top:8px">Send this link — the code auto-fills when they open it</div>'
    + '</div>';
}

function copyInviteLink() {
  var field = document.getElementById("inviteLinkField");
  if (!field) return;
  field.select();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(field.value).then(function() {
      var btn = document.getElementById("copyInviteBtn");
      if (btn) { btn.textContent = "Copied!"; setTimeout(function(){ btn.textContent = "Copy invite link"; }, 2000); }
    }).catch(function() { document.execCommand("copy"); Router.toast("Copied!"); });
  } else {
    document.execCommand("copy");
    Router.toast("Copied!");
  }
}

function submitAddMember() {
  var name = document.getElementById("add-name").value;
  if (!name) { Router.toast("Enter a name"); return; }
  var referral = document.getElementById("add-referral").value;
  var range = document.getElementById("add-range").value;
  var handicap = document.getElementById("add-handicap").value;
  var result = PB.addPlayer(name, referral);
  if (result) {
    var updates = {};
    if (range) updates.range = range;
    if (handicap) updates.manualHandicap = parseFloat(handicap);
    if (Object.keys(updates).length) PB.updatePlayer(result.id, updates);
    syncMember(result);
    Router.toast(name + " added to the Parbaughs!");
    Router.go("members", { edit: result.id });
  } else {
    Router.toast("Member already exists");
  }
}

/* Helpers */
// statBox and formField moved to src/core/utils.js (shared across pages)

function showCourseSearch(input, type) {
  var results = PB.searchCourses(input.value);
  var container = document.getElementById("search-" + type);
  if (!container || !results.length) { if (container) container.innerHTML = ""; return; }
  var targetMap = {"home":"edit-homecourse","fav":"edit-favcourse","add-home":"add-homecourse","add-fav":"add-favcourse"};
  var targetId = targetMap[type] || input.id;
  var h = '';
  results.forEach(function(c) {
    h += '<div class="search-item" onclick="document.getElementById(\'' + targetId + '\').value=\'' + c.name.replace(/'/g, "\\'") + '\';document.getElementById(\'search-' + type + '\').innerHTML=\'\'">' + c.name + ' <span style="color:var(--muted);font-size:11px">' + c.loc + ' · ' + c.rating + '/' + c.slope + '</span></div>';
  });
  container.innerHTML = h;
}

// toggleSection moved to src/core/utils.js (shared across pages)

function selectStockAvatar(pid, src) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own avatar"); return; }
  PB.updatePlayer(pid, { stockAvatar: src, photo: "" });
  // Clear custom photo from cache so stock avatar shows
  delete photoCache["member:" + pid];
  if (currentProfile && currentProfile.claimedFrom) {
    delete photoCache["member:" + currentProfile.claimedFrom];
    PB.updatePlayer(currentProfile.claimedFrom, { stockAvatar: src, photo: "" });
  }
  if (currentUser) delete photoCache["member:" + currentUser.uid];
  // Delete the photo doc from Firestore (cleans up old upload)
  if (db && currentUser) {
    db.collection("photos").doc("member_" + currentUser.uid).delete().catch(function() {});
    db.collection("members").doc(currentUser.uid).update({
      stockAvatar: src,
      hasPhoto: false,
      updatedAt: fsTimestamp()
    }).catch(function() {});
  }
  Router.toast("Avatar updated");
  updateProfileBar();
  Router.go("members", { edit: pid });
}

function equipTitle(pid, titleName) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own title"); return; }
  PB.updatePlayer(pid, { equippedTitle: titleName });
  if (currentProfile && currentProfile.claimedFrom) PB.updatePlayer(currentProfile.claimedFrom, { equippedTitle: titleName });
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).update({ equippedTitle: titleName }).catch(function(){});
  }
  if (currentProfile) currentProfile.equippedTitle = titleName;
  Router.go("members", { id: pid });
}

function toggleBadge(pid, badgeId) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own badges"); return; }
  var p = PB.getPlayer(pid);
  // Also check currentProfile and fbMemberCache
  if (!p && currentProfile && currentProfile.id === pid) p = currentProfile;
  if (!p && fbMemberCache[pid]) p = fbMemberCache[pid];
  if (!p) { Router.toast("Profile not found"); return; }
  
  var badges = (p.displayBadges || []).slice(); // copy
  var idx = badges.indexOf(badgeId);
  if (idx !== -1) {
    badges.splice(idx, 1);
  } else {
    if (badges.length >= 3) { Router.toast("Max 3 badges — remove one first"); return; }
    badges.push(badgeId);
  }
  
  // Update locally
  PB.updatePlayer(pid, { displayBadges: badges });
  if (p.claimedFrom) PB.updatePlayer(p.claimedFrom, { displayBadges: badges });
  
  // Update Firestore
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).update({ displayBadges: badges }).catch(function(){});
  }
  
  // Also update currentProfile in memory
  if (currentProfile && currentProfile.id === pid) currentProfile.displayBadges = badges;

  Router.go("members", { id: pid });
}

// ── Shareable Profile Card ──
function shareProfileCard(pid) {
  var p = PB.getPlayer(pid);
  if (!p) { Router.toast("Player not found"); return; }
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid));
  // v8.14.0 — Defense-in-depth abandoned filter (Gate 8a memory rule).
  var rounds = PB.getPlayerRounds(pid).filter(function(r){return r.status !== "abandoned";});
  var indiv = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"});
  var full18 = indiv.filter(function(r){return !r.holesPlayed||r.holesPlayed>=18});
  var hcap = PB.calcHandicap(rounds);
  var best = full18.length ? Math.min.apply(null, full18.map(function(r){return r.score})) : null;
  var avg = full18.length ? Math.round(full18.reduce(function(a,r){return a+r.score},0)/full18.length) : null;

  // Build HTML card for html2canvas
  var cardDiv = document.createElement("div");
  cardDiv.style.cssText = "width:400px;padding:32px;background:linear-gradient(135deg,#0e1118,#1a1f2c);border-radius:16px;font-family:Inter,sans-serif;color:#eae8e0;position:fixed;left:-9999px;top:0;z-index:9999";

  // Header
  var header = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  header += '<img src="watermark.jpg" style="width:32px;height:32px;border-radius:8px" onerror="this.style.display=\'none\'">';
  header += '<div><div style="font-family:var(--font-display);font-size:14px;font-weight:700;color:#c9a84c;letter-spacing:1px">PARBAUGHS</div>';
  header += '<div style="font-size:8px;color:#7a7e8a;letter-spacing:2px">GOLF LEAGUE PLATFORM</div></div></div>';

  // Player info
  var name = p.username || p.name;
  var title = p.equippedTitle || p.title || "";
  var info = '<div style="text-align:center;margin-bottom:20px">';
  info += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:#eae8e0">' + name + '</div>';
  if (title) info += '<div style="font-size:11px;color:#c9a84c;margin-top:4px;font-style:italic">' + title + '</div>';
  info += '<div style="font-size:10px;color:#7a7e8a;margin-top:6px">Level ' + (lvl.level||1) + ' \u00b7 ' + (lvl.name||"Rookie") + '</div>';
  info += '</div>';

  // Stats grid
  var stats = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#c9a84c">' + (hcap !== null ? hcap : "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Handicap</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + (best || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Best</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + (avg || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Average</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + indiv.length + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Rounds</div></div>';
  stats += '</div>';

  // Footer
  var footer = '<div style="text-align:center;padding-top:12px;border-top:1px solid #1e2333;font-size:9px;color:#484d5c">parbaughs.golf/player/' + (p.username || "") + '</div>';

  cardDiv.innerHTML = header + info + stats + footer;
  document.body.appendChild(cardDiv);

  if (typeof html2canvas !== "undefined") {
    html2canvas(cardDiv, { backgroundColor: null, scale: 2 }).then(function(canvas) {
      document.body.removeChild(cardDiv);
      canvas.toBlob(function(blob) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], "parbaughs-profile.png", { type: "image/png" })] })) {
          navigator.share({ files: [new File([blob], "parbaughs-profile.png", { type: "image/png" })], title: name + " on Parbaughs" }).catch(function(){});
        } else {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "parbaughs-profile-" + (p.username || "player") + ".png";
          a.click();
          Router.toast("Profile card downloaded!");
        }
      }, "image/png");
    }).catch(function() { document.body.removeChild(cardDiv); Router.toast("Could not generate card"); });
  } else {
    document.body.removeChild(cardDiv);
    Router.toast("Share card generation not available");
  }
}

// ════════════════════════════════════════════════════════════════════════
// v8.14.4 — Trend chart time-range toggle (P17 pattern)
// ════════════════════════════════════════════════════════════════════════
// Three trend charts on Members profile (Scoring/GIR/Putts) each have a
// 30D / SEASON / ANNUAL toggle. Toggle state persists in localStorage via
// PB.getChartRange/setChartRange (device-scoped per Q-RULING-B). Click
// surgically re-renders only the affected chart container — preserves
// scroll position and other section state.
//
// Handicap chart toggle deferred to separate ship per Q-RULING-A — the
// handicap data shape (monthly aggregation) doesn't fit naive filter-
// before-compute semantics. See POST_SHIP_4A_BACKLOG.md.
// ════════════════════════════════════════════════════════════════════════

// Render the toggle pill row above a chart. Stashes pid on the toggle root
// so the click handler can re-fetch rounds on toggle change.
function _renderChartRangeToggle(chartId, currentRange, pid) {
  var ranges = ['30D', 'SEASON', 'ANNUAL'];
  var labels = { '30D': '30D', 'SEASON': 'SEASON', 'ANNUAL': 'ANNUAL' };
  var html = '<div class="chart-range-toggle" data-chart-id="' + chartId + '" data-pid="' + escHtml(pid || '') + '">';
  ranges.forEach(function(r) {
    var activeClass = (r === currentRange) ? ' chart-range-pill--active' : '';
    html += '<button class="chart-range-pill' + activeClass + '" data-range="' + r + '" type="button">' + labels[r] + '</button>';
  });
  html += '</div>';
  return html;
}

// Surgical re-render of a single chart container. Preserves scroll position,
// other chart toggle states, and section accordion state. Updates toggle pill
// active class + replaces .chart-container innerHTML with new SVG.
function _rerenderTrendChart(chartId, pid) {
  var newRange = PB.getChartRange(chartId, '30D');
  var rounds = PB.getPlayerRounds(pid).filter(function(r){return r.status !== "abandoned";});
  // Update toggle pill active state for the targeted chart only.
  var toggle = document.querySelector('.chart-range-toggle[data-chart-id="' + chartId + '"]');
  if (toggle) {
    var pills = toggle.querySelectorAll('.chart-range-pill');
    pills.forEach(function(p) {
      if (p.dataset.range === newRange) p.classList.add('chart-range-pill--active');
      else p.classList.remove('chart-range-pill--active');
    });
  }
  // Re-render the chart SVG (or empty-state) in the container.
  var container = document.querySelector('.chart-container[data-chart-id="' + chartId + '"]');
  if (!container) return;
  var filtered = PB.filterRoundsByRange(rounds, newRange);
  var html = '';
  if (chartId === 'scoring_trend') {
    var trends = calcScoringTrends(filtered);
    if (trends && trends.rolling5.length >= 3) {
      html = svgLineChart(trends.rolling5, {width:310, height:120, color:'var(--gold)'});
    } else {
      html = '<div style="padding:24px 8px;text-align:center;font-size:11px;color:var(--muted)">Not enough rounds in this range. Try a wider window.</div>';
    }
  } else if (chartId === 'gir_trend') {
    var statTr = calcStatTrends(filtered);
    if (statTr && statTr.gir.length >= 3) {
      html = svgLineChart(statTr.gir, {width:310, height:100, color:'var(--gold)', yMin:0, yMax:100});
    } else {
      html = '<div style="padding:24px 8px;text-align:center;font-size:11px;color:var(--muted)">Not enough rounds in this range. Try a wider window.</div>';
    }
  } else if (chartId === 'putts_trend') {
    var statTrP = calcStatTrends(filtered);
    if (statTrP && statTrP.putts.length >= 3) {
      html = svgLineChart(statTrP.putts, {width:310, height:100, color:'var(--pink)'});
    } else {
      html = '<div style="padding:24px 8px;text-align:center;font-size:11px;color:var(--muted)">Not enough rounds in this range. Try a wider window.</div>';
    }
  } else if (chartId === 'handicap_home') {
    // v8.14.5 — Home handicap trend chart rerender. Different data shape than
    // the 3 Members profile trend charts: per-round-date handicap series
    // (PB.calcHandicap(roundsUpToDate) per round), not calc helper output.
    // Render via shared helper from home.js (_renderHandicapTrendSeries).
    if (typeof _renderHandicapTrendSeries === "function") {
      html = _renderHandicapTrendSeries(filtered, rounds, 600);
    } else {
      html = '<div style="padding:24px 8px;text-align:center;font-size:11px;color:var(--muted)">Chart unavailable.</div>';
    }
  }
  container.innerHTML = html;
}

// Delegated click handler — registered ONCE at script load time. Listens
// for clicks on any .chart-range-pill across the app; re-renders the
// associated chart on toggle change. Idempotent against repeated attaches
// via the _pbChartRangeListenerAttached flag.
if (typeof window !== "undefined" && !window._pbChartRangeListenerAttached) {
  window._pbChartRangeListenerAttached = true;
  document.addEventListener('click', function(e) {
    var pill = e.target.closest && e.target.closest('.chart-range-pill');
    if (!pill) return;
    var toggle = pill.closest('.chart-range-toggle');
    if (!toggle) return;
    var chartId = toggle.dataset.chartId;
    var pid = toggle.dataset.pid;
    var newRange = pill.dataset.range;
    if (!chartId || !newRange) return;
    if (typeof PB === "undefined" || !PB.setChartRange) return;
    PB.setChartRange(chartId, newRange);
    _rerenderTrendChart(chartId, pid);
  });
}

