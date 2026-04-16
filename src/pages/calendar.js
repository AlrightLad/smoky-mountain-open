// ========== CALENDAR ==========
// v5.37.5: Restored original design + event creation form + updated dot colors
// Tap a date to browse events. No range selection mode.
// Multi-day events created via form, show as gold dots on each day.

Router.register("calendar", function() {
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var dayLabels = ["S","M","T","W","T","F","S"];
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");
  var _myUid = currentUser ? currentUser.uid : null;

  var h = '<div class="cal-month-header"><button class="cal-nav-btn" onclick="calPrev()">\u2039</button>';
  h += '<div class="cal-month-title">' + monthNames[calMonth] + ' ' + calYear + '</div>';
  h += '<button class="cal-nav-btn" onclick="calNext()">\u203A</button></div>';
  h += '<div class="cal-weekdays">'; dayLabels.forEach(function(d){h += '<div class="cal-weekday">'+d+'</div>';}); h += '</div>';

  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();

  // Build event map
  var eventMap = _calBuildEventMap();

  // Render grid with multi-colored dots
  // Colors: gold=event, green=round, blue=range, pink=tee
  h += '<div class="cal-grid">';
  for (var i=0;i<firstDay;i++) h += '<div class="cal-day empty"></div>';
  for (var d=1;d<=daysInMonth;d++) {
    var ds=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    var isT=ds===todayStr,isS=ds===calSelectedDate;
    var evs=eventMap[ds]||[];
    var bg=isS?"var(--gold)":"transparent";
    var cl=isS?"var(--bg)":isT?"var(--gold)":"var(--cream)";
    var dots=[];
    if(isT&&!isS) dots.push("var(--live)");
    var ht={};
    evs.forEach(function(ev){
      if(ev.type==="event"&&!ht.e){dots.push("var(--gold)");ht.e=1;}
      if(ev.type==="round"&&!ht.r){dots.push("#4CAF50");ht.r=1;}
      if(ev.type==="range"&&!ht.rng){dots.push("var(--blue)");ht.rng=1;}
      if(ev.type==="tee"&&!ht.t){dots.push("var(--pink)");ht.t=1;}
    });
    var dH='';
    if(dots.length===1)dH='<div style="width:4px;height:4px;border-radius:50%;background:'+dots[0]+';margin:1px auto 0"></div>';
    else if(dots.length>1){dH='<div style="display:flex;justify-content:center;gap:2px;margin-top:1px">';dots.slice(0,4).forEach(function(c){dH+='<div style="width:3px;height:3px;border-radius:50%;background:'+c+'"></div>';});dH+='</div>';}
    h+='<div class="cal-day'+(isT?' today':'')+(isS?' selected':'')+'" onclick="selectCalDay(\''+ds+'\')" style="color:'+cl+';background:'+bg+'">'+d+dH+'</div>';
  }
  h += '</div>';

  // Day detail container (updated in-place by _updateCalendarInPlace)
  h += '<div id="cal-day-detail" style="padding:0 16px">';
  if (calSelectedDate && eventMap[calSelectedDate]) {
    h += _renderCalDayDetail(eventMap, calSelectedDate);
  }
  h += '</div>';

  // Action buttons — premium styled, consistent sizing
  h += '<div style="display:flex;gap:10px;padding:12px 16px">';
  h += '<button onclick="Router.go(\'tee-create\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 8px;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;border-radius:var(--radius);color:var(--bg);font:600 11px/1 Inter,sans-serif;cursor:pointer"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>Tee Time</button>';
  h += '<button onclick="showCalEventForm()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 8px;background:linear-gradient(135deg,var(--birdie),#2a7a3e);border:none;border-radius:var(--radius);color:#fff;font:600 11px/1 Inter,sans-serif;cursor:pointer"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15l8-12"/><path d="M4 3l8 4-8 4V3z"/></svg>Event</button>';
  h += '<button onclick="Router.go(\'range\')" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--cream);font:600 11px/1 Inter,sans-serif;cursor:pointer"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="6"/></svg>Range</button>';
  h += '</div>';

  // Event creation form (hidden by default)
  h += '<div id="calEventForm" style="display:none;padding:0 16px 12px">';
  h += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:14px;font-weight:700;color:var(--cream)">New Event</div><button style="background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px 8px" onclick="hideCalEventForm()">\u00d7</button></div>';
  h += '<div class="ff"><label class="ff-label">Event name</label><input class="ff-input" id="calEvName" placeholder="e.g. Weekend Tournament"></div>';
  h += '<div class="ff"><label class="ff-label">Location</label><input class="ff-input" id="calEvLocation" placeholder="e.g. Briarwood Golf Club"></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<div class="ff" style="flex:1"><label class="ff-label">Start date</label><input class="ff-input" type="date" id="calEvStart" value="' + (calSelectedDate || todayStr) + '"></div>';
  h += '<div class="ff" style="flex:1"><label class="ff-label">End date (optional)</label><input class="ff-input" type="date" id="calEvEnd"></div>';
  h += '</div>';
  h += '<div class="ff"><label class="ff-label">Description</label><textarea class="ff-input" id="calEvDesc" placeholder="Details..." rows="2"></textarea></div>';
  h += '<div class="ff"><label class="ff-label">Type</label><select class="ff-input" id="calEvType"><option value="event">Event</option><option value="tournament">Tournament</option><option value="trip">Trip</option><option value="social">Social</option></select></div>';
  h += '<button class="btn full green" onclick="saveCalEvent()" style="margin-top:8px">Create Event</button>';
  h += '</div></div>';

  // Legend
  h += '<div style="display:flex;gap:10px;padding:4px 16px;font-size:9px;color:var(--muted2)">';
  h += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gold);vertical-align:middle;margin-right:3px"></span>Event</span>';
  h += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4CAF50;vertical-align:middle;margin-right:3px"></span>Round</span>';
  h += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--blue);vertical-align:middle;margin-right:3px"></span>Range</span>';
  h += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pink);vertical-align:middle;margin-right:3px"></span>Tee Time</span>';
  h += '<span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--live);vertical-align:middle;margin-right:3px"></span>Today</span>';
  h += '</div>';

  // Upcoming events
  var upcomingEvents = [];
  liveTeeTimes.forEach(function(t) { if (t.status==="cancelled"||t.date<todayStr) return; upcomingEvents.push({date:t.date,title:t.courseName||"Tee Time",time:t.time||"",type:"tee"}); });
  PB.getTrips().forEach(function(trip) { if(!trip.startDate)return; var ed=trip.endDate||trip.startDate; if(trip.startDate>=todayStr||ed>=todayStr) upcomingEvents.push({date:trip.startDate>=todayStr?trip.startDate:todayStr,title:trip.name,time:trip.startDate<=todayStr&&ed>=todayStr?"Happening now":"",type:"trip",tripId:trip.id}); });
  upcomingEvents.sort(function(a,b){return a.date>b.date?1:-1;});
  if (upcomingEvents.length) {
    h += '<div style="padding:8px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Coming Up</div>';
    h += '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px">';
    upcomingEvents.slice(0,5).forEach(function(ev) {
      var dateObj = new Date(ev.date+"T12:00:00");
      var dayDiff = Math.ceil((dateObj-today)/86400000);
      var dayLabel = dayDiff===0?"Today":dayDiff===1?"Tomorrow":monNames[dateObj.getMonth()]+" "+dateObj.getDate();
      var dotColor = ev.type==="trip"?"var(--gold)":"var(--pink)";
      var clickAction = ev.type==="trip"&&ev.tripId ? "Router.go(\'scorecard\',{tripId:\'"+ev.tripId+"\'})" : "Router.go(\'teetimes\')";
      h += '<div onclick="'+clickAction+'" style="flex-shrink:0;min-width:130px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px"><div style="width:5px;height:5px;border-radius:50%;background:'+dotColor+'"></div>';
      h += '<span style="font-size:9px;color:var(--gold);font-weight:600">'+dayLabel+'</span></div>';
      h += '<div style="font-size:11px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(ev.title)+'</div>';
      if (ev.time) h += '<div style="font-size:9px;color:var(--muted);margin-top:2px">'+ev.time+'</div>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  // Scheduling chat
  h += '<div style="padding:8px 16px"><div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Scheduling Chat</div></div>';
  h += '<div id="calChatFeed" style="max-height:300px;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 16px"><div style="text-align:center;font-size:10px;color:var(--muted);padding:20px">Loading...</div></div>';
  h += '<div style="display:flex;gap:8px;padding:8px 16px;border-top:1px solid var(--border)">';
  h += '<input class="ff-input" id="calChatInput" placeholder="Discuss scheduling..." style="flex:1;margin:0;font-size:12px;padding:9px 14px;border-radius:20px" onkeydown="if(event.key===\'Enter\')sendCalChat()">';
  h += '<button style="background:var(--gold);border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0" onclick="sendCalChat()"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--bg)" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>';
  h += '</div>';
  document.querySelector('[data-page="calendar"]').innerHTML = h;

  if (db) {
    leagueQuery("scheduling_chat").orderBy("createdAt","desc").limit(20).get().then(function(snap) {
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

// ── Build event map from all sources ──
function _calBuildEventMap() {
  var eventMap = {};
  var _myUid = currentUser ? currentUser.uid : null;
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function addEv(date, ev) { if (!eventMap[date]) eventMap[date] = []; eventMap[date].push(ev); }

  // Tee times
  liveTeeTimes.forEach(function(t) {
    if (t.status==="cancelled") return;
    var accepted = t.responses ? Object.keys(t.responses).filter(function(k){return t.responses[k]==="accepted"}) : [];
    var names = []; accepted.forEach(function(uid) { var m = PB.getPlayer(uid); if(m) names.push(m.name||m.username||"Member"); });
    addEv(t.date, {type:"tee", title:t.courseName||"Tee Time", time:t.time||"", spots:t.spots||4, accepted:accepted.length, players:names});
  });

  // Trips (multi-day events) — gold dot on each day in range
  PB.getTrips().forEach(function(trip) {
    if (!trip.startDate) return;
    var sd = new Date(trip.startDate+"T12:00:00"), ed = trip.endDate ? new Date(trip.endDate+"T12:00:00") : sd;
    var mN = []; if(trip.members) trip.members.forEach(function(uid){var m=PB.getPlayer(uid);if(m)mN.push(m.name||m.username||"Member");});
    var _sd2=new Date(trip.startDate+"T12:00:00"),_ed2=trip.endDate?new Date(trip.endDate+"T12:00:00"):_sd2;
    var _fmtDates=monNames[_sd2.getMonth()]+" "+_sd2.getDate()+(trip.endDate&&trip.endDate!==trip.startDate?"\u2013"+(_ed2.getMonth()===_sd2.getMonth()?_ed2.getDate():monNames[_ed2.getMonth()]+" "+_ed2.getDate())+", "+_ed2.getFullYear():", "+_sd2.getFullYear());
    for (var dt=new Date(sd); dt<=ed; dt.setDate(dt.getDate()+1)) {
      var ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
      var dayOfWeek = dayNames[dt.getDay()];
      var dayCourses = (trip.courses||[]).filter(function(c) {
        var cd = c.d || ""; return cd.toLowerCase().indexOf(dayOfWeek.toLowerCase()) === 0 || cd.toLowerCase().indexOf(shortDays[dt.getDay()].toLowerCase()) === 0;
      });
      addEv(ds, {type:"event", title:trip.name, location:trip.location||"", dates:_fmtDates, tripId:trip.id, players:mN, dayCourses:dayCourses, champion:trip.champion?(PB.getPlayer(trip.champion)||{}).name:""});
    }
  });

  // User-created calendar events (from Firestore calendar_events collection)
  if (typeof _liveCalEvents !== "undefined") {
    _liveCalEvents.forEach(function(ev) {
      var sd = ev.startDate, ed = ev.endDate || ev.startDate;
      var dStart = new Date(sd + "T12:00:00"), dEnd = new Date(ed + "T12:00:00");
      for (var dt = new Date(dStart); dt <= dEnd; dt.setDate(dt.getDate() + 1)) {
        var ds = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        addEv(ds, { type: "event", title: ev.name || "Event", location: ev.location || "", dates: sd === ed ? sd : sd + " \u2013 " + ed, eventId: ev._id || "" });
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

// ── Render day detail HTML ──
function _renderCalDayDetail(eventMap, ds) {
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var dayEvs = eventMap[ds] || [];
  if (!dayEvs.length) return '';

  var selDate = new Date(ds + "T12:00:00");
  var dh = '<div style="padding:12px 0 4px;font-size:14px;font-weight:700;color:var(--cream)">' + dayNames[selDate.getDay()] + ', ' + monNames[selDate.getMonth()] + ' ' + selDate.getDate() + '</div>';

  var teeEvs = dayEvs.filter(function(e){return e.type==="tee"});
  var eventEvs = dayEvs.filter(function(e){return e.type==="event"});
  var roundEvs = dayEvs.filter(function(e){return e.type==="round"});
  var rangeEvs = dayEvs.filter(function(e){return e.type==="range"});

  // Events
  var seenTitles = {};
  eventEvs.forEach(function(ev) {
    if (seenTitles[ev.title]) return; seenTitles[ev.title] = true;
    var _ck = (ev.dayCourses&&ev.dayCourses.length&&ev.dayCourses[0].key)?ev.dayCourses[0].key:"";
    var _cl = ev.tripId ? "Router.go(\'scorecard\',{tripId:\'"+ev.tripId+"\'" + (_ck?",course:\'"+_ck+"\'":"") + "})" : "";
    dh += '<div style="background:var(--bg3);border-left:3px solid var(--gold);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="'+_cl+'">';
    dh += '<div style="font-size:8px;color:var(--gold);font-weight:700;letter-spacing:.5px;margin-bottom:3px">EVENT</div>';
    dh += '<div style="font-size:13px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
    if (ev.location) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.location) + '</div>';
    if (ev.dates) dh += '<div style="font-size:10px;color:var(--muted)">' + ev.dates + '</div>';
    if (ev.players&&ev.players.length) dh += '<div style="font-size:10px;color:var(--muted);margin-top:3px">' + ev.players.length + ' attending: ' + ev.players.join(", ") + '</div>';
    if (ev.champion) dh += '<div style="font-size:10px;color:var(--gold);margin-top:3px">Champion: ' + escHtml(ev.champion) + '</div>';
    if (ev.dayCourses&&ev.dayCourses.length) {
      ev.dayCourses.forEach(function(dc) {
        dh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px">';
        dh += '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--blue)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>';
        dh += '<span style="font-size:11px;color:var(--blue);font-weight:600">' + escHtml(dc.n||"Course") + '</span>';
        if (dc.f) dh += '<span style="font-size:9px;color:var(--muted2)"> \u00b7 ' + escHtml(dc.f) + '</span>';
        dh += '</div>';
      });
    } else if (ev.tripId) {
      dh += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)"><svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="var(--muted)" stroke-width="1.5" style="vertical-align:middle"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg> No round scheduled \u2014 travel or rest day</div>';
    }
    dh += '</div>';
  });

  // Tee times
  if (!eventEvs.length) {
    teeEvs.forEach(function(ev) {
      dh += '<div style="background:var(--bg3);border-left:3px solid var(--pink);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="Router.go(\'teetimes\')">';
      dh += '<div style="font-size:8px;color:var(--pink);font-weight:700;letter-spacing:.5px;margin-bottom:3px">TEE TIME</div>';
      dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(ev.title) + '</div>';
      if (ev.time) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + ev.time + '</div>';
      if (ev.players&&ev.players.length) dh += '<div style="font-size:10px;color:var(--pink);margin-top:3px">' + ev.accepted + '/' + ev.spots + ' going: ' + ev.players.join(", ") + '</div>';
      dh += '</div>';
    });
  }

  // Rounds grouped by course
  if (roundEvs.length) {
    var cg = {};
    roundEvs.forEach(function(ev) { if (!cg[ev.title]) cg[ev.title] = []; cg[ev.title].push(ev); });
    Object.keys(cg).forEach(function(course) {
      var group = cg[course];
      var boxClick = group.length===1&&group[0].roundId ? ' onclick="Router.go(\'rounds\',{roundId:\''+group[0].roundId+'\'})"' : '';
      dh += '<div style="background:var(--bg3);border-left:3px solid #4CAF50;border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer"'+boxClick+'>';
      dh += '<div style="font-size:8px;color:#4CAF50;font-weight:700;letter-spacing:.5px;margin-bottom:3px">ROUND' + (group.length>1?"S":"") + '</div>';
      dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(course) + '</div>';
      group.forEach(function(r) {
        var sc = r.score<=72?"var(--birdie)":r.score>=100?"var(--red)":"var(--cream)";
        var is9h = r.holesPlayed&&r.holesPlayed<=9;
        var hL = is9h ? (r.holesMode==="back9"?" \u00b7 Back 9":" \u00b7 Front 9") : "";
        var tL = r.tee ? r.tee + " Tees" : "";
        var meta = [tL, hL.replace(" \u00b7 ","")].filter(Boolean).join(" \u00b7 ");
        var isScramble = r.format==="scramble"||r.format==="scramble4";
        var rowClick = group.length>1&&r.roundId ? ' onclick="event.stopPropagation();Router.go(\'rounds\',{roundId:\''+r.roundId+'\'})" style="cursor:pointer;display:flex;justify-content:space-between;padding:3px 0;font-size:11px"' : ' style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px"';
        dh += '<div'+rowClick+'><div><span style="color:var(--muted)">' + escHtml(r.player) + (isScramble?" (Scramble)":"") + '</span>' + (meta?'<span style="color:var(--muted2);font-size:9px"> \u00b7 '+meta+'</span>':'') + '</div><span style="font-weight:600;color:'+sc+'">' + (r.score||"\u2014") + '</span></div>';
      });
      dh += '</div>';
    });
  }

  // Range sessions
  rangeEvs.forEach(function(ev) {
    var rDest = ev.sessionId ? "Router.go(\'range-detail\',{sessionId:\'"+ev.sessionId+"\'})" : "Router.go(\'range\')";
    dh += '<div style="background:var(--bg3);border-left:3px solid var(--blue);border-radius:4px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="'+rDest+'">';
    dh += '<div style="font-size:8px;color:var(--blue);font-weight:700;letter-spacing:.5px;margin-bottom:3px">RANGE SESSION</div>';
    dh += '<div style="font-size:12px;font-weight:600;color:var(--cream)">' + (ev.duration||0) + ' min</div>';
    if (ev.player) dh += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(ev.player) + '</div>';
    dh += '</div>';
  });

  return dh;
}

// ── Simple tap to view — no range mode ──
function calPrev(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}calSelectedDate=null;_updateCalendarInPlace();}
function calNext(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}calSelectedDate=null;_updateCalendarInPlace();}
function selectCalDay(ds){calSelectedDate=(calSelectedDate===ds)?null:ds;_updateCalendarInPlace();}

function _updateCalendarInPlace() {
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var today = new Date();
  var todayStr = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");

  // Update month title
  var titleEl = document.querySelector(".cal-month-title");
  if (titleEl) titleEl.textContent = monthNames[calMonth] + " " + calYear;

  // Rebuild event map
  var eventMap = _calBuildEventMap();

  // Rebuild grid
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  var gridEl = document.querySelector(".cal-grid");
  if (!gridEl) return;
  var gh = '';
  for (var i=0;i<firstDay;i++) gh += '<div class="cal-day empty"></div>';
  for (var d=1;d<=daysInMonth;d++) {
    var ds=calYear+"-"+String(calMonth+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    var isT=ds===todayStr,isS=ds===calSelectedDate;
    var evs=eventMap[ds]||[];
    var bg=isS?"var(--gold)":"transparent";
    var cl=isS?"var(--bg)":isT?"var(--gold)":"var(--cream)";
    var dots=[];
    var ht={};
    evs.forEach(function(ev){
      if(ev.type==="event"&&!ht.e){dots.push("var(--gold)");ht.e=1;}
      if(ev.type==="round"&&!ht.r){dots.push("#4CAF50");ht.r=1;}
      if(ev.type==="range"&&!ht.rng){dots.push("var(--blue)");ht.rng=1;}
      if(ev.type==="tee"&&!ht.t){dots.push("var(--pink)");ht.t=1;}
    });
    var dH='';
    if(dots.length===1)dH='<div style="width:4px;height:4px;border-radius:50%;background:'+dots[0]+';margin:1px auto 0"></div>';
    else if(dots.length>1){dH='<div style="display:flex;justify-content:center;gap:2px;margin-top:1px">';dots.slice(0,4).forEach(function(c){dH+='<div style="width:3px;height:3px;border-radius:50%;background:'+c+'"></div>';});dH+='</div>';}
    gh+='<div class="cal-day'+(isT?' today':'')+(isS?' selected':'')+'" onclick="selectCalDay(\''+ds+'\')" style="color:'+cl+';background:'+bg+'">'+d+dH+'</div>';
  }
  gridEl.innerHTML = gh;

  // Rebuild day detail
  var detailEl = document.getElementById("cal-day-detail");
  if (!detailEl) return;
  if (!calSelectedDate || !eventMap[calSelectedDate]) { detailEl.innerHTML = ''; return; }
  detailEl.innerHTML = _renderCalDayDetail(eventMap, calSelectedDate);
}

// ── Event creation form ──
function showCalEventForm() {
  var form = document.getElementById("calEventForm");
  if (form) form.style.display = "block";
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

  db.collection("calendar_events").add(doc).then(function() {
    Router.toast("Event created!");
    hideCalEventForm();
    // Add to live list and refresh
    if (typeof _liveCalEvents === "undefined") window._liveCalEvents = [];
    _liveCalEvents.push(doc);
    _updateCalendarInPlace();
  }).catch(function(e) { Router.toast("Failed: " + e.message); });
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
// Load on first script execution — will run after Firebase auth resolves
setTimeout(_loadCalendarEvents, 2000);

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
