// v8.22.0 (Ship 5+7) — Activity page is now Range-only. The "Rounds" tab
// + form moved to /rounds (renderRoundsList + renderRoundNewForm in
// rounds.js) per the locked HQ-vs-Clubhouse architecture: HQ owns
// retroactive logging and history, mobile Clubhouse owns active play.
//
// `rangeActiveView` global (declared in range.js:10) is left intact —
// chat.js / range.js / rangelive.js still set it to "range" before
// navigating here, which is now a no-op. Cleanup deferred to a
// follow-on rangeActiveView removal sweep (low priority).
Router.register("activity", function() {
  // v8.24.13 — baseline IA fix: the bottom-nav tab is labeled "Play" but this
  // page opened as "Range" with NO path to start a round — the new member's #1
  // taught task dead-ended. The page is now the Play hub: start-a-round CTA
  // first (live round indicator when one is running), Range below it.
  var h = '<div class="sh"><h2>Play</h2>';
  // v8.24.61 — demoted to a ghost button so the felt-green "Start a round"
  // card is the single, unambiguous primary action (was two competing primaries).
  h += '<button class="btn-sm outline" onclick="startRangeSession()">Hit the Range</button>';
  h += '</div>';
  var _live = (typeof liveState !== "undefined" && liveState && liveState.active);
  h += '<div style="padding:0 16px 12px">';
  if (_live) {
    h += '<div class="card" onclick="Router.go(\'playnow\')" style="cursor:pointer;background:var(--cb-felt);border-color:var(--cb-felt)">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px">';
    h += '<div><div style="font-size:14px;font-weight:700;color:var(--cb-chalk)">Round in progress</div>';
    h += '<div style="font-size:11px;color:var(--cb-mute-3);margin-top:2px">' + escHtml(liveState.course || "On the course") + ' &middot; tap to return</div></div>';
    h += '<div style="display:flex;align-items:center;gap:5px"><div style="width:7px;height:7px;border-radius:50%;background:var(--cb-brass);animation:pulse-dot 2s infinite"></div><span style="font-size:9px;color:var(--cb-brass);font-weight:700;letter-spacing:1px">LIVE</span></div>';
    h += '</div></div>';
  } else {
    h += '<div class="card tappable" onclick="Router.go(\'playnow\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')Router.go(\'playnow\')" style="cursor:pointer;background:var(--cb-felt);border-color:var(--cb-felt)">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px">';
    h += '<div><div style="font-size:15px;font-weight:700;color:var(--cb-brass)">Start a round</div>';
    h += '<div style="font-size:11px;color:var(--cb-mute-3);margin-top:2px">Live scoring, hole by hole. The club is watching.</div></div>';
    h += '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--cb-brass)" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
    h += '</div></div>';
  }
  h += '</div>';
  h += renderActivityRange();
  h += renderPageFooter();
  document.querySelector('[data-page="activity"]').innerHTML = h;
});

function renderActivityRange() {
  var h = '';
  var myId = currentUser ? currentUser.uid : "local";
  var mySessions = liveRangeSessions.filter(function(s) { return s.playerId === myId; });

  // Active session indicator
  if (activeRangeStart) {
    h += '<div class="section"><div class="card" onclick="Router.go(\'range\')" style="cursor:pointer;border-color:rgba(var(--pink-rgb),.4)">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--pink)">Session in progress</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">Tap to return</div></div>';
    h += '<div style="display:flex;align-items:center;gap:4px"><div style="width:7px;height:7px;border-radius:50%;background:var(--pink);animation:pulse-dot 2s infinite"></div><span style="font-size:9px;color:var(--pink);font-weight:700">LIVE</span></div>';
    h += '</div></div></div>';
  }

  // Stats summary
  var totalSessions = mySessions.length;
  var totalMins = mySessions.reduce(function(a,s){return a+(s.durationMin||0)},0);
  var totalHrs = Math.floor(totalMins/60);
  var avgFeel = totalSessions ? (mySessions.reduce(function(a,s){return a+(s.feel||2)},0)/totalSessions).toFixed(1) : "—";
  var streakWeeks = calcRangeStreak(mySessions);

  // v8.24.71 — skip the stats grid entirely with zero sessions. A new
  // member used to see "0 / 0h 0m / 0wk" (three dead zeros) above the
  // empty card; the empty card alone now carries the path-forward (P9/P10).
  if (totalSessions > 0) {
    h += '<div class="stats-grid" style="padding:0 16px 8px">';
    h += statBox(totalSessions, "Sessions");
    h += statBox(totalHrs + "h " + (totalMins%60) + "m", "Total Time");
    h += statBox(streakWeeks + "wk", "Streak");
    h += '</div>';
  }

  // Practice Insights
  if (mySessions.length >= 3) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Practice Insights</span></div>';
    var drillCounts = {};
    var catCounts = {path:0,extension:0,short:0,general:0,custom:0};
    var allDrills = DRILL_LIBRARY.concat(customDrills);
    mySessions.forEach(function(s) {
      if (!s.drills) return;
      s.drills.forEach(function(did) {
        drillCounts[did] = (drillCounts[did]||0)+1;
        var drill = allDrills.find(function(x){return x.id===did});
        if (drill) catCounts[drill.cat] = (catCounts[drill.cat]||0)+1;
      });
    });
    var totalDrillUse = Object.values(catCounts).reduce(function(a,b){return a+b},0) || 1;
    var catColors = {path:"var(--blue)",extension:"var(--purple)",short:"var(--live)",general:"var(--gold)",custom:"var(--pink)"};
    h += '<div class="card"><div style="font-size:11px;font-weight:600;color:var(--cream);margin-bottom:8px">Practice Distribution</div>';
    Object.keys(DRILL_CATS).forEach(function(cat) {
      if (!catCounts[cat]) return;
      var pct = Math.round((catCounts[cat]/totalDrillUse)*100);
      h += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:2px"><span>' + DRILL_CATS[cat] + '</span><span style="color:var(--cream)">' + pct + '%</span></div>';
      h += '<div class="insight-bar"><div class="insight-bar-fill" style="width:'+pct+'%;background:'+catColors[cat]+'"></div></div>';
      h += '<div style="height:6px"></div>';
    });
    // Check for gaps
    var catKeys = Object.keys(catCounts);
    var zeroCats = ["path","extension","short","general"].filter(function(c){return !catCounts[c]});
    if (zeroCats.length && mySessions.length >= 5) {
      h += '<div style="margin-top:8px;padding:8px;background:rgba(var(--gold-rgb),.06);border-radius:4px;font-size:10px;color:var(--gold)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" style="vertical-align:middle"><path d="M8 1C5 1 3 3.5 3 6c0 1.5.7 2.7 2 3.5V12h6V9.5c1.3-.8 2-2 2-3.5 0-2.5-2-5-5-5z"/><path d="M6 14h4"/></svg> You haven\'t touched ' + zeroCats.map(function(c){return DRILL_CATS[c]}).join(" or ") + ' drills in a while</div>';
    }
    h += '</div></div>';
  }

  // Session history
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Range Sessions</span><span class="sec-link">' + totalSessions + ' total</span></div>';
  if (!mySessions.length) {
    h += '<div class="card"><div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>';
    h += '<div class="empty-text">No range sessions yet. Hit the Range to get started!</div></div></div>';
  }
  mySessions.slice(0, 20).forEach(function(s) {
    var allDrills = DRILL_LIBRARY.concat(customDrills);
    var drillNames = (s.drills||[]).map(function(did){var d=allDrills.find(function(x){return x.id===did});return d?d.name:did;});
    var feelIcon = s.feel === 1 ? '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--red)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10s1-1.5 3-1.5 3 1.5 3 1.5"/></svg>' : s.feel === 3 ? '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10s1 1.5 3 1.5 3-1.5 3-1.5"/></svg>' : '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--cream)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 10h6"/></svg>';
    var dateObj = new Date(s.date+"T12:00:00");
    var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var fmtDate = monNames[dateObj.getMonth()] + " " + dateObj.getDate();
    h += '<div class="card" style="border-color:rgba(var(--pink-rgb),.4)"><div style="display:flex;justify-content:space-between;align-items:flex-start">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream);display:flex;align-items:center;gap:4px">' + s.durationMin + ' min ' + feelIcon + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + fmtDate + '</div>';
    if (drillNames.length) h += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + drillNames.join(", ") + '</div>';
    h += '</div>';
    h += '<div style="font-size:11px;font-weight:600;color:var(--gold)">+' + getRangeSessionXP(s) + ' XP</div>';
    h += '</div></div>';
  });
  h += '</div>';
  return h;
}

function calcRangeStreak(sessions) {
  if (!sessions.length) return 0;
  var weekSet = {};
  sessions.forEach(function(s) {
    if (!s.date) return;
    var d = new Date(s.date+"T12:00:00");
    var yr = d.getFullYear();
    var wk = Math.floor((d - new Date(yr,0,1)) / 604800000);
    weekSet[yr+"-"+wk] = 1;
  });
  var weeks = Object.keys(weekSet).sort().reverse();
  if (!weeks.length) return 0;
  var streak = 1;
  for (var i = 1; i < weeks.length; i++) {
    var prev = weeks[i-1].split("-"), curr = weeks[i].split("-");
    if (parseInt(prev[0])===parseInt(curr[0]) && parseInt(prev[1])===parseInt(curr[1])+1) streak++;
    else break;
  }
  return streak;
}

// ========== RANGE ACTIVE SESSION PAGE ==========
