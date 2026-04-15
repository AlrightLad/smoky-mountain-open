/* ================================================
   PAGE: DRILLS LIBRARY — Browse and track practice drills
   v6.1.0: Categorized drills with completion tracking
   ================================================ */

Router.register("drills", function() {
  var h = '<div class="sh"><h2>Drills Library</h2><button class="back" onclick="Router.back(\'more\')">← Back</button></div>';

  // Category filter
  var cats = {all:"All", path:"Path & Plane", extension:"Posture", short:"Short Game", general:"Full Swing"};
  h += '<div class="toggle-bar">';
  Object.keys(cats).forEach(function(key) {
    h += '<button' + (key === "all" ? ' class="a"' : '') + ' onclick="filterDrills(\'' + key + '\')">' + cats[key] + '</button>';
  });
  h += '</div>';

  h += '<div id="drills-list" style="padding:12px 16px"></div>';
  h += renderPageFooter();
  document.querySelector('[data-page="drills"]').innerHTML = h;
  filterDrills("all");
});

function filterDrills(cat) {
  var el = document.getElementById("drills-list");
  if (!el) return;
  // Update active tab
  document.querySelectorAll('[data-page="drills"] .toggle-bar button').forEach(function(b) {
    b.className = b.textContent.toLowerCase().indexOf(cat === "all" ? "all" : (cat === "path" ? "path" : cat === "extension" ? "posture" : cat === "short" ? "short" : "full")) !== -1 ? "a" : "";
  });

  var allDrills = (typeof DRILL_LIBRARY !== "undefined" ? DRILL_LIBRARY : []).concat(typeof customDrills !== "undefined" ? customDrills : []);
  var filtered = cat === "all" ? allDrills : allDrills.filter(function(d) { return d.cat === cat; });
  var catNames = {path:"Path & Plane",extension:"Extension & Posture",short:"Short Game",general:"Full Swing",custom:"My Drills"};
  var difficultyColors = {path:"var(--gold)",extension:"var(--blue)",short:"var(--birdie)",general:"var(--cream)",custom:"var(--pink)"};

  if (!filtered.length) {
    el.innerHTML = '<div style="text-align:center;padding:32px;font-size:12px;color:var(--muted)">No drills in this category.</div>';
    return;
  }

  var h = '';
  filtered.forEach(function(d) {
    var catColor = difficultyColors[d.cat] || "var(--gold)";
    var catName = catNames[d.cat] || d.cat;
    h += '<div class="card" style="margin-bottom:8px">';
    h += '<div style="padding:14px 16px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    h += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
    h += '<span style="font-size:8px;font-weight:700;color:' + catColor + ';background:' + catColor + '15;padding:2px 6px;border-radius:3px;letter-spacing:.5px;text-transform:uppercase">' + catName + '</span>';
    if (d.equip && d.equip !== "None") h += '<span style="font-size:8px;color:var(--muted2)">' + escHtml(d.equip) + '</span>';
    h += '</div>';
    h += '<div style="font-size:14px;font-weight:700;color:var(--cream)">' + escHtml(d.name) + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + escHtml(d.desc) + '</div>';
    h += '</div>';
    h += '<button class="btn-sm outline" style="font-size:9px;flex-shrink:0" onclick="toggleDrillExpand(\'' + d.id + '\')">Details</button>';
    h += '</div>';
    // Expandable how-to
    h += '<div id="drill-detail-' + d.id + '" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">';
    h += '<div style="font-size:9px;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">How to do it</div>';
    h += '<div style="font-size:11px;color:var(--cream);line-height:1.6">' + escHtml(d.howTo || d.desc) + '</div>';
    h += '<button class="btn-sm green" style="margin-top:8px;font-size:10px" onclick="Router.go(\'range\')">Start Range Session</button>';
    h += '</div>';
    h += '</div></div>';
  });
  el.innerHTML = h;
}

function toggleDrillExpand(drillId) {
  var el = document.getElementById("drill-detail-" + drillId);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}
