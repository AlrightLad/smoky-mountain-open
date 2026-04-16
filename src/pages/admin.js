// ========== COMMISSIONER ADMIN PANEL ==========
Router.register("admin", function() {
  if (!currentProfile || currentProfile.role !== "commissioner") {
    var h = '<div class="sh"><h2>Access Denied</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
    h += '<div class="section"><div class="card"><div class="empty"><div class="empty-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg></div><div class="empty-text">Commissioner access only</div></div></div></div>';
    document.querySelector('[data-page="admin"]').innerHTML = h;
    return;
  }

  var h = '<div class="sh"><h2>Admin Panel</h2><button class="back" onclick="Router.go(\'settings\')">← Back</button></div>';

  // Reports section
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Member Reports</span></div>';
  h += '<div id="adminReports"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  // Member management with moderation
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Member Management</span></div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Manage invite quotas, suspensions, and removals.</div>';
  h += '<div id="adminMemberList"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  // All invites overview
  h += '<div class="section"><div class="sec-head"><span class="sec-title">All Invite Codes</span></div>';
  h += '<div id="adminInviteList"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  // Bulk generate
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Bulk Generate</span></div>';
  h += '<div class="card"><div class="card-body">';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Generate multiple invite codes at once</div>';
  h += '<div class="ff"><label class="ff-label">How many?</label><select id="bulkCount" class="ff-input"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option></select></div>';
  h += '<button class="btn full green" onclick="bulkGenerateInvites()">Generate</button>';
  h += '<div id="bulkResult"></div>';
  h += '</div></div></div>';

  // Feature Requests
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Feature Requests</span></div>';
  h += '<div id="adminFeatureRequests"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  // Error Log
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Error Log</span></div>';
  h += '<div id="adminErrorLog"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  // API Integration — commissioner only
  h += '<div class="section"><div class="sec-head"><span class="sec-title">API Integration</span></div>';
  var savedApiKey = localStorage.getItem("golfcourse_api_key") || "";
  h += '<div class="card"><div class="card-body">';
  h += '<div style="font-size:12px;font-weight:600;margin-bottom:4px">GolfCourseAPI.com</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Powers the 30,000+ course search for all members. Key is stored in Firestore and loads for everyone automatically.</div>';
  h += '<div style="display:flex;gap:6px"><input type="text" class="ff-input" id="gcapi-key" value="' + escHtml(savedApiKey) + '" placeholder="Paste API key..." style="flex:1;font-size:12px;-webkit-user-select:text;user-select:text" onkeydown="if(event.key===\'Enter\')saveGolfApiKey()" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">';
  h += '<button class="btn-sm outline" onclick="pasteApiKey()" style="font-size:9px;white-space:nowrap">Paste</button>';
  h += '<button class="btn-sm green" onclick="saveGolfApiKey()" style="font-size:10px">Save</button></div>';
  if (savedApiKey) h += '<div style="font-size:9px;color:var(--birdie);margin-top:4px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg> Active</div>';
  h += '</div></div></div>';

  // Data Recovery — CRITICAL for league migration
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--gold)">Data Recovery</span></div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Scan Firestore for docs missing leagueId tags. Fixes founding league data that became invisible after multi-league migration.</div>';
  h += '<button class="btn full" style="background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.3);color:var(--gold);font-size:11px;margin-bottom:8px" onclick="runDataRecoveryScan()">Scan for Missing Data</button>';
  h += '<div id="recoveryResult"></div>';
  h += '</div>';

  // Course Management
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Course Management</span></div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Remove duplicate or incorrectly added courses. API-imported courses are preferred.</div>';
  h += '<button class="btn full outline" style="margin-bottom:10px" onclick="loadAdminCourses()">Load course list</button>';
  h += '<div id="adminCourseList"></div>';
  h += '</div>';

  document.querySelector('[data-page="admin"]').innerHTML = h;

  loadAdminReports();
  loadAdminMemberList();
  loadAdminInviteList();
  loadAdminFeatureRequests();
  loadAdminErrorLog();
});

function loadAdminFeatureRequests() {
  var el = document.getElementById("adminFeatureRequests");
  if (!el || !db) { if (el) el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Requires Firebase</div>'; return; }
  db.collection("feature_requests").orderBy("createdAt", "desc").limit(30).get().then(function(snap) {
    if (snap.empty) {
      el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center"><div style="font-size:11px;color:var(--muted)">No requests yet</div></div></div>';
      return;
    }
    var h = '';
    snap.forEach(function(doc) {
      var r = Object.assign({_id: doc.id}, doc.data());
      var ts = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate() : null;
      var dateStr = ts ? (["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][ts.getMonth()] + " " + ts.getDate()) : "";
      var statusColors = {new:"var(--birdie)", reviewing:"var(--gold)", done:"var(--muted)", declined:"var(--red)"};
      var statusColor = statusColors[r.status] || "var(--muted)";
      h += '<div class="card"><div class="card-body">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
      h += '<div style="flex:1">';
      h += '<div style="font-size:12px;font-weight:600;color:var(--cream);line-height:1.4">' + escHtml(r.request || "") + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">' + escHtml(r.fromName || "Member") + (dateStr ? ' · ' + dateStr : '') + '</div>';
      h += '</div>';
      h += '<span style="font-size:8px;font-weight:700;color:' + statusColor + ';background:' + statusColor + '18;padding:2px 7px;border-radius:4px;letter-spacing:.5px;white-space:nowrap;flex-shrink:0">' + (r.status || "new").toUpperCase() + '</span>';
      h += '</div>';
      h += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
      h += '<button class="btn-sm outline" style="font-size:9px" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'reviewing\')">Mark reviewing</button>';
      h += '<button class="btn-sm outline" style="font-size:9px;color:var(--birdie);border-color:var(--birdie)" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'done\')">Mark done</button>';
      h += '<button class="btn-sm outline" style="font-size:9px;color:var(--muted2)" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'declined\')">Decline</button>';
      h += '</div>';
      h += '</div></div>';
    });
    el.innerHTML = h;
  }).catch(function(e) {
    // orderBy might fail without an index — fall back to unordered
    db.collection("feature_requests").limit(30).get().then(function(snap2) {
      if (snap2.empty) { el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center"><div style="font-size:11px;color:var(--muted)">No requests yet</div></div></div>'; return; }
      var h = '';
      snap2.forEach(function(doc) {
        var r = Object.assign({_id: doc.id}, doc.data());
        var statusColors = {new:"var(--birdie)", reviewing:"var(--gold)", done:"var(--muted)", declined:"var(--red)"};
        var statusColor = statusColors[r.status] || "var(--muted)";
        h += '<div class="card"><div class="card-body">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
        h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(r.request || "") + '</div>';
        h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">' + escHtml(r.fromName || "Member") + '</div></div>';
        h += '<span style="font-size:8px;font-weight:700;color:' + statusColor + ';background:' + statusColor + '18;padding:2px 7px;border-radius:4px;letter-spacing:.5px;white-space:nowrap;flex-shrink:0">' + (r.status || "new").toUpperCase() + '</span>';
        h += '</div>';
        h += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
        h += '<button class="btn-sm outline" style="font-size:9px" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'reviewing\')">Mark reviewing</button>';
        h += '<button class="btn-sm outline" style="font-size:9px;color:var(--birdie);border-color:var(--birdie)" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'done\')">Mark done</button>';
        h += '<button class="btn-sm outline" style="font-size:9px;color:var(--muted2)" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'declined\')">Decline</button>';
        h += '</div></div></div>';
      });
      el.innerHTML = h;
    }).catch(function() { el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Could not load requests</div>'; });
  });
}

function setFeatureRequestStatus(id, status) {
  if (!db) return;
  db.collection("feature_requests").doc(id).update({ status: status }).then(function() {
    Router.toast("Marked " + status);
    loadAdminFeatureRequests();
  }).catch(function() { Router.toast("Failed to update"); });
}

function loadAdminErrorLog() {
  var el = document.getElementById("adminErrorLog");
  if (!el || !db) { if (el) el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Requires Firebase</div>'; return; }
  db.collection("errors").orderBy("timestamp", "desc").limit(20).get().then(function(snap) {
    if (snap.empty) {
      el.innerHTML = '<div class="card"><div class="card-body" style="text-align:center"><div style="font-size:11px;color:var(--birdie)">No errors logged</div></div></div>';
      return;
    }
    var h = '';
    snap.forEach(function(doc) {
      var e = doc.data();
      var isResolved = e.resolved;
      var timeStr = e.timestamp ? new Date(e.timestamp).toLocaleString() : "Unknown";
      var shortMsg = (e.message || "").substring(0, 80);
      var shortStack = (e.stack || "").substring(0, 120);
      h += '<div class="card" style="margin-bottom:4px;opacity:' + (isResolved ? '.5' : '1') + '"><div class="card-body" style="padding:8px 12px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      h += '<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;color:var(--red);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(shortMsg) + '</div>';
      h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + escHtml(timeStr) + ' · ' + escHtml(e.page || "?") + ' · ' + escHtml(e.userName || e.userId || "anon") + '</div>';
      if (shortStack) h += '<div style="font-size:8px;color:var(--muted2);margin-top:2px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(shortStack) + '</div>';
      h += '</div>';
      if (!isResolved) {
        h += '<button class="btn-sm outline" style="font-size:8px;padding:2px 6px;flex-shrink:0;margin-left:6px" onclick="resolveError(\'' + doc.id + '\')">Resolve</button>';
      }
      h += '</div></div></div>';
    });
    h += '<div style="padding:8px;text-align:center"><button class="btn-sm outline" style="font-size:9px" onclick="clearResolvedErrors()">Clear resolved</button></div>';
    el.innerHTML = h;
  }).catch(function() { el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Could not load errors</div>'; });
}

function resolveError(errorId) {
  if (!db) return;
  db.collection("errors").doc(errorId).update({ resolved: true }).then(function() {
    Router.toast("Marked resolved");
    loadAdminErrorLog();
  });
}

function clearResolvedErrors() {
  if (!db) return;
  db.collection("errors").where("resolved", "==", true).get().then(function(snap) {
    var batch = db.batch();
    snap.forEach(function(doc) { batch.delete(doc.ref); });
    return batch.commit();
  }).then(function() { Router.toast("Cleared"); loadAdminErrorLog(); });
}

function loadAdminReports() {
  if (!db) { document.getElementById("adminReports").innerHTML = '<div style="font-size:11px;color:var(--muted)">Requires Firebase</div>'; return; }
  db.collection("reports").where("resolved","==",false).get().then(function(snap) {
    var reports = []; snap.forEach(function(doc) { reports.push(Object.assign({_id:doc.id}, doc.data())); });
    reports.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
    reports = reports.slice(0, 20);
    var h = '';
    if (!reports.length) {
      h = '<div class="card"><div class="card-body" style="text-align:center"><div style="font-size:11px;color:var(--muted)">No pending reports</div></div></div>';
    }
    reports.forEach(function(r) {
      var reporter = PB.getPlayer(r.reportedBy);
      var reported = PB.getPlayer(r.reportedUser);
      h += '<div class="card"><div class="card-body">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--red)">' + escHtml(r.reason || "Report") + '</div>';
      h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(reported ? reported.name : r.reportedUser) + ' reported by ' + escHtml(reporter ? reporter.name : r.reportedBy) + '</div>';
      if (r.details) h += '<div style="font-size:11px;color:var(--cream);margin-top:4px;font-style:italic">"' + escHtml(r.details) + '"</div>';
      h += '</div></div>';
      h += '<div style="display:flex;gap:6px;margin-top:8px">';
      h += '<button class="btn-sm" style="background:rgba(var(--red-rgb),.1);color:var(--red);border:1px solid rgba(var(--red-rgb),.2)" onclick="suspendMember(\'' + r.reportedUser + '\',7)">Suspend 7d</button>';
      h += '<button class="btn-sm" style="background:rgba(var(--red-rgb),.15);color:var(--red);border:1px solid rgba(var(--red-rgb),.3)" onclick="removeMemberAdmin(\'' + r.reportedUser + '\')">Remove</button>';
      h += '<button class="btn-sm outline" onclick="resolveReport(\'' + r._id + '\')">Dismiss</button>';
      h += '</div></div></div>';
    });
    document.getElementById("adminReports").innerHTML = h;
  }).catch(function() {
    document.getElementById("adminReports").innerHTML = '<div style="font-size:11px;color:var(--muted)">Could not load reports</div>';
  });
}

function loadAdminMemberList() {
  if (!db) return;
  db.collection("members").get().then(function(snap) {
    var members = []; snap.forEach(function(doc) { members.push(doc.data()); });
    var localPlayers = PB.getPlayers();
    var allMembers = members.length ? members : localPlayers;

    var h = '';
    allMembers.forEach(function(m) {
      var used = m.invitesUsed || 0;
      var max = m.maxInvites || 3;
      var isComm = m.role === "commissioner";
      var isSuspended = m.role === "suspended";
      var isRemoved = m.role === "removed";

      var statusColor = isSuspended ? "var(--red)" : isRemoved ? "var(--muted2)" : isComm ? "var(--gold)" : "var(--birdie)";
      var statusText = isSuspended ? "SUSPENDED" : isRemoved ? "REMOVED" : isComm ? "COMMISSIONER" : "ACTIVE";

      h += '<div class="card"><div class="card-body">';
      // Top row — name and status
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:600">' + escHtml(m.name || m.username || m.id) + '</div>';
      h += '<span style="font-size:8px;font-weight:700;color:' + statusColor + ';background:' + statusColor + '15;padding:3px 8px;border-radius:4px;letter-spacing:.5px">' + statusText + '</span>';
      h += '</div>';

      // Invite controls (not for commissioner or removed)
      if (!isComm && !isRemoved) {
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
        h += '<div style="font-size:10px;color:var(--muted)">Invites: ' + used + ' used</div>';
        h += '<div style="display:flex;align-items:center;gap:6px">';
        h += '<button class="btn-sm outline" onclick="adjustInvites(\'' + m.id + '\',' + max + ',-1)" style="width:26px;padding:5px;font-size:12px">−</button>';
        h += '<span style="font-size:13px;font-weight:700;color:var(--gold);min-width:20px;text-align:center">' + max + '</span>';
        h += '<button class="btn-sm outline" onclick="adjustInvites(\'' + m.id + '\',' + max + ',1)" style="width:26px;padding:5px;font-size:12px">+</button>';
        h += '</div></div>';
      }

      // Suspension info
      if (isSuspended && m.suspendedUntil) {
        var until = m.suspendedUntil.toDate ? m.suspendedUntil.toDate() : new Date(m.suspendedUntil);
        h += '<div style="font-size:10px;color:var(--red);margin-bottom:8px">Suspended until ' + (until.getMonth()+1) + '/' + until.getDate() + '/' + until.getFullYear();
        if (m.suspendedReason) h += ' — ' + escHtml(m.suspendedReason);
        h += '</div>';
      }

      // Moderation buttons (not for self or other commissioners)
      if (!isComm && m.id !== (currentUser ? currentUser.uid : "")) {
        h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
        if (isSuspended) {
          h += '<button class="btn-sm green" style="font-size:9px" onclick="unsuspendMember(\'' + m.id + '\')">Unsuspend</button>';
        } else if (!isRemoved) {
          h += '<button class="btn-sm outline" style="font-size:9px" onclick="promptSuspend(\'' + m.id + '\',\'' + escHtml(m.name||m.id) + '\')">Suspend</button>';
        }
        if (!isRemoved) {
          h += '<button class="btn-sm" style="font-size:9px;background:rgba(var(--red-rgb),.08);color:var(--red);border:1px solid rgba(var(--red-rgb),.15)" onclick="removeMemberAdmin(\'' + m.id + '\')">Remove</button>';
        } else {
          h += '<button class="btn-sm green" style="font-size:9px" onclick="reinstateMember(\'' + m.id + '\')">Reinstate</button>';
        }
        h += '</div>';
      }

      h += '</div></div>';
    });

    document.getElementById("adminMemberList").innerHTML = h || '<div style="font-size:11px;color:var(--muted)">No members</div>';
  }).catch(function() {
    document.getElementById("adminMemberList").innerHTML = '<div style="font-size:11px;color:var(--muted)">Failed to load</div>';
  });
}

function adjustInvites(memberId, currentMax, delta) {
  if (!db) return;
  var newMax = Math.max(0, currentMax + delta);
  db.collection("members").doc(memberId).update({ maxInvites: newMax }).then(function() {
    Router.toast("Invite limit updated to " + newMax);
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to update"); });
}

// ========== MODERATION ACTIONS ==========

function promptSuspend(memberId, memberName) {
  var days = prompt("Suspend " + memberName + " for how many days?", "7");
  if (!days) return;
  days = parseInt(days);
  if (isNaN(days) || days < 1) { Router.toast("Enter a valid number of days"); return; }
  var reason = prompt("Reason for suspension (visible to member):", "");
  suspendMember(memberId, days, reason);
}

function suspendMember(memberId, days, reason) {
  if (!db || !currentProfile || currentProfile.role !== "commissioner") return;
  var until = new Date();
  until.setDate(until.getDate() + days);

  db.collection("members").doc(memberId).update({
    role: "suspended",
    suspendedAt: fsTimestamp(),
    suspendedUntil: firebase.firestore.Timestamp.fromDate(until),
    suspendedBy: currentUser.uid,
    suspendedReason: reason || "Violation of Parbaughs rules"
  }).then(function() {
    // Notify the suspended member
    sendNotification(memberId, {
      type: "suspension",
      title: "Account Suspended",
      message: "Your account has been suspended for " + days + " days." + (reason ? " Reason: " + reason : "")
    });
    Router.toast("Member suspended for " + days + " days");
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to suspend"); });
}

function unsuspendMember(memberId) {
  if (!db || !confirm("Unsuspend this member?")) return;
  db.collection("members").doc(memberId).update({
    role: "member",
    suspendedAt: null,
    suspendedUntil: null,
    suspendedBy: null,
    suspendedReason: null
  }).then(function() {
    sendNotification(memberId, {
      type: "unsuspension",
      title: "Suspension Lifted",
      message: "Your account has been reinstated. Welcome back."
    });
    Router.toast("Member unsuspended");
    loadAdminMemberList();
  });
}

function removeMemberAdmin(memberId) {
  if (!db) return;
  var member = PB.getPlayer(memberId);
  var name = member ? member.name : memberId;
  if (!confirm("Remove " + name + " from the Parbaughs? This will revoke their access.")) return;
  var reason = prompt("Reason (optional):", "");

  db.collection("members").doc(memberId).update({
    role: "removed",
    removedAt: fsTimestamp(),
    removedBy: currentUser.uid,
    removedReason: reason || ""
  }).then(function() {
    sendNotification(memberId, {
      type: "removal",
      title: "Account Removed",
      message: "Your membership has been revoked." + (reason ? " Reason: " + reason : "")
    });
    Router.toast(name + " removed");
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to remove"); });
}

function reinstateMember(memberId) {
  if (!db || !confirm("Reinstate this member?")) return;
  db.collection("members").doc(memberId).update({
    role: "member",
    removedAt: null,
    removedBy: null,
    removedReason: null
  }).then(function() {
    sendNotification(memberId, {
      type: "reinstatement",
      title: "Welcome Back",
      message: "Your Parbaughs membership has been reinstated."
    });
    Router.toast("Member reinstated");
    loadAdminMemberList();
  });
}

function resolveReport(reportId) {
  if (!db) return;
  db.collection("reports").doc(reportId).update({ resolved: true, resolvedAt: fsTimestamp(), resolvedBy: currentUser.uid })
    .then(function() { Router.toast("Report dismissed"); loadAdminReports(); });
}

// ========== MEMBER REPORT SYSTEM (any member can report) ==========
function reportMember(memberId) {
  if (!db || !currentUser) { Router.toast("Sign in to report"); return; }
  if (memberId === currentUser.uid) { Router.toast("You can't report yourself"); return; }

  var reasons = ["Score falsification", "Vulgar/inappropriate messages", "Unsportsmanlike conduct", "Harassment", "Other"];
  var reasonIdx = prompt("Report reason:\n1. Score falsification\n2. Vulgar/inappropriate messages\n3. Unsportsmanlike conduct\n4. Harassment\n5. Other\n\nEnter number (1-5):");
  if (!reasonIdx) return;
  var reason = reasons[parseInt(reasonIdx) - 1] || "Other";
  var details = prompt("Additional details (optional):", "");

  db.collection("reports").add({
    reportedUser: memberId,
    reportedBy: currentUser.uid,
    reason: reason,
    details: details || "",
    resolved: false,
    createdAt: fsTimestamp()
  }).then(function() {
    // Notify commissioner
    var players = PB.getPlayers();
    var commissioner = players.find(function(p) { return p.role === "commissioner"; });
    if (commissioner) {
      var reported = PB.getPlayer(memberId);
      sendNotification(commissioner.id, {
        type: "report",
        title: "Member Report",
        message: (currentProfile.name||"A member") + " reported " + (reported ? reported.name : memberId) + " for " + reason
      });
    }
    Router.toast("Report submitted to the Commissioner");
  }).catch(function() { Router.toast("Failed to submit report"); });
}

function loadAdminInviteList() {
  if (!db) return;
  leagueQuery("invites").orderBy("createdAt", "desc").limit(50).get().then(function(snap) {
    var invites = []; snap.forEach(function(doc) { invites.push(doc.data()); });

    var h = '';
    if (!invites.length) { h = '<div style="font-size:11px;color:var(--muted)">No invites generated yet</div>'; }
    invites.forEach(function(inv) {
      var expired = isInviteExpired(inv);
      var statusColor = inv.status === "active" && !expired ? "var(--birdie)" : inv.status === "used" ? "var(--gold)" : "var(--red)";
      var statusText = expired && inv.status === "active" ? "EXPIRED" : (inv.status || "active").toUpperCase();

      h += '<div class="card"><div class="card-body">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--gold);letter-spacing:1px">' + inv.code + '</span>';
      h += '<span style="font-size:9px;font-weight:600;color:' + statusColor + '">' + statusText + '</span>';
      h += '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">By ' + escHtml(inv.createdByName || "Unknown");
      if (inv.usedBy) h += ' · Used';
      if (inv.expiresAt) {
        var exp = inv.expiresAt.toDate ? inv.expiresAt.toDate() : new Date(inv.expiresAt);
        h += ' · Exp ' + (exp.getMonth()+1) + '/' + exp.getDate();
      }
      h += '</div>';
      // Revoke button for active invites
      if (inv.status === "active" && !expired) {
        h += '<button class="btn-sm outline" style="margin-top:6px;font-size:9px;padding:4px 10px" onclick="revokeInviteAdmin(\'' + inv.code + '\')">Revoke</button>';
      }
      h += '</div></div>';
    });

    document.getElementById("adminInviteList").innerHTML = h;
  });
}

function revokeInviteAdmin(code) {
  if (!db || !confirm("Revoke invite " + code + "?")) return;
  db.collection("invites").doc(code).update({ status: "revoked" }).then(function() {
    Router.toast("Invite revoked");
    loadAdminInviteList();
  });
}

// ---- Course Management (admin) ----
function loadAdminCourses() {
  var el = document.getElementById("adminCourseList");
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading courses...</div>';

  if (!db) { el.innerHTML = '<div style="font-size:11px;color:var(--muted)">Requires Firebase</div>'; return; }

  db.collection("courses").get().then(function(snap) {
    var courses = [];
    snap.forEach(function(doc) { courses.push(Object.assign({_fsId: doc.id}, doc.data())); });

    // Sort by name
    courses.sort(function(a,b) { return (a.name||"").localeCompare(b.name||""); });

    // Flag duplicates — same name (case-insensitive)
    var nameCounts = {};
    courses.forEach(function(c) { var n=(c.name||"").toLowerCase(); nameCounts[n]=(nameCounts[n]||0)+1; });

    var h = '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">' + courses.length + ' courses in Firestore</div>';

    var dupCount = courses.filter(function(c){ return nameCounts[(c.name||"").toLowerCase()]>1; }).length;
    if (dupCount > 0) {
      h += '<div style="padding:8px 12px;background:rgba(var(--red-rgb),.1);border:1px solid rgba(var(--red-rgb),.2);border-radius:6px;font-size:11px;color:var(--red);margin-bottom:10px">';
      h += dupCount + ' duplicate name' + (dupCount>1?'s':'') + ' detected — keep the API-imported version, remove the rest.';
      h += '</div>';
    }

    courses.forEach(function(c) {
      var isDup = nameCounts[(c.name||"").toLowerCase()] > 1;
      var isApi = c.source === "golfcourseapi";
      var isQuick = c.quickAdd;
      var hasHoles = c.holes && c.holes.length === 18;
      var tagColor = isApi ? 'var(--birdie)' : isQuick ? 'var(--red)' : 'var(--muted)';
      var tagLabel = isApi ? 'API' : isQuick ? 'Manual' : 'Unknown';

      h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--border2);' + (isDup ? 'background:rgba(var(--red-rgb),.05)' : '') + '">';
      h += '<div style="min-width:0;flex:1">';
      h += '<div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(c.name||"Unknown") + (isDup ? ' <span style="font-size:9px;color:var(--red);font-weight:700">DUP</span>' : '') + '</div>';
      h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">';
      h += '<span style="color:' + tagColor + ';font-weight:600">' + tagLabel + '</span>';
      h += (c.loc ? ' · ' + escHtml(c.loc) : '');
      h += (c.rating ? ' · ' + c.rating + '/' + (c.slope||'—') : '');
      h += (hasHoles ? ' · Scorecard' : ' · No scorecard');
      h += '</div></div>';
      h += '<button onclick="adminDeleteCourse(\'' + c._fsId + '\',\'' + (c.name||'').replace(/'/g,"\\'") + '\')" style="flex-shrink:0;margin-left:8px;padding:4px 10px;font-size:10px;border-radius:4px;border:1px solid rgba(var(--red-rgb),.4);background:rgba(var(--red-rgb),.1);color:var(--red);cursor:pointer">Remove</button>';
      h += '</div>';
    });

    el.innerHTML = h || '<div style="font-size:11px;color:var(--muted)">No courses found</div>';
  }).catch(function(err) {
    var el2 = document.getElementById("adminCourseList");
    if (el2) el2.innerHTML = '<div style="font-size:11px;color:var(--red)">Error: ' + escHtml(err.message) + '</div>';
  });
}

function adminDeleteCourse(fsId, name) {
  if (!db || !confirm('Remove "' + name + '" from the course directory? This cannot be undone.')) return;
  PB.deleteCourse(fsId);
  db.collection("courses").doc(fsId).delete().then(function() {
    Router.toast('"' + name + '" removed');
    loadAdminCourses();
  }).catch(function(err) { Router.toast("Error: " + err.message); });
}

// ========== DATA RECOVERY TOOL (Commissioner only) ==========
// Scans Firestore for docs missing leagueId and tags them "the-parbaughs".
// Also fixes member docs missing leagues[] / activeLeague.

var _recoveryCollections = ["rounds","chat","trips","teetimes","wagers","bounties","challenges","scrambleTeams","calendar_events","scheduling_chat","social_actions","invites","syncrounds","liverounds","league_battles","tripscores","rangeSessions","course_reviews","photos"];

function runDataRecoveryScan() {
  if (!db || !currentProfile || currentProfile.role !== "commissioner") return;
  var el = document.getElementById("recoveryResult");
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Scanning Firestore...</div>';

  var report = {};
  var promises = [];
  var totalMissing = 0;
  var totalDocs = 0;

  _recoveryCollections.forEach(function(col) {
    var p = db.collection(col).get().then(function(snap) {
      var missing = 0;
      var wrongId = 0;
      var correct = 0;
      var total = snap.size;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.leagueId) missing++;
        else if (d.leagueId === "the-parbaughs") correct++;
        else wrongId++;
      });
      report[col] = { total: total, missing: missing, wrongId: wrongId, correct: correct };
      totalMissing += missing;
      totalDocs += total;
    }).catch(function(e) {
      report[col] = { total: 0, missing: 0, wrongId: 0, correct: 0, error: e.message };
    });
    promises.push(p);
  });

  // Also check members
  var memberPromise = db.collection("members").get().then(function(snap) {
    var membersNoLeague = 0;
    var membersTotal = snap.size;
    snap.forEach(function(doc) {
      var d = doc.data();
      if (!d.leagues || !d.leagues.length || !d.activeLeague) membersNoLeague++;
    });
    report["_members"] = { total: membersTotal, missing: membersNoLeague };
  });
  promises.push(memberPromise);

  // Check if founding league doc exists
  var leagueDocPromise = db.collection("leagues").doc("the-parbaughs").get().then(function(doc) {
    report["_leagueDoc"] = { exists: doc.exists, data: doc.exists ? doc.data() : null };
  });
  promises.push(leagueDocPromise);

  Promise.all(promises).then(function() {
    var h = '<div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:10px">Scan Complete</div>';
    h += '<div style="font-size:11px;color:var(--cream);margin-bottom:6px">Total docs scanned: <b>' + totalDocs + '</b> · Missing leagueId: <b style="color:var(--red)">' + totalMissing + '</b></div>';

    // League doc status
    if (report["_leagueDoc"]) {
      var ld = report["_leagueDoc"];
      h += '<div style="font-size:11px;margin-bottom:6px;color:' + (ld.exists ? 'var(--birdie)' : 'var(--red)') + '">Founding league doc: ' + (ld.exists ? 'EXISTS' : 'MISSING') + '</div>';
    }

    // Members status
    if (report["_members"]) {
      var mm = report["_members"];
      h += '<div style="font-size:11px;margin-bottom:10px;color:' + (mm.missing > 0 ? 'var(--red)' : 'var(--birdie)') + '">Members without leagues[]: ' + mm.missing + ' / ' + mm.total + '</div>';
    }

    h += '<table style="width:100%;font-size:10px;border-collapse:collapse">';
    h += '<tr style="border-bottom:1px solid var(--border);color:var(--muted)"><th style="text-align:left;padding:4px">Collection</th><th>Total</th><th>Missing</th><th>Wrong</th><th>OK</th></tr>';
    _recoveryCollections.forEach(function(col) {
      var r = report[col] || {};
      var rowColor = r.missing > 0 ? "var(--red)" : r.error ? "var(--muted2)" : "var(--birdie)";
      h += '<tr style="border-bottom:1px solid var(--border2)">';
      h += '<td style="padding:4px;color:var(--cream)">' + col + '</td>';
      h += '<td style="text-align:center;padding:4px">' + (r.total || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:' + (r.missing > 0 ? 'var(--red);font-weight:700' : 'var(--birdie)') + '">' + (r.missing || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:' + (r.wrongId > 0 ? 'var(--gold)' : 'var(--muted)') + '">' + (r.wrongId || 0) + '</td>';
      h += '<td style="text-align:center;padding:4px;color:var(--birdie)">' + (r.correct || 0) + '</td>';
      h += '</tr>';
    });
    h += '</table>';

    if (totalMissing > 0 || (report["_members"] && report["_members"].missing > 0) || (report["_leagueDoc"] && !report["_leagueDoc"].exists)) {
      h += '<button class="btn full green" style="margin-top:12px" onclick="runDataRecoveryFix()">Fix All (' + totalMissing + ' docs + members + league doc)</button>';
    } else {
      h += '<div style="margin-top:10px;font-size:11px;color:var(--birdie);text-align:center;font-weight:600">All data properly tagged. No recovery needed.</div>';
    }

    el.innerHTML = h;
    window._recoveryReport = report;
  });
}

function runDataRecoveryFix() {
  if (!db || !currentProfile || currentProfile.role !== "commissioner") return;
  var el = document.getElementById("recoveryResult");
  if (!el) return;
  if (!confirm("This will tag all untagged docs with leagueId:'the-parbaughs' and fix member profiles. Proceed?")) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Fixing data...</div>';

  var fixPromises = [];
  var fixCount = 0;

  // 1. Fix league-scoped collections — tag missing leagueId
  _recoveryCollections.forEach(function(col) {
    var p = db.collection(col).get().then(function(snap) {
      var batch = db.batch();
      var batchCount = 0;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (!d.leagueId) {
          batch.update(doc.ref, { leagueId: "the-parbaughs" });
          batchCount++;
        }
      });
      if (batchCount > 0) {
        fixCount += batchCount;
        return batch.commit();
      }
    }).catch(function(e) { pbWarn("[Recovery] Error fixing " + col + ":", e); });
    fixPromises.push(p);
  });

  // 2. Fix members — add leagues[] and activeLeague
  var memberFix = db.collection("members").get().then(function(snap) {
    var batch = db.batch();
    var batchCount = 0;
    snap.forEach(function(doc) {
      var d = doc.data();
      var updates = {};
      if (!d.leagues || !d.leagues.length) {
        updates.leagues = ["the-parbaughs"];
      }
      if (!d.activeLeague) {
        updates.activeLeague = "the-parbaughs";
      }
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        batchCount++;
      }
    });
    if (batchCount > 0) {
      fixCount += batchCount;
      return batch.commit();
    }
  }).catch(function(e) { pbWarn("[Recovery] Error fixing members:", e); });
  fixPromises.push(memberFix);

  // 3. Ensure founding league doc exists
  var leagueDocFix = db.collection("leagues").doc("the-parbaughs").get().then(function(doc) {
    if (!doc.exists) {
      // Collect all current member UIDs
      return db.collection("members").get().then(function(mSnap) {
        var allUids = [];
        mSnap.forEach(function(mDoc) { allUids.push(mDoc.id); });
        return db.collection("leagues").doc("the-parbaughs").set({
          name: "The Parbaughs",
          slug: "the-parbaughs",
          location: "York, PA",
          description: "The original. The founding league. Est. 2026.",
          founded: "2026-04-05",
          badge: "founding",
          tier: "crew",
          visibility: "private",
          commissioner: "1GE683EauXO8TVhcStKfWiCCcRl2",
          admins: ["1GE683EauXO8TVhcStKfWiCCcRl2"],
          memberCount: allUids.length,
          memberUids: allUids,
          inviteCode: "PB-FOUNDING",
          theme: "classic",
          createdAt: fsTimestamp(),
          settings: { seasons: true, parcoins: true, wagers: true, bounties: true, trashTalk: true }
        });
      });
    } else {
      // League doc exists — make sure memberUids is up to date
      return db.collection("members").get().then(function(mSnap) {
        var allUids = [];
        mSnap.forEach(function(mDoc) {
          var d = mDoc.data();
          if (d.leagues && d.leagues.indexOf("the-parbaughs") !== -1) {
            allUids.push(mDoc.id);
          }
        });
        if (allUids.length > 0) {
          return db.collection("leagues").doc("the-parbaughs").update({
            memberUids: allUids,
            memberCount: allUids.length
          });
        }
      });
    }
  }).catch(function(e) { pbWarn("[Recovery] Error fixing league doc:", e); });
  fixPromises.push(leagueDocFix);

  Promise.all(fixPromises).then(function() {
    el.innerHTML = '<div style="text-align:center;padding:16px">'
      + '<div style="font-size:14px;font-weight:700;color:var(--birdie);margin-bottom:8px">Recovery Complete</div>'
      + '<div style="font-size:11px;color:var(--cream)">Fixed ' + fixCount + ' documents</div>'
      + '<div style="font-size:10px;color:var(--muted);margin-top:4px">Founding league doc ensured. Member profiles updated.</div>'
      + '<button class="btn full outline" style="margin-top:12px" onclick="runDataRecoveryScan()">Run scan again to verify</button>'
      + '</div>';
    Router.toast("Recovery complete! " + fixCount + " docs fixed");
  }).catch(function(e) {
    el.innerHTML = '<div style="color:var(--red);font-size:11px;padding:12px">Recovery error: ' + escHtml(e.message) + '</div>';
  });
}

function bulkGenerateInvites() {
  if (!db || !currentUser) return;
  var count = parseInt(document.getElementById("bulkCount").value) || 5;
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var codes = [];
  var batch = db.batch();

  for (var i = 0; i < count; i++) {
    var code = "PB-";
    for (var j = 0; j < 8; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    codes.push(code);
    batch.set(db.collection("invites").doc(code), createInviteDoc(code));
  }

  batch.commit().then(function() {
    var h = '<div style="margin-top:12px">';
    codes.forEach(function(c) {
      h += '<div class="invite-code" style="margin-bottom:6px;padding:10px"><div class="code" style="font-size:14px">' + c + '</div></div>';
    });
    h += '<div style="font-size:10px;color:var(--muted);text-align:center;margin-top:6px">All expire in ' + INVITE_EXPIRY_DAYS + ' days</div>';
    h += '</div>';
    document.getElementById("bulkResult").innerHTML = h;
    Router.toast(count + " invites generated!");
    loadAdminInviteList();
  }).catch(function() { Router.toast("Failed to generate"); });
}
