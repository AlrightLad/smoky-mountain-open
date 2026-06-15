/* ================================================
   PAGE: COURSES
   ================================================ */

// ── Branded per-course thumbnail (v8.23.53) ─────────────────────────────────
// Courses without an uploaded photo used to all render one identical dark stock
// image (COURSE_DEFAULT_IMG), which made the directory read as broken/monotonous.
// Instead derive a deterministic branded monogram tile: a Clubhouse duotone lane
// (one of 6, chosen by a stable hash of the name — same convention as getAvatar)
// plus the course initials. The same lane identity is reused on the detail hero.
function courseThumbLane(name) {
  var s = name || "";
  var hash = 0;
  for (var i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
  return Math.abs(hash) % 6;
}
function courseThumbInitials(name) {
  var words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
function courseThumbHTML(c, thumbSrc) {
  // v8.25.18x (Founder PL9): courses without an uploaded photo now default to the
  // RUBBER-HOSE course illustration (public/img/course-placeholder.jpg) — the
  // hand-drawn brand art — NOT the flat CSS colour-gradient lanes (which read as
  // a generic AI tell). The initials gradient is kept only as a final onerror
  // fallback if even the illustration fails to load.
  var _b = (typeof window !== "undefined" && window.__PB_BASE__) ? window.__PB_BASE__ : "/";
  var src = thumbSrc || (_b + "img/course-placeholder.jpg");
  var ph = '<div class="c-thumb-placeholder c-thumb-ph--' + courseThumbLane(c.name) + '" style="display:none">' + escHtml(courseThumbInitials(c.name)) + '</div>';
  return '<img alt="" src="' + src + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' + ph;
}

Router.register("courses", function(params) {
  if (params.add) { renderAddCourseForm(); return; }
  if (params.id) { renderCourseDetail(params.id); return; }
  var showOurs = window._courseViewMode === "ours";
  // v8.24+ (design-pass): one primary CTA per state. The search field is the
  // hero path to "thousands worldwide"; the two +Add buttons that used to fight
  // it for attention are demoted — the top-right is dropped here, and the only
  // manual-add affordance lives quietly under the search box (added below).
  // v8.25.66 — editorial masthead (matches Members/Standings/Scramble/Records),
  // replacing the legacy .sh header that read a tier below the rest of the app.
  var _cCount = (PB.getCourses() || []).length;
  var h = '<div class="roster-masthead"><button class="back" onclick="Router.back(\'records\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">COURSE DIRECTORY · ' + _cCount + ' COURSE' + (_cCount === 1 ? '' : 'S') + '</div>';
  h += '<h1 class="roster-headline">The yardage book.</h1></div>';

  // v8.25.20 (design-pass) — compute "do we have any league courses?" up front so
  // the All / Our toggle can be suppressed when there's nothing to scope to. An
  // empty directory used to still float a two-option segmented control between
  // the title and the search hero (detached, competing chrome); with no league
  // rounds the "Our Courses" tab is dead. Detection mirrors the showOurs filter
  // below (a course counts as "ours" once a league round has been logged there).
  var allCourses = PB.getCourses();
  var leagueRounds = PB.getRounds();
  var leagueCoursePlays = {};
  var leagueCourseBest = {};
  var leagueCourseBestPlayer = {};
  leagueRounds.forEach(function(r) {
    if (!r.course || !r.score) return;
    var cn = r.course;
    leagueCoursePlays[cn] = (leagueCoursePlays[cn] || 0) + 1;
    if (!leagueCourseBest[cn] || r.score < leagueCourseBest[cn]) {
      leagueCourseBest[cn] = r.score;
      leagueCourseBestPlayer[cn] = r.playerName || r.player;
    }
  });
  var hasLeagueCourses = allCourses.some(function(c) { return leagueCoursePlays[c.name]; });
  var courses = allCourses;

  // Toggle: All Courses / Our Courses
  // v8.24.26 — replaced the inline gold-pill one-off with the canonical
  // .chip-scope segmented control (same pattern as the Feed's scope toggle).
  // Tab labels render in the UI/sans family (font-family override) rather than
  // the shared class's monospace, so the page chrome uses a single sans+serif
  // pairing instead of three competing type families.
  // v8.25.20 — only render when there ARE league courses; otherwise it's a
  // detached, non-functional control that competes with the search hero. The
  // bottom padding is tightened (10px -> 8px) so, when shown, the control reads
  // as the lead-in to the search block rather than a floating row.
  if (hasLeagueCourses) {
    h += '<div style="display:flex;justify-content:center;padding:0 16px 8px"><div class="chip-scope" role="group" aria-label="Course directory scope">';
    h += '<button class="chip-scope__seg" type="button" style="font-family:var(--font-ui)" aria-pressed="' + (!showOurs ? 'true' : 'false') + '" onclick="window._courseViewMode=undefined;Router.go(\'courses\',{},true)">All Courses</button>';
    h += '<button class="chip-scope__seg" type="button" style="font-family:var(--font-ui)" aria-pressed="' + (showOurs ? 'true' : 'false') + '" onclick="window._courseViewMode=\'ours\';Router.go(\'courses\',{},true)">Our Courses</button>';
    h += '</div></div>';
  } else if (showOurs) {
    // Defensive: URL/state asked for "ours" but nothing qualifies — fall back to
    // All so the page never renders an empty Our-Courses view with no way out.
    showOurs = false;
    window._courseViewMode = undefined;
  }

  // Search filter — the single primary CTA for the All-Courses state. Styled as
  // the hero affordance (larger field, search affordance icon, brass focus) so
  // the path to the worldwide directory reads as THE action on the page.
  h += '<div style="padding:0 16px 6px"><div style="position:relative">';
  h += '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--cb-mute)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);pointer-events:none"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>';
  h += '<input type="text" class="ff-input" id="dir-search" placeholder="Search courses worldwide…" style="font-size:14px;padding-left:38px;min-height:44px" oninput="filterCourseDirectory(this.value)"></div>';
  // Quiet secondary: the only remaining manual-add entry point. Demoted to a
  // text-link so it never competes with the search hero above it.
  h += '<button type="button" onclick="promptAddCourse()" style="display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:6px 2px;min-height:36px;background:none;border:none;font:inherit;font-size:12px;color:var(--cb-mute);cursor:pointer">';
  h += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Can\'t find it? Add a course by hand</button>';
  h += '</div>';

  // API results container (above local list)
  h += '<div id="dir-api-results"></div>';
  // Manual add prompt
  h += '<div id="dir-manual-add" style="display:none"></div>';

  // For "Our Courses" mode, filter to courses with league play (the
  // leagueCoursePlays / Best / BestPlayer maps were computed up front so the
  // toggle could decide whether to render at all).
  if (showOurs) {
    courses = courses.filter(function(c) { return leagueCoursePlays[c.name]; });
  }

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
    h += '<div class="course-row"><div class="c-thumb">' + courseThumbHTML(c, thumbSrc) + '</div>';
    h += '<div class="c-info"><div class="c-name">' + escHtml(c.name) + '</div><div class="c-loc">' + escHtml(c.loc||'') + ' · ' + c.rating + '/' + c.slope + '</div>';
    if (showOurs) {
      var lPlays = leagueCoursePlays[c.name] || 0;
      var lBest = leagueCourseBest[c.name];
      var lBestBy = leagueCourseBestPlayer[c.name];
      h += '<div class="c-meta">' + lPlays + ' league round' + (lPlays !== 1 ? 's' : '');
      if (lBest) h += ' · Best: <span style="color:var(--cb-brass);font-weight:600">' + lBest + '</span> (' + escHtml(lBestBy || '') + ')';
      h += '</div>';
    } else {
      h += '<div class="c-meta">' + (stars ? '' + stars + '/5 · ' : '') + roundsHere.length + ' round' + (roundsHere.length !== 1 ? 's' : '') + '</div>';
    }
    // Best scores — always show all 3 columns, "--" for missing
    if (indivRounds.length) {
      // v8.25.66 — the score story is the reason a golfer opens this page; bump it
      // from 9-10px muted to legible 11px with brass on the 18 + ink on F9/B9 (WF2).
      var f9Display = bestF9 !== null ? '<b style="color:var(--cb-ink)">' + bestF9 + '</b>' : '<span style="color:var(--cb-mute-2)">--</span>';
      var b9Display = bestB9 !== null ? '<b style="color:var(--cb-ink)">' + bestB9 + '</b>' : '<span style="color:var(--cb-mute-2)">--</span>';
      var fullDisplay = best18 !== null ? '<b style="color:var(--cb-brass);font-weight:700">' + best18 + '</b>' : '<span style="color:var(--cb-mute-2)">--</span>';
      h += '<div style="font-size:11px;margin-top:4px;display:flex;gap:12px">';
      h += '<span><span style="color:var(--cb-mute);font-size:9.5px;letter-spacing:.5px">F9</span> ' + f9Display + '</span>';
      h += '<span><span style="color:var(--cb-mute);font-size:9.5px;letter-spacing:.5px">B9</span> ' + b9Display + '</span>';
      h += '<span><span style="color:var(--cb-mute);font-size:9.5px;letter-spacing:.5px">18</span> ' + fullDisplay + '</span>';
      h += '</div>';
    }
    h += '</div></div></div>';
  });
  // v8.24+ (design-pass): three explicit render branches per P10 actionable
  // surfacing — loading / error / empty are no longer indistinguishable.
  //   LOADING  — Firestore handshake still in flight + nothing cached yet.
  //   ERROR    — connection is offline + we have no courses to fall back on;
  //              an actionable card (WHAT / WHERE / ACTION) instead of a silent
  //              "directory is quiet" that hides a real connectivity failure.
  //   EMPTY    — connected, just genuinely nothing to show (teaching moment).
  // showOurs always has a real local fallback (league rounds), so its empty is
  // never a connectivity failure — only the All-Courses branch can be loading/error.
  var status = (typeof syncStatus !== "undefined") ? syncStatus : "online";
  var isLoading = !showOurs && courses.length === 0 && status === "connecting";
  var isError = !showOurs && courses.length === 0 && status === "offline";

  if (isLoading) {
    // Skeleton rows mirror the real course-row geometry so the swap is calm.
    h += '<div aria-busy="true" aria-label="Loading course directory">';
    for (var sk = 0; sk < 4; sk++) {
      h += '<div class="card course-dir-item" aria-hidden="true"><div class="course-row">';
      h += '<div class="c-thumb skeleton" style="border-radius:8px"></div>';
      h += '<div class="c-info" style="flex:1"><div class="skeleton" style="height:14px;width:62%;border-radius:5px"></div>';
      h += '<div class="skeleton" style="height:10px;width:42%;border-radius:5px;margin-top:8px"></div></div>';
      h += '</div></div>';
    }
    h += '</div>';
  } else if (isError) {
    h += '<div role="alert" style="margin:24px 16px;padding:28px 24px;text-align:center;background:var(--cb-paper);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-sm)">';
    h += '<div style="margin-bottom:10px"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--alert)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 20h20L12 2Z"/><path d="M12 9v5"/><circle cx="12" cy="17.5" r=".6" fill="var(--alert)" stroke="none"/></svg></div>';
    h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--cream);margin-bottom:6px">Couldn’t load the directory.</div>';
    h += '<div style="font-size:13px;color:var(--cb-mute);line-height:1.5;max-width:320px;margin:0 auto 16px">You’re offline, so the course list (stored in the cloud) can’t be reached. Reconnect to the internet, then retry.</div>';
    h += '<button type="button" class="btn-sm green" onclick="Router.go(\'courses\',{},true)" style="min-height:44px;padding:10px 22px">Retry</button>';
    h += '</div>';
  } else if (courses.length === 0) {
    // v8.22+ (design-pass 2026-05-22): when the directory is empty, show an
    // engaging empty state instead of a bare "0 courses" footer. Per
    // peer-anchor (Linear empty-states + 18Birdies onboarding): the empty
    // moment is a teaching moment — explain what'll appear here + give a
    // clear CTA.
    // v8.25.20 — (a) tighter vertical rhythm for iPhone: the icon->headline->
    // body gaps were loose (32/8/6/16); pulled to a calmer 28/10/4/14 scale so
    // the card reads as one composed unit, not four stacked rows. (b) the
    // All-Courses state drops the empty-card button entirely: a "Search courses"
    // button that merely re-focused the hero field directly above it was a
    // second competing search affordance. The teaching copy already points at
    // the hero ("Search above…") and the quiet add-by-hand link still sits under
    // it, so the empty card is now purely a teaching panel — one primary search
    // path, one secondary add path, no duplicate CTA.
    h += '<div style="margin:24px 16px;padding:28px 24px;text-align:center;background:var(--cb-paper);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-sm)">';
    h += '<div style="margin-bottom:10px"><svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="var(--cb-brass)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M18 6v30"/><path d="M18 6l13 4-13 4"/><ellipse cx="22" cy="38" rx="14" ry="3.5"/></svg></div>';
    h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--cream);margin-bottom:4px">';
    h += showOurs ? "No league courses yet." : "Your directory is quiet.";
    h += '</div>';
    h += '<div style="font-size:13px;color:var(--cb-mute);line-height:1.5;max-width:300px;margin:0 auto 14px">';
    if (showOurs) {
      h += "Once league members log a round at a course, it shows up here with shared best-scores. Try All Courses to see the full directory.";
    } else {
      h += "Search above to find your course from thousands worldwide — it gets added the moment you pick it.";
    }
    h += '</div>';
    // Only "Our Courses" carries a CTA here (a real navigation: jump to the
    // full directory). The All-Courses empty card is teaching-only — its action
    // is the hero search above, which the body copy already directs to.
    if (showOurs) {
      h += '<button class="btn-sm green" onclick="window._courseViewMode=undefined;Router.go(\'courses\',{},true)" style="font-size:12px;min-height:44px;padding:10px 20px">View all courses</button>';
    }
    h += '</div>';
  } else {
    h += '<div style="text-align:center;padding:12px;font-size:11px;color:var(--cb-mute)">' + courses.length + (showOurs ? ' league' : '') + ' course' + (courses.length !== 1 ? 's' : '') + '</div>';
  }
  document.querySelector('[data-page="courses"]').innerHTML = h;
  // v8.25.66 — entrance reveal on the directory rows (reduced-motion no-ops inside).
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="courses"] .course-dir-item'), { gap: 35, duration: 300 });
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
      manualEl.innerHTML = '<div style="padding:0 16px 8px"><div class="card" style="cursor:pointer" onclick="quickAddCourseFromDir(\'' + escHtml(val.trim()).replace(/'/g, "\\'") + '\')"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:var(--cream)">' + escHtml(val.trim()) + '</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Not in directory, tap to add manually</div></div><div style="font-size:10px;color:var(--cb-brass);font-weight:600">+ Add</div></div></div></div>';
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
      if (apiEl) apiEl.innerHTML = '<div style="padding:4px 16px;font-size:10px;color:var(--cb-mute)">Searching online…</div>';
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
    if (apiEl) apiEl.innerHTML = '<div style="padding:4px 16px;font-size:10px;color:var(--cb-mute)">Online search unavailable</div>';
  });
}

function _renderDirApiResults(courses, el, query) {
  if (!el) return;
  var filtered = courses.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  if (!filtered.length) { el.innerHTML = ""; return; }
  var h = '<div style="padding:4px 16px 2px;font-size:9px;color:var(--cb-brass);text-transform:uppercase;letter-spacing:.5px;font-weight:700">Online Results</div>';
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

// ── Course auto-create (v8.24.42, #26) ──────────────────────────────────
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

function importDirApiCourse(idx) {
  var cacheKeys = Object.keys(_gcSearchCache).filter(function(k){return k.indexOf("dir_")===0});
  var lastResults = cacheKeys.length ? _gcSearchCache[cacheKeys[cacheKeys.length - 1]] : [];
  var filtered = lastResults.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  var c = filtered[idx];
  if (!c) return;
  // v8.24.42 — doc building extracted to pbImportApiCourse (shared with auto-create)
  var course = pbImportApiCourse(c);
  Router.toast((course ? course.name : "Course") + " imported");
  Router.go("courses");
}

function quickAddCourseFromDir(name, _state) {
  // v8.24.34 — branded pbPrompt (was a native prompt()).
  if (_state === undefined) {
    pbPrompt({ title: "Which state?", placeholder: "e.g. VA, PA, NC", confirmLabel: "Add course" })
      .then(function(st) { if (st !== null) quickAddCourseFromDir(name, st); });
    return;
  }
  var state = _state;
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
  });
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
    h += '<div id="' + containerId + '-api"><div class="sr-section" style="color:var(--cb-mute)">Searching online…</div></div>';
  }
  
  // Quick add at bottom
  if (!exactMatch) {
    h += '<div class="sr-item" onclick="' + onQuickAdd(val) + ';pbDismissKeyboard()">';
    h += '<div><div class="sr-name" style="color:var(--cb-brass)">+ Add "' + escHtml(val) + '"</div><div class="sr-meta">Not in results? Add manually</div></div>';
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
    if (apiContainer) apiContainer.innerHTML = '<div style="font-size:10px;color:var(--cb-mute);padding:4px 12px">Online search unavailable</div>';
  });
}

function _renderApiResults(courses, apiContainer, containerId, onSelect, query) {
  if (!apiContainer) return;
  var filtered = courses.filter(function(c) {
    var name = c.course_name || c.club_name || c.name || c.courseName || "";
    return !PB.getCourseByName(name);
  });
  if (!filtered.length) {
    apiContainer.innerHTML = '<div style="font-size:10px;color:var(--cb-mute);padding:6px 12px">No online results</div>';
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

// Extracted to src/pages/courses-detail.js per W1.A5. Originally lines 437-774 of this file.

function promptAddCourse() {
  Router.go("courses", { add: true });
}

function renderAddCourseForm() {
  var h = '<div class="sh"><h2>Add course</h2><button class="back" onclick="Router.back(\'courses\')">← Back</button></div>';
  h += '<div class="form-section"><div class="form-title">New course</div>';
  // v8.25.51 — chart from a scorecard photo (Founder: "add a course via a photo
  // scan or upload"). The photo is a CLIENT-SIDE reference you read off while
  // filling in the details — it is NOT uploaded or stored, so there is zero risk
  // to the shared course-data path. (Auto-fill OCR is the gated follow-up —
  // task-queue/founder/course-photo-scan-decision.md.) Camera or library.
  h += '<label class="ac-photo"><input type="file" accept="image/*" capture="environment" onchange="_acPhotoPreview(this)" style="display:none">';
  h += '<div id="ac-photo-empty" class="ac-photo__empty"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3l2-2h8l2 2h3v12H3z"/><circle cx="12" cy="13" r="3.5"/></svg><span>Snap or upload a scorecard to chart from</span></div>';
  h += '<img id="ac-photo-img" alt="Scorecard reference" style="display:none;width:100%;border-radius:10px;margin-bottom:10px"></label>';
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

// v8.25.51 — show the picked scorecard photo as an on-screen reference (client
// only; not uploaded). Global (called from the form's inline onchange, like
// submitAddCourse). Revokes any prior object URL to avoid a leak on re-pick.
var _acPhotoUrl = null;
function _acPhotoPreview(input) {
  var f = input && input.files && input.files[0];
  if (!f) return;
  var img = document.getElementById("ac-photo-img");
  var empty = document.getElementById("ac-photo-empty");
  try {
    if (_acPhotoUrl) { try { URL.revokeObjectURL(_acPhotoUrl); } catch (e) {} }
    _acPhotoUrl = URL.createObjectURL(f);
    if (img) { img.src = _acPhotoUrl; img.style.display = "block"; }
    if (empty) empty.style.display = "none";
  } catch (e) {}
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
  // v8.24.10 — FIX dead-end: PB.addCourse is in-memory only ("courses are
  // Firestore-authoritative"), and this path never called syncCourse, so a
  // manually added course EVAPORATED on reload. Persist it with the same
  // provenance stamp the community-scorecard flow uses, so it renders the
  // UNVERIFIED badge and enters the existing verify lifecycle.
  if (c) {
    if (!c.communityData) {
      c.communityData = {
        status: "community_added",
        contributorId: (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : "",
        contributorName: (typeof currentProfile !== "undefined" && currentProfile) ? (currentProfile.name || currentProfile.username || "") : "",
        contributedAt: (typeof fsTimestamp === "function") ? fsTimestamp() : null,
        source: "member-charted",
        verifications: []
      };
    }
    if (typeof syncCourse === "function") syncCourse(c);
    Router.toast(name + " added!");
    Router.go("courses", { id: c.id });
  }
}

function showTeeScorecard(courseId, teeIdx) {
  var c = PB.getCourse(courseId) || PB.getCourseByName(courseId);
  if (!c || !c.allTees || !c.allTees[teeIdx]) return;
  var tee = c.allTees[teeIdx];
  var holes = tee.holes || [];
  var area = document.getElementById("courseScorecardArea");
  if (!area) return;

  var h = '<div style="padding:0 16px 4px;font-size:12px;font-weight:600;color:var(--cb-brass)">' + escHtml(tee.name) + ' <span style="font-size:10px;color:var(--muted);font-weight:400">' + (tee.yards ? tee.yards.toLocaleString() + ' yds · ' : '') + 'Rating ' + (tee.rating||'—') + ' · Slope ' + (tee.slope||'—') + '</span></div>';

  if (holes.length === 18) {
    h += '<div style="overflow-x:auto;padding:0 16px 12px">';
    // Front 9
    h += '<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px">';
    h += '<tr style="color:var(--cb-brass);font-weight:700"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3)">Hole</td>';
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
    h += '<tr style="color:var(--cb-brass);font-weight:700"><td style="padding:4px 6px;border:1px solid var(--border);background:var(--bg3)">Hole</td>';
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
    h += '<div style="text-align:center;margin-top:6px;font-size:11px;color:var(--cb-brass);font-weight:600">Total: Par ' + (fp+bp);
    if (holes[0].yardage) h += ' · ' + (fy+by).toLocaleString() + ' yards';
    h += '</div></div>';
  } else {
    h += '<div style="padding:4px 16px;font-size:11px;color:var(--cb-mute)">No hole-by-hole data available for this tee</div>';
  }
  area.innerHTML = h;
}

function togglePlayNowFirGir(wrapper, hole, type) {
  liveState[type][hole] = !liveState[type][hole];
  saveLiveState(); // persist stat change for crash recovery
  var val = liveState[type][hole];
  var el = wrapper.querySelector("div");
  if (!el) return;
  var color = type === "fir" ? "var(--birdie)" : "var(--cb-brass)";
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
  var color = type === "fir" ? "var(--birdie)" : "var(--cb-brass)";
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
  var photoInput = document.getElementById("rev-photo");

  function _saveReview(photoData) {
    var review = { rating:rating, text:text, by:reviewerName, date:localDateStr(), helpful:[] };
    if (photoData) review.photo = photoData;
    PB.addCourseReview(courseId, review);
    var course = PB.getCourse(courseId);
    if (course) syncCourse(course);
    if (db) {
      var revDoc = { courseId:courseId, courseName:course?course.name:"", rating:rating, text:text, by:reviewerName, userId:currentUser?currentUser.uid:"", helpful:[], createdAt:fsTimestamp() };
      if (photoData) revDoc.photo = photoData;
      db.collection("course_reviews").add(revDoc).catch(function(e) { pbWarn("[Review] Firestore save failed:", e.message); });
    }
    Router.toast("Review added!");
    Router.go("courses", { id: courseId });
  }

  // Handle optional photo
  if (photoInput && photoInput.files && photoInput.files[0]) {
    Router.toast("Saving review...");
    var reader = new FileReader();
    reader.onload = function(e) { compressPhoto(e.target.result, PHOTO_MAX_KB, 600, function(c) { _saveReview(c); }); };
    reader.readAsDataURL(photoInput.files[0]);
    return;
  }
  _saveReview(null);
}

function voteReviewHelpful(courseId, reviewIdx) {
  if (!currentUser || !db) return;
  var c = PB.getCourse(courseId);
  if (!c || !c.reviews || !c.reviews[reviewIdx]) return;
  var review = c.reviews[reviewIdx];
  if (!review.helpful) review.helpful = [];
  var uid = currentUser.uid;
  var idx = review.helpful.indexOf(uid);
  if (idx !== -1) review.helpful.splice(idx, 1);
  else review.helpful.push(uid);
  syncCourse(c);
  Router.go("courses", { id: courseId }, true);
}

function setReviewStars(n) {
  document.getElementById("rev-rating").value = n;
  var stars = document.querySelectorAll("#rev-stars span");
  stars.forEach(function(s) { s.style.color = parseInt(s.dataset.star) <= n ? "var(--cb-brass)" : "var(--bg3)"; });
}

// ═══ COMMUNITY SCORECARD SYSTEM ═══

function showScorecardEditor(courseId) {
  var c = PB.getCourse(courseId);
  if (!c) return;
  var cd = c.communityData || {};
  // v8.24.10 — FIX pre-fill: c.holes items are OBJECTS ({par, yardage,
  // handicap} per _extractTeeData), so feeding them straight into the
  // integer comparisons below made every select silently fall back to the
  // first option (par 3) for API-sourced courses. Normalize to par ints.
  var existingPars = (cd.holePars || c.holes || []).map(function(hp) {
    return (hp && typeof hp === "object") ? hp.par : hp;
  });
  // Pre-fill from API or existing community data
  var numHoles = 18;

  var h = '<div class="sh"><h2>Edit Scorecard</h2><button class="back" onclick="Router.go(\'courses\',{id:\'' + courseId + '\'})">← Back</button></div>';
  h += '<div style="padding:16px">';
  h += '<div style="font-size:14px;font-weight:700;color:var(--cream);margin-bottom:4px">' + escHtml(c.name) + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-bottom:16px">' + escHtml(c.loc || '') + '</div>';

  // Tee info
  h += '<div style="display:flex;gap:8px;margin-bottom:12px">';
  h += '<div class="ff" style="flex:1"><label class="ff-label">Tee name</label><input class="ff-input" id="sc-tee" value="' + escHtml(cd.teeName || c.tee || 'White') + '" placeholder="e.g. White"></div>';
  h += '<div class="ff" style="flex:1"><label class="ff-label">Slope</label><input class="ff-input" type="number" id="sc-slope" value="' + (cd.slope || c.slope || '') + '" placeholder="113"></div>';
  h += '<div class="ff" style="flex:1"><label class="ff-label">Rating</label><input class="ff-input" type="number" step="0.1" id="sc-rating" value="' + (cd.rating || c.rating || '') + '" placeholder="72.0"></div>';
  h += '</div>';

  // Hole-by-hole par entry
  h += '<div style="font-size:11px;font-weight:600;color:var(--cb-brass);margin-bottom:8px">Hole Pars</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-bottom:8px">';
  for (var hi = 0; hi < 9; hi++) {
    var val = existingPars[hi] || 4;
    h += '<div style="text-align:center"><div style="font-size:8px;color:var(--muted);margin-bottom:2px">' + (hi + 1) + '</div>';
    h += '<select class="ff-input" id="sc-par-' + hi + '" style="padding:6px 2px;font-size:12px;text-align:center;min-width:0"><option value="3"' + (val==3?' selected':'') + '>3</option><option value="4"' + (val==4?' selected':'') + '>4</option><option value="5"' + (val==5?' selected':'') + '>5</option></select></div>';
  }
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-bottom:16px">';
  for (var hi2 = 9; hi2 < 18; hi2++) {
    var val2 = existingPars[hi2] || 4;
    h += '<div style="text-align:center"><div style="font-size:8px;color:var(--muted);margin-bottom:2px">' + (hi2 + 1) + '</div>';
    h += '<select class="ff-input" id="sc-par-' + hi2 + '" style="padding:6px 2px;font-size:12px;text-align:center;min-width:0"><option value="3"' + (val2==3?' selected':'') + '>3</option><option value="4"' + (val2==4?' selected':'') + '>4</option><option value="5"' + (val2==5?' selected':'') + '>5</option></select></div>';
  }
  h += '</div>';

  h += '<button class="btn full green" onclick="submitScorecardData(\'' + courseId + '\')">Submit Scorecard Data</button>';
  h += '<div style="font-size:9px;color:var(--muted);text-align:center;margin-top:6px">Your contribution helps everyone get accurate stats</div>';
  h += '</div>';
  document.querySelector('[data-page="courses"]').innerHTML = h;
}

function submitScorecardData(courseId) {
  if (!currentUser || !db) { Router.toast("Sign in required"); return; }
  var c = PB.getCourse(courseId);
  if (!c) return;

  var pars = [];
  for (var i = 0; i < 18; i++) {
    var el = document.getElementById("sc-par-" + i);
    pars.push(parseInt(el ? el.value : 4));
  }
  var teeName = (document.getElementById("sc-tee") || {}).value || "White";
  var slope = parseInt((document.getElementById("sc-slope") || {}).value) || c.slope || 113;
  var rating = parseFloat((document.getElementById("sc-rating") || {}).value) || c.rating || 72;
  var parTotal = pars.reduce(function(a, b) { return a + b; }, 0);

  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
  var isFirstContribution = !c.communityData || c.communityData.status === "api_only";

  var communityData = {
    status: "community_added",
    holePars: pars,
    parTotal: parTotal,
    teeName: teeName,
    slope: slope,
    rating: rating,
    contributorId: currentUser.uid,
    contributorName: myName,
    contributedAt: fsTimestamp(),
    verifications: []
  };

  // v8.24.10 — FIX dead-end: this only wrote communityData.holePars, a field
  // live scoring NEVER reads (playnow.js resolves pars from allTees[].holes
  // then c.holes), so contributed pars never reached the in-round hole grid.
  // Write the consumed shape too — but ONLY when the course lacks API tee
  // data: API allTees carry yardage + handicap this editor doesn't collect,
  // and overwriting them with par-only entries would destroy richer data.
  var updates = { communityData: communityData, par: parTotal };
  var holeObjs = pars.map(function(p) { return { par: p }; });
  if (!c.allTees || !c.allTees.length) {
    updates.holes = holeObjs;
    updates.allTees = [{ name: teeName, rating: rating, slope: slope, par: parTotal, yards: c.yards || 0, holes: holeObjs }];
    updates.tee = teeName;
    updates.rating = rating;
    updates.slope = slope;
  }

  // Update the course doc
  db.collection("courses").doc(courseId).update(updates).then(function() {
    // Also update local cache
    c.communityData = communityData;
    c.par = parTotal;
    if (updates.holes) {
      c.holes = updates.holes;
      c.allTees = updates.allTees;
      c.tee = updates.tee;
      c.rating = updates.rating;
      c.slope = updates.slope;
    }

    // Award ParCoins for first contribution
    if (isFirstContribution) {
      awardCoins(currentUser.uid, 50, "scorecard_contribution", "Scorecard data for " + c.name, "sc_" + courseId);
      Router.toast("Scorecard submitted! +50 ParCoins");
    } else {
      Router.toast("Scorecard edit submitted!");
    }
    Router.go("courses", { id: courseId });
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't submit the scorecard.")); });
}

function verifyCourseData(courseId) {
  if (!currentUser || !db) return;
  var c = PB.getCourse(courseId);
  if (!c || !c.communityData) return;

  var myName = currentProfile ? (currentProfile.name || currentProfile.username) : "A Parbaugh";
  var verification = { uid: currentUser.uid, name: myName, at: new Date().toISOString() };
  var verifications = (c.communityData.verifications || []).concat([verification]);
  var newStatus = verifications.length >= 2 ? "verified" : c.communityData.status;

  db.collection("courses").doc(courseId).update({
    "communityData.verifications": verifications,
    "communityData.status": newStatus
  }).then(function() {
    c.communityData.verifications = verifications;
    c.communityData.status = newStatus;
    awardCoins(currentUser.uid, 10, "scorecard_verify", "Verified scorecard at " + c.name, "scv_" + courseId);
    Router.toast("Data verified! +10 ParCoins" + (newStatus === "verified" ? ". Course is now Community Verified!" : ""));
    Router.go("courses", { id: courseId });
  }).catch(function(e) { Router.toast(pbErrMsg(e, "Couldn't verify the course data.")); });
}

