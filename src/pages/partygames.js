// ========== PARTY GOLF GAMES ==========
var PARTY_GAMES = [
  { id:"ctp", name:"Closest to Pin", desc:"Nearest to the flag on a par 3", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='8' r='6'/><circle cx='8' cy='8' r='3'/><circle cx='8' cy='8' r='.8' fill='currentColor'/></svg>", xpWin:75 },
  { id:"longdrive", name:"Long Drive", desc:"Longest drive on a designated hole", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M4 10c0-3 2-6 4-6s4 3 4 6'/><path d='M6 10c0-2 1-4 2-4s2 2 2 4'/></svg>", xpWin:75 },
  { id:"puttoff", name:"Putt-Off", desc:"Head-to-head putting contest from 20ft", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='4' r='3'/><path d='M4 14l4-4 4 4'/><line x1='8' y1='9' x2='8' y2='14'/></svg>", xpWin:50 },
  { id:"chipoff", name:"Chip-Off", desc:"Closest chip from off the green", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M3 2v12'/><path d='M3 2l9 3.5L3 9'/></svg>", xpWin:50 },
  { id:"firstteeshot", name:"First Tee Jitters", desc:"Most fairways hit on the front 9", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='8' r='6'/><path d='M6 6v1M10 6v1M6 11s1 1 2 1 2-1 2-1'/></svg>", xpWin:60 },
  { id:"sandman", name:"Sandman Challenge", desc:"Best up-and-down from a bunker", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M2 12c2-1 3-2 6-2s4 1 6 2'/><circle cx='8' cy='6' r='4'/></svg>", xpWin:60 },
  { id:"bingo", name:"Bingo Bango Bongo", desc:"Points for first on green, closest to pin, first in hole", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><rect x='2' y='3' width='12' height='10' rx='1'/><path d='M6 3v10M10 3v10M2 8h12'/></svg>", xpWin:100 },
  { id:"wolfgame", name:"Wolf", desc:"Rotating captain picks partner each hole", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><path d='M3 4l5 2 5-2v8l-5 2-5-2z'/></svg>", xpWin:100 },
  { id:"nassau", name:"Nassau", desc:"Three bets: front 9, back 9, overall", icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.5'><circle cx='8' cy='8' r='6'/><path d='M8 4v8M6 6c0-1 1-1.5 2-1.5s2 .5 2 1.5-1 1.5-2 2-2 .5-2 1.5 1 1.5 2 1.5'/></svg>", xpWin:100 },
  { id:"skins", name:"Skins Game", desc:"Win the hole outright or skin carries over", icon:"", xpWin:75 }
];

Router.register("partygames", function() {
  // v8.25.137 (#41): full Clubhouse migration — was 6.4 (legacy --gold/--cream
  // tokens, flat dashed empty card with a 30% dead zone). Now a serif masthead,
  // a felt focal hero that fills the page, and .pb-card material rows.
  var h = '<div class="roster-masthead" style="padding-bottom:6px">';
  h += '<button class="back" onclick="Router.back(\'home\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">On the course · Side games</div>';
  h += '<h1 class="roster-headline">Party games.</h1>';
  h += '</div>';

  var inRound = liveState.active;

  if (inRound) {
    h += '<div class="pg-live"><span class="pg-live__dot"></span>Playing ' + escHtml(liveState.course) + ' · Hole ' + (liveState.currentHole + 1) + '</div>';
  } else {
    // Felt focal hero — fills the page (kills the dead zone), explains the
    // mid-round unlock, single brass CTA, then a preview of what's in the bag.
    h += '<div style="padding:6px 16px 2px"><div class="pb-card pb-card--felt pg-hero">';
    h += '<div class="pg-hero__art"><svg viewBox="0 0 48 48" width="46" height="46" fill="none" stroke="var(--cb-brass-3)" stroke-width="1.6"><rect x="9" y="9" width="30" height="30" rx="6"/><circle cx="18" cy="18" r="2" fill="var(--cb-brass-3)" stroke="none"/><circle cx="30" cy="18" r="2" fill="var(--cb-brass-3)" stroke="none"/><circle cx="24" cy="24" r="2" fill="var(--cb-brass-3)" stroke="none"/><circle cx="18" cy="30" r="2" fill="var(--cb-brass-3)" stroke="none"/><circle cx="30" cy="30" r="2" fill="var(--cb-brass-3)" stroke="none"/></svg></div>';
    h += '<div class="pg-hero__title">Side games light up mid-round.</div>';
    h += '<div class="pg-hero__desc">Start a round in Play Now and the games come alive: bet a hole, run a Wolf line, call a Nassau, claim closest-to-the-pin.</div>';
    h += '<button class="pb-btn-brass pg-hero__cta" onclick="Router.go(\'playnow\')">Play Now</button>';
    if (typeof PARTY_GAMES !== "undefined" && PARTY_GAMES && PARTY_GAMES.length) {
      h += '<div class="pg-hero__preview-label">In the bag</div>';
      h += '<div class="pg-chips">';
      PARTY_GAMES.slice(0, 6).forEach(function(g) {
        h += '<span class="pg-chip">' + g.icon + '<span>' + escHtml(g.name) + '</span></span>';
      });
      h += '</div>';
    }
    h += '</div></div>';
  }

  // Active games from Firestore
  h += '<div id="activeGames"><div class="loading"><div class="spinner"></div>Loading…</div></div>';

  // Game catalog — only show if in a round
  if (inRound) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Start a game</span></div><div style="padding:0 16px">';
    PARTY_GAMES.forEach(function(g) {
      h += '<div class="pb-card pb-card--rail pg-row" style="--rail:var(--cb-brass);cursor:pointer" onclick="startPartyGame(\'' + g.id + '\')">';
      h += '<div class="pg-row__art">' + g.icon + '</div>';
      h += '<div class="pg-row__main"><div class="pg-row__name">' + escHtml(g.name) + '</div>';
      h += '<div class="pg-row__desc">' + escHtml(g.desc) + '</div>';
      h += '<div class="pg-row__xp">+' + g.xpWin + ' XP to winner</div></div>';
      h += '<div class="pg-row__chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg></div>';
      h += '</div>';
    });
    h += '</div></div>';
  }
  
  // Past games
  h += '<div id="pastGames"></div>';
  
  document.querySelector('[data-page="partygames"]').innerHTML = h;
  
  // Load active + past games
  if (db) {
    var isComm = isFounderRole(currentProfile);
    var myUid = currentUser ? currentUser.uid : null;
    
    // Active games
    db.collection("partygames").where("status","==","active").get().then(function(snap) {
      var games = []; snap.forEach(function(doc) { games.push(Object.assign({_id:doc.id}, doc.data())); });
      games.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
      var el = document.getElementById("activeGames");
      if (!el) return;
      if (!games.length) { el.innerHTML = '<div style="font-size:11px;color:var(--cb-mute);text-align:center;padding:12px">No active games</div>'; return; }
      var gh = '<div class="section"><div class="sec-head"><span class="sec-title">Active Games</span></div>';
      games.forEach(function(g) {
        var game = PARTY_GAMES.find(function(pg) { return pg.id === g.gameType; }) || { icon:"?", name:g.gameType };
        var canDelete = (myUid && g.createdBy === myUid) || isComm;
        gh += '<div class="pb-card"><div class="card-body">';
        gh += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
        gh += '<div><div style="font-size:14px;font-weight:600">' + game.icon + ' ' + game.name + '</div>';
        gh += '<div style="font-size:10px;color:var(--cb-mute);margin-top:2px">Started by ' + escHtml(g.createdByName || "Unknown") + '</div></div>';
        if (canDelete) {
          gh += '<div onclick="event.stopPropagation();deletePartyGame(\'' + g._id + '\')" style="cursor:pointer;padding:4px 8px;color:var(--cb-mute-2);font-size:16px">×</div>';
        }
        gh += '</div>';
        // Declare winner
        gh += '<div style="margin-top:10px"><div style="font-size:10px;color:var(--cb-brass);margin-bottom:6px">Declare winner:</div>';
        gh += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
        PB.getPlayers().forEach(function(p) {
          if (isBannedRole(p)) return;
          gh += '<button class="btn-sm outline" style="font-size:10px" onclick="declarePartyWinner(\'' + g._id + '\',\'' + p.id + '\',\'' + escHtml(p.name) + '\')">' + escHtml(p.name) + '</button>';
        });
        gh += '</div></div></div></div>';
      });
      gh += '</div>';
      el.innerHTML = gh;
    }).catch(function() { var el = document.getElementById("activeGames"); if (el) el.innerHTML = ''; });
    
    // Past completed games
    db.collection("partygames").where("status","==","completed").get().then(function(snap) {
      var past = []; snap.forEach(function(doc) { past.push(Object.assign({_id:doc.id}, doc.data())); });
      past.sort(function(a,b) { return (b.completedAt||b.createdAt||0) - (a.completedAt||a.createdAt||0); });
      var el = document.getElementById("pastGames");
      if (!el || !past.length) return;
      var ph = '<div class="section"><div class="sec-head"><span class="sec-title">History</span></div>';
      past.forEach(function(g) {
        var game = PARTY_GAMES.find(function(pg) { return pg.id === g.gameType; }) || { icon:"?", name:g.gameType };
        var canDelete = (myUid && g.createdBy === myUid) || isComm;
        var dateStr = "";
        if (g.completedAt && g.completedAt.toDate) {
          var d = g.completedAt.toDate();
          dateStr = (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear();
        }
        ph += '<div class="pb-card" style="margin:0 16px 6px;padding:10px 14px">';
        ph += '<div style="display:flex;justify-content:space-between;align-items:center">';
        ph += '<div style="display:flex;align-items:center;gap:8px">';
        ph += '<div style="font-size:16px">' + game.icon + '</div>';
        ph += '<div><div style="font-size:12px;font-weight:600;color:var(--cb-ink)">' + game.name + '</div>';
        ph += '<div style="font-size:10px;color:var(--cb-mute)">Winner: <span style="color:var(--cb-brass)">' + escHtml(g.winnerName || "Unknown") + '</span>' + (dateStr ? ' · ' + dateStr : '') + '</div></div></div>';
        if (canDelete) {
          ph += '<div onclick="deletePartyGame(\'' + g._id + '\')" style="cursor:pointer;padding:4px 8px;color:var(--cb-mute-2);font-size:14px">×</div>';
        }
        ph += '</div></div>';
      });
      ph += '</div>';
      el.innerHTML = ph;
    });
  }
});

function startPartyGame(gameType) {
  if (!db || !currentUser) { Router.toast("Sign in required"); return; }
  if (!liveState.active) { Router.toast("Start a round first"); return; }
  var game = PARTY_GAMES.find(function(g) { return g.id === gameType; });
  db.collection("partygames").add(leagueDoc("partygames", {
    gameType: gameType,
    gameName: game ? game.name : gameType,
    status: "active",
    createdBy: currentUser.uid,
    createdByName: currentProfile ? PB.getDisplayName(currentProfile) : "Unknown",
    course: liveState.course || "",
    roundDate: localDateStr(),
    winner: null,
    createdAt: fsTimestamp()
  })).then(function() {
    Router.toast((game ? game.name : "Game") + " started!");
    Router.go("partygames");
  });
}

function deletePartyGame(gameId, _confirmed) {
  if (!db) return;
  var isComm = isFounderRole(currentProfile);
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Delete this game?", message: "It comes off the board for everyone.", confirmLabel: "Delete", danger: true })
      .then(function(ok) { if (ok) deletePartyGame(gameId, true); });
    return;
  }
  db.collection("partygames").doc(gameId).delete().then(function() {
    Router.toast("Game deleted");
    Router.go("partygames");
  }).catch(function() { Router.toast("Could not delete"); });
}

function declarePartyWinner(gameId, winnerId, winnerName, _confirmed) {
  if (!db) return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: winnerName + " wins?", message: "Locks the result in the books.", confirmLabel: "Crown them", danger: false })
      .then(function(ok) { if (ok) declarePartyWinner(gameId, winnerId, winnerName, true); });
    return;
  }
  db.collection("partygames").doc(gameId).update({
    status: "completed",
    winner: winnerId,
    winnerName: winnerName,
    completedAt: fsTimestamp()
  }).then(function() {
    Router.toast(winnerName + " wins!");
    // Post to activity feed — single canonical Caddy identity (PB_CADDY).
    postCaddyChat(winnerName + " won " + (PARTY_GAMES.find(function(g) { return g.id; }) || {name:"a party game"}).name + "!");
    Router.go("partygames");
  });
}
