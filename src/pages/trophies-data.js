// ============================================================================
// CUSTOM TROPHIES — data layer (W4.S3 / CLUBHOUSE_SPEC-HQ-3q)
// ============================================================================
// Storage decision (made at ship time per spec §3q.6 + §3q.9 ratification,
// which defer the storage/evaluation pattern to "decision-bubble at W4.S3
// implementation"): the spec's nominal `trophies-catalog/*` collection is
// denied by the NO-CATCH-ALL firestore.rules, and editing/deploying rules is
// an AMD-018-gated Founder-preauth action. So custom trophies live on existing
// already-writable documents:
//   • platform-wide → config/trophyCatalog        (founder-write per rules)
//   • league-scoped → leagues/{id}.customTrophies  (commissioner/founder-write)
// Criteria are evaluated CLIENT-SIDE from already-loaded round + standings data
// (the zero-extra-read pattern W4.S2 HeatMap used) — no Cloud Function, no new
// collection, so the whole feature ships with no production-risk gate. Measures
// without a wired data source render an honest "leader pending" state (P9) — no
// fabricated values, ever.

// ── Difficulty tiers (Section A) ────────────────────────────────────────────
var PB_TROPHY_TIERS = [
  { key: "common", label: "Common" },
  { key: "rare", label: "Rare" },
  { key: "championship", label: "Championship" }
];

// ── Measures catalog (Section B.1) ──────────────────────────────────────────
// Order mirrors spec §3q.1.4 B.1. `dir` is the natural superlative direction
// (max = highest wins, min = lowest wins). `computable` = a real client-side
// evaluator is wired; false measures save + display but show "leader pending"
// until their data source lands (Wave-4 stats-catalog work the spec defers).
var PB_TROPHY_MEASURES = [
  { key: "handicap",            label: "Handicap",                         unit: "index",  dir: "min", computable: true  },
  { key: "rounds",              label: "Rounds posted",                    unit: "rounds", dir: "max", computable: true  },
  { key: "parcoinEarned",       label: "Total Parcoin earned",             unit: "PC",     dir: "max", computable: false },
  { key: "wagersWon",           label: "Wagers won",                       unit: "wagers", dir: "max", computable: false },
  { key: "birdies",             label: "Birdies",                          unit: "birdies",dir: "max", computable: true  },
  { key: "eagles",              label: "Eagles",                           unit: "eagles", dir: "max", computable: true  },
  { key: "aces",                label: "Aces",                             unit: "aces",   dir: "max", computable: true  },
  { key: "pars",                label: "Pars",                             unit: "pars",   dir: "max", computable: true  },
  { key: "bogeys",              label: "Bogeys",                           unit: "bogeys", dir: "min", computable: true  },
  { key: "totalPutts",          label: "Total putts",                      unit: "putts",  dir: "min", computable: false },
  { key: "firPct",              label: "Fairways in regulation %",         unit: "%",      dir: "max", computable: false },
  { key: "girPct",              label: "Greens in regulation %",           unit: "%",      dir: "max", computable: false },
  { key: "lowestRound",         label: "Lowest round",                     unit: "strokes",dir: "min", computable: true  },
  { key: "bestToPar",           label: "Best to-par score",                unit: "to par", dir: "min", computable: true  },
  { key: "consecutiveWeeks",    label: "Consecutive weeks with a round",   unit: "weeks",  dir: "max", computable: true  },
  { key: "coursesPlayed",       label: "Courses played (distinct)",        unit: "courses",dir: "max", computable: true  },
  { key: "membersPlayedWith",   label: "Members played with (distinct)",   unit: "members",dir: "max", computable: false },
  { key: "scoreVariance",       label: "Round-to-round score variance",    unit: "var",    dir: "min", computable: true  },
  { key: "handicapImprovement", label: "Single-month handicap improvement",unit: "strokes",dir: "max", computable: true  }
];

// ── How it's measured (Section B.2) ─────────────────────────────────────────
var PB_TROPHY_HOWS = [
  { key: "sum",     label: "Sum (total accumulation)" },
  { key: "average", label: "Average (per round or period)" },
  { key: "count",   label: "Count (discrete events)" },
  { key: "min",     label: "Min (lowest value)" },
  { key: "max",     label: "Max (highest value)" },
  { key: "streak",  label: "Streak (consecutive events)" }
];

// ── Comparison operators (Section B.3) ──────────────────────────────────────
var PB_TROPHY_OPS = [
  { key: "gte", label: "≥", verb: "at least" },
  { key: "lte", label: "≤", verb: "at most" },
  { key: "eq",  label: "=",      verb: "exactly" },
  { key: "gt",  label: ">",      verb: "more than" },
  { key: "lt",  label: "<",      verb: "fewer than" }
];

// ── Time scope (Section B.4) ────────────────────────────────────────────────
// "Single tournament" is intentionally omitted from the shipped builder: it
// depends on round-to-event linkage from W4.S1's stats-catalog, which the spec
// itself defers. Shipping it as a dead control would violate "nothing
// half-baked." The four scopes below all evaluate honestly today.
var PB_TROPHY_WHENS = [
  { key: "all-time", label: "All-time (since joining)" },
  { key: "season",   label: "Season (current competitive window)" },
  { key: "month",    label: "Month (rolling 30 days)" },
  { key: "custom",   label: "Custom date range" }
];

// ── Allowed emblem palette (Section 3q.5.2) ─────────────────────────────────
// SVGs author against currentColor (inherits the cell's ink/brass), plus these
// literal tokens. Anything outside the set is flagged on upload.
var PB_TROPHY_PALETTE = ["currentcolor", "transparent", "none",
  "#1c1a17", "#2a2722", "#b4893e", "#8c6a2e", "#f4f1ea", "#e8e3d8"];

// ── Library emblems (Section 3q.5.4) — 20 starters, restricted palette ───────
// All use fill=none stroke=currentColor (or fill=currentColor) so they adopt
// the surrounding ink/brass token. 0 0 24 24 viewBox, rescaled in the cell.
function _tlib(key, label, body) { return { key: key, label: label, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>' }; }
var PB_TROPHY_LIBRARY = [
  _tlib("flag",     "Golf flag",       '<path d="M6 21V3"/><path d="M6 4l11 2.5L6 9"/><circle cx="6" cy="21" r="1.2" fill="currentColor"/>'),
  _tlib("cup",      "Trophy cup",      '<path d="M8 4h8v4a4 4 0 01-8 0z"/><path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4"/><path d="M12 12v4M9 20h6M10 16h4l.5 4h-5z"/>'),
  _tlib("laurel",   "Laurel wreath",   '<path d="M12 3v18"/><path d="M9 6C6 6 5 9 6 12 8 11 9 9 9 6zM9 11c-3 0-4 3-3 6 2-1 3-3 3-6zM15 6c3 0 4 3 3 6-2-1-3-3-3-6zM15 11c3 0 4 3 3 6-2-1-3-3-3-6z"/>'),
  _tlib("clubs",    "Crossed clubs",   '<path d="M7 3l8 16M17 3L9 19"/><circle cx="6.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>'),
  _tlib("tee",      "Tee marker",      '<path d="M9 3h6l-2 4h-2zM12 7v10"/><path d="M8 20h8l-1.5-3h-5z"/>'),
  _tlib("wing",     "Birdie wing",     '<path d="M3 14c5-1 8-4 9-9 2 5 5 8 9 9-4 1-7 2-9 4-2-2-5-3-9-4z"/>'),
  _tlib("eagle",    "Eagle silhouette",'<path d="M12 5l3 4 5-2-3 4 3 4-5-2-3 4-3-4-5 2 3-4-3-4 5 2z"/>'),
  _tlib("rake",     "Bunker rake",     '<path d="M5 5l14 14"/><path d="M16 4l4 4M14 6l1 1M16 4l-2 2M18 6l-2 2"/><path d="M4 16l4 4"/>'),
  _tlib("medal",    "Medal",           '<circle cx="12" cy="15" r="5"/><path d="M9 3l3 6 3-6M12 13v4M10 15h4" /><path d="M9 3H6M15 3h3"/>'),
  _tlib("pin",      "Pin & ball",      '<path d="M12 3v12"/><path d="M12 4l6 2-6 2"/><circle cx="12" cy="18" r="3"/>'),
  _tlib("ball",     "Golf ball",       '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="13" cy="9" r=".6" fill="currentColor"/><circle cx="15" cy="13" r=".6" fill="currentColor"/><circle cx="11" cy="14" r=".6" fill="currentColor"/>'),
  _tlib("crown",    "Crown",           '<path d="M4 8l3 8h10l3-8-5 3-3-6-3 6z"/><path d="M5 18h14"/>'),
  _tlib("star",     "Star",            '<path d="M12 3l2.5 6 6.5.5-5 4 1.7 6.3L12 17l-5.7 3.8L8 14.5l-5-4 6.5-.5z"/>'),
  _tlib("ribbon",   "Ribbon",          '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'),
  _tlib("shield",   "Shield",          '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>'),
  _tlib("compass",  "Compass",         '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-4 1 2-5z" fill="currentColor"/>'),
  _tlib("sun",      "Sunrise",         '<path d="M12 4v3M5 10l2 1M19 10l-2 1M3 17h18M7 17a5 5 0 0110 0"/>'),
  _tlib("bolt",     "Bolt",            '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  _tlib("anchor",   "Anchor",          '<circle cx="12" cy="5" r="2"/><path d="M12 7v12M6 12a6 6 0 0012 0M5 12H3M19 12h2"/>'),
  _tlib("oak",      "Oak (steady)",    '<path d="M12 21v-7"/><path d="M12 14c-4 0-6-2-6-5 0-3 2-4 2-4 0-2 2-3 4-3s4 1 4 3c0 0 2 1 2 4 0 3-2 5-6 5z"/>')
];

function pbTrophyLibrary(key) {
  for (var i = 0; i < PB_TROPHY_LIBRARY.length; i++) if (PB_TROPHY_LIBRARY[i].key === key) return PB_TROPHY_LIBRARY[i];
  return null;
}
function pbTrophyMeasure(key) {
  for (var i = 0; i < PB_TROPHY_MEASURES.length; i++) if (PB_TROPHY_MEASURES[i].key === key) return PB_TROPHY_MEASURES[i];
  return null;
}

// Pure emblem → SVG markup resolver shared by every display surface (admin
// catalog, trophy room, standings). Upload defs carry sanitized svg inline;
// library defs reference a key. Returns "" when neither resolves so callers
// can fall back to a placeholder.
function trophyEmblemSvg(def) {
  var e = def && def.emblem;
  if (!e) return "";
  if (e.source === "upload" && e.svg) return e.svg;
  if (e.key) { var lib = pbTrophyLibrary(e.key); return lib ? lib.svg : ""; }
  return "";
}

// ── SVG validation (Section 3q.5.2 / 3q.5.3) — fully client-side ─────────────
// Returns { ok, errors:[], warnings:[], svg } where svg is the sanitized markup
// to persist when ok. Blocks on type/size/embedded-content; warns (non-blocking)
// on out-of-palette colors per spec ("flagged").
var PB_TROPHY_SVG_MAX = 50 * 1024; // 50KB

function validateTrophySvg(text, byteSize) {
  var res = { ok: false, errors: [], warnings: [], svg: "" };
  if (!text || typeof text !== "string") { res.errors.push("Empty file."); return res; }
  if (typeof byteSize === "number" && byteSize > PB_TROPHY_SVG_MAX) {
    res.errors.push("File is " + Math.round(byteSize / 1024) + "KB; the limit is 50KB.");
  }
  // Embedded-content / external-reference security scan (regex first — catches
  // raw text before any parser normalizes it away).
  if (/<\s*script/i.test(text)) res.errors.push("Contains a <script> tag.");
  if (/<\s*style/i.test(text)) res.errors.push("Contains a <style> tag.");
  if (/<\s*foreignObject/i.test(text)) res.errors.push("Contains a <foreignObject> tag.");
  if (/\son\w+\s*=/i.test(text)) res.errors.push("Contains an inline event handler (on…=).");
  if (/(xlink:href|href)\s*=\s*["']\s*(https?:|\/\/|data:)/i.test(text)) res.errors.push("Contains an external reference (href).");
  if (/url\(\s*["']?\s*https?:/i.test(text)) res.errors.push("Contains an external url() reference.");

  var doc = null;
  try {
    if (typeof DOMParser !== "undefined") doc = new DOMParser().parseFromString(text, "image/svg+xml");
  } catch (e) {}
  if (!doc || !doc.documentElement || doc.documentElement.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) {
    res.errors.push("Not a valid SVG document.");
    return res;
  }
  // Palette scan — collect fill / stroke / stop-color attribute values.
  try {
    var els = doc.getElementsByTagName("*");
    var bad = {};
    for (var i = 0; i < els.length; i++) {
      ["fill", "stroke", "stop-color"].forEach(function(attr) {
        var v = (els[i].getAttribute(attr) || "").trim().toLowerCase();
        if (!v) return;
        if (PB_TROPHY_PALETTE.indexOf(v) === -1) bad[v] = true;
      });
      var styleAttr = (els[i].getAttribute("style") || "").toLowerCase();
      var m = styleAttr.match(/#[0-9a-f]{3,8}/g);
      if (m) m.forEach(function(c) { if (PB_TROPHY_PALETTE.indexOf(c) === -1) bad[c] = true; });
    }
    var badList = Object.keys(bad);
    if (badList.length) res.warnings.push("Colors outside the clubhouse palette: " + badList.slice(0, 5).join(", ") + ". Use currentColor or the brass/ink tokens for a coherent look.");
  } catch (e2) {}

  if (!res.errors.length) { res.ok = true; res.svg = text.trim(); }
  return res;
}

// ── Criteria → human summary ─────────────────────────────────────────────────
function trophyCriteriaSummary(def) {
  if (!def || !def.criteria) return "";
  var c = def.criteria;
  var m = pbTrophyMeasure(c.measure);
  var mLabel = m ? m.label.toLowerCase() : (c.measure || "value");
  var whenObj = null;
  for (var i = 0; i < PB_TROPHY_WHENS.length; i++) if (PB_TROPHY_WHENS[i].key === c.when) whenObj = PB_TROPHY_WHENS[i];
  var whenTxt = c.when === "all-time" ? "all-time"
    : c.when === "season" ? "this season"
    : c.when === "month" ? "in the last 30 days"
    : c.when === "custom" ? ("from " + (c.rangeStart || "?") + " to " + (c.rangeEnd || "?"))
    : "";
  // Threshold trophies read as a gate; superlative (no threshold) read as "most/lowest".
  if (c.threshold != null && c.threshold !== "" && c.operator) {
    var op = null;
    for (var j = 0; j < PB_TROPHY_OPS.length; j++) if (PB_TROPHY_OPS[j].key === c.operator) op = PB_TROPHY_OPS[j];
    return (op ? op.verb : "") + " " + c.threshold + " " + (m ? m.unit : "") + " " + mLabel + (whenTxt ? " " + whenTxt : "");
  }
  var sup = (m && m.dir === "min") ? "Lowest" : "Most";
  if (c.how === "min") sup = "Lowest";
  if (c.how === "max") sup = "Most";
  return sup + " " + mLabel + (whenTxt ? " " + whenTxt : "");
}

function championTitleFor(def) {
  if (def && def.championTitle) return def.championTitle;
  return ((def && def.name) || "Trophy") + " Champion";
}

// ── Time window helper ───────────────────────────────────────────────────────
function _pbTrophyWindow(c) {
  var when = c && c.when;
  if (when === "all-time" || !when) return null; // no bound
  var now = new Date();
  if (when === "season") {
    var y = now.getFullYear();
    return { start: y + "-03-01", end: y + "-11-30" };
  }
  if (when === "month") {
    var d = new Date(now.getTime() - 30 * 86400000);
    return { start: _isoDate(d), end: _isoDate(now) };
  }
  if (when === "custom") {
    return { start: c.rangeStart || "0000-01-01", end: c.rangeEnd || "9999-12-31" };
  }
  return null;
}
function _isoDate(d) {
  var mm = String(d.getMonth() + 1); if (mm.length < 2) mm = "0" + mm;
  var dd = String(d.getDate()); if (dd.length < 2) dd = "0" + dd;
  return d.getFullYear() + "-" + mm + "-" + dd;
}
function _pbRoundsIn(rounds, win) {
  return (rounds || []).filter(function(r) {
    if (!r || !r.date) return false;
    if (r.visibility === "private") return false;
    if (r.format === "scramble" || r.format === "scramble4") return false;
    if (!win) return true;
    return r.date >= win.start && r.date <= win.end;
  });
}

// ── Hole-event counter (birdies / eagles / aces / pars / bogeys) ─────────────
function _pbCountHoleEvent(roundsForPlayer, kind) {
  var n = 0;
  roundsForPlayer.forEach(function(r) {
    if (!r.holeScores || !r.holePars || r.holeScores.length !== r.holePars.length) return;
    for (var i = 0; i < r.holeScores.length; i++) {
      var sc = parseInt(r.holeScores[i]) || 0, pr = parseInt(r.holePars[i]) || 0;
      if (sc <= 0 || pr <= 0) continue;
      var d = sc - pr;
      if (kind === "aces" && sc === 1) n++;
      else if (kind === "eagles" && d <= -2) n++;
      else if (kind === "birdies" && d === -1) n++;
      else if (kind === "pars" && d === 0) n++;
      else if (kind === "bogeys" && d === 1) n++;
    }
  });
  return n;
}

// ── Per-member values for a measure within a window ──────────────────────────
// Returns [{ id, name, value }] for members with an honest, computable value.
// Unsupported measures return [] → caller shows "leader pending".
function trophyMemberValues(def) {
  if (!def || !def.criteria) return [];
  var c = def.criteria, key = c.measure;
  var m = pbTrophyMeasure(key);
  if (!m || !m.computable) return [];
  if (typeof PB === "undefined" || !PB.getRounds || !PB.getPlayers) return [];

  var win = _pbTrophyWindow(c);
  var allRounds = _pbRoundsIn(PB.getRounds() || [], win);
  var players = PB.getPlayers() || [];
  var byPlayer = {};
  allRounds.forEach(function(r) {
    if (!r.player) return;
    (byPlayer[r.player] = byPlayer[r.player] || []).push(r);
  });

  var out = [];
  function nameOf(pid) { var p = PB.getPlayer ? PB.getPlayer(pid) : null; return (p && (p.name || p.username)) || "Member"; }

  if (key === "handicap") {
    players.forEach(function(p) {
      var pr = (PB.getPlayerRounds ? PB.getPlayerRounds(p.id) : byPlayer[p.id]) || [];
      if (pr.length < 3) return;
      var h = PB.calcHandicap ? PB.calcHandicap(pr) : null;
      if (h != null && !isNaN(h)) out.push({ id: p.id, name: p.name || p.username || "Member", value: +h });
    });
  } else if (key === "rounds") {
    Object.keys(byPlayer).forEach(function(pid) { out.push({ id: pid, name: nameOf(pid), value: byPlayer[pid].length }); });
  } else if (key === "coursesPlayed") {
    Object.keys(byPlayer).forEach(function(pid) {
      var s = {}; byPlayer[pid].forEach(function(r) { if (r.course) s[r.course] = 1; });
      out.push({ id: pid, name: nameOf(pid), value: Object.keys(s).length });
    });
  } else if (key === "lowestRound") {
    Object.keys(byPlayer).forEach(function(pid) {
      var best = null; byPlayer[pid].forEach(function(r) { var s = parseInt(r.score) || 0; if (s > 0 && (best == null || s < best)) best = s; });
      if (best != null) out.push({ id: pid, name: nameOf(pid), value: best });
    });
  } else if (key === "bestToPar") {
    Object.keys(byPlayer).forEach(function(pid) {
      var best = null; byPlayer[pid].forEach(function(r) {
        var s = parseInt(r.score) || 0, par = 0;
        if (r.holePars && r.holePars.length) { for (var i = 0; i < r.holePars.length; i++) par += parseInt(r.holePars[i]) || 0; }
        else par = r.par || 72;
        if (s > 0 && par > 0) { var tp = s - par; if (best == null || tp < best) best = tp; }
      });
      if (best != null) out.push({ id: pid, name: nameOf(pid), value: best });
    });
  } else if (key === "birdies" || key === "eagles" || key === "aces" || key === "pars" || key === "bogeys") {
    Object.keys(byPlayer).forEach(function(pid) {
      var n = _pbCountHoleEvent(byPlayer[pid], key);
      if (n > 0) out.push({ id: pid, name: nameOf(pid), value: n });
    });
  } else if (key === "consecutiveWeeks") {
    Object.keys(byPlayer).forEach(function(pid) {
      var weeks = {};
      byPlayer[pid].forEach(function(r) {
        var t = Date.parse(r.date + "T00:00:00"); if (isNaN(t)) return;
        weeks[Math.floor(t / (7 * 86400000))] = 1;
      });
      var ks = Object.keys(weeks).map(Number).sort(function(a, b) { return a - b; });
      var best = ks.length ? 1 : 0, run = ks.length ? 1 : 0;
      for (var i = 1; i < ks.length; i++) { if (ks[i] === ks[i - 1] + 1) { run++; if (run > best) best = run; } else run = 1; }
      if (best > 0) out.push({ id: pid, name: nameOf(pid), value: best });
    });
  } else if (key === "scoreVariance") {
    Object.keys(byPlayer).forEach(function(pid) {
      var scores = byPlayer[pid].map(function(r) { return parseInt(r.score) || 0; }).filter(function(s) { return s > 0; });
      if (scores.length < 3) return;
      var mean = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
      var v = scores.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / scores.length;
      out.push({ id: pid, name: nameOf(pid), value: Math.round(v * 10) / 10 });
    });
  } else if (key === "handicapImprovement") {
    // Biggest single-month handicap drop. Compute end-of-month handicap from
    // each player's rounds up to that month; improvement = prev - this.
    players.forEach(function(p) {
      var pr = (PB.getPlayerRounds ? PB.getPlayerRounds(p.id) : byPlayer[p.id]) || [];
      pr = pr.filter(function(r) { return r && r.date && r.format !== "scramble" && r.format !== "scramble4"; });
      if (pr.length < 6) return;
      var months = {};
      pr.forEach(function(r) { months[r.date.slice(0, 7)] = 1; });
      var mk = Object.keys(months).sort();
      var prev = null, bestDrop = null;
      mk.forEach(function(mm) {
        var upto = pr.filter(function(r) { return r.date.slice(0, 7) <= mm; });
        var h = PB.calcHandicap ? PB.calcHandicap(upto) : null;
        if (h == null || isNaN(h)) return;
        if (prev != null) { var drop = prev - h; if (bestDrop == null || drop > bestDrop) bestDrop = drop; }
        prev = h;
      });
      if (bestDrop != null && bestDrop > 0) out.push({ id: p.id, name: p.name || p.username || "Member", value: Math.round(bestDrop * 10) / 10 });
    });
  }
  return out;
}

// ── Leader + earned evaluation ───────────────────────────────────────────────
// Returns { computable, leader:{id,name,value,display}|null, earnedIds:[] }.
function evaluateTrophy(def) {
  var m = pbTrophyMeasure(def && def.criteria && def.criteria.measure);
  if (!m || !m.computable) return { computable: false, leader: null, earnedIds: [] };
  var vals = trophyMemberValues(def);
  if (!vals.length) return { computable: true, leader: null, earnedIds: [] };

  var c = def.criteria;
  var dir = m.dir;
  if (c.how === "min") dir = "min";
  if (c.how === "max") dir = "max";

  var sorted = vals.slice().sort(function(a, b) { return dir === "min" ? a.value - b.value : b.value - a.value; });
  var top = sorted[0];
  var leader = { id: top.id, name: top.name, value: top.value, display: trophyValueDisplay(m, top.value) };

  var earnedIds = [];
  if (c.threshold != null && c.threshold !== "" && c.operator) {
    var thr = parseFloat(c.threshold);
    vals.forEach(function(v) {
      var pass = (c.operator === "gte") ? v.value >= thr
        : (c.operator === "lte") ? v.value <= thr
        : (c.operator === "eq") ? v.value === thr
        : (c.operator === "gt") ? v.value > thr
        : (c.operator === "lt") ? v.value < thr : false;
      if (pass) earnedIds.push(v.id);
    });
  } else {
    earnedIds.push(top.id); // superlative: the leader holds it
  }
  return { computable: true, leader: leader, earnedIds: earnedIds };
}

function trophyValueDisplay(m, value) {
  if (m && m.unit === "%") return value + "%";
  if (m && m.key === "bestToPar") return (value > 0 ? "+" + value : value === 0 ? "E" : String(value));
  if (m && m.key === "handicap") return (+value).toFixed(1);
  if (m && (m.key === "scoreVariance" || m.key === "handicapImprovement")) return String(value);
  return String(value) + (m && m.unit && m.unit.length <= 7 ? "" : "");
}

// ── Validity gate (Save button) ──────────────────────────────────────────────
function pbTrophyDefValid(def) {
  if (!def) return false;
  if (!def.name || !def.name.trim()) return false;
  if (!def.desc || !def.desc.trim()) return false;
  if (!def.tier) return false;
  if (!def.criteria || !def.criteria.measure || !def.criteria.how || !def.criteria.when) return false;
  if (def.criteria.when === "custom" && (!def.criteria.rangeStart || !def.criteria.rangeEnd)) return false;
  if (def.emblem && def.emblem.source === "upload" && !def.emblem.svg) return false;
  if (def.emblem && def.emblem.source === "library" && !def.emblem.key) return false;
  return true;
}

// ── Load / save (config/trophyCatalog + leagues/{id}.customTrophies) ─────────
var _pbTrophyCache = { loaded: false, platform: [], league: [], leagueId: null };

function pbCachedTrophyDefs() {
  return (_pbTrophyCache.platform || []).concat(_pbTrophyCache.league || []);
}

function loadTrophyCatalog(cb) {
  if (typeof db === "undefined" || !db) { if (cb) cb([]); return; }
  var lid = (typeof getActiveLeague === "function") ? getActiveLeague() : null;
  var pPlatform = db.collection("config").doc("trophyCatalog").get().then(function(doc) {
    return (doc.exists && Array.isArray(doc.data().trophies)) ? doc.data().trophies : [];
  }).catch(function() { return []; });
  var pLeague = lid ? db.collection("leagues").doc(lid).get().then(function(doc) {
    return (doc.exists && Array.isArray(doc.data().customTrophies)) ? doc.data().customTrophies : [];
  }).catch(function() { return []; }) : Promise.resolve([]);

  Promise.all([pPlatform, pLeague]).then(function(r) {
    _pbTrophyCache = { loaded: true, platform: r[0], league: r[1], leagueId: lid };
    if (cb) cb(pbCachedTrophyDefs());
  }).catch(function() { if (cb) cb([]); });
}

function saveTrophyDef(def, scope, cb) {
  if (typeof db === "undefined" || !db) { if (cb) cb(false, "Requires Firebase"); return; }
  if (!pbTrophyDefValid(def)) { if (cb) cb(false, "Fill in all required fields"); return; }
  def = Object.assign({}, def);
  if (!def.id) def.id = (def.name || "trophy").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Date.now().toString(36);
  def.scope = scope === "platform" ? "platform" : "league";
  def.active = def.active !== false;
  def.updatedAt = new Date().toISOString();
  if (!def.createdAt) def.createdAt = def.updatedAt;
  if (typeof currentUser !== "undefined" && currentUser) def.createdBy = currentUser.uid;
  if (!def.championTitle) def.championTitle = championTitleFor(def);

  if (def.scope === "platform") {
    var ref = db.collection("config").doc("trophyCatalog");
    ref.get().then(function(doc) {
      var arr = (doc.exists && Array.isArray(doc.data().trophies)) ? doc.data().trophies.slice() : [];
      arr = _pbUpsert(arr, def);
      return ref.set({ trophies: arr, updatedAt: def.updatedAt }, { merge: true });
    }).then(function() { _pbTrophyCache.loaded = false; if (cb) cb(true); })
      .catch(function(e) { if (cb) cb(false, (typeof pbErrMsg === "function") ? pbErrMsg(e, "Couldn't save the trophy.") : "Couldn't save the trophy."); });
  } else {
    var lid = (typeof getActiveLeague === "function") ? getActiveLeague() : null;
    if (!lid) { if (cb) cb(false, "No active league"); return; }
    def.leagueId = lid;
    var lref = db.collection("leagues").doc(lid);
    lref.get().then(function(doc) {
      var arr = (doc.exists && Array.isArray(doc.data().customTrophies)) ? doc.data().customTrophies.slice() : [];
      arr = _pbUpsert(arr, def);
      return lref.update({ customTrophies: arr });
    }).then(function() { _pbTrophyCache.loaded = false; if (cb) cb(true); })
      .catch(function(e) { if (cb) cb(false, (typeof pbErrMsg === "function") ? pbErrMsg(e, "Couldn't save the trophy.") : "Couldn't save the trophy."); });
  }
}

function _pbUpsert(arr, def) {
  var i = arr.findIndex ? arr.findIndex(function(t) { return t && t.id === def.id; }) : -1;
  if (i >= 0) arr[i] = def; else arr.push(def);
  return arr;
}

function archiveTrophyDef(id, scope, cb) {
  var defs = (scope === "platform" ? _pbTrophyCache.platform : _pbTrophyCache.league) || [];
  var target = null; defs.forEach(function(d) { if (d.id === id) target = d; });
  if (!target) { if (cb) cb(false, "Not found"); return; }
  target = Object.assign({}, target, { active: false });
  saveTrophyDef(target, scope, cb);
}

// ── 5 starter platform-wide trophies (Section 3q.3.1) ────────────────────────
var PB_STARTER_TROPHIES = [
  { id: "iron-schedule",   name: "Iron Schedule",   tier: "championship", desc: "Awarded to the member who strings together the most consecutive weeks with a posted round. Consistency is its own kind of greatness.",
    criteria: { measure: "consecutiveWeeks", how: "streak", operator: null, threshold: null, when: "all-time" }, emblem: { source: "library", key: "anchor" } },
  { id: "comeback-kid",    name: "Comeback Kid",    tier: "rare",         desc: "For the biggest single-month handicap improvement. The clubhouse loves a turnaround.",
    criteria: { measure: "handicapImprovement", how: "max", operator: null, threshold: null, when: "all-time" }, emblem: { source: "library", key: "sun" } },
  { id: "wager-warrior",   name: "Wager Warrior",   tier: "rare",         desc: "Most Parcoins won from wagers this season. Played with nerve, paid in coin.",
    criteria: { measure: "wagersWon", how: "sum", operator: null, threshold: null, when: "season" }, emblem: { source: "library", key: "bolt" } },
  { id: "course-conqueror",name: "Course Conqueror",tier: "rare",         desc: "Most distinct courses played in a season. A passport stamped in fairways.",
    criteria: { measure: "coursesPlayed", how: "count", operator: null, threshold: null, when: "season" }, emblem: { source: "library", key: "compass" } },
  { id: "steady-eddie",    name: "Steady Eddie",    tier: "common",       desc: "Lowest round-to-round score variance this season. Same number, every time you tee it up.",
    criteria: { measure: "scoreVariance", how: "min", operator: null, threshold: null, when: "season" }, emblem: { source: "library", key: "oak" } }
];

// Seed the 5 starters into config/trophyCatalog if absent. Idempotent: only adds
// missing ids, never overwrites a Founder-edited starter.
function seedStarterTrophies(cb) {
  if (typeof db === "undefined" || !db) { if (cb) cb(false, "Requires Firebase"); return; }
  var ref = db.collection("config").doc("trophyCatalog");
  ref.get().then(function(doc) {
    var arr = (doc.exists && Array.isArray(doc.data().trophies)) ? doc.data().trophies.slice() : [];
    var have = {}; arr.forEach(function(t) { if (t && t.id) have[t.id] = 1; });
    var added = 0;
    PB_STARTER_TROPHIES.forEach(function(s) {
      if (have[s.id]) return;
      var def = Object.assign({}, s, { scope: "platform", active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), seed: true });
      def.championTitle = championTitleFor(def);
      arr.push(def); added++;
    });
    if (!added) { if (cb) cb(true, "already-seeded"); return null; }
    return ref.set({ trophies: arr, updatedAt: new Date().toISOString() }, { merge: true }).then(function() {
      _pbTrophyCache.loaded = false; if (cb) cb(true, added + " seeded");
    });
  }).catch(function(e) { if (cb) cb(false, (typeof pbErrMsg === "function") ? pbErrMsg(e, "Seed failed.") : "Seed failed."); });
}
