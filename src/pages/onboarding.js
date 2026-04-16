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
      icon: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="32" cy="32" r="28"/><path d="M20 32l8 8 16-16"/></svg>',
      title: "Welcome to " + (window._activeLeagueName || "Parbaughs"),
      sub: "This isn't another golf app. It's a private league for your crew — where every round matters, every rivalry is tracked, and every moment becomes a story.",
      detail: "Members only. Invite only. Your home course."
    },
    {
      icon: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="32" cy="12" r="6"/><path d="M20 54l12-18 12 18"/><path d="M32 24v12"/></svg>',
      title: "Log Every Round",
      sub: "Tap Play Now for live hole-by-hole scoring on the course, or log rounds after you play. FIR, GIR, putts — full stat tracking. Your handicap calculates automatically after 3 rounds.",
      detail: "Find it: Play button on the home screen"
    },
    {
      icon: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M8 52h48"/><rect x="12" y="28" width="8" height="24" rx="1"/><rect x="28" y="16" width="8" height="36" rx="1"/><rect x="44" y="36" width="8" height="16" rx="1"/></svg>',
      title: "Seasons & Events",
      sub: "Three seasons per year — Spring, Summer, Fall. Compete in events with your crew, earn season points, and chase end-of-season awards. The Commissioner crowns champions.",
      detail: "Find it: Events tab + Standings page"
    },
    {
      icon: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="32" cy="32" r="22"/><path d="M32 18v14"/><path d="M24 24h5a3 3 0 010 6H24"/><path d="M24 30h6a3 3 0 010 6H24"/><path d="M32 36v8"/></svg>',
      title: "Earn & Spend ParCoins",
      sub: "Every round, range session, and achievement earns ParCoins. Spend them on profile cosmetics, wager with friends, post bounties, or flex on the Rich List. Playing earns 5-10x more than just logging in.",
      detail: "Find it: More → Cosmetics Shop, Wagers, Bounties"
    },
    {
      icon: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="var(--gold)" stroke-width="1.5"><path d="M32 10l6 12 14 2-10 10 2 14-12-6-12 6 2-14L12 24l14-2z"/></svg>',
      title: "Your Legacy Starts Now",
      sub: "50+ achievements to unlock. XP levels from Rookie to G.O.A.T. Head-to-head rivalries. Shareable scorecards. 8 premium themes. This is your golf story — let's set up your profile.",
      detail: ""
    }
  ];

  if (_onboardingStep >= steps.length) {
    renderProfileSetup();
    return;
  }

  var s = steps[_onboardingStep];
  var isLast = _onboardingStep === steps.length - 1;

  var h = '<div style="min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;background:linear-gradient(180deg,var(--grad-hero),var(--bg))">';

  // Progress dots
  h += '<div style="display:flex;gap:8px;margin-bottom:32px">';
  for (var i = 0; i < steps.length; i++) {
    var dotColor = i === _onboardingStep ? 'var(--gold)' : 'var(--bg3)';
    var dotWidth = i === _onboardingStep ? '24px' : '8px';
    h += '<div style="width:' + dotWidth + ';height:8px;border-radius:4px;background:' + dotColor + ';transition:all .3s"></div>';
  }
  h += '</div>';

  // Icon
  h += '<div style="margin-bottom:24px;opacity:.9">' + s.icon + '</div>';

  // Title
  h += '<div style="font-family:Playfair Display,serif;font-size:24px;font-weight:800;color:var(--gold);letter-spacing:1px;margin-bottom:12px">' + s.title + '</div>';

  // Subtitle
  h += '<div style="font-size:14px;color:var(--cream);line-height:1.6;max-width:320px;margin-bottom:8px">' + s.sub + '</div>';

  // Detail
  h += '<div style="font-size:12px;color:var(--muted);margin-bottom:40px">' + s.detail + '</div>';

  // Buttons
  h += '<div style="width:100%;max-width:300px">';
  h += '<button class="btn full green" onclick="advanceOnboarding()" style="font-size:14px;padding:16px;font-weight:600">' + (isLast ? 'Set up profile' : 'Continue') + '</button>';
  if (_onboardingStep === 0) {
    h += '<button class="btn full outline" onclick="skipOnboarding()" style="margin-top:8px;font-size:12px;padding:12px">Skip for now</button>';
  }
  h += '</div></div>';

  el.innerHTML = h;
}

function advanceOnboarding() {
  _onboardingStep++;
  renderOnboardingStep();
}

function skipOnboarding() {
  // Mark onboarding as complete
  if (db && currentUser) {
    db.collection("members").doc(currentUser.uid).set({ onboardingComplete: true }, { merge: true }).catch(function(){});
  }
  if (currentProfile) currentProfile.onboardingComplete = true;
  Router.go("home");
}

/* ================================================
   PROFILE SETUP WIZARD — Step 4 of onboarding
   ================================================ */
function renderProfileSetup() {
  var el = document.querySelector('[data-page="onboarding"]');
  if (!el) { Router.go("home"); return; }
  var p = currentProfile || {};

  var h = '<div style="min-height:100vh;min-height:100dvh;padding:32px 24px;background:linear-gradient(180deg,var(--grad-hero),var(--bg))">';

  // Header
  h += '<div style="text-align:center;margin-bottom:24px">';
  h += '<div style="font-family:Playfair Display,serif;font-size:20px;font-weight:700;color:var(--gold);margin-bottom:4px">Set up your profile</div>';
  h += '<div style="font-size:11px;color:var(--muted)">You can always change this later in settings</div>';
  h += '</div>';

  // Avatar upload
  h += '<div style="text-align:center;margin-bottom:20px">';
  h += '<div id="onb-avatar" style="width:88px;height:88px;border-radius:50%;background:var(--bg3);border:3px solid var(--gold2);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden" onclick="onboardingUploadPhoto()">';
  if (p.photo || (typeof photoCache !== "undefined" && photoCache["member:" + (currentUser ? currentUser.uid : "")])) {
    var src = p.photo || photoCache["member:" + currentUser.uid] || "";
    h += '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover" alt="">';
  } else {
    h += '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }
  h += '</div>';
  h += '<div style="font-size:10px;color:var(--gold);cursor:pointer" onclick="onboardingUploadPhoto()">Tap to add photo</div>';
  h += '</div>';

  // Form fields
  h += '<div class="form-section" style="max-width:380px;margin:0 auto">';

  // Display name (pre-filled from registration)
  h += '<div class="ff"><label class="ff-label">Display name</label>';
  h += '<input type="text" class="ff-input" id="onb-name" value="' + escHtml(p.name || '') + '" placeholder="Your name"></div>';

  // Username (pre-filled)
  h += '<div class="ff"><label class="ff-label">Username</label>';
  h += '<input type="text" class="ff-input" id="onb-username" value="' + escHtml(p.username || '') + '" placeholder="@username" maxlength="20"></div>';

  // Handicap range
  h += '<div class="ff"><label class="ff-label">Your typical score range</label>';
  h += '<select class="ff-input" id="onb-range" style="padding:11px 12px">';
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
  h += '<textarea class="ff-input" id="onb-bio" rows="2" placeholder="What should other members know about you?" style="min-height:48px">' + escHtml(p.bio || '') + '</textarea></div>';

  // Push notification opt-in
  if ('Notification' in window && Notification.permission === 'default') {
    h += '<div style="margin:12px 0;padding:12px;background:rgba(var(--gold-rgb),.06);border:1px solid rgba(var(--gold-rgb),.12);border-radius:var(--radius)">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="1.5" style="flex-shrink:0"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';
    h += '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:var(--cream)">Enable notifications?</div>';
    h += '<div style="font-size:10px;color:var(--muted);margin-top:2px">Get alerts for DMs, tee times, and event results</div></div>';
    h += '<label style="position:relative;width:44px;height:24px;flex-shrink:0"><input type="checkbox" id="onb-push" style="opacity:0;width:0;height:0"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--bg3);border-radius:12px;transition:.3s"></span></label>';
    h += '</div></div>';
  }

  // Submit
  h += '<button class="btn full green" onclick="submitOnboardingProfile()" style="font-size:14px;padding:16px;font-weight:600;margin-top:8px">Let\'s go!</button>';
  h += '<button class="btn full outline" onclick="skipOnboarding()" style="margin-top:8px;font-size:11px;padding:10px">Skip for now</button>';

  h += '</div></div>';

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
  if (!username || username.length < 3) { Router.toast("Username must be 3+ characters"); return; }

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
      Router.toast("Profile saved! Welcome to " + (window._activeLeagueName || "Parbaughs") + ".");
      Router.go("home");
    }).catch(function() {
      if (currentProfile) Object.assign(currentProfile, updates);
      Router.go("home");
    });
  } else {
    if (currentProfile) Object.assign(currentProfile, updates);
    Router.go("home");
  }
}
