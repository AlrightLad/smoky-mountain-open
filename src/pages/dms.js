// ========== DIRECT MESSAGES ==========
var dmConversations = {}, activeDmPartner = null, dmListenerUnsub = null;

function getDmConvoId(a,b){return [a,b].sort().join("_")}
function formatDmTime(date){var now=new Date(),diff=now-date;if(diff<60000)return "now";if(diff<3600000)return Math.floor(diff/60000)+"m";if(diff<86400000)return Math.floor(diff/3600000)+"h";return(date.getMonth()+1)+"/"+date.getDate();}

Router.register("dms", function() {
  var h = '<div class="sh"><h2>Messages</h2><button class="back" onclick="Router.go(\'home\')">← Home</button></div>';
  
  if (!currentUser) {
    h += '<div class="section"><div class="empty"><div class="empty-text">Sign in to use messages</div></div></div>';
    document.querySelector('[data-page="dms"]').innerHTML = h;
    return;
  }
  
  h += '<div id="dmMemberList">' + skeletonMemberRow() + skeletonMemberRow() + skeletonMemberRow() + '</div>';
  document.querySelector('[data-page="dms"]').innerHTML = h;
  
  // Load members from Firebase + local
  var renderDmList = function(members) {
    var myUid = currentUser.uid;
    var myClaimedFrom = currentProfile ? currentProfile.claimedFrom : null;
    var filtered = members.filter(function(m) { 
      if (m.role === "removed") return false;
      if (m.id === myUid) return false;
      if (myClaimedFrom && m.id === myClaimedFrom) return false;
      if (m.claimedFrom && m.claimedFrom === myClaimedFrom && myClaimedFrom) return false;
      return true;
    });
    // Deduplicate — if a member appears as both local and Firebase, keep Firebase version
    var seen = {};
    filtered = filtered.filter(function(m) {
      var key = m.claimedFrom || m.id;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    
    if (!filtered.length) {
      var el = document.getElementById("dmMemberList");
      if (el) el.innerHTML = '<div style="text-align:center;padding:32px 16px"><div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><path d="M38 28a3 3 0 01-3 3H15l-7 7V11a3 3 0 013-3h24a3 3 0 013 3z"/></svg></div><div style="font-size:16px;font-weight:700;color:var(--cream)">No Conversations Yet</div><div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5">Once more members join, you can message them here. Invite friends to grow the crew!</div></div>';
      return;
    }
    
    // Load all previews FIRST, then sort and render once
    if (!db) { renderSortedDms(filtered, {}); return; }
    var previewData = {};
    var loaded = 0;
    var total = filtered.length;
    
    filtered.forEach(function(m) {
      var cid = getDmConvoId(myUid, m.id);
      db.collection("dms").doc(cid).collection("messages").orderBy("createdAt","desc").limit(1).get().then(function(snap) {
        if (!snap.empty) {
          var msg = snap.docs[0].data();
          var ts = msg.createdAt ? (msg.createdAt.toMillis ? msg.createdAt.toMillis() : msg.createdAt) : 0;
          previewData[m.id] = { text: msg.text || "", time: ts, senderId: msg.authorId || msg.senderId || msg.uid || "" };
        }
        loaded++;
        if (loaded >= total) renderSortedDms(filtered, previewData);
      }).catch(function() {
        loaded++;
        if (loaded >= total) renderSortedDms(filtered, previewData);
      });
    });
  };
  
  function renderSortedDms(members, previews) {
    // Sort: conversations with messages by recency, no-message members at bottom alphabetically
    members.sort(function(a, b) {
      var pa = previews[a.id];
      var pb = previews[b.id];
      var ta = pa ? pa.time : 0;
      var tb = pb ? pb.time : 0;
      if (ta || tb) return tb - ta;
      return (a.name || "").localeCompare(b.name || "");
    });
    
    var myUid = currentUser.uid;
    var dh = '';
    members.forEach(function(m) {
      var preview = previews[m.id];
      var previewText = preview ? escHtml(preview.text) : '<span style="color:var(--muted2)">Start a conversation</span>';
      var timeLabel = preview && preview.time ? '<span style="font-size:9px;color:var(--muted);flex-shrink:0">' + feedTimeAgo(preview.time) + '</span>' : '';
      
      // Unread detection: message from someone else, newer than last read
      var isUnread = false;
      if (preview && preview.senderId && preview.senderId !== myUid) {
        var cid = getDmConvoId(myUid, m.id);
        var lastRead = 0;
        try { lastRead = parseInt(localStorage.getItem("dm_read_" + cid)) || 0; } catch(e){}
        if (preview.time > lastRead) isUnread = true;
      }
      
      dh += '<div class="dm-list-item" onclick="Router.go(\'dm-thread\',{partner:\'' + m.id + '\'})">';
      dh += renderAvatar(m, 40, false);
      dh += '<div class="m-info" style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px">';
      dh += '<div class="m-name" style="flex:1;' + (isUnread ? 'color:var(--cream);font-weight:700' : '') + '">' + escHtml(m.name || m.username || m.id) + '</div>';
      if (isUnread) dh += '<span class="pill pill-new" style="font-size:7px;padding:2px 6px">NEW</span>';
      dh += timeLabel + '</div>';
      dh += '<div style="font-size:11px;color:' + (isUnread ? 'var(--cream)' : 'var(--muted)') + ';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;' + (isUnread ? 'font-weight:600' : '') + '">' + previewText + '</div>';
      dh += '</div></div>';
    });
    var el = document.getElementById("dmMemberList");
    if (el) el.innerHTML = dh;
  }
  
  // Load members from Firestore
  if (db) {
    db.collection("members").get().then(function(snap) {
      var members = [];
      snap.forEach(function(doc) { members.push(doc.data()); });
      renderDmList(members);
    }).catch(function() { renderDmList(PB.getPlayers()); });
  } else {
    renderDmList(PB.getPlayers());
  }
});

Router.register("dm-thread", function(params) {
  activeDmPartner = params ? params.partner : null;
  if (!activeDmPartner || !currentUser) { Router.go("dms"); return; }
  
  // Render immediately with loading state — don't wait for anything async
  var threadEl = document.querySelector('[data-page="dm-thread"]');
  threadEl.innerHTML = '<div class="dm-page-wrap"><div class="sh" id="dmThreadHeader" style="flex-shrink:0"><h2 style="font-size:16px">Message</h2><button class="back" onclick="Router.go(\'dms\')">← Back</button></div>' +
    '<div id="dmMessages" class="dm-messages"><div class="loading"><div class="spinner"></div>Loading...</div></div>' +
    '<div class="dm-input-area"><input type="text" id="dmInput" placeholder="Message..." onkeydown="if(event.key===\'Enter\')sendDM()"><button onclick="sendDM()">Send</button></div></div>';
  
  // Start message listener immediately
  if (dmListenerUnsub) dmListenerUnsub();
  if (db) {
    var cid = getDmConvoId(currentUser.uid, activeDmPartner);
    // Mark as read locally for unread indicators
    try { localStorage.setItem("dm_read_" + cid, Date.now().toString()); } catch(e){}
    db.collection("dms").doc(cid).set({participants:[currentUser.uid,activeDmPartner].sort(),updatedAt:fsTimestamp()},{merge:true}).catch(function(){});
    var readUpdate = {};
    readUpdate["lastRead." + currentUser.uid] = fsTimestamp();
    db.collection("dms").doc(cid).update(readUpdate).catch(function(){});
    dmListenerUnsub = db.collection("dms").doc(cid).collection("messages").orderBy("createdAt","asc").onSnapshot(function(snap) {
      var msgs = []; snap.forEach(function(doc){msgs.push(doc.data())});
      var c = document.getElementById("dmMessages"); if (!c) return;
      if (!msgs.length) { c.innerHTML = '<div class="empty" style="padding-top:60px"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg></div><div class="empty-text">Start the conversation</div></div>'; return; }
      var mh = "";
      msgs.forEach(function(msg) {
        var mine = msg.authorId === currentUser.uid;
        mh += '<div class="dm-bubble-row ' + (mine?"mine":"theirs") + '"><div class="dm-bubble">' + escHtml(msg.text);
        if (msg.createdAt && msg.createdAt.toDate) mh += '<div class="dm-bubble-time">' + formatDmTime(msg.createdAt.toDate()) + '</div>';
        mh += '</div></div>';
      });
      c.innerHTML = mh; c.scrollTop = c.scrollHeight;
    });
  }
  
  // Update header with partner name async — page is already showing
  function setHeader(name, partner) {
    var hdr = document.getElementById("dmThreadHeader");
    if (!hdr) return;
    hdr.innerHTML = '<div style="display:flex;align-items:center;gap:8px">' + renderAvatar(partner, 28, true) + '<h2 style="font-size:16px">' + escHtml(name) + '</h2></div><button class="back" onclick="Router.go(\'dms\')">← Back</button>';
    var inp = document.getElementById("dmInput");
    if (inp) inp.placeholder = "Message " + name + "...";
  }
  
  var partner = PB.getPlayer(activeDmPartner);
  if (partner) {
    setHeader(partner.name || partner.username, partner);
  } else if (db) {
    db.collection("members").doc(activeDmPartner).get().then(function(doc) {
      var d = doc.exists ? doc.data() : null;
      setHeader(d ? (d.name || d.username || activeDmPartner) : activeDmPartner, d);
    }).catch(function() { setHeader(activeDmPartner, null); });
  }
});

function sendDM() {
  var input = document.getElementById("dmInput"); var text = input.value.trim();
  if (!text || !db || !currentUser || !activeDmPartner) return;
  var cid = getDmConvoId(currentUser.uid, activeDmPartner);
  var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
  db.collection("dms").doc(cid).collection("messages").add({ text:text, authorId:currentUser.uid, authorName:myName, createdAt:fsTimestamp() })
    .then(function(){
      input.value=""; 
      db.collection("dms").doc(cid).update({lastMessage:text,lastMessageAt:fsTimestamp(),lastMessageBy:currentUser.uid});
      // Send notification to the other person
      sendNotification(activeDmPartner, {
        type: "dm",
        title: "New Message",
        message: myName + ": " + text.substring(0, 50) + (text.length > 50 ? "..." : ""),
        linkPage: "dms"
      });
    })
    .catch(function(){Router.toast("Failed to send")});
}


