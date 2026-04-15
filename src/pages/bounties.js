/* ================================================
   PAGE: BOUNTY BOARD — Place coin bounties on golf achievements
   Auto-claims when a qualifying round is logged.
   ================================================ */

Router.register("bounties", function() {
  var uid = currentUser ? currentUser.uid : null;
  var balance = getParCoinBalance(uid);

  var h = '<div class="sh"><h2>Bounty Board</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'home\')">← Back</button><button class="btn-sm green" onclick="showCreateBounty()">+ Post Bounty</button></div></div>';

  // Balance
  h += '<div style="padding:0 16px 8px;display:flex;align-items:center;gap:8px">';
  h += '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="var(--gold)" stroke-width="1.3"><circle cx="10" cy="10" r="8"/><path d="M10 5v10M7 7.5h4.5a2 2 0 010 4H7"/></svg>';
  h += '<span style="font-size:14px;font-weight:700;color:var(--gold)">' + balance + '</span>';
  h += '<span style="font-size:10px;color:var(--muted)">ParCoins</span></div>';

  h += '<div id="bounty-board"><div class="loading"><div class="spinner"></div>Loading bounties...</div></div>';
  h += '<div id="bounty-create" style="display:none"></div>';

  document.querySelector('[data-page="bounties"]').innerHTML = h;

  // Load active bounties
  if (db) {
    db.collection("bounties").orderBy("createdAt", "desc").limit(30).get().then(function(snap) {
      var bounties = [];
      snap.forEach(function(doc) { var d = Object.assign({_id: doc.id}, doc.data()); if (d.status === "active") bounties.push(d); });
      _renderBountyBoard(bounties, uid);
    }).catch(function() {
      _renderBountyBoard([], uid);
    });
  }
});

function _renderBountyBoard(bounties, uid) {
  var el = document.getElementById("bounty-board");
  if (!el) return;
  if (!bounties.length) {
    var eh = '<div style="padding:24px 16px;text-align:center">';
    eh += '<div style="margin-bottom:12px"><svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="16"/><circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="2" fill="var(--gold)"/></svg></div>';
    eh += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold);margin-bottom:6px">No Active Bounties</div>';
    eh += '<div style="font-size:12px;color:var(--muted);line-height:1.5;max-width:280px;margin:0 auto 16px">Post a bounty and challenge your crew. Bet coins that nobody can break 80 at your home course or birdie the hardest hole.</div>';
    eh += '<button class="btn full green" onclick="showCreateBounty()" style="max-width:240px;margin:0 auto;font-size:13px;padding:14px">Post a Bounty</button>';
    // Example bounties
    eh += '<div style="margin-top:20px;text-align:left">';
    eh += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;text-align:center">Bounty Ideas</div>';
    var examples = ["Break 80 at Heritage Hills — 100 coins", "Birdie Hole 7 at Briarwood — 50 coins", "Beat Mr Parbaugh\'s 98 at Sequoyah — 75 coins"];
    examples.forEach(function(ex) {
      eh += '<div style="padding:8px 12px;margin-bottom:4px;background:var(--bg3);border:1px dashed var(--border);border-radius:var(--radius);font-size:11px;color:var(--muted2);font-style:italic">' + ex + '</div>';
    });
    eh += '</div></div>';
    el.innerHTML = eh;
    return;
  }
  var bh = '';
  bounties.forEach(function(b) { bh += _renderBountyCard(b, uid); });
  el.innerHTML = bh;
}

function _renderBountyCard(b, uid) {
  var isOwner = b.createdBy === uid;
  var typeLabel = b.type === "score" ? "Score Target" : "Birdie Bounty";
  var targetDesc = b.type === "score"
    ? "Shoot " + b.targetScore + " or better at " + escHtml(b.course)
    : "Birdie (or better) hole " + b.targetHole + " at " + escHtml(b.course);
  var expiresStr = "";
  if (b.expiresAt) {
    var exp = b.expiresAt.toDate ? b.expiresAt.toDate() : new Date(b.expiresAt);
    var daysLeft = Math.ceil((exp - new Date()) / (1000*60*60*24));
    expiresStr = daysLeft > 0 ? daysLeft + " day" + (daysLeft !== 1 ? "s" : "") + " left" : "Expired";
  }

  var h = '<div class="card" style="margin:4px 16px"><div style="padding:14px 16px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  h += '<div style="flex:1"><div style="font-size:9px;font-weight:700;color:var(--gold);letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">' + typeLabel + '</div>';
  h += '<div style="font-size:13px;font-weight:600;color:var(--cream)">' + targetDesc + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:4px">Posted by ' + escHtml(b.createdByName || "member") + (expiresStr ? ' · ' + expiresStr : '') + '</div></div>';
  h += '<div style="text-align:right"><div style="font-size:20px;font-weight:800;color:var(--gold)">' + b.pot + '</div>';
  h += '<div style="font-size:8px;color:var(--muted);letter-spacing:.5px">COINS</div></div>';
  h += '</div>';
  if (isOwner) {
    h += '<div style="margin-top:8px;font-size:10px;color:var(--muted);font-style:italic">Your bounty — waiting for someone to claim it</div>';
  }
  h += '</div></div>';
  return h;
}

function showCreateBounty() {
  var el = document.getElementById("bounty-create");
  if (!el) return;
  var balance = getParCoinBalance(currentUser ? currentUser.uid : null);

  var h = '<div class="card" style="margin:8px 16px"><div class="card-body">';
  h += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:12px">Post a Bounty</div>';

  // Type selector
  h += '<div class="ff"><label class="ff-label">Bounty type</label>';
  h += '<div style="display:flex;gap:6px">';
  h += '<button class="btn-sm" id="bt-score" onclick="selectBountyType(\'score\')" style="flex:1;background:rgba(var(--gold-rgb),.08);border:1px solid var(--gold);color:var(--gold)">Score Target</button>';
  h += '<button class="btn-sm" id="bt-birdie" onclick="selectBountyType(\'birdie\')" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--cream)">Birdie Bounty</button>';
  h += '</div></div>';
  h += '<input type="hidden" id="bounty-type" value="score">';

  // Course
  h += '<div class="ff"><label class="ff-label">Course</label>';
  h += '<input type="text" class="ff-input" id="bounty-course" placeholder="Search for a course..." oninput="showBountyCourseSearch(this)"></div>';
  h += '<div id="search-bounty-course"></div>';

  // Target (changes by type)
  h += '<div id="bounty-target-section">';
  h += '<div class="ff"><label class="ff-label">Target score (beat this to claim)</label>';
  h += '<input type="number" class="ff-input" id="bounty-target-score" placeholder="e.g. 85" inputmode="numeric"></div>';
  h += '</div>';

  // Pot
  h += '<div class="ff"><label class="ff-label">Bounty amount (' + balance + ' available)</label>';
  h += '<input type="number" class="ff-input" id="bounty-pot" value="100" min="50" max="' + balance + '" style="text-align:center;font-size:16px;font-weight:700;color:var(--gold)"></div>';

  // Duration
  h += '<div class="ff"><label class="ff-label">Expires in</label>';
  h += '<select class="ff-input" id="bounty-duration">';
  h += '<option value="7">7 days</option><option value="14">14 days</option><option value="30" selected>30 days</option></select></div>';

  h += '<button class="btn full green" onclick="submitBounty()" style="margin-top:8px">Post Bounty</button>';
  h += '</div></div>';
  el.innerHTML = h;
  el.style.display = "block";
}

var _bountyType = "score";
function selectBountyType(type) {
  _bountyType = type;
  var input = document.getElementById("bounty-type");
  if (input) input.value = type;
  var scoreBtn = document.getElementById("bt-score");
  var birdieBtn = document.getElementById("bt-birdie");
  if (scoreBtn) { scoreBtn.style.background = type === "score" ? "rgba(var(--gold-rgb),.08)" : "transparent"; scoreBtn.style.borderColor = type === "score" ? "var(--gold)" : "var(--border)"; scoreBtn.style.color = type === "score" ? "var(--gold)" : "var(--cream)"; }
  if (birdieBtn) { birdieBtn.style.background = type === "birdie" ? "rgba(var(--gold-rgb),.08)" : "transparent"; birdieBtn.style.borderColor = type === "birdie" ? "var(--gold)" : "var(--border)"; birdieBtn.style.color = type === "birdie" ? "var(--gold)" : "var(--cream)"; }
  var sec = document.getElementById("bounty-target-section");
  if (sec) {
    if (type === "score") {
      sec.innerHTML = '<div class="ff"><label class="ff-label">Target score (beat this to claim)</label><input type="number" class="ff-input" id="bounty-target-score" placeholder="e.g. 85" inputmode="numeric"></div>';
    } else {
      sec.innerHTML = '<div class="ff"><label class="ff-label">Target hole number</label><input type="number" class="ff-input" id="bounty-target-hole" placeholder="e.g. 7" min="1" max="18" inputmode="numeric"></div>';
    }
  }
}

function showBountyCourseSearch(input) {
  courseSearchWithApi(input.value.trim(), "search-bounty-course",
    function(c) { return "document.getElementById('bounty-course').value='" + c.name.replace(/'/g, "\\'") + "';document.getElementById('search-bounty-course').innerHTML=''"; },
    function(v) { return ""; }
  );
}

function submitBounty() {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var type = document.getElementById("bounty-type").value || "score";
  var course = (document.getElementById("bounty-course").value || "").trim();
  if (!course) { Router.toast("Pick a course"); return; }
  var pot = parseInt(document.getElementById("bounty-pot").value) || 0;
  if (pot < 50) { Router.toast("Minimum bounty is 50 coins"); return; }
  var balance = getParCoinBalance(currentUser.uid);
  if (pot > balance) { Router.toast("Not enough coins"); return; }
  var days = parseInt(document.getElementById("bounty-duration").value) || 30;
  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";

  var bountyData = {
    type: type,
    course: course,
    pot: pot,
    status: "active",
    createdBy: currentUser.uid,
    createdByName: myName,
    createdAt: fsTimestamp(),
    expiresAt: new Date(Date.now() + days * 24*60*60*1000)
  };

  if (type === "score") {
    var target = parseInt(document.getElementById("bounty-target-score").value) || 0;
    if (!target) { Router.toast("Set a target score"); return; }
    bountyData.targetScore = target;
  } else {
    var hole = parseInt(document.getElementById("bounty-target-hole").value) || 0;
    if (hole < 1 || hole > 18) { Router.toast("Pick a hole (1-18)"); return; }
    bountyData.targetHole = hole;
  }

  // Deduct coins — MUST succeed before creating bounty
  if (!deductCoins(currentUser.uid, pot, "bounty_post", "Posted bounty at " + course)) return;

  db.collection("bounties").add(bountyData).then(function() {
    db.collection("chat").add({
      id: genId(),
      text: myName + " posted a " + pot + "-coin bounty: " + (type === "score" ? "Shoot " + bountyData.targetScore + " or better" : "Birdie hole " + bountyData.targetHole) + " at " + course + ". Who can claim it?",
      authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
    }).catch(function(){});
    Router.toast("Bounty posted!");
    Router.go("bounties", {}, true);
  }).catch(function(err) { Router.toast("Failed: " + err.message); });
}

// Auto-check bounties when a round is logged
function checkBountyClaims(round) {
  if (!db || !currentUser) return;
  db.collection("bounties").where("status", "==", "active").get().then(function(snap) {
    snap.forEach(function(doc) {
      var b = doc.data();
      if (b.createdBy === currentUser.uid) return; // can't claim own bounty
      if (b.course !== round.course) return;
      // Check expiry
      if (b.expiresAt) {
        var exp = b.expiresAt.toDate ? b.expiresAt.toDate() : new Date(b.expiresAt);
        if (exp < new Date()) return;
      }
      var claimed = false;
      if (b.type === "score" && round.score <= b.targetScore) claimed = true;
      if (b.type === "birdie" && round.holeScores && round.holePars) {
        var hi = b.targetHole - 1;
        var hs = parseInt(round.holeScores[hi]);
        var hp = round.holePars[hi] || 4;
        if (hs && hs < hp) claimed = true;
      }
      if (claimed) {
        var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
        awardCoins(currentUser.uid, b.pot, "bounty_claim", "Claimed bounty at " + b.course + " (" + b.pot + " coins)");
        db.collection("bounties").doc(doc.id).update({ status: "claimed", claimedBy: currentUser.uid, claimedByName: myName, claimedAt: fsTimestamp() });
        db.collection("chat").add({
          id: genId(),
          text: myName + " CLAIMED the " + b.pot + "-coin bounty at " + b.course + "! " + (b.type === "score" ? "Shot " + round.score + " (target: " + b.targetScore + ")" : "Birdied hole " + b.targetHole),
          authorId: "system", authorName: "The Caddy", createdAt: fsTimestamp()
        }).catch(function(){});
        sendNotification(b.createdBy, { type: "bounty_claimed", title: "Bounty claimed!", message: myName + " claimed your " + b.pot + "-coin bounty at " + b.course, page: "bounties" });
        Router.toast("BOUNTY CLAIMED! +" + b.pot + " ParCoins!");
      }
    });
  }).catch(function(){});
}
