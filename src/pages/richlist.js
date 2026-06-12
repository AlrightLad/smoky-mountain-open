/* ================================================
   PAGE: RICH LIST + POWER-UPS + STATUS SPENDING
   Top coin holders, Gold Member badge, Sponsor a Hole,
   Double XP, Handicap Shield
   ================================================ */

// ── Gold Member auto-badge: checked on profile render ──
var GOLD_MEMBER_THRESHOLD = 10000;

function isGoldMember(uid) {
  return getParCoinLifetime(uid) >= GOLD_MEMBER_THRESHOLD;
}

Router.register("richlist", function() {
  var h = '<div class="sh"><h2>Rich List</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px;font-size:11px;color:var(--muted)">Top 10 ParCoin holders · Lifetime earned</div>';
  h += '<div id="rich-list-content"><div class="loading"><div class="spinner"></div>Loading…</div></div>';

  // Power-ups section
  h += '<div class="section" style="margin-top:8px"><div class="sec-head"><span class="sec-title">Power-Ups</span></div>';
  h += _renderPowerUp("Double XP Round", 150, "Your next completed round earns 2x XP", "doubleXP");
  h += _renderPowerUp("Handicap Shield", 100, "Exclude your next bad round from handicap calculation (visible to all)", "hcapShield");
  h += '</div>';

  // Status purchases — v8.24.20 Founder edits: "Name a Tournament" REMOVED
  // ("can be removed from the status purchase items"); "Sponsor a Hole" stays
  // but is LEAGUE-based, not home-course-based ("should only be league based").
  // Full shop/cosmetics redo is queued (task #32) — these are the immediate
  // Founder-directed corrections.
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Status</span></div>';
  h += _renderStatusPurchase("Sponsor a Hole", 500, "Your name appears on a hole at your league's events this season", "sponsorHole");
  h += '</div>';

  h += renderPageFooter();
  document.querySelector('[data-page="richlist"]').innerHTML = h;

  // Async load rich list from Firestore
  if (db) {
    db.collection("members").orderBy("parcoinsLifetime", "desc").limit(10).get().then(function(snap) {
      var players = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        // v8.17.0 Path B+ hardening — hide test accounts from real-account viewers
        if (PB.isMemberVisibleToViewer && !PB.isMemberVisibleToViewer(d)) return;
        if (d.parcoinsLifetime > 0) players.push(Object.assign({_id: doc.id}, d));
      });
      var el = document.getElementById("rich-list-content");
      if (!el) return;
      if (!players.length) {
        el.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--muted)">No one has earned coins yet. Go play!</div>';
        return;
      }
      // Deterministic ordering: lifetime desc, then name asc as a stable tie-breaker
      // so equal totals never reorder between renders (Firestore returns ties in
      // arbitrary order). _displayName precomputed once for both sort + render.
      players.forEach(function(p) { p._displayName = p.name || p.username || "Member"; });
      players.sort(function(a, b) {
        var diff = (b.parcoinsLifetime || 0) - (a.parcoinsLifetime || 0);
        if (diff !== 0) return diff;
        return a._displayName.localeCompare(b._displayName);
      });
      // Standard competition ranking ("1224"): equal lifetime totals share a rank,
      // the next distinct total skips ahead. Fixes the rank 7=52 / rank 9=52 bug
      // where ties were rendered as sequential positions.
      var rank = 0, prevVal = null;
      players.forEach(function(p, i) {
        var val = p.parcoinsLifetime || 0;
        if (val !== prevVal) { rank = i + 1; prevVal = val; }
        p._rank = rank;
      });
      var rh = '';
      players.forEach(function(p, i) {
        rh += _renderRichRow(p, i);
      });
      el.innerHTML = rh;
    }).catch(function() {
      var el = document.getElementById("rich-list-content");
      if (el) el.innerHTML = renderLoadError("the rich list", "Router.go('richlist', {}, true)");
    });
  }
});

// Shared coin glyph (matches shop.js _shopCoinSvg) — labels the lifetime value
// so the big right-hand number reads as ParCoins, not an unlabeled score.
var _richCoinSvg = '<svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.7" style="flex-shrink:0;vertical-align:middle"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7.5 7.5h4a1.8 1.8 0 010 3.6H7.5"/></svg>';

// Rank chip — a warm brass PODIUM for the top 3 (a leaderboard's whole job is to
// celebrate rank), then a clean slate outline for 4+. Every numeral is chosen for
// WCAG AA against its OWN disc fill: rank 1 = dark ink on solid brass (5.87:1),
// ranks 2-3 = deep-brass (--cb-ink-link) on light brass tints, 4+ = ink-faint on
// the page ground. Tokens only (the old hardcoded slate ramp left ranks 2-3 cream
// numerals at 1.56-2.34:1 — illegible; fixed 2026-06-12). Themes across all looks.
function _rankChip(rank) {
  var base = 'display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-family:var(--font-display);line-height:1;letter-spacing:-.5px;';
  if (rank === 1) return '<span style="' + base + 'font-weight:800;font-size:13px;background:var(--cb-brass);color:var(--cb-ink)">' + rank + '</span>';
  if (rank === 2) return '<span style="' + base + 'font-weight:800;font-size:13px;background:rgba(var(--cb-brass-rgb),.20);border:1.5px solid var(--cb-brass);color:var(--cb-ink-link)">' + rank + '</span>';
  if (rank === 3) return '<span style="' + base + 'font-weight:800;font-size:13px;background:rgba(var(--cb-brass-rgb),.12);border:1px solid rgba(var(--cb-brass-rgb),.55);color:var(--cb-ink-link)">' + rank + '</span>';
  return '<span style="' + base + 'font-weight:700;font-size:12px;border:1.5px solid var(--cb-mute-3);color:var(--cb-ink-faint)">' + rank + '</span>';
}

function _renderRichRow(p, i) {
  var isGold = (p.parcoinsLifetime || 0) >= GOLD_MEMBER_THRESHOLD;
  var goldBadge = isGold ? ' <span style="font-size:8px;background:rgba(var(--gold-rgb),.15);color:var(--gold);padding:2px 6px;border-radius:8px;font-weight:700;letter-spacing:.3px;vertical-align:middle">GOLD</span>' : '';
  // Rank-1 (the leader) earns a clearly distinct champion card: the shared .first
  // class gives a subtle gradient + md shadow, but on its own the gold-tinted border
  // reads faint. We layer a local brass-token treatment — a solid brass left rail,
  // a stronger brass border, and a touch more lift — so the top of the leaderboard
  // is unmistakably celebrated without going tacky. Tokens only (no hardcoded hex).
  var topStyle = (i === 0)
    ? 'margin:0 16px 8px;border:1.5px solid rgba(var(--cb-brass-rgb),.55);border-left:4px solid var(--cb-brass);box-shadow:var(--shadow-md),inset 0 0 0 1px rgba(var(--cb-brass-rgb),.10)'
    : 'margin:0 16px 6px';
  var h = '<div class="lb-card' + (i === 0 ? ' first' : '') + '" style="' + topStyle + '">';
  h += '<div class="lb-left"><div class="lb-medal" style="width:26px;color:inherit">' + _rankChip(p._rank) + '</div>';
  h += '<div><div class="lb-name">' + escHtml(p._displayName) + goldBadge + '</div>';
  h += '<div class="lb-detail">Balance: ' + (p.parcoins || 0).toLocaleString() + '</div></div></div>';
  // Stacked value: brass hero number + 9px LIFETIME micro-label with coin glyph.
  h += '<div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.05">';
  h += '<div class="lb-pts" style="font-size:20px">' + (p.parcoinsLifetime || 0).toLocaleString() + '</div>';
  h += '<div style="display:flex;align-items:center;gap:3px;margin-top:2px;font-size:9px;font-weight:700;letter-spacing:.6px;color:var(--cb-mute);text-transform:uppercase">' + _richCoinSvg + 'Lifetime</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

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
    })).catch(function(){});
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
    })).catch(function(){});
  }
  // v8.24.33 — the "nameTournament" purchase branch removed entirely (Founder
  // removed the item from status purchases in v8.24.20; the handler had become
  // unreachable dead code, flagged by the marathon LEGAL pass — it also used a
  // native prompt(), the last one in the purchase flows).
  Router.go("richlist", {}, true);
}
