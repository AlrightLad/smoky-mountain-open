/* ================================================
   PAGE: SETTINGS
   ================================================ */
Router.register("settings", function() {
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

  // Appearance toggle (light/dark) — replaces legacy theme picker
  var currentAppearance = 'light';
  try {
    var lsAppearance = localStorage.getItem('pb_appearance');
    if (lsAppearance === 'dark' || lsAppearance === 'light') currentAppearance = lsAppearance;
    else if (currentProfile && currentProfile.appearance === 'dark') currentAppearance = 'dark';
  } catch(e){}
  var lightActive = currentAppearance === 'light';
  var darkActive = currentAppearance === 'dark';
  var lightBg = lightActive ? 'var(--cb-brass)' : 'transparent';
  var lightBorder = lightActive ? '1px solid var(--cb-brass)' : '1px solid var(--border-subtle)';
  var darkBg = darkActive ? 'var(--cb-brass)' : 'transparent';
  var darkBorder = darkActive ? '1px solid var(--cb-brass)' : '1px solid var(--border-subtle)';
  h += '<div class="section" style="margin-top:16px">';
  h += '<div class="sec-head"><span class="sec-title">Appearance</span></div>';
  h += '<div class="card"><div class="card-body" style="padding:16px">';
  h += '<div style="display:flex;align-items:center;gap:12px">';
  h += '<button id="mode-light-btn" onclick="setAppearance(\'light\')" class="btn-sm" style="flex:1;padding:14px;border-radius:10px;background:' + lightBg + ';border:' + lightBorder + '">';
  h += '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)">Light</span>';
  h += '<div style="margin-top:6px;font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">Clubhouse</div>';
  h += '</button>';
  h += '<button id="mode-dark-btn" onclick="setAppearance(\'dark\')" class="btn-sm" style="flex:1;padding:14px;border-radius:10px;background:' + darkBg + ';border:' + darkBorder + '">';
  h += '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted)">Dark</span>';
  h += '<div style="margin-top:6px;font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">After hours</div>';
  h += '</button>';
  h += '</div>';
  h += '<div style="margin-top:12px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:0.5px">The Clubhouse refresh replaces our previous themes. Your data is safe — only the look changed.</div>';
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

