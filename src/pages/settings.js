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
    h += '</div></div>';
  } else {
    h += '<div style="font-size:12px;color:var(--muted)">Not signed in</div>';
  }
  h += '</div>';

  // Theme picker
  var currentTheme = (currentProfile && currentProfile.theme) || 'classic';
  try { if (!currentProfile || !currentProfile.theme) { var ls = localStorage.getItem('pb_theme'); if (ls && THEMES[ls]) currentTheme = ls; } } catch(e){}
  h += '<div class="form-section"><div class="form-title">Theme</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  // Check if current user is a champion (won any event)
  var isChampion = false;
  if (currentUser) {
    var myChampIds = [currentUser.uid];
    if (currentProfile && currentProfile.claimedFrom) myChampIds.push(currentProfile.claimedFrom);
    PB.getTrips().forEach(function(t) {
      if (t.champion && myChampIds.indexOf(t.champion) !== -1) isChampion = true;
    });
  }
  Object.keys(THEMES).forEach(function(tid) {
    var t = THEMES[tid];
    var isActive = tid === currentTheme;
    var isLocked = tid === "sundayred" && !isChampion;
    if (isLocked) {
      h += '<div style="padding:12px;border-radius:var(--radius-lg);border:2px solid var(--border);background:var(--card);opacity:.4;position:relative">';
      h += '<div style="display:flex;gap:4px;margin-bottom:8px">';
      t.colors.forEach(function(c) {
        h += '<div style="width:20px;height:20px;border-radius:50%;background:' + c + ';border:1px solid rgba(255,255,255,.1)"></div>';
      });
      h += '</div>';
      h += '<div style="font-size:12px;font-weight:600;color:var(--muted2)">' + t.label + '</div>';
      h += '<div style="font-size:9px;color:var(--muted2);margin-top:2px">' + t.desc + '</div>';
      h += '<div style="font-size:8px;color:var(--muted2);margin-top:4px;font-weight:700;letter-spacing:.5px;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg> WIN AN EVENT TO UNLOCK</div>';
      h += '</div>';
    } else {
      h += '<div onclick="saveTheme(\'' + tid + '\');Router.go(\'settings\',{},true)" style="cursor:pointer;padding:12px;border-radius:var(--radius-lg);border:2px solid ' + (isActive ? 'var(--gold)' : 'var(--border)') + ';background:' + (isActive ? 'rgba(var(--gold-rgb),.08)' : 'var(--card)') + ';transition:border-color .15s">';
      h += '<div style="display:flex;gap:4px;margin-bottom:8px">';
      t.colors.forEach(function(c) {
        h += '<div style="width:20px;height:20px;border-radius:50%;background:' + c + ';border:1px solid rgba(255,255,255,.1)"></div>';
      });
      h += '</div>';
      h += '<div style="font-size:12px;font-weight:600;color:' + (isActive ? 'var(--gold)' : 'var(--cream)') + '">' + t.label + '</div>';
      h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + t.desc + '</div>';
      if (isActive) h += '<div style="font-size:8px;color:var(--gold);margin-top:4px;font-weight:700;letter-spacing:.5px">ACTIVE</div>';
      h += '</div>';
    }
  });
  h += '</div></div>';

  // Invite management
  if (currentProfile && (currentProfile.role === "commissioner" || (currentProfile.invitesUsed||0) < (currentProfile.maxInvites||3))) {
    h += '<div class="form-section"><div class="form-title">Invites</div>';
    h += '<div style="margin-bottom:12px"><button class="btn full green" onclick="Router.go(\'invite\')">Manage Invite Codes</button></div>';
    h += '</div>';
  }

  // Commissioner Admin Panel
  if (currentProfile && currentProfile.role === "commissioner") {
    h += '<div class="form-section"><div class="form-title" style="color:var(--gold)">Commissioner Tools</div>';
    h += '<div style="margin-bottom:12px"><button class="btn full green" onclick="Router.go(\'admin\')">Admin Panel</button></div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:-6px;margin-bottom:12px">Manage member invite quotas, view all codes, bulk generate</div>';
    h += '</div>';
  }

  // Data management
  h += '<div class="form-section"><div class="form-title">Data management</div>';
  h += '<div style="margin-bottom:12px"><button class="btn full outline" onclick="doCopy()">Copy backup code</button></div>';
  h += '<div style="margin-bottom:12px"><button class="btn full outline" onclick="doRestore()">Restore from backup</button></div>';
  if (currentProfile && currentProfile.role === "commissioner") {
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

