import io, re

def rw(p):
    return io.open(p, encoding='utf-8', newline='').read()

def wr(p, s):
    io.open(p, 'w', encoding='utf-8', newline='').write(s)

def replace(s, old, new, label):
    if old not in s:
        old2 = old.replace('\n', '\r\n')
        if old2 in s:
            return s.replace(old2, new.replace('\n', '\r\n'), 1)
        raise AssertionError('anchor missing: ' + label)
    return s.replace(old, new, 1)

# ── 1. courses.js — shared helpers + refactor importDirApiCourse + dir stub ──
p = 'src/pages/courses.js'
s = rw(p)

helper = r'''// ── Course auto-create (v8.24.42, #26) ──────────────────────────────────
// Try GolfCourseAPI before accepting a guessed-pars stub (the zero-guessing
// rule: real rating/slope/par/tees or honestly provisional, never fake 72s).
// Works with a personal key today; once the gated searchCourses deploy lands
// the server-held key covers every member (the key param becomes optional).
function pbAutoCreateCourse(name, state) {
  var apiKey = localStorage.getItem("golfcourse_api_key");
  var url = "https://us-central1-parbaughs.cloudfunctions.net/searchCourses?q=" + encodeURIComponent(name) + (apiKey ? "&key=" + encodeURIComponent(apiKey) : "");
  return fetch(url)
    .then(function(res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(function(data) {
      var courses = Array.isArray(data) ? data : (data.courses || data.results || data.data || data.items || []);
      if (!courses.length) return null;
      var nLower = name.toLowerCase();
      var best = courses.find(function(c) {
        var cn = (c.course_name || c.club_name || c.name || c.courseName || "").toLowerCase();
        var cs = ((c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "").toUpperCase();
        var nameHit = cn.indexOf(nLower) !== -1 || nLower.indexOf(cn) !== -1;
        return cn && nameHit && (!state || !cs || cs === state);
      });
      if (!best) return null;
      return pbImportApiCourse(best);
    })
    .catch(function() { return null; });
}

// Build + persist a course doc from a GolfCourseAPI result. Shared by the
// directory import button and the auto-create path.
function pbImportApiCourse(c) {
  var name = c.course_name || c.club_name || c.name || c.courseName || "Unknown";
  var city = (c.location && typeof c.location === "object" ? c.location.city : c.city) || "";
  var st = (c.location && typeof c.location === "object" ? c.location.state : c.state) || c.province || c.region || "";
  var loc = [city, st].filter(Boolean).join(", ");
  var td = _extractTeeData(c);
  var lat = (c.location && c.location.latitude) || 0;
  var lng = (c.location && c.location.longitude) || 0;
  var course = PB.addCourse({ name: name, loc: loc, region: st || "US", rating: td.rating || 72, slope: td.slope || 113, par: td.par || 72, tee: td.tee, yards: td.yards, holes: td.holes, allTees: td.allTees, lat: lat, lng: lng, source: "golfcourseapi" });
  if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:loc,region:st||"US",rating:td.rating||72,slope:td.slope||113,par:td.par||72,tee:td.tee,yards:td.yards,holes:td.holes,allTees:td.allTees,lat:lat,lng:lng,source:"golfcourseapi",createdAt:fsTimestamp()}).catch(function(){});
  return course;
}

function importDirApiCourse(idx) {'''

s = replace(s, 'function importDirApiCourse(idx) {', helper, 'importDirApiCourse head')

old_body = r'''  var c = filtered[idx];
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
  Router.go("courses");'''
new_body = r'''  var c = filtered[idx];
  if (!c) return;
  // v8.24.42 — doc building extracted to pbImportApiCourse (shared with auto-create)
  var course = pbImportApiCourse(c);
  Router.toast((course ? course.name : "Course") + " imported");
  Router.go("courses");'''
s = replace(s, old_body, new_body, 'importDirApiCourse body')

old_dir = r'''  var state = _state;
  if (state === null) return;
  state = (state||"").trim().toUpperCase().substring(0, 2);
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  var course = PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
  if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
  Router.toast(name + " added");
  Router.go("courses");'''
new_dir = r'''  var state = _state;
  if (state === null) return;
  state = (state||"").trim().toUpperCase().substring(0, 2);
  // v8.24.42 — auto-create: real GolfCourseAPI data first, stub only when
  // the API has no match (and then honestly marked provisional).
  Router.toast("Looking up " + name + "...");
  pbAutoCreateCourse(name, state).then(function(apiCourse) {
    if (apiCourse) { Router.toast(apiCourse.name + " added with real course data"); Router.go("courses"); return; }
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
    var course = PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
    if (db && course) db.collection("courses").doc(course.id).set({id:course.id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
    Router.toast(name + " added (provisional pars — update rating/slope when known)");
    Router.go("courses");
  });'''
s = replace(s, old_dir, new_dir, 'dir stub')
wr(p, s)
print('OK courses.js')

# ── 2. playnow.js — API-first quick add ──
p = 'src/pages/playnow.js'
s = rw(p)
old = r'''  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);

  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  var course = {
    id: id,
    name: name,
    loc: (state ? state : "Unknown"),
    region: state || "US",
    rating: 72.0,
    slope: 113,
    par: 72,
    photo: "",
    reviews: [],
    addedBy: currentUser ? currentUser.uid : "local",
    quickAdd: true
  };

  PB.addCourse(course);
  if (db) {
    db.collection("courses").doc(id).set(Object.assign({}, course, {createdAt: fsTimestamp()})).catch(function(){});
  }

  // Auto-select the new course
  document.getElementById("pn-course").value = name;
  document.getElementById("pn-rating").value = "72";
  document.getElementById("pn-slope").value = "113";
  document.getElementById("search-pn-course").innerHTML = "";
  Router.toast("Added " + name + "! Rating/slope can be updated later.");'''
new = r'''  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);

  // v8.24.42 — auto-create: real GolfCourseAPI data first (zero-guessing
  // rule); the guessed-72s stub only when the API has no match.
  Router.toast("Looking up " + name + "...");
  pbAutoCreateCourse(name, state).then(function(apiCourse) {
    if (apiCourse) {
      document.getElementById("pn-course").value = apiCourse.name;
      document.getElementById("pn-rating").value = String(apiCourse.rating || 72);
      document.getElementById("pn-slope").value = String(apiCourse.slope || 113);
      document.getElementById("search-pn-course").innerHTML = "";
      Router.toast("Added " + apiCourse.name + " with real course data");
      return;
    }
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
    var course = {
      id: id,
      name: name,
      loc: (state ? state : "Unknown"),
      region: state || "US",
      rating: 72.0,
      slope: 113,
      par: 72,
      photo: "",
      reviews: [],
      addedBy: currentUser ? currentUser.uid : "local",
      quickAdd: true
    };
    PB.addCourse(course);
    if (db) {
      db.collection("courses").doc(id).set(Object.assign({}, course, {createdAt: fsTimestamp()})).catch(function(){});
    }
    document.getElementById("pn-course").value = name;
    document.getElementById("pn-rating").value = "72";
    document.getElementById("pn-slope").value = "113";
    document.getElementById("search-pn-course").innerHTML = "";
    Router.toast("Added " + name + " (provisional pars — update rating/slope when known)");
  });'''
s = replace(s, old, new, 'playnow stub')
wr(p, s)
print('OK playnow.js')

# ── 3. rounds.js — API-first quick add ──
p = 'src/pages/rounds.js'
s = rw(p)
old = r'''  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
  PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
  if (db) db.collection("courses").doc(id).set({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
  document.getElementById("rf-course").value = name;
  var ri = document.getElementById("rf-rating"); if (ri) ri.value = "72";
  var si = document.getElementById("rf-slope"); if (si) si.value = "113";
  document.getElementById("search-round-course").innerHTML = "";
  renderLogHoleGrid();
  Router.toast("Added " + name);'''
new = r'''  var state = _state;
  if (!state) state = "";
  state = state.trim().toUpperCase().substring(0, 2);
  // v8.24.42 — auto-create: real GolfCourseAPI data first (zero-guessing
  // rule); the guessed-72s stub only when the API has no match.
  Router.toast("Looking up " + name + "...");
  pbAutoCreateCourse(name, state).then(function(apiCourse) {
    if (apiCourse) {
      document.getElementById("rf-course").value = apiCourse.name;
      var ri0 = document.getElementById("rf-rating"); if (ri0) ri0.value = String(apiCourse.rating || 72);
      var si0 = document.getElementById("rf-slope"); if (si0) si0.value = String(apiCourse.slope || 113);
      document.getElementById("search-round-course").innerHTML = "";
      renderLogHoleGrid();
      Router.toast("Added " + apiCourse.name + " with real course data");
      return;
    }
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 20) + Date.now().toString(36).slice(-4);
    PB.addCourse({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,photo:"",reviews:[],quickAdd:true});
    if (db) db.collection("courses").doc(id).set({id:id,name:name,loc:(state||"Unknown"),region:state||"US",rating:72.0,slope:113,par:72,quickAdd:true,createdAt:fsTimestamp()}).catch(function(){});
    document.getElementById("rf-course").value = name;
    var ri = document.getElementById("rf-rating"); if (ri) ri.value = "72";
    var si = document.getElementById("rf-slope"); if (si) si.value = "113";
    document.getElementById("search-round-course").innerHTML = "";
    renderLogHoleGrid();
    Router.toast("Added " + name + " (provisional pars)");
  });'''
s = replace(s, old, new, 'rounds stub')
wr(p, s)
print('OK rounds.js')
