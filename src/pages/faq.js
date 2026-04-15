// ========== FAQ PAGE ==========
Router.register("faq", function() {
  var h = '<div class="sh"><h2>FAQ</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';
  
  var faqs = [
    { q: "How do I join the Parbaughs?", a: "You need an invite code from an existing member. They can generate one from the Members page. Enter the code when creating your account." },
    { q: "How do I add a course?", a: "When logging a round via Play Now or Log a Round, tap the course search field and type the course name. The app searches 30,000+ courses automatically. If your course doesn't appear in the results, scroll down and tap 'Add manually' to enter the name, location, and par. Manually added courses are saved to your account for future rounds." },
    { q: "What is a Parbaugh Round?", a: "A real-time shared scorecard. One person creates the round and others join. Everyone sees scores update live on their own phone. When finished, it saves as an individual round for each player." },
    { q: "How does the handicap work?", a: "Your handicap is calculated automatically after 3 rounds using your best scores, course rating, and slope. Manually entered handicaps are replaced once you have enough rounds logged." },
    { q: "What are Party Games?", a: "Fun side competitions during your round — Closest to Pin, Long Drive, Putt-Off, and more. Start one from the Party Games page. The winner earns bonus XP." },
    { q: "How does XP and leveling work?", a: "You earn XP by logging rounds, winning events, completing achievements, and participating in party games. XP levels you up from Rookie (LV1) to G.O.A.T. (LV100). Tap the XP bar on any profile to see the Trophy Room." },
    { q: "What is score attestation?", a: "After a tournament round, all players must confirm the scorecard is accurate. This prevents disputes and earns bonus XP for verified rounds." },
    { q: "How do season standings work?", a: "The Parbaughs season runs March 1 through September 30. Points are earned through live rounds, event finishes, and participation. Only live-scored rounds count toward season rankings." },
    { q: "Can I change my username?", a: "No — your username is permanent and serves as your unique identifier. You can change your display name and nickname in your profile settings." },
    { q: "How do I invite someone?", a: "Go to Members → Invite New Member → Generate Invite Code. Share the code with the person. You have a limited number of invites — ask the Commissioner if you need more." },
    { q: "What does the Commissioner do?", a: "The Commissioner manages the league — creating events, moderating the feed, suspending members for violations, managing invite quotas, and posting official results." },
    { q: "How do I report a member?", a: "Tap their profile → Report. Choose a reason and add details. The report goes directly to the Commissioner for review." },
    { q: "I found a bug or have a feature idea!", a: "Tap Feature Request at the bottom of the home page to send your idea directly to the Commissioner." },
    { q: "What are score differentials?", a: "A score differential normalizes your round against course difficulty. The formula is (113 / Slope) x (Score - Rating). A 102 at a hard course (slope 140) produces a lower differential than a 95 at an easy course (slope 100). Your handicap index is the average of your best differentials — it measures your potential, not your average. Lower differentials = better golf. The number of differentials used depends on how many rounds you have: 3-5 rounds uses your best 1, 6-8 uses best 2, and so on up to best 8 of 20." }
  ];
  
  faqs.forEach(function(faq, i) {
    h += '<div class="card" style="cursor:pointer" onclick="toggleSection(\'faq-' + i + '\')">';
    h += '<div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center">';
    h += '<div style="font-size:13px;font-weight:600;color:var(--cream);flex:1;padding-right:8px">' + faq.q + '</div>';
    h += '<span id="faq-' + i + '-toggle" style="font-size:10px;color:var(--muted);display:inline-flex;transition:transform .2s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="transition:transform .2s;color:var(--muted)"><path d="M9 18l6-6-6-6"/></svg></span></div>';
    h += '<div id="faq-' + i + '" class="hidden" style="margin-top:8px;font-size:12px;color:var(--muted);line-height:1.6">' + faq.a + '</div>';
    h += '</div></div>';
  });
  
  h += '<div style="padding:20px 16px;text-align:center"><button class="btn full outline" onclick="openFeatureRequest()">Submit a Feature Request</button></div>';
  
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
    db.collection("chat").add({
      id: genId(),
      text: name + " submitted a feature request: \"" + feature.substring(0, 100) + (feature.length > 100 ? "..." : "") + "\"",
      authorId: "system",
      authorName: "Parbaughs",
      createdAt: fsTimestamp(),
      type: "feature_request"
    }).catch(function(){});
    
    Router.toast("Request sent! The Commissioner has been notified.");
  } else {
    Router.toast("Sign in to submit requests");
  }
}
