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
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">May 2026 · The polish pass</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    { item: "During a live round, the bar along the bottom of the screen is now clearly the main place to act: move between holes with Prev and Next, and wrap up with Finish. The Finish button that also sits in the scorecard area is now a quieter backup, so there is one obvious set of controls instead of two competing green buttons.", tag: "IMPROVED" },
    { item: "Your round's format now reads with its proper name wherever it shows up. The live scoring screen used to label a Stableford round with the lowercase tag \"stableford,\" and your home dashboard could read \"STABLEFORD PLAY\" or \"BESTBALL PLAY.\" Now the live round, your home card, and the feed all say the same clean name, like Stableford, Best Ball, Match Play, or Skins.", tag: "IMPROVED" },
    { item: "When you start a round, the Format and Holes pickers now show a small down arrow, so it's clear you can tap them to switch things up. Before, they looked like fixed labels, and it wasn't obvious you could change your Format to Stableford, Match, or Skins, or drop to a nine-hole round. They read as the buttons they always were now.", tag: "IMPROVED" },
    { item: "On a phone, the buttons at the bottom of a live round (Previous hole, Next hole, and Finish) now respond every time. The app's main tab bar could sit right on top of them and quietly catch your taps, so moving between holes or finishing up could feel stuck. During a round the main tabs now step aside, leaving the round's own controls clear and tappable, and they slide back the moment you leave the round.", tag: "FIXED" },
    { item: "When you reopen the app, your home screen now loads reliably on the very first try. Once in a while, on a fresh start or a slower connection, it could come up blank for a moment and only a full reload would bring it back. The app now waits for everything it needs before settling on your home view, so you land on the Clubhouse every time.", tag: "FIXED" },
    { item: "The little connection light at the very bottom of the screen now looks after itself. If your signal dropped for a moment (an elevator, a dead spot, a quick hiccup), it could get stuck reading \"Offline\" even after you were clearly back online, and only fully reloading the app would clear it. Now it quietly re-checks the moment you return to the app or your connection comes back, and flips itself to \"Live\" on its own.", tag: "FIXED" },
    { item: "On your home dashboard, the small handicap trend chart used to read \"0 of 3 rounds logged\" even when you clearly had rounds on the books. That little chart only counts recent rounds that factor into your handicap and skips scrambles, so the old wording made it sound like you had not played at all. It now reads \"no rounds in this range,\" or how many of the three it has so far, so it matches the rounds count sitting right beside it.", tag: "IMPROVED" },
    { item: "In the Trophy Room, every badge you've earned now reads as a small lit medallion with a soft brass glow, while the ones still to come sit as quiet recessed slots, so a glance tells you what you've won and what is left to chase. On the Standings ladder, a very long name now trims neatly with an ellipsis, keeping the YOU chip and your round stats in view instead of stretching a row out of line.", tag: "IMPROVED" },
    { item: "If your profile wasn't finished yet, the \"Complete Your Profile\" nudge could quietly pile up into a stack of duplicate notifications over time. It now appears just once and waits there until you fill in your bio, scoring range, and home course. Behind the scenes, the app's allow-list for permitted external frames was tightened and the release safety-checks that confirm your home screen loads cleanly on iPhone and Android are reliable again.", tag: "FIXED" },
    { item: "Commissioners can now build a tournament right inside the app. Pick a format, a game type, a team style, and how points are scored, or start from the classic Smoky Mountain Open setup, then name the event and the title its winner will carry. The app reads everyone's handicap and recent form to draft the matchups and scoring for you, with no outside service involved, and once you lock it in before the first tee the field and the rules are set. Everyone else gets a clean live leaderboard, a form guide before play begins, and a champion card once it's done.", tag: "NEW" },
    { item: "The feed now groups your league's activity by when it happened. As you scroll, quiet date headers like Today, Yesterday, and This Week mark where each stretch begins, so a long run of rounds reads as a clear timeline instead of one endless list.", tag: "IMPROVED" },
    { item: "The Trophy Room reads clearly now. The achievements you've earned sit in cards with a soft gold outline and a gentle lift, and the ones still to come show as clean, readable slots instead of fading into the page. The title ladder at the bottom got the same treatment, so upcoming titles are easy to read rather than nearly invisible.", tag: "IMPROVED" },
    { item: "During a live round you can now fix a hole's par or yardage on the spot when the course record looks wrong: tap Adjust on the scoring screen, nudge the par or type in the yards, and it applies to just that round. Your front-nine and back-nine totals, fairways hit, and handicap math all recompute from the number you set, while the course record itself stays untouched.", tag: "NEW" },
    { item: "Behind the scenes: the app now refuses to be loaded inside another website's frame, a standard protection that stops a hidden page from tricking you into tapping things, and the team added a single security sweep we run every cycle to keep credentials out of the code and catch known issues early.", tag: "INFRA" },
    { item: "On the Season Recap, anyone who has only played nine-hole or scramble rounds used to show the word \"null\" where an eighteen-hole scoring average would normally sit. Those spots now show a simple dash, matching how the Standings page already handles it, so every line in the final standings and the champion card reads cleanly.", tag: "FIXED" },
    { item: "The Caddy's little italic notes on your round history, and the short story under each hole-in-one on the Ace Wall, now read as clean italic text instead of carrying a small colored line down the left edge. It is a quiet touch that brings those two spots in line with the single, even outline the rest of the app already uses.", tag: "IMPROVED" },
    { item: "If you use a screen reader like VoiceOver or TalkBack, the menu now reads correctly. On a larger screen the side menu is announced as the navigation it is, and on a medium screen the slide-in menu is announced as a pop-up only while it is actually open. Before, the side menu could be hidden from the screen reader by mistake.", tag: "FIXED" },
    { item: "The boxes you type into, like the sign-in fields and the spots where you add a comment or send a message, now have a clear outline and a lighter fill, so they read as ready to type in instead of looking switched off. Tapping into one shows a soft gold ring so you always know where you are.", tag: "IMPROVED" },
    { item: "You can now block another member from their profile. Once blocked, you stop seeing their posts, comments, and messages anywhere in the app, and you can unblock them anytime from Settings. Reporting a member is cleaner too: you pick a reason from a tidy list and it goes privately to the Commissioner, instead of the old typed-number popup.", tag: "NEW" },
    { item: "When an action can't go through, like posting a wager, saving an event, or sending a message, the app now explains it in plain language and points you to the fix (for example that you appear to be offline, or that you don't have permission), instead of flashing a confusing technical error.", tag: "IMPROVED" },
    { item: "Your Records page now counts Courses Played correctly: it tallies every distinct course you've actually logged a round at, so the number is right even before anyone fills in the course directory by hand. It used to read zero until courses were added manually.", tag: "FIXED" },
    { item: "Two small clean-ups: the Ace Wall no longer shows a stray line of placeholder text under your hole-in-ones, and the Courses page now invites you to find your course from thousands worldwide in plain language instead of naming the data service behind it.", tag: "IMPROVED" },
    { item: "When a list can't load right now, like the Rich List, your open rounds, or feed comments, the app now shows a clear note and a Try again button instead of a vague \"Failed to load\" line. One tap re-checks without leaving the page.", tag: "IMPROVED" },
    { item: "The example tee times shown before anyone has posted one now match the look used on Challenges, Bounties, and Wagers: a clean dashed outline at full width instead of a narrower filled box, so the example ideas across all four pages read as one consistent style.", tag: "IMPROVED" },
    { item: "When you haven't logged a round yet, the Rounds page now greets you properly: a clean golf-flag mark, a note that your first round earns 100 XP and the First Blood badge, and a quick tap to start playing, instead of a single plain line of text.", tag: "IMPROVED" },
    { item: "The What's New card on the More page now uses a clear, evergreen line that always points you to these Caddy Notes, instead of an old fixed blurb that no longer matched recent updates.", tag: "IMPROVED" },
    { item: "The example ideas on the Challenges, Bounty Board, and Wagers pages read clearly now: each sits in a clean dashed outline instead of a faded fill that made them look switched off.", tag: "IMPROVED" },
    { item: "Deleting your account is now a careful, honest flow: we ask for your password and have you type the word DELETE to confirm, we check your password first so a wrong one removes nothing, and the screen tells you plainly what gets removed (your profile, photos, and sign-in) and that it cannot be undone.", tag: "IMPROVED" },
    { item: "When you haven't started a Challenge yet, the page now greets you the way the Bounty Board and Wagers do: a clear heading, a few ideas to spark a match, and one tap to begin. The Courses and Party Games pages, the quick search, and the occasional league-wide alert banner also dropped their stray emoji for the same crisp line-art icons the rest of the app uses, so everything looks sharp and reads the same on every phone.", tag: "IMPROVED" },
    { item: "On a wide desktop screen, the whole app now keeps its content in one tidy centered column: the Clubhouse, Feed, your Rounds, Play Now, the Range, messages, settings, and every board and list, instead of stretching the screen wide, so every row, score, and message reads at a glance (no more controls drifting way off across the page). Wide scorecards and the standings, members, and trophy grids still fill the space where it helps.", tag: "IMPROVED" },
    { item: "The Wagers page now welcomes you the way the Bounty Board does: a clear heading, a few example wagers to spark ideas, and one tap to get one going.", tag: "IMPROVED" },
    { item: "Clubhouse posts behave themselves: bounties, wagers, and chat messages no longer flash a phantom error after they actually go through, and a message that truly fails to send now says so.", tag: "IMPROVED" },
    { item: "Caddy's notes in the feed now sit in a softly tinted card, while everyone else's chat wears the same clean full outline as the rest of the app.", tag: "IMPROVED" },
    { item: "Privacy Policy and Terms of Service are now one tap away in Settings, and the privacy policy spells out exactly what we store, what stays opt-in (like location for weather), and what we never touch.", tag: "NEW" },
    { item: "Home greets you by time of day: Good morning / Good afternoon / Good evening / Welcome back.", tag: "IMPROVED" },
    { item: "\"The league this week\" stat strip on the home page: rounds, average, low score, and momentum vs last week.", tag: "NEW" },
    { item: "Your handicap stat now shows a trend arrow when you have 5+ rounds: ▼ improving / ▲ heavier / ● steady.", tag: "IMPROVED" },
    { item: "Round history now shows ±N to par under every score, and a ★ PR badge marks your personal best.", tag: "IMPROVED" },
    { item: "Standings highlights your own row with a soft gold wash + YOU chip, so you can find yourself in the ladder at a glance.", tag: "IMPROVED" },
    { item: "Trophy Room hero gets a warm gold halo behind your level. The moment should feel like a moment.", tag: "IMPROVED" },
    { item: "Members directory groups by tier (Founding Four / Members) with brass eyebrows + counts.", tag: "IMPROVED" },
    { item: "Mobile home now shows a League Pulse: last 3 league activity items right on home.", tag: "NEW" },
    { item: "Course directory + Feed get warmer empty states with clear next-actions.", tag: "IMPROVED" },
    { item: "Activity feed is steadier: rounds logged offline now show up correctly instead of leaving the feed blank until they sync.", tag: "IMPROVED" },
    { item: "Toasts and notifications wear a cleaner full outline instead of a side stripe, so success and error states read clearly at a glance.", tag: "IMPROVED" },
    { item: "More of the app now shares one clean card outline: the handicap callout, league pulse, range sessions, feed cards, and calendar event chips dropped their colored edge-stripes for a single cohesive look.", tag: "IMPROVED" },
    { item: "Copy across the app reads cleaner: toasts, empty states, help text, the Caddy's post-round notes, and the FAQ now use consistent punctuation instead of stray dashes.", tag: "IMPROVED" },
    { item: "Behind the scenes: the app now ships its code compressed, with comments and extra spacing stripped out, so there's less to download and read the first time you open it. It loads a little quicker, especially on a phone.", tag: "INFRA" },
    { item: "Behind the scenes: visual regression suite catches design drift; pre-commit blocks accidental credential leaks; A- app-health floor maintained.", tag: "INFRA" }
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
    "Rich List, Power-Ups, Sponsor a Hole, Name a Tournament",
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
