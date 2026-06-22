// Firestore activity feed + likes + comments + reactions. Extracted per W1.A5.

// ========== FIRESTORE ACTIVITY FEED ==========
function renderFeedItem(a) {
  var timeLabel = a.ts ? feedTimeAgo(a.ts) : "";
  // Resolve player for avatar
  var _fp = a.playerId && a.playerId !== "system" ? PB.getPlayer(a.playerId) : null;

  // ── Chat messages ──
  if (a.type === "chat") {
    var clickAttr = a.dest ? ' onclick="' + a.dest + '" style="cursor:pointer"' : '';
    // v8.25.x \u2014 The Caddy renders through the SINGLE canonical avatar + username
    // helpers (branded flag mark + BOT badge), identical to /feed and everywhere
    // else. The old birdie-tinted glyph disc treatment is gone (it was the
    // second, divergent flag disc). a.system covers legacy + normalized bots.
    if (a.system) {
      var caddy = (typeof PB_CADDY !== "undefined") ? PB_CADDY : { id: "the-caddy", name: "The Caddy", bot: true };
      var h = '<div style="display:flex;gap:10px;padding:8px 16px;margin:2px 0;background:rgba(var(--cb-brass-rgb),.06);border-radius:8px"' + clickAttr + '>';
      h += renderAvatar(caddy, 28, false);
      h += '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">';
      h += '<span style="font-size:10px;font-weight:700">' + renderUsername(caddy, '') + '</span>';
      h += '<span style="font-size:9px;color:var(--muted2)">' + timeLabel + '</span></div>';
      h += '<div style="font-size:12px;color:var(--cream);line-height:1.6">' + escHtml(a.sub) + '</div>';
      h += '</div></div>';
      return h;
    }
    var h = '<div style="display:flex;gap:10px;padding:8px 16px;margin:1px 0"' + clickAttr + '>';
    h += renderAvatar(_fp, 28, true);
    h += '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<span style="font-size:10px;font-weight:700;color:var(--gold)">' + renderUsername(_fp, '', true) + '</span>';
    h += '<span style="font-size:9px;color:var(--muted2)">' + timeLabel + '</span></div>';
    h += '<div style="font-size:11px;color:var(--cream);margin-top:2px;line-height:1.5">' + escHtml(a.sub) + '</div>';
    h += '</div></div>';
    return h;
  }

  // ── Range sessions ──
  if (a.type === "range") {
    var h = '<div class="feed-row" style="display:flex;align-items:center;gap:12px;padding:10px 16px"' + (a.dest ? ' onclick="' + a.dest + '"' : '') + '>';
    h += renderAvatar(_fp, 36, true);
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(a.name) + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + escHtml(a.sub || '') + '</div></div>';
    h += '<div style="font-size:9px;color:var(--muted2)">' + timeLabel + '</div>';
    h += '</div>';
    return h;
  }

  // ── Rounds — Instagram-style with avatar ──
  var cardCss = '';
  if (_fp) cardCss = getPlayerCardCss(_fp);
  // v8.24.76 — Pro Shop card skins apply via a class (getPlayerCardClass);
  // legacy COSMETICS_CATALOG cards keep the inline cardCss path. Never collide.
  var cardCls = _fp && typeof getPlayerCardClass === 'function' ? getPlayerCardClass(_fp) : '';
  var h = '<div class="feed-row' + (cardCls ? ' ' + cardCls : '') + '" style="display:flex;gap:12px;padding:12px 16px;align-items:flex-start;' + cardCss + '">';
  // Avatar
  h += renderAvatar(_fp, 44, true);
  // Content
  h += '<div style="flex:1;min-width:0">';
  // Name + score row
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  h += '<div style="min-width:0;flex:1">';
  h += '<div style="display:flex;align-items:center;gap:6px">';
  h += '<span style="font-size:13px;font-weight:700">' + renderUsername(_fp, 'color:var(--cream);', true) + '</span>';
  if (a.live) h += '<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:5px;height:5px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite"></span><span style="font-size:8px;color:var(--live);font-weight:700">LIVE</span></span>';
  h += '</div>';
  if (a.sub) h += '<div style="font-size:11px;color:var(--muted);margin-top:2px;line-height:1.3">' + escHtml(a.sub) + '</div>';
  h += '</div>';
  h += '<div style="flex-shrink:0;text-align:right;margin-left:8px">';
  if (a.score) h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold);line-height:1">' + a.score + '</div>';
  h += '<div style="font-size:9px;color:var(--muted2);margin-top:2px">' + timeLabel + '</div>';
  h += '</div></div>';
  if (a.quip) h += '<div style="font-size:11px;color:var(--gold2);margin-top:4px;font-style:italic;line-height:1.4">' + escHtml(a.quip) + '</div>';  // v8.24.53 XSS: scramble player names

  // Like/comment actions for rounds
  if (a.type === "round" && a.roundId) {
    var likeCount = a.likeCount || 0;
    var commentCount = a.commentCount || 0;
    var isLiked = a.isLiked || false;
    h += '<div class="feed-actions">';
    h += '<div class="feed-action' + (isLiked ? ' active' : '') + '" onclick="event.stopPropagation();likeFeedRound(\'' + a.roundId + '\',this)"><svg viewBox="0 0 16 16" width="14" height="14" fill="' + (isLiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.2"><path d="M8 14s-5.5-3.5-5.5-7A2.5 2.5 0 018 4.5 2.5 2.5 0 0113.5 7C13.5 10.5 8 14 8 14z"/></svg><span>' + (likeCount || '') + '</span></div>';
    h += '<div class="feed-action" onclick="event.stopPropagation();toggleFeedComments(\'' + a.roundId + '\')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 3h12v8H5l-3 3V3z"/></svg><span>' + (commentCount || '') + '</span></div>';
    if (a.dest) h += '<div class="feed-action" onclick="event.stopPropagation();' + a.dest + '" style="margin-left:auto;font-size:10px;font-weight:600;color:var(--gold)">View <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M3 9l6-6M5 3h4v4"/></svg></div>';
    h += '</div>';
    h += '<div id="feedComments_' + a.roundId + '" class="feed-comments" style="display:none"></div>';
  }

  h += '</div></div>';
  return h;
}

function loadHomeActivityFeed() {
  var el = document.getElementById("homeActivityFeed");
  if (!el || !db) {
    // Fallback to in-memory data
    if (el) renderHomeActivityFromMemory(el);
    return;
  }
  var items = [];
  var pending = 0;
  function tryRender() {
    if (pending > 0) return;
    if (!items.length) {
      el.innerHTML = '<div class="card"><div class="empty" style="padding:24px"><div class="empty-text">Nothing yet</div><div style="font-size:10px;color:var(--muted2);margin-top:4px">Log a round, hit the range, or post a tee time</div></div></div>';
      return;
    }
    items.sort(function(a,b){return (b.ts||0)-(a.ts||0)});
    var h = '<div class="card" style="max-height:600px;overflow-y:auto;-webkit-overflow-scrolling:touch">';
    items.forEach(function(a) { h += renderFeedItem(a); });
    h += '</div>';
    el.innerHTML = h;
  }

  // 1. Recent rounds from Firestore
  pending++;
  leagueQuery("rounds").orderBy("createdAt","desc").limit(30).get().then(function(snap) {
    var scrambleGroups = {}; // Group scramble by course+date
    snap.forEach(function(doc) {
      var r = doc.data();
      // v8.14.0 — Defense-in-depth render guard. Abandoned rounds are
      // dev-test artifacts and never surface publicly (Gate 8a memory rule).
      if (r.status === "abandoned") return;
      // leagueId filtered by leagueQuery()
      var rid = doc.id;
      var isScramble = r.format === "scramble" || r.format === "scramble4";

      if (isScramble) {
        // Group scramble rounds into one feed entry. v8.25.233 — prefer the round's
        // STAMPED team identity (scrambleTeamId/teamName/teamMembers) so the entry
        // reads "The Chuds logged…" not the logger; key by team when present so two
        // teams at the same course+date don't merge.
        var groupKey = (r.scrambleTeamId ? r.scrambleTeamId : "anon") + "|" + (r.course||"") + "|" + (r.date||"");
        if (!scrambleGroups[groupKey]) {
          scrambleGroups[groupKey] = { course: r.course, date: r.date, score: r.score, tee: r.tee, players: [], ts: tsMillis(r.createdAt), rid: rid, likes: r.likes || [], comments: r.comments || [], teamName: r.teamName || null, scrambleTeamId: r.scrambleTeamId || null, teamMembers: r.teamMembers || null, teamMemberNames: r.teamMemberNames || null };
        }
        scrambleGroups[groupKey].players.push(r.playerName || "Parbaugh");
        return;
      }
      
      var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
      var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");
      var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
      var feedCourse = r.course ? PB.getCourseByName(r.course) : null;
      var teeLabel = r.tee ? " · " + r.tee : (feedCourse && feedCourse.tee ? " · " + feedCourse.tee : "");
      var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
      var likes = r.likes || [];
      var comments = r.comments || [];
      var isLiked = currentUser ? likes.indexOf(currentUser.uid) !== -1 : false;
      var timeAgo = feedTimeAgo(tsMillis(r.createdAt));
      items.push({type:"round", roundId:rid, playerId:r.player, playerName:r.playerName||"A Parbaugh", name:(r.playerName||"A Parbaugh") + " posted a round", sub:(r.course||"") + teeLabel + " · " + r.score + holeLabel + fmtLabel, quip:quip, score:r.score, date:r.date||"", ts:tsMillis(r.createdAt), dest:"Router.go('rounds',{roundId:'" + rid + "'})", likeCount:likes.length, commentCount:comments.length, isLiked:isLiked, timeAgo:timeAgo});
    });
    // Add grouped scramble entries
    Object.values(scrambleGroups).forEach(function(g) {
      // v8.25.233 — prefer the STAMPED team identity; fall back to id lookup, then
      // the legacy name-match heuristic only for un-stamped legacy rounds.
      var teamObj = g.scrambleTeamId ? PB.getScrambleTeams().find(function(t){ return t.id === g.scrambleTeamId; }) : null;
      if (!teamObj) teamObj = PB.getScrambleTeams().find(function(t){ return g.players.some(function(pn){ return t.members.some(function(mid){ var mp = PB.getPlayer(mid); return mp && mp.name === pn; }); }); });
      var teamName = g.teamName || (teamObj ? teamObj.name : "Scramble Team");
      // Roster = the team's full membership when known (so it reads as the TEAM,
      // not just whoever logged); else the players who logged.
      var roster = (g.teamMemberNames && g.teamMemberNames.length) ? g.teamMemberNames
        : ((teamObj && teamObj.members && teamObj.members.length)
        ? teamObj.members.map(function(mid){ var mp = PB.getPlayer(mid); if (mp && (mp.name||mp.username)) return mp.name || mp.username; if (typeof fbMemberCache !== "undefined" && fbMemberCache[mid]) return fbMemberCache[mid].name || fbMemberCache[mid].username; return null; }).filter(Boolean)
        : g.players);
      var playerList = roster.join(", ");
      var teeLabel = g.tee ? " · " + g.tee : "";
      var isLiked = currentUser ? g.likes.indexOf(currentUser.uid) !== -1 : false;
      items.push({type:"round", roundId:g.rid, name:teamName + " posted a scramble", sub:(g.course||"") + teeLabel + " · " + g.score + " · Scramble", quip:playerList, score:g.score, date:g.date||"", ts:g.ts, dest:"Router.go('rounds',{roundId:'" + g.rid + "'})", likeCount:g.likes.length, commentCount:g.comments.length, isLiked:isLiked, timeAgo:feedTimeAgo(g.ts)});
    });
    pending--; tryRender();
  }).catch(function() {
    // orderBy may need index — fall back to state.rounds
    PB.getRounds().slice().reverse().slice(0,30).forEach(function(r) {
      var comm = PB.generateRoundCommentary({score:r.score,rating:r.rating||72,slope:r.slope||113,player:r.player,holesPlayed:r.holesPlayed||18});
      var quip = comm.roasts.length ? comm.roasts[0] : (comm.highlights.length ? comm.highlights[0] : "");
      var holeLabel = r.holesPlayed && r.holesPlayed <= 9 ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
      var feedCourse2 = r.course ? PB.getCourseByName(r.course) : null;
      var teeLabel = r.tee ? " · " + r.tee : (feedCourse2 && feedCourse2.tee ? " · " + feedCourse2.tee : "");
      items.push({type:"round", roundId:r.id, name:(r.playerName||"A Parbaugh") + " posted a round", sub:(r.course||"") + teeLabel + " · " + r.score + holeLabel, quip:quip, score:r.score, date:r.date||"", ts:r.timestamp||0, dest:"Router.go('rounds',{roundId:'" + r.id + "'})", likeCount:(r.likes||[]).length, commentCount:(r.comments||[]).length, isLiked:currentUser?(r.likes||[]).indexOf(currentUser.uid)!==-1:false, timeAgo:feedTimeAgo(r.timestamp||0)});
    });
    pending--; tryRender();
  });

  // 2. Range sessions from live listener
  pending++;
  if (typeof liveRangeSessions !== "undefined") {
    liveRangeSessions.filter(function(s){return s.visibility !== "private";}).slice(0,8).forEach(function(s) {
      var name = s.playerName || s.playerId || "A Parbaugh";
      var sub = (s.durationMin ? s.durationMin + " min" : "") + (s.focus ? " · " + s.focus : "");
      var sessionDest = s._id ? "Router.go('range-detail',{sessionId:'" + s._id + "'})" : (s.playerId ? "Router.go('members',{id:'" + s.playerId + "'})" : "Router.go('range')");
      items.push({type:"range", playerId:s.playerId||"", name:name + " hit the range", sub:sub||"Range session", date:s.date||"", ts:s.startedAt ? new Date(s.startedAt).getTime() : 0, dest:sessionDest});
    });
  }
  pending--; tryRender();

  // 3. Tee times — upcoming and recent
  pending++;
  leagueQuery("teetimes").orderBy("createdAt","desc").limit(15).get().then(function(snap) {
    var today = localDateStr();
    snap.forEach(function(doc) {
      var t = doc.data();
      var isToday = t.date === today;
      var isFuture = t.date > today;
      var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted";}).length : 0;
      items.push({type:"tee_time", name:(t.postedByName||"Someone") + " posted a tee time", sub:(t.courseName||"Tee time") + " · " + (t.date||"") + (t.time ? " at " + t.time : "") + " · " + accepted + " going", date:t.date||"", ts:tsMillis(t.createdAt), live:isToday, dest:"Router.go('teetimes')"});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 4. Active/recent Parbaugh Rounds
  pending++;
  leagueQuery("syncrounds").orderBy("createdAt","desc").limit(15).get().then(function(snap) {
    snap.forEach(function(doc) {
      var r = doc.data();
      // leagueId filtered by leagueQuery()
      if (r.status === "discarded") return;
      var isLive = r.status === "active";
      var dest = isLive ? "Router.go('syncround',{roundId:'" + doc.id + "'})" : "";
      items.push({type:"syncround", name:(r.createdByName||"A Parbaugh") + (isLive ? " is playing a Parbaugh Round" : " finished a Parbaugh Round"), sub:(r.courseName||"") + (r.format ? " · " + r.format : "") + (isLive ? " · Tap to join" : ""), date:"", ts:tsMillis(r.createdAt), live:isLive, dest:dest});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 5. Active solo live rounds from Firestore
  // v8.13.0 (Ship 4a Gate 1) — dest navigates to /round/:roundId when lr.roundId
  // is present. Pre-v8.13.0 docs without roundId remain visible but non-tappable
  // (acceptable migration window — next saveLiveState backfills field).
  pending++;
  leagueQuery("liverounds").where("status","==","active").limit(8).get().then(function(snap) {
    snap.forEach(function(doc) {
      var lr = doc.data();
      if (currentUser && doc.id === currentUser.uid) return; // skip own
      var thru = lr.thru || 0;
      if (thru < 1) return;
      var scoreTxt = lr.totalScore ? lr.totalScore + " thru " + thru : "thru " + thru;
      var dest = lr.roundId ? "Router.go('round',{roundId:'" + lr.roundId + "'})" : "";
      items.push({type:"liveround", name:(lr.playerName||"A Parbaugh") + " is playing", sub:(lr.course||"") + " · " + scoreTxt, date:"", ts:tsMillis(lr.updatedAt) || Date.now(), live:true, dest:dest});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });

  // 6. Trash talk / chat messages
  pending++;
  leagueQuery("chat").orderBy("createdAt", "desc").limit(20).get().then(function(snap) {
    snap.forEach(function(doc) {
      var msg = doc.data();
      // RENDER-TIME NORMALIZATION (v8.25.x): detect bot content under the new
      // canonical identity OR any legacy shape, so already-stored docs render
      // through the single Caddy identity (no Firestore migration).
      var isSystem = (typeof isCaddyAuthor === "function") ? isCaddyAuthor(msg)
        : (!!msg.system || msg.authorId === "system" || msg.authorName === "The Caddy" || msg.authorName === "The Caddies" || msg.authorName === "Parbaughs");
      var text = msg.text || "";
      // Skip automated messages that duplicate other feed items
      if (text.indexOf("range session") !== -1 && isSystem) return;
      if (text.indexOf("scoring is complete") !== -1) return;
      if (text.indexOf("just finished a") !== -1 && text.indexOf("range") !== -1) return;
      var dest = "";
      if (msg.linkType === "event" && msg.tripId) dest = "Router.go('scorecard',{tripId:'" + msg.tripId + "'})";
      else if (msg.linkType === "round" && msg.roundId) dest = "Router.go('rounds',{roundId:'" + msg.roundId + "'})";
      items.push({type:"chat", playerId: isSystem ? "" : (msg.authorId||""), name:(isSystem ? "The Caddies" : msg.authorName || msg.user || "Member"), sub:text, ts:tsMillis(msg.createdAt) || (msg.timestamp || 0), system:isSystem, dest:dest});
    });
    pending--; tryRender();
  }).catch(function() { pending--; tryRender(); });
}

function sendHomeChat() {
  var input = document.getElementById("homeChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  db.collection("chat").add(leagueDoc("chat", {
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Anon",
    createdAt: fsTimestamp()
  })).then(function() {
    loadHomeActivityFeed(); // Refresh
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't send your message.")); });
}

function feedTimeAgo(ts) {
  if (!ts) return "";
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h";
  var days = Math.floor(hrs / 24);
  if (days < 7) return days + "d";
  var weeks = Math.floor(days / 7);
  return weeks + "w";
}

function likeFeedRound(roundId, el) {
  if (!db || !currentUser) { Router.toast("Sign in to give kudos"); return; }
  var uid = currentUser.uid;
  window._suppressRoundsRerender = true; // Don't re-render on this Firestore update
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) { window._suppressRoundsRerender = false; return; }
    var likes = doc.data().likes || [];
    var idx = likes.indexOf(uid);
    if (idx !== -1) likes.splice(idx, 1);
    else likes.push(uid);
    return db.collection("rounds").doc(roundId).update({ likes: likes }).then(function() {
      var isLiked = likes.indexOf(uid) !== -1;
      if (el) {
        el.className = "feed-action" + (isLiked ? " active" : "");
        var svg = el.querySelector("svg");
        if (svg) svg.setAttribute("fill", isLiked ? "var(--gold)" : "none");
        var span = el.querySelector("span");
        if (span) span.textContent = likes.length || "";
      }
      setTimeout(function() { window._suppressRoundsRerender = false; }, 2000);
    });
  }).catch(function() { window._suppressRoundsRerender = false; Router.toast("Could not give kudos to round"); });
}

// Golf-themed reactions popup
function showFeedReactions(roundId, btnEl) {
  var existing = document.getElementById("feedReactPopup_" + roundId);
  if (existing) { existing.remove(); return; }
  // Close any other open popups
  document.querySelectorAll('[id^="feedReactPopup_"]').forEach(function(el) { el.remove(); });
  var reactions = [
    {emoji: "\uD83D\uDD25", key: "fire"},     // 🔥
    {emoji: "\uD83D\uDC4F", key: "clap"},     // 👏
    {emoji: "\u26F3", key: "flag"},            // ⛳
    {emoji: "\uD83D\uDC80", key: "skull"},     // 💀
    {emoji: "\uD83C\uDFC6", key: "trophy"},    // 🏆
    {emoji: "\uD83D\uDE02", key: "laugh"}      // 😂
  ];
  var popup = document.createElement("div");
  popup.id = "feedReactPopup_" + roundId;
  popup.style.cssText = "display:flex;gap:4px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:4px 8px;position:absolute;bottom:100%;left:0;z-index:10;box-shadow:var(--shadow-md)";
  reactions.forEach(function(r) {
    var btn = document.createElement("span");
    btn.textContent = r.emoji;
    btn.style.cssText = "font-size:20px;cursor:pointer;padding:4px;border-radius:50%;transition:transform .1s";
    btn.onclick = function(e) { e.stopPropagation(); addFeedReaction(roundId, r.key); popup.remove(); };
    popup.appendChild(btn);
  });
  btnEl.parentElement.style.position = "relative";
  btnEl.parentElement.appendChild(popup);
  setTimeout(function() { document.addEventListener("click", function once() { popup.remove(); document.removeEventListener("click", once); }); }, 10);
}

function addFeedReaction(roundId, reactionKey) {
  if (!currentUser || !db) return;
  var uid = currentUser.uid;
  window._suppressRoundsRerender = true;
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var reactions = doc.data().reactions || {};
    if (!reactions[reactionKey]) reactions[reactionKey] = [];
    var idx = reactions[reactionKey].indexOf(uid);
    if (idx !== -1) reactions[reactionKey].splice(idx, 1);
    else reactions[reactionKey].push(uid);
    return db.collection("rounds").doc(roundId).update({ reactions: reactions });
  }).then(function() {
    window._suppressRoundsRerender = false;
    Router.toast("Reacted!");
  }).catch(function() { window._suppressRoundsRerender = false; });
}

function toggleFeedComments(roundId) {
  var el = document.getElementById("feedComments_" + roundId);
  if (!el) return;
  if (el.style.display !== "none") { el.style.display = "none"; return; }
  el.style.display = "block";
  el.innerHTML = '<div style="text-align:center;padding:8px;font-size:10px;color:var(--muted)">Loading…</div>';
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) { el.innerHTML = ""; return; }
    var comments = doc.data().comments || [];
    var h = "";
    comments.forEach(function(c) {
      h += '<div class="feed-comment"><span class="feed-comment-name">' + escHtml(c.name || "Parbaugh") + '</span><span class="feed-comment-text">' + escHtml(c.text) + '</span></div>';
    });
    if (!comments.length) h += '<div style="font-size:10px;color:var(--muted2);padding:4px 0">No comments yet</div>';
    h += '<div class="feed-comment-input"><input type="text" id="feedCmtInput_' + roundId + '" placeholder="Add a comment..." onkeydown="if(event.key===\'Enter\')submitFeedComment(\'' + roundId + '\')"><button onclick="submitFeedComment(\'' + roundId + '\')">Post</button></div>';
    el.innerHTML = h;
    var input = document.getElementById("feedCmtInput_" + roundId);
    if (input) input.focus();
  }).catch(function() { el.innerHTML = renderLoadError("comments", "toggleFeedComments('" + roundId + "');toggleFeedComments('" + roundId + "')"); });
}

function submitFeedComment(roundId) {
  var input = document.getElementById("feedCmtInput_" + roundId);
  if (!input || !input.value.trim()) return;
  if (!db || !currentUser) { Router.toast("Sign in to comment"); return; }
  var text = input.value.trim();
  var name = currentProfile ? (currentProfile.name || currentProfile.username) : "Parbaugh";
  input.value = "";
  db.collection("rounds").doc(roundId).get().then(function(doc) {
    if (!doc.exists) return;
    var comments = doc.data().comments || [];
    comments.push({ uid: currentUser.uid, name: name, text: text, at: new Date().toISOString() });
    return db.collection("rounds").doc(roundId).update({ comments: comments });
  }).then(function() {
    toggleFeedComments(roundId); // close
    setTimeout(function() { toggleFeedComments(roundId); }, 50); // reopen with new comment
    // Update comment count in the action bar
    var actionEl = document.querySelector('#feedComments_' + roundId).previousElementSibling;
    if (actionEl) {
      var cmtBtn = actionEl.querySelectorAll('.feed-action')[1];
      if (cmtBtn) {
        var span = cmtBtn.querySelector('span');
        if (span) span.textContent = parseInt(span.textContent || 0) + 1;
      }
    }
  }).catch(function() { Router.toast("Failed to post comment"); });
}

function renderOnlineSection() {
  if (typeof hookWatchRoundRefresh === "function") hookWatchRoundRefresh(); // keep live watch page in sync when presence updates
  var el = document.getElementById("onlineSection");
  if (!el) return;
  
  var uids = Object.keys(onlineMembers);
  // Dedup: ensure each name only shows once (handles multiple sessions from same user)
  var seenNames = {};
  var dedupedUids = [];
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    var name = data.name || uid;
    if (!seenNames[name]) { seenNames[name] = uid; dedupedUids.push(uid); }
  });
  uids = dedupedUids;
  if (uids.length <= 1) { el.innerHTML = ""; return; }
  
  var h = '<div style="padding:8px 16px 12px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><div style="width:6px;height:6px;border-radius:50%;background:var(--live);animation:pulse-dot 2s infinite"></div><span style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">' + uids.length + ' Online Now</span></div>';
  h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
  
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    var cachedProfile = data._profile || null;
    
    // Build a synthetic player object that getAvatar can use
    // Priority: cached Firestore profile > local player > presence data
    var p = PB.getPlayer(uid);
    if (!p) {
      var players = PB.getPlayers();
      for (var i = 0; i < players.length; i++) {
        if (players[i].claimedFrom && players[i].id === uid) { p = players[i]; break; }
      }
    }
    if (!p && currentProfile && currentProfile.id === uid) p = currentProfile;
    if (!p && cachedProfile) p = cachedProfile;
    
    // If we still don't have a profile but have a cached one, use it
    // Ensure the player object has the Firebase UID as id so photoCache lookup works
    var avatarPlayer = null;
    if (p) {
      // Create a copy with the Firebase UID as the id for photo lookup
      avatarPlayer = Object.assign({}, p);
      if (avatarPlayer.id !== uid) {
        // The local id doesn't match Firebase UID — store the Firebase UID so getAvatar checks photoCache correctly
        avatarPlayer._fbUid = uid;
      }
    }
    
    var name = (p ? (p.name || p.username) : null) || data.name || "Member";
    var isMe = currentUser && uid === currentUser.uid;
    var lvlForOnline = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(uid));
    var lvlNum = lvlForOnline ? lvlForOnline.level : null;
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0" onclick="Router.go(\'members\',{id:\'' + uid + '\'})">';
    h += '<div style="position:relative;width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center">';
    h += renderAvatar(p || {name:name,id:uid}, 40, false);
    if (lvlNum) h += '<div style="position:absolute;bottom:0;right:0;background:var(--gold);color:var(--bg);font-size:7px;font-weight:800;border-radius:6px;padding:1px 3px;border:1.5px solid var(--bg);line-height:1.3;min-width:12px;text-align:center;z-index:2">' + lvlNum + '</div>';
    h += '</div>';
    h += '<div style="font-size:9px;color:' + (isMe ? 'var(--gold)' : 'var(--muted)') + ';max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center">' + escHtml(name) + '</div>';
    h += '</div>';
  });
  
  h += '</div></div>';
  el.innerHTML = h;
  
  // Async fetch missing profiles from Firestore
  uids.forEach(function(uid) {
    var data = onlineMembers[uid];
    if (!data._profile && db) {
      db.collection("members").doc(uid).get().then(function(doc) {
        if (doc.exists) {
          onlineMembers[uid]._profile = doc.data();
          // Only re-render if we're still on the home page
          if (Router.getPage() === "home") renderOnlineSection();
        }
      }).catch(function(){});
    }
  });
}


