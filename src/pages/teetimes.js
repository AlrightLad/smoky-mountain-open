/* ================================================
   PHASE 5 PAGES: Tee Times, Calendar, DMs, Chat, Invite
   ================================================ */

// ========== TEE TIMES ==========
var liveTeeTimes = [];

function startTeeTimeListener() {
  if (!db) return;
  if (window._teeTimeUnsub) window._teeTimeUnsub();
  window._teeTimeUnsub = leagueQuery("teetimes").orderBy("date","asc").onSnapshot(function(snap) {
    liveTeeTimes = [];
    snap.forEach(function(doc) { liveTeeTimes.push(Object.assign({_id:doc.id}, doc.data())); });
    if (Router.getPage() === "teetimes") Router.go("teetimes", Router.getParams(), true);
  }, function(err) { if (typeof pbWarn === "function") pbWarn("[TeeTimes] listener error:", err && err.message); });
}

Router.register("teetimes", function() {
  var now = localDateStr();
  var threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
  
  // v8.18.0 / Ship 5+2 — visibility="private" enforcement.
  // Private tees visible only to creator + commissioner/admin/founder.
  var _myUid = currentUser ? currentUser.uid : null;
  var _amCommish = isFounderRole(currentProfile);
  function _canSeePrivate(t) {
    return t.visibility !== "private" || t.createdBy === _myUid || _amCommish;
  }

  var upcoming = liveTeeTimes.filter(function(t) {
    return t.date >= now && t.status !== "cancelled" && _canSeePrivate(t);
  });
  var pastLimit = Math.max(3, 10 - upcoming.length);
  var past = liveTeeTimes.filter(function(t) {
    return (t.date < now || t.status === "completed") && t.status !== "cancelled" && _canSeePrivate(t);
  }).slice(0, pastLimit);
  var recentlyCancelled = liveTeeTimes.filter(function(t) {
    return t.status === "cancelled" && t.cancelledAt && t.cancelledAt >= threeDaysAgo && _canSeePrivate(t);
  });

  // Header CTA discipline: when the empty-state hero is on screen it is the
  // single, unambiguous primary action, so the header carries ONLY "← Back" —
  // dropping the redundant "+ Post" entirely avoids two controls for the same
  // task sandwiching the Back button. Once tee times exist (no hero), the
  // header "+ Post" becomes the page's primary and stays brass (dark ink label
  // clears AA on the brass fill).
  // #41 v8.25.153 — editorial masthead is the SINGLE dominant H1 (was a legacy
  // .sh "Tee Times" h2 that competed with the empty-state "No Tee Times Posted"
  // title — the dual-H1 the critique flagged). Empty hero headline softened below.
  var _postBtn = upcoming.length
    ? '<button class="pb-btn-brass" style="font-size:13px;padding:9px 16px" onclick="Router.go(\'tee-create\')">+ Post</button>'
    : '';
  var h = '<div class="roster-masthead" style="padding-bottom:6px"><button class="back" onclick="Router.back(\'home\')" style="margin-bottom:12px">← Back</button><div class="roster-eyebrow">The tee sheet · RSVP</div><h1 class="roster-headline">Tee times.</h1>' + (_postBtn ? '<div style="margin-top:12px">' + _postBtn + '</div>' : '') + '</div>';

  if (!upcoming.length) {
    // Felt focal-peak hero; headline softened ("Rally the crew.") so the masthead
    // "Tee times." stays the page's single dominant title (dual-H1 fix). Clock on
    // brass-3, lone brass CTA.
    h += '<div style="padding:6px 16px 2px"><div class="pb-card pb-card--felt" style="padding:24px 22px;text-align:center">';
    h += '<div style="margin-bottom:10px;display:flex;justify-content:center"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--cb-brass-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="18"/><path d="M24 13.5v10.5l6.5 3.5"/><path d="M24 7v3M24 38v3M41 24h-3M10 24H7"/></svg></div>';
    h += '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:21px;color:var(--cb-chalk);line-height:1.15">Rally the crew.</div>';
    h += '<div style="font-family:var(--font-ui);font-size:13px;color:rgba(244,239,228,.84);margin:8px auto 0;line-height:1.5;max-width:320px">Post a tee time and your crew can RSVP \u2014 never wonder who\u2019s playing this weekend again.</div>';
    h += '<button class="pb-btn-brass" style="margin-top:16px" onclick="Router.go(\'tee-create\')">Post a tee time</button>';
    h += '</div></div>';
    h += '<div style="padding:6px 16px 2px"><div class="pb-card pb-card--recessed tt-preview">';
    h += '<div class="tt-preview-eyebrow">Preview · what a posted sheet looks like</div>';
    h += '<div class="tt-preview-hint">Tap <strong>Post a tee time</strong> above to add the first real one.</div>';
    h += '<div class="tt-preview-rows">';
    var exTees = [
      "Honey Run \u00b7 Saturday 8:30 AM \u00b7 2 spots open",
      "Out Door CC \u00b7 Sunday 7:00 AM \u00b7 Need 3 more",
      "Heritage Hills \u00b7 Friday 3:00 PM \u00b7 All welcome"
    ];
    // Sample cards are illustrative, not real bookings: the CARD body stays
    // visibly faded (so it never reads as tappable live data) and is made
    // non-interactive (pointer-events:none). MED-2: the fade was previously a
    // group `opacity:.55` on the whole row, which dragged the "SAMPLE" pill down
    // to ~2.37:1 — and because group opacity composites the child too, a child
    // `opacity:1` can't claw it back. So the fade is now applied per-element
    // (faded body via --cb-mute on the row + muted dot) while the pill is a
    // separate, full-strength chip: AA-legible --cb-mute-1 (5.09:1) ink on a
    // solid paper fill so the SAMPLE label reads clearly.
    exTees.forEach(function(ex) {
      h += '<div class="tt-preview-row" aria-hidden="true"><span class="tt-preview-dot"></span><span class="tt-preview-label">' + ex + '</span><span class="tt-preview-pill">Sample</span></div>';
    });
    h += '</div></div></div>';
  }
  upcoming.forEach(function(t) { h += '<div class="section">' + renderTeeCard(t) + '</div>'; });

  if (past.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Past</span></div>';
    past.forEach(function(t) { h += renderTeeCard(t, true); });
    h += '</div>';
  }
  
  if (recentlyCancelled.length) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--muted)">Recently Cancelled</span></div>';
    recentlyCancelled.forEach(function(t) { h += renderTeeCard(t, true, true); });
    h += '</div>';
  }
  
  h += renderPageFooter();
  document.querySelector('[data-page="teetimes"]').innerHTML = h;
});

function renderTeeCard(t, isPast, isCancelled) {
  var course = PB.getCourse(t.courseId) || PB.getCourseByName(t.courseName);
  var responses = t.responses || {};
  var acceptedIds = Object.keys(responses).filter(function(k) { return responses[k] === "accepted"; });
  var spotsLeft = (t.spots || 4) - acceptedIds.length;
  var myResponse = currentUser ? responses[currentUser.uid] : null;

  var h = '<div class="tee-card' + (t.official ? " official" : "") + '"' + (isCancelled ? ' style="opacity:.5"' : '') + '>';
  if (t.official) h += '<div class="tee-official-tag">Official Round</div>';
  if (isCancelled) h += '<div style="position:absolute;top:12px;right:12px;font-size:9px;font-weight:700;color:var(--red);background:rgba(var(--alert-rgb),.1);padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px">Cancelled</div>';
  h += '<div class="tee-course">' + escHtml(course ? course.name : t.courseName || "TBD") + '</div>';

  var dateObj = new Date(t.date + "T12:00:00");
  var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  h += '<div class="tee-datetime">' + days[dateObj.getDay()] + ", " + mons[dateObj.getMonth()] + " " + dateObj.getDate() + " · " + (t.time||"TBD") + '</div>';
  if (t.message) h += '<div class="tee-message">"' + escHtml(t.message) + '"</div>';

  var host = PB.getPlayer(t.createdBy);
  h += '<div class="tee-host">Posted by ' + escHtml(host ? host.name : t.createdByName || "Unknown") + ' · ';
  if (isCancelled) {
    h += '<span style="color:var(--red);font-size:10px">Cancelled</span></div>';
  } else {
    h += '<span class="tee-status ' + (t.status||"open") + '">' + (spotsLeft > 0 ? spotsLeft + " spot" + (spotsLeft>1?"s":"") + " open" : "FULL") + '</span></div>';
  }

  h += '<div class="tee-spots">';
  for (var i = 0; i < (t.spots||4); i++) {
    if (i < acceptedIds.length) {
      var m = PB.getPlayer(acceptedIds[i]);
      h += '<div class="tee-spot filled">' + (m ? renderAvatar(m, 36, false) : "Done") + '</div>';
    } else h += '<div class="tee-spot open">+</div>';
  }
  h += '</div>';

  if (!isPast && !isCancelled && t.status !== "cancelled" && t.status !== "completed") {
    h += '<div class="tee-rsvp-row">';
    h += '<button class="tee-rsvp-btn accept' + (myResponse==="accepted"?" selected":"") + '" onclick="rsvpTeeTime(\'' + t._id + '\',\'accepted\')">In</button>';
    h += '<button class="tee-rsvp-btn maybe' + (myResponse==="maybe"?" selected":"") + '" onclick="rsvpTeeTime(\'' + t._id + '\',\'maybe\')">Maybe</button>';
    h += '<button class="tee-rsvp-btn decline' + (myResponse==="declined"?" selected":"") + '" onclick="rsvpTeeTime(\'' + t._id + '\',\'declined\')">Out</button>';
    h += '</div>';

    var maybeIds = Object.keys(responses).filter(function(k){return responses[k]==="maybe"});
    var declinedIds = Object.keys(responses).filter(function(k){return responses[k]==="declined"});
    if (maybeIds.length || declinedIds.length) {
      h += '<div style="margin-top:8px;font-size:10px;color:var(--muted)">';
      if (maybeIds.length) h += 'Maybe: ' + maybeIds.map(function(id){var m=PB.getPlayer(id);return m?m.name:"?";}).join(", ");
      if (declinedIds.length) { if (maybeIds.length) h += ' · '; h += 'Out: ' + declinedIds.map(function(id){var m=PB.getPlayer(id);return m?m.name:"?";}).join(", "); }
      h += '</div>';
    }

    if (currentUser && (t.createdBy === currentUser.uid || isFounderRole(currentProfile))) {
      h += '<div style="margin-top:10px;text-align:right">';
      h += '<button style="background:none;border:none;color:var(--muted);font-size:10px;text-decoration:underline;cursor:pointer" onclick="cancelTeeTime(\'' + t._id + '\')">Cancel</button>';
      if (isFounderRole(currentProfile) && !t.official) {
        h += ' <button style="background:none;border:none;color:var(--gold);font-size:10px;text-decoration:underline;cursor:pointer;margin-left:8px" onclick="markOfficial(\'' + t._id + '\')">Mark Official</button>';
      }
      h += '</div>';
    }
  }
  
  // Commissioner-only hard delete for cancelled or past tee times
  if ((isCancelled || isPast) && isFounderRole(currentProfile)) {
    h += '<div style="margin-top:8px;text-align:right">';
    h += '<button style="background:none;border:none;color:var(--red);font-size:10px;text-decoration:underline;cursor:pointer;opacity:.7" onclick="deleteTeeTime(\'' + t._id + '\')">Delete permanently</button>';
    h += '</div>';
  }
  
  h += '</div>';
  return h;
}

Router.register("tee-create", function(params) {
  var courses = PB.getCourses();
  var prefillDate = (params && params.date) ? params.date : "";
  var h = '<div class="sh"><h2>Post Tee Time</h2><button class="back" onclick="Router.back(\'teetimes\')">← Back</button></div>';
  h += '<div class="form-section">';
  h += '<div class="ff"><label class="ff-label">Course</label><select id="teeCourse" class="ff-input">';
  courses.forEach(function(c) { h += '<option value="' + escHtml(c.id) + '">' + escHtml(c.name) + '</option>'; });
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Date</label><input type="date" id="teeDate" class="ff-input" min="' + localDateStr() + '" value="' + prefillDate + '"></div>';
  h += '<div class="ff"><label class="ff-label">Tee Time</label><input type="time" id="teeTime" class="ff-input"></div>';
  h += '<div class="ff"><label class="ff-label">Spots</label><select id="teeSpots" class="ff-input"><option value="2">2</option><option value="3">3</option><option value="4" selected>4</option><option value="5">5+</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Message (optional)</label><input type="text" id="teeMessage" class="ff-input" placeholder="Let\'s get after it" maxlength="100"></div>';
  h += '<div class="ff"><label class="ff-label">Visibility</label><select id="teeVisibility" class="ff-input"><option value="public">Public: visible to all members</option><option value="private">Private: only you and invitees</option></select></div>';
  h += '<button class="btn full green" onclick="submitTeeTime()">Post Tee Time</button>';
  h += '</div>';
  document.querySelector('[data-page="tee-create"]').innerHTML = h;
});

function submitTeeTime() {
  var courseId = document.getElementById("teeCourse").value;
  var date = document.getElementById("teeDate").value;
  var time = document.getElementById("teeTime").value;
  var spots = parseInt(document.getElementById("teeSpots").value);
  var message = document.getElementById("teeMessage").value.trim();
  var visibility = document.getElementById("teeVisibility").value || "public";
  if (!date) { Router.toast("Pick a date"); return; }
  if (!time) { Router.toast("Pick a tee time"); return; }
  var course = PB.getCourse(courseId);
  var timeParts = time.split(":"); var hr = parseInt(timeParts[0]); var ampm = hr >= 12 ? "PM" : "AM";
  if (hr > 12) hr -= 12; if (hr === 0) hr = 12;
  var timeStr = hr + ":" + timeParts[1] + " " + ampm;
  var tee = { courseId:courseId, courseName:course?course.name:courseId, date:date, time:timeStr, spots:spots, message:message, visibility:visibility, status:"open", official:false, createdBy:currentUser?currentUser.uid:"anon", createdByName:currentProfile?(currentProfile.name||currentProfile.username):"Anon", responses:{}, createdAt:fsTimestamp() };
  if (currentUser) tee.responses[currentUser.uid] = "accepted";
  db.collection("teetimes").add(leagueDoc("teetimes", tee)).then(function() {
    Router.toast("Tee time posted!");
    // Notify members about the new tee time.
    // v8.17.0 Path B+ hardening — two-layer scope (league + test/real boundary),
    // same pattern as rounds.js:387 round_posted broadcast. (V13.3 audit miss —
    // patched in immediate followup; teetimes.js wasn't covered by a8709bc.)
    var _teeCreatorName = currentProfile ? (currentProfile.name||currentProfile.username) : "A Parbaugh";
    var _teeLeagueId = (typeof getActiveLeague === "function" ? getActiveLeague() : null);
    var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
    PB.getPlayers().forEach(function(p) {
      if (p.id === (currentUser ? currentUser.uid : "") || isBannedRole(p)) return;
      // 1. League scope: only notify members of the tee time's league
      if (_teeLeagueId && (!p.leagues || p.leagues.indexOf(_teeLeagueId) === -1)) return;
      // 2. Don't broadcast across the test/real account boundary
      if (!!p.isTestAccount !== _writerIsTest) return;
      sendNotification(p.id, { type: "tee_posted", title: "New Tee Time", message: _teeCreatorName + " posted: " + (course?course.name:"") + " · " + date + " · " + timeStr, page: "teetimes" });
    });
    Router.go("teetimes");
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't post the tee time.")); });
}

function rsvpTeeTime(teeId, response) {
  if (!currentUser || !db) return;
  var tee = liveTeeTimes.find(function(t){return t._id===teeId});
  var wasAccepted = tee && tee.responses && tee.responses[currentUser.uid] === "accepted";
  var field = "responses." + currentUser.uid;
  var update = {};
  update[field] = response;
  db.collection("teetimes").doc(teeId).update(update).then(function() {
    Router.toast(response === "accepted" ? "You're in!" : response === "maybe" ? "Marked maybe" : "You're out");

    // v8.18.0 / Ship 5+2 — tee_rsvp notification to creator on accepted RSVP.
    // Suppress when creator RSVPs to own tee (auto-RSVP at create time).
    if (response === "accepted" && tee && tee.createdBy && tee.createdBy !== currentUser.uid) {
      var rsvperName = currentProfile ? (currentProfile.name || currentProfile.username) : "A member";
      sendNotification(tee.createdBy, {
        type: "tee_rsvp",
        title: rsvperName + " is in",
        message: (tee.courseName || "Tee time") + " · " + tee.date + " · " + (tee.time || ""),
        page: "teetimes"
      });
    }

    // Withdrawal cascade — when an accepted RSVP changes to maybe/declined.
    // v8.18.0 / Ship 5+2 — two-layer filter (league + test/real boundary)
    // matches v8.17.0 tee_posted hardening pattern. Defense-in-depth.
    if (wasAccepted && response !== "accepted" && tee) {
      var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
      var _teeLeagueId = tee.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
      var name = currentProfile ? (currentProfile.name || currentProfile.username) : "A member";
      Object.keys(tee.responses).forEach(function(uid) {
        if (tee.responses[uid] !== "accepted") return;
        if (uid === currentUser.uid) return;
        var p = PB.getPlayer(uid);
        if (!p) return;
        if (_teeLeagueId && (!p.leagues || p.leagues.indexOf(_teeLeagueId) === -1)) return;
        if (!!p.isTestAccount !== _writerIsTest) return;
        sendNotification(uid, {
          type: "tee_withdrawal",
          title: "Player Withdrew",
          message: name + " withdrew from " + (tee.courseName || "tee time"),
          page: "teetimes"
        });
      });
    }
  }).catch(function(err) {
    pbWarn("[teetimes] RSVP failed:", err && err.message);
    Router.toast("Couldn't RSVP, please try again");
  });
}

function cancelTeeTime(teeId, _confirmed) {
  // v8.24.15 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Cancel this tee time?", message: "Members who RSVP'd will see it disappear from the sheet.", confirmLabel: "Cancel it", danger: false })
      .then(function(ok) { if (ok) cancelTeeTime(teeId, true); });
    return;
  }
  var tee = liveTeeTimes.find(function(t){return t._id===teeId});
  db.collection("teetimes").doc(teeId).update({status:"cancelled", cancelledAt: localDateStr()}).then(function() {
    Router.toast("Cancelled");
    // v8.18.0 / Ship 5+2 — two-layer filter (league + test/real boundary)
    // matches v8.17.0 tee_posted hardening. Adds explicit page: field
    // (was relying on NOTIFICATION_META fallback).
    if (tee && tee.responses) {
      var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
      var _teeLeagueId = tee.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
      Object.keys(tee.responses).forEach(function(uid) {
        var st = tee.responses[uid];
        if (st !== "accepted" && st !== "maybe") return;
        if (uid === (currentUser ? currentUser.uid : "")) return;
        var p = PB.getPlayer(uid);
        if (!p) return;
        if (_teeLeagueId && (!p.leagues || p.leagues.indexOf(_teeLeagueId) === -1)) return;
        if (!!p.isTestAccount !== _writerIsTest) return;
        sendNotification(uid, {
          type: "tee_cancelled",
          title: "Tee Time Cancelled",
          message: (tee.courseName || "Tee time") + " on " + tee.date + " was cancelled",
          page: "teetimes"
        });
      });
    }
  }).catch(function(err) {
    pbWarn("[teetimes] cancel failed:", err && err.message);
    Router.toast("Couldn't cancel, please try again");
  });
}

function deleteTeeTime(teeId, _confirmed) {
  if (!isFounderRole(currentProfile)) { Router.toast("Commissioner only"); return; }
  // v8.24.15 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Delete this tee time?", message: "Permanent — this cannot be undone.", confirmLabel: "Delete", danger: true })
      .then(function(ok) { if (ok) deleteTeeTime(teeId, true); });
    return;
  }
  db.collection("teetimes").doc(teeId).delete().then(function() {
    Router.toast("Deleted");
  }).catch(function() { Router.toast("Failed to delete"); });
}

function markOfficial(teeId) {
  db.collection("teetimes").doc(teeId).update({official:true}).then(function() {
    Router.toast("Marked official");
  }).catch(function(err) {
    pbWarn("[teetimes] markOfficial failed:", err && err.message);
    Router.toast("Couldn't mark official, please try again");
  });
}


