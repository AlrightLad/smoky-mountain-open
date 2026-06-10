/* ================================================
   PAGE: LEAGUES — Create, join, switch, manage leagues
   v6.0.0: Multi-league architecture
   v8.23.76: Editorial redesign → CLUBHOUSE_SPEC-HQ-3j (W1.S13).
     - renderLeagueList → 3j.2 My Leagues editorial card grid (N≥1) /
       3j.1.D Lone Wolf takeover (N===0).
     - renderLeagueDetail → 3j.1.A/B League page: masthead + hero stat-strip
       + invite + roster + requests + settings + danger, two-column hq-grid.
     - renderCreateLeague / renderJoinLeague → editorial forms.
     All mutation handlers below the renderers are unchanged.
     Deferred (need reusable components not yet extracted): 3j.3 scope-switcher
     dropdown (global masthead chrome — scope-switch still works via cards +
     Switch button); Standings table (W2.S2 Leaderboard component), embedded
     Activity feed (3k), and Trophies grid (3p) sections — these reuse
     components that are not yet standalone. Hero season/handicap aggregates
     omitted to stay P9-truthful (no league-scoped round loading here yet).
   ================================================ */

Router.register("leagues", function(params) {
  if (params && params.create) { renderCreateLeague(); return; }
  if (params && params.join) { renderJoinLeague(); return; }
  if (params && params.id) { renderLeagueDetail(params.id); return; }
  renderLeagueList();
});

// Pull a 4-digit year out of a founded date string ("2026-05-30" → "2026").
function _foundedYear(founded) {
  if (!founded) return null;
  var m = String(founded).match(/(\d{4})/);
  return m ? m[1] : null;
}

// Reduced-motion-aware smooth scroll for section anchors (spec §3j.4).
function _leagueScrollTo(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
}

// ── 3j.2 — My Leagues (N≥1) OR 3j.1.D Lone Wolf (N===0) ──
function renderLeagueList() {
  var myLeagues = currentProfile && currentProfile.leagues ? currentProfile.leagues : ["the-parbaughs"];
  var activeLeague = getActiveLeague();

  if (!myLeagues.length) { renderLoneWolf(); return; }

  var n = myLeagues.length;
  var h = '<div class="league-wrap league-wrap--wide">';
  h += '<button type="button" class="roster-skip" onclick="var el=document.getElementById(\'leagueCards\');if(el){el.scrollIntoView();}">Skip to leagues</button>';
  h += '<div class="roster-masthead">';
  h += '<div class="roster-eyebrow">YOUR LEAGUES · ' + n + ' ACTIVE</div>';
  h += '<h1 class="roster-headline">My leagues.</h1>';
  h += '</div>';

  h += '<div id="leagueCards" class="league-grid" role="list"><div class="league-empty">Loading your leagues…</div></div>';

  h += '<div class="league-actions">';
  h += '<button class="league-btn league-btn--brass" onclick="Router.go(\'leagues\',{create:true})">+ Create a league</button>';
  h += '<button class="league-btn league-btn--ghost" onclick="Router.go(\'leagues\',{join:true})">Join a league</button>';
  h += '</div>';

  h += '<div class="league-discover"><div class="league-section__eyebrow">DISCOVER</div>';
  h += '<div class="league-section__title" style="margin-bottom:14px">Public leagues</div>';
  h += '<div id="publicLeagues"><div class="league-empty">Loading public leagues…</div></div></div>';

  h += '</div>';
  h += renderPageFooter();
  document.querySelector('[data-page="leagues"]').innerHTML = h;

  _loadMyLeagueCards(myLeagues, activeLeague);
  _loadPublicLeagues(myLeagues);
}

// One My-Leagues card. Active scope gets the 4px brass top border + aria-current.
function _leagueCardHtml(lid, l, activeLeague) {
  var isActive = lid === activeLeague;
  var uid = currentUser ? currentUser.uid : null;
  var role = (uid && l.commissioner === uid) ? "Commissioner" : "Member";
  var roleCls = role === "Commissioner" ? "league-card__role--comm" : "league-card__role--member";
  var founded = _foundedYear(l.founded);
  var access = l.visibility === "public" ? "Public" : "Private";
  var go = "Router.go('leagues',{id:'" + lid + "'})";
  var h = '<a class="league-card' + (isActive ? ' league-card--active' : '') + '" tabindex="0" role="listitem"' + (isActive ? ' aria-current="page"' : '') + ' onclick="' + go + '" onkeydown="if(event.key===\'Enter\'){' + go + '}">';
  h += '<div class="league-card__head"><div class="league-card__name">' + escHtml(l.name) + '</div>';
  h += '<span class="league-card__role ' + roleCls + '">' + role + '</span></div>';
  h += '<div class="league-card__stats">';
  h += '<div><div class="league-card__stat-val">' + (l.memberCount || 0) + '</div><div class="league-card__stat-lbl">Members</div></div>';
  h += '<div><div class="league-card__stat-val">' + (founded || '—') + '</div><div class="league-card__stat-lbl">Founded</div></div>';
  h += '<div><div class="league-card__stat-val" style="font-size:15px;font-style:italic;font-family:var(--font-display)">' + access + '</div><div class="league-card__stat-lbl">Access</div></div>';
  h += '</div>';
  h += '<div class="league-card__foot">';
  if (isActive) h += '<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--cb-brass)">● Active scope</span>';
  else h += '<span class="league-row__meta">' + escHtml(l.location || '') + '</span>';
  h += '<span class="league-card__open">Open →</span>';
  h += '</div></a>';
  return h;
}

function _loadMyLeagueCards(myLeagues, activeLeague) {
  if (!db || !myLeagues.length) return;
  var cards = {};
  var loaded = 0;
  myLeagues.forEach(function(lid) {
    db.collection("leagues").doc(lid).get().then(function(doc) {
      loaded++;
      if (doc.exists) cards[lid] = _leagueCardHtml(lid, doc.data(), activeLeague);
      if (loaded === myLeagues.length) _flushLeagueCards(myLeagues, cards);
    }).catch(function() { loaded++; if (loaded === myLeagues.length) _flushLeagueCards(myLeagues, cards); });
  });
}

function _flushLeagueCards(order, cards) {
  var el = document.getElementById("leagueCards");
  if (!el) return;
  var h = '';
  order.forEach(function(lid) { if (cards[lid]) h += cards[lid]; });
  el.innerHTML = h || '<div class="league-empty">No league data found.</div>';
}

// Public-league discovery grid. Shared by My Leagues + Lone Wolf surfaces.
function _loadPublicLeagues(myLeagues) {
  if (!db) return;
  db.collection("leagues").where("visibility", "==", "public").limit(10).get().then(function(snap) {
    var el = document.getElementById("publicLeagues");
    if (!el) return;
    if (snap.empty) { el.innerHTML = '<div class="league-empty">No public leagues yet. Start the first one.</div>'; return; }
    var ph = '<div class="league-grid">';
    snap.forEach(function(doc) {
      var l = doc.data();
      var lid = doc.id;
      var already = myLeagues.indexOf(lid) !== -1;
      ph += '<div class="league-card" style="cursor:default">';
      ph += '<div class="league-card__head"><div class="league-card__name">' + escHtml(l.name) + '</div></div>';
      ph += '<div class="league-row__meta" style="margin-bottom:14px">' + escHtml(l.location || 'Location not set') + ' · ' + (l.memberCount || 0) + ' members</div>';
      ph += '<div class="league-card__foot" style="border-top:0;padding-top:0">';
      if (already) ph += '<span class="league-row__meta">Joined</span><span></span>';
      else ph += '<span></span><button class="league-btn league-btn--ghost league-btn--sm" onclick="requestJoinLeague(\'' + lid + '\')">Request to join</button>';
      ph += '</div></div>';
    });
    ph += '</div>';
    el.innerHTML = ph;
  }).catch(function() {
    var el = document.getElementById("publicLeagues");
    if (el) el.innerHTML = renderLoadError("public leagues", "_loadPublicLeagues([])");
  });
}

// ── 3j.1.D — Lone Wolf takeover (member belongs to 0 leagues) ──
function renderLoneWolf() {
  var card = function(svg, title, body, cta, onclick) {
    return '<div class="lonewolf-card" tabindex="0" role="listitem" onclick="' + onclick + '" onkeydown="if(event.key===\'Enter\'){' + onclick + '}">' +
      '<div class="lonewolf-card__icon">' + svg + '</div>' +
      '<div class="lonewolf-card__title">' + title + '</div>' +
      '<div class="lonewolf-card__body">' + body + '</div>' +
      '<div class="lonewolf-card__cta">' + cta + '</div></div>';
  };
  var icoCreate = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
  var icoJoin = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/></svg>';
  var icoBrowse = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

  var h = '<div class="league-wrap league-wrap--wide">';
  h += '<div class="roster-masthead"><div class="roster-eyebrow">LONE WOLF</div><h1 class="roster-headline">Find your league.</h1></div>';
  h += '<p style="font-family:var(--font-display);font-style:italic;font-size:18px;line-height:1.5;color:var(--cb-mute);margin:0 0 24px;max-width:60ch">Three ways in. Start your own crew, accept an invite, or scout the public clubhouses already underway.</p>';
  h += '<div class="lonewolf-grid" role="list">';
  h += card(icoCreate, 'Create your league', 'Commission a new league, set the season, and invite your foursome. You run the show.', 'Continue →', "Router.go('leagues',{create:true})");
  h += card(icoJoin, 'Join a league', 'Have an invite code from a commissioner? Drop it in and you are on the tee sheet.', 'Continue →', "Router.go('leagues',{join:true})");
  h += card(icoBrowse, 'Browse public leagues', 'Scout open clubhouses, follow the action, and request a spot in one that fits.', 'Continue →', "_leagueScrollTo('publicLeagues')");
  h += '</div>';

  h += '<div class="league-discover"><div class="league-section__eyebrow">OPEN CLUBHOUSES</div>';
  h += '<div class="league-section__title" style="margin-bottom:14px">Public leagues</div>';
  h += '<div id="publicLeagues"><div class="league-empty">Loading public leagues…</div></div></div>';
  h += '</div>';
  h += renderPageFooter();
  document.querySelector('[data-page="leagues"]').innerHTML = h;
  _loadPublicLeagues([]);
}

function renderCreateLeague() {
  var h = '<div class="league-wrap">';
  h += '<button class="back" onclick="Router.back(\'leagues\')" style="margin:8px 0">← Back</button>';
  h += '<div class="roster-masthead"><div class="roster-eyebrow">NEW LEAGUE</div><h1 class="roster-headline">Start a league.</h1></div>';
  h += '<p style="font-family:var(--font-display);font-style:italic;font-size:16px;line-height:1.5;color:var(--cb-mute);margin:0 0 22px">You will be the commissioner: you set the season, the rules, and the roster.</p>';
  h += '<div class="ff"><label class="ff-label">League name</label><input class="ff-input" id="cl-name" placeholder="e.g. Weekend Warriors"></div>';
  h += '<div class="ff"><label class="ff-label">Location</label><input class="ff-input" id="cl-location" placeholder="e.g. York, PA"></div>';
  h += '<div class="ff"><label class="ff-label">Description</label><textarea class="ff-input" id="cl-desc" rows="3" placeholder="What makes your crew special?"></textarea></div>';
  h += '<div class="ff"><label class="ff-label">Visibility</label><select class="ff-input" id="cl-visibility">';
  h += '<option value="private">Private (invite-only)</option>';
  h += '<option value="public">Public (discoverable)</option>';
  h += '</select></div>';
  h += '<button class="league-btn league-btn--brass" style="width:100%;margin-top:14px" onclick="submitCreateLeague()">Create league</button>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.5px;color:var(--cb-mute);text-align:center;margin-top:10px">You will be the commissioner of this league.</div>';
  h += '</div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;
}

function submitCreateLeague() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var name = (document.getElementById("cl-name") || {}).value || "";
  var location = (document.getElementById("cl-location") || {}).value || "";
  var desc = (document.getElementById("cl-desc") || {}).value || "";
  var visibility = (document.getElementById("cl-visibility") || {}).value || "private";
  if (!name.trim() || name.trim().length < 3) { Router.toast("League name must be 3+ characters"); return; }

  var slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  var inviteCode = "LG-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  var uid = currentUser.uid;

  var leagueData = {
    name: name.trim(),
    slug: slug,
    location: location.trim(),
    description: desc.trim(),
    founded: localDateStr(),
    badge: "",
    tier: "crew",
    visibility: visibility,
    commissioner: uid,
    admins: [uid],
    memberCount: 1,
    memberUids: [uid],
    inviteCode: inviteCode,
    theme: "classic",
    createdAt: fsTimestamp(),
    settings: { seasons: true, parcoins: true, wagers: true, bounties: true, trashTalk: true }
  };

  db.collection("leagues").doc(slug).set(leagueData).then(function() {
    // Add league to member's leagues array
    db.collection("members").doc(uid).update({
      leagues: firebase.firestore.FieldValue.arrayUnion(slug),
      activeLeague: slug
    }).then(function() {
      if (currentProfile) {
        if (!currentProfile.leagues) currentProfile.leagues = [];
        currentProfile.leagues.push(slug);
        currentProfile.activeLeague = slug;
      }
      Router.toast("League created! Invite code: " + inviteCode);
      Router.go("leagues", { id: slug });
    });
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't create the league.")); });
}

function renderJoinLeague() {
  var h = '<div class="league-wrap">';
  h += '<button class="back" onclick="Router.back(\'leagues\')" style="margin:8px 0">← Back</button>';
  h += '<div class="roster-masthead"><div class="roster-eyebrow">JOIN</div><h1 class="roster-headline">Join a league.</h1></div>';
  h += '<p style="font-family:var(--font-display);font-style:italic;font-size:16px;line-height:1.5;color:var(--cb-mute);margin:0 0 22px">Enter the invite code your commissioner shared, or browse public leagues from the directory.</p>';
  h += '<div class="ff"><label class="ff-label">Invite code</label><input class="ff-input" id="jl-code" placeholder="LG-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px;text-align:center;font-family:var(--font-mono)"></div>';
  h += '<button class="league-btn league-btn--brass" style="width:100%;margin-top:14px" onclick="submitJoinLeague()">Join league</button>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.5px;color:var(--cb-mute);text-align:center;margin-top:10px">Ask the league commissioner for an invite code.</div>';
  h += '</div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;
}

function submitJoinLeague() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var code = (document.getElementById("jl-code") || {}).value.trim().toUpperCase();
  if (!code) { Router.toast("Enter an invite code"); return; }

  // Find league by invite code
  db.collection("leagues").where("inviteCode", "==", code).limit(1).get().then(function(snap) {
    if (snap.empty) { Router.toast("Invalid invite code"); return; }
    var doc = snap.docs[0];
    var league = doc.data();
    var lid = doc.id;
    var uid = currentUser.uid;

    // Check if already a member
    if (league.memberUids && league.memberUids.indexOf(uid) !== -1) {
      Router.toast("You're already in " + league.name);
      Router.go("leagues");
      return;
    }

    // Join the league
    db.collection("leagues").doc(lid).update({
      memberUids: firebase.firestore.FieldValue.arrayUnion(uid),
      memberCount: firebase.firestore.FieldValue.increment(1)
    });
    db.collection("members").doc(uid).update({
      leagues: firebase.firestore.FieldValue.arrayUnion(lid),
      activeLeague: lid
    });
    if (currentProfile) {
      if (!currentProfile.leagues) currentProfile.leagues = [];
      currentProfile.leagues.push(lid);
      currentProfile.activeLeague = lid;
    }
    Router.toast("Joined " + league.name + "!");
    Router.go("leagues");
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't join the league.")); });
}

// ── 3j.1.A/B — League page (single league context) ──
function renderLeagueDetail(lid) {
  var h = '<div class="league-wrap league-wrap--wide">';
  h += '<button class="back" onclick="Router.back(\'leagues\')" style="margin:8px 0">← Back</button>';
  h += '<div id="leagueDetail"><div class="league-empty">Loading…</div></div></div>';
  document.querySelector('[data-page="leagues"]').innerHTML = h;

  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) { Router.toast("League not found"); Router.go("leagues"); return; }
    var l = doc.data();
    var el = document.getElementById("leagueDetail");
    if (!el) return;
    var uid = currentUser ? currentUser.uid : null;
    var isComm = uid && l.commissioner === uid;
    var isAdmin = uid && l.admins && l.admins.indexOf(uid) !== -1;
    var isActive = currentProfile && currentProfile.activeLeague === lid;
    var founded = _foundedYear(l.founded);
    var access = l.visibility === "public" ? "Public" : "Private";
    var loc = (l.location || '').trim();

    var dh = '<div class="hq-grid"><div class="hq-grid__main">';

    // ── Masthead (3j.1.A.2) ──
    var eyebrow = 'LEAGUE' + (loc ? ' · ' + escHtml(loc.toUpperCase()) : '') + (founded ? ' · FOUNDED ' + founded : '');
    dh += '<div class="roster-masthead"><div class="league-masthead__row"><div>';
    dh += '<div class="roster-eyebrow">' + eyebrow + '</div>';
    dh += '<h1 class="roster-headline">' + escHtml(l.name) + '.</h1>';
    dh += '</div>';
    if (isComm) dh += '<a class="league-settings-pill" role="button" aria-label="League settings (Commissioner only)" onclick="_leagueScrollTo(\'leagueSettings\')">Settings →</a>';
    dh += '</div>';
    var deck = (l.memberCount || 0) + (l.memberCount === 1 ? ' member' : ' members') + ' · ' + access + ' league' + (founded ? ' · Founded ' + founded : '');
    dh += '<p style="font-family:var(--font-display);font-style:italic;font-size:18px;line-height:1.45;color:var(--cb-mute);margin:10px 0 0">' + escHtml(l.description ? l.description : deck) + '</p>';
    dh += '</div>';

    // ── Section A — Hero stat-strip (3j.1.A.4) ──
    dh += '<div class="league-hero" role="region" aria-label="' + escHtml(l.name) + ' overview">';
    var comm = PB.getPlayer(l.commissioner);
    dh += '<div class="league-hero__comm">';
    dh += renderAvatar(comm || { name: l.commissionerName || '?', id: l.commissioner }, 36, false);
    dh += '<div><div class="league-hero__comm-name">' + escHtml(comm ? (comm.name || comm.username) : (l.commissionerName || 'Commissioner')) + '</div>';
    dh += '<div class="league-hero__comm-role">Commissioner</div></div>';
    if (l.badge === "founding") dh += '<span class="league-hero__badge">Founding League</span>';
    dh += '</div>';
    dh += '<div class="league-hero__strip">';
    dh += '<div class="league-stat"><div class="league-stat__label">Members</div><div class="league-stat__value">' + (l.memberCount || 0) + '</div></div>';
    dh += '<div class="league-stat"><div class="league-stat__label">Founded</div><div class="league-stat__value">' + (founded || '—') + '</div></div>';
    dh += '<div class="league-stat"><div class="league-stat__label">Access</div><div class="league-stat__value league-stat__value--sm">' + access + '</div></div>';
    dh += '</div></div>';

    // ── Invite code ──
    dh += '<div class="league-section"><div class="league-section__head"><div><div class="league-section__eyebrow">INVITE</div><div class="league-section__title">Invite code</div></div></div>';
    dh += '<div class="league-invite"><div class="league-invite__code">' + escHtml(l.inviteCode || "—") + '</div>';
    dh += '<div class="league-invite__hint">Share this code with friends to invite them.</div></div></div>';

    // ── Commissioner / Admin sections ──
    if (isComm || isAdmin) {
      dh += '<div class="league-section"><div class="league-section__head"><div><div class="league-section__eyebrow">ROSTER</div><div class="league-section__title">Members</div></div>';
      dh += '<div class="league-section__meta">' + (l.memberCount || 0) + (l.memberCount === 1 ? ' member' : ' members') + '</div></div>';
      dh += '<div id="leagueMemberList"><div class="league-empty">Loading roster…</div></div></div>';

      dh += '<div class="league-section"><div class="league-section__head"><div><div class="league-section__eyebrow">REQUESTS</div><div class="league-section__title">Join requests</div></div></div>';
      dh += '<div id="leagueJoinRequests"><div class="league-empty">Loading…</div></div></div>';

      if (isComm) {
        dh += '<div class="league-section" id="leagueSettings"><div class="league-section__head"><div><div class="league-section__eyebrow">ADMIN</div><div class="league-section__title">League settings</div></div></div>';
        dh += '<div class="league-toggle"><span class="league-toggle__label">Visibility</span><button class="league-btn league-btn--ghost league-btn--sm" onclick="toggleLeagueVisibility(\'' + lid + '\')">' + access + '</button></div>';
        dh += '<div class="league-toggle"><span class="league-toggle__label">Require approval to join</span><button class="league-btn league-btn--ghost league-btn--sm" onclick="toggleLeagueApproval(\'' + lid + '\')">' + (l.requireApproval ? "On" : "Off") + '</button></div>';
        dh += '<div class="league-toggle"><span class="league-toggle__label">Invite code</span><button class="league-btn league-btn--ghost league-btn--sm" onclick="regenerateInviteCode(\'' + lid + '\')">Regenerate</button></div>';
        dh += '</div>';

        // ── Custom trophies (commissioner-composed, league-scoped) ──
        dh += '<div class="league-section" id="leagueTrophies"><div class="league-section__head"><div><div class="league-section__eyebrow">TROPHIES</div><div class="league-section__title">Custom trophies</div></div>';
        dh += '<button class="league-btn league-btn--ghost league-btn--sm" onclick="Router.go(\'trophycreate\',{from:\'leagues\',scope:\'league\'})">+ New</button></div>';
        dh += '<div id="leagueTrophyList"><div class="league-empty">Loading…</div></div></div>';

        if (l.badge !== "founding") {
          dh += '<div class="league-section"><div class="league-section__head"><div><div class="league-section__eyebrow" style="color:var(--cb-claret)">DANGER ZONE</div><div class="league-section__title">Delete league</div></div></div>';
          dh += '<div class="league-danger"><div class="league-danger__hint">Deleting removes this league from all members. Rounds are preserved.</div>';
          dh += '<button class="league-danger__btn" onclick="confirmDeleteLeague(\'' + lid + '\',\'' + escHtml(l.name).replace(/'/g, "\\\\'") + '\')">Delete ' + escHtml(l.name) + '</button></div></div>';
        }
      }
    }

    // ── Switch to this league ──
    if (!isActive) {
      dh += '<div style="margin:8px 0 24px"><button class="league-btn league-btn--brass" style="width:100%" onclick="switchLeague(\'' + lid + '\')">Switch to ' + escHtml(l.name) + '</button></div>';
    }

    dh += '</div>'; // hq-grid__main

    // ── Agate rail — About + pull quote ──
    dh += '<aside class="hq-grid__rail-right" aria-label="League notes">';
    if (l.description) {
      dh += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">About</div>';
      dh += '<p style="font-family:var(--font-display);font-style:italic;font-size:15.5px;line-height:1.5;color:var(--cb-ink);margin:0">' + escHtml(l.description) + '</p></div>';
    }
    dh += '<div class="hq-rail-module"><div class="hq-rail-module__eyebrow">Clubhouse</div>';
    dh += '<p style="font-family:var(--font-display);font-style:italic;font-size:17px;line-height:1.4;color:var(--cb-ink-soft);margin:8px 0 0">"Community over competition. Always."</p></div>';
    dh += '</aside>';

    dh += '</div>'; // hq-grid
    el.innerHTML = dh;

    // Async load members
    if (isComm || isAdmin) {
      _loadLeagueMembers(lid, l);
      _loadJoinRequests(lid);
    }
    if (isComm) _loadLeagueTrophies();
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't load the league.")); });
}

function switchLeague(lid) {
  if (!currentUser || !db) return;
  db.collection("members").doc(currentUser.uid).update({ activeLeague: lid }).then(function() {
    if (currentProfile) currentProfile.activeLeague = lid;
    Router.toast("Switching to " + lid + "...");
    // Tear down ALL league-scoped listeners
    if (window._chatFeedUnsub) { window._chatFeedUnsub(); window._chatFeedUnsub = null; }
    if (window._teeTimeUnsub) { window._teeTimeUnsub(); window._teeTimeUnsub = null; }
    if (window._rangeUnsub) { window._rangeUnsub(); window._rangeUnsub = null; }
    if (typeof _roundsListener !== "undefined" && _roundsListener) { _roundsListener(); _roundsListener = null; }
    if (typeof tripScoreListener !== "undefined" && tripScoreListener) { tripScoreListener(); tripScoreListener = null; }
    // Clear in-memory data from old league
    liveTeeTimes = [];
    liveRangeSessions = [];
    liveChat = [];
    // Reinitialize with new league context
    loadActiveLeagueName();
    syncTripsFromFirestore();
    loadRoundsFromFirestore();
    startRoundsListener();
    syncScrambleTeamsFromFirestore();
    if (typeof startTeeTimeListener === "function") startTeeTimeListener();
    if (typeof startRangeSessionListener === "function") startRangeSessionListener();
    Router.go("home");
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't switch leagues.")); });
}

// ── Commissioner custom-trophy management (league-scoped catalog) ──
function _loadLeagueTrophies() {
  var el = document.getElementById("leagueTrophyList");
  if (!el) return;
  if (typeof loadTrophyCatalog !== "function") { el.innerHTML = '<div class="league-empty">Trophies are unavailable right now.</div>'; return; }
  loadTrophyCatalog(function() {
    var box = document.getElementById("leagueTrophyList");
    if (!box) return;
    var defs = (typeof pbCachedTrophyDefs === "function" ? pbCachedTrophyDefs() : []).filter(function(d) { return d && d.scope === "league" && d.active !== false; });
    if (!defs.length) {
      box.innerHTML = '<div class="league-empty">No custom trophies yet. Compose one with + New and it appears in every member\'s trophy room, plus on the leaderboard once a leader emerges.</div>';
      return;
    }
    box.innerHTML = '<div class="adm-panel">' + defs.map(_leagueTrophyRow).join("") + '</div>';
  });
}
function _leagueTrophyRow(d) {
  var emblem = (typeof trophyEmblemSvg === "function") ? trophyEmblemSvg(d) : "";
  var summary = (typeof trophyCriteriaSummary === "function" && trophyCriteriaSummary(d)) || "";
  var sid = String(d.id || "").replace(/'/g, "\\'");
  return '<div class="adm-row">' +
    '<div class="adm-trophy-emblem">' + (emblem || "") + '</div>' +
    '<div class="adm-row__main">' +
      '<div class="adm-row__title">' + escHtml(d.name || "Untitled") + '</div>' +
      '<div class="adm-row__sub">' + escHtml(summary) + '</div>' +
      '<div class="adm-row__actions">' +
        '<button class="adm-btn adm-btn--xs" onclick="Router.go(\'trophycreate\',{from:\'leagues\',editId:\'' + sid + '\'})">Edit</button>' +
        '<button class="adm-btn adm-btn--claret adm-btn--xs" onclick="_leagueArchiveTrophy(\'' + sid + '\')">Archive</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function _leagueArchiveTrophy(id, _confirmed) {
  if (typeof archiveTrophyDef !== "function") return;
  // v8.24.15 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Archive this trophy?", message: "It stops appearing for members but is not deleted.", confirmLabel: "Archive", danger: false })
      .then(function(ok) { if (ok) _leagueArchiveTrophy(id, true); });
    return;
  }
  archiveTrophyDef(id, "league", function(ok, err) {
    if (ok) { Router.toast("Trophy archived"); _loadLeagueTrophies(); }
    else Router.toast(err || "Couldn't archive the trophy.");
  });
}

function requestJoinLeague(lid) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var uid = currentUser.uid;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "Someone";
  // Create a pending join request doc
  db.collection("leagues").doc(lid).collection("joinRequests").doc(uid).set({
    uid: uid,
    name: myName,
    handicap: currentProfile ? (currentProfile.computedHandicap || null) : null,
    level: currentProfile ? (currentProfile.level || 1) : 1,
    homeCourse: currentProfile ? (currentProfile.homeCourse || "") : "",
    createdAt: fsTimestamp(),
    status: "pending"
  }).then(function() {
    // Notify commissioner + admins
    db.collection("leagues").doc(lid).get().then(function(doc) {
      if (!doc.exists) return;
      var l = doc.data();
      var notifyUids = [l.commissioner].concat(l.admins || []);
      var seen = {};
      notifyUids.forEach(function(nuid) {
        if (seen[nuid]) return; seen[nuid] = true;
        sendNotification(nuid, { type:"league_request", title:"Join Request", message:myName + " wants to join " + l.name, page:"leagues" });
      });
    });
    Router.toast("Request sent! An admin will review it.");
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't send your join request.")); });
}

// ── League member management ──
function _loadLeagueMembers(lid, league) {
  var el = document.getElementById("leagueMemberList");
  if (!el || !league.memberUids) return;
  var mh = '';
  league.memberUids.forEach(function(uid) {
    var p = PB.getPlayer(uid);
    if (!p) return;
    var role = uid === league.commissioner ? "Commissioner" : (league.admins && league.admins.indexOf(uid) !== -1) ? "Admin" : "Member";
    var roleColor = role === "Commissioner" ? "var(--cb-brass)" : role === "Admin" ? "var(--cb-slate)" : "var(--cb-mute)";
    mh += '<div class="league-row">';
    mh += renderAvatar(p, 34, true);
    mh += '<div style="flex:1;min-width:0"><div class="league-row__name">' + escHtml(p.name || p.username) + '</div>';
    mh += '<div class="league-row__role" style="color:' + roleColor + '">' + role + '</div></div>';
    if (currentUser && league.commissioner === currentUser.uid && uid !== currentUser.uid) {
      var isAdmin = league.admins && league.admins.indexOf(uid) !== -1;
      mh += '<button class="league-btn league-btn--ghost league-btn--sm" onclick="toggleLeagueAdmin(\'' + lid + '\',\'' + uid + '\',' + isAdmin + ')">' + (isAdmin ? "Remove admin" : "Make admin") + '</button>';
    }
    mh += '</div>';
  });
  el.innerHTML = mh || '<div class="league-empty">Just you so far.</div>';
}

function _loadJoinRequests(lid) {
  var el = document.getElementById("leagueJoinRequests");
  if (!el || !db) return;
  db.collection("leagues").doc(lid).collection("joinRequests").where("status","==","pending").get().then(function(snap) {
    if (snap.empty) { el.innerHTML = '<div class="league-empty">No pending requests.</div>'; return; }
    var rh = '';
    snap.forEach(function(doc) {
      var req = doc.data();
      var reqPlayer = PB.getPlayer(req.uid);
      rh += '<div class="league-row">';
      rh += renderAvatar(reqPlayer || { name: req.name, id: req.uid }, 36, false);
      rh += '<div style="flex:1;min-width:0"><div class="league-row__name">' + escHtml(req.name) + '</div>';
      var meta = [];
      if (req.handicap) meta.push("Hcp " + req.handicap);
      if (req.homeCourse) meta.push(req.homeCourse);
      rh += '<div class="league-row__meta">' + escHtml(meta.join(" · ") || "Level " + (req.level||1)) + '</div></div>';
      rh += '<div style="display:flex;gap:6px;flex-shrink:0">';
      rh += '<button class="league-btn league-btn--brass league-btn--sm" onclick="approveJoinRequest(\'' + lid + '\',\'' + req.uid + '\')">Approve</button>';
      rh += '<button class="league-btn league-btn--sm" style="border-color:rgba(var(--cb-claret-rgb),.3);background:rgba(var(--cb-claret-rgb),.08);color:var(--cb-claret)" onclick="denyJoinRequest(\'' + lid + '\',\'' + req.uid + '\')">Deny</button>';
      rh += '</div></div>';
    });
    el.innerHTML = rh;
  }).catch(function() { el.innerHTML = renderLoadError("join requests", "_loadJoinRequests('" + lid + "')"); });
}

function approveJoinRequest(lid, reqUid) {
  if (!db) return;
  // Add member to league
  db.collection("leagues").doc(lid).update({
    memberUids: firebase.firestore.FieldValue.arrayUnion(reqUid),
    memberCount: firebase.firestore.FieldValue.increment(1)
  });
  db.collection("members").doc(reqUid).update({
    leagues: firebase.firestore.FieldValue.arrayUnion(lid)
  });
  // Update request status
  db.collection("leagues").doc(lid).collection("joinRequests").doc(reqUid).update({ status: "approved" });
  // Notify the requester
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (doc.exists) sendNotification(reqUid, { type:"league_approved", title:"Welcome!", message:"You've been approved to join " + doc.data().name + "!", page:"leagues" });
  });
  Router.toast("Member approved!");
  Router.go("leagues", { id: lid });
}

function denyJoinRequest(lid, reqUid) {
  if (!db) return;
  db.collection("leagues").doc(lid).collection("joinRequests").doc(reqUid).update({ status: "denied" });
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (doc.exists) sendNotification(reqUid, { type:"league_denied", title:"Request Update", message:"Your request to join " + doc.data().name + " was not approved.", page:"leagues" });
  });
  Router.toast("Request denied");
  Router.go("leagues", { id: lid });
}

function toggleLeagueAdmin(lid, uid, isCurrentlyAdmin) {
  if (!db || !currentUser) return;
  var update = isCurrentlyAdmin
    ? { admins: firebase.firestore.FieldValue.arrayRemove(uid) }
    : { admins: firebase.firestore.FieldValue.arrayUnion(uid) };
  db.collection("leagues").doc(lid).update(update).then(function() {
    Router.toast(isCurrentlyAdmin ? "Admin removed" : "Admin added");
    Router.go("leagues", { id: lid });
  });
}

function toggleLeagueVisibility(lid) {
  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var newVis = doc.data().visibility === "public" ? "private" : "public";
    db.collection("leagues").doc(lid).update({ visibility: newVis }).then(function() {
      Router.toast("League is now " + newVis);
      Router.go("leagues", { id: lid });
    });
  });
}

function toggleLeagueApproval(lid) {
  if (!db) return;
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var newVal = !doc.data().requireApproval;
    db.collection("leagues").doc(lid).update({ requireApproval: newVal }).then(function() {
      Router.toast("Approval " + (newVal ? "required" : "not required"));
      Router.go("leagues", { id: lid });
    });
  });
}

function regenerateInviteCode(lid) {
  if (!db) return;
  var newCode = "LG-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  db.collection("leagues").doc(lid).update({ inviteCode: newCode }).then(function() {
    Router.toast("New invite code: " + newCode);
    Router.go("leagues", { id: lid });
  });
}

function confirmDeleteLeague(lid, leagueName) {
  var typed = prompt("Type the league name to confirm deletion: \"" + leagueName + "\"");
  if (typed !== leagueName) { Router.toast("Names don't match, deletion cancelled"); return; }
  if (!db || !currentUser) return;
  // Remove league from all members
  db.collection("leagues").doc(lid).get().then(function(doc) {
    if (!doc.exists) return;
    var l = doc.data();
    if (l.badge === "founding") { Router.toast("Cannot delete the founding league"); return; }
    if (l.commissioner !== currentUser.uid) { Router.toast("Only commissioner can delete"); return; }
    var promises = (l.memberUids || []).map(function(uid) {
      return db.collection("members").doc(uid).update({
        leagues: firebase.firestore.FieldValue.arrayRemove(lid)
      }).catch(function(){});
    });
    Promise.all(promises).then(function() {
      return db.collection("leagues").doc(lid).delete();
    }).then(function() {
      if (currentProfile) {
        currentProfile.leagues = (currentProfile.leagues || []).filter(function(l2){return l2!==lid});
        if (currentProfile.activeLeague === lid) {
          currentProfile.activeLeague = currentProfile.leagues.length ? currentProfile.leagues[0] : "";
          db.collection("members").doc(currentUser.uid).update({ activeLeague: currentProfile.activeLeague }).catch(function(){});
        }
      }
      Router.toast("League deleted");
      Router.go("leagues");
    });
  });
}
