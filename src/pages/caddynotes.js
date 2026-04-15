// ========== THE CADDY NOTES ==========
Router.register("caddynotes", function() {
  var h = '<div class="sh"><h2>The Caddy Notes</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gold)"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold)">The Caddy Notes</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">What\'s new, what\'s fixed, and what\'s coming</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:6px;font-weight:600">v5.33.1</div></div>';

  // Current Release
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--birdie)">What\'s New · v5.33.1</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">April 2026 · 11 Bug Fixes, Beat Their Score Wager, Scorecard Theming</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    {item: "Theme textures now display on all 8 themes — subtle patterns on every page", tag: "FIXED"},
    {item: "Bottom nav bar no longer cut off on iPhone — proper safe area padding", tag: "FIXED"},
    {item: "Activity feed shows full event messages — no more cutoff text", tag: "FIXED"},
    {item: "Calendar dates all display at uniform size — days 1-4 no longer oversized", tag: "FIXED"},
    {item: "Best score on home page is now tappable — takes you to that round", tag: "FIXED"},
    {item: "Beat Their Score wager — bet you can beat a friend\'s best at a specific course", tag: "NEW"},
    {item: "Shareable scorecards now render in your active theme colors", tag: "NEW"},
    {item: "Course directory shows best scores (not averages) with clean formatting", tag: "FIXED"},
    {item: "13 new cosmetic items in the shop — 28 total across borders, banners, and card themes", tag: "NEW"},
    {item: "Scramble team rounds now display correctly even when stored under different player IDs", tag: "FIXED"},
    {item: "Trash Talk, Bounty Board, Rich List, Power-Ups, and more from recent updates", tag: "IMPROVED"}
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

  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Built by The Commissioner · v5.33.1</div>';

  document.querySelector('[data-page="caddynotes"]').innerHTML = h;
});
