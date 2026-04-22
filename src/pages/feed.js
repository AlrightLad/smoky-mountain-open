// ========== FEED — Instagram-style activity feed ==========
// v5.37.6: Full redesign with avatars, theme rings, hole dots, stat chips, action rows
var _feedFilter = "all";

Router.register("feed", function(params) {
  if (params && params.filter) _feedFilter = params.filter;
  var h = '<div class="sh"><h2>Feed</h2></div>';

  // Chat input at top
  h += '<div style="padding:8px 16px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">';
  h += '<input class="ff-input" id="feedChatInput" placeholder="Say something..." style="flex:1;margin:0;font-size:13px;padding:10px 14px;border-radius:20px" onkeydown="if(event.key===\'Enter\')sendFeedChat()">';
  h += '<button style="background:var(--gold);border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0" onclick="sendFeedChat()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--bg)" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
  h += '</div>';

  // Filter tabs
  h += '<div class="toggle-bar" style="border-bottom:1px solid var(--border)">';
  ["all","round","chat","range"].forEach(function(f) {
    var label = f === "all" ? "All" : f === "round" ? "Rounds" : f === "chat" ? "Chat" : "Range";
    h += '<button' + (_feedFilter === f ? ' class="a"' : '') + ' onclick="_feedFilter=\'' + f + '\';applyFeedFilter()">' + label + '</button>';
  });
  h += '</div>';

  h += '<div id="feedStream"><div class="loading"><div class="spinner"></div>Loading feed...</div></div>';
  document.querySelector('[data-page="feed"]').innerHTML = h;

  // Load all feed items
  window._feedItems = [];
  var items = window._feedItems;
  var pending = 3;

  function tryRender() {
    if (pending > 0) return;
    items.sort(function(a, b) { return b.ts - a.ts; });
    _renderFeedItems();
  }

  // 1. Rounds — pull rich data for hole dots and stats
  if (db) {
    leagueQuery("rounds").where("visibility", "==", "public").orderBy("createdAt", "desc").limit(40).get().then(function(snap) {
      snap.forEach(function(doc) {
        var r = doc.data();
        var rid = doc.id;
        var isScramble = r.format === "scramble" || r.format === "scramble4";
        var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
        var quip = isScramble ? "" : (comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : ""));
        // Resolve player for avatar/ring
        var player = PB.getPlayer(r.player);
        items.push({
          type: "round",
          player: player,
          playerId: r.player,
          playerName: r.playerName || (player ? player.name || player.username : "A Parbaugh"),
          course: r.course || "",
          score: r.score,
          tee: r.tee || "",
          format: r.format || "stroke",
          holesPlayed: r.holesPlayed || 18,
          holesMode: r.holesMode || "18",
          frontScore: r.frontScore || null,
          backScore: r.backScore || null,
          holeScores: r.holeScores || [],
          holePars: r.holePars || [],
          firData: r.firData || null,
          girData: r.girData || null,
          puttsData: r.puttsData || null,
          quip: quip,
          date: r.date || "",
          ts: r.createdAt ? r.createdAt.toMillis() : 0,
          roundId: rid,
          isScramble: isScramble
        });
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }

  // 2. Range sessions
  if (typeof liveRangeSessions !== "undefined" && liveRangeSessions.length) {
    liveRangeSessions.filter(function(s){return s.visibility !== "private";}).slice(0,10).forEach(function(s) {
      var player = PB.getPlayer(s.playerId);
      items.push({
        type: "range",
        player: player,
        playerId: s.playerId,
        playerName: s.playerName || (player ? player.name || player.username : "A Parbaugh"),
        duration: s.durationMin || 0,
        focus: s.focus || "",
        drills: s.drills || [],
        sessionId: s._id || "",
        ts: s.startedAt ? new Date(s.startedAt).getTime() : 0
      });
    });
  }
  pending--;

  // 3. Chat messages
  if (db) {
    leagueQuery("chat").orderBy("createdAt", "desc").limit(30).get().then(function(snap) {
      snap.forEach(function(doc) {
        var msg = doc.data();
        var player = msg.authorId ? PB.getPlayer(msg.authorId) : null;
        items.push({
          type: "chat",
          player: player,
          playerId: msg.authorId || "",
          author: msg.system ? "The Caddy" : msg.authorName || msg.user || "Member",
          text: msg.text || "",
          ts: msg.createdAt ? msg.createdAt.toMillis() : (msg.timestamp || 0),
          system: !!msg.system
        });
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }
});

// ── Hole dot helper ──
function _feedHoleDots(holeScores, holePars, holesPlayed, holesMode) {
  if (!holeScores || holeScores.length < 9) return '';
  var is9 = holesPlayed && holesPlayed <= 9;
  var numHoles = Math.min(holeScores.length, is9 ? 9 : 18);
  var startHole = is9 && holesMode === "back9" ? 9 : 0;
  var dh = '<div style="display:flex;gap:2px;flex-wrap:wrap">';
  for (var i = startHole; i < startHole + numHoles; i++) {
    var hs = parseInt(holeScores[i]);
    var hp = (holePars && holePars[i]) || 4;
    var color = "#444";
    if (hs > 0) {
      var diff = hs - hp;
      if (diff <= -2) color = "#FFD700";
      else if (diff === -1) color = "#4CAF50";
      else if (diff === 0) color = "#888888";
      else if (diff === 1) color = "#F59E42";
      else color = "#E53935";
    }
    dh += '<div style="width:' + (is9 ? '8px' : '5px') + ';height:' + (is9 ? '8px' : '5px') + ';border-radius:50%;background:' + color + '"></div>';
  }
  dh += '</div>';
  return dh;
}

// ── Stat chips helper ──
function _feedStatChips(item) {
  var chips = [];
  if (item.frontScore && item.backScore) {
    chips.push('F9: ' + item.frontScore);
    chips.push('B9: ' + item.backScore);
  }
  if (item.firData && Array.isArray(item.firData)) {
    var firC = 0, firH = 0;
    item.firData.forEach(function(v, i) { var par = item.holePars ? (item.holePars[i] || 4) : 4; if (par !== 3) { firH++; if (v) firC++; } });
    if (firH > 0) chips.push('FIR ' + firC + '/' + firH);
  }
  if (item.girData && Array.isArray(item.girData)) {
    var girC = 0, girH = 0;
    item.girData.forEach(function(v) { girH++; if (v) girC++; });
    if (girH > 0) chips.push('GIR ' + girC + '/' + girH);
  }
  if (item.puttsData && Array.isArray(item.puttsData)) {
    var pTotal = 0;
    item.puttsData.forEach(function(v) { pTotal += (v || 0); });
    if (pTotal > 0) chips.push('Putts ' + pTotal);
  }
  if (!chips.length) return '';
  var ch = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">';
  chips.forEach(function(c) {
    ch += '<span style="font-size:9px;font-weight:600;color:var(--muted);background:var(--bg3);padding:3px 8px;border-radius:10px">' + c + '</span>';
  });
  ch += '</div>';
  return ch;
}

function _renderFeedItems() {
  var items = window._feedItems || [];
  var filtered = _feedFilter === "all" ? items : items.filter(function(i) { return i.type === _feedFilter; });
  var fh = '';
  if (!filtered.length) {
    fh = '<div style="padding:40px 16px;text-align:center"><div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><circle cx="24" cy="24" r="18"/><path d="M16 28s3 4 8 4 8-4 8-4"/><circle cx="18" cy="18" r="2" fill="var(--gold)"/><circle cx="30" cy="18" r="2" fill="var(--gold)"/></svg></div>';
    fh += '<div style="font-size:16px;font-weight:700;color:var(--cream)">No ' + (_feedFilter === "all" ? "Activity" : (_feedFilter === "round" ? "Rounds" : _feedFilter === "chat" ? "Messages" : "Range Sessions")) + ' Yet</div>';
    fh += '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Play a round, hit the range, or drop a message in the feed to get things going.</div>';
    fh += '<button class="btn full green" style="margin-top:16px;max-width:220px;margin-left:auto;margin-right:auto" onclick="Router.go(\'playnow\')">Log a Round</button></div>';
  }
  filtered.slice(0, 60).forEach(function(item) {
    if (item.type === "round") {
      fh += _renderRoundCard(item);
    } else if (item.type === "chat") {
      fh += _renderChatCard(item);
    } else if (item.type === "range") {
      fh += _renderRangeCard(item);
    }
  });
  var el = document.getElementById("feedStream");
  if (el) el.innerHTML = fh;
}

// ── ROUND CARD (biggest, richest) ──
function _renderRoundCard(item) {
  var cardCss = item.player ? getPlayerCardCss(item.player) : '';
  var is9h = item.holesPlayed && item.holesPlayed <= 9;
  var holeLabel = is9h ? (item.holesMode === "back9" ? "Back 9" : "Front 9") : "";
  var teeLabel = item.tee ? item.tee + " Tees" : "";
  var meta = [teeLabel, holeLabel, item.format !== "stroke" ? item.format : ""].filter(Boolean).join(" \u00b7 ");
  var scoreColor = item.score <= 72 ? "var(--birdie)" : item.score >= 100 ? "var(--alert)" : "var(--gold)";
  var roundClick = item.roundId ? "Router.go(\'rounds\',{roundId:\'" + item.roundId + "\'})" : "";

  var h = '<div class="card" style="margin:6px 16px;overflow:hidden;' + cardCss + '">';

  // Header: avatar + name + time + score
  h += '<div style="display:flex;align-items:center;gap:10px;padding:12px 14px 0">';
  h += renderAvatar(item.player, 40, true);
  h += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">' + renderUsername(item.player, 'color:var(--cream);', true) + (item.isScramble ? ' <span style="font-size:9px;color:var(--muted);font-weight:400">(Scramble)</span>' : '') + '</div>';
  h += '<div style="font-size:10px;color:var(--muted)">' + feedTimeAgo(item.ts) + '</div></div>';
  h += '<div style="text-align:right;flex-shrink:0"><div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:' + scoreColor + ';line-height:1">' + item.score + '</div></div>';
  h += '</div>';

  // Course + meta
  h += '<div style="padding:4px 14px 0;cursor:pointer" onclick="' + roundClick + '">';
  h += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(item.course) + '</div>';
  if (meta) h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + meta + '</div>';
  h += '</div>';

  // Hole dots
  var dots = _feedHoleDots(item.holeScores, item.holePars, item.holesPlayed, item.holesMode);
  if (dots) h += '<div style="padding:6px 14px 0">' + dots + '</div>';

  // Stat chips
  var chips = _feedStatChips(item);
  if (chips) h += '<div style="padding:0 14px">' + chips + '</div>';

  // AI quip
  if (item.quip) h += '<div style="padding:6px 14px 0;font-size:11px;color:var(--gold);font-style:italic;line-height:1.4">' + escHtml(item.quip) + '</div>';

  // Action row
  h += '<div style="display:flex;gap:0;padding:8px 14px 10px;border-top:1px solid var(--border);margin-top:8px">';
  h += '<div onclick="' + roundClick + '" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:6px 0;min-height:48px"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--muted)" stroke-width="1.3"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 8h4M5 10h5"/></svg><span style="font-size:10px;color:var(--muted)">Scorecard</span></div>';
  h += '<div onclick="event.stopPropagation();Router.go(\'chat\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:6px 0;min-height:48px"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--muted)" stroke-width="1.3"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg><span style="font-size:10px;color:var(--muted)">Comment</span></div>';
  h += '<div onclick="event.stopPropagation();if(typeof shareScorecard===\'function\')shareScorecard(\'' + item.roundId + '\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:6px 0;min-height:48px"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--muted)" stroke-width="1.3"><path d="M4 12V8l4-6 4 6v4"/><path d="M4 8h8"/></svg><span style="font-size:10px;color:var(--muted)">Share</span></div>';
  // Reaction button removed per commissioner request
  h += '</div>';

  h += '</div>';
  return h;
}

// ── CHAT CARD (compact) ──
function _renderChatCard(item) {
  var isSystem = item.system;
  var h = '<div class="card" style="margin:3px 16px;border-left:3px solid ' + (isSystem ? 'var(--birdie)' : 'var(--border)') + '">';
  h += '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px">';
  if (!isSystem) {
    h += renderAvatar(item.player, 28, true);
  } else {
    h += '<div style="width:28px;height:28px;min-width:28px;border-radius:50%;background:rgba(var(--birdie-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:14px">\u26f3</span></div>';
  }
  h += '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center">';
  if (isSystem) {
    h += '<span style="font-size:11px;font-weight:700;color:var(--birdie)">The Caddy</span>';
  } else {
    h += renderUsername(item.player, 'font-size:11px;font-weight:700;color:var(--gold);', true);
  }
  h += '<span style="font-size:9px;color:var(--muted2);flex-shrink:0">' + feedTimeAgo(item.ts) + '</span></div>';
  h += '<div style="font-size:12px;color:var(--cream);margin-top:3px;line-height:1.5">' + escHtml(item.text) + '</div>';
  h += '</div></div></div>';
  return h;
}

// ── RANGE CARD (smaller) ──
function _renderRangeCard(item) {
  var rangeDest = item.sessionId ? "Router.go(\'range-detail\',{sessionId:\'" + item.sessionId + "\'})" : "Router.go(\'range\')";
  var h = '<div class="card" style="margin:3px 16px;cursor:pointer" onclick="' + rangeDest + '">';
  h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px">';
  h += renderAvatar(item.player, 36, true);
  h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">' + renderUsername(item.player, 'color:var(--cream);', true) + ' <span style="color:var(--muted);font-weight:400">hit the range</span></div>';
  var subParts = [];
  if (item.duration) subParts.push(item.duration + ' min');
  if (item.focus) subParts.push(item.focus);
  if (item.drills && item.drills.length) subParts.push(item.drills.length + ' drill' + (item.drills.length > 1 ? 's' : ''));
  h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + (subParts.join(' \u00b7 ') || 'Range session') + '</div></div>';
  h += '<div style="flex-shrink:0;text-align:right"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--pink)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2.5 1.5"/></svg>';
  h += '<div style="font-size:9px;color:var(--muted2);margin-top:2px">' + feedTimeAgo(item.ts) + '</div></div>';
  h += '</div></div>';
  return h;
}

function sendFeedChat() {
  var input = document.getElementById("feedChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  var name = currentProfile ? PB.getDisplayName(currentProfile) : "Anon";
  if (window._feedItems) {
    window._feedItems.unshift({type:"chat", player:currentProfile, playerId:currentUser.uid, author:name, text:text, ts:Date.now(), system:false});
    _renderFeedItems();
  }
  db.collection("chat").add(leagueDoc("chat", {
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: name,
    createdAt: fsTimestamp()
  }))(function(e) { Router.toast("Send failed: " + e.message); });
}

function applyFeedFilter() {
  _renderFeedItems();
  document.querySelectorAll('[data-page="feed"] .toggle-bar button').forEach(function(btn) {
    btn.className = btn.textContent.toLowerCase() === (_feedFilter === "all" ? "all" : _feedFilter === "round" ? "rounds" : _feedFilter === "chat" ? "chat" : "range") ? "a" : "";
  });
}

function feedReact(roundId) {
  if (!db || !currentUser || !roundId) { Router.toast("Sign in to react"); return; }
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var likes = doc.data().likes || [];
    var uid = currentUser.uid;
    var idx = likes.indexOf(uid);
    if (idx !== -1) { likes.splice(idx, 1); } else { likes.push(uid); }
    return db.collection("rounds").doc(roundId).update({ likes: likes });
  }).then(function() {
    Router.toast("Nice!");
  }).catch(function() {});
}
