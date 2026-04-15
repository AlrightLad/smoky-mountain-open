// ========== THE CADDY NOTES ==========
Router.register("caddynotes", function() {
  var h = '<div class="sh"><h2>The Caddy Notes</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gold)"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold)">The Caddy Notes</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">What\'s new, what\'s fixed, and what\'s coming</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:6px;font-weight:600">v5.34.7</div></div>';

  // Current Release
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--birdie)">What\'s New · v5.34.7</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">April 2026 · FAQ Rebuild, Onboarding Upgrade, UI Polish, Texture Fix</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    {item: "FAQ completely rewritten — 28 questions across 7 categories covering every feature with navigation directions", tag: "NEW"},
    {item: "Onboarding upgraded to 5 screens: Welcome, Logging Rounds, Seasons & Events, ParCoins, and Your Legacy", tag: "IMPROVED"},
    {item: "Theme textures NOW actually loading — root cause was Vite stripping body::before CSS rules", tag: "FIXED"},
    {item: "More page reorganized — Shop and Rich List at top with gold accent styling", tag: "IMPROVED"},
    {item: "Beat Their Score wager — bet you can beat a friend\'s best score at a course", tag: "NEW"},
    {item: "Shareable scorecards render in your active theme colors", tag: "NEW"},
    {item: "13 new cosmetic items — 28 total in the shop", tag: "NEW"},
    {item: "Bottom nav, calendar dates, profile level, and component border-radius all polished", tag: "FIXED"},
    {item: "Textures FIXED — abandoned CSS pseudo-elements entirely. Now uses a real #textureOverlay div controlled by JavaScript. No more CSS clipping, no more Vite stripping, no more browser quirks.", tag: "FIXED"},
    {item: "Caddy/system messages in feed now show full text with green accent — no more truncation", tag: "FIXED"}
  ];
  currentNotes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
    h += '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:8px;font-weight:700;color:' + tagColor + ';background:' + tagColor + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>';
    h += '<span>' + r.item + '</span></div>';
  });
  h += '</div></div></div>';

  // Previous release
  h += '<div class="section"><div class="sec-head"><span class="sec-title">v5.33.0 · April 2026 · Social Actions, Bounties, Rich List</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var prevNotes = [
    {item: "Trash Talk — Spotlight of Shame, Victory Lap, Demand a Rematch on any profile", tag: "NEW"},
    {item: "Bounty Board — post coin bounties on scores or birdies, auto-claims on qualifying rounds", tag: "NEW"},
    {item: "Rich List — top 10 lifetime coin holders with Gold Member badge", tag: "NEW"},
    {item: "Power-Ups — Double XP Round and Handicap Shield", tag: "NEW"},
    {item: "Sponsor a Hole and Name a Tournament status purchases", tag: "NEW"},
    {item: "Wager Matches with 6 types including Nassau and Beat Their Score", tag: "NEW"},
    {item: "Formal seasons (Spring/Summer/Fall) with tab selector", tag: "NEW"},
    {item: "Activity feed filtering (All/Rounds/Chat/Range)", tag: "NEW"}
  ];
  prevNotes.forEach(function(r) {
    var tagColor = r.tag === "NEW" ? "var(--birdie)" : r.tag === "FIXED" ? "var(--gold)" : r.tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
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
    "Live hole-by-hole scoring (Play Now) with FIR, GIR, putts",
    "Parbaugh Round — real-time shared scorecard",
    "ParCoins in-game currency with 9 earning triggers",
    "Cosmetics Shop — 28 items (borders, banners, card themes)",
    "Wager Matches — 6 types including Nassau and Beat Their Score",
    "Bounty Board — coin bounties on scores and birdies",
    "Trash Talk — Spotlight of Shame, Victory Lap, Demand a Rematch",
    "Rich List, Power-Ups, Sponsor a Hole, Name a Tournament",
    "3 formal seasons per year (Spring, Summer, Fall) with awards",
    "Trophy Room — 50+ achievements, XP levels, titles",
    "8 premium themes with background textures and blend modes",
    "Champion Red theme unlocked by winning an event",
    "GHIN World Handicap System calculation",
    "Activity feed with filtering (All/Rounds/Chat/Range)",
    "Clubhouse — group chat with likes, comments, replies",
    "Direct messages between members",
    "Tee time posting with RSVP",
    "Full calendar with event dots and scheduling",
    "30,000+ course search via GolfCourseAPI",
    "Range session timer with drill tracking",
    "Scramble team management with W-L records",
    "Shareable scorecard images in your active theme",
    "Push notifications (FCM)",
    "PWA — installable to home screen",
    "First-time onboarding with profile setup wizard",
    "Commissioner admin panel",
    "Score attestation system for events",
    "Season recap and yearly awards ceremony",
    "Party games linked to active rounds",
    "Pull-to-refresh, skeleton loading, number animations"
  ];
  features.forEach(function(f) {
    h += '<div style="padding:2px 0;display:flex;gap:8px;align-items:flex-start"><span style="color:var(--gold);flex-shrink:0;margin-top:4px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg></span><span>' + f + '</span></div>';
  });
  h += '</div></div></div>';

  // On the Range — Coming Soon
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--muted)">On the Range — Coming Soon</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--muted);line-height:1.8">';
  var upcoming = [
    "AI Caddie Insights — post-round analysis and practice plans",
    "Swing Analysis — video upload with AI feedback",
    "Course GPS & Yardages — front, middle, back of green",
    "Apple Watch Companion — score entry from your wrist",
    "Multi-League Support — create and manage your own league",
    "Public Profiles — opt-in shareable profile links",
    "Season Pass Cosmetics — limited edition items each season",
    "Prediction Markets — bet on event outcomes",
    "Native Mobile App — iOS and Android"
  ];
  upcoming.forEach(function(u) {
    h += '<div style="padding:2px 0;display:flex;gap:8px;align-items:flex-start"><span style="color:var(--muted2);flex-shrink:0;margin-top:4px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/></svg></span><span>' + u + '</span></div>';
  });
  h += '</div></div></div>';

  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Built by The Commissioner · v5.34.7</div>';

  document.querySelector('[data-page="caddynotes"]').innerHTML = h;
});
