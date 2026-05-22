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
    if (window.location.search.indexOf("emulator=1") !== -1) {
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
    if (e.code === "auth/user-not-found") msg = "No account with that email";
    else if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") msg = "Invalid email or password";
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
            email: email,
            username: username.toLowerCase(),
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
            id:user.uid, email:email, username:username.toLowerCase(), name:username,
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
            welcomeName + " is in. Someone get them a sleeve of balls — they'll need it.",
            welcomeName + " just entered the Parbaughs universe. Their handicap says one thing, their confidence says another.",
            welcomeName + " has joined. May their drives be long and their putts be short. We're not optimistic.",
            welcomeName + " is officially a member. The dress code is vibes only and the only rule is don't be slower than Nick."
          ];
          var ribb = welcomeRibbs[Math.floor(Math.random() * welcomeRibbs.length)];
          db.collection("chat").add(leagueDoc("chat", {
            id: genId(),
            text: ribb,
            authorId: "system",
            authorName: "The Caddy",
            createdAt: fsTimestamp(),
            type: "welcome"
          }))(function(){});
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
    else if (e.code === "auth/network-request-failed") msg = "Network error — check your connection";
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
    el.textContent = "Reset link sent to " + email + " — check your inbox and spam folder.";
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

function doLogout() {
  if (!confirm("Sign out of Parbaughs?")) return;
  auth.signOut();
}

function deleteMyAccount() {
  if (!currentUser || !db) { Router.toast("Not signed in"); return; }
  if (!confirm("DELETE YOUR ACCOUNT?\n\nThis will permanently remove:\n• Your member profile\n• Your photos\n• Your Firebase auth account\n\nThis CANNOT be undone.")) return;
  if (!confirm("Are you absolutely sure? Type YES to confirm.")) return;
  
  var uid = currentUser.uid;
  
  // Delete Firestore member doc
  db.collection("members").doc(uid).delete()
    .then(function() {
      pbLog("[Account] Member doc deleted");
      // Delete photos uploaded by this user
      return db.collection("photos").where("uploadedBy","==",uid).get();
    })
    .then(function(snap) {
      var batch = db.batch();
      snap.forEach(function(doc) { batch.delete(doc.ref); });
      return batch.commit();
    })
    .then(function() {
      pbLog("[Account] Photos deleted");
      // Delete the Firebase Auth account
      return currentUser.delete();
    })
    .then(function() {
      Router.toast("Account deleted");
      currentUser = null;
      currentProfile = null;
      exitApp();
    })
    .catch(function(e) {
      if (e.code === "auth/requires-recent-login") {
        Router.toast("Please sign out, sign back in, then try again (security requirement)");
      } else {
        Router.toast("Error: " + e.message);
      }
    });
}

// ========== APPEARANCE → THEME (retired in v8.3.5, Ship 0d-i) ==========
// The old initAppearance / setAppearance / updateAppearanceButtonStates
// helpers were replaced by the 6-theme system in src/core/theme.js. User
// theme state is reconciled via reconcileThemeFromProfile(currentProfile).
// The legacy light/dark toggle in Settings was swapped for a placeholder
// note; the full picker ships in 0d-ii.

function showClubhouseWelcomeToast() {
  try {
    if (localStorage.getItem('pb_clubhouse_welcomed')) return;
  } catch(e) { return; }
  setTimeout(function() {
    var t = document.createElement('div');
    t.className = 'toast show';
    t.style.cssText = 'max-width:320px;padding:14px 20px;line-height:1.4;font-size:12px';
    t.innerHTML = '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-inverse);margin-bottom:4px">The Clubhouse is open.</div><div style="font-family:var(--font-ui);font-size:11px;color:var(--text-inverse);opacity:0.85">We have refreshed the look. Your data is safe.</div>';
    document.body.appendChild(t);
    setTimeout(function() {
      t.classList.remove('show');
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 5000);
    try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch(e) {}
  }, 1500);
}

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
        showClubhouseWelcomeToast();
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
      exitApp();
    }
  });
} else {
  // Offline mode — skip auth, go straight to app
  pbLog("[App] Offline mode — skipping auth");
  currentProfile = { id:"local", name:"Local User", role:"commissioner" };
  enterApp();
}

function enterApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
  PB.load();
  if (typeof _patchFirestoreForLeague === "function") _patchFirestoreForLeague();
  initSync();
  preloadMemberPhotos();
  syncCoursesFromFirestore();
  syncScrambleTeamsFromFirestore();
  syncTripsFromFirestore();
  loadActiveLeagueName();
  loadRoundsFromFirestore();
  startRoundsListener(); // real-time listener keeps rounds in sync across devices
  loadCustomDrillsFromFirestore();
  loadLiveState(); // restore any in-progress round that survived a crash or page reload
  // Check for newly earned achievements after data loads (deferred)
  setTimeout(checkAndAwardNewAchievements, 4000);
  setTimeout(function() { updateProfileBar(); }, 100);
  // First-time users go to onboarding; returning users go home
  if (currentProfile && !currentProfile.onboardingComplete) {
    Router.go("onboarding");
  } else {
    Router.go("home");
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
    var _pbRingS = typeof playerRingStyle === "function" ? playerRingStyle(p) : "border:2px solid " + playerFrameColor(p);
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
