/* ================================================
   TRASH TALK & SOCIAL ACTIONS — Spend ParCoins on social mayhem
   Spotlight of Shame, Victory Lap, Demand a Rematch, Welcome Gift
   ================================================ */

var SOCIAL_ACTIONS = {
  spotlight: {label: "Spotlight of Shame", cost: 75, desc: "Pin their worst round to the feed for 24 hours", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>', cooldownHours: 48},
  victorylap: {label: "Victory Lap", cost: 50, desc: "Celebration animation plays on their screen next time they open the app", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4M4 5h16v4a6 6 0 01-6 6h-4a6 6 0 01-6-6V5z"/><path d="M12 15v3M8 21h8"/></svg>', cooldownHours: 24},
  rematch: {label: "Demand a Rematch", cost: 30, desc: "Public challenge in the feed they can't hide from", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', cooldownHours: 12},
  welcome: {label: "Welcome Gift", cost: 0, desc: "Send a starter cosmetic pack to a new member", icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z"/></svg>', cooldownHours: 0}
};

function useSocialAction(actionKey, targetUid) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var action = SOCIAL_ACTIONS[actionKey];
  if (!action) return;
  var uid = currentUser.uid;
  if (targetUid === uid) { Router.toast("You can't target yourself"); return; }

  // Check balance
  if (action.cost > 0) {
    var balance = getParCoinBalance(uid);
    if (balance < action.cost) { Router.toast("Need " + action.cost + " ParCoins (have " + balance + ")"); return; }
  }

  // Check cooldown
  var cooldownKey = actionKey + "_" + uid + "_" + targetUid;
  leagueQuery("social_actions").where("key", "==", cooldownKey).orderBy("createdAt", "desc").limit(1).get().then(function(snap) {
    if (snap.size > 0 && action.cooldownHours > 0) {
      var last = snap.docs[0].data();
      var lastTime = last.createdAt ? last.createdAt.toMillis() : 0;
      var hoursAgo = (Date.now() - lastTime) / (1000 * 60 * 60);
      if (hoursAgo < action.cooldownHours) {
        var hoursLeft = Math.ceil(action.cooldownHours - hoursAgo);
        Router.toast("Cooldown: wait " + hoursLeft + " more hour" + (hoursLeft !== 1 ? "s" : ""));
        return;
      }
    }
    _executeSocialAction(actionKey, targetUid, action, cooldownKey);
  }).catch(function() {
    // If index doesn't exist, just execute
    _executeSocialAction(actionKey, targetUid, action, cooldownKey);
  });
}

function _executeSocialAction(actionKey, targetUid, action, cooldownKey) {
  var uid = currentUser.uid;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
  var target = PB.getPlayer(targetUid);
  var targetName = target ? (target.name || target.username) : "a member";

  // Deduct coins (sink — coins destroyed, not transferred)
  if (action.cost > 0) {
    if (!deductCoins(uid, action.cost, "social_" + actionKey, action.label + " on " + targetName)) return;
  }

  // Log the action (for cooldowns)
  db.collection("social_actions").add({
    key: cooldownKey,
    action: actionKey,
    fromUid: uid,
    fromName: myName,
    toUid: targetUid,
    toName: targetName,
    createdAt: fsTimestamp()
  }).catch(function(){});

  // Type-specific behavior
  if (actionKey === "spotlight") {
    // Find their worst round
    var rounds = PB.getPlayerRounds(targetUid).filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4"; });
    var worst = rounds.length ? rounds.reduce(function(a, b) { return a.score > b.score ? a : b; }) : null;
    var worstDesc = worst ? worst.score + " at " + worst.course + " (" + worst.date + ")" : "their golf game in general";
    db.collection("chat").add({
      id: genId(),
      text: myName + " put " + targetName + " in the SPOTLIGHT OF SHAME for 24 hours. Their worst round: " + worstDesc + ". No hiding from this one.",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp(),
      pinned: true, pinExpires: new Date(Date.now() + 24*60*60*1000).toISOString()
    }).catch(function(){});
  } else if (actionKey === "victorylap") {
    // Store pending celebration for target
    db.collection("pending_celebrations").add({
      toUid: targetUid,
      fromName: myName,
      type: "victory_lap",
      createdAt: fsTimestamp()
    }).catch(function(){});
    db.collection("chat").add({
      id: genId(),
      text: myName + " is taking a VICTORY LAP on " + targetName + "! A celebration animation awaits them.",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }).catch(function(){});
  } else if (actionKey === "rematch") {
    db.collection("chat").add({
      id: genId(),
      text: myName + " DEMANDS A REMATCH against " + targetName + "! This can't be ignored. Who's got next?",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }).catch(function(){});
  } else if (actionKey === "welcome") {
    // Give target a random starter cosmetic
    var starters = ["border_bronze", "banner_sunset", "card_neon"];
    var gift = starters[Math.floor(Math.random() * starters.length)];
    db.collection("members").doc(targetUid).update({
      ownedCosmetics: firebase.firestore.FieldValue.arrayUnion(gift)
    }).catch(function(){});
    db.collection("chat").add({
      id: genId(),
      text: myName + " sent " + targetName + " a Welcome Gift! They unlocked a free cosmetic item.",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }).catch(function(){});
  }

  // Notify target
  sendNotification(targetUid, {
    type: "social_action",
    title: action.label + "!",
    message: myName + " used " + action.label + " on you" + (action.cost > 0 ? " (" + action.cost + " ParCoins)" : ""),
    page: "feed"
  });

  Router.toast(action.label + " sent to " + targetName + "!");
}

// Render social action buttons on a player's profile or H2H page
function renderSocialActions(targetUid) {
  if (!currentUser || targetUid === currentUser.uid) return '';
  var balance = getParCoinBalance(currentUser.uid);
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0">';
  Object.keys(SOCIAL_ACTIONS).forEach(function(key) {
    var a = SOCIAL_ACTIONS[key];
    if (key === "welcome") return; // Welcome is only for new members
    var canAfford = balance >= a.cost;
    h += '<button class="btn-sm" onclick="useSocialAction(\'' + key + '\',\'' + targetUid + '\')" style="font-size:10px;padding:6px 10px;display:flex;align-items:center;gap:4px;' + (canAfford ? 'background:rgba(var(--gold-rgb),.08);border:1px solid rgba(var(--gold-rgb),.2);color:var(--gold)' : 'background:var(--bg3);border:1px solid var(--border);color:var(--muted2);pointer-events:none;opacity:.4') + '">';
    h += '<span style="display:flex;align-items:center">' + a.icon + '</span>';
    h += a.label + (a.cost > 0 ? ' (' + a.cost + ')' : '');
    h += '</button>';
  });
  h += '</div>';
  return h;
}
