var Router = (function() {
  var current = { page: "home", params: {} };
  var pages = {};
  var _skipHistoryPush = false;
  // Explicit nav stack — always knows exactly where back() should go
  // Scales to any depth: Home→Members→Profile→EditProfile→back→back→back works correctly
  var _navStack = [];

  // Browser back/forward button — keep our stack in sync
  window.addEventListener("popstate", function(e) {
    if (_navStack.length > 0) _navStack.pop();
    var state = e.state;
    _skipHistoryPush = true;
    if (state && state.page) {
      go(state.page, state.params || {});
    } else {
      _navStack = [];
      go("home", {});
    }
    _skipHistoryPush = false;
  });

  function register(name, renderFn) {
    pages[name] = renderFn;
  }

  function go(page, params, replaceState) {
    var prev = current.page;
    var prevParams = current.params;
    current = { page: page, params: params || {} };

    // Push/replace browser history. URL stays fixed — hash changes caused PWA reloads on iOS.
    if (!_skipHistoryPush) {
      var state = { page: page, params: params || {} };
      if (replaceState || prev === page) {
        history.replaceState(state, "", window.location.pathname);
      } else {
        // Push previous location onto our explicit stack before navigating forward
        _navStack.push({ page: prev, params: prevParams });
        history.pushState(state, "", window.location.pathname);
      }
    }

    renderNav();
    var containers = document.querySelectorAll("#mainApp [data-page]");
    containers.forEach(function(el) { el.classList.add("hidden"); });
    var target = document.querySelector('#mainApp [data-page="' + page + '"]');
    if (target) {
      target.classList.remove("hidden");
      if (pages[page]) pages[page](current.params);
    }
    window.scrollTo(0, 0);
    // Hide footer on pages with sticky input (chat, DMs)
    var footer = document.querySelector(".footer");
    if (footer) footer.style.display = (page === "chat" || page === "dms" || page === "dm-thread") ? "none" : "";
  }

  function getPage() { return current.page; }
  function getParams() { return current.params; }

  function renderNav() {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    var tabs = [
      { match: ["home","watchround","standings","seasonrecap","awards","feed"] },
      { match: ["activity","rounds","playnow","range","scramble-live","syncround"] },
      { match: ["courses"] },
      { match: ["trips","scorecard","teetimes","tee-create","partygames"] },
      { match: ["more","members","profile-edit","records","aces","scramble","challenges","trophyroom","rules","merch"] }
    ];
    var buttons = nav.querySelectorAll("button");
    tabs.forEach(function(t, i) {
      if (buttons[i]) {
        if (t.match.indexOf(current.page) !== -1) buttons[i].classList.add("a");
        else buttons[i].classList.remove("a");
      }
    });
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 2200);
  }

  var STOCK_AVATARS = ["stock_profile_gold.jpg","stock_profile_green.jpg","stock_profile_navy.jpg","stock_profile_charcoal.jpg","stock_profile_red.jpg","stock_profile_teal.jpg"];

  function getAvatar(player, fallback) {
    var imgSrc = '';
    // Check Firestore photo cache — try by id, claimedFrom, and username
    var cached = photoCache["member:" + player.id];
    if (!cached && player.claimedFrom) cached = photoCache["member:" + player.claimedFrom];
    if (!cached && player.username) cached = photoCache["member:" + player.username];
    if (cached) {
      imgSrc = cached;
    } else if (player.photoUrl) {
      imgSrc = player.photoUrl;
    } else if (player.photo) {
      imgSrc = player.photo;
    } else if (player.stockAvatar) {
      imgSrc = player.stockAvatar;
    } else {
      var hash = 0;
      for (var i = 0; i < (player.username||player.name).length; i++) hash = ((hash << 5) - hash) + (player.username||player.name).charCodeAt(i);
      var idx = Math.abs(hash) % STOCK_AVATARS.length;
      imgSrc = STOCK_AVATARS[idx];
    }
    var initial = (player.username||player.name).charAt(0).toUpperCase();
    return '<img alt="" src="' + imgSrc + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:18px;background:var(--bg3);border-radius:inherit">' + initial + '</div>';
  }

  function handlePhotoUpload(callback, maxW, maxH, quality) {
    maxW = maxW || 200;
    maxH = maxH || 200;
    quality = quality || 0.7;
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = function() {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement("canvas");
          if (maxW === maxH) {
            canvas.width = maxW; canvas.height = maxH;
            var ctx = canvas.getContext("2d");
            var min = Math.min(img.width, img.height);
            var sx = (img.width - min) / 2, sy = (img.height - min) / 2;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, maxW, maxH);
          } else {
            canvas.width = maxW; canvas.height = maxH;
            var ctx = canvas.getContext("2d");
            var ratio = Math.max(maxW / img.width, maxH / img.height);
            var w = img.width * ratio, h = img.height * ratio;
            ctx.drawImage(img, (maxW - w) / 2, (maxH - h) / 2, w, h);
          }
          callback(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function back(fallback) {
    // Pop our explicit stack — always goes to the exact page we came from
    if (_navStack.length > 0) {
      var prev = _navStack.pop();
      // Keep browser history in sync without adding a new entry
      _skipHistoryPush = true;
      history.back();
      go(prev.page, prev.params);
      _skipHistoryPush = false;
    } else {
      go(fallback || "home", {});
    }
  }

  return {
    register: register,
    go: go,
    back: back,
    getPage: getPage,
    getParams: getParams,
    toast: toast,
    getAvatar: getAvatar,
    handlePhotoUpload: handlePhotoUpload
  };
})();

// ── GLOBAL UTILITY: profile border color ────────────────────────────────────
// Single source of truth for avatar frame colors. Call anywhere you render
// a player avatar. Matches the logic on the profile page exactly.
// Theme-default ring colors — every theme has a distinct ring identity
var THEME_RINGS = {
  classic:   {color:"#c9a84c", shadow:"0 0 8px rgba(201,168,76,.5), 0 0 16px rgba(201,168,76,.15)"},
  camo:      {color:"#8a7a5a", shadow:"0 0 8px rgba(138,122,90,.45), 0 0 14px rgba(138,122,90,.15)"},
  masters:   {color:"#2e7d32", shadow:"0 0 8px rgba(46,125,50,.5), 0 0 16px rgba(253,216,53,.2)"},
  azalea:    {color:"#e8729a", shadow:"0 0 10px rgba(232,114,154,.5), 0 0 18px rgba(232,114,154,.2)"},
  usga:      {color:"#1a3a6a", shadow:"0 0 0 1px #c41e3a, 0 0 8px rgba(196,30,58,.35)"},
  sundayred: {color:"#8b1a2b", shadow:"0 0 10px rgba(212,36,60,.5), 0 0 18px rgba(212,36,60,.2)"},
  dark:      {color:"#6a6a6a", shadow:"0 0 8px rgba(255,255,255,.15), 0 0 14px rgba(255,255,255,.05)"},
  light:     {color:"#a0845a", shadow:"0 0 8px rgba(138,109,30,.4), 0 0 14px rgba(138,109,30,.15)"}
};

function playerFrameColor(p) {
  if (!p) return 'var(--gold)';
  // 1. Manual cosmetic ring override (from shop purchase)
  if (p.equippedCosmetics && p.equippedCosmetics.border && p.equippedCosmetics.border !== "theme-default") {
    var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
    var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return equipped.preview;
  }
  // 2. Theme-default ring — matches THIS PLAYER's active theme (not the viewer's)
  var playerTheme = p.theme || null;
  // If no theme on the player object, check fbMemberCache for their UID
  if (!playerTheme && typeof fbMemberCache !== "undefined") {
    var pid = p.id || p.uid || "";
    if (fbMemberCache[pid] && fbMemberCache[pid].theme) playerTheme = fbMemberCache[pid].theme;
    // Also check if pid is a seed ID claimed by someone
    if (!playerTheme) {
      Object.keys(fbMemberCache).forEach(function(k) {
        if (fbMemberCache[k].claimedFrom === pid && fbMemberCache[k].theme) playerTheme = fbMemberCache[k].theme;
      });
    }
  }
  if (!playerTheme) playerTheme = "classic";
  var ring = THEME_RINGS[playerTheme] || THEME_RINGS.classic;
  return ring.color;
}

function playerRingShadow(p) {
  if (!p) return '0 0 8px rgba(201,168,76,.3)';
  // Animated rings handle their own shadows via keyframes
  if (p.equippedCosmetics && p.equippedCosmetics.border) {
    var animatedRings = ['border_pulse_gold','border_shimmer','border_rainbow_shift','border_neon_green','border_crimson_ember'];
    if (animatedRings.indexOf(p.equippedCosmetics.border) !== -1) return '';
    // Standard cosmetic rings get a bold glow matching their color
    var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
    var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return '0 0 8px ' + equipped.preview + '50, 0 0 16px ' + equipped.preview + '20';
  }
  // Theme-default shadow — bold glow so rings POP
  var playerTheme = p.theme || null;
  if (!playerTheme && typeof fbMemberCache !== "undefined") {
    var pid = p.id || p.uid || "";
    if (fbMemberCache[pid] && fbMemberCache[pid].theme) playerTheme = fbMemberCache[pid].theme;
    if (!playerTheme) { Object.keys(fbMemberCache).forEach(function(k) { if (fbMemberCache[k].claimedFrom === pid && fbMemberCache[k].theme) playerTheme = fbMemberCache[k].theme; }); }
  }
  if (!playerTheme) playerTheme = "classic";
  var ring = THEME_RINGS[playerTheme] || THEME_RINGS.classic;
  return ring.shadow;
}

// Returns full inline style for avatar ring (border + shadow + animation)
function playerRingStyle(p) {
  var color = playerFrameColor(p);
  var shadow = playerRingShadow(p);
  var cls = playerRingClass(p);
  var animMap = {
    'ring-pulse-gold': 'ringPulse 2s ease-in-out infinite',
    'ring-diamond-sparkle': 'ringShimmer 2.5s ease-in-out infinite',
    'ring-rainbow-shift': 'ringRainbow 3s linear infinite',
    'ring-neon-green': 'ringNeonGreen 1.8s ease-in-out infinite',
    'ring-crimson-ember': 'ringEmber 1.5s ease-in-out infinite'
  };
  var anim = cls && animMap[cls] ? animMap[cls] : '';
  return 'border:3px solid ' + color + (shadow ? ';box-shadow:' + shadow : '') + (anim ? ';animation:' + anim : '');
}

function playerRingClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.border) return '';
  var b = p.equippedCosmetics.border;
  if (b === 'border_pulse_gold') return 'ring-pulse-gold';
  if (b === 'border_shimmer') return 'ring-diamond-sparkle';
  if (b === 'border_rainbow_shift') return 'ring-rainbow-shift';
  if (b === 'border_neon_green') return 'ring-neon-green';
  if (b === 'border_crimson_ember') return 'ring-crimson-ember';
  return '';
}
// ── Cosmetic helpers ──
function getPlayerNameClass(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.name) return '';
  var nameMap = {
    'name_gold_shimmer': 'name-gold-shimmer',
    'name_rainbow': 'name-rainbow',
    'name_glow_green': 'name-glow-green',
    'name_fire_text': 'name-fire',
    'name_ice_text': 'name-ice',
    'name_shadow_depth': 'name-shadow-depth'
  };
  return nameMap[p.equippedCosmetics.name] || '';
}
function getPlayerBannerCss(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.banner) return '';
  var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
  var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.banner; });
  return equipped ? equipped.css : '';
}
function getPlayerCardCss(p) {
  if (!p || !p.equippedCosmetics || !p.equippedCosmetics.card) return '';
  var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
  var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.card; });
  return equipped ? equipped.css : '';
}
// ── SHARED RENDERING: renderAvatar + renderUsername ────────────────────────
// Use these EVERYWHERE instead of raw HTML to guarantee ring + name effect consistency.

// renderAvatar(player, size, clickToProfile) → HTML string
// Renders a circular avatar with the player's photo, theme ring, and animated ring class.
// If clickToProfile is true, wraps in an onclick that navigates to their profile.
function renderAvatar(p, size, clickToProfile) {
  size = size || 36;
  var ringStyle = p ? playerRingStyle(p) : 'border:2px solid var(--gold)';
  var avatarInner = p ? Router.getAvatar(p) : '<div style="width:100%;height:100%;background:var(--bg3);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:' + Math.round(size * 0.4) + 'px">?</div>';
  var pid = p ? (p.id || '') : '';
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';
  // Outer div: border + shadow + animation (NO overflow:hidden so glow renders)
  // Inner div: overflow:hidden clips the image/fallback content to the circle
  return '<div style="width:' + size + 'px;height:' + size + 'px;min-width:' + size + 'px;border-radius:50%;' + ringStyle + ';' + cursor + 'flex-shrink:0"' + click + '><div style="width:100%;height:100%;border-radius:50%;overflow:hidden">' + avatarInner + '</div></div>';
}

// renderUsername(player, extraStyle) → HTML string
// Renders the player's display name with their equipped name effect class.
// If clickToProfile, wraps in an onclick span.
function renderUsername(p, extraStyle, clickToProfile) {
  if (!p) return '<span style="' + (extraStyle || '') + '">Unknown</span>';
  var name = p.username || p.name || 'Member';
  var nameClass = getPlayerNameClass(p);
  var pid = p.id || '';
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';
  return '<span class="' + nameClass + '" style="' + cursor + (extraStyle || '') + '"' + click + '>' + escHtml(name) + '</span>';
}

// renderAvatarUsername(player, avatarSize, nameStyle) → HTML string
// Convenience: avatar + username together in a flex row, both tappable to profile.
function renderAvatarUsername(p, avatarSize, nameStyle) {
  avatarSize = avatarSize || 36;
  var pid = p ? (p.id || '') : '';
  return '<div style="display:flex;align-items:center;gap:8px">' +
    renderAvatar(p, avatarSize, true) +
    renderUsername(p, (nameStyle || 'font-size:12px;font-weight:600;color:var(--cream);'), true) +
    '</div>';
}

// ────────────────────────────────────────────────────────────────────────────


// ========== NOTIFICATION SYSTEM ==========
var liveNotifications = [];

// ── FCM Push Notifications ──
var _fcmToken = null;
// VAPID key — get from Firebase Console → Cloud Messaging → Web push certificates
// Set this in Firestore config/push_config.vapidKey or replace this placeholder
var FCM_VAPID_KEY = null;

function initPushNotifications() {
  if (!firebase.messaging || !currentUser || !db) return;
  // Load VAPID key from Firestore config if not set
  if (!FCM_VAPID_KEY) {
    db.collection("config").doc("push_config").get().then(function(doc) {
      if (doc.exists && doc.data().vapidKey) {
        FCM_VAPID_KEY = doc.data().vapidKey;
        _requestFcmPermission();
      } else {
        pbLog("[FCM] No VAPID key configured — push notifications disabled. Set config/push_config.vapidKey in Firestore.");
      }
    }).catch(function() {});
    return;
  }
  _requestFcmPermission();
}

function _requestFcmPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    _getFcmToken();
  } else if (Notification.permission !== 'denied') {
    // Don't auto-prompt — let the user opt in from settings or onboarding
    pbLog("[FCM] Permission not yet requested — waiting for user opt-in");
  }
}

function requestPushPermission() {
  if (!('Notification' in window)) { Router.toast("Notifications not supported on this device"); return; }
  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      _getFcmToken();
      Router.toast("Notifications enabled!");
    } else {
      Router.toast("Notifications blocked — check browser settings");
    }
  });
}

function _getFcmToken() {
  if (!firebase.messaging || !FCM_VAPID_KEY) return;
  try {
    var messaging = firebase.messaging();
    messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: navigator.serviceWorker ? navigator.serviceWorker.ready : undefined })
      .then(function(token) {
        if (token && token !== _fcmToken) {
          _fcmToken = token;
          pbLog("[FCM] Token acquired");
          // Store token in member doc
          if (db && currentUser) {
            db.collection("members").doc(currentUser.uid).set({ fcmToken: token, fcmUpdatedAt: fsTimestamp() }, { merge: true }).catch(function(){});
          }
        }
      }).catch(function(err) { pbWarn("[FCM] Token error:", err.message); });

    // Foreground message handler — show as toast
    messaging.onMessage(function(payload) {
      var data = payload.notification || payload.data || {};
      Router.toast(data.body || data.title || "New notification");
    });
  } catch(e) { pbWarn("[FCM] Init error:", e.message); }
}

function sendNotification(toUserId, notif) {
  if (!db) return;
  notif.toUserId = toUserId; notif.read = false; notif.createdAt = fsTimestamp();
  db.collection("notifications").add(notif).catch(function(){});
  // Queue push notification for delivery via Cloud Function
  db.collection("pendingPush").add({
    toUserId: toUserId,
    title: notif.title || (window._activeLeagueName || "Parbaughs"),
    body: notif.message || "",
    data: { type: notif.type || "general", page: notif.page || "" },
    createdAt: fsTimestamp()
  }).catch(function(){});
}
function startNotificationListener() {
  if (!db || !currentUser) return;
  if (window._notifUnsub) window._notifUnsub();
  window._notifUnsub = db.collection("notifications").where("toUserId","==",currentUser.uid).where("read","==",false).limit(20)
    .onSnapshot(function(snap) {
      liveNotifications = [];
      snap.forEach(function(doc) { liveNotifications.push(Object.assign({_id:doc.id}, doc.data())); });
      liveNotifications.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
      if (liveNotifications.length > 0 && liveNotifications[0].message) Router.toast(liveNotifications[0].message);
    }, function(err) { pbWarn("[Notify] Listener error:", err.message); });
}

// ========== ROUND INTEGRITY ==========
var ROUND_GRACE_HOURS = 48;



/* ── Shared infrastructure: notifications, AI tournament, share cards, presence, feed, overrides ── */

// ========== NOTIFICATION PANEL ==========
var notifPanelOpen = false;

function openNotifPanel() {
  notifPanelOpen = true;
  var panel = document.getElementById("notifPanel");
  var overlay = document.getElementById("notifOverlay");
  if (panel) { panel.classList.add("open"); panel.style.pointerEvents = "auto"; }
  if (overlay) { overlay.classList.add("open"); overlay.style.pointerEvents = "auto"; }
  renderNotifPanel();
}

function closeNotifPanel() {
  notifPanelOpen = false;
  var panel = document.getElementById("notifPanel");
  var overlay = document.getElementById("notifOverlay");
  if (panel) { panel.classList.remove("open"); panel.style.pointerEvents = "none"; }
  if (overlay) { overlay.classList.remove("open"); overlay.style.pointerEvents = "none"; }
}

function toggleNotifPanel() {
  if (notifPanelOpen) closeNotifPanel();
  else openNotifPanel();
}

function renderNotifPanel() {
  var el = document.getElementById("notifList");
  if (!el) return;
  if (!liveNotifications.length) {
    el.innerHTML = '<div class="empty" style="padding:40px 16px"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div class="empty-text">All caught up</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">You\'ll see likes, comments, messages, and tee times here</div></div>';
    return;
  }
  var h = '';
  liveNotifications.forEach(function(n) {
    var icon = n.type === "feed_like" ? "<svg viewBox='0 0 16 16' width='10' height='10' fill='var(--gold)' stroke='none'><path d='M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z'/></svg>" : n.type === "feed_comment" || n.type === "feed_reply" ? "" : n.type === "dm" ? "" : n.type === "tee_rsvp" ? "" : n.type === "tee_cancelled" ? "" : n.type === "tee_withdrawal" ? "" : n.type === "welcome" ? "" : n.type === "report" ? "" : "";
    var linkPage = n.linkPage || "home";
    // Better deep linking based on notification type
    if (n.type === "dm") linkPage = "dms";
    else if (n.type === "feed_like" || n.type === "feed_comment" || n.type === "feed_reply") linkPage = "chat";
    else if (n.type === "tee_rsvp" || n.type === "tee_cancelled" || n.type === "tee_withdrawal") linkPage = "teetimes";
    
    h += '<div class="notif-item unread" style="position:relative">';
    h += '<div onclick="handleNotifClick(\'' + (n._id||"") + '\',\'' + linkPage + '\')" style="display:flex;gap:10px;align-items:flex-start;padding-right:28px">';
    h += '<div style="font-size:16px;flex-shrink:0;margin-top:2px">' + icon + '</div>';
    h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(n.title||"Notification") + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:2px;line-height:1.4">' + escHtml(n.message||"") + '</div>';
    h += '<div style="display:flex;align-items:center;gap:10px;margin-top:6px">';
    if (n.createdAt && n.createdAt.toDate) {
      h += '<span class="notif-time" style="margin:0">' + formatDmTime(n.createdAt.toDate()) + '</span>';
    }
    h += '<span style="font-size:9px;color:var(--gold);cursor:pointer;font-weight:600" onclick="event.stopPropagation();handleNotifClick(\'' + (n._id||"") + '\',\'' + linkPage + '\')">View →</span>';
    h += '</div></div></div>';
    // Dismiss X button — top right of each notification
    h += '<div onclick="event.stopPropagation();dismissNotif(\'' + (n._id||"") + '\')" style="position:absolute;top:10px;right:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted2);font-size:14px;border-radius:4px;transition:background .15s" onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'transparent\'">×</div>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function handleNotifClick(notifId, linkPage) {
  if (notifId && db) {
    db.collection("notifications").doc(notifId).update({ read: true }).catch(function(){});
  }
  closeNotifPanel();
  if (linkPage) Router.go(linkPage);
}

function dismissNotif(notifId) {
  if (!notifId || !db) return;
  db.collection("notifications").doc(notifId).update({ read: true }).catch(function(){});
  // Remove from local array immediately for instant UI feedback
  liveNotifications = liveNotifications.filter(function(n) { return n._id !== notifId; });
  updateNotifBadge();
  renderNotifPanel();
}

function markAllNotifsRead() {
  if (!db || !liveNotifications.length) return;
  liveNotifications.forEach(function(n) {
    if (n._id) db.collection("notifications").doc(n._id).update({ read: true }).catch(function(){});
  });
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

// Override the notification listener to also update badge
var _origNotifListener = startNotificationListener;
startNotificationListener = function() {
  if (!db || !currentUser) return;
  if (window._notifUnsub) window._notifUnsub();
  window._notifUnsub = db.collection("notifications").where("toUserId","==",currentUser.uid).where("read","==",false).limit(30)
    .onSnapshot(function(snap) {
      liveNotifications = [];
      snap.forEach(function(doc) { liveNotifications.push(Object.assign({_id:doc.id}, doc.data())); });
      liveNotifications.sort(function(a,b) { 
        var at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        var bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at; 
      });
      updateNotifBadge();
      if (notifPanelOpen) renderNotifPanel();
    }, function(err) { pbWarn("[Notify] Listener error:", err.message); });
};


// ========== AI TOURNAMENT GENERATOR ==========
function showAITournamentGenerator() {
  var members = PB.getPlayers();
  var h = '<div class="sh"><h2>AI Tournament Builder</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';
  
  h += '<div style="text-align:center;padding:20px 16px">';
  h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold)">AI Tournament Generator</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">Describe what you want and the AI builds it</div></div>';
  
  h += '<div class="form-section"><div class="form-title">Tell the AI what you want</div>';
  h += '<textarea class="ff-input" id="ai-prompt" rows="4" placeholder="e.g. A 3-day trip for 8 players with mixed formats, championship feel on the final day, balanced teams for scramble rounds..."></textarea>';
  
  h += '<div style="margin-top:12px"><div class="form-title">Players (' + members.length + ' available)</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Select who\'s playing</div>';
  h += '<div id="ai-players" style="display:flex;flex-wrap:wrap;gap:6px">';
  members.forEach(function(m) {
    h += '<div class="badge" style="cursor:pointer;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius)" id="aip-' + m.id + '" onclick="toggleAIPlayer(\'' + m.id + '\')">' + escHtml(m.name||m.username) + '</div>';
  });
  h += '</div></div>';
  
  h += '<div style="margin-top:12px"><div class="form-title">Number of rounds</div>';
  h += '<select class="ff-input" id="ai-rounds"><option value="1">1 round</option><option value="2">2 rounds</option><option value="3" selected>3 rounds</option><option value="4">4 rounds</option><option value="5">5 rounds</option></select></div>';
  
  h += '<button class="btn full green" onclick="generateAITournament()" style="margin-top:16px" id="ai-gen-btn">Generate Tournament</button>';
  h += '<div id="ai-result" style="margin-top:16px"></div>';
  h += '</div>';
  
  return h;
}

var aiSelectedPlayers = [];

function toggleAIPlayer(pid) {
  var idx = aiSelectedPlayers.indexOf(pid);
  if (idx === -1) aiSelectedPlayers.push(pid); else aiSelectedPlayers.splice(idx, 1);
  var el = document.getElementById("aip-" + pid);
  if (el) {
    el.style.background = aiSelectedPlayers.indexOf(pid) !== -1 ? "rgba(var(--gold-rgb),.15)" : "transparent";
    el.style.borderColor = aiSelectedPlayers.indexOf(pid) !== -1 ? "var(--gold)" : "var(--border)";
    el.style.color = aiSelectedPlayers.indexOf(pid) !== -1 ? "var(--gold)" : "var(--cream)";
  }
}

function generateAITournament() {
  var prompt = document.getElementById("ai-prompt").value.trim();
  var numRounds = parseInt(document.getElementById("ai-rounds").value) || 3;
  var btn = document.getElementById("ai-gen-btn");
  var resultEl = document.getElementById("ai-result");
  
  if (!aiSelectedPlayers.length) { Router.toast("Select at least 2 players"); return; }
  if (aiSelectedPlayers.length < 2) { Router.toast("Need at least 2 players"); return; }
  
  // Build player info string
  var playerInfo = aiSelectedPlayers.map(function(pid) {
    var p = PB.getPlayer(pid);
    if (!p) return pid;
    var hcap = PB.calcHandicap(PB.getPlayerRounds(pid)) || "unknown";
    return (p.name||p.username) + " (HCP: " + hcap + ")";
  }).join(", ");
  
  var formats = ["Stroke Play", "Stableford", "Scramble", "Best Ball", "Match Play", "Skins", "Parbaugh Stroke Play (handicap-adjusted)", "Shamble", "Chapman/Pinehurst"];
  
  var systemPrompt = "You are a golf tournament organizer for The Parbaughs, a private golf group. Generate a tournament format as JSON only. No markdown, no preamble. Return ONLY valid JSON with this structure: {title: string, description: string, rounds: [{day: number, format: string, description: string, teeTime: string, pairings: [[string, string], ...] or null, teams: [{name: string, members: [string]}] or null, notes: string}], specialRules: [string]}. Available formats: " + formats.join(", ") + ". Players: " + playerInfo + ". Number of rounds: " + numRounds + ".";
  
  var userPrompt = prompt || "Create a fun, competitive " + numRounds + "-round tournament with varied formats. Balance teams by handicap for team events. Make the final round the most dramatic.";
  
  btn.disabled = true;
  btn.textContent = "Generating...";
  resultEl.innerHTML = '<div class="loading"><div class="spinner"></div>The AI is building your tournament...</div>';
  
  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        { role: "user", content: systemPrompt + "\n\nUser request: " + userPrompt }
      ]
    })
  }).then(function(resp) { return resp.json(); })
  .then(function(data) {
    btn.disabled = false;
    btn.textContent = "Generate Tournament";
    
    var text = "";
    if (data.content) {
      data.content.forEach(function(block) { if (block.type === "text") text += block.text; });
    }
    
    try {
      var clean = text.replace(/```json|```/g, "").trim();
      var tournament = JSON.parse(clean);
      renderAITournamentResult(tournament, resultEl);
    } catch(e) {
      resultEl.innerHTML = '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.6">' + escHtml(text || "No response received") + '</div></div>';
    }
  }).catch(function(err) {
    btn.disabled = false;
    btn.textContent = "Generate Tournament";
    resultEl.innerHTML = '<div class="card"><div class="card-body" style="color:var(--red);font-size:12px">Failed to generate: ' + escHtml(err.message||"Network error") + '</div></div>';
  });
}

function renderAITournamentResult(t, el) {
  var h = '<div class="card" style="border-color:rgba(var(--gold-rgb),.2)">';
  h += '<div style="padding:16px;background:linear-gradient(135deg,var(--grad-card),var(--card));border-radius:var(--radius) var(--radius) 0 0">';
  h += '<div style="font-family:Playfair Display,serif;font-size:20px;color:var(--gold);font-weight:700">' + escHtml(t.title||"AI Tournament") + '</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5">' + escHtml(t.description||"") + '</div></div>';
  
  if (t.rounds && t.rounds.length) {
    t.rounds.forEach(function(r) {
      h += '<div style="padding:14px 16px;border-top:1px solid var(--border)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="font-size:14px;font-weight:700;color:var(--cream)">Round ' + (r.day||"") + '</div>';
      h += '<div style="font-size:10px;color:var(--gold);font-weight:600">' + escHtml(r.format||"") + '</div></div>';
      h += '<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">' + escHtml(r.description||"") + '</div>';
      if (r.teeTime) h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Tee time: ' + escHtml(r.teeTime) + '</div>';
      
      if (r.pairings && r.pairings.length) {
        h += '<div style="margin-top:8px"><div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Pairings</div>';
        r.pairings.forEach(function(pair, i) {
          h += '<div style="font-size:11px;color:var(--cream);padding:2px 0">Group ' + (i+1) + ': ' + pair.join(" · ") + '</div>';
        });
        h += '</div>';
      }
      
      if (r.teams && r.teams.length) {
        h += '<div style="margin-top:8px"><div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Teams</div>';
        r.teams.forEach(function(team) {
          h += '<div style="font-size:11px;color:var(--cream);padding:2px 0"><span style="color:var(--gold)">' + escHtml(team.name) + ':</span> ' + team.members.join(" · ") + '</div>';
        });
        h += '</div>';
      }
      
      if (r.notes) h += '<div style="font-size:10px;color:var(--muted2);margin-top:6px;font-style:italic">' + escHtml(r.notes) + '</div>';
      h += '</div>';
    });
  }
  
  if (t.specialRules && t.specialRules.length) {
    h += '<div style="padding:14px 16px;border-top:1px solid var(--border);background:rgba(var(--gold-rgb),.03)">';
    h += '<div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Special Rules</div>';
    t.specialRules.forEach(function(rule) {
      h += '<div style="font-size:11px;color:var(--muted);padding:2px 0;display:flex;gap:6px"><span style="color:var(--gold)">•</span> ' + escHtml(rule) + '</div>';
    });
    h += '</div>';
  }
  
  h += '</div>';
  h += '<button class="btn full outline" onclick="generateAITournament()" style="margin-top:12px">Regenerate</button>';
  el.innerHTML = h;
}


// ========== SHARE ROUND CARD ==========

// Populate the hidden 1080x1080 pbShareTemplate with a round's data.
// Returns true if template was populated successfully.
function populateShareTemplateForRound(round) {
  if (!round) return false;
  // Apply user's active theme colors to the share template
  var tpl = document.getElementById("pbShareTemplate");
  if (tpl) {
    var bg = cssVar("--bg") || "#070b10";
    var gold = cssVar("--gold") || "#c9a84c";
    var cream = cssVar("--cream") || "#eae8e0";
    tpl.style.background = bg;
    tpl.style.color = cream;
    // Update brand name color
    var brandEl = tpl.querySelector(".pbs-brand-name");
    if (brandEl) brandEl.style.color = gold;
    // Update score diff colors
    var diffPos = tpl.querySelector(".pbs-diff-pos");
    if (diffPos) diffPos.style.color = gold;
    // Update stat labels
    tpl.querySelectorAll(".pbs-stat-lbl").forEach(function(el) { el.style.color = cssVar("--muted") || "#3d4a5c"; });
    tpl.querySelectorAll(".pbs-tot").forEach(function(el) { el.style.background = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.08)"; el.style.borderColor = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.2)"; });
    tpl.querySelectorAll(".pbs-tot-lbl").forEach(function(el) { el.style.color = gold; });
    tpl.querySelectorAll(".pbs-hn").forEach(function(el) { el.style.color = "rgba(" + (cssVar("--gold-rgb") || "201,168,76") + ",.6)"; });
  }
  var course = PB.getCourseByName(round.course);
  var diff = Math.round((round.score - (round.rating || 72)) * 10) / 10;
  var diffStr = diff > 0 ? "+" + diff : diff === 0 ? "E" : "" + diff;
  var playerName = round.playerName || (currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh");
  var holeScores = round.holeScores || [];
  // Par source priority: round.holePars > course.holes > defaultPars
  var holesData = [];
  if (round.holePars && round.holePars.length) {
    holesData = round.holePars.map(function(p) { return { par: p }; });
  } else if (course && course.holes && course.holes.length) {
    holesData = course.holes;
  }
  var teeName = round.tee || (course ? course.tee : "") || "";
  var teeYards = round.yards || (course ? course.yards : 0) || 0;
  var defaultPars = round.holePars || [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];

  // Compute FIR/GIR/putts
  var firCount = 0, girCount = 0, totalPutts = 0, firHoles = 0, completed = 0;
  for (var i = 0; i < holeScores.length; i++) {
    if (holeScores[i] === "" || holeScores[i] === undefined) continue;
    completed++;
    var par = (holesData[i] && holesData[i].par) ? holesData[i].par : defaultPars[i] || 4;
    if (par !== 3 && round.firData && round.firData[i]) firCount++;
    if (par !== 3) firHoles++;
    if (round.girData && round.girData[i]) girCount++;
    if (round.puttsData && round.puttsData[i]) totalPutts += round.puttsData[i];
  }

  var comm = PB.generateRoundCommentary({score:round.score, rating:round.rating||72, slope:round.slope||113});
  var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");

  // Populate hidden template elements
  var isScramble = round.format === "scramble" || round.format === "scramble4";
  var teamMembersEl = document.getElementById("pbs-team-members");
  if (isScramble) {
    // Find team and show team name + members
    var allRounds = PB.getRounds().filter(function(r){ return r.course === round.course && r.date === round.date && (r.format === "scramble" || r.format === "scramble4"); });
    var memberNames = allRounds.map(function(r){ return r.playerName; }).filter(Boolean);
    if (memberNames.indexOf(playerName) === -1) memberNames.unshift(playerName);
    var teamObj = PB.getScrambleTeams().find(function(t){ return memberNames.some(function(pn){ return t.members.some(function(mid){ var mp = PB.getPlayer(mid); return mp && mp.name === pn; }); }); });
    var teamName = teamObj ? teamObj.name : "Scramble Team";
    document.getElementById("pbs-player-name").textContent = teamName;
    if (teamMembersEl) { teamMembersEl.textContent = memberNames.join(", "); teamMembersEl.style.display = ""; }
  } else {
    document.getElementById("pbs-player-name").textContent = playerName || "—";
    if (teamMembersEl) { teamMembersEl.textContent = ""; teamMembersEl.style.display = "none"; }
  }
  document.getElementById("pbs-course").textContent = round.course || "—";
  var teeEl = document.getElementById("pbs-tee-info");
  if (teeEl) {
    var teeParts = [teeName, teeYards ? teeYards.toLocaleString() + " yds" : ""];
    if (round.format && round.format !== "stroke") {
      var fmtLabel = round.format === "scramble" ? "Scramble" : round.format === "scramble4" ? "4-Man Scramble" : round.format.charAt(0).toUpperCase() + round.format.slice(1);
      teeParts.push(fmtLabel);
    }
    if (round.holesPlayed && round.holesPlayed <= 9) {
      teeParts.push(round.holesMode === "back9" ? "Back 9" : "Front 9");
    }
    var teeStr = teeParts.filter(Boolean).join(" · ");
    teeEl.textContent = teeStr;
    teeEl.style.display = teeStr ? "" : "none";
  }
  document.getElementById("pbs-score").textContent = round.score;
  var diffEl = document.getElementById("pbs-diff");
  diffEl.textContent = diffStr;
  diffEl.className = "pbs-diff " + (diffStr.charAt(0) === "+" ? "pbs-diff-pos" : diffStr === "E" ? "pbs-diff-even" : "pbs-diff-neg");

  var statsEl = document.getElementById("pbs-stats-row");
  var statsHTML = "";
  if (firHoles > 0 && firCount > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + firCount + "/" + firHoles + '</div><div class="pbs-stat-lbl">FIR</div></div>';
  if (completed > 0 && girCount > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + girCount + "/" + completed + '</div><div class="pbs-stat-lbl">GIR</div></div>';
  if (totalPutts > 0 && round.puttsData && round.puttsData.some(function(p){return p > 0;})) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + totalPutts + '</div><div class="pbs-stat-lbl">Putts</div></div>';
  statsEl.innerHTML = statsHTML;

  document.getElementById("pbs-quip").textContent = quip ? "\u201C" + quip + "\u201D" : "";

  var scEl = document.getElementById("pbs-scorecard");
  var played = holeScores.filter(function(s){ return s !== "" && s !== undefined; }).length;
  if (played > 0) {
    scEl.innerHTML = buildScorecardHTML(holeScores, holesData, defaultPars, played);
  } else {
    scEl.innerHTML = "";
  }
  return true;
}

function showShareCard(score, diffStr, course, playerName, fir, firHoles, gir, holes, putts, shareText, roundId, holeScores, holesData, teeName, teeYards) {
  holeScores = holeScores || [];
  holesData  = holesData  || [];
  window._currentShareRoundId = roundId || null;
  var defaultPars = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var comm = PB.generateRoundCommentary({score:score, rating:72, slope:113});
  var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");

  // ── Populate the hidden template ──────────────────────────────
  document.getElementById("pbs-player-name").textContent = playerName || "—";
  document.getElementById("pbs-course").textContent      = course     || "—";

  // Tee + yards subtitle
  var teeEl = document.getElementById("pbs-tee-info");
  if (teeEl) {
    var teeStr = [teeName, teeYards ? teeYards.toLocaleString() + " yds" : ""].filter(Boolean).join(" · ");
    teeEl.textContent = teeStr;
    teeEl.style.display = teeStr ? "" : "none";
  }

  document.getElementById("pbs-score").textContent       = score;

  var diffEl = document.getElementById("pbs-diff");
  diffEl.textContent = diffStr || "";
  diffEl.className   = "pbs-diff " + (diffStr && diffStr.charAt(0) === "+" ? "pbs-diff-pos" : diffStr === "E" ? "pbs-diff-even" : "pbs-diff-neg");

  // Stats
  var statsEl = document.getElementById("pbs-stats-row");
  var statsHTML = "";
  if (firHoles > 0 && fir > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + fir + "/" + firHoles + "</div><div class=\"pbs-stat-lbl\">FIR</div></div>";
  if ((holes||18) > 0 && gir > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + gir + "/" + (holes||18) + "</div><div class=\"pbs-stat-lbl\">GIR</div></div>";
  if (putts > 0) statsHTML += '<div class="pbs-stat"><div class="pbs-stat-val">' + putts + "</div><div class=\"pbs-stat-lbl\">Putts</div></div>";
  statsEl.innerHTML = statsHTML;

  // Quip
  document.getElementById("pbs-quip").textContent = quip ? "\u201C" + quip + "\u201D" : "";

  // Scorecard
  var scEl = document.getElementById("pbs-scorecard");
  var played = holeScores.filter(function(s){return s !== "" && s !== undefined;}).length;
  if (played > 0) {
    scEl.innerHTML = buildScorecardHTML(holeScores, holesData, defaultPars, played);
  } else {
    scEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.3);font-size:16px;padding:20px 0">No hole-by-hole data — log with Play Now to see your scorecard here</div>';
  }

  // ── Show full-page share card ────────────────────────────────────
  var existing = document.getElementById("shareCardModal");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = "shareCardModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:300;overflow-y:auto;background:var(--bg);-webkit-overflow-scrolling:touch";

  var h = '';
  h += '<div style="width:100%;max-width:400px;margin:0 auto;padding:16px 16px 40px">';

  // ── Close / back button ──
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
  h += '<button onclick="closeShareCard()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:4px 0">← Back</button>';
  h += '</div>';

  // ── Header ──
  h += '<div style="text-align:center;margin-bottom:20px">';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px">'
        + '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><path d="M3 14V2" stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round"/><path d="M3 2l8 3-8 3" fill="rgba(var(--gold-rgb),.25)" stroke="var(--gold)" stroke-width="1.4" stroke-linejoin="round"/></svg>'
        + '<div style="font-size:20px;font-weight:700;color:var(--cream)">Your Scorecard</div>'
        + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);line-height:1.5">Share to Instagram, iMessage, or anywhere else</div>';
  h += '</div>';

  // ── Preview card ──
  h += '<div id="pbsPreviewWrap" style="width:100%;border-radius:12px;overflow:hidden;background:var(--grad-deep);box-shadow:0 8px 40px rgba(0,0,0,.6);margin-bottom:20px">';
  h += '<div style="transform:scale(0.315);transform-origin:top left;width:1080px;height:1080px;pointer-events:none" id="pbsPreviewInner"></div>';
  h += '</div>';

  // ── Action label ──
  h += '<div style="font-size:11px;color:var(--muted2);text-align:center;margin-bottom:10px;letter-spacing:.3px">Tap to save your scorecard as an image</div>';

  // ── Buttons ──
  h += '<div style="display:flex;flex-direction:column;gap:10px">';
  h += '<button class="btn full green" onclick="captureShareCard()" style="font-size:14px;padding:16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;width:100%"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="9" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 4l1-2h3l1 2" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>Save image &amp; share to socials</button>';
  h += '<button class="btn full outline" onclick="closeShareCard()" style="font-size:13px;padding:14px">Done</button>';
  h += '</div>';

  // ── Reassurance ──
  h += '<div style="font-size:10px;color:var(--muted2);text-align:center;margin-top:14px;opacity:.6">You can always reshare from your Round History</div>';
  h += '</div>';

  modal.innerHTML = h;
  document.body.appendChild(modal);

  // Set preview wrap height to match 31.5% of 1080
  var wrap = document.getElementById("pbsPreviewWrap");
  if (wrap) wrap.style.height = Math.round(1080 * 0.315) + "px";

  // Clone the template into the preview
  var previewInner = document.getElementById("pbsPreviewInner");
  var template = document.getElementById("pbShareTemplate");
  if (previewInner && template) {
    previewInner.innerHTML = template.innerHTML;
  }

  // Party games
  if (db) {
    var today = localDateStr();
    db.collection("partygames").where("roundDate","==",today).where("status","==","completed").get().then(function(snap) {
      if (snap.empty) return;
      var qEl = document.getElementById("pbs-quip");
      if (!qEl) return;
      var gameLines = "";
      snap.forEach(function(doc) {
        var g = doc.data();
        var game = PARTY_GAMES.find(function(pg){return pg.id===g.gameType})||{name:g.gameType};
        gameLines += "\n" + game.name + ": " + escHtml(g.winnerName||"TBD");
      });
      if (gameLines && qEl.textContent) qEl.textContent += gameLines;
    }).catch(function(){});
  }
}

function buildScorecardHTML(holeScores, holesData, defaultPars, played) {
  function getPar(i) {
    if (holesData && holesData[i] && holesData[i].par) return holesData[i].par;
    return defaultPars[i] || 4;
  }

  // Determine which nines have data
  var front9count = 0, back9count = 0;
  for (var fi = 0; fi < 9; fi++) { if (holeScores[fi] !== "" && holeScores[fi] !== undefined) front9count++; }
  for (var bi = 9; bi < 18; bi++) { if (holeScores[bi] !== "" && holeScores[bi] !== undefined) back9count++; }

  var is9only = (front9count > 0 && back9count === 0) || (back9count > 0 && front9count === 0);

  // Fixed-size container for each score symbol — prevents overflow
  var W = 'rgba(255,255,255,.88)';
  var F = 'display:flex;align-items:center;justify-content:center;';

  // Larger symbols for 9-hole cards
  var symScale = is9only ? 1.3 : 1;

  function num(n, size) { return '<span style="font-size:' + Math.round(size * symScale) + 'px;font-weight:700;color:#fff;line-height:1">' + n + '</span>'; }

  function sym(score, par) {
    var n = parseInt(score), d = n - par;
    // Font size scales down for 2+ digit scores to prevent overflow
    var baseSize = n >= 10 ? 16 : 20;
    var smallSize = n >= 10 ? 12 : 14;
    var outerW = Math.round(46 * symScale), innerW = Math.round(30 * symScale);
    var birdW = Math.round(38 * symScale), bogW = Math.round(38 * symScale);
    var shape;
    if (d <= -2) {
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:50%;border:2px solid ' + W + '">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:50%;border:2px solid ' + W + '">' + num(n, smallSize) + '</div></div>';
    } else if (d === -1) {
      shape = '<div style="' + F + 'width:' + birdW + 'px;height:' + birdW + 'px;border-radius:50%;border:2px solid ' + W + '">' + num(n, baseSize) + '</div>';
    } else if (d === 0) {
      shape = num(n, baseSize + 2);
    } else if (d === 1) {
      shape = '<div style="' + F + 'width:' + bogW + 'px;height:' + bogW + 'px;border-radius:3px;border:2px solid ' + W + '">' + num(n, baseSize) + '</div>';
    } else if (d === 2) {
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:3px;border:2px solid ' + W + '">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:2px;border:2px solid ' + W + '">' + num(n, smallSize) + '</div></div>';
    } else {
      var ts = n >= 10 ? 11 : 13;
      shape = '<div style="' + F + 'width:' + outerW + 'px;height:' + outerW + 'px;border-radius:3px;border:2px solid rgba(255,255,255,.45)">'
            + '<div style="' + F + 'width:' + innerW + 'px;height:' + innerW + 'px;border-radius:2px;border:2px solid rgba(255,255,255,.45)">' + num(n, ts) + '</div></div>';
    }
    var cellW = Math.round(54 * symScale);
    return '<div style="' + F + 'width:' + cellW + 'px;height:' + cellW + 'px;flex-shrink:0;overflow:visible">' + shape + '</div>';
  }

  function nineHTML(start, label) {
    var count = 0;
    for (var ci = start; ci < start + 9; ci++) { if (holeScores[ci] !== "" && holeScores[ci] !== undefined) count++; }
    if (count === 0) return "";

    // 9-hole card: larger cells, bigger hole numbers
    var cellPad = is9only ? "12px 5px 14px" : "8px 3px 10px";
    var cellMinH = is9only ? "110px" : "82px";
    var hnSize = is9only ? "14px" : "10px";

    var html = '<div class="pbs-nine">';
    var total = 0, totalPar = 0;
    for (var i = 0; i < 9; i++) {
      var hi = start + i, s = holeScores[hi], par = getPar(hi);
      var hasScore = s !== "" && s !== undefined;
      if (hasScore) { total += parseInt(s); totalPar += par; }
      html += '<div class="pbs-cell" style="padding:' + cellPad + ';min-height:' + cellMinH + '"><div class="pbs-hn" style="font-size:' + hnSize + '">' + (hi + 1) + '</div>';
      html += '<div class="pbs-sw">' + (hasScore ? sym(s, par) : "") + '</div></div>';
    }
    var over = total - totalPar, tc = over > 0 ? "pbs-tot-pos" : over < 0 ? "pbs-tot-neg" : "pbs-tot-even";
    var totW = is9only ? "90px" : "76px";
    var totValSize = is9only ? "38px" : "32px";
    html += '<div class="pbs-tot" style="width:' + totW + '"><div class="pbs-tot-lbl">' + label + '</div><div class="pbs-tot-val ' + tc + '" style="font-size:' + totValSize + '">' + (total||"—") + '</div></div></div>';
    return html;
  }

  var html = "";
  if (front9count > 0) html += nineHTML(0, "F9");
  if (back9count > 0) html += nineHTML(9, "B9");
  return html;
}

function captureShareCard() {
  var template = document.getElementById("pbShareTemplate");
  if (!template || typeof html2canvas === "undefined") {
    Router.toast("Share not available — try updating the app");
    return;
  }
  Router.toast("Generating image...");
  // Briefly make visible at its actual size so html2canvas can capture it
  template.style.left = "-1080px";
  template.style.visibility = "visible";

  document.fonts.ready.then(function() {
    html2canvas(template.querySelector(".pbs-inner") || template, {
      scale: 1,
      width: 1080,
      height: 1080,
      backgroundColor: "#090d14",
      useCORS: false,
      logging: false,
      allowTaint: true
    }).then(function(canvas) {
      template.style.left = "-9999px";
      template.style.visibility = "";
      canvas.toBlob(function(blob) {
        if (!blob) { Router.toast("Couldn't generate image"); return; }

        // ── Track share count + check achievements ──────────────────────
        // Only count 1 share per unique round — no inflation from re-downloads
        if (!window._sharedRoundIds) window._sharedRoundIds = {};
        var rid = window._currentShareRoundId;
        var isNewShare = rid && !window._sharedRoundIds[rid];
        if (isNewShare) {
          window._sharedRoundIds[rid] = true;
          var shareCount = (window._pbShareCount || 0) + 1;
          window._pbShareCount = shareCount;
          if (db && currentUser) {
            db.collection("members").doc(currentUser.uid).update({
              shareCount: firebase.firestore.FieldValue.increment(1),
              sharedRounds: firebase.firestore.FieldValue.arrayUnion(rid)
            }).catch(function(){});
          }
          var shareMilestones = {1:"share_1", 5:"share_5", 10:"share_10", 25:"share_25", 50:"share_50", 100:"share_100"};
          if (shareMilestones[shareCount]) {
            var achId = shareMilestones[shareCount];
            var allAch = getAllPossibleAchievements();
            var ach = allAch.find(function(a){return a.id===achId;});
            if (ach) Router.toast("Achievement unlocked: " + ach.name + " +" + ach.xp + " XP");
          }
        }
        var file = new File([blob], "parbaughs-scorecard.png", {type:"image/png"});
        if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
          navigator.share({files:[file], title:"The Parbaughs Scorecard"})
            .then(function() { showShareSuccess(); })
            .catch(function(){ downloadScorecardImage(blob); showShareSuccess(); });
        } else {
          downloadScorecardImage(blob);
          showShareSuccess();
        }
      }, "image/png");
    }).catch(function(e) {
      template.style.left = "-9999px";
      template.style.visibility = "";
      console.error("html2canvas error:", e);
      Router.toast("Couldn't generate image");
    });
  });
}
function showRoundShareCard(roundId) {
  // Navigate to round detail page where the scorecard preview is embedded
  Router.go("rounds", {roundId: roundId});
}

// ── Generic share image modal — used by all contexts ─────────────────────────
var _rangeReviewState = {}; // Set by endRangeSession()

function showShareImageModal(drawFn, filename) {
  var existing = document.getElementById("shareCardModal");
  if (existing) existing.remove();
  var modal = document.createElement("div");
  modal.id = "shareCardModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:300;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center;padding:20px;padding-top:40px";
  modal.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,.7)" onclick="closeShareCard()"></div>'
    + '<div style="position:relative;width:100%;max-width:320px">'
    + '<canvas id="genericShareCanvas" style="width:100%;border-radius:12px;display:block;box-shadow:0 8px 32px rgba(0,0,0,.6)"></canvas>'
    + '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">'
    + '<button class="btn full green" onclick="shareGenericCanvas(\'' + (filename||'parbaughs.png') + '\')" style="font-size:13px">Save as image</button>'
    + '<button class="btn full outline" onclick="closeShareCard()" style="font-size:12px">Done</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function() { drawFn(document.getElementById("genericShareCanvas")); }, 60);
}

function shareGenericCanvas(filename) {
  var canvas = document.getElementById("genericShareCanvas");
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    if (!blob) return;
    var file = new File([blob], filename, {type:"image/png"});
    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
      navigator.share({files:[file], title:(window._activeLeagueName || "Parbaughs")}).catch(function(){ downloadScorecardImage(blob); });
    } else { downloadScorecardImage(blob); }
  }, "image/png");
}

// ── CSS Variable resolver for Canvas 2D API ─────────────────────────────────
// Canvas 2D ctx.fillStyle/strokeStyle cannot resolve CSS variables directly.
// This helper reads computed values so canvas share cards stay theme-aware.
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function cssRgba(rgbVarName, alpha) {
  return 'rgba(' + cssVar(rgbVarName) + ',' + alpha + ')';
}

// ── Range session share card ──────────────────────────────────────────────────
function showRangeShareCard() {
  var s = _rangeReviewState;
  showShareImageModal(function(canvas) {
    drawRangeCanvas(canvas, s.elapsed||0, s.xp||0, s.drillNames||[], s.focus||"", s.feel||0);
  }, "parbaughs-range.png");
}

function drawRangeCanvas(canvas, elapsed, xp, drillNames, focus, feel) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");

  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18'), PINK=cssVar('--pink');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--pink-rgb','.06')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, S-48, S-48);

  // Brand
  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.fillStyle = PINK; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("RANGE SESSION", S/2, 112);

  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 130); ctx.lineTo(S-80, 130); ctx.stroke();

  // Time
  var mins = Math.round(elapsed/60); if (mins < 1) mins = 1;
  var m = Math.floor(mins); var secs = elapsed - m*60;
  var timeStr = m + ":" + (secs < 10 ? "0" : "") + secs;
  ctx.fillStyle = GOLD; ctx.font = "800 160px 'Helvetica Neue',Arial,sans-serif";
  ctx.textAlign = "center"; ctx.fillText(timeStr, S/2, 320);
  ctx.fillStyle = MUTED; ctx.font = "500 24px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("time on range", S/2, 360);

  // XP
  if (xp) {
    ctx.fillStyle = GOLD; ctx.font = "700 44px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("+" + xp + " XP", S/2, 430);
  }

  // Focus
  if (focus) {
    ctx.fillStyle = CREAM; ctx.font = "600 28px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("Focus: " + focus, S/2, 500);
  }

  // Feel
  var feelLabel = ["","Rough","Solid","Dialed"][feel] || "";
  var feelColor = [MUTED,cssVar('--red'),CREAM,GOLD][feel] || MUTED;
  if (feelLabel) {
    ctx.fillStyle = feelColor; ctx.font = "600 24px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText(feelLabel, S/2, 548);
  }

  // Drills
  if (drillNames.length) {
    var dy = 610;
    ctx.fillStyle = MUTED; ctx.font = "500 17px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText("DRILLS WORKED", S/2, dy);
    drillNames.slice(0,5).forEach(function(n) {
      dy += 40;
      ctx.fillStyle = CREAM; ctx.font = "400 22px 'Helvetica Neue',Arial,sans-serif";
      ctx.fillText(n, S/2, dy);
    });
  }

  // Footer
  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80, S-56, S-160, 1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

// ── Scramble round share card ─────────────────────────────────────────────────
function showScrambleShareCard(teamName, score, course, format) {
  showShareImageModal(function(canvas) {
    drawScrambleCanvas(canvas, teamName, score, course, format);
  }, "parbaughs-scramble.png");
}

function drawScrambleCanvas(canvas, teamName, score, course, format) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");
  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18');
  var par = 72; var diff = score - par;
  var diffStr = diff === 0 ? "E" : (diff > 0 ? "+" + diff : "" + diff);
  var diffColor = diff > 0 ? cssVar('--red') : diff < 0 ? cssVar('--live') : GOLD;
  ctx.fillStyle = BG; ctx.fillRect(0,0,S,S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--gold-rgb','.05')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3; ctx.strokeRect(24,24,S-48,S-48);

  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.fillStyle = MUTED; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("SCRAMBLE", S/2, 112);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80,130); ctx.lineTo(S-80,130); ctx.stroke();

  ctx.fillStyle = CREAM; ctx.font = "800 160px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText(score, S/2, 320);
  ctx.fillStyle = diffColor; ctx.font = "700 48px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText(diffStr, S/2, 386);
  ctx.fillStyle = CREAM; ctx.font = "600 32px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText(teamName || "Team", S/2, 456);
  ctx.fillStyle = MUTED; ctx.font = "400 22px 'Helvetica Neue',Arial,sans-serif";
  var cText = (course||"").length > 32 ? (course||"").substring(0,32)+"…" : (course||"");
  ctx.fillText(cText, S/2, 496);
  if (format) { ctx.fillStyle = GOLD; ctx.font = "500 18px 'Helvetica Neue',Arial,sans-serif"; ctx.fillText(format.toUpperCase(), S/2, 536); }

  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80,S-56,S-160,1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

// ── Event leaderboard share card ──────────────────────────────────────────────
function showEventShareCard(eventName, standings) {
  showShareImageModal(function(canvas) {
    drawEventCanvas(canvas, eventName, standings);
  }, "parbaughs-event.png");
}

function drawEventCanvas(canvas, eventName, standings) {
  var S = 1080;
  canvas.width = S; canvas.height = S;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  var ctx = canvas.getContext("2d");
  var BG=cssVar('--bg'), GOLD=cssVar('--gold'), CREAM=cssVar('--cream'), MUTED=cssVar('--muted'), BORDER=cssRgba('--gold-rgb','.18');
  ctx.fillStyle = BG; ctx.fillRect(0,0,S,S);
  var grad = ctx.createLinearGradient(0,0,S,S);
  grad.addColorStop(0,cssRgba('--gold-rgb','.05')); grad.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,S,S);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 3; ctx.strokeRect(24,24,S-48,S-48);

  ctx.fillStyle = GOLD; ctx.font = "700 22px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("THE PARBAUGHS", S/2, 80);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80,100); ctx.lineTo(S-80,100); ctx.stroke();

  // Event name
  ctx.fillStyle = CREAM; ctx.font = "700 46px 'Helvetica Neue',Arial,sans-serif";
  var eName = (eventName||"Event").length > 24 ? (eventName||"Event").substring(0,24)+"…" : (eventName||"Event");
  ctx.fillText(eName, S/2, 178);

  // Standings
  var medals = ["#1","#2","#3"];
  var medalColors = [GOLD,cssVar('--medal-silver'),cssVar('--medal-bronze'),MUTED,MUTED,MUTED];
  var sy = 260;
  (standings || []).slice(0,6).forEach(function(s, i) {
    var isWinner = i === 0;
    var rowH = isWinner ? 112 : 80;
    var pad = 48;
    ctx.fillStyle = isWinner ? cssRgba('--gold-rgb','.08') : "rgba(255,255,255,.02)";
    roundRectFill(ctx, pad, sy, S - pad*2, rowH - 8, 8);
    if (isWinner) {
      ctx.strokeStyle = cssRgba('--gold-rgb','.2'); ctx.lineWidth = 1;
      roundRectStroke(ctx, pad, sy, S - pad*2, rowH - 8, 8);
    }
    ctx.fillStyle = medalColors[i] || MUTED;
    ctx.font = (isWinner ? "800" : "600") + " " + (isWinner ? 36 : 26) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText((i+1)+".", pad + 24, sy + (isWinner ? 44 : 32));
    ctx.fillStyle = isWinner ? CREAM : MUTED;
    ctx.font = (isWinner ? "700" : "500") + " " + (isWinner ? 34 : 26) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.fillText(s.name||"", pad + 80, sy + (isWinner ? 44 : 32));
    ctx.fillStyle = medalColors[i] || MUTED;
    ctx.font = (isWinner ? "800" : "700") + " " + (isWinner ? 38 : 28) + "px 'Helvetica Neue',Arial,sans-serif";
    ctx.textAlign = "right";
    ctx.fillText((s.pts||0) + " pts", S - pad - 24, sy + (isWinner ? 44 : 32));
    sy += rowH;
  });

  ctx.fillStyle = cssRgba('--gold-rgb','.3'); ctx.fillRect(80,S-56,S-160,1);
  ctx.fillStyle = GOLD; ctx.font = "600 18px 'Helvetica Neue',Arial,sans-serif"; ctx.textAlign = "center";
  ctx.fillText("parbaughs.golf", S/2, S-32);
}

function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.fill();
}
function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.stroke();
}

function copyShareText() {
  var ta = document.getElementById("shareCardText");
  if (ta) {
    ta.style.left = "0";
    ta.select();
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ta.value).then(function() { Router.toast("Copied!"); });
      } else {
        document.execCommand("copy");
        Router.toast("Copied!");
      }
    } catch(e) { Router.toast("Couldn't copy — long press to select"); }
    ta.style.left = "-9999px";
  }
}

function closeShareCard() {
  var modal = document.getElementById("shareCardModal");
  if (modal) modal.remove();
  Router.go("rounds");
}

function showShareSuccess() {
  var modal = document.getElementById("shareCardModal");
  if (!modal) return;
  modal.innerHTML = '<div style="position:relative;width:100%;max-width:360px;text-align:center;padding-top:120px">' +
    '<div style="margin-bottom:16px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--birdie)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg></div>' +
    '<div style="font-size:22px;font-weight:700;color:var(--gold);margin-bottom:8px">SUCCESS</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-bottom:24px">Scorecard saved! Share it everywhere.</div>' +
    '<button class="btn full green" onclick="closeShareCard()" style="max-width:280px;margin:0 auto">Done</button>' +
    '</div>';
}


// ========== PRESENCE / WHO'S ONLINE ==========
var onlineMembers = {};

function updatePresence() {
  if (!db || !currentUser) return;
  var presenceData = {
    uid: currentUser.uid,
    name: currentProfile ? (currentProfile.name || currentProfile.username) : "Member",
    lastSeen: fsTimestamp(),
    online: true
  };
  if (typeof liveState !== "undefined" && liveState && liveState.active) {
    var scored = liveState.scores.filter(function(s){return s!==""});
    presenceData.liveRound = {
      course: liveState.course || "",
      hole: (liveState.currentHole || 0) + 1,
      score: scored.reduce(function(a,b){return a+parseInt(b)},0),
      thru: scored.length,
      startTime: liveState.startTime || null,
      format: liveState.format || "stroke",
      tee: liveState.tee || "",
      holeScores: liveState.scores.slice(),
      holePars: liveState.holes && liveState.holes.length
        ? liveState.holes.map(function(h){return h.par||4;})
        : [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5]
    };
  } else {
    presenceData.liveRound = null;
  }
  // Skip redundant writes — only write if state changed or forced heartbeat
  var sig = (presenceData.name||"") + "|" + (liveState.active ? liveState.currentHole + ":" + liveState.scores.filter(function(s){return s!==""}).length + ":" + liveState.scores.filter(function(s){return s!==""}).reduce(function(a,b){return a+parseInt(b)},0) : "idle");
  if (updatePresence._lastSig === sig && !updatePresence._force) return;
  updatePresence._lastSig = sig;
  updatePresence._force = false;
  db.collection("presence").doc(currentUser.uid).set(presenceData, { merge: true }).catch(function(){});
}



function showAchievementCelebration(ach) {
  // Remove any existing celebration
  var existing = document.getElementById("achCelebration");
  if (existing) existing.remove();

  var el = document.createElement("div");
  el.id = "achCelebration";
  el.className = "ach-celebrate";
  el.innerHTML = '<div style="background:linear-gradient(135deg,rgba(var(--gold-rgb),.18),rgba(var(--gold-rgb),.08));border:1.5px solid rgba(var(--gold-rgb),.4);border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:14px;backdrop-filter:blur(8px)">'
    + '<div style="width:44px;height:44px;border-radius:12px;background:rgba(var(--gold-rgb),.15);border:1.5px solid rgba(var(--gold-rgb),.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold)">' + ach.icon + '</div>'
    + '<div style="flex:1;min-width:0">'
    + '<div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:3px">Achievement Unlocked</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--cream)">' + escHtml(ach.name) + '</div>'
    + '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(ach.desc) + '</div>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:800;color:var(--gold);flex-shrink:0">+' + ach.xp + ' XP</div>'
    + '</div>';
  document.body.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 4200);
}

// ========== ACHIEVEMENT DETECTION + XP AWARD SYSTEM ==========
function checkAndAwardNewAchievements() {
  if (!currentUser || !db) return;
  var uid = currentUser.uid;
  var currentAchs = PB.getAchievements(uid);
  var currentIds = currentAchs.map(function(a) { return a.id; });

  db.collection("members").doc(uid).get().then(function(doc) {
    if (!doc.exists) return;
    var stored = doc.data().earnedAchievements || [];
    var newlyEarned = currentIds.filter(function(id) { return stored.indexOf(id) === -1; });

    if (newlyEarned.length > 0) {
      newlyEarned.forEach(function(id, i) {
        var ach = currentAchs.find(function(a) { return a.id === id; });
        if (!ach) return;
        setTimeout(function() {
          showAchievementCelebration(ach);
          // Also push a notification to the bell
          if (db && currentUser) {
            db.collection("notifications").add({
              toUid: currentUser.uid,
              type: "achievement",
              title: "Achievement unlocked: " + ach.name,
              body: ach.desc + " (+" + ach.xp + " XP)",
              icon: ach.icon,
              createdAt: fsTimestamp(),
              read: false
            }).catch(function(){});
          }
          // ── ParCoin: award coins for achievement unlock ──
          if (currentUser) {
            var achCoins = calcAchievementCoins(ach.xp || 50);
            awardCoins(currentUser.uid, achCoins, "achievement", "Unlocked: " + ach.name, "ach_" + id);
          }
        }, i * 4500);
      });
      db.collection("members").doc(uid).update({ earnedAchievements: currentIds }).catch(function(){});
    } else if (stored.length === 0 && currentIds.length > 0) {
      // First run — store silently, no celebrations for retroactive achievements
      db.collection("members").doc(uid).update({ earnedAchievements: currentIds }).catch(function(){});
    }
  }).catch(function() {});
}

function startPresenceSystem() {
  if (!db || !currentUser) return;
  
  // Update immediately, then every 5 min (saves 60% writes vs 2 min)
  updatePresence._force = true;
  updatePresence();
  setInterval(function() { updatePresence._force = true; updatePresence(); }, 300000);
  
  // Set offline on page unload
  window.addEventListener("beforeunload", function() {
    if (db && currentUser) {
      db.collection("presence").doc(currentUser.uid).update({ online: false }).catch(function(){});
    }
  });
  
  // Listen to presence — 10 min window (matches 5 min heartbeat with buffer)
  if (window._presenceUnsub) window._presenceUnsub();
  window._presenceUnsub = db.collection("presence").onSnapshot(function(snap) {
    onlineMembers = {};
    var now = new Date();
    snap.forEach(function(doc) {
      var data = doc.data();
      if (data.lastSeen && data.lastSeen.toDate) {
        var diff = now - data.lastSeen.toDate();
        if (diff < 600000) { onlineMembers[doc.id] = data; }
      }
    });
    renderOnlineSection();
  }, function(err) { pbWarn("[Presence] error:", err.message); });
}

// ========== FIRESTORE ACTIVITY FEED ==========
function renderFeedItem(a) {
  var timeLabel = a.ts ? feedTimeAgo(a.ts) : "";
  // Resolve player for avatar
  var _fp = a.playerId && a.playerId !== "system" ? PB.getPlayer(a.playerId) : null;

  // ── Chat messages ──
  if (a.type === "chat") {
    var clickAttr = a.dest ? ' onclick="' + a.dest + '" style="cursor:pointer"' : '';
    if (a.system) {
      var h = '<div style="display:flex;gap:10px;padding:8px 16px;border-left:3px solid var(--birdie);margin:2px 0;background:rgba(var(--birdie-rgb),.03)"' + clickAttr + '>';
      h += '<div style="width:28px;height:28px;min-width:28px;border-radius:50%;background:rgba(var(--birdie-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:14px">\u26f3</span></div>';
      h += '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
      h += '<span style="font-size:10px;font-weight:700;color:var(--birdie)">The Caddy</span>';
      h += '<span style="font-size:9px;color:var(--muted2)">' + timeLabel + '</span></div>';
      h += '<div style="font-size:12px;color:var(--cream);line-height:1.6">' + escHtml(a.sub) + '</div>';
      h += '</div></div>';
      return h;
    }
    var h = '<div style="display:flex;gap:10px;padding:8px 16px;border-left:2px solid rgba(var(--gold-rgb),.15);margin:1px 0"' + clickAttr + '>';
    h += renderAvatar(_fp, 28, true);
    h += '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<span style="font-size:10px;font-weight:700;color:var(--gold)">' + renderUsername(_fp, '', true) + '</span>';
    h += '<span style="font-size:9px;color:var(--muted2)">' + timeLabel + '</span></div>';
    h += '<div style="font-size:11px;color:var(--cream);margin-top:2px;line-height:1.5">' + escHtml(a.sub) + '</div>';
    h += '</div></div>';
    return h;
  }

  // ── Range sessions ──
  if (a.type === "range") {
    var h = '<div class="feed-row" style="display:flex;align-items:center;gap:12px;padding:10px 16px"' + (a.dest ? ' onclick="' + a.dest + '"' : '') + '>';
    h += renderAvatar(_fp, 36, true);
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(a.name) + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + escHtml(a.sub || '') + '</div></div>';
    h += '<div style="font-size:9px;color:var(--muted2)">' + timeLabel + '</div>';
    h += '</div>';
    return h;
  }

  // ── Rounds — Instagram-style with avatar ──
  var cardCss = '';
  if (_fp) cardCss = getPlayerCardCss(_fp);
  var h = '<div class="feed-row" style="display:flex;gap:12px;padding:12px 16px;align-items:flex-start;' + cardCss + '">';
  // Avatar
  h += renderAvatar(_fp, 44, true);
  // Content
  h += '<div style="flex:1;min-width:0">';
  // Name + score row
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  h += '<div style="min-width:0;flex:1">';
  h += '<div style="display:flex;align-items:center;gap:6px">';
  h += '<span style="font-size:13px;font-weight:700">' + renderUsername(_fp, 'color:var(--cream);', true) + '</span>';
  if (a.live) h += '<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:5px;height:5px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite"></span><span style="font-size:8px;color:var(--live);font-weight:700">LIVE</span></span>';
  h += '</div>';
  if (a.sub) h += '<div style="font-size:11px;color:var(--muted);margin-top:2px;line-height:1.3">' + escHtml(a.sub) + '</div>';
  h += '</div>';
  h += '<div style="flex-shrink:0;text-align:right;margin-left:8px">';
  if (a.score) h += '<div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:var(--gold);line-height:1">' + a.score + '</div>';
  h += '<div style="font-size:9px;color:var(--muted2);margin-top:2px">' + timeLabel + '</div>';
  h += '</div></div>';
  if (a.quip) h += '<div style="font-size:11px;color:var(--gold2);margin-top:4px;font-style:italic;line-height:1.4">' + a.quip + '</div>';

  // Like/comment actions for rounds
  if (a.type === "round" && a.roundId) {
    var likeCount = a.likeCount || 0;
    var commentCount = a.commentCount || 0;
    var isLiked = a.isLiked || false;
    h += '<div class="feed-actions">';
    h += '<div class="feed-action' + (isLiked ? ' active' : '') + '" onclick="event.stopPropagation();likeFeedRound(\'' + a.roundId + '\',this)"><svg viewBox="0 0 16 16" width="14" height="14" fill="' + (isLiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.2"><path d="M8 14s-5.5-3.5-5.5-7A2.5 2.5 0 018 4.5 2.5 2.5 0 0113.5 7C13.5 10.5 8 14 8 14z"/></svg><span>' + (likeCount || '') + '</span></div>';
    h += '<div class="feed-action" onclick="event.stopPropagation();toggleFeedComments(\'' + a.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 3h12v8H5l-3 3V3z"/></svg><span>' + (commentCount || '') + '</span></div>';
    if (a.dest) h += '<div class="feed-action" onclick="event.stopPropagation();' + a.dest + '" style="margin-left:auto;font-size:10px;font-weight:600;color:var(--gold)">View <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div>';
    h += '</div>';
    h += '<div id="feedComments_' + a.roundId + '" class="feed-comments" style="display:none"></div>';
  }

  h += '</div></div>';
  return h;
}

function loadHomeActivityFeed() {
  var el = document.getElementById("homeActivityFeed");
  if (!el || !db) {
    // Fallback to in-memory data
    if (el) renderHomeActivityFromMemory(el);
    return;
  }
  var items = [];
  var pending = 0;
  function tryRender() {
    if (pending > 0) return;
    if (!items.length) {
      el.innerHTML = '<div class="card"><div class="empty" style="padding:24px"><div class="empty-text">Nothing yet</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">Log a round, hit the range, or post a tee time</div></div></div>';
      return;
    }
    items.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
    var h = '<div class="card" style="max-height:600px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    items.forEach(function(a) { h += renderFeedItem(a); });
    h += '</div>';
    el.innerHTML = h;
  }

  // 1. Recent rounds from Firestore
  pending++;
  leagueQuery("rounds").orderBy("createdAt","desc").limit(30).get().then(function(snap) {
    var scrambleGroups = {}; // Group scramble by course+date
    snap.forEach(function(doc) {
      var r = doc.data();
      // leagueId filtered by leagueQuery()
      var rid = doc.id;
      var isScramble = r.format === "scramble" || r.format === "scramble4";

      if (isScramble) {
        // Group scramble rounds into one feed entry
        var groupKey = (r.course||"") + "|" + (r.date||"");
        if (!scrambleGroups[groupKey]) {
          scrambleGroups[groupKey] = { course: r.course, date: r.date, score: r.score, tee: r.tee, players: [], ts: r.createdAt ? r.createdAt.toMillis() : 0, rid: rid, likes: r.likes || [], comments: r.comments || [] };
        }
        scrambleGroups[groupKey].players.push(r.playerName || "Parbaugh");
        return;
      }
      
      var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
      var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");
      var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
      var feedCourse = r.course ? PB.getCourseByName(r.course) : null;
      var teeLabel = r.tee ? " · " + r.tee : (feedCourse && feedCourse.tee ? " · " + feedCourse.tee : "");
      var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
      var likes = r.likes || [];
      var comments = r.comments || [];
      var isLiked = currentUser ? likes.indexOf(currentUser.uid) !== -1 : false;
      var timeAgo = feedTimeAgo(r.createdAt ? r.createdAt.toMillis() : 0);
      items.push({type:"round", roundId:rid, playerId:r.player, playerName:r.playerName||"A Parbaugh", name:(r.playerName||"A Parbaugh") + " posted a round", sub:(r.course||"") + teeLabel + " · " + r.score + holeLabel + fmtLabel, quip:quip, score:r.score, date:r.date||"", ts:r.createdAt ? r.createdAt.toMillis() : 0, dest:"Router.go('rounds',{roundId:'" + rid + "'})", likeCount:likes.length, commentCount:comments.length, isLiked:isLiked, timeAgo:timeAgo});
    });
    // Add grouped scramble entries
    Object.values(scrambleGroups).forEach(function(g) {
      var teamObj = PB.getScrambleTeams().find(function(t){ return g.players.some(function(pn){ return t.members.some(function(mid){ var mp = PB.getPlayer(mid); return mp && mp.name === pn; }); }); });
      var teamName = teamObj ? teamObj.name : "Scramble Team";
      var playerList = g.players.join(", ");
      var teeLabel = g.tee ? " · " + g.tee : "";
      var isLiked = currentUser ? g.likes.indexOf(currentUser.uid) !== -1 : false;
      items.push({type:"round", roundId:g.rid, name:teamName + " posted a scramble", sub:(g.course||"") + teeLabel + " · " + g.score + " · Scramble", quip:playerList, score:g.score, date:g.date||"", ts:g.ts, dest:"Router.go('rounds',{roundId:'" + g.rid + "'})", likeCount:g.likes.length, commentCount:g.comments.length, isLiked:isLiked, timeAgo:feedTimeAgo(g.ts)});
    });
    pending--; tryRender();
  }).catch(function() {
    // orderBy may need index — fall back to state.rounds
    PB.getRounds().slice().reverse().slice(0,30).forEach(function(r) {
      var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
      var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");
      var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
      var feedCourse2 = r.course ? PB.getCourseByName(r.course) : null;
      var teeLabel = r.tee ? " · " + r.tee : (feedCourse2 && feedCourse2.tee ? " · " + feedCourse2.tee : "");
      items.push({type:"round", roundId:r.id, name:(r.playerName||"A Parbaugh") + " posted a round", sub:(r.course||"") + teeLabel + " · " + r.score + holeLabel, quip:quip, score:r.score, date:r.date||"", ts:r.timestamp||0, dest:"Router.go('rounds',{roundId:'" + r.id + "'})", likeCount:(r.likes||[]).length, commentCount:(r.comments||[]).length, isLiked:currentUser?(r.likes||[]).indexOf(currentUser.uid)!==-1:false, timeAgo:feedTimeAgo(r.timestamp||0)});
    });
    pending--; tryRender();
  });

  // 2. Range sessions from live listener
  pending++;
  if (typeof liveRangeSessions !== "undefined") {
    liveRangeSessions.filter(function(s){return s.visibility !== "private";}).slice(0,8).forEach(function(s) {
      var name = s.playerName || s.playerId || "A Parbaugh";
      var sub = (s.durationMin ? s.durationMin + " min" : "") + (s.focus ? " · " + s.focus : "");
      var sessionDest = s._id ? "Router.go('range-detail',{sessionId:'" + s._id + "'})" : (s.playerId ? "Router.go('members',{id:'" + s.playerId + "'})" : "Router.go('range')");
      items.push({type:"range", playerId:s.playerId||"", name:name + " hit the range", sub:sub||"Range session", date:s.date||"", ts:s.startedAt ? new Date(s.startedAt).getTime() : 0, dest:sessionDest});
    });
  }
  pending--; tryRender();

  // 3. Tee times — upcoming and recent
  pending++;
  leagueQuery("teetimes").orderBy("createdAt","desc").limit(15).get().then(function(snap) {
    var today = localDateStr();
    snap.forEach(function(doc) {
      var t = doc.data();
      var isToday = t.date === today;
      var isFuture = t.date > today;
      var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted";}).length : 0;
      items.push({type:"tee_time", name:(t.postedByName||"Someone") + " posted a tee time", sub:(t.courseName||"Tee time") + " · " + (t.date||"") + (t.time ? " at " + t.time : "") + " · " + accepted + " going", date:t.date||"", ts:t.createdAt ? t.createdAt.toMillis() : 0, live:isToday, dest:"Router.go('teetimes')"});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 4. Active/recent Parbaugh Rounds
  pending++;
  leagueQuery("syncrounds").orderBy("createdAt","desc").limit(15).get().then(function(snap) {
    snap.forEach(function(doc) {
      var r = doc.data();
      // leagueId filtered by leagueQuery()
      if (r.status === "discarded") return;
      var isLive = r.status === "active";
      var dest = isLive ? "Router.go('syncround',{roundId:'" + doc.id + "'})" : "";
      items.push({type:"syncround", name:(r.createdByName||"A Parbaugh") + (isLive ? " is playing a Parbaugh Round" : " finished a Parbaugh Round"), sub:(r.courseName||"") + (r.format ? " · " + r.format : "") + (isLive ? " · Tap to join" : ""), date:"", ts:r.createdAt ? r.createdAt.toMillis() : 0, live:isLive, dest:dest});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 5. Active solo live rounds from Firestore
  pending++;
  leagueQuery("liverounds").where("status","==","active").limit(8).get().then(function(snap) {
    snap.forEach(function(doc) {
      var lr = doc.data();
      if (currentUser && doc.id === currentUser.uid) return; // skip own
      var thru = lr.thru || 0;
      if (thru < 1) return;
      var scoreTxt = lr.totalScore ? lr.totalScore + " thru " + thru : "thru " + thru;
      items.push({type:"liveround", name:(lr.playerName||"A Parbaugh") + " is playing", sub:(lr.course||"") + " · " + scoreTxt, date:"", ts:lr.updatedAt ? lr.updatedAt.toMillis() : Date.now(), live:true, dest:""});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 6. Trash talk / chat messages
  pending++;
  leagueQuery("chat").orderBy("createdAt", "desc").limit(20).get().then(function(snap) {
    snap.forEach(function(doc) {
      var msg = doc.data();
      var isSystem = !!msg.system || msg.authorId === "system" || msg.authorName === "The Caddy" || msg.authorName === "Parbaughs";
      var text = msg.text || "";
      // Skip automated messages that duplicate other feed items
      if (text.indexOf("range session") !== -1 && (isSystem || msg.authorName === "Parbaughs" || msg.authorId === "system")) return;
      if (text.indexOf("scoring is complete") !== -1) return;
      if (text.indexOf("just finished a") !== -1 && text.indexOf("range") !== -1) return;
      var dest = "";
      if (msg.linkType === "event" && msg.tripId) dest = "Router.go('scorecard',{tripId:'" + msg.tripId + "'})";
      else if (msg.linkType === "round" && msg.roundId) dest = "Router.go('rounds',{roundId:'" + msg.roundId + "'})";
      items.push({type:"chat", playerId:msg.authorId||"", name:(msg.system ? "The Caddy" : msg.authorName || msg.user || "Member"), sub:text, ts:msg.createdAt ? msg.createdAt.toMillis() : (msg.timestamp || 0), system:isSystem, dest:dest});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });
}

function sendHomeChat() {
  var input = document.getElementById("homeChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  db.collection("chat").add(leagueDoc("chat", {
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Anon",
    createdAt: fsTimestamp()
  }).then(function() {
    loadHomeActivityFeed(); // Refresh
  }))(function(e) { Router.toast("Send failed: " + e.message); });
}

function feedTimeAgo(ts) {
  if (!ts) return "";
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h";
  var days = Math.floor(hrs / 24);
  if (days < 7) return days + "d";
  var weeks = Math.floor(days / 7);
  return weeks + "w";
}

function likeFeedRound(roundId, el) {
  if (!db || !currentUser) { Router.toast("Sign in to like"); return; }
  var uid = currentUser.uid;
  window._suppressRoundsRerender = true; // Don't re-render on this Firestore update
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) { window._suppressRoundsRerender = false; return; }
    var likes = doc.data().likes || [];
    var idx = likes.indexOf(uid);
    if (idx !== -1) likes.splice(idx, 1);
    else likes.push(uid);
    return db.collection("rounds").doc(roundId).update({ likes: likes }).then(function() {
      var isLiked = likes.indexOf(uid) !== -1;
      if (el) {
        el.className = "feed-action" + (isLiked ? " active" : "");
        var svg = el.querySelector("svg");
        if (svg) svg.setAttribute("fill", isLiked ? "var(--gold)" : "none");
        var span = el.querySelector("span");
        if (span) span.textContent = likes.length || "";
      }
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function() { window._suppressRoundsRerender = false; Router.toast("Could not like round"); });
}

// Golf-themed reactions popup
function showFeedReactions(roundId, btnEl) {
  var existing = document.getElementById("feedReactPopup_" + roundId);
  if (existing) { existing.remove(); return; }
  // Close any other open popups
  document.querySelectorAll('[id^="feedReactPopup_"]').forEach(function(el) { el.remove(); });
  var reactions = [
    {emoji: "\uD83D\uDD25", key: "fire"},     // 🔥
    {emoji: "\uD83D\uDC4F", key: "clap"},     // 👏
    {emoji: "\u26F3", key: "flag"},            // ⛳
    {emoji: "\uD83D\uDC80", key: "skull"},     // 💀
    {emoji: "\uD83C\uDFC6", key: "trophy"},    // 🏆
    {emoji: "\uD83D\uDE02", key: "laugh"}      // 😂
  ];
  var popup = document.createElement("div");
  popup.id = "feedReactPopup_" + roundId;
  popup.style.cssText = "display:flex;gap:4px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:4px 8px;position:absolute;bottom:100%;left:0;z-index:10;box-shadow:var(--shadow-md)";
  reactions.forEach(function(r) {
    var btn = document.createElement("span");
    btn.textContent = r.emoji;
    btn.style.cssText = "font-size:20px;cursor:pointer;padding:4px;border-radius:50%;transition:transform .1s";
    btn.onclick = function(e) { e.stopPropagation(); addFeedReaction(roundId, r.key); popup.remove(); };
    popup.appendChild(btn);
  });
  btnEl.parentElement.style.position = "relative";
  btnEl.parentElement.appendChild(popup);
  setTimeout(function() { document.addEventListener("click", function once() { popup.remove(); document.removeEventListener("click", once); }); }, 10);
}

function addFeedReaction(roundId, reactionKey) {
  if (!currentUser || !db) return;
  var uid = currentUser.uid;
  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var reactions = doc.data().reactions || {};
    if (!reactions[reactionKey]) reactions[reactionKey] = [];
    var idx = reactions[reactionKey].indexOf(uid);
    if (idx !== -1) reactions[reactionKey].splice(idx, 1);
    else reactions[reactionKey].push(uid);
    return db.collection("rounds").doc(roundId).update({ reactions: reactions });
  }).then(function() {
    window._suppressRoundsRerender = false;
    Router.toast("Reacted!");
  }).catch(function() { window._suppressRoundsRerender = false; });
}

function toggleFeedComments(roundId) {
  var el = document.getElementById("feedComments_" + roundId);
  if (!el) return;
  if (el.style.display !== "none") { el.style.display = "none"; return; }
  el.style.display = "block";
  el.innerHTML = '<div style="text-align:center;padding:8px;font-size:10px;color:var(--muted)">Loading...</div>';
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) { el.innerHTML = ""; return; }
    var comments = doc.data().comments || [];
    var h = "";
    comments.forEach(function(c) {
      h += '<div class="feed-comment"><span class="feed-comment-name">' + escHtml(c.name || "Parbaugh") + '</span><span class="feed-comment-text">' + escHtml(c.text) + '</span></div>';
    });
    if (!comments.length) h += '<div style="font-size:10px;color:var(--muted2);padding:4px 0">No comments yet</div>';
    h += '<div class="feed-comment-input"><input type="text" id="feedCmtInput_' + roundId + '" placeholder="Add a comment..." onkeydown="if(event.key===\'Enter\')submitFeedComment(\'' + roundId + '\')"><button onclick="submitFeedComment(\'' + roundId + '\')">Post</button></div>';
    el.innerHTML = h;
    var input = document.getElementById("feedCmtInput_" + roundId);
    if (input) input.focus();
  }).catch(function() { el.innerHTML = '<div style="font-size:10px;color:var(--red);padding:4px">Failed to load</div>'; });
}

function submitFeedComment(roundId) {
  var input = document.getElementById("feedCmtInput_" + roundId);
  if (!input || !input.value.trim()) return;
  if (!db || !currentUser) { Router.toast("Sign in to comment"); return; }
  var text = input.value.trim();
  var name = currentProfile ? (currentProfile.name || currentProfile.username) : "Parbaugh";
  input.value = "";
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var comments = doc.data().comments || [];
    comments.push({ uid: currentUser.uid, name: name, text: text, at: new Date().toISOString() });
    return db.collection("rounds").doc(roundId).update({ comments: comments });
  }).then(function() {
    toggleFeedComments(roundId); // close
    setTimeout(function() { toggleFeedComments(roundId); }, 50); // reopen with new comment
    // Update comment count in the action bar
    var actionEl = document.querySelector('#feedComments_' + roundId).previousElementSibling;
    if (actionEl) {
      var cmtBtn = actionEl.querySelectorAll('.feed-action')[1];
      if (cmtBtn) {
        var span = cmtBtn.querySelector('span');
        if (span) span.textContent = parseInt(span.textContent || 0) + 1;
      }
    }
  }).catch(function() { Router.toast("Failed to post comment"); });
}

function renderOnlineSection() {
  hookWatchRoundRefresh(); // keep live watch page in sync when presence updates
  var el = document.getElementById("onlineSection");
  if (!el) return;
  
  var uids = Object.keys(onlineMembers);
  // Dedup: ensure each name only shows once (handles multiple sessions from same user)
  var seenNames = {};
  var dedupedUids = [];
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    var name = data.name || uid;
    if (!seenNames[name]) { seenNames[name] = uid; dedupedUids.push(uid); }
  });
  uids = dedupedUids;
  if (uids.length <= 1) { el.innerHTML = ""; return; }
  
  var h = '<div style="padding:8px 16px 12px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><div style="width:6px;height:6px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite"></div><span style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">' + uids.length + ' Online Now</span></div>';
  h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
  
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    var cachedProfile = data._profile || null;
    
    // Build a synthetic player object that getAvatar can use
    // Priority: cached Firestore profile > local player > presence data
    var p = PB.getPlayer(uid);
    if (!p) {
      var players = PB.getPlayers();
      for (var i = 0; i < players.length; i++) {
        if (players[i].claimedFrom && players[i].id === uid) { p = players[i]; break; }
      }
    }
    if (!p && currentProfile && currentProfile.id === uid) p = currentProfile;
    if (!p && cachedProfile) p = cachedProfile;
    
    // If we still don't have a profile but have a cached one, use it
    // Ensure the player object has the Firebase UID as id so photoCache lookup works
    var avatarPlayer = null;
    if (p) {
      // Create a copy with the Firebase UID as the id for photo lookup
      avatarPlayer = Object.assign({}, p);
      if (avatarPlayer.id !== uid) {
        // The local id doesn't match Firebase UID — store the Firebase UID so getAvatar checks photoCache correctly
        avatarPlayer._fbUid = uid;
      }
    }
    
    var name = (p ? (p.name || p.username) : null) || data.name || "Member";
    var isMe = currentUser && uid === currentUser.uid;
    var lvlForOnline = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(uid));
    var lvlNum = lvlForOnline ? lvlForOnline.level : null;
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0" onclick="Router.go(\'members\',{id:\'' + uid + '\'})">';
    h += '<div style="position:relative;width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center">';
    h += renderAvatar(p || {name:name,id:uid}, 40, false);
    if (lvlNum) h += '<div style="position:absolute;bottom:0;right:0;background:var(--gold);color:var(--bg);font-size:7px;font-weight:800;border-radius:6px;padding:1px 3px;border:1.5px solid var(--bg);line-height:1.3;min-width:12px;text-align:center;z-index:2">' + lvlNum + '</div>';
    h += '</div>';
    h += '<div style="font-size:9px;color:' + (isMe ? 'var(--gold)' : 'var(--muted)') + ';max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center">' + escHtml(name) + '</div>';
    h += '</div>';
  });
  
  h += '</div></div>';
  el.innerHTML = h;
  
  // Async fetch missing profiles from Firestore
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    if (!data._profile && db) {
      db.collection("members").doc(uid).get().then(function(doc) {
        if (doc.exists) {
          onlineMembers[uid]._profile = doc.data();
          // Only re-render if we're still on the home page
          if (Router.getPage() === "home") renderOnlineSection();
        }
      }).catch(function(){});
    }
  });
}


// ========== ROUND IN PROGRESS BANNER ==========
function renderRipBanner() {
  var existing = document.getElementById("ripBanner");
  if (existing) existing.remove();
  
  if (!liveState.active) return;
  
  var hole = liveState.currentHole + 1;
  var totalSoFar = 0, played = 0;
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  liveState.scores.forEach(function(s, i) { if (s !== "") { totalSoFar += parseInt(s); played++; parSoFar += defaultPar[i]||4; } });
  var diff = totalSoFar - parSoFar;
  var diffStr = played > 0 ? (diff > 0 ? "+" + diff : diff === 0 ? "E" : diff) : "";
  
  var banner = document.createElement("div");
  banner.id = "ripBanner";
  banner.className = "rip-banner";
  banner.onclick = function() { Router.go("playnow"); };
  banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px">' +
    '<div class="rip-dot"></div>' +
    '<div><div style="font-size:11px;font-weight:600;color:var(--cream)">Round in progress</div>' +
    '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + escHtml(liveState.course) + ' · Hole ' + hole + (diffStr ? ' · ' + diffStr : '') + '</div></div></div>' +
    '<div style="font-size:10px;color:var(--gold);font-weight:600">Resume →</div>';
  
  var nav = document.getElementById("nav");
  if (nav && nav.parentNode) {
    nav.parentNode.insertBefore(banner, nav.nextSibling);
  }
}

// Hook into Router.go to show/hide the banner on non-playnow pages
var _origRouterGo = Router.go;
Router.go = function(page, params) {
  // Always close notification panel when navigating
  closeNotifPanel();
  _origRouterGo(page, params);
  if (page !== "playnow" && liveState.active) {
    setTimeout(renderRipBanner, 50);
  }
  // Re-trigger page-enter animation
  var pageEl = document.querySelector('[data-page="' + page + '"]');
  if (pageEl) {
    pageEl.style.animation = 'none';
    pageEl.offsetHeight; // force reflow
    pageEl.style.animation = '';
  }
  // Auto-animate any data-count elements on the new page
  setTimeout(initCountAnimations, 80);
};


// ========== CONNECTION STATUS BAR ==========
var connStatus = "live";


function initConnStatus() {
  if (!db) return;
  
  // Only use browser online/offline events as a supplement, not the primary signal
  // Firestore initSync already confirmed connectivity — don't override it
  window.addEventListener("offline", function() { setSyncStatus("offline"); });
  window.addEventListener("online", function() { 
    // Re-verify with Firestore before claiming online
    db.collection("config").doc("app").get().then(function() {
      setSyncStatus("online");
    }).catch(function() { setSyncStatus("offline"); });
  });
  
  // Don't set initial state here — initSync already handled it
}


// ========== SKELETON LOADING HELPERS ==========
function skeletonCard(lines) {
  var h = '<div class="skel-card">';
  for (var i = 0; i < (lines||3); i++) {
    var cls = i === 0 ? "short" : i === lines-1 ? "short" : "medium";
    h += '<div class="skeleton skel-line ' + cls + '" style="animation-delay:' + (i*0.1) + 's"></div>';
  }
  h += '</div>';
  return h;
}

function skeletonMemberRow() {
  return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">' +
    '<div class="skeleton skel-circle"></div>' +
    '<div style="flex:1"><div class="skeleton skel-line short" style="margin-bottom:6px"></div><div class="skeleton skel-line medium"></div></div></div>';
}

function skeletonFeed() {
  var h = '';
  for (var i = 0; i < 4; i++) {
    h += '<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:10px">';
    h += '<div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>';
    h += '<div style="flex:1"><div class="skeleton skel-line short" style="margin-bottom:8px"></div>';
    h += '<div class="skeleton skel-line medium"></div><div class="skeleton skel-line" style="width:40%;margin-top:6px"></div></div></div>';
  }
  return h;
}


// ========== ANIMATED NUMBER COUNTING ==========
function animateNumber(el, target, duration) {
  if (!el) return;
  duration = duration || 600;
  var start = 0;
  var startTime = null;
  target = parseInt(target) || 0;
  if (target === 0) { el.textContent = "0"; return; }
  
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    // Ease out cubic
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(eased * target);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

// Auto-animate elements with data-count attribute after page renders
function initCountAnimations() {
  var els = document.querySelectorAll("[data-count]");
  els.forEach(function(el) {
    var target = el.getAttribute("data-count");
    animateNumber(el, target, 500);
  });
}


// ========== CONTEXTUAL EMPTY STATES ==========
var contextualEmptyStates = {
  rounds: {
    icon: "<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='8' cy='4' r='3'/><path d='M3 14l5-5 5 5'/><line x1='8' y1='9' x2='8' y2='16'/></svg>",
    text: "No rounds logged yet",
    sub: "Your first round earns 100 XP and the First Blood badge",
    action: "Play Now →",
    actionPage: "playnow"
  },
  teetimes: {
    icon: "",
    text: "No upcoming tee times",
    sub: "Post one and your crew gets notified instantly",
    action: "Post Tee Time →",
    actionPage: "tee-create"
  },
  scramble: {
    icon: "",
    text: "No scramble teams yet",
    sub: "Create a 2, 3, or 4-man team and start tracking W-L records",
    action: "Create Team →",
    actionPage: "scramble"
  },
  chat: {
    icon: "",
    text: "The clubhouse is quiet",
    sub: "Be the first to talk trash. Someone has to.",
    action: null
  },
  challenges: {
    icon: "",
    text: "No active challenges",
    sub: "Call someone out. Loser buys the post-round beers.",
    action: "New Challenge →",
    actionPage: "challenges"
  }
};

function renderContextualEmpty(type) {
  var config = contextualEmptyStates[type];
  if (!config) return '<div class="empty"><div class="empty-text">Nothing here yet</div></div>';
  var h = '<div class="empty" style="padding:28px 16px"><div class="empty-icon" style="font-size:28px;margin-bottom:8px">' + config.icon + '</div>';
  h += '<div class="empty-text" style="font-size:13px">' + config.text + '</div>';
  h += '<div style="font-size:10px;color:var(--muted2);margin-top:6px;line-height:1.5">' + config.sub + '</div>';
  if (config.action) {
    h += '<div style="margin-top:12px"><span style="font-size:11px;color:var(--gold);cursor:pointer;font-weight:600" onclick="Router.go(\'' + config.actionPage + '\')">' + config.action + '</span></div>';
  }
  h += '</div>';
  return h;
}


// ========== PULL TO REFRESH ==========
(function() {
  var startY = 0;
  var pulling = false;
  var triggered = false;
  var threshold = 140;
  var indicator = null;
  
  document.addEventListener("touchstart", function(e) {
    // Skip pull-to-refresh when interacting with form elements
    var tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") { pulling = false; return; }
    if (window.scrollY <= 0 && e.touches.length === 1) {
      // Check if touch is inside a scrollable container that isn't at top
      var el = e.target;
      var insideScrollable = false;
      while (el && el !== document.body) {
        if (el.scrollHeight > el.clientHeight + 2) {
          var style = window.getComputedStyle(el);
          var overflow = style.overflowY;
          if (overflow === "auto" || overflow === "scroll") {
            if (el.scrollTop > 0) {
              // User is scrolling inside a container that has content above — don't pull-to-refresh
              insideScrollable = true;
              break;
            }
          }
        }
        el = el.parentElement;
      }
      if (insideScrollable) { pulling = false; return; }
      startY = e.touches[0].clientY;
      pulling = true;
      triggered = false;
      indicator = document.getElementById("ptrIndicator");
    }
  }, { passive: true });
  
  document.addEventListener("touchmove", function(e) {
    if (!pulling || !indicator || triggered) return;
    var diff = e.touches[0].clientY - startY;
    if (diff > 0 && window.scrollY <= 0) {
      var progress = Math.min(diff / threshold, 1);
      indicator.style.top = (-44 + (56 * progress)) + "px";
      indicator.style.opacity = progress;
      indicator.querySelector("svg").style.transform = "rotate(" + (progress * 360) + "deg)";
      
      if (progress >= 1 && !triggered) {
        triggered = true;
        indicator.style.top = "14px";
        indicator.style.opacity = "1";
        indicator.querySelector("svg").style.animation = "spin .6s linear infinite";
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(function() { window.location.reload(); }, 400);
      }
    } else if (diff <= 0) {
      pulling = false;
      indicator.style.top = "-44px";
      indicator.style.opacity = "0";
    }
  }, { passive: true });
  
  document.addEventListener("touchend", function() {
    if (!pulling || !indicator || triggered) { pulling = false; return; }
    indicator.style.top = "-44px";
    indicator.style.opacity = "0";
    indicator.querySelector("svg").style.transform = "rotate(0deg)";
    pulling = false;
  }, { passive: true });
})();


// ========== INIT FIREBASE LISTENERS ==========
function initFirebaseListeners() {
  startTeeTimeListener();
  startRangeSessionListener();
  startNotificationListener();
  startDmUnreadListener();
  startPresenceSystem();
  initConnStatus();
  initPushNotifications();
  cleanupCorruptedProfiles();
  // Load shared API keys from Firestore
  if (db) {
    db.collection("config").doc("api_keys").get().then(function(doc) {
      if (doc.exists && doc.data().golfCourseApi) {
        localStorage.setItem("golfcourse_api_key", doc.data().golfCourseApi);
      }
    }).catch(function(){});
  }
}

// One-time cleanup: detect non-founding members who inherited founding data via claim bug
function cleanupCorruptedProfiles() {
  if (!db || !currentUser) return;
  // Only Commissioner can run this for all members
  if (!currentProfile || currentProfile.role !== "commissioner") return;
  
  db.collection("members").get().then(function(snap) {
    snap.forEach(function(doc) {
      var m = doc.data();
      // Skip actual founding-four members (they used FOUNDING-FOUR code)
      if (m.isFoundingFour === true) return;
      
      var needsFix = false;
      var updates = {};
      
      // Check for inherited founding data
      if (m.founding === true) { updates.founding = false; needsFix = true; }
      if (m.title && m.title.indexOf("Original Four") !== -1) { updates.title = ""; updates.equippedTitle = ""; needsFix = true; }
      if (m.equippedTitle && m.equippedTitle.indexOf("Original Four") !== -1) { updates.equippedTitle = ""; needsFix = true; }
      if (m.role === "commissioner" && doc.id !== currentUser.uid) {
        // Only the real commissioner should have this role
        updates.role = "member"; needsFix = true;
      }
      // Check for badges they shouldn't have
      if (m.badges && m.badges.indexOf("founder") !== -1 && !m.isFoundingFour) {
        updates.badges = m.badges.filter(function(b) { return b !== "founder"; });
        needsFix = true;
      }
      // If they have someone else's name (claimedFrom but name matches a default player exactly)
      if (m.claimedFrom && !m.isFoundingFour) {
        var defaultNames = ["Zach Parbaugh","Kayvan","Kiyan","Nick"];
        if (defaultNames.indexOf(m.name) !== -1) {
          updates.name = m.username || "Member";
          needsFix = true;
        }
      }
      // Clean inherited data from non-founding members who claimed profiles
      if (m.claimedFrom && !m.isFoundingFour) {
        // Non-founding members should never have claimedFrom — this was the bug
        updates.claimedFrom = firebase.firestore.FieldValue.delete();
        needsFix = true;
        if (m.bio) { updates.bio = ""; }
        if (m.nick) { updates.nick = ""; }
        if (m.manualHandicap) { updates.manualHandicap = null; }
        if (m.funnyFacts && m.funnyFacts.length) { updates.funnyFacts = []; }
        if (m.range) { updates.range = ""; }
        if (m.clubs && Object.keys(m.clubs).length) { updates.clubs = {}; }
        if (m.bag && Object.keys(m.bag).length) { updates.bag = {}; }
        if (m.homeCourse) { updates.homeCourse = ""; }
        if (m.favoriteCourse) { updates.favoriteCourse = ""; }
        if (m.bagPhoto) { updates.bagPhoto = ""; }
        if (m.wins) { updates.wins = 0; }
        if (m.trips) { updates.trips = 0; }
      }
      // Fallback: catch profiles where claimedFrom was already deleted but inherited data remains
      if (!m.claimedFrom && !m.isFoundingFour) {
        var founderBios = ["Founded the Parbaughs","Tracks stats like his life depends on it"];
        if (m.bio && founderBios.some(function(fb){return m.bio.indexOf(fb) !== -1})) {
          updates.bio = ""; needsFix = true;
        }
        if (m.funnyFacts && m.funnyFacts.length && !m.isFoundingFour) {
          // Check if funnyFacts match a founding member's
          var founderFacts = ["Bought custom-fit irons","Owns more golf trackers","Will quote his handicap"];
          if (m.funnyFacts.some(function(f){return founderFacts.some(function(ff){return f.indexOf(ff)!==-1})})) {
            updates.funnyFacts = []; needsFix = true;
          }
        }
        if (m.nick && !m.isFoundingFour) {
          var founderNicks = ["The Commissioner","Mr Parbaugh"];
          if (founderNicks.indexOf(m.nick) !== -1) { updates.nick = ""; needsFix = true; }
        }
      }
      
      if (needsFix) {
        pbLog("[Cleanup] Fixing corrupted profile:", doc.id, updates);
        db.collection("members").doc(doc.id).update(updates).catch(function(e) { pbWarn("[Cleanup] Failed:", doc.id, e); });
      }
    });
  }).catch(function(){});
}

// Override enterApp to include Firebase listeners
var _origEnterApp = enterApp;
enterApp = function() {
  _origEnterApp();
  initFirebaseListeners();
  // ── ParCoin: daily login streak coins ──
  setTimeout(awardDailyLogin, 2000);
  // Check profile completion — send one-time reminder notification
  setTimeout(function() {
    if (!db || !currentUser || !currentProfile) return;
    var profComplete = currentProfile.bio && currentProfile.range && currentProfile.homeCourse;
    if (profComplete) return;
    // Only send once per session — in-memory dedup (notification already persisted in Firestore)
    if (window._sentProfileNotif) return;
    window._sentProfileNotif = true;
    sendNotification(currentUser.uid, {
      type: "profile_reminder",
      title: "Complete Your Profile",
      message: "Add your bio, score range, and home course to earn XP and unlock the Getting Settled achievement!",
      linkPage: "members",
      linkParams: {edit: currentUser.uid}
    });
  }, 5000); // Delay 5s so it doesn't fire on initial load
};

// ========== FINAL INIT ==========
// Deferred: pages register after core loads, so wait for them
setTimeout(function() { Router.go("home"); }, 0);
