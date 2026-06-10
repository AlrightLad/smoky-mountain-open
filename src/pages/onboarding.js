/* ================================================
   PAGE: ONBOARDING — First-time user welcome flow
   3 screens + profile setup wizard
   ================================================ */

var _onboardingStep = 0;

Router.register("onboarding", function() {
  _onboardingStep = 0;
  renderOnboardingStep();
});

function renderOnboardingStep() {
  var el = document.querySelector('[data-page="onboarding"]');
  if (!el) { Router.go("home"); return; }

  var steps = [
    {
      eyebrow: "Welcome",
      icon: '<svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><circle cx="32" cy="32" r="28"/><path d="M20 32l8 8 16-16"/></svg>',
      title: "Welcome to " + (window._activeLeagueName || "Parbaughs") + ".",
      sub: "This isn't another golf app. It's a private league for your crew, where every round matters, every rivalry is tracked, and every moment becomes a story.",
      detail: "Members only. Invite only. Your home course.",
      quote: "A small platform with a large invitation."
    },
    {
      eyebrow: "On the course",
      icon: '<svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><circle cx="32" cy="12" r="6"/><path d="M20 54l12-18 12 18"/><path d="M32 24v12"/></svg>',
      title: "Log every round.",
      sub: "Tap Play Now for live hole-by-hole scoring on the course, or log rounds after you play. FIR, GIR, putts: full stat tracking. Your handicap calculates automatically after 3 rounds.",
      detail: "Find it: Play button on the home screen",
      quote: "Every round is worth remembering."
    },
    {
      eyebrow: "The season",
      icon: '<svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><path d="M8 52h48"/><rect x="12" y="28" width="8" height="24" rx="1"/><rect x="28" y="16" width="8" height="36" rx="1"/><rect x="44" y="36" width="8" height="16" rx="1"/></svg>',
      title: "Seasons and events.",
      sub: "Three seasons per year: Spring, Summer, Fall. Compete in events with your crew, earn season points, and chase end-of-season awards. The Commissioner crowns champions.",
      detail: "Find it: Events tab + Standings page",
      quote: "Three seasons. One long rivalry."
    },
    {
      eyebrow: "ParCoins",
      icon: '<svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><circle cx="32" cy="32" r="22"/><path d="M32 18v14"/><path d="M24 24h5a3 3 0 010 6H24"/><path d="M24 30h6a3 3 0 010 6H24"/><path d="M32 36v8"/></svg>',
      title: "Earn and spend ParCoins.",
      sub: "Every round, range session, and achievement earns ParCoins. Spend them on profile cosmetics, wager with friends, post bounties, or flex on the Rich List. Playing earns far more than just logging in.",
      detail: "Find it: More, then Cosmetics Shop, Wagers, Bounties",
      quote: "Play more than you post."
    },
    {
      eyebrow: "Your legacy",
      icon: '<svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><path d="M32 10l6 12 14 2-10 10 2 14-12-6-12 6 2-14L12 24l14-2z"/></svg>',
      title: "Your legacy starts now.",
      sub: "50+ achievements to unlock. XP levels from Rookie to G.O.A.T. Head-to-head rivalries. Shareable scorecards. Premium themes. This is your golf story. Let's set up your profile.",
      detail: "",
      quote: "The clubhouse keeps the records."
    }
  ];

  if (_onboardingStep >= steps.length) {
    renderProfileSetup();
    return;
  }

  var s = steps[_onboardingStep];
  var isLast = _onboardingStep === steps.length - 1;
  var total = steps.length + 1;          // 5 intro screens + profile setup
  var stepNum = _onboardingStep + 1;
  var fillPct = Math.round((stepNum / total) * 100);

  var h = '<div class="onb">';
  h += '<div class="onb-progress"><div class="onb-progress__fill" style="width:' + fillPct + '%"></div></div>';
  h += '<div class="onb-split">';

  // Felt aside — wordmark + step art + editorial quote
  h += '<aside class="onb-aside" role="complementary">';
  h += '<div class="onb-wordmark">Parbaughs.</div>';
  h += '<div class="onb-art">' + s.icon + '</div>';
  h += '<div class="onb-quote">' + s.quote + '</div>';
  h += '</aside>';

  // Chalk main — step content
  h += '<div class="onb-main" role="main">';
  h += '<div class="onb-counter">Step ' + stepNum + ' of ' + total + '</div>';
  h += '<div class="onb-eyebrow">' + s.eyebrow + '</div>';
  h += '<h1 class="onb-headline">' + s.title + '</h1>';
  h += '<p class="onb-body">' + s.sub + '</p>';
  if (s.detail) h += '<div class="onb-detail">' + s.detail + '</div>';
  h += '<div class="onb-actions">';
  h += '<button class="onb-btn" onclick="advanceOnboarding()">' + (isLast ? 'Set up profile' : 'Continue') + ' &rarr;</button>';
  if (_onboardingStep === 0) {
    h += '<button class="onb-link" onclick="skipOnboarding()">Skip for now</button>';
  }
  h += '</div>';
  h += '</div>';   // .onb-main

  h += '</div>';   // .onb-split
  h += '</div>';   // .onb

  el.innerHTML = h;
}

function advanceOnboarding() {
  _onboardingStep++;
  renderOnboardingStep();
}

function skipOnboarding() {
  // v8.24.16 — Ralph-review fix: Skip used to permanently complete the whole
  // tour from screen 1, silently skipping PROFILE SETUP (name + username).
  // Now Skip fast-forwards to the profile step — the one screen that matters —
  // and only completes from there. (Settings -> About can replay the tour.)
  // Any index >= steps.length renders profile setup (renderOnboardingStep:60),
  // so 99 is robust to intro-screen count changes.
  if (!currentProfile || !currentProfile.onboardingComplete) {
    if (_onboardingStep < 99) { _onboardingStep = 99; renderOnboardingStep(); return; }
  }
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).set({ onboardingComplete: true }, { merge: true }).catch(function(){});
  }
  if (currentProfile) currentProfile.onboardingComplete = true;
  if (typeof startLeagueDataSync === "function") startLeagueDataSync();
  Router.go("home");
}

/* ================================================
   PROFILE SETUP WIZARD — Step 4 of onboarding
   ================================================ */
function renderProfileSetup() {
  var el = document.querySelector('[data-page="onboarding"]');
  if (!el) { Router.go("home"); return; }
  var p = currentProfile || {};

  var h = '<div class="onb">';
  h += '<div class="onb-progress"><div class="onb-progress__fill" style="width:100%"></div></div>';
  h += '<div class="onb-split">';

  // Felt aside — wordmark + nameplate engraving + editorial quote
  h += '<aside class="onb-aside" role="complementary">';
  h += '<div class="onb-wordmark">Parbaughs.</div>';
  h += '<div class="onb-art"><svg viewBox="0 0 64 64" width="86" height="86" fill="none" stroke="var(--cb-brass)" stroke-width="1.5"><rect x="8" y="18" width="48" height="28" rx="2"/><path d="M16 29h22"/><path d="M16 37h32"/><circle cx="46" cy="29" r="3.5"/></svg></div>';
  h += '<div class="onb-quote">The clubhouse engraves your nameplate once.</div>';
  h += '</aside>';

  // Chalk main — profile form
  h += '<div class="onb-main" role="main">';
  h += '<div class="onb-counter">Step 6 of 6</div>';
  h += '<div class="onb-eyebrow">Your identity</div>';
  h += '<h1 class="onb-headline">Set up your profile.</h1>';
  h += '<p class="onb-body">You can change any of this later in settings.</p>';

  h += '<div class="onb-form">';

  // Avatar
  h += '<div id="onb-avatar" class="onb-avatar" onclick="onboardingUploadPhoto()">';
  if (p.photo || (typeof photoCache !== "undefined" && photoCache["member:" + (currentUser ? currentUser.uid : "")])) {
    var src = p.photo || photoCache["member:" + currentUser.uid] || "";
    h += '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover" alt="">';
  } else {
    h += '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="var(--cb-chalk)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }
  h += '</div>';
  h += '<div class="onb-avatar-cta" onclick="onboardingUploadPhoto()">Add photo</div>';

  // Display name (pre-filled from registration)
  h += '<div class="ff" style="margin-top:18px"><label class="ff-label">Display name</label>';
  h += '<input type="text" class="ff-input" id="onb-name" value="' + escHtml(p.name || '') + '" placeholder="Your name"></div>';

  // Username (pre-filled)
  h += '<div class="ff"><label class="ff-label">Username</label>';
  h += '<input type="text" class="ff-input" id="onb-username" value="' + escHtml(p.username || '') + '" placeholder="@username" maxlength="20"></div>';

  // Handicap range
  h += '<div class="ff"><label class="ff-label">Your typical score range</label>';
  h += '<select class="ff-input" id="onb-range">';
  var ranges = ["Not sure yet","Under 80","80-89","90-99","100-109","110-119","120+","Brand new to golf"];
  ranges.forEach(function(r) {
    h += '<option value="' + r + '"' + (p.range === r ? ' selected' : '') + '>' + r + '</option>';
  });
  h += '</select></div>';

  // Home course (optional)
  h += '<div class="ff"><label class="ff-label">Home course (optional)</label>';
  h += '<input type="text" class="ff-input" id="onb-homecourse" value="' + escHtml(p.homeCourse || '') + '" placeholder="e.g. Heritage Hills"></div>';

  // Bio (optional)
  h += '<div class="ff"><label class="ff-label">Short bio (optional)</label>';
  h += '<textarea class="ff-input" id="onb-bio" rows="2" placeholder="What should other members know about you?">' + escHtml(p.bio || '') + '</textarea></div>';

  // Push notification opt-in
  if ('Notification' in window && Notification.permission === 'default') {
    h += '<div class="onb-push">';
    h += '<div style="flex:1"><div class="onb-push__title">Enable notifications</div>';
    h += '<div class="onb-push__sub">Alerts for DMs, tee times, and event results</div></div>';
    h += '<label class="onb-toggle"><input type="checkbox" id="onb-push"><span class="onb-toggle__track"></span></label>';
    h += '</div>';
  }

  // Actions
  h += '<div class="onb-actions">';
  h += '<button class="onb-btn" onclick="submitOnboardingProfile()">Enter the clubhouse &rarr;</button>';
  h += '<button class="onb-link" onclick="skipOnboarding()">Skip for now</button>';
  h += '</div>';

  h += '</div>';   // .onb-form
  h += '</div>';   // .onb-main

  h += '</div>';   // .onb-split
  h += '</div>';   // .onb

  el.innerHTML = h;
}

function onboardingUploadPhoto() {
  Router.handlePhotoUpload(function(dataUrl) {
    compressPhoto(dataUrl, PHOTO_MAX_KB, 400, function(compressed) {
      var avEl = document.getElementById("onb-avatar");
      if (avEl) avEl.innerHTML = '<img src="' + compressed + '" style="width:100%;height:100%;object-fit:cover" alt="">';
      window._onbPhotoData = compressed;
    });
  });
}

function submitOnboardingProfile() {
  var name = (document.getElementById("onb-name").value || "").trim();
  var username = (document.getElementById("onb-username").value || "").trim();
  var range = document.getElementById("onb-range").value;
  var homeCourse = (document.getElementById("onb-homecourse").value || "").trim();
  var bio = (document.getElementById("onb-bio").value || "").trim();
  var pushEl = document.getElementById("onb-push");

  if (!name || name.length < 2) { Router.toast("Please enter your name"); return; }
  // v8.24.13 — baseline first-run fix: username was written RAW. Login resolves
  // username -> email via a toLowerCase() lookup (firebase.js), so a mixed-case
  // username broke that member's own sign-in; duplicates collided silently.
  // Normalize like account-creation does (lowercase), validate charset, and
  // check uniqueness against the member roster before engraving it.
  username = username.replace(/^@/, "").toLowerCase();
  if (!username || username.length < 3) { Router.toast("Username must be 3+ characters"); return; }
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) { Router.toast("Usernames use letters, numbers, dots, underscores only"); return; }
  var _unameTaken = (typeof PB !== "undefined" && PB.getPlayers) && PB.getPlayers().some(function(m) {
    if (currentUser && (m.id === currentUser.uid)) return false;
    return m.username && m.username.toLowerCase() === username;
  });
  if (_unameTaken) { Router.toast("That username is taken — pick another"); return; }

  var updates = {
    name: name,
    username: username,
    range: range !== "Not sure yet" ? range : "",
    homeCourse: homeCourse,
    bio: bio,
    onboardingComplete: true
  };

  // Save photo if uploaded
  if (window._onbPhotoData && currentUser) {
    savePhoto("member", currentUser.uid, window._onbPhotoData);
    delete window._onbPhotoData;
  }

  // Request push permission if opted in
  if (pushEl && pushEl.checked) {
    requestPushPermission();
  }

  // Write to Firestore
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).set(updates, { merge: true }).then(function() {
      if (currentProfile) Object.assign(currentProfile, updates);
      // v8.24.21 — league-scoped syncs were deferred during onboarding
      // (membership not ready -> rules denials); start them now.
      if (typeof startLeagueDataSync === "function") startLeagueDataSync();
      Router.toast("Profile saved! Welcome to " + (window._activeLeagueName || "Parbaughs") + ".");
      Router.go("home");
    }).catch(function(err) {
      // v8.24.13 — baseline fix: failure was silently swallowed (member walked
      // away believing their nameplate saved when nothing persisted). Surface
      // it and STAY on the form so they can retry.
      if (typeof pbWarn === "function") pbWarn("[onboarding] profile save failed:", err && err.message);
      Router.toast("Couldn't save your profile — check your connection and tap Save again.");
    });
  } else {
    if (currentProfile) Object.assign(currentProfile, updates);
    Router.go("home");
  }
}
