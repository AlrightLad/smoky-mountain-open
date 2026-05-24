// Notification panel + read history + DM badge. Extracted per W1.A5.

// ========== NOTIFICATION PANEL ==========
var notifPanelOpen = false;
// Read-history scroll-back state (v8.17.0). Persists across panel toggles;
// reset only on logout via authoritative cleanup site (see firebase.js).
var readHistory = [];
var readHistoryCursor = null;   // Firestore cursor (last doc createdAt) | "end" sentinel
var _readHistoryObserver = null;
var _readHistoryFetching = false;

function openNotifPanel() {
  notifPanelOpen = true;
  var panel = document.getElementById("notifPanel");
  var overlay = document.getElementById("notifOverlay");
  if (panel) { panel.classList.add("open"); panel.style.pointerEvents = "auto"; }
  if (overlay) { overlay.classList.add("open"); overlay.style.pointerEvents = "auto"; }
  renderNotifPanel();
  // Lazy first-fetch only — readHistory persists across toggles.
  if (readHistory.length === 0 && readHistoryCursor !== "end") {
    loadMoreReadHistory();
  }
}

function closeNotifPanel() {
  notifPanelOpen = false;
  var panel = document.getElementById("notifPanel");
  var overlay = document.getElementById("notifOverlay");
  if (panel) { panel.classList.remove("open"); panel.style.pointerEvents = "none"; }
  if (overlay) { overlay.classList.remove("open"); overlay.style.pointerEvents = "none"; }
  if (_readHistoryObserver) { _readHistoryObserver.disconnect(); _readHistoryObserver = null; }
}

function toggleNotifPanel() {
  if (notifPanelOpen) closeNotifPanel();
  else openNotifPanel();
}

function renderNotifPanel() {
  var el = document.getElementById("notifList");
  if (!el) return;

  var unread = liveNotifications || [];
  var read = readHistory || [];

  if (!unread.length && !read.length) {
    el.innerHTML = '<div class="empty" style="padding:40px 16px"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div class="empty-text">All caught up</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">You\'ll see likes, comments, messages, and tee times here</div></div>';
    return;
  }

  var h = '';
  unread.forEach(function(n) { h += renderNotifItem(n, false); });

  if (read.length) {
    h += '<div class="notif-section-divider">EARLIER</div>';
    read.forEach(function(n) { h += renderNotifItem(n, true); });
  }

  if (readHistoryCursor !== "end" && (read.length > 0 || unread.length > 0)) {
    h += '<div class="notif-loading-more" id="notifSentinel">LOADING EARLIER…</div>';
  } else if (read.length > 0) {
    h += '<div class="notif-loading-more">NO EARLIER NOTIFICATIONS</div>';
  }

  el.innerHTML = h;
  _wireReadHistoryObserver();
}

function renderNotifItem(n, isRead) {
  var meta = (window.NOTIFICATION_META && window.NOTIFICATION_META[n.type]) || { cluster: "misc" };
  var clusterIcon = (window.NOTIFICATION_CLUSTER_ICON && window.NOTIFICATION_CLUSTER_ICON[meta.cluster]) || "";
  var stateClass = isRead ? "" : " unread";
  var idEsc = (n._id || "").replace(/'/g, "\\'");
  var h = '<div class="notif-item' + stateClass + '" style="position:relative">';
  h += '<div onclick="handleNotifClick(\'' + idEsc + '\')" style="display:flex;gap:10px;align-items:flex-start;padding-right:28px">';
  h += '<div class="notif-item-icon notif-item-icon--' + meta.cluster + '">' + clusterIcon + '</div>';
  h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(n.title || "Notification") + '</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:2px;line-height:1.4">' + escHtml(n.message || "") + '</div>';
  h += '<div style="display:flex;align-items:center;gap:10px;margin-top:6px">';
  if (n.createdAt && n.createdAt.toDate) {
    h += '<span class="notif-time" style="margin:0">' + formatDmTime(n.createdAt.toDate()) + '</span>';
  }
  h += '<span style="font-size:9px;color:var(--gold);cursor:pointer;font-weight:600" onclick="event.stopPropagation();handleNotifClick(\'' + idEsc + '\')">View →</span>';
  h += '</div></div></div>';
  // Dismiss X — read items DELETE; unread items mark read.
  h += '<div role="button" tabindex="0" aria-label="' + (isRead ? "Delete notification" : "Mark as read") + '" title="' + (isRead ? "Delete" : "Mark as read") + '" onclick="event.stopPropagation();dismissNotif(\'' + idEsc + '\',' + (isRead ? 'true' : 'false') + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();dismissNotif(\'' + idEsc + '\',' + (isRead ? 'true' : 'false') + ');}" style="position:absolute;top:10px;right:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted2);font-size:14px;border-radius:4px;transition:background .15s" onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'transparent\'"><span aria-hidden="true">×</span></div>';
  h += '</div>';
  return h;
}

function handleNotifClick(notifId) {
  if (!notifId) return;
  var stash = window._notifById && window._notifById[notifId];
  var dest = stash ? stash.dest : "home";
  var params = stash ? stash.params : {};
  if (db) {
    db.collection("notifications").doc(notifId).update({
      read: true,
      readAt: fsTimestamp()
    }).catch(function(){});
  }
  // Promote: if it was unread, splice from liveNotifications and prepend to readHistory
  // so the panel reflects the move on next render without a Firestore round-trip.
  var idx = -1;
  for (var i = 0; i < liveNotifications.length; i++) {
    if (liveNotifications[i]._id === notifId) { idx = i; break; }
  }
  if (idx >= 0) {
    var promoted = liveNotifications.splice(idx, 1)[0];
    promoted.read = true;
    readHistory.unshift(promoted);
    indexNotifInMap(promoted);
  }
  closeNotifPanel();
  Router.go(dest, params);
}

function dismissNotif(notifId, isRead) {
  if (!notifId || !db) return;
  if (isRead) {
    // Read items: permanently delete the doc. Rules allow owner-delete.
    db.collection("notifications").doc(notifId).delete().catch(function(){});
    readHistory = readHistory.filter(function(n) { return n._id !== notifId; });
    if (window._notifById) delete window._notifById[notifId];
  } else {
    // Unread items: mark read + capture readAt + promote to readHistory front.
    db.collection("notifications").doc(notifId).update({
      read: true,
      readAt: fsTimestamp()
    }).catch(function(){});
    var idx = -1;
    for (var i = 0; i < liveNotifications.length; i++) {
      if (liveNotifications[i]._id === notifId) { idx = i; break; }
    }
    if (idx >= 0) {
      var promoted = liveNotifications.splice(idx, 1)[0];
      promoted.read = true;
      readHistory.unshift(promoted);
      indexNotifInMap(promoted);
    }
    updateNotifBadge();
  }
  renderNotifPanel();
}

function markAllNotifsRead() {
  if (!db || !liveNotifications.length) return;
  var stamp = fsTimestamp();
  // Iterate descending so unshift preserves newest-first order in readHistory.
  for (var i = liveNotifications.length - 1; i >= 0; i--) {
    var n = liveNotifications[i];
    if (n._id) {
      db.collection("notifications").doc(n._id).update({ read: true, readAt: stamp }).catch(function(){});
    }
    n.read = true;
    readHistory.unshift(n);
    indexNotifInMap(n);
  }
  liveNotifications = [];
  updateNotifBadge();
  renderNotifPanel();
  Router.toast("All caught up");
}

// Update notification badge count
function updateNotifBadge() {
  var badge = document.getElementById("notifBadge");
  if (!badge) return;
  var count = liveNotifications.length;
  if (count > 0) {
    badge.style.display = "flex";
    badge.textContent = count > 9 ? "9+" : count;
  } else {
    badge.style.display = "none";
  }
}

// DM unread badge
var dmUnreadCount = 0;
var dmUnreadListener = null;

function startDmUnreadListener() {
  if (!db || !currentUser) return;
  if (dmUnreadListener) dmUnreadListener();
  // Listen to all DM conversations where we're a participant
  dmUnreadListener = db.collection("dms")
    .where("participants", "array-contains", currentUser.uid)
    .onSnapshot(function(snap) {
      var unread = 0;
      snap.forEach(function(doc) {
        var data = doc.data();
        // Count as unread if last message wasn't by us and we haven't read it
        if (data.lastMessageBy && data.lastMessageBy !== currentUser.uid) {
          var lastRead = data.lastRead && data.lastRead[currentUser.uid];
          var lastMsg = data.lastMessageAt;
          if (lastMsg && (!lastRead || (lastMsg.toDate && lastRead.toDate && lastMsg.toDate() > lastRead.toDate()))) {
            unread++;
          } else if (lastMsg && !lastRead) {
            unread++;
          }
        }
      });
      dmUnreadCount = unread;
      updateDmBadge();
    }, function(err) { pbWarn("[DM] Unread listener error:", err.message); });
}

function updateDmBadge() {
  var badge = document.getElementById("dmBadge");
  if (!badge) return;
  if (dmUnreadCount > 0) {
    badge.style.display = "flex";
    badge.textContent = dmUnreadCount > 9 ? "9+" : dmUnreadCount;
  } else {
    badge.style.display = "none";
  }
}

// Read-history scroll-back fetcher (v8.17.0 / Ship 5+1).
// Lazy-paginates read notifications using composite index #2 (read, toUserId, createdAt).
// Cursor is the last fetched doc's createdAt; "end" sentinel halts further fetches.
function loadMoreReadHistory() {
  if (!db || !currentUser || _readHistoryFetching || readHistoryCursor === "end") return;
  _readHistoryFetching = true;
  var q = db.collection("notifications")
    .where("toUserId","==",currentUser.uid)
    .where("read","==",true)
    .orderBy("createdAt","desc")
    .limit(20);
  if (readHistoryCursor && readHistoryCursor !== "end") q = q.startAfter(readHistoryCursor);
  q.get().then(function(snap) {
    if (snap.empty) {
      readHistoryCursor = "end";
    } else {
      snap.forEach(function(doc) {
        var n = Object.assign({_id: doc.id}, doc.data());
        // Skip if this doc already lives in readHistory (locally promoted via mark-read).
        var dup = false;
        for (var k = 0; k < readHistory.length; k++) {
          if (readHistory[k]._id === n._id) { dup = true; break; }
        }
        if (!dup) {
          readHistory.push(n);
          indexNotifInMap(n);
        }
      });
      readHistoryCursor = snap.docs[snap.docs.length - 1].data().createdAt;
    }
    _readHistoryFetching = false;
    if (notifPanelOpen) renderNotifPanel();
  }).catch(function(err) {
    pbWarn("[Notify] Read history fetch error:", err.message);
    _readHistoryFetching = false;
  });
}

function _wireReadHistoryObserver() {
  if (_readHistoryObserver) { _readHistoryObserver.disconnect(); _readHistoryObserver = null; }
  var sentinel = document.getElementById("notifSentinel");
  if (!sentinel) return;
  var panel = document.getElementById("notifPanel");
  if (!panel || typeof IntersectionObserver === "undefined") return;
  _readHistoryObserver = new IntersectionObserver(function(entries) {
    if (entries[0] && entries[0].isIntersecting) {
      loadMoreReadHistory();
    }
  }, { root: panel, threshold: 0.1 });
  _readHistoryObserver.observe(sentinel);
}


