// Home — HQ Band 3 rail + new-user variants + live round card + CTAs.
// Extracted per W1.A5 (AMD-027).

function _renderOnlineNowStrip(ctx) {
  var entries = (typeof onlineMembers !== "undefined" && onlineMembers) ? Object.keys(onlineMembers) : [];
  // Exclude self for cleaner display (you know you're online)
  var uid = currentUser ? currentUser.uid : null;
  entries = entries.filter(function(id) { return id !== uid; });
  var count = entries.length;

  // Ship 5 Gate 2 (v8.15.1) — .hq-rail-module + .hq-rail-module__eyebrow per
  // §12(d). Live-Now eyebrow gets the claret pulse dot indicator.
  var h = '<div class="hq-rail-module">';
  h += '<div class="hq-rail-module__eyebrow hq-rail-module__eyebrow--live">';
  h += '<span class="hq-rail-module__pulse-dot" aria-hidden="true"></span>';
  h += '<span>ONLINE · </span><span style="color:var(--cb-brass)">' + count + '</span>';
  h += '</div>';

  if (count === 0) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase;padding:var(--sp-2) 0">QUIET RIGHT NOW</div>';
    h += '</div>';
    return h;
  }

  // 2×2 grid, 4 visible max
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 10px">';
  entries.slice(0, 4).forEach(function(id) {
    var data = onlineMembers[id];
    var name = (data && data.name) || "Member";
    var initial = (name.charAt(0) || "?").toUpperCase();
    // Truncate handle to 8 chars + ellipsis
    var handle = name.length > 8 ? name.slice(0, 7) + "…" : name;
    h += '<div onclick="Router.go(\'members\',{id:\'' + id + '\'})" style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-1);cursor:pointer">';
    h += '<div style="position:relative;width:36px;height:36px">';
    h += '<div style="width:36px;height:36px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700">' + escHtml(initial) + '</div>';
    h += '<div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:var(--cb-moss);border:2px solid var(--cb-chalk)"></div>';
    h += '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:500;color:var(--cb-ink);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(handle) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
}

// Upcoming tee times — next 5 league sessions. Listener race: liveTeeTimes may
// be empty on first render — empty state covers this; subsequent re-renders
// refresh data when teetime listener fires.
function _renderUpcomingTeeTimes(ctx) {
  var upcoming = _getUpcomingTeeTimes(5) || [];
  var newUserFraming = ctx.state === "new";

  // Ship 5 Gate 2 (v8.15.1) — .hq-rail-module + .hq-rail-module__eyebrow per §12(d).
  var h = '<div class="hq-rail-module">';
  if (newUserFraming) {
    h += '<div class="hq-rail-module__eyebrow" style="margin-bottom:4px">OPEN TEE TIMES</div>';
    h += '<div onclick="Router.go(\'teetimes\')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;margin-bottom:12px">JOIN ANOTHER MEMBER →</div>';
  } else {
    h += '<div class="hq-rail-module__eyebrow">TEE TIMES</div>';
  }

  if (!upcoming.length) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase;padding:var(--sp-2) 0">NOTHING SCHEDULED</div>';
    // v8.16.0 Item 3 — empty-state CTA. Routes to existing /teetimes page;
    // does NOT implement invitation/RSVP flow (Ship 5+2 territory).
    h += '<div onclick="Router.go(\'teetimes\')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;margin-top:12px">PROPOSE A TEE TIME →</div>';
    h += '</div>';
    return h;
  }

  upcoming.forEach(function(t) {
    var hourLabel = (t.time || "").toUpperCase().replace(/^0/, "");  // "8 AM" / "11 AM" / "2 PM"
    var dateLabel = "";
    if (t.date) {
      var d = new Date(t.date + "T12:00:00");
      var month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
      dateLabel = month + " " + d.getDate();
    }
    var max = t.maxPlayers || 4;
    var rsvps = (t.rsvps && t.rsvps.length) || (t.players && t.players.length) || 0;
    var spotsOpen = Math.max(0, max - rsvps);
    var spotsLabel = spotsOpen > 0 ? spotsOpen + " OPEN" : "FULL";
    var spotsColor = spotsOpen > 0 ? "var(--cb-brass)" : "var(--cb-moss)";

    h += '<div onclick="Router.go(\'teetimes\',{id:\'' + (t._id || "") + '\'})" style="height:48px;border-bottom:1px solid var(--cb-chalk-3);display:flex;align-items:center;gap:10px;cursor:pointer">';
    // Time stack
    h += '<div style="flex-shrink:0">';
    h += '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink);line-height:1">' + escHtml(hourLabel || "—") + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px;margin-top:2px">' + escHtml(dateLabel) + '</div>';
    h += '</div>';
    // Course
    h += '<div style="flex:1;min-width:0;font-family:var(--font-ui);font-size:var(--hq-eyebrow-size);font-weight:500;color:var(--cb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(t.course || "TBD") + '</div>';
    // Spots
    h += '<div style="flex-shrink:0;font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:1px;color:' + spotsColor + ';text-transform:uppercase">' + escHtml(spotsLabel) + '</div>';
    h += '</div>';
  });
  // v8.16.0 Item 3 — "+ Add another" affordance. Lower-emphasis treatment
  // (mute color, smaller padding) since the list above is the primary content.
  h += '<div onclick="Router.go(\'teetimes\')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;cursor:pointer;padding-top:10px">+ ADD ANOTHER</div>';
  h += '</div>';
  return h;
}

// Member spotlight — featured member intro for State 3 only. Founding-four
// rotation by day-of-week, excluding self. Falls back to first non-self
// member if pool is empty; skips render if pool is still empty.
function _renderMemberSpotlight(ctx) {
  if (typeof PB === "undefined" || !PB.getPlayers) return "";
  var uid = currentUser ? currentUser.uid : null;
  var claimedFrom = currentProfile ? currentProfile.claimedFrom : null;

  var allPlayers = PB.getPlayers() || [];
  var pool = allPlayers.filter(function(p) {
    return p && (p.founding || p.isFoundingFour) && p.id !== uid && p.id !== claimedFrom;
  });
  if (!pool.length) {
    // Fallback: any non-self member
    pool = allPlayers.filter(function(p) {
      return p && p.id !== uid && p.id !== claimedFrom;
    });
  }
  if (!pool.length) return "";  // Graceful skip — no other members to spotlight

  // Deterministic rotation by day-of-week
  var idx = new Date().getDay() % pool.length;
  var member = pool[idx];
  if (!member) return "";

  var name = member.name || member.username || "Member";
  var handle = member.username ? "@" + member.username : "";
  var initial = (name.charAt(0) || "?").toUpperCase();
  var bio = member.bio || "";
  var bioOrCourse = bio || (member.homeCourse ? "Plays out of " + member.homeCourse + "." : "");
  var tenureLabel = (member.founding || member.isFoundingFour) ? "FOUNDING MEMBER" : "MEMBER";

  // Ship 5 Gate 2 (v8.15.1) — .hq-rail-module + .hq-rail-module__eyebrow per §12(d).
  var h = '<div class="hq-rail-module" onclick="Router.go(\'members\',{id:\'' + member.id + '\'})" style="cursor:pointer">';
  h += '<div class="hq-rail-module__eyebrow">MEET</div>';
  h += '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:var(--sp-2)">';
  // Avatar 64×64
  h += '<div style="width:64px;height:64px;border-radius:50%;background:var(--cb-chalk-3);color:var(--cb-charcoal);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:24px;font-weight:700">' + escHtml(initial) + '</div>';
  // Name
  h += '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink);line-height:1.2">' + escHtml(name) + '</div>';
  // Handle + tenure
  if (handle) {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px">' + escHtml(handle) + ' · ' + tenureLabel + '</div>';
  } else {
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);color:var(--cb-mute);letter-spacing:0.5px">' + tenureLabel + '</div>';
  }
  // Bio (or course fallback) — 2 lines max
  if (bioOrCourse) {
    h += '<div style="font-family:var(--font-ui);font-size:var(--hq-agate-body-size);font-weight:500;color:var(--cb-charcoal);line-height:1.4;max-height:34px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + escHtml(bioOrCourse) + '</div>';
  }
  // CTA
  h += '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--cb-brass);text-transform:uppercase;margin-top:4px">Say hi →</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Agate rail composer — stacks online + tee times. State 3 adds member spotlight.
function _renderHQAgateRail(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderOnlineNowStrip(ctx);
  h += _renderUpcomingTeeTimes(ctx);
  if (ctx.state === "new") {
    h += _renderMemberSpotlight(ctx);
  }
  h += '</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// === STATE 3 LEAD COLUMN COMPONENTS (v8.6.1 · Ship 1b-iii) ===
// ═══════════════════════════════════════════════════════════════════════════

// Welcome hero — same architecture as _renderEditorialGreetingHero but with
// member-count-derived subhead and tenure eyebrow.
function _renderWelcomeHero(ctx) {
  var memberCount = 0;
  var courseCount = 0;
  if (typeof PB !== "undefined") {
    if (PB.getPlayers) memberCount = (PB.getPlayers() || []).length;
    if (PB.getRounds) {
      var courses = {};
      (PB.getRounds() || []).forEach(function(r) { if (r.course) courses[r.course] = true; });
      courseCount = Object.keys(courses).length;
    }
  }
  // New user is +1 to current count
  var memberNum = memberCount + 1;
  var d = new Date();
  var monthName = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"][d.getMonth()];
  var eyebrow = "MEMBER #" + memberNum + " · " + monthName + " " + d.getFullYear();

  var subhead;
  if (memberCount > 0 && courseCount > 0) {
    subhead = memberCount + " members. " + courseCount + " courses played. One season already underway. Here's how to get in.";
  } else {
    subhead = "A small league with big games. Log a round to claim your spot.";
  }

  var h = '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">' + escHtml(eyebrow) + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:var(--hq-hero-size);font-weight:var(--hq-hero-weight);line-height:1.05;letter-spacing:-2px;color:var(--cb-ink);margin-bottom:14px">';
  h += 'Welcome to the Parbaughs, <em style="font-style:italic;font-weight:700">' + escHtml(ctx.firstName) + '</em>.';
  h += '</div>';
  h += '<div style="font-family:var(--font-ui);font-size:var(--hq-subhead-size);font-weight:500;color:var(--cb-charcoal);max-width:480px;line-height:1.45">' + escHtml(subhead) + '</div>';
  h += '</div>';
  return h;
}

// Start-first-round panel — green CTA panel with stacked actions.
function _renderStartFirstRoundPanel(ctx) {
  var h = '<div style="background:var(--cb-green);border-radius:var(--r-4);padding:var(--sp-6);color:var(--cb-chalk)">';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:18px">FIRST MOVE</div>';
  // Primary CTA — brass-on-chalk
  h += '<div onclick="Router.go(\'playnow\')" style="background:var(--cb-chalk);color:var(--cb-ink);height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:var(--sp-2);cursor:pointer;margin-bottom:10px">';
  h += '<span style="font-family:var(--font-ui);font-size:14px;font-weight:600">Start a round</span>';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="2"><path d="M5 4l4 4-4 4"/></svg>';
  h += '</div>';
  // Secondary CTA — ghost chalk-2
  h += '<div onclick="Router.go(\'courses\')" style="background:rgba(var(--bg-rgb),0.10);color:rgba(var(--bg-rgb),0.85);height:44px;border-radius:var(--r-2);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:14px">';
  h += '<span style="font-family:var(--font-ui);font-size:13px;font-weight:500">Browse courses</span>';
  h += '</div>';
  // Tertiary text link
  h += '<div onclick="Router.go(\'teetimes\')" style="text-align:center;cursor:pointer">';
  h += '<span style="font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:1.2px;color:var(--cb-brass);text-transform:uppercase">Or join an open match →</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Ghosted stats quartet — same structure as _renderStatsSnapshotQuartet but
// at 35% opacity, "—" values, and a "YOUR STATS APPEAR..." caption above.
function _renderGhostedStatsQuartet(ctx) {
  var h = '<div>';
  h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-mute);text-transform:uppercase;margin-bottom:12px">YOUR STATS APPEAR AFTER YOUR FIRST ROUND</div>';
  h += '<div style="opacity:0.35;pointer-events:none">';
  h += '<div style="display:flex;align-items:stretch;height:120px">';
  var labels = ["HCP", "ROUNDS", "BEST", "STREAK"];
  labels.forEach(function(label, i) {
    var sep = i > 0 ? "border-left:1px solid var(--cb-chalk-3);" : "";
    h += '<div style="flex:1;' + sep + 'padding:18px 14px;display:flex;flex-direction:column;justify-content:center;gap:6px">';
    h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:600;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + label + '</div>';
    // Smoke selector — match the data-stat shape from the live quartet so
    // tests that read [data-stat="round-count"] succeed even on 0-rounds users.
    var dataAttrs = '';
    if (label === "ROUNDS") dataAttrs = ' data-stat="round-count" data-count="0"';
    else if (label === "HCP") dataAttrs = ' data-stat="handicap"';
    else if (label === "BEST") dataAttrs = ' data-stat="best-round"';
    h += '<div class="hq-stat-strip__numeral"' + dataAttrs + ' style="font-family:var(--font-display);font-size:var(--hq-stat-number-size);font-weight:700;color:var(--cb-ink);line-height:1">—</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

// State 3 lead column composer — same component shapes work at Band B/C/D
// because tokens drive size and flex-children stretch to column width.
function _renderHQLeadColumnNew(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderWelcomeHero(ctx);
  h += _renderStartFirstRoundPanel(ctx);
  h += _renderGhostedStatsQuartet(ctx);
  h += '</div>';
  return h;
}

// State 3 features column composer — reuses ladder (state-aware) + activity feed.
function _renderHQFeaturesColumnNew(ctx) {
  var h = '<div style="display:flex;flex-direction:column;gap:var(--sp-6)">';
  h += _renderSeasonLadderTop10(ctx);   // state-aware; renders "your position" placeholder
  h += _renderActivityFeedCompact(ctx, 12);
  h += '</div>';
  return h;
}

function _renderEmailVerifyBanner() {
  if (!currentUser || currentUser.emailVerified) return "";
  var h = '<div style="padding:10px 22px;background:rgba(180,137,62,0.08);border-bottom:1px solid rgba(180,137,62,0.15);display:flex;align-items:center;gap:10px">';
  h += '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--cb-brass)" stroke-width="1.5" style="flex-shrink:0"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z"/><path d="M1 5l7 4 7-4"/></svg>';
  h += '<div style="flex:1;font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;color:var(--cb-brass);line-height:1.4">Verify your email to unlock wagers, bounties, DMs, and the shop.</div>';
  h += '<button style="background:var(--cb-brass);color:var(--cb-chalk);border:none;border-radius:var(--r-1);font:700 10px/1 var(--font-ui);padding:6px 12px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px" onclick="sendVerificationEmail()">Verify</button>';
  h += '</div>';
  return h;
}

function _renderGreeting(greetingWord, firstName) {
  var h = '<div style="padding:28px 22px 0">';
  h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:10px">' + _formatDateEyebrow() + '</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-ink);line-height:1.15;letter-spacing:-0.5px">';
  h += escHtml(greetingWord) + ',<br>';
  h += '<span style="font-style:italic;font-weight:600">' + escHtml(firstName) + '.</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

// Mobile live-round card — v8.11.10 adds variant dispatch via deviceOwnership.
// Compact secondary variant rendered when 'remote'; primary variant otherwise
// (existing behavior preserved with caption slot inserted).
function _renderLiveRoundCard() {
  // v8.11.11 — Completed-round retention overlay check (mirror HQ pattern).
  if (window._completedRoundOverlay) {
    if (Date.now() < window._completedRoundOverlay.expiresAt) {
      return '<div style="padding:18px 22px 0">' + _renderFinishedSummaryCard(window._completedRoundOverlay.round) + '</div>';
    }
    window._completedRoundOverlay = null;
  }
  if (typeof liveState === "undefined" || !liveState || !liveState.active) return "";
  if (liveState.deviceOwnership === "remote") {
    return '<div style="padding:18px 22px 0">' + _renderLiveRoundSecondary({ size: "compact" }) + '</div>';
  }

  var course = liveState.course || "Round in progress";
  var hole = (liveState.currentHole || 0) + 1;
  var scored = liveState.scores ? liveState.scores.filter(function(s) { return s !== ""; }) : [];
  var thru = scored.length;
  var total = scored.reduce(function(a, b) { return a + parseInt(b); }, 0);

  var defaultPar = [4,4,3,4,5,4,4,3,5,4,3,4,5,4,4,3,4,5];
  var parSoFar = 0;
  for (var i = 0; i < thru; i++) {
    var hd = liveState.holes && liveState.holes[i];
    parSoFar += (hd && hd.par) ? hd.par : (defaultPar[i] || 4);
  }
  var diff = thru > 0 ? total - parSoFar : 0;
  var diffStr = thru === 0 ? "—" : (diff === 0 ? "E" : (diff > 0 ? "+" + diff : String(diff)));

  var fmt = (liveState.format || "stroke").toString();
  var formatLabel = PB.fmtLabel(fmt).toUpperCase();

  var h = '<div style="padding:18px 22px 0">';
  h += '<div id="live-round-card" class="tappable" onclick="Router.go(\'playnow\')" style="background:var(--cb-green);border-radius:var(--r-4);padding:22px;color:var(--cb-chalk);cursor:pointer;position:relative;overflow:hidden">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);display:flex;align-items:center;gap:var(--sp-2);margin-bottom:14px">';
  h += '<span style="width:6px;height:6px;border-radius:50%;background:var(--cb-brass);animation:pulse-dot 2s infinite"></span>';
  h += 'LIVE · YOUR ROUND';
  h += '</div>';
  h += '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--cb-chalk);line-height:1.2;letter-spacing:-0.3px;margin-bottom:6px">' + escHtml(course) + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1.5px">HOLE ' + hole + ' · THRU ' + thru + ' · ' + formatLabel + '</div>';
  h += '<div style="display:flex;gap:22px;padding-top:16px;margin-top:16px;border-top:1px solid rgba(var(--bg-rgb),0.14)">';
  h += '<div style="flex:1">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">YOU</div>';
  h += '<div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--cb-chalk);line-height:1">' + (thru > 0 ? total : "—") + '</div>';
  h += '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(var(--bg-rgb),0.6);letter-spacing:1px;margin-top:4px">' + diffStr + (thru > 0 ? " THRU " + thru : "") + '</div>';
  h += '</div>';
  h += '<div style="flex:1;text-align:right;align-self:center">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;color:var(--cb-brass);margin-bottom:6px">RESUME</div>';
  h += '<div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--cb-chalk)">Scorecard →</div>';
  h += '</div>';
  h += '</div>';
  // v8.11.10 — caption slot for multi-device caption (mobile primary variant)
  h += '<div id="live-round-caption"></div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderUnfinishedTripBanner(trips, uid, claimedFrom) {
  if (!uid || !trips || !trips.length) return "";
  var today = localDateStr();
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var todayDay = dayNames[new Date().getDay()];
  var h = "";
  trips.forEach(function(tr) {
    if (!tr.courses || !tr.startDate || !tr.endDate) return;
    if (today < tr.startDate || today > tr.endDate) return;
    var isMember = tr.members && (
      tr.members.indexOf(uid) !== -1 ||
      (claimedFrom && tr.members.indexOf(claimedFrom) !== -1)
    );
    if (!isMember && !isFounderRole(currentProfile)) return;
    tr.courses.forEach(function(crs) {
      if (crs.finished) return;
      var courseDay = (crs.d || "").split(" ")[0];
      if (courseDay && courseDay !== todayDay) return;
      var tid = escHtml(tr.id);
      var ck = escHtml(crs.key);
      h += '<div data-trip-id="' + tid + '" data-course-key="' + ck + '" class="tappable" onclick="Router.go(\'scorecard\',{tripId:this.getAttribute(\'data-trip-id\'),course:this.getAttribute(\'data-course-key\')})" style="margin:18px 22px 0;padding:14px 16px;background:var(--cb-chalk-2);border:1px solid rgba(var(--cb-moss-rgb),.3);border-radius:10px;cursor:pointer">';
      h += '<div style="display:flex;align-items:center;gap:10px;pointer-events:none">';
      h += '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--cb-moss)" stroke-width="1.5" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
      h += '<div style="flex:1">';
      h += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--cb-ink);line-height:1.3">' + escHtml(crs.n || crs.key) + ': scores not finalized</div>';
      h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px">' + escHtml(tr.name) + ' · Tap to review and finish round</div>';
      h += '</div>';
      h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--cb-mute)" stroke-width="1.5" style="flex-shrink:0"><path d="M6 4l4 4-4 4"/></svg>';
      h += '</div></div>';
    });
  });
  return h;
}

function _renderReadyCTA() {
  var h = '<div style="padding:18px 22px 0">';
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="padding:22px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:10px">NO ROUND TODAY</div>';
  h += '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-ink);line-height:1.2;letter-spacing:-0.2px;margin-bottom:8px">Ready when you are.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:13px;color:var(--cb-charcoal);line-height:1.55;max-width:380px;margin-bottom:16px">Start a round and the scorecard, skins pot and your caddie will wake up.</div>';
  h += '<div style="display:inline-flex;align-items:center;gap:var(--sp-2);padding:11px 18px;background:var(--cb-green);color:var(--cb-chalk);border-radius:var(--r-2);font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0.3px">';
  h += '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14V2l8 3-8 3"/></svg>';
  h += 'Start a round';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderNewUserIntro() {
  var h = '<div style="padding:10px 22px 0">';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.55;max-width:440px">You’re in. Start by logging a round, or hit the range to warm up.</div>';
  h += '</div>';
  return h;
}

function _renderNewUserCTAs() {
  var h = '<div style="padding:18px 22px 0;display:flex;gap:10px;flex-wrap:wrap">';
  // First round
  h += '<div class="tappable" onclick="Router.go(\'playnow\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">START HERE</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Your first round.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Log a full round and the Clubhouse comes alive.</div>';
  h += '</div>';
  // Range session
  h += '<div class="tappable" onclick="Router.go(\'range\')" style="flex:1 1 180px;padding:18px 16px;background:var(--cb-chalk);border:1px dashed var(--cb-chalk-3);border-radius:14px;cursor:pointer">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:8px">OR WARM UP</div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cb-ink);line-height:1.25;letter-spacing:-0.2px">Range session.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:6px;line-height:1.5">Track your bucket and focus drills.</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function _renderStatsStrip(totalRounds, handicap, bestRound, bestRoundId, isNew) {
  var roundsStr = isNew ? "0" : String(totalRounds != null ? totalRounds : 0);
  var hcapStr = (!isNew && handicap != null && !isNaN(handicap)) ? (+handicap).toFixed(1) : "—";
  var bestStr = (!isNew && bestRound != null) ? String(bestRound) : "—";

  // v8.22+ (design-pass 2026-05-22): compute Stripe-style comparative
  // captions for the mobile stats strip. Members get the same delta
  // semantics as desktop without needing to navigate.
  var roundsCaption = "", hcapCaption = "", bestCaption = "";
  var roundsColor = "var(--cb-mute)", hcapColor = "var(--cb-mute)", bestColor = "var(--cb-mute)";

  if (!isNew && typeof currentUser !== "undefined" && currentUser && typeof PB !== "undefined" && PB.getRounds) {
    try {
      var allRounds = PB.getRounds() || [];
      var myUid = currentUser.uid;
      var myLocal = (typeof currentProfile !== "undefined" && currentProfile) ? currentProfile.claimedFrom : null;
      var myRounds = allRounds.filter(function(r) { return r.player === myUid || r.player === myLocal; });

      // ROUNDS caption — last-30-day count
      var nowMs = Date.now();
      var thirtyAgo = nowMs - 30 * 86400000;
      var last30 = myRounds.filter(function(r) {
        var t = r.timestamp || (r.date ? new Date(r.date + "T00:00:00").getTime() : 0);
        return t >= thirtyAgo;
      }).length;
      roundsCaption = "LAST 30D · " + last30;

      // HCP caption — trend vs all-time average (5+ rounds)
      var indiv = myRounds.filter(function(r) {
        return r.format !== "scramble" && r.format !== "scramble4" && (!r.holesPlayed || r.holesPlayed >= 18);
      });
      if (indiv.length >= 5) {
        var sorted = indiv.slice().sort(function(a, b) {
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
        var last5avg = sorted.slice(0, 5).reduce(function(a, r) { return a + (r.score || 0); }, 0) / 5;
        var allAvg = sorted.reduce(function(a, r) { return a + (r.score || 0); }, 0) / sorted.length;
        var diff = last5avg - allAvg;
        if (diff <= -1) {
          hcapCaption = "▼ TRENDING DOWN";
          hcapColor = "var(--cb-moss, #4ea669)";
        } else if (diff >= 1) {
          hcapCaption = "▲ TRENDING UP";
          hcapColor = "var(--cb-mute)";
        } else {
          hcapCaption = "● STEADY";
        }
      } else if (handicap != null) {
        hcapCaption = "OFFICIAL";
        hcapColor = "var(--cb-moss, #4ea669)";
      } else if (myRounds.length) {
        hcapCaption = "PROVISIONAL";
      }

      // BEST caption — course of personal best
      if (bestRoundId) {
        var br = myRounds.find(function(r) { return r.id === bestRoundId; });
        if (br && br.course) {
          // Use shortened course name if available
          var cname = String(br.course).replace(/\s+golf\s+(&\s+)?country\s+club\s*$/i, "")
                                       .replace(/\s+golf\s+club\s*$/i, "")
                                       .replace(/\s+golf\s+links\s*$/i, "")
                                       .replace(/\s+golf\s+(course|resort)\s*$/i, "")
                                       .trim().toUpperCase();
          bestCaption = cname.length > 16 ? cname.slice(0, 15) + "…" : cname;
        }
      }
    } catch (e) { /* defensive — fall back to empty captions */ }
  }

  var h = '<div style="padding:22px;display:grid;grid-template-columns:repeat(3, 1fr);gap:10px">';

  // ROUNDS
  var roundsClickable = !isNew && totalRounds > 0;
  h += '<div' + (roundsClickable ? ' class="tappable" onclick="Router.go(\'roundhistory\')"' : '') + ' style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px;' + (roundsClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">ROUNDS</div>';
  h += '<div data-stat="round-count" data-count="' + roundsStr + '" style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + roundsStr + '</div>';
  if (roundsCaption) h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:600;letter-spacing:0.8px;color:' + roundsColor + ';text-transform:uppercase;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + roundsCaption + '</div>';
  h += '</div>';

  // HCP
  h += '<div style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">HCP</div>';
  h += '<div data-stat="handicap" style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + hcapStr + '</div>';
  if (hcapCaption) h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:600;letter-spacing:0.8px;color:' + hcapColor + ';text-transform:uppercase;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + hcapCaption + '</div>';
  h += '</div>';

  // BEST
  var bestClickable = !!bestRoundId;
  h += '<div' + (bestClickable ? ' class="tappable" onclick="Router.go(\'rounds\',{roundId:\'' + escHtml(bestRoundId) + '\'})"' : '') + ' style="padding:var(--sp-3) 10px;background:var(--cb-chalk-2);border-radius:10px;' + (bestClickable ? 'cursor:pointer' : '') + '">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">BEST</div>';
  h += '<div data-stat="best-round" style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--cb-ink);line-height:1">' + bestStr + '</div>';
  if (bestCaption) h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:600;letter-spacing:0.8px;color:' + bestColor + ';text-transform:uppercase;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + bestCaption + '</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

function _generatePulses(profile, myRounds, myLevel, season) {
  var pulses = [];

  // Near level-up (≤ 200 XP to next).
  // v8.22+ (design-pass 2026-05-22): widened to ≤ 500 XP so the progress bar
  // shows for more members; progress field carries the % toward next level
  // so _renderPulses can draw a brass bar (peer-anchor: Linear / Vercel
  // always pair a numeric callout with a visual indicator).
  if (myLevel && myLevel.level > 1 && (myLevel.nextLevelXp - myLevel.xp) <= 500 && (myLevel.nextLevelXp - myLevel.xp) > 0) {
    var xpToNext = myLevel.nextLevelXp - myLevel.xp;
    var levelSpan = myLevel.nextLevelXp - (myLevel.currentLevelXp || 0);
    var progressedInLevel = levelSpan > 0 ? (myLevel.xp - (myLevel.currentLevelXp || 0)) : 0;
    var pct = levelSpan > 0 ? Math.max(0, Math.min(100, Math.round(100 * progressedInLevel / levelSpan))) : 0;
    pulses.push({
      eyebrow: "NEXT LEVEL",
      text: xpToNext + " XP to Level " + (myLevel.level + 1) + ".",
      progress: pct
    });
  }

  // 1-2 rounds: encourage handicap threshold
  if (myRounds && myRounds.length > 0 && myRounds.length < 3) {
    var n = 3 - myRounds.length;
    pulses.push({
      eyebrow: "HANDICAP",
      text: n + " more round" + (n === 1 ? "" : "s") + " until your handicap is official."
    });
  }

  // Season gap — only if under ~80 pts (reachable)
  if (season && season.standings && season.standings.length > 0) {
    var uid = currentUser ? currentUser.uid : null;
    var claimedFrom = profile ? profile.claimedFrom : null;
    var myStanding = season.standings.find(function(s) { return s.id === uid || s.id === claimedFrom; });
    if (myStanding) {
      var idx = season.standings.indexOf(myStanding);
      if (idx > 0) {
        var ahead = season.standings[idx - 1];
        var gap = ahead.points - myStanding.points;
        if (gap > 0 && gap <= 80) {
          pulses.push({
            eyebrow: "SEASON",
            text: gap + " point" + (gap === 1 ? "" : "s") + " behind " + (ahead.name || ahead.username || "them") + "."
          });
        }
      }
    }
  }

  return pulses.slice(0, 2);
}

