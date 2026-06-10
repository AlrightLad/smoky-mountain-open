var liveChat = [];

// ========== MORE PAGE — Grouped sections + What's New ==========
Router.register("more", function() {
  var h = '<div class="sh"><h2>More</h2></div>';

  // What's New callout
  h += '<div style="margin:0 16px 12px;cursor:pointer" onclick="Router.go(\'caddynotes\')">';
  h += '<div style="background:linear-gradient(135deg,rgba(var(--gold-rgb),.08),rgba(var(--birdie-rgb),.04));border:1px solid rgba(var(--gold-rgb),.15);border-radius:var(--radius-lg);padding:12px 16px;display:flex;align-items:center;gap:12px">';
  h += '<div style="width:36px;height:36px;border-radius:10px;background:rgba(var(--gold-rgb),.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
  h += '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--gold)">What\'s New in v' + APP_VERSION + '</div>';
  h += '<div style="font-size:10px;color:var(--muted);margin-top:1px">The latest improvements, in plain language</div></div>';
  h += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
  h += '</div></div>';

  // ── Section renderer ──
  function section(title, items) {
    var sh = '<div style="padding:0 16px 12px">';
    sh += '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:6px;padding-left:2px">' + title + '</div>';
    items.forEach(function(l, i) {
      var isLast = i === items.length - 1;
      var borderStyle = l.accent ? 'border:1px solid rgba(var(--gold-rgb),.2);background:linear-gradient(135deg,rgba(var(--gold-rgb),.04),transparent)' : 'border:1px solid var(--border);background:var(--card)';
      var radius = items.length === 1 ? 'var(--radius-lg)' : i === 0 ? 'var(--radius-lg) var(--radius-lg) 0 0' : isLast ? '0 0 var(--radius-lg) var(--radius-lg)' : '0';
      sh += '<div style="cursor:pointer;border-radius:' + radius + ';overflow:hidden;' + borderStyle + ';' + (isLast ? '' : 'border-bottom:none;') + '-webkit-tap-highlight-color:transparent" onclick="Router.go(\'' + l.page + '\')">';
      sh += '<div style="padding:14px 16px;display:flex;align-items:center;gap:14px">';
      sh += '<div style="width:36px;height:36px;border-radius:10px;background:' + (l.accent ? 'rgba(var(--gold-rgb),.1)' : 'var(--bg3)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' + l.icon + '</div>';
      sh += '<div style="flex:1"><div style="font-size:14px;font-weight:600;color:' + (l.accent ? 'var(--gold)' : 'var(--cream)') + '">' + l.label + '</div>';
      if (l.sub) sh += '<div style="font-size:10px;color:var(--muted);margin-top:1px">' + l.sub + '</div>';
      sh += '</div>';
      sh += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--muted2)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
      sh += '</div></div>';
    });
    sh += '</div>';
    return sh;
  }

  // ── ParCoin Economy ──
  h += section("ParCoin Economy", [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8.5 8.5h5a2.5 2.5 0 010 5H8.5"/></svg>', label:"Cosmetics Shop", sub:"Rings, banners, cards, names, titles", page:"shop", accent:true},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>', label:"Rich List & Power-Ups", sub:"Top earners, Double XP, Handicap Shield", page:"richlist", accent:true}
  ]);

  // ── Competition ──
  h += section("Competition", [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', label:"Wagers", sub:"Head-to-head coin bets", page:"wagers"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>', label:"Bounty Board", sub:"Post and claim coin bounties", page:"bounties"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', label:"Challenges", sub:"H2H matches and rivalries", page:"challenges"}
  ]);

  // ── The Season ── (v8.24.13 — baseline IA fix: Standings, Feed, Records,
  // Trophy Room, Awards, Season Recap, and Aces were unreachable from mobile
  // nav; the onboarding tour even points new members at Standings.)
  h += section("The Season", [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20h4V10H4zM10 20h4V4h-4zM16 20h4v-7h-4z"/></svg>', label:"Standings", sub:"The season ladder", page:"standings"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1h2a2 2 0 012 2v9a2 2 0 01-2 2zM7 8h6M7 12h8M7 16h5"/></svg>', label:"The Feed", sub:"The club's front page", page:"feed"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15zM4 19.5A2.5 2.5 0 006.5 22H20v-5"/></svg>', label:"Records", sub:"The club record book", page:"records"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0zM7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3"/></svg>', label:"Trophy Room", sub:"Crowns, plaques, the Roll of Honor", page:"trophyroom"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="9" r="6"/><path d="M9 14l-1.5 7L12 18.5 16.5 21 15 14"/></svg>', label:"Awards Night", sub:"Season superlatives", page:"awards"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18M12 15l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 17h2z"/></svg>', label:"Season Recap", sub:"The year in review", page:"seasonrecap"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>', label:"Aces", sub:"The hole-in-one wall", page:"aces"}
  ]);

  // ── Community ──
  var _myLeagueCount = currentProfile && currentProfile.leagues ? currentProfile.leagues.length : 1;
  h += section("Community", [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M4 15l8-12 8 12"/><path d="M12 3v12"/></svg>', label:"My Leagues", sub:_myLeagueCount + " league" + (_myLeagueCount !== 1 ? "s" : "") + " \u00b7 Create or join", page:"leagues", accent:true},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>', label:"Find Players", sub:"Search by name, handicap, location", page:"findplayers"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 20h5v-2a3 3 0 00-4-4H6a3 3 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', label:"Members", sub:PB.getPlayers().length + " Parbaughs", page:"members"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="8" r="5"/><circle cx="18" cy="8" r="5"/><path d="M3 20c0-4.4 3.6-8 8-8h6c4.4 0 8 3.6 8 8"/></svg>', label:"Scramble Teams", sub:"2v2, 3v3, 4v4 W-L records", page:"scramble"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', label:"Tee Times", sub:"Post and RSVP", page:"teetimes"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>', label:"Clubhouse Chat", sub:"Trash talk central", page:"chat"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="10"/></svg>', label:"Drills Library", sub:"Practice drills for every skill", page:"drills"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/></svg>', label:"Party Games", sub:"Clubhouse games for the group", page:"partygames"}
  ]);

  // ── Info ──
  h += section("Info", [
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', label:"League Rules", page:"rules"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>', label:"FAQ", page:"faq"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>', label:"The Caddy Notes", sub:"Changelog and updates", page:"caddynotes"},
    {icon:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>', label:"Report a Bug", sub:"Send a note to the Commissioner", page:"bugreport"}
  ]);

  h += renderPageFooter();
  document.querySelector('[data-page="more"]').innerHTML = h;
});

// ========== COMBINED FEED ==========
