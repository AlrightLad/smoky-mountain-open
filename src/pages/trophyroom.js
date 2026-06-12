// ========== TROPHY ROOM ==========
Router.register("trophyroom", function(params) {
  var pid = (params && params.id) ? params.id : (currentUser ? currentUser.uid : null);
  // Try local player first, then check if pid matches a local id
  var p = PB.getPlayer(pid);
  
  // If no local player, try Firebase
  if (!p && db && pid) {
    db.collection("members").doc(pid).get().then(function(doc) {
      if (doc.exists) renderTrophyRoom(doc.data());
      else { Router.toast("Player not found"); Router.go("home"); }
    });
    document.querySelector('[data-page="trophyroom"]').innerHTML = '<div class="loading"><div class="spinner"></div>Loading trophy room...</div>';
    return;
  }
  if (!p) { Router.toast("Select a player"); Router.go("members"); return; }
  renderTrophyRoom(p);
});

// Title progression: shared by the standing's "next title" hint and the Titles rail.
var _TR_TITLE_KEYS = [1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
var _TR_TITLES = {1:"Rookie",5:"Weekend Warrior",10:"Range Rat",15:"Fairway Finder",20:"Club Member",25:"Course Regular",30:"Low Handicapper",35:"Scratch Aspirant",40:"Ironman",45:"Birdie Hunter",50:"Eagle Eye",55:"Tour Wannabe",60:"Golf Addict",65:"Links Legend",70:"Course Conqueror",75:"The Professor",80:"Hall of Famer",85:"Living Legend",90:"Immortal",95:"Transcendent",100:"G.O.A.T."};

function _trAceCount(name) {
  if (!name) return 0;
  var rec = (typeof PB !== "undefined" && PB.getRecords) ? PB.getRecords() : null;
  if (!rec || !rec.holeInOnes) return 0;
  return rec.holeInOnes.filter(function(a) { return a.by === name; }).length;
}

function _trNextTitle(level) {
  for (var i = 0; i < _TR_TITLE_KEYS.length; i++) {
    if (_TR_TITLE_KEYS[i] > level) return _TR_TITLES[_TR_TITLE_KEYS[i]];
  }
  return null;
}

function _trSubdeck(lvl, trophyCount, aceCount) {
  var parts = ["Level " + lvl.level + " · " + escHtml(lvl.name)];
  if (trophyCount) parts.push(trophyCount + (trophyCount === 1 ? " trophy" : " trophies"));
  if (aceCount) parts.push(aceCount + (aceCount === 1 ? " ace" : " aces"));
  return parts.join(" · ");
}

// earnedAt is a "YYYY-MM-DD" date string (see PB.getAchievements); ISO order sorts lexically.
function _trFmtEarned(earnedAt) {
  if (!earnedAt) return "";
  var d = new Date(earnedAt + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  var mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return mn[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function _trSortEarned(a, b) {
  var ea = a.earnedAt || "", eb = b.earnedAt || "";
  if (ea && eb) return eb < ea ? -1 : (eb > ea ? 1 : 0);
  if (ea) return -1;
  if (eb) return 1;
  return 0;
}

// Canonical section head — ONE treatment for every section (replaces six
// inline clones). Mono-brass eyebrow + Fraunces italic title, optional aside
// slot (count chip or control) on the hairline base. Same rhythm as the
// app-wide .sec-head, kept editorial for the trophy room.
function _trSecHead(eyebrow, title, asideHtml) {
  var s = '<header class="tr-sec-head">';
  s += '<div class="tr-sec-head__text">';
  s += '<div class="tr-sec-head__eyebrow">' + escHtml(eyebrow) + '</div>';
  s += '<h2 class="tr-sec-head__title">' + escHtml(title) + '</h2>';
  s += '</div>';
  if (asideHtml) s += asideHtml;
  s += '</header>';
  return s;
}

// Designed empty/loading state (P10) — every section says plainly what lives
// there and how to fill it, in the Caddy's voice; never bare text. Call sites
// pass literal copy only (escHtml kept for safety).
function _trEmpty(head, body, extraClass) {
  var s = '<div class="tr-empty' + (extraClass ? ' ' + extraClass : '') + '">';
  if (head) s += '<div class="tr-empty__head">' + escHtml(head) + '</div>';
  if (body) s += '<div class="tr-empty__body">' + escHtml(body) + '</div>';
  return s + '</div>';
}

function _trRecRow(label, value, ctx, onclick) {
  var clickable = !!onclick;
  var s = "<" + (clickable ? 'button type="button"' : "div") + ' class="tr-rec' + (clickable ? " tr-rec--link" : "") + '"' + (clickable ? ' onclick="' + onclick + '"' : "") + ">";
  s += '<span class="tr-rec__label">' + escHtml(label) + "</span>";
  s += '<span class="tr-rec__val">' + escHtml(value);
  if (ctx) s += '<span class="tr-rec__ctx">' + escHtml(ctx) + "</span>";
  if (clickable) s += '<svg class="tr-rec__chev" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 2l4 4-4 4"/></svg>';
  s += "</span>";
  s += "</" + (clickable ? "button" : "div") + ">";
  return s;
}

// Roll of Honor (rank 13) — past season champions, most-recent first, for the
// trophy-lineage chain. Reuses the standings archive logic: a season counts only
// once complete and with a points-bearing winner (P9 — never crown an open season).
function _trRollOfHonor() {
  if (typeof PB === "undefined" || !PB.getSeasonStandings || !PB.SEASON_CONFIG) return [];
  var out = [];
  var curYear = new Date().getFullYear();
  for (var y = curYear; y >= 2026; y--) {
    PB.SEASON_CONFIG.forEach(function(cfg) {
      try {
        var ss = PB.getSeasonStandings(y, cfg.key);
        if (ss && ss.standings && ss.standings.length && localDateStr() > ss.seasonEnd && (ss.standings[0].points || 0) > 0) {
          var champ = ss.standings[0];
          out.push({ id: champ.id, champName: champ.name || champ.username || "A champion", season: cfg.label + " " + y, pts: champ.points });
        }
      } catch (e) {}
    });
  }
  return out;
}

// ── Section builders ─────────────────────────────────────────────────────────
// Each returns one self-contained block so renderTrophyRoom reads as a table
// of contents. Presentation only; every value still comes from PB.* getters.

function _trMastheadSec(p, pid, lvl, trophyCount, aceCount) {
  var displayName = p.username || p.name || "Member";
  var firstName = String(displayName).trim().split(/\s+/)[0] || displayName;
  var isSelf = !!(currentUser && pid === currentUser.uid);
  var h = '<div class="roster-masthead">';
  h += '<div class="roster-eyebrow">THE TROPHY ROOM · ' + escHtml(String(displayName).toUpperCase()) + '</div>';
  h += '<h1 class="roster-headline">' + (isSelf ? "Your hardware." : escHtml(firstName) + "&rsquo;s hardware.") + '</h1>';
  h += '<div class="tr-subdeck">' + _trSubdeck(lvl, trophyCount, aceCount) + '</div>';
  h += '<button type="button" class="tr-back" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">&larr; Back to profile</button>';
  return h + '</div>';
}

// Standing (level + title + XP progress)
function _trStandingSec(lvl) {
  var xpInLevel = lvl.xp - lvl.currentLevelXp;
  var xpNeeded = lvl.nextLevelXp - lvl.currentLevelXp;
  var pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  var atMax = lvl.level >= 100 || xpNeeded <= 0;
  var nextTitle = _trNextTitle(lvl.level);
  var h = '<section class="tr-standing tr-standing--hero" aria-label="Current standing">';
  h += '<div class="tr-standing__rail"><div class="tr-standing__lvlcap">Level</div><div class="tr-standing__level" data-count="' + lvl.level + '">0</div></div>';
  h += '<div class="tr-standing__body">';
  h += '<div class="tr-standing__title">' + escHtml(lvl.name) + '</div>';
  h += '<div class="tr-standing__xp"><span data-count="' + lvl.xp + '">0</span> XP earned</div>';
  h += '<div class="tr-standing__bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to next level"><div class="tr-standing__fill" style="transform:scaleX(' + (pct / 100) + ')"></div></div>';
  if (atMax) h += '<div class="tr-standing__next">Top of the board. G.O.A.T. status.</div>';
  else h += '<div class="tr-standing__next">' + (xpNeeded - xpInLevel).toLocaleString() + ' XP to Level ' + (lvl.level + 1) + (nextTitle ? ' · ' + escHtml(nextTitle) : '') + '</div>';
  h += '</div>';
  return h + '</section>';
}

// Recently earned marquee (real achievements, newest first)
function _trRecentSec(achievements) {
  var h = '<section class="tr-sec" aria-label="Recently earned">';
  h += _trSecHead("Fresh hardware", "Recently earned", achievements.length ? '<div class="tr-sec-count">' + achievements.length + ' total</div>' : null);
  if (achievements.length) {
    var recent = achievements.slice().sort(_trSortEarned).slice(0, 6);
    h += '<div class="tr-marquee">';
    recent.forEach(function(a) {
      var earned = _trFmtEarned(a.earnedAt);
      h += '<div class="tr-cell"><div class="tr-cell__emblem">' + a.icon + '</div><div class="tr-cell__name">' + escHtml(a.name) + '</div><div class="tr-cell__meta">' + (earned || "Unlocked") + '</div></div>';
    });
    h += '</div>';
  } else {
    h += _trEmpty("The shelf is waiting.", "Log a round, break a record, win a match — the wall below shows everything there is to earn, and the first few come quick.");
  }
  return h + '</section>';
}

// Roll of Honor (rank 13) — the hero: the league's chain of season champions.
// Lineage, not a flat badge: each past season's champion, reigning holder lit
// at the top. Pure read from getSeasonStandings per completed season (P9 — only
// real, points-bearing champions; nobody crowned for an unfinished season).
function _trHonorSec() {
  var honor = _trRollOfHonor();
  var h = '<section class="tr-sec" aria-label="Roll of Honor">';
  h += _trSecHead("Season champions", "Roll of Honor", honor.length ? '<div class="tr-sec-count">' + honor.length + ' season' + (honor.length !== 1 ? 's' : '') + '</div>' : null);
  if (!honor.length) {
    h += _trEmpty("No crowns handed out yet.", "The first completed season puts the first name on this wall. No pressure — but it might as well be yours.");
    return h + '</section>';
  }
  h += '<div class="tr-honor-panel">';
  h += '<div class="tr-honor">';
  honor.forEach(function(e, i) {
    var champPlayer = (PB.getPlayer && PB.getPlayer(e.id)) || { name: e.champName };
    var go = "Router.go('members',{id:'" + String(e.id).replace(/'/g, "\\'") + "'})";
    h += '<div class="tr-honor__row' + (i === 0 ? ' tr-honor__row--current' : '') + '" role="button" tabindex="0" onclick="' + go + '" onkeydown="if(event.key===\'Enter\'){' + go + '}">';
    h += '<span class="tr-honor__node"></span>';
    h += renderAvatar(champPlayer, i === 0 ? 42 : 32, false);
    h += '<div class="tr-honor__main"><div class="tr-honor__season">' + escHtml(e.season) + (i === 0 ? '<span class="tr-honor__reign">Reigning</span>' : '') + '</div><div class="tr-honor__champ">' + escHtml(e.champName) + '</div></div>';
    h += '<div class="tr-honor__pts">' + e.pts + '<span>pts</span></div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div class="tr-honor__caption">' + escHtml(honor.length === 1 ? honor[0].champName + " holds the only crown so far — someone take it off him." : "The crown has changed hands across " + honor.length + " seasons. Whose name goes on next?") + '</div>';
  h += '</div>';
  return h + '</section>';
}

// Records ledger (real personal bests; aces deep-link to the dedicated wall)
function _trRecordsSec(s) {
  var h = '<section class="tr-sec" aria-label="Records">';
  h += _trSecHead("The ledger", "Records", null);
  if (s.rounds.length || s.best || s.best9 || s.aceCount || s.unique) {
    h += '<div class="tr-records tr-records--peak">';
    h += _trRecRow("Best round", s.best ? String(s.best.score) : "—", null, null);
    if (s.best9) h += _trRecRow("Best nine", String(s.best9.score), s.best9.holesMode === "back9" ? "Back 9" : "Front 9", null);
    h += _trRecRow("Rounds logged", String(s.rounds.length), null, null);
    h += _trRecRow("Courses played", String(s.unique), null, "window._courseViewMode='ours';Router.go('courses')");
    h += _trRecRow("Aces", String(s.aceCount), s.aceCount === 1 ? "hole-in-one" : "holes-in-one", "Router.go('aces')");
    h += '</div>';
  } else {
    h += _trEmpty("No numbers in the book yet.", "Your first logged round opens the ledger — best round, best nine, and every line after writes itself.");
  }
  return h + '</section>';
}

// The wall (full catalog with locked silhouettes; toggle filters to earned)
function _trWallSec(pid) {
  var h = '<section class="tr-sec" aria-label="Achievement wall">';
  h += _trSecHead("Every trophy there is", "The wall", '<button type="button" id="trWallToggle" class="tr-wall-toggle" aria-pressed="false" onclick="toggleTrophyFilter(\'' + pid + '\')">Earned only</button>');
  h += '<div id="trophyAchGrid"></div>';
  return h + '</section>';
}

// League trophies (custom catalog; computed leaders fill in async)
function _trLeagueSec() {
  var h = '<section class="tr-sec" aria-label="League and platform trophies">';
  h += _trSecHead("Commissioner's cabinet", "League trophies", null);
  h += '<div id="trophyCustomGrid">' + _trEmpty(null, "Loading league trophies…", "tr-empty--loading") + '</div>';
  return h + '</section>';
}

// Titles (level progression rail)
function _trTitlesSec(lvl) {
  var h = '<section class="tr-sec" aria-label="Title progression">';
  h += _trSecHead("The climb to 100", "Titles", '<div class="tr-sec-count">Level ' + lvl.level + ' of 100</div>');
  h += '<div class="tr-titles">';
  _TR_TITLE_KEYS.forEach(function(lv) {
    var unlocked = lvl.level >= lv;
    var isCurrent = lvl.titleLevel === lv;
    h += '<div class="title-row' + (unlocked ? '' : ' locked') + (isCurrent ? ' title-row--current' : '') + '">';
    h += '<div class="t-level">LV' + lv + '</div>';
    h += '<div class="t-name">' + escHtml(_TR_TITLES[lv]) + '</div>';
    if (isCurrent) h += '<div class="t-status t-status--current">Current</div>';
    else if (unlocked) h += '<div class="t-status t-status--unlocked">Unlocked</div>';
    else h += '<div class="t-status t-status--locked">Locked</div>';
    h += '</div>';
  });
  h += '</div>';
  return h + '</section>';
}

// Page-scoped styles (Fix 2 weight ladder + Fix 4 contrast). Kept INSIDE the
// page so the structural Clubhouse pass needs no shared-CSS edit:
//  · the Level/XP hero + Records read as the visual peak (brass border, lifted
//    surface) while routine sections step down to the plain hairline treatment;
//  · every locked/muted LABEL that was painted in the decorative --cb-mute-2
//    (#A8A395, ~1.x:1 — fails WCAG AA) is repainted in AA-safe --cb-mute /
//    --cb-ink-faint so locked rows stay legible (ADA requirement).
var _TR_STYLE = '<style id="tr-page-style">'
  + '.tr-standing--hero{background:linear-gradient(135deg,rgba(var(--cb-brass-rgb),.08),var(--cb-chalk-2));border:1px solid rgba(var(--cb-brass-rgb),.45);box-shadow:var(--el-2);padding:20px 22px}'
  + '.tr-standing--hero .tr-standing__rail{border-right-color:rgba(var(--cb-brass-rgb),.3)}'
  + '.tr-tabs{margin:20px var(--tr-gutter) 4px;padding-bottom:2px;border-bottom:1px solid var(--cb-chalk-3);gap:20px;flex-wrap:wrap}'
  + '.tr-tabs .roster-tab{min-height:44px}'
  + '.tr-tabpanel>.tr-sec:first-child{margin-top:18px}'
  + '.tr-records--peak{border-color:rgba(var(--cb-brass-rgb),.4);box-shadow:var(--el-2)}'
  + '.tr-tabpanel{animation:trFadeIn var(--duration-base,.24s) var(--ease-default,ease)}'
  + '@keyframes trFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'
  /* Fix 4 — AA-safe locked/muted labels (override decorative --cb-mute-2 text). */
  + '.tr-titles .title-row.locked .t-level{color:var(--cb-mute)}'
  + '.tr-titles .t-status--locked{color:var(--cb-mute)}'
  /* Differentiate-by-purpose: the ladder is an ordered climb, so the current
     rung gets a brass spine that ties it to the hero — rows stay rows, the
     wall stays cards, and the divergence now reads as deliberate. */
  + '.tr-titles .title-row--current{border-color:rgba(var(--cb-brass-rgb),.45);box-shadow:inset 3px 0 0 var(--cb-brass)}'
  + '#trophyAchGrid .ach-card.locked .ach-xp{color:var(--cb-mute)}'
  + '#trophyAchGrid .ach-card.locked .ach-icon{color:var(--cb-mute-1)}'
  + '@media (prefers-reduced-motion:reduce){.tr-tabpanel{animation:none}}'
  + '</style>';

// Tabs realize the progressive-disclosure split (Fix 1): the masthead + Level/XP
// hero stay pinned; everything else lives behind one segmented control so the
// default view is two screens, not twenty. Every trophy/record still renders —
// just on the tab that owns it.
var _TR_TABS = [
  { key: 'earned', label: 'Earned' },
  { key: 'records', label: 'Records' },
  { key: 'all', label: 'All Trophies' },
  { key: 'levels', label: 'Levels' }
];
var trophyActiveTab = 'earned';
var _trCtx = null; // { p, pid, lvl, achievements, stats } — for tab re-renders.

function _trTabBar() {
  var h = '<div class="roster-tabs tr-tabs" role="tablist" aria-label="Trophy room sections">';
  _TR_TABS.forEach(function(t) {
    var active = trophyActiveTab === t.key;
    h += '<button type="button" role="tab" class="roster-tab' + (active ? ' roster-tab--active' : '') + '"'
      + ' data-trtab="' + t.key + '" aria-selected="' + (active ? 'true' : 'false') + '"'
      + ' onclick="trophySetTab(\'' + t.key + '\')">' + escHtml(t.label) + '</button>';
  });
  return h + '</div>';
}

// Build only the panel the active tab owns. Section builders are unchanged —
// we just route them so the heavy catalog isn't in the first paint.
function _trPanel(tab, ctx) {
  var h = '<div class="tr-tabpanel" id="trTabPanel" role="tabpanel">';
  if (tab === 'records') {
    h += _trRecordsSec(ctx.stats);
    h += _trLeagueSec();
  } else if (tab === 'all') {
    h += _trWallSec(ctx.pid);
  } else if (tab === 'levels') {
    h += _trTitlesSec(ctx.lvl);
  } else { // earned (default)
    h += _trRecentSec(ctx.achievements);
    h += _trHonorSec();
  }
  return h + '</div>';
}

// Hydrate the async grids that the freshly-rendered panel exposes. Idempotent:
// safe to call on every tab switch; no-ops when the target node is absent.
// Entering the wall rebuilds the toggle in its "Earned only" off-state, so we
// reset the filter to match — button and grid never disagree.
function _trHydrateTab(tab, ctx) {
  if (tab === 'all') {
    trophyShowUnlockedOnly = false;
    renderTrophyAchGrid(ctx.pid, false);
  } else if (tab === 'records') {
    renderTrophyCustomGrid(ctx.pid);
  }
}

function renderTrophyRoom(p) {
  var pid = p.id;
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid));
  var achievements = PB.getAchievements(pid);
  var aceCount = _trAceCount(p.name);
  var stats = {
    rounds: PB.getPlayerRounds(pid),
    best: PB.getPlayerBest(pid),
    best9: PB.getPlayerBest9(pid),
    unique: PB.getUniqueCourses(pid),
    aceCount: aceCount
  };

  trophyActiveTab = 'earned';
  trophyShowUnlockedOnly = false;
  _trCtx = { p: p, pid: pid, lvl: lvl, achievements: achievements, stats: stats };

  var h = _TR_STYLE + '<div class="tr-wrap">';
  // Always-visible peak: identity masthead + the Level/XP standing hero.
  h += _trMastheadSec(p, pid, lvl, achievements.length, aceCount);
  h += _trStandingSec(lvl);
  // Progressive disclosure: segmented control + the active panel only.
  h += _trTabBar();
  h += _trPanel(trophyActiveTab, _trCtx);
  h += '</div>'; // .tr-wrap

  document.querySelector('[data-page="trophyroom"]').innerHTML = h;
  _trHydrateTab(trophyActiveTab, _trCtx);
  setTimeout(initCountAnimations, 50);
}

// Tab switch — re-render just the panel area and hydrate its async grids.
// Mirrors the roster tab pattern (members.js) for app-wide consistency.
function trophySetTab(tab) {
  if (!_trCtx) return;
  trophyActiveTab = tab;
  var bar = document.querySelector('.tr-tabs');
  if (bar) {
    var btns = bar.querySelectorAll('.roster-tab');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-trtab') === tab;
      btns[i].classList.toggle('roster-tab--active', on);
      btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
  }
  var panel = document.getElementById('trTabPanel');
  if (panel) {
    var wrap = panel.parentNode;
    var fresh = document.createElement('div');
    fresh.innerHTML = _trPanel(tab, _trCtx);
    wrap.replaceChild(fresh.firstChild, panel);
  }
  _trHydrateTab(tab, _trCtx);
}

var trophyShowUnlockedOnly = false;

function toggleTrophyFilter(pid) {
  trophyShowUnlockedOnly = !trophyShowUnlockedOnly;
  var btn = document.getElementById("trWallToggle");
  if (btn) {
    btn.classList.toggle("tr-wall-toggle--on", trophyShowUnlockedOnly);
    btn.setAttribute("aria-pressed", trophyShowUnlockedOnly ? "true" : "false");
    btn.textContent = trophyShowUnlockedOnly ? "Show all" : "Earned only";
  }
  renderTrophyAchGrid(pid, trophyShowUnlockedOnly);
}

function renderTrophyAchGrid(pid, unlockedOnly) {
  var el = document.getElementById("trophyAchGrid");
  if (!el) return;
  
  var achievements = PB.getAchievements(pid);
  var allPossible = getAllPossibleAchievements();
  var unlockedIds = {};
  achievements.forEach(function(a) { unlockedIds[a.id] = a; });
  
  var categories = [
    { key: "milestone", name: "Milestones" },
    { key: "score", name: "Score" },
    { key: "explore", name: "Exploration" },
    { key: "compete", name: "Competitive" },
    { key: "growth", name: "Improvement" },
    { key: "special", name: "Special" },
    { key: "range", name: "Range Practice" },
    { key: "level", name: "Level Milestones" },
    { key: "event", name: "Events" },
    { key: "blunder", name: "Hall of Shame" }
  ];
  
  var h = '';
  categories.forEach(function(cat) {
    var catAchs = allPossible.filter(function(a) { return a.cat === cat.key; });
    
    // Include dynamically unlocked achievements not in allPossible (like event badges)
    achievements.forEach(function(a) {
      if (a.cat === cat.key && !catAchs.some(function(p){return p.id === a.id})) {
        catAchs.push(a);
      }
    });
    
    if (!catAchs.length) return;
    
    if (unlockedOnly) {
      catAchs = catAchs.filter(function(a) { return unlockedIds[a.id]; });
      if (!catAchs.length) return;
    }
    
    var unlockedCount = catAchs.filter(function(a) { return unlockedIds[a.id]; }).length;

    h += '<div class="ach-cat-head">' + cat.name + ' <span class="ach-cat-head__count">' + unlockedCount + (unlockedOnly ? '' : '/' + catAchs.length) + '</span></div>';
    h += '<div class="ach-grid">';
    catAchs.forEach(function(a) {
      var unlocked = unlockedIds[a.id];
      h += '<div class="ach-card' + (unlocked ? '' : ' locked') + '">';
      h += '<div class="ach-icon">' + a.icon + '</div>';
      h += '<div class="ach-name">' + escHtml(a.name) + '</div>';
      h += '<div class="ach-desc">' + escHtml(a.desc) + '</div>';
      if (a.xp > 0) h += '<div class="ach-xp">+' + a.xp + ' XP</div>';
      if (unlocked) {
        var earnedOn = _trFmtEarned(unlocked.earnedAt);
        if (earnedOn) {
          h += '<div class="ach-earned"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM11 1v2M5 1v2M2 6h12"/></svg> ' + earnedOn + '</div>';
        } else {
          h += '<div class="ach-earned"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8l2 2 3-4"/></svg> UNLOCKED</div>';
        }
      }
      h += '</div>';
    });
    h += '</div>';
  });

  // "Earned only" with nothing earned yet — designed empty, not a blank gap (P10).
  if (!h) h = _trEmpty("Nothing earned just yet.", "Switch back to “Show all” to scout the full wall — the first trophies fall fast.");

  el.innerHTML = h;
}

// ── Custom league/platform trophies (from config/trophyCatalog + league doc) ──
// Async: loads the catalog, then renders each active trophy with an honest
// computed-leader line (no fabricated leaders — P9). Computable measures show a
// live leader; non-computable ones say so plainly.
function renderTrophyCustomGrid(pid) {
  var el = document.getElementById("trophyCustomGrid");
  if (!el) return;
  if (typeof loadTrophyCatalog !== "function" || typeof evaluateTrophy !== "function") {
    var sec = el.closest ? el.closest("section") : null;
    if (sec) sec.style.display = "none"; else el.innerHTML = "";
    return;
  }
  loadTrophyCatalog(function() {
    var elNow = document.getElementById("trophyCustomGrid");
    if (!elNow) return;
    var defs = (typeof pbCachedTrophyDefs === "function" ? pbCachedTrophyDefs() : []).filter(function(d) { return d && d.active !== false; });
    if (!defs.length) {
      elNow.innerHTML = _trEmpty("The cabinet stands empty.", "Custom trophies your commissioner composes for the league land here, alongside any platform-wide hardware.");
      return;
    }
    var html = '<div class="tr-custom-grid">';
    defs.forEach(function(d) { html += trophyCustomCard(d, pid); });
    html += '</div>';
    elNow.innerHTML = html;
  });
}

function trophyCustomCard(d, pid) {
  var emblem = (typeof trophyEmblemSvg === "function" && trophyEmblemSvg(d)) || _trCustomPlaceholder();
  var ev = evaluateTrophy(d);
  var earned = !!(ev.computable && ev.earnedIds && ev.earnedIds.indexOf(pid) !== -1);
  var tier = (d.tier === "rare" || d.tier === "championship") ? d.tier : "common";
  var summary = (typeof trophyCriteriaSummary === "function" && trophyCriteriaSummary(d)) || "";
  var h = '<div class="tr-custom-card tr-custom-card--' + tier + (earned ? ' tr-custom-card--earned' : '') + '">';
  h += '<div class="tr-custom-card__emblem">' + emblem + '</div>';
  h += '<div class="tr-custom-card__body">';
  h += '<div class="tr-custom-card__name">' + escHtml(d.name || "Trophy") + (earned ? '<span class="tr-custom-card__held">Held</span>' : '') + '</div>';
  if (summary) h += '<div class="tr-custom-card__criteria">' + escHtml(summary) + '</div>';
  h += '<div class="tr-custom-card__leader" aria-live="polite">' + _trCustomLeader(ev, pid) + '</div>';
  h += '</div></div>';
  return h;
}

function _trCustomLeader(ev, pid) {
  if (!ev || !ev.computable) return 'Leader pending. This trophy displays now; its live data source lands in a later stats release.';
  if (!ev.leader) return 'No qualifying rounds yet.';
  var lead = ev.leader;
  var disp = lead.display ? ' (' + escHtml(String(lead.display)) + ')' : '';
  if (lead.id === pid) return 'Current leader' + disp + '.';
  return 'Leader: ' + escHtml(String(lead.name || 'Member')) + disp + '.';
}

function _trCustomPlaceholder() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.4 2.4" opacity="0.45"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>';
}

// All possible achievements (for showing locked state)
var _ALL_ACHIEVEMENTS = null;
function getAllPossibleAchievements() {
  if (_ALL_ACHIEVEMENTS) return _ALL_ACHIEVEMENTS;
  _ALL_ACHIEVEMENTS = [
    {id:"first_blood",name:"First Blood",desc:"Log your first round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"},
    {id:"getting_started",name:"Getting Started",desc:"Log 5 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"},
    {id:"regular",name:"Regular",desc:"Log 10 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"},
    {id:"grinder",name:"Grinder",desc:"Log 25 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:250,cat:"milestone"},
    {id:"veteran",name:"Veteran",desc:"Log 50 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone"},
    {id:"centurion",name:"Centurion",desc:"Log 100 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"milestone"},
    {id:"live_scorer",name:"Live Scorer",desc:"Complete a Play Now round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"},
    {id:"dedicated",name:"Dedicated",desc:"10 Play Now rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"},
    {id:"attested",name:"Verified",desc:"Have a score attested",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"milestone"},
    {id:"honest_game",name:"Honest Game",desc:"10 attested rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"},
    {id:"home_course",name:"Home Course Hero",desc:"Play same course 5 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"milestone"},
    {id:"local_legend",name:"Local Legend",desc:"Play same course 10 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"},
    {id:"resident",name:"Resident Pro",desc:"Play same course 25 times",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"milestone"},
    {id:"sub120",name:"Breaking In",desc:"Break 120",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"score"},
    {id:"sub100",name:"Double Digits",desc:"Break 100",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v4M6 7h4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"score"},
    {id:"sub90",name:"Sub-90 Club",desc:"Shoot under 90",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:200,cat:"score"},
    {id:"sub85",name:"Mid-80s",desc:"Shoot under 85",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:300,cat:"score"},
    {id:"sub80",name:"Sharpshooter",desc:"Shoot under 80",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"score"},
    {id:"sub75",name:"Near Scratch",desc:"Shoot under 75",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:750,cat:"score"},
    {id:"sub70",name:"Tour Ready",desc:"Shoot under 70",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:1000,cat:"score"},
    {id:"course_rating",name:"Par for the Course",desc:"Shoot exactly the course rating",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:200,cat:"score"},
    {id:"sampler",name:"Course Sampler",desc:"Play 3 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"explore"},
    {id:"explorer",name:"Explorer",desc:"Play 5 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"explore"},
    {id:"collector",name:"Course Collector",desc:"Play 10 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"explore"},
    {id:"nomad",name:"Nomad",desc:"Play 25 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"explore"},
    {id:"traveler2",name:"State Hopper",desc:"Play courses in 2 states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"explore"},
    {id:"traveler",name:"Globe Trotter",desc:"Play in 3+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"explore"},
    {id:"roadwarrior",name:"Road Warrior",desc:"Play in 5+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"explore"},
    {id:"first_win",name:"First Win",desc:"Win an H2H matchup",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"compete"},
    {id:"rival",name:"Rival",desc:"Win 5 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"},
    {id:"nemesis",name:"Nemesis",desc:"Win 10 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"compete"},
    {id:"dominator",name:"Dominator",desc:"Win 25 H2H matchups",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"compete"},
    {id:"champion",name:"Champion",desc:"Win an event",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"compete"},
    {id:"dynasty",name:"Dynasty",desc:"Win 3 events",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"compete"},
    {id:"captain",name:"Captain",desc:"Named team captain",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"},
    {id:"team_player",name:"Drafted",desc:"Join a scramble team",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"compete"},
    {id:"multi_team",name:"Free Agent",desc:"Join 2 different scramble teams",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='5' cy='5' r='2.5' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='11' cy='5' r='2.5' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M1 13c0-2.2 1.8-4 4-4M7 13c0-2.2 1.8-4 4-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"compete"},
    {id:"scramble_debut",name:"Scramble Debut",desc:"Play in your first scramble round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"compete"},
    {id:"scramble_first_win",name:"First W",desc:"Win your first scramble match",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M4 2h8l-1 6H5L4 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 6M10 8l-2 6' stroke='currentColor' stroke-width='1.2'/><path d='M3 14h10' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"},
    {id:"squad_goals",name:"Squad Goals",desc:"Win 5 scramble matches",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"compete"},
    {id:"team_under_par",name:"Under the Radar",desc:"Team shoots under par in scramble",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 2a6 6 0 100 12A6 6 0 008 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 8l2 2 4-4' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"compete"},
    {id:"road_warriors",name:"Road Warriors",desc:"Play scramble at 3 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 14L8 2l6 12' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4.5 10h7' stroke='currentColor' stroke-width='1.2'/></svg>",xp:125,cat:"compete"},
    {id:"captain_obvious",name:"Captain",desc:"Lead your team as captain",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4 4.3 12.5l.7-4.1-3-2.9 4.2-.9z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"compete"},
    {id:"improving",name:"On The Rise",desc:"Average improved by 3+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"growth"},
    {id:"transformed",name:"Transformed",desc:"Average improved by 8+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"growth"},
    {id:"metamorphosis",name:"Metamorphosis",desc:"Average improved by 15+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"growth"},
    {id:"sandbagger",name:"Sandbagger",desc:"Beat average by 10+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"growth"},
    {id:"ace",name:"Ace",desc:"Make a hole-in-one",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:1000,cat:"special"},
    {id:"og",name:"The Original Four",desc:"Founding member",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"special"},
    {id:"beta",name:"Beta Tester",desc:"Among the first 30 members",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"special"},
    {id:"profile_started",name:"Getting Settled",desc:"Add your first profile detail",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"special"},
    {id:"profile_complete",name:"Profile Complete",desc:"Fill in bio, range, home course & clubs",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 9l2 2 3-4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special"},
    {id:"fully_loaded",name:"Fully Loaded",desc:"Complete profile with photo & 5+ club distances",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='.8'/></svg>",xp:200,cat:"special"},
    {id:"lvl5",name:"Level 5",desc:"Reach Weekend Warrior",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:0,cat:"level"},
    {id:"lvl10",name:"Level 10",desc:"Reach Range Rat",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:0,cat:"level"},
    {id:"lvl25",name:"Level 25",desc:"Reach Course Regular",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l4 4-4 10-4-10 4-4z' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='7' r='1.5' fill='currentColor'/></svg>",xp:0,cat:"level"},
    {id:"lvl50",name:"Level 50",desc:"Reach Eagle Eye",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:0,cat:"level"},
    {id:"lvl75",name:"Level 75",desc:"Reach The Professor",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:0,cat:"level"},
    {id:"lvl100",name:"Level 100",desc:"Reach G.O.A.T.",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:0,cat:"level"},
    {id:"blow120",name:"The Blow-Up",desc:"Shoot 120 or higher",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l1 4 4-1-3 3 3 3-4-1-1 4-1-4-4 1 3-3-3-3 4 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"blunder"},
    {id:"blow130",name:"Cart Path Warrior",desc:"Shoot 130 or higher",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='6' cy='14' r='1' fill='currentColor'/><circle cx='12' cy='14' r='1' fill='currentColor'/><path d='M1 1h2l2 9h8l2-6H5' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"blunder"},
    {id:"blow140",name:"Lost in the Woods",desc:"Shoot 140 or higher",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L4 7h2L3 12h10L10 7h2L8 1zM7 12h2v3H7z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"blunder"},
    {id:"roller_coaster",name:"Roller Coaster",desc:"20+ stroke swing between best and worst",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 12c2-8 4-8 6 0s4 0 6-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"blunder"},
    {id:"downhill",name:"Going Downhill",desc:"3 rounds in a row getting worse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 3l5 4 3-2 6 7' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M12 8l3 4h-4z' fill='currentColor'/></svg>",xp:25,cat:"blunder"},
    {id:"thick_skin",name:"Thick Skin",desc:"Log 5 rounds of 110+",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 2 3-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"blunder"},
    {id:"triple_club",name:"Triple Digit Club",desc:"10 rounds without breaking 100",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><text x='8' y='12' text-anchor='middle' font-size='10' font-weight='700' fill='currentColor'>100</text></svg>",xp:50,cat:"blunder"},
    {id:"hot_streak",name:"Hot Streak",desc:"Play 3 weeks in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1C6 4 4 5 4 8a4 4 0 008 0c0-2-1-3-2-4-.5 1-1 2-2 1 0-2 0-3 0-4z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"milestone"},
    {id:"iron_man_streak",name:"Iron Man",desc:"Play 6 weeks in a row",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M9 1L4 9h4l-1 6 6-8H9l1-6z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"milestone"},
    {id:"first_parbaugh",name:"First Parbaugh Round",desc:"Complete a Parbaugh Round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"milestone"},
    {id:"parbaugh_regular",name:"Parbaugh Regular",desc:"5 Parbaugh Rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"milestone"},
    {id:"parbaugh_veteran",name:"Parbaugh Veteran",desc:"25 Parbaugh Rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone"},
    {id:"boss_wife",name:"The Boss's Wife",desc:"The one who really runs things",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M2 12h12L13 5l-3 3-2-4-2 4-3-3z' fill='none' stroke='currentColor' stroke-width='1.2'/><rect x='2' y='12' width='12' height='2' rx='1' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:250,cat:"special"},
    {id:"the_commish",name:"The Commissioner",desc:"Running the show",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l6 4H2zM3 6v7M6 6v7M10 6v7M13 6v7M1 13h14M1 14h14' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"special"},
    {id:"first_post",name:"First Post",desc:"Send a message in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:25,cat:"milestone"},
    {id:"trash_talker",name:"Trash Talker",desc:"25 messages in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 6h4M6 8h2' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"milestone"},
    {id:"motormouth",name:"Motor Mouth",desc:"100 messages in the Clubhouse",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M14 10a2 2 0 01-2 2H6l-3 3V4a2 2 0 012-2h7a2 2 0 012 2z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"milestone"},
    {id:"weekend_warrior_ach",name:"Weekend Warrior",desc:"10 weekend rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M6 8l2 2 3-4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"milestone"},
    {id:"hooky",name:"Playing Hooky",desc:"10 weekday rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:150,cat:"milestone"},
    {id:"mr_consistent",name:"Mr. Consistent",desc:"Last 5 rounds within 5 strokes",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h14' stroke='currentColor' stroke-width='1.5'/><circle cx='4' cy='8' r='1.5' fill='currentColor'/><circle cx='8' cy='8' r='1.5' fill='currentColor'/><circle cx='12' cy='8' r='1.5' fill='currentColor'/></svg>",xp:200,cat:"growth"},
    {id:"holed_out",name:"Holed Out",desc:"Score a 1 on any hole",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='2' fill='currentColor'/></svg>",xp:500,cat:"special"},
    {id:"lifer",name:"Lifer",desc:"Log 200 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:2000,cat:"milestone"},
    {id:"legend",name:"Living Legend",desc:"Log 500 rounds",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:5000,cat:"milestone"},
    {id:"cartographer",name:"Cartographer",desc:"Play 50 different courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5' opacity='.3'/><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:1000,cat:"explore"},
    {id:"interstate",name:"Interstate",desc:"Play in 8+ states",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='currentColor' stroke='currentColor' stroke-width='.5'/></svg>",xp:500,cat:"explore"},
    {id:"b2b",name:"Back to Back",desc:"Play rounds on consecutive days",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M3 8h10M8 3v10' stroke='currentColor' stroke-width='1.5'/></svg>",xp:75,cat:"milestone"},
    {id:"dawn_patrol",name:"Dawn Patrol",desc:"Play a round in March",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 4v4l3 2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"milestone"},
    {id:"closer",name:"The Closer",desc:"Play a round in September",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 6v4' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='12' r='.8' fill='currentColor'/></svg>",xp:50,cat:"milestone"},
    {id:"team_player",name:"Drafted",desc:"Join a scramble team",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:50,cat:"compete"},
    {id:"squad_goals",name:"Squad Goals",desc:"Win 5 scramble matches",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 8h3l2-2 2 2 2-2 2 2h3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M4 8v4M12 8v4' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"compete"},
    {id:"recruiter",name:"Recruiter",desc:"Invite a new member",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M12 3v4M10 5h4' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special"},
    {id:"ambassador",name:"Ambassador",desc:"Use all 3 invites",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='5' r='3' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:250,cat:"special"},
    {id:"first_swing",name:"First Swing",desc:"Log your first range session",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"range_rat",name:"Range Rat",desc:"10 range sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"creature_habit",name:"Creature of Habit",desc:"25 range sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"range"},
    {id:"iron_sharpener",name:"Iron Sharpener",desc:"50 range sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:400,cat:"range"},
    {id:"range_resident",name:"Range Resident",desc:"100 range sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:750,cat:"range"},
    {id:"two_peat",name:"Two-Peat",desc:"2-week range streak",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"hot_streak",name:"Hot Streak",desc:"4-week range streak",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"dialed_in",name:"Dialed In",desc:"8-week range streak",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:250,cat:"range"},
    {id:"relentless",name:"Relentless",desc:"12-week range streak",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"range"},
    {id:"bucket_buster",name:"Bucket Buster",desc:"5 total hours on the range",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"range"},
    {id:"sweat_equity",name:"Sweat Equity",desc:"25 total hours on the range",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"range"},
    {id:"ten_k_hours",name:"10,000 Hours",desc:"100 total hours on the range",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:750,cat:"range"},
    {id:"locked_in",name:"Locked In",desc:"60+ minute range session",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"marathon_man",name:"Marathon Man",desc:"90+ minute range session",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:200,cat:"range"},
    {id:"lab_work",name:"Lab Work",desc:"Use 3+ drills in one session",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"coachs_orders",name:"Coach's Orders",desc:"Complete a session with 4 drills",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"range"},
    {id:"specialist",name:"Specialist",desc:"Use the same drill in 10 sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"range"},
    {id:"well_rounded",name:"Well-Rounded",desc:"Use drills from every category",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"custom_built",name:"Custom Built",desc:"Create and use a custom drill",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"double_duty",name:"Double Duty",desc:"Range session + round same day",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"range_dawn",name:"Dawn Patrol",desc:"Range session before 8am",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"range_night_owl",name:"Night Owl",desc:"Range session after 8pm",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"range_night_shift",name:"Night Shift",desc:"Range session after 6:30pm",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"range"},
    {id:"focused_practice",name:"Intentional",desc:"Log a range session with a focus note",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:25,cat:"range"},
    {id:"student_of_game",name:"Student of the Game",desc:"5 range sessions with a focus note",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"range"},
    {id:"tape_study",name:"Tape Study",desc:"Leave notes on 3 range sessions",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:50,cat:"range"},
    {id:"dialed_feel",name:"Dialed",desc:"Rate 3 sessions as Dialed",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:75,cat:"range"},
    {id:"deep_dive",name:"The Deep Dive",desc:"30+ min session with 3 drills and a focus note",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M8 5v6M5 8h6' stroke='currentColor' stroke-width='1'/></svg>",xp:125,cat:"range"},
    {id:"eagle_eye",name:"Eagle Eye",desc:"Score an eagle or better on any hole",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='8' cy='8' r='3' fill='none' stroke='currentColor' stroke-width='1'/><circle cx='8' cy='8' r='.8' fill='currentColor'/></svg>",xp:400,cat:"score"},
    {id:"birdie_machine",name:"Birdie Machine",desc:"Score 3 birdies in a single round",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 2a5 5 0 100 10A5 5 0 008 2z' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 7l2 2 4-4' stroke='currentColor' stroke-width='1.2'/></svg>",xp:300,cat:"score"},
    {id:"bogey_free",name:"Bogey Free",desc:"Complete an 18-hole round with no bogeys",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 8l2 2 4-4' stroke='currentColor' stroke-width='1.5'/></svg>",xp:600,cat:"score"},
    // Share achievements
    {id:"share_1",name:"First Take",desc:"Share your first scorecard",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:50,cat:"social"},
    {id:"share_5",name:"Posting Season",desc:"Share 5 scorecards",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:100,cat:"social"},
    {id:"share_10",name:"Content Creator",desc:"Share 10 scorecards",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:200,cat:"social",title:"Content Creator"},
    {id:"share_25",name:"The Brand",desc:"Share 25 scorecards",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:400,cat:"social",title:"The Brand"},
    {id:"share_50",name:"Parbaugh Propagandist",desc:"Share 50 scorecards",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:750,cat:"social",title:"Parbaugh Propagandist"},
    {id:"share_100",name:"The Chronicler",desc:"Share 100 scorecards",icon:"<svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.2'><circle cx='12' cy='3' r='1.5'/><circle cx='12' cy='13' r='1.5'/><circle cx='4' cy='8' r='1.5'/><path d='M5.5 7l5-3M5.5 9l5 3'/></svg>",xp:1500,cat:"social",title:"The Chronicler"},
    {id:"clean_card",name:"Clean Card",desc:"Complete an 18-hole round with no scores over par",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><rect x='3' y='2' width='10' height='12' rx='1' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M5 7l2 2 4-4' stroke='currentColor' stroke-width='1.2'/></svg>",xp:500,cat:"score"},
    {id:"flip_flop",name:"Flip Flop",desc:"Improve 10+ strokes over previous round at same course",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 12l5-7 3 4 3-6 3 5' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:150,cat:"growth"},
    {id:"trophy_shelf",name:"Trophy Shelf",desc:"Earn 15 achievements",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M3 13h10M4 7h8M5 7V4a1 1 0 012-2h2a1 1 0 012 2v3M4 13v-2a4 4 0 018 0v2' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:250,cat:"milestone"},
    {id:"achievement_hunter",name:"Achievement Hunter",desc:"Earn 25 achievements",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:500,cat:"milestone"},
    {id:"two_a_day",name:"Two-A-Day",desc:"Log two rounds on the same day",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><circle cx='5' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/><circle cx='11' cy='8' r='4' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:100,cat:"milestone"},
    {id:"triple_crown",name:"SMO Triple Crown",desc:"Play all four Smoky Mountain Open courses",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 14l5-10 3 5 4-7 2 12z' fill='none' stroke='currentColor' stroke-width='1'/><path d='M3 14h10' stroke='currentColor' stroke-width='1'/></svg>",xp:300,cat:"explore"},
    {id:"all_in",name:"All In",desc:"Log a round and a range session in the same week",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1.2'/></svg>",xp:75,cat:"milestone"},
    {id:"overcorrection",name:"The Overcorrection",desc:"Shoot 15+ strokes worse than your personal best",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M1 5l5 4 3-3 6 8' fill='none' stroke='currentColor' stroke-width='1.2'/><path d='M13 8l3 5h-4z' fill='currentColor'/></svg>",xp:30,cat:"blunder"},
    {id:"founding_season",name:"Founding Season",desc:"Log 5 rounds in the founding 2026 season",icon:"<svg viewBox='0 0 16 16' width='14' height='14'><path d='M8 1l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12l-4.3 2.5.8-4.9L1 6.2l4.8-.7L8 1z' fill='none' stroke='currentColor' stroke-width='1'/></svg>",xp:100,cat:"special"}
  ];
  return _ALL_ACHIEVEMENTS;
}
