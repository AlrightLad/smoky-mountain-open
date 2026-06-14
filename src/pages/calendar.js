// ========== CALENDAR (W1.S8 — editorial Clubhouse, CLUBHOUSE_SPEC-HQ-3f) ==========
// The league's scheduling surface: tee times, trips, events, plus logged rounds
// and range sessions. Editorial masthead (month/year + truthful counts), scope
// rail (month nav + Grid/List toggle + create CTA), full-width month grid with
// event chips OR a chronological list, empty-month state, day-detail drill-in,
// inline create form, and the scheduling chat. Every value renders from a real
// source (liveTeeTimes, PB.getTrips, _liveCalEvents, PB.getRounds,
// liveRangeSessions, scheduling_chat) — no stubbed data (P9).

if (typeof calView === "undefined") var calView = "grid"; // 'grid' | 'list'

var CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var CAL_MON3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var CAL_DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var CAL_DAY_HEAD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]; // week starts Sunday (3f.1.5)

function _calTodayStr() {
  var t = new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}
function _calDS(y, m, d) {
  return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

Router.register("calendar", function() {
  var todayStr = _calTodayStr();
  var league = (typeof window !== "undefined" && window._activeLeagueName) || "Parbaughs";
  var season = (typeof PB !== "undefined" && PB.getCurrentSeason) ? (PB.getCurrentSeason().label || "") : "";

  var h = '<button type="button" class="cal-skip" onclick="var el=document.getElementById(\'cal-body\');if(el){el.focus();el.scrollIntoView();}">Skip to calendar</button>';
  h += '<div class="cal-wrap">';

  // ── Masthead ──
  h += '<div class="roster-masthead">';
  h += '<div class="roster-eyebrow">' + escHtml(String(league).toUpperCase()) + (season ? ' · ' + escHtml(season.toUpperCase()) : '') + '</div>';
  h += '<h1 class="roster-headline" id="calHeadline">' + CAL_MONTHS[calMonth] + ' ' + calYear + '.</h1>';
  h += '<div class="cal-subdeck" id="calSubdeck">' + _calSubdeck(_calMeta(todayStr)) + '</div>';
  h += '</div>';

  // ── Scope rail ──
  h += _calScopeHTML(todayStr);
  // Activity counts line — suppressed on an empty month (the subdeck already says
  // "Nothing on the books yet this month"; a "0 · 0 · 0" strip is redundant noise).
  var _mMeta = _calMeta(todayStr);
  // #41 v8.25.143 — the meta strip shows ONLY scheduled/next-7/upcoming counts, so
  // it must hide based on THOSE three (not rounds). Including roundsThisMonth here
  // let the strip render "0 · 0 · 0" while the subdeck truthfully said "1 round
  // logged" — a self-contradiction (P9). Rounds are conveyed by the subdeck.
  var _mEmpty = (_mMeta.monthScheduled === 0 && _mMeta.next7 === 0 && _mMeta.upcoming === 0);
  h += '<div class="cal-meta" id="calMeta"' + (_mEmpty ? ' hidden' : '') + '>' + (_mEmpty ? '' : _calMetaLine(_mMeta)) + '</div>';

  // ── Inline create form (hidden by default) ──
  h += _calCreateFormHTML(calSelectedDate || todayStr);

  // ── Body: grid or list ──
  h += '<div id="cal-body" tabindex="-1" class="cal-body">';
  h += (calView === "list") ? _calListHTML(todayStr) : _calGridHTML(todayStr);
  h += '</div>';

  // ── Day detail (grid mode, when a day is selected) ──
  h += '<div id="cal-day-detail" class="cal-detail">';
  var em0 = _calBuildEventMap();
  if (calView === "grid" && calSelectedDate && em0[calSelectedDate]) h += _renderCalDayDetail(em0, calSelectedDate);
  h += '</div>';

  // ── Secondary quick-add (real dedicated routes) ──
  h += '<div class="cal-quickadd">';
  h += '<button type="button" class="cal-qa" onclick="Router.go(\'tee-create\')"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> Tee time</button>';
  h += '<button type="button" class="cal-qa" onclick="Router.go(\'range\')"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="6"/></svg> Range session</button>';
  h += '</div>';

  // (Status legend now renders adjacent to the grid it describes — see _calGridHTML /
  // _calListHTML — and is suppressed on an empty month.)

  // ── Scheduling chat ──
  h += '<section class="cal-chat" aria-label="Scheduling chat">';
  h += '<div class="cal-sec-head"><h2 class="cal-sec-title">Scheduling</h2><div class="cal-sec-sub">Coordinate tee times and trips with the league.</div></div>';
  h += '<div id="calChatFeed" class="cal-chat__feed"><div class="cal-chat__loading">Loading…</div></div>';
  h += '<div class="cal-chat__composer">';
  h += '<input class="cal-chat__input" id="calChatInput" placeholder="Discuss scheduling..." aria-label="Scheduling message" onkeydown="if(event.key===\'Enter\')sendCalChat()">';
  h += '<button type="button" class="cal-chat__send" aria-label="Send scheduling message" title="Send" onclick="sendCalChat()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
  h += '</div>';
  h += '</section>';

  h += '</div>'; // .cal-wrap
  document.querySelector('[data-page="calendar"]').innerHTML = h;

  _calLoadChat();
});

// ── Scope rail (month nav + view toggle + create CTA) ──
function _calScopeHTML(todayStr) {
  var prevM = (calMonth + 11) % 12, nextM = (calMonth + 1) % 12;
  var onThisMonth = (todayStr.slice(0, 7) === _calDS(calYear, calMonth, 1).slice(0, 7));
  var s = '<div class="cal-scope">';
  s += '<div class="cal-monthnav">';
  s += '<button type="button" class="cal-navlink" aria-label="Previous month, ' + CAL_MONTHS[prevM] + '" onclick="calPrev()">← ' + CAL_MON3[prevM] + '</button>';
  // The "Today" pill's active state is a quiet brass-tinted outline (NOT a solid navy
  // fill) so it doesn't shout against the solid-brass Grid|List segment beside it —
  // two adjacent fully-filled controls competed. The toggle owns the one solid fill;
  // the pill reads as a soft "you are here" marker. (See sharedCssNeeds for canonical
  // home; _calTodayPillStyle keeps the render + in-place update in sync.)
  s += '<button type="button" class="cal-todaypill' + (onThisMonth ? ' cal-todaypill--on' : '') + '"' + _calTodayPillStyle(onThisMonth) + ' onclick="calToday()">Today</button>';
  s += '<button type="button" class="cal-navlink" aria-label="Next month, ' + CAL_MONTHS[nextM] + '" onclick="calNext()">' + CAL_MON3[nextM] + ' →</button>';
  s += '</div>';
  s += '<div class="cal-viewtoggle" role="group" aria-label="View mode">';
  s += '<button type="button" id="calVtGrid" class="cal-vt' + (calView === "grid" ? " cal-vt--on" : "") + '" aria-pressed="' + (calView === "grid") + '" onclick="setCalView(\'grid\')">Grid</button>';
  s += '<button type="button" id="calVtList" class="cal-vt' + (calView === "list" ? " cal-vt--on" : "") + '" aria-pressed="' + (calView === "list") + '" onclick="setCalView(\'list\')">List</button>';
  s += '</div>';
  // Demoted to a quiet rail control (single primary "+ New event" now lives in the
  // empty-state card, contextually anchored). Reuses the .cal-qa chrome vocabulary
  // so it reads as a toolbar action, not a competing CTA.
  s += '<button type="button" class="cal-qa" onclick="showCalEventForm()"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg> New event</button>';
  s += '</div>';
  return s;
}

// Quiet active-state for the "Today" pill: brass-tinted outline instead of a solid
// navy fill, so it doesn't compete with the solid-brass Grid|List toggle (MED-2).
// Inline because the canonical .cal-todaypill--on rule lives in shared components.css
// (out of this page's edit scope) — see sharedCssNeeds.
function _calTodayPillStyle(onThisMonth) {
  if (!onThisMonth) return '';
  return ' style="background:rgba(var(--cb-brass-rgb),.10);border-color:var(--cb-brass);color:var(--cb-brass-deep)"';
}

// ── Truthful activity counts (computed from source arrays, not the day-map) ──
function _calMeta(todayStr) {
  var mPrefix = _calDS(calYear, calMonth, 1).slice(0, 7);
  var monthStart = mPrefix + "-01";
  var monthEnd = _calDS(calYear, calMonth, new Date(calYear, calMonth + 1, 0).getDate());
  var d7 = new Date(todayStr + "T12:00:00"); d7.setDate(d7.getDate() + 7);
  var in7 = _calDS(d7.getFullYear(), d7.getMonth(), d7.getDate());

  var monthScheduled = 0, roundsThisMonth = 0, next7 = 0, upcoming = 0;
  function tally(date) {
    if (date && date.slice(0, 7) === mPrefix) monthScheduled++;
    if (date && date >= todayStr && date <= in7) next7++;
    if (date && date >= todayStr) upcoming++;
  }
  // Tee times
  (liveTeeTimes || []).forEach(function(t) { if (t.status === "cancelled") return; tally(t.date); });
  // Calendar events (use start date as the scheduling anchor)
  if (typeof _liveCalEvents !== "undefined") _liveCalEvents.forEach(function(ev) { tally(ev.startDate); });
  // Trips (overlap test for "this month"; start date for next7 / upcoming)
  (PB.getTrips() || []).forEach(function(trip) {
    if (!trip.startDate) return;
    var ed = trip.endDate || trip.startDate;
    if (trip.startDate <= monthEnd && ed >= monthStart) monthScheduled++;
    if (trip.startDate >= todayStr && trip.startDate <= in7) next7++;
    if (ed >= todayStr) upcoming++;
  });
  // Rounds logged this month (history, counted separately from "scheduled")
  (PB.getRounds() || []).forEach(function(r) { if (r.date && r.date.slice(0, 7) === mPrefix) roundsThisMonth++; });

  return { monthScheduled: monthScheduled, roundsThisMonth: roundsThisMonth, next7: next7, upcoming: upcoming };
}

function _calSubdeck(m) {
  var parts = [];
  if (m.monthScheduled > 0) parts.push(m.monthScheduled + (m.monthScheduled === 1 ? " event scheduled" : " events scheduled"));
  if (m.roundsThisMonth > 0) parts.push(m.roundsThisMonth + (m.roundsThisMonth === 1 ? " round logged" : " rounds logged"));
  if (!parts.length) return "Nothing on the books yet this month.";
  return parts.join(" · ");
}
function _calMetaLine(m) {
  return m.monthScheduled + " this month · " + m.next7 + " next 7 days · " + m.upcoming + " upcoming";
}

// ── Event chip (grid cell + list reuse a shared chip vocabulary) ──
function _calChipHTML(ev) {
  var cls = "cal-chip", dot = "cal-dot--sched", primary = "", secondary = "";
  if (ev.type === "tee") {
    primary = ev.time ? ev.time : "Tee time";
    secondary = (ev.title || "") + (ev.spots ? " · " + (ev.accepted || 0) + "/" + ev.spots : "");
    if (ev.spots && ev.accepted >= ev.spots) cls += " cal-chip--full";
  } else if (ev.type === "event") {
    primary = ev.title || "Event";
    secondary = ev.location || "";
  } else if (ev.type === "round") {
    dot = "cal-dot--round"; primary = ev.title || "Round"; secondary = ev.player || "";
  } else if (ev.type === "range") {
    dot = "cal-dot--range"; primary = "Range"; secondary = ev.player || "";
  }
  var s = '<span class="' + cls + '"><i class="cal-dot ' + dot + '"></i>';
  s += '<span class="cal-chip__t">' + escHtml(primary) + '</span>';
  if (secondary) s += '<span class="cal-chip__s">' + escHtml(secondary) + '</span>';
  s += '</span>';
  return s;
}

// Order events scheduled-first within a day, dedupe trips/events by title.
function _calDayEvents(em, ds) {
  var raw = em[ds] || [];
  var order = { tee: 0, event: 1, round: 2, range: 3 };
  var seen = {}, out = [];
  raw.slice().sort(function(a, b) { return (order[a.type] || 9) - (order[b.type] || 9); }).forEach(function(ev) {
    if (ev.type === "event") { if (seen[ev.title]) return; seen[ev.title] = 1; }
    out.push(ev);
  });
  return out;
}

// ── Status legend (renders adjacent to the grid/list it describes; never on an
//    empty month — there is nothing to legend). 3f.3 fix. ──
function _calLegendHTML() {
  var lg = '<div class="cal-legend">';
  lg += '<span><i class="cal-dot cal-dot--sched"></i>Scheduled</span>';
  lg += '<span><i class="cal-dot cal-dot--round"></i>Round played</span>';
  lg += '<span><i class="cal-dot cal-dot--range"></i>Range</span>';
  lg += '</div>';
  return lg;
}

// ── Grid view ──
function _calGridHTML(todayStr) {
  var em = _calBuildEventMap();
  var firstDay = new Date(calYear, calMonth, 1).getDay();        // 0=Sun
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var prevDays = new Date(calYear, calMonth, 0).getDate();
  var cells = [];

  // Leading overflow (prev month tail)
  for (var i = 0; i < firstDay; i++) cells.push({ over: true, n: prevDays - firstDay + 1 + i });
  // In-month days
  for (var d = 1; d <= daysInMonth; d++) cells.push({ n: d, ds: _calDS(calYear, calMonth, d) });
  // Trailing overflow (next month head) to fill the final week
  while (cells.length % 7 !== 0) cells.push({ over: true, n: cells.length - firstDay - daysInMonth + 1 });

  var hasAny = Object.keys(em).some(function(k) { return k.slice(0, 7) === todayStr.slice(0, 7) ? false : false; }) || daysInMonth > 0;

  var s = '<table class="cal-table" role="grid" aria-label="' + CAL_MONTHS[calMonth] + ' ' + calYear + '">';
  s += '<thead><tr role="row">';
  CAL_DAY_HEAD.forEach(function(dn) { s += '<th scope="col" role="columnheader" class="cal-th">' + dn + '</th>'; });
  s += '</tr></thead><tbody>';

  for (var c = 0; c < cells.length; c++) {
    if (c % 7 === 0) s += '<tr role="row">';
    var cell = cells[c];
    if (cell.over) {
      // Leading/trailing out-of-month dates: bump from the very-light --cb-mute-faint
      // placeholder to the more legible --cb-mute-2 (still clearly de-emphasised vs
      // in-month days, but readable on felt). Local override of the shared
      // .cal-cell--over .cal-datenum rule (see sharedCssNeeds for the canonical home).
      s += '<td role="gridcell" class="cal-cell cal-cell--over"><span class="cal-datenum" style="color:var(--cb-mute-2)">' + cell.n + '</span></td>';
    } else {
      var isToday = cell.ds === todayStr;
      var isSel = cell.ds === calSelectedDate;
      var evs = _calDayEvents(em, cell.ds);
      var label = CAL_DAYS_FULL[new Date(cell.ds + "T12:00:00").getDay()] + " " + CAL_MON3[calMonth] + " " + cell.n + (evs.length ? ", " + evs.length + (evs.length === 1 ? " event" : " events") : ", no events");
      s += '<td role="gridcell" class="cal-cell' + (isToday ? " cal-cell--today" : "") + (isSel ? " cal-cell--sel" : "") + '">';
      s += '<button type="button" class="cal-cellbtn" aria-label="' + escHtml(label) + '" aria-pressed="' + isSel + '" onclick="selectCalDay(\'' + cell.ds + '\')">';
      // #41 v8.25.161 — the inline "TODAY" word didn't fit a 7-col mobile day cell
      // and (with the #72 global overflow-wrap:anywhere) shoved the 2-digit date
      // into a broken stacked "1"/"4". Date number now nowraps; today is marked by
      // a compact brass dot + the cell's brass top-rule (no colliding word).
      s += '<span class="cal-cell-top"><span class="cal-datenum">' + cell.n + '</span>' + (isToday ? '<span class="cal-today-dot" aria-label="Today"></span>' : '') + '</span>';
      if (evs.length) {
        s += '<span class="cal-chips">';
        evs.slice(0, 3).forEach(function(ev) { s += _calChipHTML(ev); });
        if (evs.length > 3) s += '<span class="cal-more">+' + (evs.length - 3) + ' more</span>';
        s += '</span>';
      }
      s += '</button></td>';
    }
    if (c % 7 === 6) s += '</tr>';
  }
  s += '</tbody></table>';

  // Empty-month editorial block (3f.3) — or the legend, adjacent to the grid it
  // describes. On an empty month the legend is suppressed (nothing to legend).
  var meta = _calMeta(todayStr);
  if (meta.monthScheduled === 0 && meta.roundsThisMonth === 0) {
    s += '<div class="cal-empty">';
    s += '<div class="cal-empty__eyebrow">NO EVENTS THIS MONTH</div>';
    s += '<div class="cal-empty__h">The course is quiet.</div>';
    s += '<div class="cal-empty__b">Schedule a tee time and the league will see it on the day.</div>';
    s += '<button type="button" class="cal-empty__cta" onclick="showCalEventForm()">+ New event</button>';
    s += '</div>';
  } else {
    s += _calLegendHTML();
  }
  return s;
}

// ── List view (chronological, grouped by day; upcoming first) ──
function _calListHTML(todayStr) {
  var em = _calBuildEventMap();
  var keys = Object.keys(em).sort(); // ascending date
  var upcoming = keys.filter(function(k) { return k >= todayStr; });
  var past = keys.filter(function(k) { return k < todayStr; });

  if (!upcoming.length && !past.length) {
    return '<div class="cal-empty"><div class="cal-empty__eyebrow">NOTHING SCHEDULED</div><div class="cal-empty__h">The course is quiet.</div><div class="cal-empty__b">Schedule a tee time and it will show up here.</div><button type="button" class="cal-empty__cta" onclick="showCalEventForm()">+ New event</button></div>';
  }

  function dayBlock(ds) {
    var dt = new Date(ds + "T12:00:00");
    var eyebrow = CAL_MON3[dt.getMonth()].toUpperCase() + " " + dt.getDate() + " · " + CAL_DAYS_FULL[dt.getDay()].toUpperCase();
    var blk = '<div class="cal-listday">' + eyebrow + '</div>';
    _calDayEvents(em, ds).forEach(function(ev) {
      var eyebrowType = ev.type === "tee" ? "TEE TIME" : ev.type === "event" ? (ev.tripId ? "TRIP" : "EVENT") : ev.type === "round" ? "ROUND" : "RANGE";
      var title = ev.type === "tee" ? ((ev.time ? ev.time + " at " : "") + (ev.title || "Tee time")) : (ev.title || (ev.type === "range" ? "Range session" : "Event"));
      var sub = "";
      if (ev.type === "tee") sub = (ev.spots ? (ev.accepted || 0) + "/" + ev.spots + " confirmed" : "") + (ev.players && ev.players.length ? " · " + ev.players.join(", ") : "");
      else if (ev.type === "event") sub = [ev.location, ev.dates, (ev.players && ev.players.length ? ev.players.length + " attending" : "")].filter(Boolean).join(" · ");
      else if (ev.type === "round") sub = [ev.player, ev.score ? "shot " + ev.score : ""].filter(Boolean).join(" · ");
      else if (ev.type === "range") sub = [ev.player, ev.duration ? ev.duration + " min" : ""].filter(Boolean).join(" · ");
      var click = "";
      if (ev.type === "tee") click = "Router.go('teetimes')";
      else if (ev.type === "event" && ev.tripId) click = "Router.go('scorecard',{tripId:'" + ev.tripId + "'})";
      else if (ev.type === "round" && ev.roundId) click = "Router.go('rounds',{roundId:'" + ev.roundId + "'})";
      else if (ev.type === "range" && ev.sessionId) click = "Router.go('range-detail',{sessionId:'" + ev.sessionId + "'})";
      var dotCls = ev.type === "round" ? "cal-dot--round" : ev.type === "range" ? "cal-dot--range" : "cal-dot--sched";
      blk += '<' + (click ? 'button type="button"' : 'div') + ' class="cal-lcard"' + (click ? ' onclick="' + click + '"' : '') + '>';
      blk += '<div class="cal-lcard__eyebrow"><i class="cal-dot ' + dotCls + '"></i>' + eyebrowType + '</div>';
      blk += '<div class="cal-lcard__title">' + escHtml(title) + '</div>';
      if (sub) blk += '<div class="cal-lcard__sub">' + escHtml(sub) + '</div>';
      blk += '</' + (click ? 'button' : 'div') + '>';
    });
    return blk;
  }

  var s = '';
  if (past.length) s += '<div class="cal-listpast">' + past.length + ' past ' + (past.length === 1 ? "day" : "days") + ' on record below the upcoming slate.</div>';
  upcoming.forEach(function(ds) { s += dayBlock(ds); });
  if (past.length) {
    s += '<div class="cal-listsep">Past</div>';
    past.slice().reverse().forEach(function(ds) { s += dayBlock(ds); });
  }
  // Legend at the foot of the populated list (the empty list returns early above).
  s += _calLegendHTML();
  return s;
}

// ── Build event map from all sources (unchanged data path — P9) ──
function _calBuildEventMap() {
  var eventMap = {};
  var _myUid = currentUser ? currentUser.uid : null;
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function addEv(date, ev) { if (!eventMap[date]) eventMap[date] = []; eventMap[date].push(ev); }

  // Tee times
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled") return;
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted"}) : [];
    var names = []; accepted.forEach(function(uid) { var m = PB.getPlayer(uid); if(m) names.push(m.name||m.username||"Member"); });
    addEv(t.date, {type:"tee", title:t.courseName||"Tee Time", time:t.time||"", spots:t.spots||4, accepted:accepted.length, players:names});
  });

  // Trips (multi-day events) — one chip per day in range
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var sd = new Date(trip.startDate+"T12:00:00"), ed = trip.endDate ? new Date(trip.endDate+"T12:00:00") : sd;
    var mN = []; if(trip.members) trip.members.forEach(function(uid){var m=PB.getPlayer(uid);if(m)mN.push(m.name||m.username||"Member");});
    var _sd2=new Date(trip.startDate+"T12:00:00"),_ed2=trip.endDate?new Date(trip.endDate+"T12:00:00"):_sd2;
    var _fmtDates=monNames[_sd2.getMonth()]+" "+_sd2.getDate()+(trip.endDate&&trip.endDate!==trip.startDate?"–"+(_ed2.getMonth()===_sd2.getMonth()?_ed2.getDate():monNames[_ed2.getMonth()]+" "+_ed2.getDate())+", "+_ed2.getFullYear():", "+_sd2.getFullYear());
    for (var dt=new Date(sd); dt<=ed; dt.setDate(dt.getDate()+1)) {
      var ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
      var dayOfWeek = dayNames[dt.getDay()];
      var dayCourses = (trip.courses||[]).filter(function(c) {
        var cd = c.d || ""; return cd.toLowerCase().indexOf(dayOfWeek.toLowerCase()) === 0 || cd.toLowerCase().indexOf(shortDays[dt.getDay()].toLowerCase()) === 0;
      });
      addEv(ds, {type:"event", title:trip.name, location:trip.location||"", dates:_fmtDates, tripId:trip.id, players:mN, dayCourses:dayCourses, champion:trip.champion?(PB.getPlayer(trip.champion)||{}).name:""});
    }
  });

  // User-created calendar events (Firestore calendar_events collection)
  if (typeof _liveCalEvents !== "undefined") {
    _liveCalEvents.forEach(function(ev) {
      var sd = ev.startDate, ed = ev.endDate || ev.startDate;
      var dStart = new Date(sd + "T12:00:00"), dEnd = new Date(ed + "T12:00:00");
      var evDates = monNames[dStart.getMonth()] + " " + dStart.getDate() + (sd !== ed ? "–" + (dEnd.getMonth() === dStart.getMonth() ? dEnd.getDate() : monNames[dEnd.getMonth()] + " " + dEnd.getDate()) + ", " + dEnd.getFullYear() : ", " + dStart.getFullYear());
      for (var dt = new Date(dStart); dt <= dEnd; dt.setDate(dt.getDate() + 1)) {
        var ds = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        addEv(ds, { type: "event", title: ev.name || "Event", location: ev.location || "", dates: evDates, eventId: ev._id || "" });
      }
    });
  }

  // Rounds
  PB.getRounds().forEach(function(r) {
    if (!r.date) return;
    var p = PB.getPlayer(r.player); var pN = p?(p.name||p.username||""):"";
    addEv(r.date, {type:"round", title:r.course||"Round", player:pN, score:r.score, roundId:r.id, tee:r.tee||"", holesPlayed:r.holesPlayed||18, holesMode:r.holesMode||"18", format:r.format||""});
  });

  // Range sessions
  if (typeof liveRangeSessions !== "undefined") {
    liveRangeSessions.forEach(function(s) {
      if (!s.date || (s.visibility==="private" && s.playerId!==_myUid)) return;
      addEv(s.date, {type:"range", title:"Range Session", player:s.playerName||"", duration:s.durationMin||0, sessionId:s._id||""});
    });
  }

  return eventMap;
}

// ── Day-detail panel (Clubhouse-tokened drill-in) ──
function _renderCalDayDetail(eventMap, ds) {
  var dayEvs = eventMap[ds] || [];
  if (!dayEvs.length) return '';
  var selDate = new Date(ds + "T12:00:00");
  var dh = '<div class="cal-detail__head">' + CAL_DAYS_FULL[selDate.getDay()] + ', ' + CAL_MON3[selDate.getMonth()] + ' ' + selDate.getDate() + '</div>';

  var teeEvs = dayEvs.filter(function(e){return e.type==="tee"});
  var eventEvs = dayEvs.filter(function(e){return e.type==="event"});
  var roundEvs = dayEvs.filter(function(e){return e.type==="round"});
  var rangeEvs = dayEvs.filter(function(e){return e.type==="range"});

  // Events / trips
  var seenTitles = {};
  eventEvs.forEach(function(ev) {
    if (seenTitles[ev.title]) return; seenTitles[ev.title] = true;
    var _ck = (ev.dayCourses&&ev.dayCourses.length&&ev.dayCourses[0].key)?ev.dayCourses[0].key:"";
    var _cl = ev.tripId ? "Router.go('scorecard',{tripId:'"+ev.tripId+"'" + (_ck?",course:'"+_ck+"'":"") + "})" : "";
    dh += '<' + (_cl ? 'button type="button"' : 'div') + ' class="cal-dcard"' + (_cl ? ' onclick="'+_cl+'"' : '') + '>';
    dh += '<div class="cal-dcard__eyebrow"><i class="cal-dot cal-dot--sched"></i>' + (ev.tripId ? 'TRIP' : 'EVENT') + '</div>';
    dh += '<div class="cal-dcard__title">' + escHtml(ev.title) + '</div>';
    if (ev.location) dh += '<div class="cal-dcard__meta">' + escHtml(ev.location) + '</div>';
    if (ev.dates) dh += '<div class="cal-dcard__meta">' + ev.dates + '</div>';
    if (ev.players&&ev.players.length) dh += '<div class="cal-dcard__meta">' + ev.players.length + ' attending: ' + escHtml(ev.players.join(", ")) + '</div>';
    if (ev.champion) dh += '<div class="cal-dcard__meta cal-dcard__champ">Champion: ' + escHtml(ev.champion) + '</div>';
    if (ev.dayCourses&&ev.dayCourses.length) {
      ev.dayCourses.forEach(function(dc) {
        dh += '<div class="cal-dcard__course"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg><span>' + escHtml(dc.n||"Course") + '</span>';
        if (dc.f) dh += '<span class="cal-dcard__fmt"> · ' + escHtml(dc.f) + '</span>';
        dh += '</div>';
      });
    } else if (ev.tripId) {
      dh += '<div class="cal-dcard__course cal-dcard__course--rest">No round scheduled, travel or rest day</div>';
    }
    dh += '</' + (_cl ? 'button' : 'div') + '>';
  });

  // Tee times (only if no event already shown for the day)
  if (!eventEvs.length) {
    teeEvs.forEach(function(ev) {
      dh += '<button type="button" class="cal-dcard" onclick="Router.go(\'teetimes\')">';
      dh += '<div class="cal-dcard__eyebrow"><i class="cal-dot cal-dot--sched"></i>TEE TIME</div>';
      dh += '<div class="cal-dcard__title">' + escHtml(ev.title) + '</div>';
      if (ev.time) dh += '<div class="cal-dcard__meta">' + escHtml(ev.time) + '</div>';
      if (ev.players&&ev.players.length) dh += '<div class="cal-dcard__meta">' + ev.accepted + '/' + ev.spots + ' going: ' + escHtml(ev.players.join(", ")) + '</div>';
      dh += '</button>';
    });
  }

  // Rounds grouped by course
  if (roundEvs.length) {
    var cg = {};
    roundEvs.forEach(function(ev) { if (!cg[ev.title]) cg[ev.title] = []; cg[ev.title].push(ev); });
    Object.keys(cg).forEach(function(course) {
      var group = cg[course];
      var boxClick = group.length===1&&group[0].roundId ? ' onclick="Router.go(\'rounds\',{roundId:\''+group[0].roundId+'\'})"' : '';
      dh += '<' + (boxClick ? 'button type="button"' : 'div') + ' class="cal-dcard"'+boxClick+'>';
      dh += '<div class="cal-dcard__eyebrow"><i class="cal-dot cal-dot--round"></i>ROUND' + (group.length>1?"S":"") + '</div>';
      dh += '<div class="cal-dcard__title">' + escHtml(course) + '</div>';
      group.forEach(function(r) {
        var _par = roundParTotal(r);
        var _diff = (r.score && _par) ? r.score - _par : null;
        var _diffStr = _diff === null ? "" : (_diff === 0 ? "E" : (_diff > 0 ? "+" + _diff : String(_diff)));
        var _diffPos = (_diff !== null && _diff <= 0);
        var is9h = r.holesPlayed&&r.holesPlayed<=9;
        var hL = is9h ? (r.holesMode==="back9"?"Back 9":"Front 9") : "";
        var tL = r.tee ? r.tee + " Tees" : "";
        var meta = [tL, hL].filter(Boolean).join(" · ");
        var isScramble = r.format==="scramble"||r.format==="scramble4";
        var rowClick = group.length>1&&r.roundId ? ' onclick="event.stopPropagation();Router.go(\'rounds\',{roundId:\''+r.roundId+'\'})"' : '';
        dh += '<div class="cal-droundrow"'+rowClick+'><span class="cal-droundrow__who">' + escHtml(r.player) + (isScramble?" (Scramble)":"") + (meta?'<span class="cal-droundrow__meta"> · '+escHtml(meta)+'</span>':'') + '</span><span class="cal-droundrow__score">' + (r.score||"—") + (_diffStr ? '<span class="cal-droundrow__diff'+(_diffPos?' cal-droundrow__diff--pos':'')+'">' + _diffStr + '</span>' : '') + '</span></div>';
      });
      dh += '</' + (boxClick ? 'button' : 'div') + '>';
    });
  }

  // Range sessions
  rangeEvs.forEach(function(ev) {
    var rDest = ev.sessionId ? "Router.go('range-detail',{sessionId:'"+ev.sessionId+"'})" : "Router.go('range')";
    dh += '<button type="button" class="cal-dcard" onclick="'+rDest+'">';
    dh += '<div class="cal-dcard__eyebrow"><i class="cal-dot cal-dot--range"></i>RANGE SESSION</div>';
    dh += '<div class="cal-dcard__title">' + (ev.duration||0) + ' min</div>';
    if (ev.player) dh += '<div class="cal-dcard__meta">' + escHtml(ev.player) + '</div>';
    dh += '</button>';
  });

  return dh;
}

// ── Navigation + view state ──
function calPrev(){ calMonth--; if(calMonth<0){calMonth=11;calYear--;} calSelectedDate=null; _updateCalendarInPlace(); }
function calNext(){ calMonth++; if(calMonth>11){calMonth=0;calYear++;} calSelectedDate=null; _updateCalendarInPlace(); }
function calToday(){ var t=new Date(); calMonth=t.getMonth(); calYear=t.getFullYear(); calSelectedDate=null; _updateCalendarInPlace(); }
function selectCalDay(ds){ calSelectedDate=(calSelectedDate===ds)?null:ds; _updateCalendarInPlace(); }
function setCalView(v){ if(v!==calView){ calView=v; calSelectedDate=null; _updateCalendarInPlace(); } }

function _updateCalendarInPlace() {
  var todayStr = _calTodayStr();
  var meta = _calMeta(todayStr);

  var headEl = document.getElementById("calHeadline");
  if (headEl) headEl.textContent = CAL_MONTHS[calMonth] + " " + calYear + ".";
  var subEl = document.getElementById("calSubdeck");
  if (subEl) subEl.innerHTML = _calSubdeck(meta);
  var metaEl = document.getElementById("calMeta");
  if (metaEl) {
    // Mirror the masthead suppression: hide the strip when its own three counts are
    // all 0 (NOT keyed on rounds — see _mEmpty note; prevents "0·0·0" vs "1 round").
    var metaEmpty = (meta.monthScheduled === 0 && meta.next7 === 0 && meta.upcoming === 0);
    metaEl.hidden = metaEmpty;
    metaEl.textContent = metaEmpty ? "" : _calMetaLine(meta);
  }

  // Sync scope-rail toggle + today-pill state
  var onThisMonth = (todayStr.slice(0, 7) === _calDS(calYear, calMonth, 1).slice(0, 7));
  var pill = document.querySelector(".cal-todaypill");
  if (pill) {
    pill.classList.toggle("cal-todaypill--on", onThisMonth);
    // Keep the quiet brass-tinted active treatment (MED-2) in sync with month nav.
    if (onThisMonth) {
      pill.style.background = "rgba(var(--cb-brass-rgb),.10)";
      pill.style.borderColor = "var(--cb-brass)";
      pill.style.color = "var(--cb-brass-deep)";
    } else {
      pill.style.background = "";
      pill.style.borderColor = "";
      pill.style.color = "";
    }
  }
  var vg = document.getElementById("calVtGrid"), vl = document.getElementById("calVtList");
  if (vg) { vg.classList.toggle("cal-vt--on", calView === "grid"); vg.setAttribute("aria-pressed", calView === "grid"); }
  if (vl) { vl.classList.toggle("cal-vt--on", calView === "list"); vl.setAttribute("aria-pressed", calView === "list"); }

  var bodyEl = document.getElementById("cal-body");
  if (bodyEl) bodyEl.innerHTML = (calView === "list") ? _calListHTML(todayStr) : _calGridHTML(todayStr);

  var detailEl = document.getElementById("cal-day-detail");
  if (detailEl) {
    var em = _calBuildEventMap();
    detailEl.innerHTML = (calView === "grid" && calSelectedDate && em[calSelectedDate]) ? _renderCalDayDetail(em, calSelectedDate) : "";
  }
}

// ── Inline create form ──
function _calCreateFormHTML(defaultDate) {
  var f = '<div id="calEventForm" class="cal-form" style="display:none">';
  f += '<div class="cal-form__head"><div class="cal-form__title">New event</div><button type="button" class="cal-form__x" aria-label="Close" onclick="hideCalEventForm()">×</button></div>';
  f += '<div class="ff"><label class="ff-label" for="calEvName">Event name</label><input class="ff-input" id="calEvName" placeholder="e.g. Weekend Tournament"></div>';
  f += '<div class="ff"><label class="ff-label" for="calEvLocation">Location</label><input class="ff-input" id="calEvLocation" placeholder="e.g. Briarwood Golf Club"></div>';
  f += '<div class="cal-form__row">';
  f += '<div class="ff"><label class="ff-label" for="calEvStart">Start date</label><input class="ff-input" type="date" id="calEvStart" value="' + escHtml(defaultDate) + '"></div>';
  f += '<div class="ff"><label class="ff-label" for="calEvEnd">End date (optional)</label><input class="ff-input" type="date" id="calEvEnd"></div>';
  f += '</div>';
  f += '<div class="ff"><label class="ff-label" for="calEvDesc">Description</label><textarea class="ff-input" id="calEvDesc" placeholder="Details..." rows="2"></textarea></div>';
  f += '<div class="ff"><label class="ff-label" for="calEvType">Type</label><select class="ff-input" id="calEvType"><option value="event">Event</option><option value="tournament">Tournament</option><option value="trip">Trip</option><option value="social">Social</option></select></div>';
  f += '<button type="button" class="cal-form__save" onclick="saveCalEvent()">Create event</button>';
  f += '</div>';
  return f;
}
function showCalEventForm() {
  var form = document.getElementById("calEventForm");
  if (form) { form.style.display = "block"; form.scrollIntoView({ behavior: "smooth", block: "nearest" }); var n = document.getElementById("calEvName"); if (n) n.focus(); }
}
function hideCalEventForm() {
  var form = document.getElementById("calEventForm");
  if (form) form.style.display = "none";
}

function saveCalEvent() {
  if (!db || !currentUser) { Router.toast("Sign in required"); return; }
  var name = (document.getElementById("calEvName") || {}).value || "";
  var location = (document.getElementById("calEvLocation") || {}).value || "";
  var startDate = (document.getElementById("calEvStart") || {}).value || "";
  var endDate = (document.getElementById("calEvEnd") || {}).value || "";
  var desc = (document.getElementById("calEvDesc") || {}).value || "";
  var evType = (document.getElementById("calEvType") || {}).value || "event";

  if (!name.trim()) { Router.toast("Enter an event name"); return; }
  if (!startDate) { Router.toast("Enter a start date"); return; }
  if (endDate && endDate < startDate) { var tmp = startDate; startDate = endDate; endDate = tmp; }

  var doc = {
    name: name.trim(),
    location: location.trim(),
    startDate: startDate,
    endDate: endDate || startDate,
    description: desc.trim(),
    eventType: evType,
    createdBy: currentUser.uid,
    createdByName: currentProfile ? PB.getDisplayName(currentProfile) : "Member",
    createdAt: fsTimestamp()
  };

  db.collection("calendar_events").add(leagueDoc("calendar_events", doc)).then(function() {
    Router.toast("Event created!");
    hideCalEventForm();
    if (typeof _liveCalEvents === "undefined") window._liveCalEvents = [];
    _liveCalEvents.push(doc);
    _updateCalendarInPlace();
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't save the event.")); });
}

// ── Load calendar events from Firestore ──
var _liveCalEvents = [];
function _loadCalendarEvents() {
  if (!db) return;
  leagueQuery("calendar_events").orderBy("createdAt","desc").limit(50).get().then(function(snap) {
    _liveCalEvents = [];
    snap.forEach(function(doc) {
      var d = doc.data();
      d._id = doc.id;
      _liveCalEvents.push(d);
    });
    if (_liveCalEvents.length && Router.getPage() === "calendar") _updateCalendarInPlace();
  }).catch(function() {});
}
setTimeout(_loadCalendarEvents, 2000);

// ── Scheduling chat ──
function _calLoadChat() {
  if (!db) return;
  leagueQuery("scheduling_chat").orderBy("createdAt","desc").limit(20).get().then(function(snap) {
    var feed = document.getElementById("calChatFeed");
    if (!feed) return;
    if (snap.empty) {
      feed.innerHTML = '<div class="cal-chat__empty"><div class="cal-chat__empty-h">No messages yet.</div><div class="cal-chat__empty-b">Use the box below to coordinate tee times, swap thoughts on next week’s round, or call your shot.</div></div>';
      return;
    }
    var ch = '';
    snap.forEach(function(doc) {
      var msg = doc.data();
      var author = msg.authorName || "Member";
      var ts = msg.createdAt ? feedTimeAgo(tsMillis(msg.createdAt)) : "";
      ch += '<div class="cal-chat__msg"><div class="cal-chat__msg-top"><span class="cal-chat__author">' + escHtml(author) + '</span><span class="cal-chat__ts">' + ts + '</span></div>';
      ch += '<div class="cal-chat__text">' + escHtml(msg.text || "") + '</div></div>';
    });
    feed.innerHTML = ch;
  });
}

function sendCalChat() {
  var input = document.getElementById("calChatInput");
  if (!input || !input.value.trim() || !db || !currentUser) return;
  var text = input.value.trim();
  input.value = "";
  db.collection("scheduling_chat").add(leagueDoc("scheduling_chat", {
    id: genId(),
    text: text,
    authorId: currentUser.uid,
    authorName: currentProfile ? PB.getDisplayName(currentProfile) : "Member",
    createdAt: fsTimestamp()
  })).then(function() {
    _calLoadChat();
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't send your message.")); });
}

// ========== TRASH TALK FEED ==========
