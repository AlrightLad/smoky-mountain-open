// ========== THE CADDY NOTES ==========
Router.register("caddynotes", function() {
  var h = '<div class="sh"><h2>The Caddy Notes</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gold)"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold)">The Caddy Notes</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">What\'s new, what\'s fixed, and what\'s coming</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:6px;font-weight:600">v5.24.1</div></div>';

  // Current Release
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--birdie)">What\'s New · v5.24.1</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">April 2026 · 7 Bug Fixes, Architecture Upgrade, Theme Textures</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    {item: "All 8 premium theme textures now active — subtle background patterns on every page, hero sections, and event cards", tag: "NEW"},
    {item: "App rebuilt with modern build system — faster loads, better caching, ready for future features", tag: "IMPROVED"},
    {item: "Each page is now its own module — faster development, quicker updates, fewer bugs", tag: "IMPROVED"},
    {item: "Course directory now shows true average scores instead of personal bests", tag: "FIXED"},
    {item: "Events now show as Happening Now in the calendar even without an end date", tag: "FIXED"},
    {item: "Lock Scores button on event scorecards now responds reliably on iPhone", tag: "FIXED"},
    {item: "Courses button added to Season Standings for quick navigation", tag: "NEW"},
    {item: "Player profile Courses Played section now open by default — see best rounds instantly", tag: "FIXED"},
    {item: "Login screen loads 127KB faster — removed embedded image data", tag: "IMPROVED"},
    {item: "Parbaugh Round now shows all joined players on the live scorecard, not just the host", tag: "FIXED"}
  ];
  currentNotes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // v5.22.0
  h += '<div class="section"><div class="sec-head"><span class="sec-title">v5.22.0 · April 2026 · Component Polish, Masters Scorecard, Animations</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var v522Notes = [
    {item: "Card depth system — micro-shadows on all cards using elevation tokens", tag: "NEW"},
    {item: "Masters scorecard — Augusta National on-course scoreboard styling", tag: "NEW"},
    {item: "Status pill components — Live, Final, Personal Best, New, Hot", tag: "NEW"},
    {item: "Page entrance animations — smooth fade and slide-up on every navigation", tag: "NEW"},
    {item: "Number count-up animations on stats", tag: "NEW"},
    {item: "Bottom nav ink ripple, toast backdrop blur, improved skeleton shimmer", tag: "IMPROVED"}
  ];
  v522Notes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // v5.21.0
  h += '<div class="section"><div class="sec-head"><span class="sec-title">v5.21.0 · April 2026 · Design Tokens, 6 Themes, Color Cleanup</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var v521Notes = [
    {item: "Complete design token system with RGB channels, spacing, typography, elevation, and radius scales", tag: "NEW"},
    {item: "Six themes — Classic, Camo/Malbon, Masters, USGA, Dark Mode, Light Mode", tag: "NEW"},
    {item: "Theme picker in Settings with Firestore cross-device sync", tag: "NEW"},
    {item: "400+ hardcoded colors converted to CSS variables", tag: "IMPROVED"},
    {item: "Canvas share cards use CSS variable resolver for theme awareness", tag: "IMPROVED"},
    {item: "Touch targets expanded to 44px minimum across interactive elements", tag: "IMPROVED"}
  ];
  v521Notes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // v5.20.0
  h += '<div class="section"><div class="sec-head"><span class="sec-title">v5.20.0 · April 2026 · Firestore-First Migration, Security, Error Logging</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var v520Notes = [
    {item: "Firestore-first data layer — getPlayer() and getPlayers() now read from Firestore as primary source", tag: "NEW"},
    {item: "Player identification broadened — members registered via invite can now Play Now and Log Rounds", tag: "FIXED"},
    {item: "Email verification sent on registration", tag: "NEW"},
    {item: "Global error logging — uncaught errors logged to Firestore with user context", tag: "NEW"},
    {item: "Error log viewer in Admin Panel", tag: "NEW"}
  ];
  v520Notes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // v5.15.x
  h += '<div class="section"><div class="sec-head"><span class="sec-title">v5.15.x · April 2026 · Event Close, Data Integrity, Members Redesign</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var prevNotes = [
    {item: "Close Event system — crown champion, post standings, lock scoring", tag: "NEW"},
    {item: "Scramble team matches (2v2, 3v3, 4v4) with W-L tracking", tag: "NEW"},
    {item: "Members page: search, sort, founders pinned with gold star", tag: "NEW"},
    {item: "Attestation ID resolution, FIR/GIR copy to round docs, scramble isolation across all stats", tag: "FIXED"}
  ];
  prevNotes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : r.tag === "AUDIT" ? "var(--red)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // What's in the Bag — full feature list
  h += '<div class="section"><div class="sec-head"><span class="sec-title">What\'s in the Bag</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var features = [
    "Invite-only membership with invite codes",
    "Live hole-by-hole scoring (Play Now)",
    "Parbaugh Round — real-time shared scorecard",
    "Activity tab — Rounds and Range views with toggle",
    "Range Session timer with drill tracking and XP",
    "15 stock drills + custom drill creation",
    "Practice Insights with distribution analysis",
    "Public/Private visibility for sessions and tee times",
    "Clubhouse — calendar, chat, and scheduling in one tab",
    "Live Spotlight — see active rounds on the home page",
    "130+ achievements across 10 categories including Range Practice",
    "Trophy Room with XP, levels, titles, and badge customization",
    "Achievement earned-at dates with retroactive inference",
    "Profile completion achievements and reminders",
    "Season standings with handicap-adjusted points",
    "GHIN World Handicap System handicap calculation",
    "8 game formats: Stroke, Stableford, Scramble, Best Ball, Match, Skins, Shamble, Chapman",
    "10 party games linked to your active round",
    "Trash talk feed with likes, comments, replies, and timestamps",
    "Comment likes and @mention replies",
    "Direct messages between members",
    "Tee time posting with RSVP, visibility, and notifications",
    "Full calendar with Select Range toggle and per-day course display",
    "200+ course database across PA, VA, MD, NC",
    "Photo uploads synced across all devices",
    "Notification bell with deep linking",
    "Who's Online with live round broadcasting",
    "Commissioner admin panel",
    "Scorekeeper assignment per course with permission tiers",
    "Score locking and unlocking by Commissioner",
    "Full-screen course search overlay with instant results",
    "GolfCourseAPI integration — search 30,000+ courses worldwide",
    "Course detail pages with all tees and hole-by-hole scorecards",
    "Share card — branded scorecard on every completed round",
    "Courses sync across all devices automatically",
    "Scramble team management with captain, top scores, and team stats",
    "Ace wall",
    "Season recap and yearly awards ceremony",
    "Pull-to-refresh (smart — doesn't trigger in scrollable containers)",
    "All SVG icons — no emojis, consistent brand aesthetic",
    "Desktop and mobile responsive design",
    "Feature request system",
    "Share round card after completing a round"
  ];
  features.forEach(function(f) {
    h += '<div style="padding:3px 0;display:flex;gap:8px"><span style="color:var(--gold)"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg></span> ' + f + '</div>';
  });
  h += '</div></div></div>';

  // Coming soon
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--muted)">On the Range — Coming Soon</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--muted);line-height:1.8">';
  var upcoming = [
    "Custom badge image gallery",
    "Cosmetic avatar borders and banners",
    "PWA install — add to home screen like a native app",
    "Push notifications to locked screen",
    "AI-powered tournament generator",
    "Merch store integration",
    "SMS/phone number authentication"
  ];
  upcoming.forEach(function(u) {
    h += '<div style="padding:3px 0;display:flex;gap:8px"><span style="color:var(--muted2)"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/></svg></span> ' + u + '</div>';
  });
  h += '</div></div></div>';

  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Built by The Commissioner · v5.22.2</div>';

  document.querySelector('[data-page="caddynotes"]').innerHTML = h;
});
