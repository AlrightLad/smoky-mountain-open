Router.register("chat", function() {
  var h = '';
  
  // Compact upcoming events/calendar strip at the top
  var now = new Date();
  var todayStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
  var upcomingEvents = [];
  
  // Gather next 14 days of events
  liveTeeTimes.forEach(function(t) {
    if (t.status === "cancelled" || t.date < todayStr) return;
    upcomingEvents.push({date: t.date, title: t.courseName || "Tee Time", time: t.time || "", type: "tee", spots: t.spots || 4, responses: t.responses || {}});
  });
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var endDate = trip.endDate || trip.startDate;
    if (trip.startDate >= todayStr || endDate >= todayStr) {
      var displayDate = trip.startDate >= todayStr ? trip.startDate : todayStr;
      var isLive = trip.startDate <= todayStr && endDate >= todayStr;
      upcomingEvents.push({date: displayDate, title: trip.name, time: isLive ? "Happening now" : "", type: "trip", tripId: trip.id, isLive: isLive});
    }
  });
  liveEvents.forEach(function(ev) {
    if (ev.date && ev.date >= todayStr) upcomingEvents.push({date: ev.date, title: ev.title, time: ev.time || "", type: "event"});
  });
  upcomingEvents.sort(function(a,b) { return a.date > b.date ? 1 : -1; });
  upcomingEvents = upcomingEvents.slice(0, 5);
  
  // Header
  h += '<div class="sh"><h2>Clubhouse</h2><button class="btn-sm outline" onclick="toggleClubhouseCal()" id="calToggleBtn" style="font-size:10px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:middle"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Calendar</button></div>';
  
  // Inline expandable calendar
  h += '<div id="clubhouseCal" style="display:none;padding:0 16px 12px;transition:max-height .3s ease">';
  
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayLabels = ["S","M","T","W","T","F","S"];
  
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
  h += '<div onclick="clubCalPrev()" style="cursor:pointer;padding:6px 10px;color:var(--muted);font-size:16px">‹</div>';
  h += '<div id="clubCalTitle" style="font-size:13px;font-weight:600;color:var(--gold)">' + monthNames[calMonth] + ' ' + calYear + '</div>';
  h += '<div onclick="clubCalNext()" style="cursor:pointer;padding:6px 10px;color:var(--muted);font-size:16px">›</div></div>';
  h += '<div style="text-align:right;padding:0 4px 6px"><button id="calRangeModeBtn" onclick="toggleCalRangeMode()" style="background:transparent;border:1px solid var(--border);color:var(--muted);font:500 9px/1 Inter,sans-serif;padding:4px 10px;border-radius:4px;cursor:pointer;letter-spacing:.3px">' + (calRangeMode ? '× Cancel Range' : 'Select Range') + '</button></div>';
  
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;margin-bottom:4px">';
  dayLabels.forEach(function(d) { h += '<div style="font-size:9px;color:var(--muted2);padding:4px 0">' + d + '</div>'; });
  h += '</div>';
  
  h += '<div id="clubCalGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">';
  h += renderClubCalGrid(calYear, calMonth, todayStr, upcomingEvents);
  h += '</div>';
  
  h += '<div id="clubCalEvents" style="margin-top:8px"></div>';
  h += '</div>';
  
  // Upcoming events strip
  if (upcomingEvents.length) {
    h += '<div style="padding:0 16px 12px">';
    h += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Coming Up</div>';
    h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
    upcomingEvents.forEach(function(ev) {
      var dateObj = new Date(ev.date + "T12:00:00");
      var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var dayDiff = Math.ceil((dateObj - now) / 86400000);
      var dayLabel = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : days[dateObj.getDay()];
      var dotColor = ev.type === "trip" ? "var(--gold)" : ev.type === "tee" ? "var(--birdie)" : "var(--muted)";
      var accepted = ev.responses ? Object.keys(ev.responses).filter(function(k){return ev.responses[k]==="accepted"}).length : 0;
      
      var clickAction = ev.type === "trip" && ev.tripId ? "Router.go('scorecard',{tripId:'" + ev.tripId + "'})" : "Router.go('teetimes')";
      h += '<div onclick="' + clickAction + '" style="flex-shrink:0;min-width:140px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:6px;height:6px;border-radius:50%;background:' + dotColor + '"></div>';
      h += '<span style="font-size:10px;color:var(--gold);font-weight:600">' + dayLabel + ', ' + mons[dateObj.getMonth()] + ' ' + dateObj.getDate() + '</span></div>';
      h += '<div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(ev.title) + '</div>';
      if (ev.time) h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.time + (ev.spots ? ' · ' + accepted + '/' + ev.spots : '') + '</div>';
      h += '</div>';
    });
    h += '</div></div>';
  } else {
    h += '<div style="padding:0 16px 12px"><div style="padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);text-align:center">';
    h += '<div style="font-size:11px;color:var(--muted)">No upcoming events</div>';
    h += '<div style="font-size:10px;color:var(--gold);margin-top:4px;cursor:pointer" onclick="Router.go(\'tee-create\')">Post a tee time →</div>';
    h += '</div></div>';
  }
  
  // Chat feed
  h += '<div style="margin:0 16px 6px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Trash Talk</div></div>';
  h += '<div id="chatFeed" class="section" style="max-height:55vh;overflow-y:auto">' + skeletonFeed() + '</div>';
  h += '<div class="chat-input-row"><input type="text" id="chatInput" placeholder="Talk trash..." onkeydown="if(event.key===\'Enter\')sendChat()"><button onclick="sendChat()">Send</button></div>';
  document.querySelector('[data-page="chat"]').innerHTML = h;

  // Start listener
  if (db) {
    if (window._chatFeedUnsub) window._chatFeedUnsub();
    window._chatFeedUnsub = leagueQuery("chat").orderBy("createdAt","desc").limit(50).onSnapshot(function(snap) {
      liveChat = [];
      snap.forEach(function(doc){
        var d = doc.data();
        // Filter out auto-generated system messages — clubhouse is for human conversation only
        if (d.authorId === "system" || d.system) return;
        if (d.authorName === "Parbaughs" || d.authorName === "The Caddy") return;
        if (d.isStory) return; // post-round stories go to activity feed, not chat
        liveChat.push(Object.assign({_docId:doc.id}, d));
      });
      // Keep newest-first order (no reverse)
      var feed = document.getElementById("chatFeed");
      if (feed && Router.getPage() === "chat") {
        feed.innerHTML = renderChatMessages(liveChat);
      }
    });
  }
});

var clubCalOpen = false;
var clubCalSelectedDate = null;
var clubCalRangeStart = null;
var clubCalRangeEnd = null;
var calRangeMode = false;

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
    var eh = '<div style="font-size:11px;font-weight:600;color:var(--cream);margin-bottom:6px">' + monNames[sd.getMonth()] + ' ' + sd.getDate() + ' — ' + monNames[ed.getMonth()] + ' ' + ed.getDate() + ' (' + days + ' days)</div>';
    
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
        eh += '<div style="background:var(--bg3);border-left:3px solid var(--gold);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="' + _evClick + '">';
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
          eh += '<div style="font-size:10px;color:var(--muted)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--muted)" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> No round scheduled — travel or rest day</div>';
          eh += '</div>';
        }
        eh += '</div>';
      });
      
      // Tee times (blue) — only show standalone if no events on this day
      if (!eventEvs.length) {
        teeEvs.forEach(function(ev) {
        eh += '<div style="background:var(--bg3);border-left:3px solid var(--blue);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="Router.go(\'teetimes\')">';
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
          var boxClick = group.length === 1 && group[0].roundId ? ' onclick="Router.go(\'rounds\',{roundId:\'' + group[0].roundId + '\'})" style="background:var(--bg3);border-left:3px solid var(--purple);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer"' : ' style="background:var(--bg3);border-left:3px solid var(--purple);border-radius:4px;padding:10px 12px;margin-bottom:6px"';
          eh += '<div' + boxClick + '>';
          eh += '<div style="font-size:8px;color:var(--purple);font-weight:700;letter-spacing:.5px;margin-bottom:3px">ROUND' + (group.length > 1 ? 'S' : '') + '</div>';
          eh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(course) + '</div>';
          group.forEach(function(r) {
            var scoreColor = r.score <= 72 ? "var(--birdie)" : r.score >= 100 ? "var(--red)" : "var(--cream)";
            var is9h = r.holesPlayed && r.holesPlayed <= 9;
            var hLabel = is9h ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
            var tLabel = r.tee ? r.tee + " Tees" : "";
            var meta = [tLabel, hLabel.replace(" · ","")].filter(Boolean).join(" · ");
            // Individual row click only when multiple rounds grouped
            var rowClick = group.length > 1 && r.roundId ? ' onclick="event.stopPropagation();Router.go(\'rounds\',{roundId:\'' + r.roundId + '\'})" style="cursor:pointer;display:flex;justify-content:space-between;padding:3px 0;font-size:11px"' : ' style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"';
            eh += '<div' + rowClick + '><div><span style="color:var(--muted)">' + escHtml(r.player) + '</span>' + (meta ? '<span style="color:var(--muted2);font-size:9px"> · ' + meta + '</span>' : '') + '</div><span style="font-weight:600;color:' + scoreColor + '">' + (r.score || "—") + '</span></div>';
          });
          eh += '</div>';
        });
      }
      
      // Range sessions (pink)
      if (rangeEvs.length) {
        rangeEvs.forEach(function(ev) {
          eh += '<div style="background:var(--bg3);border-left:3px solid var(--pink);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="rangeActiveView=\'range\';Router.go(\'activity\')">';
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
function createEventFromCal(startDate, endDate) {
  var name = prompt("Event name:");
  if (!name || !name.trim()) return;
  var location = prompt("Location (optional):", "");
  
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
    db.collection("trips").doc(eventData.id).set(eventData).then(function() {
      Router.toast("Event created!");
      // Post to activity feed
      db.collection("chat").add(leagueDoc("chat", {
        id: genId(),
        text: (currentProfile ? PB.getDisplayName(currentProfile) : "Someone") + " created a new event: " + name.trim() + " (" + startDate + " to " + endDate + ")",
        authorId: "system",
        authorName: "Parbaughs",
        createdAt: fsTimestamp()
      }))(function(){});
      clubCalRangeStart = null;
      clubCalRangeEnd = null;
      clubCalSelectedDate = null;
      refreshClubCal();
    }).catch(function() { Router.toast("Failed to create event"); });
  }
  
  // Also save locally
  PB.addTrip(eventData);
}

function renderChatMessages(messages) {
  if (!messages.length) return '<div class="card"><div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--muted)"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-text">No messages yet. Start the trash talk.</div></div></div>';
  
  var ch = '';
  messages.forEach(function(msg) {
    var m = PB.getPlayer(msg.authorId);
    var mLvl = m ? PB.getPlayerLevel(m.id) : null;
    var likes = msg.likes || [];
    var likeCount = likes.length;
    var iLiked = currentUser && likes.indexOf(currentUser.uid) !== -1;
    var comments = msg.comments || [];
    var isCommissioner = currentProfile && currentProfile.role === "commissioner";
    var isMine = currentUser && msg.authorId === currentUser.uid;
    
    ch += '<div class="card" style="margin-bottom:6px"><div style="padding:10px 14px">';
    // Header
    var isSystem = msg.authorId === "system";
    ch += '<div style="display:flex;gap:10px">';
    ch += (isSystem ? '<div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:rgba(var(--birdie-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:16px">⛳</span></div>' : renderAvatar(m, 32, true));
    ch += '<div style="flex:1"><div class="chat-author"' + (isSystem ? ' style="color:var(--birdie)"' : '') + '>' + escHtml((msg.system ? "The Caddy" : msg.authorName || msg.user || "Member")) + (mLvl && !isSystem ? ' <span style="font-size:8px;color:var(--gold);font-weight:600">LV' + mLvl.level + '</span>' : '') + '</div>';
    ch += '<div class="chat-text">' + escHtml(msg.text) + '</div>';
    if (msg.createdAt && msg.createdAt.toDate) {
      var _d = msg.createdAt.toDate();
      var _mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var _hr = _d.getHours(), _ampm = _hr >= 12 ? "PM" : "AM";
      _hr = _hr % 12 || 12;
      var _min = String(_d.getMinutes()).padStart(2,"0");
      ch += '<div class="chat-time">' + _mn[_d.getMonth()] + ' ' + _d.getDate() + ', ' + _d.getFullYear() + ' · ' + _hr + ':' + _min + ' ' + _ampm + '</div>';
    }
    ch += '</div></div>';
    
    // Like + Comment + Reply bar
    ch += '<div style="display:flex;gap:14px;margin-top:8px;padding-top:6px;border-top:1px solid var(--border)">';
    ch += '<span style="font-size:11px;cursor:pointer;color:' + (iLiked ? 'var(--gold)' : 'var(--muted)') + ';padding:4px 0;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation();toggleLike(\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="' + (iLiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>' + (likeCount ? ' ' + likeCount : '') + '</span>';
    ch += '<span style="font-size:11px;cursor:pointer;color:var(--muted);padding:4px 0;display:flex;align-items:center;gap:3px" onclick="event.stopPropagation();showCommentInput(\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10a1.5 1.5 0 01-1.5 1.5H5L2 14V3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5z"/></svg>' + (comments.length ? ' ' + comments.length : '') + '</span>';
    if (isCommissioner || isMine) {
      ch += '<span id="del-' + msg._docId + '" style="font-size:11px;cursor:pointer;color:var(--muted2);margin-left:auto;padding:4px 0;display:flex;align-items:center" onclick="event.stopPropagation();confirmDelete(this,\'' + msg._docId + '\')"><svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></span>';
    }
    ch += '</div>';
    
    // Comments
    if (comments.length) {
      ch += '<div style="margin-top:6px;padding-top:4px">';
      var commentLikes = msg.commentLikes || {};
      comments.forEach(function(c, ci) {
        var canDeleteComment = (currentUser && c.uid === currentUser.uid) || isCommissioner;
        var cLikes = commentLikes[String(ci)] || [];
        var cILiked = currentUser && cLikes.indexOf(currentUser.uid) !== -1;
        var cAt = c.at ? new Date(c.at) : null;
        var cTimeStr = "";
        if (cAt) {
          var _cmn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          var _chr = cAt.getHours(), _camp = _chr >= 12 ? "PM" : "AM";
          _chr = _chr % 12 || 12;
          cTimeStr = _cmn[cAt.getMonth()] + " " + cAt.getDate() + " · " + _chr + ":" + String(cAt.getMinutes()).padStart(2,"0") + " " + _camp;
        }
        ch += '<div style="padding:4px 0;font-size:11px">';
        ch += '<div style="display:flex;gap:6px;align-items:flex-start">';
        ch += '<span style="color:var(--gold);font-weight:600;flex-shrink:0">' + escHtml(c.name||"Anon") + '</span>';
        ch += '<span style="color:var(--cream);flex:1">' + escHtml(c.text) + '</span>';
        ch += '</div>';
        // Comment actions: timestamp, like, reply, delete
        ch += '<div style="display:flex;gap:12px;margin-top:3px;padding:2px 0">';
        if (cTimeStr) ch += '<span style="font-size:9px;color:var(--muted2)">' + cTimeStr + '</span>';
        ch += '<span style="font-size:9px;cursor:pointer;padding:2px 4px;color:' + (cILiked ? 'var(--gold)' : 'var(--muted2)') + ';display:flex;align-items:center;gap:2px" onclick="event.stopPropagation();toggleCommentLike(\'' + msg._docId + '\',' + ci + ')"><svg viewBox="0 0 16 16" width="9" height="9" fill="' + (cILiked ? 'var(--gold)' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>' + (cLikes.length ? ' ' + cLikes.length : '') + '</span>';
        ch += '<span style="font-size:9px;cursor:pointer;padding:2px 4px;color:var(--muted2);display:flex;align-items:center;gap:2px" onclick="event.stopPropagation();replyToComment(\'' + msg._docId + '\',\'' + escHtml((c.name||"Anon").replace(/'/g,"\\'")) + '\')"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8L2 11V5.5A1.5 1.5 0 013.5 4h9A1.5 1.5 0 0114 5.5v4a1.5 1.5 0 01-1.5 1.5H7z"/></svg> Reply</span>';
        if (canDeleteComment) {
          ch += '<span style="color:var(--muted2);cursor:pointer;font-size:9px" onclick="event.stopPropagation();confirmDeleteComment(this,\'' + msg._docId + '\',' + ci + ')"><svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></span>';
        }
        ch += '</div>';
        ch += '</div>';
      });
      ch += '</div>';
    }
    
    // Comment input area (hidden by default)
    ch += '<div id="comment-' + msg._docId + '" style="display:none;margin-top:6px;gap:6px">';
    ch += '<input type="text" class="ff-input" style="flex:1;padding:6px 10px;font-size:11px" id="commentText-' + msg._docId + '" placeholder="Add a comment..." onkeydown="if(event.key===\'Enter\')submitComment(\'' + msg._docId + '\')">';
    ch += '<button class="btn-sm green" style="font-size:10px;padding:6px 10px" onclick="submitComment(\'' + msg._docId + '\')">Post</button>';
    ch += '</div>';
    
    ch += '</div></div>';
  });
  return ch;
}

function toggleLike(docId) {
  if (!db || !currentUser) { Router.toast("Sign in to like"); return; }
  var uid = currentUser.uid;
  
  // Optimistic UI update — update local data immediately
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  if (localMsg) {
    if (!localMsg.likes) localMsg.likes = [];
    var localIdx = localMsg.likes.indexOf(uid);
    if (localIdx !== -1) localMsg.likes.splice(localIdx, 1);
    else localMsg.likes.push(uid);
    // Re-render feed immediately
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
  }
  
  // Then sync to Firestore
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var likes = data.likes || [];
    var idx = likes.indexOf(uid);
    var isLiking = idx === -1;
    if (idx !== -1) { likes.splice(idx, 1); } else { likes.push(uid); }
    db.collection("chat").doc(docId).update({ likes: likes }).then(function() {
      if (isLiking && data.authorId && data.authorId !== uid && data.authorId !== "system") {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        sendNotification(data.authorId, {
          type: "feed_like",
          title: "New Like",
          message: myName + " liked your post",
          linkPage: "chat"
        });
      }
    });
  });
}

function showCommentInput(docId, isReply) {
  // Close all other open comment inputs
  document.querySelectorAll('[id^="comment-"]').forEach(function(el) {
    if (el.id.indexOf("commentText") !== -1) return;
    if (el.id !== "comment-" + docId) {
      el.style.display = "none";
      var inp = el.querySelector("input");
      if (inp) inp.value = "";
    }
  });
  var el = document.getElementById("comment-" + docId);
  if (!el) return;
  var isHidden = el.style.display === "none" || el.style.display === "";
  el.style.display = isHidden ? "flex" : "none";
  if (isHidden) {
    var input = document.getElementById("commentText-" + docId);
    if (input) {
      if (!isReply) input.value = "";
      input.focus();
    }
  }
}

function submitComment(docId) {
  if (!db || !currentUser) { Router.toast("Sign in to comment"); return; }
  var input = document.getElementById("commentText-" + docId);
  var text = input ? input.value.trim() : "";
  if (!text) return;

  var name = currentProfile ? PB.getDisplayName(currentProfile) : "Anon";
  var newComment = { uid: currentUser.uid, name: name, text: text, at: new Date().toISOString() };

  // Optimistic local update — append comment to liveChat immediately so it renders before Firestore roundtrip
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  if (localMsg) {
    if (!localMsg.comments) localMsg.comments = [];
    localMsg.comments.push(newComment);
    // Re-render feed in-place with updated data
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
    // Re-show the comment input and scroll to it
    var commentEl = document.getElementById("comment-" + docId);
    if (commentEl) { commentEl.style.display = "flex"; }
    var newInput = document.getElementById("commentText-" + docId);
    if (newInput) { newInput.value = ""; newInput.focus(); }
  } else if (input) {
    input.value = "";
  }

  // Write to Firestore (snapshot listener will reconcile if needed)
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var comments = data.comments || [];
    comments.push(newComment);
    return db.collection("chat").doc(docId).update({ comments: comments }).then(function() {
      // Notify post author
      if (data.authorId && data.authorId !== currentUser.uid && data.authorId !== "system") {
        sendNotification(data.authorId, {
          type: "feed_comment",
          title: "New Comment",
          message: name + " commented: \"" + text.substring(0, 40) + (text.length > 40 ? "..." : "") + "\"",
          linkPage: "chat"
        });
      }
      // Notify other commenters
      var notified = {};
      notified[currentUser.uid] = true;
      if (data.authorId) notified[data.authorId] = true;
      comments.forEach(function(c) {
        if (c.uid && !notified[c.uid]) {
          notified[c.uid] = true;
          sendNotification(c.uid, {
            type: "feed_reply",
            title: "New Reply",
            message: name + " also commented on a post you commented on",
            linkPage: "chat"
          });
        }
      });
    });
  });
}

function toggleCommentLike(docId, commentIdx) {
  if (!db || !currentUser) { Router.toast("Sign in to like"); return; }
  var uid = currentUser.uid;
  
  // Optimistic update
  var localMsg = liveChat.find(function(m) { return m._docId === docId; });
  if (localMsg) {
    if (!localMsg.commentLikes) localMsg.commentLikes = {};
    var key = String(commentIdx);
    if (!localMsg.commentLikes[key]) localMsg.commentLikes[key] = [];
    var idx = localMsg.commentLikes[key].indexOf(uid);
    if (idx !== -1) localMsg.commentLikes[key].splice(idx, 1);
    else localMsg.commentLikes[key].push(uid);
    var feed = document.getElementById("chatFeed");
    if (feed) feed.innerHTML = renderChatMessages(liveChat);
  }
  
  // Sync to Firestore
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var commentLikes = data.commentLikes || {};
    var key = String(commentIdx);
    if (!commentLikes[key]) commentLikes[key] = [];
    var idx = commentLikes[key].indexOf(uid);
    if (idx !== -1) commentLikes[key].splice(idx, 1);
    else commentLikes[key].push(uid);
    db.collection("chat").doc(docId).update({ commentLikes: commentLikes }).then(function() {
      // Notify comment author
      var comments = data.comments || [];
      if (comments[commentIdx] && comments[commentIdx].uid && comments[commentIdx].uid !== uid) {
        var myName = currentProfile ? PB.getDisplayName(currentProfile) : "Someone";
        sendNotification(comments[commentIdx].uid, {
          type: "comment_like",
          title: "Comment Liked",
          message: myName + " liked your comment",
          linkPage: "chat"
        });
      }
    });
  });
}

function replyToComment(docId, commentAuthor) {
  // Close other inputs first
  document.querySelectorAll('[id^="comment-"]').forEach(function(el) {
    if (el.id.indexOf("commentText") !== -1) return;
    if (el.id !== "comment-" + docId) el.style.display = "none";
  });
  var el = document.getElementById("comment-" + docId);
  if (!el) return;
  // Toggle: if already open, close it
  if (el.style.display === "flex") {
    el.style.display = "none";
    return;
  }
  el.style.display = "flex";
  var input = document.getElementById("commentText-" + docId);
  if (input) {
    input.value = "@" + commentAuthor + " ";
    input.focus();
    var len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function confirmDelete(el, docId) {
  if (el.dataset.armed === "true") {
    deleteChat(docId);
    return;
  }
  el.dataset.armed = "true";
  el.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--alert)" stroke-width="1.5"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5"/><path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10"/></svg>';
  el.style.color = "var(--alert)";
  // Reset after 3 seconds if not tapped
  setTimeout(function() { 
    if (el) { el.dataset.armed = "false"; el.textContent = "×"; el.style.color = "var(--muted2)"; }
  }, 3000);
}

function confirmDeleteComment(el, docId, commentIndex) {
  if (el.dataset.armed === "true") {
    deleteComment(docId, commentIndex);
    return;
  }
  el.dataset.armed = "true";
  el.innerHTML = '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--alert)" stroke-width="1.5"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5"/><path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10"/></svg>';
  el.style.color = "var(--alert)";
  setTimeout(function() {
    if (el) { el.dataset.armed = "false"; el.textContent = "×"; el.style.color = "var(--muted2)"; }
  }, 3000);
}

function deleteComment(docId, commentIndex) {
  if (!db || !currentUser) return;
  db.collection("chat").doc(docId).get().then(function(doc) {
    if (!doc.exists) return;
    var data = doc.data();
    var comments = data.comments || [];
    if (commentIndex >= 0 && commentIndex < comments.length) {
      comments.splice(commentIndex, 1);
      db.collection("chat").doc(docId).update({ comments: comments });
    }
  });
}

function deleteChat(docId) {
  if (!db) return;
  if (!confirm("Delete this post?")) return;
  db.collection("chat").doc(docId).delete().then(function() { Router.toast("Deleted"); });
}

function sendChat() {
  var input = document.getElementById("chatInput"); var text = input.value.trim();
  if (!text || !db) return;
  db.collection("chat").add(leagueDoc("chat", { id:genId(), text:text, authorId:currentUser?currentUser.uid:"anon", authorName:currentProfile?PB.getDisplayName(currentProfile):"Anon", createdAt:fsTimestamp() }))
    .then(function(){input.value=""}).catch(function(){Router.toast("Failed to send")});
}

