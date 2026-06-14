/* ================================================
   PAGE: DRILLS LIBRARY — Browse and track practice drills
   v6.1.0: Categorized drills with completion tracking
   v8.25.137 (#41): full Clubhouse migration — was the lowest-scoring page
   (6.0): legacy --gold/--cream tokens, flat .card stack, generic .sh header
   reading as a CRUD list. Now an editorial "drill book": serif masthead, a
   felt Drill of the Day focal peak, .pb-card material rows with a category
   brass-rail, metadata chips, a quiet chevron, and a scrollable tab strip.
   ================================================ */

Router.register("drills", function() {
  var h = '<div class="roster-masthead" style="padding-bottom:6px">';
  h += '<button class="back" onclick="Router.back(\'more\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">Practice · The Range</div>';
  h += '<h1 class="roster-headline">The drill book.</h1>';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.5;margin-top:10px;max-width:440px">A working library of practice drills — pick a focus, groove the move, take it to the range.</div>';
  h += '</div>';

  // Featured "Drill of the Day" focal peak (felt panel) — fills above the list.
  h += '<div id="drill-feature" style="padding:6px 16px 2px"></div>';

  // Category filter — horizontally scrollable single-line chip strip.
  var cats = {all:"All", path:"Path & Plane", extension:"Posture", short:"Short Game", general:"Full Swing"};
  h += '<div class="drill-tabs">';
  Object.keys(cats).forEach(function(key) {
    h += '<button class="drill-tab' + (key === "all" ? ' is-on' : '') + '" data-cat="' + key + '" onclick="filterDrills(\'' + key + '\')">' + cats[key] + '</button>';
  });
  h += '</div>';

  h += '<div id="drills-list" style="padding:4px 16px 0"></div>';
  h += renderPageFooter();
  document.querySelector('[data-page="drills"]').innerHTML = h;
  renderDrillFeature();
  filterDrills("all");
});

// Clubhouse category accents (was legacy --gold/--blue/--birdie).
function _drillCatColor(cat) {
  return ({ path:"var(--cb-brass)", extension:"var(--cb-green)", short:"var(--cb-claret)", general:"var(--cb-felt)", custom:"var(--cb-copper)" })[cat] || "var(--cb-brass)";
}
function _drillCatName(cat) {
  return ({ path:"Path & Plane", extension:"Extension & Posture", short:"Short Game", general:"Full Swing", custom:"My Drills" })[cat] || cat;
}
function _drillChips(d) {
  var c = '<div class="drill-chips">';
  if (d.diff) c += '<span class="drill-chip"><span class="drill-chip__dot"></span>' + escHtml(String(d.diff)) + '</span>';
  if (d.dur)  c += '<span class="drill-chip">' + escHtml(String(d.dur)) + ' min</span>';
  if (d.equip && d.equip !== "None") c += '<span class="drill-chip">' + escHtml(d.equip) + '</span>';
  c += '</div>';
  return c;
}

// Day-stable featured drill (no randomness — same drill all day).
function renderDrillFeature() {
  var el = document.getElementById("drill-feature");
  if (!el) return;
  var all = (typeof DRILL_LIBRARY !== "undefined" ? DRILL_LIBRARY : []);
  if (!all.length) { el.innerHTML = ""; return; }
  var idx = (new Date().getDate()) % all.length;
  var d = all[idx];
  var hero = '<div class="pb-card pb-card--felt drill-feature">';
  hero += '<div class="drill-feature__eyebrow">Drill of the day · ' + escHtml(_drillCatName(d.cat)) + '</div>';
  hero += '<div class="drill-feature__name">' + escHtml(d.name) + '</div>';
  hero += '<div class="drill-feature__desc">' + escHtml(d.desc) + '</div>';
  hero += '<button class="pb-btn-brass drill-feature__cta" onclick="Router.go(\'range\')">Start this drill</button>';
  hero += '</div>';
  el.innerHTML = hero;
}

function filterDrills(cat) {
  var el = document.getElementById("drills-list");
  if (!el) return;
  document.querySelectorAll('[data-page="drills"] .drill-tab').forEach(function(b) {
    b.className = "drill-tab" + (b.getAttribute("data-cat") === cat ? " is-on" : "");
  });

  var allDrills = (typeof DRILL_LIBRARY !== "undefined" ? DRILL_LIBRARY : []).concat(typeof customDrills !== "undefined" ? customDrills : []);
  var filtered = cat === "all" ? allDrills : allDrills.filter(function(d) { return d.cat === cat; });

  if (!filtered.length) {
    el.innerHTML = '<div class="pf-empty"><div class="pf-empty__h">Nothing filed under this one</div><div class="pf-empty__b">Try another category — or add your own drill below.</div></div>';
    return;
  }

  var h = '';
  filtered.forEach(function(d) {
    var catColor = _drillCatColor(d.cat);
    h += '<div class="pb-card pb-card--rail drill-row" style="--rail:' + catColor + '">';
    h += '<div class="drill-row__top">';
    h += '<div class="drill-row__main">';
    h += '<span class="drill-row__cat" style="color:' + catColor + '">' + escHtml(_drillCatName(d.cat)) + '</span>';
    h += '<div class="drill-row__name">' + escHtml(d.name) + '</div>';
    h += '<div class="drill-row__desc">' + escHtml(d.desc) + '</div>';
    h += _drillChips(d);
    h += '</div>';
    h += '<button class="drill-row__more" aria-label="Show how to do it" onclick="toggleDrillExpand(\'' + d.id + '\')"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg></button>';
    h += '</div>';
    h += '<div id="drill-detail-' + d.id + '" class="drill-row__detail" style="display:none">';
    h += '<div class="drill-row__howto-label">How to do it</div>';
    h += '<div class="drill-row__howto">' + escHtml(d.howTo || d.desc) + '</div>';
    h += '<button class="pb-btn-brass" style="margin-top:10px;font-size:12px;padding:8px 14px" onclick="Router.go(\'range\')">Start range session</button>';
    h += '</div>';
    h += '</div>';
  });
  el.innerHTML = h;
}

function toggleDrillExpand(drillId) {
  var el = document.getElementById("drill-detail-" + drillId);
  if (!el) return;
  var open = el.style.display !== "none";
  el.style.display = open ? "none" : "block";
  var btn = el.parentElement.querySelector(".drill-row__more");
  if (btn) btn.style.transform = open ? "" : "rotate(180deg)";
}
