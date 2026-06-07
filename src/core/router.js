var Router = (function() {
  var current = { page: "home", params: {} };
  var pages = {};
  var _skipHistoryPush = false;
  // Back-nav flag — set by back() and popstate so go() can pick the inverted
  // entrance motion (pt-lift-in-back) instead of the forward lift.
  var _isBack = false;
  // Explicit nav stack — always knows exactly where back() should go
  // Scales to any depth: Home→Members→Profile→EditProfile→back→back→back works correctly
  var _navStack = [];

  // Browser back/forward button — keep our stack in sync
  window.addEventListener("popstate", function(e) {
    if (_navStack.length > 0) _navStack.pop();
    var state = e.state;
    _skipHistoryPush = true;
    _isBack = true;
    if (state && state.page) {
      go(state.page, state.params || {});
    } else {
      _navStack = [];
      go("home", {});
    }
    _skipHistoryPush = false;
    _isBack = false;
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
      // Entrance motion — fluid page transitions (pt-lift / pt-masthead).
      // Keyframes + reduced-motion guard live in components.css; the tier
      // is computed in transitions.js. Clear + force a reflow before
      // applying so the animation replays on every navigation — re-setting
      // an identical data-transition attribute alone will not restart a
      // CSS animation. The "in" rules use fill-mode:backwards so no
      // transform lingers afterward (a retained translateY would create a
      // containing block and break position:fixed descendants).
      if (typeof applyTransition === "function" && typeof getTransitionTier === "function") {
        _clearTransition(target);
        void target.offsetWidth;
        applyTransition(target, getTransitionTier(prev, page), "in", _isBack);
      }
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
    // Hide the global tab bar during an active live round on Play Now. The live
    // scoring screen renders its own fixed #liveBottomNav (Prev / Next / Finish).
    // Both bars are position:fixed;bottom:0;z-index:100; the global bar is later
    // in the DOM, so without this it paints over the round controls and steals
    // every tap (a stray tap navigates out of the round). Re-evaluated on every
    // navigation, so it restores when the round ends or the user steps away.
    var inLiveRound = typeof liveState !== "undefined" && liveState && liveState.active && current.page === "playnow";
    nav.style.display = inLiveRound ? "none" : "";
    var tabs = [
      { match: ["home","round","standings","seasonrecap","awards","feed"] },
      { match: ["activity","rounds","playnow","range","scramble-live","syncround"] },
      { match: ["courses"] },
      { match: ["trips","scorecard","teetimes","tee-create","partygames"] },
      { match: ["more","members","profile","profile-edit","records","aces","scramble","challenges","trophyroom","rules","merch"] }
    ];
    var buttons = nav.querySelectorAll("button");
    tabs.forEach(function(t, i) {
      if (buttons[i]) {
        if (t.match.indexOf(current.page) !== -1) buttons[i].classList.add("a");
        else buttons[i].classList.remove("a");
      }
    });
  }

  // LEGACY mobile toast primitive — single #toast element, single message,
  // fixed 2.2s timing. Coexists with PB.toast (richer, severity-aware, stacked)
  // from v8.7.0 / Ship 3a. Migration to PB.toast deferred to Ship 11+ when the
  // auth surface refactors and existing call sites can be retargeted safely.
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
      _isBack = true;
      history.back();
      go(prev.page, prev.params);
      _skipHistoryPush = false;
      _isBack = false;
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
// a player avatar. Default ring is Clubhouse brass for all users; shop-
// purchased cosmetic rings (equippedCosmetics.border) override the default.
// Tier-specific rings (commissioner, Mr. Parbaugh, Founding Four) come in v8.1.4.

function playerFrameColor(p) {
  if (!p) return '#B4893E';
  // Cosmetic ring override (from shop purchase)
  if (p.equippedCosmetics && p.equippedCosmetics.border && p.equippedCosmetics.border !== "theme-default") {
    var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
    var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return equipped.preview;
  }
  // Default: Clubhouse brass for all members
  return '#B4893E';
}

function playerRingShadow(p) {
  if (!p) return '0 0 8px rgba(180,137,62,.5), 0 0 16px rgba(180,137,62,.25)';
  // Animated rings handle their own shadows via keyframes
  if (p.equippedCosmetics && p.equippedCosmetics.border) {
    var animatedRings = ['border_pulse_gold','border_shimmer','border_rainbow_shift','border_neon_green','border_crimson_ember'];
    if (animatedRings.indexOf(p.equippedCosmetics.border) !== -1) return '';
    // Standard cosmetic rings get a bold glow matching their color
    var cosm = typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : [];
    var equipped = cosm.find(function(c) { return c.id === p.equippedCosmetics.border; });
    if (equipped) return '0 0 8px ' + equipped.preview + '50, 0 0 16px ' + equipped.preview + '20';
  }
  // Default: Clubhouse brass glow
  return '0 0 8px rgba(180,137,62,.5), 0 0 16px rgba(180,137,62,.25)';
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
//
// W4.I1 display rules (2026-05-24): when the username carries a Discord-style
// discriminator (base#XXXX), render the base at full opacity + the
// #discriminator tag muted. Member identity reads cleanly without the tag
// dominating; disambiguation context is still visible. When username has no
// discriminator (legacy single-name members) the render is unchanged.
function renderUsername(p, extraStyle, clickToProfile) {
  if (!p) return '<span style="' + (extraStyle || '') + '">Unknown</span>';
  var name = p.username || p.name || 'Member';
  var nameClass = getPlayerNameClass(p);
  var pid = p.id || '';
  var click = clickToProfile && pid ? ' onclick="event.stopPropagation();Router.go(\'members\',{id:\'' + pid + '\'})"' : '';
  var cursor = clickToProfile && pid ? 'cursor:pointer;' : '';

  // Detect discriminator suffix #XXXX (4 digits) per W4.I1 schema. The
  // discriminator portion renders with reduced opacity + tighter weight so
  // the base username stays the primary read.
  var hashIdx = name.lastIndexOf('#');
  var inner;
  if (hashIdx > 0 && /^#\d{1,4}$/.test(name.slice(hashIdx))) {
    var base = name.slice(0, hashIdx);
    var tag  = name.slice(hashIdx);
    inner = escHtml(base) + '<span class="username-discriminator" style="opacity:0.55;font-weight:500;letter-spacing:0.5px">' + escHtml(tag) + '</span>';
  } else {
    inner = escHtml(name);
  }

  return '<span class="' + nameClass + '" style="' + cursor + (extraStyle || '') + '"' + click + '>' + inner + '</span>';
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
      Router.toast("Notifications blocked, check browser settings");
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
  notif.toUserId = toUserId;
  notif.read = false;
  notif.createdAt = fsTimestamp();
  // Optional leagueId on new writes — null when no active league context.
  // Existing reads ignore unknown fields; backward-compatible.
  var lid = (window.currentProfile && window.currentProfile.activeLeague) || null;
  if (lid) notif.leagueId = lid;
  db.collection("notifications").add(notif).catch(function(){});
  // pendingPush bridge — DO NOT modify shape; FCM Cloud Function reads it.
  db.collection("pendingPush").add({
    toUserId: toUserId,
    title: notif.title || (window._activeLeagueName || "Parbaughs"),
    body: notif.message || "",
    data: { type: notif.type || "general", page: notif.page || "" },
    createdAt: fsTimestamp()
  }).catch(function(){});
}

// ─────────────────────────────────────────────────────────────────────────
// Notification listener + click-handoff infrastructure (v8.17.0 / Ship 5+1)
// ─────────────────────────────────────────────────────────────────────────
// Schema: { toUserId, type, title, message, page?, params?, read, readAt?, leagueId?, createdAt }
// Legacy: { linkPage, linkParams, body } — read paths alias both shapes.
// Reader-side resolution at indexNotifInMap below establishes click destination
// + params for each notification; renderNotifPanel reads from the map only.

function indexNotifInMap(n) {
  if (!n || !n._id) return;
  var meta = window.NOTIFICATION_META && window.NOTIFICATION_META[n.type];
  var dest = n.page || n.linkPage || (meta && meta.page) || "home";
  var params = n.params || n.linkParams || {};
  if (!window._notifById) window._notifById = {};
  window._notifById[n._id] = { dest: dest, params: params, isRead: !!n.read };
}

function startNotificationListener() {
  if (!db || !currentUser) return;
  if (window._notifUnsub) window._notifUnsub();
  window._notifUnsub = db.collection("notifications")
    .where("toUserId","==",currentUser.uid)
    .where("read","==",false)
    .limit(30)
    .onSnapshot(function(snap) {
      liveNotifications = [];
      window._notifById = {};
      snap.forEach(function(doc) {
        var n = Object.assign({_id:doc.id}, doc.data());
        liveNotifications.push(n);
        indexNotifInMap(n);
      });
      // Re-merge readHistory entries — both share the same map for click handoff.
      (readHistory || []).forEach(indexNotifInMap);
      liveNotifications.sort(function(a,b) {
        var at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        var bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });
      updateNotifBadge();
      if (notifPanelOpen) renderNotifPanel();
    }, function(err) { pbWarn("[Notify] Listener error:", err.message); });
}

// ========== ROUND INTEGRITY ==========
var ROUND_GRACE_HOURS = 48;



/* ── Shared infrastructure: notifications, AI tournament, share cards, presence, feed, overrides ── */

// Extracted to src/core/router-notifications.js per W1.A5. Originally lines 452-720 of this file.
// Tournament generation lives in src/core/tournament-engine.js (free, algorithmic — no LLM API).
// Extracted to src/core/router-sharecard.js per W1.A5. Originally lines 876-1543 of this file.
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

  // Haptic unlock pattern (Ship 0b-iii) — fires alongside the visual celebration
  if (typeof hapticUnlock === "function") hapticUnlock();

  var el = document.createElement("div");
  el.id = "achCelebration";
  el.className = "ach-celebrate";
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
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

// Extracted to src/core/router-achievement.js per W1.A5. Originally lines 1609-1688 of this file.

// Extracted to src/core/router-activity-feed.js per W1.A5. Originally lines 1690-2157 of this file.
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

// Extracted to src/core/router-sidebar.js per W1.A5. Originally lines 2189-2628 of this file.
// Extracted to src/core/router-empty-states.js per W1.A5. Originally lines 2629-2786 of this file.
// ========== INIT FIREBASE LISTENERS ==========
function initFirebaseListeners() {
  // startTeeTimeListener (teetimes.js) + startRangeSessionListener (range.js) live
  // in the DEFERRED page bundle, which executes via <script defer> AFTER the inline
  // core block. A fast auth callback runs enterApp -> initFirebaseListeners before
  // that bundle loads, so an unguarded call throws ReferenceError and aborts the
  // rest of this function: none of the core listeners below start and the home
  // shell renders empty. Surfaced deterministically in v8.23.49 once deferred.js
  // became content-hashed (v8.23.48) — a fresh network fetch loads slower than the
  // previously-immutable disk-cached copy, so auth now resolves first. Retry the
  // deferred starters until the bundle is present (same pattern as enterApp's
  // _restoreLiveStateWhenReady); the core listeners run immediately regardless.
  (function _startDeferredListenersWhenReady(tries) {
    if (typeof startTeeTimeListener === "function" && typeof startRangeSessionListener === "function") {
      startTeeTimeListener();
      startRangeSessionListener();
      return;
    }
    if (tries >= 50) return; // ~6s ceiling
    setTimeout(function() { _startDeferredListenersWhenReady(tries + 1); }, 120);
  })(0);
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
  if (!isFounderRole(currentProfile)) return;
  
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
      if (isFounderRole(m) && doc.id !== currentUser.uid) {
        // Only the real platform founder should have this role. Demote
        // any stray commissioner via the legacy field (v8.0 rules still
        // allow writing to `role`; platformRole is immutable via client).
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
  // Check profile completion — send one-time reminder notification.
  // Dedup is DURABLE: query Firestore for an existing profile_reminder before
  // sending. The in-memory flag alone reset every session, so an incomplete
  // profile spawned a fresh reminder on every app-open and flooded the panel.
  setTimeout(function() {
    if (!db || !currentUser || !currentProfile) return;
    var profComplete = currentProfile.bio && currentProfile.range && currentProfile.homeCourse;
    if (profComplete) return;
    if (window._sentProfileNotif) return; // same-session fast-path
    window._sentProfileNotif = true;
    var uid = currentUser.uid;
    db.collection("notifications")
      .where("toUserId", "==", uid)
      .where("type", "==", "profile_reminder")
      .limit(1)
      .get()
      .then(function(snap) {
        if (!snap.empty) return; // reminder already exists — never re-send
        sendNotification(uid, {
          type: "profile_reminder",
          title: "Complete Your Profile",
          message: "Add your bio, score range, and home course to earn XP and unlock the Getting Settled achievement!",
          page: "members",
          params: {edit: uid}
        });
      })
      .catch(function() {});
  }, 5000); // Delay 5s so it doesn't fire on initial load
};

// ========== FINAL INIT ==========
// Deferred: pages register after core loads, so wait for them
setTimeout(function() { Router.go("home"); }, 0);
