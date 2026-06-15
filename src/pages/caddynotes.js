// ========== THE CADDY NOTES ==========
Router.register("caddynotes", function() {
  var h = '<div class="sh"><h2>The Caddy Notes</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gold)"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">The Caddy Notes</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">What\'s new, what\'s fixed, and what\'s coming</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:6px;font-weight:600">v' + APP_VERSION + '</div></div>';

  function tagColorFor(tag) {
    return tag === "NEW" ? "var(--birdie)" : tag === "FEATURE" ? "var(--birdie)" : tag === "FIXED" ? "var(--gold)" : tag === "IMPROVED" ? "var(--blue)" : tag === "INFRA" ? "var(--cb-mute)" : "var(--muted)";
  }
  function renderEntry(r) {
    var tc = tagColorFor(r.tag);
    return '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">' +
      '<span style="font-size:8px;font-weight:700;color:' + tc + ';background:' + tc + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>' +
      '<span>' + r.item + '</span></div>';
  }

  // Current Release
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--birdie)">What\'s New · v' + APP_VERSION + '</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">June 2026 · The polish pass</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    { item: "Wear what you've earned. The Champion's Cabinet pieces — the Green Jacket, the Ace Marker, and the Champion, Hole-in-One, and Eagle frames — now light up the moment you've actually earned them on the course. Win a season, card an eagle, or drop a hole-in-one and the piece flips from \"earned on the course\" to a one-tap Equip, with a \"try it on\" preview first. No more honors you've earned sitting locked behind glass.", tag: "NEW" },
    { item: "Dress up your avatar. The Pro Shop now leads with hand-drawn decoration frames that wrap your profile photo — a caddy waving you onto the first tee, a hole-in-one confetti burst, the Champion's claret jug, spring azaleas, a winter frost, an eagle, roses, and autumn leaves. Some you buy, some you earn on the course (card an eagle, win a season). Tap \"try it on\" before you spend, and your unlocked collection shows on your profile.", tag: "NEW" },
    { item: "Your caddies came to life. The four caddies in the bag now have hand-drawn cartoon portraits that gently breathe at rest and perk up when you point at them — meet them in Settings → Display or on the Pro Shop's Caddies shelf. Leading the bag is Murphy, your steady default guide, with a warmer new look.", tag: "NEW" },
    { item: "A crest of our own. The Parbaughs now wears its own mark — a serif P with a white rose climbing through it — and you'll spot it across the club: the sign-in coaster, the reading-room rail, your shared cards, and the icon on your home screen. It quietly takes on the colors of whichever Clubhouse look you're wearing. And the Pro Shop now previews our first Tour Collection — shot out on a links course the way it's meant to be worn, in the colors the pros compete in: a tournament-white Pro Shirt, a tour-navy Fairway Quarter-Zip, the Clubhouse Hoodie and more. Coming soon.", tag: "NEW" },
    { item: "Distance to the green, right in your round. While you're playing, tap \"Distance to green\" and the app reads your GPS once to show the yardage to the front, center, and back — the classic rangefinder read. The first time a hole's green hasn't been mapped yet, anyone can stand on it and tap \"Set the green\" (front edge, then back edge) — and from then on the whole league sees the distance. Your location is only ever read in that moment to do the math; it's never stored or tracked.", tag: "NEW" },
    { item: "New on the Pro Shop shelves. Five proper pieces just landed — a hard-enamel Club Pin, a struck Medallion, a pebbled-leather Calfskin Tag, the Sunday Pairing Sheet, and a hand-hammered Sterling marker — and the brass and leather across the whole shop now catch the light like the real thing. The good stuff, finally finished like it.", tag: "NEW" },
    { item: "A brand-new welcome. Sign in and a cartoon golfer tees off into the dawn — tap to enter, and your caddy walks you around the real Clubhouse: it points right at Play, the Feed, Courses and more (no walls of text), you answer one quick question, pick your caddy, and play an un-losable practice hole that ends in confetti. Everyone gets the refreshed tour once. Skippable from any step.", tag: "NEW" },
    { item: "Seven Clubhouse looks. Settings → Display lets you dress the app your way — four to choose from today (including the crisp new Bluebird and Azalea, a refined rose theme) and three you unlock by playing. Pick your vibe; it follows you to every device you sign into.", tag: "NEW" },
    { item: "The Pro Shop is open. Spend your ParCoins on rings, nameplates, tee markers, card skins, and titles that ride along next to your name all over the club. Tap Try it on to see any piece on your own avatar and card before you spend a coin. The rarest pieces — a hole-in-one marker, the Green Jacket — can't be bought at any price; you earn those on the course.", tag: "NEW" },
    { item: "Your caddy, your call. Four caddies now wait in the bag — Murphy, Old Tom, Birdie, and the Bag Room Guy — each with their own voice, from steady to gruff to all-hype to a little heckle. Switch yours anytime in Settings → Display.", tag: "NEW" },
    { item: "Every round you've played. Tap your round count on your profile to open your full ledger — every round you've logged, in one place.", tag: "NEW" },
    { item: "Parbaughs Wrapped. From the Season Recap, tap Play your Wrapped and your year in golf unfolds story-style — your rounds, your best 18, your home course, where you finished — ending in a link to your highlights you can share with anyone.", tag: "NEW" },
    { item: "Share your club. Cut a public, no-account-needed link of your league's standings board or your own profile card — perfect for the group chat that hasn't joined yet.", tag: "NEW" },
    { item: "The Caddies' Weekly Report. Every week a fresh dispatch lands at the top of your Feed — Round of the Week, the Grinder who logged the most, the Hot Hand, and the occasional Sandbagger Watch. Your club's own little newsletter.", tag: "NEW" },
    { item: "Rivalries, kept honest. The app tracks your head-to-head record against everyone you play the same course on the same day. Your Nemesis shows on your home page and profile, and the Standings frame the exact race you're in — who's just ahead, and who's chasing you.", tag: "NEW" },
    { item: "Every course crowns a Legend — the member who plays it most, not just who scores lowest — so the regular who's always out there can hold a crown the ringer never will. And commissioners can now mint their own custom league trophies.", tag: "NEW" },
    { item: "Celebrations worth it. Beat your personal best and the Clubhouse showers you in confetti, and your league page gives you a gentle welcome when you arrive. Tasteful, never twice in a row, and it eases off if your phone is set to reduce motion.", tag: "NEW" },
    { item: "A tee-shot welcome. Sign in and a golfer tees off into a brightening dawn sky before the Clubhouse opens — a small moment of arrival every time you come back.", tag: "NEW" },
    { item: "A top-to-bottom polish. Every page — your home, profile, rounds, the feed, the shop, settings — reads like one finished clubhouse, with a record-book feel, smooth page-to-page motion, and snag-free scrolling. Buttons and labels are crisper and easier to read across the app, the Trophy Room is now sorted into tabs so it's a quick browse instead of an endless scroll, and your awards, records, and rivalries surface their best numbers at a glance. Members without a profile photo now get a clean colored initial instead of a look-alike disc, so the roster reads at a glance. Showing love on a round or post is now a single Kudos tap — we retired the redundant second reaction. Your email is now private to you and the Commissioner, and you can delete your account entirely from Settings whenever you like.", tag: "IMPROVED" }
  ];

  currentNotes.forEach(function(r) { h += renderEntry(r); });
  h += '</div></div></div>';

  // Past Releases (newest first; each block collapses by default)
  // archiveNotes data lives in caddynotes-archive.js per W1.A5 (AMD-027).
  // The archive file declares `var caddynotesArchive` at module scope.
  var archiveNotes = caddynotesArchive;

  // W1.I3 restructure: limit "Recent updates" to last 3 releases for clarity.
  // Older releases are still in archiveNotes (so version history is preserved)
  // but only the 3 most recent are surfaced in the UI. Members who want deep
  // history can ask The Caddy. Universal content per locked CTO_INTERFACE.md.
  h += '<div class="section"><div class="sec-head"><span class="sec-title">Recent Updates</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">The last three ships, in plain language.</div>';
  archiveNotes.slice(0, 3).forEach(function(block) {
    h += '<div class="card" style="margin-bottom:8px;overflow:hidden">';
    h += '<div onclick="var e=this.nextElementSibling;var c=this.querySelector(\'svg\');var open=e.style.display===\'block\';e.style.display=open?\'none\':\'block\';c.style.transform=open?\'rotate(0deg)\':\'rotate(90deg)\';" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:12px 14px;gap:8px;min-height:48px">';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:12px;color:var(--gold);font-weight:600">' + block.version + ' · ' + block.date + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + block.headline + '</div>';
    h += '</div>';
    h += '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0;transition:transform .15s ease"><path d="M6 4l4 4-4 4"/></svg>';
    h += '</div>';
    h += '<div style="display:none;padding:0 14px 14px;font-size:12px;color:var(--cream);line-height:1.8;border-top:1px solid var(--border)">';
    block.items.forEach(function(r) { h += renderEntry(r); });
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';

  // What's in the Bag — full feature list
  h += '<div class="section"><div class="sec-head"><span class="sec-title">What\'s in the Bag</span></div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var features = [
    "Invite-only membership with invite codes",
    "Live hole-by-hole scoring (Play Now) with FIR, GIR, putts",
    "Parbaugh Round: real-time shared scorecard",
    "ParCoins in-game currency with 9 earning triggers",
    "Cosmetics Shop: 70+ items (rings, banners, cards, name effects, titles)",
    "Wager Matches: 6 types including Nassau and Beat Their Score",
    "Bounty Board: coin bounties on scores and birdies",
    "Trash Talk: Spotlight of Shame, Victory Lap, Demand a Rematch",
    "Rich List, Power-Ups, Sponsor a Hole",
    "3 formal seasons per year (Spring, Summer, Fall) with awards",
    "Trophy Room: 50+ achievements, XP levels, titles",
    "8 premium themes with background textures and blend modes",
    "Champion Red theme unlocked by winning an event",
    "GHIN World Handicap System calculation",
    "Activity feed with filtering (All/Rounds/Chat/Range)",
    "Clubhouse: group chat with likes, comments, replies",
    "Direct messages between members",
    "Tee time posting with RSVP",
    "Full calendar with event dots and scheduling",
    "30,000+ course search via GolfCourseAPI",
    "Range session timer with drill tracking",
    "Scramble team management with W-L records",
    "Shareable scorecard images in your active theme",
    "Push notifications (FCM)",
    "PWA: installable to home screen",
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

  // W1.I3 restructure: "Coming Soon" trimmed to a vague forward-looking
  // teaser (4 plain-language directions, no leaks of unshipped specifics).
  // Cumulative inventory lives in "What's in the Bag" above; this section
  // is intentionally light on detail per locked governance.
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--muted)">On the Range</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">A few directions we\'re heading. Details land here when they\'re real.</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--muted);line-height:1.8">';
  var upcoming = [
    "Sharper Clubhouse polish, page by page.",
    "More ways to play together: scrambles, party games, trips.",
    "ParCoins economy continues to grow, earn while you play.",
    "Mobile app on the way for the founding 20."
  ];
  upcoming.forEach(function(u) {
    h += '<div style="padding:2px 0;display:flex;gap:8px;align-items:flex-start"><span style="color:var(--muted2);flex-shrink:0;margin-top:4px"><svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/></svg></span><span>' + u + '</span></div>';
  });
  h += '</div></div></div>';

  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Built by The Commissioner · v' + APP_VERSION + '</div>';

  document.querySelector('[data-page="caddynotes"]').innerHTML = h;
});
