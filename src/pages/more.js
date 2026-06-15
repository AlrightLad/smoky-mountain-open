var liveChat = [];

// ========== MORE PAGE — Grouped sections + What's New ==========
// Visual polish (task #33): every icon shares one grammar (24 grid, 1.5
// stroke, 20px box, round caps, currentColor — the tile wrapper sets color so
// accent rows and dark themes re-theme for free). Legacy --gold/--card tokens
// replaced with Clubhouse tokens; groups are single paper cards with
// --cb-mute-3 hairlines; eyebrows are mono 9px letterspaced brass.
Router.register("more", function() {
  // #41 v8.25.146 — editorial masthead (was the legacy .sh header) so the hub
  // carries the same record-book identity as every other page.
  var h = '<div class="roster-masthead" style="padding-bottom:8px"><div class="roster-eyebrow">Parbaughs · The Clubhouse</div><h1 class="roster-headline">More.</h1></div>';

  // One SVG builder so the grammar can never drift per-icon.
  function icn(paths) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  function chev(color) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:' + color + ';flex-shrink:0" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  }

  // What's New callout — felt card, same 10px radius + 13px rhythm as the
  // groups below (was a gold-gradient one-off).
  h += '<div role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')Router.go(\'caddynotes\')" onclick="Router.go(\'caddynotes\')" style="margin:0 16px 13px;cursor:pointer;-webkit-tap-highlight-color:transparent">';
  h += '<div style="background:var(--cb-felt);border-radius:10px;padding:13px 14px;display:flex;align-items:center;gap:13px">';
  h += '<div style="width:36px;height:36px;border-radius:10px;background:rgba(var(--cb-chalk-rgb) / .08);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--cb-brass-3)">' + icn('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>') + '</div>';
  h += '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;color:var(--cb-chalk)">What\'s New in v' + APP_VERSION + '</div>';
  h += '<div style="font-size:11px;color:var(--cb-mute-3);margin-top:1px">The latest improvements, in plain language</div></div>';
  h += chev('var(--cb-brass-3)');
  h += '</div></div>';

  // ── Section renderer ── one paper card per group (10px radius, --cb-mute-3
  // hairline border + row separators), mono brass eyebrow, 13px gap between
  // sections. Rows stay above the 44pt floor: 13px pad x2 + 36px tile = 62px.
  function section(title, items, focal) {
    // v8.25.226 — cohesion + ONE intentional focal peak (Founder 2026-06-15: first
    // "theme not cohesive · gold line on some rows not others" → removed the random
    // per-row brass left-bars; then "the shop + special buttons are gone and bland"
    // → restore a SINGLE deliberate felt-hero section [Play & Compete, led by the
    // Shop] so the economy stands out, while every OTHER group stays uniform
    // pressed-paper. Cohesive (no random lines) AND the shop is enticing again. Rows
    // are still identical within a section — the focal treatment is the whole CARD,
    // not smuggled per-row accents.
    var isFelt = focal === 'felt';
    var sh = '<div style="padding:0 16px;margin-bottom:13px">';
    sh += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + (isFelt ? 'var(--cb-brass-3)' : 'var(--cb-brass)') + ';margin-bottom:6px;padding-left:2px">' + title + '</div>';
    sh += '<div class="pb-card more-group' + (isFelt ? ' pb-card--felt' : '') + '" style="overflow:hidden">';
    var tileBg = isFelt ? 'rgba(var(--cb-chalk-rgb) / .10)' : 'var(--cb-chalk-2)';
    var tileFg = isFelt ? 'var(--cb-brass-3)' : 'var(--cb-ink-2)';
    var labelFg = isFelt ? 'var(--cb-chalk)' : 'var(--cb-ink)';
    var subFg = isFelt ? 'var(--cb-mute-3)' : 'var(--cb-mute)';
    var sepC = isFelt ? 'rgba(var(--cb-chalk-rgb) / .12)' : 'var(--cb-mute-3)';
    items.forEach(function(l, i) {
      var sep = i > 0 ? 'border-top:1px solid ' + sepC + ';' : '';
      sh += '<div role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')Router.go(\'' + l.page + '\')" onclick="Router.go(\'' + l.page + '\')" style="cursor:pointer;' + sep + '-webkit-tap-highlight-color:transparent">';
      sh += '<div style="padding:13px 14px;display:flex;align-items:center;gap:13px">';
      sh += '<div style="width:36px;height:36px;border-radius:10px;background:' + tileBg + ';color:' + tileFg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' + l.icon + '</div>';
      sh += '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:' + labelFg + '">' + l.label + '</div>';
      if (l.sub) sh += '<div style="font-size:11px;color:' + subFg + ';margin-top:1px">' + l.sub + '</div>';
      sh += '</div>';
      sh += chev(isFelt ? 'var(--cb-brass-3)' : 'var(--cb-mute-2)');
      sh += '</div></div>';
    });
    sh += '</div></div>';
    return sh;
  }

  // ── Play & Compete ── (v8.25.217 — Founder "More: too many sections": merged
  // the old "ParCoin Economy" + "Competition" into one group. The coin economy and
  // the head-to-head wagering ARE one loop — keeps every destination, one fewer
  // section to scan. Felt material (the premium economy treatment).
  h += section("Play & Compete", [
    {icon:icn('<circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M8.5 8.5h5a2.5 2.5 0 010 5H8.5"/>'), label:"Cosmetics Shop", sub:"Rings, banners, cards, names, titles", page:"shop", accent:true},
    {icon:icn('<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>'), label:"Rich List & Power-Ups", sub:"Top earners, Double XP, Handicap Shield", page:"richlist", accent:true},
    {icon:icn('<path d="M13 10V3L4 14h7v7l9-11h-7z"/>'), label:"Wagers", sub:"Head-to-head coin bets", page:"wagers"},
    {icon:icn('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'), label:"Bounty Board", sub:"Post and claim coin bounties", page:"bounties"},
    {icon:icn('<path d="M4 21h16"/><path d="M6.5 21L12.5 4"/><path d="M12.5 4l4.2 1.4-4.2 1.4"/><path d="M17.5 21L11.5 4"/><path d="M11.5 4L7.3 5.4l4.2 1.4"/>'), label:"Challenges", sub:"H2H matches and rivalries", page:"challenges"}
  ], 'felt');

  // ── The Season ── (v8.24.13 — baseline IA fix: Standings, Feed, Records,
  // Trophy Room, Awards, Season Recap, and Aces were unreachable from mobile
  // nav; the onboarding tour even points new members at Standings.)
  h += section("The Season", [
    {icon:icn('<path d="M6 20v-6"/><path d="M12 20V4"/><path d="M18 20V10"/>'), label:"Standings", sub:"The season ladder", page:"standings"},
    {icon:icn('<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1h2a2 2 0 012 2v9a2 2 0 01-2 2z"/><path d="M7 8h6"/><path d="M7 12h8"/><path d="M7 16h5"/>'), label:"The Feed", sub:"The club's front page", page:"feed"},
    {icon:icn('<path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5"/>'), label:"Records", sub:"The club record book", page:"records"},
    {icon:icn('<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 01-10 0z"/><path d="M7 5H4v2a3 3 0 003 3"/><path d="M17 5h3v2a3 3 0 01-3 3"/>'), label:"Trophy Room", sub:"Crowns, plaques, the Roll of Honor", page:"trophyroom"},
    {icon:icn('<circle cx="12" cy="9" r="6"/><path d="M9 14l-1.5 7L12 18.5 16.5 21 15 14"/>'), label:"Awards Night", sub:"Season superlatives", page:"awards"},
    {icon:icn('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3 11h18"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>'), label:"Season Recap", sub:"The year in review", page:"seasonrecap"},
    {icon:icn('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/>'), label:"Aces", sub:"The hole-in-one wall", page:"aces"}
  ]);

  // ── Community ──
  var _myLeagueCount = currentProfile && currentProfile.leagues ? currentProfile.leagues.length : 1;
  h += section("Community", [
    {icon:icn('<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>'), label:"Invite a Friend", sub:"Bring someone into the club", page:"invite", accent:true},
    {icon:icn('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'), label:"My Leagues", sub:_myLeagueCount + " league" + (_myLeagueCount !== 1 ? "s" : "") + " · Create or join", page:"leagues", accent:true},
    {icon:icn('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'), label:"Find Players", sub:"Search by name, handicap, location", page:"findplayers"},
    {icon:icn('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'), label:"Members", sub:PB.getPlayers().length + " Parbaughs", page:"members"},
    {icon:icn('<circle cx="9" cy="9" r="4"/><circle cx="15" cy="9" r="4"/><path d="M4 20c0-2.8 2.2-5 5-5h6c2.8 0 5 2.2 5 5"/>'), label:"Scramble Teams", sub:"2v2, 3v3, 4v4 W-L records", page:"scramble"},
    {icon:icn('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'), label:"Tee Times", sub:"Post and RSVP", page:"teetimes"},
    {icon:icn('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'), label:"Clubhouse Chat", sub:"Trash talk central", page:"chat"},
    {icon:icn('<path d="M6.5 10.5h11l-1.3 9.5H7.8z"/><circle cx="9.5" cy="8.4" r="1.3"/><circle cx="12" cy="7.4" r="1.3"/><circle cx="14.5" cy="8.4" r="1.3"/>'), label:"Drills Library", sub:"Practice drills for every skill", page:"drills"},
    {icon:icn('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>'), label:"Party Games", sub:"Clubhouse games for the group", page:"partygames"}
  ]);

  // ── Info ──
  h += section("Info", [
    {icon:icn('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'), label:"League Rules", sub:"How the league works", page:"rules"},
    {icon:icn('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'), label:"FAQ", sub:"Common questions, answered", page:"faq"},
    {icon:icn('<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'), label:"The Caddy Notes", sub:"Changelog and updates", page:"caddynotes"},
    {icon:icn('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'), label:"Report a Bug", sub:"Send a note to the Commissioner", page:"bugreport"}
  ]);

  h += renderPageFooter();
  document.querySelector('[data-page="more"]').innerHTML = h;
});

// ========== COMBINED FEED ==========
