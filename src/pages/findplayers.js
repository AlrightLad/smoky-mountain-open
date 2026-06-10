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
  h += '<button class="btn-sm outline fp-filter active" data-filter="all" onclick="setPlayerFilter(\'all\',this)">All</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="beginner" onclick="setPlayerFilter(\'beginner\',this)">Beginner (25+)</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="intermediate" onclick="setPlayerFilter(\'intermediate\',this)">Intermediate (15-25)</button>';
  h += '<button class="btn-sm outline fp-filter" data-filter="advanced" onclick="setPlayerFilter(\'advanced\',this)">Advanced (&lt;15)</button>';
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
        if (isBannedRole(d)) return;
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
    // v8.22+ (design-pass 2026-05-22): dashed-card empty state matching
    // the courses/feed pattern. Per filter, distinct copy.
    var noMatchLabel = q ? "No players match \"" + escHtml(query) + "\"" : (
      _fpFilter === "beginner" ? "No beginners in the directory yet" :
      _fpFilter === "intermediate" ? "No intermediates yet" :
      _fpFilter === "advanced" ? "No advanced players yet" :
      "No players found"
    );
    el.innerHTML = '<div style="margin:14px 16px;padding:30px 22px;text-align:center;background:var(--cb-paper);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-sm)">' +
      '<div style="font-family:var(--font-display);font-size:16px;font-weight:600;color:var(--cream);margin-bottom:6px">' + noMatchLabel + '.</div>' +
      '<div style="font-size:11px;color:var(--muted);line-height:1.5;max-width:280px;margin:0 auto">Adjust your search or the handicap filter. Profiles set to <span style="color:var(--birdie)">PUBLIC</span> show up across all leagues.</div>' +
      '</div>';
    return;
  }

  // v8.22+ (design-pass 2026-05-22): sort founders to the top + add tier
  // eyebrows matching the Members directory pattern. Founders are visually
  // distinguished, easier to discover for new members joining the league.
  players.sort(function(a, b) {
    var aF = (a.founding || a.isFoundingFour) ? 1 : 0;
    var bF = (b.founding || b.isFoundingFour) ? 1 : 0;
    if (aF !== bF) return bF - aF;
    return (a.name || a.username || "").localeCompare(b.name || b.username || "");
  });

  var founderCount = players.filter(function(p){return p.founding || p.isFoundingFour;}).length;
  var memberCount = players.length - founderCount;
  var lastTier = null;

  var h = '<div style="padding:0 16px">';
  players.forEach(function(p) {
    var pid = p._id || p.id;
    var hcap = p.computedHandicap || p.handicap || null;
    var isPublic = p.profilePublic;
    var mutualLeagues = (p.leagues || []).filter(function(l) { return myLeagues.indexOf(l) !== -1; }).length;
    var isFounder = !!(p.founding || p.isFoundingFour);
    var tier = isFounder ? "founder" : "member";
    if (tier !== lastTier) {
      var label = tier === "founder" ? "FOUNDING FOUR" : "MEMBERS";
      var count = tier === "founder" ? founderCount : memberCount;
      h += '<div style="display:flex;align-items:baseline;justify-content:space-between;padding:' + (lastTier ? '18px' : '10px') + ' 0 8px;border-top:' + (lastTier ? '1px solid var(--border)' : 'none') + ';margin-top:' + (lastTier ? '6px' : '0') + '">';
      h += '<div style="font-family:var(--font-mono);font-size:9px;color:var(--gold);letter-spacing:2px;font-weight:700;text-transform:uppercase">' + label + '</div>';
      h += '<div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);letter-spacing:1px;font-weight:600">' + count + '</div>';
      h += '</div>';
      lastTier = tier;
    }

    h += '<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">';
    h += '<div style="padding:12px 16px;display:flex;align-items:center;gap:12px">';
    h += renderAvatar(p, 44, false);
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px">' + renderUsername(p, 'color:var(--cream);', false);
    if (isFounder) {
      h += '<svg viewBox="0 0 12 12" width="10" height="10" style="flex-shrink:0"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.6 3.5L6 9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" fill="var(--gold)" stroke="none"/></svg>';
    }
    h += '</div>';
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
