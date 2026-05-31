/* ================================================
   PAGE: SETTINGS — CLUBHOUSE_SPEC-HQ-3h (W1.S14)
   Editorial preferences hub: small masthead ("Settings."), sticky section-nav
   on desktop + stacked sectioned form. Single column on mobile (nav hidden;
   sections scroll). The section list (and therefore the nav) is built from the
   surfaces that actually render, so the nav only ever points to real sections
   (P10 — no dead destinations). All mutation handlers + element IDs preserved
   verbatim below the renderer.
   Scaffold: roster-masthead + set-* (src/styles/components.css).
   Tokens: real Clubhouse tokens only (spec's --cb-chalk-deep/--cb-line do not
   exist → --cb-chalk-2 / --cb-chalk-3).
   ================================================ */
Router.register("settings", function(params) {
  // ── Masthead eyebrow: truthful "MEMBER SINCE {year}" only when a real join
  //    date is on the profile; otherwise the neutral "MEMBER" (P9). ──
  var _joinYear = "";
  try {
    var _ca = currentProfile && (currentProfile.createdAt || currentProfile.joinedAt || currentProfile.memberSince);
    if (_ca && typeof _ca.toDate === "function") _joinYear = String(_ca.toDate().getFullYear());
    else if (_ca && _ca.seconds) _joinYear = String(new Date(_ca.seconds * 1000).getFullYear());
    else if (typeof _ca === "string" && /^\d{4}/.test(_ca)) _joinYear = _ca.slice(0, 4);
  } catch (e) {}
  var _eyebrow = _joinYear ? ("PARBAUGHS · MEMBER SINCE " + _joinYear) : "PARBAUGHS · MEMBER";

  // Sections accumulate into secs[]; the nav is generated from whatever renders.
  var secs = [];

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNT
  // ──────────────────────────────────────────────────────────────────────────
  var acc = "";
  if (currentUser) {
    acc += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Email</div></div><div class="set-row__value set-row__value--mono">' + escHtml(currentUser.email) + '</div></div>';
    if (!currentUser.emailVerified) {
      acc += '<div class="set-note set-note--mute" style="margin:10px 0 4px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>Your email is not verified yet.</span><button class="set-link" onclick="sendVerificationEmail()">Send verification</button></div>';
    }
    acc += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Username</div></div><div class="set-row__value">' + escHtml(currentProfile ? (currentProfile.username || currentProfile.name) : "—") + '</div></div>';
    acc += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Role</div></div><div class="set-row__value">' + escHtml(currentProfile ? (currentProfile.role || "Member") : "—") + '</div></div>';
    acc += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Sync</div></div><div class="set-row__value set-row__value--mono" style="color:' + (syncStatus === "online" ? "var(--cb-moss)" : "var(--cb-claret)") + '">' + escHtml(String(syncStatus)) + '</div></div>';
    acc += '<div style="margin-top:18px"><button class="set-btn set-btn--claret" onclick="doLogout()">Sign out</button></div>';
    acc += '<div style="text-align:center;margin-top:16px"><button class="set-link set-link--mute" onclick="deleteMyAccount()">Delete account</button>';
    acc += '<div class="set-row__desc" style="margin-top:5px">Removes your profile, photos, and sign-in. This cannot be undone.</div></div>';
  } else {
    acc += '<div class="set-row__desc">You are not signed in.</div>';
  }
  secs.push({ key: "account", label: "Account", html: acc });

  // ──────────────────────────────────────────────────────────────────────────
  // LOCATION (v8.11.0 · Member Location ship) — 3 states via currentProfile.location
  // ──────────────────────────────────────────────────────────────────────────
  var locHtml = "";
  var loc = currentProfile && currentProfile.location;
  var hasLoc = loc && typeof loc.lat === "number" && typeof loc.lng === "number";
  if (hasLoc) {
    var locName = escHtml(loc.name || "Your location");
    var sourceLabel = loc.source === "geolocation" ? "detected from device"
                    : loc.source === "manual" ? "set manually"
                    : loc.source === "geocoded" ? "from city lookup"
                    : "";
    var setAtLabel = "";
    if (loc.setAt && loc.setAt.toDate) {
      var ageMs = Date.now() - loc.setAt.toDate().getTime();
      var days = Math.floor(ageMs / 86400000);
      setAtLabel = days === 0 ? "today" : days === 1 ? "yesterday" : days + " days ago";
    }
    locHtml += '<div style="display:flex;flex-direction:column;gap:var(--sp-2)">';
    locHtml += '<div style="display:flex;align-items:baseline;gap:var(--sp-2);flex-wrap:wrap">';
    locHtml += '<span style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cb-mute)">Currently</span>';
    locHtml += '<span style="font-family:var(--font-display);font-style:italic;font-size:17px;font-weight:600;color:var(--cb-ink)">' + locName + '</span>';
    locHtml += '</div>';
    if (sourceLabel || setAtLabel) {
      var meta = [sourceLabel, setAtLabel].filter(Boolean).join(" · ");
      locHtml += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);letter-spacing:0.5px">' + escHtml(meta) + '</div>';
    }
    locHtml += '<button type="button" onclick="clearLocation()" class="set-link" style="align-self:flex-start;margin-top:var(--sp-2)">Change location →</button>';
    locHtml += '</div>';
  } else {
    locHtml += '<div class="set-row__desc" style="margin-bottom:var(--sp-4)">Your location is used only to show accurate weather. We don\'t share it, and we don\'t track your movements.</div>';
    locHtml += '<button type="button" id="loc-detect-btn" onclick="detectMyLocation()" class="set-btn set-btn--brass">';
    locHtml += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
    locHtml += 'Use my current location';
    locHtml += '</button>';
    locHtml += '<div id="loc-detect-error" style="display:none;font-family:var(--font-mono);font-size:11px;color:var(--cb-claret);margin-top:var(--sp-2);letter-spacing:0.3px"></div>';
    locHtml += '<div id="loc-permission-denied" style="display:none;font-family:var(--font-mono);font-size:11px;color:var(--cb-mute);margin-top:var(--sp-2);letter-spacing:1.5px;text-transform:uppercase">BROWSER LOCATION ACCESS IS DENIED · TAP TO USE MANUAL ENTRY</div>';
    locHtml += '<div style="display:flex;align-items:center;gap:var(--sp-3);margin:var(--sp-4) 0;font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);letter-spacing:1.5px;text-transform:uppercase"><div style="flex:1;height:1px;background:var(--cb-chalk-3)"></div>or<div style="flex:1;height:1px;background:var(--cb-chalk-3)"></div></div>';
    locHtml += '<div style="display:flex;gap:var(--sp-2)">';
    locHtml += '<input type="text" id="loc-manual-input" class="ff-input" placeholder="City, State (e.g., Charlotte, NC)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();setLocationManual();}" style="flex:1">';
    locHtml += '<button type="button" onclick="setLocationManual()" class="set-btn set-btn--brass" style="width:auto;flex-shrink:0;padding:0 var(--sp-4)">Set</button>';
    locHtml += '</div>';
    locHtml += '<div id="loc-manual-error" style="display:none;font-family:var(--font-mono);font-size:11px;color:var(--cb-claret);margin-top:var(--sp-2);letter-spacing:0.3px"></div>';
  }
  secs.push({ key: "location", label: "Location", html: locHtml });

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────
  var notif = "";
  var permState = ('Notification' in window) ? Notification.permission : 'unsupported';
  if (permState === 'granted') {
    notif += '<div class="set-note set-note--ok"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8l3 3 5-6"/></svg> Push notifications are enabled.</div>';
  } else if (permState === 'denied') {
    notif += '<div class="set-note set-note--mute">Notifications are blocked. Update this in your browser or device settings to re-enable them.</div>';
  } else if (permState === 'unsupported') {
    notif += '<div class="set-note set-note--mute">Push notifications are not supported on this browser.</div>';
  } else {
    notif += '<button class="set-btn set-btn--brass" onclick="requestPushPermission()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg> Enable push notifications</button>';
    notif += '<div class="set-row__desc" style="text-align:center;margin-top:8px">Get notified about DMs, tee times, event results, and achievements.</div>';
  }
  secs.push({ key: "notifications", label: "Notifications", html: notif });

  // ──────────────────────────────────────────────────────────────────────────
  // DISPLAY — Appearance (theme preview) + Sunlight Mode
  // ──────────────────────────────────────────────────────────────────────────
  var disp = "";
  var _activeThemeId = (typeof getCurrentTheme === "function") ? getCurrentTheme() : "clubhouse";
  var _activeThemeName = (typeof THEMES !== "undefined" && THEMES[_activeThemeId]) ? THEMES[_activeThemeId].name : "Clubhouse";
  disp += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Current theme</div><div class="set-row__desc">The full theme picker arrives in an upcoming update. Six editorial themes: three ready, three to earn.</div></div><div class="set-row__value">' + escHtml(_activeThemeName) + '</div></div>';
  // Theme preview swatches — palette hex values are data (a literal preview of
  // each theme's surface + accent), permitted like Visual Reference hole-dots.
  var _themePreviews = [
    { name: "Clubhouse",       primary: "#f3ede1", accent: "#c89a4b", ready: true },
    { name: "Twilight Links",  primary: "#1f2a35", accent: "#d4a857", ready: true },
    { name: "Linen Draft",     primary: "#ebe3d1", accent: "#8b7158", ready: true },
    { name: "Champion Sunday", primary: "#5b1f1f", accent: "#e0c071", ready: false },
    { name: "Bourbon Room",    primary: "#3d2a1f", accent: "#c89a4b", ready: false },
    { name: "Course Record",   primary: "#f5f0e3", accent: "#1a4032", ready: false }
  ];
  disp += '<div class="set-swatches">';
  _themePreviews.forEach(function(t) {
    var isActive = (t.name === _activeThemeName);
    var opacity = t.ready ? '1' : '0.5';
    disp += '<div class="set-swatch' + (isActive ? ' set-swatch--active' : '') + '" title="' + escHtml(t.name) + (isActive ? ' (current)' : (t.ready ? ' (ready)' : ' (locked)')) + '" style="opacity:' + opacity + '">';
    disp += '<div class="set-swatch__chip">';
    disp += '<div style="position:absolute;inset:0;background:' + t.primary + '"></div>';
    disp += '<div style="position:absolute;bottom:4px;left:6px;width:14px;height:14px;border-radius:50%;background:' + t.accent + '"></div>';
    if (!t.ready) {
      disp += '<div style="position:absolute;top:3px;right:3px"><svg viewBox="0 0 12 12" width="10" height="10" fill="' + t.accent + '"><path d="M3 5V3a3 3 0 116 0v2h.5a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5H3zm1 0h4V3a2 2 0 10-4 0v2z"/></svg></div>';
    }
    disp += '</div>';
    disp += '<div class="set-swatch__name">' + escHtml(t.name.split(" ")[0]) + '</div>';
    disp += '</div>';
  });
  disp += '</div>';
  // Sunlight Mode toggle (W1.S1 / CLUBHOUSE_SPEC §6.2)
  var _sunlightActive = false;
  try { _sunlightActive = localStorage.getItem('pb_sunlight') === '1'; } catch (e) {}
  disp += '<div class="set-row" style="margin-top:6px"><div class="set-row__main"><div class="set-row__label">Sunlight mode</div><div class="set-row__desc">High-contrast outdoor mode. Bumps contrast for glare-readable screens, removes shadows, outlines cards. Toggle on when the sun is winning.</div></div>';
  disp += '<button type="button" id="sunlight-toggle" class="set-switch" role="switch" aria-checked="' + (_sunlightActive ? 'true' : 'false') + '" aria-label="Sunlight mode" onclick="toggleSunlightMode()"></button></div>';
  secs.push({ key: "display", label: "Display", html: disp });

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVACY — Public profile + Blocked members
  // ──────────────────────────────────────────────────────────────────────────
  var priv = "";
  var isPublic = currentProfile && currentProfile.profilePublic;
  priv += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Make profile public</div><div class="set-row__desc">Anyone can see your stats, rounds, and achievements.</div></div>';
  priv += '<button type="button" class="set-switch" role="switch" aria-checked="' + (isPublic ? 'true' : 'false') + '" aria-label="Make profile public" onclick="togglePublicProfile()"></button></div>';
  if (isPublic && currentProfile && currentProfile.username) {
    priv += '<div class="set-note set-note--mute" style="margin-top:12px">Your public profile: <span style="color:var(--cb-brass);font-weight:600">parbaughs.golf/player/' + escHtml(currentProfile.username) + '</span>';
    priv += '<div style="margin-top:8px"><button class="set-link" onclick="sharePublicProfile()">Share profile link</button></div></div>';
  }
  // Blocked members (App Store 1.2) — id="blocked-section" preserved so the
  // unblock deeplink Router.go("settings",{section:"blocked"}) still resolves.
  var _blockedUids = typeof pbBlockedUids === "function" ? pbBlockedUids() : [];
  if (currentUser && _blockedUids.length) {
    priv += '<div id="blocked-section" style="margin-top:20px;scroll-margin-top:88px">';
    priv += '<div class="set-row__label" style="margin-bottom:4px">Blocked members</div>';
    priv += '<div class="set-row__desc" style="margin-bottom:8px">You will not see posts, comments, or messages from blocked members.</div>';
    _blockedUids.forEach(function(uid) {
      var bp = PB.getPlayer(uid);
      var bname = bp ? (bp.name || bp.username || "Member") : "Former member";
      priv += '<div class="set-row"><div class="set-row__main"><div class="set-row__value" style="font-size:15px">' + escHtml(bname) + '</div></div>';
      priv += '<button class="set-link" onclick="settingsUnblockMember(\'' + uid + '\')">Unblock</button></div>';
    });
    priv += '</div>';
  }
  secs.push({ key: "privacy", label: "Privacy", html: priv });

  // ──────────────────────────────────────────────────────────────────────────
  // PARCOINS — balance + cosmetics shop
  // ──────────────────────────────────────────────────────────────────────────
  var coins = "";
  var shopBalance = getParCoinBalance(currentUser ? currentUser.uid : null);
  coins += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Balance</div><div class="set-row__desc">Spend on cosmetics, rings, and name effects in the shop.</div></div>';
  coins += '<div class="set-coins"><span class="set-coins__num">' + shopBalance + '</span><span class="set-coins__lbl">coins</span></div></div>';
  coins += '<div style="margin-top:14px"><button class="set-btn" onclick="Router.go(\'shop\')"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg> Cosmetics shop</button></div>';
  secs.push({ key: "parcoins", label: "ParCoins", html: coins });

  // ──────────────────────────────────────────────────────────────────────────
  // MANAGEMENT — Invites + Commissioner tools (conditional)
  // ──────────────────────────────────────────────────────────────────────────
  var mgmt = "";
  var _canInvite = currentProfile && (isFounderRole(currentProfile) || (currentProfile.invitesUsed || 0) < (currentProfile.maxInvites || 3));
  var _isFounder = isFounderRole(currentProfile);
  if (_canInvite) {
    mgmt += '<div style="margin-bottom:' + (_isFounder ? '10px' : '0') + '"><button class="set-btn" onclick="Router.go(\'invite\')">Manage invite codes</button></div>';
  }
  if (_isFounder) {
    mgmt += '<button class="set-btn" onclick="Router.go(\'admin\')">Admin panel</button>';
    mgmt += '<div class="set-row__desc" style="margin-top:6px">Manage member invite quotas, view all codes, bulk generate.</div>';
  }
  if (mgmt) secs.push({ key: "management", label: "Management", html: mgmt });

  // ──────────────────────────────────────────────────────────────────────────
  // DATA — backup / restore / reset
  // ──────────────────────────────────────────────────────────────────────────
  var data = "";
  data += '<button class="set-btn" onclick="doCopy()">Copy backup code</button>';
  data += '<button class="set-btn" onclick="doRestore()">Restore from backup</button>';
  if (_isFounder) {
    data += '<button class="set-btn" onclick="seedFirestore().then(function(){Router.toast(\'Firestore reseeded\')})">Reseed Firestore from local</button>';
  }
  data += '<button class="set-btn set-btn--claret" onclick="document.getElementById(\'reset-confirm\').style.display=\'block\'">Reset local data</button>';
  data += '<div id="reset-confirm" style="display:none;margin-top:12px;padding:14px;background:rgba(var(--cb-claret-rgb),.05);border:1px solid rgba(var(--cb-claret-rgb),.25);border-radius:var(--radius-md);text-align:center">';
  data += '<div style="font-family:var(--font-ui);font-size:12.5px;color:var(--cb-claret);margin-bottom:10px;font-weight:600">This will erase ALL local data. Are you sure?</div>';
  data += '<div style="display:flex;gap:10px"><button class="set-btn" style="flex:1" onclick="document.getElementById(\'reset-confirm\').style.display=\'none\'">Cancel</button>';
  data += '<button class="set-btn set-btn--claret" style="flex:1" onclick="PB.reset();Router.go(\'home\')">Erase everything</button></div></div>';
  secs.push({ key: "data", label: "Data", html: data });

  // ──────────────────────────────────────────────────────────────────────────
  // ABOUT — version + legal + support
  // ──────────────────────────────────────────────────────────────────────────
  var about = "";
  about += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">App version</div></div><div class="set-row__value set-row__value--mono">v' + APP_VERSION + '</div></div>';
  about += '<div class="set-row"><div class="set-row__main"><div class="set-row__label">Founded</div></div><div class="set-row__value">2026 · York, PA</div></div>';
  about += '<div style="font-family:var(--font-display);font-style:italic;font-size:14px;color:var(--cb-mute);margin:14px 0 18px;line-height:1.5">The Parbaughs Golf Platform. Built by The Commissioner. Firebase-powered, real-time sync.</div>';
  about += '<button class="set-btn" onclick="window.open(\'privacy.html\',\'_blank\',\'noopener\')">Privacy policy</button>';
  about += '<button class="set-btn" onclick="window.open(\'terms.html\',\'_blank\',\'noopener\')">Terms of service</button>';
  about += '<div class="set-row__desc" style="text-align:center;margin-top:14px">Questions? <a href="mailto:support@parbaughs.golf" style="color:var(--cb-brass);font-weight:600">support@parbaughs.golf</a></div>';
  secs.push({ key: "about", label: "About", html: about });

  // ── Assemble ──────────────────────────────────────────────────────────────
  var h = '<div class="set-wrap">';
  h += '<button class="set-back" onclick="Router.back(\'home\')">← Back</button>';
  h += '<div class="roster-masthead"><div class="roster-eyebrow">' + escHtml(_eyebrow) + '</div><h1 class="roster-headline">Settings.</h1></div>';
  h += '<div class="set-grid">';

  // Section nav (left, sticky desktop)
  h += '<nav class="set-nav" aria-label="Settings sections">';
  secs.forEach(function(s) {
    h += '<a class="set-nav__link" data-sec="' + s.key + '" onclick="settingsScrollToSection(\'' + s.key + '\')">' + escHtml(s.label) + '</a>';
  });
  h += '</nav>';

  // Section detail (right / single column)
  h += '<div class="set-detail">';
  secs.forEach(function(s) {
    h += '<section class="set-section" id="' + s.key + '-section">';
    h += '<div class="set-section__head"><span class="set-section__title">' + escHtml(s.label) + '</span></div>';
    h += s.html;
    h += '</section>';
  });
  h += '</div>';

  h += '</div></div>';

  document.querySelector('[data-page="settings"]').innerHTML = h;

  // Section deeplink (v8.11.0). Router.go("settings",{section:"location"}) →
  // scroll to #location-section. 50ms defer lets innerHTML settle.
  if (params && params.section) {
    setTimeout(function() {
      var target = document.getElementById(params.section + "-section");
      if (target && typeof target.scrollIntoView === "function") {
        try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { target.scrollIntoView(); }
      }
    }, 50);
  }

  // Scroll-spy: light up the active section link in the sticky nav as the
  // reader scrolls. No-op on mobile (nav hidden) or browsers without IO.
  (function() {
    if (typeof IntersectionObserver === "undefined") return;
    var links = {};
    Array.prototype.slice.call(document.querySelectorAll('.set-nav__link')).forEach(function(a) {
      links[a.getAttribute('data-sec')] = a;
    });
    var spy = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (!en.isIntersecting) return;
        var key = en.target.id.replace(/-section$/, '');
        Object.keys(links).forEach(function(k) { links[k].classList.remove('set-nav__link--active'); });
        if (links[key]) links[key].classList.add('set-nav__link--active');
      });
    }, { rootMargin: "-88px 0px -65% 0px", threshold: 0 });
    document.querySelectorAll('.set-section').forEach(function(s) { spy.observe(s); });
  })();

  // v8.11.1 — Async geolocation permission probe. When State A is rendered and
  // permission is "denied", reveal the manual-entry caption.
  if (navigator.permissions && typeof navigator.permissions.query === "function") {
    navigator.permissions.query({ name: "geolocation" }).then(function(status) {
      if (status && status.state === "denied") {
        var cap = document.getElementById("loc-permission-denied");
        if (cap) cap.style.display = "block";
      }
    }).catch(function() { /* silent — older browsers reject the query */ });
  }
});

// Smooth-scroll a section into view from the sticky nav (respects reduced motion).
function settingsScrollToSection(key) {
  var el = document.getElementById(key + "-section");
  if (!el) return;
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); } catch (e) { el.scrollIntoView(); }
}

// App Store 1.2 — unblock from the Settings list, then re-render Settings and
// scroll back to the Blocked Members section (which vanishes once empty).
function settingsUnblockMember(uid) {
  if (!uid || typeof pbSetBlocked !== "function") return;
  pbSetBlocked(uid, false).then(function() {
    Router.toast("Unblocked");
    Router.go("settings", { section: "blocked" });
  }).catch(function(e) {
    Router.toast(typeof pbErrMsg === "function" ? pbErrMsg(e, "Couldn't unblock. Try again.") : "Couldn't unblock. Try again.");
  });
}

function togglePublicProfile() {
  if (!currentUser || !db) return;
  var newVal = !(currentProfile && currentProfile.profilePublic);
  db.collection("members").doc(currentUser.uid).update({ profilePublic: newVal }).then(function() {
    if (currentProfile) currentProfile.profilePublic = newVal;
    Router.toast(newVal ? "Profile is now public" : "Profile is now private");
    Router.go("settings", {}, true);
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't update your profile visibility.")); });
}

function sharePublicProfile() {
  var url = "https://parbaughs.golf/player/" + (currentProfile ? currentProfile.username : "");
  if (navigator.share) {
    navigator.share({ title: (currentProfile ? currentProfile.name : "Parbaugh") + " on Parbaughs", url: url }).catch(function(){});
  } else {
    navigator.clipboard.writeText(url).then(function() { Router.toast("Profile link copied!"); }).catch(function() { Router.toast(url); });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LOCATION HANDLERS (v8.11.0 · Member Location ship)
// State C ("DETECTING…") rendered inline via DOM swap during getCurrentPosition
// — no module-level state, matches settings.js convention. On any error the
// button re-enables and the error caption div is populated. Save path mirrors
// togglePublicProfile: write Firestore, mirror to currentProfile, toast,
// full re-render via Router.go("settings", {}, true).
// ════════════════════════════════════════════════════════════════════════════

function _showLocationError(elId, msg) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function _resetLocationDetectButton() {
  var btn = document.getElementById("loc-detect-btn");
  if (!btn) return;
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>Use my current location';
}

function _saveLocation(loc) {
  // loc: { lat, lng, name, source }
  if (!currentUser || !db) {
    Router.toast("Not signed in");
    return;
  }
  var doc = {
    lat: loc.lat,
    lng: loc.lng,
    name: loc.name,
    source: loc.source,
    setAt: fsTimestamp()
  };
  db.collection("members").doc(currentUser.uid).update({ location: doc }).then(function() {
    if (currentProfile) currentProfile.location = doc;
    Router.toast("Location saved");
    Router.go("settings", {}, true);
  }).catch(function(e) {
    Router.toast(pbErrMsg(e, "Couldn't save your location."));
    _resetLocationDetectButton();
  });
}

function detectMyLocation() {
  var btn = document.getElementById("loc-detect-btn");
  var errEl = document.getElementById("loc-detect-error");
  if (errEl) errEl.style.display = "none";
  if (!navigator.geolocation) {
    _showLocationError("loc-detect-error", "Geolocation not supported on this browser. Set manually below.");
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "default";
    btn.textContent = "DETECTING…";
  }
  navigator.geolocation.getCurrentPosition(function(pos) {
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    // Reverse geocode to get display name
    var rg = (typeof PB !== "undefined" && PB.weather && PB.weather.reverseGeocode)
      ? PB.weather.reverseGeocode(lat, lng)
      : Promise.resolve(null);
    rg.then(function(name) {
      _saveLocation({ lat: lat, lng: lng, name: name || "My Location", source: "geolocation" });
    });
  }, function(err) {
    _resetLocationDetectButton();
    var msg = "Couldn't detect location.";
    if (err.code === 1) msg = "Location access denied. Set manually below.";
    else if (err.code === 2) msg = "Location unavailable. Set manually below.";
    else if (err.code === 3) msg = "Location request timed out. Try again or set manually.";
    _showLocationError("loc-detect-error", msg);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
}

function setLocationManual() {
  var input = document.getElementById("loc-manual-input");
  var errEl = document.getElementById("loc-manual-error");
  if (errEl) errEl.style.display = "none";
  if (!input) return;
  var raw = (input.value || "").trim();
  if (!raw) {
    _showLocationError("loc-manual-error", "Enter a city and state.");
    return;
  }
  // Parse "City, State" — comma required per Call 7
  var commaIdx = raw.indexOf(",");
  if (commaIdx === -1) {
    _showLocationError("loc-manual-error", "Enter as City, State (e.g., Charlotte, NC).");
    return;
  }
  var city = raw.substring(0, commaIdx).trim();
  var state = raw.substring(commaIdx + 1).trim().toUpperCase();
  if (!city) {
    _showLocationError("loc-manual-error", "Enter as City, State (e.g., Charlotte, NC).");
    return;
  }
  if (!/^[A-Z]{2}$/.test(state)) {
    _showLocationError("loc-manual-error", "Use 2-letter state code (e.g., NC, CA, TX).");
    return;
  }
  if (typeof PB === "undefined" || !PB.weather || !PB.weather.geocodeCity) {
    _showLocationError("loc-manual-error", "Weather lookup unavailable. Try again later.");
    return;
  }
  // Disable input while geocoding
  input.disabled = true;
  PB.weather.geocodeCity(city, state).then(function(hit) {
    input.disabled = false;
    if (!hit) {
      _showLocationError("loc-manual-error", "Couldn't find that location. Check spelling or try a major nearby city.");
      return;
    }
    _saveLocation({ lat: hit.lat, lng: hit.lng, name: hit.name, source: "manual" });
  });
}

function clearLocation() {
  if (!currentUser || !db) {
    Router.toast("Not signed in");
    return;
  }
  // Use FieldValue.delete() to remove the field entirely (vs setting to null)
  // so _coords() resolution falls cleanly to homeCourse/York path.
  var FieldValue = (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore.FieldValue : null;
  var update = FieldValue ? { location: FieldValue.delete() } : { location: null };
  db.collection("members").doc(currentUser.uid).update(update).then(function() {
    if (currentProfile) delete currentProfile.location;
    Router.toast("Location cleared");
    Router.go("settings", {}, true);
  }).catch(function(e) {
    Router.toast(pbErrMsg(e, "Couldn't clear your location."));
  });
}


// Sunlight Mode toggle (W1.S1 / CLUBHOUSE_SPEC §6.2) — manual setting
// for high-contrast outdoor / glare-readable use. Applies via
// <html data-theme="sunlight">; CSS lives in src/styles/base.css.
// Persists in localStorage 'pb_sunlight' ('1' = on, absent/0 = off).
function toggleSunlightMode() {
  var on = false;
  try { on = localStorage.getItem('pb_sunlight') === '1'; } catch(e) {}
  var next = !on;
  try {
    if (next) localStorage.setItem('pb_sunlight', '1');
    else localStorage.removeItem('pb_sunlight');
  } catch(e) {}
  // Apply / remove the data-theme="sunlight" attribute. Preserves any
  // existing palette theme (clubhouse / twilight_links / linen_draft)
  // by toggling a SECONDARY data attribute layered on top.
  var html = document.documentElement;
  if (next) {
    // Stash the current palette theme so we can restore it when sunlight
    // turns off (sunlight palette is a global override, not a palette swap).
    var current = html.getAttribute('data-theme') || 'clubhouse';
    html.setAttribute('data-palette-theme', current);
    html.setAttribute('data-theme', 'sunlight');
  } else {
    var palette = html.getAttribute('data-palette-theme') || 'clubhouse';
    html.setAttribute('data-theme', palette);
    html.removeAttribute('data-palette-theme');
  }
  if (typeof Router !== 'undefined' && Router.toast) {
    Router.toast(next ? 'Sunlight mode on' : 'Sunlight mode off');
  }
  // Re-render settings page so the toggle button reflects new state
  if (typeof Router !== 'undefined' && Router.go) {
    Router.go('settings', {}, true);
  }
}

// Restore Sunlight Mode preference on app boot — runs once per page
// load via this function being called from the auth flow. Idempotent:
// safe to call multiple times.
function applySunlightModeFromStorage() {
  try {
    if (localStorage.getItem('pb_sunlight') === '1') {
      var html = document.documentElement;
      var current = html.getAttribute('data-theme') || 'clubhouse';
      if (current !== 'sunlight') {
        html.setAttribute('data-palette-theme', current);
        html.setAttribute('data-theme', 'sunlight');
      }
    }
  } catch(e) {}
}

// Auto-apply on script load so the mode persists across reloads.
if (typeof document !== 'undefined' && document.documentElement) {
  applySunlightModeFromStorage();
}
