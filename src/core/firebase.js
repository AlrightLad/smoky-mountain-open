// Global error handler — log errors to Firestore for debugging
window.onerror = function(msg, url, line, col, error) {
  try {
    if (typeof db !== "undefined" && db) {
      db.collection("errors").add({
        message: String(msg).substring(0, 300),
        url: String(url || "").substring(0, 200),
        line: line,
        col: col,
        stack: error ? String(error.stack).substring(0, 800) : "",
        errorName: error ? (error.name || "") : "",
        userAgent: navigator.userAgent.substring(0, 150),
        page: typeof Router !== "undefined" ? Router.getPage() : "unknown",
        userId: (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : "anonymous",
        userName: (typeof currentProfile !== "undefined" && currentProfile) ? (currentProfile.name || currentProfile.username || "") : "",
        timestamp: new Date().toISOString(),
        appVersion: typeof APP_VERSION !== "undefined" ? APP_VERSION : "unknown",
        resolved: false
      }).catch(function(){});
    }
  } catch(e) {}
  return false;
};

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", function(event) {
  try {
    if (typeof db !== "undefined" && db) {
      var msg = event.reason ? (event.reason.message || String(event.reason)) : "Unhandled promise rejection";
      db.collection("errors").add({
        message: msg.substring(0, 300),
        stack: event.reason && event.reason.stack ? String(event.reason.stack).substring(0, 500) : "",
        type: "unhandledrejection",
        userAgent: navigator.userAgent.substring(0, 150),
        page: typeof Router !== "undefined" ? Router.getPage() : "unknown",
        userId: (typeof currentUser !== "undefined" && currentUser) ? currentUser.uid : "anonymous",
        timestamp: new Date().toISOString(),
        resolved: false
      }).catch(function(){});
    }
  } catch(e) {}
});

// ========== FIREBASE INIT ==========
var PHOTO_MAX_KB = 80; // Target max photo size in KB after compression
var COURSE_DEFAULT_IMG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCABUAFQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDgs0ZpKK0JHZpc02imIdRmkzRmgBaM0maSgBc0maSkpDFzRSZopAP20oSnieIDmEZ/3jTluIs/6gf990XQEeylCVKZeMrCg9iSafEZJcBFhB9807oRB5Z9KXyzWrHYTty0lsg9MZqYW0MJ3TzwlfQJTAxPLPpSGM10In0hPvRhse9K2p6QiN5VvuIHA2dT6ZpaAc2Yz6U0xn0rphqOmSrwoU+hXFVZb6yyQIxkDOKNAuYflmitN723BG23YgjOaKNAMUAdzijkUDrxzQayLJojIwwgJxV6CIgZYgH0qrZruLbnKDHBxnJrohf2BjWM2SuQMfcAqkS2QWZQBsmIE/3s1Fd2YlO4XEWfQNVgsrS+YkSW6f3Fyc1KJVGNqjP0qeYkxG0+UKXDqQBnv+VUSx/Ct69mDjbkZ77ax5LbHKn8DRcpMg3nvzQTTWUqeRSE5pjFJJopM0UDEBo69KQVJGO5pAS25wQOefSrkEjCTacGqffjrU8BCc96TJZoBih45NO8wqNxPNVhLkdeajaYlqgmxMymQllO0+1JNcNLGkdwCwToQcUzzflqB5uoqkNDJRBsJUybuwIGKpHrVlipHzE/hVeQKD8uce9UixtFJRTAM1JH1qKnrxSYE27DA1MG4qtmnq2DSET7jSk96h30b6VhEm/FMc5ORTN1JmqAQmmEA05qZQUNIOaKdRTAaKcOlFFJgLThRRQAuaSiigANGaKKAEPSm0UUAFFFFMD/2Q==';
var fbApp, db, auth;
var firebaseAvailable = false;
try {
  if (typeof firebase !== "undefined") {
    fbApp = firebase.initializeApp({
      apiKey: "AIzaSyCKM8rm2zRqYb-UPVjiyj1u-Sv9mfBJwFk",
      authDomain: "parbaughs.firebaseapp.com",
      projectId: "parbaughs",
      storageBucket: "parbaughs.firebasestorage.app",
      messagingSenderId: "104772709228",
      appId: "1:104772709228:web:c5915f88e7f6868e28e149",
      measurementId: "G-N2L7BTC13C"
    });
    db = firebase.firestore();
    auth = firebase.auth();
    // Offline persistence disabled — causes stale IndexedDB cache issues for a real-time community app.
    // Firestore real-time listeners handle live sync; server is always authoritative.
    var _pbSearch = window.location.search;
    var _pbEmulatorMode = _pbSearch.indexOf("emulator=1") !== -1;
    // ?smoke=1 — automated smoke runs (tests/smoke/) hit PRODUCTION Firestore,
    // not the emulator. Headless Playwright cannot establish a Firestore
    // WebChannel stream, so onSnapshot delivers only its initial snapshot and
    // silently drops every subsequent server push — admin-SDK docs seeded
    // mid-run never reach the browser listener (S3-S8 froze on the pre-seed
    // snapshot). Force long-polling for this automated context so realtime
    // updates land. Real members in real browsers are unaffected: no smoke
    // param, default WebChannel transport, no useEmulator redirect.
    var _pbSmokeMode = _pbSearch.indexOf("smoke=1") !== -1;
    if (_pbEmulatorMode || _pbSmokeMode) {
      // Force long-polling. Playwright's webkit/headless contexts fail to
      // establish a Firestore WebChannel stream, so the SDK waits ~15s before
      // auto-falling-back to long-polling — which stalled every `{ source:
      // 'server' }` fetch (and the loginAs fbMemberCache gate) past the test
      // timeout. Forcing it skips the detection wait. Automated contexts only;
      // production members keep default WebChannel detection.
      db.settings({ experimentalForceLongPolling: true });
    }
    if (_pbEmulatorMode) {
      // 2026-05-21 (Goal 2 A11 smoke fix hypothesis): use 127.0.0.1 not
      // localhost. Windows + Node 20+ resolves `localhost` to ::1 (IPv6)
      // by default; Firebase auth emulator binds to 127.0.0.1 (IPv4) only.
      // Result: auth/network-request-failed across all smoke tests.
      // The Firestore emulator binds dual-stack so 8080 was fine, but
      // 9099 isn't dual-stack in older firebase-tools versions.
      db.useEmulator("127.0.0.1", 8080);
      auth.useEmulator("http://127.0.0.1:9099", { disableWarnings: true });
      window._pbEmulator = true;
      pbLog("[FB] Emulator mode — Firestore 127.0.0.1:8080, Auth 127.0.0.1:9099");
    }
    firebaseAvailable = true;
    pbLog("[FB] Ready");
  } else {
    pbWarn("[FB] Firebase SDK not loaded — running in offline-only mode");
  }
} catch(e) { console.error("[FB] Init failed:", e); }

var currentUser = null, currentProfile = null;
var fbMemberCache = {}; // Firebase member profiles keyed by UID
var playerIdMap = {}; // Firebase UID → local player ID mapping for fast resolution

function showLogin() { document.getElementById("loginForm").classList.remove("hidden"); document.getElementById("registerForm").classList.add("hidden"); document.getElementById("forgotForm").classList.add("hidden"); clearErrors(); }
function showRegister() { 
  document.getElementById("loginForm").classList.add("hidden"); 
  document.getElementById("registerForm").classList.remove("hidden"); 
  document.getElementById("forgotForm").classList.add("hidden"); 
  clearErrors();
  
  // Reset claim selection
  document.getElementById("regClaimId").value = "";
  selectedClaimId = null;
  
  // Show claimable profiles ONLY for FOUNDING-FOUR invite code
  // Non-founding users should NEVER see or claim existing profiles
  var claimSection = document.getElementById("claimSection");
  if (claimSection) claimSection.classList.add("hidden");
  
  // Watch for FOUNDING-FOUR code to enable claim section
  var inviteInput = document.getElementById("regInvite");
  if (inviteInput) {
    inviteInput.removeEventListener("input", checkClaimEligibility);
    inviteInput.addEventListener("input", checkClaimEligibility);
  }
}

function checkClaimEligibility() {
  var invite = (document.getElementById("regInvite").value || "").trim().toUpperCase();
  var claimSection = document.getElementById("claimSection");
  var claimDiv = document.getElementById("claimProfiles");
  
  if (invite !== "FOUNDING-FOUR") {
    if (claimSection) claimSection.classList.add("hidden");
    document.getElementById("regClaimId").value = "";
    selectedClaimId = null;
    return;
  }
  
  // Only show claim for founding code
  var players = PB.getPlayers();
  if (players.length > 0 && db) {
    db.collection("members").get().then(function(snap) {
      // Build comprehensive "already claimed" set
      var claimedLocalIds = [];
      var existingUsernames = [];
      var existingNames = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        if (d.claimedFrom) claimedLocalIds.push(d.claimedFrom);
        if (d.username) existingUsernames.push(d.username.toLowerCase());
        if (d.name) existingNames.push(d.name.toLowerCase());
        // Any founding member already in Firestore is claimed
        if (d.isFoundingFour) {
          claimedLocalIds.push(d.claimedFrom || d.id);
        }
      });
      
      var unclaimed = players.filter(function(p) {
        // Already claimed by claimedFrom ID
        if (claimedLocalIds.indexOf(p.id) !== -1) return false;
        // Username already exists in Firestore
        if (p.username && existingUsernames.indexOf(p.username.toLowerCase()) !== -1) return false;
        // Name already matches a Firestore member (catches manual creates)
        if (p.name && existingNames.indexOf(p.name.toLowerCase()) !== -1) return false;
        return true;
      });
      
      if (unclaimed.length > 0 && claimDiv) {
        var ch = '';
        unclaimed.forEach(function(p) {
          ch += '<div onclick="selectClaimProfile(\'' + p.id + '\')" id="claim-' + p.id + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border:2px solid var(--border);border-radius:8px;cursor:pointer;transition:border-color .15s">';
          ch += '<div style="width:36px;height:36px;border-radius:50%;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">' + (p.emoji || "") + '</div>';
          ch += '<div style="flex:1;text-align:left"><div style="font-size:13px;font-weight:600;color:var(--cream)">' + escHtml(p.name) + '</div>';
          ch += '<div style="font-size:10px;color:var(--muted)">' + (p.range || "No range set") + (p.manualHandicap ? ' · HCP ' + p.manualHandicap : '') + '</div></div>';
          ch += '</div>';
        });
        claimDiv.innerHTML = ch;
        claimSection.classList.remove("hidden");
      } else if (claimSection) {
        claimSection.classList.add("hidden");
      }
    }).catch(function() { if (claimSection) claimSection.classList.add("hidden"); });
  }
}

var selectedClaimId = null;
function selectClaimProfile(pid) {
  // TOGGLE: if same profile tapped again, deselect it
  if (selectedClaimId === pid) {
    selectedClaimId = null;
    document.getElementById("regClaimId").value = "";
    // Clear all borders
    var items = document.querySelectorAll("#claimProfiles > div");
    items.forEach(function(el) { el.style.borderColor = "var(--border)"; });
    // Clear auto-filled username
    document.getElementById("regUsername").value = "";
    return;
  }
  
  selectedClaimId = pid;
  document.getElementById("regClaimId").value = pid || "";
  // Update visual selection
  var items = document.querySelectorAll("#claimProfiles > div");
  items.forEach(function(el) { el.style.borderColor = "var(--border)"; });
  if (pid) {
    var selected = document.getElementById("claim-" + pid);
    if (selected) selected.style.borderColor = "var(--gold)";
    // Auto-fill username from claimed profile
    var p = PB.getPlayer(pid);
    if (p && p.username) document.getElementById("regUsername").value = p.username;
    else if (p && p.name) document.getElementById("regUsername").value = p.name.replace(/\s+/g, "");
  }
}
function showForgot() { document.getElementById("loginForm").classList.add("hidden"); document.getElementById("registerForm").classList.add("hidden"); document.getElementById("forgotForm").classList.remove("hidden"); clearErrors(); }
function clearErrors() { ["loginError","regError","forgotError"].forEach(function(id) { var el = document.getElementById(id); el.textContent = ""; el.classList.remove("show"); el.style.color = ""; }); }
function showError(id, msg) { var el = document.getElementById(id); el.textContent = msg; el.classList.add("show"); }

function doLogin() {
  var emailInput = document.getElementById("loginEmail").value.trim();
  var pw = document.getElementById("loginPassword").value;
  if (!emailInput || !pw) { showError("loginError", "Enter email and password"); return; }
  var rl = checkLoginRateLimit(); if (rl) { showError("loginError", rl); return; }
  var btn = document.querySelector("#loginForm .auth-btn"); lockButton(btn);
  
  // If input doesn't contain @, try username-to-email lookup
  if (emailInput.indexOf("@") === -1 && db) {
    var usernameLower = emailInput.toLowerCase();
    db.collection("members").where("username", "==", usernameLower).limit(1).get().then(function(snap) {
      var email = null;
      snap.forEach(function(doc) { email = doc.data().email; });
      if (email) {
        doFirebaseLogin(email, pw, btn);
      } else {
        showError("loginError", "No account found for username \"" + emailInput + "\". Try your email address instead.");
        unlockButton(btn);
      }
    }).catch(function() {
      showError("loginError", "Enter your email address, not username");
      unlockButton(btn);
    });
  } else {
    doFirebaseLogin(emailInput, pw, btn);
  }
}

function doFirebaseLogin(email, pw, btn) {
  auth.signInWithEmailAndPassword(email, pw).then(function(cred) {
    pbLog("[Auth] Logged in:", cred.user.email); resetLoginAttempts();
  }).catch(function(e) {
    recordLoginFailure();
    var msg = "Login failed";
    // v8.25.235 — no email enumeration: user-not-found + wrong-password both return
    // the same generic message so an attacker can't probe which emails are registered.
    if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") msg = "Invalid email or password";
    else if (e.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
    showError("loginError", msg); unlockButton(btn);
  });
}

function doRegister() {
  // Rate limit: max 3 attempts per 10 minutes
  if (!window._regAttempts) window._regAttempts = [];
  var now = Date.now();
  window._regAttempts = window._regAttempts.filter(function(t) { return now - t < 600000; });
  if (window._regAttempts.length >= 3) { showError("regError", "Too many attempts. Please wait 10 minutes."); return; }
  window._regAttempts.push(now);

  var invite = document.getElementById("regInvite").value.trim().toUpperCase();
  var username = document.getElementById("regUsername").value.trim();
  var email = document.getElementById("regEmail").value.trim();
  var pw = document.getElementById("regPassword").value;
  if (!invite) { showError("regError", "Invite code required"); return; }
  if (!username || username.length < 3) { showError("regError", "Username must be 3+ characters"); return; }
  if (username.length > 20) { showError("regError", "Username max 20 characters"); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { showError("regError", "Username: letters, numbers, underscore only"); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("regError", "Enter a valid email"); return; }
  var pwErr = validatePassword(pw); if (pwErr) { showError("regError", pwErr); return; }

  var inviteRef = db.collection("invites").doc(invite); // still needed for the usedBy update after registration
  var isFoundingCode = (invite === "FOUNDING-FOUR");

  // Validate invite via Cloud Function — keeps Firestore rules locked to isAuth()
  var validatePromise = fetch("https://us-central1-parbaughs.cloudfunctions.net/validateInvite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: invite, email: email })
  }).then(function(res) {
    if (!res.ok) throw new Error("Network error");
    return res.json();
  }).then(function(data) {
    return data; // {valid, reason, founding, createdBy}
  }).catch(function() {
    return { valid: false, reason: "Could not validate invite. Check your connection and try again." };
  });

  validatePromise.then(function(inv) {
    if (!inv.valid) { showError("regError", inv.reason); return Promise.reject("invalid"); }
    // Check username availability, but don't block if check fails
    var usernameCheck;
    try {
      usernameCheck = db.collection("members").where("username","==",username.toLowerCase()).get();
    } catch(e) {
      usernameCheck = Promise.resolve({empty:true});
    }
    return usernameCheck.then(function(snap) {
      if (snap && !snap.empty) { showError("regError", "Username already taken"); return Promise.reject("taken"); }
      return auth.createUserWithEmailAndPassword(email, pw);
    }).catch(function(e) {
      if (e === "taken") return Promise.reject("taken");
      if (e.code && e.code.indexOf("auth") !== -1) return Promise.reject(e);
      // Permission or other Firestore error on username check — skip it and proceed
      pbWarn("[Auth] Username check failed, proceeding:", e);
      return auth.createUserWithEmailAndPassword(email, pw);
    }).then(function(cred) {
      return cred.user.updateProfile({ displayName:username }).then(function() {
        // Send email verification
        cred.user.sendEmailVerification().catch(function(e) { pbWarn("[Auth] Email verification send failed:", e); });
        return cred.user;
      });
    }).then(function(user) {
      // First founding member becomes Commissioner, rest are members
      var isFirstFounder = isFoundingCode;
      var rolePromise = isFoundingCode 
        ? db.collection("members").where("isFoundingFour","==",true).get().then(function(snap) { return snap.size === 0 ? "commissioner" : "member"; })
        : Promise.resolve("member");
      
      // SAFETY NET: Only allow claiming profiles with FOUNDING-FOUR code
      // This prevents any leaked claimId from non-founding registrations
      var claimId = document.getElementById("regClaimId").value;
      if (!isFoundingCode) claimId = ""; // Force clear for non-founding users
      var claimedPlayer = claimId ? PB.getPlayer(claimId) : null;
      
      return rolePromise.then(function(assignedRole) {
        var profile;
        
        if (claimedPlayer) {
          // CLAIMING existing profile — only keep safe, non-privileged data
          profile = {
            id: user.uid,
            claimedFrom: claimId,
            username: username.toLowerCase(),  // v8.24.56 — email moved to members_private (privacy)
            name: claimedPlayer.name || username,
            nick: claimedPlayer.nick || "",
            bio: claimedPlayer.bio || "",
            range: claimedPlayer.range || "",
            emoji: claimedPlayer.emoji || "",
            photo: claimedPlayer.photo || null,
            homeCourse: claimedPlayer.homeCourse || "",
            favoriteCourse: claimedPlayer.favoriteCourse || "",
            clubs: claimedPlayer.clubs || {},
            bag: claimedPlayer.bag || {},
            funnyFacts: claimedPlayer.funnyFacts || [],
            bagPhoto: claimedPlayer.bagPhoto || "",
            // Privileged fields — always set from role/code, NEVER from claimed player
            role: assignedRole,
            title: isFoundingCode ? "The Original Four" + (assignedRole === "commissioner" ? " · Commissioner" : "") : "",
            equippedTitle: isFoundingCode ? "The Original Four" + (assignedRole === "commissioner" ? " · Commissioner" : "") : "",
            maxInvites: assignedRole === "commissioner" ? 999 : 3,
            invitesUsed: 0,
            invitedBy: inv.createdBy || "founding",
            isFoundingFour: isFoundingCode,
            founding: isFoundingCode,
            badges: isFoundingCode ? ["founder"] : [],
            xp: 0, level: 1,
            avgScore: null, bestRound: null, handicap: null,
            manualHandicap: claimedPlayer.manualHandicap || null,
            wins: 0, trips: 0,
            leagues: ["the-parbaughs"], activeLeague: "the-parbaughs",
            createdAt: fsTimestamp()
          };
          pbLog("[Auth] Claiming existing profile:", claimId, "→", user.uid);
        } else {
          // NEW profile — create from scratch
          // Determine league from invite (all existing invites have leagueId:"the-parbaughs")
          var _invLeague = inv.leagueId || "the-parbaughs";
          profile = {
            id:user.uid, username:username.toLowerCase(), name:username,  // v8.24.56 — email -> members_private
            nick:"", bio:"", range:"", photo:null, emoji:"", clubs:{}, facts:[],
            xp:0, level:1, badges:isFoundingCode ? ["founder"] : [],
            role:assignedRole,
            invitedBy:inv.createdBy||"founding", invitesUsed:0,
            maxInvites: assignedRole === "commissioner" ? 999 : 3,
            isFoundingFour:isFoundingCode, avgScore:null, bestRound:null, handicap:null,
            leagues:[_invLeague], activeLeague:_invLeague,
            createdAt:fsTimestamp()
          };
        }
        
        // v8.24.56 (sec #10) — email is PII; it lives in members_private/{uid}
        // (owner+founder readable only), never the public members doc that
        // every league member can read. Written first so it's never missing.
        db.collection("members_private").doc(user.uid).set({ email: email, createdAt: fsTimestamp() }, { merge: true }).catch(function(){});
        return db.collection("members").doc(user.uid).set(profile).then(function() {
          if (!isFoundingCode) inviteRef.update({ usedBy:user.uid, status:"used", usedAt:fsTimestamp() });
          
          // If claiming, also migrate rounds to the new UID
          if (claimedPlayer && claimId) {
            var rounds = PB.getPlayerRounds(claimId);
            rounds.forEach(function(r) {
              var rd = JSON.parse(JSON.stringify(r));
              rd.originalPlayerId = rd.player || rd.playerId;
              rd.player = user.uid;
              rd.playerId = user.uid;
              if (rd.id) syncRound(rd);
            });
          }
          
          currentProfile = profile;
          
          // Post welcome to activity feed with a funny ribb
          var welcomeName = profile.name || profile.username || "Someone";
          var welcomeRibbs = [
            welcomeName + " just joined the Parbaughs. Hide your trophies and lower your expectations.",
            welcomeName + " has entered the chat. The handicap leaderboard just got more interesting.",
            welcomeName + " is officially a Parbaugh. Their golf game? Remains to be seen.",
            "Breaking: " + welcomeName + " joined the Parbaughs. The course rangers have been notified.",
            "Welcome " + welcomeName + "! We hope your golf game is better than your timing.",
            welcomeName + " just signed up. Someone tell them we don't do mulligans here... okay fine, breakfast balls only.",
            welcomeName + " has joined. The leaderboard shuffles nervously.",
            welcomeName + " is now a Parbaugh. Their first round will either be legendary or legendary bad.",
            welcomeName + " walked in like they own the place. Prove it on the course.",
            welcomeName + " reporting for duty. The Commissioner has been alerted and the roasts are loading.",
            welcomeName + " just joined and already thinks they can beat you. They probably can't. Probably.",
            welcomeName + " is in. Someone get them a sleeve of balls, they'll need it.",
            welcomeName + " just entered the Parbaughs universe. Their handicap says one thing, their confidence says another.",
            welcomeName + " has joined. May their drives be long and their putts be short. We're not optimistic.",
            welcomeName + " is officially a member. The dress code is vibes only and the only rule is don't be slower than Nick."
          ];
          var ribb = welcomeRibbs[Math.floor(Math.random() * welcomeRibbs.length)];
          // v8.25.x — single canonical Caddy identity (see PB_CADDY in utils.js).
          postCaddyChat(ribb, { type: "welcome" });
        });
      });
    });
  }).catch(function(e) {
    if (e === "invalid" || e === "taken") return;
    var msg = "Registration failed";
    if (e.code === "auth/email-already-in-use") msg = "Email already registered";
    else if (e.code === "auth/weak-password") msg = "Password too weak";
    else if (e.code === "auth/invalid-email") msg = "Invalid email format";
    else if (e.code === "auth/operation-not-allowed") msg = "Email/password accounts not enabled";
    else if (e.code === "auth/network-request-failed") msg = "Network error, check your connection";
    else if (e.message) msg = "Registration failed: " + e.message;
    console.error("[Auth] Registration error:", e);
    showError("regError", msg);
    // Unlock button
    var btn = document.querySelector("#registerForm .auth-btn");
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; btn.style.opacity = "1"; }
  });
}

function doForgot() {
  var email = document.getElementById("forgotEmail").value.trim();
  if (!email) { showError("forgotError", "Enter your email address"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("forgotError", "Enter a valid email address"); return; }
  var btn = document.querySelector("#forgotForm .auth-btn"); lockButton(btn);
  auth.sendPasswordResetEmail(email).then(function() {
    var el = document.getElementById("forgotError");
    el.textContent = "Reset link sent to " + email + ", check your inbox and spam folder.";
    el.style.color = "var(--birdie)";
    el.classList.add("show");
    if (btn) { btn.textContent = "Sent!"; btn.style.opacity = "0.5"; }
  }).catch(function(e) {
    unlockButton(btn);
    var msg = "Could not send reset link";
    if (e.code === "auth/user-not-found") msg = "No account found with that email";
    else if (e.code === "auth/invalid-email") msg = "Enter a valid email address";
    else if (e.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
    showError("forgotError", msg);
  });
}

function doLogout(_confirmed) {
  // v8.24.17 — branded pbConfirm re-entry (was a native confirm()).
  if (!_confirmed) {
    pbConfirm({ title: "Sign out of Parbaughs?", message: "The clubhouse will be here when you get back.", confirmLabel: "Sign out", danger: false })
      .then(function(ok) { if (ok) doLogout(true); });
    return;
  }
  // Replay the tee-shot swing on the NEXT sign-in. Founder spec: the swing plays
  // every time you sign back in (a moment of arrival), while the onboarding tour
  // stays once unless WALKTHROUGH_MAJOR bumps. pb_intro_seen is sessionStorage
  // that otherwise survives a sign-out→sign-in within the same tab, suppressing
  // the replay — clearing it here on the deliberate sign-out re-arms it. The
  // smoke never calls doLogout, so its per-load intro suppression is untouched.
  try { sessionStorage.removeItem("pb_intro_seen"); } catch (e) {}
  auth.signOut();
}

// Account deletion (App Store 5.1.1(v) / GDPR erasure). Branded confirmation
// via the bottom-sheet atom rather than native confirm(). Two safeguards:
//   1. Re-authentication FIRST (password). This satisfies Firebase's
//      requires-recent-login rule up front, so the destructive chain never
//      starts unless the user proved identity. Eliminates the old half-deleted
//      state (profile gone, auth account stranded) that happened when
//      currentUser.delete() threw requires-recent-login after data was wiped.
//   2. A typed confirmation word that autofill cannot satisfy.
// Firestore rules (firestore.rules: members allow delete: if amIFounder())
// correctly forbid a client from deleting its own member doc, so deletion
// runs server-side via the deleteMyAccount Cloud Function (Admin SDK bypasses
// rules). The client re-authenticates, then calls the function with a fresh
// ID token. The function removes the member doc + photos + auth account, which
// matches the copy below. Deploy is AMD-018 gate 1 (Founder-approved); until
// then the call returns 404 and the catch routes the user to support.
var DELETE_CONFIRM_WORD = "DELETE";
// Resolved at call time (not load time): window._pbEmulator is set during
// firebase init, after this module is parsed. In emulator mode the request
// goes to the local functions emulator so the full flow is verifiable.
function deleteAccountFnUrl() {
  if (typeof window !== "undefined" && window._pbEmulator === true) {
    return "http://127.0.0.1:5001/parbaughs/us-central1/deleteMyAccount";
  }
  return "https://us-central1-parbaughs.cloudfunctions.net/deleteMyAccount";
}

function deleteMyAccount() {
  if (!currentUser || !db) { Router.toast("Not signed in"); return; }

  var content =
    '<div style="padding-top:6px;display:flex;flex-direction:column;gap:16px">' +
      '<p style="font-size:14px;line-height:1.55;color:var(--cb-charcoal);margin:0">' +
        'This removes your profile, photos, and sign-in from Parbaughs. This cannot be undone.' +
      '</p>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<label for="delAcctPw" style="font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--cb-mute)">Confirm your password</label>' +
        '<input id="delAcctPw" type="password" autocomplete="current-password" placeholder="Your password" style="padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui);background:#fff;color:var(--cb-ink)">' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
        '<label for="delAcctWord" style="font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--cb-mute)">Type ' + DELETE_CONFIRM_WORD + ' to confirm</label>' +
        '<input id="delAcctWord" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + DELETE_CONFIRM_WORD + '" style="padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui);letter-spacing:1px;background:#fff;color:var(--cb-ink)">' +
      '</div>' +
      '<div id="delAcctErr" role="alert" style="display:none;font-size:12.5px;color:var(--cb-claret);line-height:1.45"></div>' +
      '<div style="display:flex;gap:8px;margin-top:4px">' +
        '<button id="delAcctCancel" class="tappable" style="flex:1;padding:13px;background:transparent;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;color:var(--cb-ink);cursor:pointer">Cancel</button>' +
        '<button id="delAcctConfirm" class="tappable" disabled style="flex:1;padding:13px;background:var(--cb-claret);border:none;border-radius:8px;font-size:14px;font-weight:700;color:#fff;cursor:not-allowed;opacity:.5">Delete account</button>' +
      '</div>' +
    '</div>';

  var sheetId = openBottomSheet({ size: "half", title: "Delete your account", content: content, dismissible: true });
  if (sheetId == null) { Router.toast("Could not open the deletion dialog"); return; }

  setTimeout(function() {
    var pw = document.getElementById("delAcctPw");
    var word = document.getElementById("delAcctWord");
    var err = document.getElementById("delAcctErr");
    var btnCancel = document.getElementById("delAcctCancel");
    var btnConfirm = document.getElementById("delAcctConfirm");
    if (!pw || !word || !btnConfirm || !btnCancel) return;

    function showErr(m) { if (err) { err.textContent = m; err.style.display = "block"; } }
    function clearErr() { if (err) { err.style.display = "none"; err.textContent = ""; } }
    function isReady() { return pw.value.length > 0 && word.value.trim().toUpperCase() === DELETE_CONFIRM_WORD; }
    function refresh() {
      var ok = isReady();
      btnConfirm.disabled = !ok;
      btnConfirm.style.opacity = ok ? "1" : ".5";
      btnConfirm.style.cursor = ok ? "pointer" : "not-allowed";
    }
    pw.addEventListener("input", function() { clearErr(); refresh(); });
    word.addEventListener("input", function() { clearErr(); refresh(); });
    refresh();
    setTimeout(function() { try { pw.focus(); } catch(e) {} }, 80);

    btnCancel.addEventListener("click", function() { closeBottomSheet(sheetId); });

    btnConfirm.addEventListener("click", function() {
      if (btnConfirm.disabled || !isReady()) return;
      if (!currentUser) { showErr("You are no longer signed in. Close this and sign in again."); return; }
      var email = currentUser.email || "";
      if (!email) { showErr("We could not verify your sign-in. Sign out, sign back in, then try again. Nothing was deleted."); return; }

      btnConfirm.disabled = true;
      btnConfirm.style.cursor = "wait";
      btnConfirm.textContent = "Deleting...";
      pw.disabled = true; word.disabled = true; btnCancel.disabled = true;
      clearErr();

      var cred = firebase.auth.EmailAuthProvider.credential(email, pw.value);

      // Re-authenticate FIRST so deletion only proceeds once identity is proven.
      // If reauth rejects (wrong password), nothing is deleted. Then mint a fresh
      // ID token and hand off to the server: Firestore rules forbid a client from
      // deleting its own member doc (members allow delete: if amIFounder()), so the
      // erasure runs server-side in the deleteMyAccount Cloud Function under the
      // Admin SDK, which removes the member doc, photos, and the auth account.
      currentUser.reauthenticateWithCredential(cred)
        .then(function() {
          return currentUser.getIdToken(true);
        })
        .then(function(idToken) {
          return fetch(deleteAccountFnUrl(), {
            method: "POST",
            headers: { "Authorization": "Bearer " + idToken, "Content-Type": "application/json" },
            body: "{}"
          });
        })
        .then(function(res) {
          if (!res || !res.ok) {
            var statusErr = new Error("delete-failed");
            statusErr._status = res ? res.status : 0;
            throw statusErr;
          }
          return res.json().catch(function() { return {}; });
        })
        .then(function() {
          pbLog("[Account] Account erased server-side");
          closeBottomSheet(sheetId);
          Router.toast("Account deleted");
          currentUser = null;
          currentProfile = null;
          if (auth && auth.signOut) { auth.signOut().catch(function() {}); }
          exitApp();
        })
        .catch(function(e) {
          // Restore the form so the user can retry or cancel.
          pw.disabled = false; word.disabled = false; btnCancel.disabled = false;
          btnConfirm.textContent = "Delete account";
          refresh();
          var code = e && e.code ? e.code : "";
          var status = e && e._status ? e._status : 0;
          if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
            showErr("That password is not correct. Nothing was deleted.");
            try { pw.value = ""; pw.focus(); } catch(err2) {}
          } else if (code === "auth/too-many-requests") {
            showErr("Too many attempts. Wait a moment, then try again. Nothing was deleted.");
          } else if (code === "auth/network-request-failed") {
            showErr("Network problem. Check your connection and try again. Nothing was deleted.");
          } else if (status === 404) {
            showErr("Account deletion is being finalized on our end. Email support@parbaughs.golf and we will remove your account right away. Nothing was deleted yet.");
          } else if (status === 401 || status === 403) {
            showErr("We could not verify your sign-in. Sign out, sign back in, then try again. Nothing was deleted.");
          } else if (status === 429) {
            showErr("Too many attempts. Wait a moment, then try again. Nothing was deleted.");
          } else if (status >= 500) {
            showErr("Something went wrong on our end. Try again in a moment. Nothing was deleted.");
          } else {
            showErr("Could not delete your account. Email support@parbaughs.golf and we will help. Nothing was deleted.");
          }
        });
    });
  }, 50);
}

// ========== APPEARANCE → THEME (retired in v8.3.5, Ship 0d-i) ==========
// The old initAppearance / setAppearance / updateAppearanceButtonStates
// helpers were replaced by the 6-theme system in src/core/theme.js. User
// theme state is reconciled via reconcileThemeFromProfile(currentProfile).
// The legacy light/dark toggle in Settings was swapped for a placeholder
// note; the full picker ships in 0d-ii.

// v8.24.36 — the one-time "Clubhouse welcome" toast was removed. It was the
// v8.3 "we've refreshed the look" migration notice; months later it read as
// nonsense to brand-new members ("Welcome back"?) and its bottom-anchored
// card overlapped the chat composer. pb_clubhouse_welcomed stays listed as
// an allowed localStorage key (existing devices carry it).

// ========== AUTH STATE ==========
if (firebaseAvailable && auth) {
  auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
      db.collection("members").doc(user.uid).get().then(function(doc) {
        currentProfile = doc.exists ? doc.data() : { id:user.uid, name:user.displayName||"Member", role:"member" };
        window._pbShareCount = (currentProfile.shareCount || 0);
        window._sharedRoundIds = {};
        if (currentProfile.sharedRounds && currentProfile.sharedRounds.length) {
          currentProfile.sharedRounds.forEach(function(rid){ window._sharedRoundIds[rid] = true; });
        }
        // Apply theme preference from Firestore profile (migrates legacy .appearance if present)
        if (typeof reconcileThemeFromProfile === "function") reconcileThemeFromProfile(currentProfile);
        // PL7b — once league data lands (async), auto-unlock + notify any earned
        // unlock-tier themes (Champion Sunday after a win, etc.). Self-scheduled
        // retries cover the data-load delay; announce-once via themesNotified.
        if (typeof scheduleThemeUnlockCheck === "function") scheduleThemeUnlockCheck();
        enterApp();
        // Start real-time profile listener — keeps currentProfile in sync across devices/sessions
        if (window._memberProfileUnsub) window._memberProfileUnsub();
        window._memberProfileUnsub = db.collection("members").doc(user.uid).onSnapshot(function(snap) {
          if (!snap.exists) return;
          currentProfile = snap.data();
          window._pbShareCount = (currentProfile.shareCount || 0);
          // Sync theme from Firestore (cross-device)
          if (typeof reconcileThemeFromProfile === "function") reconcileThemeFromProfile(currentProfile);
          updateProfileBar();
          // Re-render current page if it depends on profile data
          var pg = Router.getPage();
          if (pg === "home" || pg === "members" || pg === "settings") {
            Router.go(pg, Router.getParams(), true);
          }
        }, function() {}); // silent catch — offline is fine
        // v8.11.8 — Cross-device live-round listener. Mirrors profile-listener
        // pattern. Attach AFTER currentProfile resolves (no race). Detach in
        // sign-out branch below per design D1.
        if (typeof attachLiveRoundsListener === "function") attachLiveRoundsListener(user.uid);
      }).catch(function() {
        currentProfile = { id:user.uid, name:user.displayName||"Member", role:"member" };
        enterApp();
      });
    } else {
      // v8.11.8 — Sign-out: detach live-rounds listener + clear local liveState
      // per design D1. currentUser is already null here, so clearLiveState's
      // Firestore-write gate skips naturally — _clearLiveStateLocally is the
      // explicit no-write path used inside detachLiveRoundsListener.
      if (typeof detachLiveRoundsListener === "function") detachLiveRoundsListener();
      // v8.24.31 — detach ALL league-scoped listeners (rounds/teetimes/range/
      // profile); leaving them attached caused permission-denied spam after
      // sign-out as the server revoked each one.
      if (typeof stopLeagueDataSync === "function") stopLeagueDataSync();
      exitApp();
    }
  });
} else {
  // Offline mode — skip auth, go straight to app
  pbLog("[App] Offline mode — skipping auth");
  currentProfile = { id:"local", name:"Local User", role:"commissioner" };
  enterApp();
}

// v8.24.21 — league-scoped data sync, separated from enterApp so it can be
// DEFERRED for brand-new members. Mid-onboarding the member isn't in the
// league doc's memberUids yet, so every league-scoped read (trips,
// scrambleTeams, rounds) is rules-denied — the prod error spam at 13:50Z
// 2026-06-10 (page=onboarding) was exactly this. Self-healed before; now it
// simply doesn't fire until onboarding completes (onboarding.js calls
// startLeagueDataSync() after the profile saves).
function startLeagueDataSync() {
  syncScrambleTeamsFromFirestore();
  syncTripsFromFirestore();
  loadActiveLeagueName();
  loadRoundsFromFirestore();
  startRoundsListener(); // real-time listener keeps rounds in sync across devices
  if (typeof startRecordsListener === "function") startRecordsListener(); // v8.24.79 — hydrate records/Ace Wall (was never read back)
}
if (typeof window !== "undefined") window.startLeagueDataSync = startLeagueDataSync;

function enterApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
  // Re-arm the tee-shot swing on EVERY app entry / sign-in (Founder: "the swing
  // plays every single time the user signs back in"). pb_intro_seen is per-tab
  // sessionStorage that otherwise survives a re-open / refresh / sign-in within a
  // session and suppresses the replay — clearing it here makes the swing a true
  // moment-of-arrival each entry (home.js then fires pbTeeIntro.maybeShow). GATED
  // on pb_wt_routed: the smoke/E2E harness presets BOTH pb_intro_seen + pb_wt_routed
  // via addInitScript, so this skips the clear there and its intro suppression
  // stays intact (a real user has neither preset at app entry). The onboarding tour
  // stays once (version-gated) — only the swing re-arms here.
  try {
    // Re-arm on every REAL sign-in. Skip ONLY the test harnesses: the smoke
    // (?smoke=1) presets pb_intro_seen via addInitScript to suppress the overlay,
    // and the ?emulator=1 capture manages its own state. The previous pb_wt_routed
    // gate was fragile (a real user who'd already routed the tour this session kept
    // it set, blocking the re-arm) — the URL check is unambiguous.
    var _qs = (window.location && window.location.search) || "";
    if (_qs.indexOf("smoke=1") === -1 && _qs.indexOf("emulator=1") === -1) sessionStorage.removeItem("pb_intro_seen");
  } catch (e) {}
  PB.load();
  if (typeof _patchFirestoreForLeague === "function") _patchFirestoreForLeague();
  initSync();
  preloadMemberPhotos();
  var _midOnboarding = currentProfile && !currentProfile.onboardingComplete;
  // v8.25.29 — defer courses past onboarding too (#58). A mid-onboarding member
  // isn't a confirmed league member yet, so even this global read was rules-denied
  // ("Course sync failed" spam, page=onboarding); it wasn't loading then anyway.
  if (!_midOnboarding) { syncCoursesFromFirestore(); startLeagueDataSync(); }
  loadCustomDrillsFromFirestore();
  // loadLiveState lives in the deferred page bundle (playnow.js, not CORE), so a
  // fast auth callback (returning member, persisted session, cold cache) can run
  // enterApp before that bundle loads. An unguarded call throws ReferenceError and
  // aborts enterApp BEFORE the Router.go("home") below, blanking the app shell on
  // first load. Guard it; if the bundle isn't present yet, retry briefly so the
  // in-progress-round restore still fires. Remote /liverounds listener is backstop.
  (function _restoreLiveStateWhenReady(tries) {
    if (typeof loadLiveState === "function") { loadLiveState(); return; }
    if (tries >= 50) return; // ~6s ceiling
    setTimeout(function() { _restoreLiveStateWhenReady(tries + 1); }, 120);
  })(0);
  // Check for newly earned achievements after data loads (deferred)
  setTimeout(checkAndAwardNewAchievements, 4000);
  setTimeout(function() { updateProfileBar(); }, 100);
  // First-time users go to onboarding; returning users go home
  if (currentProfile && !currentProfile.onboardingComplete) {
    Router.go("onboarding");
  } else {
    Router.go("home");
    // v8.25.17 — the tee-shot swing intro AND the onboarding walkthrough now both
    // fire from Router.register("home") (src/pages/home.js), anchored to the same
    // home-painted moment for ALL users (new + returning). Firing the intro here
    // too would double-mount #pbIntro and re-introduce the over-paint race the
    // cold-open bridge (walkthrough.js route()) exists to prevent.
  }
}

// Set share card logo src once DOM is ready
// Logo.jpg loaded via direct src attr in template

function updateProfileBar() {
  var avatarEl = document.getElementById("profileBarAvatar");
  var rightEl = document.getElementById("profileBarRight");
  if (!avatarEl || !rightEl) { pbWarn("[ProfileBar] Elements not found"); return; }
  
  var name = "Member";
  var p = null;
  
  if (currentProfile) {
    name = PB.getDisplayName ? PB.getDisplayName(currentProfile) : (currentProfile.name || currentProfile.username || "Member");
    p = currentProfile;
  }
  if (currentUser) {
    var localP = PB.getPlayer(currentUser.uid);
    if (localP) { p = localP; name = p.name || p.username || name; }
  }
  
  if (p) {
    // Ensure photo cache is checked with Firebase UID
    if (currentUser && !photoCache["member:" + p.id] && photoCache["member:" + currentUser.uid]) {
      photoCache["member:" + p.id] = photoCache["member:" + currentUser.uid];
    }
    if (currentUser && !photoCache["member:" + currentUser.uid] && photoCache["member:" + p.id]) {
      photoCache["member:" + currentUser.uid] = photoCache["member:" + p.id];
    }
    // playerRingStyle + playerFrameColor both live in router.js (CORE). In dev it
    // loads as a separate module, so this early call (via preloadMemberPhotos →
    // firebase-photos.js) can run before they're in scope. Fall back to no ring
    // rather than throwing, which would abort updateProfileBar and drop the avatar
    // + level badge below. In production both exist in the CORE bundle.
    var _pbRingS = typeof playerRingStyle === "function"
      ? playerRingStyle(p)
      : (typeof playerFrameColor === "function" ? "border:2px solid " + playerFrameColor(p) : "");
    avatarEl.innerHTML = Router.getAvatar(p);
    avatarEl.style.cssText += ';' + _pbRingS;
  } else {
    var initial = name.charAt(0).toUpperCase();
    avatarEl.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:12px;background:var(--bg3);border-radius:50%">' + initial + '</div>';
  }

  // XP source precedence (see PB.getPlayerXPForDisplay in core/data.js).
  var lvlInfo = currentUser ? PB.calcLevelFromXP(PB.getPlayerXPForDisplay(currentUser.uid)) : null;
  
  // Level badge — circular pill at bottom-right of avatar
  var existingBadge = document.getElementById("profileBarLevelBadge");
  if (existingBadge) existingBadge.remove();
  if (lvlInfo) {
    var badgeEl = document.createElement("div");
    badgeEl.id = "profileBarLevelBadge";
    badgeEl.style.cssText = "position:absolute;bottom:-4px;right:-4px;background:var(--gold);color:var(--bg);font-size:8px;font-weight:800;border-radius:8px;padding:1px 4px;border:2px solid var(--bg);line-height:1.3;min-width:14px;text-align:center;white-space:nowrap;z-index:2";
    badgeEl.textContent = lvlInfo.level;
    avatarEl.appendChild(badgeEl); // inside avatarEl which already has position:relative
  }

  // XP bar values
  var xpInLevel = lvlInfo ? (lvlInfo.xp - lvlInfo.currentLevelXp) : 0;
  var xpNeededForLevel = lvlInfo ? (lvlInfo.nextLevelXp - lvlInfo.currentLevelXp) : 100;
  var xpPct = xpNeededForLevel > 0 ? Math.min(100, Math.round((xpInLevel / xpNeededForLevel) * 100)) : 100;

  // Title and streak
  var streakCount = 0;
  if (currentUser && typeof liveRangeSessions !== "undefined" && liveRangeSessions.length) {
    var uid = currentUser.uid;
    var mySessions = liveRangeSessions.filter(function(s){ return s.playerId === uid; });
    var weekSet = {};
    mySessions.forEach(function(s) {
      if (!s.date) return;
      var d = new Date(s.date + "T12:00:00");
      d.setDate(d.getDate() - d.getDay());
      weekSet[d.toISOString().split("T")[0]] = true;
    });
    var checkDate = new Date(); checkDate.setDate(checkDate.getDate() - checkDate.getDay());
    for (var _si = 0; _si < 52; _si++) {
      var wk = checkDate.toISOString().split("T")[0];
      if (weekSet[wk]) { streakCount++; checkDate.setDate(checkDate.getDate() - 7); } else break;
    }
  }

  rightEl.innerHTML = '<div style="display:flex;align-items:center;gap:4px">'
    + '<span style="font-size:12px;color:var(--muted)">Hi, <span style="color:var(--gold);font-weight:600">' + escHtml(name) + '</span></span>'
    + '</div>';

  if (lvlInfo) {
    var streakRow = streakCount >= 2
      ? '<span style="display:flex;align-items:center;gap:2px;font-size:9px;color:var(--orange);font-weight:700"><svg viewBox="0 0 16 16" width="9" height="9" fill="var(--orange)"><path d="M8 1C6 4 4 5 4 8a4 4 0 008 0c0-2-1-3-2-4-.5 1-1 2-2 1 0-2 0-3 0-4z"/></svg>' + streakCount + ' wk streak</span>'
      : '<div style="width:72px;height:2px;background:var(--border);border-radius:1px"><div style="width:' + xpPct + '%;height:100%;background:var(--gold);border-radius:1px;transition:width .3s"></div></div>';
    rightEl.innerHTML += '<div style="display:flex;align-items:center;gap:6px;margin-top:3px">' + streakRow + '</div>';
  }

  // Mirror the current profile into the Reading Room sidebar footer (v8.3.0)
  if (typeof refreshSidebarUser === "function") refreshSidebarUser();
}

function goToMyProfile() {
  if (currentUser) {
    Router.go("members", { id: currentUser.uid });
  } else {
    Router.go("settings");
  }
}

function exitApp() {
  // Clean up listeners on logout
  if (window._memberProfileUnsub) { window._memberProfileUnsub(); window._memberProfileUnsub = null; }
  if (window._notifUnsub) { window._notifUnsub(); window._notifUnsub = null; }
  if (window._presenceUnsub) { window._presenceUnsub(); window._presenceUnsub = null; }
  if (window._chatFeedUnsub) { window._chatFeedUnsub(); window._chatFeedUnsub = null; }
  if (window._rangeUnsub) { window._rangeUnsub(); window._rangeUnsub = null; }
  // v8.17.0 / Ship 5+1 V16 — reset notification read-history + click-handoff state
  if (typeof liveNotifications !== "undefined") liveNotifications = [];
  if (typeof readHistory !== "undefined") readHistory = [];
  if (typeof readHistoryCursor !== "undefined") readHistoryCursor = null;
  window._notifById = {};
  if (typeof _readHistoryObserver !== "undefined" && _readHistoryObserver) {
    _readHistoryObserver.disconnect();
    _readHistoryObserver = null;
  }
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("mainApp").classList.add("hidden");
  // Check for invite code in URL params — auto-fill and show register form
  var urlParams = new URLSearchParams(window.location.search);
  var inviteParam = urlParams.get("invite");
  if (inviteParam) {
    showRegister();
    setTimeout(function() {
      var inviteField = document.getElementById("regInvite");
      if (inviteField) {
        inviteField.value = inviteParam.toUpperCase();
        // Fire input event so claim section checks run
        inviteField.dispatchEvent(new Event("input"));
      }
      // Show confirmation banner
      var regForm = document.getElementById("registerForm");
      if (regForm && !document.getElementById("inviteBanner")) {
        var banner = document.createElement("div");
        banner.id = "inviteBanner";
        banner.style.cssText = "background:rgba(var(--birdie-rgb),.1);border:1px solid rgba(var(--birdie-rgb),.25);border-radius:8px;padding:12px;margin-bottom:12px;text-align:center";
        banner.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--birdie)">You\'ve been invited!</div>' +
          '<div style="font-size:11px;color:var(--muted);margin-top:4px">Code <span style="color:var(--gold);font-weight:700;letter-spacing:1px">' + inviteParam.toUpperCase() + '</span> has been applied.</div>' +
          '<div style="font-size:10px;color:var(--muted);margin-top:4px">Choose a username and password to join.</div>';
        regForm.insertBefore(banner, regForm.firstChild);
      }
    }, 100);
    // Clean URL without reload
    if (window.history.replaceState) window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  } else {
    showLogin();
  }
}

// Extracted to src/core/firebase-photos.js per W1.A5. Originally lines 755-949 of this file.
