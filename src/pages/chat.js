Router.register("chat", function() {
  var h = '';
  
  // Compact upcoming events/calendar strip at the top
  var now = new Date();
  var todayStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
  var upcomingEvents = [];
  
  // Gather next 14 days of events
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled" || t.date < todayStr) return;
    upcomingEvents.push({date: t.date, title: t.courseName || "Tee Time", time: t.time || "", type: "tee", spots: t.spots || 4, responses: t.responses || {}});
  });
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var endDate = trip.endDate || trip.startDate;
    if (trip.startDate >= todayStr || endDate >= todayStr) {
      var displayDate = trip.startDate >= todayStr ? trip.startDate : todayStr;
      var isLive = trip.startDate <= todayStr && endDate >= todayStr;
      upcomingEvents.push({date: displayDate, title: trip.name, time: isLive ? "Happening now" : "", type: "trip", tripId: trip.id, isLive: isLive});
    }
  });
  upcomingEvents.sort(function(a,b) { return a.date > b.date ? 1 : -1; });
  upcomingEvents = upcomingEvents.slice(0, 5);
  
  // Header
  h += '<div class="sh"><h2>Clubhouse</h2><button class="btn-sm outline" onclick="toggleClubhouseCal()" id="calToggleBtn" style="font-size:10px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Calendar</button></div>';
  
  // Inline expandable calendar
  h += '<div id="clubhouseCal" style="display:none;padding:0 16px 12px;transition:max-height .3s ease">';
  
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayLabels = ["S","M","T","W","T","F","S"];
  
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
  h += '<div onclick="clubCalPrev()" style="cursor:pointer;padding:6px 10px;color:var(--muted);font-size:16px">‹</div>';
  h += '<div id="clubCalTitle" style="font-size:13px;font-weight:600;color:var(--gold)">' + monthNames[calMonth] + ' ' + calYear + '</div>';
  h += '<div onclick="clubCalNext()" style="cursor:pointer;padding:6px 10px;color:var(--muted);font-size:16px">›</div></div>';
  h += '<div style="text-align:right;padding:0 4px 6px"><button id="calRangeModeBtn" onclick="toggleCalRangeMode()" style="background:transparent;border:1px solid var(--border);color:var(--muted);font:500 9px/1 Inter,sans-serif;padding:4px 10px;border-radius:4px;cursor:pointer;letter-spacing:.3px">' + (calRangeMode ? '× Cancel Range' : 'Select Range') + '</button></div>';
  
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;margin-bottom:4px">';
  dayLabels.forEach(function(d) { h += '<div style="font-size:9px;color:var(--muted2);padding:4px 0">' + d + '</div>'; });
  h += '</div>';
  
  h += '<div id="clubCalGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">';
  h += renderClubCalGrid(calYear, calMonth, todayStr, upcomingEvents);
  h += '</div>';
  
  h += '<div id="clubCalEvents" style="margin-top:8px"></div>';
  h += '</div>';
  
  // Upcoming events strip
  if (upcomingEvents.length) {
    h += '<div style="padding:0 16px 12px">';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Coming Up</div>';
    h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
    upcomingEvents.forEach(function(ev) {
      var dateObj = new Date(ev.date + "T12:00:00");
      var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var dayDiff = Math.ceil((dateObj - now) / 86400000);
      var dayLabel = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : days[dateObj.getDay()];
      var dotColor = ev.type === "trip" ? "var(--gold)" : ev.type === "tee" ? "var(--birdie)" : "var(--muted)";
      var accepted = ev.responses ? Object.keys(ev.responses).filter(function(k){return ev.responses[k]==="accepted"}).length : 0;
      
      var clickAction = ev.type === "trip" && ev.tripId ? "Router.go('scorecard',{tripId:'" + ev.tripId + "'})" : "Router.go('teetimes')";
      h += '<div onclick="' + clickAction + '" style="flex-shrink:0;min-width:140px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:6px;height:6px;border-radius:50%;background:' + dotColor + '"></div>';
      h += '<span style="font-size:10px;color:var(--gold);font-weight:600">' + dayLabel + ', ' + mons[dateObj.getMonth()] + ' ' + dateObj.getDate() + '</span></div>';
      h += '<div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(ev.title) + '</div>';
      if (ev.time) h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.time + (ev.spots ? ' · ' + accepted + '/' + ev.spots : '') + '</div>';
      h += '</div>';
    });
    h += '</div></div>';
  } else {
    h += '<div style="padding:0 16px 10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px;color:var(--muted)">';
    h += '<span>No tee times on the books.</span>';
    h += '<span style="color:var(--gold);font-weight:600;cursor:pointer" onclick="Router.go(\'tee-create\')">Post one →</span>';
    h += '</div>';
  }
  
  // Chat feed
  h += '<div style="margin:0 16px 6px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Trash Talk</div></div>';
  h += '<div id="chatFeed" class="section">' + skeletonFeed() + '</div>';
  h += '<div class="chat-input-row"><input type="text" id="chatInput" maxlength="500" placeholder="Talk trash..." onkeydown="if(event.key===\'Enter\')sendChat()"><button onclick="sendChat()">Send</button></div>';
  document.querySelector('[data-page="chat"]').innerHTML = h;

  // Start listener
  if (db) {
    if (window._chatFeedUnsub) window._chatFeedUnsub();
    window._chatFeedUnsub = leagueQuery("chat").orderBy("createdAt","desc").limit(50).onSnapshot(function(snap) {
      liveChat = [];
      snap.forEach(function(doc){
        var d = doc.data();
        // Filter out auto-generated system messages — clubhouse is for human conversation only
        if (d.authorId === "system" || d.system) return;
        if (d.authorName === "Parbaughs" || d.authorName === "The Caddy") return;
        if (d.isStory) return; // post-round stories go to activity feed, not chat
        liveChat.push(Object.assign({_docId:doc.id}, d));
      });
      // Keep newest-first order (no reverse)
      var feed = document.getElementById("chatFeed");
      if (feed && Router.getPage() === "chat") {
        feed.innerHTML = renderChatMessages(liveChat);
      }
    });
  }
});

var clubCalOpen = false;
var clubCalSelectedDate = null;
var clubCalRangeStart = null;
var clubCalRangeEnd = null;
var calRangeMode = false;

// Extracted to src/pages/chat-calendar.js per W1.A5. Originally lines 116-469 of this file.

// v8.24.36 — relative timestamps for the chat feed. Within today show the
// time alone; yesterday and older days carry just enough date to orient.
function chatRelTime(d) {
  var now = new Date();
  var hr = d.getHours() % 12 || 12;
  var ampm = d.getHours() >= 12 ? "PM" : "AM";
  var time = hr + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ampm;
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var dayDiff = Math.round((startOfToday - startOfThat) / 86400000);
  if (dayDiff <= 0) return time;
  if (dayDiff === 1) return "Yesterday · " + time;
  var mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (d.getFullYear() === now.getFullYear()) return mn[d.getMonth()] + " " + d.getDate() + " · " + time;
  return mn[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

// v8.24.36 — author-group stacking. Consecutive messages from one member
// within 5 minutes share a single card and header (avatar + name + time),
// like any modern group chat, instead of repeating the full header per
// message. The feed stays newest-first BETWEEN groups (Founder's chat-order
// decision); WITHIN a group messages read top-down in the order they were
// said. Every per-message feature (kudos, comments, delete) survives on its
// own message line. The old per-message isSystem branch was dead code — the
// snapshot listener filters system/Caddy messages before render.
var CHAT_GROUP_WINDOW_MS = 5 * 60 * 1000;

function renderChatMessages(messages) {
  if (!messages.length) return '<div class="card chat-empty-card"><div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-text">No messages yet. Start the trash talk.</div></div></div>';

  // Fold the newest-first list into author groups. messages[i] is NEWER than
  // messages[i+1], so a group extends while the next (older) message is by
  // the same author and within the window of the group's oldest message.
  var groups = [];
  messages.forEach(function(msg) {
    var t = (msg.createdAt && msg.createdAt.toDate) ? msg.createdAt.toDate().getTime() : null;
    // v8.24.48 — round chips (option B) stand alone: never grouped into a
    // member's message run, never start one. Rendered as a quiet single line.
    if (msg.type === "round_chip") {
      groups.push({ chip: msg, newestT: t });
      return;
    }
    var last = groups[groups.length - 1];
    if (last && !last.chip && last.authorId === msg.authorId && t !== null && last.oldestT !== null
        && (last.oldestT - t) < CHAT_GROUP_WINDOW_MS) {
      last.msgs.push(msg);
      last.oldestT = t;
    } else {
      groups.push({ authorId: msg.authorId, authorName: msg.authorName || msg.user || "Member", msgs: [msg], newestT: t, oldestT: t });
    }
  });

  var ch = '';
  groups.forEach(function(g) {
    // Round chip — one muted line: flag glyph, name, score, course; kudos
    // rides the same likes mechanism as messages (same collection + docId).
    if (g.chip) {
      var chip = g.chip;
      var cLikes = chip.likes || [];
      var cILiked = currentUser && cLikes.indexOf(currentUser.uid) !== -1;
      var chipTime = (chip.createdAt && chip.createdAt.toDate) ? chatRelTime(chip.createdAt.toDate()) : "";
      ch += '<div style="display:flex;align-items:center;gap:8px;padding:7px 16px;margin-bottom:8px;font-size:11px;color:var(--muted)">';
      ch += '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="var(--gold)" stroke-width="1.5" style="flex-shrink:0"><path d="M5 14V2l7 2.5L5 7"/></svg>';
      ch += '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="font-weight:600;color:var(--cream)">' + escHtml(chip.authorName || "Member") + '</span> — ' + escHtml(chip.text || "") + (chipTime ? ' <span style="color:var(--muted2)">· ' + chipTime + '</span>' : '') + '</span>';
      if (chip.roundId) ch += '<span style="cursor:pointer;color:var(--gold);font-weight:600;padding:6px 4px" onclick="event.stopPropagation();Router.go(\'round\',{id:\'' + String(chip.roundId).replace(/[^A-Za-z0-9_-]/g, '') + '\'})">view</span>';
      ch += '<span style="cursor:pointer;color:' + (cILiked ? 'var(--gold)' : 'var(--muted2)') + ';padding:6px 0 6px 4px;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation();toggleLike(\'' + chip._docId + '\')"><svg viewBox="0 0 16 16" width="11" height="11" fill="' + (cILiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>' + (cLikes.length ? ' ' + cLikes.length : '') + '</span>';
      ch += '</div>';
      return;
    }
    var m = PB.getPlayer(g.authorId);
    var mLvl = m ? PB.calcLevelFromXP(PB.getPlayerXPForDisplay(m.id)) : null;
    var isCommissioner = isFounderRole(currentProfile);

    ch += '<div class="card" style="margin-bottom:8px"><div style="padding:10px 14px">';
    // Group header — once per author run
    ch += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:2px">';
    ch += renderAvatar(m, 32, true);
    ch += '<div style="flex:1;min-width:0"><div class="chat-author">' + escHtml(g.authorName)
        + (mLvl ? ' <span style="font-size:8px;color:var(--gold);font-weight:600">LV' + mLvl.level + '</span>' : '') + '</div>';
    if (g.newestT !== null) ch += '<div class="chat-time" style="margin-top:1px">' + chatRelTime(new Date(g.newestT)) + '</div>';
    ch += '</div></div>';

    // Message lines — oldest first within the group so the run reads top-down
    for (var gi = g.msgs.length - 1; gi >= 0; gi--) {
      var msg = g.msgs[gi];
      var likes = msg.likes || [];
      var iLiked = currentUser && likes.indexOf(currentUser.uid) !== -1;
      var comments = msg.comments || [];
      var isMine = currentUser && msg.authorId === currentUser.uid;

      ch += '<div style="padding:2px 0 2px 42px">';
      ch += '<div style="display:flex;align-items:baseline;gap:10px">';
      ch += '<div class="chat-text" style="flex:1;min-width:0">' + escHtml(msg.text) + '</div>';
      // Slim inline actions — kudos / comment / delete, right-aligned per line
      ch += '<div style="display:flex;gap:10px;flex-shrink:0;align-items:center">';
      ch += '<span style="font-size:11px;cursor:pointer;color:' + (iLiked ? 'var(--gold)' : 'var(--muted)') + ';padding:6px 0;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation();toggleLike(\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="' + (iLiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>' + (likes.length ? ' ' + likes.length : '') + '</span>';
      ch += '<span style="font-size:11px;cursor:pointer;color:var(--muted);padding:6px 0;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation();showCommentInput(\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg>' + (comments.length ? ' ' + comments.length : '') + '</span>';
      if (isCommissioner || isMine) {
        ch += '<span id="del-' + msg._docId + '" style="font-size:11px;cursor:pointer;color:var(--muted2);padding:6px 0;display:flex;align-items:center" onclick="event.stopPropagation();confirmDelete(this,\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></span>';
      }
      ch += '</div></div>';

      // Comments under their message line
      if (comments.length) {
        ch += '<div style="margin-top:4px">';
        var commentLikes = msg.commentLikes || {};
        comments.forEach(function(c, ci) {
          var canDeleteComment = (currentUser && c.uid === currentUser.uid) || isCommissioner;
          var cLikes = commentLikes[String(ci)] || [];
          var cILiked = currentUser && cLikes.indexOf(currentUser.uid) !== -1;
          var cTimeStr = c.at ? chatRelTime(new Date(c.at)) : "";
          ch += '<div style="padding:4px 0;font-size:11px">';
          ch += '<div style="display:flex;gap:6px;align-items:flex-start">';
          ch += '<span style="color:var(--gold);font-weight:600;flex-shrink:0">' + escHtml(c.name || "Anon") + '</span>';
          ch += '<span style="color:var(--cream);flex:1">' + escHtml(c.text) + '</span>';
          ch += '</div>';
          ch += '<div style="display:flex;gap:12px;margin-top:3px;padding:2px 0">';
          if (cTimeStr) ch += '<span style="font-size:9px;color:var(--muted2)">' + cTimeStr + '</span>';
          ch += '<span style="font-size:9px;cursor:pointer;padding:2px 4px;color:' + (cILiked ? 'var(--gold)' : 'var(--muted2)') + ';display:flex;align-items:center;gap:2px" onclick="event.stopPropagation();toggleCommentLike(\'' + msg._docId + '\',' + ci + ')"><svg viewBox="0 0 16 16" width="9" height="9" fill="' + (cILiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>' + (cLikes.length ? ' ' + cLikes.length : '') + '</span>';
          ch += '<span style="font-size:9px;cursor:pointer;padding:2px 4px;color:var(--muted2);display:flex;align-items:center;gap:2px" onclick="event.stopPropagation();replyToComment(\'' + msg._docId + '\',\'' + escHtml((c.name || "Anon").replace(/'/g, "\\'")) + '\')"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8L2 11V5.5A1.5 1.5 0 013.5 4h9A1.5 1.5 0 0114 5.5v4a1.5 1.5 0 01-1.5 1.5H7z"/></svg> Reply</span>';
          if (canDeleteComment) {
            ch += '<span style="color:var(--muted2);cursor:pointer;font-size:9px" onclick="event.stopPropagation();confirmDeleteComment(this,\'' + msg._docId + '\',' + ci + ')"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></span>';
          }
          ch += '</div>';
          ch += '</div>';
        });
        ch += '</div>';
      }

      // Comment input area (hidden by default)
      ch += '<div id="comment-' + msg._docId + '" style="display:none;margin-top:6px;gap:6px">';
      ch += '<input type="text" class="ff-input" style="flex:1;padding:6px 10px;font-size:11px" id="commentText-' + msg._docId + '" placeholder="Add a comment..." onkeydown="if(event.key===\'Enter\')submitComment(\'' + msg._docId + '\')">';
      ch += '<button class="btn-sm green" style="font-size:10px;padding:6px 10px" onclick="submitComment(\'' + msg._docId + '\')">Post</button>';
      ch += '</div>';

      ch += '</div>';
    }

    ch += '</div></div>';
  });
  return ch;
}

function toggleLike(docId) {
  if (!db || !currentUser) { Router.toast("Sign in to give kudos"); return; }
  var uid = currentUser.uid;

  // v8.19.0 (Ship 5+3) — snapshot pre-write state for rollback on rejection.
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  var prevLikes = (localMsg && localMsg.likes) ? localMsg.likes.slice() : null;

  // Optimistic UI update — update local data immediately
  if (localMsg) {
    if (!localMsg.likes) localMsg.likes = [];
    var localIdx = localMsg.likes.indexOf(uid);
    if (localIdx !== -1) localMsg.likes.splice(localIdx, 1);
    else localMsg.likes.push(uid);
    // Re-render feed immediately
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
  }

  function _revertLikes() {
    if (localMsg) {
      if (prevLikes === null) delete localMsg.likes;
      else localMsg.likes = prevLikes;
      var feed = document.getElementById("chatFeed");
      if (feed) feed.innerHTML = renderChatMessages(liveChat);
    }
  }

  // Then sync to Firestore
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var likes = data.likes || [];
    var idx = likes.indexOf(uid);
    var isLiking = idx === -1;
    if (idx !== -1) { likes.splice(idx, 1); } else { likes.push(uid); }
    return db.collection("chat").doc(docId).update({ likes: likes }).then(function() {
      if (isLiking && data.authorId && data.authorId !== uid && data.authorId !== "system") {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        sendNotification(data.authorId, {
          type: "feed_like",
          title: "New Kudos",
          message: myName + " gave kudos to your post",
          page: "chat"
        });
      }
    });
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[chat] toggleLike failed:", err && err.message);
    _revertLikes();
    Router.toast("Couldn't add kudos, please try again");
  });
}

function showCommentInput(docId, isReply) {
  // Close all other open comment inputs
  document.querySelectorAll('[id^="comment-"]').forEach(function(el) {
    if (el.id.indexOf("commentText") !== -1) return;
    if (el.id !== "comment-" + docId) {
      el.style.display = "none";
      var inp = el.querySelector("input");
      if (inp) inp.value = "";
    }
  });
  var el = document.getElementById("comment-" + docId);
  if (!el) return;
  var isHidden = el.style.display === "none" || el.style.display === "";
  el.style.display = isHidden ? "flex" : "none";
  if (isHidden) {
    var input = document.getElementById("commentText-" + docId);
    if (input) {
      if (!isReply) input.value = "";
      input.focus();
    }
  }
}

function submitComment(docId) {
  if (!db || !currentUser) { Router.toast("Sign in to comment"); return; }
  var input = document.getElementById("commentText-" + docId);
  var text = input ? input.value.trim() : "";
  if (!text) return;

  var name = currentProfile ? PB.getDisplayName(currentProfile) : "Anon";
  var newComment = { uid: currentUser.uid, name: name, text: text, at: new Date().toISOString() };

  // v8.19.0 (Ship 5+3) — snapshot pre-write state for rollback on rejection.
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  var prevComments = (localMsg && localMsg.comments) ? localMsg.comments.slice() : null;

  // Optimistic local update — append comment to liveChat immediately so it renders before Firestore roundtrip
  if (localMsg) {
    if (!localMsg.comments) localMsg.comments = [];
    localMsg.comments.push(newComment);
    // Re-render feed in-place with updated data
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
    // Re-show the comment input and scroll to it
    var commentEl = document.getElementById("comment-" + docId);
    if (commentEl) { commentEl.style.display = "flex"; }
    var newInput = document.getElementById("commentText-" + docId);
    if (newInput) { newInput.value = ""; newInput.focus(); }
  } else if (input) {
    input.value = "";
  }

  function _revertComments() {
    if (localMsg) {
      if (prevComments === null) delete localMsg.comments;
      else localMsg.comments = prevComments;
      var feed = document.getElementById("chatFeed");
      if (feed) feed.innerHTML = renderChatMessages(liveChat);
    }
  }

  // Write to Firestore (snapshot listener will reconcile if needed)
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var comments = data.comments || [];
    comments.push(newComment);
    return db.collection("chat").doc(docId).update({ comments: comments }).then(function() {
      // Notify post author
      if (data.authorId && data.authorId !== currentUser.uid && data.authorId !== "system") {
        sendNotification(data.authorId, {
          type: "feed_comment",
          title: "New Comment",
          message: name + " commented: \"" + text.substring(0, 40) + (text.length > 40 ? "..." : "") + "\"",
          page: "chat"
        });
      }
      // v8.19.0 (Ship 5+3) — feed_reply cascade hardened with v8.17.0 two-layer
      // filter: drop recipients outside the chat's league, and drop recipients
      // on the wrong side of the test/real account boundary.
      var _writerIsTest = !!(currentProfile && currentProfile.isTestAccount);
      var _chatLeagueId = data.leagueId || (typeof getActiveLeague === "function" ? getActiveLeague() : null);
      var notified = {};
      notified[currentUser.uid] = true;
      if (data.authorId) notified[data.authorId] = true;
      comments.forEach(function(c) {
        if (c.uid && !notified[c.uid]) {
          notified[c.uid] = true;
          var p = (typeof PB !== "undefined" && PB.getPlayer) ? PB.getPlayer(c.uid) : null;
          if (!p) return;
          if (_chatLeagueId && (!p.leagues || p.leagues.indexOf(_chatLeagueId) === -1)) return;
          if (!!p.isTestAccount !== _writerIsTest) return;
          sendNotification(c.uid, {
            type: "feed_reply",
            title: "New Reply",
            message: name + " also commented on a post you commented on",
            page: "chat"
          });
        }
      });
    });
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[chat] submitComment failed:", err && err.message);
    _revertComments();
    Router.toast("Couldn't post comment, please try again");
  });
}

function toggleCommentLike(docId, commentIdx) {
  if (!db || !currentUser) { Router.toast("Sign in to give kudos"); return; }
  var uid = currentUser.uid;

  // v8.19.0 (Ship 5+3) — snapshot pre-write state for rollback on rejection.
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  var prevCommentLikes = (localMsg && localMsg.commentLikes)
    ? JSON.parse(JSON.stringify(localMsg.commentLikes))
    : null;

  // Optimistic update
  if (localMsg) {
    if (!localMsg.commentLikes) localMsg.commentLikes = {};
    var key = String(commentIdx);
    if (!localMsg.commentLikes[key]) localMsg.commentLikes[key] = [];
    var idx = localMsg.commentLikes[key].indexOf(uid);
    if (idx !== -1) localMsg.commentLikes[key].splice(idx, 1);
    else localMsg.commentLikes[key].push(uid);
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
  }

  function _revertCommentLikes() {
    if (localMsg) {
      if (prevCommentLikes === null) delete localMsg.commentLikes;
      else localMsg.commentLikes = prevCommentLikes;
      var feed = document.getElementById("chatFeed");
      if (feed) feed.innerHTML = renderChatMessages(liveChat);
    }
  }

  // Sync to Firestore
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var commentLikes = data.commentLikes || {};
    var key = String(commentIdx);
    if (!commentLikes[key]) commentLikes[key] = [];
    var idx = commentLikes[key].indexOf(uid);
    if (idx !== -1) commentLikes[key].splice(idx, 1);
    else commentLikes[key].push(uid);
    return db.collection("chat").doc(docId).update({ commentLikes: commentLikes }).then(function() {
      // Notify comment author
      var comments = data.comments || [];
      if (comments[commentIdx] && comments[commentIdx].uid && comments[commentIdx].uid !== uid) {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        sendNotification(comments[commentIdx].uid, {
          type: "comment_like",
          title: "Comment Kudos",
          message: myName + " gave kudos to your comment",
          page: "chat"
        });
      }
    });
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[chat] toggleCommentLike failed:", err && err.message);
    _revertCommentLikes();
    Router.toast("Couldn't add kudos, please try again");
  });
}

function replyToComment(docId, commentAuthor) {
  // Close other inputs first
  document.querySelectorAll('[id^="comment-"]').forEach(function(el) {
    if (el.id.indexOf("commentText") !== -1) return;
    if (el.id !== "comment-" + docId) el.style.display = "none";
  });
  var el = document.getElementById("comment-" + docId);
  if (!el) return;
  // Toggle: if already open, close it
  if (el.style.display === "flex") {
    el.style.display = "none";
    return;
  }
  el.style.display = "flex";
  var input = document.getElementById("commentText-" + docId);
  if (input) {
    input.value = "@" + commentAuthor + " ";
    input.focus();
    var len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function confirmDelete(el, docId) {
  if (el.dataset.armed === "true") {
    deleteChat(docId);
    return;
  }
  el.dataset.armed = "true";
  el.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--alert)" stroke-width="1.5"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5"/><path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10"/></svg>';
  el.style.color = "var(--alert)";
  // Reset after 3 seconds if not tapped
  setTimeout(function() { 
    if (el) { el.dataset.armed = "false"; el.textContent = "×"; el.style.color = "var(--muted2)"; }
  }, 3000);
}

function confirmDeleteComment(el, docId, commentIndex) {
  if (el.dataset.armed === "true") {
    deleteComment(docId, commentIndex);
    return;
  }
  el.dataset.armed = "true";
  el.innerHTML = '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--alert)" stroke-width="1.5"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5"/><path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10"/></svg>';
  el.style.color = "var(--alert)";
  setTimeout(function() {
    if (el) { el.dataset.armed = "false"; el.textContent = "×"; el.style.color = "var(--muted2)"; }
  }, 3000);
}

function deleteComment(docId, commentIndex) {
  if (!db || !currentUser) return;

  // v8.19.0 (Ship 5+3) — snapshot pre-write state for rollback on rejection.
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  var prevComments = (localMsg && localMsg.comments) ? localMsg.comments.slice() : null;

  // Optimistic local splice — match the other writers' UX.
  if (localMsg && localMsg.comments && commentIndex >= 0 && commentIndex < localMsg.comments.length) {
    localMsg.comments.splice(commentIndex, 1);
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
  }

  function _revertComments() {
    if (localMsg) {
      if (prevComments === null) delete localMsg.comments;
      else localMsg.comments = prevComments;
      var feed = document.getElementById("chatFeed");
      if (feed) feed.innerHTML = renderChatMessages(liveChat);
    }
  }

  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var comments = data.comments || [];
    if (commentIndex >= 0 && commentIndex < comments.length) {
      comments.splice(commentIndex, 1);
      return db.collection("chat").doc(docId).update({ comments: comments });
    }
  }).catch(function(err) {
    if (typeof pbWarn === "function") pbWarn("[chat] deleteComment failed:", err && err.message);
    _revertComments();
    Router.toast("Couldn't delete comment, please try again");
  });
}

function deleteChat(docId, _confirmed) {
  if (!db) return;
  // v8.24.15 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Delete this post?", message: "It comes off the board for everyone.", confirmLabel: "Delete", danger: true })
      .then(function(ok) { if (ok) deleteChat(docId, true); });
    return;
  }
  db.collection("chat").doc(docId).delete().then(function() { Router.toast("Deleted"); });
}

function sendChat() {
  var input = document.getElementById("chatInput"); var text = input.value.trim();
  if (!text || !db) return;
  // v8.24.89 — cap length so a single chat doc can't be arbitrarily large
  // (unbounded-write surface, page-sweep #14). 500 chars is plenty for trash talk.
  if (text.length > 500) text = text.slice(0, 500);
  db.collection("chat").add(leagueDoc("chat", { id:genId(), text:text, authorId:currentUser?currentUser.uid:"anon", authorName:currentProfile?PB.getDisplayName(currentProfile):"Anon", createdAt:fsTimestamp() }))
    .then(function(){input.value=""}).catch(function(){Router.toast("Failed to send")});
}

