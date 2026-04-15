/* ================================================
   PAGE: COURSES
   ================================================ */
Router.register("courses", function(params) {
  if (params.add) { renderAddCourseForm(); return; }
  if (params.id) { renderCourseDetail(params.id); return; }
  var courses = PB.getCourses();
  var h = '<div class="sh"><h2>Course directory</h2><div style="display:flex;gap:8px"><button class="back" onclick="Router.back(\'records\')">← Back</button><button class="btn-sm green" onclick="promptAddCourse()">+ Add</button></div></div>';
  
  // Search filter
  h += '<div style="padding:0 16px 10px"><input type="text" class="ff-input" id="dir-search" placeholder="Search courses..." style="font-size:12px" oninput="filterCourseDirectory(this.value)"></div>';
  
  // API results container (above local list)
  h += '<div id="dir-api-results"></div>';
  // Manual add prompt
  h += '<div id="dir-manual-add" style="display:none"></div>';
  
  courses.forEach(function(c) {
    var roundsHere = PB.getCourseRounds(c.name);
    var stars = c.reviews && c.reviews.length ? Math.round(c.reviews.reduce(function(a, r) { return a + r.rating; }, 0) / c.reviews.length * 10) / 10 : null;
    
    // Compute best scores from ALL sources:
    // F9 = best of: standalone front9 rounds OR front half of any 18-hole round
    // B9 = best of: standalone back9 rounds OR back half of any 18-hole round
    // 18 = best of: ONLY full 18-hole rounds (never combine standalone F9+B9)
    var bestF9 = null, bestB9 = null, best18 = null;
    var indivRounds = roundsHere.filter(function(r) { return r.format !== "scramble" && r.format !== "scramble4" && r.score; });
    indivRounds.forEach(function(r) {
      var is9 = r.holesPlayed && r.holesPlayed <= 9;
      if (is9) {
        // Standalone 9-hole round
        if (r.holesMode === "back9") { if (bestB9 === null || r.score < bestB9) bestB9 = r.score; }
        else { if (bestF9 === null || r.score < bestF9) bestF9 = r.score; }
      } else {
        // Full 18-hole round
        if (best18 === null || r.score < best18) best18 = r.score;
        // Also extract front/back splits from 18-hole rounds
        var frontScore = null, backScore = null;
        // Check for explicit frontScore/backScore fields
        if (r.frontScore) frontScore = r.frontScore;
        if (r.backScore) backScore = r.backScore;
        // Otherwise derive from hole-by-hole scores
        if (frontScore === null || backScore === null) {
          var hScores = r.holeScores || [];
          if (hScores.length >= 18) {
            var fs = 0, bs = 0, fValid = true, bValid = true;
            for (var si = 0; si < 9; si++) { var v = parseInt(hScores[si]); if (v > 0) fs += v; else fValid = false; }
            for (var si2 = 9; si2 < 18; si2++) { var v2 = parseInt(hScores[si2]); if (v2 > 0) bs += v2; else bValid = false; }
            if (fValid && fs > 0 && frontScore === null) frontScore = fs;
            if (bValid && bs > 0 && backScore === null) backScore = bs;
          }
        }
        if (frontScore !== null && (bestF9 === null || frontScore < bestF9)) bestF9 = frontScore;
        if (backScore !== null && (bestB9 === null || backScore < bestB9)) bestB9 = backScore;
      }
    });
    
    h += '<div class="card course-dir-item" data-name="' + escHtml(c.name.toLowerCase()) + '" data-loc="' + escHtml((c.loc||"").toLowerCase()) + '" onclick="Router.go(\'courses\',{id:\'' + c.id + '\'})">';
    var thumbSrc = photoCache["course:" + c.id] || c.photo || '';
    h += '<div class="course-row"><div class="c-thumb">' + (thumbSrc ? '<img alt="" src="' + thumbSrc + '" onerror="this.src=COURSE_DEFAULT_IMG">' : '<img alt="" src="' + COURSE_DEFAULT_IMG + '">') + '</div>';
    h += '<div class="c-info"><div class="c-name">' + c.name + '</div><div class="c-loc">' + c.loc + ' · ' + c.rating + '/' + c.slope + '</div>';
    h += '<div class="c-meta">' + (stars ? '' + stars + '/5 · ' : '') + roundsHere.length + ' round' + (roundsHere.length !== 1 ? 's' : '') + '</div>';
    // Best scores — always show all 3 columns, "--" for missing
    if (indivRounds.length) {
      var f9Display = bestF9 !== null ? '<span style="color:var(--cream);font-weight:600">' + bestF9 + '</span>' : '<span style="color:var(--muted2)">--</span>';
      var b9Display = bestB9 !== null ? '<span style="color:var(--cream);font-weight:600">' + bestB9 + '</span>' : '<span style="color:var(--muted2)">--</span>';
      var fullDisplay = best18 !== null ? '<span style="color:var(--gold);font-weight:700">' + best18 + '</span>' : '<span style="color:var(--muted2)">--</span>';
      h += '<div style="font-size:10px;margin-top:3px;display:flex;gap:10px">';
      h += '<span><span style="color:var(--muted);font-size:9px">F9</span> ' + f9Display + '</span>';
      h += '<span><span style="color:var(--muted);font-size:9px">B9</span> ' + b9Display + '</span>';
      h += '<span><span style="color:var(--muted);font-size:9px">18</span> ' + fullDisplay + '</span>';
      h += '</div>';
    }
    h += '</div></div></div>';
  });
  h += '<div style="text-align:center;padding:12px;font-size:10px;color:var(--muted2)">' + courses.length + ' courses</div>';
  document.querySelector('[data-page="courses"]').innerHTML = h;
});

var _dirSearchTimer = null;
function filterCourseDirectory(val) {
  var q = val.toLowerCase().trim();
  var visibleCount = 0;
  document.querySelectorAll(".course-dir-item").forEach(function(el) {
    var name = el.getAttribute("data-name") || "";
    var loc = el.getAttribute("data-loc") || "";
    var show = !q || name.indexOf(q) !== -1 || loc.indexOf(q) !== -1;
    el.style.display = show ? "" : "none";
    if (show) visibleCount++;
  });
  
  // Show manual add option when filtering
  var manualEl = document.getElementById("dir-manual-add");
  if (manualEl && q.length >= 2) {
    var exactMatch = PB.getCourseByName(val.trim());
    if (!exactMatch) {
      manualEl.style.display = "block";
      manualEl.innerHTML = '<div style="padding:0 16px 8px"><div class="card" style="cursor:pointer" onclick="quickAddCourseFromDir(\'' + escHtml(val.trim()).replace(/'/g, "\\'") + '\')"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:var(--cream)">' + escHtml(val.trim()) + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Not in directory — tap to add manually</div></div><div style="font-size:10px;color:var(--gold);font-weight:600">+ Add</div></div></div></div>';
    } else {
      manualEl.style.display = "none";
    }
  } else if (manualEl) {
    manualEl.style.display = "none";
  }
  
  // API search after debounce
  var apiEl = document.getElementById("dir-api-results");
  var apiKey = localStorage.getItem("golfcourse_api_key");
  if (apiKey && q.length >= 3) {
    clearTimeout(_dirSearchTimer);
    _dirSearchTimer = setTimeout(function() {
      if (apiEl) apiEl.innerHTML = '<div style="padding:4px 16px;font-size:9px;color:var(--muted2)">Searching online...</div>';
      _searchGcApiForDirectory(q);
    }, 500);
  } else if (apiEl) {
    apiEl.innerHTML = "";
  }
}

function _searchGcApiForDirectory(query) {
  var apiKey = localStorage.getItem("golfcourse_api_key");
  if (!apiKey) return;
  var apiEl = document.getElementById("dir-api-results");
  if (!apiEl) return;
  
  var cacheKey = "dir_" + query.toLowerCase();
  if (_gcSearchCache[cacheKey]) { _renderDirApiResults(_gcSearchCache[cacheKey], apiEl, query); return; }
  
  var fetchUrl = "https://us-central1-parbaughs.cloudfunctions.net/searchCourses?q=" + encodeURIComponent(query) + "&key=" + encodeURIComponent(apiKey);
  
  fetch(fetchUrl)
  .then(function(res) { if (!res.ok) throw new Error(res.status); return res.json(); })
  .then(function(data) {
    var courses = Array.isArray(data) ? data : (data.courses || data.results || data.data || data.items || []);
    _gcSearchCache[cacheKey] = courses.slice(0, 10);
    _renderDirApiResults(_gcSearchCache[cacheKey], apiEl, query);
  })
  .catch(function() {
    if (apiEl) apiEl.innerHTML = '<div style="padding:4px 16px;font-size:9px;color:var(--muted2)">Online search unavailable</div>';
  });
}

function _renderDirApiResults(courses, el, query) {
  if (!el) return;
  var filtered = courses.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  if (!filtered.length) { el.innerHTML = ""; return; }
  var h = '<div style="padding:4px 16px 2px;font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.5px;font-weight:700">Online Results</div>';
  filtered.forEach(function(c, idx) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
    var city = (c.location && typeof c.location === "object" ? c.location.city : c.city) || "";
    var state = (c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "";
    var loc = [city, state].filter(Boolean).join(", ");
    var td = _extractTeeData(c);
    var par = td.par || "";
    var rating = td.rating || "";
    var slope = td.slope || "";
    h += '<div class="card" style="margin:0 16px 6px;cursor:pointer" onclick="importDirApiCourse(' + idx + ')">';
    h += '<div class="card-body" style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div><div style="font-size:12px;font-weight:600;color:var(--cream)">' + escHtml(name) + '</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + escHtml(loc) + (par ? ' · Par ' + par : '') + (rating ? ' · ' + rating + '/' + slope : '') + '</div></div>';
    h += '<div style="font-size:9px;color:var(--birdie);font-weight:600;white-space:nowrap">+ Import</div>';
    h += '</div></div>';
  });
  el.innerHTML = h;
}

var _dirApiFiltered = [];
function _extractTeeData(c) {
  var t = (c.tees && c.tees.male) || [];
  var w = t.find(function(x){return x.tee_name && x.tee_name.indexOf("White")>-1}) || t.find(function(x){return x.tee_name && x.tee_name.indexOf("Silver")>-1}) || t[1] || t[0] || {};
  var holes = (w.holes || []).map(function(h){ return {par:h.par, yardage:h.yardage, handicap:h.handicap}; });
  // All tees for storage
  var allTees = t.map(function(tee) {
    return {
      name: tee.tee_name || "Unknown",
      rating: tee.course_rating || 0,
      slope: tee.slope_rating || 0,
      par: tee.par_total || 0,
      yards: tee.total_yards || 0,
      holes: (tee.holes || []).map(function(h){ return {par:h.par, yardage:h.yardage, handicap:h.handicap}; })
    };
  });
  return { rating: w.course_rating || 0, slope: w.slope_rating || 0, par: w.par_total || 0, tee: w.tee_name || "", yards: w.total_yards || 0, holes: holes, allTees: allTees };
}

function importDirApiCourse(idx) {
  var cacheKeys = Object.keys(_gcSearchCache).filter(function(k){return k.indexOf("dir_")===0});
  var lastResults = cacheKeys.length ? _gcSearchCache[cacheKeys[cacheKeys.length - 1]] : [];
  var filtered = lastResults.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  var c = filtered[idx];
  if (!c) return;
  var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
  var city = (c.location && typeof c.location === "object" ? c.location.city : c.city) || "";
  var st = (c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "";
  var loc = [city, st].filter(Boolean).join(", ");
  var td = _extractTeeData(c);
  var lat = (c.location && c.location.latitude) || 0;
  var lng = (c.location && c.location.longitude) || 0;
  var course = PB.addCourse({ name: name, loc: loc, region: st || "US", rating: td.rating || 72, slope: td.slope || 113, par: td.par || 72, tee: td.tee, yards: td.yards, holes: td.holes, allTees: td.allTees, lat: lat, lng: lng, source: "golfcourseapi" });
  if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:loc,region:st||"US",rating:td.rating||72,slope:td.slope||113,par:td.par||72,tee:td.tee,yards:td.yards,holes:td.holes,allTees:td.allTees,lat:lat,lng:lng,source:"golfcourseapi",createdAt:fsTimestamp()}).catch(function(){});
  Router.toast(name + " imported");
  Router.go("courses");
}

function quickAddCourseFromDir(name) {
  var state = prompt("State (e.g. VA, PA, NC):", "");
  if (state === null) return;
  state = (state||"").trim().toUpperCase().substring(0, 2);
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  var course = PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
  if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
  Router.toast(name + " added");
  Router.go("courses");
}

// ========== UNIFIED COURSE SEARCH WITH API ==========
var _gcSearchTimer = null;
var _gcSearchCache = {};

function courseSearchWithApi(val, containerId, onSelect, onQuickAdd) {
  var results = PB.searchCourses(val);
  var container = document.getElementById(containerId);
  if (!container) return;
  if (!val || val.length < 2) { container.innerHTML = ""; return; }
  
  // Render local results with section label
  var h = '';
  if (results.length) {
    h += '<div class="sr-section">Your courses</div>';
    results.forEach(function(c) {
      h += '<div class="sr-item" onclick="' + onSelect(c) + ';pbDismissKeyboard()">';
      h += '<div><div class="sr-name">' + escHtml(c.name) + '</div><div class="sr-meta">' + escHtml(c.loc||"") + (c.rating && c.rating !== 72 ? ' · ' + c.rating + '/' + c.slope : '') + (c.par ? ' · Par ' + c.par : '') + '</div></div>';
      h += '<span class="sr-badge local">Select</span></div>';
    });
  }
  
  // API search placeholder
  var exactMatch = results.some(function(c) { return c.name.toLowerCase() === val.toLowerCase(); });
  var apiKey = localStorage.getItem("golfcourse_api_key");
  if (apiKey && !exactMatch) {
    h += '<div id="' + containerId + '-api"><div class="sr-section" style="color:var(--muted2)">Searching online...</div></div>';
  }
  
  // Quick add at bottom
  if (!exactMatch) {
    h += '<div class="sr-item" onclick="' + onQuickAdd(val) + ';pbDismissKeyboard()">';
    h += '<div><div class="sr-name" style="color:var(--gold)">+ Add "' + escHtml(val) + '"</div><div class="sr-meta">Not in results? Add manually</div></div>';
    h += '<span class="sr-badge add">+ Add</span></div>';
  }
  container.innerHTML = h;
  
  // Debounced API search
  if (apiKey && val.length >= 3 && !exactMatch) {
    clearTimeout(_gcSearchTimer);
    _gcSearchTimer = setTimeout(function() {
      _searchGcApi(val, containerId, onSelect);
    }, 400);
  }
}

function _searchGcApi(query, containerId, onSelect) {
  var apiKey = localStorage.getItem("golfcourse_api_key");
  if (!apiKey) return;
  var apiContainer = document.getElementById(containerId + "-api");
  if (!apiContainer) return;
  
  // Check cache
  var cacheKey = query.toLowerCase();
  if (_gcSearchCache[cacheKey]) {
    _renderApiResults(_gcSearchCache[cacheKey], apiContainer, containerId, onSelect, query);
    return;
  }
  
  // Firebase Cloud Function proxy
  var fetchUrl = "https://us-central1-parbaughs.cloudfunctions.net/searchCourses?q=" + encodeURIComponent(query) + "&key=" + encodeURIComponent(apiKey);
  
  fetch(fetchUrl)
  .then(function(res) { if (!res.ok) throw new Error(res.status); return res.json(); })
  .then(function(data) {
    var courses = Array.isArray(data) ? data : (data.courses || data.results || data.data || data.items || []);
    _gcSearchCache[cacheKey] = courses.slice(0, 10);
    _renderApiResults(_gcSearchCache[cacheKey], apiContainer, containerId, onSelect, query);
  })
  .catch(function(err) {
    pbWarn("[GolfCourseAPI]", err);
    if (apiContainer) apiContainer.innerHTML = '<div style="font-size:9px;color:var(--muted2);padding:4px 12px">Online search unavailable</div>';
  });
}

function _renderApiResults(courses, apiContainer, containerId, onSelect, query) {
  if (!apiContainer) return;
  var filtered = courses.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  if (!filtered.length) {
    apiContainer.innerHTML = '<div style="font-size:9px;color:var(--muted2);padding:6px 12px">No online results</div>';
    return;
  }
  var h = '<div class="sr-section">Online results</div>';
  filtered.forEach(function(c, idx) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
    var city = (c.location && typeof c.location === "object" ? c.location.city : c.city) || "";
    var state = (c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "";
    var loc = [city, state].filter(Boolean).join(", ");
    var td = _extractTeeData(c);
    var par = td.par || "";
    var slope = td.slope || "";
    var rating = td.rating || "";
    
    h += '<div class="sr-item" onclick="importAndSelectCourse(' + idx + ',\'' + containerId + '\');pbDismissKeyboard()">';
    h += '<div><div class="sr-name">' + escHtml(name) + '</div>';
    h += '<div class="sr-meta">' + escHtml(loc) + (rating ? ' · ' + rating + '/' + slope : '') + (par ? ' · Par ' + par : '') + '</div></div>';
    h += '<span class="sr-badge import">+ Import</span></div>';
  });
  apiContainer.innerHTML = h;
}

// Store last API results for import
var _lastApiResults = [];
function importAndSelectCourse(idx, containerId) {
  var cacheKeys = Object.keys(_gcSearchCache);
  var lastResults = cacheKeys.length ? _gcSearchCache[cacheKeys[cacheKeys.length - 1]] : [];
  // Filter out already-added to match the rendered index
  var filtered = lastResults.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
    return !PB.getCourseByName(name);
  });
  var c = filtered[idx];
  if (!c) return;
  var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
  var city = (c.location && typeof c.location === "object" ? c.location.city : c.city) || "";
  var state = (c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "";
  var loc = [city, state].filter(Boolean).join(", ");
  var td = _extractTeeData(c);
  var par = td.par || 72;
  var rating = td.rating || 72.0;
  var slope = td.slope || 113;
  var lat = (c.location && c.location.latitude) || 0;
  var lng = (c.location && c.location.longitude) || 0;
  
  var course = PB.addCourse({ name: name, loc: loc, region: state || "US", rating: rating, slope: slope, par: par, tee: td.tee, yards: td.yards, holes: td.holes, allTees: td.allTees, lat: lat, lng: lng, source: "golfcourseapi" });
  if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:loc,region:state||"US",rating:rating,slope:slope,par:par,tee:td.tee,yards:td.yards,holes:td.holes,allTees:td.allTees,lat:lat,lng:lng,source:"golfcourseapi",createdAt:fsTimestamp()}).catch(function(){});
  
  Router.toast(name + " imported");
  // Fill the course input field
  var container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
  // Trigger full course selection (sets ID + tee selector) if on Play Now
  if (course && document.getElementById("pn-course")) {
    pnSelectCourse(course.id, name, rating, slope);
  } else {
    // Fallback: fill common input fields
    var inputs = [
      {course:"pn-course",rating:"pn-rating",slope:"pn-slope"},
      {course:"rf-course",rating:"rf-rating",slope:"rf-slope"},
      {course:"sync-course",rating:"sync-rating",slope:"sync-slope"}
    ];
    inputs.forEach(function(ids) {
      var ci = document.getElementById(ids.course); if (ci) ci.value = name;
      var ri = document.getElementById(ids.rating); if (ri && !ri.value) ri.value = rating;
      var si = document.getElementById(ids.slope); if (si && !si.value) si.value = slope;
    });
  }
}
function pasteApiKey() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(function(text) {
      var input = document.getElementById("gcapi-key");
      if (input && text) { input.value = text.trim(); Router.toast("Pasted"); }
    }).catch(function() {
      Router.toast("Allow clipboard access when prompted");
    });
  } else {
    var input = document.getElementById("gcapi-key");
    if (input) { input.focus(); Router.toast("Long-press the field to paste"); }
  }
}

function saveGolfApiKey() {
  var key = document.getElementById("gcapi-key");
  if (!key) return;
  var val = key.value.trim();
  if (val) {
    localStorage.setItem("golfcourse_api_key", val);
    // Sync to Firestore so all members can use it
    if (db) db.collection("config").doc("api_keys").set({ golfCourseApi: val }, { merge: true });
    Router.toast("API key saved for all members");
  } else {
    localStorage.removeItem("golfcourse_api_key");
    if (db) db.collection("config").doc("api_keys").set({ golfCourseApi: "" }, { merge: true });
    Router.toast("API key removed");
  }
  Router.go("settings");
}

function renderCourseDetail(courseId) {
  var c = PB.getCourse(courseId);
  if (!c) { Router.go("courses"); return; }
  var roundsHere = PB.getCourseRounds(c.name);

  var h = '<div class="sh"><h2>' + c.name + '</h2><button class="back" onclick="Router.back(\'courses\')">← Back</button></div>';

  var coursePhotoSrc = photoCache["course:" + courseId] || c.photo || "";
  // Async-load course photo(s) from Firestore if not cached
  if (!photoCache["course:" + courseId]) {
    loadCoursePhotos(courseId);
  }
  if (coursePhotoSrc && coursePhotoSrc !== COURSE_DEFAULT_IMG) {
    h += '<div id="course-photo-area" class="course-banner"><img alt="" src="' + coursePhotoSrc + '" onerror="this.parentElement.style.display=\'none\'"></div>';
  } else {
    h += '<div id="course-photo-area" style="height:100px;margin:0 16px;border-radius:var(--radius);background:linear-gradient(135deg,var(--bg3),var(--bg2));display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" stroke-width="1" width="36" height="36"><circle cx="12" cy="12" r="3"/><path d="M5 21l3-3 4 4 4-5 3 3"/><rect x="2" y="3" width="20" height="16" rx="2"/></svg></div>';
  }
  h += '<div class="section"><div class="c-detail-info">' + c.loc + ' · Rating: ' + c.rating + ' · Slope: ' + c.slope + ' · Par: ' + c.par + '</div>';
  if (c.tee || c.yards) {
    h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">';
    if (c.tee) h += c.tee + ' Tees';
    if (c.tee && c.yards) h += ' · ';
    if (c.yards) h += c.yards.toLocaleString() + ' yards';
    h += '</div>';
  }
  h += '<button class="btn-sm outline" style="margin-top:8px" onclick="uploadCoursePhoto(\'' + courseId + '\')">Upload photo</button></div>';

  // All tees overview
  if (c.allTees && c.allTees.length > 0) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Tees</span></div>';
    h += '<div style="padding:0 16px 8px">';
    c.allTees.forEach(function(tee, ti) {
      var isDefault = tee.name === c.tee;
      h += '<div class="card" style="margin-bottom:6px;cursor:pointer;border-color:' + (isDefault ? 'var(--gold)' : 'var(--border)') + '" onclick="showTeeScorecard(\'' + courseId + '\',' + ti + ')">';
      h += '<div class="card-body" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px">';
      h += '<div><div style="font-size:12px;font-weight:600;color:' + (isDefault ? 'var(--gold)' : 'var(--cream)') + '">' + escHtml(tee.name) + (isDefault ? ' <span style="font-size:9px;color:var(--muted)">(default)</span>' : '') + '</div>';
      h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">' + (tee.yards ? tee.yards.toLocaleString() + ' yds' : '') + ' · Par ' + (tee.par||72) + ' · Rating ' + (tee.rating||'—') + ' · Slope ' + (tee.slope||'—') + '</div></div>';
      h += '<svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>';
      h += '</div></div>';
    });
    h += '</div></div>';
  }

  // Scorecard section with tee selector
  if ((c.allTees && c.allTees.length > 0) || (c.holes && c.holes.length === 18)) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">Scorecard</span></div>';
    h += '<div id="courseScorecardArea">';
    h += '</div></div>';
  }

  // Course leaderboard — top 3 per format category
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Leaderboard</span></div>';

  function renderLeaderboardCategory(label, entries) {
    // entries: [{name, score, date}] already sorted low→high, max 3
    var lh = '<div style="margin-bottom:14px">';
    lh += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600;padding:0 16px;margin-bottom:6px">' + label + '</div>';
    if (!entries.length) {
      lh += '<div style="padding:0 16px;font-size:11px;color:var(--muted2)">No rounds yet</div>';
    } else {
      entries.forEach(function(e, idx) {
        var medal = idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--medal-silver)' : 'var(--medal-bronze)';
        var diff = e.score - (e.par || 72);
        var diffStr = diff === 0 ? 'E' : (diff > 0 ? '+' : '') + diff;
        var diffColor = diff <= 0 ? 'var(--birdie)' : diff <= 5 ? 'var(--gold)' : 'var(--red)';
        lh += '<div style="display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid var(--border2)">';
        lh += '<div style="width:22px;height:22px;border-radius:50%;background:' + medal + '18;border:1.5px solid ' + medal + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:' + medal + ';flex-shrink:0">' + (idx+1) + '</div>';
        lh += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(e.name) + '</div>';
        lh += '<div style="font-size:9px;color:var(--muted)">' + (e.date || '') + '</div></div>';
        lh += '<div style="text-align:right;flex-shrink:0"><div style="font-size:16px;font-weight:700;color:var(--gold)">' + e.score + '</div>';
        lh += '<div style="font-size:10px;font-weight:600;color:' + diffColor + '">' + diffStr + '</div></div>';
        lh += '</div>';
      });
    }
    lh += '</div>';
    return lh;
  }

  // Solo (all non-scramble formats combined — stroke, parbaugh, stableford, etc.)
  // Only full 18-hole rounds count for leaderboards
  var soloEntries = roundsHere
    .filter(function(r){ return r.format !== 'scramble' && (!r.holesPlayed || r.holesPlayed >= 18); })
    .sort(function(a,b){ return a.score - b.score; })
    .slice(0,3)
    .map(function(r){ return {name: r.playerName || r.player, score: r.score, date: r.date, par: c.par}; });
  h += renderLeaderboardCategory('Solo', soloEntries);

  // Scramble by team size — pull from both team.matches AND rounds collection
  var teams = PB.getScrambleTeams();
  [2,3,4].forEach(function(sz) {
    var entries = [];
    var entryKeys = {};
    // From team matches
    teams.filter(function(t){ return (t.size||t.members.length) === sz; }).forEach(function(t) {
      (t.matches||[]).filter(function(m){ return m.course && PB.normCourseName(m.course) === PB.normCourseName(c.name) && m.score; }).forEach(function(m) {
        var key = t.name + "|" + m.date;
        if (!entryKeys[key]) { entries.push({name: t.name, score: m.score, date: m.date, par: c.par}); entryKeys[key] = true; }
      });
    });
    // From rounds collection (scramble rounds on this course)
    // From rounds collection — only match rounds whose player belongs to a team of THIS size
    var scrambleRounds = roundsHere.filter(function(r){ 
      if (r.format !== "scramble" && r.format !== "scramble4") return false;
      // Find the team this player belongs to and check size
      var playerTeam = teams.find(function(t){ return (t.size||t.members.length) === sz && t.members.indexOf(r.player) !== -1; });
      return !!playerTeam;
    });
    // Group by date to avoid duplicates
    var scrambleDates = {};
    scrambleRounds.forEach(function(r) {
      if (!scrambleDates[r.date] || r.score < scrambleDates[r.date].score) scrambleDates[r.date] = r;
    });
    Object.values(scrambleDates).forEach(function(r) {
      var teamForRound = teams.find(function(t){ return (t.size||t.members.length) === sz && t.members.indexOf(r.player) !== -1; });
      var teamName = teamForRound ? teamForRound.name : "Team";
      var key = teamName + "|" + r.date;
      if (!entryKeys[key]) { entries.push({name: teamName, score: r.score, date: r.date, par: c.par}); entryKeys[key] = true; }
    });
    entries.sort(function(a,b){ return a.score - b.score; });
    var seen = {};
    entries = entries.filter(function(e) {
      if (seen[e.name]) return false;
      seen[e.name] = true;
      return true;
    }).slice(0,3);
    h += renderLeaderboardCategory(sz + '-Man Scramble', entries);
  });

  h += '</div>';

  if (roundsHere.length) {
    var soloRounds = roundsHere.filter(function(r){ return r.format !== "scramble" && r.format !== "scramble4"; });
    var scrambleRounds = roundsHere.filter(function(r){ return r.format === "scramble" || r.format === "scramble4"; });
    
    if (soloRounds.length) {
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Individual scores</span></div>';
      soloRounds.slice().reverse().forEach(function(r) {
        var is9h = r.holesPlayed && r.holesPlayed <= 9;
        var holeLabel = is9h ? (r.holesMode === "back9" ? " · Back 9" : " · Front 9") : "";
        var teeName = r.tee || c.tee || "";
        var teeDisplay = teeName ? " · " + teeName + (/tees$/i.test(teeName) ? "" : " Tees") : "";
        var fmtLabel = r.format && r.format !== "stroke" ? " · " + r.format.charAt(0).toUpperCase() + r.format.slice(1) : "";
        var clickHandler = r.id ? " onclick=\"Router.go('rounds',{roundId:'" + r.id + "'})\" style=\"cursor:pointer\"" : "";
        h += '<div class="card"' + clickHandler + '><div class="round-card"><div class="rc-top"><div><div class="rc-course">' + escHtml(r.playerName) + '</div><div class="rc-date">' + r.date + teeDisplay + holeLabel + fmtLabel + '</div></div>';
        h += '<div class="rc-score">' + r.score + '</div></div></div></div>';
      });
      h += '</div>';
    }
    
    if (scrambleRounds.length) {
      var scrambleDates = {};
      scrambleRounds.forEach(function(r) { if (!scrambleDates[r.date]) scrambleDates[r.date] = []; scrambleDates[r.date].push(r); });
      h += '<div class="section"><div class="sec-head"><span class="sec-title">Scramble scores</span></div>';
      Object.keys(scrambleDates).sort().reverse().forEach(function(dt) {
        var group = scrambleDates[dt];
        var score = group[0].score;
        var teamObj = PB.getScrambleTeams().find(function(t){ return group.some(function(r){ return t.members.indexOf(r.player) !== -1; }); });
        var teamName = teamObj ? teamObj.name : "Team Scramble";
        var memberNames = group.map(function(r){ return r.playerName; }).join(", ");
        var teeName = group[0].tee || c.tee || "";
        var teeDisplay = teeName ? " · " + teeName + (/tees$/i.test(teeName) ? "" : " Tees") : "";
        var clickHandler = group[0].id ? " onclick=\"Router.go('rounds',{roundId:'" + group[0].id + "'})\" style=\"cursor:pointer\"" : "";
        h += '<div class="card"' + clickHandler + '><div class="round-card"><div class="rc-top"><div><div class="rc-course" style="color:var(--gold)">' + escHtml(teamName) + '</div><div class="rc-date" style="font-size:10px">' + escHtml(memberNames) + '</div><div class="rc-date">' + dt + teeDisplay + ' · Scramble</div></div>';
        h += '<div class="rc-score">' + score + '</div></div></div></div>';
      });
      h += '</div>';
    }
  }

  // Reviews
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Reviews</span></div>';
  if (c.reviews && c.reviews.length) {
    c.reviews.forEach(function(r) {
      h += '<div class="card"><div class="card-body"><div class="review-head">' + r.rating + '/5 — ' + r.by + '</div><div class="review-text">' + r.text + '</div></div></div>';
    });
  }
  h += '<div id="review-form-' + courseId + '" style="display:none;margin-top:8px">';
  h += '<div class="ff"><label class="ff-label">Rating</label><select class="ff-input" id="rev-rating"><option value="5">5 stars (5)</option><option value="4">4 stars (4)</option><option value="3">3 stars (3)</option><option value="2">2 stars (2)</option><option value="1">(1)</option></select></div>';
  h += '<div class="ff"><label class="ff-label">Review</label><textarea class="ff-input" id="rev-text" placeholder="What did you think of this course?"></textarea></div>';
  h += '<button class="btn full green" onclick="submitCourseReview(\'' + courseId + '\')">Submit review</button></div>';
  h += '<button class="btn full outline" onclick="document.getElementById(\'review-form-' + courseId + '\').style.display=\'block\';this.style.display=\'none\'">+ Write review</button></div>';

  document.querySelector('[data-page="courses"]').innerHTML = h;
  // Auto-render default tee scorecard
  if (c.allTees && c.allTees.length > 0) {
    var defaultIdx = c.allTees.findIndex(function(t){ return t.name === c.tee; });
    if (defaultIdx === -1) defaultIdx = 0;
    showTeeScorecard(courseId, defaultIdx);
  }
}

function promptAddCourse() {
  Router.go("courses", { add: true });
}

function renderAddCourseForm() {
  var h = '<div class="sh"><h2>Add course</h2><button class="back" onclick="Router.back(\'courses\')">← Back</button></div>';
  h += '<div class="form-section"><div class="form-title">New course</div>';
  h += formField("Course name", "ac-name", "", "text", "e.g. Pebble Beach");
  h += formField("Location", "ac-loc", "", "text", "e.g. Pebble Beach, CA");
  h += formField("State", "ac-region", "", "text", "e.g. CA");
  h += '<div class="ff-row">';
  h += formField("Rating", "ac-rating", "", "number", "72.0");
  h += formField("Slope", "ac-slope", "", "number", "130");
  h += '</div>';
  h += formField("Par", "ac-par", "72", "number", "72");
  h += '<button class="btn full green" onclick="submitAddCourse()">Add course</button></div>';
  document.querySelector('[data-page="courses"]').innerHTML = h;
}

function submitAddCourse() {
  var name = document.getElementById("ac-name").value;
  if (!name) { Router.toast("Enter a course name"); return; }
  var c = PB.addCourse({
    name: name,
    loc: document.getElementById("ac-loc").value,
    region: document.getElementById("ac-region").value,
    rating: document.getElementById("ac-rating").value || "72",
    slope: document.getElementById("ac-slope").value || "113",
    par: document.getElementById("ac-par").value || "72"
  });
  if (c) { Router.toast(name + " added!"); Router.go("courses", { id: c.id }); }
}

function showTeeScorecard(courseId, teeIdx) {
  var c = PB.getCourse(courseId) || PB.getCourseByName(courseId);
  if (!c || !c.allTees || !c.allTees[teeIdx]) return;
  var tee = c.allTees[teeIdx];
  var holes = tee.holes || [];
  var area = document.getElementById("courseScorecardArea");
  if (!area) return;

  var h = '<div style="padding:0 16px 4px;font-size:12px;font-weight:600;color:var(--gold)">' + escHtml(tee.name) + ' <span style="font-size:10px;color:var(--muted);font-weight:400">' + (tee.yards ? tee.yards.toLocaleString() + ' yds · ' : '') + 'Rating ' + (tee.rating||'—') + ' · Slope ' + (tee.slope||'—') + '</span></div>';

  if (holes.length === 18) {
    h += '<div style="overflow-x:auto;padding:0 16px 12px">';
    // Front 9
    h += '<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px">';
    h += '<tr style="color:var(--gold);font-weight:700"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3)">Hole</td>';
    for (var i=1;i<=9;i++) h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg3);text-align:center">' + i + '</td>';
    h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3);text-align:center;font-weight:700">Out</td></tr>';
    h += '<tr style="color:var(--cream)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Par</td>';
    var fp = 0; for (var i=0;i<9;i++) { var p=holes[i].par; fp+=p; h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center">' + p + '</td>'; }
    h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-weight:700">' + fp + '</td></tr>';
    if (holes[0].yardage) {
      h += '<tr style="color:var(--muted)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Yds</td>';
      var fy = 0; for (var i=0;i<9;i++) { var y=holes[i].yardage; fy+=y; h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-size:9px">' + y + '</td>'; }
      h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-weight:700;font-size:9px">' + fy + '</td></tr>';
    }
    if (holes[0].handicap) {
      h += '<tr style="color:var(--muted2)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Hcp</td>';
      for (var i=0;i<9;i++) h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-size:9px">' + holes[i].handicap + '</td>';
      h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2)"></td></tr>';
    }
    h += '</table>';
    // Back 9
    h += '<table style="width:100%;border-collapse:collapse;font-size:10px">';
    h += '<tr style="color:var(--gold);font-weight:700"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3)">Hole</td>';
    for (var i=10;i<=18;i++) h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg3);text-align:center">' + i + '</td>';
    h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3);text-align:center;font-weight:700">In</td></tr>';
    h += '<tr style="color:var(--cream)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Par</td>';
    var bp = 0; for (var i=9;i<18;i++) { var p=holes[i].par; bp+=p; h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center">' + p + '</td>'; }
    h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-weight:700">' + bp + '</td></tr>';
    if (holes[9].yardage) {
      h += '<tr style="color:var(--muted)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Yds</td>';
      var by = 0; for (var i=9;i<18;i++) { var y=holes[i].yardage; by+=y; h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-size:9px">' + y + '</td>'; }
      h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-weight:700;font-size:9px">' + by + '</td></tr>';
    }
    if (holes[9].handicap) {
      h += '<tr style="color:var(--muted2)"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2);font-weight:600">Hcp</td>';
      for (var i=9;i<18;i++) h += '<td style="padding:4px 4px;border:1px solid var(--border);background:var(--bg2);text-align:center;font-size:9px">' + holes[i].handicap + '</td>';
      h += '<td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg2)"></td></tr>';
    }
    h += '</table>';
    h += '<div style="text-align:center;margin-top:6px;font-size:11px;color:var(--gold);font-weight:600">Total: Par ' + (fp+bp);
    if (holes[0].yardage) h += ' · ' + (fy+by).toLocaleString() + ' yards';
    h += '</div></div>';
  } else {
    h += '<div style="padding:4px 16px;font-size:11px;color:var(--muted2)">No hole-by-hole data available for this tee</div>';
  }
  area.innerHTML = h;
}

function togglePlayNowFirGir(wrapper, hole, type) {
  liveState[type][hole] = !liveState[type][hole];
  saveLiveState(); // persist stat change for crash recovery
  var val = liveState[type][hole];
  var el = wrapper.querySelector("div");
  if (!el) return;
  var color = type === "fir" ? "var(--birdie)" : "var(--gold)";
  var bgOn = type === "fir" ? "rgba(var(--birdie-rgb),.12)" : "rgba(var(--gold-rgb),.12)";
  if (val) {
    el.style.borderColor = color;
    el.style.background = bgOn;
    el.style.color = color;
    el.innerHTML = "•";
  } else {
    el.style.borderColor = "var(--border)";
    el.style.background = "transparent";
    el.style.color = "var(--muted2)";
    el.innerHTML = "";
  }
}

function toggleFirGirBtn(el, tripId, courseKey, playerId, hole, newVal, type) {
  if (type === "fir") {
    PB.setFir(tripId, courseKey, playerId, hole, newVal);
  } else {
    PB.setGir(tripId, courseKey, playerId, hole, newVal);
  }
  // Toggle visual state in-place
  var color = type === "fir" ? "var(--birdie)" : "var(--gold)";
  var bgOn = type === "fir" ? "rgba(var(--birdie-rgb),.15)" : "rgba(var(--gold-rgb),.15)";
  if (newVal) {
    el.style.borderColor = color;
    el.style.background = bgOn;
    el.innerHTML = "•";
  } else {
    el.style.borderColor = "var(--border)";
    el.style.background = "transparent";
    el.innerHTML = "";
  }
  // Flip the onclick for next tap
  var nextVal = !newVal;
  el.setAttribute("onclick", "toggleFirGirBtn(this,'" + tripId + "','" + courseKey + "','" + playerId + "'," + hole + "," + nextVal + ",'" + type + "')");
}

function uploadCoursePhoto(courseId) {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    Router.toast("Compressing...");
    var reader = new FileReader();
    reader.onload = function(e) {
      compressPhoto(e.target.result, PHOTO_MAX_KB, 600, function(compressed) {
        // Save locally too
        PB.updateCourse(courseId, { photo: compressed });
        photoCache["course:" + courseId] = compressed;
        // Save to Firestore photos collection with unique ID for multi-photo support
        if (db) {
          var docId = "course_" + courseId + "_" + Date.now();
          db.collection("photos").doc(docId).set({
            type: "course",
            refId: courseId,
            data: compressed,
            caption: "",
            uploadedBy: currentUser ? currentUser.uid : "local",
            createdAt: fsTimestamp()
          }).then(function() {
            Router.toast("Course photo uploaded!");
            Router.go("courses", { id: courseId });
          }).catch(function(e) {
            pbWarn("[CoursePhoto] Save failed:", e.message);
            Router.toast("Photo saved locally");
            Router.go("courses", { id: courseId });
          });
        } else {
          Router.toast("Photo saved locally");
          Router.go("courses", { id: courseId });
        }
      });
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function promptCourseReview(courseId) {
  // Legacy - now handled by inline form
}

function submitCourseReview(courseId) {
  var rating = parseInt(document.getElementById("rev-rating").value);
  var text = document.getElementById("rev-text").value;
  if (!text) { Router.toast("Write something!"); return; }
  var reviewerName = currentProfile ? (currentProfile.name || currentProfile.username || "A Parbaugh") : "A Parbaugh";
  var review = { rating:rating, text:text, by:reviewerName, date:localDateStr() };
  PB.addCourseReview(courseId, review);
  // Persist review to Firestore
  var course = PB.getCourse(courseId);
  if (course) syncCourse(course);
  // Also save to dedicated reviews collection for reliability
  if (db) {
    db.collection("course_reviews").add({
      courseId: courseId,
      courseName: course ? course.name : "",
      rating: rating,
      text: text,
      by: reviewerName,
      userId: currentUser ? currentUser.uid : "",
      createdAt: fsTimestamp()
    }).catch(function(e) { pbWarn("[Review] Firestore save failed:", e.message); });
  }
  Router.toast("Review added!");
  Router.go("courses", { id: courseId });
}

