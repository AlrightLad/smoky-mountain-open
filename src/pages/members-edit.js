// Members — Edit subsystem. Extracted per W1.A5 (AMD-027).
// Functions: renderMemberEdit, renderMemberEditForm, saveMemberEdit,
// doSaveMemberEdit, propagateNameChange.

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
  var isComm = isFounderRole(currentProfile);
  if (!isOwn && !isComm) {
    Router.toast("You can only edit your own profile");
    Router.go("members", { id: pid });
    return;
  }
  var clubLabels = {driver:"Driver",three_wood:"3 Wood",four_wood:"4 Wood",five_wood:"5 Wood",seven_wood:"7 Wood",nine_wood:"9 Wood",two_hybrid:"2 Hybrid",three_hybrid:"3 Hybrid",four_hybrid:"4 Hybrid",five_hybrid:"5 Hybrid",six_hybrid:"6 Hybrid",two_iron:"2 Iron",three_iron:"3 Iron",four_iron:"4 Iron",five_iron:"5 Iron",six_iron:"6 Iron",seven_iron:"7 Iron",eight_iron:"8 Iron",nine_iron:"9 Iron",pw:"PW",aw:"AW (48-50)",gw:"GW (50-52)",gap52:"52°",sw:"SW (54-56)",gap56:"56°",gap58:"58°",lw:"LW (60°)",gap64:"64°",putter:"Putter"};

  var h = '<div class="sh"><h2>Edit profile</h2><button class="back" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">← Back</button></div>';

  h += '<div class="form-section"><div class="form-title">Basic info</div>';
  // v8.25.172 (Founder 2026-06-14) — ONE source of truth. Profile photo is changed
  // HERE (not via a floating pencil on the avatar). Username = what shows on the app
  // everywhere; Player name = your real name, optional. The old duplicate-username /
  // nickname / "show as" preference are retired (getDisplayName is now username-first).
  h += '<div class="ff"><label class="ff-label">Profile photo</label>';
  h += '<button type="button" class="btn-sm outline" onclick="uploadMemberPhoto(\'' + pid + '\')" style="display:inline-flex;align-items:center;gap:6px"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M11 2l3 3-8 8H3v-3z"/></svg>Change photo</button></div>';
  h += formField("Username", "edit-username", p.username || "", "text", "What shows on the app · 3+ characters, must be unique");
  h += formField("Player name", "edit-name", p.name || "", "text", "Your real name — optional");
  h += formField("Score range", "edit-range", p.range || "", "text", "e.g. 85-95");
  
  // Equipped title selector
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid));
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

  // v8.25.239 (Founder 2026-06-22: "confusing where to equip / see purchased items").
  // A clear cosmetics section header + a Pro Shop link, so it's obvious this is where
  // you equip what you bought + where to get more. Closes the Basic-info section and
  // opens an Appearance section around the title/ring/banner pickers.
  h += '</div>'; // close Basic info
  h += '<div class="form-section"><div class="form-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px">Appearance &amp; cosmetics<button type="button" class="btn-sm outline" style="font-size:10px;padding:5px 10px" onclick="Router.go(\'shop\')">Pro Shop →</button></div>';
  h += '<div style="font-size:11px;color:var(--cb-mute);margin:-2px 0 12px;line-height:1.4">Equip the titles, rings &amp; banners you\'ve unlocked. Get more in the Pro Shop.</div>';

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

  h += '<div class="ff"><label class="ff-label">Bio</label><textarea class="ff-input" id="edit-bio" placeholder="Tell us about your game...">' + escHtml(p.bio || "") + '</textarea></div>';
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
    // v8.25.172 — nick/displayPref retired from the form (username is the single
    // displayed identity). Preserve any existing nick; pin displayPref to username
    // so any legacy reader stays consistent with getDisplayName.
    nick: (currentProfile && currentProfile.nick) || "",
    displayPref: "username",
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

