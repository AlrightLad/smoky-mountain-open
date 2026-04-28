/* ================================================
   PAGE: SETTINGS
   ================================================ */
Router.register("settings", function(params) {
  var h = '<div class="sh"><h2>Settings</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  // Account section
  h += '<div class="form-section"><div class="form-title">Account</div>';
  if (currentUser) {
    h += '<div class="card"><div class="card-body">';
    h += '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:11px;color:var(--muted)">Email</span><span style="font-size:12px;font-weight:600">' + escHtml(currentUser.email) + '</span></div>';
    h += '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:11px;color:var(--muted)">Username</span><span style="font-size:12px;font-weight:600;color:var(--gold)">' + escHtml(currentProfile ? (currentProfile.username||currentProfile.name) : "—") + '</span></div>';
    h += '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:11px;color:var(--muted)">Role</span><span style="font-size:12px;font-weight:600">' + escHtml(currentProfile ? currentProfile.role : "—") + '</span></div>';
    h += '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:11px;color:var(--muted)">Sync</span><span style="font-size:12px;font-weight:600;color:' + (syncStatus==="online"?"var(--birdie)":"var(--red)") + '">' + syncStatus + '</span></div>';
    if (currentUser && !currentUser.emailVerified) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid var(--border);margin-top:4px"><span style="font-size:11px;color:var(--gold)">Email not verified</span><button style="background:var(--gold);color:var(--bg);border:none;border-radius:4px;font:600 10px/1 Inter,sans-serif;padding:6px 12px;cursor:pointer" onclick="sendVerificationEmail()">Send Verification</button></div>';
    } else if (currentUser && currentUser.emailVerified) {
      h += '<div style="display:flex;justify-content:space-between;padding:4px 0"><span style="font-size:11px;color:var(--muted)">Email</span><span style="font-size:11px;color:var(--birdie)">Verified \u2713</span></div>';
    }
    h += '</div></div>';
  } else {
    h += '<div style="font-size:12px;color:var(--muted)">Not signed in</div>';
  }
  h += '</div>';

  // Appearance — placeholder pending full theme picker (Ship 0d-ii)
  var _activeThemeId = (typeof getCurrentTheme === "function") ? getCurrentTheme() : "clubhouse";
  var _activeThemeName = (typeof THEMES !== "undefined" && THEMES[_activeThemeId]) ? THEMES[_activeThemeId].name : "Clubhouse";
  h += '<div class="section" style="margin-top:16px">';
  h += '<div class="sec-head"><span class="sec-title">Appearance</span></div>';
  h += '<div class="card"><div class="card-body" style="padding:16px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">';
  h += '<span style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)">Current theme</span>';
  h += '<span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">' + escHtml(_activeThemeName) + '</span>';
  h += '</div>';
  h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-subtle);font-size:11px;color:var(--text-muted);line-height:1.5">The full theme picker arrives in an upcoming update. Six editorial themes — three ready, three to earn.</div>';
  h += '</div></div></div>';

  // ════════════════════════════════════════════════════════════════════════
  // LOCATION (v8.11.0 · Member Location ship)
  // Three states driven by currentProfile.location:
  //   A — Not set: privacy caption + geolocation button + manual City, State input
  //   B — Set: "Currently: X" + relative time + change link
  //   C — Detecting: handled via direct DOM during getCurrentPosition (no module state)
  // Save pattern matches togglePublicProfile (line 127): write to Firestore,
  // mirror to currentProfile, toast, full re-render via Router.go("settings", {}, true).
  // Tokens: --sp-*, --r-* used for new section per Call 4 (rest of settings.js
  // unmigrated; pre-HQ pages out of scope until full redesign).
  // ════════════════════════════════════════════════════════════════════════
  h += '<div class="section" id="location-section" style="margin-top:var(--sp-4)">';
  h += '<div class="sec-head"><span class="sec-title">Location</span></div>';
  h += '<div class="card"><div class="card-body" style="padding:var(--sp-4)">';
  var loc = currentProfile && currentProfile.location;
  var hasLoc = loc && typeof loc.lat === "number" && typeof loc.lng === "number";
  if (hasLoc) {
    // ── State B: location set ──
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
    h += '<div style="display:flex;flex-direction:column;gap:var(--sp-2)">';
    h += '<div style="display:flex;align-items:baseline;gap:var(--sp-2);flex-wrap:wrap">';
    h += '<span style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)">Currently</span>';
    h += '<span style="font-family:var(--font-display);font-size:14px;font-weight:600;color:var(--text-primary)">' + locName + '</span>';
    h += '</div>';
    if (sourceLabel || setAtLabel) {
      var meta = [sourceLabel, setAtLabel].filter(Boolean).join(" · ");
      h += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:0.5px">' + escHtml(meta) + '</div>';
    }
    h += '<button type="button" onclick="clearLocation()" style="align-self:flex-start;margin-top:var(--sp-2);background:transparent;border:none;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--cb-brass);text-transform:uppercase;padding:0">Change location →</button>';
    h += '</div>';
  } else {
    // ── State A: not set ──
    h += '<div style="font-family:var(--font-mono);font-size:11px;line-height:1.6;color:var(--text-muted);margin-bottom:var(--sp-4)">Your location is used only to show accurate weather. We don\'t share it, and we don\'t track your movements.</div>';
    h += '<button type="button" id="loc-detect-btn" onclick="detectMyLocation()" style="display:flex;align-items:center;justify-content:center;gap:var(--sp-2);width:100%;min-height:44px;padding:var(--sp-3);background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:var(--r-2);cursor:pointer;font-family:var(--font-ui);font-size:13px;font-weight:600">';
    h += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
    h += 'Use my current location';
    h += '</button>';
    h += '<div id="loc-detect-error" style="display:none;font-family:var(--font-mono);font-size:11px;color:var(--cb-claret);margin-top:var(--sp-2);letter-spacing:0.3px"></div>';
    h += '<div style="display:flex;align-items:center;gap:var(--sp-3);margin:var(--sp-4) 0;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase"><div style="flex:1;height:1px;background:var(--border-subtle)"></div>or<div style="flex:1;height:1px;background:var(--border-subtle)"></div></div>';
    h += '<div style="display:flex;gap:var(--sp-2)">';
    h += '<input type="text" id="loc-manual-input" placeholder="City, State (e.g., Charlotte, NC)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();setLocationManual();}" style="flex:1;min-height:44px;padding:var(--sp-2) var(--sp-3);background:var(--cb-chalk);border:1px solid var(--border-subtle);border-radius:var(--r-2);font-family:var(--font-ui);font-size:13px;color:var(--text-primary);outline:none">';
    h += '<button type="button" onclick="setLocationManual()" style="min-height:44px;padding:0 var(--sp-4);background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:var(--r-2);cursor:pointer;font-family:var(--font-ui);font-size:13px;font-weight:600">Set</button>';
    h += '</div>';
    h += '<div id="loc-manual-error" style="display:none;font-family:var(--font-mono);font-size:11px;color:var(--cb-claret);margin-top:var(--sp-2);letter-spacing:0.3px"></div>';
  }
  h += '</div></div></div>';

  // Push notifications
  h += '<div class="form-section"><div class="form-title">Notifications</div>';
  var permState = ('Notification' in window) ? Notification.permission : 'unsupported';
  if (permState === 'granted') {
    h += '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(var(--birdie-rgb),.06);border:1px solid rgba(var(--birdie-rgb),.15);border-radius:var(--radius)">';
    h += '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="var(--birdie)" stroke-width="1.5"><path d="M4 8l3 3 5-6"/></svg>';
    h += '<span style="font-size:12px;color:var(--birdie);font-weight:600">Push notifications enabled</span></div>';
  } else if (permState === 'denied') {
    h += '<div style="padding:10px 12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);font-size:11px;color:var(--muted)">Notifications blocked — update in your browser or device settings</div>';
  } else if (permState === 'unsupported') {
    h += '<div style="padding:10px 12px;font-size:11px;color:var(--muted)">Push notifications are not supported on this browser</div>';
  } else {
    h += '<button class="btn full green" onclick="requestPushPermission()" style="display:flex;align-items:center;justify-content:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg> Enable push notifications</button>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:6px;text-align:center">Get notified about DMs, tee times, event results, and achievements</div>';
  }
  h += '</div>';

  // Public Profile
  h += '<div class="form-section"><div class="form-title">Public Profile</div>';
  var isPublic = currentProfile && currentProfile.profilePublic;
  h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius)">';
  h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">Make profile public</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">Anyone can see your stats, rounds, and achievements</div></div>';
  h += '<div onclick="togglePublicProfile()" style="width:44px;height:26px;border-radius:13px;background:' + (isPublic ? 'var(--birdie)' : 'var(--bg3)') + ';cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">';
  h += '<div style="width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;' + (isPublic ? 'right:2px' : 'left:2px') + ';transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div></div>';
  h += '</div>';
  if (isPublic && currentProfile && currentProfile.username) {
    h += '<div style="margin-top:8px;padding:8px 12px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius);font-size:10px;color:var(--muted)">';
    h += 'Your public profile: <span style="color:var(--gold);font-weight:600">parbaughs.golf/player/' + currentProfile.username + '</span>';
    h += '<div style="margin-top:4px"><button class="btn-sm outline" style="font-size:9px" onclick="sharePublicProfile()">Share Profile Link</button></div></div>';
  }
  h += '</div>';

  // Cosmetics Shop
  h += '<div class="form-section"><div class="form-title">ParCoins</div>';
  var shopBalance = getParCoinBalance(currentUser ? currentUser.uid : null);
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn full green" onclick="Router.go(\'shop\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg> Cosmetics Shop</button>';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;display:flex;align-items:center;gap:6px;flex-shrink:0"><span style="font-size:14px;font-weight:700;color:var(--gold)">' + shopBalance + '</span><span style="font-size:9px;color:var(--muted)">coins</span></div>';
  h += '</div></div>';

  // Invite management
  if (currentProfile && (isFounderRole(currentProfile) || (currentProfile.invitesUsed||0) < (currentProfile.maxInvites||3))) {
    h += '<div class="form-section"><div class="form-title">Invites</div>';
    h += '<div style="margin-bottom:12px"><button class="btn full green" onclick="Router.go(\'invite\')">Manage Invite Codes</button></div>';
    h += '</div>';
  }

  // Commissioner Admin Panel
  if (isFounderRole(currentProfile)) {
    h += '<div class="form-section"><div class="form-title" style="color:var(--gold)">Commissioner Tools</div>';
    h += '<div style="margin-bottom:12px"><button class="btn full green" onclick="Router.go(\'admin\')">Admin Panel</button></div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:-6px;margin-bottom:12px">Manage member invite quotas, view all codes, bulk generate</div>';
    h += '</div>';
  }

  // Data management
  h += '<div class="form-section"><div class="form-title">Data management</div>';
  h += '<div style="margin-bottom:12px"><button class="btn full outline" onclick="doCopy()">Copy backup code</button></div>';
  h += '<div style="margin-bottom:12px"><button class="btn full outline" onclick="doRestore()">Restore from backup</button></div>';
  if (isFounderRole(currentProfile)) {
    h += '<div style="margin-bottom:12px"><button class="btn full outline" onclick="seedFirestore().then(function(){Router.toast(\'Firestore reseeded\')})">Reseed Firestore from Local</button></div>';
  }
  h += '<div style="margin-bottom:12px"><button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red)" onclick="document.getElementById(\'reset-confirm\').style.display=\'block\'">Reset local data</button></div>';
  h += '<div id="reset-confirm" style="display:none;margin-bottom:12px;padding:12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);text-align:center">';
  h += '<div style="font-size:12px;color:var(--red);margin-bottom:8px">This will erase ALL local data. Are you sure?</div>';
  h += '<div style="display:flex;gap:8px"><button class="btn outline" style="flex:1;font-size:11px" onclick="document.getElementById(\'reset-confirm\').style.display=\'none\'">Cancel</button>';
  h += '<button class="btn" style="flex:1;font-size:11px;background:rgba(var(--red-rgb),.15);color:var(--red)" onclick="PB.reset();Router.go(\'home\')">Erase everything</button></div></div>';
  h += '</div>';

  // Sign out
  if (currentUser) {
    h += '<div class="form-section"><button class="btn full" style="background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);color:var(--red)" onclick="doLogout()">Sign Out</button>';
    h += '<button class="btn full" style="margin-top:8px;background:rgba(var(--red-rgb),.12);border:1px solid rgba(var(--red-rgb),.25);color:var(--red)" onclick="deleteMyAccount()">Delete My Account</button>';
    h += '<div style="font-size:9px;color:var(--muted2);margin-top:4px;text-align:center">This permanently removes your account and all associated data</div></div>';
  }

  h += '<div class="form-section"><div class="form-title">About</div>';
  h += '<div style="font-size:12px;color:var(--muted);line-height:1.6">';
  h += 'The Parbaughs Golf Platform v5.22.2<br>';
  h += 'Founded 2026 · York, PA<br>';
  h += 'Built by The Commissioner<br>';
  h += '<span style="color:var(--muted2)">Firebase-powered · Real-time sync</span>';
  h += '</div></div>';

  document.querySelector('[data-page="settings"]').innerHTML = h;

  // Section deeplink (v8.11.0). Router.go("settings",{section:"location"}) →
  // scroll to #location-section. Approach B (route param) per Part 4 audit —
  // no existing deeplink pattern in pages; this is the net-new pattern. 50ms
  // defer lets innerHTML settle before getElementById fires.
  if (params && params.section) {
    setTimeout(function() {
      var target = document.getElementById(params.section + "-section");
      if (target && typeof target.scrollIntoView === "function") {
        try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { target.scrollIntoView(); }
      }
    }, 50);
  }
});

function togglePublicProfile() {
  if (!currentUser || !db) return;
  var newVal = !(currentProfile && currentProfile.profilePublic);
  db.collection("members").doc(currentUser.uid).update({ profilePublic: newVal }).then(function() {
    if (currentProfile) currentProfile.profilePublic = newVal;
    Router.toast(newVal ? "Profile is now public" : "Profile is now private");
    Router.go("settings", {}, true);
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
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
    Router.toast("Failed to save: " + (e.message || "unknown error"));
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
    Router.toast("Failed to clear: " + (e.message || "unknown error"));
  });
}

