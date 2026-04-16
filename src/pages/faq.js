// ========== FAQ PAGE ==========
Router.register("faq", function() {
  var h = '<div class="sh"><h2>FAQ</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  var categories = [
    { title: "Getting Started", faqs: [
      {q:"How do I join?", a:"You need an invite code from a current member. They can generate one from <b>More → Members → Invite</b>. Enter the code when creating your account. You'll go through a quick onboarding flow to set up your profile."},
      {q:"How do I log a round?", a:"Two ways: <b>Play Now</b> (bottom nav) for live hole-by-hole scoring during your round, or <b>Activity → Log a Round</b> to enter scores after you play. Both earn ParCoins, XP, and count toward your handicap."},
      {q:"How does my handicap work?", a:"Your handicap calculates automatically after 3 rounds using the official WHS formula — best score differentials × 0.96. It updates every time you log a round. Tap your handicap on your profile to see the full breakdown."},
      {q:"Can I change my username?", a:"Nope — it's permanent. But you can change your display name, nickname, bio, and photo anytime from <b>your profile → Edit profile</b>."}
    ]},
    { title: "ParCoins & Shop", faqs: [
      {q:"What are ParCoins?", a:"The in-game currency. You earn them by playing rounds (25-75 per round), hitting the range (10-20), unlocking achievements (25-100), daily logins (1-3), and more. Spend them in the <b>Cosmetics Shop</b> on profile borders, banners, and card themes. They have zero real-world cash value."},
      {q:"Where is the shop?", a:"<b>More → Cosmetics Shop</b>. Browse borders, banners, and card themes. Your coin balance shows at the top. Buy an item, then equip it from the shop page."},
      {q:"What are Power-Ups?", a:"<b>More → Rich List & Power-Ups</b>. Double XP Round (150 coins) makes your next round earn 2× XP. Handicap Shield (100 coins) excludes one bad round from your handicap."},
      {q:"What is the Rich List?", a:"Top 10 lifetime ParCoin earners, visible to all members. Hit 10,000 lifetime coins and you earn the Gold Member badge automatically."}
    ]},
    { title: "Wagers & Bounties", faqs: [
      {q:"How do wagers work?", a:"<b>More → Wagers → New Wager</b>. Pick an opponent, choose a type (Stroke Play, Best 9, Most Pars, Fewest Putts, Nassau, or Beat Their Score), set a coin amount. Your coins go into escrow. When both of you play the same course on the same day, the wager resolves automatically."},
      {q:"What's a Nassau wager?", a:"Three bets in one — front 9, back 9, and total. The coin amount is per leg, so a 50-coin Nassau costs 150 total. Each leg resolves independently."},
      {q:"What's Beat Their Score?", a:"Bet that you can beat a friend's personal best at a specific course. You pick the opponent and course, and it shows their best score as the target. You just need to play that course and beat it."},
      {q:"How do bounties work?", a:"<b>More → Bounty Board → Post Bounty</b>. Set a target score at a course (or birdie a specific hole) and put up coins. Anyone who hits the target claims the pot. Bounties expire after 7-30 days."}
    ]},
    { title: "Events & Seasons", faqs: [
      {q:"How do events work?", a:"The Commissioner creates events with courses, formats, and members. During the event, a scorekeeper enters scores on the live scorecard. After all rounds are attested (confirmed), the event closes and a champion is crowned. Find events on the <b>Events tab</b>."},
      {q:"What is attestation?", a:"After an event round, every player confirms their scores are correct. This prevents disputes. Once everyone attests (or the Commissioner overrides), scores are finalized."},
      {q:"How do seasons work?", a:"Three seasons per year: Spring (Mar-May), Summer (Jun-Aug), Fall (Sep-Nov). Each season has its own standings with points that reset. Tap the season tabs on the <b>Standings</b> page to switch. Season awards are given at the end of each season."},
      {q:"What formats are available?", a:"Stroke Play, Stableford, Scramble, Best Ball, Match Play, Skins, Chapman, and Shamble. The Commissioner picks the format when creating an event."}
    ]},
    { title: "Social & Community", faqs: [
      {q:"What are Trash Talk actions?", a:"Spend ParCoins to mess with your friends. <b>Spotlight of Shame</b> (75 coins) pins their worst round to the feed. <b>Victory Lap</b> (50) plays a celebration on their screen. <b>Demand a Rematch</b> (30) posts a public challenge. Find these buttons on any player's profile."},
      {q:"How do DMs work?", a:"Tap the chat icon in the top nav bar → pick a member to message. Unread conversations show a blue indicator. Messages are private between you two."},
      {q:"How do tee times work?", a:"Post a tee time from <b>Tee Times</b> (or the + Tee Time quick action on home). Set the course, date, time, and spots. Other members RSVP to accept, maybe, or decline."},
      {q:"Where's the Clubhouse?", a:"The chat icon in the nav bar. It's the group feed — post updates, trash talk, share thoughts. Also has an embedded calendar for scheduling."}
    ]},
    { title: "Courses & Range", faqs: [
      {q:"How do I find courses?", a:"<b>Courses tab</b> in the bottom nav. Search 30,000+ courses via the golf course API. Courses you've played show your best scores. Tap any course for hole-by-hole details and tee info."},
      {q:"How does the range tracker work?", a:"Tap <b>Range</b> from the home quick actions. Pick drills (or skip), start the timer, practice, then end and rate your session. Earn ParCoins and XP. Your range stats show on the Activity page."},
      {q:"What are scramble teams?", a:"<b>More → Scramble Teams</b>. Create a team (2-4 players), log matches against other teams, track W-L records. Scramble rounds from events are automatically associated with your team."}
    ]},
    { title: "Profile & Achievements", faqs: [
      {q:"How do themes work?", a:"<b>Settings → Theme</b>. 8 premium themes with unique colors and background textures. Champion Red is locked until you win an event. Your theme syncs across all your devices."},
      {q:"What's the Trophy Room?", a:"Tap the XP bar on any profile. 50+ achievements across categories like Milestones, Scoring, Exploration, and more. Each achievement has an icon, description, and XP reward. Unlock them by playing golf."},
      {q:"How do titles work?", a:"Your title shows under your name on your profile. You unlock new titles by reaching levels (Weekend Warrior at Lv. 5, G.O.A.T. at Lv. 100) or earning specific achievements (Champion, Ace Maker, etc.). Equip any unlocked title from your profile."},
      {q:"What's the Scorekeeper role?", a:"During events, the Commissioner can assign a scorekeeper per course. The scorekeeper can enter scores for all players. Once scores are locked, only the Commissioner can edit them."}
    ]}
  ];

  var faqIdx = 0;
  categories.forEach(function(cat) {
    h += '<div class="section"><div class="sec-head"><span class="sec-title">' + cat.title + '</span></div>';
    cat.faqs.forEach(function(faq) {
      h += '<div class="card" style="cursor:pointer;margin-bottom:4px" onclick="toggleSection(\'faq-' + faqIdx + '\')">';
      h += '<div class="card-body" style="padding:12px 14px"><div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div style="font-size:13px;font-weight:600;color:var(--cream);flex:1;padding-right:8px">' + faq.q + '</div>';
      h += '<span id="faq-' + faqIdx + '-toggle" style="display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" width="12" height="12"><path d="M9 18l6-6-6-6"/></svg></span></div>';
      h += '<div id="faq-' + faqIdx + '" class="hidden" style="margin-top:10px;font-size:12px;color:var(--muted);line-height:1.7">' + faq.a + '</div>';
      h += '</div></div>';
      faqIdx++;
    });
    h += '</div>';
  });

  h += '<div style="padding:16px;text-align:center"><button class="btn full outline" onclick="openFeatureRequest()" style="display:flex;align-items:center;justify-content:center;gap:8px"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Submit a Feature Request</button></div>';

  document.querySelector('[data-page="faq"]').innerHTML = h;
});


// ========== FEATURE REQUEST ==========
function openFeatureRequest() {
  var name = currentProfile ? (currentProfile.name || currentProfile.username) : "Member";
  var feature = prompt("Describe the feature you'd like to see:");
  if (!feature || !feature.trim()) return;
  
  if (db && currentUser) {
    // Save to Firestore
    db.collection("feature_requests").add({
      from: currentUser.uid,
      fromName: name,
      request: feature,
      status: "new",
      createdAt: fsTimestamp()
    });
    
    // Find commissioner and send notification
    db.collection("members").where("role","==","commissioner").get().then(function(snap) {
      snap.forEach(function(doc) {
        sendNotification(doc.id, {
          type: "feature_request",
          title: "Feature Request",
          message: name + ": " + feature.substring(0, 80) + (feature.length > 80 ? "..." : ""),
          linkPage: "admin"
        });
      });
    });
    
    // Also post to activity feed so everyone can see/discuss
    db.collection("chat").add(leagueDoc("chat", {
      id: genId(),
      text: name + " submitted a feature request: \"" + feature.substring(0, 100) + (feature.length > 100 ? "..." : "") + "\"",
      authorId: "system",
      authorName: "Parbaughs",
      createdAt: fsTimestamp(),
      type: "feature_request"
    }))(function(){});
    
    Router.toast("Request sent! The Commissioner has been notified.");
  } else {
    Router.toast("Sign in to submit requests");
  }
}
