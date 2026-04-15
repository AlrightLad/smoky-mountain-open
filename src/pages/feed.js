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
  
  // Load all feed items: rounds, range, chat
  window._feedItems = [];
  var items = window._feedItems;
  var pending = 3;

  function tryRender() {
    if (pending > 0) return;
    items.sort(function(a, b) { return b.ts - a.ts; });
    _renderFeedItems();
  }

  // 1. Rounds
  if (db) {
    db.collection("rounds").where("visibility", "==", "public").orderBy("createdAt", "desc").limit(40).get().then(function(snap) {
      snap.forEach(function(doc) {
        var r = doc.data();
        var rid = doc.id;
        var isScramble = r.format === "scramble" || r.format === "scramble4";
        var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
        var quip = isScramble ? "" : (comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : ""));
        var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
        var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
        var teeLabel = r.tee ? " · " + r.tee : "";
        items.push({type:"round", name:(r.playerName||"A Parbaugh") + (isScramble ? " (Scramble)" : ""), sub:(r.course||"") + teeLabel + " · " + r.score + holeLabel + fmtLabel, quip:quip, score:r.score, date:r.date||"", ts:r.createdAt ? r.createdAt.toMillis() : 0, dest:"Router.go('rounds',{roundId:'" + rid + "'})"});
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }
  
  // 2. Range sessions
  if (typeof liveRangeSessions !== "undefined" && liveRangeSessions.length) {
    liveRangeSessions.filter(function(s){return s.visibility !== "private";}).slice(0,10).forEach(function(s) {
      var name = s.playerName || s.playerId || "A Parbaugh";
      var sub = (s.durationMin ? s.durationMin + " min" : "") + (s.focus ? " · " + s.focus : "") || "Range session";
      var playerDest = s.playerId ? "Router.go('members',{id:'" + s.playerId + "'})" : "Router.go('range')";
      items.push({type:"range", name:name + " hit the range", sub:sub, ts:s.startedAt ? new Date(s.startedAt).getTime() : 0, dest:playerDest});
    });
  }
  pending--;
  
  // 3. Chat messages
  if (db) {
    db.collection("chat").orderBy("createdAt", "desc").limit(30).get().then(function(snap) {
      snap.forEach(function(doc) {
        var msg = doc.data();
        items.push({type:"chat", author:(msg.system ? "The Caddy" : msg.authorName || msg.user || "Member"), text:msg.text || "", ts:msg.createdAt ? msg.createdAt.toMillis() : (msg.timestamp || 0), system:!!msg.system});
      });
      pending--; tryRender();
    }).catch(function() { pending--; tryRender(); });
  } else { pending--; }
});

function sendFeedChat() {
  var input = document.getElementById("feedChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  db.collection("chat").add({
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Anon",
    createdAt: fsTimestamp()
  }).then(function() {
    Router.go("feed"); // Refresh feed
  }).catch(function(e) { Router.toast("Send failed: " + e.message); });
}

function _renderFeedItems() {
  var items = window._feedItems || [];
  var filtered = _feedFilter === "all" ? items : items.filter(function(i) { return i.type === _feedFilter; });
  var fh = '';
  if (!filtered.length) {
    fh = '<div class="card" style="margin:16px"><div class="empty" style="padding:32px"><div class="empty-text">No ' + (_feedFilter === "all" ? "activity" : _feedFilter + "s") + ' yet</div></div></div>';
  }
  filtered.slice(0, 60).forEach(function(item) {
    if (item.type === "chat") {
      var isSystem = item.system;
      fh += '<div class="card" style="margin:4px 16px;border-left:3px solid ' + (isSystem ? 'var(--birdie)' : 'var(--border)') + '">';
      fh += '<div style="padding:10px 14px"><div style="display:flex;justify-content:space-between;align-items:flex-start">';
      fh += '<div style="font-size:11px;font-weight:700;color:' + (isSystem ? 'var(--birdie)' : 'var(--gold)') + '">' + escHtml(item.author) + '</div>';
      fh += '<span style="font-size:9px;color:var(--muted2)">' + feedTimeAgo(item.ts) + '</span></div>';
      fh += '<div style="font-size:12px;color:var(--cream);margin-top:4px;line-height:1.5">' + escHtml(item.text) + '</div>';
      fh += '</div></div>';
    } else if (item.type === "round") {
      fh += '<div class="card" style="margin:4px 16px;cursor:pointer" onclick="' + item.dest + '">';
      fh += '<div style="padding:10px 14px"><div style="display:flex;justify-content:space-between;align-items:flex-start">';
      fh += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(item.name) + '</div>';
      fh += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(item.sub) + '</div>';
      if (item.quip) fh += '<div style="font-size:11px;color:var(--gold);font-style:italic;margin-top:4px;line-height:1.4">' + escHtml(item.quip) + '</div>';
      fh += '</div>';
      fh += '<div style="text-align:right;flex-shrink:0;margin-left:12px"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:var(--gold)">' + item.score + '</div>';
      fh += '<div style="font-size:9px;color:var(--muted)">' + (item.date || "") + '</div></div>';
      fh += '</div></div></div>';
    } else if (item.type === "range") {
      fh += '<div class="card" style="margin:4px 16px;cursor:pointer" onclick="' + item.dest + '">';
      fh += '<div style="padding:10px 14px"><div style="display:flex;justify-content:space-between;align-items:center">';
      fh += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(item.name) + '</div>';
      fh += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(item.sub) + '</div></div>';
      fh += '<span style="font-size:9px;color:var(--muted2)">' + feedTimeAgo(item.ts) + '</span>';
      fh += '</div></div></div>';
    }
  });
  var el = document.getElementById("feedStream");
  if (el) el.innerHTML = fh;
}

function applyFeedFilter() {
  _renderFeedItems();
  // Update button active states
  document.querySelectorAll('[data-page="feed"] .toggle-bar button').forEach(function(btn) {
    btn.className = btn.textContent.toLowerCase() === (_feedFilter === "all" ? "all" : _feedFilter === "round" ? "rounds" : _feedFilter === "chat" ? "chat" : "range") ? "a" : "";
  });
}

