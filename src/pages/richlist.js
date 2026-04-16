/* ================================================
   PAGE: RICH LIST + POWER-UPS + STATUS SPENDING
   Top coin holders, Gold Member badge, Sponsor a Hole,
   Name a Tournament, Double XP, Handicap Shield
   ================================================ */

// ── Gold Member auto-badge: checked on profile render ──
var GOLD_MEMBER_THRESHOLD = 10000;

function isGoldMember(uid) {
  return getParCoinLifetime(uid) >= GOLD_MEMBER_THRESHOLD;
}

Router.register("richlist", function() {
  var h = '<div class="sh"><h2>Rich List</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px;font-size:11px;color:var(--muted)">Top 10 ParCoin holders · Lifetime earned</div>';
  h += '<div id="rich-list-content"><div class="loading"><div class="spinner"></div>Loading...</div></div>';

  // Power-ups section
  h += '<div class="section" style="margin-top:8px"><div class="sec-head"><span class="sec-title">Power-Ups</span></div>';
  h += _renderPowerUp("Double XP Round", 150, "Your next completed round earns 2x XP", "doubleXP");
  h += _renderPowerUp("Handicap Shield", 100, "Exclude your next bad round from handicap calculation (visible to all)", "hcapShield");
  h += '</div>';

  // Status purchases
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Status</span></div>';
  h += _renderStatusPurchase("Sponsor a Hole", 500, "Your name appears on scorecards at your home course for the season", "sponsorHole");
  h += _renderStatusPurchase("Name a Tournament", 1000, "Name the next league event after yourself or a custom title", "nameTournament");
  h += '</div>';

  h += renderPageFooter();
  document.querySelector('[data-page="richlist"]').innerHTML = h;

  // Async load rich list from Firestore
  if (db) {
    db.collection("members").orderBy("parcoinsLifetime", "desc").limit(10).get().then(function(snap) {
      var players = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        if (d.parcoinsLifetime > 0) players.push(Object.assign({_id: doc.id}, d));
      });
      var el = document.getElementById("rich-list-content");
      if (!el) return;
      if (!players.length) {
        el.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--muted)">No one has earned coins yet. Go play!</div>';
        return;
      }
      var rh = '';
      players.forEach(function(p, i) {
        var medal = i === 0 ? '<span style="color:var(--medal-gold)">1st</span>' : i === 1 ? '<span style="color:var(--medal-silver)">2nd</span>' : i === 2 ? '<span style="color:var(--medal-bronze)">3rd</span>' : '<span style="color:var(--muted)">' + (i+1) + '</span>';
        var isGold = (p.parcoinsLifetime || 0) >= GOLD_MEMBER_THRESHOLD;
        var goldBadge = isGold ? ' <span style="font-size:8px;background:rgba(var(--gold-rgb),.15);color:var(--gold);padding:2px 6px;border-radius:8px;font-weight:700;letter-spacing:.3px;vertical-align:middle">GOLD</span>' : '';
        rh += '<div class="lb-card' + (i === 0 ? ' first' : '') + '" style="margin:0 16px 6px">';
        rh += '<div class="lb-left"><div class="lb-medal" style="font-size:12px;width:28px">' + medal + '</div>';
        rh += '<div><div class="lb-name">' + escHtml(p.name || p.username || "Member") + goldBadge + '</div>';
        rh += '<div class="lb-detail">Balance: ' + (p.parcoins || 0).toLocaleString() + '</div></div></div>';
        rh += '<div class="lb-pts" style="font-size:20px">' + (p.parcoinsLifetime || 0).toLocaleString() + '</div>';
        rh += '</div>';
      });
      el.innerHTML = rh;
    }).catch(function() {
      var el = document.getElementById("rich-list-content");
      if (el) el.innerHTML = '<div style="padding:16px;font-size:12px;color:var(--muted)">Failed to load</div>';
    });
  }
});

function _renderPowerUp(name, cost, desc, key) {
  var balance = getParCoinBalance(currentUser ? currentUser.uid : null);
  var canAfford = balance >= cost;
  var h = '<div class="card" style="margin:4px 16px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--cream)">' + name + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + desc + '</div></div>';
  if (canAfford) {
    h += '<button class="btn-sm" onclick="purchasePowerUp(\'' + key + '\',' + cost + ')" style="flex-shrink:0;margin-left:8px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.2);color:var(--gold)"><svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="10" cy="10" r="8"/></svg> ' + cost + '</button>';
  } else {
    h += '<div style="flex-shrink:0;margin-left:8px;font-size:10px;color:var(--muted2)">' + cost + ' coins</div>';
  }
  h += '</div></div>';
  return h;
}

function _renderStatusPurchase(name, cost, desc, key) {
  var balance = getParCoinBalance(currentUser ? currentUser.uid : null);
  var canAfford = balance >= cost;
  var h = '<div class="card" style="margin:4px 16px"><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--gold)">' + name + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + desc + '</div></div>';
  if (canAfford) {
    h += '<button class="btn-sm" onclick="purchaseStatus(\'' + key + '\',' + cost + ')" style="flex-shrink:0;margin-left:8px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.2);color:var(--gold)"><svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="10" cy="10" r="8"/></svg> ' + cost + '</button>';
  } else {
    h += '<div style="flex-shrink:0;margin-left:8px;font-size:10px;color:var(--muted2)">' + cost + ' coins</div>';
  }
  h += '</div></div>';
  return h;
}

function purchasePowerUp(key, cost) {
  if (!currentUser || !db) return;
  var balance = getParCoinBalance(currentUser.uid);
  if (balance < cost) { Router.toast("Not enough coins"); return; }
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";

  if (!deductCoins(currentUser.uid, cost, "powerup_" + key, "Activated: " + key)) return;

  if (key === "doubleXP") {
    db.collection("members").doc(currentUser.uid).set({ activeDoubleXP: true }, { merge: true });
    if (currentProfile) currentProfile.activeDoubleXP = true;
    Router.toast("Double XP activated! Your next round earns 2x XP.");
  } else if (key === "hcapShield") {
    db.collection("members").doc(currentUser.uid).set({ handicapShield: true }, { merge: true });
    if (currentProfile) currentProfile.handicapShield = true;
    Router.toast("Handicap Shield activated! Your next bad round won't hurt your handicap.");
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(), text: myName + " activated a Handicap Shield! Their next round won't count toward their handicap.",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }))(function(){});
  }
  Router.go("richlist", {}, true);
}

function purchaseStatus(key, cost) {
  if (!currentUser || !db) return;
  var balance = getParCoinBalance(currentUser.uid);
  if (balance < cost) { Router.toast("Not enough coins"); return; }
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";

  if (!deductCoins(currentUser.uid, cost, "status_" + key, "Purchased: " + key)) return;

  if (key === "sponsorHole") {
    var course = currentProfile ? (currentProfile.homeCourse || "their home course") : "a course";
    db.collection("members").doc(currentUser.uid).set({ sponsoredHole: { course: course, season: PB.getCurrentSeason().label } }, { merge: true });
    Router.toast("You now sponsor a hole at " + course + " for the season!");
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(), text: myName + " is now a HOLE SPONSOR at " + course + " for " + PB.getCurrentSeason().label + "! Their name appears on scorecards.",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }))(function(){});
  } else if (key === "nameTournament") {
    var name = prompt("What do you want to name the next event?");
    if (!name || !name.trim()) { Router.toast("Cancelled"); return; }
    db.collection("members").doc(currentUser.uid).set({ namedTournament: name.trim() }, { merge: true });
    Router.toast("The next event will be named: " + name.trim());
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(), text: myName + " spent 1,000 ParCoins to NAME THE NEXT TOURNAMENT: \"" + escHtml(name.trim()) + "\"",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }))(function(){});
  }
  Router.go("richlist", {}, true);
}
