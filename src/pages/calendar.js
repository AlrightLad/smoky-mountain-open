// ========== CALENDAR — Airbnb-style Date Range Picker ==========
// v5.37.3: Full overhaul with date range selection, multi-day event bars,
// smooth month transitions, 44px tap targets, and themed dot colors.

// State: calRangeStart / calRangeEnd for range selection, calSelectedDate for single-day view
var calRangeStart = null;
var calRangeEnd = null;

Router.register("calendar", function() {
  var _myUid = currentUser ? currentUser.uid : null;
  var h = '';

  // ── Header with month nav ──
  h += '<div class="cal-month-header">';
  h += '<button class="cal-nav-btn" onclick="calNavMonth(-1)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>';
  h += '<div class="cal-month-title" id="calMonthTitle">' + _calMonthLabel() + '</div>';
  h += '<button class="cal-nav-btn" onclick="calNavMonth(1)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>';
  h += '</div>';

  // ── Weekday labels ──
  h += '<div class="cal-weekdays">';
  ["S","M","T","W","T","F","S"].forEach(function(d) { h += '<div class="cal-weekday">' + d + '</div>'; });
  h += '</div>';

  // ── Grid wrapper (for slide animation) ──
  h += '<div class="cal-grid-wrap"><div class="cal-grid" id="calGrid">';
  h += _buildCalGrid();
  h += '</div></div>';

  // ── Range selection indicator ──
  h += '<div id="calRangeIndicator" style="padding:0 16px;margin-bottom:8px"></div>';

  // ── Legend ──
  h += '<div style="display:flex;gap:12px;padding:8px 16px 4px;font-size:9px;color:var(--muted2)">';
  h += '<span><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--gold);vertical-align:middle;margin-right:3px"></span>Event</span>';
  h += '<span><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#4CAF50;vertical-align:middle;margin-right:3px"></span>Round</span>';
  h += '<span><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--blue);vertical-align:middle;margin-right:3px"></span>Range</span>';
  h += '<span><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--pink);vertical-align:middle;margin-right:3px"></span>Tee Time</span>';
  h += '</div>';

  // ── Day detail panel ──
  h += '<div id="cal-day-detail" style="padding:0 16px"></div>';

  // ── Quick action buttons ──
  h += '<div style="display:flex;gap:6px;padding:12px 16px">';
  h += '<button class="btn-sm green" style="flex:1;font-size:10px" onclick="Router.go(\'tee-create\')">+ Tee Time</button>';
  h += '<button class="btn-sm outline" style="flex:1;font-size:10px" onclick="Router.go(\'trips\',{create:true})">+ Event</button>';
  h += '<button class="btn-sm outline" style="flex:1;font-size:10px;color:var(--pink);border-color:rgba(var(--pink-rgb),.3)" onclick="Router.go(\'range\')"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> Range</button>';
  h += '</div>';

  // ── Upcoming events ──
  h += _buildUpcomingEvents();

  // ── Scheduling chat ──
  h += '<div style="padding:8px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Scheduling Chat</div></div>';
  h += '<div id="calChatFeed" style="max-height:300px;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px"><div style="text-align:center;font-size:10px;color:var(--muted);padding:20px">Loading...</div></div>';
  h += '<div style="display:flex;gap:8px;padding:8px 16px;border-top:1px solid var(--border)">';
  h += '<input class="ff-input" id="calChatInput" placeholder="Discuss scheduling..." style="flex:1;margin:0;font-size:12px;padding:9px 14px;border-radius:20px" onkeydown="if(event.key===\'Enter\')sendCalChat()">';
  h += '<button style="background:var(--gold);border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0" onclick="sendCalChat()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--bg)" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
  h += '</div>';

  document.querySelector('[data-page="calendar"]').innerHTML = h;

  // Render day detail if a date was previously selected
  if (calSelectedDate) _renderDayDetail();
  _renderRangeIndicator();

  // Load scheduling chat
  if (db) {
    db.collection("scheduling_chat").orderBy("createdAt","desc").limit(20).get().then(function(snap) {
      var feed = document.getElementById("calChatFeed");
      if (!feed) return;
      if (snap.empty) { feed.innerHTML = '<div style="text-align:center;font-size:10px;color:var(--muted);padding:20px">No messages yet \u2014 coordinate tee times here</div>'; return; }
      var ch = '';
      snap.forEach(function(doc) {
        var msg = doc.data();
        var author = msg.authorName || "Member";
        var ts = msg.createdAt ? feedTimeAgo(msg.createdAt.toMillis()) : "";
        ch += '<div style="padding:6px 0;border-bottom:1px solid var(--border)">';
        ch += '<div style="display:flex;justify-content:space-between"><span style="font-size:10px;font-weight:600;color:var(--gold)">' + escHtml(author) + '</span>';
        ch += '<span style="font-size:9px;color:var(--muted2)">' + ts + '</span></div>';
        ch += '<div style="font-size:11px;color:var(--cream);margin-top:2px">' + escHtml(msg.text || "") + '</div></div>';
      });
      feed.innerHTML = ch;
    });
  }
});

// ── Month label helper ──
function _calMonthLabel() {
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return monthNames[calMonth] + ' ' + calYear;
}

// ── Build the event map for current data ──
function _calBuildEventMap() {
  var eventMap = {};
  var _myUid = currentUser ? currentUser.uid : null;
  function addEv(date, ev) { if (!eventMap[date]) eventMap[date] = []; eventMap[date].push(ev); }

  // Tee times
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled") return;
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k) { return t.responses[k] === "accepted"; }) : [];
    var names = [];
    accepted.forEach(function(uid) { var m = PB.getPlayer(uid); if (m) names.push(m.name || m.username || "Member"); });
    addEv(t.date, { type: "tee", title: t.courseName || "Tee Time", time: t.time || "", spots: t.spots || 4, accepted: accepted.length, players: names });
  });

  // Trips (multi-day events)
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var sd = new Date(trip.startDate + "T12:00:00"), ed = trip.endDate ? new Date(trip.endDate + "T12:00:00") : sd;
    var mN = [];
    if (trip.members) trip.members.forEach(function(uid) { var m = PB.getPlayer(uid); if (m) mN.push(m.name || m.username || "Member"); });
    var _sd2 = new Date(trip.startDate + "T12:00:00"), _ed2 = trip.endDate ? new Date(trip.endDate + "T12:00:00") : _sd2;
    var _fmtDates = monNames[_sd2.getMonth()] + " " + _sd2.getDate() + (trip.endDate && trip.endDate !== trip.startDate ? "\u2013" + (_ed2.getMonth() === _sd2.getMonth() ? _ed2.getDate() : monNames[_ed2.getMonth()] + " " + _ed2.getDate()) + ", " + _ed2.getFullYear() : ", " + _sd2.getFullYear());
    for (var dt = new Date(sd); dt <= ed; dt.setDate(dt.getDate() + 1)) {
      var ds = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      var dayOfWeek = dayNames[dt.getDay()];
      var dayCourses = (trip.courses || []).filter(function(c) {
        var cd = c.d || "";
        return cd.toLowerCase().indexOf(dayOfWeek.toLowerCase()) === 0 || cd.toLowerCase().indexOf(shortDays[dt.getDay()].toLowerCase()) === 0;
      });
      addEv(ds, {
        type: "event", title: trip.name, location: trip.location || "", dates: _fmtDates,
        tripId: trip.id, players: mN, dayCourses: dayCourses, champion: trip.champion ? (PB.getPlayer(trip.champion) || {}).name : "",
        startDate: trip.startDate, endDate: trip.endDate || trip.startDate
      });
    }
  });

  // Rounds
  PB.getRounds().forEach(function(r) {
    if (!r.date) return;
    var p = PB.getPlayer(r.player);
    var pN = p ? (p.name || p.username || "") : "";
    addEv(r.date, { type: "round", title: r.course || "Round", player: pN, score: r.score, roundId: r.id, tee: r.tee || "", holesPlayed: r.holesPlayed || 18, holesMode: r.holesMode || "18", format: r.format || "" });
  });

  // Range sessions
  if (typeof liveRangeSessions !== "undefined") {
    liveRangeSessions.forEach(function(s) {
      if (!s.date || (s.visibility === "private" && s.playerId !== _myUid)) return;
      addEv(s.date, { type: "range", title: "Range Session", player: s.playerName || "", duration: s.durationMin || 0, sessionId: s._id || "" });
    });
  }

  return eventMap;
}

// ── Build multi-day trip bars map ──
function _calBuildTripBars() {
  var bars = {}; // date → { isStart, isEnd, isMid, tripName }
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate || !trip.endDate || trip.endDate === trip.startDate) return;
    var sd = new Date(trip.startDate + "T12:00:00"), ed = new Date(trip.endDate + "T12:00:00");
    for (var dt = new Date(sd); dt <= ed; dt.setDate(dt.getDate() + 1)) {
      var ds = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      bars[ds] = {
        isStart: ds === trip.startDate,
        isEnd: ds === (trip.endDate || trip.startDate),
        isMid: ds !== trip.startDate && ds !== (trip.endDate || trip.startDate),
        tripName: trip.name
      };
    }
  });
  return bars;
}

// ── Build the calendar grid HTML ──
function _buildCalGrid() {
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var eventMap = _calBuildEventMap();
  var tripBars = _calBuildTripBars();

  // Determine range bounds
  var rStart = calRangeStart, rEnd = calRangeEnd;
  if (rStart && rEnd && rStart > rEnd) { var tmp = rStart; rStart = rEnd; rEnd = tmp; }

  var gh = '';
  // Empty cells before first day
  for (var i = 0; i < firstDay; i++) gh += '<div class="cal-day empty"></div>';

  for (var d = 1; d <= daysInMonth; d++) {
    var ds = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    var isToday = ds === todayStr;
    var isSelected = ds === calSelectedDate && !calRangeStart;
    var isRangeStart = ds === rStart;
    var isRangeEnd = rEnd && ds === rEnd;
    var isInRange = rStart && rEnd && ds > rStart && ds < rEnd;
    var evs = eventMap[ds] || [];
    var bar = tripBars[ds];

    // Determine position in row for range edge rounding
    var cellIdx = firstDay + d - 1;
    var colIdx = cellIdx % 7;
    var isRowStart = colIdx === 0;
    var isRowEnd = colIdx === 6;

    // CSS classes
    var cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';
    if (isRangeStart) cls += ' range-start';
    if (isRangeEnd) cls += ' range-end';
    if (isInRange) {
      cls += ' in-range';
      if (isRowStart) cls += ' range-row-start';
      if (isRowEnd || d === daysInMonth) cls += ' range-row-end';
    }

    // Build dots (gold=event, green=round, blue=range, pink=tee)
    var dots = [];
    var ht = {};
    evs.forEach(function(ev) {
      if (ev.type === "event" && !ht.e) { dots.push("var(--gold)"); ht.e = 1; }
      if (ev.type === "round" && !ht.r) { dots.push("#4CAF50"); ht.r = 1; }
      if (ev.type === "range" && !ht.rng) { dots.push("var(--blue)"); ht.rng = 1; }
      if (ev.type === "tee" && !ht.t) { dots.push("var(--pink)"); ht.t = 1; }
    });

    var dotH = '';
    if (dots.length > 0) {
      dotH = '<div class="cal-dots">';
      dots.slice(0, 4).forEach(function(c) { dotH += '<div class="cal-dot" style="background:' + c + '"></div>'; });
      dotH += '</div>';
    }

    // Trip bar (multi-day event spanning bar)
    var barH = '';
    if (bar) {
      var barCls = 'cal-trip-bar';
      if (bar.isStart) barCls += ' bar-start';
      else if (bar.isEnd) barCls += ' bar-end';
      else barCls += ' bar-mid';
      barH = '<div class="' + barCls + '"></div>';
    }

    gh += '<div class="' + cls + '" onclick="calTapDay(\'' + ds + '\')">' + d + dotH + barH + '</div>';
  }
  return gh;
}

// ── Tap handler: Airbnb-style date range picker ──
function calTapDay(ds) {
  if (!calRangeStart) {
    // First tap: set start date, also show events for this day
    calRangeStart = ds;
    calRangeEnd = null;
    calSelectedDate = ds;
  } else if (!calRangeEnd) {
    if (ds === calRangeStart) {
      // Tapped same date: stay as single selection, just show events
      calSelectedDate = ds;
    } else {
      // Second tap: set end date, swap if needed
      calRangeEnd = ds;
      if (calRangeEnd < calRangeStart) {
        var tmp = calRangeStart;
        calRangeStart = calRangeEnd;
        calRangeEnd = tmp;
      }
      calSelectedDate = ds;
    }
  } else {
    // Third tap: reset range, start fresh
    calRangeStart = ds;
    calRangeEnd = null;
    calSelectedDate = ds;
  }
  _refreshCalGrid();
  _renderDayDetail();
  _renderRangeIndicator();
}

// ── Month navigation with smooth animation ──
function calNavMonth(dir) {
  var grid = document.getElementById("calGrid");
  if (grid) {
    grid.classList.add(dir > 0 ? 'slide-left' : 'slide-right');
    setTimeout(function() {
      calMonth += dir;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      if (calMonth < 0) { calMonth = 11; calYear--; }
      // Don't reset range on month nav — keep selection visible
      _refreshCalGrid();
      _renderRangeIndicator();
      var titleEl = document.getElementById("calMonthTitle");
      if (titleEl) titleEl.textContent = _calMonthLabel();
      var g2 = document.getElementById("calGrid");
      if (g2) { g2.classList.remove('slide-left', 'slide-right'); }
    }, 130);
  } else {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0) { calMonth = 11; calYear--; }
    _refreshCalGrid();
  }
}

// Legacy compat
function calPrev() { calNavMonth(-1); }
function calNext() { calNavMonth(1); }
function selectCalDay(ds) { calTapDay(ds); }

// ── Refresh grid in-place (no full page re-render) ──
function _refreshCalGrid() {
  var grid = document.getElementById("calGrid");
  if (!grid) return;
  grid.innerHTML = _buildCalGrid();
  var titleEl = document.getElementById("calMonthTitle");
  if (titleEl) titleEl.textContent = _calMonthLabel();
}

// ── Render range selection indicator ──
function _renderRangeIndicator() {
  var el = document.getElementById("calRangeIndicator");
  if (!el) return;
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (calRangeStart && calRangeEnd) {
    var sd = new Date(calRangeStart + "T12:00:00"), ed = new Date(calRangeEnd + "T12:00:00");
    var days = Math.round((ed - sd) / 86400000) + 1;
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;background:rgba(var(--gold-rgb),.08);border:1px solid rgba(var(--gold-rgb),.2);border-radius:8px;padding:8px 12px">' +
      '<div><div style="font-size:10px;color:var(--gold);font-weight:600">' + monNames[sd.getMonth()] + ' ' + sd.getDate() + ' \u2013 ' + monNames[ed.getMonth()] + ' ' + ed.getDate() + '</div>' +
      '<div style="font-size:9px;color:var(--muted);margin-top:1px">' + days + ' day' + (days > 1 ? 's' : '') + ' selected</div></div>' +
      '<button style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:4px 8px" onclick="calClearRange()">×</button></div>';
  } else if (calRangeStart && !calRangeEnd) {
    var sd2 = new Date(calRangeStart + "T12:00:00");
    el.innerHTML = '<div style="font-size:9px;color:var(--muted);padding:4px 0">' +
      '<span style="color:var(--gold);font-weight:600">' + monNames[sd2.getMonth()] + ' ' + sd2.getDate() + '</span> selected \u2014 tap another date for a range</div>';
  } else {
    el.innerHTML = '';
  }
}

function calClearRange() {
  calRangeStart = null;
  calRangeEnd = null;
  calSelectedDate = null;
  _refreshCalGrid();
  _renderRangeIndicator();
  var detail = document.getElementById("cal-day-detail");
  if (detail) detail.innerHTML = '';
}

// ── Render day detail panel ──
function _renderDayDetail() {
  var detailEl = document.getElementById("cal-day-detail");
  if (!detailEl) return;
  if (!calSelectedDate) { detailEl.innerHTML = ''; return; }

  var eventMap = _calBuildEventMap();
  var dayEvs = eventMap[calSelectedDate] || [];

  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var selDate = new Date(calSelectedDate + "T12:00:00");

  var dh = '<div style="padding:12px 0 4px;font-size:14px;font-weight:700;color:var(--cream)">' + dayNames[selDate.getDay()] + ', ' + monNames[selDate.getMonth()] + ' ' + selDate.getDate() + '</div>';

  if (!dayEvs.length) {
    dh += '<div style="font-size:11px;color:var(--muted);padding:8px 0 4px">Nothing scheduled</div>';
    detailEl.innerHTML = dh;
    return;
  }

  var teeEvs = dayEvs.filter(function(e) { return e.type === "tee"; });
  var eventEvs = dayEvs.filter(function(e) { return e.type === "event"; });
  var roundEvs = dayEvs.filter(function(e) { return e.type === "round"; });
  var rangeEvs = dayEvs.filter(function(e) { return e.type === "range"; });

  // Events (trip days)
  var seenTitles = {};
  eventEvs.forEach(function(ev) {
    if (seenTitles[ev.title]) return;
    seenTitles[ev.title] = true;
    var _ck = (ev.dayCourses && ev.dayCourses.length && ev.dayCourses[0].key) ? ev.dayCourses[0].key : "";
    var _cl = ev.tripId ? "Router.go(\'scorecard\',{tripId:\'" + ev.tripId + "\'" + (_ck ? ",course:\'" + _ck + "\'" : "") + "})" : "";
    dh += '<div style="background:var(--bg3);border-left:3px solid var(--gold);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="' + _cl + '">';
    dh += '<div style="font-size:8px;color:var(--gold);font-weight:700;letter-spacing:.5px;margin-bottom:3px">EVENT</div>';
    dh += '<div style="font-size:13px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
    if (ev.location) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.location) + '</div>';
    if (ev.dates) dh += '<div style="font-size:10px;color:var(--muted)">' + ev.dates + '</div>';
    if (ev.players && ev.players.length) dh += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + ev.players.length + ' attending: ' + ev.players.join(", ") + '</div>';
    if (ev.champion) dh += '<div style="font-size:10px;color:var(--gold);margin-top:3px">Champion: ' + escHtml(ev.champion) + '</div>';
    if (ev.dayCourses && ev.dayCourses.length) {
      ev.dayCourses.forEach(function(dc) {
        dh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px">';
        dh += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--blue)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>';
        dh += '<span style="font-size:11px;color:var(--blue);font-weight:600">' + escHtml(dc.n || "Course") + '</span>';
        if (dc.f) dh += '<span style="font-size:9px;color:var(--muted2)"> \u00b7 ' + escHtml(dc.f) + '</span>';
        dh += '</div>';
      });
    } else {
      dh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--muted)" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> No round scheduled \u2014 travel or rest day</div>';
    }
    dh += '</div>';
  });

  // Tee times (standalone — not inside events)
  if (!eventEvs.length) {
    teeEvs.forEach(function(ev) {
      dh += '<div style="background:var(--bg3);border-left:3px solid var(--pink);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="Router.go(\'teetimes\')">';
      dh += '<div style="font-size:8px;color:var(--pink);font-weight:700;letter-spacing:.5px;margin-bottom:3px">TEE TIME</div>';
      dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
      if (ev.time) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.time + '</div>';
      if (ev.players && ev.players.length) dh += '<div style="font-size:10px;color:var(--pink);margin-top:3px">' + ev.accepted + '/' + ev.spots + ' going: ' + ev.players.join(", ") + '</div>';
      dh += '</div>';
    });
  }

  // Rounds grouped by course
  if (roundEvs.length) {
    var cg = {};
    roundEvs.forEach(function(ev) { if (!cg[ev.title]) cg[ev.title] = []; cg[ev.title].push(ev); });
    Object.keys(cg).forEach(function(course) {
      var group = cg[course];
      var boxClick = group.length === 1 && group[0].roundId ? ' onclick="Router.go(\'rounds\',{roundId:\'' + group[0].roundId + '\'})"' : '';
      dh += '<div style="background:var(--bg3);border-left:3px solid #4CAF50;border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer"' + boxClick + '>';
      dh += '<div style="font-size:8px;color:#4CAF50;font-weight:700;letter-spacing:.5px;margin-bottom:3px">ROUND' + (group.length > 1 ? "S" : "") + '</div>';
      dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(course) + '</div>';
      group.forEach(function(r) {
        var sc = r.score <= 72 ? "var(--birdie)" : r.score >= 100 ? "var(--red)" : "var(--cream)";
        var is9h = r.holesPlayed && r.holesPlayed <= 9;
        var hL = is9h ? (r.holesMode === "back9" ? " \u00b7 Back 9" : " \u00b7 Front 9") : "";
        var tL = r.tee ? r.tee + " Tees" : "";
        var meta = [tL, hL.replace(" \u00b7 ", "")].filter(Boolean).join(" \u00b7 ");
        var isScramble = r.format === "scramble" || r.format === "scramble4";
        var rowClick = group.length > 1 && r.roundId ? ' onclick="event.stopPropagation();Router.go(\'rounds\',{roundId:\'' + r.roundId + '\'})" style="cursor:pointer;display:flex;justify-content:space-between;padding:3px 0;font-size:11px"' : ' style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"';
        dh += '<div' + rowClick + '><div><span style="color:var(--muted)">' + escHtml(r.player) + (isScramble ? " (Scramble)" : "") + '</span>' + (meta ? '<span style="color:var(--muted2);font-size:9px"> \u00b7 ' + meta + '</span>' : '') + '</div><span style="font-weight:600;color:' + sc + '">' + (r.score || "\u2014") + '</span></div>';
      });
      dh += '</div>';
    });
  }

  // Range sessions
  rangeEvs.forEach(function(ev) {
    var rDest = ev.sessionId ? "Router.go(\'range-detail\',{sessionId:\'" + ev.sessionId + "\'})" : "Router.go(\'range\')";
    dh += '<div style="background:var(--bg3);border-left:3px solid var(--blue);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="' + rDest + '">';
    dh += '<div style="font-size:8px;color:var(--blue);font-weight:700;letter-spacing:.5px;margin-bottom:3px">RANGE SESSION</div>';
    dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + (ev.duration || 0) + ' min</div>';
    if (ev.player) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.player) + '</div>';
    dh += '</div>';
  });

  detailEl.innerHTML = dh;
}

// ── Build upcoming events section ──
function _buildUpcomingEvents() {
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var upcomingEvents = [];
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled" || t.date < todayStr) return;
    upcomingEvents.push({ date: t.date, title: t.courseName || "Tee Time", time: t.time || "", type: "tee" });
  });
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var ed = trip.endDate || trip.startDate;
    if (trip.startDate >= todayStr || ed >= todayStr)
      upcomingEvents.push({ date: trip.startDate >= todayStr ? trip.startDate : todayStr, title: trip.name, time: trip.startDate <= todayStr && ed >= todayStr ? "Happening now" : "", type: "trip", tripId: trip.id });
  });
  upcomingEvents.sort(function(a, b) { return a.date > b.date ? 1 : -1; });

  if (!upcomingEvents.length) return '';
  var h = '<div style="padding:8px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Coming Up</div>';
  h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
  upcomingEvents.slice(0, 5).forEach(function(ev) {
    var dateObj = new Date(ev.date + "T12:00:00");
    var dayDiff = Math.ceil((dateObj - today) / 86400000);
    var dayLabel = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : monNames[dateObj.getMonth()] + " " + dateObj.getDate();
    var dotColor = ev.type === "trip" ? "var(--gold)" : "var(--pink)";
    var clickAction = ev.type === "trip" && ev.tripId ? "Router.go(\'scorecard\',{tripId:\'" + ev.tripId + "\'})" : "Router.go(\'teetimes\')";
    h += '<div onclick="' + clickAction + '" style="flex-shrink:0;min-width:130px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">';
    h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px"><div style="width:5px;height:5px;border-radius:50%;background:' + dotColor + '"></div>';
    h += '<span style="font-size:9px;color:var(--gold);font-weight:600">' + dayLabel + '</span></div>';
    h += '<div style="font-size:11px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(ev.title) + '</div>';
    if (ev.time) h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + ev.time + '</div>';
    h += '</div>';
  });
  h += '</div></div>';
  return h;
}

// ── In-place update (called by other pages, legacy compat) ──
function _updateCalendarInPlace() {
  _refreshCalGrid();
  _renderDayDetail();
  _renderRangeIndicator();
}

function sendCalChat() {
  var input = document.getElementById("calChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  db.collection("scheduling_chat").add({
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Member",
    createdAt: fsTimestamp()
  }).then(function() {
    Router.go("calendar");
  }).catch(function(e) { Router.toast("Send failed: " + e.message); });
}

// ========== TRASH TALK FEED ==========
