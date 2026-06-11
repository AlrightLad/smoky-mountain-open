// ========== COMMISSIONER / FOUNDER ADMIN PANEL (3i editorial) ==========
// Editorial reskin per CLUBHOUSE_SPEC-HQ-3i: utility masthead ("Admin." 40px),
// sticky section-nav rail with scroll-spy, flat sectioned panels. All existing
// element IDs + handlers preserved; only presentation changed. Unauthorized
// access renders the deliberate 404 obscurity state (3i.3) — does NOT
// acknowledge that an admin surface exists.

Router.register("admin", function() {
  var page = document.querySelector('[data-page="admin"]');
  if (!page) return;

  // 3i.3 — Route guard is defense-in-depth alongside server-side Firestore
  // rules. Members without admin role get a generic 404, not "access denied":
  // no signal to a probing user that a permission tier exists here.
  if (!isFounderRole(currentProfile)) {
    page.innerHTML =
      '<div class="adm-404">' +
        '<div class="adm-404__eyebrow">404 &middot; Not found</div>' +
        '<h1 class="adm-404__headline">Nothing here.</h1>' +
        '<div class="adm-404__body">Return to your clubhouse.</div>' +
        '<button class="adm-404__cta" onclick="Router.go(\'home\')">&larr; Back to Parbaughs</button>' +
      '</div>';
    return;
  }

  var isFounder = (currentProfile && currentProfile.platformRole === "founder") || platformRoleOf(currentProfile) === "founder";
  var eyebrow = isFounder ? "Founder &middot; Platform &middot; All leagues" : "Commissioner";

  var NAV = [
    { k: "reports", label: "Reports", title: "Member reports", note: "" },
    { k: "members", label: "Members", title: "Member management", note: "Manage invite quotas, suspensions, and removals." },
    { k: "trophies", label: "Trophies", title: "Trophy catalog", note: "Compose and manage custom trophies. Platform-wide trophies appear in every league; league trophies appear only here." },
    { k: "invites", label: "Invites", title: "Invite codes", note: "" },
    { k: "generate", label: "Generate", title: "Bulk generate", note: "Create multiple invite codes at once." },
    { k: "requests", label: "Requests", title: "Feature requests", note: "" },
    { k: "errors", label: "Errors", title: "Error log", note: "" },
    { k: "courses", label: "Courses", title: "Course management", note: "Remove duplicate or incorrectly added courses. API-imported courses are preferred." },
    { k: "api", label: "API", title: "API integration", note: "" },
    { k: "diagnostic", label: "Diagnostic", title: "Data diagnostic", note: "Full read-only audit of every Firestore collection. Compares live data to expected state. Changes nothing." },
    { k: "recovery", label: "Recovery", title: "Data recovery", note: "Scan for documents missing their league tag and repair them. Run the diagnostic first." }
  ];

  // Per-section body markup keyed by NAV.k. Loader containers keep their exact
  // legacy IDs so the data-loading handlers below bind unchanged.
  var savedApiKey = localStorage.getItem("golfcourse_api_key") || "";
  var bodies = {
    reports: '<div id="adminReports"><div class="adm-empty">Loading…</div></div>',
    members: '<div id="adminMemberList"><div class="adm-empty">Loading…</div></div>',
    trophies:
      '<button class="adm-btn adm-btn--brass adm-btn--full" onclick="Router.go(\'trophycreate\',{from:\'admin\',scope:\'platform\'})">+ New trophy</button>' +
      '<div id="adminTrophyCatalog" style="margin-top:14px"><div class="adm-empty">Loading…</div></div>',
    invites: '<div id="adminInviteList"><div class="adm-empty">Loading…</div></div>',
    generate:
      '<div class="ff"><label class="ff-label" for="bulkCount">How many codes?</label>' +
      '<select id="bulkCount" class="ff-input"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option></select></div>' +
      '<button class="adm-btn adm-btn--brass adm-btn--full" onclick="bulkGenerateInvites()">Generate invites</button>' +
      '<div id="bulkResult"></div>',
    requests: '<div id="adminFeatureRequests"><div class="adm-empty">Loading…</div></div>',
    errors: '<div id="adminErrorLog"><div class="adm-empty">Loading…</div></div>',
    courses:
      '<button class="adm-btn" onclick="loadAdminCourses()">Load course list</button>' +
      '<div id="adminCourseList" style="margin-top:14px"></div>',
    api:
      '<div class="adm-panel" style="padding:16px">' +
        '<div class="adm-row__title">GolfCourseAPI.com</div>' +
        '<div class="adm-note" style="margin:6px 0 12px">Powers the 30,000+ course search for all members. Key is stored in Firestore and loads for everyone automatically.</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
          '<input type="text" class="ff-input" id="gcapi-key" value="' + escHtml(savedApiKey) + '" placeholder="Paste API key" style="flex:1;-webkit-user-select:text;user-select:text" onkeydown="if(event.key===\'Enter\')saveGolfApiKey()" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
          '<button class="adm-btn adm-btn--xs" onclick="pasteApiKey()">Paste</button>' +
          '<button class="adm-btn adm-btn--brass adm-btn--xs" onclick="saveGolfApiKey()">Save</button>' +
        '</div>' +
        (savedApiKey ? '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--cb-moss);margin-top:8px">Active key saved</div>' : '') +
      '</div>',
    diagnostic:
      '<button class="adm-btn adm-btn--full" onclick="runFullDiagnostic()">Run full diagnostic</button>' +
      '<div id="diagnosticResult" style="margin-top:12px"></div>',
    recovery:
      '<button class="adm-btn adm-btn--full" onclick="runDataRecoveryScan()">Scan for missing data</button>' +
      '<div id="recoveryResult" style="margin-top:12px"></div>'
  };

  var navHtml = NAV.map(function(s) {
    return '<a class="adm-nav__link" data-sec="' + s.k + '" role="link" tabindex="0" onclick="adminScrollToSection(\'' + s.k + '\')" onkeydown="if(event.key===\'Enter\')adminScrollToSection(\'' + s.k + '\')">' + s.label + '</a>';
  }).join('');

  var sectionsHtml = NAV.map(function(s) {
    return '<section class="adm-section" id="adm-sec-' + s.k + '" data-sec="' + s.k + '">' +
      '<div class="adm-section__head"><h2 class="adm-section__title">' + s.title + '</h2>' +
      '<span class="adm-section__meta" id="adm-meta-' + s.k + '"></span></div>' +
      (s.note ? '<div class="adm-note">' + s.note + '</div>' : '') +
      bodies[s.k] +
    '</section>';
  }).join('');

  page.innerHTML =
    '<div class="adm-wrap">' +
      '<button class="adm-back" onclick="Router.go(\'settings\')">&larr; Settings</button>' +
      '<header class="adm-mast"><div class="adm-eyebrow">' + eyebrow + '</div><h1 class="adm-headline">Admin.</h1></header>' +
      '<div class="adm-grid">' +
        '<nav class="adm-nav" aria-label="Admin sections">' + navHtml + '</nav>' +
        '<div class="adm-main">' + sectionsHtml + '</div>' +
      '</div>' +
    '</div>';

  // Scroll-spy — light the nav-rail entry whose section is crossing the
  // masthead. Mirrors the Settings rail (rootMargin biases toward the top).
  try {
    var links = page.querySelectorAll(".adm-nav__link");
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (!en.isIntersecting) return;
        var k = en.target.getAttribute("data-sec");
        links.forEach(function(l) {
          var on = l.getAttribute("data-sec") === k;
          l.classList.toggle("adm-nav__link--active", on);
          if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-88px 0px -65% 0px" });
    page.querySelectorAll(".adm-section").forEach(function(s) { obs.observe(s); });
  } catch (e) {}

  loadAdminReports();
  loadAdminMemberList();
  loadAdminInviteList();
  loadAdminFeatureRequests();
  loadAdminErrorLog();
  // Seed the 5 starter trophies (idempotent) then paint the catalog.
  if (typeof seedStarterTrophies === "function") seedStarterTrophies(function() { loadAdminTrophyCatalog(); });
  else loadAdminTrophyCatalog();
});

function adminScrollToSection(key) {
  var el = document.getElementById("adm-sec-" + key);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function admSetMeta(key, text) {
  var el = document.getElementById("adm-meta-" + key);
  if (el) el.textContent = text || "";
}

// ── Trophy catalog (3q.3) ─────────────────────────────────────────────────────
function loadAdminTrophyCatalog() {
  var el = document.getElementById("adminTrophyCatalog");
  if (!el) return;
  if (typeof loadTrophyCatalog !== "function") { el.innerHTML = '<div class="adm-empty">Trophy catalog unavailable.</div>'; return; }
  loadTrophyCatalog(function(defs) { renderAdminTrophyCatalog(defs || []); });
}

function renderAdminTrophyCatalog(defs) {
  var el = document.getElementById("adminTrophyCatalog");
  if (!el) return;
  var active = defs.filter(function(d) { return d && d.active !== false; });
  admSetMeta("trophies", active.length + (active.length === 1 ? " trophy" : " trophies"));
  if (!active.length) {
    el.innerHTML = '<div class="adm-empty">No trophies yet. Use the New trophy button above to compose the first one.</div>';
    return;
  }
  el.innerHTML = '<div class="adm-panel">' + active.map(adminTrophyRow).join("") + '</div>';
}

function adminTrophyRow(d) {
  var emblem = (typeof trophyEmblemSvg === "function") ? trophyEmblemSvg(d) : "";
  var summary = (typeof trophyCriteriaSummary === "function" && trophyCriteriaSummary(d)) || "";
  var scopePill = d.scope === "platform" ? '<span class="adm-pill">Platform</span>' : '<span class="adm-pill adm-pill--mute">League</span>';
  var earned = "";
  if (typeof evaluateTrophy === "function") {
    var m = (typeof pbTrophyMeasure === "function") ? pbTrophyMeasure(d.criteria && d.criteria.measure) : null;
    if (m && m.computable) {
      var n = (evaluateTrophy(d).earnedIds || []).length;
      earned = '<span class="adm-pill ' + (n > 0 ? 'adm-pill--ok' : 'adm-pill--mute') + '">' + n + ' earned</span>';
    } else {
      earned = '<span class="adm-pill adm-pill--mute">Leader pending</span>';
    }
  }
  var sid = String(d.id || "").replace(/'/g, "\\'");
  var sscope = d.scope === "platform" ? "platform" : "league";
  return '<div class="adm-row">' +
    '<div class="adm-trophy-emblem">' + (emblem || "") + '</div>' +
    '<div class="adm-row__main">' +
      '<div class="adm-row__title">' + escHtml(d.name || "Untitled") + ' ' + scopePill + ' ' + earned + '</div>' +
      '<div class="adm-row__sub">' + escHtml(summary) + '</div>' +
      '<div class="adm-row__actions">' +
        '<button class="adm-btn adm-btn--xs" onclick="Router.go(\'trophycreate\',{from:\'admin\',editId:\'' + sid + '\'})">Edit</button>' +
        '<button class="adm-btn adm-btn--xs" onclick="Router.go(\'trophyroom\')">View wall</button>' +
        '<button class="adm-btn adm-btn--claret adm-btn--xs" onclick="adminArchiveTrophy(\'' + sid + '\',\'' + sscope + '\')">Archive</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function adminArchiveTrophy(id, scope, _confirmed) {
  if (typeof archiveTrophyDef !== "function") return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Archive this trophy?", message: "It stops appearing for members but is not deleted.", confirmLabel: "Archive", danger: false })
      .then(function(ok) { if (ok) adminArchiveTrophy(id, scope, true); });
    return;
  }
  archiveTrophyDef(id, scope, function(ok, err) {
    if (ok) { Router.toast("Trophy archived"); loadAdminTrophyCatalog(); }
    else Router.toast(err || "Failed to archive");
  });
}

// v8.24.92 — Feedback triage board. Was request-only: it rendered r.request +
// r.fromName, so bug reports (which bugreport.js writes as `description` /
// `submitterName`) showed BLANK titles and the wrong author — half the feedback
// was invisible. Now normalizes BOTH writer shapes, surfaces type/severity/
// page/steps, shows the Caddy's triage read (agentVerdict/agentNote) when the
// scan loop has set it, filters by type, and uses the shared status lifecycle:
//   new -> accepted -> building -> shipped   (or declined at any point)
// Founder taps Accept/Reject; the agent drives building -> shipped.
var _frDocs = [];        // normalized docs from last load (for client-side filter)
var _frFilter = "all";   // all | bug | ux | feature | content
var FR_TYPE_LABEL = { bug: "Bug", ux: "UX", feature: "Feature", content: "Content" };

function _frNorm(doc) {
  var d = doc.data() || {};
  return {
    _id: doc.id,
    body: d.description || d.request || "(no description)",
    name: d.submitterName || d.fromName || "Member",
    type: d.type || "feature",
    severity: d.severity || "",
    page: d.page || "",
    steps: d.steps || "",
    status: d.status || "new",
    agentVerdict: d.agentVerdict || "",   // build | discuss | decline (set by the triage loop)
    agentNote: d.agentNote || "",
    createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null
  };
}

// Legacy values map forward so old docs render correctly: reviewing->building,
// done->shipped.
function _frStatusPill(s) {
  if (s === "shipped" || s === "done") return "adm-pill--mute";
  if (s === "declined") return "adm-pill--bad";
  if (s === "building" || s === "reviewing") return "adm-pill--warn";
  return "adm-pill--ok"; // accepted | new
}
function _frStatusLabel(s) {
  if (s === "done") return "shipped";
  if (s === "reviewing") return "building";
  return s || "new";
}

function loadAdminFeatureRequests() {
  var el = document.getElementById("adminFeatureRequests");
  if (!el) return;
  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }
  db.collection("feature_requests").orderBy("createdAt", "desc").limit(50).get().then(function(snap) {
    _frDocs = []; snap.forEach(function(d) { _frDocs.push(_frNorm(d)); });
    paintAdminFeatureRequests();
  }).catch(function() {
    // orderBy may fail without an index — fall back to unordered + sort client-side.
    db.collection("feature_requests").limit(50).get().then(function(snap2) {
      _frDocs = []; snap2.forEach(function(d) { _frDocs.push(_frNorm(d)); });
      _frDocs.sort(function(a, b) { return (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0); });
      paintAdminFeatureRequests();
    }).catch(function() { el.innerHTML = renderLoadError("feedback", "loadAdminFeatureRequests()"); });
  });
}

function setFeedbackFilter(f) { _frFilter = f; paintAdminFeatureRequests(); }

function paintAdminFeatureRequests() {
  var el = document.getElementById("adminFeatureRequests");
  if (!el) return;
  var all = _frDocs;
  admSetMeta("requests", all.length ? all.length + (all.length === 1 ? " item" : " items") : "none yet");
  if (!all.length) { el.innerHTML = '<div class="adm-empty">No feedback yet. Bug reports + feature requests land here.</div>'; return; }

  // Filter chips — only offer a type chip when items of that type exist.
  var counts = { all: all.length, bug: 0, ux: 0, feature: 0, content: 0 };
  all.forEach(function(r) { if (counts[r.type] != null) counts[r.type]++; });
  var chipDefs = [["all", "All"], ["bug", "Bugs"], ["feature", "Features"], ["ux", "UX"], ["content", "Content"]];
  var chips = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';
  chipDefs.forEach(function(c) {
    if (c[0] !== "all" && !counts[c[0]]) return;
    var on = _frFilter === c[0];
    chips += '<button class="adm-btn adm-btn--xs' + (on ? ' adm-btn--brass' : '') + '" onclick="setFeedbackFilter(\'' + c[0] + '\')">' + c[1] + ' ' + counts[c[0]] + '</button>';
  });
  chips += '</div>';

  var docs = _frFilter === "all" ? all : all.filter(function(r) { return r.type === _frFilter; });
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var h = chips + '<div class="adm-panel">';
  if (!docs.length) h += '<div class="adm-empty">No ' + escHtml(_frFilter) + ' items.</div>';
  docs.forEach(function(r) {
    var dateStr = r.createdAt ? (MONTHS[r.createdAt.getMonth()] + " " + r.createdAt.getDate()) : "";
    var typeColor = r.type === "bug" ? "var(--red)" : r.type === "ux" ? "var(--gold)" : r.type === "content" ? "var(--muted)" : "var(--birdie)";
    h += '<div class="adm-row"><div class="adm-row__main">';
    // Header row: type badge (+ severity for bugs) and status pill.
    h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">';
    h += '<span style="display:inline-flex;align-items:center;gap:6px"><span style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' + typeColor + ';border:1px solid ' + typeColor + ';border-radius:4px;padding:2px 6px">' + (FR_TYPE_LABEL[r.type] || escHtml(r.type)) + '</span>';
    if (r.severity && r.type === "bug") h += '<span style="font-size:10px;color:var(--muted)">' + escHtml(r.severity) + '</span>';
    h += '</span>';
    h += '<span class="adm-pill ' + _frStatusPill(r.status) + '">' + escHtml(_frStatusLabel(r.status)) + '</span>';
    h += '</div>';
    // Body + optional steps.
    h += '<div class="adm-row__title" style="margin-top:8px;white-space:pre-wrap">' + escHtml(r.body) + '</div>';
    if (r.steps) h += '<div class="adm-row__sub" style="margin-top:6px;white-space:pre-wrap"><strong>Steps:</strong> ' + escHtml(r.steps) + '</div>';
    // Meta line.
    h += '<div class="adm-row__sub" style="margin-top:6px">' + escHtml(r.name) + (dateStr ? ' &middot; ' + dateStr : '') + (r.page ? ' &middot; ' + escHtml(r.page) : '') + '</div>';
    // Caddy's triage read (the agent's recommendation), when the scan loop set it.
    if (r.agentVerdict) {
      var vLabel = r.agentVerdict === "build" ? "Build" : r.agentVerdict === "discuss" ? "Let’s discuss" : r.agentVerdict === "decline" ? "Decline" : escHtml(r.agentVerdict);
      var vColor = r.agentVerdict === "build" ? "var(--birdie)" : r.agentVerdict === "decline" ? "var(--red)" : "var(--gold)";
      h += '<div style="margin-top:10px;padding:8px 10px;background:var(--cb-paper);border-left:2px solid ' + vColor + ';border-radius:4px;font-size:12px;line-height:1.5;color:var(--cb-ink)">';
      h += '<span style="font-weight:600;color:' + vColor + '">⛳ Caddy’s read: ' + vLabel + '</span>';
      if (r.agentNote) h += ' &middot; ' + escHtml(r.agentNote);
      h += '</div>';
    }
    // Actions: Accept / Reject while open; status + Reset once decided.
    h += '<div class="adm-row__actions" style="margin-top:10px">';
    if (r.status === "new" || r.status === "reviewing" || r.status === "building") {
      h += '<button class="adm-btn adm-btn--brass adm-btn--xs" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'accepted\')">Accept</button>';
      h += '<button class="adm-btn adm-btn--xs" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'declined\')">Reject</button>';
    } else {
      var settled = r.status === "accepted" ? "In the build queue" : (r.status === "shipped" || r.status === "done") ? "Shipped" : "Declined";
      h += '<span class="adm-row__sub" style="margin-right:8px">' + settled + '</span>';
      h += '<button class="adm-btn adm-btn--xs" onclick="setFeatureRequestStatus(\'' + r._id + '\',\'new\')">Reset</button>';
    }
    h += '</div></div></div>';
  });
  h += '</div>';
  el.innerHTML = h;
}

function setFeatureRequestStatus(id, status) {
  if (!db) return;
  db.collection("feature_requests").doc(id).update({ status: status, statusUpdatedAt: fsTimestamp() }).then(function() {
    Router.toast(status === "accepted" ? "Accepted — added to the build queue" : status === "declined" ? "Rejected" : "Marked " + status);
    // Patch the cache in place so the board re-paints instantly (no refetch).
    for (var i = 0; i < _frDocs.length; i++) { if (_frDocs[i]._id === id) { _frDocs[i].status = status; break; } }
    paintAdminFeatureRequests();
  }).catch(function() { Router.toast("Failed to update"); });
}

function loadAdminErrorLog() {
  var el = document.getElementById("adminErrorLog");
  if (!el) return;
  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }
  db.collection("errors").orderBy("timestamp", "desc").limit(20).get().then(function(snap) {
    var unresolved = 0;
    var rows = [];
    snap.forEach(function(doc) { rows.push(doc); if (!doc.data().resolved) unresolved++; });
    admSetMeta("errors", snap.empty ? "none logged" : unresolved + " unresolved");
    if (snap.empty) {
      el.innerHTML = '<div class="adm-empty" style="color:var(--cb-moss)">No errors logged.</div>';
      return;
    }
    var h = '<div class="adm-panel">';
    rows.forEach(function(doc) {
      var e = doc.data();
      var isResolved = e.resolved;
      var timeStr = e.timestamp ? new Date(e.timestamp).toLocaleString() : "Unknown";
      var shortMsg = (e.message || "").substring(0, 80);
      var shortStack = (e.stack || "").substring(0, 120);
      h += '<div class="adm-row" style="opacity:' + (isResolved ? '.5' : '1') + '"><div class="adm-row__main">';
      h += '<div class="adm-row__title" style="color:var(--cb-claret);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(shortMsg) + '</div>';
      h += '<div class="adm-row__sub">' + escHtml(timeStr) + ' &middot; ' + escHtml(e.page || "?") + ' &middot; ' + escHtml(e.userName || e.userId || "anon") + '</div>';
      if (shortStack) h += '<div class="adm-row__sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(shortStack) + '</div>';
      h += '</div><div class="adm-row__actions">';
      if (!isResolved) h += '<button class="adm-btn adm-btn--xs" onclick="resolveError(\'' + doc.id + '\')">Resolve</button>';
      h += '</div></div>';
    });
    h += '</div>';
    h += '<button class="adm-btn adm-btn--xs" style="margin-top:10px" onclick="clearResolvedErrors()">Clear resolved</button>';
    el.innerHTML = h;
  }).catch(function() { el.innerHTML = renderLoadError("the error log", "loadAdminErrorLog()"); });
}

function resolveError(errorId) {
  if (!db) return;
  db.collection("errors").doc(errorId).update({ resolved: true }).then(function() {
    Router.toast("Marked resolved");
    loadAdminErrorLog();
  });
}

function clearResolvedErrors() {
  if (!db) return;
  db.collection("errors").where("resolved", "==", true).get().then(function(snap) {
    var batch = db.batch();
    snap.forEach(function(doc) { batch.delete(doc.ref); });
    return batch.commit();
  }).then(function() { Router.toast("Cleared"); loadAdminErrorLog(); });
}

function loadAdminReports() {
  var el = document.getElementById("adminReports");
  if (!el) return;
  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }
  db.collection("reports").where("resolved","==",false).get().then(function(snap) {
    var reports = []; snap.forEach(function(doc) { reports.push(Object.assign({_id:doc.id}, doc.data())); });
    reports.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
    reports = reports.slice(0, 20);
    admSetMeta("reports", reports.length ? reports.length + " pending" : "none pending");
    if (!reports.length) {
      el.innerHTML = '<div class="adm-empty">No pending reports.</div>';
      return;
    }
    var h = '<div class="adm-panel">';
    reports.forEach(function(r) {
      var reporter = PB.getPlayer(r.reportedBy);
      var reported = PB.getPlayer(r.reportedUser);
      h += '<div class="adm-row"><div class="adm-row__main">';
      h += '<div class="adm-row__title" style="color:var(--cb-claret)">' + escHtml(r.reason || "Report") + '</div>';
      h += '<div class="adm-row__sub">' + escHtml(reported ? reported.name : r.reportedUser) + ' &middot; reported by ' + escHtml(reporter ? reporter.name : r.reportedBy) + '</div>';
      if (r.details) h += '<div style="font-family:var(--font-display);font-size:13px;font-style:italic;color:var(--cb-ink-soft);margin-top:6px">"' + escHtml(r.details) + '"</div>';
      h += '</div><div class="adm-row__actions">';
      h += '<button class="adm-btn adm-btn--claret adm-btn--xs" onclick="suspendMember(\'' + r.reportedUser + '\',7)">Suspend 7d</button>';
      h += '<button class="adm-btn adm-btn--claret adm-btn--xs" onclick="removeMemberAdmin(\'' + r.reportedUser + '\')">Remove</button>';
      h += '<button class="adm-btn adm-btn--xs" onclick="resolveReport(\'' + r._id + '\')">Dismiss</button>';
      h += '</div></div>';
    });
    h += '</div>';
    el.innerHTML = h;
  }).catch(function() {
    el.innerHTML = renderLoadError("reports", "loadAdminReports()");
  });
}

function loadAdminMemberList() {
  var el = document.getElementById("adminMemberList");
  if (!el) return;
  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }
  db.collection("members").get().then(function(snap) {
    var members = []; snap.forEach(function(doc) { members.push(doc.data()); });
    var localPlayers = PB.getPlayers();
    var allMembers = members.length ? members : localPlayers;
    admSetMeta("members", allMembers.length + (allMembers.length === 1 ? " member" : " members"));

    var h = '<div class="adm-panel">';
    allMembers.forEach(function(m) {
      var used = m.invitesUsed || 0;
      var max = m.maxInvites || 3;
      // v8 platform-role semantics with legacy fallback via platformRoleOf().
      var pRole = platformRoleOf(m);
      var isComm = pRole === "founder";
      var isSuspended = pRole === "suspended";
      var isRemoved = pRole === "banned";

      var pillClass = isSuspended ? "adm-pill--bad" : isRemoved ? "adm-pill--mute" : isComm ? "adm-pill--warn" : "adm-pill--ok";
      var statusText = isSuspended ? "Suspended" : isRemoved ? "Banned" : isComm ? "Founder" : "Active";

      h += '<div class="adm-row"><div class="adm-row__main">';
      h += '<div style="display:flex;align-items:center;gap:8px"><span class="adm-row__title">' + escHtml(m.name || m.username || m.id) + '</span><span class="adm-pill ' + pillClass + '">' + statusText + '</span></div>';

      if (!isComm && !isRemoved) {
        h += '<div class="adm-row__sub" style="margin-top:6px">' + used + ' invites used</div>';
      }
      if (isSuspended && m.suspendedUntil) {
        var until = m.suspendedUntil.toDate ? m.suspendedUntil.toDate() : new Date(m.suspendedUntil);
        h += '<div class="adm-row__sub" style="color:var(--cb-claret)">Suspended until ' + (until.getMonth()+1) + '/' + until.getDate() + '/' + until.getFullYear() + (m.suspendedReason ? ' &middot; ' + escHtml(m.suspendedReason) : '') + '</div>';
      }
      h += '</div><div class="adm-row__actions">';

      // Invite quota stepper (not for founder or removed)
      if (!isComm && !isRemoved) {
        h += '<div class="adm-step"><button class="adm-step__btn" onclick="adjustInvites(\'' + m.id + '\',' + max + ',-1)">&minus;</button><span class="adm-step__val">' + max + '</span><button class="adm-step__btn" onclick="adjustInvites(\'' + m.id + '\',' + max + ',1)">+</button></div>';
      }

      // Moderation (not for self or other founders)
      if (!isComm && m.id !== (currentUser ? currentUser.uid : "")) {
        if (isSuspended) {
          h += '<button class="adm-btn adm-btn--xs" onclick="unsuspendMember(\'' + m.id + '\')">Unsuspend</button>';
        } else if (!isRemoved) {
          h += '<button class="adm-btn adm-btn--xs" onclick="promptSuspend(\'' + m.id + '\',\'' + escHtml(m.name||m.id) + '\')">Suspend</button>';
        }
        if (!isRemoved) {
          h += '<button class="adm-btn adm-btn--claret adm-btn--xs" onclick="removeMemberAdmin(\'' + m.id + '\')">Remove</button>';
        } else {
          h += '<button class="adm-btn adm-btn--xs" onclick="reinstateMember(\'' + m.id + '\')">Reinstate</button>';
        }
      }

      h += '</div></div>';
    });
    h += '</div>';

    el.innerHTML = allMembers.length ? h : '<div class="adm-empty">No members.</div>';
  }).catch(function() {
    el.innerHTML = renderLoadError("the member list", "loadAdminMemberList()");
  });
}

function adjustInvites(memberId, currentMax, delta) {
  if (!db) return;
  var newMax = Math.max(0, currentMax + delta);
  db.collection("members").doc(memberId).update({ maxInvites: newMax }).then(function() {
    Router.toast("Invite limit updated to " + newMax);
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to update"); });
}

// ========== MODERATION ACTIONS ==========

function promptSuspend(memberId, memberName, _days, _reason) {
  // v8.24.34 — branded pbPrompt chain (was two native prompt()s).
  if (_days === undefined) {
    pbPrompt({ title: "Suspend " + memberName + "?", message: "For how many days?", value: "7", confirmLabel: "Next" })
      .then(function(d) { if (d !== null) promptSuspend(memberId, memberName, d, undefined); });
    return;
  }
  if (_reason === undefined) {
    pbPrompt({ title: "Reason for suspension", message: "Visible to the member.", confirmLabel: "Suspend" })
      .then(function(r) { if (r !== null) promptSuspend(memberId, memberName, _days, r); });
    return;
  }
  var days = _days;
  if (!days) return;
  days = parseInt(days);
  if (isNaN(days) || days < 1) { Router.toast("Enter a valid number of days"); return; }
  var reason = _reason;
  suspendMember(memberId, days, reason);
}

function suspendMember(memberId, days, reason) {
  if (!db || !isFounderRole(currentProfile)) return;
  var until = new Date();
  until.setDate(until.getDate() + days);

  db.collection("members").doc(memberId).update({
    role: "suspended",
    suspendedAt: fsTimestamp(),
    suspendedUntil: firebase.firestore.Timestamp.fromDate(until),
    suspendedBy: currentUser.uid,
    suspendedReason: reason || "Violation of Parbaughs rules"
  }).then(function() {
    // Notify the suspended member
    sendNotification(memberId, {
      type: "suspension",
      title: "Account Suspended",
      message: "Your account has been suspended for " + days + " days." + (reason ? " Reason: " + reason : "")
    });
    Router.toast("Member suspended for " + days + " days");
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to suspend"); });
}

function unsuspendMember(memberId, _confirmed) {
  if (!db) return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Unsuspend this member?", message: "Restores full access immediately.", confirmLabel: "Unsuspend", danger: false })
      .then(function(ok) { if (ok) unsuspendMember(memberId, true); });
    return;
  }
  db.collection("members").doc(memberId).update({
    role: "member",
    suspendedAt: null,
    suspendedUntil: null,
    suspendedBy: null,
    suspendedReason: null
  }).then(function() {
    sendNotification(memberId, {
      type: "unsuspension",
      title: "Suspension Lifted",
      message: "Your account has been reinstated. Welcome back."
    });
    Router.toast("Member unsuspended");
    loadAdminMemberList();
  });
}

function removeMemberAdmin(memberId, _confirmed, _reason) {
  if (!db) return;
  var member = PB.getPlayer(memberId);
  var name = member ? member.name : memberId;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Remove " + name + "?", message: "Revokes their access to the Parbaughs.", confirmLabel: "Remove", danger: true })
      .then(function(ok) { if (ok) removeMemberAdmin(memberId, true); });
    return;
  }
  if (_reason === undefined) {
    pbPrompt({ title: "Reason", message: "Optional — kept in the moderation log.", confirmLabel: "Remove", cancelLabel: "Skip" })
      .then(function(r) { removeMemberAdmin(memberId, true, r === null ? "" : r); });
    return;
  }
  var reason = _reason;

  db.collection("members").doc(memberId).update({
    role: "removed",
    removedAt: fsTimestamp(),
    removedBy: currentUser.uid,
    removedReason: reason || ""
  }).then(function() {
    sendNotification(memberId, {
      type: "removal",
      title: "Account Removed",
      message: "Your membership has been revoked." + (reason ? " Reason: " + reason : "")
    });
    Router.toast(name + " removed");
    loadAdminMemberList();
  }).catch(function() { Router.toast("Failed to remove"); });
}

function reinstateMember(memberId, _confirmed) {
  if (!db) return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Reinstate this member?", message: "Restores their membership.", confirmLabel: "Reinstate", danger: false })
      .then(function(ok) { if (ok) reinstateMember(memberId, true); });
    return;
  }
  db.collection("members").doc(memberId).update({
    role: "member",
    removedAt: null,
    removedBy: null,
    removedReason: null
  }).then(function() {
    sendNotification(memberId, {
      type: "reinstatement",
      title: "Welcome Back",
      message: "Your Parbaughs membership has been reinstated."
    });
    Router.toast("Member reinstated");
    loadAdminMemberList();
  });
}

function resolveReport(reportId) {
  if (!db) return;
  db.collection("reports").doc(reportId).update({ resolved: true, resolvedAt: fsTimestamp(), resolvedBy: currentUser.uid })
    .then(function() { Router.toast("Report dismissed"); loadAdminReports(); });
}

// ========== MEMBER REPORT SYSTEM (any member can report) ==========
// App Store 1.2 — branded report flow (replaces native prompt(), which is
// unreliable in a mobile PWA). A member picks a reason, optionally adds detail,
// and the report is written privately to /reports for the Commissioner.
function _submitMemberReport(memberId, reason, details) {
  return db.collection("reports").add({
    reportedUser: memberId,
    reportedBy: currentUser.uid,
    reason: reason,
    details: details || "",
    resolved: false,
    createdAt: fsTimestamp()
  }).then(function() {
    // Notify commissioner
    var players = PB.getPlayers();
    var commissioner = players.find(function(p) { return isFounderRole(p); });
    if (commissioner) {
      var reported = PB.getPlayer(memberId);
      sendNotification(commissioner.id, {
        type: "report",
        title: "Member Report",
        message: ((currentProfile && currentProfile.name) || "A member") + " reported " + (reported ? reported.name : memberId) + " for " + reason
      });
    }
    Router.toast("Report submitted to the Commissioner");
  }).catch(function(e) {
    Router.toast(typeof pbErrMsg === "function" ? pbErrMsg(e, "Couldn't submit the report. Try again.") : "Couldn't submit the report. Try again.");
  });
}

function reportMember(memberId) {
  if (!db || !currentUser) { Router.toast("Sign in to report"); return; }
  if (memberId === currentUser.uid) { Router.toast("You can't report yourself"); return; }

  var reasons = ["Score falsification", "Vulgar/inappropriate messages", "Unsportsmanlike conduct", "Harassment", "Other"];
  var reasonBtns = reasons.map(function(r) {
    return '<button type="button" class="pb-report-reason tappable" data-reason="' + escHtml(r) + '" style="text-align:left;padding:12px 14px;background:transparent;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;color:var(--cb-ink);cursor:pointer">' + escHtml(r) + '</button>';
  }).join('');

  var selectedReason = null;
  var sheetId = openBottomSheet({
    size: "half",
    title: "Report member",
    content:
      '<div style="padding-top:8px">' +
        '<div style="font-size:13px;color:var(--cb-mute);line-height:1.5;margin-bottom:12px">Reports go privately to the Commissioner. What is the problem?</div>' +
        '<div id="pbReportReasons" style="display:flex;flex-direction:column;gap:8px">' + reasonBtns + '</div>' +
        '<textarea id="pbReportDetails" placeholder="Additional details (optional)" rows="3" style="width:100%;margin-top:12px;padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui);resize:vertical;box-sizing:border-box"></textarea>' +
        '<button id="pbReportSubmit" class="tappable tappable--primary" style="width:100%;margin-top:12px;padding:13px;background:var(--cb-brass);border:none;border-radius:8px;font-size:14px;font-weight:600;color:var(--cb-ink);cursor:pointer;opacity:.5">Submit report</button>' +
      '</div>'
  });

  setTimeout(function() {
    var reasonEls = document.querySelectorAll("#pbReportReasons .pb-report-reason");
    var submitEl = document.getElementById("pbReportSubmit");
    reasonEls.forEach(function(btn) {
      btn.onclick = function() {
        selectedReason = btn.getAttribute("data-reason");
        reasonEls.forEach(function(other) {
          var on = other === btn;
          other.style.borderColor = on ? "var(--cb-brass)" : "var(--cb-chalk-3)";
          other.style.background = on ? "rgba(var(--cb-brass-rgb,180,137,62),.12)" : "transparent";
          other.style.fontWeight = on ? "600" : "400";
        });
        if (submitEl) submitEl.style.opacity = "1";
      };
    });
    if (submitEl) submitEl.onclick = function() {
      if (!selectedReason) { Router.toast("Pick a reason first"); return; }
      var detailsEl = document.getElementById("pbReportDetails");
      var details = detailsEl ? detailsEl.value.trim() : "";
      closeBottomSheet(sheetId);
      _submitMemberReport(memberId, selectedReason, details);
    };
  }, 50);
}

function loadAdminInviteList() {
  var el = document.getElementById("adminInviteList");
  if (!el) return;
  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }
  leagueQuery("invites").orderBy("createdAt", "desc").limit(50).get().then(function(snap) {
    var invites = []; snap.forEach(function(doc) { invites.push(doc.data()); });
    admSetMeta("invites", invites.length ? invites.length + (invites.length === 1 ? " code" : " codes") : "none yet");
    if (!invites.length) { el.innerHTML = '<div class="adm-empty">No invites generated yet.</div>'; return; }

    var h = '<div class="adm-panel">';
    invites.forEach(function(inv) {
      var expired = isInviteExpired(inv);
      var pillClass = inv.status === "active" && !expired ? "adm-pill--ok" : inv.status === "used" ? "adm-pill--warn" : "adm-pill--bad";
      var raw = inv.status || "active";
      var statusText = expired && inv.status === "active" ? "Expired" : raw.charAt(0).toUpperCase() + raw.slice(1);

      h += '<div class="adm-row"><div class="adm-row__main">';
      h += '<div style="display:flex;align-items:center;gap:10px"><span class="adm-code">' + escHtml(inv.code) + '</span><span class="adm-pill ' + pillClass + '">' + statusText + '</span></div>';
      var sub = 'By ' + escHtml(inv.createdByName || "Unknown");
      if (inv.usedBy) sub += ' &middot; used';
      if (inv.expiresAt) {
        var exp = inv.expiresAt.toDate ? inv.expiresAt.toDate() : new Date(inv.expiresAt);
        sub += ' &middot; exp ' + (exp.getMonth()+1) + '/' + exp.getDate();
      }
      h += '<div class="adm-row__sub">' + sub + '</div>';
      h += '</div><div class="adm-row__actions">';
      if (inv.status === "active" && !expired) {
        h += '<button class="adm-btn adm-btn--xs" onclick="revokeInviteAdmin(\'' + inv.code + '\')">Revoke</button>';
      }
      h += '</div></div>';
    });
    h += '</div>';

    el.innerHTML = h;
  }).catch(function() { el.innerHTML = renderLoadError("invites", "loadAdminInviteList()"); });
}

function revokeInviteAdmin(code, _confirmed) {
  if (!db) return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Revoke invite " + code + "?", message: "The code stops working immediately.", confirmLabel: "Revoke", danger: true })
      .then(function(ok) { if (ok) revokeInviteAdmin(code, true); });
    return;
  }
  db.collection("invites").doc(code).update({ status: "revoked" }).then(function() {
    Router.toast("Invite revoked");
    loadAdminInviteList();
  });
}

// ---- Course Management (admin) ----
function loadAdminCourses() {
  var el = document.getElementById("adminCourseList");
  if (!el) return;
  el.innerHTML = '<div class="adm-empty">Loading courses...</div>';

  if (!db) { el.innerHTML = '<div class="adm-empty">Requires Firebase</div>'; return; }

  db.collection("courses").get().then(function(snap) {
    var courses = [];
    snap.forEach(function(doc) { courses.push(Object.assign({_fsId: doc.id}, doc.data())); });

    // Sort by name
    courses.sort(function(a,b) { return (a.name||"").localeCompare(b.name||""); });

    // Flag duplicates — same name (case-insensitive)
    var nameCounts = {};
    courses.forEach(function(c) { var n=(c.name||"").toLowerCase(); nameCounts[n]=(nameCounts[n]||0)+1; });
    admSetMeta("courses", courses.length + (courses.length === 1 ? " course" : " courses"));

    var dupCount = courses.filter(function(c){ return nameCounts[(c.name||"").toLowerCase()]>1; }).length;
    var h = '';
    if (dupCount > 0) {
      h += '<div class="adm-note" style="color:var(--cb-claret);background:rgba(var(--cb-claret-rgb),.07);border:1px solid rgba(var(--cb-claret-rgb),.25);border-radius:var(--radius-md);padding:10px 12px">';
      h += dupCount + ' duplicate name' + (dupCount>1?'s':'') + ' detected. Keep the API-imported version, remove the rest.';
      h += '</div>';
    }

    h += '<div class="adm-panel">';
    courses.forEach(function(c) {
      var isDup = nameCounts[(c.name||"").toLowerCase()] > 1;
      var isApi = c.source === "golfcourseapi";
      var isQuick = c.quickAdd;
      var hasHoles = c.holes && c.holes.length === 18;
      var tagColor = isApi ? 'var(--cb-moss)' : isQuick ? 'var(--cb-claret)' : 'var(--cb-mute)';
      var tagLabel = isApi ? 'API' : isQuick ? 'Manual' : 'Unknown';

      h += '<div class="adm-row"><div class="adm-row__main">';
      h += '<div class="adm-row__title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(c.name||"Unknown") + (isDup ? ' <span style="font-family:var(--font-mono);font-size:9px;color:var(--cb-claret);font-weight:700">DUP</span>' : '') + '</div>';
      h += '<div class="adm-row__sub"><span style="color:' + tagColor + ';font-weight:700">' + tagLabel + '</span>';
      h += (c.loc ? ' &middot; ' + escHtml(c.loc) : '');
      h += (c.rating ? ' &middot; ' + c.rating + '/' + (c.slope||'—') : '');
      h += (hasHoles ? ' &middot; scorecard' : ' &middot; no scorecard');
      h += '</div></div>';
      h += '<div class="adm-row__actions"><button class="adm-btn adm-btn--claret adm-btn--xs" onclick="adminDeleteCourse(\'' + c._fsId + '\',\'' + (c.name||'').replace(/'/g,"\\'") + '\')">Remove</button></div>';
      h += '</div>';
    });
    h += '</div>';

    el.innerHTML = courses.length ? h : '<div class="adm-empty">No courses found.</div>';
  }).catch(function(err) {
    var el2 = document.getElementById("adminCourseList");
    if (el2) el2.innerHTML = '<div class="adm-empty" style="color:var(--cb-claret)">Error: ' + escHtml(err.message) + '</div>';
  });
}

function adminDeleteCourse(fsId, name, _confirmed) {
  if (!db) return;
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: 'Remove "' + name + '"?', message: "Comes off the course directory. This cannot be undone.", confirmLabel: "Remove", danger: true })
      .then(function(ok) { if (ok) adminDeleteCourse(fsId, name, true); });
    return;
  }
  PB.deleteCourse(fsId);
  db.collection("courses").doc(fsId).delete().then(function() {
    Router.toast('"' + name + '" removed');
    loadAdminCourses();
  }).catch(function(err) { Router.toast(pbErrMsg(err, "Couldn't remove the course.")); });
}

// ========== FULL DIAGNOSTIC (Commissioner only, READ-ONLY) ==========
// Reads every collection and prints exact counts, field presence, leagueId status.
// CHANGES NOTHING IN FIRESTORE.

// Extracted to src/pages/admin-diagnostic.js per W1.A5. Originally lines 559-958 of this file.

function bulkGenerateInvites() {
  if (!db || !currentUser) return;
  var count = parseInt(document.getElementById("bulkCount").value) || 5;
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var codes = [];
  var batch = db.batch();

  for (var i = 0; i < count; i++) {
    var code = "PB-";
    for (var j = 0; j < 8; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    codes.push(code);
    batch.set(db.collection("invites").doc(code), createInviteDoc(code));
  }

  batch.commit().then(function() {
    var h = '<div class="adm-panel" style="margin-top:12px">';
    codes.forEach(function(c) {
      h += '<div class="adm-row"><span class="adm-code">' + c + '</span></div>';
    });
    h += '</div><div class="adm-row__sub" style="text-align:center;margin-top:8px">All expire in ' + INVITE_EXPIRY_DAYS + ' days</div>';
    document.getElementById("bulkResult").innerHTML = h;
    Router.toast(count + " invites generated");
    loadAdminInviteList();
  }).catch(function() { Router.toast("Failed to generate"); });
}
