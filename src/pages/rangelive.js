Router.register("range", function() {
  var h = '';

  // ===== STATE 1: PRE-SESSION SETUP =====
  if (!activeRangeStart) {
    h += '<div class="sh"><h2>Range Setup</h2><button class="back" onclick="rangeActiveView=\'range\';Router.back(\'activity\')">← Back</button></div>';

    // Intent field
    h += '<div style="padding:16px 16px 0">';
    h += '<div style="font-family:Playfair Display,serif;font-size:17px;color:var(--gold);margin-bottom:2px">What are you working on?</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-bottom:10px">Optional — helps track your focus over time</div>';
    h += '<input class="ff-input" id="rangeFocusInput" placeholder="e.g. Driver path, wedge distance, putting..." autocomplete="off" value="' + escHtml(activeRangeFocus) + '" oninput="activeRangeFocus=this.value" style="margin-bottom:0">';
    h += '</div>';

    // Drill selector — collapsible
    h += '<div class="section" style="margin-top:14px">';
    h += '<div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:10px">';
    h += '<div style="font-size:12px;font-weight:600;color:var(--cream)">Drills <span style="font-size:10px;color:var(--muted);font-weight:400">(optional · max 4)</span></div>';
    h += '<div style="display:flex;align-items:center;gap:8px"><span id="rangeDrillCount" style="font-size:10px;color:' + (activeRangeDrills.length > 0 ? 'var(--gold)' : 'var(--muted)') + ';font-weight:' + (activeRangeDrills.length > 0 ? '600' : '400') + '">' + (activeRangeDrills.length > 0 ? activeRangeDrills.length + ' selected' : 'none') + '</span>';
    h += '<button class="btn-sm outline" style="font-size:9px;padding:4px 8px" onclick="event.stopPropagation();addCustomDrill()">+ Custom</button>';
    h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M4 6l4 4 4-4"/></svg></div></div>';
    h += '<div' + (activeRangeDrills.length === 0 ? ' style="display:none"' : '') + '>';
    h += '<div id="rangeDrillChips"></div>';
    h += '</div></div>';

    // Visibility toggle
    h += '<div style="padding:0 16px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);margin-bottom:0">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">Visibility</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + (rangeSessionPrivate ? 'Private — no XP, not on calendar' : 'Public — earns XP, shows on calendar') + '</div></div>';
    h += '<button id="rangeVisBtn" onclick="rangeSessionPrivate=!rangeSessionPrivate;Router.go(\'range\')" style="background:' + (rangeSessionPrivate ? 'rgba(var(--red-rgb),.15)' : 'rgba(var(--birdie-rgb),.1)') + ';border:1px solid ' + (rangeSessionPrivate ? 'rgba(var(--red-rgb),.3)' : 'rgba(var(--birdie-rgb),.2)') + ';color:' + (rangeSessionPrivate ? 'var(--red)' : 'var(--birdie)') + ';font:600 10px/1 Inter,sans-serif;padding:6px 12px;border-radius:4px;cursor:pointer">' + (rangeSessionPrivate ? '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg> Private' : '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6"/></svg> Public') + '</button>';
    h += '</div>';

    // Start button — big, prominent
    h += '<div style="padding:20px 16px 24px"><button class="btn full green" style="font-size:16px;padding:18px;letter-spacing:.5px;font-weight:700" onclick="beginRangeTimer()">';
    h += '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>';
    h += 'Start Session</button>';
    if (activeRangeFocus || activeRangeDrills.length > 0) {
      h += '<div style="text-align:center;margin-top:10px"><span style="font-size:10px;color:var(--muted);cursor:pointer;text-decoration:underline" onclick="activeRangeFocus=\'\';activeRangeDrills=[];rangeSessionPrivate=false;Router.go(\'range\')">Reset</span></div>';
    }
    h += '</div>';

    document.querySelector('[data-page="range"]').innerHTML = h;
    setTimeout(function() {
      var drillSection = document.querySelector('#rangeDrillChips');
      if (drillSection) {
        // Show drill section if drills already selected
        if (activeRangeDrills.length > 0) drillSection.parentElement.style.display = 'block';
        renderDrillChips();
      }
    }, 50);
    return;
  }

  // ===== STATE 2: ACTIVE SESSION (timer dominant) =====
  var elapsed = Math.floor((Date.now() - activeRangeStart) / 1000);
  var allDrills = DRILL_LIBRARY.concat(customDrills);

  h += '<div style="display:flex;justify-content:flex-end;padding:12px 16px 0">';
  h += '<button onclick="abandonRangeSession()" style="font-size:10px;color:var(--muted);background:transparent;border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer">Abandon</button>';
  h += '</div>';

  // Timer — dominant
  h += '<div class="range-timer-display--active">';
  h += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Session time</div>';
  h += '<div class="range-timer-time--active" id="rangeTimerDisplay">' + formatRangeTime(elapsed) + '</div>';
  if (activeRangeFocus) {
    h += '<div style="font-size:12px;color:var(--cream);margin-top:14px;font-style:italic">"' + escHtml(activeRangeFocus) + '"</div>';
  }
  h += '</div>';

  // Drills strip — compact reference, no interaction needed during session
  if (activeRangeDrills.length) {
    h += '<div style="text-align:center;padding:0 16px 24px;border-bottom:1px solid var(--border)">';
    h += '<div style="font-size:9px;color:var(--muted2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Today\'s drills</div>';
    h += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">';
    activeRangeDrills.forEach(function(did) {
      var d = allDrills.find(function(x){return x.id===did;});
      if (d) h += '<span style="font-size:11px;color:var(--gold);background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.25);border-radius:20px;padding:5px 12px">' + escHtml(d.name) + '</span>';
    });
    h += '</div></div>';
  } else {
    h += '<div style="height:24px"></div>';
  }

  // End session — prominent but not competing with timer
  h += '<div style="padding:28px 20px 24px">';
  h += '<button class="btn full" style="background:rgba(var(--gold-rgb),.12);border:1.5px solid rgba(var(--gold-rgb),.4);color:var(--gold);font-size:14px;font-weight:700;padding:16px;letter-spacing:.5px" onclick="endRangeSession()">';
  h += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:8px"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
  h += 'End Session</button>';
  h += '</div>';

  document.querySelector('[data-page="range"]').innerHTML = h;

  if (activeRangeTimer) clearInterval(activeRangeTimer);
  activeRangeTimer = setInterval(tickRangeTimer, 1000);
});

function startEventListener() {
  if (!db) return;
  if (window._eventUnsub) window._eventUnsub();
  window._eventUnsub = db.collection("events").onSnapshot(function(snap) {
    liveEvents = [];
    snap.forEach(function(doc) { liveEvents.push(Object.assign({_id:doc.id}, doc.data())); });
    if (Router.getPage() === "calendar") Router.go("calendar", Router.getParams(), true);
  });
}

