// ========== CALENDAR ==========
var calMonth = new Date().getMonth(), calYear = new Date().getFullYear(), calSelectedDate = null;
var liveEvents = [];

// ========== RANGE SESSION SYSTEM ==========
var liveRangeSessions = [];
var activeRangeTimer = null;
var activeRangeStart = null;
var activeRangeDrills = [];
var activeRangeFocus = "";
var rangeActiveView = "rounds"; // "rounds" or "range"
var rangeSessionPrivate = false;
var rangeSessionNotes = "";

var DRILL_LIBRARY = [
  {id:"headcover_trap", name:"Headcover Trap", cat:"path", desc:"Tuck headcover under trail arm to fix over-the-top", equip:"Headcover", howTo:"Place headcover under your right armpit (for righties). Make swings keeping it pinned — if it falls, your trail elbow is flying out and causing an over-the-top path."},
  {id:"alignment_stick_path", name:"Alignment Stick Path", cat:"path", desc:"Stick on ground for visual path feedback", equip:"Alignment stick", howTo:"Lay the stick on the ground along your target line. Practice swinging along the stick's path. For draw work, angle the stick slightly inside-to-out."},
  {id:"trail_elbow_tuck", name:"Trail Elbow Tuck", cat:"path", desc:"Keep trail elbow close on downswing", equip:"None", howTo:"At the top of your backswing, focus on dropping your trail elbow toward your hip before rotating. Feel like the elbow leads the hands down."},
  {id:"inside_out_gate", name:"Inside-Out Gate", cat:"path", desc:"Two tees creating a gate for club path", equip:"2 tees", howTo:"Place two tees about 4 inches apart, slightly outside the ball, angled inside-to-out. Swing through the gate without hitting the tees."},
  {id:"chest_down", name:"Chest-Down Through Impact", cat:"extension", desc:"Maintain spine angle through the ball", equip:"None", howTo:"Focus on keeping your chest pointing at the ball through impact. Feel like your sternum stays over the ball — don't let your hips thrust forward or your spine straighten early."},
  {id:"wall_sit_swing", name:"Wall Sit Swing", cat:"extension", desc:"Practice posture against a wall", equip:"Wall", howTo:"Stand with your butt against a wall in golf posture. Make slow backswings and downswings keeping contact with the wall. This trains you to maintain spine angle."},
  {id:"step_back", name:"Step-Back Drill", cat:"extension", desc:"Step back from address for proper distance", equip:"None", howTo:"Set up to the ball normally, then take one small step back. This forces you to reach slightly, preventing standing too close which causes steep swings and toe hits."},
  {id:"clock_drill", name:"Clock Drill", cat:"short", desc:"Wedge distance control at 9, 10:30, full", equip:"Wedges", howTo:"Hit 10 balls each at three backswing lengths: 9 o'clock (hip height), 10:30 (3/4), and full. Track your carry distances. Goal: consistent gaps between each position."},
  {id:"one_hand_chips", name:"One-Handed Chips", cat:"short", desc:"Feel the clubface with each hand separately", equip:"Wedge", howTo:"Chip 10 balls with only your lead hand, then 10 with only your trail hand. This builds clubface awareness and prevents wrist flip."},
  {id:"ladder_drill", name:"Ladder Drill", cat:"short", desc:"Putt to progressively longer distances", equip:"5 tees or coins", howTo:"Set markers at 10, 20, 30, 40, 50 feet. Putt one ball to each distance, trying to stop within 3 feet. Builds distance control and green-reading."},
  {id:"circle_drill", name:"Circle Drill", cat:"short", desc:"3-foot putts all around the hole", equip:"4-8 balls", howTo:"Place balls in a circle 3 feet from the hole. Make every putt before moving on. If you miss, start over. Builds confidence on short putts under pressure."},
  {id:"slow_motion", name:"Slow Motion Swings", cat:"general", desc:"Full swing at 25% speed for feel", equip:"Any club", howTo:"Make your full swing motion at 25% speed. Feel every position — takeaway, top, transition, impact, follow-through. Do 5 slow then hit one ball. Resets muscle memory."},
  {id:"feet_together", name:"Feet-Together", cat:"general", desc:"Hit balls with feet touching for balance", equip:"7 or 8 iron", howTo:"Address the ball with feet touching. Make half to 3/4 swings. If you lose balance, your weight shift is too aggressive. Trains centered contact."},
  {id:"pause_at_top", name:"Pause-at-Top", cat:"general", desc:"Full pause at top of backswing", equip:"Any club", howTo:"Make your backswing, hold for a full 2 seconds at the top, then swing down. This breaks the rush from backswing to downswing and improves transition timing."},
  {id:"driver_70", name:"Driver Block at 70%", cat:"general", desc:"Driver at 70% effort for control", equip:"Driver", howTo:"Hit drivers at 70% effort focusing on center contact and a controlled fade or straight ball. No swing-for-the-fences. Track fairway accuracy mentally."}
];
var DRILL_CATS = {path:"Path & Plane",extension:"Extension & Posture",short:"Short Game",general:"Full Swing",custom:"My Drills"};
var customDrills = []; // loaded from Firestore via loadCustomDrillsFromFirestore()

// ========== RANGE SESSION DETAIL (read-only) ==========
Router.register("range-detail", function(params) {
  var sessionId = params ? params.sessionId : null;
  var h = '<div class="sh"><h2>Range Session</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  if (!sessionId) {
    h += '<div class="section"><div class="empty"><div class="empty-text">Session not found</div></div></div>';
    document.querySelector('[data-page="range-detail"]').innerHTML = h;
    return;
  }
  
  // Try local cache first
  var session = liveRangeSessions.find(function(s) { return s._id === sessionId || s.id === sessionId; });
  
  function renderSession(s) {
    var player = PB.getPlayer(s.playerId);
    var playerName = s.playerName || (player ? player.name : "A Parbaugh");
    
    h += '<div style="text-align:center;padding:20px 16px;background:linear-gradient(180deg,rgba(var(--gold-rgb),.06),transparent)">';
    h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold)">' + escHtml(playerName) + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + escHtml(s.date || "") + '</div></div>';
    
    // Stats grid
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin:0 16px;border-radius:var(--radius);overflow:hidden">';
    h += '<div style="background:var(--bg2);padding:16px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:var(--gold)">' + (s.durationMin || "—") + '</div><div style="font-size:9px;color:var(--muted);margin-top:2px">MINUTES</div></div>';
    h += '<div style="background:var(--bg2);padding:16px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:var(--birdie)">' + getRangeSessionXP(s) + '</div><div style="font-size:9px;color:var(--muted);margin-top:2px">XP EARNED</div></div>';
    var drillCount = s.drills ? s.drills.length : 0;
    h += '<div style="background:var(--bg2);padding:16px;text-align:center"><div style="font-family:Playfair Display,serif;font-size:24px;font-weight:700;color:var(--cream)">' + drillCount + '</div><div style="font-size:9px;color:var(--muted);margin-top:2px">DRILLS</div></div>';
    h += '</div>';
    
    // Focus
    if (s.focus) {
      h += '<div class="card" style="margin:12px 16px"><div style="padding:12px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Focus Area</div>';
      h += '<div style="font-size:13px;color:var(--cream);font-weight:500">' + escHtml(s.focus) + '</div></div></div>';
    }
    
    // Drills
    if (s.drills && s.drills.length) {
      h += '<div class="card" style="margin:0 16px 12px"><div style="padding:12px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Drills Completed</div>';
      s.drills.forEach(function(d) {
        var drillName = typeof d === "string" ? d : (d.name || d.drill || "Drill");
        var drillDur = typeof d === "object" && d.duration ? d.duration + " min" : "";
        h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
        h += '<span style="font-size:12px;color:var(--cream)">' + escHtml(drillName) + '</span>';
        if (drillDur) h += '<span style="font-size:10px;color:var(--muted)">' + drillDur + '</span>';
        h += '</div>';
      });
      h += '</div></div>';
    }
    
    // Notes
    if (s.notes) {
      h += '<div class="card" style="margin:0 16px 12px"><div style="padding:12px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Notes</div>';
      h += '<div style="font-size:12px;color:var(--cream);line-height:1.5">' + escHtml(s.notes) + '</div></div></div>';
    }
    
    // Feel
    if (s.feel) {
      var feelLabels = {1: "Rough", 2: "Meh", 3: "Solid", 4: "Great", 5: "On Fire"};
      h += '<div style="text-align:center;padding:12px;font-size:11px;color:var(--muted)">Session feel: <span style="color:var(--gold);font-weight:600">' + (feelLabels[s.feel] || s.feel) + '</span></div>';
    }
    
    // Link to player profile
    if (s.playerId) {
      h += '<div style="padding:0 16px 16px"><button class="btn full outline" onclick="Router.go(\'members\',{id:\'' + s.playerId + '\'})">View ' + escHtml(playerName) + '\'s Profile</button></div>';
    }
    
    document.querySelector('[data-page="range-detail"]').innerHTML = h;
  }
  
  if (session) {
    renderSession(session);
  } else if (db) {
    // Load from Firestore
    h += '<div class="loading"><div class="spinner"></div>Loading session...</div>';
    document.querySelector('[data-page="range-detail"]').innerHTML = h;
    db.collection("rangeSessions").doc(sessionId).get().then(function(doc) {
      if (doc.exists) {
        renderSession(doc.data());
      } else {
        document.querySelector('[data-page="range-detail"]').innerHTML = '<div class="sh"><h2>Range Session</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div><div class="section"><div class="empty"><div class="empty-text">Session not found</div></div></div>';
      }
    });
  }
});

function startRangeSessionListener() {
  if (!db) return;
  if (window._rangeUnsub) window._rangeUnsub();
  window._rangeUnsub = db.collection("rangeSessions").orderBy("startedAt","desc").limit(100).onSnapshot(function(snap) {
    liveRangeSessions = [];
    snap.forEach(function(doc) { liveRangeSessions.push(Object.assign({_id:doc.id}, doc.data())); });
    if (Router.getPage() === "activity" && rangeActiveView === "range") Router.go("activity", Router.getParams(), true);
  });
}

function syncRangeSession(s) {
  if (!db||syncStatus==="offline") return;
  var d = JSON.parse(JSON.stringify(s));
  db.collection("rangeSessions").doc(s.id).set(d,{merge:true}).catch(function(){});
}

function getRangeSessionXP(session) {
  var mins = (session.durationMin || 0);
  // Base XP: 25 per 15 minutes, cap at 150
  var xp = Math.min(Math.floor(mins / 15) * 25, 150);
  // Drill bonus: 10 per drill completed
  if (session.drills && session.drills.length) xp += session.drills.length * 10;
  // Focus bonus: +15 if a focus area was set
  if (session.focus) xp += 15;
  return xp;
}

function getPlayerRangeSessions(pid) {
  return liveRangeSessions.filter(function(s) { return s.playerId === pid; });
}

function formatRangeTime(totalSeconds) {
  var h = Math.floor(totalSeconds / 3600);
  var m = Math.floor((totalSeconds % 3600) / 60);
  var s = totalSeconds % 60;
  if (h > 0) return h + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
}

function startRangeSession() {
  activeRangeStart = null;
  activeRangeDrills = [];
  activeRangeFocus = "";
  Router.go("range");
}

function _clearRangeState() {
  if (activeRangeTimer) { clearInterval(activeRangeTimer); activeRangeTimer = null; }
  activeRangeStart = null;
  activeRangeDrills = [];
  activeRangeFocus = "";
  rangeSessionNotes = "";
  rangeFeel = 0;
  rangeSessionPrivate = false;
}

function abandonRangeSession() {
  if (!confirm("End session without saving?")) return;
  _clearRangeState();
  rangeActiveView = "range";
  Router.go("activity");
}

function discardRangeSession() {
  _clearRangeState();
  Router.go("activity");
}

function beginRangeTimer() {
  activeRangeStart = Date.now();
  Router.go("range");
}

function tickRangeTimer() {
  var el = document.getElementById("rangeTimerDisplay");
  if (!el || !activeRangeStart) return;
  var elapsed = Math.floor((Date.now() - activeRangeStart) / 1000);
  el.textContent = formatRangeTime(elapsed);
}

function toggleRangeDrill(drillId) {
  var idx = activeRangeDrills.indexOf(drillId);
  if (idx === -1) { if (activeRangeDrills.length < 4) activeRangeDrills.push(drillId); }
  else activeRangeDrills.splice(idx, 1);
  renderDrillChips();
}

function renderDrillChips() {
  var el = document.getElementById("rangeDrillChips");
  if (!el) return;
  var allDrills = DRILL_LIBRARY.concat(customDrills);
  var cats = {};
  allDrills.forEach(function(d) { if (!cats[d.cat]) cats[d.cat] = []; cats[d.cat].push(d); });
  var h = '';
  Object.keys(DRILL_CATS).forEach(function(catKey) {
    var drills = cats[catKey];
    if (!drills || !drills.length) return;
    h += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:.8px;margin:10px 0 4px">' + DRILL_CATS[catKey] + '</div>';
    drills.forEach(function(d) {
      var sel = activeRangeDrills.indexOf(d.id) !== -1;
      var expanded = document.getElementById("drillExpand-" + d.id);
      h += '<div style="margin-bottom:4px">';
      h += '<div style="display:flex;align-items:center;gap:4px">';
      h += '<div class="drill-chip' + (sel ? " selected" : "") + '" onclick="toggleRangeDrill(\'' + d.id + '\')">' + escHtml(d.name) + (sel ? '<span class="drill-x">×</span>' : '') + '</div>';
      if (d.howTo) h += '<span onclick="toggleDrillInfo(\'' + d.id + '\')" style="font-size:11px;color:var(--muted);cursor:pointer;padding:2px 6px;border-radius:50%;border:1px solid var(--border);line-height:1;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px">?</span>';
      h += '</div>';
      h += '<div id="drillExpand-' + d.id + '" style="display:none;padding:6px 10px;margin:2px 0 4px;font-size:10px;background:var(--bg3);border-radius:4px;border-left:2px solid var(--gold)">';
      if (d.equip && d.equip !== "None") h += '<div style="color:var(--gold);font-weight:600;margin-bottom:3px"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M2 8h12M8 2v12"/></svg> ' + escHtml(d.equip) + '</div>';
      else h += '<div style="color:var(--muted);margin-bottom:3px">No extra equipment needed</div>';
      if (d.howTo) h += '<div style="color:var(--cream);line-height:1.4">' + escHtml(d.howTo) + '</div>';
      h += '</div>';
      h += '</div>';
    });
  });
  el.innerHTML = h;
  var countEl = document.getElementById("rangeDrillCount");
  if (countEl) countEl.textContent = activeRangeDrills.length + "/4 selected";
}

function toggleDrillInfo(drillId) {
  var el = document.getElementById("drillExpand-" + drillId);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

function addCustomDrill() {
  var name = prompt("Drill name:");
  if (!name || !name.trim()) return;
  var desc = prompt("Short description (optional):", "");
  var drill = {id: "custom_" + Date.now(), name: name.trim(), cat: "custom", desc: desc || ""};
  customDrills.push(drill);
  saveCustomDrillsToFirestore();
  renderDrillChips();
  Router.toast("Drill added!");
}

function endRangeSession() {
  if (!activeRangeStart) return;
  var elapsed = Math.floor((Date.now() - activeRangeStart) / 1000);
  var mins = Math.round(elapsed / 60);
  if (mins < 1) mins = 1;
  if (activeRangeTimer) { clearInterval(activeRangeTimer); activeRangeTimer = null; }
  var allDrills = DRILL_LIBRARY.concat(customDrills);
  var drillNames = activeRangeDrills.map(function(did) { var d = allDrills.find(function(x){return x.id===did;}); return d ? d.name : did; });
  var xp = getRangeSessionXP({durationMin: mins, drills: activeRangeDrills});
  var isPrivate = rangeSessionPrivate;

  var h = '<div class="sh"><h2>Session Complete</h2></div>';
  // Store state for share card
  _rangeReviewState = { elapsed: elapsed, mins: mins, xp: xp, drillNames: drillNames, focus: activeRangeFocus, feel: rangeFeel };

  // Time hero
  h += '<div style="text-align:center;padding:28px 16px 20px;border-bottom:1px solid var(--border)">';
  h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Time on range</div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:60px;font-weight:800;color:var(--gold);letter-spacing:3px;line-height:1">' + formatRangeTime(elapsed) + '</div>';
  h += '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + mins + ' minute' + (mins !== 1 ? 's' : '') + (activeRangeFocus ? ' · <span style="color:var(--cream)">' + escHtml(activeRangeFocus) + '</span>' : '') + '</div>';
  if (!isPrivate) h += '<div style="margin-top:10px;font-size:14px;font-weight:700;color:var(--gold)">+' + xp + ' XP</div>';
  h += '</div>';

  // Drills checklist
  if (drillNames.length) {
    h += '<div style="padding:16px 16px 0">';
    h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Drills worked</div>';
    drillNames.forEach(function(n) {
      h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2)">';
      h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--birdie)" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg>';
      h += '<span style="font-size:12px;color:var(--cream)">' + escHtml(n) + '</span></div>';
    });
    h += '</div>';
  }

  // How it felt
  h += '<div style="padding:16px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">How did it feel?</div>';
  h += '<div style="display:flex;gap:8px" id="feelBtns">';
  h += '<button class="feel-btn" onclick="selectRangeFeel(1,this)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--red)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15s1-2 4-2 4 2 4 2"/><circle cx="9" cy="9" r="1" fill="var(--red)"/><circle cx="15" cy="9" r="1" fill="var(--red)"/></svg><br><span style="font-size:10px">Rough</span></button>';
  h += '<button class="feel-btn" onclick="selectRangeFeel(2,this)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--cream)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14h8"/><circle cx="9" cy="9" r="1" fill="var(--cream)"/><circle cx="15" cy="9" r="1" fill="var(--cream)"/></svg><br><span style="font-size:10px">Solid</span></button>';
  h += '<button class="feel-btn" onclick="selectRangeFeel(3,this)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="var(--gold)"/><circle cx="15" cy="9" r="1" fill="var(--gold)"/></svg><br><span style="font-size:10px">Dialed</span></button>';
  h += '</div>';

  // Notes
  h += '<div style="margin-top:14px">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Notes <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></div>';
  h += '<textarea id="rangeNotesInput" placeholder="What clicked? What needs work next time?" oninput="rangeSessionNotes=this.value" style="width:100%;box-sizing:border-box;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--cream);font-size:12px;padding:10px;line-height:1.5;resize:none;height:70px;font-family:Inter,sans-serif">' + escHtml(rangeSessionNotes) + '</textarea>';
  h += '</div></div>';

  // Actions
  h += '<div style="padding:0 16px 28px;display:flex;flex-direction:column;gap:8px">';
  h += '<button class="btn full green" style="padding:14px;font-size:14px;font-weight:700" onclick="saveRangeSession(' + mins + ',' + elapsed + ')">Save Session</button>';
  h += '<button class="btn full outline" style="padding:12px;font-size:12px" onclick="showRangeShareCard()">Share Session</button>';
  h += '<button class="btn full outline" style="padding:12px;font-size:12px" onclick="discardRangeSession()">Discard</button>';
  h += '</div>';

  document.querySelector('[data-page="range"]').innerHTML = h;
}

var rangeFeel = 0;
function selectRangeFeel(val, btn) {
  rangeFeel = val;
  var btns = document.querySelectorAll("#feelBtns .feel-btn");
  btns.forEach(function(b) { b.classList.remove("sel"); });
  btn.classList.add("sel");
}

function saveRangeSession(mins, totalSec) {
  var isPrivate = rangeSessionPrivate;
  var session = {
    id: genId(),
    playerId: currentUser ? currentUser.uid : "local",
    playerName: currentProfile ? PB.getDisplayName(currentProfile) : "You",
    date: localDateStr(),
    startedAt: new Date(activeRangeStart).toISOString(),
    endedAt: new Date().toISOString(),
    durationMin: mins,
    durationSec: totalSec,
    drills: activeRangeDrills.slice(),
    feel: rangeFeel || 2,
    focus: activeRangeFocus,
    notes: rangeSessionNotes || "",
    visibility: isPrivate ? "private" : "public"
  };
  syncRangeSession(session);
  var xp = isPrivate ? 0 : getRangeSessionXP(session);
  // Only post to feed and award XP if public
  if (!isPrivate && db) {
    db.collection("chat").add({
      id: genId(),
      text: session.playerName + " just finished a " + mins + "-minute range session" + (session.drills.length ? " working on " + session.drills.length + " drill" + (session.drills.length>1?"s":"") : "") + " (+"+xp+" XP)",
      authorId: "system", authorName: "Parbaughs", createdAt: fsTimestamp()
    }).catch(function(){});
  }
  activeRangeStart = null;
  activeRangeDrills = [];
  activeRangeFocus = "";
  rangeFeel = 0;
  rangeSessionNotes = "";
  rangeSessionPrivate = false;
  Router.toast(isPrivate ? "Private session saved" : "Session saved! +" + xp + " XP");
  // ── ParCoin: award coins for range session ──
  if (currentUser && !isPrivate) {
    var rangeCoins = calcRangeCoins(mins, session.drills.length);
    awardCoins(currentUser.uid, rangeCoins, "range_session", mins + "-min range session" + (session.drills.length ? " (" + session.drills.length + " drills)" : ""), "range_" + session.id);
  }
  setTimeout(checkAndAwardNewAchievements, 1500); // check for newly unlocked achievements
  rangeActiveView = "range";
  Router.go("activity");
}

// ========== ACTIVITY PAGE (Rounds + Range) ==========
