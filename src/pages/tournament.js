/* ================================================
   PAGE: TOURNAMENT — commissioner-only builder + view
   Free, stats-based generation via src/core/tournament-engine.js.
   No LLM API. Name + winner's title lock at creation; the field,
   schedule, and pairings are generated from entered players' handicaps.
   ================================================ */

// Builder working state. Seeded from the Smoky Mountain Open preset so the
// namesake is the zero-config default (Founder: "mimic the smokey mountain open").
var tournamentBuilderState = null;

Router.register("tournament", function (params) {
  params = params || {};
  if (params.create) {
    // Commissioner gate. ensureActiveLeagueCommissioner warms the league-doc
    // cache if cold, then answers synchronously on subsequent calls.
    ensureActiveLeagueCommissioner(function (isCommish) {
      if (isCommish) renderTournamentCreate();
      else renderTournamentDenied();
    });
    return;
  }
  if (params.id) { renderTournamentView(params.id); return; }
  // No id and not creating: send back to Events, which lists tournaments.
  Router.go("trips");
});

// ---------- Commissioner-only denial ----------
function renderTournamentDenied() {
  var h = '<div class="sh"><h2>Tournaments</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';
  h += '<div style="text-align:center;padding:48px 24px;max-width:420px;margin:0 auto">';
  h += '<div style="display:flex;justify-content:center;margin-bottom:16px"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><path d="M6 9V7a6 6 0 0112 0v2"/><rect x="4" y="9" width="16" height="12" rx="2"/><circle cx="12" cy="15" r="1.5"/></svg></div>';
  h += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--cb-ink);letter-spacing:-0.5px">Commissioner only</div>';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.5;margin-top:8px">Only the commissioner of this league can create a tournament. Ask yours to set one up, then you\'ll see it here on the Events page.</div>';
  h += '<button class="btn full green" style="margin-top:24px" onclick="Router.go(\'trips\')">Back to Events</button>';
  h += '</div>';
  document.querySelector('[data-page="tournament"]').innerHTML = h;
}

// ---------- Builder ----------
function _tournDefaultState() {
  var preset = tournamentPreset("smoky");
  return {
    name: "",
    winnerTitle: preset.defaultTitle,
    venue: "",
    presetId: preset.id,
    format: preset.format,
    teamStyle: preset.teamStyle,
    pointSystem: preset.pointSystem,
    rounds: preset.rounds,
    teeTime: "8:00 AM",
    memberIds: [],
    startDate: "",
    startTime: "08:00"
  };
}

function renderTournamentCreate() {
  tournamentBuilderState = _tournDefaultState();
  var s = tournamentBuilderState;

  var h = '<div class="sh"><h2>New tournament</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';

  // Editorial masthead — the "cover" of the tournament program. Live-updates as
  // the commissioner types. Modernized Smoky Mountain Open layout.
  h += _tournMasthead(s);

  // Section 1 — Identity (the locked-before-start fields).
  h += _tournSection("01", "Identity", "Locks when you create. Chosen before the first tee.");
  h += '<div class="ff"><label class="ff-label">Tournament name</label><input class="ff-input" id="tourn-name" maxlength="60" placeholder="e.g. Smoky Mountain Open 2026" oninput="_tournOnIdentity()"></div>';
  h += '<div class="ff"><label class="ff-label">Title the winner earns</label><input class="ff-input" id="tourn-title" maxlength="48" value="' + escHtml(s.winnerTitle) + '" placeholder="e.g. Smoky Mountain Open Champion" oninput="_tournOnIdentity()"></div>';
  h += '<div class="ff"><label class="ff-label">Venue <span style="color:var(--cb-mute);font-weight:400">(optional)</span></label><input class="ff-input" id="tourn-venue" maxlength="60" placeholder="e.g. Heritage Hills, York PA" oninput="_tournOnIdentity()"></div>';
  h += '<div class="tourn-lock-note"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg><span>The name and the winner’s title can’t change once the tournament is created.</span></div>';
  h += '</section>';

  // Section 2 — Shape (preset + format/team/points/rounds).
  h += _tournSection("02", "Shape", "Start from a preset, then tune anything.");
  h += '<div id="tourn-presets">' + _tournPresetChips(s) + '</div>';
  h += '<div id="tourn-shape-controls">' + _tournShapeControls(s) + '</div>';
  h += '</section>';

  // Section 3 — Field (players + start).
  h += _tournSection("03", "Field", "Pick who’s in. Pairings come from their handicaps.");
  h += '<div id="tourn-field-count">' + _tournFieldCount(s) + '</div>';
  h += '<div id="tourn-members">' + _tournMemberRows(s) + '</div>';
  h += '<div class="ff-row" style="margin-top:14px">';
  h += '<div class="ff"><label class="ff-label">Start date</label><input type="date" class="ff-input" id="tourn-date" onchange="_tournOnStart()"></div>';
  h += '<div class="ff"><label class="ff-label">First tee</label><input type="time" class="ff-input" id="tourn-time" value="08:00" onchange="_tournOnStart()"></div>';
  h += '</div>';
  h += '</section>';

  // Section 4 — Review & lock (live generated plan).
  h += _tournSection("04", "Review", "This is what gets generated. Lock it in.");
  h += '<div id="tourn-review">' + _tournReview(s) + '</div>';
  h += '<div id="tourn-errors"></div>';
  h += '<button class="btn full green" style="margin-top:16px" onclick="submitTournamentCreate()">Lock &amp; create tournament</button>';
  h += '</section>';

  document.querySelector('[data-page="tournament"]').innerHTML = h;
}

// Editorial masthead block. ids let us live-update without a full re-render.
function _tournMasthead(s) {
  var league = (typeof window !== "undefined" && window._activeLeagueName) ? window._activeLeagueName : "The Parbaughs";
  var h = '<div class="tourn-masthead">';
  h += '<div class="tourn-masthead__eyebrow">' + escHtml(league) + ' · <span style="color:var(--cb-brass)">Draft</span></div>';
  h += '<div class="tourn-masthead__title" id="tourn-mh-title">' + (s.name ? escHtml(s.name) : "Untitled tournament") + '</div>';
  h += '<div class="tourn-masthead__dek" id="tourn-mh-dek">for the title of <em>' + escHtml(s.winnerTitle || "Champion") + '</em></div>';
  h += '<div class="tourn-masthead__rule"></div>';
  h += '<div class="tourn-masthead__meta" id="tourn-mh-meta">' + _tournMastheadMeta(s) + '</div>';
  h += '</div>';
  return h;
}

function _tournMastheadMeta(s) {
  var fmt = tournamentFormat(s.format);
  var style = tournamentTeamStyle(s.teamStyle);
  var parts = [fmt.name, style.name, s.rounds + (s.rounds === 1 ? " round" : " rounds")];
  if (s.venue) parts.push(s.venue);
  return parts.map(function (p) { return escHtml(p); }).join(' <span style="opacity:.4">·</span> ');
}

function _tournSection(num, title, sub) {
  var h = '<section class="tourn-sec">';
  h += '<div class="tourn-sec__head">';
  h += '<span class="tourn-sec__num">' + num + '</span>';
  h += '<div><div class="tourn-sec__title">' + escHtml(title) + '</div>';
  h += '<div class="tourn-sec__sub">' + escHtml(sub) + '</div></div>';
  h += '</div>';
  return h;
}

function _tournPresetChips(s) {
  var h = '<div class="tourn-chips">';
  TOURNAMENT_PRESETS.forEach(function (p) {
    var on = p.id === s.presetId;
    h += '<button type="button" class="tourn-chip' + (on ? ' tourn-chip--on' : '') + '" onclick="_tournPickPreset(\'' + p.id + '\')">';
    h += '<span class="tourn-chip__name">' + escHtml(p.name) + '</span>';
    h += '<span class="tourn-chip__desc">' + escHtml(p.desc) + '</span>';
    h += '</button>';
  });
  h += '</div>';
  return h;
}

function _tournShapeControls(s) {
  var h = '';
  // Format
  h += '<div class="ff"><label class="ff-label">Format</label><select class="ff-input" id="tourn-format" onchange="_tournSetField(\'format\',this.value)">';
  TOURNAMENT_FORMATS.forEach(function (f) {
    h += '<option value="' + f.id + '"' + (f.id === s.format ? ' selected' : '') + '>' + escHtml(f.name) + '</option>';
  });
  h += '</select><div class="tourn-hint">' + escHtml(tournamentFormat(s.format).desc) + '</div></div>';
  // Team style
  h += '<div class="ff"><label class="ff-label">Team style</label><select class="ff-input" id="tourn-team" onchange="_tournSetField(\'teamStyle\',this.value)">';
  TOURNAMENT_TEAM_STYLES.forEach(function (t) {
    h += '<option value="' + t.id + '"' + (t.id === s.teamStyle ? ' selected' : '') + '>' + escHtml(t.name) + '</option>';
  });
  h += '</select><div class="tourn-hint">' + escHtml(tournamentTeamStyle(s.teamStyle).desc) + '</div></div>';
  // Point system
  h += '<div class="ff"><label class="ff-label">Point system</label><select class="ff-input" id="tourn-points" onchange="_tournSetField(\'pointSystem\',this.value)">';
  TOURNAMENT_POINT_SYSTEMS.forEach(function (p) {
    h += '<option value="' + p.id + '"' + (p.id === s.pointSystem ? ' selected' : '') + '>' + escHtml(p.name) + '</option>';
  });
  h += '</select><div class="tourn-hint">' + escHtml(tournamentPointSystem(s.pointSystem).desc) + '</div></div>';
  // Rounds stepper
  h += '<div class="ff"><label class="ff-label">Rounds</label>';
  h += '<div class="tourn-stepper">';
  h += '<button type="button" class="tourn-stepper__btn" onclick="_tournBumpRounds(-1)" aria-label="Fewer rounds">−</button>';
  h += '<span class="tourn-stepper__val" id="tourn-rounds-val">' + s.rounds + '</span>';
  h += '<button type="button" class="tourn-stepper__btn" onclick="_tournBumpRounds(1)" aria-label="More rounds">+</button>';
  h += '</div></div>';
  return h;
}

function _tournMemberRows(s) {
  var players = (typeof PB !== "undefined" && PB.getPlayers) ? PB.getPlayers() : [];
  if (!players.length) {
    return '<div class="tourn-hint" style="padding:8px 0">No league members loaded yet.</div>';
  }
  var h = '';
  players.forEach(function (p) {
    var on = s.memberIds.indexOf(p.id) !== -1;
    h += '<div class="tourn-member' + (on ? ' tourn-member--on' : '') + '" id="tourn-m-' + p.id + '" onclick="toggleTournPlayer(\'' + p.id + '\')">';
    h += '<div class="tourn-member__left">' + renderAvatar(p, 28, false) + '<span class="tourn-member__name">' + renderUsername(p, '', false) + '</span></div>';
    var stat = tournamentPlayerStat(p.id);
    var hcp = stat.established ? ('HCP ' + stat.handicap) : 'New';
    h += '<div class="tourn-member__right"><span class="tourn-member__hcp">' + hcp + '</span>';
    h += '<span class="tourn-member__check">' + (on ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6"/></svg>' : '') + '</span></div>';
    h += '</div>';
  });
  return h;
}

function _tournFieldCount(s) {
  var style = tournamentTeamStyle(s.teamStyle);
  var n = s.memberIds.length;
  var ok = n >= style.minPlayers;
  var cls = ok ? 'tourn-count--ok' : 'tourn-count--warn';
  var msg = ok
    ? (n + ' player' + (n === 1 ? '' : 's') + ' selected')
    : ('Select at least ' + style.minPlayers + ' for ' + style.name + ' (' + n + ' so far)');
  return '<div class="tourn-count ' + cls + '">' + escHtml(msg) + '</div>';
}

// Live generated-plan preview. Renders teams / bracket / tee groups per the
// engine's field shape, plus the round-by-round schedule.
function _tournReview(s) {
  var style = tournamentTeamStyle(s.teamStyle);
  if (s.memberIds.length < style.minPlayers) {
    return '<div class="tourn-review-empty">Add ' + style.minPlayers + '+ players to preview the field and schedule.</div>';
  }
  var plan = tournamentGenerate({
    memberIds: s.memberIds,
    format: s.format,
    teamStyle: s.teamStyle,
    pointSystem: s.pointSystem,
    rounds: s.rounds,
    teeTime: s.teeTime
  });

  var h = '';

  // Field block
  h += '<div class="tourn-block"><div class="tourn-block__label">Field</div>';
  if (plan.field.kind === "teams") {
    var r = plan.field.result;
    r.teams.forEach(function (t) {
      h += '<div class="tourn-team-card">';
      h += '<div class="tourn-team-card__head"><span class="tourn-team-card__name">' + escHtml(t.name) + '</span><span class="tourn-team-card__hcp">combined ' + t.combinedHandicap + '</span></div>';
      h += '<div class="tourn-team-card__members">' + t.members.map(function (m) { return escHtml(m.name); }).join(', ') + '</div>';
      h += '</div>';
    });
    h += '<div class="tourn-fairness">' + escHtml(r.fairness) + ' · spread ' + r.spread + '</div>';
  } else if (plan.field.kind === "bracket") {
    var b = plan.field.result;
    if (b.byes) h += '<div class="tourn-hint" style="margin-bottom:8px">' + b.byes + ' top seed' + (b.byes === 1 ? '' : 's') + ' get a first-round bye.</div>';
    b.matches.forEach(function (m) {
      h += '<div class="tourn-match">';
      h += '<span class="tourn-match__seed">#' + m.seedA + '</span>';
      h += '<span class="tourn-match__name">' + (m.playerA ? escHtml(m.playerA.name) : '—') + '</span>';
      h += '<span class="tourn-match__vs">' + (m.bye ? 'bye' : 'vs') + '</span>';
      h += '<span class="tourn-match__name tourn-match__name--b">' + (m.playerB ? escHtml(m.playerB.name) : '—') + '</span>';
      h += '<span class="tourn-match__seed">#' + m.seedB + '</span>';
      h += '</div>';
    });
  } else {
    plan.field.result.forEach(function (g, i) {
      h += '<div class="tourn-group"><span class="tourn-group__label">Group ' + (i + 1) + '</span><span class="tourn-group__members">' + g.map(function (p) { return escHtml(p.name); }).join(', ') + '</span></div>';
    });
  }
  h += '</div>';

  // Schedule block
  h += '<div class="tourn-block"><div class="tourn-block__label">Schedule</div>';
  plan.schedule.forEach(function (rd) {
    h += '<div class="tourn-round"><span class="tourn-round__num">R' + rd.round + '</span><span class="tourn-round__fmt">' + escHtml(rd.formatName) + '</span><span class="tourn-round__tee">' + escHtml(rd.teeTime) + '</span></div>';
  });
  h += '</div>';

  // Scoring note
  h += '<div class="tourn-block"><div class="tourn-block__label">Scoring</div>';
  h += '<div class="tourn-hint" style="padding:0">' + escHtml(tournamentPointSystem(s.pointSystem).desc) + '</div></div>';

  return h;
}

// ---------- Builder interactions ----------
function _tournOnIdentity() {
  if (!tournamentBuilderState) return;
  var s = tournamentBuilderState;
  s.name = (document.getElementById("tourn-name") || {}).value || "";
  s.winnerTitle = (document.getElementById("tourn-title") || {}).value || "";
  s.venue = (document.getElementById("tourn-venue") || {}).value || "";
  var title = document.getElementById("tourn-mh-title");
  if (title) title.textContent = s.name || "Untitled tournament";
  var dek = document.getElementById("tourn-mh-dek");
  if (dek) dek.innerHTML = 'for the title of <em>' + escHtml(s.winnerTitle || "Champion") + '</em>';
  _tournRefreshMeta();
}

function _tournPickPreset(id) {
  var s = tournamentBuilderState;
  var p = tournamentPreset(id);
  if (!p) return;
  s.presetId = id;
  s.format = p.format;
  s.teamStyle = p.teamStyle;
  s.pointSystem = p.pointSystem;
  s.rounds = p.rounds;
  // Only overwrite the winner title if the commissioner hasn't typed a custom one.
  var titleInput = document.getElementById("tourn-title");
  if (titleInput && (!titleInput.value || _tournIsPresetTitle(titleInput.value))) {
    titleInput.value = p.defaultTitle;
    s.winnerTitle = p.defaultTitle;
    _tournOnIdentity();
  }
  _tournRerenderShape();
  _tournRerenderReview();
  _tournRefreshMeta();
}

function _tournIsPresetTitle(val) {
  return TOURNAMENT_PRESETS.some(function (p) { return p.defaultTitle === val; });
}

function _tournSetField(key, val) {
  var s = tournamentBuilderState;
  s[key] = val;
  // Manual tuning means we're no longer on a clean preset; clear the chip selection.
  s.presetId = _tournMatchPreset(s);
  _tournRerenderPresets();
  // Re-render the shape controls so the hint text under the changed select updates.
  _tournRerenderShape();
  if (key === "teamStyle") _tournRerenderFieldCount();
  _tournRerenderReview();
  _tournRefreshMeta();
}

function _tournBumpRounds(delta) {
  var s = tournamentBuilderState;
  s.rounds = Math.max(1, Math.min(8, s.rounds + delta));
  var el = document.getElementById("tourn-rounds-val");
  if (el) el.textContent = s.rounds;
  s.presetId = _tournMatchPreset(s);
  _tournRerenderPresets();
  _tournRerenderReview();
  _tournRefreshMeta();
}

// Return the preset id whose shape exactly matches current state, else "".
function _tournMatchPreset(s) {
  var hit = TOURNAMENT_PRESETS.find(function (p) {
    return p.format === s.format && p.teamStyle === s.teamStyle && p.pointSystem === s.pointSystem && p.rounds === s.rounds;
  });
  return hit ? hit.id : "";
}

function toggleTournPlayer(pid) {
  var s = tournamentBuilderState;
  var idx = s.memberIds.indexOf(pid);
  if (idx === -1) s.memberIds.push(pid); else s.memberIds.splice(idx, 1);
  var row = document.getElementById("tourn-m-" + pid);
  if (row) {
    var on = s.memberIds.indexOf(pid) !== -1;
    row.classList.toggle("tourn-member--on", on);
    var check = row.querySelector(".tourn-member__check");
    if (check) check.innerHTML = on ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6"/></svg>' : '';
  }
  _tournRerenderFieldCount();
  _tournRerenderReview();
}

function _tournOnStart() {
  var s = tournamentBuilderState;
  s.startDate = (document.getElementById("tourn-date") || {}).value || "";
  s.startTime = (document.getElementById("tourn-time") || {}).value || "08:00";
  s.teeTime = _tournPrettyTime(s.startTime);
  _tournRerenderReview();
  _tournRefreshMeta();
}

function _tournPrettyTime(hhmm) {
  if (!hhmm || hhmm.indexOf(":") === -1) return "8:00 AM";
  var parts = hhmm.split(":");
  var hr = parseInt(parts[0], 10);
  var min = parts[1] || "00";
  var ampm = hr >= 12 ? "PM" : "AM";
  var h12 = hr % 12; if (h12 === 0) h12 = 12;
  return h12 + ":" + min + " " + ampm;
}

function _tournRerenderShape() {
  var el = document.getElementById("tourn-shape-controls");
  if (el) el.innerHTML = _tournShapeControls(tournamentBuilderState);
}
function _tournRerenderPresets() {
  var el = document.getElementById("tourn-presets");
  if (el) el.innerHTML = _tournPresetChips(tournamentBuilderState);
}
function _tournRerenderReview() {
  var el = document.getElementById("tourn-review");
  if (el) el.innerHTML = _tournReview(tournamentBuilderState);
}
function _tournRerenderFieldCount() {
  var el = document.getElementById("tourn-field-count");
  if (el) el.innerHTML = _tournFieldCount(tournamentBuilderState);
}
function _tournRefreshMeta() {
  var el = document.getElementById("tourn-mh-meta");
  if (el) el.innerHTML = _tournMastheadMeta(tournamentBuilderState);
}

// ---------- Submit ----------
function submitTournamentCreate() {
  var s = tournamentBuilderState;
  if (!s) return;
  // Pull latest identity fields (in case oninput missed a paste).
  s.name = (document.getElementById("tourn-name") || {}).value || s.name;
  s.winnerTitle = (document.getElementById("tourn-title") || {}).value || s.winnerTitle;

  var startAt = null;
  if (s.startDate) {
    var dt = new Date(s.startDate + "T" + (s.startTime || "08:00") + ":00");
    if (!isNaN(dt.getTime())) startAt = dt.getTime();
  }

  var config = {
    name: s.name, winnerTitle: s.winnerTitle, teamStyle: s.teamStyle,
    memberIds: s.memberIds, startAt: startAt
  };
  var v = tournamentValidate(config);
  if (!v.ok) {
    var errEl = document.getElementById("tourn-errors");
    if (errEl) {
      errEl.innerHTML = '<div class="tourn-errors">' + v.errors.map(function (e) {
        return '<div class="tourn-errors__item">' + escHtml(e) + '</div>';
      }).join('') + '</div>';
    }
    return;
  }

  var plan = tournamentGenerate({
    memberIds: s.memberIds, format: s.format, teamStyle: s.teamStyle,
    pointSystem: s.pointSystem, rounds: s.rounds, teeTime: s.teeTime
  });

  var startDateObj = startAt ? new Date(startAt) : null;
  var datesStr = startDateObj
    ? startDateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

  var trip = PB.addTrip({
    type: "tournament",
    name: s.name.trim(),
    winnerTitle: s.winnerTitle.trim(),
    location: s.venue ? s.venue.trim() : "",
    dates: datesStr,
    members: s.memberIds.slice(),
    status: "upcoming",
    format: s.format,
    teamStyle: s.teamStyle,
    pointSystem: s.pointSystem,
    rounds: s.rounds,
    startAt: startAt,
    presetId: s.presetId || null,
    plan: plan
  });

  if (Router.toast) Router.toast("Tournament locked in");
  if (trip && trip.id) Router.go("tournament", { id: trip.id });
  else Router.go("trips");
}

// ---------- View: masthead + live leaderboard + field + schedule ----------
function renderTournamentView(id) {
  var trips = (typeof PB !== "undefined" && PB.getTrips) ? PB.getTrips() : [];
  var t = trips.find(function (x) { return x.id === id; });
  if (!t) {
    var miss = '<div class="sh"><h2>Tournament</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';
    miss += '<div class="tourn-review-empty" style="margin:24px 16px">That tournament couldn’t be found. It may have been removed.</div>';
    document.querySelector('[data-page="tournament"]').innerHTML = miss;
    return;
  }

  var league = (typeof window !== "undefined" && window._activeLeagueName) ? window._activeLeagueName : "The Parbaughs";
  var fmt = tournamentFormat(t.format || "stableford");
  var style = tournamentTeamStyle(t.teamStyle || "individual");
  var closed = t.status === "closed";
  var underway = !closed && t.startAt && Date.now() >= t.startAt;
  var phase = closed ? "Final" : underway ? "Underway" : "Locked";

  var h = '<div class="sh"><h2>Tournament</h2><button class="back" onclick="Router.back(\'trips\')">← Back</button></div>';
  h += '<div class="tourn-masthead">';
  h += '<div class="tourn-masthead__eyebrow">' + escHtml(league) + ' · <span style="color:var(--cb-brass)">' + phase + '</span></div>';
  h += '<div class="tourn-masthead__title">' + escHtml(t.name) + '</div>';
  h += '<div class="tourn-masthead__dek">for the title of <em>' + escHtml(t.winnerTitle || "Champion") + '</em></div>';
  h += '<div class="tourn-masthead__rule"></div>';
  var meta = [fmt.name, style.name, (t.rounds || 1) + ((t.rounds || 1) === 1 ? " round" : " rounds"), t.dates];
  if (t.location) meta.push(t.location);
  h += '<div class="tourn-masthead__meta">' + meta.filter(Boolean).map(function (p) { return escHtml(p); }).join(' <span style="opacity:.4">·</span> ') + '</div>';
  h += '</div>';

  // Champion band — only when the tournament is closed and a winner is recorded.
  if (closed && t.champion) {
    var champName = _tournResolveName(t.champion);
    h += '<div class="tourn-champion"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h12v3a6 6 0 01-12 0V4z"/><path d="M6 5H4a2 2 0 002 4M18 5h2a2 2 0 01-2 4M9 18h6M10 18v-3M14 18v-3M8 21h8"/></svg>';
    h += '<span class="tourn-champion__label">' + escHtml(t.winnerTitle || "Champion") + '</span>';
    h += '<span class="tourn-champion__name">' + escHtml(champName) + '</span></div>';
  }

  // Leaderboard — the live (or seeded) standings.
  h += '<div style="padding:0 16px">' + _tournLeaderboard(t) + '</div>';

  // Field + schedule from the stored plan.
  if (t.plan) {
    var planEl = JSON.parse(JSON.stringify(t.plan));
    h += '<div style="padding:0 16px">' + _tournViewPlan(planEl) + '</div>';
  }

  h += '<div class="tourn-lock-note" style="margin:16px"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg><span>Name and title locked at creation' + (t.lockedAt ? ' · ' + new Date(t.lockedAt).toLocaleDateString() : '') + '. The field and format are set; standings update as rounds are posted.</span></div>';

  document.querySelector('[data-page="tournament"]').innerHTML = h;
}

// Resolve a champion id (or raw name) to a display name.
function _tournResolveName(idOrName) {
  if (typeof PB !== "undefined" && PB.getPlayer) {
    var p = PB.getPlayer(idOrName);
    if (p) return p.name || p.username || idOrName;
  }
  return idOrName;
}

// Leaderboard block: seeded form guide before play, live standings once rounds
// are posted, final standings when closed. Consumes the engine's tournamentStandings.
function _tournLeaderboard(t) {
  var st = tournamentStandings(t);
  var closed = t.status === "closed";
  var label = closed ? "Final standings" : st.started ? "Standings" : "Form guide";
  var h = '<div class="tourn-block"><div class="tourn-block__label">' + label + '</div>';

  if (!st.started && !closed) {
    var lead = (st.kind === "teams")
      ? "Teams seeded by combined handicap. "
      : "Seeded by handicap. ";
    var when = _tournCountdown(t.startAt);
    h += '<div class="tourn-lead-hint">' + lead + "Points post live as rounds are scored."
      + (when ? ' <span class="tourn-lead-when">' + escHtml(when) + '</span>' : '') + '</div>';
  }

  if (!st.entries.length) {
    h += '<div class="tourn-review-empty">No field recorded for this tournament.</div></div>';
    return h;
  }

  st.entries.forEach(function (e, i) {
    var leadCls = (st.started || closed) && e.rank === 1 ? ' tourn-lead-row--lead' : '';
    var right = st.started
      ? ((e.points != null ? e.points : 0) + " pts")
      : (st.kind === "teams" ? "HCP " + _tournHcp(e.combinedHandicap) : "HCP " + _tournHcp(e.handicap));
    var delay = Math.min(i, 12) * 0.03;
    h += '<div class="tourn-lead-row' + leadCls + '" style="animation-delay:' + delay + 's">';
    h += '<span class="tourn-lead-rank">' + e.rank + '</span>';
    h += '<div class="tourn-lead-body"><span class="tourn-lead-name">' + escHtml(e.name) + '</span>';
    if (st.kind === "teams") {
      h += '<span class="tourn-lead-sub">' + e.members.map(function (m) { return escHtml(m.name); }).join(", ") + '</span>';
    }
    h += '</div>';
    h += '<span class="tourn-lead-val">' + escHtml(String(right)) + '</span>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// Handicap to a uniform 1-decimal string so the leaderboard column stays aligned.
function _tournHcp(n) {
  var v = Number(n);
  return isNaN(v) ? String(n) : v.toFixed(1);
}

// Human countdown to first tee. Past start → "Underway".
function _tournCountdown(startAt) {
  if (!startAt) return "";
  var diff = startAt - Date.now();
  if (diff <= 0) return "Underway";
  var mins = Math.floor(diff / 60000);
  var days = Math.floor(mins / 1440);
  var hrs = Math.floor((mins % 1440) / 60);
  if (days >= 1) return "Tees off in " + days + " day" + (days === 1 ? "" : "s") + (hrs ? " " + hrs + "h" : "");
  if (hrs >= 1) return "Tees off in " + hrs + "h " + (mins % 60) + "m";
  return "Tees off in " + mins + " min";
}

// Shared field+schedule renderer for the view (reuses the builder's block styles).
function _tournViewPlan(plan, t) {
  var h = '';
  h += '<div class="tourn-block"><div class="tourn-block__label">Field</div>';
  if (plan.field && plan.field.kind === "teams") {
    plan.field.result.teams.forEach(function (tm) {
      h += '<div class="tourn-team-card"><div class="tourn-team-card__head"><span class="tourn-team-card__name">' + escHtml(tm.name) + '</span><span class="tourn-team-card__hcp">combined ' + tm.combinedHandicap + '</span></div>';
      h += '<div class="tourn-team-card__members">' + tm.members.map(function (m) { return escHtml(m.name); }).join(', ') + '</div></div>';
    });
    h += '<div class="tourn-fairness">' + escHtml(plan.field.result.fairness) + ' · spread ' + plan.field.result.spread + '</div>';
  } else if (plan.field && plan.field.kind === "bracket") {
    plan.field.result.matches.forEach(function (m) {
      h += '<div class="tourn-match"><span class="tourn-match__seed">#' + m.seedA + '</span><span class="tourn-match__name">' + (m.playerA ? escHtml(m.playerA.name) : '—') + '</span><span class="tourn-match__vs">' + (m.bye ? 'bye' : 'vs') + '</span><span class="tourn-match__name tourn-match__name--b">' + (m.playerB ? escHtml(m.playerB.name) : '—') + '</span><span class="tourn-match__seed">#' + m.seedB + '</span></div>';
    });
  } else if (plan.field && plan.field.result) {
    plan.field.result.forEach(function (g, i) {
      h += '<div class="tourn-group"><span class="tourn-group__label">Group ' + (i + 1) + '</span><span class="tourn-group__members">' + g.map(function (p) { return escHtml(p.name); }).join(', ') + '</span></div>';
    });
  }
  h += '</div>';

  h += '<div class="tourn-block"><div class="tourn-block__label">Schedule</div>';
  (plan.schedule || []).forEach(function (rd) {
    h += '<div class="tourn-round"><span class="tourn-round__num">R' + rd.round + '</span><span class="tourn-round__fmt">' + escHtml(rd.formatName) + '</span><span class="tourn-round__tee">' + escHtml(rd.teeTime) + '</span></div>';
  });
  h += '</div>';
  return h;
}
