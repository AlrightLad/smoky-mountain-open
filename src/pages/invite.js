// ========== INVITE SYSTEM PAGE ==========
Router.register("invite", function() {
  var h = '<div class="sh"><h2>Invites</h2><button class="back" onclick="Router.go(\'settings\')">← Back</button></div>';
  var remaining = currentProfile ? (currentProfile.role === "commissioner" ? "∞" : ((currentProfile.maxInvites||3) - (currentProfile.invitesUsed||0))) : 0;
  h += '<div class="form-section"><div style="text-align:center;margin-bottom:16px"><div style="font-size:12px;color:var(--muted)">Generate an invite code for a new member</div>';
  h += '<div style="margin-top:6px;font-size:11px;color:var(--gold)">Remaining: ' + remaining + '</div></div>';
  h += '<button class="btn full green" onclick="generateInvite()">Generate Invite Code</button>';
  h += '<div id="generatedInvite"></div>';
  h += '<div id="myInvites" style="margin-top:16px"><div class="loading"><div class="spinner"></div>Loading...</div></div>';
  h += '</div>';
  document.querySelector('[data-page="invite"]').innerHTML = h;

  if (db && currentUser) {
    db.collection("invites").where("createdBy","==",currentUser.uid).get().then(function(snap) {
      var invites = []; snap.forEach(function(doc){invites.push(doc.data())});
      var ih = '<div class="sec-head"><span class="sec-title">Your invites</span></div>';
      if (!invites.length) ih += '<div style="font-size:11px;color:var(--muted)">None yet</div>';
      invites.forEach(function(inv) {
        ih += '<div class="card"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center">';
        ih += '<span style="font-family:monospace;font-size:13px;font-weight:700;color:var(--gold);letter-spacing:2px">' + inv.code + '</span>';
        ih += '<span style="font-size:10px;color:' + (inv.status==="active"?"var(--birdie)":"var(--muted)") + '">' + (inv.status||"").toUpperCase() + '</span>';
        ih += '</div></div></div>';
      });
      document.getElementById("myInvites").innerHTML = ih;
    });
  }
});

var INVITE_EXPIRY_DAYS = 7;

function createInviteDoc(code) {
  var expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return {
    code: code,
    createdBy: currentUser.uid,
    createdByName: PB.getDisplayName(currentProfile),
    usedBy: null,
    status: "active",
    createdAt: fsTimestamp(),
    expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt)
  };
}

function isInviteExpired(invite) {
  if (!invite.expiresAt) return false;
  var exp = invite.expiresAt.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt);
  return new Date() > exp;
}

function generateInvite() {
  if (!db || !currentUser || !currentProfile) { Router.toast("Not ready — try refreshing"); return; }
  var isComm = currentProfile.role === "commissioner";
  if (!isComm && (currentProfile.invitesUsed||0) >= (currentProfile.maxInvites||3)) { Router.toast("No invites remaining"); return; }
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; var code = "PB-";
  for (var i=0;i<8;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  var memberDocId = currentProfile.docId || currentUser.uid;
  var inviteLink = "https://alrightlad.github.io/smoky-mountain-open/?invite=" + code;

  var resultEl = document.getElementById("generatedInvite");
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">Generating...</div>';

  db.collection("invites").doc(code).set(createInviteDoc(code))
    .then(function() {
      _lastGeneratedInvite = { code: code, link: inviteLink };
      currentProfile.invitesUsed = (currentProfile.invitesUsed||0)+1;
      showGeneratedInviteSettings();
      Router.toast("Invite created!");
      setTimeout(function() {
        db.collection("members").doc(memberDocId).update({invitesUsed:firebase.firestore.FieldValue.increment(1)}).catch(function(){});
      }, 1500);
    })
    .catch(function(err) {
      pbWarn("[Invite] Error:", err);
      _lastGeneratedInvite = null;
      if (resultEl) resultEl.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--red);text-align:center">Failed: ' + (err.message || "Permission denied") + '</div>';
      Router.toast("Failed to create invite");
    });
}

function showGeneratedInviteSettings() {
  if (!_lastGeneratedInvite) return;
  var resultEl = document.getElementById("generatedInvite");
  if (!resultEl) return;
  var code = _lastGeneratedInvite.code;
  var inviteLink = _lastGeneratedInvite.link;
  resultEl.innerHTML = '<div class="invite-code">'
    + '<div class="code">' + code + '</div>'
    + '<div style="margin:10px 0 6px"><input type="text" readonly value="' + inviteLink + '" id="inviteLinkField" style="width:100%;font-size:10px;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--cream);text-align:center;font-family:monospace" onclick="this.select()"></div>'
    + '<button class="btn full outline" onclick="copyInviteLink()" style="font-size:11px;padding:10px;margin-top:4px" id="copyInviteBtn">Copy invite link</button>'
    + '<div class="hint" style="margin-top:8px">Send this link — code auto-fills · Expires in ' + INVITE_EXPIRY_DAYS + ' days</div>'
    + '</div>';
}


