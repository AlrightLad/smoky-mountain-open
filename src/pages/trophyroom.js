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

function renderTrophyRoom(p) {
  var pid = p.id;
  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvl = PB.calcLevelFromXP(PB.getPlayerXPForDisplay(pid));
  var achievements = PB.getAchievements(pid);
  var rounds = PB.getPlayerRounds(pid);
  
  var h = '<div class="sh"><h2>Trophy Room</h2><button class="back" onclick="Router.go(\'members\',{id:\'' + pid + '\'})">← Profile</button></div>';
  
  // Level header
  h += '<div class="trophy-header">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">' + escHtml(p.username || p.name) + '</div>';
  h += '<div class="trophy-level" data-count="' + lvl.level + '">0</div>';
  h += '<div class="trophy-title">' + escHtml(lvl.name) + '</div>';
  h += '<div class="trophy-xp"><span data-count="' + lvl.xp + '">0</span> XP</div>';
  
  // XP progress bar
  var xpInLevel = lvl.xp - lvl.currentLevelXp;
  var xpNeeded = lvl.nextLevelXp - lvl.currentLevelXp;
  var pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  h += '<div class="trophy-bar"><div class="trophy-bar-fill" style="width:' + pct + '%"></div></div>';
  h += '<div class="trophy-next">' + (xpNeeded - xpInLevel).toLocaleString() + ' XP to Level ' + (lvl.level + 1) + '</div>';
  h += '</div>';
  
  // Quick stats — Unlocked is now a clickable filter toggle
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px 16px">';
  h += '<div class="stat-box" id="trophyFilterBtn" onclick="toggleTrophyFilter(\'' + pid + '\')" style="cursor:pointer;border:1px solid var(--border);transition:border-color .15s"><div class="stat-val" style="font-size:18px">' + achievements.length + '</div><div class="stat-label">Unlocked</div></div>';
  h += '<div class="stat-box"><div class="stat-val" style="font-size:18px">' + rounds.length + '</div><div class="stat-label">Rounds</div></div>';
  var best = PB.getPlayerBest(pid);
  h += '<div class="stat-box"><div class="stat-val" style="font-size:18px">' + (best ? best.score : "—") + '</div><div class="stat-label">Best</div></div>';
  var unique = PB.getUniqueCourses(pid);
  h += '<div class="stat-box"><div class="stat-val" style="font-size:18px">' + unique + '</div><div class="stat-label">Courses</div></div>';
  h += '</div>';
  
  // Achievement grid container — will be re-rendered by filter toggle
  h += '<div id="trophyAchGrid"></div>';
  
  // Title progression
  h += '<div class="ach-cat-head">Title Progression</div>';
  h += '<div style="padding:0 16px">';
  var titleKeys = [1,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
  var TITLES = {1:"Rookie",5:"Weekend Warrior",10:"Range Rat",15:"Fairway Finder",20:"Club Member",25:"Course Regular",30:"Low Handicapper",35:"Scratch Aspirant",40:"Ironman",45:"Birdie Hunter",50:"Eagle Eye",55:"Tour Wannabe",60:"Golf Addict",65:"Links Legend",70:"Course Conqueror",75:"The Professor",80:"Hall of Famer",85:"Living Legend",90:"Immortal",95:"Transcendent",100:"G.O.A.T."};
  titleKeys.forEach(function(lv) {
    var unlocked = lvl.level >= lv;
    var isCurrent = lvl.titleLevel === lv;
    h += '<div class="title-row' + (unlocked ? '' : ' locked') + '">';
    h += '<div class="t-level">LV' + lv + '</div>';
    h += '<div class="t-name">' + TITLES[lv] + '</div>';
    if (isCurrent) h += '<div class="t-status" style="background:rgba(var(--gold-rgb),.1);color:var(--gold)">CURRENT</div>';
    else if (unlocked) h += '<div class="t-status" style="background:rgba(var(--birdie-rgb),.08);color:var(--birdie)">UNLOCKED</div>';
    else h += '<div class="t-status" style="color:var(--muted2)">LOCKED</div>';
    h += '</div>';
  });
  h += '</div>';
  
  document.querySelector('[data-page="trophyroom"]').innerHTML = h;
  // Render achievement grid (default: show all)
  trophyFilterPid = pid;
  trophyShowUnlockedOnly = false;
  renderTrophyAchGrid(pid, false);
  setTimeout(initCountAnimations, 50);
}

var trophyFilterPid = null;
var trophyShowUnlockedOnly = false;

function toggleTrophyFilter(pid) {
  trophyShowUnlockedOnly = !trophyShowUnlockedOnly;
  var btn = document.getElementById("trophyFilterBtn");
  if (btn) btn.style.borderColor = trophyShowUnlockedOnly ? "var(--gold)" : "var(--border)";
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
  if (unlockedOnly) {
    h += '<div style="padding:8px 16px;font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px">Showing unlocked only · <span style="cursor:pointer;text-decoration:underline" onclick="toggleTrophyFilter(\'' + pid + '\')">Show all</span></div>';
  }
  
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
    var totalCount = unlockedOnly ? catAchs.length : catAchs.length;
    
    h += '<div class="ach-cat-head">' + cat.name + ' <span style="color:var(--muted);font-weight:400">' + unlockedCount + (unlockedOnly ? '' : '/' + totalCount) + '</span></div>';
    h += '<div class="ach-grid">';
    catAchs.forEach(function(a) {
      var unlocked = unlockedIds[a.id];
      h += '<div class="ach-card' + (unlocked ? '' : ' locked') + '">';
      h += '<div class="ach-icon">' + a.icon + '</div>';
      h += '<div class="ach-name">' + escHtml(a.name) + '</div>';
      h += '<div class="ach-desc">' + escHtml(a.desc) + '</div>';
      if (a.xp > 0) h += '<div class="ach-xp">+' + a.xp + ' XP</div>';
      if (unlocked) {
        var _eAt = unlocked.earnedAt;
        if (_eAt) {
          var _eD = new Date(_eAt + "T12:00:00");
          var _eMn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          h += '<div style="font-size:8px;color:var(--birdie);margin-top:3px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zM11 1v2M5 1v2M2 6h12"/></svg> ' + _eMn[_eD.getMonth()] + ' ' + _eD.getDate() + ', ' + _eD.getFullYear() + '</div>';
        } else {
          h += '<div style="font-size:8px;color:var(--birdie);margin-top:3px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><path d="M6 8l2 2 3-4"/></svg> UNLOCKED</div>';
        }
      }
      h += '</div>';
    });
    h += '</div>';
  });
  
  el.innerHTML = h;
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
