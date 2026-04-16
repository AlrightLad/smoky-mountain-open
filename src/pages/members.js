/* ================================================
   PAGE: MEMBERS
   ================================================ */

Router.register("members", function(params) {
  if (params.add) renderAddMemberForm();
  else if (params.edit) renderMemberEdit(params.edit);
  else if (params.id) renderMemberDetail(params.id);
  else renderMemberList();
});

function renderMemberList() {
  var players = PB.getPlayers();
  
  // Show loading while fetching Firebase members
  document.querySelector('[data-page="members"]').innerHTML = '<div class="sh"><h2>Parbaugh members</h2></div>' + skeletonMemberRow() + skeletonMemberRow() + skeletonMemberRow() + skeletonMemberRow();
  
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
        fbMembers.push(d); 
        if (d.claimedFrom) claimedFromIds.push(d.claimedFrom);
      });
      
      pbLog("[Members] Firebase:", fbMembers.length, "Local:", players.length, "Claimed:", claimedFromIds.length);
      
      // Filter local players: remove any whose ID was claimed by a Firebase account
      var filtered = players.filter(function(p) {
        return claimedFromIds.indexOf(p.id) === -1;
      });
      
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
        if (fm.role === "removed") return;
        if (filteredIds.indexOf(fm.id) !== -1) return;
        // Skip stub docs: has claimedFrom but no username, AND a real account exists
        if (fm.claimedFrom && !fm.username && seenClaimedFrom[fm.claimedFrom]) return;
        // Skip duplicate usernames: only add if this is the chosen (richest) doc
        if (fm.username && seenUsernames[fm.username.toLowerCase()] !== fm) return;
        filtered.push(fm);
        filteredIds.push(fm.id);
      });
      
      pbLog("[Members] Final list:", filtered.length, filtered.map(function(p){return p.name||p.username}).join(", "));
      
      var h2 = '<div class="sh"><h2>Parbaugh members</h2></div>';
      renderMemberListHtml(filtered, h2);
    }).catch(function(e) {
      console.error("[Members] Firebase load failed:", e);
      var h = '<div class="sh"><h2>Parbaugh members</h2></div>';
      renderMemberListHtml(players, h);
    });
  } else {
    var h = '<div class="sh"><h2>Parbaugh members</h2></div>';
    renderMemberListHtml(players, h);
  }
}

function renderMemberListHtml(players, h) {
  var totalCount = players.filter(function(p){return p.role !== "removed";}).length;
  
  // Header with count
  h = '<div class="sh"><h2>Members <span style="font-size:14px;color:var(--muted);font-weight:400">' + totalCount + '</span></h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  // Search bar
  h += '<div style="padding:0 16px 12px"><input type="text" id="memberSearch" class="ff-input" placeholder="Search members..." oninput="filterMemberList()" style="background:var(--bg3);border:1px solid var(--border);font-size:13px;padding:10px 14px"></div>';
  
  // Sort controls
  h += '<div style="padding:0 16px 12px;display:flex;gap:6px;flex-wrap:wrap">';
  var sorts = [
    {key:"level",label:"Level"},
    {key:"rounds",label:"Rounds"},
    {key:"handicap",label:"Handicap"},
    {key:"alpha",label:"A-Z"}
  ];
  sorts.forEach(function(s) {
    var isActive = (s.key === "level"); // default sort
    h += '<button class="btn-sm ' + (isActive ? 'green' : 'outline') + '" id="sort-' + s.key + '" style="font-size:10px;padding:4px 10px" onclick="sortMemberList(\'' + s.key + '\')">' + s.label + '</button>';
  });
  h += '</div>';
  
  // Member list container
  h += '<div id="memberListContainer">';
  
  // Sort: founding members first, then by level
  var sortedPlayers = players.filter(function(p){return p.role !== "removed";}).slice();
  sortedPlayers.sort(function(a, b) {
    var aFounder = a.founding || a.isFoundingFour ? 1 : 0;
    var bFounder = b.founding || b.isFoundingFour ? 1 : 0;
    if (aFounder !== bFounder) return bFounder - aFounder;
    var aLvl = 1, bLvl = 1;
    try { aLvl = (PB.getPlayerLevel(a.id) || {level:1}).level; } catch(e) {}
    try { bLvl = (PB.getPlayerLevel(b.id) || {level:1}).level; } catch(e) {}
    return bLvl - aLvl;
  });
  
  h += buildMemberCards(sortedPlayers);
  h += '</div>';
  
  h += '<div class="section">' + renderInviteMemberButton() + '</div>';
  document.querySelector('[data-page="members"]').innerHTML = h;
  
  // Store players for search/sort
  window._memberListPlayers = sortedPlayers;
  window._memberListSort = "level";
}

function buildMemberCards(players) {
  var h = '';
  var lastWasFounder = false;
  players.forEach(function(p, idx) {
    var isFounder = p.founding || p.isFoundingFour;
    // Divider between founders and rest
    if (lastWasFounder && !isFounder) {
      h += '<div style="padding:4px 16px 8px;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:600;border-top:1px solid var(--border);margin-top:4px;padding-top:12px">Members</div>';
    }
    lastWasFounder = isFounder;
    
    var avg = PB.getPlayerAvg(p.id);
    var rounds = PB.getPlayerRounds(p.id);
    var hcap = PB.calcHandicap(rounds);
    var plvl = {level:1};
    try { plvl = PB.getPlayerLevel(p.id) || {level:1}; } catch(e) {}
    h += '<div class="card member-card" data-name="' + escHtml((p.name||"").toLowerCase() + " " + (p.username||"").toLowerCase()) + '" onclick="Router.go(\'members\',{id:\'' + p.id + '\'})">';
    h += '<div class="member-row"><div style="position:relative">' + renderAvatar(p, 40, false);
    h += '<div style="position:absolute;bottom:-3px;right:-3px;background:var(--gold);color:var(--bg);font-size:7px;font-weight:800;border-radius:6px;padding:1px 3px;border:1.5px solid var(--bg);line-height:1.3;min-width:12px;text-align:center;z-index:2;pointer-events:none">' + (plvl.level||1) + '</div>';
    h += '</div><div class="m-info">';
    h += '<div class="m-name">' + escHtml(p.username || p.name);
    if (isFounder) h += ' <svg viewBox="0 0 12 12" width="10" height="10" style="vertical-align:middle;margin-left:2px"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.6 3.5L6 9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" fill="var(--gold)" stroke="none"/></svg>';
    h += '</div>';
    if (p.equippedTitle && p.equippedTitle !== "Member" && p.equippedTitle !== "Rookie") h += '<div class="m-nick">' + escHtml(p.equippedTitle) + '</div>';
    else if (p.role === "commissioner") h += '<div class="m-nick">Commissioner</div>';
    else if (p.role === "suspended") h += '<div class="m-nick" style="color:var(--red)">Suspended</div>';
    h += '<div class="m-stats">' + (hcap !== null ? 'HCP ' + hcap + ' · ' : '') + (avg ? 'Avg ' + avg + ' · ' : '') + rounds.length + ' rds</div>';
    h += '</div><div class="m-arrow">></div></div></div>';
  });
  return h;
}

function filterMemberList() {
  var query = (document.getElementById("memberSearch").value || "").toLowerCase().trim();
  var cards = document.querySelectorAll(".member-card");
  cards.forEach(function(card) {
    var name = card.getAttribute("data-name") || "";
    card.style.display = !query || name.indexOf(query) !== -1 ? "" : "none";
  });
}

function sortMemberList(key) {
  var players = window._memberListPlayers;
  if (!players) return;
  window._memberListSort = key;
  
  // Update button states
  ["level","rounds","handicap","alpha"].forEach(function(k) {
    var btn = document.getElementById("sort-" + k);
    if (btn) btn.className = "btn-sm " + (k === key ? "green" : "outline");
  });
  
  var sorted = players.slice();
  sorted.sort(function(a, b) {
    // Founders always first
    var aF = a.founding || a.isFoundingFour ? 1 : 0;
    var bF = b.founding || b.isFoundingFour ? 1 : 0;
    if (aF !== bF) return bF - aF;
    
    if (key === "level") {
      var aL = 1, bL = 1;
      try { aL = (PB.getPlayerLevel(a.id)||{level:1}).level; } catch(e) {}
      try { bL = (PB.getPlayerLevel(b.id)||{level:1}).level; } catch(e) {}
      return bL - aL;
    }
    if (key === "rounds") {
      return PB.getPlayerRounds(b.id).length - PB.getPlayerRounds(a.id).length;
    }
    if (key === "handicap") {
      var aH = PB.calcHandicap(PB.getPlayerRounds(a.id));
      var bH = PB.calcHandicap(PB.getPlayerRounds(b.id));
      if (aH === null && bH === null) return 0;
      if (aH === null) return 1;
      if (bH === null) return -1;
      return aH - bH; // lower handicap first
    }
    if (key === "alpha") {
      return (a.name||"").localeCompare(b.name||"");
    }
    return 0;
  });
  
  var container = document.getElementById("memberListContainer");
  if (container) container.innerHTML = buildMemberCards(sorted);
  
  // Re-apply search filter
  var query = (document.getElementById("memberSearch").value || "").trim();
  if (query) filterMemberList();
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

function renderMemberDetailWithData(p) {
  var pid = p.id;
  var rounds = PB.getPlayerRounds(pid);
  var avg = PB.getPlayerAvg(pid);
  var best = PB.getPlayerBest(pid);
  var ghinHcap = PB.calcHandicap(rounds);
  var hcap = ghinHcap; // Only show GHIN-calculated handicap — manual handicap is for reference only
  var unique = PB.getUniqueCourses(pid);
  var clubLabels = {driver:"Driver",three_wood:"3 Wood",four_wood:"4 Wood",five_wood:"5 Wood",seven_wood:"7 Wood",nine_wood:"9 Wood",two_hybrid:"2 Hybrid",three_hybrid:"3 Hybrid",four_hybrid:"4 Hybrid",five_hybrid:"5 Hybrid",six_hybrid:"6 Hybrid",two_iron:"2 Iron",three_iron:"3 Iron",four_iron:"4 Iron",five_iron:"5 Iron",six_iron:"6 Iron",seven_iron:"7 Iron",eight_iron:"8 Iron",nine_iron:"9 Iron",pw:"PW",aw:"AW (48-50)",gw:"GW (50-52)",gap52:"52°",sw:"SW (54-56)",gap56:"56°",gap58:"58°",lw:"LW (60°)",gap64:"64°",putter:"Putter"};

  // Helper for collapsible profile sections
  function profSection(id, title, content, startOpen) {
    var chevronSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg>';
    return '<div class="section"><div class="sec-head" onclick="toggleSection(\'ps-' + id + '\')" style="cursor:pointer"><span class="sec-title">' + title + '</span><span class="sec-link" id="ps-' + id + '-toggle" style="display:inline-flex;transition:transform .2s' + (startOpen ? ';transform:rotate(90deg)' : '') + '">' + chevronSvg + '</span></div><div id="ps-' + id + '"' + (startOpen ? '' : ' style="display:none"') + '>' + content + '</div></div>';
  }

  // Get achievements and level early for frame/title
  var achievements = [];
  try { achievements = PB.getAchievements(pid) || []; } catch(e) {}
  var lvl = {level:1,name:"Rookie",xp:0,currentLevelXp:0,nextLevelXp:500};
  try { lvl = PB.getPlayerLevel(pid) || lvl; } catch(e) {}
  var frameColor = playerFrameColor(p);
  var ringStyle = typeof playerRingStyle === "function" ? playerRingStyle(p) : "border:3px solid " + frameColor;
  var activeTitle = p.equippedTitle || p.title || "Member";
  var isBeta = PB.getPlayers().indexOf(p) < 30;
  var isOwnProfile = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  var canEditPhoto = isOwnProfile;

  // ── HERO BANNER ──
  var bannerBg = getPlayerBannerCss(p) || 'linear-gradient(180deg,var(--grad-hero) 0%,var(--bg) 100%)';
  var h = '<div style="position:relative;background:' + bannerBg + ';padding:16px 16px 0;border-bottom:1px solid var(--border)">';
  // Back + Edit buttons
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<button class="back" onclick="Router.go(\'members\')" style="padding:6px 10px;min-height:40px">← Members</button>';
  if (isOwnProfile) h += '<button class="btn-sm green" onclick="Router.go(\'members\',{edit:\'' + pid + '\'})">Edit profile</button>';
  else if (currentUser && currentUser.uid !== pid) h += '<button class="btn-sm outline" style="font-size:9px;color:var(--muted)" onclick="reportMember(\'' + pid + '\')">Report</button>';
  h += '</div>';
  // Avatar + name block
  h += '<div style="text-align:center;padding-bottom:16px">';
  var _profColor = playerFrameColor(p);
  var _profGlow = typeof playerRingShadow === "function" ? playerRingShadow(p) : "";
  var _profAnim = typeof playerRingClass === "function" ? playerRingClass(p) : "";
  var _profAnimMap = {'ring-pulse-gold':'ringPulse 2s ease-in-out infinite','ring-diamond-sparkle':'ringShimmer 2.5s ease-in-out infinite','ring-rainbow-shift':'ringRainbow 3s linear infinite','ring-neon-green':'ringNeonGreen 1.8s ease-in-out infinite','ring-crimson-ember':'ringEmber 1.5s ease-in-out infinite'};
  var _profAnimCss = _profAnim && _profAnimMap[_profAnim] ? ';animation:' + _profAnimMap[_profAnim] : '';
  var _profShadowCombined = (_profGlow ? _profGlow + ',' : '') + '0 4px 20px rgba(0,0,0,.3)';
  h += '<div class="pd-av" style="width:96px;height:96px;font-size:38px;border:3px solid ' + _profColor + ';box-shadow:' + _profShadowCombined + _profAnimCss + ';margin:0 auto 12px"' + (canEditPhoto ? ' onclick="uploadMemberPhoto(\'' + pid + '\')"' : '') + '>' + Router.getAvatar(p);
  if (canEditPhoto) h += '<div class="pd-edit"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle"><path d="M11 2l3 3-8 8H3v-3z"/></svg></div>';
  h += '<div style="position:absolute;bottom:-4px;right:-4px;background:var(--gold);color:var(--bg);font-size:9px;font-weight:800;border-radius:10px;padding:2px 7px;border:2px solid var(--bg);line-height:1.3;min-width:18px;text-align:center;z-index:3">' + lvl.level + '</div>';
  h += '</div>';
  h += '<div class="pd-name" style="font-size:24px">' + renderUsername(p, '', false) + '</div>';
  if (p.username && p.name && p.username !== p.name) h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + p.name + '</div>';

  // Display badges (max 3, player-selected)
  var allBadges = [];
  if (p.founding || p.isFoundingFour) allBadges.push({id:"og",label:"THE ORIGINAL FOUR",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
  if (isBeta) allBadges.push({id:"beta",label:"BETA TESTER",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
  achievements.forEach(function(a) {
    if (a.id === "champion") allBadges.push({id:"champion",label:"CHAMPION",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "sub80") allBadges.push({id:"sub80",label:"SUB-80 CLUB",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
    if (a.id === "sub90") allBadges.push({id:"sub90",label:"SUB-90 CLUB",color:"var(--cream)",bg:"rgba(var(--cream-rgb),.06)",border:"rgba(var(--cream-rgb),.1)"});
    if (a.id === "ace") allBadges.push({id:"ace",label:"ACE MAKER",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "centurion") allBadges.push({id:"centurion",label:"CENTURION",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "captain") allBadges.push({id:"captain",label:"CAPTAIN",color:"var(--cream)",bg:"rgba(var(--cream-rgb),.06)",border:"rgba(var(--cream-rgb),.1)"});
    if (a.id === "roadwarrior") allBadges.push({id:"roadwarrior",label:"ROAD WARRIOR",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
    if (a.id === "the_commish") allBadges.push({id:"the_commish",label:"COMMISSIONER",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "boss_wife") allBadges.push({id:"boss_wife",label:"THE BOSS'S WIFE",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "recruiter") allBadges.push({id:"recruiter",label:"RECRUITER",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
    if (a.id === "ambassador") allBadges.push({id:"ambassador",label:"AMBASSADOR",color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});
    if (a.id === "beast_mode") allBadges.push({id:"beast_mode",label:"BEAST MODE",color:"var(--red)",bg:"rgba(var(--red-rgb),.08)",border:"rgba(var(--red-rgb),.15)"});
    if (a.id === "birdie_king") allBadges.push({id:"birdie_king",label:"BIRDIE KING",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
    if (a.id === "bogey_free") allBadges.push({id:"bogey_free",label:"BOGEY FREE",color:"var(--birdie)",bg:"rgba(var(--birdie-rgb),.08)",border:"rgba(var(--birdie-rgb),.15)"});
    if (a.id === "grip_rip") allBadges.push({id:"grip_rip",label:"GRIP IT & RIP IT",color:"var(--cream)",bg:"rgba(var(--cream-rgb),.06)",border:"rgba(var(--cream-rgb),.1)"});
    if (a.id === "hot_streak") allBadges.push({id:"hot_streak",label:"ON FIRE",color:"var(--red)",bg:"rgba(var(--red-rgb),.08)",border:"rgba(var(--red-rgb),.15)"});
  });
  // Add level badge
  if (lvl.level >= 10) allBadges.push({id:"lvl",label:"LEVEL " + lvl.level,color:"var(--gold)",bg:"rgba(var(--gold-rgb),.1)",border:"rgba(var(--gold-rgb),.2)"});

  var displayBadges = p.displayBadges || allBadges.slice(0, 3).map(function(b){return b.id});
  var shownBadges = allBadges.filter(function(b){return displayBadges.indexOf(b.id) !== -1}).slice(0, 3);

  // Title
  h += '<div style="font-size:12px;color:var(--gold);margin-top:6px;font-weight:600;letter-spacing:.5px">' + activeTitle + '</div>';

  // Badges row
  if (shownBadges.length) {
    h += '<div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px">';
    shownBadges.forEach(function(b) {
      h += '<span style="font-size:8px;padding:3px 10px;background:' + b.bg + ';border:1px solid ' + b.border + ';border-radius:var(--radius-full);color:' + b.color + ';font-weight:700;letter-spacing:.5px">' + b.label + '</span>';
    });
    h += '</div>';
  }

  // Bio + meta
  if (p.bio) h += '<div class="pd-bio" style="margin-top:10px">' + p.bio + '</div>';
  var metaParts = [];
  if (p.homeCourse) metaParts.push(p.homeCourse);
  if (p.range) metaParts.push(p.range);
  var joinDate = p.joinDate || "2026";
  metaParts.push('Since ' + joinDate);
  h += '<div style="font-size:10px;color:var(--muted2);margin-top:6px">' + metaParts.join(' · ') + '</div>';
  // Social action buttons (Trash Talk)
  if (typeof renderSocialActions === "function") h += renderSocialActions(pid);
  // Share profile card button
  h += '<div style="margin-top:8px"><button class="btn-sm outline" style="font-size:10px" onclick="shareProfileCard(\'' + pid + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle;margin-right:4px"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg>Share Profile Card</button></div>';
  h += '</div></div>'; // close text-align:center + hero banner

  // ── XP LEVEL BAR (compact) ──
  var pct = Math.min(100, Math.round(((lvl.xp - lvl.currentLevelXp) / Math.max(1, lvl.nextLevelXp - lvl.currentLevelXp)) * 100));
  h += '<div style="padding:8px 16px 14px;cursor:pointer;border-bottom:1px solid var(--border)" onclick="Router.go(\'trophyroom\',{id:\'' + pid + '\'})">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px">';
  h += '<div style="font-size:12px;font-weight:700;color:var(--gold);letter-spacing:.3px">Lv. ' + lvl.level + ' · ' + lvl.name + '</div>';
  h += '<div style="font-size:10px;color:var(--muted)">' + lvl.xp.toLocaleString() + ' XP <span style="color:var(--muted2)">→ Trophies</span></div></div>';
  h += '<div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--gold2),var(--gold3));border-radius:3px;transition:width .4s"></div></div>';
  h += '</div>';

  // ── PARCOIN WALLET ──
  var coinBalance = getParCoinBalance(pid);
  var coinLifetime = getParCoinLifetime(pid);
  h += '<div style="padding:0 16px 10px;display:flex;gap:8px">';
  h += '<div style="flex:1;background:linear-gradient(135deg,rgba(var(--gold-rgb),.08),rgba(var(--gold-rgb),.03));border:1px solid rgba(var(--gold-rgb),.15);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:10px">';
  h += '<div style="width:32px;height:32px;border-radius:50%;background:rgba(var(--gold-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="var(--gold)" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7M7 11.5h5a2 2 0 010 0"/></svg></div>';
  h += '<div><div style="font-size:16px;font-weight:700;color:var(--gold)" data-count="' + coinBalance + '">' + coinBalance.toLocaleString() + '</div>';
  h += '<div style="font-size:9px;color:var(--muted);letter-spacing:.5px">PARCOINS</div></div>';
  h += '</div>';
  if (coinLifetime > coinBalance) {
    h += '<div style="flex-shrink:0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;text-align:center;min-width:76px">';
    h += '<div style="font-size:14px;font-weight:700;color:var(--cream)" data-count="' + coinLifetime + '">' + coinLifetime.toLocaleString() + '</div>';
    h += '<div style="font-size:8px;color:var(--muted);letter-spacing:.5px">LIFETIME</div></div>';
  }
  h += '</div>';

  // ── STAT GRID ──
  h += '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">';
  h += statBox(hcap !== null ? hcap : "—", "Handicap");
  h += statBox(avg || "—", "Avg Score");
  var bestScore = best ? best.score : "—";
  var bestRoundId = best ? best.roundId : null;
  if (bestRoundId) {
    h += '<div class="stat-box" style="cursor:pointer" onclick="Router.go(\'rounds\',{roundId:\'' + bestRoundId + '\'})"><div class="stat-val" data-count="' + bestScore + '" style="color:var(--birdie)">' + bestScore + '</div><div class="stat-label">Best <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div></div>';
  } else {
    h += statBox(bestScore, "Best");
  }
  h += statBox(rounds.length, "Rounds");
  h += statBox(unique, "Courses");
  var ewIds = [pid]; if (p.claimedFrom) ewIds.push(p.claimedFrom);
  var eventWinsCount = PB.getTrips().filter(function(t){ return t.champion && ewIds.indexOf(t.champion) !== -1; }).length;
  h += statBox(eventWinsCount || p.wins || 0, "Wins");
  h += '</div>';

  // ── PROFILE TABS ──
  h += '<div class="toggle-bar" id="profile-tabs">';
  h += '<button class="a" onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-overview\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Overview</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-stats\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Stats</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-gear\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Gear</button>';
  h += '<button onclick="document.querySelectorAll(\'[data-ptab]\').forEach(function(e){e.style.display=\'none\'});document.getElementById(\'ptab-social\').style.display=\'block\';document.querySelectorAll(\'#profile-tabs button\').forEach(function(b){b.className=\'\'});this.className=\'a\'">Social</button>';
  h += '</div>';

  // ═══ TAB: OVERVIEW (last rounds, courses, achievements) ═══
  h += '<div id="ptab-overview" data-ptab>';

  // Title picker (hidden by default)
  h += '<div id="title-picker" style="display:none;text-align:left;max-width:320px;margin:8px auto">';
  var allTitles = [
    {name:"Rookie",req:"Default",unlocked:true},
    {name:"Weekend Warrior",req:"Level 5",unlocked:lvl.level>=5},
    {name:"Range Rat",req:"Level 10",unlocked:lvl.level>=10},
    {name:"Fairway Finder",req:"Level 15",unlocked:lvl.level>=15},
    {name:"Club Member",req:"Level 20",unlocked:lvl.level>=20},
    {name:"Course Regular",req:"Level 25",unlocked:lvl.level>=25},
    {name:"Low Handicapper",req:"Level 30",unlocked:lvl.level>=30},
    {name:"Scratch Aspirant",req:"Level 35",unlocked:lvl.level>=35},
    {name:"Ironman",req:"Level 40",unlocked:lvl.level>=40},
    {name:"Birdie Hunter",req:"Level 45",unlocked:lvl.level>=45},
    {name:"Eagle Eye",req:"Level 50",unlocked:lvl.level>=50},
    {name:"Tour Wannabe",req:"Level 55",unlocked:lvl.level>=55},
    {name:"Golf Addict",req:"Level 60",unlocked:lvl.level>=60},
    {name:"Links Legend",req:"Level 65",unlocked:lvl.level>=65},
    {name:"Course Conqueror",req:"Level 70",unlocked:lvl.level>=70},
    {name:"The Professor",req:"Level 75",unlocked:lvl.level>=75},
    {name:"Hall of Famer",req:"Level 80",unlocked:lvl.level>=80},
    {name:"Living Legend",req:"Level 85",unlocked:lvl.level>=85},
    {name:"Immortal",req:"Level 90",unlocked:lvl.level>=90},
    {name:"Transcendent",req:"Level 95",unlocked:lvl.level>=95},
    {name:"G.O.A.T.",req:"Level 100",unlocked:lvl.level>=100}
  ];
  var aTitles = [
    {name:"Sharpshooter",req:"Shoot under 80",unlocked:achievements.some(function(a){return a.id==="sub80"})},
    {name:"Tour Ready",req:"Shoot under 70",unlocked:achievements.some(function(a){return a.id==="sub70"})},
    {name:"Ace Maker",req:"Hole-in-one",unlocked:achievements.some(function(a){return a.id==="ace"})},
    {name:"Champion",req:"Win an event",unlocked:achievements.some(function(a){return a.id==="champion"})},
    {name:"Dynasty Builder",req:"Win 3 events",unlocked:achievements.some(function(a){return a.id==="dynasty"})},
    {name:"The Dominator",req:"25 H2H wins",unlocked:achievements.some(function(a){return a.id==="dominator"})},
    {name:"Nemesis",req:"10 H2H wins",unlocked:achievements.some(function(a){return a.id==="nemesis"})},
    {name:"The Nomad",req:"25 courses",unlocked:achievements.some(function(a){return a.id==="nomad"})},
    {name:"Road Warrior",req:"5 states",unlocked:achievements.some(function(a){return a.id==="roadwarrior"})},
    {name:"Local Legend",req:"10 rounds same course",unlocked:achievements.some(function(a){return a.id==="local_legend"})},
    {name:"Centurion",req:"100 rounds",unlocked:achievements.some(function(a){return a.id==="centurion"})},
    {name:"Metamorphosis",req:"Average improved 15+",unlocked:achievements.some(function(a){return a.id==="metamorphosis"})}
  ];
  var sTitles = [
    {name:"The Original Four",req:"Founding member",unlocked:!!(p.founding || p.isFoundingFour || (p.badges && p.badges.indexOf("founder") !== -1))},
    {name:"The Original Four · Commissioner",req:"Be The Commissioner",unlocked:(p.founding || p.isFoundingFour) && (p.role==="commissioner"||pid==="zach"||p.username==="TheCommissioner")},
    {name:"Beta Tester",req:"First 30 members",unlocked:isBeta}
  ];
  // Event-specific champion titles
  var eventTitles = [];
  PB.getTrips().forEach(function(t) {
    if (!t.champion) return;
    var isChamp = t.champion === pid || (p.claimedFrom && t.champion === p.claimedFrom);
    if (!isChamp) {
      // Check reverse — champion might be UID and pid is seed, or vice versa
      var champPlayer = PB.getPlayer(t.champion);
      if (champPlayer && (champPlayer.claimedFrom === pid || champPlayer.id === p.claimedFrom)) isChamp = true;
    }
    var funnyNames = {
      "smo": "King of the Smokies",
      "smoky": "King of the Smokies",
      "mountain": "King of the Smokies"
    };
    var eventTitle = null;
    var nameLower = (t.name || "").toLowerCase();
    Object.keys(funnyNames).forEach(function(k) { if (nameLower.indexOf(k) !== -1 && !eventTitle) eventTitle = funnyNames[k]; });
    if (!eventTitle) eventTitle = t.name + " Champion";
    eventTitles.push({name: eventTitle, req: "Win " + t.name, unlocked: isChamp});
  });
  var combined = allTitles.concat(aTitles).concat(sTitles).concat(eventTitles);
  h += '<div style="max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--card)">';
  combined.forEach(function(t) {
    var isEquipped = activeTitle === t.name;
    if (t.unlocked) {
      h += '<div onclick="equipTitle(\'' + pid + '\',\'' + t.name.replace(/'/g,"\\'") + '\')" style="padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:' + (isEquipped ? 'rgba(var(--gold-rgb),.08)' : 'transparent') + '">';
      h += '<div><div style="font-size:12px;font-weight:600;color:' + (isEquipped ? 'var(--gold)' : 'var(--cream)') + '">' + t.name + '</div>';
      h += '<div style="font-size:9px;color:var(--muted)">' + t.req + '</div></div>';
      if (isEquipped) h += '<div style="font-size:9px;color:var(--gold);font-weight:700;letter-spacing:.5px">EQUIPPED</div>';
      h += '</div>';
    } else {
      h += '<div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;opacity:.35">';
      h += '<div><div style="font-size:12px;font-weight:600;color:var(--muted2)">' + t.name + '</div>';
      h += '<div style="font-size:9px;color:var(--muted2)">' + t.req + '</div></div>';
      h += '<div style="font-size:10px;color:var(--muted2)">Locked</div></div>';
    }
  });
  h += '</div></div>';

  // === HANDICAP TRACKER (collapsible, open by default) ===
  var hcapContent = '';
  var hcapDetails = PB.getHandicapDetails(rounds);
  var totalDiffs = hcapDetails.differentials.length;
  var hasData = totalDiffs > 0 || hcapDetails.unpaired9;
  
  // Current handicap hero
  if (hcap !== null) {
    hcapContent += '<div style="text-align:center;padding:16px 12px 12px">';
    hcapContent += '<div style="font-family:Playfair Display,serif;font-size:42px;font-weight:700;color:var(--gold)">' + hcap + '</div>';
    hcapContent += '<div style="font-size:10px;color:var(--muted);letter-spacing:.5px;margin-top:2px">WHS HANDICAP INDEX</div>';
    hcapContent += '</div>';
  } else if (totalDiffs > 0) {
    hcapContent += '<div style="text-align:center;padding:14px 12px 10px">';
    hcapContent += '<div style="font-size:13px;color:var(--muted)">' + (3 - totalDiffs) + ' more qualifying round' + (3 - totalDiffs !== 1 ? 's' : '') + ' to establish handicap</div>';
    hcapContent += '</div>';
  }
  
  // Graph (only when 3+ differentials)
  if (totalDiffs >= 3) {
    hcapContent += buildHandicapGraph(rounds, pid);
  }
  
  // Differentials table (collapsible)
  if (totalDiffs > 0) {
    var diffToggleId = "diffTable_" + pid;
    hcapContent += '<div style="padding:8px 12px 4px"><div style="font-size:9px;font-weight:700;color:var(--muted);letter-spacing:1px;margin-bottom:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="var el=document.getElementById(\'' + diffToggleId + '\');el.style.display=el.style.display===\'none\'?\'block\':\'none\'">SCORE DIFFERENTIALS (' + hcapDetails.differentials.length + ')<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></div>';
    hcapContent += '<div id="' + diffToggleId + '" style="display:none">';
    hcapDetails.differentials.forEach(function(d, idx) {
      var roundInfo = "";
      if (d.type === "18") {
        var r = d.rounds[0];
        roundInfo = escHtml(r.course || "") + " · " + r.score;
      } else if (d.type === "9+9") {
        var r1 = d.rounds[0], r2 = d.rounds[1];
        var m1 = r1.holesMode === "back9" ? "B9" : "F9";
        var m2 = r2.holesMode === "back9" ? "B9" : "F9";
        roundInfo = escHtml(r1.course || "") + " " + m1 + " + " + escHtml(r2.course || "") + " " + m2 + " · " + d.combinedScore;
      }
      var diffColor = d.diff < 15 ? "var(--birdie)" : d.diff < 25 ? "var(--gold)" : "var(--red)";
      hcapContent += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px">';
      hcapContent += '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">';
      if (d.type === "9+9") hcapContent += '<span style="font-size:8px;background:rgba(var(--gold-rgb),.12);color:var(--gold);padding:2px 5px;border-radius:3px;flex-shrink:0">9+9</span>';
      hcapContent += '<span style="color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + roundInfo + '</span></div>';
      hcapContent += '<div style="flex-shrink:0;font-weight:600;color:' + diffColor + ';min-width:40px;text-align:right">' + d.diff.toFixed(1) + '</div>';
      hcapContent += '</div>';
    });
    hcapContent += '</div></div>';
  }
  
  // Unpaired 9-hole round (always visible)
  if (hcapDetails.unpaired9) {
    var u = hcapDetails.unpaired9;
    var uMode = u.holesMode === "back9" ? "Back 9" : "Front 9";
    hcapContent += '<div style="padding:8px 12px 12px;border-top:1px solid var(--border)">';
    hcapContent += '<div style="display:flex;justify-content:space-between;align-items:center">';
    hcapContent += '<div style="font-size:11px;color:var(--muted)">' + escHtml(u.course || "9 holes") + ' · ' + uMode + ' · ' + u.score + '</div>';
    hcapContent += '<span style="font-size:9px;font-weight:600;color:var(--gold);background:rgba(var(--gold-rgb),.1);padding:3px 8px;border-radius:10px;white-space:nowrap">Awaiting pairing</span>';
    hcapContent += '</div>';
    hcapContent += '<div style="font-size:9px;color:var(--muted2);margin-top:3px">Per WHS rules, two 9-hole rounds combine into one differential</div>';
    hcapContent += '</div>';
  }
  
  // Empty state
  if (!hasData) {
    var indivCount = rounds.filter(function(r){return r.format!=="scramble"&&r.format!=="scramble4"}).length;
    hcapContent += '<div style="padding:16px 12px;font-size:12px;color:var(--muted);text-align:center">Log ' + Math.max(1, 3 - indivCount) + ' more individual round' + (3 - indivCount !== 1 ? 's' : '') + ' to start tracking your handicap</div>';
  }
  
  h += profSection("hcap-" + pid, "Handicap tracker", hcapContent, hasData);

  // === LAST 3 ROUNDS (collapsible, open by default) ===
  var last3Content = '';
  if (rounds.length) {
    var last3 = rounds.slice().sort(function(a,b){ return (b.date||"") > (a.date||"") ? 1 : (b.date||"") < (a.date||"") ? -1 : 0; }).slice(0, 3);
    last3.forEach(function(r) {
      var c = PB.generateRoundCommentary(r);
      var quip = c.roasts.length ? c.roasts[0] : (c.highlights.length ? c.highlights[0] : "");
      var diffR = Math.round((r.score - (r.rating || 72)) * 10) / 10;
      var diffStrR = diffR === 0 ? "E" : (diffR > 0 ? "+" + diffR : "" + diffR);
      var safeCourse = (r.course||"").replace(/'/g,"\\'");
      var safeName = (r.playerName||"").replace(/'/g,"\\'");
      var safeTee = (r.tee||"").replace(/'/g,"\\'");
      var safeYards = r.yards || 0;
      last3Content += '<div class="card"><div class="round-card"><div class="rc-top"><div onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})" style="cursor:pointer;flex:1"><div class="rc-course">' + escHtml(r.course) + '</div><div class="rc-date">' + r.date + (r.format && r.format !== "stroke" ? ' · ' + r.format : '') + '</div></div>';
      last3Content += '<div style="display:flex;align-items:center;gap:8px"><div class="rc-score">' + r.score + '</div>';
      last3Content += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px;flex-shrink:0" onclick="event.stopPropagation();showRoundShareCard(\'' + r.id + '\')">Share</button>';
      last3Content += '</div></div>';
      if (quip) last3Content += '<div class="rc-quip">' + quip + '</div>';
      last3Content += '</div></div>';
    });
  } else {
    last3Content = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No rounds logged yet</div>';
  }
  h += profSection("last3-" + pid, "Last 3 rounds", last3Content, true);

  // === COURSES PLAYED (collapsible, open by default) ===
  var coursesContent = '';
  if (rounds.length) {
    var courseMap = {};
    rounds.forEach(function(r) {
      if (!r.course) return;
      if (!courseMap[r.course]) courseMap[r.course] = { name: r.course, best18: null, best9: null, best9mode: null, bestScramble: null, count: 0, bestRoundId: null, best9RoundId: null };
      courseMap[r.course].count++;
      var isScramble = r.format === "scramble" || r.format === "scramble4";
      var is9 = r.holesPlayed && r.holesPlayed <= 9;
      if (isScramble) {
        if (courseMap[r.course].bestScramble === null || r.score < courseMap[r.course].bestScramble) courseMap[r.course].bestScramble = r.score;
      } else if (is9) {
        if (courseMap[r.course].best9 === null || r.score < courseMap[r.course].best9) {
          courseMap[r.course].best9 = r.score;
          courseMap[r.course].best9mode = r.holesMode === "back9" ? "Back 9" : "Front 9";
          courseMap[r.course].best9RoundId = r.id;
        }
      } else {
        if (courseMap[r.course].best18 === null || r.score < courseMap[r.course].best18) {
          courseMap[r.course].best18 = r.score;
          courseMap[r.course].bestRoundId = r.id;
        }
      }
    });
    var courseList = Object.values(courseMap).sort(function(a, b) { return b.count - a.count; });
    courseList.forEach(function(c) {
      var lines = [];
      if (c.best18 !== null) {
        var click18 = c.bestRoundId ? ' style="cursor:pointer;color:var(--gold)" onclick="Router.go(\'rounds\',{roundId:\'' + c.bestRoundId + '\'})"' : ' style="color:var(--gold)"';
        lines.push('<span' + click18 + '>Best: ' + c.best18 + '</span>');
      }
      if (c.best9 !== null) {
        var click9 = c.best9RoundId ? ' style="cursor:pointer;color:var(--gold)" onclick="Router.go(\'rounds\',{roundId:\'' + c.best9RoundId + '\'})"' : ' style="color:var(--gold)"';
        lines.push('<span' + click9 + '>Best: ' + c.best9 + ' <span style="color:var(--muted);font-size:9px">(' + (c.best9mode || '9h') + ')</span></span>');
      }
      if (c.bestScramble !== null) {
        lines.push('<span style="color:var(--muted)">Scramble: ' + c.bestScramble + '</span>');
      }
      if (!lines.length) lines.push('<span style="color:var(--muted)">—</span>');
      coursesContent += '<div class="club-row" style="flex-wrap:wrap;gap:2px"><span class="club-name">' + escHtml(c.name) + ' <span style="color:var(--muted);font-size:9px">(' + c.count + 'x)</span></span><span class="club-yd" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:11px">' + lines.join('') + '</span></div>';
    });
  } else {
    coursesContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No courses played yet</div>';
  }
  h += profSection("courses-" + pid, "Courses played", coursesContent, true);

  // === RECENT PARCOINS (async load) ===
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Recent earnings</span></div>';
  h += '<div id="parcoin-history-' + pid + '"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';

  h += '</div>'; // close ptab-overview

  // ═══ TAB: GEAR (bag, clubs, known for) ═══
  h += '<div id="ptab-gear" data-ptab style="display:none">';

  // === WHAT'S IN THE BAG (collapsible) ===
  var bagContent = '';
  if (p.bagPhoto) bagContent += '<div style="border-radius:var(--radius);overflow:hidden;margin-bottom:8px"><img alt="" src="' + p.bagPhoto + '" style="width:100%;display:block"></div>';
  if (p.bag) {
    var bagLabels = {driver:"Driver",irons:"Irons",wedges:"Wedges",putter:"Putter",bag_brand:"Bag",accessories:"Accessories",fav_ball:"Favorite Ball"};
    Object.keys(bagLabels).forEach(function(k) {
      if (p.bag && p.bag[k]) bagContent += '<div class="club-row"><span class="club-name">' + bagLabels[k] + '</span><span class="club-yd" style="max-width:200px;text-align:right">' + p.bag[k] + '</span></div>';
    });
  }
  if (!bagContent) bagContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No equipment listed yet</div>';
  h += profSection("bag-" + pid, "What\'s in the bag", bagContent, false);

  // === CLUB DISTANCES (collapsible) ===
  var clubContent = '';
  if (p.clubs && Object.keys(p.clubs).some(function(k) { return p.clubs[k]; })) {
    Object.keys(clubLabels).forEach(function(k) {
      if (p.clubs[k]) clubContent += '<div class="club-row"><span class="club-name">' + clubLabels[k] + '</span><span class="club-yd">' + p.clubs[k] + ' yds</span></div>';
    });
  } else {
    clubContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No distances logged yet</div>';
  }
  h += profSection("clubs-" + pid, "Club distances", clubContent, false);

  // === KNOWN FOR (collapsible) ===
  if (p.funnyFacts && p.funnyFacts.length) {
    var factsContent = '';
    p.funnyFacts.forEach(function(f) { factsContent += '<div class="fact-item">• ' + f + '</div>'; });
    h += profSection("facts-" + pid, "Known for", factsContent, false);
  }
  h += '</div>'; // close ptab-gear

  // ═══ TAB: STATS (achievements, accolades, all rounds) ═══
  h += '<div id="ptab-stats" data-ptab style="display:none">';

  // ═══ ANALYTICS DASHBOARD ═══
  if (typeof calcScoringTrends === "function" && rounds.length >= 3) {
    // Scoring Trends
    var trends = calcScoringTrends(rounds);
    if (trends && trends.rolling5.length >= 3) {
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Scoring Trend</span></div>';
      h += '<div class="card"><div style="padding:14px 16px">';
      h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Rolling 5-round average</div>';
      h += svgLineChart(trends.rolling5, {width:310, height:120, color:'var(--gold)'});
      h += '</div></div></div>';
    }

    // Scoring Zones (par type)
    var zones = calcScoringZones(rounds);
    if (zones) {
      var zoneData = [];
      [3,4,5].forEach(function(p) { if (zones[p]) zoneData.push({label:"Par "+p, value:zones[p].avg, color:zones[p].avg<=0.5?"var(--birdie)":zones[p].avg<=1.5?"var(--gold)":"var(--red)"}); });
      if (zoneData.length >= 2) {
        h += '<div class="section"><div class="sec-head"><span class="sec-title">Scoring by Par Type</span></div>';
        h += '<div class="card"><div style="padding:14px 16px">';
        h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Average strokes over par</div>';
        h += svgBarChart(zoneData, {width:200, height:120, showLabels:true, showValues:true});
        zoneData.forEach(function(z) {
          var label = z.value <= 0.5 ? "Strong" : z.value <= 1.0 ? "Solid" : z.value <= 1.5 ? "Average" : z.value <= 2.0 ? "Needs work" : "Bleeding strokes";
          h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">' + z.label + 's: <span style="color:' + z.color + ';font-weight:600">+' + z.value + '</span> — ' + label + '</div>';
        });
        h += '</div></div></div>';
      }
    }

    // Strokes Gained
    var sg = calcStrokesGained(rounds);
    if (sg) {
      var sgData = [
        {label:"Tee", value:sg.tee, color:sg.tee>=0?"var(--birdie)":"var(--red)"},
        {label:"Approach", value:sg.approach, color:sg.approach>=0?"var(--birdie)":"var(--red)"},
        {label:"Short", value:sg.shortGame, color:sg.shortGame>=0?"var(--birdie)":"var(--red)"},
        {label:"Putting", value:sg.putting, color:sg.putting>=0?"var(--birdie)":"var(--red)"}
      ];
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Strokes Gained</span></div>';
      h += '<div class="card"><div style="padding:14px 16px">';
      h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Per round vs baseline (from ' + sg.rounds + ' rounds)</div>';
      h += svgBarChart(sgData, {width:280, height:130, showLabels:true, showValues:true});
      h += '</div></div></div>';
    }

    // Stat Trends (FIR, GIR, Putts)
    var statTr = calcStatTrends(rounds);
    if (statTr) {
      if (statTr.gir.length >= 3) {
        h += '<div class="section"><div class="sec-head"><span class="sec-title">GIR % Trend</span></div>';
        h += '<div class="card"><div style="padding:14px 16px">';
        h += svgLineChart(statTr.gir, {width:310, height:100, color:'var(--gold)', yMin:0, yMax:100});
        h += '</div></div></div>';
      }
      if (statTr.putts.length >= 3) {
        h += '<div class="section"><div class="sec-head"><span class="sec-title">Putts Per Hole Trend</span></div>';
        h += '<div class="card"><div style="padding:14px 16px">';
        h += svgLineChart(statTr.putts, {width:310, height:100, color:'var(--pink)'});
        h += '</div></div></div>';
      }
    }

    // Course Breakdown (most-played course)
    var courseCounts = {};
    rounds.filter(function(r){return r.course}).forEach(function(r){courseCounts[r.course]=(courseCounts[r.course]||0)+1});
    var topCourse = Object.entries(courseCounts).sort(function(a,b){return b[1]-a[1]})[0];
    if (topCourse && topCourse[1] >= 3) {
      var breakdown = calcCourseBreakdown(topCourse[0], rounds);
      if (breakdown && breakdown.holes.length >= 9) {
        var bkData = breakdown.holes.map(function(h2){return {label:"#"+h2.hole, value:h2.diff, color:h2.diff<=0?"var(--birdie)":h2.diff<=1?"var(--gold)":"var(--red)"}});
        h += '<div class="section"><div class="sec-head"><span class="sec-title">Hole-by-Hole: ' + escHtml(topCourse[0]) + '</span></div>';
        h += '<div class="card"><div style="padding:14px 16px">';
        h += '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">Avg strokes over par per hole (' + breakdown.rounds + ' rounds)</div>';
        h += svgBarChart(bkData, {width:310, height:120, showLabels:true, showValues:false});
        h += '</div></div></div>';
      }
    }
  } else if (rounds.length < 3) {
    h += '<div style="text-align:center;padding:24px 16px;font-size:12px;color:var(--muted)">Log 3+ rounds to unlock analytics dashboard</div>';
  }

  // === ACHIEVEMENTS (collapsible) ===
  var achieveContent = '';
  if (achievements.length) {
    achieveContent += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    var cats = {milestone:"Milestones",score:"Scoring",explore:"Exploration",compete:"Competitive",growth:"Improvement",special:"Special",range:"Range Practice",level:"Level"};
    var grouped = {};
    achievements.forEach(function(a) { if (!grouped[a.cat]) grouped[a.cat] = []; grouped[a.cat].push(a); });
    Object.keys(cats).forEach(function(cat) {
      if (!grouped[cat]) return;
      achieveContent += '<div style="width:100%;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:6px;margin-bottom:2px">' + cats[cat] + '</div>';
      grouped[cat].forEach(function(a) {
        var _eStr = "";
        if (a.earnedAt) {
          var _eD2 = new Date(a.earnedAt + "T12:00:00");
          var _eMn2 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          _eStr = ' · ' + _eMn2[_eD2.getMonth()] + ' ' + _eD2.getDate() + ', ' + _eD2.getFullYear();
        }
        achieveContent += '<div style="padding:6px 10px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius);cursor:default">';
        achieveContent += '<div style="font-size:11px;font-weight:700;color:var(--gold)">' + a.icon + ' ' + a.name + '</div>';
        achieveContent += '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + a.desc + (_eStr ? '<span style="color:var(--muted2)">' + _eStr + '</span>' : '') + '</div></div>';
      });
    });
    achieveContent += '</div>';
  } else {
    achieveContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No achievements yet — log rounds to unlock</div>';
  }
  h += profSection("achieve-" + pid, "Achievements (" + achievements.length + ")", achieveContent, false);
  var teams = PB.getScrambleTeams();
  // Match team membership by UID, claimedFrom seed ID, or username
  var pClaimedFrom = p.claimedFrom || null;
  var pUsername = p.username || null;
  var playerTeams = teams.filter(function(t) {
    if (!t.members) return false;
    return t.members.indexOf(pid) !== -1 ||
           (pClaimedFrom && t.members.indexOf(pClaimedFrom) !== -1) ||
           (pUsername && t.members.indexOf(pUsername) !== -1);
  });
  var teamContent = '';
  if (playerTeams.length) {
    playerTeams.forEach(function(t) {
      var matches = (t.matches || []).slice();
      // Also count scramble rounds from rounds collection
      var memberIds = t.members;
      var roundsCol = PB.getRounds().filter(function(r) {
        return (r.format === "scramble" || r.format === "scramble4") && memberIds.indexOf(r.player) !== -1;
      });
      var matchKeys = {};
      matches.forEach(function(m) { matchKeys[(m.course||"") + "|" + (m.date||"")] = true; });
      roundsCol.forEach(function(r) {
        var key = (r.course||"") + "|" + (r.date||"");
        if (!matchKeys[key]) { matches.push({ course: r.course, date: r.date, score: r.score, format: r.format }); matchKeys[key] = true; }
      });
      // Deduplicate by course+date (scramble rounds are per-player, count as 1 team round)
      var uniqueRounds = {};
      matches.forEach(function(m) { if (m.course && m.date) uniqueRounds[(m.course||"") + "|" + (m.date||"")] = m; });
      var teamRoundCount = Object.keys(uniqueRounds).length;
      
      var bestScore = null;
      matches.forEach(function(m){ if (m.score && (bestScore === null || m.score < bestScore)) bestScore = m.score; });
      var h2hMatches = matches.filter(function(m){ return m.result === "win" || m.result === "loss" || m.result === "tie"; });
      var wins = h2hMatches.filter(function(m){ return m.result === "win"; }).length;
      var losses = h2hMatches.filter(function(m){ return m.result === "loss"; }).length;
      var mates = t.members.filter(function(id){return id !== pid && id !== pClaimedFrom}).map(function(id){var p=PB.getPlayer(id);return p?p.name:id}).join(", ");
      
      var rightHTML = '';
      if (h2hMatches.length) {
        rightHTML = '';
        if (bestScore) rightHTML += '<div style="font-size:16px;font-weight:700;color:var(--gold)">' + bestScore + '</div>';
        rightHTML += '<div style="font-size:10px;color:var(--muted)">' + wins + '-' + losses + ' W-L</div>';
      } else if (bestScore) {
        rightHTML = '<div style="font-size:13px;font-weight:600;color:var(--gold)">Best: ' + bestScore + '</div>';
      } else {
        rightHTML = '<div style="font-size:10px;color:var(--muted2)">' + teamRoundCount + ' rd' + (teamRoundCount !== 1 ? 's' : '') + '</div>';
      }
      teamContent += '<div class="h2h-row" onclick="Router.go(\'scramble\',{id:\'' + t.id + '\'})" style="cursor:pointer"><div><div style="font-size:13px;font-weight:600">' + t.name + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">w/ ' + mates + '</div></div><div style="text-align:right">' + rightHTML + '</div></div>';
    });
  } else {
    teamContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">Not on any teams yet</div>';
  }
  h += profSection("teams-" + pid, "Teams (" + playerTeams.length + ")", teamContent, false);

  // === ACCOLADES (collapsible) ===
  var accoladeContent = '';
  var accolades = [];
  // Event wins — check all player ID aliases against champion
  var myAccIds = [pid];
  if (p.claimedFrom && myAccIds.indexOf(p.claimedFrom) === -1) myAccIds.push(p.claimedFrom);
  PB.getPlayers().forEach(function(pl) { if (pl.claimedFrom === pid && myAccIds.indexOf(pl.id) === -1) myAccIds.push(pl.id); });
  if (typeof fbMemberCache !== "undefined") {
    Object.keys(fbMemberCache).forEach(function(k) {
      var m = fbMemberCache[k];
      if ((m.claimedFrom === pid || k === pid) && myAccIds.indexOf(k) === -1) myAccIds.push(k);
      if (k === pid && m.claimedFrom && myAccIds.indexOf(m.claimedFrom) === -1) myAccIds.push(m.claimedFrom);
    });
  }
  PB.getTrips().forEach(function(t) {
    if (t.champion && myAccIds.indexOf(t.champion) !== -1) accolades.push({type:"Event champion", detail: t.name});
  });
  // Records held
  var rec = PB.getRecords();
  if (rec.longestDrive && rec.longestDrive.by === p.name) accolades.push({type:"Record holder", detail:"Longest drive — " + rec.longestDrive.distance + " yds"});
  if (rec.longestPutt && rec.longestPutt.by === p.name) accolades.push({type:"Record holder", detail:"Longest putt — " + rec.longestPutt.distance + " ft"});
  if (rec.longestHoleOut && rec.longestHoleOut.by === p.name) accolades.push({type:"Record holder", detail:"Longest hole out — " + rec.longestHoleOut.distance + " yds"});
  // Aces
  if (rec.holeInOnes) {
    rec.holeInOnes.forEach(function(a) {
      if (a.by === p.name) accolades.push({type:"Hole-in-one", detail: a.course + " hole " + (a.hole||"?")});
    });
  }
  if (accolades.length) {
    accolades.forEach(function(a) {
      accoladeContent += '<div class="club-row"><span class="club-name" style="color:var(--gold)">' + a.type + '</span><span class="club-yd" style="max-width:200px;text-align:right;font-weight:500">' + a.detail + '</span></div>';
    });
  } else {
    accoladeContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No accolades yet</div>';
  }
  h += profSection("accolades-" + pid, "Accolades" + (accolades.length ? " (" + accolades.length + ")" : ""), accoladeContent, false);
  h += '</div>'; // close ptab-stats

  // ═══ TAB: SOCIAL (H2H, all rounds) ═══
  h += '<div id="ptab-social" data-ptab style="display:none">';

  // === HEAD TO HEAD (collapsible) ===
  var h2hContent = '';
  var h2hHasMatches = false;
  // Build set of all IDs that refer to this player (to skip self)
  var myIds = [pid];
  var myPlayer = PB.getPlayer(pid);
  if (myPlayer && myPlayer.claimedFrom && myIds.indexOf(myPlayer.claimedFrom) === -1) myIds.push(myPlayer.claimedFrom);
  PB.getPlayers().forEach(function(pl) { if (pl.claimedFrom === pid && myIds.indexOf(pl.id) === -1) myIds.push(pl.id); });
  if (typeof fbMemberCache !== "undefined") {
    Object.keys(fbMemberCache).forEach(function(k) {
      var m = fbMemberCache[k];
      if ((m.claimedFrom === pid || m.id === pid || k === pid) && myIds.indexOf(k) === -1) myIds.push(k);
      if (k === pid && m.claimedFrom && myIds.indexOf(m.claimedFrom) === -1) myIds.push(m.claimedFrom);
    });
  }
  PB.getPlayers().forEach(function(opp) {
    if (myIds.indexOf(opp.id) !== -1) return; // Skip self (all aliases)
    var h2h = calcH2H(pid, opp.id);
    var total = h2h.p1wins + h2h.p2wins + h2h.ties;
    if (total === 0) return; // Skip opponents with no shared rounds
    h2hHasMatches = true;
    var record = h2h.p1wins + ' — ' + h2h.p2wins + (h2h.ties ? ' — ' + h2h.ties + 'T' : '');
    var color = h2h.p1wins > h2h.p2wins ? 'var(--birdie)' : h2h.p2wins > h2h.p1wins ? 'var(--red)' : 'var(--gold)';
    h2hContent += '<div class="h2h-row" style="cursor:pointer" onclick="showRivalryDetail(\'' + pid + '\',\'' + opp.id + '\')"><div class="h2h-left">' + renderAvatar(opp, 28, false) + '<span class="h2h-name">' + renderUsername(opp, '', false) + '</span></div><span class="h2h-record" style="color:' + color + '">' + record + '</span></div>';
  });
  if (!h2hHasMatches) {
    h2hContent = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No head-to-head matches yet. Play the same course on the same day as another member!</div>';
  }
  h += profSection("h2h-" + pid, "Head to head", h2hContent, h2hHasMatches);

  // === ALL ROUNDS (collapsible) ===
  if (rounds.length > 3) {
    var allContent = '<div style="max-height:500px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    rounds.slice().sort(function(a,b){ return (b.date||"") > (a.date||"") ? 1 : (b.date||"") < (a.date||"") ? -1 : 0; }).forEach(function(r) {
      var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
      allContent += '<div class="club-row" style="padding:10px 12px;cursor:pointer" onclick="Router.go(\'rounds\',{roundId:\'' + r.id + '\'})"><span class="club-name">' + escHtml(r.course) + ' · ' + r.date + fmtLabel + '</span><span class="club-yd">' + r.score + '</span></div>';
    });
    allContent += '</div>';
    h += profSection("allrounds-" + pid, "All rounds (" + rounds.length + ")", allContent, false);
  }
  h += '</div>'; // close ptab-social

  document.querySelector('[data-page="members"]').innerHTML = h;
  setTimeout(initCountAnimations, 50);

  // Async load ParCoin transaction history
  var histEl = document.getElementById("parcoin-history-" + pid);
  if (histEl) {
    loadTransactionHistory(pid, 10).then(function(txns) {
      if (!txns.length) {
        histEl.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">No earnings yet — play a round to start earning!</div>';
        return;
      }
      var th = '';
      txns.forEach(function(t) {
        var dateStr = "";
        if (t.createdAt && t.createdAt.toDate) {
          var d = t.createdAt.toDate();
          dateStr = (d.getMonth()+1) + "/" + d.getDate();
        }
        th += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
        th += '<div style="flex:1;min-width:0"><div style="font-size:11px;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(t.label || t.reason) + '</div>';
        if (dateStr) th += '<div style="font-size:9px;color:var(--muted2)">' + dateStr + '</div>';
        th += '</div>';
        th += '<div style="font-size:13px;font-weight:700;color:var(--gold);flex-shrink:0;margin-left:8px">+' + t.amount + '</div>';
        th += '</div>';
      });
      histEl.innerHTML = '<div class="card"><div class="card-body" style="padding:10px 14px">' + th + '</div></div>';
    });
  }
}

/* Handicap graph builder */
function buildHandicapGraph(rounds, pid) {
  // Build monthly handicap data
  var sorted = rounds.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  if (!sorted.length) return '';

  var startDate = new Date(sorted[0].date);
  var now = new Date();
  var months = [];
  var d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (d <= now) {
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()], rounds: [] });
    d.setMonth(d.getMonth() + 1);
  }

  sorted.forEach(function(r) {
    var rd = new Date(r.date);
    var m = months.find(function(mo) { return mo.year === rd.getFullYear() && mo.month === rd.getMonth(); });
    if (m) m.rounds.push(r);
  });

  var lastHcap = null;
  var inactiveMonths = 0;
  var needsReactivation = false;
  var reactivationRounds = 0;
  var graphData = [];

  months.forEach(function(m) {
    var isSeason = m.month >= 2 && m.month <= 8;
    if (m.rounds.length > 0) {
      if (needsReactivation) {
        reactivationRounds += m.rounds.length;
        if (reactivationRounds >= 3) { needsReactivation = false; reactivationRounds = 0; }
      }
      var roundsToDate = sorted.filter(function(r) {
        var rd = new Date(r.date);
        return rd <= new Date(m.year, m.month + 1, 0);
      });
      lastHcap = PB.calcHandicap(roundsToDate);
      inactiveMonths = 0;
    } else {
      if (isSeason) inactiveMonths++;
      if (isSeason && inactiveMonths >= 3 && !needsReactivation) { needsReactivation = true; reactivationRounds = 0; }
    }
    graphData.push({ label: m.label, hcap: needsReactivation ? null : lastHcap, inactive: needsReactivation, roundCount: m.rounds.length });
  });

  if (graphData.length > 12) graphData = graphData.slice(-12);

  var validPts = graphData.filter(function(g) { return g.hcap !== null; });
  if (!validPts.length) return '<div style="padding:12px;font-size:12px;color:var(--muted);text-align:center">Not enough data for graph</div>';

  // Single data point — clean text, graph builds with more months
  if (validPts.length === 1) {
    var totalRds = graphData.reduce(function(a,g){return a+g.roundCount},0);
    var result = '<div style="display:flex;justify-content:center;gap:20px;padding:8px 0;font-size:10px;color:var(--muted2)">';
    result += '<div>' + totalRds + ' qualifying round' + (totalRds !== 1 ? 's' : '') + '</div>';
    result += '<div style="color:var(--birdie)">Tap Score Differentials below for details</div>';
    result += '</div>';
    result += '<div style="text-align:center;font-size:10px;color:var(--muted);padding:4px 0 8px">Trend graph builds as you play across multiple months</div>';
    return result;
  }

  var minH = Math.floor(Math.min.apply(null, validPts.map(function(g) { return g.hcap; })) - 2);
  var maxH = Math.ceil(Math.max.apply(null, validPts.map(function(g) { return g.hcap; })) + 2);
  if (maxH - minH < 5) { minH -= 2; maxH += 3; }
  var range = maxH - minH;

  var svgW = 320, svgH = 165, padL = 32, padR = 14, padT = 22, padB = 40;
  var chartW = svgW - padL - padR, chartH = svgH - padT - padB;
  var gradId = "hcapGrad_" + pid;

  var svg = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto;display:block">';

  // Gradient definition for area fill
  svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">';
  svg += '<stop offset="0%" stop-color="rgba(var(--gold-rgb),.25)"/>';
  svg += '<stop offset="100%" stop-color="rgba(var(--gold-rgb),0)"/>';
  svg += '</linearGradient></defs>';

  // Dashed grid lines + Y-axis labels
  var gridSteps = 4;
  for (var g = 0; g <= gridSteps; g++) {
    var gy = padT + (chartH / gridSteps) * g;
    var val = maxH - (range / gridSteps) * g;
    svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (svgW - padR) + '" y2="' + gy + '" stroke="rgba(255,255,255,.06)" stroke-width=".5" stroke-dasharray="3,3"/>';
    svg += '<text x="' + (padL - 5) + '" y="' + (gy + 3) + '" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="7.5" font-weight="500">' + val.toFixed(0) + '</text>';
  }

  // Month labels + round count
  graphData.forEach(function(pt, i) {
    var x = padL + (chartW / (graphData.length - 1 || 1)) * i;
    var isActive = pt.hcap !== null;
    svg += '<text x="' + x + '" y="' + (svgH - 16) + '" text-anchor="middle" fill="' + (isActive ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)') + '" font-size="7" font-weight="500">' + pt.label + '</text>';
    if (pt.roundCount > 0) {
      svg += '<text x="' + x + '" y="' + (svgH - 6) + '" text-anchor="middle" fill="rgba(var(--gold-rgb),.4)" font-size="6" font-weight="500">' + pt.roundCount + ' rd' + (pt.roundCount !== 1 ? 's' : '') + '</text>';
    }
  });

  // Build coordinate arrays
  var coords = [];
  graphData.forEach(function(pt, i) {
    if (pt.hcap === null) return;
    var x = padL + (chartW / (graphData.length - 1 || 1)) * i;
    var y = padT + chartH - ((pt.hcap - minH) / range) * chartH;
    coords.push({ x: x, y: y, hcap: pt.hcap, label: pt.label, inactive: pt.inactive, isLast: false });
  });
  if (coords.length) coords[coords.length - 1].isLast = true;

  // Area fill (gradient under line)
  if (coords.length > 1) {
    var areaPath = 'M' + coords[0].x + ',' + coords[0].y;
    for (var ai = 1; ai < coords.length; ai++) areaPath += 'L' + coords[ai].x + ',' + coords[ai].y;
    areaPath += 'L' + coords[coords.length-1].x + ',' + (padT + chartH) + 'L' + coords[0].x + ',' + (padT + chartH) + 'Z';
    svg += '<path d="' + areaPath + '" fill="url(#' + gradId + ')"/>';
  }

  // Line path
  if (coords.length > 1) {
    var linePath = 'M' + coords[0].x + ',' + coords[0].y;
    for (var li = 1; li < coords.length; li++) linePath += 'L' + coords[li].x + ',' + coords[li].y;
    svg += '<path d="' + linePath + '" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  }

  // Dots with value labels
  coords.forEach(function(pt) {
    var dotR = pt.isLast ? 4 : 3;
    var dotColor = pt.inactive ? 'var(--red)' : 'var(--gold)';
    // Glow ring on current month
    if (pt.isLast) {
      svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="8" fill="rgba(var(--gold-rgb),.12)" stroke="none"/>';
    }
    svg += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="' + dotR + '" fill="' + dotColor + '" stroke="var(--bg)" stroke-width="1.5"/>';
    // Value label above dot
    svg += '<text x="' + pt.x + '" y="' + (pt.y - 8) + '" text-anchor="middle" fill="' + (pt.isLast ? 'var(--gold)' : 'rgba(255,255,255,.5)') + '" font-size="' + (pt.isLast ? '8' : '7') + '" font-weight="' + (pt.isLast ? '700' : '500') + '">' + pt.hcap.toFixed(1) + '</text>';
  });

  svg += '</svg>';

  var result = '<div style="padding:4px 0 0">' + svg + '</div>';

  // Compact legend
  result += '<div style="display:flex;justify-content:center;gap:16px;padding:2px 12px 8px;font-size:9px;color:var(--muted2)">';
  result += '<span>● Index over time</span>';
  result += '<span style="color:var(--birdie)">↓ Lower = better</span>';
  var totalGraphRounds = graphData.reduce(function(a,g){return a+g.roundCount},0);
  result += '<span>' + totalGraphRounds + ' round' + (totalGraphRounds !== 1 ? 's' : '') + '</span>';
  result += '</div>';

  // Trend status
  var currentHcap = graphData[graphData.length - 1];
  if (currentHcap.inactive) {
    result += '<div style="padding:8px 12px;background:rgba(var(--red-rgb),.06);border:1px solid rgba(var(--red-rgb),.15);border-radius:var(--radius);font-size:11px;color:var(--red);margin-top:2px">Inactive — log 3 rounds to reactivate handicap</div>';
  } else if (validPts.length >= 2) {
    var first = validPts[0].hcap, last = validPts[validPts.length - 1].hcap;
    var diff = last - first;
    var trend = diff < -1 ? '↓ Improving' : diff > 1 ? '↑ Rising' : '→ Steady';
    var trendColor = diff < -1 ? 'var(--birdie)' : diff > 1 ? 'var(--red)' : 'var(--gold)';
    var trendDiff = diff < 0 ? diff.toFixed(1) : '+' + diff.toFixed(1);
    result += '<div style="text-align:center;font-size:11px;color:' + trendColor + ';letter-spacing:.3px">' + trend + ' <span style="font-weight:600">(' + trendDiff + ')</span></div>';
  }

  return result;
}

function renderMemberEdit(pid) {
  // Only allow editing your own profile
  if (currentUser && pid !== currentUser.uid) {
    Router.toast("You can only edit your own profile");
    Router.go("members", { id: pid });
    return;
  }
  
  var p = PB.getPlayer(pid);
  // Merge currentProfile data (has latest equippedTitle, cosmetics, etc.)
  if (p && currentProfile && (pid === currentUser.uid || pid === (currentProfile.claimedFrom || ""))) {
    p = Object.assign({}, p, {equippedTitle: currentProfile.equippedTitle, equippedCosmetics: currentProfile.equippedCosmetics, ownedCosmetics: currentProfile.ownedCosmetics, displayBadges: currentProfile.displayBadges});
  }

  // If not in local data, try Firebase
  if (!p && db && pid) {
    db.collection("members").doc(pid).get().then(function(doc) {
      if (doc.exists) {
        renderMemberEditForm(doc.data());
      } else {
        Router.toast("Profile not found");
        renderMemberList();
      }
    }).catch(function() { renderMemberList(); });
    document.querySelector('[data-page="members"]').innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';
    return;
  }
  if (!p) { renderMemberList(); return; }
  renderMemberEditForm(p);
}

function renderMemberEditForm(p) {
  var pid = p.id;
  // Only allow editing own profile
  var isOwn = currentUser && (pid === currentUser.uid || (currentProfile && pid === currentProfile.claimedFrom));
  var isComm = currentProfile && currentProfile.role === "commissioner";
  if (!isOwn && !isComm) {
    Router.toast("You can only edit your own profile");
    Router.go("members", { id: pid });
    return;
  }
  var clubLabels = {driver:"Driver",three_wood:"3 Wood",four_wood:"4 Wood",five_wood:"5 Wood",seven_wood:"7 Wood",nine_wood:"9 Wood",two_hybrid:"2 Hybrid",three_hybrid:"3 Hybrid",four_hybrid:"4 Hybrid",five_hybrid:"5 Hybrid",six_hybrid:"6 Hybrid",two_iron:"2 Iron",three_iron:"3 Iron",four_iron:"4 Iron",five_iron:"5 Iron",six_iron:"6 Iron",seven_iron:"7 Iron",eight_iron:"8 Iron",nine_iron:"9 Iron",pw:"PW",aw:"AW (48-50)",gw:"GW (50-52)",gap52:"52°",sw:"SW (54-56)",gap56:"56°",gap58:"58°",lw:"LW (60°)",gap64:"64°",putter:"Putter"};

  var h = '<div class="sh"><h2>Edit profile</h2><button class="back" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">← Back</button></div>';

  h += '<div class="form-section"><div class="form-title">Basic info</div>';
  h += formField("Display name", "edit-name", p.name, "text");
  h += formField("Username", "edit-username", p.username || "", "text", "Permanent · Cannot be changed");
  h += '<div class="ff"><label class="ff-label">Username</label><div class="ff-input" style="background:var(--bg4);color:var(--muted)">' + escHtml(p.username || "") + ' <span style="font-size:9px">(permanent)</span></div></div>';
  h += formField("Nickname", "edit-nick", p.nick || "", "text", "e.g. The Commissioner");
  
  // Display name preference
  h += '<div class="ff"><label class="ff-label">Show on scorecards & feed as</label><select class="ff-input" id="edit-displayPref">';
  h += '<option value="name"' + ((p.displayPref||"name")==="name"?" selected":"") + '>Display Name (' + escHtml(p.name) + ')</option>';
  h += '<option value="username"' + (p.displayPref==="username"?" selected":"") + '>Username (' + escHtml(p.username||"") + ')</option>';
  h += '<option value="nick"' + (p.displayPref==="nick"?" selected":"") + '>Nickname (' + escHtml(p.nick||p.name) + ')</option>';
  h += '</select></div>';
  h += formField("Score range", "edit-range", p.range || "", "text", "e.g. 85-95");
  
  // Equipped title selector
  var lvl = PB.getPlayerLevel(pid);
  var availableTitles = [];
  var TITLES = {1:"Rookie",5:"Weekend Warrior",10:"Range Rat",15:"Fairway Finder",20:"Club Member",25:"Course Regular",30:"Low Handicapper",35:"Scratch Aspirant",40:"Ironman",45:"Birdie Hunter",50:"Eagle Eye",55:"Tour Wannabe",60:"Golf Addict",65:"Links Legend",70:"Course Conqueror",75:"The Professor",80:"Hall of Famer",85:"Living Legend",90:"Immortal",95:"Transcendent",100:"G.O.A.T."};
  var titleKeys = [1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
  titleKeys.forEach(function(lv) { if (lvl.level >= lv) availableTitles.push(TITLES[lv]); });
  if (p.founding) availableTitles.push("The Original Four");
  if (p.founding) availableTitles.push("The Original Four · Commissioner");
  
  // Add titles from achievements
  var myAchievements = PB.getAchievements(pid);
  myAchievements.forEach(function(a) {
    if (a.title && availableTitles.indexOf(a.title) === -1) availableTitles.push(a.title);
  });
  
  h += '<div class="ff"><label class="ff-label">Equipped title</label><select class="ff-input" id="edit-title">';
  h += '<option value="">— Select title —</option>';
  availableTitles.forEach(function(t) {
    h += '<option value="' + t + '"' + ((p.equippedTitle === t) ? ' selected' : '') + '>' + t + '</option>';
  });
  h += '</select></div>';

  // Ring selector — show owned rings from cosmetics
  var ownedCosmetics = p.ownedCosmetics || [];
  var equippedRing = (p.equippedCosmetics && p.equippedCosmetics.border) || "";
  var equippedBanner = (p.equippedCosmetics && p.equippedCosmetics.banner) || "";
  var allRings = (typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : []).filter(function(c) { return c.cat === "border" && (ownedCosmetics.indexOf(c.id) !== -1 || c.price === 0); });
  if (allRings.length) {
    h += '<div class="ff"><label class="ff-label">Avatar ring</label>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    // None option
    h += '<div onclick="document.getElementById(\'edit-ring\').value=\'\';document.querySelectorAll(\'.ring-opt\').forEach(function(e){e.style.borderColor=\'var(--border)\'});this.style.borderColor=\'var(--gold)\'" class="ring-opt" style="cursor:pointer;padding:8px 12px;border:2px solid ' + (!equippedRing ? 'var(--gold)' : 'var(--border)') + ';border-radius:var(--radius);font-size:10px;color:var(--muted)">None</div>';
    allRings.forEach(function(ring) {
      var isEquipped = equippedRing === ring.id;
      h += '<div onclick="document.getElementById(\'edit-ring\').value=\'' + ring.id + '\';document.querySelectorAll(\'.ring-opt\').forEach(function(e){e.style.borderColor=\'var(--border)\'});this.style.borderColor=\'var(--gold)\'" class="ring-opt" style="cursor:pointer;padding:6px;border:2px solid ' + (isEquipped ? 'var(--gold)' : 'var(--border)') + ';border-radius:var(--radius);display:flex;align-items:center;gap:6px">';
      h += '<div style="width:28px;height:28px;border-radius:50%;border:' + ring.css + ';background:var(--bg3)"></div>';
      h += '<span style="font-size:10px;color:var(--cream)">' + ring.name + '</span></div>';
    });
    h += '</div>';
    h += '<input type="hidden" id="edit-ring" value="' + equippedRing + '"></div>';
  }

  // Banner selector — show owned banners
  var allBanners = (typeof COSMETICS_CATALOG !== "undefined" ? COSMETICS_CATALOG : []).filter(function(c) { return c.cat === "banner" && (ownedCosmetics.indexOf(c.id) !== -1 || c.price === 0); });
  if (allBanners.length) {
    h += '<div class="ff"><label class="ff-label">Profile banner</label>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    h += '<div onclick="document.getElementById(\'edit-banner\').value=\'\';document.querySelectorAll(\'.banner-opt\').forEach(function(e){e.style.outline=\'none\'});this.style.outline=\'2px solid var(--gold)\'" class="banner-opt" style="cursor:pointer;width:60px;height:24px;border-radius:4px;background:var(--bg3);' + (!equippedBanner ? 'outline:2px solid var(--gold)' : '') + ';display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--muted)">None</div>';
    allBanners.forEach(function(b) {
      var isEquipped = equippedBanner === b.id;
      h += '<div onclick="document.getElementById(\'edit-banner\').value=\'' + b.id + '\';document.querySelectorAll(\'.banner-opt\').forEach(function(e){e.style.outline=\'none\'});this.style.outline=\'2px solid var(--gold)\'" class="banner-opt" style="cursor:pointer;width:60px;height:24px;border-radius:4px;background:' + b.css + ';' + (isEquipped ? 'outline:2px solid var(--gold)' : '') + '" title="' + escHtml(b.name) + '"></div>';
    });
    h += '</div>';
    h += '<input type="hidden" id="edit-banner" value="' + equippedBanner + '"></div>';
  }

  h += '<div style="text-align:center;margin:4px 0 12px"><span style="font-size:10px;color:var(--gold);cursor:pointer" onclick="Router.go(\'shop\')">More cosmetics in the Shop →</span></div>';

  h += '<div class="ff"><label class="ff-label">Bio</label><textarea class="ff-input" id="edit-bio" placeholder="Tell us about your game...">' + (p.bio || "") + '</textarea></div>';
  h += '<div class="ff"><label class="ff-label">Profile photo</label>';
  h += '<div style="margin-bottom:8px"><button class="btn-sm outline" style="font-size:11px" onclick="uploadMemberPhoto(\'' + pid + '\')">Upload photo</button></div>';
  h += '<div class="ff-label" style="margin-top:8px;margin-bottom:6px">Or choose a default</div>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
  var stockAvatars = ["stock_profile_gold.jpg","stock_profile_green.jpg","stock_profile_navy.jpg","stock_profile_charcoal.jpg","stock_profile_red.jpg","stock_profile_teal.jpg"];
  stockAvatars.forEach(function(src) {
    var selected = p.stockAvatar === src ? 'border:2px solid var(--gold);' : 'border:2px solid var(--border);';
    h += '<div onclick="selectStockAvatar(\'' + pid + '\',\'' + src + '\')" style="width:44px;height:44px;border-radius:50%;overflow:hidden;cursor:pointer;' + selected + 'flex-shrink:0"><img alt="" src="' + src + '" style="width:100%;height:100%;object-fit:cover"></div>';
  });
  h += '</div></div>';
  h += '</div>';

  // Course preferences with search
  h += '<div class="form-section"><div class="form-title">Course preferences</div>';
  h += '<div class="ff"><label class="ff-label">Home course</label><input class="ff-input" id="edit-homecourse" value="' + (p.homeCourse || "").replace(/"/g, "&quot;") + '" placeholder="Start typing to search..." oninput="showCourseSearch(this,\'home\')"><div id="search-home" class="search-results"></div></div>';
  h += '<div class="ff"><label class="ff-label">Favorite course</label><input class="ff-input" id="edit-favcourse" value="' + (p.favoriteCourse || "").replace(/"/g, "&quot;") + '" placeholder="Start typing to search..." oninput="showCourseSearch(this,\'fav\')"><div id="search-fav" class="search-results"></div></div>';
  h += '</div>';

  // Bag photo
  h += '<div class="form-section"><div class="form-title">What\'s in the bag</div>';
  if (p.bagPhoto) h += '<div style="border-radius:8px;overflow:hidden;margin-bottom:8px;max-height:200px"><img alt="" src="' + p.bagPhoto + '" style="width:100%;display:block"></div>';
  h += '<div class="ff"><label class="ff-label">Bag photo</label><input type="file" accept="image/*" id="edit-bagphoto" style="color:var(--muted);font-size:12px"></div>';
  var bagLabels = {driver:"Driver",irons:"Irons",wedges:"Wedges",putter:"Putter",bag_brand:"Bag",accessories:"Accessories",fav_ball:"Favorite Ball"};
  Object.keys(bagLabels).forEach(function(k) {
    h += formField(bagLabels[k], "edit-bag-" + k, (p.bag && p.bag[k]) || "", "text", "e.g. TaylorMade Qi4D");
  });
  h += '</div>';

  h += '<div class="form-section"><div class="form-title" onclick="toggleSection(\'edit-clubs\')" style="cursor:pointer">Club distances (yards) <span id="edit-clubs-toggle" style="font-size:12px;color:var(--muted)"><svg viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg></span></div>';
  h += '<div id="edit-clubs">';
  Object.keys(clubLabels).forEach(function(k) {
    h += formField(clubLabels[k], "edit-club-" + k, (p.clubs && p.clubs[k]) || "", "number", "0");
  });
  h += '</div></div>';

  h += '<div class="form-section"><div class="form-title">Known for</div>';
  var facts = p.funnyFacts || [];
  for (var i = 0; i < 5; i++) {
    h += formField("Fact " + (i + 1), "edit-fact-" + i, facts[i] || "", "text", "e.g. Lost 3 balls on one hole");
  }
  h += '</div>';

  h += '<div class="form-section"><button class="btn full green" onclick="saveMemberEdit(\'' + pid + '\')">Save changes</button>';
  h += '<button class="btn full outline" style="margin-top:8px" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">Cancel</button></div>';

  document.querySelector('[data-page="members"]').innerHTML = h;
}

function saveMemberEdit(pid) {
  var clubs = {};
  var clubKeys = ["driver","three_wood","four_wood","five_wood","seven_wood","nine_wood","two_hybrid","three_hybrid","four_hybrid","five_hybrid","six_hybrid","two_iron","three_iron","four_iron","five_iron","six_iron","seven_iron","eight_iron","nine_iron","pw","aw","gw","gap52","sw","gap56","gap58","lw","gap64","putter"];
  clubKeys.forEach(function(k) {
    var v = document.getElementById("edit-club-" + k);
    if (v && v.value) clubs[k] = v.value;
  });
  var bag = {};
  var bagKeys = ["driver","irons","wedges","putter","bag_brand","accessories","fav_ball"];
  bagKeys.forEach(function(k) {
    var v = document.getElementById("edit-bag-" + k);
    if (v && v.value) bag[k] = v.value;
  });
  var facts = [];
  for (var i = 0; i < 5; i++) {
    var v = document.getElementById("edit-fact-" + i);
    if (v && v.value) facts.push(v.value);
  }
  var updates = {
    name: document.getElementById("edit-name").value,
    username: document.getElementById("edit-username").value,
    nick: document.getElementById("edit-nick").value,
    displayPref: document.getElementById("edit-displayPref").value,
    equippedTitle: document.getElementById("edit-title").value,
    equippedCosmetics: {
      border: document.getElementById("edit-ring") ? document.getElementById("edit-ring").value : ((currentProfile && currentProfile.equippedCosmetics) ? currentProfile.equippedCosmetics.border : ""),
      banner: document.getElementById("edit-banner") ? document.getElementById("edit-banner").value : ((currentProfile && currentProfile.equippedCosmetics) ? currentProfile.equippedCosmetics.banner : ""),
      card: (currentProfile && currentProfile.equippedCosmetics) ? (currentProfile.equippedCosmetics.card || "") : ""
    },
    range: document.getElementById("edit-range").value,
    bio: document.getElementById("edit-bio").value,
    homeCourse: document.getElementById("edit-homecourse").value,
    favoriteCourse: document.getElementById("edit-favcourse").value,
    clubs: clubs,
    bag: bag,
    funnyFacts: facts
  };

  // Validate username and nickname uniqueness before saving
  if (!updates.username || updates.username.trim().length < 3) {
    Router.toast("Username must be 3+ characters");
    return;
  }

  var checkUniqueness = Promise.resolve();
  if (db) {
    checkUniqueness = db.collection("members").get().then(function(snap) {
      var conflicts = [];
      snap.forEach(function(doc) {
        if (doc.id === pid) return; // Skip self
        var m = doc.data();
        if (m.username && updates.username && m.username.toLowerCase() === updates.username.toLowerCase()) {
          conflicts.push("Username '" + updates.username + "' is already taken by " + (m.name || "another member"));
        }
        if (updates.nick && updates.nick.trim() !== "" && m.nick && m.nick.toLowerCase() === updates.nick.toLowerCase()) {
          conflicts.push("Nickname '" + updates.nick + "' is already taken by " + (m.name || "another member"));
        }
      });
      if (conflicts.length) {
        return Promise.reject(conflicts[0]);
      }
    });
  }

  checkUniqueness.then(function() {
    doSaveMemberEdit(pid, updates);
  }).catch(function(err) {
    if (typeof err === "string") {
      Router.toast(err);
    } else {
      // Firestore error — proceed anyway
      doSaveMemberEdit(pid, updates);
    }
  });
}

function doSaveMemberEdit(pid, updates) {
  // Get old name before saving to detect changes
  var oldPlayer = PB.getPlayer(pid);
  var oldName = oldPlayer ? (oldPlayer.name || oldPlayer.username) : null;
  var oldUsername = oldPlayer ? oldPlayer.username : null;
  var newDisplayName = PB.getDisplayName ? PB.getDisplayName(Object.assign({}, oldPlayer || {}, updates)) : updates.name;
  
  // Check if name actually changed
  var nameChanged = oldName && updates.name && oldName !== updates.name;
  var usernameChanged = oldUsername && updates.username && oldUsername !== updates.username;

  // Determine the correct Firestore doc ID to write to
  // Could be editing own profile (pid = uid) or commissioner editing another member
  // Also handles founding members whose Firestore doc ID differs from their seed ID
  function getFirestoreDocId() {
    if (currentUser && pid === currentUser.uid) return currentUser.uid;
    // Check fbMemberCache for the Firestore UID that claimedFrom matches pid
    if (typeof fbMemberCache !== "undefined") {
      var cached = fbMemberCache[pid];
      if (cached && cached.id) return cached.id;
    }
    return pid; // fallback
  }

  function writeToFirestore(finalUpdates) {
    if (!db) return;
    var docId = getFirestoreDocId();
    var fsUpdates = Object.assign({}, finalUpdates, { updatedAt: fsTimestamp() });
    db.collection("members").doc(docId).set(fsUpdates, { merge: true }).then(function() {
      // Keep currentProfile in sync if this is the logged-in user
      if (currentUser && (docId === currentUser.uid || pid === currentUser.uid)) {
        currentProfile = Object.assign(currentProfile || {}, fsUpdates);
      }
      pbLog("[Profile] Saved to Firestore:", docId);
    }).catch(function(e) { pbWarn("[Profile] Firestore save failed:", e.message); });
  }

  var bagInput = document.getElementById("edit-bagphoto");
  if (bagInput && bagInput.files && bagInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var maxW = 400, maxH = 300;
        var ratio = Math.min(maxW / img.width, maxH / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        updates.bagPhoto = canvas.toDataURL("image/jpeg", 0.7);
        PB.updatePlayer(pid, updates);
        writeToFirestore(updates);
        if (nameChanged) propagateNameChange(pid, oldName, updates.name);
        Router.toast("Profile saved!");
        Router.go("members", { id: pid });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(bagInput.files[0]);
  } else {
    PB.updatePlayer(pid, updates);
    writeToFirestore(updates);
    if (nameChanged) propagateNameChange(pid, oldName, updates.name);
    Router.toast("Profile saved!");
    Router.go("members", { id: pid });
  }
}

// Propagate name changes across all historical Firestore data
function propagateNameChange(uid, oldName, newName) {
  if (!db || !uid || !oldName || !newName || oldName === newName) return;
  pbLog("[Name] Propagating:", oldName, "→", newName);
  
  var updates = 0;
  
  // 1. Chat messages — authorName
  leagueQuery("chat").where("authorId","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) {
      batch.update(doc.ref, { authorName: newName });
      updates++;
    });
    return batch.commit();
  }).then(function() {
    pbLog("[Name] Chat updated");
  }).catch(function(e) { pbWarn("[Name] Chat failed:", e.message); });
  
  // 2. Rounds — playerName
  leagueQuery("rounds").where("playerId","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) {
      batch.update(doc.ref, { playerName: newName });
      updates++;
    });
    return batch.commit();
  }).catch(function(e) { pbWarn("[Name] Rounds failed:", e.message); });
  
  // 3. Tee times — createdByName
  leagueQuery("teetimes").where("createdBy","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) {
      batch.update(doc.ref, { createdByName: newName });
      updates++;
    });
    return batch.commit();
  }).catch(function(e) { pbWarn("[Name] Tee times failed:", e.message); });
  
  // 4. Party games — createdByName and winnerName
  db.collection("partygames").where("createdBy","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) { batch.update(doc.ref, { createdByName: newName }); updates++; });
    return batch.commit();
  }).catch(function() {});
  
  db.collection("partygames").where("winner","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) { batch.update(doc.ref, { winnerName: newName }); updates++; });
    return batch.commit();
  }).catch(function() {});
  
  // 5. Invites — createdByName
  leagueQuery("invites").where("createdBy","==",uid).get().then(function(snap) {
    if (snap.empty) return;
    var batch = db.batch();
    snap.forEach(function(doc) { batch.update(doc.ref, { createdByName: newName }); updates++; });
    return batch.commit();
  }).catch(function() {});
  
  // 6. Synced rounds — update player name inside the players map
  leagueQuery("syncrounds").get().then(function(snap) {
    snap.forEach(function(doc) {
      var data = doc.data();
      if (data.players && data.players[uid]) {
        var update = {};
        update["players." + uid + ".name"] = newName;
        doc.ref.update(update);
        updates++;
      }
      if (data.createdBy === uid) {
        doc.ref.update({ createdByName: newName });
      }
    });
  }).catch(function() {});
  
  // 7. Attestations — update player name inside attestations map
  db.collection("attestations").get().then(function(snap) {
    snap.forEach(function(doc) {
      var data = doc.data();
      if (data.attestations && data.attestations[uid]) {
        var update = {};
        update["attestations." + uid + ".name"] = newName;
        doc.ref.update(update);
        updates++;
      }
      if (data.standings) {
        var newStandings = data.standings.map(function(s) {
          if (s.id === uid) s.name = newName;
          return s;
        });
        doc.ref.update({ standings: newStandings });
      }
    });
  }).catch(function() {});
  
  // 8. Comments in chat — update name in comment arrays
  leagueQuery("chat").get().then(function(snap) {
    snap.forEach(function(doc) {
      var data = doc.data();
      if (data.comments && data.comments.length) {
        var changed = false;
        var newComments = data.comments.map(function(c) {
          if (c.uid === uid) { c.name = newName; changed = true; }
          return c;
        });
        if (changed) doc.ref.update({ comments: newComments });
      }
    });
  }).catch(function() {});
  
  setTimeout(function() { pbLog("[Name] Propagation complete. ~" + updates + " documents updated."); }, 3000);
}

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
  
  var isComm = currentProfile.role === "commissioner";
  var invitesLeft = isComm ? 999 : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
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
    h += '<div style="font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:12px">You\'ve used all ' + (currentProfile.maxInvites||3) + ' invites. Ask the Commissioner for more, or have them send an invite on your behalf.</div>';
    h += '<button class="btn full outline" onclick="requestInviteFromCommissioner()">Ask Commissioner for Invite</button>';
    h += '</div>';
  }
  return h;
}

function requestInviteFromCommissioner() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready"); return; }
  // Find commissioner
  var players = PB.getPlayers();
  var commissioner = players.find(function(p) { return p.role === "commissioner"; });
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
  var isComm = currentProfile.role === "commissioner";
  var invitesLeft = isComm ? 999 : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  
  if (invitesLeft <= 0 && !isComm) {
    Router.toast("No invites remaining");
    return;
  }
  Router.go("members", { add: true });
}

function renderAddMemberForm() {
  var isComm = currentProfile && currentProfile.role === "commissioner";
  var invitesLeft = isComm ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  
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
      h += '<option value="' + p.name + '">' + p.name + (p.founding ? '' : '') + '</option>';
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
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready — try refreshing"); return; }
  var isComm = currentProfile.role === "commissioner";
  if (!isComm && (currentProfile.invitesUsed||0) >= (currentProfile.maxInvites||3)) { Router.toast("No invites remaining"); return; }
  
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; var code = "PB-";
  for (var i=0;i<8;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  var memberDocId = currentProfile.docId || currentUser.uid;
  var inviteLink = "https://alrightlad.github.io/smoky-mountain-open/?invite=" + code;
  
  // Show loading state
  var resultEl = document.getElementById("memberInviteResult");
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">Generating...</div>';
  
  db.collection("invites").doc(code).set({ code:code, createdBy:currentUser.uid, createdByName:currentProfile.name||currentProfile.username, usedBy:null, status:"active", createdAt:fsTimestamp() })
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
  var isComm = currentProfile && currentProfile.role === "commissioner";
  var newLeft = isComm ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0));
  var countEl = document.getElementById("inviteCountDisplay");
  if (countEl) countEl.textContent = "Invites remaining: " + newLeft;
  resultEl.innerHTML = '<div class="invite-code">'
    + '<div class="code">' + code + '</div>'
    + '<div style="margin:10px 0 6px"><input type="text" readonly value="' + inviteLink + '" id="inviteLinkField" style="width:100%;font-size:10px;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);text-align:center;font-family:monospace" onclick="this.select()"></div>'
    + '<button class="btn full outline" onclick="copyInviteLink()" style="font-size:11px;padding:10px;margin-top:4px" id="copyInviteBtn">Copy invite link</button>'
    + '<div class="hint" style="margin-top:8px">Send this link — the code auto-fills when they open it</div>'
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
    if (badges.length >= 3) { Router.toast("Max 3 badges — remove one first"); return; }
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
  var lvl = PB.getPlayerLevel(pid);
  var rounds = PB.getPlayerRounds(pid);
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
  header += '<div><div style="font-family:Playfair Display,serif;font-size:14px;font-weight:700;color:#c9a84c;letter-spacing:1px">PARBAUGHS</div>';
  header += '<div style="font-size:8px;color:#7a7e8a;letter-spacing:2px">GOLF LEAGUE PLATFORM</div></div></div>';

  // Player info
  var name = p.username || p.name;
  var title = p.equippedTitle || p.title || "";
  var info = '<div style="text-align:center;margin-bottom:20px">';
  info += '<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:#eae8e0">' + name + '</div>';
  if (title) info += '<div style="font-size:11px;color:#c9a84c;margin-top:4px;font-style:italic">' + title + '</div>';
  info += '<div style="font-size:10px;color:#7a7e8a;margin-top:6px">Level ' + (lvl.level||1) + ' \u00b7 ' + (lvl.name||"Rookie") + '</div>';
  info += '</div>';

  // Stats grid
  var stats = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  stats += '<div style="text-align:center"><div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:#c9a84c">' + (hcap !== null ? hcap : "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Handicap</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:#eae8e0">' + (best || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Best</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:#eae8e0">' + (avg || "\u2014") + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Average</div></div>';
  stats += '<div style="text-align:center"><div style="font-family:Playfair Display,serif;font-size:22px;font-weight:700;color:#eae8e0">' + indiv.length + '</div><div style="font-size:8px;color:#7a7e8a;text-transform:uppercase;letter-spacing:.5px">Rounds</div></div>';
  stats += '</div>';

  // Footer
  var footer = '<div style="text-align:center;padding-top:12px;border-top:1px solid #1e2333;font-size:9px;color:#484d5c">parbaughs.golf/player/' + (p.username || "") + '</div>';

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

