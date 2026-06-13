// Chat — Clubhouse calendar + event-creation subsystem. Extracted per W1.A5
// (AMD-027). Functions: toggleCalRangeMode, toggleClubhouseCal,
// renderClubCalGrid, selectClubCalDay, clubCalPrev, clubCalNext,
// refreshClubCal, createEventFromCal.

function toggleCalRangeMode() {
  calRangeMode = !calRangeMode;
  clubCalSelectedDate = null;
  clubCalRangeStart = null;
  clubCalRangeEnd = null;
  refreshClubCal();
  var btn = document.getElementById("calRangeModeBtn");
  if (btn) {
    btn.style.background = calRangeMode ? "rgba(var(--gold-rgb),.2)" : "transparent";
    btn.style.color = calRangeMode ? "var(--gold)" : "var(--muted)";
    btn.style.borderColor = calRangeMode ? "var(--gold)" : "var(--border)";
    btn.textContent = calRangeMode ? "× Cancel Range" : "Select Range";
  }
}

function toggleClubhouseCal() {
  clubCalOpen = !clubCalOpen;
  var el = document.getElementById("clubhouseCal");
  var btn = document.getElementById("calToggleBtn");
  if (el) el.style.display = clubCalOpen ? "block" : "none";
  if (btn) btn.innerHTML = clubCalOpen ? "× Close" : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Calendar';
}

function renderClubCalGrid(year, month, todayStr, events) {
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  calEventMap = {};
  function addEv(date, ev) { if (!calEventMap[date]) calEventMap[date] = []; calEventMap[date].push(ev); }
  var _myUid = typeof currentUser !== "undefined" && currentUser ? currentUser.uid : null;
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled") return;
    // Skip private tee times for non-participants
    if (t.visibility === "private" && _myUid) {
      var isParticipant = t.createdBy === _myUid || (t.responses && t.responses[_myUid]);
      if (!isParticipant) return;
    }
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted"}) : [];
    var names = []; accepted.forEach(function(uid) { var m = PB.getPlayer(uid) || (typeof fbMemberCache!=="undefined"?fbMemberCache[uid]:null); if(m) names.push(m.name||m.username||"Member"); });
    addEv(t.date, {type:"tee", title:t.courseName||"Tee Time", time:t.time||"", spots:t.spots||4, accepted:accepted.length, players:names});
  });
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var sd = new Date(trip.startDate+"T12:00:00"), ed = trip.endDate ? new Date(trip.endDate+"T12:00:00") : sd;
    var mN = []; if(trip.members) trip.members.forEach(function(uid){var m=PB.getPlayer(uid)||(typeof fbMemberCache!=="undefined"?fbMemberCache[uid]:null);if(m)mN.push(m.name||m.username||"Member");});
    // Map day-of-week names to course data
    var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var tripCourses = trip.courses || [];
    for (var dt=new Date(sd); dt<=ed; dt.setDate(dt.getDate()+1)) {
      var ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
      var _mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var _sd2=new Date(trip.startDate+"T12:00:00"),_ed2=trip.endDate?new Date(trip.endDate+"T12:00:00"):_sd2;
      var _fmtDates=_mn[_sd2.getMonth()]+" "+_sd2.getDate()+(trip.endDate&&trip.endDate!==trip.startDate?"–"+(_ed2.getMonth()===_sd2.getMonth()?_ed2.getDate():_mn[_ed2.getMonth()]+" "+_ed2.getDate())+", "+_ed2.getFullYear():", "+_sd2.getFullYear());
      // Find courses scheduled for this day of the week
      var dayOfWeek = dayNames[dt.getDay()];
      var dayCourses = tripCourses.filter(function(c) {
        var cd = c.d || c.day || "";
        return cd.toLowerCase().indexOf(dayOfWeek.toLowerCase()) === 0 || 
               cd.toLowerCase().indexOf(shortDays[dt.getDay()].toLowerCase()) === 0;
      });
      addEv(ds, {type:"event", title:trip.name, location:trip.location||"", dates:_fmtDates, tripId:trip.id, players:mN, dayCourses:dayCourses});
    }
  });
  PB.getRounds().forEach(function(r) {
    if (!r.date) return;
    var p = PB.getPlayer(r.player); var pN = p?(p.name||p.username||""):"";
    var courseObj = PB.getCourseByName(r.course);
    var teeName = r.tee || (courseObj ? courseObj.tee : "") || "";
    addEv(r.date, {type:"round", title:r.course||"Round", player:pN, score:r.score, roundId:r.id, tee:teeName, holesPlayed:r.holesPlayed||18, holesMode:r.holesMode||"18"});
  });
  liveRangeSessions.forEach(function(s) {
    if (!s.date) return;
    // Skip other users' private sessions
    if (s.visibility === "private" && s.playerId !== _myUid) return;
    addEv(s.date, {type:"range", title:"Range Session" + (s.visibility === "private" ? " (Private)" : ""), player:s.playerName||"", duration:s.durationMin||0});
  });
  var h = '';
  for (var i=0;i<firstDay;i++) h+='<div style="padding:8px;font-size:12px"></div>';
  for (var d=1;d<=daysInMonth;d++) {
    var ds=year+"-"+String(month+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    var isT=ds===todayStr,isS=ds===clubCalSelectedDate,isRS=ds===clubCalRangeStart,isRE=ds===clubCalRangeEnd;
    var inR=clubCalRangeStart&&clubCalRangeEnd&&ds>=clubCalRangeStart&&ds<=clubCalRangeEnd;
    var evs=calEventMap[ds]||[],hasSel=clubCalSelectedDate||clubCalRangeStart;
    var bg=isRS||isRE?"var(--gold)":inR?"rgba(var(--gold-rgb),.25)":isS?"var(--gold)":"transparent";
    var cl=isRS||isRE||isS?"var(--bg)":isT&&!hasSel?"var(--gold)":"var(--cream)";
    var dots=[];
    if(isT&&!isS&&!isRS&&!isRE&&!inR) dots.push("var(--live)");
    var ht={};
    evs.forEach(function(ev){if(ev.type==="event"&&!ht.e){dots.push("var(--gold)");ht.e=1;}if(ev.type==="tee"&&!ht.t){dots.push("var(--blue)");ht.t=1;}if(ev.type==="round"&&!ht.r){dots.push("var(--purple)");ht.r=1;}if(ev.type==="range"&&!ht.rng){dots.push("var(--pink)");ht.rng=1;}});
    var dH='';
    if(dots.length===1)dH='<div style="width:4px;height:4px;border-radius:50%;background:'+dots[0]+';margin:1px auto 0"></div>';
    else if(dots.length>1){dH='<div style="display:flex;justify-content:center;gap:2px;margin-top:1px">';dots.slice(0,3).forEach(function(c){dH+='<div style="width:3px;height:3px;border-radius:50%;background:'+c+'"></div>';});dH+='</div>';}
    h+='<div onclick="selectClubCalDay(\''+ds+'\')" style="padding:6px 0;font-size:12px;font-weight:'+(isT?"700":"400")+';color:'+cl+';background:'+bg+';border-radius:6px;cursor:pointer;line-height:1">'+d+dH+'</div>';
  }
  return h;
}
var calEventMap = {};
function selectClubCalDay(dateStr) {
  if (calRangeMode) {
    // RANGE MODE: two taps define a range
    if (!clubCalSelectedDate && !clubCalRangeStart) {
      clubCalSelectedDate = dateStr;
      clubCalRangeStart = null;
      clubCalRangeEnd = null;
    } else if (clubCalSelectedDate === dateStr && !clubCalRangeEnd) {
      clubCalSelectedDate = null;
    } else if (clubCalSelectedDate && !clubCalRangeEnd) {
      if (dateStr > clubCalSelectedDate) {
        clubCalRangeStart = clubCalSelectedDate;
        clubCalRangeEnd = dateStr;
      } else if (dateStr < clubCalSelectedDate) {
        clubCalRangeStart = dateStr;
        clubCalRangeEnd = clubCalSelectedDate;
      }
      clubCalSelectedDate = null;
    } else {
      clubCalSelectedDate = dateStr;
      clubCalRangeStart = null;
      clubCalRangeEnd = null;
    }
  } else {
    // NORMAL MODE: single tap toggles date view, no range creation
    if (clubCalSelectedDate === dateStr) {
      clubCalSelectedDate = null;
    } else {
      clubCalSelectedDate = dateStr;
    }
    clubCalRangeStart = null;
    clubCalRangeEnd = null;
  }
  refreshClubCal();
}

function clubCalPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  clubCalSelectedDate = null; clubCalRangeStart = null; clubCalRangeEnd = null;
  refreshClubCal();
}

function clubCalNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  clubCalSelectedDate = null; clubCalRangeStart = null; clubCalRangeEnd = null;
  refreshClubCal();
}

function refreshClubCal() {
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var now = new Date();
  var todayStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
  
  var titleEl = document.getElementById("clubCalTitle");
  if (titleEl) titleEl.textContent = monthNames[calMonth] + " " + calYear;
  
  var gridEl = document.getElementById("clubCalGrid");
  if (gridEl) gridEl.innerHTML = renderClubCalGrid(calYear, calMonth, todayStr, []);
  
  var eventsEl = document.getElementById("clubCalEvents");
  if (!eventsEl) return;
  
  // DATE RANGE SELECTED → event/trip creation
  if (clubCalRangeStart && clubCalRangeEnd) {
    var sd = new Date(clubCalRangeStart + "T12:00:00");
    var ed = new Date(clubCalRangeEnd + "T12:00:00");
    var days = Math.round((ed - sd) / 86400000) + 1;
    var eh = '<div style="font-size:11px;font-weight:600;color:var(--cream);margin-bottom:6px">' + monNames[sd.getMonth()] + ' ' + sd.getDate() + ' – ' + monNames[ed.getMonth()] + ' ' + ed.getDate() + ' (' + days + ' days)</div>';
    
    var rangeEvents = [];
    liveTeeTimes.forEach(function(t) { if (t.date >= clubCalRangeStart && t.date <= clubCalRangeEnd && t.status !== "cancelled") rangeEvents.push({type:"tee",title:t.courseName||"Tee Time",date:t.date,time:t.time}); });
    PB.getTrips().forEach(function(trip) { if (trip.startDate && trip.startDate <= clubCalRangeEnd && (!trip.endDate || trip.endDate >= clubCalRangeStart)) rangeEvents.push({type:"trip",title:trip.name}); });
    if (rangeEvents.length) {
      rangeEvents.forEach(function(ev) {
        eh += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0"><div style="width:5px;height:5px;border-radius:50%;background:' + (ev.type==="trip"?"var(--gold)":"var(--birdie)") + '"></div><span style="font-size:11px;color:var(--cream)">' + escHtml(ev.title) + '</span></div>';
      });
    }
    eh += '<div style="display:flex;gap:6px;margin-top:8px">';
    eh += '<button class="btn-sm green" style="flex:1;font-size:10px" onclick="createEventFromCal(\'' + clubCalRangeStart + '\',\'' + clubCalRangeEnd + '\')">+ Event</button>';
    eh += '<button class="btn-sm outline" style="flex:1;font-size:10px" onclick="Router.go(\'tee-create\',{date:\'' + clubCalRangeStart + '\'})">+ Tee Time</button>';
    eh += '<button class="btn-sm outline" style="font-size:10px;padding:6px 10px" onclick="clubCalRangeStart=null;clubCalRangeEnd=null;clubCalSelectedDate=null;refreshClubCal()">Clear</button>';
    eh += '</div>';
    eh += '<div style="font-size:9px;color:var(--muted2);margin-top:6px">Tap a single date for a tee time</div>';
    eventsEl.innerHTML = eh;
    return;
  }
  
  // SINGLE DATE SELECTED
  if (clubCalSelectedDate) {
    var dayEvs = calEventMap[clubCalSelectedDate] || [];
    var eh = '';
    var selDate = new Date(clubCalSelectedDate + "T12:00:00");
    eh += '<div style="font-size:11px;font-weight:600;color:var(--cream);margin-bottom:8px">' + dayNames[selDate.getDay()] + ', ' + monNames[selDate.getMonth()] + ' ' + selDate.getDate() + '</div>';
    
    if (dayEvs.length) {
      // Separate by type
      var teeEvs = dayEvs.filter(function(e){return e.type==="tee"});
      var eventEvs = dayEvs.filter(function(e){return e.type==="event"});
      var roundEvs = dayEvs.filter(function(e){return e.type==="round"});
      var rangeEvs = dayEvs.filter(function(e){return e.type==="range"});
      
      // Events (gold) — dedup by title
      var seenEventTitles = {};
      eventEvs.forEach(function(ev) {
        if (seenEventTitles[ev.title]) return;
        seenEventTitles[ev.title] = true;
        var _firstCourseKey = (ev.dayCourses && ev.dayCourses.length && ev.dayCourses[0].key) ? ev.dayCourses[0].key : "";
        var _evClick = ev.tripId ? "Router.go('scorecard',{tripId:'" + ev.tripId + "'" + (_firstCourseKey ? ",course:'" + _firstCourseKey + "'" : "") + "})" : "";
        eh += '<div style="background:var(--bg3);border:1px solid rgba(var(--gold-rgb),.32);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="' + _evClick + '">';
        eh += '<div style="font-size:8px;color:var(--gold);font-weight:700;letter-spacing:.5px;margin-bottom:3px">EVENT</div>';
        eh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
        if (ev.location) eh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.location) + '</div>';
        if (ev.dates) eh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.dates + '</div>';
        if (ev.players && ev.players.length) eh += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + ev.players.length + ' attending: ' + ev.players.join(", ") + '</div>';
        // Show courses scheduled for this day from the trip data
        if (ev.dayCourses && ev.dayCourses.length) {
          ev.dayCourses.forEach(function(dc) {
            eh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px">';
            eh += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--blue)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>';
            eh += '<span style="font-size:11px;color:var(--blue);font-weight:600">' + escHtml(dc.n || dc.name || "Course") + '</span>';
            eh += '<span style="font-size:10px;color:var(--muted)"> · ' + (dc.t || dc.time || "TBD") + '</span>';
            if (dc.f || dc.format) eh += '<span style="font-size:9px;color:var(--muted2)"> · ' + escHtml(dc.f || dc.format) + '</span>';
            eh += '</div>';
          });
        } else if (teeEvs.length) {
          // Fall back to standalone tee times
          teeEvs.forEach(function(tev) {
            eh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px">';
            eh += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--blue)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>';
            eh += '<span style="font-size:11px;color:var(--blue);font-weight:600">' + escHtml(tev.title) + '</span>';
            if (tev.time) eh += '<span style="font-size:10px;color:var(--muted)"> · ' + tev.time + '</span>';
            eh += '</div>';
          });
        } else {
          // No course or tee time for this trip day
          eh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">';
          eh += '<div style="font-size:10px;color:var(--muted)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--muted)" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> No round scheduled, travel or rest day</div>';
          eh += '</div>';
        }
        eh += '</div>';
      });
      
      // Tee times (blue) — only show standalone if no events on this day
      if (!eventEvs.length) {
        teeEvs.forEach(function(ev) {
        eh += '<div style="background:var(--bg3);border:1px solid rgba(var(--blue-rgb),.32);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="Router.go(\'teetimes\')">';
        eh += '<div style="font-size:8px;color:var(--blue);font-weight:700;letter-spacing:.5px;margin-bottom:3px">TEE TIME</div>';
        eh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
        if (ev.time) eh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.time + '</div>';
        if (ev.players && ev.players.length) eh += '<div style="font-size:10px;color:var(--blue);margin-top:3px">' + ev.accepted + '/' + ev.spots + ' going: ' + ev.players.join(", ") + '</div>';
        else eh += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + ev.accepted + '/' + ev.spots + ' spots filled</div>';
        eh += '</div>';
      });
      }
      
      // Rounds (purple) — grouped by course
      if (roundEvs.length) {
        var courseGroups = {};
        roundEvs.forEach(function(ev) {
          if (!courseGroups[ev.title]) courseGroups[ev.title] = [];
          courseGroups[ev.title].push(ev);
        });
        Object.keys(courseGroups).forEach(function(course) {
          var group = courseGroups[course];
          // If single round, make the whole box clickable
          var boxClick = group.length === 1 && group[0].roundId ? ' onclick="Router.go(\'rounds\',{roundId:\'' + group[0].roundId + '\'})" style="background:var(--bg3);border:1px solid rgba(var(--purple-rgb),.32);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer"' : ' style="background:var(--bg3);border:1px solid rgba(var(--purple-rgb),.32);border-radius:4px;padding:10px 12px;margin-bottom:6px"';
          eh += '<div' + boxClick + '>';
          eh += '<div style="font-size:8px;color:var(--purple);font-weight:700;letter-spacing:.5px;margin-bottom:3px">ROUND' + (group.length > 1 ? 'S' : '') + '</div>';
          eh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(course) + '</div>';
          group.forEach(function(r) {
            // Community-safe par-relative: neutral score + signed delta, no red.
            var _par = roundParTotal(r);
            var _diff = (r.score && _par) ? r.score - _par : null;
            var _diffStr = _diff === null ? "" : (_diff === 0 ? "E" : (_diff > 0 ? "+" + _diff : String(_diff)));
            var _diffColor = (_diff !== null && _diff <= 0) ? "var(--birdie)" : "var(--muted2)";
            var is9h = r.holesPlayed && r.holesPlayed <= 9;
            var hLabel = is9h ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
            var tLabel = r.tee ? r.tee + " Tees" : "";
            var meta = [tLabel, hLabel.replace(" · ","")].filter(Boolean).join(" · ");
            // Individual row click only when multiple rounds grouped
            var rowClick = group.length > 1 && r.roundId ? ' onclick="event.stopPropagation();Router.go(\'rounds\',{roundId:\'' + r.roundId + '\'})" style="cursor:pointer;display:flex;justify-content:space-between;padding:3px 0;font-size:11px"' : ' style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"';
            eh += '<div' + rowClick + '><div><span style="color:var(--muted)">' + escHtml(r.player) + '</span>' + (meta ? '<span style="color:var(--muted2);font-size:9px"> · ' + meta + '</span>' : '') + '</div><span style="font-weight:600;color:var(--cream)">' + (r.score || "—") + (_diffStr ? '<span style="font-family:var(--font-mono);font-size:9px;font-weight:600;color:' + _diffColor + ';margin-left:4px">' + _diffStr + '</span>' : '') + '</span></div>';
          });
          eh += '</div>';
        });
      }
      
      // Range sessions (pink)
      if (rangeEvs.length) {
        rangeEvs.forEach(function(ev) {
          eh += '<div style="background:var(--bg3);border:1px solid rgba(var(--pink-rgb),.32);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="rangeActiveView=\'range\';Router.go(\'activity\')">';
          eh += '<div style="font-size:8px;color:var(--pink);font-weight:700;letter-spacing:.5px;margin-bottom:3px">RANGE SESSION</div>';
          eh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + (ev.duration||0) + ' min</div>';
          if (ev.player) eh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.player) + '</div>';
          eh += '</div>';
        });
      }
    } else {
      eh += '<div style="font-size:11px;color:var(--muted);padding:4px 0">Nothing scheduled</div>';
    }
    // Legend
    eh += '<div style="display:flex;gap:10px;margin-top:6px;font-size:9px;color:var(--muted2)">';
    eh += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--blue);vertical-align:middle;margin-right:3px"></span>Tee Time</span>';
    eh += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gold);vertical-align:middle;margin-right:3px"></span>Event</span>';
    eh += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--purple);vertical-align:middle;margin-right:3px"></span>Round</span>';
    eh += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pink);vertical-align:middle;margin-right:3px"></span>Range</span>';
    eh += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--live);vertical-align:middle;margin-right:3px"></span>Today</span>';
    eh += '</div>';
    eh += '<div style="display:flex;gap:6px;margin-top:8px">';
    eh += '<button class="btn-sm green" style="flex:1;font-size:10px" onclick="Router.go(\'tee-create\',{date:\'' + clubCalSelectedDate + '\'})">+ Tee Time</button>';
    eh += '<button class="btn-sm outline" style="flex:1;font-size:10px" onclick="createEventFromCal(\'' + clubCalSelectedDate + '\',\'' + clubCalSelectedDate + '\')">+ Event</button>';
    eh += '<button class="btn-sm outline" style="flex:1;font-size:10px;color:var(--pink);border-color:rgba(var(--pink-rgb),.3)" onclick="startRangeSession()"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> Range</button>';
    eh += '</div>';
    eh += '<div style="font-size:9px;color:var(--muted2);margin-top:6px">Use "Select Range" above for multi-day events</div>';
    eventsEl.innerHTML = eh;
  } else {
    eventsEl.innerHTML = '';
  }
}
function createEventFromCal(startDate, endDate, _name, _loc) {
  // v8.24.34 — branded pbPrompt chain (was two native prompt()s).
  if (_name === undefined) {
    pbPrompt({ title: "Name the event", placeholder: "e.g. Saturday Skins", confirmLabel: "Next" })
      .then(function(n) { if (n !== null && n) createEventFromCal(startDate, endDate, n, undefined); });
    return;
  }
  if (_loc === undefined) {
    pbPrompt({ title: "Where at?", message: "Optional.", confirmLabel: "Create", cancelLabel: "Skip" })
      .then(function(l) { createEventFromCal(startDate, endDate, _name, l === null ? "" : l); });
    return;
  }
  var name = _name;
  if (!name || !name.trim()) return;
  var location = _loc;
  
  var eventData = {
    id: genId(),
    name: name.trim(),
    startDate: startDate,
    endDate: endDate,
    location: location || "",
    members: currentUser ? [currentUser.uid] : [],
    createdBy: currentUser ? currentUser.uid : "local",
    createdAt: fsTimestamp()
  };
  
  // Save to Firestore trips collection
  if (db) {
    db.collection("trips").doc(eventData.id).set(leagueDoc("trips", eventData)).then(function() {
      Router.toast("Event created!");
      // Post to activity feed — single canonical Caddy identity (PB_CADDY).
      postCaddyChat((currentProfile ? PB.getDisplayName(currentProfile) : "Someone") + " created a new event: " + name.trim() + " (" + startDate + " to " + endDate + ")");
      clubCalRangeStart = null;
      clubCalRangeEnd = null;
      clubCalSelectedDate = null;
      refreshClubCal();
    }).catch(function() { Router.toast("Failed to create event"); });
  }
  
  // Also save locally
  PB.addTrip(eventData);
}
