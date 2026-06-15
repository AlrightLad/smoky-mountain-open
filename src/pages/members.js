/* ================================================
   PAGE: MEMBERS
   ================================================ */

Router.register("members", function(params) {
  if (params.add) renderAddMemberForm();
  else if (params.edit) renderMemberEdit(params.edit);
  else if (params.id) renderMemberDetail(params.id);
  else renderMemberList();
});

// /profile route — shortcut to the viewer's own member detail. Previously
// unregistered, so navigating to /profile rendered a blank chrome-only
// page. Redirects to /members?id=<viewer-uid> so the renderer writes to
// the canonical members container (avoids two-container ambiguity).
// v8.24.16 — Ralph-review fix: "profile-edit" was a GHOST route (container +
// tab-match token existed but no Router.register), rendering a blank page.
// Redirect to the canonical members edit form for the signed-in member.
Router.register("profile-edit", function() {
  var uid = (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : null;
  if (uid) Router.go("members", { edit: uid });
  else Router.go("members");
});

Router.register("profile", function(params) {
  var uid = null;
  if (typeof currentUser !== "undefined" && currentUser && currentUser.uid) {
    uid = currentUser.uid;
  } else if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.claimedFrom) {
    uid = currentProfile.claimedFrom;
  }
  if (uid) {
    Router.go("members", { id: uid });
  } else {
    Router.go("members");
  }
});

function renderMemberList() {
  var players = PB.getPlayers();
  
  // Show loading while fetching Firebase members
  document.querySelector('[data-page="members"]').innerHTML =
    '<div class="hq-grid"><div class="hq-grid__main">' +
    _rosterMasthead(null) +
    '<div style="padding:48px 16px;text-align:center;font-family:var(--font-ui);color:var(--cb-mute);font-style:italic">Loading the roster…</div>' +
    '</div></div>';
  
  if (db) {
    db.collection("members").get({ source: 'server' }).then(function(snap) {
      var fbMembers = [];
      var claimedFromIds = [];
      var seenDocIds = {}; // dedup by Firestore doc ID — prevents double-render artifacts
      snap.forEach(function(doc) {
        if (seenDocIds[doc.id]) return;
        seenDocIds[doc.id] = true;
        var d = doc.data();
        d.id = d.id || doc.id;
        // v8.17.0 Path B+ hardening — direct Firestore query bypasses
        // PB.getPlayers() filter; apply visibility check explicitly here.
        // (V13.3 audit miss — patched in immediate followup.)
        if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(d)) return;
        // v8.24.38 — the roster is the ACTIVE league's member list, not the
        // whole platform. Filter by the league doc's memberUids (the same
        // list the security rules treat as membership). Skipped when the
        // cache hasn't warmed so a cold load still shows a roster rather
        // than a blank room.
        var _lgUids = window._activeLeagueMemberUids;
        if (Array.isArray(_lgUids) && _lgUids.length && _lgUids.indexOf(doc.id) === -1) return;
        fbMembers.push(d);
        if (d.claimedFrom) claimedFromIds.push(d.claimedFrom);
      });
      
      pbLog("[Members] Firebase:", fbMembers.length, "Local:", players.length, "Claimed:", claimedFromIds.length);
      
      // Filter local players: remove any whose ID was claimed by a Firebase account
      var filtered = players.filter(function(p) {
        return claimedFromIds.indexOf(p.id) === -1;
      });
      // v8.24.38 — unclaimed legacy local profiles are founding-league members
      // by definition (they pre-date leagues, same rationale as the trips
      // visibility rule). Other leagues' rosters list only their own people.
      if (getActiveLeague() !== "the-parbaughs") filtered = [];
      
      // Add Firebase members — deduplicate by doc ID, claimedFrom, AND username
      var filteredIds = filtered.map(function(p) { return p.id; });
      var seenClaimedFrom = {};
      var seenUsernames = {};
      // First pass: index all real accounts (has username + email = registered user)
      fbMembers.forEach(function(fm) {
        if (fm.claimedFrom && fm.username) seenClaimedFrom[fm.claimedFrom] = fm.id;
        // Track richest doc per username (most fields = real account)
        if (fm.username) {
          var key = fm.username.toLowerCase();
          var existing = seenUsernames[key];
          if (!existing) {
            seenUsernames[key] = fm;
          } else {
            // Keep the doc with more data (real account wins over stub)
            var fmScore = Object.keys(fm).length + (fm.email ? 5 : 0) + (fm.claimedFrom ? 2 : 0);
            var exScore = Object.keys(existing).length + (existing.email ? 5 : 0) + (existing.claimedFrom ? 2 : 0);
            if (fmScore > exScore) seenUsernames[key] = fm;
          }
        }
      });
      fbMembers.forEach(function(fm) {
        if (isBannedRole(fm)) return;
        if (filteredIds.indexOf(fm.id) !== -1) return;
        // Skip stub docs: has claimedFrom but no username, AND a real account exists
        if (fm.claimedFrom && !fm.username && seenClaimedFrom[fm.claimedFrom]) return;
        // Skip duplicate usernames: only add if this is the chosen (richest) doc
        if (fm.username && seenUsernames[fm.username.toLowerCase()] !== fm) return;
        filtered.push(fm);
        filteredIds.push(fm.id);
      });
      
      pbLog("[Members] Final list:", filtered.length, filtered.map(function(p){return p.name||p.username}).join(", "));
      
      renderMemberListHtml(filtered);
    }).catch(function(e) {
      console.error("[Members] Firebase load failed:", e);
      renderMemberListHtml(players);
    });
  } else {
    renderMemberListHtml(players);
  }
}

// ── ROSTER (Members directory) — CLUBHOUSE_SPEC-HQ-3e dense table (W1.S3) ──
// Replaces the prior card grid. Every visible value traces to source (P9):
// handicap + rounds from PB.getPlayerRounds; "last seen" from the most recent
// round timestamp; live status from onlineMembers; rail leaders/active derived
// from the same per-player round set. No fabricated columns.

// Per-player view model. lastTs = most recent round (ms); weekCount = rounds in
// the trailing 7 days. Both derive from real round timestamps/dates only.
function _rosterModel(p) {
  var rounds = [];
  try { rounds = PB.getPlayerRounds(p.id) || []; } catch(e) { rounds = []; }
  var hcap = null;
  try { hcap = PB.calcHandicap(rounds); } catch(e) { hcap = null; }
  var lastTs = 0, weekCount = 0;
  var weekAgo = Date.now() - 604800000;
  rounds.forEach(function(r) {
    var t = r.timestamp || (r.date ? new Date(r.date + "T12:00:00").getTime() : 0);
    if (t > lastTs) lastTs = t;
    if (t >= weekAgo) weekCount++;
  });
  var online = !!(typeof onlineMembers !== "undefined" && onlineMembers && onlineMembers[p.id]);
  // Cross-league surfacing (Founder: "viewing friends, e.g. if they are from other
  // leagues"). Uses data already on the member doc (p.leagues) + the viewer's own
  // leagues — no new collection, no rules change.
  var myLeagues = (typeof currentProfile !== "undefined" && currentProfile && currentProfile.leagues) ? currentProfile.leagues : [];
  var theirLeagues = Array.isArray(p.leagues) ? p.leagues : [];
  var sharedLeagues = theirLeagues.filter(function(l){ return myLeagues.indexOf(l) !== -1; }).length;
  return {
    p: p,
    name: p.username || p.name || "Member",
    isFounder: !!(p.founding || p.isFoundingFour),
    hcap: hcap,
    rounds: rounds.length,
    lastTs: lastTs,
    weekCount: weekCount,
    online: online,
    leagueCount: theirLeagues.length,
    sharedLeagues: sharedLeagues
  };
}

// Render a display name, muting any Discord-style #XXXX discriminator (W4.I1).
function _rosterNameHtml(name) {
  var hashIdx = name.lastIndexOf('#');
  if (hashIdx > 0 && /^#\d{1,4}$/.test(name.slice(hashIdx))) {
    return escHtml(name.slice(0, hashIdx)) + '<span style="opacity:0.5;font-weight:500;letter-spacing:0.5px">' + escHtml(name.slice(hashIdx)) + '</span>';
  }
  return escHtml(name);
}

// Editorial masthead. count === null during the loading state (count unknown).
function _rosterMasthead(count) {
  // v8.24.38 — name the league actually being listed (was hardcoded to
  // the founding league, wrong for every other league).
  var label = (window._activeLeagueName || 'The Parbaughs').toUpperCase();
  if (count !== null && count !== undefined) label += ' · ' + count + (count === 1 ? ' MEMBER' : ' MEMBERS');
  return '<button type="button" class="roster-skip" onclick="var el=document.getElementById(\'rosterTableRegion\');if(el){el.focus();el.scrollIntoView();}">Skip to roster</button>' +
    '<div class="roster-masthead">' +
    '<div class="roster-eyebrow">' + label + '</div>' +
    '<h1 class="roster-headline">The roster.</h1>' +
    '</div>';
}

// Scope rail: All/Live tabs, search, native sort select. Reads current
// tab/sort from window state so re-renders preserve selection.
function _rosterScope() {
  var tab = window._rosterTab || 'all';
  var sort = window._rosterSort || 'alpha';
  var models = window._rosterModels || [];
  var liveCount = 0;
  models.forEach(function(m) { if (m.online) liveCount++; });
  var h = '<div class="roster-scope">';
  h += '<div class="roster-tabs" role="tablist">';
  h += '<button type="button" class="roster-tab' + (tab === 'all' ? ' roster-tab--active' : '') + '" data-tab="all" onclick="rosterSetTab(\'all\')">All members</button>';
  h += '<button type="button" class="roster-tab' + (tab === 'live' ? ' roster-tab--active' : '') + '" data-tab="live" onclick="rosterSetTab(\'live\')"><span class="roster-tab__pulse"></span>Live now' + (liveCount ? (' (' + liveCount + ')') : '') + '</button>';
  h += '</div>';
  h += '<div class="roster-controls">';
  h += '<input type="text" id="rosterSearch" class="roster-search" placeholder="Search members" oninput="filterRoster()" aria-label="Search members">';
  h += '<select class="roster-sort" aria-label="Sort roster" onchange="rosterSetSort(this.value)">';
  var opts = [["alpha", "Username A–Z"], ["handicap", "Handicap low→high"], ["rounds", "Most rounds"], ["recent", "Recently active"]];
  opts.forEach(function(o) { h += '<option value="' + o[0] + '"' + (sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; });
  h += '</select>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Sort a model list by the active key. Ties resolve A-Z; null handicaps sink.
function _rosterSortModels(models, key) {
  var s = models.slice();
  if (key === 'handicap') {
    s.sort(function(a, b) {
      if ((a.hcap === null || a.hcap === undefined) && (b.hcap === null || b.hcap === undefined)) return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      if (a.hcap === null || a.hcap === undefined) return 1;
      if (b.hcap === null || b.hcap === undefined) return -1;
      return a.hcap - b.hcap;
    });
  } else if (key === 'rounds') {
    s.sort(function(a, b) { return (b.rounds - a.rounds) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
  } else if (key === 'recent') {
    s.sort(function(a, b) { return (b.lastTs - a.lastTs) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
  } else {
    s.sort(function(a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
  }
  return s;
}

// Build <tbody> rows. colspan must track the 6-column header.
function _rosterRows(models) {
  if (!models.length) {
    return '<tr class="roster-empty-row"><td colspan="6">No members match your search.</td></tr>';
  }
  var star = ' <svg viewBox="0 0 12 12" width="10" height="10" style="vertical-align:middle;margin-left:3px"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.6 3.5L6 9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" fill="var(--cb-brass)" stroke="none"/></svg>';
  var h = '';
  models.forEach(function(m) {
    var p = m.p;
    var sub = '';
    if (p.equippedTitle && p.equippedTitle !== "Member" && p.equippedTitle !== "Rookie") sub = escHtml(p.equippedTitle);
    else if (typeof isFounderRole === "function" && isFounderRole(p)) sub = "Founder";
    else if (typeof platformRoleOf === "function" && platformRoleOf(p) === "suspended") sub = "Suspended";
    var hcapCell = (m.hcap !== null && m.hcap !== undefined)
      ? '<span class="roster-hcap">' + m.hcap + '</span>'
      : '<span class="roster-hcap roster-hcap--none">—</span>';
    var lastAct = m.lastTs ? feedTimeAgo(m.lastTs) : '—';
    var statusCell = m.online
      ? '<span class="roster-live"><span class="roster-status-dot" aria-hidden="true"></span>Live now</span>'
      : '<span class="roster-activity" aria-hidden="true">—</span>';
    var hcapTxt = (m.hcap !== null && m.hcap !== undefined) ? 'handicap ' + m.hcap : 'no handicap yet';
    var actTxt = m.lastTs ? 'last active ' + lastAct : 'no rounds yet';
    var aria = m.name + ', ' + hcapTxt + ', ' + m.rounds + (m.rounds === 1 ? ' round' : ' rounds') + ', ' + actTxt + ', ' + (m.online ? 'live now' : 'not live');
    var go = "Router.go('members',{id:'" + p.id + "'})";
    h += '<tr class="roster-row" tabindex="0" aria-label="' + escHtml(aria) + '" data-name="' + escHtml(m.name.toLowerCase()) + '" onclick="' + go + '" onkeydown="if(event.key===\'Enter\'){' + go + '}">';
    h += '<td class="roster-cell-av">' + renderAvatar(p, 40, false) + '</td>';
    var crossChip = (m.leagueCount > 1) ? '<span class="roster-leagues-chip" title="Also plays in other leagues">' + m.leagueCount + ' leagues' + (m.sharedLeagues > 1 ? ' · ' + m.sharedLeagues + ' shared' : '') + '</span>' : '';
    h += '<td><div class="roster-name">' + _rosterNameHtml(m.name) + (m.isFounder ? star : '') + crossChip + '</div>' + (sub ? '<div class="roster-handle">' + sub + '</div>' : '') + '</td>';
    h += '<td class="roster-num">' + hcapCell + '</td>';
    h += '<td class="roster-num roster-col-rounds"><span class="roster-rounds">' + m.rounds + '</span></td>';
    h += '<td class="roster-col-activity"><span class="roster-activity">' + lastAct + '</span></td>';
    h += '<td class="roster-ctr">' + statusCell + '</td>';
    h += '</tr>';
  });
  return h;
}

// One agate-rail leaderboard row (rank · avatar · name · value).
function _railRow(rank, p, valueHtml) {
  var go = "Router.go('members',{id:'" + p.id + "'})";
  var nm = p.username || p.name || "Member";
  return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;cursor:pointer" onclick="' + go + '">' +
    '<span style="font-family:var(--font-mono);font-size:11px;color:var(--cb-mute-2);min-width:14px">' + rank + '</span>' +
    renderAvatar(p, 28, false) +
    '<span style="flex:1;min-width:0;font-family:var(--font-display);font-style:italic;font-size:15px;color:var(--cb-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _rosterNameHtml(nm) + '</span>' +
    '<span style="font-family:var(--font-display);font-weight:600;font-size:15px;color:var(--cb-brass);font-variant-numeric:tabular-nums">' + valueHtml + '</span>' +
    '</div>';
}

// Agate rail (≥960px only — hidden by .hq-grid__rail-right below that).
function _rosterRail(models) {
  var h = '';
  var hc = models.filter(function(m) { return m.hcap !== null && m.hcap !== undefined; }).slice();
  hc.sort(function(a, b) { return a.hcap - b.hcap; });
  hc = hc.slice(0, 3);
  var act = models.filter(function(m) { return m.weekCount > 0; }).slice();
  act.sort(function(a, b) { return b.weekCount - a.weekCount; });
  act = act.slice(0, 3);

  if (hc.length) {
    h += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Handicap leaders</div>';
    hc.forEach(function(m, i) { h += _railRow(i + 1, m.p, '' + m.hcap); });
    h += '</div>';
  }
  if (act.length) {
    h += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Most active · 7 days</div>';
    act.forEach(function(m, i) { h += _railRow(i + 1, m.p, m.weekCount + (m.weekCount === 1 ? ' rd' : ' rds')); });
    h += '</div>';
  }
  h += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Clubhouse</div>' +
    '<p style="font-family:var(--font-display);font-style:italic;font-size:17px;line-height:1.4;color:var(--cb-charcoal);margin:8px 0 0">"Community over competition. Always."</p></div>';
  return h;
}

function renderMemberListHtml(players) {
  // v8.25.93 — defense-in-depth test/real isolation (Founder: test user showing in
  // all-members). The primary Firestore path filters isMemberVisibleToViewer, but
  // the LOCAL-players merge + the catch/no-db fallbacks reach this render unfiltered
  // — so apply the visibility filter HERE too (the final render point) so a test
  // account never leaks into a real viewer's roster via ANY path. Mirrors the
  // richlist/feed guard; only filters the test↔real boundary, never real members.
  var visible = players.filter(function(p) {
    if (isBannedRole(p)) return false;
    if (typeof PB.isMemberVisibleToViewer === "function" && !PB.isMemberVisibleToViewer(p)) return false;
    return true;
  });
  var models = visible.map(_rosterModel);
  window._rosterModels = models;
  window._rosterTab = 'all';
  window._rosterSort = 'alpha';

  var initial = _rosterSortModels(models, 'alpha');

  var h = '<div class="hq-grid">';
  h += '<div class="hq-grid__main">';
  h += _rosterMasthead(visible.length);
  h += _rosterScope();
  h += '<div id="rosterTableRegion" tabindex="-1">';
  h += '<table class="roster-table">';
  h += '<thead><tr>';
  h += '<th class="roster-cell-av" scope="col" aria-label="Avatar"></th>';
  h += '<th scope="col">Member</th>';
  h += '<th class="roster-num" scope="col">Hcp</th>';
  h += '<th class="roster-num roster-col-rounds" scope="col">Rounds</th>';
  h += '<th class="roster-col-activity" scope="col">Last seen</th>';
  h += '<th class="roster-ctr" scope="col">Status</th>';
  h += '</tr></thead>';
  h += '<tbody id="rosterBody">' + _rosterRows(initial) + '</tbody>';
  h += '</table>';
  h += '</div>';
  h += '<div class="section">' + renderInviteMemberButton() + '</div>';
  h += '</div>';
  h += '<aside class="hq-grid__rail-right" aria-label="Roster highlights">' + _rosterRail(models) + '</aside>';
  h += '</div>';
  document.querySelector('[data-page="members"]').innerHTML = h;
  // v8.25.78 — roster rows cascade in on first render. Fires here (full render)
  // not in filterRoster (which only swaps #rosterBody on search/sort), so the
  // reveal doesn't re-trigger on every keystroke. transform/opacity only,
  // reduced-motion no-ops inside staggeredReveal.
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="members"] .roster-row'), { gap: 28, duration: 280 });
}

function rosterSetTab(tab) {
  window._rosterTab = tab;
  var tabs = document.querySelectorAll('.roster-tab');
  for (var i = 0; i < tabs.length; i++) {
    var isActive = tabs[i].getAttribute('data-tab') === tab;
    tabs[i].className = 'roster-tab' + (isActive ? ' roster-tab--active' : '');
  }
  filterRoster();
}

function rosterSetSort(key) {
  window._rosterSort = key;
  filterRoster();
}

// Single render path for tab + search + sort. Rebuilds tbody from the cached
// model list so no per-row DOM mutation drift accumulates.
function filterRoster() {
  var models = window._rosterModels || [];
  var searchEl = document.getElementById("rosterSearch");
  var q = (searchEl ? searchEl.value : "").toLowerCase().trim();
  var tab = window._rosterTab || 'all';
  var sort = window._rosterSort || 'alpha';
  var out = [];
  models.forEach(function(m) {
    if (tab === 'live' && !m.online) return;
    if (q && m.name.toLowerCase().indexOf(q) === -1) return;
    out.push(m);
  });
  out = _rosterSortModels(out, sort);
  var body = document.getElementById("rosterBody");
  if (body) body.innerHTML = _rosterRows(out);
}

function renderMemberDetail(pid) {
  var p = PB.getPlayer(pid);
  
  // If not in local data, try Firebase
  if (!p && db) {
    db.collection("members").doc(pid).get().then(function(doc) {
      if (doc.exists) {
        renderMemberDetailWithData(doc.data());
      } else {
        renderMemberList();
      }
    }).catch(function() { renderMemberList(); });
    // Show loading while we fetch
    document.querySelector('[data-page="members"]').innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';
    return;
  }
  if (!p) { renderMemberList(); return; }
  renderMemberDetailWithData(p);
}

// Extracted to src/pages/members-detail.js per W1.A5. Originally lines 251-1019 of this file.
// Extracted to src/pages/members-graph.js per W1.A5. Originally lines 1020-1195 of this file.
// Extracted to src/pages/members-edit.js per W1.A5. Originally lines 1196-1625 of this file.
function handleEditPhoto(pid, input) {
  // Legacy wrapper — redirect to the proper upload function
  uploadMemberPhoto(pid);
}

function uploadMemberPhoto(pid) {
  // Strictly self-only — no one can change another user's photo
  var isOwnProfile = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwnProfile) {
    Router.toast("You can only change your own photo");
    return;
  }
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { Router.toast("Photo too large (max 10MB)"); return; }
    Router.toast("Compressing...");
    var reader = new FileReader();
    reader.onload = function(e) {
      compressPhoto(e.target.result, PHOTO_MAX_KB, 200, function(compressed) {
        // Cache locally under ALL known IDs for this player
        PB.updatePlayer(pid, { photo: compressed, stockAvatar: "" });
        photoCache["member:" + pid] = compressed;
        if (currentProfile && currentProfile.claimedFrom) {
          photoCache["member:" + currentProfile.claimedFrom] = compressed;
          PB.updatePlayer(currentProfile.claimedFrom, { photo: compressed, stockAvatar: "" });
        }
        if (currentUser && currentUser.uid !== pid) {
          photoCache["member:" + currentUser.uid] = compressed;
        }
        // Save to Firestore photos collection (visible to all members)
        savePhoto("member", pid, compressed).then(function(ok) {
          // Also write hasPhoto flag to member doc so it survives cache miss
          if (ok && db && currentUser) {
            db.collection("members").doc(currentUser.uid).update({
              hasPhoto: true,
              stockAvatar: "",
              updatedAt: fsTimestamp()
            }).catch(function() {});
          }
          Router.toast(ok ? "Photo updated!" : "Photo saved locally");
          updateProfileBar();
          Router.go("members", { id: pid });
        });
      });
    };
    reader.onerror = function() { Router.toast("Failed to read photo"); };
    reader.readAsDataURL(file);
  };
  input.click();
}

function renderInviteMemberButton() {
  if (!currentProfile) return '<button class="btn full outline" disabled>Sign in to invite members</button>';
  
  var isComm = isFounderRole(currentProfile);
  var invitesLeft = pbInvitesLeft(currentProfile); if (invitesLeft === Infinity) invitesLeft = 999;
  var h = '';
  
  if (invitesLeft > 0 || isComm) {
    h += '<button class="btn full green" onclick="promptAddMember()">+ Invite New Member</button>';
    h += '<div style="text-align:center;margin-top:6px;font-size:10px;color:var(--muted)">';
    if (isComm) h += 'Commissioner · Unlimited invites';
    else h += invitesLeft + ' invite' + (invitesLeft !== 1 ? 's' : '') + ' remaining';
    h += '</div>';
  } else {
    h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--cream);margin-bottom:4px">No Invites Remaining</div>';
    h += '<div style="font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:12px">You\'ve used all your invites. Ask the Commissioner for more, or have them send an invite on your behalf.</div>';
    h += '<button class="btn full outline" onclick="requestInviteFromCommissioner()">Ask Commissioner for Invite</button>';
    h += '</div>';
  }
  return h;
}

function requestInviteFromCommissioner() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready"); return; }
  // Find commissioner
  var players = PB.getPlayers();
  var commissioner = players.find(function(p) { return isFounderRole(p); });
  if (!commissioner) { Router.toast("No commissioner found"); return; }
  
  // Send notification to commissioner
  sendNotification(commissioner.id, {
    type: "invite_request",
    title: "Invite Request",
    message: (currentProfile.name || currentProfile.username) + " is requesting an invite code for a new member"
  });
  Router.toast("Request sent to the Commissioner!");
}

function promptAddMember() {
  if (!currentProfile) { Router.toast("Sign in first"); return; }
  var isComm = isFounderRole(currentProfile);
  var invitesLeft = pbInvitesLeft(currentProfile); if (invitesLeft === Infinity) invitesLeft = 999;
  
  if (invitesLeft <= 0 && !isComm) {
    Router.toast("No invites remaining");
    return;
  }
  Router.go("members", { add: true });
}

function renderAddMemberForm() {
  var isComm = isFounderRole(currentProfile);
  var _l = pbInvitesLeft(currentProfile); var invitesLeft = (_l === Infinity) ? "∞" : _l;
  
  var h = '<div class="sh"><h2>Invite Member</h2><button class="back" onclick="Router.back(\'members\')">← Back</button></div>';
  
  h += '<div class="form-section">';
  h += '<div style="text-align:center;margin-bottom:16px;padding:12px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius)">';
  h += '<div id="inviteCountDisplay" style="font-size:11px;color:var(--gold);font-weight:600">Invites remaining: ' + invitesLeft + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">New member will receive an invite code to create their account</div>';
  h += '</div>';
  
  h += '<div class="form-title">Option 1: Generate Invite Code</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">Generate a code and share it with the person. They\'ll use it to sign up.</div>';
  h += '<button class="btn full green" onclick="generateInviteFromMembers()">Generate Invite Code</button>';
  h += '<div id="memberInviteResult" style="margin-top:8px"></div>';
  
  // Only Commissioner can add locally
  if (isComm) {
    h += '<div style="margin:20px 0;display:flex;align-items:center;gap:12px"><div style="flex:1;height:1px;background:var(--border)"></div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:2px">or</div><div style="flex:1;height:1px;background:var(--border)"></div></div>';
    
    h += '<div class="form-title">Commissioner: Add Locally</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">Add a player name to track scores now. They can claim their profile later when they sign up.</div>';
    h += formField("Name", "add-name", "", "text", "First name or nickname");
    h += '<div class="ff"><label class="ff-label">Referred by</label><select class="ff-input" id="add-referral"><option value="">— Select member —</option>';
    PB.getPlayers().forEach(function(p) {
      h += '<option value="' + escHtml(p.name) + '">' + escHtml(p.name) + '</option>';
    });
    h += '</select></div>';
    h += formField("Score range", "add-range", "", "text", "e.g. 95-105");
    h += formField("Handicap", "add-handicap", "", "number", "e.g. 18.5");
    h += '<button class="btn full outline" onclick="submitAddMember()">Add Locally</button>';
  }
  h += '</div>';
  h += renderPageFooter();
  document.querySelector('[data-page="members"]').innerHTML = h;
  // Restore last generated invite if page was re-rendered by snapshot listener
  if (_lastGeneratedInvite) setTimeout(showGeneratedInvite, 50);
}

var _lastGeneratedInvite = null; // Survives page re-renders

function generateInviteFromMembers() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready, try refreshing"); return; }
  var isComm = isFounderRole(currentProfile);
  if (pbInvitesLeft(currentProfile) <= 0) { Router.toast("No invites remaining"); return; }
  
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; var code = "PB-";
  for (var i=0;i<8;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  var memberDocId = currentProfile.docId || currentUser.uid;
  var inviteLink = "https://alrightlad.github.io/smoky-mountain-open/?invite=" + code;
  
  // Show loading state
  var resultEl = document.getElementById("memberInviteResult");
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">Generating...</div>';
  
  // v8.24.14 — write the CANONICAL invite shape (createInviteDoc: leagueId so the
  // new member lands in the right league, expiresAt for the 7-day window). The
  // old inline shape here omitted both — invites misrouted + never expired.
  db.collection("invites").doc(code).set(createInviteDoc(code))
    .then(function() {
      // Store invite so it survives page re-renders from the profile snapshot listener
      _lastGeneratedInvite = { code: code, link: inviteLink };
      currentProfile.invitesUsed = (currentProfile.invitesUsed||0)+1;
      showGeneratedInvite();
      Router.toast("Invite created!");
      // Delay member doc update so it doesn't trigger re-render before user sees the code
      setTimeout(function() {
        db.collection("members").doc(memberDocId).update({invitesUsed:firebase.firestore.FieldValue.increment(1)}).catch(function(){});
      }, 1500);
    })
    .catch(function(err) {
      pbWarn("[Invite] Error:", err);
      _lastGeneratedInvite = null;
      if (resultEl) resultEl.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--red);text-align:center">Failed: ' + (err.message || "Permission denied. Ask the Commissioner to check Firestore rules for the invites collection.") + '</div>';
      Router.toast("Failed to create invite");
    });
}

function showGeneratedInvite() {
  if (!_lastGeneratedInvite) return;
  var resultEl = document.getElementById("memberInviteResult");
  if (!resultEl) return;
  var code = _lastGeneratedInvite.code;
  var inviteLink = _lastGeneratedInvite.link;
  var isComm = isFounderRole(currentProfile);
  var newLeft = isComm ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  var countEl = document.getElementById("inviteCountDisplay");
  if (countEl) countEl.textContent = "Invites remaining: " + newLeft;
  resultEl.innerHTML = '<div class="invite-code">'
    + '<div class="code">' + code + '</div>'
    + '<div style="margin:10px 0 6px"><input type="text" readonly value="' + inviteLink + '" id="inviteLinkField" style="width:100%;font-size:10px;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);text-align:center;font-family:monospace" onclick="this.select()"></div>'
    + '<button class="btn full outline" onclick="copyInviteLink()" style="font-size:11px;padding:10px;margin-top:4px" id="copyInviteBtn">Copy invite link</button>'
    + '<div class="hint" style="margin-top:8px">Send this link, the code auto-fills when they open it</div>'
    + '</div>';
}

function copyInviteLink() {
  var field = document.getElementById("inviteLinkField");
  if (!field) return;
  field.select();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(field.value).then(function() {
      var btn = document.getElementById("copyInviteBtn");
      if (btn) { btn.textContent = "Copied!"; setTimeout(function(){ btn.textContent = "Copy invite link"; }, 2000); }
    }).catch(function() { document.execCommand("copy"); Router.toast("Copied!"); });
  } else {
    document.execCommand("copy");
    Router.toast("Copied!");
  }
}

function submitAddMember() {
  var name = document.getElementById("add-name").value;
  if (!name) { Router.toast("Enter a name"); return; }
  var referral = document.getElementById("add-referral").value;
  var range = document.getElementById("add-range").value;
  var handicap = document.getElementById("add-handicap").value;
  var result = PB.addPlayer(name, referral);
  if (result) {
    var updates = {};
    if (range) updates.range = range;
    if (handicap) updates.manualHandicap = parseFloat(handicap);
    if (Object.keys(updates).length) PB.updatePlayer(result.id, updates);
    syncMember(result);
    Router.toast(name + " added to the Parbaughs!");
    Router.go("members", { edit: result.id });
  } else {
    Router.toast("Member already exists");
  }
}

/* Helpers */
// statBox and formField moved to src/core/utils.js (shared across pages)

function showCourseSearch(input, type) {
  var results = PB.searchCourses(input.value);
  var container = document.getElementById("search-" + type);
  if (!container || !results.length) { if (container) container.innerHTML = ""; return; }
  var targetMap = {"home":"edit-homecourse","fav":"edit-favcourse","add-home":"add-homecourse","add-fav":"add-favcourse"};
  var targetId = targetMap[type] || input.id;
  var h = '';
  results.forEach(function(c) {
    h += '<div class="search-item" onclick="document.getElementById(\'' + targetId + '\').value=\'' + c.name.replace(/'/g, "\\'") + '\';document.getElementById(\'search-' + type + '\').innerHTML=\'\'">' + c.name + ' <span style="color:var(--muted);font-size:11px">' + c.loc + ' · ' + c.rating + '/' + c.slope + '</span></div>';
  });
  container.innerHTML = h;
}

// toggleSection moved to src/core/utils.js (shared across pages)

function selectStockAvatar(pid, src) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own avatar"); return; }
  PB.updatePlayer(pid, { stockAvatar: src, photo: "" });
  // Clear custom photo from cache so stock avatar shows
  delete photoCache["member:" + pid];
  if (currentProfile && currentProfile.claimedFrom) {
    delete photoCache["member:" + currentProfile.claimedFrom];
    PB.updatePlayer(currentProfile.claimedFrom, { stockAvatar: src, photo: "" });
  }
  if (currentUser) delete photoCache["member:" + currentUser.uid];
  // Delete the photo doc from Firestore (cleans up old upload)
  if (db && currentUser) {
    db.collection("photos").doc("member_" + currentUser.uid).delete().catch(function() {});
    db.collection("members").doc(currentUser.uid).update({
      stockAvatar: src,
      hasPhoto: false,
      updatedAt: fsTimestamp()
    }).catch(function() {});
  }
  Router.toast("Avatar updated");
  updateProfileBar();
  Router.go("members", { edit: pid });
}

function equipTitle(pid, titleName) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own title"); return; }
  PB.updatePlayer(pid, { equippedTitle: titleName });
  if (currentProfile && currentProfile.claimedFrom) PB.updatePlayer(currentProfile.claimedFrom, { equippedTitle: titleName });
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).update({ equippedTitle: titleName }).catch(function(){});
  }
  if (currentProfile) currentProfile.equippedTitle = titleName;
  Router.go("members", { id: pid });
}

function toggleBadge(pid, badgeId) {
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  if (!isOwn) { Router.toast("You can only change your own badges"); return; }
  var p = PB.getPlayer(pid);
  // Also check currentProfile and fbMemberCache
  if (!p && currentProfile && currentProfile.id === pid) p = currentProfile;
  if (!p && fbMemberCache[pid]) p = fbMemberCache[pid];
  if (!p) { Router.toast("Profile not found"); return; }
  
  var badges = (p.displayBadges || []).slice(); // copy
  var idx = badges.indexOf(badgeId);
  if (idx !== -1) {
    badges.splice(idx, 1);
  } else {
    if (badges.length >= 3) { Router.toast("Max 3 badges, remove one first"); return; }
    badges.push(badgeId);
  }
  
  // Update locally
  PB.updatePlayer(pid, { displayBadges: badges });
  if (p.claimedFrom) PB.updatePlayer(p.claimedFrom, { displayBadges: badges });
  
  // Update Firestore
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).update({ displayBadges: badges }).catch(function(){});
  }
  
  // Also update currentProfile in memory
  if (currentProfile && currentProfile.id === pid) currentProfile.displayBadges = badges;

  Router.go("members", { id: pid });
}

// ── Shareable Profile Card ──
function shareProfileCard(pid) {
  var p = PB.getPlayer(pid);
  if (!p) { Router.toast("Player not found"); return; }
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid));
  // v8.14.0 — Defense-in-depth abandoned filter (Gate 8a memory rule).
  var rounds = PB.getPlayerRounds(pid).filter(function(r){return r.status !== "abandoned";});
  var indiv = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"});
  var full18 = indiv.filter(function(r){return !r.holesPlayed||r.holesPlayed>=18});
  var hcap = PB.calcHandicap(rounds);
  var best = full18.length ? Math.min.apply(null, full18.map(function(r){return r.score})) : null;
  var avg = full18.length ? Math.round(full18.reduce(function(a,r){return a+r.score},0)/full18.length) : null;

  // Build HTML card for html2canvas
  var cardDiv = document.createElement("div");
  cardDiv.style.cssText = "width:400px;padding:32px;background:linear-gradient(135deg,#0e1118,#1a1f2c);border-radius:16px;font-family:Inter,sans-serif;color:#eae8e0;position:fixed;left:-9999px;top:0;z-index:9999";

  // Header
  var header = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  header += '<img src="watermark.jpg" style="width:32px;height:32px;border-radius:8px" onerror="this.style.display=\'none\'">';
  header += '<div><div style="font-family:var(--font-display);font-size:14px;font-weight:700;color:#c9a84c;letter-spacing:1px">PARBAUGHS</div>';
  header += '<div style="font-size:8px;color:#7a7e8a;letter-spacing:2px">GOLF LEAGUE PLATFORM</div></div></div>';

  // Player info
  var name = p.username || p.name;
  var title = p.equippedTitle || p.title || "";
  var info = '<div style="text-align:center;margin-bottom:20px">';
  info += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:#eae8e0">' + escHtml(name) + '</div>';
  if (title) info += '<div style="font-size:11px;color:#c9a84c;margin-top:4px;font-style:italic">' + escHtml(title) + '</div>';
  info += '<div style="font-size:10px;color:#7a7e8a;margin-top:6px">Level ' + (lvl.level||1) + ' \u00b7 ' + (lvl.name||"Rookie") + '</div>';
  info += '</div>';

  // Stats grid
  var stats = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#c9a84c">' + (hcap !== null ? hcap : "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Handicap</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + (best || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Best</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + (avg || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Average</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#eae8e0">' + indiv.length + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Rounds</div></div>';
  stats += '</div>';

  // Footer
  var footer = '<div style="text-align:center;padding-top:12px;border-top:1px solid #1e2333;font-size:9px;color:#484d5c">parbaughs.golf/player/' + escHtml(p.username || "") + '</div>';

  cardDiv.innerHTML = header + info + stats + footer;
  document.body.appendChild(cardDiv);

  if (typeof html2canvas !== "undefined") {
    html2canvas(cardDiv, { backgroundColor: null, scale: 2 }).then(function(canvas) {
      document.body.removeChild(cardDiv);
      canvas.toBlob(function(blob) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], "parbaughs-profile.png", { type: "image/png" })] })) {
          navigator.share({ files: [new File([blob], "parbaughs-profile.png", { type: "image/png" })], title: name + " on Parbaughs" }).catch(function(){});
        } else {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "parbaughs-profile-" + (p.username || "player") + ".png";
          a.click();
          Router.toast("Profile card downloaded!");
        }
      }, "image/png");
    }).catch(function() { document.body.removeChild(cardDiv); Router.toast("Could not generate card"); });
  } else {
    document.body.removeChild(cardDiv);
    Router.toast("Share card generation not available");
  }
}

// ════════════════════════════════════════════════════════════════════════
// v8.14.4 — Trend chart time-range toggle (P17 pattern)
// ════════════════════════════════════════════════════════════════════════
// Three trend charts on Members profile (Scoring/GIR/Putts) each have a
// 30D / SEASON / ANNUAL toggle. Toggle state persists in localStorage via
// PB.getChartRange/setChartRange (device-scoped per Q-RULING-B). Click
// surgically re-renders only the affected chart container — preserves
// scroll position and other section state.
//
// Handicap chart toggle deferred to separate ship per Q-RULING-A — the
// handicap data shape (monthly aggregation) doesn't fit naive filter-
// before-compute semantics. See POST_SHIP_4A_BACKLOG.md.
// ════════════════════════════════════════════════════════════════════════

// Render the toggle pill row above a chart. Stashes pid on the toggle root
// so the click handler can re-fetch rounds on toggle change.
function _renderChartRangeToggle(chartId, currentRange, pid) {
  var ranges = ['30D', 'SEASON', 'ANNUAL'];
  var labels = { '30D': '30D', 'SEASON': 'SEASON', 'ANNUAL': 'ANNUAL' };
  var html = '<div class="chart-range-toggle" data-chart-id="' + chartId + '" data-pid="' + escHtml(pid || '') + '">';
  ranges.forEach(function(r) {
    var activeClass = (r === currentRange) ? ' chart-range-pill--active' : '';
    html += '<button class="chart-range-pill' + activeClass + '" data-range="' + r + '" type="button">' + labels[r] + '</button>';
  });
  html += '</div>';
  return html;
}

// Surgical re-render of a single chart container. Preserves scroll position,
// other chart toggle states, and section accordion state. Updates toggle pill
// active class + replaces .chart-container innerHTML with new SVG.
function _rerenderTrendChart(chartId, pid) {
  var newRange = PB.getChartRange(chartId, '30D');
  var rounds = PB.getPlayerRounds(pid).filter(function(r){return r.status !== "abandoned";});
  // Update toggle pill active state for the targeted chart only.
  var toggle = document.querySelector('.chart-range-toggle[data-chart-id="' + chartId + '"]');
  if (toggle) {
    var pills = toggle.querySelectorAll('.chart-range-pill');
    pills.forEach(function(p) {
      if (p.dataset.range === newRange) p.classList.add('chart-range-pill--active');
      else p.classList.remove('chart-range-pill--active');
    });
  }
  // Re-render the chart SVG (or empty-state) in the container.
  var container = document.querySelector('.chart-container[data-chart-id="' + chartId + '"]');
  if (!container) return;
  var filtered = PB.filterRoundsByRange(rounds, newRange);
  var html = '';
  if (chartId === 'scoring_trend') {
    var trends = calcScoringTrends(filtered);
    if (trends && trends.rolling5.length >= 3) {
      html = svgLineChart(trends.rolling5, {width:310, height:120, color:'var(--gold)'});
    } else {
      html = '<div class="pf-empty"><div class="pf-empty__h">Not enough rounds in this range</div><div class="pf-empty__b">Widen the window and the trend draws itself.</div></div>';
    }
  } else if (chartId === 'gir_trend') {
    var statTr = calcStatTrends(filtered);
    if (statTr && statTr.gir.length >= 3) {
      html = svgLineChart(statTr.gir, {width:310, height:100, color:'var(--gold)', yMin:0, yMax:100});
    } else {
      html = '<div class="pf-empty"><div class="pf-empty__h">Not enough rounds in this range</div><div class="pf-empty__b">Widen the window and the trend draws itself.</div></div>';
    }
  } else if (chartId === 'putts_trend') {
    var statTrP = calcStatTrends(filtered);
    if (statTrP && statTrP.putts.length >= 3) {
      html = svgLineChart(statTrP.putts, {width:310, height:100, color:'var(--pink)'});
    } else {
      html = '<div class="pf-empty"><div class="pf-empty__h">Not enough rounds in this range</div><div class="pf-empty__b">Widen the window and the trend draws itself.</div></div>';
    }
  } else if (chartId === 'handicap_home') {
    // v8.14.5 — Home handicap trend chart rerender. Different data shape than
    // the 3 Members profile trend charts: per-round-date handicap series
    // (PB.calcHandicap(roundsUpToDate) per round), not calc helper output.
    // Render via shared helper from home.js (_renderHandicapTrendSeries).
    if (typeof _renderHandicapTrendSeries === "function") {
      html = _renderHandicapTrendSeries(filtered, rounds, 600);
    } else {
      html = '<div style="padding:24px 8px;text-align:center;font-size:11px;color:var(--muted)">Chart unavailable.</div>';
    }
  }
  container.innerHTML = html;
}

// Delegated click handler — registered ONCE at script load time. Listens
// for clicks on any .chart-range-pill across the app; re-renders the
// associated chart on toggle change. Idempotent against repeated attaches
// via the _pbChartRangeListenerAttached flag.
if (typeof window !== "undefined" && !window._pbChartRangeListenerAttached) {
  window._pbChartRangeListenerAttached = true;
  document.addEventListener('click', function(e) {
    var pill = e.target.closest && e.target.closest('.chart-range-pill');
    if (!pill) return;
    var toggle = pill.closest('.chart-range-toggle');
    if (!toggle) return;
    var chartId = toggle.dataset.chartId;
    var pid = toggle.dataset.pid;
    var newRange = pill.dataset.range;
    if (!chartId || !newRange) return;
    if (typeof PB === "undefined" || !PB.setChartRange) return;
    PB.setChartRange(chartId, newRange);
    _rerenderTrendChart(chartId, pid);
  });
}

