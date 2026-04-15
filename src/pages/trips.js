/* ================================================
   PAGE: TRIPS
   ================================================ */
var tripCreateState = { members: [], courses: [] };

Router.register("trips", function(params) {
  if (params.create) { renderTripCreate(); return; }
  var trips = PB.getTrips();
  var today = localDateStr();

  // Split trips into active/upcoming vs past
  var activeTrips = trips.filter(function(t) {
    if (t.status === "closed") return false; // Closed events go to past
    return t.status === "upcoming" || t.status === "active" || (t.endDate && t.endDate >= today);
  });
  var pastTrips = trips.filter(function(t) {
    return !activeTrips.find(function(a) { return a.id === t.id; });
  }).reverse(); // most recent first

  var h = '<div class="sh"><h2>Events</h2><button class="btn-sm green" onclick="Router.go(\'trips\',{create:true})">+ New event</button></div>';

  function tripCard(t) {
    var memberAvatars = (t.members || []).slice(0, 4).map(function(id) {
      var p = PB.getPlayer(id) || (typeof fbMemberCache !== "undefined" && fbMemberCache[id]);
      return p ? '<div style="margin-left:-6px">' + renderAvatar(p, 24, false) + '</div>' : '';
    }).join('');
    var winner = t.champion ? (PB.getPlayer(t.champion) || (typeof fbMemberCache !== "undefined" && fbMemberCache[t.champion]) || {name: t.champion}) : null;
    var card = '<div class="card" onclick="Router.go(\'scorecard\',{tripId:\'' + t.id + '\'})">';
    card += '<div class="trip-row"><div class="trip-info">';
    card += '<div class="trip-name">' + escHtml(t.name) + '</div>';
    card += '<div class="trip-detail">' + escHtml(t.dates) + ' · ' + escHtml(t.location) + '</div>';
    if ((t.members || []).length) {
      card += '<div style="display:flex;align-items:center;margin-top:6px">' + memberAvatars;
      card += '<span style="font-size:11px;color:var(--muted);margin-left:8px">' + t.members.length + ' members · ' + (t.courses || []).length + ' rounds</span></div>';
    }
    card += '</div>';
    var badge = winner
      ? '<div style="text-align:right"><span class="badge gld" style="font-size:9px">' + escHtml(winner.name || winner.username) + '</span><div style="font-size:9px;color:var(--gold);margin-top:4px;letter-spacing:.3px">Champion</div></div>'
      : t.status === "upcoming"
        ? '<span class="badge">Upcoming</span>'
        : '<span class="badge">Active</span>';
    card += '<div>' + badge + '</div></div></div>';
    return card;
  }

  // Active / upcoming events
  if (activeTrips.length) {
    activeTrips.forEach(function(t) { h += tripCard(t); });
  } else {
    h += '<div style="text-align:center;padding:32px 16px">';
    h += '<div style="margin-bottom:12px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".6"><path d="M6 9l18-7 18 7v22l-18 7-18-7V9z"/><path d="M6 9l18 7 18-7"/><path d="M24 16v22"/></svg></div>';
    h += '<div style="font-size:16px;font-weight:700;color:var(--cream)">No Upcoming Events</div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Plan a golf trip, tournament, or hangout. Set dates, invite the crew, and track scores together.</div>';
    h += '<button class="btn full green" style="margin-top:16px;max-width:280px;margin-left:auto;margin-right:auto" onclick="Router.go(\'trips\',{create:true})">+ New Event</button>';
    h += '</div>';
  }

  // Past events — collapsible, collapsed by default
  if (pastTrips.length) {
    h += '<div style="padding:8px 16px 0">';
    h += '<div id="pastEventsToggle" onclick="togglePastEvents()" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:10px 0;border-top:1px solid var(--border)">';
    h += '<span style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.8px">Past Events (' + pastTrips.length + ')</span>';
    h += '<svg id="pastEventsChevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--muted)" stroke-width="1.5" style="transform:rotate(180deg)"><path d="M4 6l4 4 4-4"/></svg>';
    h += '</div></div>';
    h += '<div id="pastEventsList">';
    pastTrips.forEach(function(t) { h += tripCard(t); });
    h += '</div>';
  }

  h += renderPageFooter();
  document.querySelector('[data-page="trips"]').innerHTML = h;
});

function togglePastEvents() {
  var list = document.getElementById("pastEventsList");
  var chevron = document.getElementById("pastEventsChevron");
  if (!list) return;
  var isOpen = list.style.display !== "none";
  list.style.display = isOpen ? "none" : "block";
  if (chevron) chevron.style.transform = isOpen ? "" : "rotate(180deg)";
}

function renderTripCreate() {
  tripCreateState = { members: [], courses: [] };
  var allPlayers = PB.getPlayers();

  var h = '<div class="sh"><h2>Create event</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';

  // Step 1: Basic info
  h += '<div class="form-section"><div class="form-title">Event details</div>';
  h += formField("Event name", "tc-name", "", "text", "e.g. Myrtle Beach Invitational");
  h += formField("Location", "tc-location", "", "text", "e.g. Myrtle Beach, SC");
  h += '<div class="ff-row">';
  h += '<div class="ff"><label class="ff-label">Start date</label><input type="date" class="ff-input" id="tc-start"></div>';
  h += '<div class="ff"><label class="ff-label">End date</label><input type="date" class="ff-input" id="tc-end"></div>';
  h += '</div></div>';

  // Step 2: Select members
  h += '<div class="form-section"><div class="form-title">Who\'s going?</div>';
  h += '<div id="tc-members">';
  allPlayers.forEach(function(p) {
    h += '<div class="h2h-row" style="cursor:pointer" onclick="toggleTripMember(\'' + p.id + '\')">';
    h += '<div class="h2h-left">' + renderAvatar(p, 28, false) + '<span class="h2h-name">' + renderUsername(p, '', false) + '</span>';
    if (p.founding) h += '<span style="font-size:9px;color:var(--gold);margin-left:6px"></span>';
    h += '</div>';
    h += '<div id="tc-check-' + p.id + '" style="width:22px;height:22px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--birdie)"></div>';
    h += '</div>';
  });
  h += '</div></div>';

  // Step 3: Add courses
  h += '<div class="form-section"><div class="form-title">Courses</div>';
  h += '<div class="ff"><label class="ff-label">Search and add courses</label><input class="ff-input" id="tc-course-search" placeholder="Start typing course name..." oninput="showTripCourseSearch(this)"><div id="search-tc-course" class="search-results"></div></div>';
  h += '<div id="tc-course-list" style="margin-top:8px"></div>';
  h += '</div>';

  // AI Tournament Generator button (gated — needs API key)
  h += '<div class="form-section"><div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:1px dashed var(--border);border-radius:var(--radius);opacity:.5;margin-bottom:12px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" style="color:var(--muted)"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 2v4M8 6h8"/></svg><span style="font-size:12px;color:var(--muted)">AI Tournament Generator</span><span style="font-size:9px;background:rgba(var(--gold-rgb),.1);color:var(--gold);padding:2px 8px;border-radius:4px;font-weight:600">COMING SOON</span></div></div>';
  
  // Step 4: Smart Tournament Generator
  h += '<div class="form-section"><div class="form-title">Tournament Format</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Select a preset or customize. The generator builds fair pairings based on player handicaps.</div>';
  h += '<div class="ff"><label class="ff-label">Tournament style</label><select class="ff-input" id="tc-style" onchange="updateFormatPreview()">';
  h += '<option value="custom">Custom (manual setup)</option>';
  h += '<option value="classic">Classic — Stableford each day, cumulative points</option>';
  h += '<option value="mixed">Mixed — Different format each day</option>';
  h += '<option value="parbaugh">Parbaugh Championship — Handicap-adjusted stroke play</option>';
  h += '<option value="ryder">Ryder Cup — Teams, alternating formats</option>';
  h += '<option value="skins">Skins Weekend — Skins every round, pot carries over</option>';
  h += '<option value="scramble">Scramble Showdown — Scramble format, balanced teams</option>';
  h += '</select></div>';
  h += '<div id="formatPreview"></div>';
  h += '<div class="ff"><label class="ff-label">Championship multiplier on final round?</label><select class="ff-input" id="tc-champ"><option value="no">No</option><option value="1.5">1.5x points</option><option value="2">2x points</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Additional notes</label><textarea class="ff-input" id="tc-notes" placeholder="Any special rules, side bets, tee time preferences..."></textarea></div>';
  h += '</div>';

  h += '<div class="form-section"><button class="btn full green" onclick="submitTripCreate()">Create event</button></div>';

  document.querySelector('[data-page="trips"]').innerHTML = h;
}

function toggleTripMember(pid) {
  var idx = tripCreateState.members.indexOf(pid);
  if (idx === -1) tripCreateState.members.push(pid);
  else tripCreateState.members.splice(idx, 1);
  var el = document.getElementById("tc-check-" + pid);
  if (el) el.textContent = tripCreateState.members.indexOf(pid) !== -1 ? "Done" : "";
  if (el) el.style.background = tripCreateState.members.indexOf(pid) !== -1 ? "var(--green)" : "transparent";
  if (el) el.style.borderColor = tripCreateState.members.indexOf(pid) !== -1 ? "var(--green)" : "var(--border)";
}

function showTripCourseSearch(input) {
  var results = PB.searchCourses(input.value);
  var container = document.getElementById("search-tc-course");
  if (!results.length) { container.innerHTML = ""; return; }
  var h = '';
  results.forEach(function(c) {
    h += '<div class="search-item" onclick="addTripCourse(\'' + c.id + '\',\'' + c.name.replace(/'/g, "\\'") + '\',' + c.rating + ',' + c.slope + ',' + c.par + ');document.getElementById(\'tc-course-search\').value=\'\';document.getElementById(\'search-tc-course\').innerHTML=\'\'">' + c.name + ' <span style="color:var(--muted);font-size:11px">' + c.loc + ' · ' + c.rating + '/' + c.slope + '</span></div>';
  });
  container.innerHTML = h;
}

function addTripCourse(id, name, rating, slope, par) {
  if (tripCreateState.courses.find(function(c) { return c.id === id; })) { Router.toast("Already added"); return; }
  tripCreateState.courses.push({ id: id, name: name, rating: rating, slope: slope, par: par, format: "stableford", multiplier: "1" });
  renderTripCourseList();
}

function removeTripCourse(idx) {
  tripCreateState.courses.splice(idx, 1);
  renderTripCourseList();
}

function updateTripCourseFormat(idx, val) { tripCreateState.courses[idx].format = val; }
function updateTripCourseMultiplier(idx, val) { tripCreateState.courses[idx].multiplier = val; }

function renderTripCourseList() {
  var container = document.getElementById("tc-course-list");
  if (!container) return;
  var h = '';
  tripCreateState.courses.forEach(function(c, idx) {
    h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:13px;font-weight:600">' + c.name + '</div>';
    h += '<div style="cursor:pointer;color:var(--red);font-weight:700;font-size:14px" onclick="removeTripCourse(' + idx + ')">×</div></div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Rating: ' + c.rating + ' · Slope: ' + c.slope + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Format</div>';
    h += '<select class="ff-input" style="padding:8px" onchange="updateTripCourseFormat(' + idx + ',this.value)">';
    h += '<option value="stableford"' + (c.format === "stableford" ? " selected" : "") + '>Stableford</option>';
    h += '<option value="stroke"' + (c.format === "stroke" ? " selected" : "") + '>Stroke play</option>';
    h += '<option value="scramble"' + (c.format === "scramble" ? " selected" : "") + '>Scramble</option>';
    h += '<option value="bestball"' + (c.format === "bestball" ? " selected" : "") + '>Best ball</option>';
    h += '<option value="match"' + (c.format === "match" ? " selected" : "") + '>Match play</option>';
    h += '<option value="skins"' + (c.format === "skins" ? " selected" : "") + '>Skins</option>';
    h += '</select></div>';
    h += '<div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Multiplier</div>';
    h += '<select class="ff-input" style="padding:8px" onchange="updateTripCourseMultiplier(' + idx + ',this.value)">';
    h += '<option value="1"' + (c.multiplier === "1" ? " selected" : "") + '>1x</option>';
    h += '<option value="1.5"' + (c.multiplier === "1.5" ? " selected" : "") + '>1.5x</option>';
    h += '<option value="2"' + (c.multiplier === "2" ? " selected" : "") + '>2x</option>';
    h += '</select></div></div></div>';
  });
  if (!tripCreateState.courses.length) h = '<div class="empty"><div class="empty-text" style="padding:12px">No courses added yet</div></div>';
  container.innerHTML = h;
}

// ========== SMART TOURNAMENT GENERATOR ==========
function getTournamentFormats(style, numRounds) {
  var formats = [];
  switch(style) {
    case "classic":
      for (var i = 0; i < numRounds; i++) formats.push({ format: "stableford", teeTime: "8:00 AM", desc: "Modified Stableford" });
      break;
    case "mixed":
      var rotation = ["stableford", "bestball", "scramble", "skins", "parbaugh", "match", "stroke"];
      for (var i = 0; i < numRounds; i++) formats.push({ format: rotation[i % rotation.length], teeTime: "8:00 AM", desc: "" });
      break;
    case "parbaugh":
      for (var i = 0; i < numRounds; i++) formats.push({ format: "parbaugh", teeTime: "8:30 AM", desc: "Handicap-adjusted stroke play" });
      break;
    case "ryder":
      var ryderRotation = ["bestball", "scramble", "match", "bestball", "match"];
      for (var i = 0; i < numRounds; i++) formats.push({ format: ryderRotation[i % ryderRotation.length], teeTime: "9:00 AM", desc: "Team format" });
      break;
    case "skins":
      for (var i = 0; i < numRounds; i++) formats.push({ format: "skins", teeTime: "8:00 AM", desc: "Skins — pot carries over" });
      break;
    case "scramble":
      for (var i = 0; i < numRounds; i++) formats.push({ format: "scramble", teeTime: "Shotgun 9:00 AM", desc: "Teams balanced by handicap" });
      break;
    default:
      for (var i = 0; i < numRounds; i++) formats.push({ format: "stableford", teeTime: "TBD", desc: "" });
  }
  return formats;
}

function updateFormatPreview() {
  var style = document.getElementById("tc-style").value;
  var el = document.getElementById("formatPreview");
  if (!el) return;
  
  if (style === "custom") { el.innerHTML = ''; return; }
  
  var numCourses = tripCreateState.courses.length || 3;
  var numPlayers = tripCreateState.members.length || 4;
  var formats = getTournamentFormats(style, numCourses);
  var formatLabels = {stableford:"Stableford",stroke:"Stroke Play",parbaugh:"Parbaugh Stroke Play",scramble:"Scramble",bestball:"Best Ball",match:"Match Play",skins:"Skins"};
  
  var descriptions = {
    classic: "Every round is Modified Stableford. Points accumulate across all rounds. Highest total points wins. Simple, fair, and rewards consistent play across the whole event.",
    mixed: "A different format each day keeps things fresh. Tests all aspects of your game — individual scoring, team play, head-to-head, and strategy.",
    parbaugh: "Parbaugh Stroke Play levels the playing field. Each player's handicap adjusts their gross score so higher handicappers compete fairly against lower ones. The best net score wins.",
    ryder: "Split into two teams balanced by combined handicap. Alternate between best ball and scramble formats. Final day is individual match play. Team with most points wins.",
    skins: "Every hole is worth money (or bragging rights). Win the hole outright or the skin carries over, making the next hole worth double. High drama guaranteed.",
    scramble: "Teams balanced by combined handicap. Everyone drives, pick the best ball, everyone plays from there. Best team score wins. Great for groups with mixed skill levels."
  };
  
  var ph = '<div class="card" style="margin:8px 0"><div class="card-body">';
  ph += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin-bottom:6px">' + style.charAt(0).toUpperCase() + style.slice(1) + ' Format</div>';
  ph += '<div style="font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:8px">' + (descriptions[style] || "") + '</div>';
  
  ph += '<div style="font-size:10px;color:var(--cream)">';
  formats.slice(0, numCourses).forEach(function(f, i) {
    ph += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)">';
    ph += '<span>Day ' + (i+1) + '</span>';
    ph += '<span style="color:var(--gold)">' + (formatLabels[f.format] || f.format) + '</span></div>';
  });
  ph += '</div>';
  
  if (numPlayers >= 2) {
    ph += '<div style="margin-top:8px;font-size:10px;color:var(--muted)">';
    if (style === "ryder" || style === "scramble") {
      ph += 'Teams will be auto-balanced by handicap (' + numPlayers + ' players → ' + Math.ceil(numPlayers/2) + ' per team)';
    } else {
      ph += numPlayers + ' players competing individually';
    }
    ph += '</div>';
  }
  
  ph += '</div></div>';
  el.innerHTML = ph;
}

function generateFairPairings(memberIds, style) {
  // Get players with handicaps, sort by skill
  var players = memberIds.map(function(id) {
    var p = PB.getPlayer(id);
    var rounds = PB.getPlayerRounds(id);
    var hcap = PB.calcHandicap(rounds) || 20; // Default 20 for unestablished handicaps
    return { id: id, name: p ? p.name : id, handicap: hcap };
  }).sort(function(a, b) { return a.handicap - b.handicap; });
  
  if (style === "ryder" || style === "scramble") {
    // Snake draft for fair teams: best + worst, 2nd best + 2nd worst, etc.
    var team1 = [], team2 = [];
    players.forEach(function(p, i) {
      if (i % 4 === 0 || i % 4 === 3) team1.push(p);
      else team2.push(p);
    });
    
    var t1hcap = team1.reduce(function(a, p) { return a + p.handicap; }, 0);
    var t2hcap = team2.reduce(function(a, p) { return a + p.handicap; }, 0);
    
    return {
      type: "teams",
      team1: { players: team1, combinedHandicap: Math.round(t1hcap * 10) / 10 },
      team2: { players: team2, combinedHandicap: Math.round(t2hcap * 10) / 10 },
      fairness: Math.abs(t1hcap - t2hcap) < 3 ? "Excellent balance" : Math.abs(t1hcap - t2hcap) < 6 ? "Good balance" : "Moderate imbalance"
    };
  }
  
  // Individual — return players sorted by handicap for tee time grouping
  return {
    type: "individual",
    players: players,
    groups: groupPlayersForTee(players)
  };
}

function groupPlayersForTee(players) {
  // Group players in foursomes, mixing skill levels
  if (players.length <= 4) return [players];
  var groups = [];
  var remaining = players.slice();
  while (remaining.length > 0) {
    var group = [];
    // Take best available, worst available, then fill middle
    if (remaining.length > 0) group.push(remaining.shift()); // best
    if (remaining.length > 0) group.push(remaining.pop());   // worst
    if (remaining.length > 0) group.push(remaining.shift()); // 2nd best
    if (remaining.length > 0) group.push(remaining.pop());   // 2nd worst
    groups.push(group);
  }
  return groups;
}

function submitTripCreate() {
  var name = document.getElementById("tc-name").value;
  if (!name) { Router.toast("Enter an event name"); return; }
  if (!tripCreateState.members.length) { Router.toast("Select at least one member"); return; }
  if (tripCreateState.courses.length < 1) { Router.toast("Add at least one course"); return; }

  var start = document.getElementById("tc-start").value;
  var end = document.getElementById("tc-end").value;
  if (!start || !end) { Router.toast("Start and end dates required"); return; }
  var loc = document.getElementById("tc-location").value;
  var notes = document.getElementById("tc-notes").value;
  var style = document.getElementById("tc-style").value;
  var champMult = parseFloat(document.getElementById("tc-champ").value) || 1;

  // Apply tournament style to course formats
  var styleFormats = getTournamentFormats(style, tripCreateState.courses.length);

  // Build date display
  var dates = "";
  if (start && end) {
    var s = new Date(start + "T00:00:00"), e = new Date(end + "T00:00:00");
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    dates = months[s.getMonth()] + " " + s.getDate() + "-" + e.getDate() + ", " + s.getFullYear();
  }

  // Build course configs
  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var formatLabels = {stableford:"Stableford",stroke:"Stroke play",parbaugh:"Parbaugh Stroke Play",scramble:"Scramble",bestball:"Best ball",match:"Match play",skins:"Skins"};
  var courseConfigs = tripCreateState.courses.map(function(c, idx) {
    var dayLabels = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7"];
    var fmt = (style !== "custom" && styleFormats[idx]) ? styleFormats[idx].format : (c.format || "stableford");
    var mult = (idx === tripCreateState.courses.length - 1 && champMult > 1) ? champMult : (parseFloat(c.multiplier) || 1);
    var label = (formatLabels[fmt] || fmt) + (mult !== 1 ? " (" + mult + "x)" : "");
    return {
      key: c.id + "_" + idx,
      courseId: c.id,
      n: c.name,
      d: dayLabels[idx] || "Day " + (idx+1),
      t: styleFormats[idx] ? (styleFormats[idx].teeTime || "TBD") : "TBD",
      p: defaultPar,
      f: label,
      s: fmt === "scramble" ? 1 : 0,
      m: mult
    };
  });

  // Generate fair pairings if team format
  var pairings = generateFairPairings(tripCreateState.members, style);

  var trip = PB.addTrip({
    name: name,
    location: loc,
    dates: dates,
    startDate: start,
    endDate: end,
    members: tripCreateState.members,
    courses: courseConfigs,
    tournamentStyle: style,
    pairings: pairings,
    miniGames: [],
    bonusAwards: [
      {i:"sandman_"+Date.now(),l:"Sandman",d:"Most pars-or-better from bunkers",p:5},
      {i:"shortgame_"+Date.now(),l:"Short Game King",d:"Most up-and-downs",p:5},
      {i:"coldblooded_"+Date.now(),l:"Cold Blooded",d:"Most one-putts",p:5},
      {i:"phoenix_"+Date.now(),l:"Phoenix",d:"Best single hole vs group",p:3}
    ]
  });

  if (trip) {
    // Log activity
    if (!PB.getActivity) {} // activity logged in addTrip if we add it
    Router.toast("Event created");
    Router.go("scorecard", { tripId: trip.id });
  }
}

function promptAddTrip() { Router.go("trips", { create: true }); }

