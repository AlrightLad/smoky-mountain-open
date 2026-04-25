// ========== THE CADDY NOTES ==========
Router.register("caddynotes", function() {
  var h = '<div class="sh"><h2>The Caddy Notes</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:16px"><div style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" style="color:var(--gold)"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>';
  h += '<div style="font-family:var(--font-display);font-size:18px;color:var(--gold)">The Caddy Notes</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">What\'s new, what\'s fixed, and what\'s coming</div>';
  h += '<div style="font-size:10px;color:var(--gold);margin-top:6px;font-weight:600">v' + APP_VERSION + '</div></div>';

  function tagColorFor(tag) {
    return tag === "NEW" ? "var(--birdie)" : tag === "FIXED" ? "var(--gold)" : tag === "IMPROVED" ? "var(--blue)" : "var(--muted)";
  }
  function renderEntry(r) {
    var tc = tagColorFor(r.tag);
    return '<div style="padding:4px 0;display:flex;gap:8px;align-items:flex-start">' +
      '<span style="font-size:8px;font-weight:700;color:' + tc + ';background:' + tc + '15;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-top:2px">' + r.tag + '</span>' +
      '<span>' + r.item + '</span></div>';
  }

  // Current Release
  h += '<div class="section"><div class="sec-head"><span class="sec-title" style="color:var(--birdie)">What\'s New · v' + APP_VERSION + '</span></div>';
  h += '<div style="font-size:10px;color:var(--muted);padding:0 16px 8px">April 2026 · polish</div>';
  h += '<div class="card"><div class="card-body" style="font-size:12px;color:var(--cream);line-height:1.8">';
  var currentNotes = [
    { item: "Polish: Home greeting now correctly extracts your first name when your profile starts with a title (Mr, Mrs, Dr, etc.). Previously showed just the title — now skips it to show your actual name.", tag: "FIXED" }
  ];
  currentNotes.forEach(function(r) { h += renderEntry(r); });
  h += '</div></div></div>';

  // Past Releases (newest first; each block collapses by default)
  var archiveNotes = [
    {
      version: "v8.4.0", date: "April 2026", headline: "Home restructure",
      items: [
        { item: "Home page redesigned. A cleaner editorial layout that shows what matters today — your live round, tee times, stats at a glance. Season standings and event results moved to their own pages.", tag: "NEW" },
        { item: "New user welcome flow: brand new Parbaughs land on a welcome screen with quick-start CTAs for your first round or range session.", tag: "NEW" }
      ]
    },
    {
      version: "v8.3.6", date: "April 2026", headline: "Layout hotfix",
      items: [
        { item: "Hotfix: on desktop, page content was appearing below the fold under a 945px gap. Sidebar is now fixed-position and content flows naturally from the top. Mobile unaffected.", tag: "FIXED" }
      ]
    },
    {
      version: "v8.3.5", date: "April 2026", headline: "Six themes",
      items: [
        { item: "Theme system reimagined. Six new editorial themes — three ready to use (Clubhouse, Twilight Links, Linen Draft), three to earn through play. Picker coming in the next update. Your old theme has been mapped to the closest new one.", tag: "NEW" }
      ]
    },
    {
      version: "v8.3.4", date: "April 2026", headline: "Chalk Dry loading",
      items: [
        { item: "Behind-the-scenes improvement: added a new loading state system that feels intentional instead of clunky. Quick loads show nothing; medium loads show a subtle brass cue; slower loads show a skeleton of the real content. You won't see it yet — but it'll feel premium across upcoming screens.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.3.3", date: "April 2026", headline: "Haptic bridge",
      items: [
        { item: "Haptic feedback added on iOS and Android — a light tap when you enter a score, a success buzz when you finish a round, and an unlock pattern when you earn something new. Subtle and intentional, only where the moment is real.", tag: "NEW" }
      ]
    },
    {
      version: "v8.3.2", date: "April 2026", headline: "Page transitions",
      items: [
        { item: "Navigation between pages now has subtle motion. Moving deeper into the app (tap a row, view a detail) lifts pages into place. Big moments like starting a round get a premium brass sweep. It's quiet, editorial, and respects your reduced-motion settings.", tag: "NEW" }
      ]
    },
    {
      version: "v8.3.1", date: "April 2026", headline: "Bottom sheet foundation",
      items: [
        { item: "Behind-the-scenes improvement: added a new bottom sheet system under the hood. You won't see it yet — but it'll power smoother detail views, confirmations, and forms in upcoming updates.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.3.0", date: "April 2026", headline: "Reading Room shell",
      items: [
        { item: "New look on larger screens. If you pull up Parbaughs on a laptop or tablet, you'll see a fresh sidebar navigation — the app finally feels like a real platform beyond your phone. Mobile is unchanged.", tag: "NEW" },
        { item: "Every tap now feels consistent across the app. Subtle press feedback applied universally — no more mixed button behaviors.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.2.2", date: "April 2026", headline: "Smoother scorecard",
      items: [
        { item: "Scorecard taps feel instant now. Toggling FIR, GIR, putts, bunker, sand save, scrambling, miss direction, and penalty strokes updates without the page flash. Same scoring, smoother interaction.", tag: "IMPROVED" },
        { item: "FIR and GIR show a clearer selected state. No more guessing if you've tapped them.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.2.1", date: "April 2026", headline: "Hotfix",
      items: [
        { item: "Fixed a bug where tapping Tee It Up after finishing a round could appear to freeze or load slowly.", tag: "FIXED" },
        { item: "Round in progress banner now clears correctly when you finish or close out of a round.", tag: "FIXED" }
      ]
    },
    {
      version: "v8.2.0", date: "April 2026", headline: "Advanced stat capture",
      items: [
        { item: "Added advanced stat tracking on Play Now and Log a Round — bunker visits, sand saves, scrambling, miss direction, and penalty strokes. All optional per hole.", tag: "NEW" },
        { item: "Advanced stats start feeding the app's analytics engine. Track a few rounds and new insights will surface in future updates.", tag: "NEW" }
      ]
    },
    {
      version: "v8.1.3", date: "April 2026", headline: "Final Part A polish",
      items: [
        { item: "Handicap number now animates with decimals on load. Fixed a bug where achievement notifications wouldn't appear for users with Reduce Motion enabled. Small accessibility polish across header buttons. Code cleanup under the hood.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.1.2", date: "April 2026", headline: "Motion and accessibility",
      items: [
        { item: "Numbers now roll smoothly with decimals instead of jumping. Extended motion vocabulary across the app. Respects your phone's Reduce Motion accessibility setting. Screen readers now announce toasts and stat updates. Small visual polish across navigation.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.1.1", date: "April 2026", headline: "Clubhouse polish",
      items: [
        { item: "Buttons, cards, and rows now respond when you tap them. Added proper keyboard navigation indicators for accessibility. Standardized how everything transitions and presses across the app. Small change but everything feels tighter.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.1.0", date: "April 2026", headline: "The clubhouse opens",
      items: [
        { item: "The Clubhouse is open. Major visual refresh with new typography, colors, and a cleaner aesthetic throughout. Light and dark appearance modes available in settings. Your rounds, badges, handicap, and ParCoins are preserved — only the look changed. Cosmetics audit coming in the next few updates.", tag: "NEW" }
      ]
    },
    {
      version: "v8.0.5", date: "April 2026", headline: "Infrastructure sprint",
      items: [
        { item: "App now respects iPhone notch and home indicator on all screens. Tap targets enlarged for easier use on mobile. Stats charts no longer silently break on empty data. Behind-the-scenes: server runtime upgraded ahead of Google's April 30 deadline.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.4", date: "April 2026", headline: "Planning documentation",
      items: [
        { item: "Behind-the-scenes planning documentation for upcoming features. Nothing new you can see yet, but work continues toward the App Store launch.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.2", date: "April 2026", headline: "DM badge fix",
      items: [
        { item: "Direct message unread badges now update reliably.", tag: "FIXED" }
      ]
    },
    {
      version: "v8.0.1", date: "April 2026", headline: "Gate 2 patch",
      items: [
        { item: "Notifications and direct messages restored to full working order after the v8 upgrade.", tag: "FIXED" },
        { item: "ParCoin transaction history loads faster and more reliably.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.0", date: "April 2026", headline: "v8 foundation live",
      items: [
        { item: "New Parbaughs platform is live — cleaner permissions system, foundation for Founder tools and league management coming soon.", tag: "IMPROVED" },
        { item: "Behind-the-scenes upgrade complete — your data is preserved and everything works the same, just better.", tag: "FIXED" }
      ]
    },
    {
      version: "v8.0.0-rc2.4", date: "April 2026", headline: "Cutover prep",
      items: [
        { item: "Pre-cutover index parity — declared four live indexes ahead of the v8.0 deploy.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.0-rc2.3", date: "April 2026", headline: "v8 release candidate 2",
      items: [
        { item: "Behind-the-scenes account safety upgrade — release candidate 3 continuing platform hardening.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.0-rc2.2", date: "April 2026", headline: "v8 release candidate 2",
      items: [
        { item: "Behind-the-scenes permission system upgrade — release candidate 2 continuing platform hardening.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.0-rc2.1", date: "April 2026", headline: "v8 release candidate 2",
      items: [
        { item: "Behind-the-scenes security infrastructure upgrade — release candidate 2 continuing platform hardening.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v8.0.0-rc1", date: "April 2026", headline: "v8 release candidate 1",
      items: [
        { item: "Behind-the-scenes security infrastructure upgrade — release candidate 1 of 3 for the next major platform version.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.8", date: "April 2026", headline: "Infrastructure polish",
      items: [
        { item: "Behind-the-scenes tooling fix for development infrastructure.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.7", date: "April 2026", headline: "Design planning",
      items: [
        { item: "Behind-the-scenes design direction planning for future visual improvements.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.6", date: "April 2026", headline: "Documentation polish",
      items: [
        { item: "Behind-the-scenes documentation improvements to keep development running smoothly.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.5", date: "April 2026", headline: "Security hardening",
      items: [
        { item: "Security hardening on behind-the-scenes data permissions. You shouldn't notice any difference, but the app is a bit safer.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.4", date: "April 2026", headline: "Migration groundwork",
      items: [
        { item: "Behind-the-scenes migration tooling for the next major platform upgrade.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.3", date: "April 2026", headline: "Testing infrastructure",
      items: [
        { item: "Behind-the-scenes testing infrastructure to help catch potential bugs before they reach members.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.2", date: "April 2026", headline: "v8 technical planning",
      items: [
        { item: "Behind-the-scenes technical planning work for upcoming platform upgrades. Nothing new you can see yet — the groundwork for the next wave of features.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.1", date: "April 2026", headline: "Long-term governance groundwork",
      items: [
        { item: "Behind-the-scenes design work finalizing how leagues, roles, and platform governance will work long-term. Nothing new you can see yet — the groundwork for upcoming features.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.9.0", date: "April 2026", headline: "Fresh stats on every open",
      items: [
        { item: "Your XP, level, and stats now refresh a few seconds after you open the app, so the numbers you see always match what you've actually earned.", tag: "FIXED" }
      ]
    },
    {
      version: "v7.8.7", date: "April 2026", headline: "Development process polish",
      items: [
        { item: "Behind-the-scenes improvements to how the app is built and shipped. Nothing new you can see, but the development process is more consistent.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.8.6", date: "April 2026", headline: "Caddy Notes cleanup",
      items: [
        { item: "Cleaned up these release notes. Only the current version shows here now. Older updates moved to Past Releases below, tap any version to expand.", tag: "NEW" }
      ]
    },
    {
      version: "v7.8.5", date: "April 2026", headline: "XP Display Consistency",
      items: [
        { item: "Fixed XP values showing different numbers on different pages. Home, profile, Trophy Room, chat, and member lists now all match.", tag: "FIXED" }
      ]
    },
    {
      version: "v7.8.4", date: "April 2026", headline: "UI Fixes",
      items: [
        { item: "Fixed XP bars showing different values between home and profile.", tag: "FIXED" },
        { item: "Fixed the Rounds stat box rendering incorrectly on profile pages.", tag: "FIXED" }
      ]
    },
    {
      version: "v7.8.0 – v7.8.2", date: "April 2026", headline: "Behind-the-scenes reliability",
      items: [
        { item: "Behind-the-scenes improvements to reliability. Nothing new you can see, but the app is more stable and every change is checked before shipping.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v7.6.x", date: "April 2026", headline: "Global stats + league isolation",
      items: [
        { item: "Fixed profile pages showing only 1 round for founding members. All historical rounds now appear correctly.", tag: "FIXED" },
        { item: "Home page round count, level, and XP now reflect every round you've played, including 9-hole and scramble rounds across all leagues.", tag: "FIXED" },
        { item: "Handicap now uses the World Handicap System formula and matches your GHIN, recalculated from your real scores.", tag: "FIXED" },
        { item: "Fixed chat and other areas that could show content from the wrong league. Switching leagues now cleanly resets your view.", tag: "FIXED" }
      ]
    },
    {
      version: "v7.5.0", date: "April 2026", headline: "4 bug fixes",
      items: [
        { item: "Events page now only shows events from your active league.", tag: "FIXED" },
        { item: "Level, XP, handicap, and achievements are now global. Your stats reflect all your rounds, not just your active league.", tag: "FIXED" },
        { item: "Welcome message now shows your active league name instead of always saying The Parbaughs.", tag: "FIXED" },
        { item: "Course directory: new All Courses / Our Courses toggle. See every course or just the ones your league has played.", tag: "NEW" }
      ]
    },
    {
      version: "v7.4.x", date: "April 2026", headline: "League data isolation",
      items: [
        { item: "Fixed rounds, chat, and league data not loading properly for everyone. Speed improved dramatically.", tag: "FIXED" },
        { item: "Restored Nick's 18 missing achievements from backup.", tag: "FIXED" },
        { item: "League data mixing across leagues is now impossible. Every piece of league content stays inside its league.", tag: "FIXED" },
        { item: "Commissioner admin panel: full data audit tool and data recovery tool for fixing stray records.", tag: "NEW" }
      ]
    },
    {
      version: "v7.3.0", date: "April 2026", headline: "League management",
      items: [
        { item: "League Settings page: commissioner can manage visibility, approval, invite codes, admins, and delete the league.", tag: "NEW" },
        { item: "Join Request system: users can request to join public leagues and commissioners or admins approve or deny with notifications.", tag: "NEW" },
        { item: "Member management: promote or demote admins, view all members with roles.", tag: "NEW" },
        { item: "The Parbaughs is now public with approval required. The Original Four (Zach, Kayvan, Kiyan, Nick) are admins.", tag: "NEW" }
      ]
    },
    {
      version: "v7.2.x", date: "April 2026", headline: "Community Scorecards",
      items: [
        { item: "Fixed league data showing up in the wrong league across 20+ areas (tee times, wagers, bounties, calendar, scramble, and more).", tag: "FIXED" },
        { item: "New Community Scorecard System: members can add, edit, and verify course scorecard data.", tag: "NEW" },
        { item: "Three data states on every course: API Only (gray), Community Added (orange), Community Verified (green).", tag: "NEW" },
        { item: "Earn 50 ParCoins for contributing first scorecard data, 10 for verifying, 25 for approved edits.", tag: "NEW" },
        { item: "Scorecard editor: tap to set par per hole, tee name, slope, and rating.", tag: "NEW" }
      ]
    },
    {
      version: "v7.1.x", date: "April 2026", headline: "Security audit + deploys",
      items: [
        { item: "Fixed a blank-screen bug that was showing CONNECTING forever on some devices.", tag: "FIXED" },
        { item: "Push notifications now work. Members receive pushes for rounds and tee times.", tag: "NEW" },
        { item: "Email verification: Settings page shows verification status and lets you send a verification email.", tag: "NEW" },
        { item: "Faster load times across rounds, notifications, wagers, social actions, and photos.", tag: "IMPROVED" },
        { item: "Security: unverified accounts are prompted to verify. Wagers, bounties, DMs, and shop require a verified email.", tag: "NEW" }
      ]
    },
    {
      version: "v7.0.x", date: "April 2026", headline: "Launch ready",
      items: [
        { item: "Parbaughs is App Store ready. Landing page, Privacy Policy, Terms of Service, and Support FAQ are all done.", tag: "NEW" },
        { item: "Fixed a blank-screen startup bug that prevented the app from loading for some members.", tag: "FIXED" },
        { item: "Fixed crashes during rounds and improved error reporting.", tag: "FIXED" }
      ]
    },
    {
      version: "v6.5.0", date: "April 2026", headline: "App Store prep",
      items: [
        { item: "App Store prep: installable home-screen version, full offline theme support, and native app builds ready.", tag: "NEW" },
        { item: "Legal pages: Privacy Policy, Terms of Service, and Support FAQ created.", tag: "NEW" }
      ]
    },
    {
      version: "v6.4.0", date: "April 2026", headline: "Advanced Analytics",
      items: [
        { item: "New Analytics Dashboard on profile Stats tab: scoring trends, strokes gained, par type analysis, course breakdown.", tag: "NEW" },
        { item: "Charts for trends, strokes gained, and par-type scoring. All match your theme.", tag: "NEW" },
        { item: "Strokes Gained: see where you gain or lose strokes across tee, approach, short game, and putting.", tag: "NEW" },
        { item: "Hole-by-hole breakdown: average over par per hole at your most-played course.", tag: "NEW" },
        { item: "GIR% and putts-per-hole trend lines so you can track your improvement over time.", tag: "NEW" }
      ]
    },
    {
      version: "v6.3.0", date: "April 2026", headline: "The Caddie",
      items: [
        { item: "New personal analysis engine that reads your round data and gives you insights, no AI required.", tag: "NEW" },
        { item: "Post-round analysis: scoring by par type, front/back comparison, GIR impact, putting, bogey streaks, birdie ratio.", tag: "NEW" },
        { item: "Pre-round scouting: when starting a round at a course you've played, see your toughest and best holes.", tag: "NEW" },
        { item: "Practice plan generator: based on your last 5 rounds, get a focused 30-minute range plan.", tag: "NEW" },
        { item: "Trend alerts on home page: improving streak, personal best within reach, inactivity warning.", tag: "NEW" },
        { item: "Course insights: The Caddie's take on each course with personal and league-wide stats.", tag: "NEW" }
      ]
    },
    {
      version: "v6.2.x", date: "April 2026", headline: "Content + social polish",
      items: [
        { item: "Course reviews now support photo uploads and helpful voting.", tag: "NEW" },
        { item: "Post-round stories now support photos. Share a round moment visually.", tag: "NEW" },
        { item: "Drills Library shows difficulty level and estimated duration for each drill.", tag: "IMPROVED" },
        { item: "Course reviews: star rating selector, aggregate rating, only players who've played can review.", tag: "IMPROVED" },
        { item: "Auto-generated course stats: member average, most played by, hardest and easiest hole.", tag: "NEW" },
        { item: "Post-round stories: after logging a round, tell the story with a How'd It Go? prompt.", tag: "NEW" },
        { item: "Tip of the Day on home page: 15 rotating golf tips across putting, driving, short game, and mental game.", tag: "NEW" },
        { item: "Drills Library page: browse all 15+ practice drills by category with how-to instructions.", tag: "NEW" },
        { item: "Finish Round button pulses when all holes have scores, so you can't miss it.", tag: "FIXED" },
        { item: "FIR and GIR now clearly show HIT (green check) vs MISS (red X). Par 3s show N/A for FIR.", tag: "FIXED" },
        { item: "Rainbow Gradient name effect fixed. Now properly cycles through colors.", tag: "FIXED" },
        { item: "Clubhouse chat cleaned up: only human messages now, no auto-generated round posts.", tag: "FIXED" }
      ]
    },
    {
      version: "v6.1.0", date: "April 2026", headline: "Social features",
      items: [
        { item: "Public profiles: toggle in Settings to get a shareable profile URL.", tag: "NEW" },
        { item: "Find Players page: search by name, filter by handicap, see mutual leagues.", tag: "NEW" },
        { item: "Golf reactions on feed posts: tap the fire emoji for a reaction picker (fire, clap, flag, skull, trophy, laugh).", tag: "NEW" },
        { item: "Shareable profile cards: one-tap generate a branded image with your stats to share.", tag: "NEW" },
        { item: "Share Profile Card button on every profile.", tag: "NEW" }
      ]
    },
    {
      version: "v6.0.x", date: "April 2026", headline: "Multi-league launch",
      items: [
        { item: "Parbaughs now supports multiple leagues. The Parbaughs is the founding league with a permanent badge.", tag: "NEW" },
        { item: "All existing data migrated. Zero data loss, zero broken features.", tag: "NEW" },
        { item: "Rounds, chat, events, wagers, and bounties now filter by your active league.", tag: "NEW" },
        { item: "New Leagues page: view your leagues, create new ones, join via invite code, browse public leagues.", tag: "NEW" },
        { item: "Create a League: set name, location, description, visibility. You become commissioner.", tag: "NEW" },
        { item: "Join a League: enter an invite code or request to join a public league.", tag: "NEW" },
        { item: "League switcher: tap Switch on any league card to change your active league.", tag: "NEW" },
        { item: "Founding League badge on The Parbaughs. Permanent. No other league can ever earn it.", tag: "NEW" },
        { item: "Courses, ParCoins, cosmetics, and achievements are global. They travel with you across leagues.", tag: "IMPROVED" }
      ]
    },
    {
      version: "v5.33.0 – v5.40.x", date: "early 2026", headline: "Pre-redesign era",
      items: [
        { item: "Trash Talk: Spotlight of Shame, Victory Lap, Demand a Rematch on any profile.", tag: "NEW" },
        { item: "Bounty Board: post coin bounties on scores or birdies. Auto-claims on qualifying rounds.", tag: "NEW" },
        { item: "Rich List: top 10 lifetime coin holders with Gold Member badge.", tag: "NEW" },
        { item: "Power-Ups: Double XP Round and Handicap Shield.", tag: "NEW" },
        { item: "Sponsor a Hole and Name a Tournament status purchases.", tag: "NEW" },
        { item: "Wager Matches: 6 types including Nassau and Beat Their Score.", tag: "NEW" },
        { item: "Formal seasons (Spring, Summer, Fall) with tab selector.", tag: "NEW" },
        { item: "Activity feed filtering: All, Rounds, Chat, Range.", tag: "NEW" },
        { item: "4 new season awards: Course Specialist, Rivalry Winner, Iron Will, Newcomer.", tag: "NEW" },
        { item: "Season archive on standings page. Shows past season champions with Inaugural Season badge.", tag: "NEW" },
        { item: "Champion Red theme unlockable by winning a season or an event.", tag: "IMPROVED" },
        { item: "Season rules: 3 seasons per year (Spring/Summer/Fall) with Dec-Feb off-season.", tag: "IMPROVED" },
        { item: "Season winner earns Champion Red theme, ParCoins, and a title.", tag: "NEW" },
        { item: "Cosmetics Shop expanded to 75 items across 5 categories: rings, banners, card themes, name effects, titles.", tag: "NEW" },
        { item: "Name Effects: 6 visual styles for your display name including Gold Shimmer, Rainbow Gradient, Fire Text.", tag: "NEW" },
        { item: "Purchasable Titles: 10 buyable titles plus reserved titles for commissioner and founding four.", tag: "NEW" },
        { item: "New rings: Flame, Neon Green, Crimson Ember, Rainbow Shift (animated, 750 coins).", tag: "NEW" },
        { item: "New card themes: Gold Foil, Birdie Streak, Dark Carbon, Vintage Parchment, Augusta Green, Neon Night.", tag: "NEW" },
        { item: "Shop previews: animated rings, name effects, and mock feed cards show what you're buying before you buy.", tag: "NEW" },
        { item: "Ring previews show your actual profile photo inside the ring.", tag: "NEW" },
        { item: "Name effect previews show your actual username with the animation applied.", tag: "NEW" },
        { item: "Feed redesigned: Instagram-style cards with avatars, theme rings, hole dots, stat chips, and action rows.", tag: "NEW" },
        { item: "Round posts show full detail: score, course, front/back splits, hole-by-hole colored dots, FIR/GIR/putts.", tag: "NEW" },
        { item: "Every feed avatar now shows that player's theme ring, not yours.", tag: "NEW" },
        { item: "Feed action row: tap Scorecard, Comment, or Share on any round post.", tag: "NEW" },
        { item: "ParCoin economy redesigned. Playing golf is now the primary earning method.", tag: "NEW" },
        { item: "New earn rates: 18-hole round = 50 coins (+25 attested), 9-hole = 25 (+10 attested), range 30 min+ = 10.", tag: "IMPROVED" },
        { item: "Shop prices rebalanced across 4 tiers: Basic (100-200), Mid (300-500), Premium (750-1500), Ultra (2000+).", tag: "IMPROVED" },
        { item: "Wagers and bounties enforce balance checks. You can only bet coins you actually have.", tag: "IMPROVED" },
        { item: "Premium animated rings now actually animate. Pulse Gold breathes, Rainbow cycles colors, Diamond Sparkle shimmers.", tag: "NEW" },
        { item: "Name effects now animate: Gold Shimmer scrolls, Rainbow cycles, Fire and Ice gradient, Glowing Green pulses.", tag: "NEW" },
        { item: "Branded empty views for Challenges, Tee Times, DMs, and Scramble Teams when you have nothing posted yet.", tag: "NEW" },
        { item: "Every avatar in the app now shows a visible ring with glow matching the player's theme.", tag: "NEW" },
        { item: "Profile photos now save correctly and appear everywhere the same.", tag: "FIXED" },
        { item: "Calendar restored to original clean design. Tap dates to browse, no accidental selections.", tag: "FIXED" },
        { item: "Create Events button on calendar: add multi-day events with name, location, and dates.", tag: "NEW" },
        { item: "Multi-day events show as spanning gold bars across the calendar grid.", tag: "NEW" },
        { item: "Calendar dots updated: gold = event, green = round, blue = range, pink = tee time.", tag: "IMPROVED" },
        { item: "Month navigation slides smoothly. No page refreshes.", tag: "IMPROVED" },
        { item: "Today indicator is now a subtle ring instead of a solid background.", tag: "IMPROVED" },
        { item: "Full data audit: every round, course, member, handicap, and balance verified.", tag: "NEW" },
        { item: "FAQ completely rewritten: 28 questions across 7 categories with navigation directions.", tag: "NEW" },
        { item: "Onboarding upgraded to 5 screens: Welcome, Logging Rounds, Seasons & Events, ParCoins, Your Legacy.", tag: "IMPROVED" },
        { item: "Theme textures now visible: camo leaves, azalea flowers, carbon fiber, leather. Switch themes and see the detail.", tag: "FIXED" },
        { item: "Beat Their Score wager: bet you can beat a friend's best score at a course.", tag: "NEW" },
        { item: "Shareable scorecards render in your active theme colors.", tag: "NEW" },
        { item: "Course directory: 9-hole averages now pull from the front and back halves of 18-hole rounds.", tag: "FIXED" },
        { item: "Light Mode completely fixed: cream backgrounds, dark text, white cards, proper contrast.", tag: "FIXED" },
        { item: "All 8 themes verified for WCAG AA contrast compliance.", tag: "FIXED" },
        { item: "12 new theme-paired profile banners and 4 neutral options (Flagstick, Mountain, Fairway, Golden Hour).", tag: "NEW" },
        { item: "6 new avatar rings including premium animated Pulse Gold (500) and Diamond Sparkle (1000).", tag: "NEW" },
        { item: "Avatar rings now match your theme automatically: gold for Classic, pink for Azalea, green for Masters.", tag: "NEW" },
        { item: "New My Rounds page: lifetime round journal with stats, front/back splits, hole visualizations, personal best badges, filters.", tag: "NEW" },
        { item: "Tap Rounds on home page to see your complete golf history.", tag: "NEW" },
        { item: "Hole dots use universal golf colors (gold/green/gray/orange/red) with a legend on Round History.", tag: "FIXED" },
        { item: "Bounty Board empty view redesigned. Shows bounty ideas and a Post a Bounty button.", tag: "FIXED" }
      ]
    }
  ];

  h += '<div class="section"><div class="sec-head"><span class="sec-title">Past Releases</span></div>';
  archiveNotes.forEach(function(block) {
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
    "Parbaugh Round — real-time shared scorecard",
    "ParCoins in-game currency with 9 earning triggers",
    "Cosmetics Shop — 70+ items (rings, banners, cards, name effects, titles)",
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

  h += '<div style="text-align:center;padding:16px;font-size:10px;color:var(--muted2)">Built by The Commissioner · v' + APP_VERSION + '</div>';

  document.querySelector('[data-page="caddynotes"]').innerHTML = h;
});
