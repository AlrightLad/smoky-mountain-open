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
  });
}

Router.register("teetimes", function() {
  var now = localDateStr();
  var threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
  
  var upcoming = liveTeeTimes.filter(function(t) { return t.date >= now && t.status !== "cancelled"; });
  var pastLimit = Math.max(3, 10 - upcoming.length);
  var past = liveTeeTimes.filter(function(t) { return (t.date < now || t.status === "completed") && t.status !== "cancelled"; }).slice(0, pastLimit);
  var recentlyCancelled = liveTeeTimes.filter(function(t) { 
    return t.status === "cancelled" && t.cancelledAt && t.cancelledAt >= threeDaysAgo;
  });

  var h = '<div class="sh"><h2>Tee Times</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'home\')">← Back</button><button class="btn-sm green" onclick="Router.go(\'tee-create\')">+ Post</button></div></div>';

  if (!upcoming.length) {
    h += '<div style="text-align:center;padding:32px 16px">';
    h += '<div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><circle cx="24" cy="24" r="18"/><path d="M24 14v10l7 4"/><path d="M38 10l-3 3M10 10l3 3"/></svg></div>';
    h += '<div style="font-size:16px;font-weight:700;color:var(--cream)">No Tee Times Posted</div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Post a tee time and your crew can RSVP. Never wonder who\u2019s playing this weekend again.</div>';
    h += '<button class="btn full green" style="margin-top:16px;max-width:280px;margin-left:auto;margin-right:auto" onclick="Router.go(\'tee-create\')">Post a Tee Time</button>';
    h += '<div style="margin-top:20px;text-align:left;max-width:280px;margin-left:auto;margin-right:auto">';
    h += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Example tee times</div>';
    var exTees = [
      "Honey Run \u00b7 Saturday 8:30 AM \u00b7 2 spots open",
      "Out Door CC \u00b7 Sunday 7:00 AM \u00b7 Need 3 more",
      "Heritage Hills \u00b7 Friday 3:00 PM \u00b7 All welcome"
    ];
    exTees.forEach(function(ex) {
      h += '<div style="padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:4px;font-size:11px;color:var(--muted);font-style:italic">' + ex + '</div>';
    });
    h += '</div></div>';
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
    h += '<button class="tee-rsvp-btn maybe' + (myResponse==="maybe"?" selected":"") + '" onclick="rsvpTeeTime(\'' + t._id + '\',\'maybe\')">Maybe/button>';
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
  courses.forEach(function(c) { h += '<option value="' + c.id + '">' + c.name + '</option>'; });
  h += '</select></div>';
  h += '<div class="ff"><label class="ff-label">Date</label><input type="date" id="teeDate" class="ff-input" min="' + localDateStr() + '" value="' + prefillDate + '"></div>';
  h += '<div class="ff"><label class="ff-label">Tee Time</label><input type="time" id="teeTime" class="ff-input"></div>';
  h += '<div class="ff"><label class="ff-label">Spots</label><select id="teeSpots" class="ff-input"><option value="2">2</option><option value="3">3</option><option value="4" selected>4</option><option value="5">5+</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Message (optional)</label><input type="text" id="teeMessage" class="ff-input" placeholder="Let\'s get after it" maxlength="100"></div>';
  h += '<div class="ff"><label class="ff-label">Visibility</label><select id="teeVisibility" class="ff-input"><option value="public">Public — visible to all members</option><option value="private">Private — only you and invitees</option></select></div>';
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
    // Notify all members about the new tee time
    var _teeCreatorName = currentProfile ? (currentProfile.name||currentProfile.username) : "A Parbaugh";
    PB.getPlayers().forEach(function(p) {
      if (p.id === (currentUser ? currentUser.uid : "") || isBannedRole(p)) return;
      sendNotification(p.id, { type: "tee_posted", title: "New Tee Time", message: _teeCreatorName + " posted: " + (course?course.name:"") + " · " + date + " · " + timeStr, page: "teetimes" });
    });
    Router.go("teetimes");
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
}

function rsvpTeeTime(teeId, response) {
  if (!currentUser || !db) return;
  var tee = liveTeeTimes.find(function(t){return t._id===teeId});
  var wasAccepted = tee && tee.responses && tee.responses[currentUser.uid] === "accepted";
  var field = "responses." + currentUser.uid; var update = {}; update[field] = response;
  db.collection("teetimes").doc(teeId).update(update).then(function() {
    Router.toast(response === "accepted" ? "You're in!" : response === "maybe" ? "Marked maybe" : "You're out");
    if (wasAccepted && response !== "accepted" && tee) {
      var others = Object.keys(tee.responses).filter(function(k){return tee.responses[k]==="accepted"&&k!==currentUser.uid});
      var name = currentProfile ? (currentProfile.name||currentProfile.username) : "A member";
      others.forEach(function(uid) { sendNotification(uid, { type:"tee_withdrawal", title:"Player Withdrew", message:name + " withdrew from " + (tee.courseName||"tee time") }); });
    }
  });
}

function cancelTeeTime(teeId) {
  if (!confirm("Cancel this tee time?")) return;
  var tee = liveTeeTimes.find(function(t){return t._id===teeId});
  db.collection("teetimes").doc(teeId).update({status:"cancelled", cancelledAt: localDateStr()}).then(function() {
    Router.toast("Cancelled");
    if (tee && tee.responses) {
      var ids = Object.keys(tee.responses).filter(function(k){return(tee.responses[k]==="accepted"||tee.responses[k]==="maybe")&&k!==(currentUser?currentUser.uid:"")});
      ids.forEach(function(uid) { sendNotification(uid, { type:"tee_cancelled", title:"Tee Time Cancelled", message:(tee.courseName||"Tee time") + " on " + tee.date + " was cancelled" }); });
    }
  });
}

function deleteTeeTime(teeId) {
  if (!isFounderRole(currentProfile)) { Router.toast("Commissioner only"); return; }
  if (!confirm("Permanently delete this tee time? This cannot be undone.")) return;
  db.collection("teetimes").doc(teeId).delete().then(function() {
    Router.toast("Deleted");
  }).catch(function() { Router.toast("Failed to delete"); });
}

function markOfficial(teeId) { db.collection("teetimes").doc(teeId).update({official:true}).then(function(){Router.toast("Marked official")}); }


