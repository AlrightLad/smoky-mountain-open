/* ================================================
   PAGE: FIND PLAYERS — Search, filter, discover golfers
   v6.0.0: Social discovery feature
   ================================================ */

Router.register("findplayers", function() {
  var h = '<div class="sh"><h2>Find Players</h2><button class="back" onclick="Router.back(\'more\')">← Back</button></div>';

  // Search bar
  h += '<div style="padding:8px 16px"><input class="ff-input" id="fp-search" placeholder="Search by name or username..." style="margin:0;font-size:13px" oninput="filterPlayers()"></div>';

  // Filters
  h += '<div style="padding:4px 16px 8px;display:flex;gap:6px;flex-wrap:wrap">';
  h += '<button class="btn-sm outline fp-filter active" data-filter="all" onclick="setPlayerFilter(\'all\',this)" style="font-size:9px">All</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="beginner" onclick="setPlayerFilter(\'beginner\',this)" style="font-size:9px">Beginner (25+)</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="intermediate" onclick="setPlayerFilter(\'intermediate\',this)" style="font-size:9px">Intermediate (15-25)</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="advanced" onclick="setPlayerFilter(\'advanced\',this)" style="font-size:9px">Advanced (&lt;15)</button>';
  h += '</div>';

  h += '<div id="fp-results"></div>';
  h += renderPageFooter();
  document.querySelector('[data-page="findplayers"]').innerHTML = h;

  // Load and render all players
  window._fpAllPlayers = [];
  window._fpFilter = "all";

  if (db) {
    db.collection("members").get().then(function(snap) {
      window._fpAllPlayers = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        if (d.role === "removed") return;
        d._id = doc.id;
        window._fpAllPlayers.push(d);
      });
      filterPlayers();
    });
  } else {
    window._fpAllPlayers = PB.getPlayers();
    filterPlayers();
  }
});

var _fpFilter = "all";
function setPlayerFilter(filter, btn) {
  _fpFilter = filter;
  document.querySelectorAll('.fp-filter').forEach(function(b) { b.classList.remove('active'); b.style.background = 'transparent'; b.style.color = 'var(--cream)'; b.style.borderColor = 'var(--border)'; });
  if (btn) { btn.classList.add('active'); btn.style.background = 'rgba(var(--gold-rgb),.08)'; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }
  filterPlayers();
}

function filterPlayers() {
  var el = document.getElementById("fp-results");
  if (!el) return;
  var query = (document.getElementById("fp-search") || {}).value || "";
  var q = query.toLowerCase().trim();
  var myUid = currentUser ? currentUser.uid : null;
  var myLeagues = currentProfile && currentProfile.leagues ? currentProfile.leagues : [];

  var players = (window._fpAllPlayers || []).filter(function(p) {
    // Search filter
    if (q && (p.name || "").toLowerCase().indexOf(q) === -1 && (p.username || "").toLowerCase().indexOf(q) === -1) return false;
    // Handicap filter
    var hcap = p.computedHandicap || p.handicap || null;
    if (_fpFilter === "beginner" && hcap !== null && hcap < 25) return false;
    if (_fpFilter === "intermediate" && (hcap === null || hcap < 15 || hcap >= 25)) return false;
    if (_fpFilter === "advanced" && (hcap === null || hcap >= 15)) return false;
    return true;
  });

  if (!players.length) {
    el.innerHTML = '<div style="text-align:center;padding:32px 16px;font-size:12px;color:var(--muted)">No players found matching your search.</div>';
    return;
  }

  var h = '<div style="padding:0 16px">';
  players.forEach(function(p) {
    var pid = p._id || p.id;
    var hcap = p.computedHandicap || p.handicap || null;
    var isPublic = p.profilePublic;
    var mutualLeagues = (p.leagues || []).filter(function(l) { return myLeagues.indexOf(l) !== -1; }).length;

    h += '<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">';
    h += '<div style="padding:12px 16px;display:flex;align-items:center;gap:12px">';
    h += renderAvatar(p, 44, false);
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:13px;font-weight:600">' + renderUsername(p, 'color:var(--cream);', false) + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">';
    var meta = [];
    if (hcap !== null) meta.push("Hcap " + hcap);
    if (p.homeCourse) meta.push(p.homeCourse);
    if (mutualLeagues > 0) meta.push(mutualLeagues + " mutual league" + (mutualLeagues > 1 ? "s" : ""));
    h += meta.join(" \u00b7 ") || "Member";
    h += '</div></div>';
    if (isPublic) h += '<div style="font-size:8px;color:var(--birdie);font-weight:600;letter-spacing:.5px">PUBLIC</div>';
    h += '</div></div>';
  });
  h += '</div>';
  el.innerHTML = h;
}
